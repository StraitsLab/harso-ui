import { createRef, useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { Checkbox, Input, Select, Switch } from "./primitives";
import { CheckboxCard, FileUpload, InputOtp, Kbd, PhoneNumberInput, RadioCard, RadioDot, RangeSlider, SelectItem, SwitchCard } from "./controls";

describe("boundaryless native entry and selection", () => {
  test("rich SelectItem keeps explicit values, option refs and disabled state without a native label attribute", () => {
    const option = createRef<HTMLOptionElement>();
    const { container, rerender } = render(<select defaultValue="team"><SelectItem ref={option} value="team" textValue="Team" label="Must not hide rich content" description="Shared space" disabled><span aria-hidden="true">●</span></SelectItem></select>);
    expect(option.current).toBe(container.querySelector("option"));
    expect(option.current).toHaveAttribute("value", "team");
    expect(option.current).toBeDisabled();
    expect(option.current).not.toHaveAttribute("label");
    expect(option.current?.querySelector(".hk-select-item-label")).toHaveTextContent("Team");
    expect(option.current?.querySelector(".hk-select-item-detail")).toHaveTextContent("●Shared space");
    rerender(<select defaultValue="team"><SelectItem ref={option} value="team" description="Shared space">Team</SelectItem></select>);
    expect(option.current).toHaveTextContent("Team — Shared space");
    expect(option.current?.children).toHaveLength(0);
  });
  test("presentation RadioDot adds no menu focus target or form value; native refs and reset survive", async () => {
    const dot = createRef<HTMLSpanElement>();
    const input = createRef<HTMLInputElement>();
    const { container, rerender } = render(<form><button type="button" role="menuitemradio" aria-checked="true"><RadioDot presentation selected size="sm" ref={dot} />Team</button><RadioDot ref={input} name="audience" value="team" defaultChecked aria-label="Native team" /></form>);
    expect(dot.current?.tagName).toBe("SPAN");
    expect(dot.current).toHaveAttribute("aria-hidden", "true");
    expect(dot.current).not.toHaveAttribute("tabindex");
    expect(dot.current).toHaveAttribute("data-selected", "true");
    expect(screen.getAllByRole("radio")).toHaveLength(1);
    expect(input.current).toBe(screen.getByRole("radio"));
    expect(new FormData(container.querySelector("form")!).getAll("audience")).toEqual(["team"]);
    input.current!.checked = false;
    await act(async () => container.querySelector("form")!.reset());
    expect(input.current).toBeChecked();
    rerender(<RadioDot presentation ref={dot} />);
    expect(dot.current).toHaveAttribute("data-selected", "false");
  });
  test("OTP grouped slots mirror one native autofill field and reset without duplicate inputs", async () => {
    const { container, rerender } = render(<form><InputOtp aria-label="Code" name="code" length={6} groupEvery={3} defaultValue="123" /></form>);
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(container.querySelectorAll('[data-otp-slot]')).toHaveLength(6);
    expect(container.querySelectorAll('[data-group-start="true"]')).toHaveLength(1);
    expect(screen.getByRole("textbox")).toHaveAttribute("autocomplete", "one-time-code");
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "98-7654" } });
    expect(container.querySelector('.hk-otp-slots')).toHaveTextContent("987654");
    expect(new FormData(container.querySelector("form")!).get("code")).toBe("987654");
    await act(async () => container.querySelector("form")!.reset());
    expect(container.querySelector('.hk-otp-slots')).toHaveTextContent("123");
    rerender(<InputOtp aria-label="Code" length={4} groupEvery={2} value="12" onValueChange={() => undefined} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "1234" } });
    expect(container.querySelector('.hk-otp-slots')).toHaveTextContent("12");
    expect(container.querySelector('.hk-otp-slots')).not.toHaveTextContent("1234");
  });
  test("file upload allows an inert default icon or a supplied icon without replacing the picker", () => {
    const { container, rerender } = render(<FileUpload label="Files" onFilesSelect={() => undefined} />);
    const picker = screen.getByLabelText("Files");
    expect(container.querySelector(".hk-file-upload-icon")).toHaveAttribute("aria-hidden", "true");
    rerender(<FileUpload label="Files" icon={<span>Document</span>} onFilesSelect={() => undefined} />);
    expect(screen.getByLabelText("Files")).toBe(picker);
    expect(screen.getByText("Document")).toBeVisible();
  });
  test("OTP normalizes pasted or autofilled text and respects controlled refusal", () => {
    const changed = vi.fn();
    const complete = vi.fn();
    const { rerender } = render(<InputOtp aria-label="Code" length={4} value="12" onValueChange={changed} onComplete={complete} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "12-34 56" } });
    expect(changed).toHaveBeenCalledWith("1234");
    expect(complete).toHaveBeenCalledWith("1234");
    expect(screen.getByRole("textbox")).toHaveValue("12");
    rerender(<InputOtp aria-label="Code" length={4} value="" onChange={event => event.preventDefault()} onValueChange={changed} onComplete={complete} />);
    changed.mockClear(); complete.mockClear();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "1234" } });
    expect(changed).not.toHaveBeenCalled();
    expect(complete).not.toHaveBeenCalled();
  });
  test("adornments preserve the input ref, labels and form value", () => {
    const input = createRef<HTMLInputElement>();
    const action = vi.fn();
    const { container } = render(<form><label htmlFor="query">Find work</label><Input id="query" name="query" ref={input} defaultValue="Brief" leading={<span aria-hidden="true">⌕</span>} trailing={<button type="button" onClick={action}>Clear query</button>} /><Kbd>⌘ K</Kbd></form>);
    input.current?.focus();
    expect(screen.getByLabelText("Find work")).toHaveFocus();
    expect(new FormData(container.querySelector("form")!).get("query")).toBe("Brief");
    fireEvent.click(screen.getByRole("button"));
    expect(action).toHaveBeenCalledOnce();
    expect(container.querySelector("kbd")).toHaveTextContent("⌘ K");
  });

  test("changing adornments preserves the native input, draft, selection and reset", () => {
    const ref = createRef<HTMLInputElement>();
    const example = (adorned: boolean) => <form><Input ref={ref} name="draft" defaultValue="Initial" leading={adorned ? "Search" : undefined} trailing={adorned ? "Ready" : undefined} /></form>;
    const { container, rerender } = render(example(false));
    const input = ref.current!;
    fireEvent.change(input, { target: { value: "Edited draft" } });
    input.focus();
    input.setSelectionRange(2, 6);
    for (const adorned of [true, false, true]) {
      rerender(example(adorned));
      expect(ref.current).toBe(input);
      expect(input).toHaveFocus();
      expect([input.selectionStart, input.selectionEnd]).toEqual([2, 6]);
      expect(new FormData(container.querySelector("form")!).get("draft")).toBe("Edited draft");
    }
    container.querySelector("form")!.reset();
    expect(input).toHaveValue("Initial");
  });

  test("mixed checkbox presentation respects host changes and native refs", () => {
    const input = createRef<HTMLInputElement>();
    const onChange = vi.fn();
    const { rerender } = render(<Checkbox ref={input} label="All files" checked={false} indeterminate onChange={onChange} />);
    expect(input.current?.indeterminate).toBe(true);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledOnce();
    expect(input.current?.indeterminate).toBe(true);
    rerender(<Checkbox ref={input} label="All files" checked indeterminate={false} onChange={onChange} />);
    expect(input.current?.indeterminate).toBe(false);
    expect(input.current).toBeChecked();
  });

  test("choice cards remain native inputs with reset, disabled and named group semantics", () => {
    const { container } = render(<form><CheckboxCard label="Sources" description="Keep the evidence" name="sources" defaultChecked /><SwitchCard label="Audio" name="audio" shape="rectangle" controlSize="small" /><fieldset><legend>Audience</legend><RadioCard label="Team" name="audience" value="team" defaultChecked /><RadioCard label="Everyone" name="audience" value="everyone" /><RadioCard label="External" name="audience" value="external" disabled /></fieldset><Switch label="Unavailable" disabled /></form>);
    fireEvent.click(screen.getByLabelText("Everyone"));
    fireEvent.click(screen.getByRole("switch", { name: "Audio" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Sources" }));
    const form = container.querySelector("form")!;
    expect(new FormData(form).get("audience")).toBe("everyone");
    expect(new FormData(form).get("audio")).toBe("on");
    expect(screen.getByLabelText("External")).toBeDisabled();
    form.reset();
    expect(screen.getByLabelText("Team")).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Sources" })).toBeChecked();
    expect(screen.getByRole("switch", { name: "Audio" })).not.toBeChecked();
  });

  test("phone and native select preserve explicit values without formatting or network behavior", () => {
    const countryChange = vi.fn();
    const { container } = render(<form><PhoneNumberInput aria-label="Phone" name="phone" defaultValue="8123 4567" countries={[{ value: "sg", label: "Singapore", dialCode: "+65" }, { value: "gb", label: "United Kingdom", dialCode: "+44" }]} country="sg" onCountryChange={countryChange} /><Select aria-label="Plan" name="plan"><SelectItem value="team" description="Shared space">Team</SelectItem><SelectItem value="private" disabled>Private</SelectItem></Select></form>);
    fireEvent.change(screen.getByLabelText("Country calling code"), { target: { value: "gb" } });
    expect(countryChange).toHaveBeenCalledWith("gb");
    expect(screen.getByLabelText("Country calling code")).toHaveValue("sg");
    expect(new FormData(container.querySelector("form")!).get("phone")).toBe("8123 4567");
    expect(screen.getByRole("option", { name: "Private" })).toBeDisabled();
  });

  test("OTP uses native required/pattern validity, raw editing and explicit completion only", () => {
    const ref = createRef<HTMLInputElement>();
    const complete = vi.fn();
    const { container, rerender } = render(<form><InputOtp ref={ref} aria-label="One-time code" name="code" required length={6} onComplete={complete} /></form>);
    expect(ref.current?.checkValidity()).toBe(false);
    fireEvent.change(ref.current!, { target: { value: "12x456" } });
    expect(ref.current?.checkValidity()).toBe(false);
    expect(complete).not.toHaveBeenCalled();
    fireEvent.change(ref.current!, { target: { value: "123456" } });
    expect(complete).toHaveBeenCalledWith("123456");
    expect(ref.current?.checkValidity()).toBe(true);
    expect(new FormData(container.querySelector("form")!).get("code")).toBe("123456");
    expect(ref.current).toHaveAttribute("autocomplete", "one-time-code");
    rerender(<InputOtp aria-label="Backup code" alphabet="alphanumeric" length={4} defaultValue="A19b" />);
    expect((screen.getByRole("textbox") as HTMLInputElement).checkValidity()).toBe(true);
  });

  test("range values are bounded while updates remain host-owned", () => {
    const changes = vi.fn();
    const { rerender } = render(<RangeSlider label="Budget" min={0} max={100} step={5} value={[20, 80]} onValueChange={changes} name={["minimum", "maximum"]} />);
    const minimum = screen.getByRole("slider", { name: "Minimum Budget" });
    fireEvent.change(minimum, { target: { value: "30" } });
    expect(changes).toHaveBeenCalledWith([30, 80]);
    expect(minimum).toHaveValue("20");
    rerender(<RangeSlider label="Budget" min={0} max={100} step={5} value={[-10, 200]} onValueChange={changes} />);
    expect(screen.getByRole("slider", { name: "Minimum Budget" })).toHaveValue("0");
    expect(screen.getByRole("slider", { name: "Maximum Budget" })).toHaveValue("100");
    rerender(<RangeSlider label="Budget" min={1e13} max={1e13 + 100} step={1} value={[1e13 + 21, 1e13 + 80]} onValueChange={changes} />);
    expect(screen.getByRole("slider", { name: "Minimum Budget" })).toHaveValue("10000000000021");
    rerender(<RangeSlider label="Budget" min={0} max={0.3} step={0.1} value={[0.1, 0.3]} onValueChange={changes} />);
    expect(screen.getByRole("slider", { name: "Maximum Budget" })).toHaveValue("0.3");
    rerender(<RangeSlider label="Budget" min={0} max={100} step={0} value={[20, 80]} onValueChange={changes} />);
    expect(screen.getAllByRole("slider").every(input => (input as HTMLInputElement).disabled || input.closest("fieldset")?.disabled)).toBe(true);
    expect(screen.getByText("Range unavailable: invalid bounds or step.")).toBeVisible();
  });

  test("both range thumbs reach the consuming host and avoid crossing", () => {
    function Example() {
      const [value, setValue] = useState<readonly [number, number]>([0.2, 0.8]);
      return <RangeSlider label="Threshold" min={0} max={1} step={0.1} value={value} onValueChange={setValue} />;
    }
    render(<Example />);
    fireEvent.change(screen.getByRole("slider", { name: "Minimum Threshold" }), { target: { value: "0.4" } });
    expect(screen.getByRole("slider", { name: "Minimum Threshold" })).toHaveValue("0.4");
    fireEvent.change(screen.getByRole("slider", { name: "Maximum Threshold" }), { target: { value: "0.6" } });
    expect(screen.getByRole("slider", { name: "Maximum Threshold" })).toHaveValue("0.6");
    fireEvent.change(screen.getByRole("slider", { name: "Minimum Threshold" }), { target: { value: "0.9" } });
    expect(screen.getByRole("slider", { name: "Minimum Threshold" })).toHaveValue("0.6");
    fireEvent.change(screen.getByRole("slider", { name: "Maximum Threshold" }), { target: { value: "0.1" } });
    expect(screen.getByRole("slider", { name: "Maximum Threshold" })).toHaveValue("0.6");
  });

  test("file picker and drop use the same atomic metadata validation without reading contents", () => {
    const selected = vi.fn();
    const good = new File(["notes"], "brief.TXT", { type: "text/plain" });
    const bad = new File(["bad"], "secret.exe", { type: "application/x-executable" });
    const read = vi.fn();
    Object.defineProperty(good, "text", { value: read });
    const { container } = render(<FileUpload label="Reference files" accept=".txt,image/*" multiple maxFiles={3} maxSizeBytes={8} onFilesSelect={selected} />);
    const picker = screen.getByLabelText("Reference files");
    fireEvent.change(picker, { target: { files: [good, bad] } });
    expect(selected).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("secret.exe");
    const zone = container.querySelector(".hk-file-upload")!;
    fireEvent.drop(zone, { dataTransfer: { files: [good, bad], types: ["Files"] } });
    expect(selected).not.toHaveBeenCalled();
    fireEvent.drop(zone, { dataTransfer: { files: [good], types: ["Files"] } });
    expect(selected).toHaveBeenCalledWith([good]);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(read).not.toHaveBeenCalled();
    expect(container.querySelector("img, iframe")).toBeNull();
  });

  test("file limits fail closed, count existing files and respect disabled state", () => {
    const selected = vi.fn();
    const file = new File(["oversize"], "brief.txt", { type: "text/plain" });
    const { rerender } = render(<FileUpload label="Files" accept=".txt" maxSizeBytes={1} onFilesSelect={selected} />);
    fireEvent.change(screen.getByLabelText("Files"), { target: { files: [file] } });
    expect(screen.getByRole("alert")).toHaveTextContent("too large");
    rerender(<FileUpload label="Files" maxFiles={1} files={[{ id: "existing", name: "First", status: "selected" }]} onFilesSelect={selected} />);
    fireEvent.change(screen.getByLabelText("Files"), { target: { files: [file] } });
    expect(screen.getByRole("alert")).toHaveTextContent("At most 1");
    rerender(<FileUpload label="Files" maxFiles={3} files={[{ id: "existing", name: "First", status: "selected" }]} onFilesSelect={selected} />);
    fireEvent.change(screen.getByLabelText("Files"), { target: { files: [file] } });
    expect(screen.getByRole("alert")).toHaveTextContent("At most 1");
    rerender(<FileUpload label="Files" accept="not-a-type" onFilesSelect={selected} />);
    fireEvent.change(screen.getByLabelText("Files"), { target: { files: [file] } });
    expect(screen.getByRole("alert")).toHaveTextContent("configuration");
    rerender(<FileUpload label="Files" disabled onFilesSelect={selected} />);
    fireEvent.drop(screen.getByLabelText("Files").closest("section")!, { dataTransfer: { files: [file], types: ["Files"] } });
    expect(selected).not.toHaveBeenCalled();
  });

  test("drop obeys disabled fieldsets including the native first-legend exception", () => {
    const selected = vi.fn();
    const file = new File(["brief"], "brief.txt", { type: "text/plain" });
    const example = (disabled: boolean) => <fieldset disabled={disabled}><legend><FileUpload label="Legend files" onFilesSelect={selected} /></legend><FileUpload label="Body files" onFilesSelect={selected} /></fieldset>;
    const { rerender } = render(example(true));
    const drop = (label: string) => fireEvent.drop(screen.getByLabelText(label).closest("section")!, { dataTransfer: { files: [file], types: ["Files"] } });
    drop("Body files");
    expect(selected).not.toHaveBeenCalled();
    drop("Legend files");
    expect(selected).toHaveBeenCalledOnce();
    rerender(example(false));
    drop("Body files");
    expect(selected).toHaveBeenCalledTimes(2);
  });

  test("file status and progress are supplied, filenames escaped and actions only requested", () => {
    const remove = vi.fn();
    const retry = vi.fn();
    render(<FileUpload label="Files" onFilesSelect={() => undefined} onRemove={remove} onRetry={retry} files={[{ id: "upload", name: "brief.txt", status: "uploading", progress: 0.4 }, { id: "bad", name: "<img onerror=alert(1)>", status: "error", message: "Connection lost" }]} />);
    expect(screen.getByRole("progressbar", { name: "Upload progress for brief.txt" })).toHaveAttribute("value", "0.4");
    fireEvent.click(screen.getByRole("button", { name: "Retry <img onerror=alert(1)>" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove brief.txt" }));
    expect(retry).toHaveBeenCalledWith("bad");
    expect(remove).toHaveBeenCalledWith("upload");
    expect(screen.getByText("brief.txt")).toBeVisible();
    expect(document.querySelector("img")).toBeNull();
  });
});
