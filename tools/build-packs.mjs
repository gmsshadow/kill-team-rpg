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
import { ASTARTES_ITEMS } from "../module/helpers/weapons-astartes.mjs";

const SYSTEM_ID = "kill-team-rpg";

/**
 * Foundry compares `_stats.coreVersion` against the running core version to
 * decide whether a pack predates the current release and needs migrating. A
 * pack with no coreVersion is treated as legacy, which can leave the
 * compendium listing empty until it is migrated. Stamp it from the manifest.
 */
const manifest = JSON.parse(
  await fs.readFile(new URL("../system.json", import.meta.url), "utf8")
);
const CORE_VERSION = manifest.compatibility?.verified ?? "13";
const SYSTEM_VERSION = manifest.version;

function stats() {
  return {
    coreVersion: CORE_VERSION,
    systemId: SYSTEM_ID,
    systemVersion: SYSTEM_VERSION,
    createdTime: null,
    modifiedTime: null,
    lastModifiedBy: null
  };
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(root, "packs", "_source");
const packRoot = path.join(root, "packs");

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

const ICONS = {
  faction: "icons/svg/statue.svg",
  weapon: "icons/svg/sword.svg",
  wargear: "icons/svg/chest.svg"
};

function factionDocument(faction) {
  const id = stableId(faction.key);
  return {
    // compilePack silently skips any document without a _key, and the
    // collection segment tells it which document type is being packed.
    _key: `!items!${id}`,
    _id: id,
    name: faction.name,
    type: "faction",
    img: ICONS.faction,
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
    _stats: stats()
  };
}

function weaponDocument(entry, index) {
  const id = stableId(`${entry.faction}-${entry.key}`);
  const source = `${entry.faction}, pg ${entry.page}`;

  const system = entry.itemType === "wargear"
    ? { points: entry.points, source, description: "", quantity: 1, equipped: true }
    : {
        points: entry.points,
        source,
        description: "",
        equipped: true,
        profileMode: entry.mode ?? "single",
        profiles: (entry.profiles ?? []).map(profile => ({
          name: profile.name,
          range: profile.range,
          weaponType: profile.weaponType,
          attacks: profile.attacks,
          strength: profile.strength,
          ap: profile.ap,
          damage: profile.damage,
          abilities: profile.abilities ?? ""
        })),
        // Header rows of multi-profile weapons carry no statistics of their
        // own; keep the schema defaults so nothing misleading is displayed.
        range: entry.range ?? "",
        weaponType: entry.weaponType ?? "assault",
        attacks: entry.attacks ?? "1",
        strength: entry.strength ?? "4",
        ap: entry.ap ?? 0,
        damage: entry.damage ?? "1",
        abilities: entry.abilities ?? ""
      };

  return {
    _key: `!items!${id}`,
    _id: id,
    name: entry.name,
    type: entry.itemType,
    img: ICONS[entry.itemType],
    system,
    effects: [],
    folder: null,
    sort: (index + 1) * 100,
    ownership: { default: 0 },
    flags: {},
    _stats: stats()
  };
}

/** Write source JSON then compile it into a LevelDB pack. */
async function buildPack(name, documents) {
  const sourceDir = path.join(sourceRoot, name);
  const packDir = path.join(packRoot, name);

  await fs.rm(sourceDir, { recursive: true, force: true });
  await fs.mkdir(sourceDir, { recursive: true });
  for (const { file, doc } of documents) {
    await fs.writeFile(path.join(sourceDir, `${file}.json`), JSON.stringify(doc, null, 2) + "\n", "utf8");
  }

  await fs.rm(packDir, { recursive: true, force: true });
  await compilePack(sourceDir, packDir, { log: false });

  // LevelDB lock and log files are runtime state, not build output.
  for (const stray of ["LOCK", "LOG", "LOG.old"]) {
    await fs.rm(path.join(packDir, stray), { force: true });
  }
  console.log(`${name}: ${documents.length} documents`);
}

async function main() {
  await buildPack("factions", FACTIONS.map(faction => ({
    file: faction.key,
    doc: factionDocument(faction)
  })));

  await buildPack("weapons", ASTARTES_ITEMS.map((entry, index) => ({
    file: `${entry.key}`,
    doc: weaponDocument(entry, index)
  })));

  console.log("Packs built.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
