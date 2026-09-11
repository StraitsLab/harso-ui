import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type CSSProperties, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";

type AudioDevice = { deviceId: string; label: string };
type AudioSnapshot = { devices?: readonly AudioDevice[]; permission?: "granted" | "denied" | "unknown"; loading?: boolean; error?: string | null; loadDevices?: () => void | Promise<void>; browserManaged?: boolean };
type SelectorState = {
  value?: string | null; disabled: boolean; readOnly: boolean; setValue: (value: string) => void;
  open: boolean; setOpen: (open: boolean) => void; search: string; setSearch: (search: string) => void;
  trigger: HTMLButtonElement | null; setTrigger: (trigger: HTMLButtonElement | null) => void;
  register: (id: string, text: string | null) => void; hasMatches: boolean; modal: boolean;
};
const SelectorValue = createContext<SelectorState | null>(null);
const HiddenSelectorGroup = createContext(false);
const AudioDevices = createContext<AudioSnapshot>({});
function useSelector() { return useContext(SelectorValue); }
function matches(text: string, query: string) {
  const normalized = text.toLocaleLowerCase();
  let position = 0;
  for (const character of query.trim().toLocaleLowerCase()) {
    const found = normalized.indexOf(character, position);
    if (found < 0) return false;
    position = found + 1;
  }
  return true;
}
type SelectorProps = ComponentPropsWithRef<"div"> & {
  value?: string | null; defaultValue?: string; onValueChange?: (value: string) => void; disabled?: boolean; readOnly?: boolean;
  open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void;
  search?: string; defaultSearch?: string; onSearchChange?: (search: string) => void;
};
function SelectorRoot({ children, className = "", value, defaultValue, onValueChange, disabled = false, readOnly = false, open, defaultOpen = false, onOpenChange, search, defaultSearch = "", onSearchChange, modal = true, ...props }: SelectorProps & { modal?: boolean }) {
  const [local, setLocal] = useState(defaultValue);
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const [localSearch, setLocalSearch] = useState(defaultSearch);
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null);
  const [items, setItems] = useState(new Map<string, string>());
  const register = useCallback((id: string, text: string | null) => setItems(previous => {
    if (text === null ? !previous.has(id) : previous.get(id) === text) return previous;
    const next = new Map(previous);
    if (text === null) next.delete(id); else next.set(id, text);
    return next;
  }), []);
  const current = value === undefined ? local : value;
  const currentOpen = open ?? localOpen;
  const currentSearch = search ?? localSearch;
  const setOpen = (next: boolean) => {
    if ((next && disabled) || next === currentOpen) return;
    if (open === undefined) setLocalOpen(next);
    if (!next && search === undefined) setLocalSearch("");
    onOpenChange?.(next);
  };
  const setSearch = (next: string) => {
    if (disabled || next === currentSearch) return;
    if (search === undefined) setLocalSearch(next);
    onSearchChange?.(next);
  };
  const setValue = (next: string) => {
    if (disabled || readOnly || next === current) return;
    if (value === undefined) setLocal(next);
    onValueChange?.(next);
  };
  return <SelectorValue value={{ value: current, disabled, readOnly, setValue, open: currentOpen, setOpen, search: currentSearch, setSearch, trigger, setTrigger, register, hasMatches: [...items.values()].some(text => matches(text, currentSearch)), modal }}><Dialog.Root open={currentOpen} onOpenChange={setOpen} modal={modal}><div {...props} className={`hk-selector ${className}`}>{children}</div></Dialog.Root></SelectorValue>;
}
function slot(className: string) { return function Slot({ className: extra = "", ...props }: ComponentPropsWithRef<"div">) { return <div {...props} className={`${className} ${extra}`} />; }; }
function buttonSlot(className: string) {
  return function ButtonSlot({ className: extra = "", ref, disabled, ...props }: ComponentPropsWithRef<"button">) {
    const selector = useSelector();
    const setTrigger = selector?.setTrigger;
    const anchor = useCallback((node: HTMLButtonElement | null) => {
      setTrigger?.(node);
      if (typeof ref === "function") return ref(node);
      if (ref) ref.current = node;
    }, [ref, setTrigger]);
    return <Dialog.Trigger {...props} ref={anchor} type="button" disabled={disabled || selector?.disabled} className={`${className} ${extra}`} />;
  };
}
function inputSlot(className: string) {
  return function InputSlot({ className: extra = "", onChange, disabled, ...props }: Omit<ComponentPropsWithRef<"input">, "value" | "defaultValue">) {
    const selector = useSelector();
    return <input {...props} aria-label={props["aria-label"] ?? "Search options"} data-hk-selector-search="" type="text" value={selector?.search ?? ""} disabled={disabled || selector?.disabled} onChange={event => { onChange?.(event); if (!event.defaultPrevented) selector?.setSearch(event.target.value); }} className={`${className} ${extra}`} />;
  };
}
function contentSlot(className: string, defaultTitle: string) {
  return function Content({ children, className: extra = "", title = defaultTitle, onKeyDown, onOpenAutoFocus, ref, style, ...props }: Omit<ComponentPropsWithRef<typeof Dialog.Content>, "title"> & { title?: ReactNode }) {
    const selector = useSelector();
    const content = useRef<HTMLDivElement | null>(null);
    const [position, setPosition] = useState<CSSProperties>({});
    const trigger = selector?.trigger;
    const open = selector?.open;
    const modal = selector?.modal;
    useLayoutEffect(() => {
      if (modal || !open || !trigger) return;
      const update = () => {
        const bounds = trigger.getBoundingClientRect();
        const width = Math.min(bounds.width, window.innerWidth - 24);
        const below = window.innerHeight - bounds.bottom - 20;
        const above = below < 180 && bounds.top > below;
        setPosition({ width, left: Math.max(12, Math.min(bounds.left, window.innerWidth - width - 12)), top: above ? undefined : bounds.bottom + 8, bottom: above ? window.innerHeight - bounds.top + 8 : undefined, maxHeight: Math.max(80, above ? bounds.top - 20 : below) });
      };
      update();
      const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(update);
      observer?.observe(trigger);
      window.addEventListener("resize", update);
      window.addEventListener("scroll", update, true);
      return () => { observer?.disconnect(); window.removeEventListener("resize", update); window.removeEventListener("scroll", update, true); };
    }, [trigger, modal, open]);
    const surface = <Dialog.Content {...props} ref={element => { content.current = element; if (typeof ref === "function") return ref(element); if (ref) ref.current = element; }} onOpenAutoFocus={event => {
      onOpenAutoFocus?.(event);
      if (event.defaultPrevented) return;
      const target = content.current?.querySelector<HTMLElement>("[data-hk-selector-search]:not(:disabled), [data-hk-selector-item]:not([hidden]):not(:disabled)");
      if (target) { event.preventDefault(); target.focus(); }
    }} aria-describedby={props["aria-describedby"]} className={`hk-selector-surface ${modal ? "hk-selector-modal" : "hk-selector-popover"} ${className} ${extra}`} style={{ ...position, ...style }} onKeyDown={event => {
      onKeyDown?.(event);
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.nativeEvent.isComposing) return;
      const target = event.target as HTMLElement;
      const searchInput = target.matches("[data-hk-selector-search]");
      const choice = target.closest<HTMLElement>("[data-hk-selector-item]");
      if (!searchInput && target !== choice) return;
      if (!(["ArrowDown", "ArrowUp"].includes(event.key) || (!searchInput && ["Home", "End"].includes(event.key)))) return;
      const choices = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("[data-hk-selector-item]:not([hidden]):not(:disabled):not([aria-disabled='true'])"));
      if (!choices.length) return;
      event.preventDefault();
      const current = choices.indexOf(target as HTMLButtonElement);
      const index = event.key === "Home" ? 0 : event.key === "End" ? choices.length - 1 : event.key === "ArrowDown" ? (current + 1) % choices.length : (current < 0 ? choices.length - 1 : (current - 1 + choices.length) % choices.length);
      choices[index].focus();
    }}><div className="hk-selector-heading"><Dialog.Title>{title}</Dialog.Title><Dialog.Close type="button" aria-label="Close selector" className="hk-selector-close">×</Dialog.Close></div>{children}</Dialog.Content>;
    return <Dialog.Portal container={trigger?.closest<HTMLElement>(".harso-kit") ?? undefined}>{modal && <Dialog.Overlay className="hk-selector-overlay" />}{surface}</Dialog.Portal>;
  };
}
function emptySlot(className: string, fallback: string) {
  return function Empty({ children = fallback, className: extra = "", ...props }: ComponentPropsWithRef<"div">) {
    const selector = useSelector();
    return selector?.hasMatches ? null : <div {...props} role="status" className={`${className} ${extra}`}>{children}</div>;
  };
}
function groupSlot(className: string) {
  return function Group({ heading, children, className: extra = "", ...props }: ComponentPropsWithRef<"div"> & { heading?: string }) {
    const parentHidden = useContext(HiddenSelectorGroup);
    const hidden = parentHidden || !!props.hidden || props.style?.display === "none" || props.style?.visibility === "hidden" || props.style?.visibility === "collapse";
    return <HiddenSelectorGroup value={hidden}><div {...props} role="group" aria-label={props["aria-label"] ?? heading} className={`hk-selector-group ${className} ${extra}`}>{heading && <div className="hk-selector-group-heading">{heading}</div>}{children}</div></HiddenSelectorGroup>;
  };
}
function selectionItem(className: string) {
  return function SelectionItem({ value, className: extra = "", disabled = false, onClick, children, keywords = [], searchValue, ref, ...props }: ComponentPropsWithRef<"button"> & { value: string; keywords?: readonly string[]; searchValue?: string }) {
    const selector = useSelector();
    const groupHidden = useContext(HiddenSelectorGroup);
    const node = useRef<HTMLButtonElement | null>(null);
    const identity = useId();
    const register = selector?.register;
    const [text, setText] = useState(searchValue ?? value);
    const keywordText = keywords.join(" ");
    useLayoutEffect(() => {
      const label = `${searchValue ?? node.current?.textContent ?? value} ${keywordText}`;
      setText(label);
      register?.(identity, props.hidden || groupHidden ? null : label);
      return () => register?.(identity, null);
    }, [children, searchValue, value, keywordText, register, identity, props.hidden, groupHidden]);
    const unavailable = disabled || selector?.disabled;
    return <button {...props} ref={element => { node.current = element; if (typeof ref === "function") return ref(element); if (ref) ref.current = element; }} data-hk-selector-item="" hidden={props.hidden || groupHidden || !matches(text, selector?.search ?? "")} type="button" className={`${className} ${extra}`} disabled={unavailable}
      aria-pressed={selector?.value === value} aria-disabled={selector?.readOnly || unavailable || undefined}
      onClick={event => {
        if (unavailable) return;
        onClick?.(event);
        if (!event.defaultPrevented && !selector?.readOnly) { selector?.setValue(value); selector?.setOpen(false); }
      }}>{children}</button>;
  };
}

export const ModelSelector = SelectorRoot;
export const ModelSelectorTrigger = buttonSlot("hk-model-trigger");
export const ModelSelectorContent = contentSlot("hk-model-content", "Choose a model");
export const ModelSelectorDialog = contentSlot("hk-model-dialog", "Choose a model");
export const ModelSelectorInput = inputSlot("hk-model-input");
export const ModelSelectorList = slot("hk-model-list");
export const ModelSelectorEmpty = emptySlot("hk-model-empty", "No models match your search");
export const ModelSelectorGroup = groupSlot("hk-model-group");
export const ModelSelectorItem = selectionItem("hk-model-item");
export const ModelSelectorShortcut = slot("hk-model-shortcut");
export const ModelSelectorSeparator = ({ className = "", ...props }: ComponentPropsWithRef<"hr">) => <hr {...props} className={`hk-model-separator ${className}`} />;
export const ModelSelectorLogo = ({ children, ...props }: ComponentPropsWithRef<"span">) => <span {...props} className="hk-model-logo">{children}</span>;
export const ModelSelectorLogoGroup = slot("hk-model-logo-group");
export const ModelSelectorName = ({ children, ...props }: ComponentPropsWithRef<"span">) => <span {...props} className="hk-model-name">{children}</span>;

export function MicSelector({ devices, permission, loading, error, loadDevices, manageDevices = false, onDevicesChange, ...props }: SelectorProps & Omit<AudioSnapshot, "browserManaged"> & { manageDevices?: boolean; onDevicesChange?: (devices: readonly AudioDevice[]) => boolean | void }) {
  const [snapshot, setSnapshot] = useState<{ devices: AudioDevice[]; loading: boolean; error: string | null }>({ devices: [], loading: false, error: null });
  const request = useRef(0);
  const changed = useRef(onDevicesChange);
  useEffect(() => { changed.current = onDevicesChange; }, [onDevicesChange]);
  const refresh = useCallback(async () => {
    if (!manageDevices || props.disabled) return;
    const sequence = ++request.current;
    setSnapshot(previous => ({ ...previous, loading: true, error: null }));
    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) throw new Error("Microphone discovery is unavailable.");
      const result = await navigator.mediaDevices.enumerateDevices();
      if (sequence !== request.current) return;
      const inputs = result.filter(device => device.kind === "audioinput").map(device => ({ deviceId: device.deviceId, label: device.label }));
      const accepted = changed.current?.(inputs) !== false;
      setSnapshot(previous => ({ devices: accepted ? inputs : previous.devices, loading: false, error: null }));
    } catch (reason) {
      if (sequence === request.current) setSnapshot(previous => ({ ...previous, loading: false, error: reason instanceof Error ? reason.message : "Microphone discovery failed." }));
    }
  }, [manageDevices, props.disabled]);
  useEffect(() => {
    if (!manageDevices || props.disabled) return;
    const media = typeof navigator === "undefined" ? undefined : navigator.mediaDevices;
    const update = () => { void refresh(); };
    media?.addEventListener?.("devicechange", update);
    void refresh();
    return () => { request.current++; media?.removeEventListener?.("devicechange", update); };
  }, [manageDevices, props.disabled, refresh]);
  return <AudioDevices value={{ devices: devices ?? (manageDevices ? snapshot.devices : undefined), permission, loading: loading ?? (manageDevices && !props.disabled && snapshot.loading), error: error === undefined && manageDevices ? snapshot.error : error, loadDevices: loadDevices ?? (manageDevices ? refresh : undefined), browserManaged: manageDevices && !loadDevices }}><SelectorRoot {...props} modal={false} /></AudioDevices>;
}
export const MicSelectorTrigger = buttonSlot("hk-mic-trigger");
export function MicSelectorValue({ children, placeholder = "Choose microphone", ...props }: ComponentPropsWithRef<"span"> & { placeholder?: string }) {
  const selector = useSelector();
  const { devices } = useAudioDevices();
  const index = devices.findIndex(device => device.deviceId === selector?.value);
  return <span {...props} className="hk-mic-value">{children ?? (index < 0 ? placeholder : devices[index].label || `Microphone ${index + 1}`)}</span>;
}
const MicContent = contentSlot("hk-mic-content", "Choose a microphone");
export function MicSelectorContent({ children, ...props }: ComponentPropsWithRef<typeof MicContent>) {
  const { loading, error, permission, loadDevices, browserManaged } = useAudioDevices();
  const selector = useSelector();
  const [requestError, setRequestError] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const request = async () => {
    if (!loadDevices || requesting || selector?.disabled) return;
    setRequesting(true);
    setRequestError(false);
    try { await loadDevices(); } catch { setRequestError(true); } finally { setRequesting(false); }
  };
  return <MicContent {...props}>{loading && <div role="status">Loading microphones…</div>}{error && <div role="alert">{error}</div>}{requestError && <div role="alert">The microphone request failed. Try again.</div>}{permission === "denied" && <p>Microphone access is denied. Review your device permissions.</p>}{loadDevices && <button className="hk-selector-device-action" type="button" disabled={loading || requesting || selector?.disabled} onClick={() => { void request(); }}>{requesting ? "Requesting microphones…" : browserManaged || permission === "granted" ? "Refresh microphones" : "Request microphone access"}</button>}{children}</MicContent>;
}
export const MicSelectorInput = inputSlot("hk-mic-input");
export function MicSelectorList({ children, className = "", ...props }: Omit<ComponentPropsWithRef<"div">, "children"> & { children?: ReactNode | ((devices: readonly AudioDevice[]) => ReactNode) }) {
  const { devices } = useAudioDevices();
  return <div {...props} className={`hk-mic-list ${className}`}>{typeof children === "function" ? children(devices) : children}</div>;
}
export const MicSelectorEmpty = emptySlot("hk-mic-empty", "No microphones match your search");
export const MicSelectorItem = selectionItem("hk-mic-item");
export function MicSelectorLabel({ children, device, ...props }: ComponentPropsWithRef<"span"> & { device?: AudioDevice }) {
  const parts = device?.label.match(/^(.*?)\s*(\([a-f\d]{4}:[a-f\d]{4}\))$/i);
  return <span {...props} className="hk-mic-label">{children ?? (parts ? <>{parts[1]} <span className="hk-mic-device-id">{parts[2]}</span></> : device?.label || "Microphone")}</span>;
}
export function useAudioDevices() {
  const { devices = [], permission = "unknown", loading = false, error = null, loadDevices, browserManaged = false } = useContext(AudioDevices);
  return { devices, permission, hasPermission: permission === "granted", loading, error, loadDevices, browserManaged };
}

export const VoiceSelector = SelectorRoot;
export const VoiceSelectorTrigger = buttonSlot("hk-voice-trigger");
export const VoiceSelectorContent = contentSlot("hk-voice-content", "Choose a voice");
export const VoiceSelectorDialog = contentSlot("hk-voice-dialog", "Choose a voice");
export const VoiceSelectorInput = inputSlot("hk-voice-input");
export const VoiceSelectorList = slot("hk-voice-list");
export const VoiceSelectorEmpty = emptySlot("hk-voice-empty", "No voices match your search");
export const VoiceSelectorGroup = groupSlot("hk-voice-group");
export const VoiceSelectorItem = selectionItem("hk-voice-item");
export const VoiceSelectorSeparator = ({ className = "", ...props }: ComponentPropsWithRef<"hr">) => <hr {...props} className={`hk-voice-separator ${className}`} />;
export const VoiceSelectorName = ({ children, ...props }: ComponentPropsWithRef<"span">) => <span {...props} className="hk-voice-name">{children}</span>;
export const VoiceSelectorGender = ({ children, ...props }: ComponentPropsWithRef<"span">) => <span {...props} className="hk-voice-gender">{children}</span>;
export const VoiceSelectorAccent = ({ children, ...props }: ComponentPropsWithRef<"span">) => <span {...props} className="hk-voice-accent">{children}</span>;
export const VoiceSelectorAge = ({ children, ...props }: ComponentPropsWithRef<"span">) => <span {...props} className="hk-voice-age">{children}</span>;
export const VoiceSelectorDescription = ({ children, ...props }: ComponentPropsWithRef<"p">) => <p {...props} className="hk-voice-description">{children}</p>;
export const VoiceSelectorAttributes = slot("hk-voice-attributes");
export const VoiceSelectorBullet = ({ children = "•", ...props }: ComponentPropsWithRef<"span">) => <span {...props} aria-hidden="true" className="hk-voice-bullet">{children}</span>;
export const VoiceSelectorShortcut = slot("hk-voice-shortcut");
export function VoiceSelectorPreview({ children, playing = false, loading = false, onPlay, onClick, disabled, ...props }: Omit<ComponentPropsWithRef<"button">, "onPlay"> & { playing?: boolean; loading?: boolean; onPlay?: () => void }) {
  const selector = useSelector();
  return <button {...props} type="button" disabled={disabled || loading || selector?.disabled || (!onPlay && !onClick)} aria-busy={loading || undefined} className={`hk-voice-preview ${props.className ?? ""}`} onClick={event => { onClick?.(event); if (!event.defaultPrevented) onPlay?.(); }}>{children ?? (loading ? "Loading preview" : playing ? "Pause preview" : "Play preview")}</button>;
}
export function useVoiceSelector() {
  const selector = useSelector();
  if (!selector) throw new Error("useVoiceSelector must be used inside a selector");
  return { value: selector.value, setValue: selector.setValue, open: selector.open, setOpen: selector.setOpen };
}
