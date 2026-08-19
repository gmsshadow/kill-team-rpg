/**
 * Build the faction compendium.
 *
 * Generates one JSON source file per faction under `packs/_source/factions/`
 * and compiles them into the LevelDB pack at `packs/factions/`.
 *
 * Run from the system root:
 *   node tools/build-packs.mjs
 *
 * Requires @foundryvtt/foundryvtt-cli:
 *   npm install --no-save @foundryvtt/foundryvtt-cli
 *
 * The `_source` files are the version-controlled truth; the compiled pack is a
 * build artifact. Edit the faction table in module/helpers/factions.mjs, or the
 * source JSON directly, then re-run this script.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compilePack } from "@foundryvtt/foundryvtt-cli";
import { FACTIONS } from "../module/helpers/factions.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.join(root, "packs", "_source", "factions");
const packDir = path.join(root, "packs", "factions");

/**
 * Foundry document ids must be exactly 16 characters from a restricted
 * alphabet. Deriving them from the faction key keeps ids stable across
 * rebuilds, so re-importing a pack updates entries instead of duplicating them.
 */
function stableId(key) {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  let id = "";
  // Seed with the key so distinct factions never collide, then pad from the hash.
  const seed = key.replace(/[^a-zA-Z0-9]/g, "");
  id = seed.slice(0, 8).padEnd(8, "x");
  for (let i = 0; i < 8; i++) {
    hash = (hash * 1103515245 + 12345) >>> 0;
    id += alphabet[hash % alphabet.length];
  }
  return id.slice(0, 16);
}

const ICON = "icons/svg/statue.svg";

function toDocument(faction) {
  const id = stableId(faction.key);
  return {
    // compilePack silently skips any document without a _key, and the
    // collection segment tells it which document type is being packed.
    _key: `!items!${id}`,
    _id: id,
    name: faction.name,
    type: "faction",
    img: ICON,
    system: {
      keyword: faction.keyword,
      parentKeyword: faction.parentKeyword ?? "",
      allegiance: faction.allegiance,
      commonKeywords: faction.commonKeywords ?? "",
      page: faction.page,
      description: `<p>${faction.description}</p>`
    },
    effects: [],
    folder: null,
    sort: faction.page * 100,
    ownership: { default: 0 },
    flags: {},
    _stats: { systemId: "kill-team-rpg" }
  };
}

async function main() {
  await fs.rm(sourceDir, { recursive: true, force: true });
  await fs.mkdir(sourceDir, { recursive: true });

  for (const faction of FACTIONS) {
    const doc = toDocument(faction);
    const file = path.join(sourceDir, `${faction.key}.json`);
    await fs.writeFile(file, JSON.stringify(doc, null, 2) + "\n", "utf8");
  }
  console.log(`Wrote ${FACTIONS.length} source files to packs/_source/factions`);

  await fs.rm(packDir, { recursive: true, force: true });
  await compilePack(sourceDir, packDir, { log: true });
  console.log("Compiled packs/factions");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
