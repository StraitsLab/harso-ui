import { useState } from "react";
import { AiProfile, Button, Checkbox, Field, HeatmapChartCard, Image, Input, LineChartCard, OrdersChartCard, Select, Snippet, SnippetCopyButton, StatCards, Textarea } from "@harso/ui";
import type { ExampleState } from "./examples";
import { sampleImage } from "./image-generation-example";

const months = [{ value: "2026-07", label: "July 2026" }, { value: "2026-08", label: "August 2026" }];
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const initialProfiles = { mira: { name: "Mira Chen", bio: "Designer exploring calm, useful AI experiences." }, noah: { name: "Noah Rivera", bio: "Building thoughtful tools for everyday work." } };
type ProfileId = keyof typeof initialProfiles;
type Panel = "navigation" | "edit" | "share" | null;

export function AiProfileExample({ state }: { state: ExampleState }) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [profileId, setProfileId] = useState<ProfileId>("mira");
  const [month, setMonth] = useState("2026-08");
  const [day, setDay] = useState(0);
  const [panel, setPanel] = useState<Panel>(null);
  const [draft, setDraft] = useState(initialProfiles.mira);
  const [hold, setHold] = useState(false);
  const [scenario, setScenario] = useState("ready");
  const [cover, setCover] = useState("sample");
  const [request, setRequest] = useState("Synthetic profile and activity only. Nothing is persisted or shared.");
  const profile = profiles[profileId];
  const disabled = state === "disabled" || scenario === "disabled";
  const loading = scenario === "loading";
  const failed = state === "error" || scenario === "error";
  const available = !loading && !failed && scenario !== "empty";
  const start = new Date(`${month}-01T00:00:00Z`);
  const offset = (start.getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
  const daily = available ? Array.from({ length: days }, (_, index) => {
    const agents = (index + (profileId === "mira" ? 2 : 4) + start.getUTCMonth()) % 6;
    return { label: `${month}-${String(index + 1).padStart(2, "0")}`, agents, tokens: agents * 650 + index * 30, contributions: agents * 2 };
  }) : [];
  const columns = Array.from({ length: Math.ceil((offset + days) / 7) }, (_, index) => { const date = new Date(start); date.setUTCDate(1 - offset + index * 7); return `Week of ${date.toISOString().slice(5, 10)}`; });
  const rows = available ? weekdays.map((label, weekday) => ({ label, values: columns.map((_, week) => daily[week * 7 + weekday - offset]?.contributions ?? null) })) : [];
  const total = (field: "agents" | "tokens" | "contributions") => daily.reduce((sum, item) => sum + item[field], 0);
  const act = (label: string, change: () => void) => { if (disabled) return; setRequest(`${label}${hold ? "; host retained state" : ""}.`); if (!hold) change(); };
  const changeMonth = (value: string) => act("Month selected", () => { setMonth(value); setDay(0); });
  const navigation = <nav className="hk-profile-navigation" aria-label="Profile navigation"><p>Choose an isolated example profile.</p>{(Object.keys(profiles) as ProfileId[]).map(identity => <Button key={identity} disabled={disabled} aria-current={profileId === identity ? "page" : undefined} onClick={() => act("Profile selected", () => { setProfileId(identity); setDraft(profiles[identity]); setPanel(null); setDay(0); })}>{profiles[identity].name}</Button>)}</nav>;
  const editor = <form className="hk-profile-editor" onSubmit={event => { event.preventDefault(); if (!draft.name.trim()) return; act("Save profile requested", () => { setProfiles(previous => ({ ...previous, [profileId]: { name: draft.name.trim(), bio: draft.bio.trim() } })); setPanel(null); }); }}>
    <Checkbox label="Hold profile host state" checked={hold} onChange={event => setHold(event.target.checked)} />
    <Field label="Display name" required>{props => <Input {...props} value={draft.name} maxLength={80} required disabled={disabled} onChange={event => setDraft(previous => ({ ...previous, name: event.target.value }))} />}</Field>
    <Field label="About you">{props => <Textarea {...props} value={draft.bio} maxLength={240} disabled={disabled} onChange={event => setDraft(previous => ({ ...previous, bio: event.target.value }))} />}</Field>
    <Button type="submit" disabled={disabled || !draft.name.trim()}>Save profile</Button><Button onClick={() => setPanel(null)}>Cancel edits</Button>
  </form>;
  const sharing = <section aria-label="Profile share preview"><p>Only this text will be copied. Copying does not publish the profile or grant access.</p><Snippet code={`${profile.name}\n${profile.bio}`} disabled={disabled || hold}><pre>{profile.name}{"\n"}{profile.bio}</pre><SnippetCopyButton label="Copy profile text" /></Snippet></section>;
  const panelContent = panel === "navigation" ? navigation : panel === "edit" ? editor : sharing;
  const inspect = daily[Math.min(day, Math.max(0, daily.length - 1))];
  const agentMaximum = Math.max(1, ...daily.map(item => item.agents));
  const agentBars = daily.length ? <div className="hk-profile-agent-series" role="region" aria-label="Scrollable daily agent chart" tabIndex={0}><div className="hk-chart-bars" role="img" aria-label="Agents launched chart">{daily.map(item => <div className="hk-chart-bar-column" key={item.label}><span className="hk-chart-bar" style={{ minHeight: 0, height: `${item.agents / agentMaximum * 100}%` }} /><small>{item.label.slice(-2)}</small></div>)}</div></div> : <p>No agent activity</p>;
  return <div className="hkl-example-stack" style={{ maxWidth: "none" }}>
    <div className="hk-data-toolbar"><Checkbox label="Hold profile host state" checked={hold} onChange={event => setHold(event.target.checked)} /><label>Profile data<Select aria-label="Profile data" value={scenario} onChange={event => setScenario(event.target.value)}>{["ready", "empty", "loading", "error", "disabled"].map(value => <option key={value}>{value}</option>)}</Select></label><label>Profile cover<Select aria-label="Profile cover" value={cover} disabled={disabled} onChange={event => act("Cover artwork requested", () => setCover(event.target.value))}><option value="sample">Local illustration</option><option value="broken">Broken image fallback</option></Select></label></div>
    <AiProfile name={state === "long-content" ? `${profile.name} — Designing across teams, tools and everyday workflows` : profile.name} description={profile.bio} disabled={disabled}
      cover={<Image alt="Quiet abstract profile cover" src={cover === "broken" ? "/harso-missing-profile-cover.png" : sampleImage(0)} />}
      actions={<Button disabled={disabled} onClick={() => act("Navigation requested", () => setPanel("navigation"))}>Browse profiles</Button>}
      onEdit={() => act("Edit requested", () => { setDraft(profile); setPanel("edit"); })} onShare={() => act("Share preview requested", () => setPanel("share"))}
      panel={panel ? { title: panel === "navigation" ? "Profiles" : panel === "edit" ? "Edit profile" : "Share profile", content: panelContent, onClose: () => setPanel(null) } : null}
      contributions={loading ? <p role="status">Loading profile activity…</p> : failed ? <div role="alert">Profile activity unavailable.<Button disabled={disabled} onClick={() => act("Retry requested", () => setScenario("ready"))}>Retry profile activity</Button></div> : <><label className="hk-profile-period">Activity month<Select aria-label="Activity month" value={month} disabled={disabled} onChange={event => changeMonth(event.target.value)}>{months.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</Select></label>{daily.length ? <StatCards label="Monthly contributions" items={[{ id: "contributions", label: "Contributions", value: total("contributions") }, { id: "days", label: "Active days", value: daily.filter(item => item.contributions > 0).length }, { id: "agents", label: "Agents launched", value: total("agents") }, { id: "tokens", label: "Tokens used", value: total("tokens").toLocaleString() }]} /> : <p>No activity recorded for this example.</p>}</>}
      activity={!loading && !failed ? <HeatmapChartCard key={`${profileId}-${month}`} title="Contribution activity" caption={`${months.find(item => item.value === month)?.label} · Synthetic daily contributions`} disabled={disabled} columns={columns} rows={rows} /> : undefined}
      agents={!loading && !failed ? <div className="hk-profile-chart"><OrdersChartCard title="Agents launched" value={total("agents")} caption="Synthetic daily agent launches">{agentBars}</OrdersChartCard><label>Inspect day<Select aria-label="Inspect activity day" value={day} disabled={disabled || !daily.length} onChange={event => { const next = Number(event.target.value); act("Activity day selected", () => setDay(next)); }}>{daily.length ? daily.map((item, index) => <option key={item.label} value={index}>{item.label}</option>) : <option value={0}>No data</option>}</Select></label>{inspect && <output aria-label="Daily agent inspection">{inspect.label}: {inspect.agents} agents</output>}</div> : undefined}
      tokens={!loading && !failed ? <div className="hk-profile-chart"><LineChartCard title="Tokens used" value={total("tokens").toLocaleString()} caption="Synthetic daily token trend" data={daily.map(item => ({ label: item.label, value: item.tokens }))} />{inspect && <output aria-label="Daily token inspection">{inspect.label}: {inspect.tokens.toLocaleString()} tokens</output>}<details><summary>View daily values</summary><div className="hk-profile-table-scroll"><table><caption>Daily token and agent values</caption><thead><tr><th>Date</th><th>Agents</th><th>Tokens</th></tr></thead><tbody>{daily.map(item => <tr key={item.label}><th scope="row">{item.label}</th><td>{item.agents}</td><td>{item.tokens.toLocaleString()}</td></tr>)}</tbody></table></div></details></div> : undefined}
    />
    <output aria-label="Profile request">{request}</output>
  </div>;
}
