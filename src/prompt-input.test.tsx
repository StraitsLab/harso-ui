import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PromptInput, PromptInputActionAddAttachments, PromptInputActionAddScreenshot, PromptInputSubmit, PromptInputTextarea } from "./prompt-input";
import * as Prompt from "./prompt-input";

describe("PromptInput", () => {
  it.each([false, true])("does not offer draft attachments without a message consumer (text submit: %s)", textOnly => {
    render(<Prompt.PromptInputProvider><PromptInput defaultValue="Draft" onSubmit={textOnly ? vi.fn() : undefined}><PromptInputActionAddAttachments /></PromptInput></Prompt.PromptInputProvider>);
    expect(screen.getByRole("button", { name: "Attach" })).toBeDisabled();
  });

  it("accepts files through the explicit message consumer", async () => {
    const submit = vi.fn();
    const create = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:message-file");
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const { unmount } = render(<PromptInput onSubmitMessage={submit}><PromptInputActionAddAttachments /><PromptInputSubmit /></PromptInput>);
    expect(screen.getByRole("button", { name: "Attach" })).toBeEnabled();
    await userEvent.upload(screen.getByRole("button", { name: "Attach" }).previousElementSibling as HTMLInputElement, new File(["x"], "x.txt"));
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ text: "", files: [expect.objectContaining({ filename: "x.txt" })] }));
    unmount();
    expect(revoke).toHaveBeenCalledWith("blob:message-file");
    create.mockRestore(); revoke.mockRestore();
  });
  it("keeps provider files across prompt unmount and revokes them on remove, clear and provider disposal", () => {
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const create = vi.spyOn(URL, "createObjectURL").mockImplementation(file => `blob:${(file as File).name}`);
    let controller: ReturnType<typeof Prompt.usePromptInputController>;
    function Controls() { controller = Prompt.usePromptInputController(); return null; }
    const fixture = (mounted: boolean) => <Prompt.PromptInputProvider><Controls />{mounted && <PromptInput onSubmitMessage={vi.fn()}><PromptInputActionAddAttachments /></PromptInput>}</Prompt.PromptInputProvider>;
    const view = render(fixture(true));
    act(() => controller.attachments.add([new File(["a"], "a.txt"), new File(["b"], "b.txt")]));
    view.rerender(fixture(false));
    expect(controller!.attachments.files).toHaveLength(2);
    expect(revoke).not.toHaveBeenCalled();
    view.rerender(fixture(true));
    act(() => controller.attachments.remove(controller.attachments.files[0].id));
    expect(revoke).toHaveBeenCalledExactlyOnceWith("blob:a.txt");
    act(() => controller.attachments.clear());
    expect(revoke).toHaveBeenCalledTimes(2);
    act(() => controller.attachments.add([new File(["c"], "c.txt")]));
    view.unmount();
    expect(revoke).toHaveBeenCalledTimes(3);
    expect(revoke).toHaveBeenLastCalledWith("blob:c.txt");
    create.mockRestore(); revoke.mockRestore();
  });
  it("shares one provider draft and attachment lifetime with the actual prompt consumer", () => {
    const submit = vi.fn(), revoke = vi.fn();
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => "blob:local-file"), revokeObjectURL: revoke }));
    let controller: ReturnType<typeof Prompt.usePromptInputController>;
    function Controls() { controller = Prompt.usePromptInputController(); return <button onClick={() => controller.textInput.setInput("Shared draft")}>Set draft</button>; }
    const { unmount } = render(<Prompt.PromptInputProvider initialInput="Initial"><Controls /><PromptInput onSubmitMessage={submit}><PromptInputTextarea /><PromptInputSubmit /></PromptInput></Prompt.PromptInputProvider>);
    expect(screen.getByRole("textbox")).toHaveValue("Initial");
    fireEvent.click(screen.getByRole("button", { name: "Set draft" }));
    expect(screen.getByRole("textbox")).toHaveValue("Shared draft");
    act(() => controller.attachments.add([new File(["hello"], "brief.txt", { type: "text/plain" })]));
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ text: "Shared draft", files: [expect.objectContaining({ filename: "brief.txt", url: "blob:local-file", type: "file" })] }));
    expect(controller!.attachments.files).toHaveLength(1);
    act(() => controller.textInput.clear());
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(submit).toHaveBeenLastCalledWith(expect.objectContaining({ text: "", files: expect.any(Array) }));
    unmount();
    expect(revoke).toHaveBeenCalledWith("blob:local-file");
    vi.unstubAllGlobals();
  });

  it("filters command choices, skips disabled results and activates with the keyboard", () => {
    const selected = vi.fn();
    render(<Prompt.PromptInputCommand><Prompt.PromptInputCommandInput aria-label="Find action" /><Prompt.PromptInputCommandList><Prompt.PromptInputCommandEmpty /><Prompt.PromptInputCommandGroup><Prompt.PromptInputCommandItem value="alpha" onSelect={selected}>Alpha</Prompt.PromptInputCommandItem><Prompt.PromptInputCommandItem value="beta" disabled>Beta</Prompt.PromptInputCommandItem><Prompt.PromptInputCommandItem value="bravo" onSelect={selected}>Bravo</Prompt.PromptInputCommandItem></Prompt.PromptInputCommandGroup></Prompt.PromptInputCommandList></Prompt.PromptInputCommand>);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "br" } });
    expect(screen.queryByRole("option", { name: "Alpha" })).toBeNull();
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(selected).toHaveBeenCalledWith("bravo");
    fireEvent.change(input, { target: { value: "missing" } });
    expect(screen.getByText("No results")).toBeVisible();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(selected).toHaveBeenCalledOnce();
  });
  it("starts ArrowUp at the last visible command and excludes hidden groups", () => {
    const selected = vi.fn();
    render(<Prompt.PromptInputCommand><Prompt.PromptInputCommandInput aria-label="Actions" /><Prompt.PromptInputCommandList><Prompt.PromptInputCommandItem value="first" onSelect={selected}>First</Prompt.PromptInputCommandItem><Prompt.PromptInputCommandItem value="last" onSelect={selected}>Last</Prompt.PromptInputCommandItem><Prompt.PromptInputCommandGroup hidden><Prompt.PromptInputCommandItem value="hidden" onSelect={selected}>Hidden</Prompt.PromptInputCommandItem></Prompt.PromptInputCommandGroup></Prompt.PromptInputCommandList></Prompt.PromptInputCommand>);
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowUp" });
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "Enter" });
    expect(selected).toHaveBeenCalledExactlyOnceWith("last");
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "End" });
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "Enter" });
    expect(selected).toHaveBeenLastCalledWith("last");
  });

  it("reuses keyboard tabs while preserving host refusal and mounted panel drafts", () => {
    const changed = vi.fn();
    render(<Prompt.PromptInputTabsList value="first" onValueChange={changed} aria-label="Prompt modes"><Prompt.PromptInputTab value="first" label="First"><Prompt.PromptInputTabBody><input aria-label="Mode draft" defaultValue="Keep" /></Prompt.PromptInputTabBody></Prompt.PromptInputTab><Prompt.PromptInputTab value="disabled" label="Disabled" disabled /><Prompt.PromptInputTab value="last" label="Last"><Prompt.PromptInputTabItem>Last panel</Prompt.PromptInputTabItem></Prompt.PromptInputTab></Prompt.PromptInputTabsList>);
    fireEvent.keyDown(screen.getByRole("tab", { name: "First" }), { key: "ArrowRight" });
    expect(changed).toHaveBeenCalledWith("last");
    expect(screen.getByRole("tab", { name: "First" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("textbox", { name: "Mode draft" })).toHaveValue("Keep");
    expect(screen.getByText("Last panel")).not.toBeVisible();
  });

  it("reuses truthful native menus and keeps select requests host-owned", () => {
    const changed = vi.fn();
    render(<Prompt.PromptInputSelect value="balanced" onValueChange={changed}><Prompt.PromptInputSelectTrigger><Prompt.PromptInputSelectValue /></Prompt.PromptInputSelectTrigger><Prompt.PromptInputSelectContent><Prompt.PromptInputSelectItem value="fast">Fast</Prompt.PromptInputSelectItem><Prompt.PromptInputSelectItem value="balanced">Balanced</Prompt.PromptInputSelectItem></Prompt.PromptInputSelectContent></Prompt.PromptInputSelect>);
    expect(screen.getByRole("button", { name: "balanced" })).toBeDisabled();
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Fast", hidden: true }));
    expect(changed).toHaveBeenCalledWith("fast");
    expect(screen.getByRole("button", { name: "balanced" })).toBeInTheDocument();
  });
  it("allows host cancellation before submitting and ignores IME Enter", () => {
    const submit = vi.fn();
    render(<PromptInput defaultValue="Hello" onSubmit={submit}><PromptInputTextarea aria-label="Message" onKeyDown={event => event.preventDefault()} /><PromptInputSubmit onClick={event => event.preventDefault()} /></PromptInput>);
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(submit).not.toHaveBeenCalled();
  });

  it("does not submit composition, blank, disabled or read-only input", () => {
    const submit = vi.fn();
    const view = (value: string, readOnly = false, disabled = false) => <PromptInput value={value} onSubmit={submit}><PromptInputTextarea aria-label="Message" readOnly={readOnly} disabled={disabled} /><PromptInputSubmit /></PromptInput>;
    const { rerender } = render(view("Hello"));
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter", isComposing: true });
    rerender(view("Hello", true));
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    rerender(view("Hello", false, true));
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    rerender(view("  "));
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(submit).not.toHaveBeenCalled();
  });

  it("keeps controlled drafts until the host resets them and disables unwired actions", () => {
    const changed = vi.fn();
    const { rerender } = render(<PromptInput value="Draft" onValueChange={changed}><PromptInputTextarea /><PromptInputSubmit /><PromptInputActionAddScreenshot /><PromptInputActionAddAttachments /></PromptInput>);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Other" } });
    expect(changed).toHaveBeenCalledWith("Other");
    expect(screen.getByRole("textbox")).toHaveValue("Draft");
    for (const button of screen.getAllByRole("button")) expect(button).toBeDisabled();
    rerender(<PromptInput value=""><PromptInputTextarea /></PromptInput>);
    expect(screen.getByRole("textbox")).toHaveValue("");
  });
  it("keeps submit state host-owned", async () => {
    let submitted = "";
    render(<PromptInput defaultValue="Hello" onSubmit={value => { submitted = value; }}><PromptInputTextarea aria-label="Message" /><PromptInputSubmit /></PromptInput>);
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(submitted).toBe("Hello");
  });

  it("passes native file selections to the host", async () => {
    let selectedName = "";
    const user = userEvent.setup();
    render(<PromptInput><PromptInputActionAddAttachments onFiles={files => { selectedName = files?.[0]?.name ?? ""; }} /></PromptInput>);
    const file = new File(["brief"], "brief.md", { type: "text/markdown" });
    await user.upload(screen.getByRole("button", { name: "Attach" }).previousElementSibling as HTMLInputElement, file);
    expect(selectedName).toBe("brief.md");
  });
});
