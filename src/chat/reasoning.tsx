import { CaretRight, Sparkle } from "@phosphor-icons/react";
import { MessagePartPrimitive, type ReasoningMessagePartProps } from "@assistant-ui/react";
import "./reasoning.css";

/** Hosts may supply measured elapsed time; unknown durations are never invented. */
export function HarsoReasoning({ status, durationSeconds }: ReasoningMessagePartProps & { durationSeconds?: number }) {
  const running = status.type === "running";
  const label = running ? "Thinking…" : durationSeconds === undefined ? "Reasoned" : `Reasoned for ${durationSeconds} seconds`;
  return <details className="hkc-reasoning" data-streaming={running}>
    <summary><Sparkle size={12} weight="regular" aria-hidden="true" /><span>{label}</span><CaretRight className="hkc-reasoning-chevron" size={9} aria-hidden="true" /></summary>
    <div><MessagePartPrimitive.Text /></div>
  </details>;
}
