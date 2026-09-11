import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { DataTable, StatCards, Table, type DataColumn } from "./data";

type Row = { id: string; name: string; count: number; disabled?: boolean };
const rows: Row[] = [{ id: "alpha", name: "Alpha", count: 8 }, { id: "beta", name: "Beta", count: 3 }, { id: "locked", name: "Locked", count: 5, disabled: true }];
const columns: DataColumn<Row>[] = [{ id: "name", label: "Name", render: row => row.name, sortable: true }, { id: "count", label: "Count", render: row => row.count, sortable: true, align: "end" }];
const props = { caption: "Work records", rows, columns, rowId: (row: Row) => row.id, rowLabel: (row: Row) => row.name, isRowDisabled: (row: Row) => !!row.disabled };

describe("boundaryless data presentation", () => {
  test("table keeps native captions and a labelled scroll region at both densities", () => {
    const view = render(<Table caption="Evidence" size="sm"><thead><tr><th scope="col">Title</th></tr></thead><tbody><tr><td>Source notes</td></tr></tbody></Table>);
    expect(screen.getByRole("region", { name: "Evidence table" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("table", { name: "Evidence" })).toHaveAttribute("data-size", "sm");
    view.rerender(<Table caption="Evidence"><tbody><tr><td>Updated</td></tr></tbody></Table>);
    expect(screen.getByRole("table")).toHaveAttribute("data-size", "md");
  });

  test("sorting and pagination request changes without changing host rows or state", () => {
    const onSortChange = vi.fn(), onPageChange = vi.fn();
    const view = render(<DataTable {...props} sort={null} onSortChange={onSortChange} pagination={{ page: 1, pageCount: 2, onPageChange }} />);
    fireEvent.click(screen.getByRole("button", { name: "Sort by Count" }));
    expect(onSortChange).toHaveBeenCalledExactlyOnceWith({ column: "count", direction: "ascending" });
    expect(screen.getAllByRole("row")[1]).toHaveTextContent("Alpha");
    expect(screen.getByRole("columnheader", { name: /Count/ })).toHaveAttribute("aria-sort", "none");
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(onPageChange).toHaveBeenCalledExactlyOnceWith(2);
    expect(screen.getByRole("button", { name: "Page 1" })).toHaveAttribute("aria-current", "page");
    view.rerender(<DataTable {...props} sort={{ column: "count", direction: "descending" }} onSortChange={onSortChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Sort by Count" }));
    expect(onSortChange).toHaveBeenLastCalledWith(null);
    expect(rows[0].name).toBe("Alpha");
  });

  test("selection emits only eligible visible IDs, never hidden rows or full objects", () => {
    const onSelectionChange = vi.fn();
    const selected = ["alpha", "another-page"];
    const view = render(<DataTable {...props} selectedIds={selected} onSelectionChange={onSelectionChange} />);
    const selectAll = screen.getByRole("checkbox", { name: "Select visible rows" });
    expect(selectAll).toBePartiallyChecked();
    fireEvent.click(selectAll);
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(["alpha", "beta"], true);
    expect(selectAll).toBePartiallyChecked();
    expect(screen.getByRole("checkbox", { name: "Select Locked" })).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Beta" }));
    expect(onSelectionChange).toHaveBeenLastCalledWith(["beta"], true);
    expect(selected).toEqual(["alpha", "another-page"]);
    view.rerender(<DataTable {...props} rows={[rows[1], rows[0]]} selectedIds={selected} onSelectionChange={onSelectionChange} />);
    expect(screen.getByRole("checkbox", { name: "Select Alpha" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Select Beta" })).not.toBeChecked();
  });

  test("malformed row or column identities show an error instead of ambiguous actions", () => {
    const onSelectionChange = vi.fn(), onSortChange = vi.fn();
    const view = render(<DataTable {...props} rows={[rows[0], rows[0]]} onSelectionChange={onSelectionChange} onSortChange={onSortChange} />);
    expect(screen.getByRole("alert")).toHaveTextContent("unique, non-empty row and column IDs");
    expect(screen.queryByText("Alpha")).toBeNull();
    expect(screen.getByRole("button", { name: "Sort by Name" })).toBeDisabled();
    view.rerender(<DataTable {...props} rows={[{ ...rows[0], id: " " }]} onSelectionChange={onSelectionChange} />);
    expect(screen.getByRole("alert")).toBeVisible();
    view.rerender(<DataTable {...props} columns={[columns[0], columns[0]]} onSelectionChange={onSelectionChange} />);
    expect(screen.getByRole("alert")).toBeVisible();
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(onSortChange).not.toHaveBeenCalled();
    view.rerender(<DataTable {...props} />);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText("Alpha")).toBeVisible();
  });

  test("loading, error, empty, disabled and readonly states cannot request actions", () => {
    const onSelectionChange = vi.fn(), onSortChange = vi.fn();
    const view = render(<DataTable {...props} loading onSelectionChange={onSelectionChange} onSortChange={onSortChange} />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading rows");
    expect(screen.queryByText("Alpha")).toBeNull();
    view.rerender(<DataTable {...props} error="Data unavailable" onSelectionChange={onSelectionChange} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Data unavailable");
    view.rerender(<DataTable {...props} rows={[]} />);
    expect(screen.getByRole("status")).toHaveTextContent("No rows to display");
    view.rerender(<DataTable {...props} disabled onSelectionChange={onSelectionChange} onSortChange={onSortChange} />);
    for (const control of [...screen.getAllByRole("button"), ...screen.getAllByRole("checkbox")]) expect(control).toBeDisabled();
    view.rerender(<DataTable {...props} selectedIds={["alpha"]} />);
    for (const control of screen.getAllByRole("checkbox")) expect(control).toBeDisabled();
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(onSortChange).not.toHaveBeenCalled();
  });

  test("instances and replaced host data do not retain or parse previous content", () => {
    const hostile = '<img src="https://invalid.example/tracker" onerror="alert(1)">';
    const view = render(<><DataTable {...props} caption="First" selectedIds={["alpha"]} /><DataTable {...props} caption="Second" selectedIds={[]} /></>);
    expect(within(screen.getByRole("table", { name: "First" })).getByRole("checkbox", { name: "Select Alpha" })).toBeChecked();
    expect(within(screen.getByRole("table", { name: "Second" })).getByRole("checkbox", { name: "Select Alpha" })).not.toBeChecked();
    view.rerender(<DataTable {...props} rows={[{ id: "new", name: hostile, count: 0 }]} selectedIds={[]} />);
    expect(screen.queryByText("Alpha")).toBeNull();
    expect(screen.getByText(hostile)).toBeVisible();
    expect(view.container.querySelector("img,script,iframe")).toBeNull();
  });

  test("metrics preserve supplied values, trends, descriptions and decorative tones", () => {
    const tones = ["blue", "orange", "purple", "pink", "sky", "emerald"] as const;
    const view = render(<StatCards label="Research metrics" variant="footer" items={tones.map(tone => ({ id: tone, label: tone, value: "0", delta: "No change", trend: "neutral", caption: "Provided by host", hint: "Synthetic sample only", tone }))} />);
    expect(view.container.querySelectorAll("dl dt")).toHaveLength(6);
    expect(view.container.querySelectorAll("dl dd")).toHaveLength(6);
    expect(screen.getAllByText("0")).toHaveLength(6);
    expect(screen.getByRole("button", { name: "About blue" })).toHaveAttribute("type", "button");
    expect(view.container.querySelectorAll('[data-tone]')).toHaveLength(6);
  });
});
