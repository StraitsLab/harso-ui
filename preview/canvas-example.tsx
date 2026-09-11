import { useState } from "react";
import { Button, Canvas, Checkbox, Controls, Node, NodeContent, NodeHeader, NodeTitle, type CanvasViewport } from "@harso/ui";
import type { ExampleState } from "./examples";

const initial = { x: 0, y: 0, zoom: 1 };
export function CanvasExample({ state }: { state: ExampleState }) {
  const [viewport, setViewport] = useState<CanvasViewport>(initial);
  const [selection, setSelection] = useState<string[]>([]);
  const [hold, setHold] = useState(false);
  const disabled = state === "disabled";
  return <div className="hkl-example-stack"><Checkbox label="Keep supplied canvas state" checked={hold} disabled={disabled} onChange={event => setHold(event.target.checked)} /><Canvas aria-label="Work canvas" disabled={disabled} viewport={viewport} onViewportChange={next => { if (!hold) setViewport(next); }} selectedIds={selection} onSelectionChange={next => { if (!hold) setSelection(next); }} overlay={<Controls showInteractive />} style={{ minHeight: 320 }}><Node nodeId="research" style={{ position: "absolute", left: 28, top: 68, width: 220 }}><NodeHeader><NodeTitle>Research</NodeTitle></NodeHeader><NodeContent>{state === "long-content" ? "An independently supplied work unit with a longer description of the research and supporting evidence." : "Supplied work unit"}</NodeContent></Node><Node nodeId="result" style={{ position: "absolute", left: 308, top: 158, width: 220 }}><NodeHeader><NodeTitle>Result</NodeTitle></NodeHeader><NodeContent>Illustrative result · no running task</NodeContent></Node></Canvas><output aria-label="Canvas viewport">{Math.round(viewport.zoom * 100)}% · {Math.round(viewport.x)}, {Math.round(viewport.y)}</output><output aria-label="Canvas selection">{selection.length ? selection.join(", ") : "Nothing selected"}</output><Button disabled={disabled} onClick={() => { if (!hold) { setViewport(initial); setSelection([]); } }}>Reset canvas</Button></div>;
}
