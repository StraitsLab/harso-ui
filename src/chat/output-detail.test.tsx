import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import * as chat from "./index";

afterEach(cleanup);

const base: chat.HarsoOutputDetailProps = {
  contentKey: "image-a", title: "Blue and yellow", kind: "image", previewState: "ready",
  content: <img src="fixture.png" alt="Yellow rectangle on blue" />, actions: {}, onClose: () => {},
};
const action = (overrides: Partial<chat.HarsoOutputAction> = {}): chat.HarsoOutputAction => ({ enabled: true, pending: false, onInvoke: vi.fn(), ...overrides });

test("each supported action invokes only its own callback and Close invokes only onClose", () => {
  const download = action(), expand = action(), openExternally = action(), onClose = vi.fn();
  render(<chat.HarsoOutputDetail {...base} actions={{ download, expand, openExternally }} onClose={onClose} />);
  fireEvent.click(screen.getByRole("button", { name: "Expand" }));
  expect(expand.onInvoke).toHaveBeenCalledTimes(1);
  expect(download.onInvoke).not.toHaveBeenCalled();
  expect(openExternally.onInvoke).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Download" }));
  fireEvent.click(screen.getByRole("button", { name: "Open externally" }));
  fireEvent.click(screen.getByRole("button", { name: "Close output" }));
  expect(download.onInvoke).toHaveBeenCalledTimes(1);
  expect(openExternally.onInvoke).toHaveBeenCalledTimes(1);
  expect(onClose).toHaveBeenCalledTimes(1);
});

test.each(["download", "expand", "openExternally"] as const)("%s omitted is absent; disabled/pending actions are native-disabled and described", key => {
  const label = { download: "Download", expand: "Expand", openExternally: "Open externally" }[key];
  const { rerender } = render(<chat.HarsoOutputDetail {...base} />);
  expect(screen.queryByRole("button", { name: label })).toBeNull();
  for (const blocked of [{ enabled: false, pending: false }, { enabled: true, pending: true }]) {
    const capability = action({ ...blocked, unavailableReason: "Host permission required", error: "Operation failed" });
    rerender(<chat.HarsoOutputDetail {...base} actions={{ [key]: capability }} />);
    const button = screen.getByRole("button", { name: key === "download" ? "Retry download" : label });
    expect(button).toBeDisabled();
    expect(button).toHaveAccessibleDescription(expect.stringContaining("Host permission required"));
    expect(button).toHaveAccessibleDescription(expect.stringContaining("Operation failed"));
    fireEvent.click(button);
    expect(capability.onInvoke).not.toHaveBeenCalled();
    if (blocked.pending) expect(button).toHaveAttribute("aria-busy", "true");
  }
});

test("download error and pending are independent of ready content and other actions", () => {
  const download = action({ error: "Download failed. Try again." }), expand = action(), openExternally = action();
  const { rerender } = render(<chat.HarsoOutputDetail {...base} actions={{ download, expand, openExternally }} />);
  const image = screen.getByRole("img");
  fireEvent.click(screen.getByRole("button", { name: "Retry download" }));
  expect(download.onInvoke).toHaveBeenCalledTimes(1);
  rerender(<chat.HarsoOutputDetail {...base} actions={{ download: { ...download, pending: true }, expand, openExternally }} />);
  expect(screen.getByRole("img")).toBe(image);
  expect(screen.getByRole("button", { name: "Expand" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "Open externally" })).toBeEnabled();
  expect(screen.queryByText(/success|saved/i)).toBeNull();
});

test("Details is nonmodal; Escape restores trigger focus, next Escape bubbles; identity resets without remounting body", () => {
  const outerEscape = vi.fn();
  const details = <button>Go to origin</button>;
  const view = (contentKey: string) => <div onKeyDown={outerEscape}><chat.HarsoOutputDetail {...base} contentKey={contentKey} details={details} /></div>;
  const { rerender } = render(view("a"));
  const trigger = screen.getByRole("button", { name: "Details" });
  const image = screen.getByRole("img");
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  fireEvent.click(trigger);
  expect(trigger).toHaveAttribute("aria-expanded", "true");
  expect(document.getElementById(trigger.getAttribute("aria-controls")!)).toHaveAccessibleName("Output details");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.getByRole("img")).toBe(image);
  const origin = screen.getByRole("button", { name: "Go to origin" });
  origin.focus();
  fireEvent.keyDown(origin, { key: "Escape" });
  expect(trigger).toHaveFocus();
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(outerEscape).not.toHaveBeenCalled();
  fireEvent.keyDown(trigger, { key: "Escape" });
  expect(outerEscape).toHaveBeenCalledTimes(1);
  fireEvent.click(trigger);
  rerender(view("b"));
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  rerender(view("a"));
  expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test.each(["loading", "ready", "unsupported", "error", "unavailable"] as const)("preview %s has stable polite host copy independent of action capability", previewState => {
  const download = action();
  const { rerender } = render(<chat.HarsoOutputDetail {...base} previewState={previewState} previewMessage="Safe host explanation" actions={{ download }} />);
  const status = screen.getByText("Safe host explanation");
  expect(status).toHaveAttribute("role", "status");
  expect(status).toHaveAttribute("aria-live", "polite");
  fireEvent.click(screen.getByRole("button", { name: "Download" }));
  expect(download.onInvoke).toHaveBeenCalledTimes(1);
  rerender(<chat.HarsoOutputDetail {...base} previewState={previewState} previewMessage="Safe host explanation" actions={{ download }} className="resized" />);
  expect(screen.getByText("Safe host explanation")).toBe(status);
});

test("non-ready preview has honest default copy, ready has no invented completion announcement", () => {
  const { rerender } = render(<chat.HarsoOutputDetail {...base} previewState="loading" />);
  expect(screen.getByText("Loading preview…")).toBeVisible();
  rerender(<chat.HarsoOutputDetail {...base} previewState="error" />);
  expect(screen.getByText("Preview could not be displayed.")).toBeVisible();
  rerender(<chat.HarsoOutputDetail {...base} />);
  expect(screen.queryByText(/Loading|could not|success|saved/i)).toBeNull();
});

test("exports a content-first detail preserving trusted host semantics with one title and close", () => {
  expect(chat.HarsoOutputDetail).toBeTypeOf("function");
  render(<chat.HarsoOutputDetail contentKey="note" title="Colour note" kind="document" previewState="ready" actions={{}} onClose={() => {}}
    content={<article><h2>Blue and yellow</h2><p><strong>A simple study in contrast.</strong></p><table><thead><tr><th>Element</th><th>Colour</th></tr></thead><tbody><tr><td>Background</td><td>Blue</td></tr><tr><td>Rectangle</td><td>Yellow</td></tr></tbody></table></article>} />);
  expect(screen.getAllByRole("heading", { name: "Colour note" })).toHaveLength(1);
  expect(screen.getByRole("heading", { name: "Blue and yellow" })).toBeVisible();
  expect(screen.getByText("A simple study in contrast.").tagName).toBe("STRONG");
  expect(screen.getAllByRole("row")).toHaveLength(3);
  expect(screen.getByRole("button", { name: "Close output" })).toBeVisible();
  expect(screen.queryByRole("button", { name: "Details" })).toBeNull();
});
