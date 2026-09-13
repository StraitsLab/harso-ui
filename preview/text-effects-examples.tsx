import { useState } from "react";
import { Checkbox, Field, Input, Shimmer } from "../src";
import type { ExampleState } from "./examples";

export const textEffectsExports = ["Shimmer"] as const;
export type TextEffectsExport = typeof textEffectsExports[number];
export const textEffectsNotes: Record<TextEffectsExport, { behavior: string; example: string }> = {
  Shimmer: { behavior: "A restrained text sweep indicates an explicitly supplied waiting state, not invented progress. Static, duration, spread and semantic-element variants share the same legible tokens. Reduced motion and forced colors remove animation and gradient. An inactive state is plain text; no timers or model activity run inside the component.", example: '<Shimmer active={waiting} duration={2} spread={2} as="p">Waiting for a response</Shimmer>' },
};
export function TextEffectsExample({ component: _component, state: _state }: { component: TextEffectsExport; state: ExampleState }) {
  const [active, setActive] = useState(true);
  const [waitingText, setWaitingText] = useState("Making room for the next idea.");
  return <div className="hkc-stack"><Checkbox label="Waiting state" checked={active} onChange={event => setActive(event.target.checked)} /><Field label="Waiting text">{props => <Input {...props} value={waitingText} onChange={event => setWaitingText(event.target.value)} />}</Field><Shimmer as="h2" active={active}>{waitingText}</Shimmer><Shimmer as="p" active={active} duration={4} spread={4}>A slower, wider sweep.</Shimmer><Shimmer active={false}>Nothing is running in this example.</Shimmer></div>;
}
