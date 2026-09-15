import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AssistantRuntimeProvider, useLocalRuntime, useExternalStoreRuntime, type ThreadMessage, type ChatModelAdapter } from "@assistant-ui/react";
import { HarsoComposer, type HarsoComposerProps } from "./composer";

function setup(disabled = false, props: HarsoComposerProps = {}) {
  let runtime: ReturnType<typeof useLocalRuntime>;
  let signal: AbortSignal;
  const run = vi.fn<ChatModelAdapter["run"]>(async function* ({ abortSignal }) {
    signal = abortSignal;
    yield { content: [{ type: "text", text: "Working" }] };
    await new Promise<void>(resolve => { if (abortSignal.aborted) resolve(); else abortSignal.addEventListener("abort", () => resolve(), { once: true }); });
  });
  function Harness() {
    runtime = useLocalRuntime({ run });
    return <AssistantRuntimeProvider runtime={runtime}><HarsoComposer disabled={disabled} leading="Local model" trailing={<button type="button">Options</button>} error={disabled ? "Unavailable" : undefined} {...props} /></AssistantRuntimeProvider>;
  }
  render(<Harness />);
  return { run, runtime: () => runtime!, signal: () => signal! };
}

describe("HarsoComposer", () => {
  // v3 changes: inline DOM order, model/voice slots, phone defaults, true multiline state.
  it("orders add / model / input / voice / send and activates host slots", async () => {
    const onClick = vi.fn();
    const voice = vi.fn();
    setup(false, { modelSelector: { label: "Claude Fable 5.1", glyph: <svg data-testid="model-glyph" />, onClick }, voice: <button type="button" onClick={voice}>Voice input</button> });
    const row = [screen.getByRole("button", { name: "Add attachment" }), screen.getByRole("button", { name: "Select model: Claude Fable 5.1" }), screen.getByRole("textbox"), screen.getByRole("button", { name: "Voice input" }), screen.getByRole("button", { name: "Send" })];
    row.slice(1).forEach((node, index) => expect(row[index].compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy());
    expect(screen.getByTestId("model-glyph")).toBeInTheDocument();
    expect(row[2]).toHaveAttribute("placeholder", "Reply…");
    await userEvent.click(row[1]);
    await userEvent.click(row[3]);
    expect(onClick).toHaveBeenCalledOnce();
    expect(voice).toHaveBeenCalledOnce();
  });

  it("uses the phone placeholder and allows an explicit override", () => {
    setup(false, { "data-layout": "phone" });
    expect(screen.getByRole("textbox")).toHaveAttribute("placeholder", "Message Weave");
    expect(document.querySelector(".hkc-composer-dock")).toHaveAttribute("data-layout", "phone");
  });

  it("honors a custom phone placeholder and picker disabled state", () => {
    setup(false, { "data-layout": "phone", placeholder: "Ask anything", modelSelector: { label: "Unavailable", disabled: true } });
    expect(screen.getByRole("textbox")).toHaveAttribute("placeholder", "Ask anything");
    expect(screen.getByRole("button", { name: "Select model: Unavailable" })).toBeDisabled();
  });

  it("does not expand for a short draft; expands for newline and collapses after clearing", async () => {
    const harness = setup();
    await act(async () => harness.runtime().thread.composer.setText("Short"));
    expect(screen.getByRole("form")).not.toHaveAttribute("data-multiline");
    await act(async () => harness.runtime().thread.composer.setText("First\nSecond"));
    expect(screen.getByRole("form")).toHaveAttribute("data-multiline", "true");
    await act(async () => harness.runtime().thread.composer.setText(""));
    expect(screen.getByRole("form")).not.toHaveAttribute("data-multiline");
  });

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
  it("IME Enter does not submit a composed draft or blank whitespace", async () => {
    const harness = setup();
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.submit(screen.getByRole("form"));
    expect(harness.run).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: "日本語" } });
    fireEvent.compositionStart(input);
    fireEvent.keyDown(input, { key: "Enter", code: "Enter", isComposing: true, keyCode: 229 });
    expect(harness.run).not.toHaveBeenCalled();
    expect(input).toHaveValue("日本語");
    fireEvent.compositionEnd(input);
  });

  it("external host refusal restores the submitted draft through the documented runtime bridge", async () => {
    const append = vi.fn();
    let runtime: ReturnType<typeof useExternalStoreRuntime>;
    function Host() {
      runtime = useExternalStoreRuntime<ThreadMessage>({ messages: [], isRunning: false, onNew: async message => {
        const text = message.content.filter(part => part.type === "text").map(part => part.text).join("");
        append(text);
        // External-store onNew has no Boolean acceptance API; the host restores a refused draft after reset.
        queueMicrotask(() => runtime.thread.composer.setText(text));
      } });
      return <AssistantRuntimeProvider runtime={runtime}><HarsoComposer attachments={false} /></AssistantRuntimeProvider>;
    }
    render(<Host />);
    await userEvent.type(screen.getByRole("textbox"), "Keep refused draft");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(append).toHaveBeenCalledExactlyOnceWith("Keep refused draft");
    await waitFor(() => expect(screen.getByRole("textbox")).toHaveValue("Keep refused draft"));
    expect(runtime!.thread.getState().messages).toHaveLength(0);
  });

});
