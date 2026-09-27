#!/usr/bin/env node
// Checks catalogue/journeys.json: every one of the founder's 60 journeys names the catalogue examples that show the
// moment its success check describes (JOURNEY-SPECS.md, 2026-09-25, research folder; its IDs and titles are copied
// below so CI never reads that folder).
//   1. the journey list is exactly JOURNEYS below: same IDs, same order, same titles;
//   2. every example a journey names exists in the catalogue (the verticals in catalogue/index.json);
//   3. a journey with no example is declared in catalogue/gaps/journeys.md ("## <ID>"), and a declared gap has none.
// No dependency: node:fs, node:path, node:url and ./build-catalogue.mjs only.
// Usage: node scripts/check-journeys.mjs   (exit 0 = clean, 1 = findings)
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

/** `exampleIds` are the catalogue's example ids; `gaps` the declared gap IDs. Returns findings; empty means clean. */
export function checkJourneysData(data, exampleIds, gaps) {
  const findings = [];
  const journeys = Array.isArray(data?.journeys) ? data.journeys : [];
  const got = journeys.map(journey => journey?.id).join(",");
  const want = JOURNEYS.map(([id]) => id).join(",");
  if (got !== want) findings.push(`journeys: the IDs are ${got || "none"}, but JOURNEY-SPECS has ${want}`);
  const titles = new Map(JOURNEYS);
  for (const journey of journeys) {
    const where = `journey ${journey?.id ?? "?"}`;
    if (titles.has(journey?.id) && journey.title !== titles.get(journey.id)) findings.push(`${where}: title is "${journey.title}", JOURNEY-SPECS says "${titles.get(journey.id)}"`);
    if (typeof journey?.note !== "string" || !journey.note.trim()) findings.push(`${where}: note must say which moment the examples show`);
    const examples = Array.isArray(journey?.examples) ? journey.examples : null;
    if (!examples) { findings.push(`${where}: examples must be a list of example ids`); continue; }
    for (const id of examples) if (!exampleIds.has(id)) findings.push(`${where}: names example ${id}, which is not in the catalogue`);
    if (new Set(examples).size !== examples.length) findings.push(`${where}: names an example twice`);
    if (examples.length === 0 && !gaps.has(journey.id)) findings.push(`${where}: no example, and not declared in catalogue/gaps/journeys.md`);
    if (examples.length > 0 && gaps.has(journey.id)) findings.push(`${where}: has examples, but catalogue/gaps/journeys.md still declares it a gap`);
  }
  for (const id of gaps) if (!titles.has(id)) findings.push(`gaps: catalogue/gaps/journeys.md declares ${id}, which is not a journey`);
  const covered = journeys.filter(journey => journey?.examples?.length > 0).length;
  return { findings, covered, gaps: [...gaps].filter(id => titles.has(id)) };
}

export function checkJourneys(file = JOURNEYS_PATH, gapsFile = GAPS_PATH) {
  const exampleIds = new Set(JSON.parse(buildPlaybook()).examples.map(example => example.id));
  return checkJourneysData(JSON.parse(readFileSync(file, "utf8")), exampleIds, gapIds(readFileSync(gapsFile, "utf8")));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = checkJourneys();
  for (const finding of result.findings) console.error(finding);
  console.log(`${result.covered} of ${JOURNEYS.length} journeys have an example; declared gaps: ${result.gaps.join(", ") || "none"}; ${result.findings.length} finding(s)`);
  process.exit(result.findings.length ? 1 : 0);
}
