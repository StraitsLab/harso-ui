#!/usr/bin/env node
// Checks docs/agent/output-playbook.examples.json:
//   1. every document is valid against the copied output-blocks.v1 schema (a minimal validator for exactly the
//      keyword subset that schema uses; an unknown keyword throws, so a schema change cannot pass silently);
//   2. the structural rules the schema cannot express, ported from weave-cloud packages/contracts/tools/contracts.py
//      output_blocks_semantic (one block per kind, action last, one pick, arity, status subject, links, 16 KiB);
//   3. the playbook laws (row/number caps, one primary action, no reply buttons, no styling, closed state meanings,
//      sources in Details, the card never repeats the chat sentence, Harso voice).
// No dependency: node:fs, node:path, node:crypto, node:url only.
// Usage: node scripts/check-output-playbook.mjs [examples.json]   (exit 0 = clean, 1 = findings)
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const SCHEMA_PATH = resolve(ROOT, "docs/agent/schema/output-blocks.v1.json");
export const EXAMPLES_PATH = resolve(ROOT, "docs/agent/output-playbook.examples.json");

// ---------------------------------------------------------------------------------------------------------------
// 1. Minimal JSON Schema (2020-12) validator for the subset output-blocks.v1 uses.
const ANNOTATIONS = new Set(["$schema", "$id", "title", "$comment", "$defs", "description"]);
const KEYWORDS = new Set([
  "$ref", "oneOf", "type", "const", "enum", "required", "properties", "additionalProperties", "minProperties",
  "minLength", "maxLength", "pattern", "minItems", "maxItems", "items", "minimum", "maximum",
]);
const regexCache = new Map();
const codePoints = text => [...text].length; // JSON Schema lengths are Unicode code points, not UTF-16 units

function typeOf(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "number") return Number.isInteger(value) ? "integer" : "number";
  return typeof value;
}

function resolveRef(root, ref) {
  if (!ref.startsWith("#/")) throw new Error(`unsupported $ref ${ref}`);
  return ref.slice(2).split("/").reduce((node, key) => {
    if (node == null || !(key in node)) throw new Error(`unresolvable $ref ${ref}`);
    return node[key];
  }, root);
}

/** Returns a list of "<path>: <problem>" strings; empty means valid. */
export function schemaErrors(schema, value, root = schema, path = "$") {
  const errors = [];
  for (const key of Object.keys(schema)) {
    if (!KEYWORDS.has(key) && !ANNOTATIONS.has(key)) throw new Error(`validator does not implement keyword ${key}`);
  }
  if (schema.$ref) errors.push(...schemaErrors(resolveRef(root, schema.$ref), value, root, path));
  if (schema.oneOf) {
    const results = schema.oneOf.map(branch => schemaErrors(branch, value, root, path));
    const passing = results.filter(result => result.length === 0).length;
    if (passing !== 1) {
      const closest = results.reduce((best, result) => (result.length < best.length ? result : best));
      errors.push(passing === 0 ? (closest[0] ?? `${path}: matches no allowed shape`) : `${path}: matches ${passing} shapes, expected exactly one`);
    }
  }
  const actual = typeOf(value);
  if (schema.type) {
    const allowed = Array.isArray(schema.type) ? schema.type : [schema.type];
    const ok = allowed.some(type => type === actual || (type === "number" && actual === "integer"));
    if (!ok) return [...errors, `${path}: must be ${allowed.join(" or ")}`];
  }
  if ("const" in schema && JSON.stringify(schema.const) !== JSON.stringify(value)) errors.push(`${path}: must be ${JSON.stringify(schema.const)}`);
  if (schema.enum && !schema.enum.some(item => JSON.stringify(item) === JSON.stringify(value))) errors.push(`${path}: must be one of ${schema.enum.join(", ")}`);
  if (actual === "object") {
    for (const name of schema.required ?? []) if (!(name in value)) errors.push(`${path}: missing required field ${name}`);
    if (schema.minProperties != null && Object.keys(value).length < schema.minProperties) errors.push(`${path}: must not be empty`);
    for (const [name, item] of Object.entries(value)) {
      const child = schema.properties?.[name];
      if (child) errors.push(...schemaErrors(child, item, root, `${path}.${name}`));
      else if (schema.additionalProperties === false) errors.push(`${path}.${name}: unexpected field (styling and layout belong to the app)`);
    }
  }
  if (actual === "string") {
    const length = codePoints(value);
    if (schema.minLength != null && length < schema.minLength) errors.push(`${path}: must not be empty`);
    if (schema.maxLength != null && length > schema.maxLength) errors.push(`${path}: too long (${length}, max ${schema.maxLength})`);
    if (schema.pattern) {
      if (!regexCache.has(schema.pattern)) regexCache.set(schema.pattern, new RegExp(schema.pattern, "u"));
      if (!regexCache.get(schema.pattern).test(value)) errors.push(`${path}: has the wrong format`);
    }
  }
  if (actual === "array") {
    if (schema.minItems != null && value.length < schema.minItems) errors.push(`${path}: needs at least ${schema.minItems} item(s)`);
    if (schema.maxItems != null && value.length > schema.maxItems) errors.push(`${path}: at most ${schema.maxItems} items`);
    if (schema.items) value.forEach((item, index) => errors.push(...schemaErrors(schema.items, item, root, `${path}[${index}]`)));
  }
  if (actual === "integer" || actual === "number") {
    if (schema.minimum != null && value < schema.minimum) errors.push(`${path}: must be >= ${schema.minimum}`);
    if (schema.maximum != null && value > schema.maximum) errors.push(`${path}: must be <= ${schema.maximum}`);
  }
  return errors;
}

// ---------------------------------------------------------------------------------------------------------------
// 2. Semantic rules from contracts.py output_blocks_semantic (weave-cloud origin/main 7c89953, lines 2844-3050).
const KINDS = ["visual", "rows", "numbers", "text", "table", "status", "action"];
const FORBIDDEN_CHARACTER = /[\x00-\x1f\x7f-\x9f\u2028\u2029\u202a-\u202e\u2066-\u2069\ufeff\ud800-\udfff]/u;
const SECRET_VALUE = /(?:-----BEGIN [A-Z ]*PRIVATE KEY-----|\bBearer\s+\S+|\bsk-[A-Za-z0-9_-]{12,})/;
const INLINE_LIMIT_BYTES = 16_384;

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function* walkStrings(node, path = "$") {
  if (typeof node === "string") yield [path, node];
  else if (Array.isArray(node)) for (const [index, item] of node.entries()) yield* walkStrings(item, `${path}[${index}]`);
  else if (node && typeof node === "object") for (const [key, item] of Object.entries(node)) yield* walkStrings(item, `${path}.${key}`);
}

function linkError(url) {
  const authority = url.slice("https://".length).split("/", 1)[0];
  let [host, port = ""] = authority.split(":");
  host = host.toLowerCase().replace(/\.$/, "");
  const labels = host.split(".");
  if ((port && !(/^[0-9]+$/.test(port) && Number(port) >= 1 && Number(port) <= 65535))
    || labels.some(label => label && (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label) || label === "xn--"))) {
    return "links must be https:// URLs with a valid host name and a port from 1 to 65535";
  }
  const last = labels[labels.length - 1];
  if (/^(?:[0-9]+|0x[0-9a-f]*)$/.test(last) || !host.includes(".") || labels.includes("")
    || [".local", ".internal", ".localhost", ".arpa", ".home", ".lan", ".corp", ".mail"].some(suffix => host.endsWith(suffix))) {
    return "link to a public https:// site by name, not an IP address or local host";
  }
  return null;
}

export function semanticErrors(document) {
  const errors = [];
  for (const [path, text] of walkStrings(document)) {
    if (FORBIDDEN_CHARACTER.test(text)) errors.push(`${path}: one line of plain text, no line breaks or control characters`);
    if (SECRET_VALUE.test(text)) errors.push(`${path}: secret-shaped value is forbidden`);
    if (path.endsWith(".url")) {
      const problem = linkError(text);
      if (problem) errors.push(`${path}: ${problem}`);
    }
  }
  const size = Buffer.byteLength(canonical(document), "utf8");
  if (size > INLINE_LIMIT_BYTES) errors.push(`$: document is ${size} bytes; the limit is ${INLINE_LIMIT_BYTES}`);
  const blocks = document.blocks;
  const kinds = blocks.map(block => block.kind);
  for (const kind of KINDS) if (kinds.filter(item => item === kind).length > 1) errors.push(`$.blocks: at most one '${kind}' block`);
  if (kinds.includes("action") && kinds[kinds.length - 1] !== "action") errors.push("$.blocks: the action block must be last");
  blocks.forEach((block, index) => {
    const here = `$.blocks[${index}]`;
    if (block.kind === "rows") {
      if (block.items.filter(row => row.mark === "pick").length > 1) errors.push(`${here}.items: mark at most one row as 'pick'`);
      const ids = block.items.filter(row => "id" in row).map(row => row.id);
      if (new Set(ids).size !== ids.length) errors.push(`${here}.items: row ids must be unique`);
      if ((block.total_count ?? block.items.length) < block.items.length) errors.push(`${here}.total_count: must be >= number of items`);
    } else if (block.kind === "visual") {
      const visual = block.visual;
      if (visual.kind === "map") {
        visual.places.forEach((place, placeIndex) => {
          for (const [field, limit] of [["lat", 90], ["lon", 180]]) {
            const [whole, fraction = ""] = place[field].replace(/^-/, "").split(".");
            if (Number(whole) > limit || (Number(whole) === limit && /[1-9]/.test(fraction))) errors.push(`${here}.visual.places[${placeIndex}].${field}: out of range`);
          }
        });
        const ids = visual.places.map(place => place.id);
        if (new Set(ids).size !== ids.length) errors.push(`${here}.visual.places: place ids must be unique`);
        if ("selected_place_id" in visual && !ids.includes(visual.selected_place_id)) errors.push(`${here}.visual.selected_place_id: must be the id of one of the places`);
      }
      if (visual.kind === "chart") {
        const count = visual.x_labels.length;
        visual.series.forEach((series, seriesIndex) => {
          if (series.values.length !== count) errors.push(`${here}.visual.series[${seriesIndex}].values: needs exactly ${count} values`);
        });
        if ((visual.highlight_index ?? 0) >= count) errors.push(`${here}.visual.highlight_index: must be < ${count}`);
      }
    } else if (block.kind === "table") {
      block.rows.forEach((row, rowIndex) => {
        if (row.cells.length !== block.columns.length) errors.push(`${here}.rows[${rowIndex}].cells: needs exactly ${block.columns.length} cells`);
      });
    } else if (block.kind === "text") {
      block.sections.forEach((section, sectionIndex) => {
        if (!("paragraphs" in section) && !("bullets" in section)) errors.push(`${here}.sections[${sectionIndex}]: add paragraphs or bullets`);
      });
    } else if (block.kind === "status") {
      if (!["failed", "empty"].includes(block.state) && !("subject" in block)) errors.push(`${here}.subject: this state needs a subject`);
    }
  });
  const status = blocks.find(block => block.kind === "status");
  const action = blocks.find(block => block.kind === "action");
  for (const slot of ["primary", "secondary"]) {
    const verb = action?.[slot];
    if (!verb) continue;
    const subject = status?.subject ?? {};
    if (verb.kind === "work_control" && subject.work_unit_id !== verb.work_unit_id) errors.push(`$.blocks[-1].${slot}: work_control must target the status block's subject`);
    if (verb.kind === "routine_control" && subject.routine_id !== verb.routine_id) errors.push(`$.blocks[-1].${slot}: routine_control must target the status block's subject`);
  }
  return errors;
}

// ---------------------------------------------------------------------------------------------------------------
// 3. Playbook laws (docs/agent/output-playbook.md). Each message names the law it enforces.
export const VERTICALS = [
  "money", "shopping", "real_estate", "jobs", "travel", "places", "food", "weather", "sports", "news",
  "education", "health", "productivity", "documents", "data",
];
export const EXAMPLE_KINDS = ["card", "file", "text"];
/** Ratified 2026-09-25: every state the agent asserts means one of four things; the app owns the colour. */
export const MEANINGS = ["done", "in progress", "needs you", "problem"];
export const ROW_STATUS_MEANING = Object.freeze({ paid: "done", overdue: "needs you" });
export const STATE_MEANING = Object.freeze({
  working: "in progress", watching: "in progress", scheduled: "in progress", needs_you: "needs you", ready: "done",
  needs_attention: "problem", failed: "problem", stopped_by_you: null, empty: null,
});
export const CAPS = Object.freeze({ inlineRows: 3, inlineNumbers: 2, sentRows: 10, tableColumns: 4, inlineTextChars: 320 });
const STYLE_KEYS = /^(?:colou?r|tone|style|font|size|weight|layout|theme|css|html|markdown|variant|emphasis|icon|width|height|align_self)$/i;
const MARKUP = /(\*\*|__|<\/?[a-z][^>]*>|^#{1,6} |\]\(|```)/i;
const BANNED = /\b(?:seamless(?:ly)?|effortless(?:ly)?|magic(?:al)?|delve|supercharge|turbocharge|revolutioni[sz]e|game-changing|cutting-edge|unleash|empower|frictionless|something went wrong|please try again later|oops)\b/i;
const SOURCE_IN_TEXT = /(https?:\/\/|www\.|\bsource:|\baccording to\b)/i;
const ARTIFACT_VERBS = new Set(["open_artifact", "download_artifact"]);
/**
 * Catalogue components whose data goes stale (prices, quotes, availability, opening, scores, weather, flights,
 * balances, news). An example that uses one must declare `fresh: true` and stamp the subtitle; `fresh` is required on
 * every card and file, so leaving it out, or setting it false, cannot exempt one of these. This list is a floor, not the
 * classification: a generic component (Comparison, Empty state) can carry current prices too, so the test pins the
 * fresh verdict of every example by id, and LIVE_WORDS below catches an "open now" answer whatever its components.
 */
export const TIME_SENSITIVE_COMPONENTS = new Set([
  "F1 Balance / net worth", "Balance / net worth", "F2 Portfolio summary", "F3 Stock / crypto quote", "F4 Key stats grid",
  "F5 Stock comparison", "F6 Watchlist / movers", "F13 Money transfer quote", "F14 Transfer / payment tracking",
  "S1 Product options", "S3 Product detail", "S5 Buyer's guide", "S6 Price history / insight", "S7 Price watch", "S8 Deal",
  "S11 Cart / checkout summary", "S13 Delivery tracking", "R1 Listing card", "R2 Listing results", "R3 Map + listings",
  "J1 Job results", "Flight options", "Flight status / disruption", "Stay comparison", "Single hotel / stay detail",
  "Reservation", "Current + forecast", "Severe-weather alert", "Scoreboard", "Standings", "Fixture list",
  "Story cluster (brief)", "Story timeline", "Place card", "Opening hours", "Menu", "Map with pins",
]);
/** Words that assert something is true right now (open, in stock, listed): the answer is time-sensitive. */
const LIVE_WORDS = /\b(?:open now|open until|closes at|in stock|sold out|right now|listed now|available now|seats? left|currently)\b/i;
/** The acquisition stamp ("as of 26 Sep, 09:00") says when the data was read, not which dates the answer covers. */
const AS_OF_STAMP = /\bas of\b[^·]*/gi;
/**
 * The freshness verdict for every example, decided by hand, one id at a time: these answers hold prices,
 * availability, opening, quotes, scores, weather or news read today. Every other card and file is stable (a finished
 * period, a calculation, a record, a plan). The checker compares each example's `fresh` flag with this list, so
 * flipping a flag, or adding a time-sensitive example without deciding, is a finding whatever its components are.
 */
export const FRESH_EXAMPLES = new Set([
  "money-net-worth", "money-stock-quote", "money-portfolio", "money-transfer-quote", "money-key-stats",
  "money-stock-compare", "money-transfer-tracking", "shop-vacuum-options", "shop-product-detail",
  "shop-compare-phones", "shop-price-history", "shop-price-watch", "shop-delivery", "shop-cart-summary",
  "shop-buyers-guide", "shop-deal", "home-listing-results", "home-listing-card", "home-rent-listings", "jobs-results",
  "jobs-posting", "travel-flights", "travel-stay-areas", "travel-hotel-detail", "travel-flight-status", "places-cafe",
  "places-dinner-options", "places-hours", "places-nearby-map", "food-menu", "weather-now", "weather-week",
  "weather-alert", "sports-score", "sports-standings", "sports-fixtures", "news-brief", "news-timeline",
  "news-headlines", "health-sleep", "docs-compare-plans", "data-stale", "empty-search", "partial-sources",
  "stale-portfolio",
]);
/** "as of" followed by a clock time or a market close: a date alone does not say how old a price is. */
const AS_OF = /\bas of\b[^·]*(?:\b\d{1,2}:\d{2}\b|\bclose\b)/i;
/** Reserved documentation domains are never a real destination. */
const PLACEHOLDER_HOST = /^https:\/\/(?:[a-z0-9-]+\.)*example\.(?:com|net|org)(?:[:/]|$)/i;
/** A link opens a specific page (a path beyond "/" or a query), not a site's home page. */
export function specificLink(url) {
  const rest = url.replace(/^https:\/\/[^/?#]+/, "");
  return !PLACEHOLDER_HOST.test(url) && rest !== "" && rest !== "/";
}
/** The rest of a partial list is reachable: a file, or a link to a specific result page. */
function reachesRest(action) {
  return [action?.primary, action?.secondary].some(verb => verb && (ARTIFACT_VERBS.has(verb.kind) || (verb.kind === "open_url" && specificLink(verb.url))));
}
const LIVE_PAGE_CLAIM = /\b(?:in the pane|locked pane|output pane|opens? (?:here|in harso|in the app)|runs? (?:here|in the app))\b/i;
const unsigned = text => text.replace(/[−–-]/g, "-").replace(/^[+-]/, "").toLowerCase();
const money = text => (/^S\$([\d,]+(?:\.\d+)?)$/.exec(text ?? "") ?? [])[1];
const amount = text => Number(text.replace(/,/g, ""));
const norm = text => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/** Visible strings = everything the card draws; details and fallback_text are excluded. */
function visibleStrings(document) {
  const out = [...walkStrings(document.header, "$.header")];
  document.blocks.forEach((block, index) => {
    for (const [path, text] of walkStrings(block, `$.blocks[${index}]`)) {
      if (/\.(kind|state|chart|mark|status|control|artifact|url|id|work_unit_id|routine_id|poster|aspect|align|selected_place_id|lat|lon)$/.test(path)) continue;
      if (/\.values\[\d+\]$/.test(path)) continue;
      out.push([path, text]);
    }
  });
  if (document.more_label) out.push(["$.more_label", document.more_label]);
  return out;
}

/** What the app will do with the same blocks (the playbook's inline-vs-page table; the app owns the real rule). */
export function projectSurface(document) {
  const content = document.blocks.filter(block => ["visual", "rows", "numbers", "text", "table"].includes(block.kind)).map(block => block.kind);
  // Inline shows one compact visual plus EITHER <=3 rows OR 2 numbers OR ~4 text lines; anything more earns the page.
  let page = content.filter(kind => kind !== "visual").length > 1;
  for (const block of document.blocks) {
    if (block.kind === "rows" && Math.max(block.items.length, block.total_count ?? 0) > CAPS.inlineRows) page = true;
    if (block.kind === "numbers" && block.items.length > CAPS.inlineNumbers) page = true;
    if (block.kind === "table") page = true;
    if (block.kind === "text") {
      const body = block.sections.flatMap(section => [...(section.paragraphs ?? []), ...(section.bullets ?? [])]).join(" ");
      if (block.sections.length > 1 || body.length > CAPS.inlineTextChars) page = true;
    }
  }
  return page ? "page" : "inline";
}

export function lawErrors(example) {
  const errors = [];
  const push = (law, message) => errors.push(`${law}: ${message}`);
  const document = example.document;
  for (const [path, text] of walkStrings({ says: example.says ?? "", reply: example.reply ?? "", document })) {
    if (text.includes("!")) push("voice", `${path} uses an exclamation mark`);
    if (BANNED.test(text)) push("voice", `${path} uses banned wording ("${text.match(BANNED)[0]}")`);
  }
  if (example.kind === "text") {
    if (document !== null) push("law 1", "a plain-text answer sends no card (document must be null)");
    if (!example.reply) push("law 1", "a plain-text example needs the reply text");
    if (example.surface !== "text") push("surface", "a plain-text example has surface \"text\"");
    return errors;
  }
  if (!document) return [...errors, "law 1: a card or file example needs a document"];
  if (example.reply) push("law 6", "a card example puts its one sentence in \"says\", not \"reply\"");
  (function scanKeys(node, path) {
    if (Array.isArray(node)) node.forEach((item, index) => scanKeys(item, `${path}[${index}]`));
    else if (node && typeof node === "object") for (const [key, item] of Object.entries(node)) {
      if (STYLE_KEYS.test(key)) push("style", `${path}.${key}: colour, style and layout belong to the app`);
      scanKeys(item, `${path}.${key}`);
    }
  })(document, "$");
  const blocks = document.blocks;
  const kinds = blocks.map(block => block.kind);
  if (kinds.every(kind => kind === "action")) push("law 1", "show the thing: a card needs content, not only an action");
  const action = blocks.find(block => block.kind === "action");
  for (const slot of ["primary", "secondary"]) {
    if (action?.[slot]?.kind === "reply") push("law 3", `action.${slot} is a reply button; choices go through the question card`);
  }
  for (const [path, text] of visibleStrings(document)) {
    if (MARKUP.test(text)) push("plain text", `${path} contains markup`);
    if (SOURCE_IN_TEXT.test(text)) push("law 5", `${path}: sources and links live in Details`);
  }
  if (example.says) {
    const said = norm(example.says);
    for (const [path, text] of visibleStrings(document)) {
      if (norm(text) === said || (norm(text).split(" ").filter(word => /\p{L}{2,}/u.test(word)).length >= 3 && said.includes(norm(text)))) push("law 6", `${path} repeats the sentence above the card`);
    }
  }
  for (const [index, block] of blocks.entries()) {
    const here = `$.blocks[${index}]`;
    if (block.kind === "rows") {
      if (block.items.length > CAPS.sentRows) push("law 4", `${here}: send at most ${CAPS.sentRows} rows; a longer list is a file`);
      if (block.items.some(row => row.mark === "pick") && block.items.length < 2) push("law 4", `${here}: a pick needs at least two rows to choose between`);
      if ((block.total_count ?? 0) > block.items.length && !reachesRest(action)) push("truth", `${here}: rows beyond those sent must be reachable (a file, or a link to the source's own result page)`);
      for (const row of block.items) {
        if (row.status && !(row.status in ROW_STATUS_MEANING)) push("state", `${here}: row status ${row.status} has no meaning`);
      }
    }
    if (block.kind === "table" && block.columns.length > CAPS.tableColumns) push("law 4", `${here}: at most ${CAPS.tableColumns} columns; a phone cannot show more`);
    if (block.kind === "table" && block.rows.length > CAPS.sentRows) push("law 4", `${here}: at most ${CAPS.sentRows} table rows; a longer table is a sheet`);
    if (block.kind === "table" && (block.total_count ?? 0) > block.rows.length && !reachesRest(action)) push("truth", `${here}: table rows beyond those sent must be reachable (a file, or a link to the source's own result page)`);
    if (block.kind === "visual" && block.visual.kind === "chart" && !block.visual.unit) push("data", `${here}: a chart states its unit`);
    if (block.kind === "status") {
      if (!(block.state in STATE_MEANING)) push("state", `${here}: state ${block.state} is outside the closed set`);
      if (block.state === "failed" && !block.detail) push("failure", `${here}: a failed card says what happened in detail`);
    }
  }
  if (example.kind === "file") {
    if (![action?.primary, action?.secondary].some(verb => verb && ARTIFACT_VERBS.has(verb.kind))) push("file", "a file example opens or downloads the artifact");
  }
  if (typeof example.fresh !== "boolean") push("stale", "declare fresh: true or false (is the data time-sensitive?)");
  else if (example.fresh !== FRESH_EXAMPLES.has(example.id)) push("stale", `fresh is ${example.fresh}, but the playbook's verdict for ${example.id} is ${FRESH_EXAMPLES.has(example.id)} (FRESH_EXAMPLES)`);
  const staleComponents = (example.components ?? []).filter(name => TIME_SENSITIVE_COMPONENTS.has(name));
  if (example.fresh !== true && staleComponents.length) push("stale", `${staleComponents.join(", ")} is time-sensitive, so fresh must be true`);
  const liveText = [example.says ?? "", document.fallback_text, ...visibleStrings(document).map(([, text]) => text)].find(text => LIVE_WORDS.test(text));
  if (example.fresh !== true && liveText) push("stale", `"${liveText.match(LIVE_WORDS)[0]}" is true only right now, so fresh must be true`);
  if (example.fresh === true && !AS_OF.test(document.header.subtitle ?? "")) push("stale", "time-sensitive data says \"as of HH:MM\" (or a market close) in the subtitle");
  for (const verb of [action?.primary, action?.secondary]) {
    if (verb?.kind === "open_url" && !specificLink(verb.url)) push("truth", `action "${verb.label}" opens a site's home page; link to the specific page`);
  }
  for (const [path, text] of [["says", example.says ?? ""], ["$.fallback_text", document.fallback_text]]) {
    if (LIVE_PAGE_CLAIM.test(text)) push("truth", `${path}: live pages do not open in the app yet; the page is a file`);
  }
  // Truth: a request for the contents of something gets the contents, not only a count and a total.
  if (/\bwhat(?:'s| is| are)\b(?: \w+)? in\b/i.test(example.request ?? "") && !blocks.some(item => item.kind === "rows" || item.kind === "table") && example.kind !== "file") push("truth", "the request asks what is in it: list the contents as rows or a table");
  // Truth: the fallback is the whole answer for a device that cannot draw the card.
  const fallback = unsigned(document.fallback_text);
  for (const block of blocks.filter(item => item.kind === "numbers")) {
    for (const number of block.items) if (!fallback.includes(unsigned(number.value))) push("truth", `fallback_text leaves out ${number.value} (${number.label})`);
  }
  if (/^(?:draft|write)\b/i.test(example.request ?? "")) {
    for (const block of blocks.filter(item => item.kind === "text")) {
      for (const paragraph of block.sections.flatMap(section => section.paragraphs ?? [])) {
        if (!document.fallback_text.includes(paragraph)) push("truth", "a drafted text goes into fallback_text word for word");
      }
    }
  }
  // Data: a complete list of amounts adds up to the total it sits under (the total may include one companion fee).
  const totals = blocks.find(item => item.kind === "numbers")?.items ?? [];
  const list = blocks.find(item => item.kind === "rows");
  const total = totals.find(number => /^(?:total|spent)$/i.test(number.label) && money(number.value));
  if (total && list && !(list.total_count > list.items.length) && list.items.every(row => money(row.trailing))) {
    const sum = list.items.reduce((acc, row) => acc + amount(money(row.trailing)), 0);
    const target = amount(money(total.value));
    const fees = totals.filter(number => number !== total && money(number.value)).map(number => amount(money(number.value)));
    if (![0, ...fees].some(fee => Math.abs(sum + fee - target) < 0.01)) push("data", `rows add up to S$${sum.toFixed(2)}, not the ${total.label} of ${total.value}; send every row or say what is left out`);
  }
  if (["news", "health", "weather"].includes(example.vertical) && !document.details) push("law 5", `${example.vertical} cards carry their sources or disclaimers in Details`);
  const surface = projectSurface(document);
  if (example.surface !== surface) push("surface", `declared ${example.surface}, but the app will show ${surface}`);
  return errors;
}

/** Truth: a written weekday must match its date in the reference year ("Sun 27 Sep 2026", never "Sat 27 Sep"). */
export function weekdayErrors(example, year) {
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const errors = [];
  for (const [, day, date, month] of JSON.stringify(example).matchAll(/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]* (\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/g)) {
    const actual = DAYS[new Date(Date.UTC(year, MONTHS.indexOf(month), Number(date))).getUTCDay()];
    if (actual !== day) errors.push(`truth: ${day} ${date} ${month} is a ${actual} in ${year}`);
  }
  return errors;
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const day = (date, offset) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + offset));
const iso = date => date.toISOString().slice(0, 10);

/** The dates a relative request means, counted from the reference date (weeks start on Monday). */
export function requestedPeriod(request, referenceDate) {
  const today = new Date(`${referenceDate}T00:00:00Z`);
  const monday = day(today, -((today.getUTCDay() + 6) % 7));
  const text = request.toLowerCase();
  if (/\bnext week\b/.test(text)) return { name: "next week", from: day(monday, 7), to: day(monday, 13) };
  if (/\bthis week\b/.test(text)) return { name: "this week", from: monday, to: day(monday, 6) };
  if (/\btomorrow\b/.test(text)) return { name: "tomorrow", from: day(today, 1), to: day(today, 1) };
  if (/\b(?:today|tonight|this (?:morning|afternoon|evening))\b/.test(text)) return { name: "today", from: today, to: today };
  if (/\blast month\b/.test(text)) {
    const from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
    return { name: "last month", from, to: new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0)), month: MONTH_NAMES[from.getUTCMonth()] };
  }
  return null;
}

/**
 * Truth: dates in the header fall inside the period the request names ("next week" asked on Sat 26 Sep is 28 Sep–4 Oct),
 * and a finished-month question ("how did I do in <month>") is never asked about a month that has not ended.
 */
export function periodErrors(example, referenceDate) {
  const errors = [];
  const header = example.document?.header;
  const today = new Date(`${referenceDate}T00:00:00Z`);
  const year = today.getUTCFullYear();
  const period = requestedPeriod(example.request ?? "", referenceDate);
  if (period && header) {
    // Only the dates the answer covers count; the "as of" stamp is when the data was read (usually today).
    const text = `${header.title} ${header.subtitle ?? ""}`.replace(AS_OF_STAMP, "");
    const dates = [];
    for (const [, first, second, month] of text.matchAll(/\b(\d{1,2})(?:[–-](\d{1,2}))? (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/g)) {
      for (const date of [first, second].filter(Boolean)) dates.push(new Date(Date.UTC(year, MONTH_NAMES.findIndex(name => name.startsWith(month)), Number(date))));
    }
    for (const date of dates) {
      if (date < period.from || date > period.to) errors.push(`truth: ${iso(date)} is outside "${period.name}" (${iso(period.from)} to ${iso(period.to)} from ${referenceDate})`);
    }
    if (period.month) {
      for (const name of MONTH_NAMES) if (name !== period.month && new RegExp(`\\b${name}\\b`).test(text)) errors.push(`truth: "last month" is ${period.month}, not ${name}`);
    }
  }
  const finished = /\b(?:how did|did i do|how was|how were)\b.*\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/i.exec(example.request ?? "");
  if (finished) {
    const index = MONTH_NAMES.indexOf(finished[1][0].toUpperCase() + finished[1].slice(1).toLowerCase());
    if (new Date(Date.UTC(year, index + 1, 1)) > today) errors.push(`truth: ${MONTH_NAMES[index]} ${year} has not ended on ${referenceDate}`);
  }
  return errors;
}

// ---------------------------------------------------------------------------------------------------------------
export function checkPlaybook(file = EXAMPLES_PATH, schemaFile = SCHEMA_PATH) {
  const schemaText = readFileSync(schemaFile);
  const sha = createHash("sha256").update(schemaText).digest("hex");
  return checkPlaybookData(JSON.parse(readFileSync(file, "utf8")), JSON.parse(schemaText.toString("utf8")), sha, schemaFile);
}

/** The same checks on already-parsed data; `sha` is the sha256 of the schema file's bytes. */
export function checkPlaybookData(playbook, schema, sha, schemaFile = SCHEMA_PATH) {
  const findings = [];
  if (playbook.schema?.sha256 !== sha) findings.push(`schema: ${schemaFile} sha256 ${sha} differs from the recorded ${playbook.schema?.sha256}`);
  const examples = playbook.examples ?? [];
  const ids = new Set();
  for (const id of FRESH_EXAMPLES) if (!examples.some(example => example.id === id && example.kind !== "text")) findings.push(`playbook: FRESH_EXAMPLES names ${id}, which is not a card or file example`);
  for (const example of examples) {
    const where = `example ${example.id ?? "?"}`;
    const report = message => findings.push(`${where}: ${message}`);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(example.id ?? "") || ids.has(example.id)) report("id must be unique kebab-case");
    ids.add(example.id);
    if (!VERTICALS.includes(example.vertical)) report(`vertical must be one of ${VERTICALS.join(", ")}`);
    if (!EXAMPLE_KINDS.includes(example.kind)) report(`kind must be one of ${EXAMPLE_KINDS.join(", ")}`);
    for (const field of ["request", "rationale"]) {
      if (typeof example[field] !== "string" || !example[field].trim() || /\n/.test(example[field])) report(`${field} must be one non-empty line`);
    }
    if ((example.rationale ?? "").length > 200) report("rationale must be one line of at most 200 characters");
    if (!Array.isArray(example.components) || example.components.length === 0) report("components must list the catalogue components it covers");
    // present_output never ends a turn: the model calls it, then ends with one sentence (weave-api output_blocks.py).
    if (example.kind !== "text" && (typeof example.says !== "string" || !example.says.trim())) report("turn: says (the one sentence that ends the turn after present_output) is required, failed cards included");
    if (example.document) {
      const schemaFindings = schemaErrors(schema, example.document);
      schemaFindings.forEach(message => report(`schema ${message}`));
      if (schemaFindings.length === 0) semanticErrors(example.document).forEach(message => report(`contract ${message}`));
    }
    lawErrors(example).forEach(message => report(message));
  }
  const year = Number((playbook.reference_date ?? "").slice(0, 4));
  if (!year) findings.push("playbook: reference_date (YYYY-MM-DD) is required so weekdays can be checked");
  else for (const example of examples) {
    weekdayErrors(example, year).forEach(message => findings.push(`example ${example.id}: ${message}`));
    periodErrors(example, playbook.reference_date).forEach(message => findings.push(`example ${example.id}: ${message}`));
  }
  const count = kind => examples.filter(example => example.kind === kind).length;
  if (examples.length < 80) findings.push(`playbook: ${examples.length} examples, need at least 80`);
  if (count("text") < 10) findings.push(`playbook: ${count("text")} plain-text examples, need at least 10`);
  if (count("file") < 10) findings.push(`playbook: ${count("file")} file examples, need at least 10`);
  for (const vertical of VERTICALS) {
    if (!examples.some(example => example.vertical === vertical && example.kind === "card")) findings.push(`playbook: no card example for ${vertical}`);
  }
  return { findings, examples: examples.length, text: count("text"), file: count("file"), card: count("card"), schemaSha256: sha };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = checkPlaybook(process.argv[2] ? resolve(process.argv[2]) : EXAMPLES_PATH);
  for (const finding of result.findings) console.error(finding);
  console.log(`${result.examples} examples (${result.card} card, ${result.file} file, ${result.text} plain text); ${result.findings.length} finding(s); schema sha256 ${result.schemaSha256}`);
  process.exit(result.findings.length ? 1 : 0);
}
