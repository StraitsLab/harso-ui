import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AssistantRuntimeProvider, useLocalRuntime, type AssistantRuntime } from "@assistant-ui/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HarsoThreadList, type HarsoThreadListProps } from "./thread-list";
import { createScriptedAdapter } from "./testing/scripted-adapter";

const adapter = createScriptedAdapter({ tools: false, reasoning: false, tokenDelayMs: 0, response: "Local response" });
let runtime: AssistantRuntime;
function Harness(props: HarsoThreadListProps) {
  runtime = useLocalRuntime(adapter);
  return <AssistantRuntimeProvider runtime={runtime}><div className="harso-kit"><HarsoThreadList {...props} /></div></AssistantRuntimeProvider>;
}
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

async function seed(title = "First conversation") {
  await act(async () => { await runtime.threads.mainItem.initialize(); await runtime.threads.mainItem.rename(title); });
  await screen.findByRole("button", { name: title });
}

describe("HarsoThreadList", () => {
  it("creates a new runtime conversation and preserves the existing one", async () => {
    render(<Harness />);
    await seed();
    const previous = runtime.threads.getState().mainThreadId;
    fireEvent.click(screen.getByRole("button", { name: "New conversation" }));
    await waitFor(() => expect(runtime.threads.getState().mainThreadId).not.toBe(previous));
    await seed("Second conversation");
    expect(runtime.threads.getState().threadIds).toHaveLength(2);
    expect(screen.getByRole("button", { name: "First conversation" })).toBeInTheDocument();
  });

  it("marks the selected trigger aria-current and switches runtime selection", async () => {
    render(<Harness />); await seed();
    const first = screen.getByRole("button", { name: "First conversation" });
    expect(first).toHaveAttribute("aria-current", "page");
    fireEvent.click(screen.getByRole("button", { name: "New conversation" }));
    await waitFor(() => expect(first).not.toHaveAttribute("aria-current"));
    fireEvent.click(first);
    await waitFor(() => expect(first).toHaveAttribute("aria-current", "page"));
  });

  it("renames through the runtime with inline validation and cancellation", async () => {
    render(<Harness />); await seed();
    fireEvent.click(screen.getByRole("button", { name: "Rename First conversation" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Conversation title" }), { target: { value: "  " } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a conversation title");
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "  Updated title  " } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByRole("button", { name: "Updated title" });
    expect(runtime.threads.mainItem.getState().title).toBe("Updated title");
    fireEvent.click(screen.getByRole("button", { name: "Rename Updated title" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Discarded" } });
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
    expect(runtime.threads.mainItem.getState().title).toBe("Updated title");
    await waitFor(() => expect(screen.getByRole("button", { name: "Rename Updated title" })).toHaveFocus());
  });

  it("requires confirmation before deleting and supports cancel", async () => {
    render(<Harness />); await seed();
    const id = runtime.threads.getState().mainThreadId;
    fireEvent.click(screen.getByRole("button", { name: "Delete First conversation" }));
    expect(runtime.threads.getState().threadIds.includes(id)).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("button", { name: "Confirm delete" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete First conversation" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }));
    await waitFor(() => expect(runtime.threads.getState().threadIds.includes(id)).toBe(false));
    expect(screen.queryByRole("button", { name: "First conversation" })).not.toBeInTheDocument();
  });

  it("archives through the primitive", async () => {
    render(<Harness />); await seed();
    fireEvent.click(screen.getByRole("button", { name: "Archive First conversation" }));
    await waitFor(() => expect(runtime.threads.getState().archivedThreadIds).toHaveLength(1));
    expect(screen.queryByRole("button", { name: "First conversation" })).not.toBeInTheDocument();
  });

  it("buckets threads using the supplied groupBy callback", async () => {
    render(<Harness groupBy={thread => thread.title === "First conversation" ? "Yesterday" : "Earlier"} />);
    await seed();
    const previous = runtime.threads.getState().mainThreadId;
    fireEvent.click(screen.getByRole("button", { name: "New conversation" }));
    await waitFor(() => expect(runtime.threads.getState().mainThreadId).not.toBe(previous));
    await seed("Older conversation");
    expect(within(screen.getByRole("region", { name: "Yesterday" })).getByRole("button", { name: "First conversation" })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Earlier" })).getByRole("button", { name: "Older conversation" })).toBeInTheDocument();
  });
});
