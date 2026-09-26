#!/usr/bin/env node
// Builds docs/agent/output-playbook.examples.json from catalogue/index.json and catalogue/<vertical>.json.
// The catalogue files are the one source of the examples; the playbook file is generated for its consumers
// (the agent playbook, scripts/check-output-playbook.mjs, src/output-playbook.test.ts). Never edit it by hand.
// Usage: node scripts/build-catalogue.mjs           write the playbook file
//        node scripts/build-catalogue.mjs --check   exit 1 when the playbook file is stale
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const CATALOGUE_DIR = resolve(ROOT, "catalogue");
export const PLAYBOOK_PATH = resolve(ROOT, "docs/agent/output-playbook.examples.json");

export const serialise = value => `${JSON.stringify(value, null, 2)}\n`;

/**
 * Concatenates the verticals in index order. `read(name)` returns a catalogue file's text, so a test can build from
 * edited copies without touching disk.
 */
export function buildPlaybook(read = name => readFileSync(resolve(CATALOGUE_DIR, name), "utf8")) {
  const index = JSON.parse(read("index.json"));
  const files = index.verticals.map(vertical => ({ vertical, ...JSON.parse(read(`${vertical}.json`)) }));
  for (const file of files) {
    for (const example of file.examples) {
      if (example.vertical !== file.vertical) throw new Error(`catalogue/${file.vertical}.json: example ${example.id} belongs to ${example.vertical}`);
    }
    for (const id of file.fresh) {
      if (!file.examples.some(example => example.id === id)) throw new Error(`catalogue/${file.vertical}.json: fresh names ${id}, which is not an example in this file`);
    }
  }
  return serialise({
    generated_from: "catalogue/ by scripts/build-catalogue.mjs; edit the catalogue files, never this file",
    ...index,
    fresh: files.flatMap(file => file.fresh),
    examples: files.flatMap(file => file.examples),
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const built = buildPlaybook();
  if (process.argv.includes("--check")) {
    const stale = readFileSync(PLAYBOOK_PATH, "utf8") !== built;
    console.log(stale ? "stale: run node scripts/build-catalogue.mjs" : "up to date");
    process.exit(stale ? 1 : 0);
  }
  writeFileSync(PLAYBOOK_PATH, built);
  console.log(`wrote ${PLAYBOOK_PATH}`);
}
