import { createContext, Fragment, useContext, type ComponentPropsWithRef, type ReactNode } from "react";

export type TranscriptionSegmentData = { text: string; startSecond: number; endSecond: number };
export type TranscriptionProps = Omit<ComponentPropsWithRef<"div">, "children"> & { segments: readonly TranscriptionSegmentData[]; currentTime?: number; onSeek?: (time: number) => void; disabled?: boolean; children?: (segment: TranscriptionSegmentData, index: number) => ReactNode };
const TranscriptionValue = createContext<{ currentTime: number; onSeek?: (time: number) => void; disabled: boolean }>({ currentTime: 0, disabled: false });
function validSegment(segment: TranscriptionSegmentData) { return !!segment.text.trim() && Number.isFinite(segment.startSecond) && Number.isFinite(segment.endSecond) && segment.startSecond >= 0 && segment.endSecond > segment.startSecond; }
export function Transcription({ segments, currentTime = 0, onSeek, disabled = false, children, className = "", ...props }: TranscriptionProps) {
  const visible = segments.filter(validSegment);
  return <TranscriptionValue value={{ currentTime, onSeek, disabled }}><div {...props} className={`hk-transcription ${className}`} data-current-time={currentTime}>{visible.map((segment, index) => <Fragment key={`${segment.startSecond}-${index}`}>{children ? children(segment, index) : <TranscriptionSegment segment={segment} index={index} />}</Fragment>)}</div></TranscriptionValue>;
}
export function TranscriptionSegment({ segment, index, currentTime, onSeek, disabled, className = "", ...props }: ComponentPropsWithRef<"button"> & { segment: TranscriptionSegmentData; index: number; currentTime?: number; onSeek?: (time: number) => void }) {
  const parent = useContext(TranscriptionValue);
  const time = currentTime ?? parent.currentTime;
  const requestSeek = onSeek ?? parent.onSeek;
  const active = time >= segment.startSecond && time < segment.endSecond;
  const past = time >= segment.endSecond;
  return <button {...props} type="button" disabled={disabled || parent.disabled || !validSegment(segment) || (!requestSeek && !props.onClick)} aria-current={active ? "true" : undefined} className={`hk-transcription-segment ${active ? "hk-transcription-segment--active" : ""} ${past ? "hk-transcription-segment--past" : ""} ${className}`} data-active={active || undefined} data-index={index} onClick={event => { props.onClick?.(event); if (!event.defaultPrevented) requestSeek?.(segment.startSecond); }}>{segment.text}</button>;
}
