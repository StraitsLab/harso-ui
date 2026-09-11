import { useState, type ReactNode } from "react";
import { Button, Input, Select, SettingsModal, type SettingsPage } from "@harso/ui";
import type { ExampleState } from "./examples";
import planArtwork from "./plan-art.svg?no-inline";

export function SettingsExample({ state }: { state: ExampleState }) {
  const [open, setOpen] = useState(false);
  const [defaultPage, setDefaultPage] = useState<SettingsPage>("general");
  const [hold, setHold] = useState(false);
  const [requests, setRequests] = useState(0);
  const [name, setName] = useState("Your workspace");
  const [notifications, setNotifications] = useState(true);
  const [artwork, setArtwork] = useState(false);
  const [brokenArtwork, setBrokenArtwork] = useState(false);
  const [scenario, setScenario] = useState("ready");
  const disabled = state === "disabled" || scenario === "disabled" || scenario === "disabled-error";
  const pageContent = (section: SettingsPage, content: ReactNode) => <>
    <label>Settings data<Select aria-label="Settings data" value={scenario} onChange={event => setScenario(event.target.value)}>{["ready", "empty", "loading", "error", "disabled", "disabled-error"].map(value => <option key={value}>{value}</option>)}</Select></label>
    {scenario === "loading" ? <p role="status">Loading local preferences…</p> : scenario === "error" || scenario === "disabled-error" ? <><p role="alert">Local preferences unavailable. No account request was sent.</p><Button disabled={disabled} onClick={() => setScenario("ready")}>Retry preferences</Button></> : scenario === "empty" ? <p>No {section} data supplied.</p> : content}
  </>;
  return <div className="hk-settings-example">
    <div className="hk-example-controls">
      <label>Initial page<Select aria-label="Initial settings page" value={defaultPage} onChange={event => setDefaultPage(event.target.value as SettingsPage)}><option value="general">General</option><option value="profile">Profile</option><option value="tools">Tools</option><option value="storage">Storage</option></Select></label>
      <label><input type="checkbox" checked={hold} onChange={event => setHold(event.target.checked)} />Hold close requests</label>
      <label><input type="checkbox" checked={artwork} onChange={event => setArtwork(event.target.checked)} />Custom plan artwork</label>
      <label><input type="checkbox" checked={brokenArtwork} disabled={!artwork} onChange={event => setBrokenArtwork(event.target.checked)} />Broken plan artwork</label>
    </div>
    <Button disabled={state === "disabled"} onClick={() => setOpen(true)}>Open settings</Button>
    <p>Close requests: <output aria-label="Close requests">{requests}</output></p>
    <SettingsModal isOpen={open} onClose={() => { setRequests(count => count + 1); if (!hold) setOpen(false); }} defaultPage={defaultPage} planArtSrc={artwork ? brokenArtwork ? "/harso-missing-plan-art.png" : planArtwork : undefined} pages={{
      general: pageContent("general", <><p>Local preview · these preferences are not saved to an account.</p><label><input type="checkbox" disabled={disabled} checked={notifications} onChange={event => setNotifications(event.target.checked)} />Notify me when work is ready</label></>),
      profile: pageContent("profile", <label>Workspace name<Input disabled={disabled} value={name} onChange={event => setName(event.target.value)} /></label>),
      tools: pageContent("tools", state === "error" ? <p role="alert">Tool connections could not be loaded. Try again from the host.</p> : <p>{state === "long-content" ? "Connected tools and their workspace permissions appear here when supplied by Harso. No tools are connected in this isolated preview, and no credentials are requested or sent." : "No connected tools in this preview."}</p>),
      storage: pageContent("storage", <p>Storage usage has not been supplied. No usage or capacity is estimated.</p>)
    }} />
  </div>;
}
