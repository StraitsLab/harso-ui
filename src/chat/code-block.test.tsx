import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { HarsoCodeBlock } from "./code-block";

afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

test("copies the original code and resets its accessible feedback", async () => {
  vi.useFakeTimers();
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal("navigator", { clipboard: { writeText } });
  render(<HarsoCodeBlock code={"const ready = true;\n"} language="ts" filename="ready.ts" lineNumbers />);
  expect(screen.getByText("ready.ts")).toBeVisible();
  expect(screen.getByRole("region", { name: "Code: ready.ts" })).toHaveAttribute("tabindex", "0");
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Copy code" })); });
  expect(writeText).toHaveBeenCalledWith("const ready = true;\n");
  expect(screen.getByRole("button", { name: "Copied" })).toBeVisible();
  expect(screen.getByRole("status")).toHaveTextContent("Copied");
  act(() => { vi.advanceTimersByTime(2000); });
  expect(screen.getByRole("button", { name: "Copy code" })).toBeVisible();
});

test("reports clipboard failure without claiming success", async () => {
  vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("Denied")) } });
  render(<HarsoCodeBlock code="hello" />);
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Copy code" })); });
  expect(screen.getByRole("status")).toHaveTextContent("Could not copy code");
  expect(screen.getByRole("button", { name: "Copy code" })).toBeVisible();
});

test("shows a language chip only when a filename and language are both present", () => {
  const { container, rerender } = render(<HarsoCodeBlock code="x" filename="work-unit.ts" language="typescript" />);
  expect(screen.getByText("work-unit.ts")).toBeVisible();
  expect(screen.getByText("typescript")).toBeVisible();
  expect(container.querySelectorAll(".hkc-code-block-chip")).toHaveLength(1);
  rerender(<HarsoCodeBlock code="x" language="typescript" />);
  // With no filename the language becomes the label; there is no separate chip.
  expect(screen.getByText("typescript")).toBeVisible();
  expect(container.querySelectorAll(".hkc-code-block-chip")).toHaveLength(0);
});

test("renders per-line rows with a hidden number gutter and emphasises highlighted lines", () => {
  const { container } = render(<HarsoCodeBlock code={"first\nsecond\nthird\n"} lineNumbers highlightLines={[2]} />);
  const rows = container.querySelectorAll(".hkc-code-block-row");
  expect(rows).toHaveLength(3);
  expect(container.querySelectorAll(".hkc-code-block-num")).toHaveLength(3);
  expect(container.querySelector(".hkc-code-block-num")).toHaveAttribute("aria-hidden", "true");
  expect(rows[1].className).toContain("hkc-code-block-row--on");
  expect(rows[0].className).not.toContain("hkc-code-block-row--on");
});

test("marks diff rows with a tint class and an accessible added/removed label", () => {
  const { container } = render(<HarsoCodeBlock code={"- const result = \"Pending\";\n+ const result = \"Done\";\n const other = 1;"} diff />);
  const rows = container.querySelectorAll(".hkc-code-block-row");
  expect(rows[0].getAttribute("data-diff")).toBe("remove");
  expect(rows[1].getAttribute("data-diff")).toBe("add");
  expect(rows[2].hasAttribute("data-diff")).toBe(false);
  expect(screen.getByText("Removed:")).toBeInTheDocument();
  expect(screen.getByText("Added:")).toBeInTheDocument();
});

test("keeps the whole-block highlighter path (Shiki) rendering unrowed", () => {
  const highlight = vi.fn(code => <span data-testid="highlighted">{code}</span>);
  const { container } = render(<HarsoCodeBlock code={"first\nsecond\n"} highlight={highlight} lineNumbers />);
  expect(highlight).toHaveBeenCalledWith("first\nsecond\n", undefined);
  expect(screen.getByTestId("highlighted")).toHaveTextContent("first second");
  // The highlighter path uses the legacy numbers column, not per-line rows.
  expect(container.querySelector(".hkc-code-block-rows")).not.toBeInTheDocument();
  expect(container.querySelectorAll(".hkc-code-block-numbers span")).toHaveLength(2);
});
