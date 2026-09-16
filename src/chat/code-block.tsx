"use client";

import { BracketsAngleIcon, CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import "./code-block.css";

export interface HarsoCodeBlockProps extends Omit<ComponentPropsWithoutRef<"figure">, "children"> {
  code: string;
  language?: string;
  filename?: string;
  lineNumbers?: boolean;
  /** Line numbers (1-based) to emphasise with the accent tint. */
  highlightLines?: readonly number[];
  /** Render `+`/`-` prefixed lines as add/remove diff rows with tonal tints and an accessible label. */
  diff?: boolean;
  highlight?: (code: string, language: string | undefined) => ReactNode;
}

type Row = { text: string; kind: "" | "add" | "remove"; emphasised: boolean };

export function HarsoCodeBlock({ code, language, filename, lineNumbers = false, highlightLines, diff = false, highlight, className = "", ...props }: HarsoCodeBlockProps) {
  const [feedback, setFeedback] = useState("");
  useEffect(() => { setFeedback(""); }, [code]);
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(""), 2000);
    return () => clearTimeout(timer);
  }, [feedback]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setFeedback("Copied");
    } catch {
      setFeedback("Could not copy code");
    }
  };
  const emphasis = useMemo(() => new Set(highlightLines ?? []), [highlightLines]);
  const rows: Row[] = useMemo(() => code.replace(/\r?\n$/, "").split(/\r?\n/).map((text, index) => {
    const kind: Row["kind"] = diff && text.startsWith("+") ? "add" : diff && text.startsWith("-") ? "remove" : "";
    return { text, kind, emphasised: emphasis.has(index + 1) };
  }), [code, diff, emphasis]);
  // The per-row layout owns line numbers and tints; a whole-block highlighter (Shiki) still renders unrowed.
  const rowed = !highlight;
  const label = filename || language || "text";
  return <figure {...props} className={`hkc-code-block ${className}`}>
    <figcaption className="hkc-code-block-header">
      <BracketsAngleIcon size={16} weight="regular" aria-hidden="true" className="hkc-code-block-glyph" />
      <span className="hkc-code-block-filename" title={filename || language}>{label}</span>
      {filename && language ? <span className="hkc-code-block-chip">{language}</span> : null}
      <span className="hkc-code-block-feedback" role="status">{feedback}</span>
      <button type="button" className="hkc-code-block-copy" onClick={copy} aria-label={feedback === "Copied" ? "Copied" : "Copy code"} title={feedback === "Copied" ? "Copied" : "Copy code"}>
        {feedback === "Copied" ? <CheckIcon size={14} aria-hidden="true" /> : <CopyIcon size={14} aria-hidden="true" />}
        <span className="hkc-code-block-copy-label">{feedback === "Copied" ? "Copied" : "Copy"}</span>
      </button>
    </figcaption>
    <div className="hkc-code-block-viewport" role="region" aria-label={filename ? `Code: ${filename}` : "Code"} tabIndex={0}>
      {rowed
        ? <ol className="hkc-code-block-rows" role="presentation">
            {rows.map((row, index) => <li
              key={index}
              role="presentation"
              className={`hkc-code-block-row${row.kind ? ` hkc-code-block-row--${row.kind}` : ""}${row.emphasised ? " hkc-code-block-row--on" : ""}`}
              data-diff={row.kind || undefined}
            >
              {lineNumbers && <span className="hkc-code-block-num" aria-hidden="true">{index + 1}</span>}
              {row.kind && <span className="hkc-code-block-sr">{row.kind === "add" ? "Added:" : "Removed:"}</span>}
              <span className="hkc-code-block-code">{row.text || "\u00A0"}</span>
            </li>)}
          </ol>
        : <>
            {lineNumbers && <div className="hkc-code-block-numbers" aria-hidden="true">{rows.map((_, index) => <span key={index}>{index + 1}</span>)}</div>}
            <pre><code>{highlight!(code, language)}</code></pre>
          </>}
    </div>
  </figure>;
}
