import { createContext, useCallback, useContext, useEffect, useState, type ComponentPropsWithRef } from "react";

type AudioState = { audio: HTMLAudioElement | null; setAudio: (audio: HTMLAudioElement | null) => void; available: boolean; playing: boolean; duration: number; current: number; muted: boolean; volume: number; setError: (error: string | null) => void };
const AudioValue = createContext<AudioState | null>(null);
function useAudio() { const value = useContext(AudioValue); if (!value) throw new Error("AudioPlayer parts require AudioPlayer."); return value; }
function finiteTime(value: number) { return Number.isFinite(value) ? Math.max(0, value) : 0; }
function formatTime(value: number) { return `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, "0")}`; }

export function AudioPlayer({ children, className = "", ...props }: ComponentPropsWithRef<"div">) {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [state, setState] = useState({ available: false, loading: false, playing: false, duration: 0, current: 0, muted: false, volume: 1 });
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!audio) { setState({ available: false, loading: false, playing: false, duration: 0, current: 0, muted: false, volume: 1 }); return; }
    const sync = () => {
      const available = !!(audio.currentSrc || audio.getAttribute("src") || audio.querySelector("source[src]"));
      setState({ available, loading: available && audio.readyState === 0 && !audio.error, playing: !audio.paused && !audio.ended, duration: finiteTime(audio.duration), current: finiteTime(audio.currentTime), muted: audio.muted, volume: audio.volume });
    };
    const failed = () => { setError(audio.error?.message || "Audio could not be loaded."); sync(); };
    const clearError = () => setError(null);
    const events = ["timeupdate", "loadedmetadata", "loadeddata", "loadstart", "canplay", "durationchange", "emptied", "play", "pause", "ended", "volumechange"];
    sync();
    events.forEach(event => audio.addEventListener(event, sync));
    audio.addEventListener("error", failed);
    audio.addEventListener("loadstart", clearError);
    audio.addEventListener("play", clearError);
    return () => {
      events.forEach(event => audio.removeEventListener(event, sync));
      audio.removeEventListener("error", failed);
      audio.removeEventListener("loadstart", clearError);
      audio.removeEventListener("play", clearError);
    };
  }, [audio]);
  return <AudioValue value={{ audio, setAudio, ...state, setError }}><div {...props} className={`hk-audio-player ${className}`}>{children}{error ? <span role="alert">{error}</span> : !state.available ? <span role="status">No audio source</span> : state.loading ? <span role="status">Loading audio…</span> : null}</div></AudioValue>;
}
export function AudioPlayerElement({ data, src, ref, ...props }: ComponentPropsWithRef<"audio"> & { data?: string | { base64: string; mediaType: string } }) {
  const { setAudio } = useAudio();
  const attach = useCallback((element: HTMLAudioElement | null) => {
    setAudio(element);
    const cleanup = typeof ref === "function" ? ref(element) : undefined;
    if (ref && typeof ref !== "function") ref.current = element;
    return () => {
      setAudio(null);
      if (typeof cleanup === "function") cleanup();
      else if (typeof ref === "function") ref(null);
      else if (ref) ref.current = null;
    };
  }, [ref, setAudio]);
  const source = typeof data === "string" ? `data:audio/mpeg;base64,${data}` : data ? `data:${data.mediaType};base64,${data.base64}` : src;
  return <audio {...props} ref={attach} src={source} preload={props.preload ?? "metadata"} />;
}
export function AudioPlayerControlBar({ className = "", ...props }: ComponentPropsWithRef<"div">) { return <div {...props} role="group" className={`hk-audio-control-bar ${className}`} />; }
export function AudioPlayerPlayButton({ className = "", ...props }: ComponentPropsWithRef<"button">) {
  const { audio, available, playing, setError } = useAudio();
  return <button {...props} type="button" disabled={props.disabled || !audio || !available} className={`hk-audio-button ${className}`} onClick={async event => {
    props.onClick?.(event);
    if (event.defaultPrevented || !audio) return;
    try { if (playing) audio.pause(); else await audio.play(); }
    catch (error) { setError(error instanceof Error ? error.message : "Audio playback was refused."); }
  }} aria-label={props["aria-label"] ?? (playing ? "Pause" : "Play")}>{playing ? "Ⅱ" : "▶"}</button>;
}
function seek(audio: HTMLAudioElement | null, offset: number) { if (audio && Number.isFinite(offset) && Number.isFinite(audio.duration)) audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + offset)); }
export function AudioPlayerSeekBackwardButton({ seekOffset = 10, className = "", ...props }: ComponentPropsWithRef<"button"> & { seekOffset?: number }) {
  const { audio, duration } = useAudio();
  return <button {...props} type="button" disabled={props.disabled || !audio || !duration} className={`hk-audio-button ${className}`} onClick={event => { props.onClick?.(event); if (!event.defaultPrevented) seek(audio, -seekOffset); }} aria-label={props["aria-label"] ?? `Seek backward ${seekOffset} seconds`}>↶ {seekOffset}</button>;
}
export function AudioPlayerSeekForwardButton({ seekOffset = 10, className = "", ...props }: ComponentPropsWithRef<"button"> & { seekOffset?: number }) {
  const { audio, duration } = useAudio();
  return <button {...props} type="button" disabled={props.disabled || !audio || !duration} className={`hk-audio-button ${className}`} onClick={event => { props.onClick?.(event); if (!event.defaultPrevented) seek(audio, seekOffset); }} aria-label={props["aria-label"] ?? `Seek forward ${seekOffset} seconds`}>↷ {seekOffset}</button>;
}
export function AudioPlayerTimeDisplay({ className = "", ...props }: ComponentPropsWithRef<"span">) { const { current } = useAudio(); return <span {...props} className={`hk-audio-time ${className}`}>{formatTime(current)}</span>; }
export function AudioPlayerTimeRange({ className = "", ...props }: ComponentPropsWithRef<"input">) { const { audio, current, duration } = useAudio(); return <input {...props} type="range" min={0} max={duration} step={0.1} value={Math.min(current, duration)} disabled={props.disabled || !audio || !duration} className={`hk-audio-range ${className}`} onChange={event => { props.onChange?.(event); if (!event.defaultPrevented && audio) audio.currentTime = Number(event.target.value); }} aria-label={props["aria-label"] ?? "Seek"} />; }
export function AudioPlayerDurationDisplay({ className = "", ...props }: ComponentPropsWithRef<"span">) { const { duration } = useAudio(); return <span {...props} className={`hk-audio-time ${className}`}>{formatTime(duration)}</span>; }
export function AudioPlayerMuteButton({ className = "", ...props }: ComponentPropsWithRef<"button">) { const { audio, muted } = useAudio(); return <button {...props} type="button" disabled={props.disabled || !audio} className={`hk-audio-button ${className}`} onClick={event => { props.onClick?.(event); if (!event.defaultPrevented && audio) audio.muted = !audio.muted; }} aria-label={props["aria-label"] ?? (muted ? "Unmute" : "Mute")}>{muted ? "Unmute" : "Mute"}</button>; }
export function AudioPlayerVolumeRange({ className = "", ...props }: ComponentPropsWithRef<"input">) { const { audio, volume } = useAudio(); return <input {...props} type="range" min={0} max={1} step={0.01} value={volume} disabled={props.disabled || !audio} className={`hk-audio-volume ${className}`} onChange={event => { props.onChange?.(event); if (!event.defaultPrevented && audio) audio.volume = Number(event.target.value); }} aria-label={props["aria-label"] ?? "Volume"} />; }
