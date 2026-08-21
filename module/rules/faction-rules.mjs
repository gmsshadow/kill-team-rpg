import { reroll, ignorePenalty, characteristic, manual } from "./vocabulary.mjs";

/**
 * Machine-readable rules for faction and datasheet abilities, keyed by the
 * ability name as it appears in the imported catalogue data.
 *
 * Kept apart from the imported faction files because those are generated and
 * overwritten by tools/import_catalogue.py. Tagging lives here so re-importing
 * never destroys it.
 *
 * Matching is by name only, so an ability of the same name in another faction
 * picks up the same rules. That is usually correct - And They Shall Know No
 * Fear means the same thing everywhere - and where it is not, the entry should
 * be qualified with the faction prefix "Faction/Ability".
 */
export const FACTION_ABILITY_RULES = {
  /* --- Adeptus Astartes --- */
  "And They Shall Know No Fear": [reroll("nerve", "failed")],
  "Transhuman Physiology": [ignorePenalty("fleshWound")],
  "Terror Troops": [characteristic("leadership", -1, { scope: "enemy", range: 3 })],

  /* --- Necrons --- */
  // Reanimation Protocols inverts an Injury roll of 6 rather than modifying
  // it, so it does not fit the modifier shape and stays with the player.
  "Reanimation Protocols": [manual("On an unmodified Injury roll of 6, restore to 1 wound with no flesh wounds instead of going out of action.")],
  "Living Metal": [manual("Living Metal: see the datasheet text.")],
  "Phase Shifter": [manual("This model has a 4+ invulnerable save. Set InSv to 4 on the datacard.")]
};

/**
 * Rules for a list of ability strings in "Name: description" form, which is
 * how the importer writes them.
 */
export function rulesForAbilities(abilities = [], faction = "") {
  const out = [];
  for (const entry of abilities) {
    const name = String(entry).split(":")[0].trim();
    const rules = FACTION_ABILITY_RULES[`${faction}/${name}`]
      ?? FACTION_ABILITY_RULES[name];
    if (rules) out.push(...rules);
  }
  return out;
}
