import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import * as chat from "./index";

// WEV-3303: the card owns the existing contract's page-watch subject and `page_watch_control` action directly.
// The host's disable callback gets the exact page-watch ID; nothing is adapted into a routine.

afterEach(cleanup);

const PW = "0192a3b4-5c6d-7e8f-9a0b-000000000a31";
const ROUTINE = "0192a3b4-5c6d-7e8f-9a0b-000000000961";
const turnOff: chat.HarsoOutputActionSpec = { kind: "page_watch_control", label: "Turn off", page_watch_id: PW, control: "disable" };
const watching: chat.HarsoOutputStatusBlock = { kind: "status", state: "watching", detail: "Checking daily", subject: { page_watch_id: PW } };
const rows: chat.HarsoOutputRowsBlock = { kind: "rows", items: [{ label: "Standing desk", secondary: "S$420 at Shop A", trailing: "S$420" }] };
const doc = (...blocks: chat.HarsoOutputBlock[]): chat.HarsoOutputDocument =>
  ({ kind: "output_blocks", major: 1, header: { title: "Price watch" }, blocks, fallback_text: "FALLBACK" });
const draw = (document: chat.HarsoOutputDocument, props: Partial<chat.HarsoOutputCardProps> = {}) => {
  render(<div className="harso-kit"><chat.HarsoOutputCard document={document} onViewAll={() => {}} {...props} /></div>);
  return screen.getByRole("region", { name: document.header.title });
};

test("the disable action calls the host once with the exact page-watch ID and no other control", () => {
  const onPageWatchControl = vi.fn(), onRoutineControl = vi.fn(), onWorkControl = vi.fn();
  const card = draw(doc(rows, { kind: "action", primary: turnOff }), { onPageWatchControl, onRoutineControl, onWorkControl });
  fireEvent.click(within(card).getByRole("button", { name: "Turn off" }));
  expect(onPageWatchControl).toHaveBeenCalledExactlyOnceWith("disable", PW);
  expect(onRoutineControl).not.toHaveBeenCalled();
  expect(onWorkControl).not.toHaveBeenCalled();
});

test("without the host callback the action is not drawn (never a dead button)", () => {
  const card = draw(doc(rows, { kind: "action", primary: turnOff }), { onRoutineControl: vi.fn() });
  expect(within(card).queryByRole("button", { name: "Turn off" })).toBeNull();
  expect(card.textContent).not.toContain("Turn off");
});

test.each([
  ["a control other than disable", { ...turnOff, control: "pause" }],
  ["a missing ID", { ...turnOff, page_watch_id: "" }],
  ["a missing label", { ...turnOff, label: " " }],
])("%s is not drawn", (_name, action) => {
  const onPageWatchControl = vi.fn();
  const card = draw(doc(rows, { kind: "action", primary: action }), { onPageWatchControl });
  expect(within(card).queryAllByRole("button")).toHaveLength(0);
  expect(onPageWatchControl).not.toHaveBeenCalled();
});

test("a page-watch subject is handed to the host's subjectState as it is, and its live word replaces the emitted one", () => {
  const subjectState = vi.fn((): chat.HarsoOutputSubjectState => ({ word: "Turned off", meaning: "done" }));
  const card = draw(doc(watching, rows), { subjectState });
  expect(subjectState).toHaveBeenCalledWith({ page_watch_id: PW });
  expect(within(card).getByText("Turned off")).toBeTruthy();
  expect(within(card).queryByText("Watching")).toBeNull();
});

test("without a live word the emitted status stands", () => {
  const card = draw(doc(watching, rows), { subjectState: () => undefined });
  expect(within(card).getByText("Watching")).toBeTruthy();
  expect(within(card).getByText(/Checking daily/)).toBeTruthy();
});

test("the legacy routine control still calls only onRoutineControl", () => {
  const onPageWatchControl = vi.fn(), onRoutineControl = vi.fn();
  const card = draw(doc(rows, { kind: "action", primary: { kind: "routine_control", label: "Pause", routine_id: ROUTINE, control: "pause" } }), { onPageWatchControl, onRoutineControl });
  fireEvent.click(within(card).getByRole("button", { name: "Pause" }));
  expect(onRoutineControl).toHaveBeenCalledExactlyOnceWith("pause", ROUTINE);
  expect(onPageWatchControl).not.toHaveBeenCalled();
});
