import { useEffect, useRef, useState, type ComponentPropsWithRef } from "react";
import { getStatusBadge, type ToolState } from "./activity";
import "./agent-thinking.css";

export type AgentThinkingProps = ComponentPropsWithRef<"div"> & {
  state?: ToolState;
  elapsed?: string;
  variant?: "wave" | "spin" | "stars" | "infinity";
  tone?: "subtle" | "accent";
  label?: string;
  showTimer?: boolean;
  shimmer?: boolean;
  paused?: boolean;
  runKey?: string | number;
};

function ThinkingTimer({ active, elapsed, visible }: { active: boolean; elapsed?: string; visible: boolean }) {
  const accumulated = useRef(0);
  const [milliseconds, setMilliseconds] = useState(0);
  useEffect(() => {
    if (!active || elapsed !== undefined) return;
    const started = performance.now();
    setMilliseconds(accumulated.current);
    const interval = visible ? window.setInterval(() => setMilliseconds(accumulated.current + performance.now() - started), 100) : undefined;
    return () => {
      window.clearInterval(interval);
      accumulated.current += performance.now() - started;
      setMilliseconds(accumulated.current);
    };
  }, [active, elapsed, visible]);
  if (!visible) return null;
  return <time role="timer" aria-live="off" aria-label={elapsed === undefined ? "Elapsed presentation time" : "Host elapsed time"} title={elapsed === undefined ? "Active display time, not server execution time" : undefined}>{elapsed ?? `${(milliseconds / 1000).toFixed(1)} s`}</time>;
}

export function AgentThinking({ state, elapsed, variant = "wave", tone = variant === "stars" ? "subtle" : "accent", label = "Working", showTimer = elapsed !== undefined, shimmer = true, paused = false, runKey, children, className = "", ...props }: AgentThinkingProps) {
  const active = !paused && (state === undefined || state === "input-streaming" || state === "input-available");
  return <div {...props} className={`hk-agent-thinking hk-thinking ${className}`} aria-live="off" data-variant={variant} data-tone={tone} data-active={active} data-shimmer={shimmer}>
    <span className="hk-thinking-indicator" aria-hidden="true">
      {variant === "wave" || variant === "spin" ? Array.from({ length: 9 }, (_, index) => <span className="hk-thinking-dot" key={index} />) : null}
      {variant === "stars" ? Array.from({ length: 5 }, (_, index) => <span className="hk-thinking-star" key={index} />) : null}
      {variant === "infinity" ? <svg viewBox="0 0 32 20" focusable="false"><path className="hk-thinking-track" d="M16 10C11 1 2 1 2 10S11 19 16 10S30 1 30 10S21 19 16 10" /><path className="hk-thinking-comet" pathLength="100" d="M16 10C11 1 2 1 2 10S11 19 16 10S30 1 30 10S21 19 16 10" /></svg> : null}
    </span>
    <span className="hk-thinking-content"><span className="hk-thinking-announcement" role="status" aria-live="polite"><span className="hk-thinking-label">{children !== undefined ? children : label}</span>{state !== undefined ? <span className="hk-thinking-status">{getStatusBadge(state)}</span> : null}</span><ThinkingTimer key={runKey} active={active} elapsed={elapsed} visible={showTimer} /></span>
  </div>;
}
