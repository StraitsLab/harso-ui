"use client";

import type { ReactNode } from "react";
import { Tabs } from "../../navigation";
import "./local-controls.css";

/*
 * P9: the sections of a long answer, one at a time. The kit Tabs already keep every panel mounted (a hidden panel keeps
 * what was typed or scrolled in it), move focus with the arrow keys, Home and End, and leave focus on a tapped tab.
 * Switching is view state only: the sections are drawn by `renderSection` exactly as received and in received order.
 */
export interface SectionTabsProps<T extends { heading?: string }> {
  sections: readonly T[];
  /** The section shown first. Anything that is not a position in `sections` means the first. */
  initialIndex?: number;
  renderSection: (section: T, index: number) => ReactNode;
  /** The name of the tab list for assistive tech. */
  label?: string;
}

export function SectionTabs<T extends { heading?: string }>({ sections, initialIndex = 0, renderSection, label = "Sections" }: SectionTabsProps<T>) {
  if (sections.length === 0) return null;
  if (sections.length === 1) return <>{renderSection(sections[0], 0)}</>;
  const start = Number.isInteger(initialIndex) && initialIndex >= 0 && initialIndex < sections.length ? initialIndex : 0;
  return <div className="hkc-section-tabs">
    <Tabs variant="pill" label={label} defaultValue={String(start)}
      items={sections.map((section, index) => ({ value: String(index), label: section.heading ?? `Section ${index + 1}`, content: renderSection(section, index) }))} />
  </div>;
}
