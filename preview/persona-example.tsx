import { useState } from "react";
import { Persona, Select, Checkbox, type PersonaState, type PersonaVariant } from "@harso/ui";
import type { ExampleState } from "./examples";

const variants: PersonaVariant[] = ["obsidian", "mana", "opal", "halo", "glint", "command"];
export function PersonaExample({ state }: { state: ExampleState }) {
  const [variant, setVariant] = useState<PersonaVariant>("obsidian");
  const [activity, setActivity] = useState<PersonaState>("idle");
  const [paused, setPaused] = useState(false);
  const [events, setEvents] = useState<string[]>([]);
  const record = (event: string) => setEvents(previous => [...previous.slice(-7), event]);
  return <div className="hk-persona-example">
    <p>Original, asset-free visuals. State is supplied by the host; nothing here listens, records or runs a model.</p>
    <div className="hk-persona-controls">
      <label>Visual<Select aria-label="Persona variant" value={variant} onChange={event => setVariant(event.target.value as PersonaVariant)}>{variants.map(value => <option key={value}>{value}</option>)}</Select></label>
      <label>State<Select aria-label="Persona state" value={activity} onChange={event => setActivity(event.target.value as PersonaState)}>{["idle", "listening", "thinking", "speaking", "asleep"].map(value => <option key={value}>{value}</option>)}</Select></label>
      <Checkbox label="Pause animation" checked={paused} onChange={event => setPaused(event.target.checked)} />
    </div>
    <div className="hk-persona-stage"><Persona variant={variant} state={activity} paused={paused || state === "disabled"} size={160} onReady={() => record("ready")} onPlay={() => record("play")} onPause={() => record("pause")} onStop={() => record("stop")} />
    <output aria-label="Persona lifecycle">{events.length ? `Renderer ${events.join(" · ")}` : "Waiting for renderer"}</output></div>
    <p>All six treatments · static comparison</p>
    <div className="hk-persona-gallery">{variants.map(value => <figure key={value}><Persona variant={value} state={activity} paused size={112} aria-label={`${value} ${activity}`} /><figcaption>{value}</figcaption></figure>)}</div>
    <p>Reduced motion uses a still visual. Ready/play/pause/stop describe this renderer, not a remote asset or agent lifecycle.</p>
  </div>;
}
