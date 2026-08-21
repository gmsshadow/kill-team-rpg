/**
 * Adeptus Astartes weapons and wargear (pg 86-87).
 *
 * `ap` is stored as the printed negative number. `strength`, `attacks` and
 * `damage` are strings because the profiles use "User", "x2", "D3" and "D6"
 * alongside flat numbers.
 *
 * Multi-profile weapons carry a `profiles` array and no statistics of their
 * own, matching the printed layout where the header row is blank. `mode` is
 * `chooseOne` for the missile launcher and the plasma weapons, and
 * `chooseOneOrBoth` for combi-weapons, which may fire both at -1 to hit.
 */

const BOLTGUN_PROFILE = {
  name: "Boltgun", range: '24"', weaponType: "rapidFire",
  attacks: "1", strength: "4", ap: 0, damage: "1", abilities: ""
};

const GRAV_ABILITY = "If the target has a Save characteristic of 3+ or better, this weapon has a Damage of D3.";
const MELTA_ABILITY = "If the target is within half range of this weapon, roll two dice when inflicting damage with it and discard the lowest result.";
const SUPERCHARGE_ABILITY = "On an unmodified hit roll of 1, the bearer is taken out of action after all of this weapon's shots have been resolved.";

export const ASTARTES_RANGED = [
  {
    key: "astartes-shotgun", name: "Astartes shotgun", points: 0,
    range: '12"', weaponType: "assault", attacks: "2", strength: "4", ap: 0, damage: "1",
    abilities: "If the target is within half range, add 1 to this weapon's Strength."
  },
  {
    key: "auto-bolt-rifle", name: "Auto bolt rifle", points: 0,
    range: '24"', weaponType: "assault", attacks: "2", strength: "4", ap: 0, damage: "1"
  },
  {
    key: "bolt-carbine", name: "Bolt carbine", points: 0,
    range: '24"', weaponType: "assault", attacks: "2", strength: "4", ap: 0, damage: "1"
  },
  {
    key: "bolt-pistol", name: "Bolt pistol", points: 0,
    range: '12"', weaponType: "pistol", attacks: "1", strength: "4", ap: 0, damage: "1"
  },
  {
    key: "bolt-rifle", name: "Bolt rifle", points: 0,
    range: '30"', weaponType: "rapidFire", attacks: "1", strength: "4", ap: -1, damage: "1"
  },
  {
    key: "boltgun", name: "Boltgun", points: 0,
    range: '24"', weaponType: "rapidFire", attacks: "1", strength: "4", ap: 0, damage: "1"
  },
  {
    key: "combi-flamer", name: "Combi-flamer", points: 3, mode: "chooseOneOrBoth",
    profiles: [
      BOLTGUN_PROFILE,
      {
        name: "Flamer", range: '8"', weaponType: "assault",
        attacks: "D6", strength: "4", ap: 0, damage: "1",
        abilities: "This weapon automatically hits its target."
      }
    ]
  },
  {
    key: "combi-grav", name: "Combi-grav", points: 2, mode: "chooseOneOrBoth",
    profiles: [
      BOLTGUN_PROFILE,
      {
        name: "Grav-gun", range: '18"', weaponType: "rapidFire",
        attacks: "1", strength: "5", ap: -3, damage: "1", abilities: GRAV_ABILITY
      }
    ]
  },
  {
    key: "combi-melta", name: "Combi-melta", points: 3, mode: "chooseOneOrBoth",
    profiles: [
      BOLTGUN_PROFILE,
      {
        name: "Meltagun", range: '12"', weaponType: "assault",
        attacks: "1", strength: "8", ap: -4, damage: "D6", abilities: MELTA_ABILITY
      }
    ]
  },
  {
    key: "combi-plasma", name: "Combi-plasma", points: 4, mode: "chooseOneOrBoth",
    profiles: [
      BOLTGUN_PROFILE,
      {
        name: "Plasma gun", range: '24"', weaponType: "rapidFire",
        attacks: "1", strength: "7", ap: -3, damage: "1",
        abilities: "See plasma gun."
      }
    ]
  },
  {
    key: "flamer", name: "Flamer", points: 3,
    range: '8"', weaponType: "assault", attacks: "D6", strength: "4", ap: 0, damage: "1",
    abilities: "This weapon automatically hits its target."
  },
  {
    key: "frag-grenade", name: "Frag grenade", points: 0,
    range: '6"', weaponType: "grenade", attacks: "D6", strength: "3", ap: 0, damage: "1"
  },
  {
    key: "grav-gun", name: "Grav-gun", points: 2,
    range: '18"', weaponType: "rapidFire", attacks: "1", strength: "5", ap: -3, damage: "1",
    abilities: GRAV_ABILITY
  },
  {
    key: "grav-pistol", name: "Grav-pistol", points: 1,
    range: '12"', weaponType: "pistol", attacks: "1", strength: "5", ap: -3, damage: "1",
    abilities: GRAV_ABILITY
  },
  {
    key: "heavy-bolt-pistol", name: "Heavy bolt pistol", points: 0,
    range: '12"', weaponType: "pistol", attacks: "1", strength: "4", ap: -1, damage: "1"
  },
  {
    key: "heavy-bolter", name: "Heavy bolter", points: 3,
    range: '36"', weaponType: "heavy", attacks: "3", strength: "5", ap: -1, damage: "1"
  },
  {
    key: "krak-grenade", name: "Krak grenade", points: 0,
    range: '6"', weaponType: "grenade", attacks: "1", strength: "6", ap: -1, damage: "D3"
  },
  {
    key: "meltagun", name: "Meltagun", points: 3,
    range: '12"', weaponType: "assault", attacks: "1", strength: "8", ap: -4, damage: "D6",
    abilities: MELTA_ABILITY
  },
  {
    key: "missile-launcher", name: "Missile launcher", points: 5, mode: "chooseOne",
    profiles: [
      {
        name: "Frag missile", range: '48"', weaponType: "heavy",
        attacks: "D6", strength: "4", ap: 0, damage: "1", abilities: ""
      },
      {
        name: "Krak missile", range: '48"', weaponType: "heavy",
        attacks: "1", strength: "8", ap: -2, damage: "D6", abilities: ""
      }
    ]
  },
  {
    key: "plasma-gun", name: "Plasma gun", points: 3, mode: "chooseOne",
    profiles: [
      {
        name: "Standard", range: '24"', weaponType: "rapidFire",
        attacks: "1", strength: "7", ap: -3, damage: "1", abilities: ""
      },
      {
        name: "Supercharge", range: '24"', weaponType: "rapidFire",
        attacks: "1", strength: "8", ap: -3, damage: "2", abilities: SUPERCHARGE_ABILITY
      }
    ]
  },
  {
    key: "plasma-pistol", name: "Plasma pistol", points: 1, mode: "chooseOne",
    profiles: [
      {
        name: "Standard", range: '12"', weaponType: "pistol",
        attacks: "1", strength: "7", ap: -3, damage: "1", abilities: ""
      },
      {
        name: "Supercharge", range: '12"', weaponType: "pistol",
        attacks: "1", strength: "8", ap: -3, damage: "2",
        abilities: "On an unmodified hit roll of 1, the bearer is taken out of action."
      }
    ]
  },
  {
    // Printed with * for S, AP and D. Damage is stored as 0 because the weapon
    // inflicts none; the asterisks are described in the abilities text.
    key: "shock-grenade", name: "Shock grenade", points: 0,
    range: '6"', weaponType: "grenade", attacks: "D3", strength: "*", ap: 0, damage: "0",
    abilities: "This weapon does not inflict any damage. If an enemy INFANTRY model is hit by any shock grenades, it is stunned; until the end of the next battle round that model cannot fire Overwatch or be Readied, and your opponent must subtract 1 from hit rolls made for the model."
  },
  {
    key: "sniper-rifle", name: "Sniper rifle", points: 1,
    range: '36"', weaponType: "heavy", attacks: "1", strength: "4", ap: 0, damage: "1",
    abilities: "A model firing a sniper rifle does not suffer the penalty to hit rolls for the target being at long range. If you roll a wound roll of 6+ for this weapon, it inflicts a mortal wound in addition to its normal damage."
  },
  {
    key: "stalker-bolt-rifle", name: "Stalker bolt rifle", points: 0,
    range: '36"', weaponType: "heavy", attacks: "1", strength: "4", ap: -2, damage: "1"
  }
];

export const ASTARTES_MELEE = [
  {
    key: "chainsword", name: "Chainsword", points: 0,
    range: "Melee", weaponType: "melee", attacks: "1", strength: "User", ap: 0, damage: "1",
    abilities: "Each time the bearer fights, it can make 1 additional attack with this weapon."
  },
  {
    key: "combat-knife", name: "Combat knife", points: 0,
    range: "Melee", weaponType: "melee", attacks: "1", strength: "User", ap: 0, damage: "1",
    abilities: "Each time the bearer fights, it can make 1 additional attack with this weapon."
  },
  {
    key: "power-fist", name: "Power fist", points: 4,
    range: "Melee", weaponType: "melee", attacks: "1", strength: "x2", ap: -3, damage: "D3",
    abilities: "When attacking with this weapon, you must subtract 1 from the hit roll."
  },
  {
    key: "power-sword", name: "Power sword", points: 2,
    range: "Melee", weaponType: "melee", attacks: "1", strength: "User", ap: -3, damage: "1"
  }
];

export const ASTARTES_WARGEAR = [
  { key: "auspex", name: "Auspex", points: 1 },
  { key: "auxiliary-grenade-launcher", name: "Auxiliary grenade launcher", points: 0 },
  { key: "camo-cloak", name: "Camo cloak", points: 1 },
  { key: "grapnel-launcher", name: "Grapnel launcher", points: 1 },
  { key: "grav-chute", name: "Grav-chute", points: 1 }
];

/** Everything above, tagged with its faction and source page. */
export const ASTARTES_ITEMS = [
  ...ASTARTES_RANGED.map(w => ({ ...w, itemType: "weapon", page: 86 })),
  ...ASTARTES_MELEE.map(w => ({ ...w, itemType: "weapon", page: 87 })),
  ...ASTARTES_WARGEAR.map(w => ({ ...w, itemType: "wargear", page: 87 }))
].map(entry => ({ ...entry, faction: "Adeptus Astartes" }));

import { reroll, ignorePenalty, characteristic, manual } from "../rules/vocabulary.mjs";

/**
 * Adeptus Astartes model datasheets (pg 84-85).
 *
 * Points are from the table on pg 87. Abilities shared by every Astartes model
 * are held in COMMON_ASTARTES_ABILITIES rather than repeated on each entry.
 * Wargear-conditional abilities (camo cloak, auspex, grapnel launcher,
 * grav-chute) are printed on the datasheet that can take them and are recorded
 * there, since they only apply when the item is equipped.
 */

const AND_THEY_SHALL_KNOW_NO_FEAR =
  "And They Shall Know No Fear: You can re-roll failed Nerve tests for this model.";
const TRANSHUMAN_PHYSIOLOGY =
  "Transhuman Physiology: Ignore the penalty to this model's hit rolls from one flesh wound it has suffered.";

const COMMON_ASTARTES_ABILITIES = [AND_THEY_SHALL_KNOW_NO_FEAR, TRANSHUMAN_PHYSIOLOGY];

/**
 * Rules for the two abilities every Astartes model carries. Transhuman
 * Physiology cancels the hit penalty from a single flesh wound, which the
 * engine models as ignoring the flesh wound penalty entirely - correct while
 * the model has one flesh wound, generous with two or more, so it is capped in
 * the operative's hitModifier rather than here.
 */
const COMMON_ASTARTES_RULES = [
  reroll("nerve", "failed"),
  ignorePenalty("fleshWound")
];

export const ASTARTES_MODELS = [
  /* --- Scout (pg 84), Sv 4+ and a single wound --- */
  {
    key: "scout", name: "Scout", points: 10, page: 84, maxNumber: "-",
    profile: { move: '6"', ws: 3, bs: 3, strength: 4, toughness: 4, wounds: 1, attacks: 1, ld: 7, save: 4 },
    keywords: "Imperium, Adeptus Astartes, Infantry, Scout",
    wargear: "Boltgun, bolt pistol, frag grenades and krak grenades.",
    specialisms: ["comms", "demolitions", "scout", "sniper"],
    abilities: [...COMMON_ASTARTES_ABILITIES,
      "Camo Cloak: When an opponent makes a hit roll for a shooting attack that targets a model equipped with a camo cloak, and that model is obscured, that hit roll suffers an additional -1 modifier."],
    rules: [...COMMON_ASTARTES_RULES,
      manual("Camo cloak: enemies suffer an additional -1 to hit this model while it is obscured.")]
  },
  {
    key: "scout-gunner", name: "Scout Gunner", points: 11, page: 84, maxNumber: "2",
    profile: { move: '6"', ws: 3, bs: 3, strength: 4, toughness: 4, wounds: 1, attacks: 1, ld: 7, save: 4 },
    keywords: "Imperium, Adeptus Astartes, Infantry, Scout",
    wargear: "Boltgun, bolt pistol, frag grenades and krak grenades.",
    specialisms: ["heavy", "comms", "demolitions", "scout", "sniper"],
    abilities: [...COMMON_ASTARTES_ABILITIES], rules: [...COMMON_ASTARTES_RULES]
  },
  {
    key: "scout-sergeant", name: "Scout Sergeant", points: 11, page: 84, maxNumber: "1",
    profile: { move: '6"', ws: 3, bs: 3, strength: 4, toughness: 4, wounds: 1, attacks: 2, ld: 8, save: 4 },
    keywords: "Imperium, Adeptus Astartes, Infantry, Scout",
    wargear: "Boltgun, bolt pistol, frag grenades and krak grenades.",
    specialisms: ["leader", "comms", "demolitions", "scout", "sniper"],
    abilities: [...COMMON_ASTARTES_ABILITIES], rules: [...COMMON_ASTARTES_RULES]
  },

  /* --- Tactical Marine (pg 84) --- */
  {
    key: "tactical-marine", name: "Tactical Marine", points: 12, page: 84, maxNumber: "-",
    profile: { move: '6"', ws: 3, bs: 3, strength: 4, toughness: 4, wounds: 1, attacks: 1, ld: 7, save: 3 },
    keywords: "Imperium, Adeptus Astartes, Infantry, Tactical Marine",
    wargear: "Boltgun, bolt pistol, frag grenades and krak grenades.",
    specialisms: ["comms", "demolitions", "sniper", "veteran"],
    abilities: [...COMMON_ASTARTES_ABILITIES], rules: [...COMMON_ASTARTES_RULES]
  },
  {
    key: "tactical-marine-gunner", name: "Tactical Marine Gunner", points: 13, page: 84, maxNumber: "2",
    profile: { move: '6"', ws: 3, bs: 3, strength: 4, toughness: 4, wounds: 1, attacks: 1, ld: 7, save: 3 },
    keywords: "Imperium, Adeptus Astartes, Infantry, Tactical Marine",
    wargear: "Boltgun, bolt pistol, frag grenades and krak grenades.",
    specialisms: ["heavy", "comms", "demolitions", "sniper", "veteran"],
    abilities: [...COMMON_ASTARTES_ABILITIES], rules: [...COMMON_ASTARTES_RULES]
  },
  {
    key: "tactical-sergeant", name: "Tactical Sergeant", points: 13, page: 84, maxNumber: "1",
    profile: { move: '6"', ws: 3, bs: 3, strength: 4, toughness: 4, wounds: 1, attacks: 2, ld: 8, save: 3 },
    keywords: "Imperium, Adeptus Astartes, Infantry, Tactical Marine",
    wargear: "Boltgun, bolt pistol, frag grenades and krak grenades.",
    specialisms: ["leader", "comms", "demolitions", "sniper", "veteran"],
    abilities: [...COMMON_ASTARTES_ABILITIES,
      "Auspex: At the start of the Shooting phase, you can choose another ADEPTUS ASTARTES model within 3\" of a friendly model equipped with an auspex that is not shaken. That model does not suffer penalties to their hit or injury rolls due to their target being obscured."],
    rules: [...COMMON_ASTARTES_RULES,
      manual("Auspex: nominate a friendly Astartes model within 3\"; it ignores obscured penalties to hit and Injury rolls this phase.")]
  },

  /* --- Reiver (pg 85), two wounds and Terror Troops --- */
  {
    key: "reiver", name: "Reiver", points: 16, page: 85, maxNumber: "-",
    profile: { move: '6"', ws: 3, bs: 3, strength: 4, toughness: 4, wounds: 2, attacks: 2, ld: 7, save: 3 },
    keywords: "Imperium, Adeptus Astartes, Infantry, Primaris, Reiver",
    wargear: "Bolt carbine, heavy bolt pistol, frag grenades, krak grenades and shock grenades.",
    specialisms: ["combat", "comms", "demolitions", "scout", "veteran"],
    abilities: [...COMMON_ASTARTES_ABILITIES,
      "Terror Troops: Enemy models must subtract 1 from their Leadership if they are within 3\" of any Reiver or Reiver Sergeant models.",
      "Grapnel Launcher: A model with a grapnel launcher can climb any distance vertically (up or down) when it makes a normal move - do not measure the distance moved in this way.",
      "Grav-chute: A model with a grav-chute never suffers falling damage, and never falls on another model. If it would, instead place this model as close as possible to the point where it would have landed. This can bring it within 1\" of an enemy model."],
    rules: [...COMMON_ASTARTES_RULES,
      characteristic("leadership", -1, { scope: "enemy", range: 3 }),
      manual("Grapnel launcher: climb any vertical distance on a normal move without measuring it."),
      manual("Grav-chute: never suffers falling damage and never falls on another model.")]
  },
  {
    key: "reiver-sergeant", name: "Reiver Sergeant", points: 17, page: 85, maxNumber: "1",
    profile: { move: '6"', ws: 3, bs: 3, strength: 4, toughness: 4, wounds: 2, attacks: 3, ld: 8, save: 3 },
    keywords: "Imperium, Adeptus Astartes, Infantry, Primaris, Reiver",
    wargear: "Bolt carbine, heavy bolt pistol, frag grenades, krak grenades and shock grenades.",
    specialisms: ["leader", "combat", "comms", "demolitions", "scout", "veteran"],
    abilities: [...COMMON_ASTARTES_ABILITIES,
      "Terror Troops: Enemy models must subtract 1 from their Leadership if they are within 3\" of any Reiver or Reiver Sergeant models."],
    rules: [...COMMON_ASTARTES_RULES,
      characteristic("leadership", -1, { scope: "enemy", range: 3 })]
  },

  /* --- Intercessor (pg 85) --- */
  {
    key: "intercessor", name: "Intercessor", points: 15, page: 85, maxNumber: "-",
    profile: { move: '6"', ws: 3, bs: 3, strength: 4, toughness: 4, wounds: 2, attacks: 2, ld: 7, save: 3 },
    keywords: "Imperium, Adeptus Astartes, Infantry, Primaris, Intercessor",
    wargear: "Bolt rifle, bolt pistol, frag grenades and krak grenades.",
    specialisms: ["comms", "demolitions", "sniper", "veteran"],
    abilities: [...COMMON_ASTARTES_ABILITIES], rules: [...COMMON_ASTARTES_RULES]
  },
  {
    key: "intercessor-gunner", name: "Intercessor Gunner", points: 16, page: 85, maxNumber: "2",
    profile: { move: '6"', ws: 3, bs: 3, strength: 4, toughness: 4, wounds: 2, attacks: 2, ld: 7, save: 3 },
    keywords: "Imperium, Adeptus Astartes, Infantry, Primaris, Intercessor",
    wargear: "Bolt rifle, bolt pistol, frag grenades and krak grenades.",
    specialisms: ["heavy", "comms", "demolitions", "sniper", "veteran"],
    abilities: [...COMMON_ASTARTES_ABILITIES], rules: [...COMMON_ASTARTES_RULES]
  },
  {
    key: "intercessor-sergeant", name: "Intercessor Sergeant", points: 16, page: 85, maxNumber: "1",
    profile: { move: '6"', ws: 3, bs: 3, strength: 4, toughness: 4, wounds: 2, attacks: 3, ld: 8, save: 3 },
    keywords: "Imperium, Adeptus Astartes, Infantry, Primaris, Intercessor",
    wargear: "Bolt rifle, bolt pistol, frag grenades and krak grenades.",
    specialisms: ["leader", "comms", "demolitions", "sniper", "veteran"],
    abilities: [...COMMON_ASTARTES_ABILITIES], rules: [...COMMON_ASTARTES_RULES]
  }
].map(model => ({ ...model, faction: "Adeptus Astartes", itemType: "model" }));
