import { createContext, useContext, useEffect, useRef, useState, type ComponentPropsWithRef } from "react";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { Badge, IconButton, Input, Switch, type ButtonProps } from "./primitives";

type DivProps = ComponentPropsWithRef<"div">;
export type DeveloperCopyProps = Omit<ButtonProps, "onCopy" | "onError"> & { label?: string; timeout?: number; onCopy?: () => void; onError?: (error: Error) => void };

function CopyControl({ text, identity, label = "Copy", timeout = 2000, disabled = false, pending = false, onClick, onCopy, onError, children, ...props }: DeveloperCopyProps & { text?: string; identity: string }) {
  const blocked = disabled || pending || text === undefined;
  const revision = useRef({ identity, blocked, token: 0 });
  const busy = useRef(false);
  const mounted = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [feedback, setFeedback] = useState<{ token: number; status: "pending" | "copied" | "failed" }>();
  if (revision.current.identity !== identity || revision.current.blocked !== blocked) { revision.current = { identity, blocked, token: revision.current.token + 1 }; busy.current = false; }
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; revision.current.token++; clearTimeout(timer.current); }; }, []);
  useEffect(() => () => clearTimeout(timer.current), [identity, blocked]);
  const status = feedback?.token === revision.current.token ? feedback.status : undefined;
  return <span className="hk-copy-control"><IconButton {...props} type="button" label={label} disabled={blocked || status === "pending"} pending={pending || status === "pending"} onClick={async event => {
    if (blocked || busy.current || text === undefined || !mounted.current) return;
    const token = ++revision.current.token;
    const current = () => mounted.current && token === revision.current.token;
    busy.current = true;
    try { onClick?.(event); } catch (error) { if (current()) busy.current = false; throw error; }
    if (event.defaultPrevented || !current()) { if (current()) busy.current = false; return; }
    clearTimeout(timer.current); setFeedback({ token, status: "pending" });
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
    } catch {
      if (current()) { busy.current = false; setFeedback({ token, status: "failed" }); onError?.(new Error("Copy failed. Clipboard access may be unavailable or blocked.")); }
      return;
    }
    if (!current()) return;
    busy.current = false; setFeedback({ token, status: "copied" });
    timer.current = setTimeout(() => { if (current()) setFeedback(undefined); }, Number.isFinite(timeout) && timeout >= 0 ? timeout : 2000);
    onCopy?.();
  }}>{children ?? (status === "copied" ? <CheckIcon size={17} aria-hidden="true" /> : <CopyIcon size={17} aria-hidden="true" />)}</IconButton><span className={status === "failed" ? "hk-copy-error" : "hk-sr-only"} role="status">{status === "pending" ? "Copying" : status === "copied" ? "Copied" : status === "failed" ? "Copy failed" : ""}</span></span>;
}

const SnippetContext = createContext<{ code: string; disabled: boolean } | null>(null);
function useSnippet() { const snippet = useContext(SnippetContext); if (!snippet) throw new Error("Snippet parts require Snippet."); return snippet; }

export function Snippet({ code, disabled = false, className = "", children, ...props }: DivProps & { code: string; disabled?: boolean }) {
  return <SnippetContext.Provider value={{ code, disabled }}><div {...props} className={`hk-snippet ${className}`}>{children ?? <><SnippetInput /><SnippetCopyButton /></>}</div></SnippetContext.Provider>;
}
export function SnippetAddon({ className = "", ...props }: DivProps) { return <div {...props} className={`hk-snippet-addon ${className}`} />; }
export function SnippetText({ className = "", ...props }: ComponentPropsWithRef<"span">) { return <span {...props} className={`hk-snippet-text ${className}`} />; }
export function SnippetInput({ className = "", ...props }: Omit<ComponentPropsWithRef<typeof Input>, "value" | "defaultValue" | "readOnly" | "type">) {
  const { code, disabled } = useSnippet();
  return <Input {...props} type="text" readOnly value={code} disabled={disabled || props.disabled} aria-label={props["aria-label"] ?? "Command"} spellCheck={false} className={`hk-snippet-input ${className}`} />;
}
export function SnippetCopyButton(props: DeveloperCopyProps) { const { code, disabled } = useSnippet(); return <CopyControl {...props} label={props.label ?? "Copy command"} text={code} identity={code} disabled={disabled || props.disabled} />; }

export type PackageChangeType = "major" | "minor" | "patch" | "added" | "removed";
type PackageData = { name: string; currentVersion?: string; newVersion?: string; changeType?: PackageChangeType };
const PackageContext = createContext<PackageData | null>(null);
function usePackage() { const value = useContext(PackageContext); if (!value) throw new Error("PackageInfo parts require PackageInfo."); return value; }
const changeLabels = { major: "Major", minor: "Minor", patch: "Patch", added: "Added", removed: "Removed" };
const changeTones = { major: "negative", minor: "attention", patch: "positive", added: "active", removed: "neutral" } as const;

export function PackageInfo({ name, currentVersion, newVersion, changeType, className = "", ...props }: DivProps & PackageData) { return <PackageContext.Provider value={{ name, currentVersion, newVersion, changeType }}><div {...props} className={`hk-package-info ${className}`} /></PackageContext.Provider>; }
export function PackageInfoHeader({ className = "", ...props }: DivProps) { return <div {...props} className={`hk-package-header ${className}`} />; }
export function PackageInfoName({ children, className = "", ...props }: DivProps) { const { name } = usePackage(); return <div {...props} className={`hk-package-name ${className}`}>{children ?? name}</div>; }
export function PackageInfoChangeType({ children, ...props }: ComponentPropsWithRef<typeof Badge>) { const { changeType } = usePackage(); return children != null || changeType ? <Badge {...props} tone={changeType ? changeTones[changeType] ?? "neutral" : props.tone}>{children ?? (changeType && changeLabels[changeType]) ?? "Change unspecified"}</Badge> : null; }
export function PackageInfoVersion({ children, className = "", ...props }: DivProps) {
  const { currentVersion, newVersion } = usePackage();
  return <div {...props} className={`hk-package-version ${className}`}>{children ?? (currentVersion && newVersion && currentVersion !== newVersion ? <><span>{currentVersion}</span><span aria-label="to">→</span><span>{newVersion}</span></> : newVersion || currentVersion || "Version not supplied")}</div>;
}
export function PackageInfoDescription({ className = "", ...props }: ComponentPropsWithRef<"p">) { return <p {...props} className={`hk-package-description ${className}`} />; }
export function PackageInfoContent({ className = "", ...props }: DivProps) { return <div {...props} className={`hk-package-content ${className}`} />; }
export function PackageInfoDependencies({ className = "", ...props }: DivProps) { return <div {...props} className={`hk-package-dependencies ${className}`} />; }
export function PackageInfoDependency({ name, version, className = "", ...props }: DivProps & { name: string; version?: string }) { return <div {...props} className={`hk-package-dependency ${className}`}><span>{name}</span><span>{version || "Version not supplied"}</span></div>; }

type EnvironmentState = { shown: boolean; disabled: boolean; request: (shown: boolean) => void };
const EnvironmentContext = createContext<EnvironmentState | null>(null);
const VariableContext = createContext<{ name: string; value: string } | null>(null);
function useEnvironment() { const environment = useContext(EnvironmentContext); if (!environment) throw new Error("Environment parts require EnvironmentVariables."); return environment; }
function useVariable() { const variable = useContext(VariableContext); if (!variable) throw new Error("Variable parts require EnvironmentVariable."); return variable; }

export function EnvironmentVariables({ showValues, defaultShowValues = false, onShowValuesChange, disabled = false, className = "", ...props }: DivProps & { showValues?: boolean; defaultShowValues?: boolean; onShowValuesChange?: (show: boolean) => void | boolean; disabled?: boolean }) {
  const [localShow, setLocalShow] = useState(defaultShowValues);
  const shown = showValues ?? localShow;
  return <EnvironmentContext.Provider value={{ shown, disabled, request: next => { if (!disabled && onShowValuesChange?.(next) !== false && showValues === undefined) setLocalShow(next); } }}><div {...props} className={`hk-environment ${className}`} /></EnvironmentContext.Provider>;
}
export function EnvironmentVariablesHeader({ className = "", ...props }: DivProps) { return <div {...props} className={`hk-environment-header ${className}`} />; }
export function EnvironmentVariablesTitle({ children = "Environment Variables", ...props }: ComponentPropsWithRef<"h3">) { return <h3 {...props}>{children}</h3>; }
export function EnvironmentVariablesToggle({ label = "Show values", onChange, ...props }: Omit<ComponentPropsWithRef<typeof Switch>, "checked" | "defaultChecked" | "label"> & { label?: ComponentPropsWithRef<typeof Switch>["label"] }) {
  const { shown, disabled, request } = useEnvironment();
  const latestShown = useRef(shown); latestShown.current = shown;
  return <Switch {...props} label={label} checked={shown} disabled={disabled || props.disabled} onChange={event => { onChange?.(event); if (!event.defaultPrevented) request(event.currentTarget.checked); else { const input = event.currentTarget; queueMicrotask(() => { if (input.isConnected) input.checked = latestShown.current; }); } }} />;
}
export function EnvironmentVariablesContent({ className = "", ...props }: DivProps) { return <div {...props} className={`hk-environment-content ${className}`} />; }
export function EnvironmentVariable({ name, value, className = "", children, ...props }: DivProps & { name: string; value: string }) { return <VariableContext.Provider value={{ name, value }}><div {...props} className={`hk-environment-variable ${className}`}>{children ?? <><EnvironmentVariableName /><EnvironmentVariableValue /><EnvironmentVariableCopyButton /></>}</div></VariableContext.Provider>; }
export function EnvironmentVariableGroup({ className = "", ...props }: DivProps) { return <div {...props} className={`hk-environment-group ${className}`} />; }
export function EnvironmentVariableName({ children, className = "", ...props }: ComponentPropsWithRef<"span">) { const { name } = useVariable(); return <span {...props} className={`hk-environment-name ${className}`}>{children ?? name}</span>; }
export function EnvironmentVariableValue({ children, className = "", ...props }: Omit<ComponentPropsWithRef<"span">, "dangerouslySetInnerHTML">) {
  const { shown } = useEnvironment(); const { value } = useVariable();
  return <span {...props} className={`hk-environment-value ${className}`}>{shown ? children ?? (value || <span className="hk-developer-muted">Empty value</span>) : <><span aria-hidden="true">••••••••</span><span className="hk-sr-only">Value hidden</span></>}</span>;
}
export function EnvironmentVariableCopyButton({ copyFormat = "value", ...props }: DeveloperCopyProps & { copyFormat?: "name" | "value" | "export" }) {
  const { name, value } = useVariable(); const { shown, disabled } = useEnvironment();
  const exportable = /^[A-Za-z_][A-Za-z0-9_]*$/.test(name) && !value.includes("\0");
  const text = copyFormat === "name" ? name : !shown ? undefined : copyFormat === "value" ? value : copyFormat === "export" && exportable ? `export ${name}='${value.replaceAll("'", "'\\''")}'` : undefined;
  return <CopyControl {...props} text={text} identity={JSON.stringify([name, value, shown, copyFormat])} label={props.label ?? `Copy ${copyFormat} for ${name}`} disabled={disabled || props.disabled} />;
}
export function EnvironmentVariableRequired({ children = "Required", ...props }: ComponentPropsWithRef<typeof Badge>) { return <Badge {...props}>{children}</Badge>; }
