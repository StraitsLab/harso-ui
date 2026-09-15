import { fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import type { ToolCallMessagePartProps } from "@assistant-ui/react";
import { HarsoToolCall, HarsoTerminalTool, HarsoReadFileTool, HarsoToolState } from "./tool-call";
import { ChatPartsExample } from "../../preview/chat-parts-example";

const part = { type: "tool-call", toolCallId: "call", toolName: "inspect", args: {}, argsText: "{}", status: { type: "running" }, addResult: vi.fn(), resume: vi.fn(), respondToApproval: vi.fn().mockResolvedValue(undefined) } satisfies ToolCallMessagePartProps;
describe("Harso tool parts", () => {
  test.each(["running", "completed", "failed", "denied", "awaiting approval"] as const)("badge labels %s", state => {
    render(<HarsoToolState state={state} />);
    expect(screen.getByRole("status")).toHaveTextContent(state);
  });
  test.each([
    [{}, "running"], [{ result: false }, "completed"], [{ isError: true }, "failed"],
    [{ approval: { id: "gate", approved: false }, isError: true }, "denied"],
    [{ approval: { id: "gate" } }, "awaiting approval"],
  ] as const)("derives state from runtime props %j", (overrides, state) => {
    render(<HarsoToolCall {...part} {...overrides} />);
    expect(screen.getAllByRole("status")[0]).toHaveTextContent(state);
  });
  test("completed tools start as quiet rows and disclose their panel on demand", () => {
    const { container } = render(<HarsoToolCall {...part} result="done" />);
    const details = container.querySelector("details")!;
    expect(details).not.toHaveAttribute("open");
    expect(screen.getByLabelText("Result")).not.toBeVisible();
    fireEvent.click(container.querySelector("summary")!);
    expect(details).toHaveAttribute("open");
    expect(screen.getByLabelText("Result")).toBeVisible();
    expect(container.querySelectorAll("summary > svg")).toHaveLength(2);
  });
  test("default approval invokes the runtime responder", async () => {
    render(<HarsoToolCall {...part} approval={{ id: "gate" }} />);
    fireEvent.click(screen.getByRole("button", { name: "Allow once" }));
    expect(part.respondToApproval).toHaveBeenCalledWith({ approved: true });
    await screen.findByText("Approved");
  });
  test("terminal and read-file preserve structured output", () => {
    const view = render(<HarsoTerminalTool {...part} args={{ command: "npm test" }} result={{ output: "passed", exitCode: 0 }} />);
    fireEvent.click(view.container.querySelector("summary")!);
    expect(screen.getByLabelText("Command")).toHaveTextContent("npm test");
    expect(screen.getByLabelText("Output")).toHaveTextContent("passed");
    expect(screen.getByText(/Exit code/)).toHaveTextContent("0");
    view.rerender(<HarsoReadFileTool {...part} args={{ path: "src/main.tsx" }} result={{ content: "<script>not executable</script>" }} />);
    expect(screen.getByLabelText("Path")).toHaveTextContent("src/main.tsx");
    expect(screen.getByLabelText("File content")).toHaveTextContent("<script>not executable</script>");
    expect(view.container.querySelector("script")).toBeNull();
  });
  test.each(["Allow once", "Deny"])("live %s resumes the scripted adapter", async decision => {
    render(<ChatPartsExample />);
    fireEvent.click(screen.getByRole("button", { name: "Start live approval" }));
    const prompt = await screen.findByText("Simulate running the checks? No shell command is executed.");
    const card = prompt.closest("section")!;
    fireEvent.click(within(card).getByRole("button", { name: decision }));
    await waitFor(() => expect(card).toHaveAttribute("data-state", decision === "Allow once" ? "completed" : "denied"));
    expect(within(card).getByLabelText("Output")).toHaveTextContent(decision === "Allow once" ? "Simulated checks passed" : "Command was not executed.");
  });
});
