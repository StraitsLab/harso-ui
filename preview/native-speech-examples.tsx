import { useEffect, useRef, useState } from "react";
import { Button, SpeechInput } from "@harso/ui";

export function SpeechInputExample({ disabled = false }: { disabled?: boolean }) {
  const [transcript, setTranscript] = useState("");
  return <section aria-label="Native speech input example">
    <p>Your browser may send audio to its speech service. Use dummy speech only. Nothing starts until you press Start.</p>
    <SpeechInput disabled={disabled} onTranscriptionChange={text => setTranscript(previous => previous ? `${previous} ${text}` : text)} />
    <output aria-label="Speech transcript" aria-live="polite">{transcript || "No transcript yet."}</output>
    <Button disabled={disabled || !transcript} onClick={() => setTranscript("")}>Clear transcript</Button>
    <ReadAloudHostExample disabled={disabled} />
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

/** Standalone host lifecycle fixture, not a chat-family speech API. */
export function ReadAloudHostExample({ disabled = false }: { disabled?: boolean }) {
  const [identity, setIdentity] = useState("Personal");
  const [view, setView] = useState("Conversation");
  const [locked, setLocked] = useState(false);
  const [refuse, setRefuse] = useState(false);
  const [mounted, setMounted] = useState(true);
  const [result, setResult] = useState("");
  const request = (change: () => void) => {
    setResult(refuse ? "Host refused change; identity and view retained." : "Host accepted change.");
    if (!refuse) change();
  };
  return <section aria-label="Read aloud host fixture" data-testid="read-aloud-host">
    <p>Read aloud uses an English local system voice only. No remote fallback.</p>
    <label>Speech identity <select aria-label="Speech identity" value={identity} onChange={event => request(() => setIdentity(event.target.value))}><option>Personal</option><option>Team</option></select></label>
    <label>Speech view <select aria-label="Speech view" value={view} onChange={event => request(() => setView(event.target.value))}><option>Conversation</option><option>Dashboard</option></select></label>
    <label><input type="checkbox" aria-label="Disable read aloud" checked={locked} onChange={event => setLocked(event.target.checked)} />Disable read aloud</label>
    <label><input type="checkbox" aria-label="Refuse speech host changes" checked={refuse} onChange={event => setRefuse(event.target.checked)} />Refuse speech host changes</label>
    <label><input type="checkbox" aria-label="Mount read aloud" checked={mounted} onChange={event => setMounted(event.target.checked)} />Mount read aloud</label>
    <output aria-label="Speech host result" data-testid="speech-host-result">{result}</output>
    {mounted && <ReadAloudSample context={`${identity}:${view}`} visible={view === "Conversation"} disabled={disabled || locked} />}
  </section>;
}

function ReadAloudSample({ context, visible, disabled }: { context: string; visible: boolean; disabled: boolean }) {
  const { reading, error, read } = useLocalReadAloud(context, disabled);
  return <div data-testid="read-aloud-sample">
    {visible && <><p>Keep the first experience quiet and useful.</p><Button disabled={disabled} aria-label={reading === 0 ? "Stop reading" : "Read aloud"} onClick={() => read("Keep the first experience quiet and useful.", 0)}>{reading === 0 ? "Stop reading" : "Read aloud"}</Button></>}
    <output aria-label="Read aloud state" data-testid="read-aloud-state">{reading === null ? "Idle" : "Reading"}</output>
    {error && <p role="alert">{error}</p>}
  </div>;
}
