import { CaretRight } from "@phosphor-icons/react";
import { MessagePartPrimitive, type ReasoningMessagePartProps } from "@assistant-ui/react";
import "./reasoning.css";

export function HarsoReasoning({ status, text }: ReasoningMessagePartProps) {
  const running = status.type === "running";
  const preview = text ? text.trim().split(/(?<=[.!?])\s+/)[0] ?? "" : "";
  const label = running ? "Thinking…" : "Reasoning";
  return <details className="hkc-reasoning" data-streaming={running}>
    <summary><CaretRight size={16} aria-hidden="true" /><span>{label}</span>{!running && preview && <span className="hkc-reasoning-preview" aria-hidden="true">{preview}</span>}</summary>
    <div><MessagePartPrimitive.Text /></div>
  </details>;
}
