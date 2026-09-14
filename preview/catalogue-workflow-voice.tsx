import { useState, type ReactNode } from "react";
import { AudioPlayer, AudioPlayerElement, AudioPlayerPlayButton, AudioPlayerControlBar, AudioPlayerTimeDisplay, AudioPlayerTimeRange, AudioPlayerDurationDisplay, Button, Checkbox, Node, NodeHeader, NodeTitle, NodeContent, Toolbar, Transcription } from "@harso/ui";
import { MagnifyingGlassIcon, UploadSimpleIcon, CopyIcon, TrashIcon, CursorClickIcon, StackIcon } from "@phosphor-icons/react";
import { SelectorsExample } from "./selectors-examples";
import { SpeechInputExample } from "./native-speech-examples";
import { PersonaExample } from "./persona-example";
import { CanvasExample } from "./canvas-example";
import type { ExampleState } from "./examples";

// Real PCM audio generated locally: no network, permission or external asset.
function sampleChime() {
  const rate = 8000, seconds = 12, buffer = new ArrayBuffer(44 + rate * seconds * 2), view = new DataView(buffer);
  const text = (offset: number, value: string) => [...value].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));
  text(0, "RIFF"); view.setUint32(4, buffer.byteLength - 8, true); text(8, "WAVE"); text(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); text(36, "data"); view.setUint32(40, rate * seconds * 2, true);
  for (let i = 0; i < rate * seconds; i++) { const t = i / rate, note = [261.63, 329.63, 392, 523.25][Math.floor(t) % 4]; view.setInt16(44 + i * 2, Math.sin(t * note * Math.PI * 2) * Math.exp(-4 * (t % 1)) * Math.min(1, (t % 1) * 100) * 5000, true); }
  return `data:audio/wav;base64,${btoa(Array.from(new Uint8Array(buffer), byte => String.fromCharCode(byte)).join(""))}`;
}
function AudioExample({ state }: { state: ExampleState }) {
  const [source] = useState(sampleChime);
  const [empty, setEmpty] = useState(false);
  return <div className="hkl-example-stack"><div className="hk-data-toolbar"><Checkbox label="Empty audio source" checked={empty} onChange={e => setEmpty(e.target.checked)} /></div><AudioPlayer className="hk-audio-example"><div className="hk-audio-heading"><strong>Studio chime</strong><span>Local audio · PCM WAV</span></div><AudioPlayerElement key={empty ? "empty" : "sample"} src={empty ? undefined : source} /><AudioPlayerControlBar aria-label="Playback controls"><AudioPlayerPlayButton disabled={state === "disabled"} /><AudioPlayerTimeDisplay /><AudioPlayerTimeRange disabled={state === "disabled"} /><AudioPlayerDurationDisplay /></AudioPlayerControlBar><small>12-second synthesized sample. Press play to listen.</small></AudioPlayer></div>;
}
function TranscriptExample() {
  const [time, setTime] = useState(3);
  return <section className="hk-transcription-example" aria-label="Meeting transcript"><header><strong>Project update</strong><span>00:{String(time).padStart(2, "0")} / 00:09</span></header><Transcription currentTime={time} onSeek={setTime} segments={[{ text: "The brief", startSecond: 0, endSecond: 1 }, { text: "is ready.", startSecond: 1, endSecond: 2 }, { text: "Work is", startSecond: 2, endSecond: 3 }, { text: "progressing.", startSecond: 3, endSecond: 5 }, { text: "Next, review", startSecond: 5, endSecond: 7 }, { text: "the references.", startSecond: 7, endSecond: 9 }]} /><small>Select a phrase to move the playhead.</small></section>;
}
function WorkflowToolbarExample({ state }: { state: ExampleState }) {
  const [hold, setHold] = useState(false), [locked, setLocked] = useState(false), [visible, setVisible] = useState(true), [count, setCount] = useState(1), [result, setResult] = useState("1 local item selected.");
  const disabled = locked || state === "disabled";
  const act = (action: "Inspect" | "Duplicate" | "Remove") => { if (disabled) return; if (hold) { setResult(`${action} requested; host retained ${count} local items.`); return; } if (action === "Duplicate") setCount(count + 1); if (action === "Remove") setVisible(false); setResult(action === "Duplicate" ? `${count + 1} local items. Duplicate accepted locally.` : `${action} accepted locally.`); };
  return <div className="hkl-example-stack"><div className="hk-data-toolbar"><Checkbox label="Hold toolbar changes" checked={hold} onChange={e => setHold(e.target.checked)} /><Checkbox label="Disable toolbar" checked={locked} onChange={e => setLocked(e.target.checked)} /></div><p>{visible ? "Selected: Project brief" : "No selection. Select the sample to show its tools."}</p><Toolbar aria-label="Selection actions" isVisible={visible}>
    <Button variant="secondary" disabled={disabled} aria-label="Inspect selection" onClick={() => act("Inspect")}><MagnifyingGlassIcon size={16} aria-hidden />Inspect</Button><Button variant="secondary" disabled aria-label="Publish unavailable"><UploadSimpleIcon size={16} aria-hidden />Publish</Button><Button variant="secondary" disabled={disabled} aria-label="Duplicate selection" onClick={() => act("Duplicate")}><CopyIcon size={16} aria-hidden />Duplicate</Button><Button variant="secondary" disabled={disabled} aria-label="Remove selection" onClick={() => act("Remove")}><TrashIcon size={16} aria-hidden />Remove</Button>
    </Toolbar>{!visible && <Button disabled={disabled} onClick={() => { if (hold) setResult("Selection requested; host retained no selection."); else { setVisible(true); setCount(1); setResult("1 local item selected."); } }}><CursorClickIcon size={16} aria-hidden />Select sample</Button>}<output aria-label="Toolbar result" aria-live="polite">{result}</output><small>Local selection only.</small></div>;
}
export function renderWorkflowVoice(component: string, state: ExampleState = "default"): ReactNode | undefined {
  if (component === "AudioPlayer") return <AudioExample state={state} />;
  if (component === "Canvas" || component === "Controls") return <CanvasExample state={state} />;
  if (component === "Connection") return <CanvasExample state={state} relationship="connection" />;
  if (component === "Edge") return <CanvasExample state={state} relationship="edge" />;
  if (component === "Node") return <Node style={{ width: 300, maxWidth: "100%" }}><NodeHeader><NodeTitle><StackIcon size={16} aria-hidden />Work unit</NodeTitle></NodeHeader><NodeContent>Live node content</NodeContent></Node>;
  if (component === "Panel") return <CanvasExample state={state} inspector />;
  if (component === "SpeechInput") return <SpeechInputExample disabled={state === "disabled"} />;
  if (component === "Toolbar") return <WorkflowToolbarExample state={state} />;
  if (component === "Transcription") return <TranscriptExample />;
  if (component === "MicSelector" || component === "VoiceSelector") return <SelectorsExample component={component} state={state} />;
  if (component === "Persona") return <PersonaExample state={state} />;
  return undefined;
}
