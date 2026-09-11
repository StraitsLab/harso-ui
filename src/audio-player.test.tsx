import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { AudioPlayer, AudioPlayerControlBar, AudioPlayerDurationDisplay, AudioPlayerElement, AudioPlayerMuteButton, AudioPlayerPlayButton, AudioPlayerSeekBackwardButton, AudioPlayerSeekForwardButton, AudioPlayerTimeDisplay, AudioPlayerTimeRange, AudioPlayerVolumeRange } from "./audio-player";

describe("AudioPlayer", () => {
  it("seeks through native media without calling hooks in event handlers", () => {
    render(<AudioPlayer><AudioPlayerElement src="/speech.mp3" /><AudioPlayerSeekBackwardButton /><AudioPlayerSeekForwardButton /></AudioPlayer>);
    const audio = document.querySelector("audio")!;
    Object.defineProperty(audio, "duration", { configurable: true, value: 20 });
    act(() => audio.dispatchEvent(new Event("loadedmetadata")));
    audio.currentTime = 5;
    fireEvent.click(screen.getByRole("button", { name: "Seek backward 10 seconds" }));
    expect(audio.currentTime).toBe(0);
    audio.currentTime = 15;
    fireEvent.click(screen.getByRole("button", { name: "Seek forward 10 seconds" }));
    expect(audio.currentTime).toBe(20);
  });

  it("lets the host refuse native play, mute, seek and volume requests", () => {
    const refuse = (event: { preventDefault: () => void }) => event.preventDefault();
    render(<AudioPlayer><AudioPlayerElement src="/speech.mp3" /><AudioPlayerPlayButton onClick={refuse} /><AudioPlayerMuteButton onClick={refuse} /><AudioPlayerSeekForwardButton onClick={refuse} /><AudioPlayerTimeRange onChange={refuse} /><AudioPlayerVolumeRange onChange={refuse} /></AudioPlayer>);
    const audio = document.querySelector("audio")!;
    const play = vi.spyOn(audio, "play").mockResolvedValue();
    Object.defineProperty(audio, "duration", { configurable: true, value: 20 });
    act(() => audio.dispatchEvent(new Event("loadedmetadata")));
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    fireEvent.click(screen.getByRole("button", { name: "Mute" }));
    fireEvent.click(screen.getByRole("button", { name: "Seek forward 10 seconds" }));
    fireEvent.change(screen.getByRole("slider", { name: "Seek" }), { target: { value: "5" } });
    fireEvent.change(screen.getByRole("slider", { name: "Volume" }), { target: { value: "0.5" } });
    expect(play).not.toHaveBeenCalled();
    expect(audio.currentTime).toBe(0);
    expect(audio.muted).toBe(false);
    expect(audio.volume).toBe(1);
  });

  it("handles native playback refusal without claiming playback", async () => {
    render(<AudioPlayer><AudioPlayerElement src="/speech.mp3" /><AudioPlayerPlayButton /></AudioPlayer>);
    vi.spyOn(document.querySelector("audio")!, "play").mockRejectedValue(new Error("Playback denied"));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Play" })));
    expect(screen.getByRole("alert")).toHaveTextContent("Playback denied");
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
  });

  it("disables unavailable controls and resets finite metadata when media empties", () => {
    const view = render(<AudioPlayer><AudioPlayerPlayButton /><AudioPlayerTimeRange /></AudioPlayer>);
    expect(screen.getByRole("button", { name: "Play" })).toBeDisabled();
    view.rerender(<AudioPlayer><AudioPlayerElement src="/speech.mp3" /><AudioPlayerPlayButton /><AudioPlayerTimeRange /><AudioPlayerDurationDisplay /></AudioPlayer>);
    const audio = document.querySelector("audio")!;
    Object.defineProperty(audio, "duration", { configurable: true, value: Infinity });
    act(() => audio.dispatchEvent(new Event("durationchange")));
    expect(screen.getByRole("slider", { name: "Seek" })).toHaveAttribute("max", "0");
    Object.defineProperty(audio, "duration", { configurable: true, value: 30 });
    act(() => audio.dispatchEvent(new Event("durationchange")));
    expect(screen.getByText("0:30")).toBeInTheDocument();
    Object.defineProperty(audio, "duration", { configurable: true, value: NaN });
    act(() => audio.dispatchEvent(new Event("emptied")));
    expect(screen.getByText("0:00")).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Seek" })).toBeDisabled();
  });

  it("accepts speech result MIME data and forwards the native element ref", () => {
    const ref = createRef<HTMLAudioElement>();
    const view = render(<AudioPlayer><AudioPlayerElement ref={ref} data={{ base64: "UklGRg==", mediaType: "audio/wav" }} /></AudioPlayer>);
    expect(ref.current).toBe(document.querySelector("audio"));
    expect(ref.current).toHaveAttribute("src", "data:audio/wav;base64,UklGRg==");
    view.unmount();
    expect(ref.current).toBeNull();
  });

  it("reports missing sources, native loading and load errors without invented media", () => {
    const view = render(<AudioPlayer><AudioPlayerElement /><AudioPlayerPlayButton /></AudioPlayer>);
    expect(screen.getByRole("button", { name: "Play" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("No audio source");
    view.rerender(<AudioPlayer><AudioPlayerElement src="/speech.mp3" /><AudioPlayerPlayButton /></AudioPlayer>);
    const audio = document.querySelector("audio")!;
    act(() => audio.dispatchEvent(new Event("loadstart")));
    expect(screen.getByRole("status")).toHaveTextContent("Loading audio");
    Object.defineProperty(audio, "error", { configurable: true, value: { message: "Unsupported audio" } });
    act(() => audio.dispatchEvent(new Event("error")));
    expect(screen.getByRole("alert")).toHaveTextContent("Unsupported audio");
    Object.defineProperty(audio, "error", { configurable: true, value: null });
    Object.defineProperty(audio, "readyState", { configurable: true, value: 2 });
    act(() => audio.dispatchEvent(new Event("loadstart")));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play" })).toBeEnabled();
  });
  it("renders a host-owned native audio surface and controls", () => {
    render(<AudioPlayer><AudioPlayerElement src="https://example.com/audio.mp3" /><AudioPlayerControlBar><AudioPlayerPlayButton /><AudioPlayerTimeRange /></AudioPlayerControlBar></AudioPlayer>);
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Seek" })).toBeInTheDocument();
  });

  it("reflects native ended events in the play control", () => {
    render(<AudioPlayer><AudioPlayerElement /><AudioPlayerControlBar><AudioPlayerPlayButton /><AudioPlayerTimeDisplay /></AudioPlayerControlBar></AudioPlayer>);
    const audio = document.querySelector("audio")!;
    Object.defineProperty(audio, "paused", { configurable: true, value: false });
    act(() => audio.dispatchEvent(new Event("play")));
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
    Object.defineProperty(audio, "paused", { configurable: true, value: true });
    act(() => audio.dispatchEvent(new Event("ended")));
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
  });

  it("reflects native volume changes in the mute control", () => {
    render(<AudioPlayer><AudioPlayerElement /><AudioPlayerControlBar><AudioPlayerPlayButton /><AudioPlayerMuteButton /></AudioPlayerControlBar></AudioPlayer>);
    const audio = document.querySelector("audio")!;
    Object.defineProperty(audio, "muted", { configurable: true, value: true, writable: true });
    act(() => audio.dispatchEvent(new Event("volumechange")));
    expect(screen.getByRole("button", { name: "Unmute" })).toBeInTheDocument();
  });
});
