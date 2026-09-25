import { useEffect, useRef, useSyncExternalStore, type ComponentPropsWithRef } from "react";

export type PersonaState = "idle" | "listening" | "thinking" | "speaking" | "asleep";
export type PersonaVariant = "obsidian" | "mana" | "opal" | "halo" | "glint" | "command";
export type PersonaProps = Omit<ComponentPropsWithRef<"div">, "onLoad" | "onError" | "onPlay" | "onPause"> & {
  state?: PersonaState; variant?: PersonaVariant; size?: number; paused?: boolean;
  onReady?: () => void; onPlay?: () => void; onPause?: () => void; onStop?: () => void;
};

function subscribeReducedMotion(notify: () => void) {
  if (typeof window.matchMedia !== "function") return () => undefined;
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
}
function prefersReducedMotion() {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Persona({ state = "idle", variant = "obsidian", size = 128, paused = false, onReady, onPlay, onPause, onStop, onAnimationStart, className = "", style, ...props }: PersonaProps) {
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => true);
  const playback = state === "asleep" ? "stopped" : paused || reducedMotion ? "paused" : "playing";
  const mode = useRef(playback);
  mode.current = playback;
  const previous = useRef<"playing" | "paused" | "stopped">("stopped");
  const ready = useRef(false);
  const callbacks = useRef({ onReady, onPlay, onPause, onStop });
  callbacks.current = { onReady, onPlay, onPause, onStop };
  // The CSS animation can start before the first frame callback, so whichever comes first reports readiness.
  const reportReady = () => {
    if (ready.current) return;
    ready.current = true;
    callbacks.current.onReady?.();
  };
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (mode.current === "paused" && previous.current === "stopped") previous.current = "paused";
      reportReady();
    });
    return () => {
      cancelAnimationFrame(frame);
      if (previous.current !== "stopped") callbacks.current.onStop?.();
      previous.current = "stopped";
      ready.current = false;
    };
  }, []);
  useEffect(() => {
    if (playback === "stopped" && previous.current !== "stopped") {
      previous.current = "stopped";
      callbacks.current.onStop?.();
    } else if (playback === "paused" && previous.current === "playing") {
      previous.current = "paused";
      callbacks.current.onPause?.();
    } else if (playback === "playing" && previous.current === "paused") {
      previous.current = "playing";
      callbacks.current.onPlay?.();
    }
  }, [playback]);
  return <div {...props} className={`hk-persona hk-persona--${variant} ${className}`} data-state={state} data-variant={variant} data-playback={playback} style={{ width: Number.isFinite(size) ? Math.max(24, Math.min(1024, size)) : 128, ...style }} role="img" aria-label={props["aria-label"] ?? `Persona ${state}`} onAnimationStart={event => {
    onAnimationStart?.(event);
    if (event.target instanceof HTMLElement && event.target.classList.contains("hk-persona-motion") && playback !== "stopped" && previous.current !== playback) {
      previous.current = playback;
      reportReady();
      if (playback === "playing") callbacks.current.onPlay?.();
    }
  }}><span className="hk-persona-motion" aria-hidden="true"><span className="hk-persona-layer" /><span className="hk-persona-layer" /><span className="hk-persona-layer" /></span></div>;
}
