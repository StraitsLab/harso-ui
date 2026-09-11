import { createContext, useContext, useState, type ComponentPropsWithRef, type ReactNode } from "react";

type PreviewState = { url: string; disabled: boolean; setUrl: (url: string) => void; reload: number; reloadPreview: () => void };
const PreviewValue = createContext<PreviewState | null>(null);
function usePreview() { const value = useContext(PreviewValue); if (!value) throw new Error("WebPreview parts require WebPreview."); return value; }

export type WebPreviewProps = ComponentPropsWithRef<"div"> & { url?: string; defaultUrl?: string; disabled?: boolean; onUrlChange?: (url: string) => void | boolean };
export function WebPreview({ url: controlledUrl, defaultUrl = "", disabled = false, onUrlChange, children, className = "", ...props }: WebPreviewProps) { const [localUrl, setLocalUrl] = useState(defaultUrl); const [reload, setReload] = useState(0); const setUrl = (next: string) => { if (!disabled && onUrlChange?.(next) !== false && controlledUrl === undefined) setLocalUrl(next); }; return <PreviewValue value={{ url: controlledUrl ?? localUrl, disabled, setUrl, reload, reloadPreview: () => { if (!disabled) setReload(value => value + 1); } }}><div {...props} className={`hk-web-preview ${className}`}>{children}</div></PreviewValue>; }
export function WebPreviewNavigation({ className = "", ...props }: ComponentPropsWithRef<"div">) { return <div {...props} role="toolbar" aria-label={props["aria-label"] ?? "Preview navigation"} className={`hk-web-preview-navigation ${className}`} />; }
export function WebPreviewNavigationButton({ tooltip, children, className = "", ...props }: ComponentPropsWithRef<"button"> & { tooltip?: string }) { const preview = usePreview(); const label = props["aria-label"] ?? tooltip; return <button {...props} disabled={preview.disabled || props.disabled} type="button" title={tooltip} aria-label={label} className={`hk-web-preview-button ${className}`} onClick={event => { props.onClick?.(event); if (!event.defaultPrevented && label?.toLowerCase().includes("reload")) preview.reloadPreview(); }}>{children}</button>; }
export function WebPreviewUrl({ className = "", ...props }: ComponentPropsWithRef<"input">) { const preview = usePreview(); return <input {...props} disabled={preview.disabled || props.disabled} type="url" value={props.value ?? preview.url} onChange={event => { props.onChange?.(event); if (!event.defaultPrevented && !props.readOnly && props.value === undefined) preview.setUrl(event.target.value); }} className={`hk-web-preview-url ${className}`} aria-label={props["aria-label"] ?? "Preview URL"} />; }
export function WebPreviewBody({ loading, src, className = "", sandbox = "allow-scripts", referrerPolicy: _referrerPolicy, ...props }: Omit<ComponentPropsWithRef<"iframe">, "loading"> & { loading?: ReactNode }) {
  const preview = usePreview();
  const address = src ?? (preview.url || "about:blank");
  const identity = JSON.stringify([address, props.srcDoc, preview.reload]);
  const [loaded, setLoaded] = useState<string>();
  if (!src && !preview.url && !props.srcDoc) return <div role="status">No preview URL supplied</div>;
  let allowed = address === "about:blank";
  try { const parsed = new URL(address, "https://preview.invalid"); allowed ||= ["http:", "https:"].includes(parsed.protocol) && !parsed.username && !parsed.password; } catch {}
  if (!allowed) return <div role="alert">Preview URL unavailable</div>;
  const permissions = sandbox.split(/\s+/).filter(token => token && token.toLowerCase() !== "allow-same-origin").join(" ");
  return <div className="hk-web-preview-frame">{loaded !== identity && loading}<iframe {...props} sandbox={permissions} referrerPolicy="no-referrer" key={identity} src={address} title={props.title ?? "Web preview"} className={`hk-web-preview-body ${className}`} onLoad={event => { setLoaded(identity); props.onLoad?.(event); }} /></div>;
}
export function WebPreviewConsole({ logs, className = "", ...props }: ComponentPropsWithRef<"pre"> & { logs?: readonly string[] }) { return <pre {...props} className={`hk-web-preview-console ${className}`}>{(logs ?? []).join("\n")}</pre>; }
