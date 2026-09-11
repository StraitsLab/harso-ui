import type { ComponentPropsWithRef } from "react";
import { useCanvas } from "./canvas";

export function Node({ nodeId, handles = { target: true, source: true }, className = "", children, ...props }: ComponentPropsWithRef<"article"> & { nodeId?: string; handles?: { target?: boolean; source?: boolean } }) { const canvas = useCanvas(); return <article {...props} data-canvas-node={nodeId} data-selected={nodeId && canvas?.selectedIds.includes(nodeId) ? "true" : undefined} className={`hk-node ${className}`}>{handles.target && <span className="hk-node-handle hk-node-handle--target" aria-hidden="true" />}{children}{handles.source && <span className="hk-node-handle hk-node-handle--source" aria-hidden="true" />}</article>; }
export function NodeHeader({ className = "", ...props }: ComponentPropsWithRef<"header">) { return <header {...props} className={`hk-node-header ${className}`} />; }
export function NodeTitle({ className = "", ...props }: ComponentPropsWithRef<"h3">) { return <h3 {...props} className={`hk-node-title ${className}`} />; }
export function NodeDescription({ className = "", ...props }: ComponentPropsWithRef<"p">) { return <p {...props} className={`hk-node-description ${className}`} />; }
export function NodeAction({ className = "", ...props }: ComponentPropsWithRef<"div">) { return <div {...props} className={`hk-node-action ${className}`} />; }
export function NodeContent({ className = "", ...props }: ComponentPropsWithRef<"div">) { return <div {...props} className={`hk-node-content ${className}`} />; }
export function NodeFooter({ className = "", ...props }: ComponentPropsWithRef<"footer">) { return <footer {...props} className={`hk-node-footer ${className}`} />; }
