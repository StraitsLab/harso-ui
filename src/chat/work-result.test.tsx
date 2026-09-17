import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { HarsoWorkResult } from "./work-result";

afterEach(() => cleanup());

const STEPS = [
  { id: "a", label: "Shaping the recommendation", state: "done" as const },
  { id: "b", label: "Checking the evidence", state: "done" as const },
  { id: "c", label: "Six sources reviewed", state: "running" as const, chip: "12s" },
];

test("derives the status chip from step progress and labels the card by status", () => {
  render(<HarsoWorkResult title="Shape the launch brief" status="running" steps={STEPS} />);
  expect(screen.getByRole("region", { name: "Work in progress" })).toBeVisible();
  expect(screen.getByText("2 of 3")).toBeVisible();
  expect(screen.getByText("Shaping the recommendation")).toBeVisible();
  expect(screen.getByText("12s")).toBeVisible();
});

test("collapses and expands from the header toggle", () => {
  render(<HarsoWorkResult title="Shape the launch brief" status="succeeded" steps={STEPS} summary="The final step is complete." />);
  expect(screen.getByText("The final step is complete.")).toBeVisible();
  const toggle = screen.getByRole("button", { name: /Shape the launch brief/ });
  expect(toggle).toHaveAttribute("aria-expanded", "true");
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByText("The final step is complete.")).not.toBeInTheDocument();
});

test("renders produced files as rows inside the card and expands one to its detail renderer", () => {
  render(<HarsoWorkResult title="Shape the launch brief" status="succeeded"
    artifacts={[{ id: "one", name: "launch-brief.md", chip: "4 KB", detail: <p>RICH ARTIFACT</p> }]} />);
  const list = screen.getByRole("list", { name: "Produced files" });
  expect(within(list).getByText("launch-brief.md")).toBeVisible();
  expect(screen.queryByText("RICH ARTIFACT")).not.toBeInTheDocument();
  const row = screen.getByRole("button", { name: /launch-brief\.md/ });
  expect(row).toHaveAttribute("aria-expanded", "false");
  fireEvent.click(row);
  expect(row).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByText("RICH ARTIFACT")).toBeVisible();
});

test("an unavailable artifact is a static row, never an expandable control", () => {
  render(<HarsoWorkResult title="Task" status="failed" artifacts={[{ id: "gone", name: "missing.pdf", unavailable: true, detail: <p>never</p> }]} />);
  expect(screen.getByText("missing.pdf")).toBeVisible();
  expect(screen.getByText("Unavailable")).toBeVisible();
  expect(screen.queryByRole("button", { name: /missing\.pdf/ })).toBeNull();
  expect(screen.queryByText("never")).not.toBeInTheDocument();
});

test("a failed result carries the failure sentence and a status region name", () => {
  render(<HarsoWorkResult title="Shape the launch brief" status="failed" summary="The attempt could not finish." />);
  expect(screen.getByRole("region", { name: "Work unit failed" })).toBeVisible();
  expect(screen.getByText("The attempt could not finish.")).toBeVisible();
});

test("renders a host-supplied primary action only when given", () => {
  const { rerender } = render(<HarsoWorkResult title="T" status="succeeded" />);
  expect(screen.queryByRole("button", { name: "Open brief" })).toBeNull();
  rerender(<HarsoWorkResult title="T" status="succeeded" action={<button type="button">Open brief</button>} />);
  expect(screen.getByRole("button", { name: "Open brief" })).toBeVisible();
});
