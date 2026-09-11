import type { ComponentPropsWithRef } from "react";

export type PanelPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
export function Panel({ position = "top-left", className = "", ...props }: ComponentPropsWithRef<"div"> & { position?: PanelPosition }) { return <div {...props} className={`hk-panel hk-panel--${position} ${className}`} />; }
