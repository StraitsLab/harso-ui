import { createContext, useContext, useEffect, useId, useImperativeHandle, useRef, useState, type ComponentPropsWithRef, type ReactNode } from "react";

export type CanvasViewport = { x: number; y: number; zoom: number };
export type CanvasProps = ComponentPropsWithRef<"div"> & {
  panOnScroll?: boolean; selectionOnDrag?: boolean; zoomOnScroll?: boolean; disabled?: boolean;
  viewport?: CanvasViewport; defaultViewport?: CanvasViewport; onViewportChange?: (viewport: CanvasViewport) => boolean | void;
  selectedIds?: readonly string[]; onSelectionChange?: (ids: string[]) => boolean | void;
  interactive?: boolean; onInteractiveChange?: (interactive: boolean) => boolean | void; overlay?: ReactNode;
};
const origin = { x: 0, y: 0, zoom: 1 };
const CanvasValue = createContext<{ selectedIds: readonly string[]; disabled: boolean; interactive: boolean; zoomIn: () => void; zoomOut: () => void; fitView: () => void; toggleInteractive: () => void } | null>(null);
export function useCanvas() { return useContext(CanvasValue); }
function validViewport(value: CanvasViewport) { return Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.zoom) && value.zoom > 0; }

export function Canvas({ panOnScroll = true, selectionOnDrag = true, zoomOnScroll = true, disabled = false, viewport, defaultViewport = origin, onViewportChange, selectedIds, onSelectionChange, interactive, onInteractiveChange, overlay, children, className = "", ref, ...props }: CanvasProps) {
  const element = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => element.current!, []);
  const [localViewport, setLocalViewport] = useState(validViewport(defaultViewport) ? defaultViewport : origin);
  const [localSelection, setLocalSelection] = useState<string[]>([]);
  const [localInteractive, setLocalInteractive] = useState(true);
  const current = viewport === undefined ? localViewport : validViewport(viewport) ? viewport : origin;
  const selection = selectedIds ?? localSelection;
  const enabled = (interactive ?? localInteractive) && !disabled;
  const helpId = useId();
  const drag = useRef<{ pointerId: number; x: number; y: number; viewport: CanvasViewport; selecting: boolean } | null>(null);
  const [box, setBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const cancel = () => {
    if (drag.current && element.current?.hasPointerCapture?.(drag.current.pointerId)) element.current.releasePointerCapture(drag.current.pointerId);
    drag.current = null;
    setBox(null);
  };
  useEffect(() => { if (!enabled) cancel(); }, [enabled]);
  const requestViewport = (next: CanvasViewport) => {
    if (!enabled || !validViewport(next)) return;
    const bounded = { ...next, zoom: Math.max(0.25, Math.min(4, next.zoom)) };
    if (onViewportChange?.(bounded) === false) return;
    if (viewport === undefined) setLocalViewport(bounded);
  };
  const requestSelection = (ids: string[]) => {
    if (!enabled || onSelectionChange?.(ids) === false) return;
    if (selectedIds === undefined) setLocalSelection(ids);
  };
  const zoom = (factor: number, x = (element.current?.clientWidth ?? 0) / 2, y = (element.current?.clientHeight ?? 0) / 2) => {
    const nextZoom = Math.max(0.25, Math.min(4, current.zoom * factor));
    requestViewport({ x: x - (x - current.x) * nextZoom / current.zoom, y: y - (y - current.y) * nextZoom / current.zoom, zoom: nextZoom });
  };
  const fitView = () => {
    const nodes = Array.from(scene.current?.querySelectorAll<HTMLElement>("[data-canvas-node]") ?? []);
    const bounds = element.current?.getBoundingClientRect();
    if (!nodes.length || !bounds?.width || !bounds.height) { requestViewport(origin); return; }
    const rectangles = nodes.map(node => node.getBoundingClientRect());
    const left = (Math.min(...rectangles.map(rect => rect.left)) - bounds.left - current.x) / current.zoom;
    const top = (Math.min(...rectangles.map(rect => rect.top)) - bounds.top - current.y) / current.zoom;
    const width = (Math.max(...rectangles.map(rect => rect.right)) - bounds.left - current.x) / current.zoom - left;
    const height = (Math.max(...rectangles.map(rect => rect.bottom)) - bounds.top - current.y) / current.zoom - top;
    const nextZoom = Math.max(0.25, Math.min(4, (bounds.width - 32) / Math.max(1, width), (bounds.height - 32) / Math.max(1, height)));
    requestViewport({ x: (bounds.width - width * nextZoom) / 2 - left * nextZoom, y: (bounds.height - height * nextZoom) / 2 - top * nextZoom, zoom: nextZoom });
  };
  useEffect(() => {
    const canvas = element.current;
    if (!canvas) return;
    const wheel = (event: WheelEvent) => {
      if (!enabled || event.defaultPrevented || (event.target as Element).closest("button, input, textarea, select, [contenteditable='true'], .hk-flow-controls, .hk-toolbar, .hk-panel")) return;
      const isZoom = event.ctrlKey || event.metaKey || !panOnScroll;
      if (isZoom ? !zoomOnScroll : !panOnScroll) return;
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvas.clientHeight : 1;
      if (isZoom) { const bounds = canvas.getBoundingClientRect(); zoom(Math.exp(-event.deltaY * unit * 0.002), event.clientX - bounds.left, event.clientY - bounds.top); }
      else requestViewport({ ...current, x: current.x - event.deltaX * unit, y: current.y - event.deltaY * unit });
    };
    canvas.addEventListener("wheel", wheel, { passive: false });
    return () => canvas.removeEventListener("wheel", wheel);
  });
  const toggleInteractive = () => {
    const next = !(interactive ?? localInteractive);
    if (disabled || onInteractiveChange?.(next) === false) return;
    if (interactive === undefined) setLocalInteractive(next);
  };
  return <CanvasValue value={{ selectedIds: selection, disabled, interactive: interactive ?? localInteractive, zoomIn: () => zoom(1.2), zoomOut: () => zoom(1 / 1.2), fitView, toggleInteractive }}><div {...props} ref={element} role={props.role ?? "region"} aria-label={props["aria-label"] ?? "Canvas"} aria-disabled={disabled || undefined} aria-describedby={[props["aria-describedby"], helpId].filter(Boolean).join(" ")} tabIndex={disabled ? -1 : props.tabIndex ?? 0} className={`hk-canvas ${className}`} data-interactive={enabled} data-pan-on-scroll={panOnScroll || undefined} data-selection-on-drag={selectionOnDrag || undefined} data-zoom-on-scroll={zoomOnScroll || undefined} onKeyDown={event => {
    props.onKeyDown?.(event);
    if (!enabled || event.defaultPrevented || event.target !== event.currentTarget) return;
    const distance = event.shiftKey ? 80 : 20;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) { event.preventDefault(); requestViewport({ ...current, x: current.x + (event.key === "ArrowLeft" ? -distance : event.key === "ArrowRight" ? distance : 0), y: current.y + (event.key === "ArrowUp" ? -distance : event.key === "ArrowDown" ? distance : 0) }); }
    else if (["+", "=", "-", "Home", "Escape"].includes(event.key)) { event.preventDefault(); if (event.key === "Home") requestViewport(origin); else if (event.key === "Escape") { if (drag.current) cancel(); else requestSelection([]); } else zoom(event.key === "-" ? 1 / 1.2 : 1.2); }
    else if ((event.ctrlKey || event.metaKey) && event.key === "a" && selectionOnDrag) { event.preventDefault(); requestSelection(Array.from(scene.current?.querySelectorAll<HTMLElement>("[data-canvas-node]") ?? []).map(node => node.dataset.canvasNode!)); }
  }} onPointerDown={event => {
    props.onPointerDown?.(event);
    if (!enabled || event.defaultPrevented || ![0, 1].includes(event.button) || drag.current || (event.target as Element).closest("button, a, input, textarea, select, [contenteditable='true'], .hk-flow-controls, .hk-toolbar, .hk-panel")) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, viewport: current, selecting: selectionOnDrag && event.button === 0 && !event.altKey };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }} onPointerMove={event => {
    props.onPointerMove?.(event);
    const gesture = drag.current;
    if (!enabled || event.defaultPrevented || !gesture || gesture.pointerId !== event.pointerId) return;
    if (!gesture.selecting) requestViewport({ ...gesture.viewport, x: gesture.viewport.x + event.clientX - gesture.x, y: gesture.viewport.y + event.clientY - gesture.y });
    else { const bounds = event.currentTarget.getBoundingClientRect(); setBox({ left: Math.min(gesture.x, event.clientX) - bounds.left, top: Math.min(gesture.y, event.clientY) - bounds.top, width: Math.abs(event.clientX - gesture.x), height: Math.abs(event.clientY - gesture.y) }); }
  }} onPointerUp={event => {
    props.onPointerUp?.(event);
    const gesture = drag.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    if (enabled && !event.defaultPrevented && gesture.selecting) requestSelection(Array.from(scene.current?.querySelectorAll<HTMLElement>("[data-canvas-node]") ?? []).filter(node => { const bounds = node.getBoundingClientRect(); return bounds.left <= Math.max(gesture.x, event.clientX) && bounds.right >= Math.min(gesture.x, event.clientX) && bounds.top <= Math.max(gesture.y, event.clientY) && bounds.bottom >= Math.min(gesture.y, event.clientY); }).map(node => node.dataset.canvasNode!));
    cancel();
  }} onPointerCancel={event => { props.onPointerCancel?.(event); cancel(); }} onLostPointerCapture={event => { props.onLostPointerCapture?.(event); cancel(); }}>
    <div ref={scene} className="hk-canvas-viewport" style={{ transform: `translate(${current.x}px, ${current.y}px) scale(${current.zoom})` }}>{children}</div>
    {overlay}{box && <div className="hk-canvas-selection" aria-hidden="true" style={box} />}
    <span id={helpId} className="hk-canvas-help">Arrow keys pan; plus and minus zoom; Home resets. Drag to {selectionOnDrag ? "select nodes; Alt-drag to pan" : "pan"}. Escape cancels selection.</span>
    <span className="hk-canvas-help" role="status">{selection.length} selected</span>
  </div></CanvasValue>;
}
