import { useRef, useState, type ReactNode, type ComponentProps } from "react";
import { ThreadListPrimitive, ThreadListItemPrimitive, useAuiState, useAui, type ThreadListItemState } from "@assistant-ui/react";
import { Archive, ChatCircle, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import "./thread-list.css";

export type HarsoSidebarNavItem = {
  id: string;
  label: string;
  /** Optional glyph — Recent rows in the v3 spec are text-only (rule 7). */
  icon?: ReactNode;
  active?: boolean;
  unread?: boolean;
  count?: number;
  onSelect?: () => void;
};
export type HarsoSidebarNavProps = {
  label: string;
  heading?: boolean;
  items: readonly HarsoSidebarNavItem[];
};
/** Host-owned destinations; labels remain accessible in the shell's icon rail. */
export function HarsoSidebarNav({ label, heading = true, items }: HarsoSidebarNavProps) {
  return <nav className="hkc-sidebar-nav" aria-label={label}>
    {heading && <h2 className="hkc-thread-group">{label}</h2>}
    {items.map(item => <button key={item.id} type="button" className="hkc-sidebar-nav-row" title={item.label} aria-label={item.label} aria-current={item.active ? "page" : undefined} onClick={item.onSelect}>
      {item.icon && <span className="hkc-sidebar-nav-icon" aria-hidden="true">{item.icon}</span>}<span className="hkc-sidebar-nav-label">{item.label}</span>
      {item.unread && <span className="hkc-sidebar-nav-dot" aria-label="Unread" />}
      {item.count != null && item.count > 0 && <span className="hkc-sidebar-nav-count" aria-hidden="true">{item.count}</span>}
    </button>)}
  </nav>;
}

export type HarsoThreadGroup = "Today" | "Yesterday" | "Earlier";
export type HarsoThreadListProps = Omit<ComponentProps<typeof ThreadListPrimitive.Root>, "children"> & {
  groupBy?: (thread: Omit<ThreadListItemState, "isMain">) => HarsoThreadGroup;
};

function dayGroup(thread: Omit<ThreadListItemState, "isMain">): HarsoThreadGroup {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (!thread.lastMessageAt || thread.lastMessageAt >= today) return "Today";
  return thread.lastMessageAt >= yesterday ? "Yesterday" : "Earlier";
}

function ThreadRow() {
  const aui = useAui();
  const title = useAuiState(state => state.threadListItem.title || "Untitled conversation");
  const active = useAuiState(state => state.threads.mainThreadId === state.threadListItem.id);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [value, setValue] = useState(title);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const renameButton = useRef<HTMLButtonElement>(null);
  const deleteButton = useRef<HTMLButtonElement>(null);
  const finish = () => { setEditing(false); requestAnimationFrame(() => renameButton.current?.focus()); };

  const rename = async () => {
    if (saving) return;
    if (!value.trim()) { setError("Enter a conversation title."); return; }
    setSaving(true);
    try { await aui.threadListItem().rename(value.trim()); setError(""); finish(); }
    catch { setError("Could not rename conversation. Try again."); }
    finally { setSaving(false); }
  };

  return <ThreadListItemPrimitive.Root className="hkc-thread-row" data-slot="aui_thread-list-item">
    <div className="hkc-thread-row-line">
      {editing ? <form className="hkc-thread-rename" onSubmit={event => { event.preventDefault(); void rename(); }}>
        <input autoFocus aria-label="Conversation title" aria-invalid={!!error} value={value} disabled={saving}
          onChange={event => setValue(event.target.value)} onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); setError(""); finish(); } }} />
        <button type="submit" disabled={saving}>Save</button>
        <button type="button" disabled={saving} onClick={finish}>Cancel</button>
      </form> : <ThreadListItemPrimitive.Trigger className="hkc-thread-trigger" aria-current={active ? "page" : undefined} title={title}>
        <ChatCircle size={16} aria-hidden="true" /><span><ThreadListItemPrimitive.Title fallback="Untitled conversation" /></span>
      </ThreadListItemPrimitive.Trigger>}
      <div className="hkc-thread-row-actions" hidden={editing}>
        <button ref={renameButton} type="button" aria-label={`Rename ${title}`} title="Rename conversation" onClick={() => { setValue(title); setError(""); setConfirming(false); setEditing(true); }}><PencilSimple size={16} /></button>
        <ThreadListItemPrimitive.Archive aria-label={`Archive ${title}`} title="Archive conversation"><Archive size={16} /></ThreadListItemPrimitive.Archive>
        <button ref={deleteButton} type="button" aria-label={`Delete ${title}`} title="Delete conversation" aria-expanded={confirming} onClick={() => setConfirming(!confirming)}><Trash size={16} /></button>
      </div>
    </div>
    {error && <p role="alert" className="hkc-thread-list-error">{error}</p>}
    {confirming && <div className="hkc-thread-delete" role="group" aria-label={`Delete ${title}?`} onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); setConfirming(false); deleteButton.current?.focus(); } }}>
      <span>Delete this conversation?</span>
      <ThreadListItemPrimitive.Delete autoFocus>Confirm delete</ThreadListItemPrimitive.Delete>
      <button type="button" onClick={() => { setConfirming(false); deleteButton.current?.focus(); }}>Cancel</button>
    </div>}
  </ThreadListItemPrimitive.Root>;
}

export function HarsoThreadList({ groupBy = dayGroup, className = "", ...props }: HarsoThreadListProps) {
  const items = useAuiState(state => state.threads.threadItems);
  const ids = useAuiState(state => state.threads.threadIds);
  const loading = useAuiState(state => state.threads.isLoading);
  const groups = (["Today", "Yesterday", "Earlier"] as const).filter(group => items.some(item => ids.includes(item.id) && groupBy(item) === group));
  return <ThreadListPrimitive.Root {...props} className={`hkc-thread-list ${className}`} aria-label={props["aria-label"] ?? "Conversations"}>
    <ThreadListPrimitive.New className="hkc-thread-new" title="New conversation"><Plus size={16} aria-hidden="true" /><span>New conversation</span></ThreadListPrimitive.New>
    {loading ? <p role="status">Loading conversations…</p> : ids.length === 0 && <p className="hkc-thread-list-empty">No conversations yet.</p>}
    {groups.map(group => <section key={group} aria-label={group}>
      <h2 className="hkc-thread-group">{group}</h2>
      <ThreadListPrimitive.Items>{({ threadListItem }) => groupBy(threadListItem) === group ? <ThreadRow /> : null}</ThreadListPrimitive.Items>
    </section>)}
  </ThreadListPrimitive.Root>;
}
