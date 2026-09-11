import { createContext, useContext, type ComponentPropsWithRef } from "react";
import { FileIcon } from "@phosphor-icons/react";
import { Plan, PlanContent, PlanTrigger, type WorkDisclosureProps } from "./work";
import { Snippet, SnippetCopyButton, type DeveloperCopyProps } from "./developer-content";

type DivProps = ComponentPropsWithRef<"div">;
type SpanProps = ComponentPropsWithRef<"span">;
const CommitDisabled = createContext(false);

export function Commit({ disabled = false, className = "", ...props }: WorkDisclosureProps) {
  return <CommitDisabled value={disabled}><Plan {...props} disabled={disabled} className={`hk-commit ${className}`} /></CommitDisabled>;
}
export function CommitHeader({ children = "Changed files", className = "", ...props }: ComponentPropsWithRef<typeof PlanTrigger>) { return <PlanTrigger {...props} className={`hk-commit-header ${className}`}>{children}</PlanTrigger>; }
export function CommitAuthor({ className = "", ...props }: DivProps) { return <div {...props} className={`hk-commit-author ${className}`} />; }
export function CommitAuthorAvatar({ initials, className = "", ...props }: SpanProps & { initials: string }) { return <span role="img" aria-label={initials || "Unknown author"} {...props} className={`hk-avatar hk-commit-avatar ${className}`}>{initials || "?"}</span>; }
export function CommitInfo({ className = "", ...props }: DivProps) { return <div {...props} className={`hk-commit-info ${className}`} />; }
export function CommitMessage({ className = "", ...props }: SpanProps) { return <span {...props} className={`hk-commit-message ${className}`} />; }
export function CommitMetadata({ className = "", ...props }: DivProps) { return <div {...props} className={`hk-commit-metadata ${className}`} />; }
export function CommitHash({ className = "", ...props }: SpanProps) { return <span {...props} className={`hk-commit-hash ${className}`} />; }
export function CommitSeparator({ children = "·", ...props }: SpanProps) { return <span {...props} aria-hidden="true">{children}</span>; }

export function CommitTimestamp({ date, now = new Date(), children, className = "", ...props }: Omit<ComponentPropsWithRef<"time">, "dateTime"> & { date: Date; now?: Date }) {
  const valid = Number.isFinite(date.getTime());
  const absolute = valid ? date.toISOString() : undefined;
  let relative = absolute ?? "Date unavailable";
  if (valid && Number.isFinite(now.getTime())) {
    const seconds = (date.getTime() - now.getTime()) / 1000;
    const intervals: [Intl.RelativeTimeFormatUnit, number][] = [["year", 31536000], ["month", 2592000], ["day", 86400], ["hour", 3600], ["minute", 60], ["second", 1]];
    const [unit, duration] = intervals.find(([, duration]) => Math.abs(seconds) >= duration) ?? ["second", 1];
    relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(Math.round(seconds / duration), unit);
  }
  return <time title={absolute} aria-label={absolute} {...props} dateTime={absolute} className={`hk-commit-timestamp ${className}`}>{valid ? children ?? relative : "Date unavailable"}</time>;
}

export function CommitActions({ onClick, className = "", ...props }: DivProps) { return <div {...props} className={`hk-commit-actions ${className}`} onClick={event => { event.stopPropagation(); onClick?.(event); }} />; }
export function CommitCopyButton({ hash, disabled, onClick, ...props }: DeveloperCopyProps & { hash: string }) {
  const rootDisabled = useContext(CommitDisabled);
  return <Snippet code={hash} disabled={rootDisabled || disabled} className="hk-commit-copy"><SnippetCopyButton {...props} label={props.label ?? "Copy commit hash"} onClick={event => { event.stopPropagation(); onClick?.(event); }} /></Snippet>;
}
export function CommitContent({ className = "", ...props }: ComponentPropsWithRef<typeof PlanContent>) { return <PlanContent {...props} className={`hk-commit-content ${className}`} />; }
export function CommitFiles({ className = "", ...props }: DivProps) { return <div {...props} className={`hk-commit-files ${className}`} />; }
export function CommitFile({ className = "", ...props }: DivProps) { return <div {...props} className={`hk-commit-file ${className}`} />; }
export function CommitFileInfo({ className = "", ...props }: DivProps) { return <div {...props} className={`hk-commit-file-info ${className}`} />; }
export type CommitFileStatusKind = "added" | "modified" | "deleted" | "renamed";
export function CommitFileStatus({ status, children, className = "", ...props }: SpanProps & { status: CommitFileStatusKind }) {
  const label = { added: "Added", modified: "Modified", deleted: "Deleted", renamed: "Renamed" }[status] ?? "Status unavailable";
  return <span {...props} aria-label={label} className={`hk-commit-file-status ${className}`} data-status={status}>{children ?? label}</span>;
}
export function CommitFileIcon(props: ComponentPropsWithRef<typeof FileIcon>) { return <FileIcon size={16} {...props} aria-hidden="true" />; }
export function CommitFilePath({ className = "", ...props }: SpanProps) { return <span {...props} className={`hk-commit-file-path ${className}`} />; }
export function CommitFileChanges({ className = "", ...props }: DivProps) { return <div {...props} className={`hk-commit-file-changes ${className}`} />; }
export function CommitFileAdditions({ count, className = "", ...props }: SpanProps & { count: number }) {
  const valid = Number.isSafeInteger(count) && count >= 0;
  return <span {...props} aria-label={valid ? `${count} lines added` : "Added line count unavailable"} className={`hk-commit-additions ${className}`}>{valid ? `+${count}` : "—"}</span>;
}
export function CommitFileDeletions({ count, className = "", ...props }: SpanProps & { count: number }) {
  const valid = Number.isSafeInteger(count) && count >= 0;
  return <span {...props} aria-label={valid ? `${count} lines deleted` : "Deleted line count unavailable"} className={`hk-commit-deletions ${className}`}>{valid ? `−${count}` : "—"}</span>;
}
