import { Component, type ReactNode } from "react";
import { V6_TEMPLATES, type V6Family, type V6FamilyProps, type V6Registry, type V6Template, type WidgetSize } from "./types";
import type { HarsoOutputDocument } from "../output-card";
import { family as commerce } from "./commerce";
import { family as journeys } from "./journeys";
import { family as weather } from "./weather";
import { family as places } from "./places";
import { family as mail } from "./mail";
import { family as schedule } from "./schedule";
import { family as research } from "./research";
import { family as finance } from "./finance";

/*
 * WEV-3303: the Lead adds one line per finished family here and nowhere else; a family never registers itself. Dispatch is by `document.template` only,
 * never by a title or by which blocks happen to be present.
 */
export const V6_FAMILIES: V6Registry = Object.freeze({
  "price-watch": commerce, "compare-products": commerce, "product-shortlist": commerce,
  "delivery-tracking": journeys, "flight-status": journeys, "flight-options": journeys,
  "weather-now": weather,
  "trip-itinerary": places, "places-nearby": places,
  "inbox-brief": mail, "deadlines-from-mail": mail, "reply-draft": mail,
  "day-agenda": schedule, "meeting-brief": schedule, "recurring-reminder": schedule, "reply-watch": schedule,
  "research-brief": research,
  "stock-quote": finance, "bills-due": finance, "subscriptions": finance,
});

/** The document's template hint if it is one of the 20 names; anything else (absent, unknown, a variant name) is none. */
export function v6TemplateOf(document: Pick<HarsoOutputDocument, "template">): V6Template | undefined {
  const template: unknown = document.template;
  return typeof template === "string" && (V6_TEMPLATES as readonly string[]).includes(template) ? template as V6Template : undefined;
}

export function v6FamilyOf(document: Pick<HarsoOutputDocument, "template">, families: V6Registry = V6_FAMILIES): V6Family | undefined {
  const template = v6TemplateOf(document);
  return template && Object.hasOwn(families, template) ? families[template] : undefined;
}

/** The sizes a card of this document can be pinned at: its family's answer, or none when no family handles it. */
export function harsoV6WidgetSizes(document: Pick<HarsoOutputDocument, "template">, families: V6Registry = V6_FAMILIES): readonly WidgetSize[] {
  const template = v6TemplateOf(document);
  return template ? v6FamilyOf(document, families)?.supportedWidgetSizes(template) ?? [] : [];
}

/** The family runs as a component of its own, so the hooks it calls are legal and keep their state between renders. */
function FamilyBody({ family, props, fallback }: { family: V6Family; props: V6FamilyProps; fallback: ReactNode }) {
  return family.renderFamily(props) ?? fallback;
}

/** A family that throws must not blank the answer: the generic card draws instead (for as long as this card lives). */
class Guard extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

/** Key it by template: a different family is a different component with its own hooks. */
export function V6FamilyBoundary(props: { family: V6Family; familyProps: V6FamilyProps; fallback: ReactNode }) {
  return <Guard fallback={props.fallback}><FamilyBody family={props.family} props={props.familyProps} fallback={props.fallback} /></Guard>;
}
