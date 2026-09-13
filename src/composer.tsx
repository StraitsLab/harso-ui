import type { ComponentPropsWithRef, CSSProperties, ReactNode } from "react";
import { useId, useRef, useState } from "react";
import { PromptInput, PromptInputActionMenu, PromptInputFooter, PromptInputSubmit, PromptInputTextarea, type PromptInputProps } from "./prompt-input";
import { Button, IconButton, Progress } from "./primitives";
import { Tooltip } from "./navigation";
import { PaperclipIcon, MicrophoneIcon, GlobeIcon, SparkleIcon, CaretDownIcon, GaugeIcon, FileIcon, ImageIcon, FileCodeIcon, XIcon, WarningCircleIcon } from "@phosphor-icons/react";
import type { FileUploadItem } from "./controls";

export function Composer({ disabled = false, onSubmit, onValueChange, children, ...props }: PromptInputProps & { disabled?: boolean }) { return <PromptInput {...props} aria-disabled={disabled || undefined} onValueChange={value => { if (!disabled) onValueChange?.(value); }} onSubmit={value => { if (!disabled && value.trim()) onSubmit?.(value); }} className={`hk-composer ${props.className ?? ""}`}><fieldset disabled={disabled} className="hk-composer-controls" aria-label="Message composer">{children}</fieldset></PromptInput>; }
export function ComposerAttachments({ children, className = "", ...props }: ComponentPropsWithRef<"div">) { return <div {...props} className={`hk-composer-attachments ${className}`}>{children}</div>; }
export function ComposerLoader({ label = "Working", active = true, colors, arc = 270, speed = 0.9, bloom = false, bloomStrength = 0.5, className = "", ...props }: ComponentPropsWithRef<"div"> & { label?: string; active?: boolean; colors?: readonly string[]; arc?: number; speed?: number; bloom?: boolean; bloomStrength?: number }) {
  const style = { "--hk-loader-start": colors?.[0] ?? "var(--hk-accent)", "--hk-loader-end": colors?.[1] ?? colors?.[0] ?? "var(--hk-secondary)", "--hk-loader-arc": `${Number.isFinite(arc) ? Math.max(0, Math.min(360, arc)) : 270}deg`, "--hk-loader-speed": `${Number.isFinite(speed) && speed > 0 ? Math.max(0.1, Math.min(60, speed)) : 0.9}s`, "--hk-loader-bloom": `${bloom ? 8 * (Number.isFinite(bloomStrength) ? Math.max(0, Math.min(1, bloomStrength)) : 0.5) : 0}px`, ...props.style } as CSSProperties;
  return <div {...props} hidden={!active || props.hidden} aria-hidden={!active || props.hidden ? true : props["aria-hidden"]} inert={!active || props.hidden || props.inert} style={style} className={`hk-composer-loader ${className}`} role="status"><span className="hk-composer-orbit" aria-hidden="true" />{label}</div>;
}
export type ComposerPanelProps = Omit<ComponentPropsWithRef<"div">, "onSubmit"> & {
  value?: string;
  onValueChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
  error?: ReactNode;
  placeholder?: string;
  permission?: PermissionMenuProps;
  modelPicker?: ModelPickerProps;
  attachments?: ReactNode;
  context?: ReactNode;
  onVoiceRequest?: () => void;
  voiceLive?: boolean;
  webSearch?: boolean;
  onWebSearchChange?: (enabled: boolean) => void;
  status?: ReactNode;
  onFilesSelected?: (files: File[]) => void;
  accept?: string;
};
export function ComposerPanel({ children, className = "", value = "", onValueChange, onSubmit, disabled = false, loading = false, error, placeholder = "Ask anything", permission, modelPicker, attachments, context, onVoiceRequest, voiceLive = false, webSearch = false, onWebSearchChange, status, onFilesSelected, accept, ...props }: ComposerPanelProps) {
  const locked = disabled || loading;
  return <div {...props} className={`hk-composer-panel ${className}`} aria-busy={loading || undefined} aria-disabled={disabled || undefined}>
    <fieldset disabled={locked} className="hk-composer-controls" aria-label="Composer panel">
    {context != null && <div className="hk-composer-context">{context}</div>}
    {children ?? <Composer value={value} onValueChange={onValueChange} onSubmit={onSubmit} disabled={locked}>
      {attachments != null && <ComposerAttachmentStrip>{attachments}</ComposerAttachmentStrip>}
      <GlassComposer>
        <PromptInputTextarea aria-label="Message" placeholder={placeholder} disabled={locked} />
        {error != null && <div className="hk-composer-error" role="alert"><WarningCircleIcon size={18} aria-hidden="true" />{error}</div>}
        <PromptInputFooter>
          {onFilesSelected && <label className="hk-composer-file-action" title="Attach files"><PaperclipIcon size={18} aria-hidden="true" /><span className="hk-sr-only">Attach</span><input type="file" aria-label="Attach files" multiple accept={accept} disabled={locked} onChange={event => { const files = Array.from(event.currentTarget.files ?? []); event.currentTarget.value = ""; if (!locked && files.length) onFilesSelected(files); }} /></label>}
          {permission && <PermissionMenu {...permission} disabled={locked || permission.disabled} />}
          {modelPicker && <ModelPicker {...modelPicker} disabled={locked || modelPicker.disabled} />}
          {onVoiceRequest && <Tooltip content="Request voice input"><IconButton label="Request voice input" size="small" className="hk-composer-voice" data-live={voiceLive || undefined} disabled={locked} onClick={() => { if (!locked) onVoiceRequest(); }}><MicrophoneIcon size={18} aria-hidden="true" /></IconButton></Tooltip>}
          {onWebSearchChange && <Tooltip content="Web search"><IconButton label="Web search" size="small" disabled={locked} aria-pressed={webSearch} onClick={() => { if (!locked) onWebSearchChange(!webSearch); }}><GlobeIcon size={18} aria-hidden="true" /></IconButton></Tooltip>}
          <PromptInputSubmit pending={loading} disabled={locked || !onSubmit} />
        </PromptInputFooter>
      </GlassComposer>
    </Composer>}
    <ComposerLoader active={loading} className={children == null ? "hk-sr-only" : ""} />
    {children != null && error != null && <div className="hk-composer-error" role="alert"><WarningCircleIcon size={18} aria-hidden="true" />{error}</div>}
    {status != null && <StatusBar>{status}</StatusBar>}
    </fieldset>
  </div>;
}
export function GlassComposer({ children, className = "", ...props }: ComponentPropsWithRef<"div"> & { children?: ReactNode }) { return <div {...props} className={`hk-glass-composer ${className}`}>{children ?? <><PromptInputTextarea placeholder="Ask anything" /><PromptInputFooter><PromptInputActionMenu /><PromptInputSubmit /></PromptInputFooter></>}</div>; }
export function StatusBar({ children = "Ready", className = "", ...props }: ComponentPropsWithRef<"div">) { return <div {...props} className={`hk-status-bar ${className}`} aria-live="polite">{children}</div>; }
export function AiChatComposerPreview({ children, className = "", ...props }: ComponentPropsWithRef<"div"> & { children?: ReactNode }) { return <div {...props} className={`hk-ai-chat-composer-preview ${className}`}>{children}</div>; }
export function ComposerWithAttachments({ children, loading = false, error, ...props }: ComponentPropsWithRef<typeof Composer> & { loading?: boolean; error?: ReactNode }) { return <Composer {...props} disabled={props.disabled || loading}><ComposerAttachments>{children}</ComposerAttachments><GlassComposer><PromptInputTextarea aria-label="Message" placeholder="Ask anything" disabled={props.disabled || loading} />{error != null && <div className="hk-composer-error" role="alert"><WarningCircleIcon size={18} aria-hidden="true" />{error}</div>}<PromptInputFooter><PromptInputSubmit pending={loading} disabled={props.disabled || !props.onSubmit} /></PromptInputFooter></GlassComposer></Composer>; }
export function ComposerAttachmentStrip({ children, className = "", ...props }: ComponentPropsWithRef<"div">) { return <div {...props} className={`hk-composer-attachment-strip ${className}`}>{children}</div>; }
export function ComposerAttachmentTile({ name, kind, src, size, status, progress, message, onRemove, disabled = false, className = "", ...props }: ComponentPropsWithRef<"div"> & { name: string; src?: string; size?: number | string; kind?: "image" | "document" | "spreadsheet" | "presentation" | "code" | "video"; status?: FileUploadItem["status"]; progress?: number; message?: string; onRemove?: () => void; disabled?: boolean }) {
  const amount = progress !== undefined && Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : undefined;
  return <div {...props} className={`hk-composer-attachment-tile ${className}`} data-kind={kind}>{kind === "image" && src ? <img className="hk-composer-attachment-thumbnail" src={src} alt="" /> : kind === "image" ? <ImageIcon size={18} aria-hidden="true" /> : kind === "code" ? <FileCodeIcon size={18} aria-hidden="true" /> : <FileIcon size={18} aria-hidden="true" />}<span className="hk-composer-attachment-name">{name}</span>{size != null && <span className="hk-composer-attachment-size">{typeof size === "number" ? size < 1024 ? `${size} B` : size < 1048576 ? `${(size / 1024).toFixed(1)} KB` : `${(size / 1048576).toFixed(1)} MB` : size}</span>}{kind && <span className="hk-composer-attachment-kind">{kind}</span>}{status && <span>{({ selected: "Queued", uploading: "Uploading", complete: "Landed", error: "Failed" })[status]}</span>}{status === "uploading" && <><svg className="hk-composer-progress-ring" viewBox="0 0 24 24" aria-hidden="true" focusable="false" data-indeterminate={amount === undefined || undefined}><circle className="hk-composer-progress-track" cx="12" cy="12" r="9" />{amount !== undefined && <circle className="hk-composer-progress-amount" cx="12" cy="12" r="9" pathLength="100" strokeDasharray="100" strokeDashoffset={100 - amount * 100} />}</svg><Progress label={`Upload progress for ${name}`} value={amount} />{amount !== undefined && <span>{Math.round(amount * 100)}%</span>}</>}{message && <span role={status === "error" ? "alert" : undefined}>{message}</span>}{onRemove && <Tooltip content={`Remove ${name}`}><IconButton label={`Remove ${name}`} size="small" disabled={disabled} onClick={() => { if (!disabled) onRemove(); }}><XIcon size={18} aria-hidden="true" /></IconButton></Tooltip>}</div>;
}
export type ComposerPermission = "auto" | "manual" | "plan" | "bypass";
export type ComposerChoice = { id: string; label: string; disabled?: boolean; description?: string };
export type PermissionMenuProps = ComponentPropsWithRef<"div"> & { value?: ComposerPermission; onValueChange?: (value: ComposerPermission) => void; disabled?: boolean };
const permissions = [{ id: "auto", label: "Auto" }, { id: "manual", label: "Manual" }, { id: "plan", label: "Plan mode" }, { id: "bypass", label: "Bypass all" }] as const;
export function PermissionMenu({ children, value, onValueChange, disabled = false, className = "", ...props }: PermissionMenuProps) {
  const name = useId();
  return <div {...props} className={`hk-permission-menu ${className}`}>{children ?? <details className="hk-composer-menu" onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); event.currentTarget.open = false; event.currentTarget.querySelector("summary")?.focus(); } }}>
    <summary>Permissions: {permissions.find(option => option.id === value)?.label ?? "Choose"}</summary>
    <fieldset disabled={disabled || !onValueChange}><legend>Requested permissions</legend>{permissions.map(option => <label key={option.id}><input type="radio" name={name} value={option.id} checked={value === option.id} onChange={() => { if (!disabled) onValueChange?.(option.id); }} />{option.label}</label>)}</fieldset>
  </details>}</div>;
}
export function ComposerStatusTab({ children = "Status", className = "", ...props }: ComponentPropsWithRef<"button">) { return <button {...props} type="button" className={`hk-composer-status-tab ${className}`}>{children}</button>; }
export type ModelPickerProps = Omit<ComponentPropsWithRef<"button">, "value"> & {
  models?: readonly (ComposerChoice & { provider: string })[];
  providers?: readonly ComposerChoice[];
  efforts?: readonly ComposerChoice[];
  value?: string;
  provider?: string;
  effort?: string;
  query?: string;
  onValueChange?: (value: string) => void;
  onProviderChange?: (value: string) => void;
  onEffortChange?: (value: string) => void;
  onQueryChange?: (value: string) => void;
  loading?: boolean;
  error?: ReactNode;
};
export function ModelPicker({ children, className = "", models, providers = [], efforts = [], value, provider, effort, query = "", onValueChange, onProviderChange, onEffortChange, onQueryChange, loading = false, error, disabled = false, onClick, ...props }: ModelPickerProps) {
  const [open, setOpen] = useState(false);
  const identity = useId();
  const root = useRef<HTMLDivElement>(null);
  const locked = disabled || loading;
  if (models === undefined) return <button {...props} onClick={onClick} disabled={locked} type="button" className={`hk-model-picker ${className}`}><SparkleIcon size={16} aria-hidden="true" /><span>{children ?? "Choose model"}</span><CaretDownIcon size={16} aria-hidden="true" /></button>;
  const matching = models.filter(model => (!provider || model.provider === provider) && `${model.label} ${model.provider} ${model.description ?? ""}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const rows = (label: string, options: readonly ComposerChoice[], selected: string | undefined, change: ((value: string) => void) | undefined) => <fieldset disabled={locked || !change} className="hk-composer-choices"><legend>{label}</legend>{options.map(option => <label key={option.id}><input type="radio" name={`${identity}-${label}`} checked={selected === option.id} disabled={option.disabled} onChange={() => { if (!locked && !option.disabled) change?.(option.id); }} /><span>{option.label}{option.description && <small>{option.description}</small>}</span></label>)}</fieldset>;
  return <div ref={root} className="hk-composer-model-control" onKeyDown={event => { if (event.key === "Escape" && !event.defaultPrevented) { event.stopPropagation(); setOpen(false); root.current?.querySelector("button")?.focus(); } }}>
    <button {...props} type="button" disabled={locked} aria-expanded={open && !locked} aria-controls={identity} className={`hk-model-picker ${className}`} onClick={event => { onClick?.(event); if (!event.defaultPrevented && !locked) setOpen(previous => !previous); }}><SparkleIcon size={16} aria-hidden="true" /><span>{children ?? models.find(model => model.id === value)?.label ?? "Choose model"}</span><CaretDownIcon size={16} aria-hidden="true" /></button>
    {open && !locked && <div id={identity} className="hk-composer-model-menu" role="group" aria-label="Model settings">
      <input type="search" aria-label="Search models" placeholder="Search models" value={query} disabled={!onQueryChange} onChange={event => { if (!locked) onQueryChange?.(event.currentTarget.value); }} />
      {providers.length > 0 && rows("Providers", providers, provider, onProviderChange)}
      {rows("Models", matching, value, onValueChange)}
      {!matching.length && <div role="status">No matching models</div>}
      {efforts.length > 0 && <><button type="button" className="hk-model-picker" popoverTarget={`${identity}-effort`} disabled={!onEffortChange}><GaugeIcon size={16} aria-hidden="true" />Effort: {efforts.find(option => option.id === effort)?.label ?? "Choose"}</button><div id={`${identity}-effort`} popover="auto" className="hk-composer-effort-popover" onKeyDown={event => { if (event.key === "Escape") event.stopPropagation(); }}>{rows("Reasoning effort", efforts, effort, onEffortChange)}</div></>}
    </div>}
    {loading && <span role="status">Loading models</span>}{error != null && <span role="alert">{error}</span>}
  </div>;
}
