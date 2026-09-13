import { useState } from "react";
import { DownloadSimpleIcon } from "@phosphor-icons/react";
import { Button, Checkbox, Conversation, ConversationContent, ConversationDownload, ConversationEmptyState, ConversationScrollButton, Disclosure, Field, Input, Message, MessageActionButton, MessageActions, MessageBranch, MessageBranchContent, MessageBranchNext, MessageBranchPage, MessageBranchPrevious, MessageBranchSelector, MessageContent, MessageResponse, MessageToolbar, Shimmer, Suggestion, Suggestions, type ConversationText } from "@harso/ui";
import type { ExampleState } from "./examples";

export const conversationExports = ["Conversation", "Message", "Suggestion", "Shimmer"] as const;
export type ConversationExport = typeof conversationExports[number];
export const conversationNotes: Record<ConversationExport, { behavior: string; example: string }> = {
  Conversation: { behavior: "An open, continuous reading surface. New content follows only while the reader stays at the bottom; an explicit Latest response button returns to new text without moving keyboard focus. Empty and host-streaming states are explicit. Download formats only supplied text and calls the host; this synthetic example implements its own user-triggered Markdown file download. No transcript store, transport or SDK instance.", example: '<Conversation key={conversationId}>\n  <ConversationContent aria-busy={streaming}>{messages}</ConversationContent>\n  <ConversationScrollButton />\n</Conversation>\n<ConversationDownload messages={visibleText} onDownload={saveWithHostPolicy} />' },
  Message: { behavior: "Role labels and generous type replace chat bubbles. Markdown supports GFM tables/lists and live text replacement; raw HTML and remote images remain inert, and only absolute HTTP(S) links are clickable. No custom plugins, math renderer or syntax highlighter are introduced here. Branch controls use host-controlled selection or local display state, clamp missing branches, and preserve keyed drafts while hiding inactive versions. Actions remain host callbacks, never implicit retries or exports.", example: '<Message from="assistant"><MessageContent><MessageResponse streaming={streaming}>{text}</MessageResponse></MessageContent></Message>\n<MessageBranch branch={version} onBranchChange={requestVersion}>\n  <MessageBranchContent>{versions}</MessageBranchContent>\n  <MessageBranchSelector><MessageBranchPrevious /><MessageBranchPage /><MessageBranchNext /></MessageBranchSelector>\n</MessageBranch>' },
  Suggestion: { behavior: "Quiet, wrapping suggestions pass their supplied text to the host. Selecting one can fill a draft, but never sends it. Native disabled, keyboard activation and touch behavior are retained. The draft below belongs to this example, not the library.", example: '<Suggestions><Suggestion suggestion="Show me the trade-offs" onSelect={setDraft} /></Suggestions>' },
  Shimmer: { behavior: "A restrained text sweep indicates an explicitly supplied waiting state, not invented progress. Static, duration, spread and semantic-element variants share the same legible tokens. Reduced motion and forced colors remove animation and gradient. An inactive state is plain text; no timers or model activity run inside the component.", example: '<Shimmer active={waiting} duration={2} spread={2} as="p">Waiting for a response</Shimmer>' },
};

const initialMessages: ConversationText[] = [
  { role: "user", content: "Find the strongest direction for the launch. Shape it into something I can act on." },
  { role: "assistant", content: "## Start smaller.\nMake the first experience exceptional.\n\nThe research points to a focused launch. One audience. One excellent workflow.\n\n- Choose the first people we can help.\n- Make one useful result effortless.\n- Learn from what they do next." },
];
const updateText = "\n\nKeep the experience quiet and the outcome clear. A useful next step matters more than another panel, badge, or setting. Let the work come forward when it needs attention.";

function ConversationSample({ state }: { state: ExampleState }) {
  const [messages, setMessages] = useState(initialMessages);
  const [streaming, setStreaming] = useState(false);
  const [session, setSession] = useState(0);
  const [exported, setExported] = useState("");
  const [refuse, setRefuse] = useState(false);
  const [feedback, setFeedback] = useState<Record<number, string>>({});
  const download = (markdown: string) => {
    if (refuse) { setExported("Download declined by example host"); return; }
    const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "harso-synthetic-conversation.md";
    document.body.append(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    setExported("Synthetic transcript exported");
  };
  return <div className="hkc-stack">
    <Checkbox label="Keep supplied conversation" checked={refuse} onChange={event => setRefuse(event.target.checked)} />
    <div className="hkls-options"><Button disabled={state === "disabled"} onClick={() => setMessages(previous => previous.length ? previous.map((message, index) => index === previous.length - 1 ? { ...message, content: message.content + updateText } : message) : initialMessages)}>Add sample update</Button><Button onClick={() => setMessages([])}>Clear sample</Button><Button onClick={() => { setSession(previous => previous + 1); setMessages(initialMessages); setStreaming(false); setExported(""); }}>Switch sample conversation</Button><Checkbox label="Streaming sample" checked={streaming} onChange={event => setStreaming(event.target.checked)} /></div>
    <div className="hkc-chat-sample" data-testid="conversation-sample"><div className="hkc-chat-heading"><span>Launch research</span><ConversationDownload messages={messages} onDownload={download} aria-label="Download conversation" disabled={state === "disabled"}><DownloadSimpleIcon aria-hidden="true" size={18} /></ConversationDownload></div>
      <Conversation key={session}><ConversationContent aria-busy={streaming || undefined}>{messages.length ? messages.map((message, index) => <Message key={index} from={message.role}><MessageContent><MessageResponse streaming={streaming && index === messages.length - 1}>{message.content}</MessageResponse></MessageContent><MessageActions><MessageActionButton label="Copy" disabled={state === "disabled"} onClick={() => { void navigator.clipboard.writeText(message.content).then(() => setExported("Message copied"), () => setExported("Copy failed")); }} />{message.role === "assistant" ? <>{["Helpful", "Not helpful"].map(label => <MessageActionButton key={label} label={label} disabled={state === "disabled"} aria-pressed={feedback[index] === label} onClick={() => { if (!refuse) setFeedback(previous => ({ ...previous, [index]: previous[index] === label ? "" : label })); }} />)}<MessageActionButton label="Retry" disabled={state === "disabled" || streaming} onClick={() => setExported("Retry requested; no runtime is connected")} /></> : <MessageActionButton label="Edit" disabled={state === "disabled"} onClick={() => { const text = window.prompt("Edit message", message.content); if (text?.trim() && !refuse) setMessages(previous => previous.map((item, position) => position === index ? { ...item, content: text } : item)); }} />}</MessageActions></Message>) : <ConversationEmptyState><Suggestions><Suggestion suggestion="Help me find a direction" onSelect={() => setMessages(initialMessages)} disabled={state === "disabled"} /></Suggestions></ConversationEmptyState>}{streaming && messages.length > 0 && <Shimmer as="p">Receiving sample text</Shimmer>}</ConversationContent><ConversationScrollButton disabled={state === "disabled"} onClick={event => { if (refuse) event.preventDefault(); }} /></Conversation>
    </div><output aria-label="Export result">{exported}</output>
  </div>;
}

function MessageSample({ state }: { state: ExampleState }) {
  const [version, setVersion] = useState(0);
  const [controlled, setControlled] = useState(true);
  const [refuse, setRefuse] = useState(false);
  const [action, setAction] = useState("");
  const [helpful, setHelpful] = useState(false);
  const [unhelpful, setUnhelpful] = useState(false);
  const [unsafe, setUnsafe] = useState(false);
  const text = unsafe ? '## Safe to read.\n\n<script>alert("not executed")</script>\n\n![An inert remote image](https://untrusted.invalid/tracker.png)\n\n[Unsafe link](javascript:alert%281%29) · [Local secret](/private) · [Public example](https://example.com)\n\n- [x] Raw HTML is not executed.\n- [ ] Remote images are not requested.' : "## A focused launch.\nOne audience. One excellent workflow.\n\n| Start with | Leave for later |\n| --- | --- |\n| A useful first result | More configuration |\n| Clear next steps | More dashboards |\n\n> The interface should make room for the work.";
  return <div className="hkc-stack"><div className="hkls-options"><Checkbox label="Host controls version" checked={controlled} onChange={event => setControlled(event.target.checked)} /><Checkbox label="Keep host version" checked={refuse} onChange={event => setRefuse(event.target.checked)} /><Checkbox label="Untrusted Markdown sample" checked={unsafe} onChange={event => setUnsafe(event.target.checked)} /></div><div className="hkc-message-sample" data-testid="message-sample"><Message from="assistant"><MessageBranch key={String(controlled)} branch={controlled ? version : undefined} onBranchChange={next => { setAction(`Requested version ${next + 1}`); if (!refuse) setVersion(next); }}>
    <MessageBranchContent><div key="focused"><MessageContent><MessageResponse>{text}</MessageResponse></MessageContent><Disclosure summary="Notes on this version"><Field label="Version one notes">{props => <Input {...props} placeholder="Only this local example keeps these notes" />}</Field></Disclosure></div><div key="invitation"><MessageContent><MessageResponse>{"## Begin with an invitation.\nMake a small group feel understood.\n\nListen first. Shape the first experience around the work they actually need to do."}</MessageResponse></MessageContent></div></MessageBranchContent>
    <MessageToolbar><MessageBranchSelector><MessageBranchPrevious disabled={state === "disabled"} /><MessageBranchPage /><MessageBranchNext disabled={state === "disabled"} /></MessageBranchSelector><MessageActions><MessageActionButton label="Copy" disabled={state === "disabled"} onClick={() => { void navigator.clipboard.writeText(version === 0 ? text : "## Begin with an invitation.\nMake a small group feel understood.\n\nListen first. Shape the first experience around the work they actually need to do.").then(() => setAction("Message copied"), () => setAction("Copy failed")); }} /><MessageActionButton label="Mark helpful" tooltip="This was useful" aria-pressed={helpful} disabled={state === "disabled"} onClick={() => { setHelpful(previous => !previous); setUnhelpful(false); }} /><MessageActionButton label="Not helpful" aria-pressed={unhelpful} disabled={state === "disabled"} onClick={() => { setUnhelpful(previous => !previous); setHelpful(false); }} /><MessageActionButton label="Request another answer" tooltip="Ask for another direction" disabled={state === "disabled"} onClick={() => setAction("Another answer requested; no runtime is connected")} /></MessageActions></MessageToolbar>
  </MessageBranch></Message></div><output aria-label="Message action">{action}</output></div>;
}

export function ConversationExample({ component, state }: { component: ConversationExport; state: ExampleState }) {
  const [draft, setDraft] = useState("");
  const [active, setActive] = useState(true);
  const [waitingText, setWaitingText] = useState("Making room for the next idea.");
  if (component === "Conversation") return <ConversationSample state={state} />;
  if (component === "Message") return <MessageSample state={state} />;
  if (component === "Suggestion") return <div className="hkc-stack"><h3>A place to begin.</h3><Suggestions>{["Show me the trade-offs", "Find a simpler approach", state === "long-content" ? "Help me decide what to do first without adding any unnecessary complexity to the experience" : "What should we do first?"].map(suggestion => <Suggestion key={suggestion} suggestion={suggestion} onSelect={setDraft} disabled={state === "disabled"} />)}</Suggestions><Field label="Draft, not sent">{props => <Input {...props} value={draft} onChange={event => setDraft(event.target.value)} />}</Field></div>;
  return <div className="hkc-stack"><Checkbox label="Waiting state" checked={active} onChange={event => setActive(event.target.checked)} /><Field label="Waiting text">{props => <Input {...props} value={waitingText} onChange={event => setWaitingText(event.target.value)} />}</Field><Shimmer as="h2" active={active}>{waitingText}</Shimmer><Shimmer as="p" active={active} duration={4} spread={4}>A slower, wider sweep.</Shimmer><Shimmer active={false}>Nothing is running in this example.</Shimmer></div>;
}
