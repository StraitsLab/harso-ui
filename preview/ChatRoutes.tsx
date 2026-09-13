import { useEffect, useState, type ComponentType } from "react";
import { KitProvider, Select, type Appearance, type Palette } from "../src";
import { chatCatalog } from "./chat-catalog";
import { ChatThreadExample } from "./chat-thread-example";
import { ChatComposerExample } from "./chat-composer-example";
import { ChatPartsExample } from "./chat-parts-example";
import { ChatMarkdownExample } from "./chat-markdown-example";
import { ChatShellExample } from "./chat-shell-example";
import "./chat-routes.css";

export type ChatRouteId = typeof chatCatalog[number]["id"];
const routes: Record<ChatRouteId, ComponentType> = {
  "harso:chat-thread": ChatThreadExample,
  "harso:chat-composer": ChatComposerExample,
  "harso:chat-parts": ChatPartsExample,
  "harso:chat-markdown": ChatMarkdownExample,
  "harso:chat-shell": ChatShellExample,
};

export function chatRouteFromHash(): ChatRouteId | undefined {
  let hash: string;
  try {
    hash = decodeURIComponent(window.location.hash.slice(1).split("?")[0]);
  } catch {
    // Invalid deep links belong to the library fallback, not a failed App mount.
    return undefined;
  }
  return chatCatalog.some(entry => entry.id === hash) ? (hash as ChatRouteId) : undefined;
}

/** Full-height app page for the assistant-ui based conversation family: no docs chrome, the example IS the page. */
export function ChatRoutePage({ route }: { route: ChatRouteId }) {
  const [appearance, setAppearance] = useState<Appearance>("system");
  const [palette, setPalette] = useState<Palette>("clean");
  const entry = chatCatalog.find(item => item.id === route)!;
  const Example = routes[route];
  useEffect(() => { document.title = `${entry.name} · Harso`; }, [entry.name]);
  return <KitProvider appearance={appearance} palette={palette} className="hkl-chat-root">
    <header className="hkl-chat-header">
      <a className="hkl-chat-wordmark" href="#">Harso<span>/</span>chat</a>
      <nav className="hkl-chat-routes" aria-label="Conversation examples">{chatCatalog.map(item => <a key={item.id} href={`#${item.id}`} aria-current={item.id === route ? "page" : undefined}>{item.name.replace("Conversation ", "").toLowerCase()}</a>)}</nav>
      <div className="hkl-chat-theme">
        <label className="hk-sr-only" htmlFor="chat-appearance">Appearance</label>
        <Select id="chat-appearance" value={appearance} onChange={event => setAppearance(event.target.value as Appearance)}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></Select>
        <label className="hk-sr-only" htmlFor="chat-palette">Palette</label>
        <Select id="chat-palette" value={palette} onChange={event => setPalette(event.target.value as Palette)}><option value="clean">Clean</option><option value="cozy">Cozy</option></Select>
      </div>
    </header>
    <main className="hkl-chat-stage" data-route={route} data-testid="live-example"><Example /></main>
  </KitProvider>;
}
