/**
 * Necrons (pg 154-156).
 *
 * A compact faction: four datasheets, four ranged weapons and one melee
 * weapon, none of which cost points. Every model shares Reanimation Protocols
 * and Ld 10, so the faction's resilience comes from Injury rolls rather than
 * from wounds - each model has a single wound.
 */

const REANIMATION_PROTOCOLS =
  "Reanimation Protocols: When an Injury roll is made for this model, on an unmodified roll of 6 the model is not taken out of action and does not suffer a flesh wound. Instead it is restored to 1 wound remaining with no flesh wounds.";

export const NECRON_RANGED = [
  {
    key: "gauss-blaster", name: "Gauss blaster", points: 0,
    range: '24"', weaponType: "rapidFire", attacks: "1", strength: "5", ap: -2, damage: "1"
  },
  {
    key: "gauss-flayer", name: "Gauss flayer", points: 0,
    range: '24"', weaponType: "rapidFire", attacks: "1", strength: "4", ap: -1, damage: "1"
  },
  {
    key: "synaptic-disintegrator", name: "Synaptic disintegrator", points: 0,
    range: '24"', weaponType: "rapidFire", attacks: "1", strength: "4", ap: 0, damage: "1",
    abilities: "A model firing a synaptic disintegrator does not suffer the penalty to hit rolls for the target being at long range. Each time you roll a wound roll of 6+ for this weapon, the target suffers a mortal wound in addition to any other damage."
  },
  {
    key: "tesla-carbine", name: "Tesla carbine", points: 0,
    range: '24"', weaponType: "assault", attacks: "2", strength: "5", ap: 0, damage: "1",
    abilities: "Each hit roll of 6+ with this weapon causes 3 hits."
  }
];

export const NECRON_MELEE = [
  {
    key: "flayer-claws", name: "Flayer claws", points: 0,
    range: "Melee", weaponType: "melee", attacks: "1", strength: "User", ap: 0, damage: "1",
    abilities: "Re-roll failed wound rolls for this weapon."
  }
];

export const NECRON_MODELS = [
  {
    key: "necron-warrior", name: "Necron Warrior", points: 12, page: 154, maxNumber: "-",
    profile: { move: '5"', ws: 3, bs: 3, strength: 4, toughness: 4, wounds: 1, attacks: 1, ld: 10, save: 4 },
    keywords: "Necrons, Infantry, Necron Warrior",
    wargear: "Gauss flayer.",
    specialisms: ["leader", "comms", "veteran"],
    abilities: [REANIMATION_PROTOCOLS]
  },
  {
    key: "immortal", name: "Immortal", points: 16, page: 154, maxNumber: "-",
    profile: { move: '5"', ws: 3, bs: 3, strength: 4, toughness: 4, wounds: 1, attacks: 1, ld: 10, save: 3 },
    keywords: "Necrons, Infantry, Immortal",
    wargear: "Gauss blaster. May replace its gauss blaster with a tesla carbine.",
    specialisms: ["leader", "comms", "veteran", "zealot"],
    abilities: [REANIMATION_PROTOCOLS]
  },
  {
    key: "deathmark", name: "Deathmark", points: 15, page: 155, maxNumber: "-",
    profile: { move: '5"', ws: 3, bs: 3, strength: 4, toughness: 4, wounds: 1, attacks: 1, ld: 10, save: 3 },
    keywords: "Necrons, Infantry, Deathmark",
    wargear: "Synaptic disintegrator.",
    specialisms: ["leader", "comms", "scout", "sniper", "veteran"],
    abilities: [REANIMATION_PROTOCOLS]
  },
  {
    // The only Necron with a Ballistic Skill worth noting: 6+, and three
    // Attacks. Built for the Fight phase, not the Shooting phase.
    key: "flayed-one", name: "Flayed One", points: 10, page: 155, maxNumber: "-",
    profile: { move: '5"', ws: 3, bs: 6, strength: 4, toughness: 4, wounds: 1, attacks: 3, ld: 10, save: 4 },
    keywords: "Necrons, Infantry, Flayed One",
    wargear: "Flayer claws.",
    specialisms: ["leader", "combat", "veteran", "zealot"],
    abilities: [REANIMATION_PROTOCOLS]
  }
];

/** Weapons and wargear, tagged with faction and source page. */
export const NECRON_ITEMS = [
  ...NECRON_RANGED.map(w => ({ ...w, itemType: "weapon", page: 156 })),
  ...NECRON_MELEE.map(w => ({ ...w, itemType: "weapon", page: 156 }))
].map(entry => ({ ...entry, faction: "Necrons" }));

export const NECRON_MODEL_ITEMS = NECRON_MODELS
  .map(model => ({ ...model, faction: "Necrons", itemType: "model" }));
