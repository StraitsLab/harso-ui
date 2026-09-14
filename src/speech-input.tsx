import { useEffect, useId, useRef, useState, type ComponentPropsWithRef } from "react";
import { MicrophoneIcon, StopIcon } from "@phosphor-icons/react";
import { Button } from "./primitives";

type Recognition = {
  continuous: boolean; interimResults: boolean; lang: string;
  start: () => void; stop: () => void; abort: () => void;
  onstart: (() => void) | null; onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult: ((event: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
};
type RecognitionConstructor = new () => Recognition;
export type SpeechInputProps = ComponentPropsWithRef<typeof Button> & { onTranscriptionChange?: (text: string) => void; onAudioRecorded?: (audio: Blob) => Promise<string>; lang?: string };

export function SpeechInput({ onTranscriptionChange, onAudioRecorded, lang = "en-US", children, disabled, ...props }: SpeechInputProps) {
  const [status, setStatus] = useState<"idle" | "requesting" | "listening" | "processing">("idle");
  const [error, setError] = useState<string | null>(null);
  const errorId = useId();
  const generation = useRef(0);
  const release = useRef<(() => void) | null>(null);
  const stop = useRef<(() => void) | null>(null);
  const pending = useRef(false);
  const callbacks = useRef({ onTranscriptionChange, onAudioRecorded });
  useEffect(() => { callbacks.current = { onTranscriptionChange, onAudioRecorded }; }, [onTranscriptionChange, onAudioRecorded]);
  useEffect(() => {
    setStatus("idle");
    return () => {
      generation.current++;
      release.current?.();
      release.current = null;
      stop.current = null;
      pending.current = false;
    };
  }, [disabled, lang]);
  const native = globalThis as typeof globalThis & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  const Constructor = native.SpeechRecognition ?? native.webkitSpeechRecognition;
  const recorderAvailable = !!onAudioRecorded && typeof MediaRecorder !== "undefined" && typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
  const available = onAudioRecorded ? recorderAvailable : !!Constructor;
  const listening = status === "listening";
  const busy = status === "requesting" || status === "processing";

  const toggle = async () => {
    if (stop.current) { stop.current(); return; }
    if (pending.current || disabled || !available) return;
    pending.current = true;
    const run = ++generation.current;
    const current = () => generation.current === run;
    const failed = (reason: unknown) => {
      if (!current()) return;
      generation.current++;
      release.current?.();
      release.current = null;
      stop.current = null;
      pending.current = false;
      setStatus("idle");
      setError(reason instanceof Error ? reason.message : String(reason));
    };
    setError(null);
    setStatus("requesting");
    try {
      if (!onAudioRecorded && Constructor) {
        const instance = new Constructor();
        instance.continuous = true;
        instance.interimResults = true;
        instance.lang = lang;
        release.current = () => {
          instance.onstart = instance.onend = instance.onerror = instance.onresult = null;
          instance.abort();
        };
        instance.onstart = () => { if (current()) { pending.current = false; stop.current = () => instance.stop(); setStatus("listening"); } };
        instance.onresult = event => {
          if (!current()) return;
          for (let index = event.resultIndex; index < event.results.length; index++) {
            const result = event.results[index];
            if (result?.isFinal && result[0]?.transcript.trim()) callbacks.current.onTranscriptionChange?.(result[0].transcript);
          }
        };
        instance.onerror = event => failed(`Speech input failed: ${event.error}`);
        instance.onend = () => {
          if (!current()) return;
          generation.current++;
          instance.onstart = instance.onend = instance.onerror = instance.onresult = null;
          release.current = null;
          stop.current = null;
          pending.current = false;
          setStatus("idle");
        };
        instance.start();
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const releaseTracks = () => stream.getTracks().forEach(track => track.stop());
      if (!current()) { releaseTracks(); return; }
      release.current = releaseTracks;
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      release.current = () => {
        recorder.onstart = recorder.onstop = recorder.onerror = recorder.ondataavailable = null;
        try { if (recorder.state !== "inactive") recorder.stop(); } finally { releaseTracks(); }
      };
      recorder.onstart = () => { if (current() && release.current) { pending.current = false; stop.current = () => { stop.current = null; pending.current = true; setStatus("processing"); recorder.stop(); }; setStatus("listening"); } };
      recorder.ondataavailable = event => { if (current() && release.current && event.data.size) chunks.push(event.data); };
      recorder.onerror = () => { if (release.current) failed("Audio recording failed."); };
      recorder.onstop = async () => {
        if (!current() || !release.current) return;
        release.current?.();
        release.current = null;
        stop.current = null;
        pending.current = true;
        setStatus("processing");
        try {
          if (!chunks.length) throw new Error("No audio was recorded. Try again.");
          const text = await callbacks.current.onAudioRecorded?.(new Blob(chunks, { type: recorder.mimeType || chunks[0].type }));
          if (current()) { if (text) callbacks.current.onTranscriptionChange?.(text); generation.current++; pending.current = false; setStatus("idle"); }
        } catch (reason) { failed(reason); }
      };
      recorder.start();
    } catch (reason) { failed(reason); }
  };
  return <><Button variant="primary" {...props} pending={busy || props.pending} disabled={disabled || !available} type="button" aria-pressed={listening} aria-describedby={[props["aria-describedby"], error ? errorId : undefined].filter(Boolean).join(" ") || undefined} aria-label={props["aria-label"] ?? (listening ? "Stop speech input" : "Start speech input")} className={`${listening ? "hk-speech-input--listening" : ""} ${props.className ?? ""}`} onClick={event => { props.onClick?.(event); if (!event.defaultPrevented) void toggle(); }}>{listening ? <StopIcon size={16} aria-hidden /> : <MicrophoneIcon size={16} aria-hidden />}{children ?? (status === "requesting" ? "Requesting microphone…" : status === "processing" ? "Transcribing…" : listening ? "Stop" : "Speak")}</Button>{error && <span id={errorId} role="alert">{error}</span>}</>;
}
