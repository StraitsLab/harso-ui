import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type ReactNode } from "react";
import { Button } from "./primitives";
import { Image } from "./image";

export { AgentLimitsCard } from "./agent-limits";
export { AgentProgress, type AgentProgressProps } from "./agent-progress";
export { AgentThinking, type AgentThinkingProps } from "./agent-thinking";
export type AiChatProps = ComponentPropsWithRef<"section"> & {
  title?: string; navigation?: ReactNode; actions?: ReactNode; composer?: ReactNode; status?: ReactNode;
  panel?: { title: string; content: ReactNode; onClose: () => void } | null;
};
export function AiChat({ title = "AI chat", navigation, actions, composer, status, panel, children, className = "", ref, ...props }: AiChatProps) {
  const [navigationOpen, setNavigationOpen] = useState(true);
  const [compact, setCompact] = useState(true);
  const root = useRef<HTMLElement | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const dialog = useRef<HTMLDialogElement | null>(null);
  const panelOpen = Boolean(panel);
  const identity = useId();
  useLayoutEffect(() => {
    const element = dialog.current;
    if (!element || !panelOpen) return;
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => {
      element.close();
      if (returnFocus.current?.isConnected) returnFocus.current.focus({ preventScroll: true });
      returnFocus.current = null;
    };
  }, [panelOpen]);
  useLayoutEffect(() => {
    const element = dialog.current;
    if (!element || !panelOpen) return;
    const focused = element.contains(document.activeElement) ? document.activeElement as HTMLElement : null;
    if (element.open) element.close();
    element.setAttribute("closedby", "closerequest");
    if (compact) element.showModal(); else element.show();
    focused?.focus({ preventScroll: true });
  }, [panelOpen, compact]);
  useEffect(() => {
    if (!root.current || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(entries => { if (entries[0]) setCompact(entries[0].contentRect.width < 900); });
    observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  return <section {...props} ref={element => { root.current = element; if (typeof ref === "function") return ref(element); if (ref) ref.current = element; }} className={`hk-ai-chat hk-ai-workspace ${className}`} data-compact={compact} data-navigation={Boolean(navigation && navigationOpen)} data-panel={Boolean(panel)}>
    <header className="hk-ai-workspace-header"><div>{navigation && <Button aria-label="Toggle workspace navigation" aria-controls={`${identity}-navigation`} aria-expanded={navigationOpen} onClick={() => setNavigationOpen(open => !open)}>☰</Button>}<h2>{title}</h2></div><div>{status}{actions}</div></header>
    <div className="hk-ai-workspace-body">
      {navigation && <nav id={`${identity}-navigation`} aria-label="Chat workspace" className="hk-ai-workspace-navigation" hidden={!navigationOpen}>{navigation}</nav>}
      <div className="hk-ai-workspace-conversation"><div className="hk-ai-workspace-thread">{children}</div>{composer && <div className="hk-ai-workspace-composer">{composer}</div>}</div>
        {panel && <dialog ref={dialog} className="hk-ai-workspace-panel" aria-labelledby={`${identity}-panel-title`} onCancel={event => { event.preventDefault(); panel.onClose(); }}>
          <div className="hk-ai-workspace-panel-header"><h2 id={`${identity}-panel-title`}>{panel.title}</h2><Button aria-label="Close context panel" onClick={panel.onClose}>Close</Button></div>
          <div className="hk-ai-workspace-panel-content">{panel.content}</div>
        </dialog>}
    </div>
  </section>;
}
export type AiImageGenerationProps = AiChatProps & {
  src?: string; alt?: string; prompt?: string;
  state?: "idle" | "generating" | "complete" | "failed" | "stopped";
  remainingSeconds?: number; error?: string; onRetry?: () => void;
  feedback?: ReactNode; disabled?: boolean;
};
export function AiImageGeneration({ src, alt = "Generated image", prompt, state = src ? "complete" : "idle", remainingSeconds, error, onRetry, feedback, disabled = false, children, className = "", ...props }: AiImageGenerationProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  useEffect(() => { if (state === "generating") setFailedSource(null); }, [state]);
  const failed = state === "failed" || state === "complete" && Boolean(src && failedSource === src);
  const complete = state === "complete" && Boolean(src) && !failed;
  const estimate = state === "generating" && Number.isFinite(remainingSeconds) && remainingSeconds! >= 0 ? Math.ceil(remainingSeconds!) : null;
  return <AiChat {...props} title={props.title ?? "Image studio"} className={`hk-image-workspace ${className}`}>
    {children}
    <figure className="hk-image-generation-frame" data-state={failed ? "failed" : state} aria-busy={state === "generating" && !failed}>
      {complete ? <Image key={src} src={src} alt={alt} onError={() => setFailedSource(src!)} /> : failed ? <div role="alert"><p>{state === "failed" ? error || "Image generation failed" : "Image could not be loaded"}</p>{onRetry && <Button disabled={disabled} onClick={() => { if (!disabled) onRetry(); }}>Retry generation</Button>}</div> : <div className="hk-image-generation-placeholder"><span className="hk-image-generation-ripple" aria-hidden="true" /><p role="status">{state === "generating" ? "Generating image" : state === "stopped" ? "Generation stopped" : state === "complete" ? "No image supplied" : "Describe an image to begin"}</p>{estimate !== null && <p>Estimated {estimate} seconds remaining</p>}</div>}
      {prompt && <figcaption>{prompt}</figcaption>}
    </figure>
    {complete && feedback && <div className="hk-image-feedback" role="group" aria-label="Image feedback">{feedback}</div>}
  </AiChat>;
}
export type AiProfileProps = AiChatProps & {
  name: string; description?: string; avatar?: ReactNode; cover?: ReactNode;
  contributions?: ReactNode; activity?: ReactNode; agents?: ReactNode; tokens?: ReactNode;
  onEdit?: () => void; onShare?: () => void; disabled?: boolean;
};
export function AiProfile({ name, description, avatar, cover, contributions, activity, agents, tokens, onEdit, onShare, disabled = false, children, className = "", ...props }: AiProfileProps) {
  return <AiChat {...props} title={props.title ?? "Profile"} className={`hk-profile-workspace ${className}`}>
    {cover && <div className="hk-profile-cover">{cover}</div>}
    <div className="hk-profile-identity">
      {avatar ?? <span className="hk-ai-profile-avatar" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>}
      <div><h2>{name}</h2>{description && <p>{description}</p>}</div>
      <div className="hk-profile-actions"><Button disabled={disabled || !onShare} onClick={() => { if (!disabled) onShare?.(); }}>Share profile</Button><Button disabled={disabled || !onEdit} onClick={() => { if (!disabled) onEdit?.(); }}>Edit profile</Button></div>
    </div>
    {contributions && <div className="hk-profile-contributions">{contributions}</div>}
    {activity && <div className="hk-profile-activity">{activity}</div>}
    {(agents || tokens) && <div className="hk-profile-charts">{agents}{tokens}</div>}
    {children}
  </AiChat>;
}
export type ChatStarterProps = Omit<AiChatProps, "panel" | "status" | "onSelect"> & {
  view?: "chat" | "dashboard" | "sign-in" | "sign-up";
  teamMenu?: ReactNode; userMenu?: ReactNode; history?: ReactNode; thinking?: ReactNode;
  dashboard?: ReactNode; signIn?: ReactNode; signUp?: ReactNode;
  suggestions?: readonly string[]; onSelect?: (value: string) => void; disabled?: boolean;
};
export function ChatStarter({ title = "Start a conversation", view = "chat", teamMenu, userMenu, history, thinking, dashboard, signIn, signUp, navigation, composer, suggestions = [], onSelect, disabled = false, children, className = "", ...props }: ChatStarterProps) {
  const pages = { dashboard, "sign-in": signIn, "sign-up": signUp };
  const sidebar = teamMenu || navigation || history || userMenu ? <>{teamMenu}{navigation}{history}{userMenu}</> : undefined;
  return <AiChat {...props} title={title} className={`hk-starter-workspace ${className}`} navigation={sidebar} composer={view === "chat" ? composer : undefined} status={view === "chat" ? thinking : undefined}>
    {view === "chat" ? <>{children}{suggestions.length > 0 && <div className="hk-starter-suggestions" role="group" aria-label="Conversation starters">{suggestions.map((suggestion, index) => <Button key={index} disabled={disabled || !onSelect} onClick={() => { if (!disabled) onSelect?.(suggestion); }}>{suggestion}</Button>)}</div>}</> : pages[view] ?? <p>No {view} content supplied.</p>}
  </AiChat>;
}
export { TaskList, WebSearch } from "./agent-trails";
export type { TaskListProps, AgentTrailTask, AgentTrailStep, WebSearchProps, WebSearchResult, WebSearchStep, WebSearchSource } from "./agent-trails";
