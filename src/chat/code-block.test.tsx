import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { HarsoCodeBlock } from "./code-block";

afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

test("copies the original code and resets its accessible feedback", async () => {
  vi.useFakeTimers();
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal("navigator", { clipboard: { writeText } });
  render(<HarsoCodeBlock code={"const ready = true;\n"} language="ts" filename="ready.ts" lineNumbers />);
  expect(screen.getByText("ts")).toBeVisible();
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

test("renders optional highlighting and a separate, hidden line-number gutter", () => {
  const highlight = vi.fn(code => <span data-testid="highlighted">{code}</span>);
  const { container, rerender } = render(<HarsoCodeBlock code={'first\nsecond\n'} highlight={highlight} lineNumbers />);
  expect(highlight).toHaveBeenCalledWith("first\nsecond\n", undefined);
  expect(screen.getByTestId("highlighted")).toHaveTextContent("first second");
  expect(container.querySelector(".hkc-code-block-numbers")).toHaveAttribute("aria-hidden", "true");
  expect(container.querySelectorAll(".hkc-code-block-numbers span")).toHaveLength(2);
  rerender(<HarsoCodeBlock code="plain" />);
  expect(container.querySelector(".hkc-code-block-numbers")).not.toBeInTheDocument();
});
