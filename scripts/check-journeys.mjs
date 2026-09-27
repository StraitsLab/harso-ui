#!/usr/bin/env node
// Checks catalogue/journeys.json: every one of the founder's 60 journeys names the catalogue examples that show the
// moment its success check describes (JOURNEY-SPECS.md, 2026-09-25, research folder; its IDs and titles are copied
// below so CI never reads that folder).
//   1. each row is { id, title, examples, note } with string values, and the rows are exactly JOURNEYS below: same
//      IDs, same order, same titles, compared one by one;
//   2. every example a journey names exists in the catalogue (the verticals in catalogue/index.json);
//   3. a journey with no example is missing coverage. It must be declared in catalogue/gaps/journeys.md ("## <ID>"),
//      and a declared gap must have no example. Declared or not, missing coverage fails the check.
// No dependency: node:fs, node:path, node:url and ./build-catalogue.mjs only.
// Usage: node scripts/check-journeys.mjs [journeys.json] [gaps.md]
//   exit 0 = every journey has an example and the file is well formed; 1 = findings or missing coverage.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildPlaybook } from "./build-catalogue.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const JOURNEYS_PATH = resolve(ROOT, "catalogue/journeys.json");
export const GAPS_PATH = resolve(ROOT, "catalogue/gaps/journeys.md");

/** JOURNEY-SPECS.md index (lines 17-76), in order. */
export const JOURNEYS = [
  ["S1", "Research and compare products"], ["S2", "Buy an item end to end"], ["S3", "Build a cart for the user to finish"],
  ["S4", "Track orders and deliveries"], ["S5", "Returns and return deadlines"], ["S6", "Price-drop and restock watch"],
  ["S7", "Negotiate a price / haggle"], ["T1", "Trip research and itinerary"], ["T2", "Find and compare flights"],
  ["T3", "Book a flight"], ["T4", "Find and book a hotel"], ["T5", "Trip logistics from booking emails"],
  ["T6", "Watch fares / hotel rates, rebook on drop"], ["T7", "Airport ride timed to the flight"],
  ["R1", "Restaurant reservation"], ["R2", "Doctor / dentist appointment"], ["R3", "Hair / beauty / wellness booking"],
  ["R4", "Government / DMV appointment"], ["R5", "Event tickets"], ["R6", "Reschedule or cancel a booking"],
  ["E1", "Inbox triage and daily brief"], ["E2", "Draft replies in my voice"], ["E3", "Follow-up nudges (waiting-on)"],
  ["E4", "Clean up / unsubscribe"], ["E5", "Alert me when something important arrives"], ["E6", "Extract leads / info into a sheet"],
  ["C1", "Week ahead / meeting prep brief"], ["C2", "Spot conflicts and double-bookings"], ["C3", "Find a time with others"],
  ["C4", "Add / move events"], ["C5", "Protect focus time / buffers"], ["B1", "Subscription audit"],
  ["B2", "Cancel or downgrade a subscription"], ["B3", "Lower a bill / dispute a charge"], ["B4", "Bill due-date tracking"],
  ["B5", "Home upkeep and supply lists"], ["B6", "Utility plan comparison"], ["Q1", "Deep research on a question"],
  ["Q2", "Recurring digest on a topic"], ["Q3", "Watch listings (apartments, jobs, cars)"], ["F1", "Answer from my documents"],
  ["F2", "Fill a web form"], ["F3", "Paperwork deadlines from mail"], ["F4", "Organize files"],
  ["P1", "Spending tracker from receipts"], ["P2", "Bank/card transaction monitoring"], ["P3", "Tax prep document gathering"],
  ["M1", "One-off and recurring reminders"], ["M2", "Weekly review / planning"], ["M3", "Goals turned into plans"],
  ["M4", "Location-based reminders"], ["K1", "Email someone on my behalf"], ["K2", "Text / WhatsApp / iMessage someone"],
  ["K3", "Call a business for me"], ["K4", "Invites and RSVPs"], ["L1", "Find and compare local pros"],
  ["L2", "Request quotes via web forms"], ["L3", "Check local stock"], ["H1", "Meal plan + grocery list"],
  ["H2", "Health questions and tracking"],
];

/** The IDs with a "## <ID>" section in the gaps file. */
export const gapIds = markdown => new Set([...markdown.matchAll(/^## ([A-Z][0-9])\b/gm)].map(match => match[1]));

const isText = value => typeof value === "string" && value.trim() !== "";

/**
 * `exampleIds` are the catalogue's example ids; `gaps` the declared gap IDs. `findings` are defects in the file;
 * `missing` are the journeys with no example (declared gaps included). Clean means both are empty.
 */
export function checkJourneysData(data, exampleIds, gaps) {
  const findings = [];
  const rows = Array.isArray(data?.journeys) ? data.journeys : null;
  if (!rows) return { findings: ["journeys: must be a list"], missing: [], covered: 0, gaps: [] };
  if (rows.length !== JOURNEYS.length) findings.push(`journeys: ${rows.length} rows, JOURNEY-SPECS has ${JOURNEYS.length}`);
  const missing = [];
  let covered = 0;
  rows.forEach((row, index) => {
    const where = `journey ${index + 1}${isText(row?.id) ? ` (${row.id})` : ""}`;
    const [wantId, wantTitle] = JOURNEYS[index] ?? [];
    if (!isText(row?.id)) { findings.push(`${where}: id must be a string, got ${JSON.stringify(row?.id)}`); return; }
    if (row.id !== wantId) findings.push(`${where}: id is "${row.id}", JOURNEY-SPECS has ${wantId ? `"${wantId}"` : "no journey"} here`);
    else if (row.title !== wantTitle) findings.push(`${where}: title is ${JSON.stringify(row.title)}, JOURNEY-SPECS says "${wantTitle}"`);
    if (!isText(row.note)) findings.push(`${where}: note must say which moment the examples show`);
    const examples = row.examples;
    if (!Array.isArray(examples) || !examples.every(isText)) { findings.push(`${where}: examples must be a list of example ids`); return; }
    for (const id of examples) if (!exampleIds.has(id)) findings.push(`${where}: names example ${id}, which is not in the catalogue`);
    if (new Set(examples).size !== examples.length) findings.push(`${where}: names an example twice`);
    if (examples.length === 0) {
      missing.push(row.id);
      if (!gaps.has(row.id)) findings.push(`${where}: no example, and not declared in catalogue/gaps/journeys.md`);
    } else {
      covered += 1;
      if (gaps.has(row.id)) findings.push(`${where}: has examples, but catalogue/gaps/journeys.md still declares it a gap`);
    }
  });
  const known = new Set(JOURNEYS.map(([id]) => id));
  for (const id of gaps) if (!known.has(id)) findings.push(`gaps: catalogue/gaps/journeys.md declares ${id}, which is not a journey`);
  return { findings, missing, covered, gaps: JOURNEYS.map(([id]) => id).filter(id => gaps.has(id)) };
}

export function checkJourneys(file = JOURNEYS_PATH, gapsFile = GAPS_PATH) {
  const exampleIds = new Set(JSON.parse(buildPlaybook()).examples.map(example => example.id));
  return checkJourneysData(JSON.parse(readFileSync(file, "utf8")), exampleIds, gapIds(readFileSync(gapsFile, "utf8")));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = checkJourneys(process.argv[2] ?? JOURNEYS_PATH, process.argv[3] ?? GAPS_PATH);
  for (const finding of result.findings) console.error(finding);
  if (result.missing.length) console.error(`no example yet: ${result.missing.join(", ")} (see catalogue/gaps/journeys.md)`);
  console.log(`${result.covered} of ${JOURNEYS.length} journeys have an example; ${result.missing.length} missing; ${result.findings.length} finding(s)`);
  process.exit(result.findings.length || result.missing.length ? 1 : 0);
}
