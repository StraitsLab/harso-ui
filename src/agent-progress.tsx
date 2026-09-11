import { useEffect, useId, useRef, useState, type ComponentPropsWithRef, type CSSProperties } from "react";
import "./agent-progress.css";

export type AgentProgressProps = ComponentPropsWithRef<"ol"> & {
  steps: readonly string[];
  current?: number;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  progress?: number;
  playback?: "host" | "timed";
  stepDuration?: number;
  completionDelay?: number;
  onFinished?: () => void;
  runId?: string | number;
  loading?: boolean;
  error?: string;
  disabled?: boolean;
  paused?: boolean;
};

export function AgentProgress({ expanded, defaultExpanded = true, onExpandedChange, ...props }: AgentProgressProps) {
  const [localExpanded, setLocalExpanded] = useState(defaultExpanded);
  const open = expanded ?? localExpanded;
  const identity = props.playback === "timed" ? JSON.stringify([props.steps, props.current ?? 0, props.runId, props.stepDuration, props.completionDelay]) : "host";
  return <AgentProgressRun key={identity} {...props} expanded={open} onExpandedChange={next => {
    if (expanded === undefined) setLocalExpanded(next);
    onExpandedChange?.(next);
  }} />;
}

function AgentProgressRun({ steps, current = 0, expanded, onExpandedChange, progress, playback = "host", stepDuration = 2400, completionDelay = 1000, onFinished, runId: _runId, loading = false, error, disabled = false, paused = false, className = "", id, ...props }: AgentProgressProps) {
  const generatedId = useId();
  const listId = id ?? generatedId;
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef(0);
  const finished = useRef(false);
  const callback = useRef(onFinished);
  useEffect(() => { callback.current = onFinished; }, [onFinished]);
  const timed = playback === "timed";
  const duration = (steps.length - current) * stepDuration;
  const total = duration + completionDelay;
  const valid = Number.isInteger(current) && current >= 0 && current <= steps.length
    && (progress === undefined || Number.isFinite(progress) && progress >= 0 && progress <= 1)
    && (!timed || Number.isFinite(stepDuration) && stepDuration > 0 && Number.isFinite(completionDelay) && completionDelay >= 0 && Number.isFinite(duration) && Number.isFinite(total));
  const suspended = !timed || !valid || steps.length === 0 || loading || Boolean(error) || disabled || paused;

  useEffect(() => {
    if (suspended || elapsedRef.current >= total) return;
    let previous = performance.now();
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const now = performance.now();
      elapsedRef.current = Math.min(total, elapsedRef.current + now - previous);
      previous = now;
      setElapsed(elapsedRef.current);
      if (elapsedRef.current < total) schedule();
    };
    const schedule = () => {
      const nextStep = elapsedRef.current < duration ? stepDuration - elapsedRef.current % stepDuration : total - elapsedRef.current;
      timer = setTimeout(tick, Math.min(25, nextStep, total - elapsedRef.current));
    };
    schedule();
    return () => {
      clearTimeout(timer);
      elapsedRef.current = Math.min(total, elapsedRef.current + performance.now() - previous);
      setElapsed(elapsedRef.current);
    };
  }, [suspended, duration, total, stepDuration]);

  useEffect(() => {
    if (!suspended && elapsed >= total && !finished.current) {
      finished.current = true;
      callback.current?.();
    }
  }, [elapsed, total, suspended]);

  const active = valid ? Math.min(steps.length, current + (timed ? Math.floor(elapsed / stepDuration) : 0)) : 0;
  const complete = valid && steps.length > 0 && active === steps.length;
  const fraction = complete ? 1 : timed ? elapsed % stepDuration / stepDuration : progress;
  const value = valid && steps.length > 0 && fraction !== undefined ? (active + fraction) / steps.length : undefined;
  const overall = complete ? 1 : value;
  const remaining = steps.length - active;
  const state = error ? "error" : loading ? "loading" : !steps.length ? "empty" : !valid ? "unavailable" : disabled ? "disabled" : paused ? "paused" : complete ? "complete" : "active";
  const summary = error || (loading ? "Loading steps" : !steps.length ? "No steps supplied" : !valid ? "Progress unavailable" : disabled ? "Progress disabled" : paused ? "Paused" : complete ? timed ? "Demo complete" : "All steps complete" : `${remaining} ${remaining === 1 ? "step" : "steps"} left`);
  return <div className="hk-agent-progress-root" data-state={state} data-playback={playback} aria-busy={loading}>
    <div className="hk-agent-progress-heading">
      <button type="button" className="hk-agent-progress-toggle" disabled={disabled} aria-expanded={expanded} aria-controls={listId} aria-label={expanded ? "Hide steps" : "Show steps"} onClick={() => onExpandedChange?.(!expanded)}>
        <span aria-hidden="true" className="hk-agent-progress-chevron">{expanded ? "−" : "+"}</span>
        <span>Agent progress</span>
      </button>
      {valid && steps.length > 0 && !loading && !error && <span className="hk-agent-progress-meter" role="progressbar" aria-label={timed ? "Demo progress" : "Agent progress"} aria-valuemin={0} aria-valuemax={100} aria-valuenow={overall === undefined ? undefined : Math.round(overall * 100)} aria-valuetext={overall === undefined ? "Waiting for host progress" : undefined}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle className="hk-agent-progress-track" cx="12" cy="12" r="9" />{overall !== undefined && <circle className="hk-agent-progress-value" cx="12" cy="12" r="9" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - overall} />}</svg>
      </span>}
      <span className="hk-agent-progress-summary" role={error ? "alert" : "status"}>{summary}</span>
    </div>
    {timed && <small className="hk-agent-progress-demo">Timed presentation demo · not runtime activity</small>}
    <ol {...props} id={listId} hidden={!expanded || props.hidden} className={`hk-agent-progress ${className}`}>
      {steps.map((step, index) => {
        const stepState = !valid || loading || error ? "pending" : index < active ? "complete" : index === active ? "active" : "pending";
        return <li key={`${step}-${index}`} data-state={stepState} aria-current={stepState === "active" ? "step" : undefined} style={{ "--hk-progress-order": Math.min(index, 8) } as CSSProperties}>
          <span className="hk-agent-progress-marker" aria-hidden="true">{stepState === "complete" ? "✓" : index + 1}</span><span className="hk-agent-progress-label">{step}</span>
        </li>;
      })}
    </ol>
  </div>;
}
