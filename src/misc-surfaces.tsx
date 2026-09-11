import { Children, isValidElement, useEffect, useId, useLayoutEffect, useRef, useState, type ChangeEvent, type ComponentPropsWithRef, type KeyboardEvent, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button, Input, Select, type ButtonProps } from "./primitives";
import { InputOtp } from "./controls";
import { KitProvider, type Appearance, type Palette } from "./theme";

const colorPresets = [{ label: "Blue", value: "#145cba" }, { label: "Violet", value: "#7c3aed" }, { label: "Pink", value: "#be185d" }, { label: "Red", value: "#b3313b" }, { label: "Amber", value: "#885000" }, { label: "Emerald", value: "#287346" }, { label: "Cyan", value: "#0e7490" }, { label: "Indigo", value: "#4338ca" }];
export function Color({ value, defaultValue = "#145cba", onValueChange, label, editable = false, disabled = false, appearance, defaultAppearance = "light", onAppearanceChange, palette, className = "", ...props }: ComponentPropsWithRef<"span"> & { value?: string; defaultValue?: string; onValueChange?: (value: string) => void; label?: string; editable?: boolean; disabled?: boolean; appearance?: "light" | "dark"; defaultAppearance?: "light" | "dark"; onAppearanceChange?: (appearance: "light" | "dark") => void; palette?: Palette }) {
  const [localValue, setLocalValue] = useState(defaultValue);
  const [localAppearance, setLocalAppearance] = useState(defaultAppearance);
  const activeValue = value ?? localValue;
  const activeAppearance = appearance ?? localAppearance;
  const readOnly = disabled || value !== undefined && !onValueChange;
  const changeValue = (next: string) => { if (readOnly || !/^#[\da-f]{6}$/i.test(next) || next === activeValue) return; if (value === undefined) setLocalValue(next); onValueChange?.(next); };
  const swatch = <span {...props} className={`hk-color ${className}`}><span className="hk-color-swatch" style={{ backgroundColor: activeValue }} aria-hidden="true" />{label ?? activeValue}</span>;
  if (!editable) return swatch;
  return <KitProvider appearance={activeAppearance} palette={palette} className="hk-color-preview">
    <div className="hk-color-controls"><label>Preview appearance<Select value={activeAppearance} disabled={disabled || appearance !== undefined && !onAppearanceChange} onChange={event => { const next = event.currentTarget.value; if (disabled || appearance !== undefined && !onAppearanceChange || next !== "light" && next !== "dark" || next === activeAppearance) return; if (appearance === undefined) setLocalAppearance(next); onAppearanceChange?.(next); }}><option value="light">Light</option><option value="dark">Dark</option></Select></label>
      <label>Accent preset<Select value={colorPresets.some(preset => preset.value === activeValue) ? activeValue : "custom"} disabled={readOnly} onChange={event => changeValue(event.currentTarget.value)}><option value="custom" disabled>Custom</option>{colorPresets.map(preset => <option key={preset.value} value={preset.value}>{preset.label}</option>)}</Select></label>
      <label>Custom accent<input type="color" value={/^#[\da-f]{6}$/i.test(activeValue) ? activeValue : "#000000"} disabled={readOnly || !/^#[\da-f]{6}$/i.test(activeValue)} onChange={event => changeValue(event.currentTarget.value)} /></label>
    </div>{swatch}
    <div className="hk-color-roles">{[["Foreground", "--hk-ink"], ["Text", "--hk-secondary"], ["Background", "--hk-canvas"], ["Border", "--hk-line"], ["Graphs", "--hk-accent"], ["State", "--hk-positive", "--hk-attention", "--hk-negative"]].map(([group, ...tokens]) => <fieldset key={group}><legend>{group}</legend>{tokens.map(token => <Color key={token} value={token === "--hk-accent" ? activeValue : `var(${token})`} label={token} />)}</fieldset>)}</div>
  </KitProvider>;
}
export function Typography({ children, variant = "body", weight, className = "", ...props }: ComponentPropsWithRef<"div"> & { variant?: "display" | "title" | "body" | "caption" | "large-title" | "display-1" | "display-2" | "display-3" | "display-4" | "title-1" | "title-2" | "title-3" | "headline" | "body-2" | "caption-1" | "caption-2"; weight?: "regular" | "medium" | "semibold" | "bold" }) { return <div {...props} data-weight={weight} className={`hk-typography hk-typography--${variant} ${className}`}>{children}</div>; }
type SocialButtonProps = { provider: string; icon?: ReactNode; iconOnly?: boolean; fullWidth?: boolean; appearance?: "colorful" | "black" | "white" } & (ButtonProps & { href?: undefined } | ComponentPropsWithRef<"a"> & { href: string; disabled?: boolean; pending?: boolean; size?: ButtonProps["size"]; variant?: ButtonProps["variant"] });
export function SocialButton({ provider, children, icon, iconOnly = false, fullWidth = false, appearance = "colorful", className = "", ...props }: SocialButtonProps) {
  const label = props["aria-label"] ?? (typeof children === "string" ? children : `Continue with ${provider}`);
  const content = <>{icon && <span aria-hidden="true">{icon}</span>}{iconOnly ? <span aria-hidden="true">{icon ? null : provider.slice(0, 1)}</span> : children ?? `Continue with ${provider}`}</>;
  const classes = `hk-social-button hk-social-button--${appearance} ${fullWidth ? "hk-social-button--full" : ""} ${iconOnly ? "hk-icon-button" : ""} ${className}`;
  if (props.href !== undefined) {
    const { href, disabled, pending, size = "medium", variant: _variant, onClick, onAuxClick, ...anchor } = props;
    let safe = false;
    try { const url = new URL(href, "https://harso.invalid"); safe = !/[\u0000-\u0020\\]/.test(href) && !href.startsWith("//") && (href.startsWith("/") || /^https?:\/\//i.test(href)) && (url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password; } catch { safe = false; }
    const blocked = disabled || pending || !safe;
    return <a {...anchor} href={blocked ? undefined : href} role="link" aria-label={label} aria-disabled={blocked || undefined} aria-busy={pending || undefined} tabIndex={blocked ? -1 : anchor.tabIndex} rel="noopener noreferrer" referrerPolicy="no-referrer" ping={undefined} className={`hk-button hk-button--outline hk-button--${size} ${classes}`} onClick={event => { if (blocked) event.preventDefault(); else onClick?.(event); }} onAuxClick={event => { if (blocked) event.preventDefault(); else onAuxClick?.(event); }}>{content}</a>;
  }
  return <Button {...props} className={classes} variant="outline" aria-label={label}>{content}</Button>;
}
export { Persona, type PersonaProps, type PersonaState, type PersonaVariant } from "./persona";
export type SettingsPage = "general" | "profile" | "tools" | "storage";
type SettingsModalProps = Omit<ComponentPropsWithRef<"dialog">, "open" | "onClose"> & {
  open?: boolean; isOpen?: boolean; title?: string; onClose?: () => void;
  defaultPage?: SettingsPage; pages?: Partial<Record<SettingsPage, ReactNode>>; planArtSrc?: string;
};
const settingsPages: SettingsPage[] = ["general", "profile", "tools", "storage"];
const settingsTitles = { general: "General", profile: "Profile", tools: "Tools", storage: "Storage" };
function SettingsPages({ defaultPage = "general", pages = {}, planArtSrc, children }: Pick<SettingsModalProps, "defaultPage" | "pages" | "planArtSrc" | "children">) {
  const [page, setPage] = useState<SettingsPage>(settingsPages.includes(defaultPage) ? defaultPage : "general");
  const [failedArtwork, setFailedArtwork] = useState<string | null>(null);
  const identity = useId();
  const allowedArtwork = planArtSrc && (planArtSrc.startsWith("/") && !planArtSrc.startsWith("//") || /^https?:\/\//i.test(planArtSrc));
  return <div className="hk-settings-layout">
    <nav aria-label="Settings pages">{settingsPages.map(item => <Button key={item} aria-current={page === item ? "page" : undefined} aria-controls={`${identity}-page`} onClick={() => setPage(item)}>{settingsTitles[item]}</Button>)}</nav>
    <section id={`${identity}-page`} aria-labelledby={`${identity}-heading`} className="hk-settings-page">
      <h3 id={`${identity}-heading`}>{settingsTitles[page]}</h3>
      {page === "general" && <div className="hk-settings-plan"><div className="hk-settings-plan-art">
        {allowedArtwork && failedArtwork !== planArtSrc ? <img src={planArtSrc} alt="Plan artwork" referrerPolicy="no-referrer" onError={() => setFailedArtwork(planArtSrc)} /> : <div role="img" aria-label="Plan artwork" data-artwork="native"><span /><span /><span /></div>}
      </div><h4>Current plan</h4></div>}
      {pages[page] ?? (page === "general" && children != null ? children : <p className="hk-settings-empty">No {page === "general" ? "plan or preferences" : page === "profile" ? "profile information" : page === "tools" ? "tool connections" : "storage information"} supplied.</p>)}
    </section>
  </div>;
}
export function SettingsModal({ open = false, isOpen, title = "Settings", children, onClose, defaultPage = "general", pages, planArtSrc, className = "", ...props }: SettingsModalProps) {
  const active = isOpen ?? open;
  const anchor = useRef<HTMLSpanElement>(null);
  const origin = useRef<HTMLElement | null>(null);
  const [theme, setTheme] = useState<{ appearance: Appearance; palette: Palette }>({ appearance: "system", palette: "clean" });
  useLayoutEffect(() => {
    const provider = anchor.current?.closest<HTMLElement>(".harso-kit");
    if (!provider) return;
    const update = () => setTheme({ appearance: provider.dataset.mode === "dark" ? "dark" : "light", palette: provider.dataset.palette === "cozy" ? "cozy" : "clean" });
    update();
    const observer = new MutationObserver(update);
    observer.observe(provider, { attributes: true, attributeFilter: ["data-mode", "data-palette"] });
    return () => observer.disconnect();
  }, []);
  return <><span ref={anchor} hidden /><Dialog.Root open={active} onOpenChange={next => { if (!next) onClose?.(); }}>
    {active && <Dialog.Portal><KitProvider {...theme} className="hk-settings-portal">
      <Dialog.Overlay className="hk-settings-overlay" />
      <Dialog.Content asChild aria-describedby={undefined} onOpenAutoFocus={() => { origin.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; }} onCloseAutoFocus={event => { event.preventDefault(); if (origin.current?.isConnected) origin.current.focus(); }}>
        <dialog {...props} open onClose={event => { event.currentTarget.open = true; onClose?.(); }} className={`hk-settings-modal ${className}`}>
          <header><Dialog.Title asChild><h2>{title}</h2></Dialog.Title><Dialog.Close asChild><Button disabled={!onClose} aria-label="Close settings">Close</Button></Dialog.Close></header>
          <SettingsPages defaultPage={defaultPage} pages={pages} planArtSrc={planArtSrc}>{children}</SettingsPages>
        </dialog>
      </Dialog.Content>
    </KitProvider></Dialog.Portal>}
  </Dialog.Root></>;
}
type AuthField = "email" | "password" | "confirmPassword" | "code";
type AuthCardProps = ComponentPropsWithRef<"section"> & { title?: string; description?: string; mode?: "signin" | "signup" | "verify"; layout?: "stacked" | "split" | "centered"; logo?: ReactNode; artwork?: ReactNode; footnote?: ReactNode; confirmPassword?: boolean; providerLayout?: "stacked" | "inline" | "grid"; providers?: readonly { id: string; label?: string; icon?: ReactNode; href?: string; onSelect?: () => void | boolean; disabled?: boolean }[]; onSubmitData?: (data: FormData) => void; onResend?: () => void; values?: Partial<Record<AuthField, string>>; onFieldChange?: (field: AuthField, value: string) => void; disabled?: boolean; pending?: boolean; error?: ReactNode; submitLabel?: string };
export function AuthCard({ title = "Welcome", description, mode, layout = "stacked", logo, artwork, footnote, confirmPassword = false, providerLayout = "stacked", providers = [], onSubmitData, onResend, values, onFieldChange, disabled = false, pending = false, error, submitLabel, onSubmit, children, className = "", ...props }: AuthCardProps) {
  const identity = useId();
  const blocked = disabled || pending;
  const field = (name: AuthField) => ({ name, required: true, value: values?.[name], readOnly: values?.[name] !== undefined && !onFieldChange, onChange: (event: ChangeEvent<HTMLInputElement>) => { if (!blocked && !event.defaultPrevented) onFieldChange?.(name, event.currentTarget.value); } });
  const providerButtons = providers.length > 0 && <div className="hk-auth-providers" data-layout={providerLayout} role="group" aria-label="Sign-in providers">{providers.map(provider => provider.href !== undefined ? <SocialButton key={provider.id} provider={provider.label ?? provider.id} icon={provider.icon} href={provider.href} disabled={blocked || provider.disabled} onClick={event => { if (provider.onSelect?.() === false) event.preventDefault(); }} /> : <SocialButton key={provider.id} provider={provider.label ?? provider.id} icon={provider.icon} disabled={blocked || provider.disabled || !provider.onSelect} onClick={() => { if (!blocked && !provider.disabled) provider.onSelect?.(); }} />)}</div>;
  return <section {...props} onSubmit={mode ? undefined : onSubmit} data-layout={layout} className={`hk-auth-card ${className}`}>
    {artwork != null && <div className="hk-auth-artwork">{artwork}</div>}
    <div className="hk-auth-content">{logo != null && <div className="hk-auth-logo">{logo}</div>}<header><h2 id={`${identity}-title`}>{title}</h2>{description && <p>{description}</p>}</header>
      {error != null && <div id={`${identity}-error`} role="alert">{error}</div>}
      {mode ? <form key={mode} aria-labelledby={`${identity}-title`} aria-describedby={error != null ? `${identity}-error` : undefined} aria-busy={pending || undefined} onInput={event => { const confirmation = event.currentTarget.elements.namedItem("confirmPassword"); if (confirmation instanceof HTMLInputElement) confirmation.setCustomValidity(""); }} onSubmit={event => {
        if (blocked || !onSubmitData) { event.preventDefault(); return; }
        let cancelled = false;
        try { onSubmit?.(event); cancelled = event.defaultPrevented; } finally { event.preventDefault(); }
        if (cancelled) return;
        const form = event.currentTarget;
        const confirmation = form.elements.namedItem("confirmPassword");
        const password = form.elements.namedItem("password");
        if (confirmation instanceof HTMLInputElement && password instanceof HTMLInputElement) confirmation.setCustomValidity(confirmation.value === password.value ? "" : "Passwords do not match.");
        if (form.reportValidity()) onSubmitData(new FormData(form));
      }}><fieldset disabled={blocked}>
        {mode === "verify" ? <label>Verification code<InputOtp {...field("code")} /></label> : <><label>Email<Input {...field("email")} type="email" autoComplete="email" /></label><label>Password<Input {...field("password")} type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} /></label>{mode === "signup" && confirmPassword && <label>Confirm password<Input {...field("confirmPassword")} type="password" autoComplete="new-password" /></label>}</>}
        {children}<Button type="submit" disabled={blocked || !onSubmitData}>{submitLabel ?? (mode === "signup" ? "Create account" : mode === "verify" ? "Verify code" : "Sign in")}</Button>
        {mode === "verify" && <Button disabled={blocked || !onResend} onClick={() => { if (!blocked) onResend?.(); }}>Resend code</Button>}
      </fieldset></form> : children}
      {providerButtons}{footnote != null && <footer>{footnote}</footer>}
    </div>
  </section>;
}
export function AuthMediaCarousel({ children, index, defaultIndex = 0, onIndexChange, label = "Authentication media", className = "", onKeyDown, ...props }: ComponentPropsWithRef<"div"> & { index?: number; defaultIndex?: number; onIndexChange?: (index: number) => void; label?: string }) {
  const slides = Children.toArray(children);
  const clampIndex = (requested: number) => Math.max(0, Math.min(Number.isFinite(requested) ? Math.trunc(requested) : 0, Math.max(0, slides.length - 1)));
  const [uncontrolledIndex, setUncontrolledIndex] = useState(() => clampIndex(defaultIndex));
  const activeIndex = clampIndex(index === undefined ? uncontrolledIndex : index);
  useEffect(() => {
    if (index === undefined) setUncontrolledIndex(activeIndex);
  }, [activeIndex, index]);
  const changeIndex = (nextIndex: number) => {
    const boundedIndex = clampIndex(nextIndex);
    if (!slides.length || boundedIndex === activeIndex) return;
    if (index === undefined) setUncontrolledIndex(boundedIndex);
    onIndexChange?.(boundedIndex);
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || !slides.length) return;
    const direction = getComputedStyle(event.currentTarget).direction === "rtl" ? -1 : 1;
    if (event.key === "ArrowLeft") { event.preventDefault(); changeIndex(activeIndex - direction); }
    if (event.key === "ArrowRight") { event.preventDefault(); changeIndex(activeIndex + direction); }
    if (event.key === "Home") { event.preventDefault(); changeIndex(0); }
    if (event.key === "End") { event.preventDefault(); changeIndex(slides.length - 1); }
  };
  return <div {...props} className={`hk-auth-media-carousel ${className}`} role={props.role ?? "region"} aria-roledescription="carousel" aria-label={props["aria-label"] ?? label} tabIndex={props.tabIndex ?? 0} onKeyDown={handleKeyDown}>
    <div className="hk-auth-media-carousel__viewport">
      {slides.map((slide, slideIndex) => <div key={isValidElement(slide) ? slide.key : slideIndex} className="hk-auth-media-carousel__slide" role="group" aria-roledescription="slide" aria-label={`${slideIndex + 1} of ${slides.length}`} hidden={slideIndex !== activeIndex}>{slide}</div>)}
    </div>
    {slides.length > 1 && <div className="hk-auth-media-carousel__controls">
      <Button size="small" variant="quiet" onClick={() => changeIndex(activeIndex - 1)} disabled={activeIndex === 0} aria-label="Previous media">Previous</Button>
      <div className="hk-auth-media-carousel__indicators" role="group" aria-label="Choose media">
        {slides.map((_, slideIndex) => <button key={slideIndex} type="button" className="hk-auth-media-carousel__indicator" aria-label={`Show media ${slideIndex + 1}`} aria-current={slideIndex === activeIndex ? "true" : undefined} onClick={() => changeIndex(slideIndex)} />)}
      </div>
      <Button size="small" variant="quiet" onClick={() => changeIndex(activeIndex + 1)} disabled={activeIndex === slides.length - 1} aria-label="Next media">Next</Button>
    </div>}
  </div>;
}
