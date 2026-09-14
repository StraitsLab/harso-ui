import type { CSSProperties } from "react";

type EdgeProps = { orientation?: "horizontal" | "vertical"; sourceX: number; sourceY: number; targetX: number; targetY: number; markerEnd?: string; style?: CSSProperties; className?: string };
function edgePath({ sourceX, sourceY, targetX, targetY, orientation }: EdgeProps) { if (orientation === "vertical") { const mid = (sourceY + targetY) / 2; return `M ${sourceX} ${sourceY} C ${sourceX} ${mid}, ${targetX} ${mid}, ${targetX} ${targetY}`; } const curve = Math.max(24, Math.abs(targetX - sourceX) * 0.45); return `M ${sourceX} ${sourceY} C ${sourceX + curve} ${sourceY}, ${targetX - curve} ${targetY}, ${targetX} ${targetY}`; }
export function Temporary({ className = "", ...props }: EdgeProps) { return <svg className={`hk-edge ${className}`} style={props.style} aria-hidden="true"><path markerEnd={props.markerEnd} d={edgePath(props)} className="hk-edge-temporary" /></svg>; }
export function Animated({ className = "", markerEnd, ...props }: EdgeProps) { return <svg className={`hk-edge ${className}`} style={props.style} aria-hidden="true"><path markerEnd={markerEnd} d={edgePath(props)} className="hk-edge-animated" /><circle r="4" className="hk-edge-pulse"><animateMotion dur="2s" repeatCount="indefinite" path={edgePath(props)} /></circle></svg>; }
export const Edge = { Temporary, Animated };
export const EdgeTemporary = Temporary;
export const EdgeAnimated = Animated;
