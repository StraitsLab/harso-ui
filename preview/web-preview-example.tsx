import { useState } from "react";
import { Button, Checkbox, Select, WebPreview, WebPreviewBody, WebPreviewNavigation, WebPreviewNavigationButton, WebPreviewUrl } from "@harso/ui";
import type { ExampleState } from "./examples";

const localDocument = '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Local preview</title><style>body{font:16px system-ui;padding:32px;color:#20252a;background:#fafbfd}main{max-width:36rem}h1{font-size:24px;font-weight:500}</style></head><body><main><h1>A quiet place to work.</h1><p>This is a local, isolated preview. No external site is loaded until you enter an address and choose Open.</p></main></body></html>';

export function WebPreviewExample({ state }: { state: ExampleState }) {
  const [draft, setDraft] = useState("");
  const [url, setUrl] = useState("");
  const [data, setData] = useState(state === "error" ? "rejected" : "document");
  const [locked, setLocked] = useState(false);
  const disabled = state === "disabled" || locked;
  return <div className="hkl-example-stack">
    <div className="hkl-example-row"><label>Preview data<Select aria-label="Preview data" value={data} onChange={event => setData(event.target.value)}><option value="document">Local document</option><option value="empty">Empty</option><option value="rejected">Rejected address</option><option value="address">Entered address</option></Select></label><Checkbox label="Disable preview controls" checked={locked} onChange={event => setLocked(event.target.checked)} /></div>
    <form onSubmit={event => { event.preventDefault(); if (!disabled) { setUrl(draft); setData("address"); } }}>
    <WebPreview url={data === "rejected" ? "javascript:void(0)" : data === "address" ? url : ""} disabled={disabled}>
      <WebPreviewNavigation>
        <WebPreviewNavigationButton tooltip="Reload">↻</WebPreviewNavigationButton>
        <WebPreviewUrl value={draft} placeholder="https://example.com" onChange={event => { event.preventDefault(); setDraft(event.target.value); }} />
        <Button type="submit" disabled={disabled}>Open</Button>
      </WebPreviewNavigation>
      <WebPreviewBody srcDoc={data === "document" ? localDocument : undefined} loading={<p role="status">Loading preview</p>} />
    </WebPreview>
    </form>
  </div>;
}
