import { useEffect, useRef, useState } from "react";
import { Button, Canvas, Checkbox, Connection, Controls, Edge, Node, NodeContent, NodeHeader, NodeTitle, Panel, type CanvasViewport } from "@harso/ui";
import { ArrowCounterClockwiseIcon, FileTextIcon, MagnifyingGlassIcon, SlidersHorizontalIcon } from "@phosphor-icons/react";
import type { ExampleState } from "./examples";

const initial = { x: 0, y: 0, zoom: 1 };
export function CanvasExample({ state, relationship, inspector = false }: { state: ExampleState; relationship?: "edge" | "connection"; inspector?: boolean }) {
  const [viewport, setViewport] = useState<CanvasViewport>(initial);
  const [selection, setSelection] = useState<string[]>([]);
  const [hold, setHold] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = useState(false);
  useEffect(() => { const el = wrapper.current; if (!el) return; const observer = new ResizeObserver(() => setNarrow(el.clientWidth < 580)); observer.observe(el); return () => observer.disconnect(); }, []);
  const disabled = state === "disabled", x = narrow ? 28 : 308, y = narrow ? 228 : 158;
  const sourceY = narrow ? (inspector ? 180 : 148) : inspector ? 140 : 108, targetY = narrow ? y : y + 40;
  return <div ref={wrapper} className={`hkl-example-stack hk-workflow-example ${narrow ? "hk-workflow-example--vertical" : ""}`}><div className="hk-data-toolbar"><Checkbox label="Keep supplied canvas state" checked={hold} disabled={disabled} onChange={event => setHold(event.target.checked)} /></div><Canvas aria-label="Work canvas" disabled={disabled} viewport={viewport} onViewportChange={next => { if (!hold) setViewport(next); }} selectedIds={selection} onSelectionChange={next => { if (!hold) setSelection(next); }} overlay={<><Controls showInteractive />{inspector && <Panel position="top-right"><SlidersHorizontalIcon size={16} aria-hidden /><strong>Inspector</strong><span>2 nodes</span></Panel>}</>} style={{ minHeight: narrow ? 416 : 352 }}>
    {relationship === "connection" ? <Connection aria-label="Work connection" orientation={narrow ? "vertical" : "horizontal"} fromX={narrow ? 138 : 248} fromY={sourceY} toX={narrow ? 138 : x} toY={targetY} /> : <Edge.Animated orientation={narrow ? "vertical" : "horizontal"} sourceX={narrow ? 138 : 248} sourceY={sourceY} targetX={narrow ? 138 : x} targetY={targetY} />}
    <Node nodeId="research" style={{ position: "absolute", left: 28, top: inspector ? 100 : 68, width: 220, minHeight: 80 }}><NodeHeader><NodeTitle><MagnifyingGlassIcon size={16} aria-hidden />Research</NodeTitle></NodeHeader><NodeContent>{state === "long-content" ? "An independently supplied work unit with a longer description of the research and supporting evidence." : "Supplied work unit"}</NodeContent></Node>
    <Node nodeId="result" style={{ position: "absolute", left: x, top: y, width: 220, minHeight: 80 }}><NodeHeader><NodeTitle><FileTextIcon size={16} aria-hidden />Result</NodeTitle></NodeHeader><NodeContent>{relationship === "connection" ? "Connection in progress" : "Illustrative result"}</NodeContent></Node>
    </Canvas><div className="hk-workflow-footer"><div><output aria-label="Canvas viewport">{Math.round(viewport.zoom * 100)}% · {Math.round(viewport.x)}, {Math.round(viewport.y)}</output><output aria-label="Canvas selection">{selection.length ? selection.join(", ") : "Nothing selected"}</output></div><Button variant="secondary" disabled={disabled} onClick={() => { if (!hold) { setViewport(initial); setSelection([]); } }}><ArrowCounterClockwiseIcon size={16} aria-hidden />Reset canvas</Button></div></div>;
}
