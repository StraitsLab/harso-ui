import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AssistantRuntimeProvider, useLocalRuntime, type ChatModelAdapter } from "@assistant-ui/react";
import { HarsoComposer } from "./composer";

function setup(disabled = false) {
  let runtime: ReturnType<typeof useLocalRuntime>;
  let signal: AbortSignal;
  const run = vi.fn<ChatModelAdapter["run"]>(async function* ({ abortSignal }) {
    signal = abortSignal;
    yield { content: [{ type: "text", text: "Working" }] };
    await new Promise<void>(resolve => { if (abortSignal.aborted) resolve(); else abortSignal.addEventListener("abort", () => resolve(), { once: true }); });
  });
  function Harness() {
    runtime = useLocalRuntime({ run });
    return <AssistantRuntimeProvider runtime={runtime}><HarsoComposer disabled={disabled} leading="Local model" trailing={<button type="button">Options</button>} error={disabled ? "Unavailable" : undefined} /></AssistantRuntimeProvider>;
  }
  render(<Harness />);
  return { run, runtime: () => runtime!, signal: () => signal! };
}

describe("HarsoComposer", () => {
  it("disables Send when empty and renders accessible slots", async () => {
    await act(async () => { setup(); });
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue("");
    expect(screen.getByText("Local model")).toBeVisible();
    expect(screen.getByRole("button", { name: "Options" })).toBeVisible();
  });

  it("Enter submits and clears the draft; Stop cancels the run", async () => {
    const harness = setup();
    const user = userEvent.setup();
    await user.type(screen.getByRole("textbox"), "Hello{Enter}");
    await waitFor(() => expect(harness.run).toHaveBeenCalledOnce());
    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(harness.runtime().thread.getState().messages[0].content).toEqual([{ type: "text", text: "Hello" }]);
    await user.click(screen.getByRole("button", { name: "Stop" }));
    await waitFor(() => expect(harness.signal().aborted).toBe(true));
    expect(await screen.findByRole("button", { name: "Send" })).toBeDisabled();
  });

  it("Shift+Enter inserts a newline without submitting", async () => {
    const { run } = setup();
    await userEvent.setup().type(screen.getByRole("textbox"), "First{Shift>}{Enter}{/Shift}Second");
    expect(screen.getByRole("textbox")).toHaveValue("First\nSecond");
    expect(run).not.toHaveBeenCalled();
  });

  it("blocks disabled input, actions, slots, and form submission", async () => {
    const harness = setup(true);
    await act(async () => { harness.runtime().thread.composer.setText("Retained"); });
    expect(screen.getByRole("textbox")).toBeDisabled();
    // Runtime-owned actions are gated; host slots (Live controls, pickers) stay operable while typing is unavailable.
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Add attachment" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Options" })).toBeEnabled();
    expect(screen.getByRole("alert")).toHaveTextContent("Unavailable");
    fireEvent.submit(screen.getByRole("form", { name: "Message composer" }));
    expect(harness.run).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox")).toHaveValue("Retained");
  });
});
