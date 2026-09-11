import { useState } from "react";
import { Button, ComposerAttachments, ComposerAttachmentStrip, ComposerAttachmentTile, ComposerLoader, ComposerPanel, ComposerWithAttachments, type ComposerPermission, type FileUploadItem } from "@harso/ui";
import type { ExampleState } from "./examples";

export function ComposerExample({ component, state }: { component: string; state: ExampleState }) {
  const [hold, setHold] = useState(false);
  const [attached, setAttached] = useState(true);
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState("");
  const [permission, setPermission] = useState<ComposerPermission>("manual");
  const [provider, setProvider] = useState("local");
  const [model, setModel] = useState("balanced");
  const [effort, setEffort] = useState("medium");
  const [query, setQuery] = useState("");
  const [voiceRequests, setVoiceRequests] = useState(0);
  const [working, setWorking] = useState(false);
  const [hostState, setHostState] = useState(state === "error" ? "error" : "ready");
  const [draftRequests, setDraftRequests] = useState(0);
  const [active, setActive] = useState(true);
  const [status, setStatus] = useState<FileUploadItem["status"]>("selected");
  const loading = working || hostState === "loading";
  const disabled = state === "disabled" || hostState === "disabled" || loading;
  const error = hostState === "error";
  const changeDraft = (next: string) => { setDraftRequests(count => count + 1); if (!hold) setDraft(next); };
  const name = state === "long-content" ? "complete-project-context-and-research-attachments-with-a-long-filename.md" : "brief.md";
  const attachment = <ComposerAttachmentStrip>{attached && <ComposerAttachmentTile name={name} status={error ? "error" : status} progress={status === "uploading" ? 0.35 : undefined} message={error ? "Preview attachment rejected" : undefined} onRemove={() => { if (!hold) setAttached(false); }} disabled={disabled} />}</ComposerAttachmentStrip>;
  return <div className="hkl-example-stack">
    <label><input type="checkbox" checked={hold} onChange={event => setHold(event.target.checked)} /> Hold host state</label>
    {component !== "ComposerLoader" && <label className="hk-field">Composer host state<select className="hk-select" aria-label="Composer host state" value={hostState} onChange={event => setHostState(event.target.value)}>{["ready", "loading", "error", "disabled"].map(value => <option key={value}>{value}</option>)}</select></label>}
    {(component === "Composer" || component === "ComposerPanel") && <span aria-label="Composer draft requests">{draftRequests} requests</span>}
    {component === "Composer" && <><ComposerLoader active={loading} />{error && <p role="alert">The host reports this draft could not be sent.</p>}</>}
    {component === "ComposerPanel" && <label><input type="checkbox" checked={working} onChange={event => setWorking(event.target.checked)} /> Host reports working</label>}
    {sent && <p role="status">Local submission: {sent}</p>}
    {voiceRequests > 0 && <p role="status">Local voice request: {voiceRequests}. Microphone not started.</p>}
    {component === "ComposerLoader" ? <>
      <Button onClick={() => setActive(current => !current)}>{active ? "Stop preview" : "Start preview"}</Button>
      <ComposerLoader label="Preparing work unit" active={active} />
    </> : component === "ComposerPanel" ? <ComposerPanel value={draft} onValueChange={changeDraft} onSubmit={text => { if (!hold) { setSent(text); setDraft(""); } }} disabled={disabled} loading={loading} context={<span>Project Atlas · main</span>} onVoiceRequest={() => { if (!hold) setVoiceRequests(current => current + 1); }} error={error ? "The host reports this draft could not be sent." : undefined} permission={{ value: permission, onValueChange: next => { if (!hold) setPermission(next); } }} modelPicker={{ models: [{ id: "balanced", label: "Balanced", provider: "local" }, { id: "fast", label: "Fast", provider: "local" }, { id: "research", label: "Research", provider: "remote" }], providers: [{ id: "local", label: "Local examples" }, { id: "remote", label: "Remote examples" }], efforts: [{ id: "low", label: "Low" }, { id: "medium", label: "Medium" }, { id: "high", label: "High" }], value: model, provider, effort, query, onValueChange: next => { if (!hold) setModel(next); }, onProviderChange: next => { if (!hold) { setProvider(next); setModel(""); } }, onEffortChange: next => { if (!hold) setEffort(next); }, onQueryChange: setQuery }} onFilesSelected={files => { if (!hold) setSent(`${files.length} local file(s) selected; nothing uploaded.`); }} attachments={attachment} /> : <>
      <label className="hk-field">Attachment preview state<select className="hk-select" value={status} onChange={event => setStatus(event.target.value as FileUploadItem["status"])}><option value="selected">Queued</option><option value="uploading">Uploading</option><option value="complete">Complete</option><option value="error">Failed</option></select></label>
      <Button disabled={disabled || attached} onClick={() => setAttached(true)}>Add sample attachment</Button>
      {component === "ComposerAttachments" ? <ComposerAttachments>{attachment}</ComposerAttachments> : <ComposerWithAttachments value={draft} onValueChange={changeDraft} disabled={disabled} aria-busy={loading || undefined} onSubmit={text => { if (!hold) { setSent(text); setDraft(""); } }}>{attachment}</ComposerWithAttachments>}
    </>}
  </div>;
}
