/**
 * Validate the localisation files.
 *
 * Foundry runs `expandObject` over the flat, dot-separated keys in a language
 * file, turning them into a nested structure. If one key is a string and
 * another key extends it — "KT.Allegiance" alongside "KT.Allegiance.Imperium" —
 * expansion throws, the file is discarded, and *every* string in the system
 * falls back to its raw key. The failure is total and the error is easy to miss
 * in the console, so it is worth checking on every build.
 *
 * Run from the system root:
 *   node tools/check-lang.mjs
 *
 * Exits non-zero on any problem, so it can gate a release.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Reproduce Foundry's expandObject, which is where the failure occurs. */
function expand(flat) {
  const out = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split(".");
    let target = out;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (part in target && typeof target[part] !== "object") {
        throw new Error(
          `"${key}" cannot be created: "${parts.slice(0, i + 1).join(".")}" is already ` +
          `the string "${target[part]}". One key cannot be both a value and a namespace.`
        );
      }
      target[part] ??= {};
      target = target[part];
    }
    const leaf = parts.at(-1);
    if (leaf in target && typeof target[leaf] === "object") {
      throw new Error(
        `"${key}" cannot be set: it is already a namespace containing ` +
        `${Object.keys(target[leaf]).join(", ")}.`
      );
    }
    target[leaf] = value;
  }
  return out;
}

async function checkFile(file) {
  const problems = [];
  const raw = await fs.readFile(file, "utf8");

  let flat;
  try {
    flat = JSON.parse(raw);
  } catch (err) {
    return [`invalid JSON: ${err.message}`];
  }

  for (const [key, value] of Object.entries(flat)) {
    if (typeof value !== "string") problems.push(`"${key}" is not a string`);
    if (key !== key.trim()) problems.push(`"${key}" has surrounding whitespace`);
  }

  // Duplicate keys survive JSON.parse silently, last one winning.
  const literal = [...raw.matchAll(/^\s*"([^"]+)"\s*:/gm)].map(m => m[1]);
  const seen = new Set();
  for (const key of literal) {
    if (seen.has(key)) problems.push(`"${key}" is declared more than once`);
    seen.add(key);
  }

  try {
    expand(flat);
  } catch (err) {
    problems.push(err.message);
  }

  return problems;
}

async function main() {
  const manifest = JSON.parse(await fs.readFile(path.join(root, "system.json"), "utf8"));
  const languages = manifest.languages ?? [];
  if (!languages.length) {
    console.error("system.json declares no languages.");
    process.exit(1);
  }

  let failed = false;
  for (const lang of languages) {
    const file = path.join(root, lang.path);
    try {
      await fs.access(file);
    } catch {
      console.error(`MISSING  ${lang.path} (declared in system.json)`);
      failed = true;
      continue;
    }
    const problems = await checkFile(file);
    if (problems.length) {
      failed = true;
      console.error(`FAIL     ${lang.path}`);
      for (const problem of problems) console.error(`         ${problem}`);
    } else {
      const count = Object.keys(JSON.parse(await fs.readFile(file, "utf8"))).length;
      console.log(`ok       ${lang.path} (${count} keys)`);
    }
  }

  process.exit(failed ? 1 : 0);
}

main();
