import { BrainIcon, CaretRightIcon, CircleNotchIcon } from "@phosphor-icons/react";
import { MessagePartPrimitive, type ReasoningMessagePartProps } from "@assistant-ui/react";
import "./reasoning.css";

/**
 * v3 spec: AI Chat / Reasoning — a quiet borderless row, never a box (rule 2).
 * Order per the artboard: leading chevron · glyph · label, with the expanded/streaming
 * body indented flush under the label (past the chevron and glyph).
 * Glyph is a brain when idle and a spinner while streaming.
 * Hosts may supply measured elapsed time; unknown durations are never invented.
 * Copy stays "Reasoned for N seconds" (established product/accessible voice); the artboard's
 * "Thought for 4s" is sample content, not a copy mandate.
 */
export function HarsoReasoning({ status, durationSeconds }: ReasoningMessagePartProps & { durationSeconds?: number }) {
  const running = status.type === "running";
  const label = running ? "Thinking…" : durationSeconds === undefined ? "Reasoned" : `Reasoned for ${durationSeconds} seconds`;
  return <details className="hkc-reasoning" data-streaming={running}>
    <summary>
      <CaretRightIcon className="hkc-reasoning-chevron" size={12} aria-hidden="true" />
      {running
        ? <CircleNotchIcon className="hkc-reasoning-glyph hkc-reasoning-spin" size={16} weight="bold" aria-hidden="true" />
        : <BrainIcon className="hkc-reasoning-glyph" size={16} weight="regular" aria-hidden="true" />}
      <span>{label}</span>
    </summary>
    <div><MessagePartPrimitive.Text /></div>
  </details>;
}
