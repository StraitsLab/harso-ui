import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type CSSProperties, type ReactNode } from "react";
import type { BundledLanguage, ThemedToken } from "shiki";
import { Snippet, SnippetCopyButton, type DeveloperCopyProps } from "./developer-content";

type DivProps = ComponentPropsWithRef<"div">;
type CodeState = { code: string; language?: string; showLineNumbers: boolean; disabled: boolean; registerContent: () => () => void };
const CodeContext = createContext<CodeState | null>(null);
function useCode() { const state = useContext(CodeContext); if (!state) throw new Error("CodeBlock parts require CodeBlock."); return state; }
type LanguageState = { value: string; onValueChange?: (value: string) => void; open: boolean; setOpen: (open: boolean) => void; disabled: boolean; id: string; close: () => void };
const LanguageContext = createContext<LanguageState | null>(null);
function useLanguage() { const state = useContext(LanguageContext); if (!state) throw new Error("CodeBlock language parts require CodeBlockLanguageSelector."); return state; }
function languageChoices(root: HTMLElement | null) {
  return Array.from(root?.querySelectorAll<HTMLButtonElement>('[role="option"]:not(:disabled):not([aria-disabled="true"])') ?? []).filter(choice => {
    for (let ancestor: HTMLElement | null = choice; ancestor && ancestor !== root; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor);
      if (ancestor.hidden || ancestor.inert || style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse") return false;
    }
    return true;
  });
}

export type CodeBlockProps = DivProps & { code: string; language?: string; showLineNumbers?: boolean; disabled?: boolean };
export function CodeBlock({ code, language, showLineNumbers = false, disabled = false, children, className = "", ...props }: CodeBlockProps) {
  const [contents, setContents] = useState(0);
  const [mounted, setMounted] = useState(false);
  const registerContent = useCallback(() => { setContents(count => count + 1); return () => setContents(count => count - 1); }, []);
  useLayoutEffect(() => setMounted(true), []);
  return <CodeContext value={{ code, language, showLineNumbers, disabled, registerContent }}><div {...props} className={`hk-code-block ${className}`} data-language={language || undefined}>{children ?? <CodeBlockHeader><CodeBlockTitle>{language || "Code"}</CodeBlockTitle><CodeBlockActions><CodeBlockCopyButton /></CodeBlockActions></CodeBlockHeader>}{(children == null || mounted) && contents === 0 && <CodeBody />}</div></CodeContext>;
}
export function CodeBlockHeader({ className = "", ...props }: DivProps) { return <div {...props} className={`hk-code-header ${className}`} />; }
export function CodeBlockTitle({ className = "", ...props }: DivProps) { return <div {...props} className={`hk-code-title ${className}`} />; }
export function CodeBlockFilename({ className = "", ...props }: DivProps) { return <div {...props} className={`hk-code-filename ${className}`} />; }
export function CodeBlockActions({ className = "", ...props }: DivProps) { return <div {...props} className={`hk-code-actions ${className}`} />; }
export function CodeBlockCopyButton({ disabled, onClick, ...props }: DeveloperCopyProps) { const code = useCode(); return <Snippet code={code.code} disabled={code.disabled || disabled} className="hk-code-copy"><SnippetCopyButton {...props} label={props.label ?? "Copy code"} onClick={event => { event.stopPropagation(); onClick?.(event); }} /></Snippet>; }
export function CodeBlockLanguageSelector({ value, onValueChange, children, className = "", disabled = false, ref, onKeyDown, onBlur, ...props }: DivProps & { value: string; onValueChange?: (value: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement | null>(null);
  const id = useId();
  const code = useContext(CodeContext);
  const unavailable = disabled || !!code?.disabled;
  const search = useRef({ text: "", time: 0 });
  const close = () => { setOpen(false); root.current?.querySelector<HTMLButtonElement>(".hk-code-language-trigger")?.focus(); };
  useEffect(() => { if (unavailable) setOpen(false); }, [unavailable]);
  useEffect(() => {
    if (!open || unavailable) return;
    search.current = { text: "", time: 0 };
    const choices = languageChoices(root.current);
    (choices.find(choice => choice.getAttribute("aria-selected") === "true") ?? choices[0])?.focus();
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open, unavailable]);
  return <LanguageContext value={{ value, onValueChange, open: open && !unavailable, setOpen, disabled: unavailable, id, close }}><div {...props} ref={node => { root.current = node; if (typeof ref === "function") return ref(node); if (ref) ref.current = node; }} className={`hk-code-language-selector ${className}`} onBlur={event => {
    onBlur?.(event);
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }} onKeyDown={event => {
    onKeyDown?.(event);
    if (event.defaultPrevented || unavailable || event.altKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing) return;
    if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); close(); return; }
    if (!open) {
      if (["ArrowDown", "ArrowUp"].includes(event.key) && !(event.target as HTMLButtonElement).disabled) { event.preventDefault(); setOpen(true); }
      return;
    }
    const choices = languageChoices(event.currentTarget);
    if (!choices.length) return;
    const current = choices.indexOf(document.activeElement as HTMLButtonElement);
    let next: HTMLButtonElement | undefined;
    if (event.key === "Home") next = choices[0];
    else if (event.key === "End") next = choices[choices.length - 1];
    else if (event.key === "ArrowDown") next = choices[(current + 1) % choices.length];
    else if (event.key === "ArrowUp") next = choices[(current - 1 + choices.length) % choices.length];
    else if (event.key.length === 1 && event.key !== " ") {
      const now = Date.now();
      search.current = { text: (now - search.current.time < 700 ? search.current.text : "") + event.key.toLocaleLowerCase(), time: now };
      next = choices.find(choice => choice.textContent?.trim().toLocaleLowerCase().startsWith(search.current.text));
    }
    if (next) { event.preventDefault(); next.focus(); }
  }}>{children}</div></LanguageContext>;
}
export function CodeBlockLanguageSelectorTrigger({ className = "", children, disabled, onClick, ...props }: ComponentPropsWithRef<"button">) { const language = useLanguage(); return <button {...props} type="button" id={`${language.id}-trigger`} disabled={disabled || language.disabled} aria-haspopup="listbox" aria-controls={`${language.id}-list`} aria-expanded={language.open} className={`hk-code-language-trigger ${className}`} onClick={event => { onClick?.(event); if (!event.defaultPrevented) language.setOpen(!language.open); }}>{children ?? <><CodeBlockLanguageSelectorValue>{language.value}</CodeBlockLanguageSelectorValue><span aria-hidden="true">⌄</span></>}</button>; }
export function CodeBlockLanguageSelectorValue({ children, className = "", ...props }: ComponentPropsWithRef<"span">) { const { value } = useLanguage(); return <span {...props} className={`hk-code-language-value ${className}`}>{children ?? value}</span>; }
export function CodeBlockLanguageSelectorContent({ children, className = "", ...props }: DivProps) { const { open, id } = useLanguage(); return <div {...props} id={`${id}-list`} aria-labelledby={`${id}-trigger`} role="listbox" hidden={!open} className={`hk-code-language-content ${className}`}>{children}</div>; }
export function CodeBlockLanguageSelectorItem({ value, children, className = "", onClick, disabled, ...props }: ComponentPropsWithRef<"button"> & { value: string }) { const language = useLanguage(); return <button {...props} type="button" role="option" tabIndex={-1} disabled={disabled || language.disabled} aria-selected={language.value === value} className={`hk-code-language-item ${className}`} onClick={event => { onClick?.(event); if (event.defaultPrevented || disabled || language.disabled) return; language.onValueChange?.(value); language.close(); }}>{children ?? value}</button>; }
export function CodeBlockContainer({ children, className = "", style, ...props }: DivProps & { children?: ReactNode }) { return <div {...props} className={`hk-code-container ${className}`} style={{ contentVisibility: "auto", ...style }}>{children}</div>; }
type CodeBlockContentProps = ComponentPropsWithRef<"pre"> & { code?: string; language?: string; showLineNumbers?: boolean };
export function CodeBlockContent(props: CodeBlockContentProps) {
  const registerContent = useContext(CodeContext)?.registerContent;
  useLayoutEffect(() => registerContent?.(), [registerContent]);
  return <CodeBody {...props} />;
}
function CodeBody({ code: suppliedCode, language: suppliedLanguage, showLineNumbers: suppliedLineNumbers, className = "", ...props }: CodeBlockContentProps) {
  const context = useContext(CodeContext);
  const code = suppliedCode ?? context?.code ?? "";
  const language = suppliedLanguage ?? context?.language;
  const showLineNumbers = suppliedLineNumbers ?? context?.showLineNumbers ?? false;
  const [highlight, setHighlight] = useState<{ code: string; language: string; tokens: ThemedToken[][] } | null>(null);
  useEffect(() => {
    let current = true;
    if (!language) return;
    import("shiki").then(({ codeToTokens, bundledLanguages }) => codeToTokens(code, { lang: Object.hasOwn(bundledLanguages, language) ? language as BundledLanguage : "text", themes: { light: "github-light", dark: "github-dark" } })).then(result => {
      if (current) setHighlight({ code, language, tokens: result.tokens });
    }).catch(() => { if (current) setHighlight(null); });
    return () => { current = false; };
  }, [code, language]);
  const tokens = highlight?.code === code && highlight.language === language ? highlight.tokens : undefined;
  const lines = code.split(/(\r\n|\n|\r)/);
  return <pre {...props} aria-label="Code" tabIndex={0} className={`hk-code-content ${className}`}><code>{lines.map((line, index) => {
    if (index % 2 !== 0) return null;
    const lineTokens = tokens?.[index / 2];
    const exactTokens = lineTokens?.map(token => token.content).join("") === line ? lineTokens : undefined;
    return <span className="hk-code-line" key={index}>{showLineNumbers && <span className="hk-code-line-number" aria-hidden="true" data-line-number={index / 2 + 1} />}<span>{exactTokens ? exactTokens.map((token, tokenIndex) => <span className="hk-code-token" key={tokenIndex} style={token.htmlStyle as CSSProperties}>{token.content}</span>) : line}</span>{lines[index + 1] ?? ""}</span>;
  })}</code></pre>;
}
