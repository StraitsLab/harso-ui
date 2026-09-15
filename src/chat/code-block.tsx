"use client";

import { CheckIcon, CopyIcon, FileText } from "@phosphor-icons/react";
import { useEffect, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { IconButton } from "../primitives";
import "./code-block.css";

export interface HarsoCodeBlockProps extends Omit<ComponentPropsWithoutRef<"figure">, "children"> {
  code: string;
  language?: string;
  filename?: string;
  lineNumbers?: boolean;
  highlight?: (code: string, language: string | undefined) => ReactNode;
}

export function HarsoCodeBlock({ code, language, filename, lineNumbers = false, highlight, className = "", ...props }: HarsoCodeBlockProps) {
  const [feedback, setFeedback] = useState("");
  useEffect(() => {
    setFeedback("");
  }, [code]);
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
  const lines = code.replace(/\n$/, "").split("\n");
  return <figure {...props} className={`hkc-code-block ${className}`}>
    <figcaption className="hkc-code-block-header">
      <FileText size={12} weight="regular" aria-hidden="true" />
      <span className="hkc-code-block-filename" title={filename}>{filename || language || "text"}</span>
      <span className="hkc-code-block-feedback" role="status">{feedback}</span>
      <IconButton label={feedback === "Copied" ? "Copied" : "Copy code"} title={feedback === "Copied" ? "Copied" : "Copy code"} className="hkc-code-block-copy" onClick={copy}>
        {feedback === "Copied" ? <CheckIcon size={12} aria-hidden="true" /> : <CopyIcon size={12} aria-hidden="true" />}
      </IconButton>
    </figcaption>
    <div className="hkc-code-block-viewport" role="region" aria-label={filename ? `Code: ${filename}` : "Code"} tabIndex={0}>
      {lineNumbers && <div className="hkc-code-block-numbers" aria-hidden="true">{lines.map((_, index) => <span key={index}>{index + 1}</span>)}</div>}
      <pre><code>{highlight ? highlight(code, language) : code}</code></pre>
    </div>
  </figure>;
}
