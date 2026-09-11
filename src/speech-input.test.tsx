import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SpeechInput } from "./speech-input";

class NativeRecognition {
  static last: NativeRecognition;
  continuous = false;
  interimResults = false;
  lang = "";
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onresult: ((event: { resultIndex: number; results: { isFinal: boolean; 0: { transcript: string } }[] }) => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
  constructor() { NativeRecognition.last = this; }
}

class NativeRecorder {
  static last: NativeRecorder;
  state = "inactive";
  mimeType = "audio/webm";
  onstart: (() => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: (() => void) | null = null;
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  start = vi.fn(() => { this.state = "recording"; this.onstart?.(); });
  stop = vi.fn(() => { this.state = "inactive"; this.ondataavailable?.({ data: new Blob(["speech"], { type: this.mimeType }) }); this.onstop?.(); });
  constructor() { NativeRecorder.last = this; }
}

afterEach(() => vi.unstubAllGlobals());

describe("SpeechInput", () => {
  it.each(["error", "end"])("rejects saved recognition callbacks after %s and permits a fresh run", terminal => {
    vi.stubGlobal("SpeechRecognition", NativeRecognition);
    const changed = vi.fn();
    render(<SpeechInput onTranscriptionChange={changed} />);
    fireEvent.click(screen.getByRole("button"));
    const recognition = NativeRecognition.last;
    const lateResult = recognition.onresult;
    const lateStart = recognition.onstart;
    act(() => { if (terminal === "error") recognition.onerror?.({ error: "not-allowed" }); else recognition.onend?.(); });
    act(() => { lateStart?.(); lateResult?.({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: "Late" } }] }); });
    expect(changed).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Start speech input" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button"));
    act(() => {
      lateResult?.({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: "Still late" } }] });
      NativeRecognition.last.onresult?.({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: "Fresh" } }] });
    });
    expect(changed.mock.calls).toEqual([["Fresh"]]);
  });

  it("rejects saved recorder stop callbacks after a terminal recording failure", async () => {
    vi.stubGlobal("MediaRecorder", NativeRecorder);
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: async () => ({ getTracks: () => [{ stop: vi.fn() }] }) } });
    const recorded = vi.fn(async () => "Unexpected");
    const changed = vi.fn();
    render(<SpeechInput onAudioRecorded={recorded} onTranscriptionChange={changed} />);
    await userEvent.click(screen.getByRole("button"));
    const recorder = NativeRecorder.last;
    const lateStop = recorder.onstop;
    act(() => recorder.ondataavailable?.({ data: new Blob(["dummy"]) }));
    act(() => recorder.onerror?.());
    await act(async () => lateStop?.());
    expect(recorded).not.toHaveBeenCalled();
    expect(changed).not.toHaveBeenCalled();
  });

  it("consumes recorder completion once while processing and after success", async () => {
    vi.stubGlobal("MediaRecorder", NativeRecorder);
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: async () => ({ getTracks: () => [{ stop: vi.fn() }] }) } });
    let finish!: (text: string) => void;
    const recorded = vi.fn(() => new Promise<string>(resolve => { finish = resolve; }));
    const changed = vi.fn();
    render(<SpeechInput onAudioRecorded={recorded} onTranscriptionChange={changed} />);
    await userEvent.click(screen.getByRole("button"));
    const lateStop = NativeRecorder.last.onstop;
    const lateStart = NativeRecorder.last.onstart;
    const lateError = NativeRecorder.last.onerror;
    await userEvent.click(screen.getByRole("button"));
    act(() => { lateStop?.(); lateStart?.(); lateError?.(); });
    expect(recorded).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
    await act(async () => finish("Finished"));
    await act(async () => lateStop?.());
    expect(recorded).toHaveBeenCalledOnce();
    expect(changed.mock.calls).toEqual([["Finished"]]);
  });

  it("exposes an accessible host-controlled speech toggle", async () => {
    render(<SpeechInput />);
    const button = screen.getByRole("button", { name: "Start speech input" });
    await userEvent.click(button);
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(button).toBeDisabled();
  });

  it("waits for native start, emits only new final results and cleans up on unmount", () => {
    vi.stubGlobal("SpeechRecognition", NativeRecognition);
    const changed = vi.fn();
    const view = render(<SpeechInput onTranscriptionChange={changed} lang="fr-FR" />);
    fireEvent.click(screen.getByRole("button"));
    const recognition = NativeRecognition.last;
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
    act(() => recognition.onstart?.());
    expect(screen.getByRole("button", { name: "Stop speech input" })).toHaveAttribute("aria-pressed", "true");
    expect(recognition.lang).toBe("fr-FR");
    act(() => recognition.onresult?.({ resultIndex: 1, results: [{ isFinal: true, 0: { transcript: "old" } }, { isFinal: false, 0: { transcript: "interim" } }, { isFinal: true, 0: { transcript: "Bonjour" } }] }));
    expect(changed.mock.calls).toEqual([["Bonjour"]]);
    view.unmount();
    expect(recognition.abort).toHaveBeenCalledOnce();
    expect(recognition.onresult).toBeNull();
  });

  it("allows host refusal and reports native permission errors without fake recording", () => {
    vi.stubGlobal("SpeechRecognition", NativeRecognition);
    const view = render(<SpeechInput onClick={event => event.preventDefault()} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).not.toHaveAttribute("aria-busy", "true");
    view.rerender(<SpeechInput />);
    fireEvent.click(screen.getByRole("button"));
    act(() => NativeRecognition.last.onerror?.({ error: "not-allowed" }));
    expect(screen.getByRole("alert")).toHaveTextContent("not-allowed");
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });

  it("records native audio, releases tracks and awaits host transcription", async () => {
    vi.stubGlobal("SpeechRecognition", undefined);
    vi.stubGlobal("webkitSpeechRecognition", undefined);
    vi.stubGlobal("MediaRecorder", NativeRecorder);
    const stop = vi.fn();
    const getUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [{ stop }] });
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
    let finish!: (text: string) => void;
    const recorded = vi.fn<(audio: Blob) => Promise<string>>(() => new Promise<string>(resolve => { finish = resolve; }));
    const changed = vi.fn();
    render(<SpeechInput onAudioRecorded={recorded} onTranscriptionChange={changed} />);
    await userEvent.click(screen.getByRole("button", { name: "Start speech input" }));
    expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(screen.getByRole("button", { name: "Stop speech input" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "Stop speech input" }));
    expect(stop).toHaveBeenCalledOnce();
    expect(recorded.mock.calls[0]?.[0]).toBeInstanceOf(Blob);
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
    await act(async () => finish("Transcript"));
    expect(changed).toHaveBeenCalledWith("Transcript");
    expect(screen.getByRole("button", { name: "Start speech input" })).toBeEnabled();
  });

  it("disposes permission results arriving after unmount", async () => {
    vi.stubGlobal("SpeechRecognition", undefined);
    vi.stubGlobal("webkitSpeechRecognition", undefined);
    vi.stubGlobal("MediaRecorder", NativeRecorder);
    let grant!: (stream: unknown) => void;
    const stop = vi.fn();
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: () => new Promise(resolve => { grant = resolve; }) } });
    const recorded = vi.fn();
    const view = render(<SpeechInput onAudioRecorded={recorded} />);
    fireEvent.click(screen.getByRole("button"));
    view.unmount();
    await act(async () => grant({ getTracks: () => [{ stop }] }));
    expect(stop).toHaveBeenCalledOnce();
    expect(recorded).not.toHaveBeenCalled();
  });

  it("stops native capture when disabled and ignores stale transcription completion", async () => {
    vi.stubGlobal("MediaRecorder", NativeRecorder);
    const stop = vi.fn();
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: async () => ({ getTracks: () => [{ stop }] }) } });
    let finish!: (text: string) => void;
    const recorded = () => new Promise<string>(resolve => { finish = resolve; });
    const changed = vi.fn();
    const view = render(<SpeechInput onAudioRecorded={recorded} onTranscriptionChange={changed} />);
    await userEvent.click(screen.getByRole("button"));
    view.rerender(<SpeechInput disabled onAudioRecorded={recorded} onTranscriptionChange={changed} />);
    expect(stop).toHaveBeenCalledOnce();
    view.rerender(<SpeechInput onAudioRecorded={recorded} onTranscriptionChange={changed} />);
    await userEvent.click(screen.getByRole("button"));
    await userEvent.click(screen.getByRole("button"));
    view.unmount();
    await act(async () => finish("Stale"));
    expect(changed).not.toHaveBeenCalled();
  });

  it("surfaces a host transcription rejection and permits retry", async () => {
    vi.stubGlobal("MediaRecorder", NativeRecorder);
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: async () => ({ getTracks: () => [{ stop: vi.fn() }] }) } });
    render(<SpeechInput onAudioRecorded={async () => { throw new Error("Host unavailable"); }} />);
    await userEvent.click(screen.getByRole("button"));
    await userEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Host unavailable"));
    expect(screen.getByRole("button")).toBeEnabled();
  });
});
