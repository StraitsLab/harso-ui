import { useState } from "react";
import { AmazonLogoIcon, AppleLogoIcon, DiscordLogoIcon, DropboxLogoIcon, FacebookLogoIcon, FigmaLogoIcon, GithubLogoIcon, GitlabLogoIcon, GoogleLogoIcon, InstagramLogoIcon, LinkedinLogoIcon, NotionLogoIcon, RedditLogoIcon, SlackLogoIcon, SpotifyLogoIcon, TelegramLogoIcon, TiktokLogoIcon, TwitchLogoIcon, WhatsappLogoIcon, XLogoIcon, type Icon } from "@phosphor-icons/react";
import { Button, Checkbox, Queue, QueueItem, QueueItemAction, QueueItemActions, QueueItemAttachment, QueueItemContent, QueueItemDescription, QueueItemFile, QueueItemIndicator, QueueList, QueueSection, QueueSectionContent, QueueSectionLabel, QueueSectionTrigger, Select, SocialButton, Toolbar, } from "@harso/ui";
import type { ExampleState } from "./examples";

export function ToolbarExample({ state = "default" }: { state?: ExampleState }) {
  const [hold, setHold] = useState(false);
  const [locked, setLocked] = useState(false);
  const [visible, setVisible] = useState(true);
  const [count, setCount] = useState(1);
  const [result, setResult] = useState("1 local item selected.");
  const disabled = locked || state === "disabled";
  const act = (action: "Inspect" | "Duplicate" | "Remove") => {
    if (disabled) return;
    if (hold) { setResult(`${action} requested; host retained ${count} local items.`); return; }
    if (action === "Duplicate") setCount(count + 1);
    if (action === "Remove") setVisible(false);
    setResult(action === "Duplicate" ? `${count + 1} local items. Duplicate accepted locally.` : `${action} accepted locally.`);
  };
  return <div className="hkl-example-stack">
    <div className="hkl-example-row"><Checkbox label="Hold toolbar changes" checked={hold} onChange={event => setHold(event.target.checked)} /><Checkbox label="Disable toolbar" checked={locked} onChange={event => setLocked(event.target.checked)} /></div>
    <p>{visible ? "Selected: Project brief" : "No selection. Select the sample to show its tools."}</p>
    <Toolbar aria-label="Selection actions" isVisible={visible}>
      <Button disabled={disabled} onClick={() => act("Inspect")}>Inspect selection</Button>
      <Button disabled>Publish unavailable</Button>
      <Button disabled={disabled} onClick={() => act("Duplicate")}>Duplicate selection</Button>
      <Button disabled={disabled} onClick={() => act("Remove")}>Remove selection</Button>
    </Toolbar>
    {!visible && <Button disabled={disabled} onClick={() => { if (hold) setResult("Selection requested; host retained no selection."); else { setVisible(true); setCount(1); setResult("1 local item selected."); } }}>Select sample</Button>}
    <output aria-label="Toolbar result" aria-live="polite">{result}</output>
    <small>Local selection only. Arrow keys move between available tools.</small>
  </div>;
}

const initialQueue = [{ id: "brief", title: "Review the brief", description: "Read the attached outline before planning.", completed: false }, { id: "references", title: "Gather references", description: "Two local references are ready to review.", completed: true }];

export function QueueExample({ state = "default" }: { state?: ExampleState }) {
  const [items, setItems] = useState(initialQueue);
  const [open, setOpen] = useState(true);
  const [hold, setHold] = useState(false);
  const [locked, setLocked] = useState(false);
  const [result, setResult] = useState("Two sample work items. Nothing is running.");
  const disabled = locked || state === "disabled";
  const change = (label: string, apply: () => void) => {
    if (disabled) return;
    setResult(`${label} requested; ${hold ? "host retained the queue" : "accepted locally"}.`);
    if (!hold) apply();
  };
  return <div className="hkl-example-stack">
    <div className="hkl-example-row"><Checkbox label="Hold queue changes" checked={hold} onChange={event => setHold(event.target.checked)} /><Checkbox label="Disable queue" checked={locked} onChange={event => setLocked(event.target.checked)} /></div>
    <Queue><QueueSection open={open} onOpenChange={next => change(next ? "Expand" : "Collapse", () => setOpen(next))}>
      <QueueSectionTrigger aria-disabled={disabled || undefined} onClick={event => { if (disabled) event.preventDefault(); }}><QueueSectionLabel label=" Work queue" count={items.length} /></QueueSectionTrigger>
      <QueueSectionContent>{items.length ? <QueueList>{items.map(item => <QueueItem key={item.id} style={{ flexWrap: "wrap" }}>
        <QueueItemIndicator completed={item.completed} style={{ flexShrink: 0 }} />
        <div style={{ flex: "1 1 160px" }}><QueueItemContent completed={item.completed}>{item.title}</QueueItemContent><QueueItemDescription completed={item.completed}>{item.description}</QueueItemDescription>{item.id === "brief" && <QueueItemAttachment><QueueItemFile name="brief.md" /></QueueItemAttachment>}</div>
        <QueueItemActions><QueueItemAction disabled={disabled} aria-label={`${item.completed ? "Reopen" : "Complete"} ${item.title}`} onClick={() => change(item.completed ? "Reopen" : "Complete", () => setItems(items.map(current => current.id === item.id ? { ...current, completed: !current.completed } : current)))}>{item.completed ? "Reopen" : "Complete"}</QueueItemAction><QueueItemAction disabled={disabled} aria-label={`Remove ${item.title}`} onClick={() => change("Remove", () => setItems(items.filter(current => current.id !== item.id)))}>Remove</QueueItemAction></QueueItemActions>
      </QueueItem>)}</QueueList> : <p>Nothing queued. Add the sample work to explore the queue.</p>}</QueueSectionContent>
    </QueueSection></Queue>
    <Button disabled={disabled} onClick={() => change("Reset", () => { setItems(initialQueue); setOpen(true); })}>Reset queue</Button>
    <output aria-label="Queue result" aria-live="polite">{result}</output>
    <small>Synthetic work and file metadata only. No jobs dispatched or files read.</small>
  </div>;
}

const socialMarks: Record<string, Icon | string> = { Microsoft: new URL("./social-microsoft.svg", import.meta.url).href, Bitbucket: new URL("./social-bitbucket.svg", import.meta.url).href, Google: GoogleLogoIcon, Apple: AppleLogoIcon, GitHub: GithubLogoIcon, GitLab: GitlabLogoIcon, X: XLogoIcon, Facebook: FacebookLogoIcon, LinkedIn: LinkedinLogoIcon, Discord: DiscordLogoIcon, Slack: SlackLogoIcon, Figma: FigmaLogoIcon, Notion: NotionLogoIcon, Dropbox: DropboxLogoIcon, Spotify: SpotifyLogoIcon, Twitch: TwitchLogoIcon, Reddit: RedditLogoIcon, TikTok: TiktokLogoIcon, Instagram: InstagramLogoIcon, Telegram: TelegramLogoIcon, WhatsApp: WhatsappLogoIcon, Amazon: AmazonLogoIcon };

export function SocialButtonExample({ state = "default" }: { state?: ExampleState }) {
  const [hold, setHold] = useState(false);
  const [locked, setLocked] = useState(false);
  const [pending, setPending] = useState(false);
  const [provider, setProvider] = useState("GitHub");
  const ProviderMark = socialMarks[provider];
  const [accepted, setAccepted] = useState("none");
  const [appearance, setAppearance] = useState<"colorful" | "black" | "white">("colorful");
  const [size, setSize] = useState<"medium" | "small">("medium");
  const [fullWidth, setFullWidth] = useState(false);
  const [iconOnly, setIconOnly] = useState(false);
  const [result, setResult] = useState("Choose a provider to inspect its local callback. No sign-in occurs.");
  const disabled = locked || state === "disabled";
  const request = (next: string) => {
    if (disabled || pending) return;
    setResult(hold ? `${next} requested; host retained ${accepted}.` : `${next} request accepted locally; no authentication started.`);
    if (!hold) setAccepted(next);
  };
  return <div className="hkl-example-stack">
    <div className="hkl-example-row"><Checkbox label="Hold social requests" checked={hold} onChange={event => setHold(event.target.checked)} /><Checkbox label="Disable social buttons" checked={locked} onChange={event => setLocked(event.target.checked)} /><Checkbox label="Pending social request" checked={pending} onChange={event => setPending(event.target.checked)} /></div>
    <div className="hkl-example-row"><label>Social provider<Select aria-label="Social provider" value={provider} onChange={event => setProvider(event.target.value)}>{["Google", "Apple", "GitHub", "GitLab", "Microsoft", "X", "Facebook", "LinkedIn", "Discord", "Slack", "Figma", "Notion", "Dropbox", "Spotify", "Twitch", "Reddit", "TikTok", "Instagram", "Telegram", "WhatsApp", "Amazon", "Bitbucket", "Auth0", "Okta"].map(name => <option key={name}>{name}</option>)}</Select></label><label>Social appearance<Select aria-label="Social appearance" value={appearance} onChange={event => setAppearance(event.target.value as typeof appearance)}>{["colorful", "black", "white"].map(value => <option key={value}>{value}</option>)}</Select></label><label>Social size<Select aria-label="Social size" value={size} onChange={event => setSize(event.target.value as typeof size)}><option>medium</option><option>small</option></Select></label></div>
    <div className="hkl-example-row"><Checkbox label="Full-width social button" checked={fullWidth} onChange={event => setFullWidth(event.target.checked)} /><Checkbox label="Icon-only social button" checked={iconOnly} onChange={event => setIconOnly(event.target.checked)} /></div>
    <div className="hkl-example-row"><SocialButton provider={provider} icon={typeof ProviderMark === "string" ? <img src={ProviderMark} width={20} height={20} alt="" aria-hidden="true" /> : ProviderMark ? <ProviderMark size={20} aria-hidden="true" /> : <span>{provider.slice(0, 1)}</span>} appearance={appearance} size={size} fullWidth={fullWidth} iconOnly={iconOnly} style={!fullWidth && !iconOnly ? { width: 240, maxWidth: "100%" } : undefined} disabled={disabled} pending={pending} onClick={() => request(provider)} /></div>
    <output aria-label="Social result" aria-live="polite">{result}</output>
    <small>Reference-only local callbacks; no affiliation, OAuth, popup, redirect, credentials, or vendor pixel parity. Microsoft mark: <a href="https://learn.microsoft.com/en-us/entra/identity-platform/howto-add-branding-in-apps">Microsoft branding assets</a>. Bitbucket mark: <a href="https://atlassian.design/foundations/logos">Atlassian design assets</a>, subject to <a href="https://www.atlassian.com/legal/trademark">Atlassian trademark guidelines</a>. Marks belong to their respective owners. Other bundled marks use Phosphor; Auth0 and Okta still use illustrative initials.</small>
  </div>;
}
