import { EyeIcon, EyeSlashIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { createElement, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type CSSProperties, type ReactNode } from "react";

export type ButtonProps = ComponentPropsWithRef<"button"> & { variant?: "primary" | "quiet" | "outline" | "danger" | "secondary" | "ghost" | "link"; size?: "xs" | "small" | "medium"; pending?: boolean; leadingIcon?: ReactNode; trailingIcon?: ReactNode; iconOnly?: boolean };

export function Button({ variant = "quiet", size = "medium", pending = false, disabled, className = "", type = "button", children, leadingIcon, trailingIcon, iconOnly = false, ...props }: ButtonProps) {
  return <button {...props} type={type} disabled={disabled || pending} aria-busy={pending || undefined} className={`hk-button hk-button--${variant} hk-button--${size} ${iconOnly ? "hk-icon-button" : ""} ${className}`}>
    {pending && <span className="hk-spinner" aria-hidden="true" />}{leadingIcon && <span aria-hidden="true">{leadingIcon}</span>}{children}{trailingIcon && <span aria-hidden="true">{trailingIcon}</span>}
  </button>;
}

export function IconButton({ label, className = "", ...props }: Omit<ButtonProps, "aria-label"> & { label: string }) {
  return <Button {...props} aria-label={label} className={`hk-icon-button ${className}`} />;
}

export function Link({ className = "", children, variant = "primary", size = "medium", leadingIcon, trailingIcon, ...props }: ComponentPropsWithRef<"a"> & { href: string; variant?: "primary" | "secondary"; size?: "medium" | "small" | "xs"; leadingIcon?: ReactNode; trailingIcon?: ReactNode }) {
  return <a {...props} className={`hk-link hk-link--${variant} hk-link--${size} ${className}`}>{leadingIcon && <span aria-hidden="true">{leadingIcon}</span>}{children}{trailingIcon && <span aria-hidden="true">{trailingIcon}</span>}</a>;
}

export type InputProps = ComponentPropsWithRef<"input"> & { leading?: ReactNode; trailing?: ReactNode; leadingIcon?: ReactNode; trailingIcon?: ReactNode; revealable?: boolean };

export function Input({ className = "", leading, trailing, leadingIcon, trailingIcon, revealable = false, type, ...props }: InputProps) {
  const [revealed, setRevealed] = useState(false);
  const canReveal = type === "password" && revealable;
  const startIcon = leadingIcon ?? (type === "search" && !leading ? <MagnifyingGlassIcon size={16} weight="regular" /> : null);
  const input = <input {...props} type={canReveal && revealed ? "text" : type} className={`hk-input ${className}`} />;
  // Keep the input in the same React child slot across adornment changes.
  const decorated = leading || trailing || startIcon || trailingIcon || canReveal;
  return <div className={decorated ? "hk-input-shell" : "hk-input-plain"} data-invalid={props["aria-invalid"]} data-disabled={props.disabled || undefined}>
    {(startIcon || leading) && <span className="hk-input-adornment">{startIcon && <span className="hk-input-icon" aria-hidden="true">{startIcon}</span>}{leading}</span>}{input}{(trailing || trailingIcon) && <span className="hk-input-adornment">{trailing}{trailingIcon && <span className="hk-input-icon" aria-hidden="true">{trailingIcon}</span>}</span>}
    {canReveal && <IconButton label={revealed ? "Hide password" : "Show password"} aria-pressed={revealed} disabled={props.disabled} className="hk-input-reveal" onClick={() => setRevealed(value => !value)}>{revealed ? <EyeSlashIcon size={18} weight="regular" aria-hidden="true" /> : <EyeIcon size={18} weight="regular" aria-hidden="true" />}</IconButton>}
  </div>;
}

export function Textarea({ className = "", ...props }: ComponentPropsWithRef<"textarea">) {
  return <textarea {...props} className={`hk-input hk-textarea ${className}`} />;
}

export function Select({ className = "", customizable = false, children, ...props }: ComponentPropsWithRef<"select"> & { customizable?: boolean }) {
  const rich = customizable && !props.multiple && (!props.size || props.size === 1);
  return <select {...props} className={`hk-input hk-select ${rich ? "hk-select--customizable" : ""} ${className}`}>{rich && <button type="button">{createElement("selectedcontent")}</button>}{children}</select>;
}

export type FieldControlProps = { id: string; "aria-describedby"?: string; "aria-invalid"?: true; required?: boolean };

export function Field({ label, description, error, required, children, className = "" }: { label: string; description?: ReactNode; error?: ReactNode; required?: boolean; children: (props: FieldControlProps) => ReactNode; className?: string }) {
  const identity = useId();
  const descriptionIds = [description ? `${identity}-hint` : "", error ? `${identity}-error` : ""].filter(Boolean).join(" ") || undefined;
  return <div className={`hk-field ${className}`}>
    <label htmlFor={identity}>{label}{required && <span aria-hidden="true"> *</span>}</label>
    {children({ id: identity, "aria-describedby": descriptionIds, "aria-invalid": error ? true : undefined, required })}
    {description && <div className="hk-field-hint" id={`${identity}-hint`}>{description}</div>}
    {error && <div className="hk-field-error" id={`${identity}-error`}>{error}</div>}
  </div>;
}

type ChoiceProps = Omit<ComponentPropsWithRef<"input">, "type" | "children"> & { label: ReactNode; description?: string; controlSize?: "small" | "medium" | "large" };

export function Checkbox({ label, description, id, className = "", controlSize = "medium", indeterminate = false, ref, onChange, ...props }: ChoiceProps & { indeterminate?: boolean }) {
  const identity = useId();
  const controlId = id ?? identity;
  return <label className={`hk-choice hk-choice--${controlSize} ${className}`} htmlFor={controlId}>
    <input {...props} type="checkbox" id={controlId} ref={element => { if (element) element.indeterminate = indeterminate; if (typeof ref === "function") return ref(element); if (ref) ref.current = element; }} onChange={event => { onChange?.(event); event.currentTarget.indeterminate = indeterminate; }} aria-labelledby={props["aria-labelledby"] ?? (props["aria-label"] ? undefined : `${controlId}-label`)} aria-describedby={[props["aria-describedby"], description ? `${controlId}-description` : ""].filter(Boolean).join(" ") || undefined} />
    <span><span id={`${controlId}-label`}>{label}</span>{description && <span id={`${controlId}-description`} className="hk-choice-description">{description}</span>}</span>
  </label>;
}

export function Switch({ label, className = "", description, id, controlSize = "medium", shape = "pill", ...props }: ChoiceProps & { shape?: "pill" | "rectangle" }) {
  const identity = useId();
  const controlId = id ?? identity;
  return <label className={`hk-choice hk-switch hk-choice--${controlSize} hk-switch--${shape} ${className}`} htmlFor={controlId}>
    <input {...props} type="checkbox" role="switch" id={controlId} aria-labelledby={props["aria-labelledby"] ?? (props["aria-label"] ? undefined : `${controlId}-label`)} aria-describedby={[props["aria-describedby"], description ? `${controlId}-description` : ""].filter(Boolean).join(" ") || undefined} />
    <span><span id={`${controlId}-label`}>{label}</span>{description && <span id={`${controlId}-description`} className="hk-choice-description">{description}</span>}</span>
  </label>;
}

export type RadioOption = { value: string; label: string; disabled?: boolean };

export function RadioGroup({ label, options, value, defaultValue, onValueChange, name, disabled = false }: { label: string; options: readonly RadioOption[]; value?: string; defaultValue?: string; onValueChange?: (value: string) => void; name?: string; disabled?: boolean }) {
  const identity = useId();
  return <fieldset className="hk-radio-group" disabled={disabled}>
    <legend>{label}</legend>
    {options.map(option => <label className="hk-choice" key={option.value}>
      <input type="radio" name={name ?? identity} value={option.value} checked={value === undefined ? undefined : value === option.value} defaultChecked={value === undefined ? defaultValue === option.value : undefined} disabled={option.disabled} onChange={() => onValueChange?.(option.value)} />
      <span>{option.label}</span>
    </label>)}
  </fieldset>;
}

export function Slider({ className = "", showValue = false, formatValue, onChange, ...props }: Omit<ComponentPropsWithRef<"input">, "type"> & { showValue?: boolean; formatValue?: (value: number) => string }) {
  const container = useRef<HTMLSpanElement>(null);
  const [nativeValue, setNativeValue] = useState<number>(Number(props.value ?? props.defaultValue ?? 50));
  useLayoutEffect(() => {
    const input = container.current?.querySelector("input");
    if (!input) return;
    const update = () => setNativeValue(input.valueAsNumber);
    const reset = () => queueMicrotask(update);
    update();
    input.form?.addEventListener("reset", reset);
    return () => input.form?.removeEventListener("reset", reset);
  });
  const label = Number.isFinite(nativeValue) ? formatValue?.(nativeValue) ?? String(nativeValue) : "Unavailable";
  return <span ref={container} className="hk-slider-field"><input {...props} type="range" aria-valuetext={props["aria-valuetext"] ?? (formatValue ? label : undefined)} className={`hk-slider ${className}`} onChange={event => { onChange?.(event); if (props.value === undefined && !event.defaultPrevented) setNativeValue(event.currentTarget.valueAsNumber); }} />{showValue && <span className="hk-slider-value" aria-hidden="true">{label}</span>}</span>;
}

export function Progress({ label, value, max = 1 }: { label: string; value?: number; max?: number }) {
  const limit = Number.isFinite(max) && max > 0 ? max : 1;
  const amount = value !== undefined && Number.isFinite(value) ? Math.max(0, Math.min(value, limit)) : undefined;
  return <progress className="hk-progress" aria-label={label} value={amount} max={limit} />;
}

export function Badge({ tone = "neutral", className = "", ...props }: ComponentPropsWithRef<"span"> & { tone?: "neutral" | "primary" | "positive" | "attention" | "negative" | "active" }) {
  return <span {...props} className={`hk-badge hk-badge--${tone} ${className}`} />;
}

export function Avatar({ name, src, size = 36, tone = "neutral" }: { name: string; src?: string; size?: number | "xs" | "sm" | "md" | "lg"; tone?: "neutral" | "blue" }) {
  const [failedSource, setFailedSource] = useState<string>();
  const [loadedSource, setLoadedSource] = useState<string>();
  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "?";
  const pixels = typeof size === "string" ? { xs: 24, sm: 28, md: 36, lg: 48 }[size] : Number.isFinite(size) && size > 0 ? size : 36;
  const loaded = !!src && loadedSource === src && failedSource !== src;
  return <span className={`hk-avatar hk-avatar--${tone}`} role="img" aria-label={name.trim() || "Unknown person"} style={{ "--hk-avatar-size": `${pixels}px` } as CSSProperties}>
    {!loaded && initials}{src && src !== failedSource && <img key={src} src={src} alt="" hidden={!loaded} onLoad={() => setLoadedSource(src)} onError={() => setFailedSource(src)} />}
  </span>;
}

export function Skeleton({ label = "Loading", className = "", ...props }: ComponentPropsWithRef<"span"> & { label?: string }) {
  return <span {...props} className={`hk-skeleton ${className}`} role="status" aria-label={label} />;
}

export function Separator({ orientation = "horizontal", treatment = "single", align = "center", children }: { orientation?: "horizontal" | "vertical"; treatment?: "single" | "double" | "fill"; align?: "start" | "center" | "end"; children?: ReactNode }) {
  const populated = children !== undefined && children !== null && children !== false;
  return <div className={`hk-separator${populated ? " hk-separator--content" : ""}`} role={populated ? undefined : "separator"} aria-orientation={populated ? undefined : orientation} data-orientation={orientation} data-treatment={treatment} data-align={align}>{children}</div>;
}

export function EmptyState({ title, description, icon, action, actionLabel, onAction }: { title: string; description: string; icon?: ReactNode; action?: ReactNode; actionLabel?: string; onAction?: () => void }) {
  return <section className="hk-empty">{icon && <span className="hk-empty-icon" aria-hidden="true">{icon}</span>}<h3>{title}</h3><p>{description}</p>{action ?? (actionLabel && <Button variant="primary" disabled={!onAction} onClick={onAction}>{actionLabel}</Button>)}</section>;
}

export function Disclosure({ summary, children, className = "", ...props }: Omit<ComponentPropsWithRef<"details">, "children"> & { summary: ReactNode; children: ReactNode }) {
  return <details {...props} className={`hk-disclosure ${className}`}><summary>{summary}</summary><div className="hk-disclosure-body">{children}</div></details>;
}
