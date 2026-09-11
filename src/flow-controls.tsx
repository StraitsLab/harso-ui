import type { ComponentPropsWithRef } from "react";
import { useCanvas } from "./canvas";

export type FlowControlsProps = ComponentPropsWithRef<"div"> & { showZoom?: boolean; showFitView?: boolean; showInteractive?: boolean; interactive?: boolean; disabled?: boolean; onZoomIn?: () => void; onZoomOut?: () => void; onFitView?: () => void; onToggleInteractive?: () => void };
export function Controls({ showZoom = true, showFitView = true, showInteractive = false, interactive, disabled = false, onZoomIn, onZoomOut, onFitView, onToggleInteractive, className = "", ...props }: FlowControlsProps) {
  const canvas = useCanvas();
  const zoomIn = onZoomIn ?? canvas?.zoomIn;
  const zoomOut = onZoomOut ?? canvas?.zoomOut;
  const fitView = onFitView ?? canvas?.fitView;
  const toggle = onToggleInteractive ?? canvas?.toggleInteractive;
  const unavailable = disabled || canvas?.disabled;
  const locked = unavailable || canvas?.interactive === false;
  return <div {...props} role="group" aria-label={props["aria-label"] ?? "Canvas controls"} className={`hk-flow-controls ${className}`}>{showZoom && <><button type="button" aria-label="Zoom in" disabled={locked || !zoomIn} onClick={zoomIn}>+</button><button type="button" aria-label="Zoom out" disabled={locked || !zoomOut} onClick={zoomOut}>−</button></>}{showFitView && <button type="button" aria-label="Fit view" disabled={locked || !fitView} onClick={fitView}>⌗</button>}{showInteractive && <button type="button" aria-label="Toggle interactivity" aria-pressed={interactive ?? canvas?.interactive} disabled={unavailable || !toggle} onClick={toggle}>⇱</button>}</div>;
}
