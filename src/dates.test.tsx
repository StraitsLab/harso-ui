import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { Calendar, DatePicker, MeetingScheduler, MonthPanel } from "./dates";

describe("boundaryless date selection", () => {
  test("host replacement and reset supersede an uncommitted picker draft", () => {
    const changed = vi.fn();
    const { rerender } = render(<DatePicker label="Review date" value="2026-09-08" today="2026-09-08" onValueChange={changed} />);
    fireEvent.change(screen.getByLabelText("Date"), { target: { value: "2026-09-10" } });
    expect(screen.getByLabelText("Date")).toHaveValue("2026-09-10");
    rerender(<DatePicker label="Review date" value="2026-10-12" today="2026-09-08" onValueChange={changed} />);
    expect(screen.getByLabelText("Date")).toHaveValue("2026-10-12");
    expect(screen.getByRole("grid", { hidden: true })).toHaveAccessibleName("October 2026");
    rerender(<DatePicker label="Review date" value={null} today="2026-09-08" onValueChange={changed} />);
    expect(screen.getByLabelText("Date")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Apply", hidden: true })).toBeDisabled();
    expect(changed).not.toHaveBeenCalled();
  });

  test("leap-day keyboard navigation crosses months without changing selection until activated", () => {
    const select = vi.fn();
    render(<MonthPanel defaultMonth="2024-02" value="2024-02-29" onValueChange={select} today="2024-02-01" />);
    const leap = screen.getByRole("button", { name: /Thursday, February 29, 2024/ });
    leap.focus();
    fireEvent.keyDown(leap, { key: "ArrowRight" });
    expect(screen.getByRole("button", { name: /Friday, March 1, 2024/ })).toHaveFocus();
    expect(select).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Friday, March 1, 2024/ }));
    expect(select).toHaveBeenCalledWith("2024-03-01");
  });

  test("unavailable and bounded dates cannot be selected, including by direct click", () => {
    const select = vi.fn();
    render(<MonthPanel defaultMonth="2026-09" onValueChange={select} minDate="2026-09-04" maxDate="2026-09-12" isDateUnavailable={date => date === "2026-09-07"} today="2026-09-06" />);
    for (const day of [3, 7, 13]) fireEvent.click(screen.getByRole("button", { name: new RegExp(`September ${day}, 2026`) }));
    expect(select).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /September 8, 2026/ }));
    expect(select).toHaveBeenCalledWith("2026-09-08");
    expect(screen.getByRole("button", { name: "Previous month" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
  });

  test("Gregorian early years are not shifted to1900 and invalid bounds are rejected", () => {
    const view = render(<MonthPanel defaultMonth="0099-12" today="0099-12-01" />);
    expect(screen.getByRole("button", { name: /December 31, 99/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByRole("button", { name: /January 1, 100/ })).toBeInTheDocument();
    view.unmount();
    expect(() => render(<MonthPanel minDate="2025-02-29" />)).toThrow(/valid date/);
  });

  test("supported calendar edges cannot roll into year zero or10000", () => {
    const view = render(<MonthPanel defaultMonth="0001-01" today="0001-01-01" />);
    expect(screen.getByRole("button", { name: "Previous month" })).toBeDisabled();
    view.unmount();
    render(<MonthPanel defaultMonth="9999-12" today="9999-12-31" />);
    expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
    const last = screen.getByRole("button", { name: /December 31, 9999/ });
    last.focus();
    fireEvent.keyDown(last, { key: "ArrowRight" });
    expect(last).toHaveFocus();
  });

  test("controlled month refusal and selection never replace host state", () => {
    const month = vi.fn();
    const select = vi.fn();
    render(<MonthPanel month="2026-09" onMonthChange={month} value="2026-09-06" onValueChange={select} today="2026-09-06" />);
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(month).toHaveBeenCalledWith("2026-10");
    expect(screen.getByRole("grid")).toHaveAccessibleName("September 2026");
    fireEvent.click(screen.getByRole("button", { name: /September 7, 2026/ }));
    expect(select).toHaveBeenCalledWith("2026-09-07");
    expect(screen.getByRole("button", { name: /September 6, 2026/ })).toHaveAttribute("aria-pressed", "true");
  });

  test("meeting selection is instance-scoped and supplied updates can revoke confirmation", () => {
    const confirm = vi.fn();
    const slot = { id: "morning", startsAt: "2026-09-06T09:00:00+08:00", durationMinutes: 30 };
    const view = render(<><MeetingScheduler label="First" slots={[slot]} timeZones={["UTC"]} today="2026-09-06" onConfirm={confirm} /><MeetingScheduler label="Second" slots={[slot]} timeZones={["UTC"]} today="2026-09-06" /></>);
    const first = within(screen.getByRole("region", { name: "First" }));
    const second = within(screen.getByRole("region", { name: "Second" }));
    fireEvent.click(first.getByRole("radio"));
    fireEvent.click(second.getByRole("radio"));
    expect(first.getByRole("radio")).toBeChecked();
    expect(second.getByRole("radio")).toBeChecked();
    fireEvent.click(first.getByRole("button", { name: "Confirm time" }));
    expect(confirm).toHaveBeenCalledWith(slot);
    view.rerender(<MeetingScheduler label="First" slots={[{ ...slot, disabled: true }]} timeZones={["UTC"]} today="2026-09-06" value="morning" onConfirm={confirm} />);
    expect(screen.getByRole("button", { name: "Confirm time" })).toBeDisabled();
  });

  test("invalid dates and silently normalized meeting instants are rejected", () => {
    expect(() => render(<Calendar label="Invalid" events={[{ id: "bad", title: "Bad date", date: "2026-09-31" }]} />)).toThrow(/valid date/);
    for (const startsAt of ["2026-09-06T09:00:00", "2025-02-29T09:00:00Z", "2026-09-06T24:00:00Z"]) expect(() => render(<MeetingScheduler label="Invalid" slots={[{ id: "bad", startsAt, durationMinutes: 30 }]} timeZones={["UTC"]} />)).toThrow(/offset-qualified/);
  });

  test("disabled picker can render without a native popover implementation", () => {
    render(<DatePicker label="Unavailable review" disabled today="2026-09-06" />);
    expect(screen.getByRole("button", { name: /Choose dates/ })).toBeDisabled();
  });

  test("delayed controlled month acceptance restores only a still-owned keyboard focus", () => {
    const renderMonth = (month: string) => <><button>Other work</button><MonthPanel month={month} value="2028-01-31" today="2028-01-31" /></>;
    const view = render(renderMonth("2028-01"));
    const january = screen.getByRole("button", { name: /January 31, 2028/ });
    january.focus();
    fireEvent.keyDown(january, { key: "PageDown" });
    expect(january).toHaveFocus();
    view.rerender(renderMonth("2028-02"));
    expect(screen.getByRole("button", { name: /February 29, 2028/ })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole("button", { name: /February 29, 2028/ }), { key: "PageDown", shiftKey: true });
    screen.getByRole("button", { name: "Other work" }).focus();
    view.rerender(renderMonth("2029-02"));
    expect(screen.getByRole("button", { name: "Other work" })).toHaveFocus();
  });
});
