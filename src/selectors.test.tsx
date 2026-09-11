import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MicSelector, MicSelectorItem, ModelSelector, ModelSelectorItem, ModelSelectorTrigger, VoiceSelector, VoiceSelectorItem, useAudioDevices, useVoiceSelector } from "./selectors";
import { MicSelectorContent, MicSelectorTrigger, MicSelectorInput, MicSelectorEmpty, MicSelectorList, MicSelectorLabel, MicSelectorValue, ModelSelectorContent, ModelSelectorInput, ModelSelectorEmpty, VoiceSelectorContent, VoiceSelectorTrigger, VoiceSelectorInput, VoiceSelectorEmpty, VoiceSelectorPreview } from "./selectors";
import { ModelSelectorGroup } from "./selectors";
import * as Selectors from "./selectors";
afterEach(() => vi.unstubAllGlobals());

it("subscribes only with explicit browser management and never requests microphone permission", async () => {
  const media = new EventTarget();
  const enumerateDevices = vi.fn().mockResolvedValue([{ kind: "audioinput", deviceId: "one", label: "Mic one" }, { kind: "audiooutput", deviceId: "speaker", label: "Speaker" }]);
  const getUserMedia = vi.fn();
  Object.assign(media, { enumerateDevices, getUserMedia });
  const remove = vi.spyOn(media, "removeEventListener");
  vi.stubGlobal("navigator", { mediaDevices: media });
  const view = render(<MicSelector devices={[{ deviceId: "host", label: "Host" }]}><AudioDeviceProbe /></MicSelector>);
  expect(enumerateDevices).not.toHaveBeenCalled();
  view.rerender(<MicSelector manageDevices><AudioDeviceProbe /></MicSelector>);
  await waitFor(() => expect(screen.getByText("unknown:one/Mic one")).toBeInTheDocument());
  enumerateDevices.mockResolvedValue([{ kind: "audioinput", deviceId: "two", label: "Mic two" }]);
  act(() => media.dispatchEvent(new Event("devicechange")));
  await waitFor(() => expect(screen.getByText("unknown:two/Mic two")).toBeInTheDocument());
  expect(getUserMedia).not.toHaveBeenCalled();
  view.unmount();
  expect(remove).toHaveBeenCalledWith("devicechange", expect.any(Function));
  const count = enumerateDevices.mock.calls.length;
  media.dispatchEvent(new Event("devicechange"));
  expect(enumerateDevices).toHaveBeenCalledTimes(count);
});

it("preserves supplied devices, callback refusal, and disabled browser-management boundaries", async () => {
  const media = new EventTarget();
  const enumerateDevices = vi.fn().mockResolvedValue([{ kind: "audioinput", deviceId: "browser", label: "Browser" }]);
  Object.assign(media, { enumerateDevices });
  vi.stubGlobal("navigator", { mediaDevices: media });
  const changed = vi.fn(() => false);
  const view = render(<MicSelector manageDevices devices={[{ deviceId: "host", label: "Host" }]} onDevicesChange={changed}><AudioDeviceProbe /></MicSelector>);
  await waitFor(() => expect(changed).toHaveBeenCalledWith([{ deviceId: "browser", label: "Browser" }]));
  expect(screen.getByText("unknown:host/Host")).toBeInTheDocument();
  view.rerender(<MicSelector manageDevices onDevicesChange={changed}><AudioDeviceProbe /></MicSelector>);
  expect(screen.getByText("unknown:")).toBeInTheDocument();
  view.rerender(<MicSelector manageDevices disabled onDevicesChange={changed}><AudioDeviceProbe /></MicSelector>);
  const count = enumerateDevices.mock.calls.length;
  act(() => media.dispatchEvent(new Event("devicechange")));
  expect(enumerateDevices).toHaveBeenCalledTimes(count);
});

it("discards stale device discovery after switching back to supplied mode", async () => {
  let resolve!: (devices: unknown[]) => void;
  const media = new EventTarget();
  Object.assign(media, { enumerateDevices: () => new Promise(done => { resolve = done; }) });
  vi.stubGlobal("navigator", { mediaDevices: media });
  const changed = vi.fn();
  const view = render(<MicSelector manageDevices onDevicesChange={changed}><AudioDeviceProbe /></MicSelector>);
  view.rerender(<MicSelector devices={[]} onDevicesChange={changed}><AudioDeviceProbe /></MicSelector>);
  await act(async () => resolve([{ kind: "audioinput", deviceId: "stale", label: "Stale" }]));
  expect(changed).not.toHaveBeenCalled();
  expect(screen.getByText("unknown:")).toBeInTheDocument();
});

it("reports enumeration failure without inferring a permission denial", async () => {
  const media = new EventTarget();
  Object.assign(media, { enumerateDevices: async () => { throw new Error("Discovery unavailable"); } });
  vi.stubGlobal("navigator", { mediaDevices: media });
  render(<MicSelector manageDevices defaultOpen><MicSelectorContent /><AudioDeviceProbe /></MicSelector>);
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Discovery unavailable"));
  expect(screen.getByText("unknown:")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Refresh microphones" })).toBeInTheDocument();
});
it('does not request host microphone access after the open root becomes disabled', async () => {
  const loadDevices = vi.fn();
  const view = render(<MicSelector defaultOpen loadDevices={loadDevices}><MicSelectorTrigger>Mic</MicSelectorTrigger><MicSelectorContent /></MicSelector>);
  view.rerender(<MicSelector defaultOpen disabled loadDevices={loadDevices}><MicSelectorTrigger>Mic</MicSelectorTrigger><MicSelectorContent /></MicSelector>);
  await userEvent.click(screen.getByRole('button', { name: 'Request microphone access' }));
  expect(loadDevices).not.toHaveBeenCalled();
});
it('keyboard traversal skips a host-hidden group', async () => {
  render(<ModelSelector defaultOpen><ModelSelectorContent><ModelSelectorInput /><ModelSelectorGroup style={{ display: 'none' }}><ModelSelectorItem value="hidden">Hidden option</ModelSelectorItem></ModelSelectorGroup><ModelSelectorItem value="visible">Visible option</ModelSelectorItem></ModelSelectorContent></ModelSelector>);
  await userEvent.keyboard('{ArrowDown}');
  expect(screen.getByRole('button', { name: 'Visible option' })).toHaveFocus();
});
it('a host-hidden group does not suppress empty results', () => {
  render(<ModelSelector defaultOpen><ModelSelectorContent><ModelSelectorInput /><ModelSelectorGroup style={{ display: 'none' }}><ModelSelectorItem value="hidden">Hidden option</ModelSelectorItem></ModelSelectorGroup><ModelSelectorEmpty /></ModelSelectorContent></ModelSelector>);
  expect(screen.getByRole('status')).toHaveTextContent('No models');
});

function AudioDeviceProbe() {
  const { devices, permission } = useAudioDevices();
  return <output>{permission}:{devices.map(device => `${device.deviceId}/${device.label}`).join(",")}</output>;
}

describe("selectors", () => {
  it("composes the model dialog, grouping, metadata and separator slots", () => {
    render(<ModelSelector defaultOpen><Selectors.ModelSelectorDialog><Selectors.ModelSelectorList><ModelSelectorGroup heading="Models"><ModelSelectorItem value="local"><Selectors.ModelSelectorLogoGroup><Selectors.ModelSelectorLogo>H</Selectors.ModelSelectorLogo></Selectors.ModelSelectorLogoGroup><Selectors.ModelSelectorName>Host model</Selectors.ModelSelectorName><Selectors.ModelSelectorShortcut>1</Selectors.ModelSelectorShortcut></ModelSelectorItem></ModelSelectorGroup><Selectors.ModelSelectorSeparator /></Selectors.ModelSelectorList></Selectors.ModelSelectorDialog></ModelSelector>);
    expect(screen.getByRole("dialog", { name: "Choose a model" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Models" })).toHaveTextContent("Host model");
    expect(screen.getByText("Host model")).toHaveClass("hk-model-name");
    expect(screen.getByText("H")).toHaveClass("hk-model-logo");
    expect(screen.getByText("1")).toHaveClass("hk-model-shortcut");
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });

  it("composes voice dialog metadata without synthesizing any voice data", () => {
    render(<VoiceSelector defaultOpen><Selectors.VoiceSelectorDialog><Selectors.VoiceSelectorList><Selectors.VoiceSelectorGroup heading="Voices"><VoiceSelectorItem value="host"><Selectors.VoiceSelectorName>Host voice</Selectors.VoiceSelectorName><Selectors.VoiceSelectorShortcut>2</Selectors.VoiceSelectorShortcut></VoiceSelectorItem><Selectors.VoiceSelectorDescription>Supplied description</Selectors.VoiceSelectorDescription><Selectors.VoiceSelectorAttributes><Selectors.VoiceSelectorGender>Gender supplied</Selectors.VoiceSelectorGender><Selectors.VoiceSelectorBullet /><Selectors.VoiceSelectorAccent>Accent supplied</Selectors.VoiceSelectorAccent><Selectors.VoiceSelectorAge>Age supplied</Selectors.VoiceSelectorAge></Selectors.VoiceSelectorAttributes></Selectors.VoiceSelectorGroup><Selectors.VoiceSelectorSeparator /></Selectors.VoiceSelectorList></Selectors.VoiceSelectorDialog></VoiceSelector>);
    expect(screen.getByRole("dialog", { name: "Choose a voice" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Voices" })).toHaveTextContent("Host voice");
    for (const [text, name] of [["Host voice", "name"], ["2", "shortcut"], ["Supplied description", "description"], ["Gender supplied", "gender"], ["Accent supplied", "accent"], ["Age supplied", "age"]]) expect(screen.getByText(text)).toHaveClass(`hk-voice-${name}`);
    expect(screen.getByText("•")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });
  describe.each([
    ["model", ModelSelector, ModelSelectorTrigger, ModelSelectorContent, ModelSelectorInput, ModelSelectorItem, ModelSelectorEmpty],
    ["microphone", MicSelector, MicSelectorTrigger, MicSelectorContent, MicSelectorInput, MicSelectorItem, MicSelectorEmpty],
    ["voice", VoiceSelector, VoiceSelectorTrigger, VoiceSelectorContent, VoiceSelectorInput, VoiceSelectorItem, VoiceSelectorEmpty]
  ] as const)("%s lifecycle", (_name, Root, Trigger, Content, Search, Item, Empty) => {
    it("opens, filters names and keywords, selects by keyboard and restores focus", async () => {
      const changed = vi.fn();
      render(<Root onValueChange={changed}><Trigger>Choose</Trigger><Content title="Choose option"><Search aria-label="Search options" /><Item value="a">Alpha</Item><Item value="b" keywords={["warm"]}>Beta</Item><Empty>No matches</Empty></Content></Root>);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Choose" }));
      const search = screen.getByRole("textbox", { name: "Search options" });
      expect(search).toHaveFocus();
      await userEvent.type(search, "wrm");
      expect(screen.queryByRole("button", { name: "Alpha" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Beta" })).toBeVisible();
      await userEvent.keyboard("{ArrowDown}{Enter}");
      expect(changed).toHaveBeenCalledExactlyOnceWith("b");
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(screen.getByRole("button", { name: "Choose" })).toHaveFocus();
      await userEvent.click(screen.getByRole("button", { name: "Choose" }));
      expect(screen.getByRole("textbox")).toHaveValue("");
      await userEvent.type(screen.getByRole("textbox"), "missing");
      expect(screen.getByText("No matches")).toBeVisible();
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("preserves a host's refusal to open and cancelled trigger actions", async () => {
      const opened = vi.fn();
      const view = render(<Root open={false} onOpenChange={opened}><Trigger>Choose</Trigger><Content><Item value="a">Alpha</Item></Content></Root>);
      await userEvent.click(screen.getByRole("button", { name: "Choose" }));
      expect(opened).toHaveBeenCalledExactlyOnceWith(true);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      opened.mockClear();
      view.rerender(<Root onOpenChange={opened}><Trigger onClick={event => event.preventDefault()}>Choose</Trigger><Content><Item value="a">Alpha</Item></Content></Root>);
      await userEvent.click(screen.getByRole("button", { name: "Choose" }));
      expect(opened).not.toHaveBeenCalled();
    });

    it("skips disabled options while leaving text editing and cancelled keys alone", async () => {
      render(<Root defaultOpen><Trigger>Choose</Trigger><Content><Search aria-label="Search" /><Item value="a" disabled>Alpha</Item><Item value="b">Beta</Item><Item value="c">Gamma</Item></Content></Root>);
      const search = screen.getByRole("textbox");
      await userEvent.type(search, "a");
      await userEvent.keyboard("{Home}");
      expect(search).toHaveFocus();
      await userEvent.keyboard("{ArrowDown}");
      expect(screen.getByRole("button", { name: "Beta" })).toHaveFocus();
      await userEvent.keyboard("{End}");
      expect(screen.getByRole("button", { name: "Gamma" })).toHaveFocus();
    });
  });

  it("uses host device snapshots without native discovery or inferred permissions", () => {
    const enumerateDevices = vi.fn();
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { enumerateDevices } });
    const view = render(<MicSelector devices={[{ deviceId: "desk", label: "Desk mic" }]} permission="unknown"><AudioDeviceProbe /></MicSelector>);
    expect(screen.getByText("unknown:desk/Desk mic")).toBeInTheDocument();
    view.rerender(<MicSelector devices={[]} permission="denied"><AudioDeviceProbe /></MicSelector>);
    expect(screen.getByText("denied:")).toBeInTheDocument();
    expect(enumerateDevices).not.toHaveBeenCalled();
  });

  it("presents microphone labels, selection and host error independently", () => {
    render(<MicSelector defaultOpen value="desk" devices={[{ deviceId: "desk", label: "Desk mic (1234:abcd)" }]} error="Service unavailable" permission="unknown"><MicSelectorTrigger><MicSelectorValue /></MicSelectorTrigger><MicSelectorContent><MicSelectorList>{devices => devices.map(device => <MicSelectorItem value={device.deviceId} key={device.deviceId}><MicSelectorLabel device={device} /></MicSelectorItem>)}</MicSelectorList></MicSelectorContent></MicSelector>);
    expect(screen.getByRole("button", { name: "Desk mic (1234:abcd)", expanded: true })).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent("Service unavailable");
    expect(screen.getByText("(1234:abcd)", { selector: ".hk-mic-device-id" })).toBeVisible();
  });

  it("keeps voice preview host-owned, cancellable and separate from selection", async () => {
    const play = vi.fn();
    const view = render(<VoiceSelectorPreview onPlay={play} playing />);
    await userEvent.click(screen.getByRole("button", { name: "Pause preview" }));
    expect(play).toHaveBeenCalledOnce();
    view.rerender(<VoiceSelectorPreview onPlay={play} loading />);
    expect(screen.getByRole("button", { name: "Loading preview" })).toBeDisabled();
    view.rerender(<VoiceSelectorPreview onPlay={play} onClick={event => event.preventDefault()} />);
    await userEvent.click(screen.getByRole("button", { name: "Play preview" }));
    expect(play).toHaveBeenCalledOnce();
  });

  it("inherits root disablement for preview and never invents preview capability", async () => {
    const play = vi.fn();
    const view = render(<VoiceSelector disabled><VoiceSelectorPreview onPlay={play} /></VoiceSelector>);
    expect(screen.getByRole("button", { name: "Play preview" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button"));
    expect(play).not.toHaveBeenCalled();
    view.rerender(<VoiceSelectorPreview />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("requests device access only on explicit action and reports rejection without permission inference", async () => {
    const request = vi.fn().mockRejectedValue(new Error("offline"));
    render(<MicSelector defaultOpen loadDevices={request}><MicSelectorTrigger>Microphone</MicSelectorTrigger><MicSelectorContent /><AudioDeviceProbe /></MicSelector>);
    expect(request).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Request microphone access" }));
    expect(request).toHaveBeenCalledOnce();
    expect(await screen.findByRole("alert")).toHaveTextContent("microphone request failed");
    expect(screen.getByText("unknown:")).toBeInTheDocument();
  });

  it("lets the host refuse closing and search changes", async () => {
    const close = vi.fn();
    const search = vi.fn();
    render(<ModelSelector open search="" onOpenChange={close} onSearchChange={search}><ModelSelectorTrigger>Models</ModelSelectorTrigger><ModelSelectorContent><ModelSelectorInput /><ModelSelectorItem value="first">First</ModelSelectorItem></ModelSelectorContent></ModelSelector>);
    await userEvent.type(screen.getByRole("textbox"), "z");
    expect(search).toHaveBeenCalledExactlyOnceWith("z");
    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(screen.getByRole("button", { name: "First" })).toBeVisible();
    await userEvent.keyboard("{Escape}");
    expect(close).toHaveBeenCalledExactlyOnceWith(false);
    expect(screen.getByRole("dialog")).toBeVisible();
  });

  it("does not navigate when the host cancels a search keyboard event", async () => {
    render(<ModelSelector defaultOpen><ModelSelectorContent><ModelSelectorInput onKeyDown={event => event.preventDefault()} /><ModelSelectorItem value="first">First</ModelSelectorItem></ModelSelectorContent></ModelSelector>);
    const input = screen.getByRole("textbox");
    await userEvent.keyboard("{ArrowDown}");
    expect(input).toHaveFocus();
  });
  describe.each([
    ["model", ModelSelector, ModelSelectorItem],
    ["microphone", MicSelector, MicSelectorItem],
    ["voice", VoiceSelector, VoiceSelectorItem]
  ] as const)("%s selection", (_name, Root, Item) => {
    it("exposes pressed button semantics and changes local selection by keyboard", async () => {
      const changed = vi.fn();
      render(<Root defaultValue="first" onValueChange={changed}><Item value="first">First</Item><Item value="second">Second</Item></Root>);
      expect(screen.getByRole("button", { name: "First", pressed: true })).not.toHaveAttribute("aria-selected");
      screen.getByRole("button", { name: "Second" }).focus();
      await userEvent.keyboard("{Enter}");
      expect(screen.getByRole("button", { name: "Second", pressed: true })).toHaveFocus();
      expect(changed).toHaveBeenCalledExactlyOnceWith("second");
    });

    it("respects cancellation before callbacks or local changes", async () => {
      const changed = vi.fn();
      render(<Root defaultValue="first" onValueChange={changed}><Item value="first">First</Item><Item value="second" onClick={event => event.preventDefault()}>Second</Item></Root>);
      await userEvent.click(screen.getByRole("button", { name: "Second" }));
      expect(changed).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "First" })).toHaveAttribute("aria-pressed", "true");
    });

    it("honors controlled empty and host refusal without reviving defaults", async () => {
      const changed = vi.fn();
      const view = render(<Root value="first" defaultValue="second" onValueChange={changed}><Item value="first">First</Item><Item value="second">Second</Item></Root>);
      await userEvent.click(screen.getByRole("button", { name: "Second" }));
      expect(changed).toHaveBeenCalledExactlyOnceWith("second");
      expect(screen.getByRole("button", { name: "First" })).toHaveAttribute("aria-pressed", "true");
      view.rerender(<Root value={null} defaultValue="second" onValueChange={changed}><Item value="first">First</Item><Item value="second">Second</Item></Root>);
      expect(screen.getAllByRole("button").every(button => button.getAttribute("aria-pressed") === "false")).toBe(true);
    });

    it.each(["disabled", "readOnly"] as const)("prevents %s changes", async mode => {
      const changed = vi.fn();
      render(<Root {...{ [mode]: true }} defaultValue="first" onValueChange={changed}><Item value="second">Second</Item></Root>);
      await userEvent.click(screen.getByRole("button", { name: "Second" }));
      expect(changed).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "Second" })).toHaveAttribute("aria-pressed", "false");
    });

    it("does not emit selection changes for an already selected item", async () => {
      const changed = vi.fn();
      const clicked = vi.fn();
      render(<Root defaultValue="first" onValueChange={changed}><Item value="first" onClick={clicked}>First</Item></Root>);
      await userEvent.click(screen.getByRole("button", { name: "First" }));
      expect(clicked).toHaveBeenCalledOnce();
      expect(changed).not.toHaveBeenCalled();
    });
  });

  it("guards hook-based selection under a read-only root", async () => {
    function HookAction() {
      const { setValue } = useVoiceSelector();
      return <button onClick={() => setValue("second")}>Hook selection</button>;
    }
    const changed = vi.fn();
    render(<VoiceSelector readOnly defaultValue="first" onValueChange={changed}><HookAction /></VoiceSelector>);
    await userEvent.click(screen.getByRole("button", { name: "Hook selection" }));
    expect(changed).not.toHaveBeenCalled();
  });

  it("keeps model selection host-controlled", async () => {
    let selected = "";
    render(<ModelSelector onValueChange={value => { selected = value; }}><ModelSelectorTrigger>Choose</ModelSelectorTrigger><ModelSelectorItem value="qwen">Qwen</ModelSelectorItem></ModelSelector>);
    await userEvent.click(screen.getByRole("button", { name: "Qwen" }));
    expect(selected).toBe("qwen");
  });

  it("does not discover devices without a supplied snapshot", () => {
    const enumerateDevices = vi.fn();
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { enumerateDevices } });
    render(<AudioDeviceProbe />);
    expect(screen.getByText("unknown:")).toBeInTheDocument();
    expect(enumerateDevices).not.toHaveBeenCalled();
  });
});
