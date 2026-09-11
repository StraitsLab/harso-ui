import { useEffect, useRef, useState } from "react";
import { Button, SpeechInput } from "@harso/ui";

export function SpeechInputExample({ disabled = false }: { disabled?: boolean }) {
  const [transcript, setTranscript] = useState("");
  return <section aria-label="Native speech input example">
    <p>Your browser may send audio to its speech service. Use dummy speech only. Nothing starts until you press Start.</p>
    <SpeechInput disabled={disabled} onTranscriptionChange={text => setTranscript(previous => previous ? `${previous} ${text}` : text)} />
    <output aria-label="Speech transcript" aria-live="polite">{transcript || "No transcript yet."}</output>
    <Button disabled={disabled || !transcript} onClick={() => setTranscript("")}>Clear transcript</Button>
  </section>;
}

export function useLocalReadAloud(context: string, disabled: boolean) {
  const [reading, setReading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const release = () => {
    if (!utterance.current) return;
    utterance.current.onend = utterance.current.onerror = null;
    utterance.current = null;
    window.speechSynthesis.cancel();
  };
  useEffect(() => {
    setReading(null);
    setError(null);
    return release;
  }, [context, disabled]);
  const read = (text: string, index: number) => {
    if (disabled) return;
    const stopping = reading === index;
    release();
    setReading(null);
    setError(null);
    if (stopping) return;
    try {
      if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) throw new Error("Read aloud is unavailable in this browser.");
      const voice = window.speechSynthesis.getVoices().find(candidate => candidate.localService && candidate.lang.startsWith("en"));
      if (!voice) throw new Error("No local voice is available. Enable an English system voice and try again.");
      const next = new SpeechSynthesisUtterance(text);
      next.voice = voice;
      next.lang = voice.lang;
      const finished = (failure?: string) => {
        if (utterance.current !== next) return;
        next.onend = next.onerror = null;
        utterance.current = null;
        setReading(null);
        if (failure) setError(`Read aloud failed: ${failure}`);
      };
      next.onend = () => finished();
      next.onerror = event => finished(event.error);
      utterance.current = next;
      setReading(index);
      window.speechSynthesis.speak(next);
    } catch (reason) {
      release();
      setReading(null);
      setError(reason instanceof Error ? reason.message : "Read aloud failed.");
    }
  };
  return { reading, error, read };
}
