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
import { ASTARTES_ITEMS, ASTARTES_MODELS } from "../module/helpers/weapons-astartes.mjs";
import { NECRONS_ITEMS, NECRONS_MODEL_ITEMS } from "../module/helpers/factions/necrons.mjs";
import { rulesForAbilities } from "../module/rules/faction-rules.mjs";
import { SPECIALISMS } from "../module/helpers/specialisms.mjs";
import { rulesForAbility } from "../module/rules/specialist-rules.mjs";

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
  wargear: "icons/svg/chest.svg",
  specialism: "icons/svg/upgrade.svg",
  model: "icons/svg/mystery-man.svg"
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

function weaponDocument(entry, index, folderId = null) {
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
    folder: folderId,
    sort: (index + 1) * 100,
    ownership: { default: 0 },
    flags: {},
    _stats: stats()
  };
}

function specialismDocument(specialism) {
  const id = stableId(`specialism-${specialism.key}`);
  return {
    _key: `!items!${id}`,
    _id: id,
    name: specialism.name,
    type: "specialism",
    img: ICONS.specialism,
    system: {
      points: 0,
      source: `pg ${specialism.page}`,
      description: `<p>${specialism.description}</p>`,
      specialismKey: specialism.key,
      page: specialism.page,
      // Attach the machine-readable rules to each ability in the tree.
      abilities: specialism.abilities.map(a => ({
        ...a, rules: rulesForAbility(specialism.key, a.name)
      })),
      tactics: specialism.tactics
    },
    effects: [],
    folder: null,
    sort: specialism.page * 100,
    ownership: { default: 0 },
    flags: {},
    _stats: stats()
  };
}

/**
 * A compendium folder. Folders live in the same LevelDB as the documents, under
 * the `folders` collection, so a pack can be organised by faction rather than
 * presenting one long list.
 */
function folderDocument(name, sort = 0) {
  const id = stableId(`folder-${name}`);
  return {
    _key: `!folders!${id}`,
    _id: id,
    name,
    type: "Item",
    description: "",
    folder: null,
    sorting: "a",
    sort,
    color: "#c8501e",
    flags: {},
    _stats: stats()
  };
}

function modelDocument(entry, folderId, index) {
  const id = stableId(`model-${entry.faction}-${entry.key}`);
  const profile = entry.profile ?? {};
  return {
    _key: `!items!${id}`,
    _id: id,
    name: entry.name,
    type: "model",
    img: ICONS.model,
    system: {
      points: entry.points,
      page: entry.page,
      source: `${entry.faction}, pg ${entry.page}`,
      maxNumber: entry.maxNumber ?? "-",
      faction: entry.faction,
      keywords: entry.keywords ?? "",
      wargear: entry.wargear ?? "",
      abilities: entry.abilities ?? [],
      rules: entry.rules ?? [],
      specialisms: entry.specialisms ?? [],
      profile: {
        move: profile.move ?? '6"',
        ws: profile.ws ?? 4,
        bs: profile.bs ?? 4,
        strength: profile.strength ?? 3,
        toughness: profile.toughness ?? 3,
        wounds: profile.wounds ?? 1,
        attacks: profile.attacks ?? 1,
        ld: profile.ld ?? 6,
        save: profile.save ?? 5,
        invulnerable: profile.invulnerable ?? null
      },
      description: entry.incomplete
        ? `<p><em>Characteristics not yet transcribed (pg ${entry.page}).</em></p>`
        : ""
    },
    effects: [],
    folder: folderId,
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

  // Weapons and wargear are grouped into a folder per faction, so the pack
  // does not become one flat list as more factions are added.
  const allWeapons = [...ASTARTES_ITEMS, ...NECRONS_ITEMS];
  const weaponFactions = [...new Set(allWeapons.map(e => e.faction))];
  const weaponFolders = weaponFactions.map((name, i) => folderDocument(name, i * 100));
  const folderByFaction = Object.fromEntries(
    weaponFactions.map((name, i) => [name, weaponFolders[i]._id])
  );
  await buildPack("weapons", [
    ...weaponFolders.map(doc => ({ file: `folder-${doc.name.toLowerCase().replace(/\W+/g, "-")}`, doc })),
    ...allWeapons.map((entry, index) => ({
      file: entry.key,
      doc: weaponDocument(entry, index, folderByFaction[entry.faction])
    }))
  ]);

  // Imported factions are tagged by ability name at build time, so re-running
  // the importer never loses the rules work.
  const allModels = [...ASTARTES_MODELS, ...NECRONS_MODEL_ITEMS].map(m => ({
    ...m,
    rules: (m.rules?.length ? m.rules : rulesForAbilities(m.abilities, m.faction))
  }));
  const modelFactions = [...new Set(allModels.map(e => e.faction))];
  const modelFolders = modelFactions.map((name, i) => folderDocument(name, i * 100));
  const modelFolderByFaction = Object.fromEntries(
    modelFactions.map((name, i) => [name, modelFolders[i]._id])
  );
  await buildPack("models", [
    ...modelFolders.map(doc => ({ file: `folder-${doc.name.toLowerCase().replace(/\W+/g, "-")}`, doc })),
    ...allModels.map((entry, index) => ({
      file: entry.key,
      doc: modelDocument(entry, modelFolderByFaction[entry.faction], index)
    }))
  ]);

  await buildPack("specialisms", SPECIALISMS.map(specialism => ({
    file: specialism.key,
    doc: specialismDocument(specialism)
  })));

  console.log("Packs built.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
