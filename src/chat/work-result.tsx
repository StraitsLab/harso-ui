"use client";

import { CaretDownIcon, CaretRightIcon, CheckCircleIcon, CircleNotchIcon, FileTextIcon, WarningCircleIcon, XCircleIcon } from "@phosphor-icons/react";
import { useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import "./work-result.css";

export type HarsoWorkStatus = "running" | "succeeded" | "failed" | "cancelled";
export type HarsoWorkStepState = "running" | "done" | "failed" | "pending";

export interface HarsoWorkStep {
  id: string;
  label: string;
  state: HarsoWorkStepState;
  /** Short trailing chip, e.g. "12s" or "3 files". */
  chip?: string;
}

export interface HarsoWorkArtifact {
  id: string;
  name: string;
  /** Short trailing chip, e.g. "4 KB" or "PDF". */
  chip?: string;
  /** Rendered when the row is expanded — e.g. a HarsoArtifact. Omit for a non-expandable row. */
  detail?: ReactNode;
  unavailable?: boolean;
}

export interface HarsoWorkResultProps extends Omit<ComponentPropsWithoutRef<"section">, "title" | "children"> {
  title: string;
  status: HarsoWorkStatus;
  /** Optional rich summary node; when supplied it replaces the plain summary inside the same card layout. */
  summaryContent?: ReactNode;
  /** Sentence under the steps, e.g. "The final step is complete." */
  summary?: string;
  steps?: readonly HarsoWorkStep[];
  artifacts?: readonly HarsoWorkArtifact[];
  /** Non-null custom selector/list replaces artifacts inside the same collapse scope. */
  artifactContent?: ReactNode;
  /** Status chip text, e.g. "3 of 3". Defaults to a step count when steps are supplied. */
  chip?: string;
  /** Primary action rendered at the foot of the card (dark pill). */
  action?: ReactNode;
  /** Collapsed by default when false. */
  defaultOpen?: boolean;
}

const STATUS_LABEL: Record<HarsoWorkStatus, string> = {
  running: "Work in progress",
  succeeded: "Work unit finished",
  failed: "Work unit failed",
  cancelled: "Work unit cancelled",
};

function StepGlyph({ state }: { state: HarsoWorkStepState }) {
  if (state === "running") return <CircleNotchIcon size={16} weight="bold" aria-hidden="true" className="hkc-work-glyph hkc-work-glyph--running" />;
  if (state === "done") return <CheckCircleIcon size={16} weight="fill" aria-hidden="true" className="hkc-work-glyph hkc-work-glyph--done" />;
  if (state === "failed") return <XCircleIcon size={16} weight="fill" aria-hidden="true" className="hkc-work-glyph hkc-work-glyph--failed" />;
  return <span className="hkc-work-glyph hkc-work-glyph--pending" aria-hidden="true" />;
}

function ArtifactRow({ artifact }: { artifact: HarsoWorkArtifact }) {
  const [open, setOpen] = useState(false);
  const expandable = Boolean(artifact.detail) && !artifact.unavailable;
  return <li className="hkc-work-artifact">
    {expandable
      ? <button type="button" className="hkc-work-artifact-row" aria-expanded={open} onClick={() => setOpen(value => !value)}>
          {open ? <CaretDownIcon size={12} aria-hidden="true" className="hkc-work-artifact-caret" /> : <CaretRightIcon size={12} aria-hidden="true" className="hkc-work-artifact-caret" />}
          <FileTextIcon size={16} aria-hidden="true" className="hkc-work-artifact-glyph" />
          <span className="hkc-work-artifact-name">{artifact.name}</span>
          {artifact.chip ? <span className="hkc-work-chip">{artifact.chip}</span> : null}
        </button>
      : <div className="hkc-work-artifact-row hkc-work-artifact-row--static">
          <FileTextIcon size={16} aria-hidden="true" className="hkc-work-artifact-glyph" />
          <span className="hkc-work-artifact-name">{artifact.name}</span>
          <span className="hkc-work-chip">{artifact.unavailable ? "Unavailable" : artifact.chip}</span>
        </div>}
    {expandable && open ? <div className="hkc-work-artifact-detail">{artifact.detail}</div> : null}
  </li>;
}

export function HarsoWorkResult({ title, status, summary, summaryContent, steps, artifacts, artifactContent, chip, action, defaultOpen = true, className = "", ...props }: HarsoWorkResultProps) {
  const [open, setOpen] = useState(defaultOpen);
  const done = steps?.filter(step => step.state === "done").length ?? 0;
  const statusChip = chip ?? (steps?.length ? `${done} of ${steps.length}` : undefined);
  return <section {...props} className={`hkc-work-result hkc-work-result--${status} ${className}`} aria-label={STATUS_LABEL[status]}>
    <div className="hkc-work-header">
      <button type="button" className="hkc-work-toggle" aria-expanded={open} onClick={() => setOpen(value => !value)}>
        {open ? <CaretDownIcon size={14} aria-hidden="true" /> : <CaretRightIcon size={14} aria-hidden="true" />}
        <span className="hkc-work-title">{title}</span>
      </button>
      {statusChip ? <span className={`hkc-work-chip hkc-work-chip--${status}`}>{statusChip}</span> : null}
    </div>
    {open ? <>
      {steps?.length ? <ol className="hkc-work-steps">
        {steps.map(step => <li key={step.id} className={`hkc-work-step hkc-work-step--${step.state}`}>
          <StepGlyph state={step.state} />
          <span className="hkc-work-step-label">{step.label}</span>
          {step.chip ? <span className="hkc-work-chip">{step.chip}</span> : null}
        </li>)}
      </ol> : null}
      {artifactContent != null ? <>
        <div className="hkc-work-separator" role="presentation" />
        {artifactContent}
      </> : artifacts?.length ? <>
        <div className="hkc-work-separator" role="presentation" />
        <ul className="hkc-work-artifacts" aria-label="Produced files">
          {artifacts.map(artifact => <ArtifactRow key={artifact.id} artifact={artifact} />)}
        </ul>
      </> : null}
      {summaryContent || summary ? <>
        <div className="hkc-work-separator" role="presentation" />
        <div className={`hkc-work-summary${status === "failed" ? " hkc-work-summary--failed" : ""}`}>
          {status === "failed" ? <WarningCircleIcon size={16} weight="fill" aria-hidden="true" className="hkc-work-glyph hkc-work-glyph--failed" /> : null}
          {summaryContent ?? summary}
        </div>
      </> : null}
      {action ? <div className="hkc-work-action">{action}</div> : null}
    </> : null}
  </section>;
}
