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
      if ((block.total_count ?? 0) > block.items.length && ![action?.primary, action?.secondary].some(verb => verb && (ARTIFACT_VERBS.has(verb.kind) || verb.kind === "open_url"))) push("truth", `${here}: rows beyond those sent must be reachable (a file or the source's own list)`);
      for (const row of block.items) {
        if (row.status && !(row.status in ROW_STATUS_MEANING)) push("state", `${here}: row status ${row.status} has no meaning`);
      }
    }
    if (block.kind === "table" && block.columns.length > CAPS.tableColumns) push("law 4", `${here}: at most ${CAPS.tableColumns} columns; a phone cannot show more`);
    if (block.kind === "table" && block.rows.length > CAPS.sentRows) push("law 4", `${here}: at most ${CAPS.sentRows} table rows; a longer table is a sheet`);
    if (block.kind === "visual" && block.visual.kind === "chart" && !block.visual.unit) push("data", `${here}: a chart states its unit`);
    if (block.kind === "status") {
      if (!(block.state in STATE_MEANING)) push("state", `${here}: state ${block.state} is outside the closed set`);
      if (block.state === "failed" && !block.detail) push("failure", `${here}: a failed card says what happened in detail`);
    }
  }
  if (example.kind === "file") {
    if (![action?.primary, action?.secondary].some(verb => verb && ARTIFACT_VERBS.has(verb.kind))) push("file", "a file example opens or downloads the artifact");
  }
  if (example.fresh && !/\bas of\b/i.test(document.header.subtitle ?? "")) push("stale", "time-sensitive data says \"as of …\" in the subtitle");
  if (["news", "health", "weather"].includes(example.vertical) && !document.details) push("law 5", `${example.vertical} cards carry their sources or disclaimers in Details`);
  const surface = projectSurface(document);
  if (example.surface !== surface) push("surface", `declared ${example.surface}, but the app will show ${surface}`);
  return errors;
}

// ---------------------------------------------------------------------------------------------------------------
export function checkPlaybook(file = EXAMPLES_PATH, schemaFile = SCHEMA_PATH) {
  const schemaText = readFileSync(schemaFile);
  const schema = JSON.parse(schemaText.toString("utf8"));
  const playbook = JSON.parse(readFileSync(file, "utf8"));
  const findings = [];
  const sha = createHash("sha256").update(schemaText).digest("hex");
  if (playbook.schema?.sha256 !== sha) findings.push(`schema: ${schemaFile} sha256 ${sha} differs from the recorded ${playbook.schema?.sha256}`);
  const examples = playbook.examples ?? [];
  const ids = new Set();
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
    if (example.kind !== "text" && (typeof example.says !== "string" || !example.says.trim())) report("says (the one chat sentence before the card) is required");
    if (example.document) {
      const schemaFindings = schemaErrors(schema, example.document);
      schemaFindings.forEach(message => report(`schema ${message}`));
      if (schemaFindings.length === 0) semanticErrors(example.document).forEach(message => report(`contract ${message}`));
    }
    lawErrors(example).forEach(message => report(message));
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
