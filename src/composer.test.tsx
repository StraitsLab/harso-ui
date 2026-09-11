import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Composer, ComposerAttachmentTile, ComposerLoader, ComposerPanel, ComposerStatusTab, ComposerWithAttachments, GlassComposer, ModelPicker, PermissionMenu, StatusBar } from "./composer";

describe("ComposerPanel controlled presentation", () => {
  it("host loading toggles working presence without remounting glass, draft or loader", () => {
    const send = vi.fn(() => false);
    const { container, rerender } = render(<ComposerPanel value="Retained draft" onSubmit={send} />);
    const glass = container.querySelector(".hk-glass-composer");
    const editor = screen.getByRole("textbox");
    const loader = container.querySelector(".hk-composer-loader");
    expect(loader).toHaveAttribute("hidden");
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(send).toHaveBeenCalledWith("Retained draft");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    rerender(<ComposerPanel loading value="Retained draft" onSubmit={send} />);
    expect(screen.getByRole("status")).toBe(loader);
    expect(loader).not.toHaveAttribute("hidden");
    expect(container.querySelector(".hk-composer-panel")).toHaveAttribute("aria-busy", "true");
    expect(editor).toBeDisabled();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    expect(container.querySelector(".hk-glass-composer")).toBe(glass);
    rerender(<ComposerPanel value="Retained draft" onSubmit={send} />);
    expect(container.querySelector(".hk-composer-loader")).toBe(loader);
    expect(loader).toHaveAttribute("hidden");
    expect(screen.getByRole("textbox")).toBe(editor);
    expect(editor).toHaveValue("Retained draft");
    expect(editor).not.toBeDisabled();
    expect(container.querySelector(".hk-glass-composer")).toBe(glass);
    expect(container.querySelector(".hk-composer-panel")).not.toHaveAttribute("aria-busy");
  });
  it("ring follows only finite host progress, retaining indeterminate native semantics", () => {
    const { container, rerender } = render(<ComposerAttachmentTile name="asset" status="uploading" progress={0.25} />);
    const arc = () => container.querySelector(".hk-composer-progress-amount");
    expect(arc()).toHaveAttribute("stroke-dashoffset", "75");
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("progressbar")).toHaveAttribute("value", "0.25");
    rerender(<ComposerAttachmentTile name="asset" status="uploading" progress={0.8} />);
    expect(arc()).toHaveAttribute("stroke-dashoffset", "20");
    for (const progress of [undefined, NaN, Infinity]) {
      rerender(<ComposerAttachmentTile name="asset" status="uploading" progress={progress} />);
      expect(arc()).not.toBeInTheDocument();
      expect(screen.getByRole("progressbar")).not.toHaveAttribute("value");
      expect(container.querySelector(".hk-composer-progress-ring")).toHaveAttribute("data-indeterminate", "true");
      expect(screen.queryByText(/%/)).not.toBeInTheDocument();
    }
    rerender(<ComposerAttachmentTile name="asset" status="uploading" progress={-1} />);
    expect(arc()).toHaveAttribute("stroke-dashoffset", "100");
    rerender(<ComposerAttachmentTile name="asset" status="complete" progress={1} />);
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });
  it("panel composes supplied context and voice requests without inferred recording or footer", () => {
    const voice = vi.fn(() => false);
    const { container, rerender } = render(<ComposerPanel context={<><span>Project Atlas</span><span>Branch main</span></>} onVoiceRequest={voice} />);
    expect(screen.getByText("Project Atlas")).toBeVisible();
    expect(screen.getByText("Branch main")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Request voice input" }));
    expect(voice).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Request voice input" })).not.toHaveAttribute("aria-pressed");
    expect(container.querySelector(".hk-status-bar")).not.toBeInTheDocument();
    for (const props of [{ disabled: true }, { loading: true }]) {
      rerender(<ComposerPanel {...props} context={<button>Choose project</button>} onVoiceRequest={voice} />);
      expect(screen.getByRole("button", { name: "Choose project" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Request voice input" })).toBeDisabled();
      fireEvent.click(screen.getByRole("button", { name: "Request voice input" }));
    }
    expect(voice).toHaveBeenCalledOnce();
    rerender(<ComposerPanel />);
    expect(screen.queryByRole("button", { name: "Request voice input" })).not.toBeInTheDocument();
    expect(container.querySelector(".hk-composer-context")).not.toBeInTheDocument();
  });
  it("composes attachment/model/voice/send requests in the original Harso panel API", () => {
    const files = vi.fn(() => false), model = vi.fn(() => false), voice = vi.fn(() => false), send = vi.fn(() => false);
    render(<ComposerPanel value="Draft" context="Project Atlas / main" onFilesSelected={files} onVoiceRequest={voice} onSubmit={send} modelPicker={{ models: [{ id: "fast", label: "Fast", provider: "local" }], onValueChange: model }} />);
    const file = new File([], "asset.txt");
    fireEvent.change(screen.getByLabelText("Attach files"), { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Choose model" }));
    fireEvent.click(screen.getByRole("radio", { name: "Fast" }));
    fireEvent.click(screen.getByRole("button", { name: "Request voice input" }));
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(files).toHaveBeenCalledWith([file]);
    expect(model).toHaveBeenCalledWith("fast");
    expect(voice).toHaveBeenCalledOnce();
    expect(send).toHaveBeenCalledWith("Draft");
    expect(screen.getByRole("textbox")).toHaveValue("Draft");
    expect(screen.getByRole("radio", { name: "Fast" })).not.toBeChecked();
    expect(screen.queryByText("asset.txt")).not.toBeInTheDocument();
  });
  const models = [{ id: "fast", label: "Fast", provider: "local" }, { id: "deep", label: "Deep", provider: "cloud", disabled: true }];
  it("permission requests never grant permissions without a host update", () => {
    const change = vi.fn(() => false);
    const { rerender } = render(<PermissionMenu value="manual" onValueChange={change} />);
    fireEvent.click(screen.getByText("Permissions: Manual"));
    fireEvent.click(screen.getByRole("radio", { name: "Bypass all" }));
    expect(change).toHaveBeenCalledWith("bypass");
    expect(screen.getByRole("radio", { name: "Manual" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Bypass all" })).not.toBeChecked();
    rerender(<PermissionMenu value="plan" onValueChange={change} />);
    expect(screen.getByRole("radio", { name: "Plan mode" })).toBeChecked();
  });
  it("model/provider/effort/search requests are controlled, filtered and resettable", () => {
    const model = vi.fn(() => false), provider = vi.fn(), effort = vi.fn(), query = vi.fn();
    const props = { models, providers: [{ id: "local", label: "Local" }, { id: "cloud", label: "Cloud" }], efforts: [{ id: "low", label: "Low" }, { id: "high", label: "High" }], value: "fast", provider: "local", effort: "low", query: "", onValueChange: model, onProviderChange: provider, onEffortChange: effort, onQueryChange: query };
    const { rerender } = render(<ModelPicker {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Fast" }));
    fireEvent.click(screen.getByRole("radio", { name: "Cloud" }));
    expect(provider).toHaveBeenCalledWith("cloud");
    expect(screen.getByRole("radio", { name: "Local" })).toBeChecked();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "deep" } });
    expect(query).toHaveBeenCalledWith("deep");
    expect(screen.getByRole("searchbox")).toHaveValue("");
    fireEvent.click(screen.getByText("Effort: Low"));
    fireEvent.click(screen.getByRole("radio", { name: "High" }));
    expect(effort).toHaveBeenCalledWith("high");
    expect(screen.getByRole("radio", { name: "Low" })).toBeChecked();
    rerender(<ModelPicker {...props} provider="cloud" query="deep" />);
    expect(screen.getByRole("radio", { name: "Deep" })).toBeDisabled();
    rerender(<ModelPicker {...props} query="missing" />);
    expect(screen.getByRole("status")).toHaveTextContent("No matching models");
    rerender(<ModelPicker {...props} value="" query="" />);
    expect(screen.getByRole("radio", { name: "Fast" })).not.toBeChecked();
    fireEvent.click(screen.getByRole("radio", { name: "Fast" }));
    expect(model).toHaveBeenCalledWith("fast");
    expect(screen.getByRole("radio", { name: "Fast" })).not.toBeChecked();
  });
  it("panel composes prompt, host file requests and custom or absent status", () => {
    const submit = vi.fn(), attach = vi.fn(), change = vi.fn();
    const { rerender } = render(<ComposerPanel value="Draft" onValueChange={change} onSubmit={submit} onFilesSelected={attach} status="On branch main" attachments={<ComposerAttachmentTile name="brief.md" kind="code" />} />);
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Message" }), { key: "Enter", shiftKey: true });
    expect(submit).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Message" }), { key: "Enter" });
    expect(submit).toHaveBeenCalledWith("Draft");
    const file = new File(["brief"], "brief.md", { type: "text/markdown" });
    fireEvent.change(screen.getByLabelText("Attach files"), { target: { files: [file] } });
    expect(attach).toHaveBeenCalledWith([file]);
    expect(screen.getByRole("textbox")).toHaveValue("Draft");
    expect(screen.getByText("On branch main")).toBeVisible();
    rerender(<ComposerPanel value="" onSubmit={submit} />);
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    expect(screen.queryByText("On branch main")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Attach files")).not.toBeInTheDocument();
  });
  it("disabled and loading controls cannot emit host requests", () => {
    const request = vi.fn();
    render(<ComposerPanel disabled value="Draft" onSubmit={request} onFilesSelected={request} permission={{ value: "auto", onValueChange: request }} modelPicker={{ models, onValueChange: request }} />);
    expect(screen.getByRole("textbox")).toBeDisabled();
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    fireEvent.change(screen.getByLabelText("Attach files"), { target: { files: [new File([], "x")] } });
    expect(request).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Choose model" })).toBeDisabled();
  });
  it("disclosures respect prevented opening and Escape restores trigger focus", () => {
    const { rerender } = render(<ModelPicker models={models} onClick={event => event.preventDefault()} />);
    fireEvent.click(screen.getByRole("button", { name: "Choose model" }));
    expect(screen.queryByRole("group", { name: "Model settings" })).not.toBeInTheDocument();
    rerender(<ModelPicker models={models} />);
    fireEvent.click(screen.getByRole("button", { name: "Choose model" }));
    expect(screen.getByRole("radio", { name: "Fast" })).toBeDisabled();
    fireEvent.keyDown(screen.getByRole("searchbox"), { key: "Escape" });
    expect(screen.queryByRole("group", { name: "Model settings" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choose model" })).toHaveFocus();
  });
  it("loading and error are supplied states, and reset never invents a selection", () => {
    const { rerender } = render(<ModelPicker models={models} loading error="Provider offline" />);
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Loading models");
    expect(screen.getByRole("alert")).toHaveTextContent("Provider offline");
    rerender(<ComposerPanel loading error="Request declined" value="Draft" onSubmit={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent("Working");
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("Request declined");
    rerender(<PermissionMenu />);
    fireEvent.click(screen.getByText("Permissions: Choose"));
    for (const option of screen.getAllByRole("radio")) { expect(option).toBeDisabled(); expect(option).not.toBeChecked(); }
  });
  it("retains custom panel children and controlled draft refusal without local files", () => {
    const refuse = vi.fn(() => false);
    const { rerender } = render(<ComposerPanel value="Original" onValueChange={refuse} onFilesSelected={refuse} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Changed" } });
    expect(refuse).toHaveBeenCalledWith("Changed");
    expect(screen.getByRole("textbox")).toHaveValue("Original");
    const input = screen.getByLabelText("Attach files");
    const file = new File([], "same.txt");
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.change(input, { target: { files: [file] } });
    expect(refuse).toHaveBeenCalledTimes(3);
    expect(input).toHaveValue("");
    expect(screen.queryByText("same.txt")).not.toBeInTheDocument();
    rerender(<ComposerPanel><span>Custom composition</span></ComposerPanel>);
    expect(screen.getByText("Custom composition")).toBeVisible();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
  it("status tabs preserve host-controlled pressed, disabled and no-status modes", () => {
    const change = vi.fn(() => false);
    const { rerender } = render(<ComposerPanel status={<ComposerStatusTab aria-pressed={false} onClick={change}>Plan</ComposerStatusTab>} />);
    fireEvent.click(screen.getByRole("button", { name: "Plan" }));
    expect(change).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Plan" })).toHaveAttribute("aria-pressed", "false");
    rerender(<ComposerPanel status={<ComposerStatusTab disabled>Plan</ComposerStatusTab>} />);
    expect(screen.getByRole("button", { name: "Plan" })).toBeDisabled();
    rerender(<ComposerPanel status={null} />);
    expect(screen.queryByRole("button", { name: "Plan" })).not.toBeInTheDocument();
    rerender(<ComposerPanel disabled status={<ComposerStatusTab>Plan</ComposerStatusTab>}><button>Custom action</button></ComposerPanel>);
    expect(screen.getByRole("button", { name: "Plan" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Custom action" })).toBeDisabled();
  });
  it.each(["image", "document", "spreadsheet", "presentation", "code", "video"] as const)("renders truthful %s kind and bounded supplied percentage", kind => {
    render(<ComposerAttachmentTile name="asset" kind={kind} status="uploading" progress={2} />);
    expect(screen.getByText(kind)).toBeVisible();
    expect(screen.getByText("100%")).toBeVisible();
    expect(screen.getByRole("progressbar")).toHaveAttribute("value", "1");
  });
  it("queue snapshots only change when the host replaces them; invalid progress is indeterminate", () => {
    const remove = vi.fn();
    const { rerender } = render(<ComposerPanel attachments={<><ComposerAttachmentTile name="queued" status="selected" /><ComposerAttachmentTile name="landed" status="complete" onRemove={remove} disabled /></>} />);
    expect(screen.getByText("Queued")).toBeVisible();
    expect(screen.getByText("Landed")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Remove landed" }));
    expect(remove).not.toHaveBeenCalled();
    rerender(<ComposerPanel attachments={<ComposerAttachmentTile name="queued" status="uploading" progress={NaN} />} />);
    expect(screen.queryByText("Landed")).not.toBeInTheDocument();
    expect(screen.getByRole("progressbar")).not.toHaveAttribute("value");
    expect(screen.getByText("Uploading")).toBeVisible();
    rerender(<ComposerPanel attachments={null} />);
    expect(screen.queryByText("queued")).not.toBeInTheDocument();
  });
});

describe("Composer", () => {
  it("loader visual controls are bounded CSS variables and inactive state is hidden", () => {
    const { rerender } = render(<ComposerLoader colors={["red", "blue"]} arc={180} speed={2} bloom bloomStrength={0.5} />);
    expect(screen.getByRole("status")).toHaveStyle({ "--hk-loader-start": "red", "--hk-loader-end": "blue", "--hk-loader-arc": "180deg", "--hk-loader-speed": "2s", "--hk-loader-bloom": "4px" });
    rerender(<ComposerLoader arc={Infinity} speed={-1} bloom bloomStrength={100} />);
    expect(screen.getByRole("status")).toHaveStyle({ "--hk-loader-arc": "270deg", "--hk-loader-speed": "0.9s", "--hk-loader-bloom": "8px" });
    rerender(<ComposerLoader active={false} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("status", { hidden: true })).toHaveAttribute("hidden");
  });
  it("disabled composers block native controls and host draft callbacks in every composition", () => {
    const change = vi.fn();
    const submit = vi.fn();
    render(<Composer disabled onValueChange={change} onSubmit={submit}><GlassComposer /></Composer>);
    expect(screen.getByPlaceholderText("Ask anything")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText("Ask anything"), { target: { value: "New draft" } });
    expect(change).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByPlaceholderText("Ask anything"), { key: "Enter" });
    expect(submit).not.toHaveBeenCalled();
  });
  it("attachment composition provides an editor and refuses blank or disabled submission", () => {
    const submit = vi.fn();
    const { rerender } = render(<ComposerWithAttachments value="" onSubmit={submit}><ComposerAttachmentTile name="brief.md" /></ComposerWithAttachments>);
    expect(screen.getByPlaceholderText("Ask anything")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(submit).not.toHaveBeenCalled();
    rerender(<ComposerWithAttachments value="Draft" disabled onSubmit={submit}><ComposerAttachmentTile name="brief.md" /></ComposerWithAttachments>);
    fireEvent.keyDown(screen.getByPlaceholderText("Ask anything"), { key: "Enter" });
    expect(submit).not.toHaveBeenCalled();
    rerender(<ComposerWithAttachments value="Draft" onSubmit={submit}><ComposerAttachmentTile name="brief.md" /></ComposerWithAttachments>);
    fireEvent.keyDown(screen.getByPlaceholderText("Ask anything"), { key: "Enter", shiftKey: true });
    expect(submit).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByPlaceholderText("Ask anything"), { key: "Enter" });
    expect(submit).toHaveBeenCalledWith("Draft");
  });

  it("attachment progress and removal remain host-owned and loader can be inactive", () => {
    const remove = vi.fn();
    const { rerender } = render(<><ComposerAttachmentTile name="brief.md" status="uploading" progress={0.4} onRemove={remove} /><ComposerLoader active={false} /></>);
    expect(screen.getByRole("progressbar", { name: "Upload progress for brief.md" })).toHaveAttribute("value", "0.4");
    expect(screen.getByText("Working")).not.toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Remove brief.md" }));
    expect(remove).toHaveBeenCalledOnce();
    expect(screen.getByText("brief.md")).toBeVisible();
    rerender(<ComposerAttachmentTile name="brief.md" status="uploading" />);
    expect(screen.getByRole("progressbar")).not.toHaveAttribute("value");
    rerender(<ComposerAttachmentTile name="brief.md" status="error" message="Upload failed" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Upload failed");
  });
  it("composes the host-controlled prompt surface and status parts", () => {
    render(<><Composer><GlassComposer /><StatusBar>Working</StatusBar></Composer><ComposerLoader /></>);
    expect(screen.getByPlaceholderText("Ask anything")).toBeInTheDocument();
    expect(screen.getAllByText("Working")).toHaveLength(2);
  });
});
