"use client";

import { CopyIcon, CheckIcon, DownloadIcon, CornersOutIcon, FileTextIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { HarsoCodeBlock } from "./code-block";
import "./artifact.css";

export type HarsoArtifactMode = "preview" | "code";

export interface HarsoArtifactProps extends Omit<ComponentPropsWithoutRef<"figure">, "children" | "title"> {
  /** Artifact display name, e.g. "A quieter place to think". */
  name: string;
  /** Secondary line under the name, e.g. "Research brief · Markdown". */
  meta?: string;
  /** Raw source of the artifact (shown in the Code tab, and copied/downloaded). */
  code: string;
  /** Language token for the Code tab syntax rows, e.g. "markdown". */
  language?: string;
  /** Line numbers (1-based) to emphasise in the Code tab. */
  highlightLines?: readonly number[];
  /** Rendered preview for the Preview tab (already-sanitised nodes, e.g. HarsoMarkdownText output). When absent, only the Code tab shows. */
  preview?: ReactNode;
  /** Which tab is active on first render. Defaults to "preview" when a preview is supplied, else "code". */
  defaultMode?: HarsoArtifactMode;
  /** Filename used for the download; defaults to `name`. */
  downloadName?: string;
  /** Host expand/fullscreen handler. When omitted the Expand control is not rendered. */
  onExpand?: () => void;
  /** Host clipboard for Copy; renderers without navigator.clipboard supply one. */
  copyToClipboard?: (text: string) => void | Promise<void>;
  /** Host download; when omitted, a Blob + object URL is used. */
  onDownload?: (code: string, filename: string) => void;
}

export function HarsoArtifact({ name, meta, code, language, highlightLines, preview, defaultMode, downloadName, onExpand, copyToClipboard, onDownload, className = "", ...props }: HarsoArtifactProps) {
  const hasPreview = preview !== undefined && preview !== null;
  const [mode, setMode] = useState<HarsoArtifactMode>(defaultMode ?? (hasPreview ? "preview" : "code"));
  const [feedback, setFeedback] = useState("");
  useEffect(() => { setFeedback(""); }, [code]);
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(""), 2000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const copy = async () => {
    try {
      if (copyToClipboard) await copyToClipboard(code);
      else await navigator.clipboard.writeText(code);
      setFeedback("Copied");
    } catch {
      setFeedback("Could not copy");
    }
  };

  const filename = downloadName || name;
  const download = () => {
    if (onDownload) { onDownload(code, filename); return; }
    try {
      const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      setFeedback("Could not download");
    }
  };

  const tabId = useMemo(() => `hkc-artifact-${Math.random().toString(36).slice(2, 8)}`, []);

  return <figure {...props} className={`hkc-artifact ${className}`} aria-label={`Artifact: ${name}`}>
    <div className="hkc-artifact-header">
      <FileTextIcon size={16} weight="regular" aria-hidden="true" className="hkc-artifact-glyph" />
      <span className="hkc-artifact-name" title={name}>{name}</span>
      <span className="hkc-artifact-feedback" role="status">{feedback}</span>
      <div className="hkc-artifact-actions">
        <button type="button" className="hkc-artifact-action" onClick={copy} aria-label={feedback === "Copied" ? "Copied" : "Copy artifact"} title="Copy">
          {feedback === "Copied" ? <CheckIcon size={16} aria-hidden="true" /> : <CopyIcon size={16} aria-hidden="true" />}
        </button>
        <button type="button" className="hkc-artifact-action" onClick={download} aria-label="Download artifact" title="Download">
          <DownloadIcon size={16} aria-hidden="true" />
        </button>
        {onExpand ? <button type="button" className="hkc-artifact-action" onClick={onExpand} aria-label="Expand artifact" title="Expand">
          <CornersOutIcon size={16} aria-hidden="true" />
        </button> : null}
      </div>
    </div>
    {meta ? <p className="hkc-artifact-meta">{meta}</p> : null}
    {hasPreview ? <div className="hkc-artifact-tabs" role="tablist" aria-label="Artifact view">
      <button type="button" role="tab" id={`${tabId}-preview`} aria-selected={mode === "preview"} aria-controls={`${tabId}-panel`} className="hkc-artifact-tab" onClick={() => setMode("preview")}>Preview</button>
      <button type="button" role="tab" id={`${tabId}-code`} aria-selected={mode === "code"} aria-controls={`${tabId}-panel`} className="hkc-artifact-tab" onClick={() => setMode("code")}>Code</button>
    </div> : null}
    <div className="hkc-artifact-divider" role="presentation" />
    <div className="hkc-artifact-body" id={`${tabId}-panel`} role={hasPreview ? "tabpanel" : undefined} aria-labelledby={hasPreview ? `${tabId}-${mode}` : undefined}>
      {mode === "preview" && hasPreview
        ? <div className="hkc-artifact-preview">{preview}</div>
        : <HarsoCodeBlock className="hkc-artifact-code" code={code} language={language} lineNumbers highlightLines={highlightLines} />}
    </div>
  </figure>;
}
