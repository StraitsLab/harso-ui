import { useState } from "react";
import { Button, Checkbox, Commit, CommitActions, CommitAuthor, CommitAuthorAvatar, CommitContent, CommitCopyButton, CommitFile, CommitFileAdditions, CommitFileChanges, CommitFileDeletions, CommitFileIcon, CommitFileInfo, CommitFilePath, CommitFiles, CommitFileStatus, CommitHash, CommitHeader, CommitInfo, CommitMessage, CommitMetadata, CommitSeparator, CommitTimestamp, EmptyState, type CommitFileStatusKind } from "@harso/ui";
import type { ExampleState } from "./examples";

export const commitExports = ["Commit"] as const;
export type CommitExport = typeof commitExports[number];
export const commitNotes = { Commit: { behavior: "A supplied commit on the continuous canvas: compact author, message and timestamp, sibling copy action, then an explicit changed-file disclosure. The host may refuse expansion. Copy is the only built-in side effect and only runs on request; this example never reads Git or opens files. Counts and dates that are not supplied correctly are marked unavailable. Relative time is evaluated at render, not polled. The root disables its own copy and disclosure, not arbitrary host actions.", example: '<Commit><CommitAuthor><CommitAuthorAvatar initials="AB" /><CommitInfo><CommitMessage>Clarify work progress</CommitMessage></CommitInfo></CommitAuthor><CommitActions><CommitCopyButton hash={hash} /></CommitActions><CommitHeader>4 changed files</CommitHeader><CommitContent><CommitFiles>{files}</CommitFiles></CommitContent></Commit>' } };

export function CommitExample({ state }: { state: ExampleState }) {
  const [open, setOpen] = useState(false);
  const [hold, setHold] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [missing, setMissing] = useState(false);
  const [alternate, setAlternate] = useState(false);
  const hash = alternate ? "c5e73120d4a69b083ef2175a6d98032bf714c60a" : "a71b90283fc419de567820ba193dc04256efab80";
  const files: { path: string; status: CommitFileStatusKind; added: number; deleted: number }[] = [
    { path: state === "long-content" ? "src/conversation/continuous-work-progress-with-accessible-decisions-and-unabridged-names.tsx" : "src/conversation/work.tsx", status: "modified", added: 24, deleted: 8 },
    { path: "src/components/progress.tsx", status: "added", added: 61, deleted: 0 },
    { path: "src/legacy-panel.tsx", status: "deleted", added: 0, deleted: 43 },
    { path: "src/detail.tsx → src/work-detail.tsx", status: "renamed", added: 0, deleted: 0 },
  ];
  return <div className="hkl-example-stack"><div className="hk-data-toolbar"><Checkbox label="Hold commit updates" checked={hold} onChange={event => setHold(event.target.checked)} /><Checkbox label="No changed files" checked={empty} onChange={event => setEmpty(event.target.checked)} /><Checkbox label="Unavailable metadata" checked={missing} onChange={event => setMissing(event.target.checked)} /><Button size="small" onClick={() => setAlternate(value => !value)}>Change sample commit</Button></div><Commit open={open} onOpenChange={next => { if (!hold) setOpen(next); }} disabled={state === "disabled"} aria-label="Example commit"><CommitAuthor><CommitAuthorAvatar initials="AB" aria-label="Alex Bennett" /><CommitInfo><CommitMessage>{state === "long-content" ? "Keep every decision visible while the rest of the interface quietly disappears into the conversation" : "Keep work progress clear and quiet"}</CommitMessage><CommitMetadata><CommitHash title={hash}>{hash.slice(0, 8)}</CommitHash><CommitSeparator /><span>Alex Bennett</span><CommitSeparator /><CommitTimestamp date={new Date(missing ? NaN : "2026-09-06T12:00:00Z")} now={new Date("2026-09-06T14:00:00Z")} /></CommitMetadata></CommitInfo></CommitAuthor><CommitActions><CommitCopyButton hash={hash} /></CommitActions><CommitHeader>{empty ? "No changed files" : "4 changed files"}</CommitHeader><CommitContent>{empty ? <EmptyState title="No changed files supplied." description="Only the metadata provided by the host is shown." /> : <CommitFiles>{files.map(file => <CommitFile key={file.path}><CommitFileInfo><CommitFileIcon /><CommitFilePath>{file.path}</CommitFilePath><CommitFileStatus status={file.status} /></CommitFileInfo><CommitFileChanges><CommitFileAdditions count={missing ? NaN : file.added} /><CommitFileDeletions count={missing ? NaN : file.deleted} /></CommitFileChanges></CommitFile>)}</CommitFiles>}</CommitContent></Commit></div>;
}
