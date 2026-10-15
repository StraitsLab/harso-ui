import type { ReactNode } from "react";
import type { HarsoOutputActionHost, HarsoOutputCardProps, HarsoOutputDocument } from "../output-card";
import type { HarsoOutputMediaHost } from "../output-card-media";

/*
 * WEV-3303: the typed foundation every v6 card family codes against. Types only, except the template list.
 * C0-C10 (PLAN section 4.1) are mirrored as optional, closed fields on the existing document, row, chart, table, text
 * and status types in output-card*.tsx. There is no free-form `v6` bag: the document either carries a field the
 * contract names or it does not.
 */

/**
 * C0: the 20 templates this kit has a design for. The card contract accepts any lowercase-hyphen name; a name outside
 * this list is still a card and draws as the generic card. A variant (in flight, parcel, open) is the same template.
 */
export const V6_TEMPLATES = [
  "bills-due", "compare-products", "day-agenda", "deadlines-from-mail", "delivery-tracking", "flight-options", "flight-status",
  "inbox-brief", "meeting-brief", "places-nearby", "price-watch", "product-shortlist", "recurring-reminder", "reply-draft",
  "reply-watch", "research-brief", "stock-quote", "subscriptions", "trip-itinerary", "weather-now"
] as const;
export type V6Template = (typeof V6_TEMPLATES)[number];

/** Apple Home widget families (GRID.md). A card pinned to Home is drawn at one of these. */
export type WidgetSize = "small" | "medium" | "large" | "extraLarge";
/** `inline` is the card in a chat; `full` is the whole answer (View all). */
export type V6Mode = "inline" | "full";

/** C1 and the host's logo lookup: a bundled mark for a domain, or undefined to get the letter tile. Never a fetch. */
export type V6BrandRequest = Readonly<{ domain: string; label: string }>;
export type V6RenderBrand = (brand: V6BrandRequest) => ReactNode | undefined;

/** What the host lends a family: the action callbacks, how to open the whole answer, and host-owned state. */
export interface V6Host extends HarsoOutputActionHost {
  /** Opens the whole answer. The frame's open target calls it. */
  onViewAll: () => void;
  subjectState?: HarsoOutputCardProps["subjectState"];
  blockStates?: HarsoOutputCardProps["blockStates"];
}

/** The frozen family interface (PLAN section 6). */
export interface V6FamilyProps {
  document: HarsoOutputDocument;
  mode: V6Mode;
  widgetSize?: WidgetSize;
  host: V6Host;
  media: HarsoOutputMediaHost;
  renderBrand: V6RenderBrand;
  onOpenDetails?: () => void;
}

export interface V6Family {
  /** The family's card, or undefined when this document or size is not one it can draw (the generic card is then used). */
  renderFamily(props: V6FamilyProps): ReactNode | undefined;
  supportedWidgetSizes(template: V6Template): readonly WidgetSize[];
}

/** Template to family. The Lead alone populates the shipped one; a test passes its own. */
export type V6Registry = Readonly<Partial<Record<V6Template, V6Family>>>;

// ---- C2, C6, C7, C9: closed optional row facts ----

/** C2: one row link. Only `open_url`, with the contract's https rules; the host opens it. */
export interface V6RowAction { kind: "open_url"; label: string; url: string }
export type V6OpenState = "open" | "closed" | "unknown";
export type V6TravelMode = "walk" | "drive" | "transit" | "cycle";
export type V6CalendarColor = "blue" | "green" | "orange" | "red" | "purple" | "gray";

/** C9: short display strings, never instants for arithmetic. Local times carry their own zone label. */
export interface V6Flight {
  number?: string;
  origin_code?: string;
  destination_code?: string;
  origin_name?: string;
  destination_name?: string;
  scheduled_departure?: string;
  departure?: string;
  arrival?: string;
  departure_zone?: string;
  arrival_zone?: string;
  terminal?: string;
  gate?: string;
  previous_gate?: string;
  boarding?: string;
  seat?: string;
  /** A sourced remaining time. The renderer never counts down. */
  remaining?: string;
}

/** C1, C2, C6, C7 and C9 as the row carries them (the C9 facts sit flat on the row). */
export interface V6RowFields extends V6Flight {
  brand?: string;
  action?: V6RowAction;
  /** Decimal string 0-5. */
  rating?: string;
  review_count?: number;
  /** Decimal string 0-200. */
  noise_db?: string;
  category?: string;
  opening_label?: string;
  /** A snapshot as of the document, never an unattended live promise. */
  open_state?: V6OpenState;
  distance?: string;
  travel_mode?: V6TravelMode;
  unread?: boolean;
  /** UTC instant, only when the source knew it exactly. */
  due_at?: string;
  starts_at?: string;
  calendar_color?: V6CalendarColor;
  arrival_day_offset?: 0 | 1 | 2 | 3;
}

// ---- C8: weather ----

export type V6Sky = "clear-day" | "clear-night" | "cloudy" | "rain" | "storm";
export type V6WeatherCondition = "clear" | "night" | "partly" | "cloudy" | "rain" | "storm";
export interface V6HourlyWeather { condition?: V6WeatherCondition; /** Integer 0-100. */ rain?: number }
export interface V6DailyWeather { label: string; condition: V6WeatherCondition; low: string; high: string }
/** Hourly entries line up one for one with the carried chart's x_labels. At most 31 hourly and 7 daily entries. */
export interface V6Weather {
  sky?: V6Sky;
  current_condition?: V6WeatherCondition;
  high?: string;
  low?: string;
  hourly?: V6HourlyWeather[];
  days?: V6DailyWeather[];
}

// ---- C4, C3 ----

export type V6ChartRange = "1D" | "1W" | "1M" | "1Y";
export type V6TrackingCondition = "on_time" | "delayed" | "unknown";
