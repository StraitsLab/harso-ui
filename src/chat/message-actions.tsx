import { ActionBarPrimitive, BranchPickerPrimitive, useAuiState } from "@assistant-ui/react";
import { ArrowsClockwise, CaretLeft, CaretRight, Copy, PencilSimple, SpeakerHigh, Stop, ThumbsDown, ThumbsUp } from "@phosphor-icons/react";
import "./message.css";

export interface HarsoMessageActionCapabilities {
  /** Show Edit on user messages (needs a runtime that persists branches). */
  edit?: boolean;
  /** Show thumbs up/down (needs a feedback adapter). */
  feedback?: boolean;
  /** Show Regenerate (needs onReload support). */
  regenerate?: boolean;
  /** Show Read aloud (needs a speech adapter). */
  speech?: boolean;
  /** Show the branch picker. */
  branches?: boolean;
}

const ALL: Required<HarsoMessageActionCapabilities> = { edit: true, feedback: true, regenerate: true, speech: true, branches: true };

export function HarsoMessageActions({ user = false, capabilities }: { user?: boolean; capabilities?: HarsoMessageActionCapabilities }) {
  const can = { ...ALL, ...capabilities };
  const feedback = useAuiState(state => state.message.metadata.submittedFeedback?.type);
  const speaking = useAuiState(state => state.message.speech !== undefined);
  return (
    <ActionBarPrimitive.Root className="hkc-message-actions" hideWhenRunning={false} autohide="never" aria-label="Message actions">
      <ActionBarPrimitive.Copy aria-label="Copy message" title="Copy"><Copy size={16} /></ActionBarPrimitive.Copy>
      {user ? (can.edit && <ActionBarPrimitive.Edit aria-label="Edit message" title="Edit"><PencilSimple size={16} /></ActionBarPrimitive.Edit>) : <>
        {can.feedback && <ActionBarPrimitive.FeedbackPositive aria-label="Helpful" title="Helpful" aria-pressed={feedback === "positive"}><ThumbsUp size={16} /></ActionBarPrimitive.FeedbackPositive>}
        {can.feedback && <ActionBarPrimitive.FeedbackNegative aria-label="Not helpful" title="Not helpful" aria-pressed={feedback === "negative"}><ThumbsDown size={16} /></ActionBarPrimitive.FeedbackNegative>}
        {can.regenerate && <ActionBarPrimitive.Reload aria-label="Regenerate response" title="Regenerate"><ArrowsClockwise size={16} /></ActionBarPrimitive.Reload>}
        {can.speech && (speaking ? <ActionBarPrimitive.StopSpeaking aria-label="Stop reading" title="Stop reading"><Stop size={16} /></ActionBarPrimitive.StopSpeaking> : <ActionBarPrimitive.Speak aria-label="Read aloud" title="Read aloud"><SpeakerHigh size={16} /></ActionBarPrimitive.Speak>)}
      </>}
      {can.branches && <BranchPickerPrimitive.Root className="hkc-message-branches" hideWhenSingleBranch aria-label="Message branches">
        <BranchPickerPrimitive.Previous aria-label="Previous branch" title="Previous branch"><CaretLeft size={16} /></BranchPickerPrimitive.Previous>
        <span><BranchPickerPrimitive.Number /> of <BranchPickerPrimitive.Count /></span>
        <BranchPickerPrimitive.Next aria-label="Next branch" title="Next branch"><CaretRight size={16} /></BranchPickerPrimitive.Next>
      </BranchPickerPrimitive.Root>}
    </ActionBarPrimitive.Root>
  );
}
