#!/usr/bin/env node
// Applies design/google-map-style*.json to the existing Google style configs on every card Map ID.
// Run by .github/workflows/map-style.yml with a short-lived Google token (no key file exists).
// Usage: GOOGLE_TOKEN=… node scripts/map-style-sync.mjs [--dry]   (--dry reads and compares, writes nothing)
import { readFileSync } from "node:fs";

const API = "https://mapmanagement.googleapis.com/v2beta/projects/";
// Project numbers and style ids are public identifiers (ACCESS.md), not secrets.
const TARGETS = [
  { env: "dev", project: "650999278076", light: "26891955f544d1413c5b6a20", dark: "26891955f544d141afa504b7" },
  { env: "prod", project: "154268840514", light: "8de6470b1cf3a8b194706cbc", dark: "8de6470b1cf3a8b1b59bf802" },
];
const dry = process.argv.includes("--dry");
const token = process.env.GOOGLE_TOKEN;
if (!token) throw new Error("GOOGLE_TOKEN is not set");

// The Map Management upload rejects zoom-keyed opacity; Google renders the z12 value, so flatten to it.
function uploadable(text) {
  return JSON.stringify(JSON.parse(text), (key, value) =>
    /Opacity$/.test(key) && value && typeof value === "object" && !Array.isArray(value)
      ? value.z12 ?? Object.values(value).at(-1) : value);
}

async function call(method, url, body) {
  const response = await fetch(url, { method, headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: body && JSON.stringify(body) });
  const text = await response.text();
  if (!response.ok) throw new Error(`${method} ${url.replace(API, "")} → ${response.status} ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : {};
}

const sheets = { light: uploadable(readFileSync("design/google-map-style.json", "utf8")),
                 dark: uploadable(readFileSync("design/google-map-style.dark.json", "utf8")) };
let changed = 0;
for (const target of TARGETS) for (const mode of ["light", "dark"]) {
  const url = `${API}${target.project}/styleConfigs/${target[mode]}`;
  const live = await call("GET", url);
  const same = JSON.stringify(JSON.parse(live.jsonStyleSheet ?? "null")) === JSON.stringify(JSON.parse(sheets[mode]));
  console.log(`${target.env} ${mode}: ${same ? "up to date" : dry ? "differs (dry run, not written)" : "updating"}`);
  if (same || dry) continue;
  await call("PATCH", `${url}?updateMask=jsonStyleSheet`, { jsonStyleSheet: sheets[mode] });
  const after = await call("GET", url);
  if (JSON.stringify(JSON.parse(after.jsonStyleSheet)) !== JSON.stringify(JSON.parse(sheets[mode])))
    throw new Error(`${target.env} ${mode}: read-back does not match the uploaded sheet`);
  changed++;
}
console.log(`${changed} style(s) updated`);
