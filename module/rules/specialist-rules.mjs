import {
  reroll, modifier, characteristic, autoPass, ignorePenalty, ignoreWound, manual
} from "./vocabulary.mjs";

/**
 * Rules for every specialist ability, keyed "specialism/Ability Name".
 *
 * Kept apart from the ability text in specialisms.mjs so the transcription and
 * the mechanics can be reviewed independently, and so adding automation never
 * risks disturbing text that has been checked against the book.
 *
 * MANUAL is used deliberately and often. Campaign effects, Command Point
 * generation, anything resolved between battles and anything needing a
 * judgement call stay with the player. Half-automating those would be worse
 * than leaving them alone, because the player would stop checking.
 */
export const SPECIALIST_RULES = {

  /* ---------------- Leader (pg 68) ---------------- */
  "leader/Resourceful": [manual("Gain 1 additional Command Point at the beginning of the battle round while on the battlefield and not shaken.")],
  "leader/Bold": [autoPass("nerve")],
  "leader/Inspiring": [autoPass("nerve", { scope: "friendly", range: 3, condition: "notShaken" })],
  "leader/Paragon": [reroll("hit", "ones", { scope: "friendly", range: 3, condition: "notShaken" })],
  "leader/Tyrant": [modifier("nerve", 1, { scope: "enemy", range: 6, condition: "notShaken" })],
  "leader/Tactician": [manual("Roll a D6 each time you use a Tactic; on a 5+ gain a Command Point.")],
  "leader/Mentor": [reroll("hit", "failed", { scope: "friendly", range: 3, phase: "shooting", condition: "notShaken" })],

  /* ---------------- Combat (pg 69) ---------------- */
  "combat/Expert Fighter": [characteristic("attacks", 1)],
  "combat/Warrior Adept": [modifier("hit", 1, { phase: "fight" })],
  "combat/Deadly Counter": [manual("On an enemy hit roll of 1 or less against this model in the Fight phase, roll a D6; on a 5+ that attacker suffers 1 mortal wound.")],
  "combat/Deathblow": [manual("Wound rolls of 6 in the Fight phase inflict 1 mortal wound in addition to other damage.")],
  "combat/Combat Master": [manual("Add 1 to Attacks for each enemy model within 1\" at the start of the Fight phase.")],
  "combat/Killer Instinct": [reroll("wound", "failed", { phase: "fight" })],
  "combat/Bloodlust": [reroll("charge", "failed")],

  /* ---------------- Comms (pg 70) ---------------- */
  "comms/Scanner": [modifier("hit", 1, { scope: "friendly", range: 6, phase: "shooting", condition: "notShaken" })],
  "comms/Expert": [manual("Roll a D6 at the start of each battle round while not shaken; on a 5+ gain 1 Command Point, lost at end of round if unused.")],
  "comms/Static Screech": [modifier("hit", -1, { scope: "enemy", range: 6, phase: "fight", condition: "notShaken" })],
  "comms/Vox Ghost": [characteristic("leadership", -1, { scope: "enemy", condition: "notShaken" })],
  "comms/Command Relay": [manual("Roll a D6 each time you use a Tactic; on a 6 the Command Points are refunded.")],
  "comms/Triangulator": [reroll("damage", "all", { scope: "friendly", phase: "shooting", condition: "notShaken" })],
  "comms/Vox Hacker": [manual("Post-battle: roll a D6; on a 5+ gain 1 Intelligence.")],

  /* ---------------- Demolitions (pg 71) ---------------- */
  "demolitions/Breacher": [modifier("wound", 1, { condition: "targetObscured" })],
  "demolitions/Pyromaniac": [reroll("wound", "ones", { condition: "autoHitWeapon" })],
  "demolitions/Grenadier": [
    characteristic("range", 3, { condition: "grenadeWeapon" }),
    reroll("hit", "ones", { condition: "grenadeWeapon" })
  ],
  "demolitions/Saboteur": [manual("Post-battle: roll a D6; on a 5+ an opponent loses 1 Materiel.")],
  "demolitions/Sapper": [manual("Add 1 to the number of pieces of terrain you can booby trap with Plant Traps.")],
  "demolitions/Siegemaster": [modifier("injury", 1, { phase: "shooting", condition: "targetObscured" })],
  "demolitions/Ammo Hound": [manual("Post-battle: roll a D6; on a 5+ gain 1 Materiel.")],

  /* ---------------- Heavy (pg 72) ---------------- */
  "heavy/Relentless": [
    ignorePenalty("heavyMoved"),
    ignorePenalty("assaultAdvanced")
  ],
  "heavy/Suppressor": [modifier("hit", -1, { scope: "enemy", phase: "shooting" })],
  "heavy/Extra Armour": [ignorePenalty("apMinusOne")],
  "heavy/Devastator": [reroll("damage", "all", { condition: "randomDamage" })],
  "heavy/Rigorous": [reroll("hit", "ones", { phase: "shooting" })],
  "heavy/Indomitable": [reroll("injury", "all", { scope: "enemy" })],
  "heavy/Heavily Muscled": [reroll("wound", "ones", { phase: "fight" })],

  /* ---------------- Medic (pg 73) ---------------- */
  "medic/Reassuring": [manual("This model is never treated as shaken when taking Nerve tests for other models in your kill team.")],
  "medic/Field Medic": [ignoreWound(6, { scope: "friendly", range: 3, condition: "notShaken" })],
  "medic/Anatomist": [reroll("wound", "ones", { phase: "fight" })],
  "medic/Trauma Specialist": [manual("Injury rolls for friendly models within 3\" roll an additional dice and use the lowest.")],
  "medic/Triage Expert": [manual("Post-battle: on a Dead Casualty roll, roll a D6; on a 4+ apply Convalescence instead.")],
  "medic/Interrogator": [manual("Post-battle after a victory: roll a D6; on a 5+ gain 1 Intelligence.")],
  "medic/Toxin Synthesiser": [manual("Before deployment, pick up to D3 models; add 1 to their melee wound rolls for the battle.")],

  /* ---------------- Scout (pg 74) ---------------- */
  "scout/Swift": [reroll("advance", "all")],
  "scout/Forward Scout": [ignorePenalty("dangerousTerrain")],
  "scout/Pathfinder": [manual("Add or subtract 1 when rolling to determine a mission; this model must then be included.")],
  "scout/Skirmisher": [manual("Enemies more than 12\" away subtract 1 from hit rolls against this model, if it is not shaken or obscured.")],
  "scout/Vanguard": [reroll("hit", "ones", { scope: "friendly", phase: "shooting", condition: "notShaken" })],
  "scout/Observer": [manual("Roll a D6 at the start of the Scouting phase; on a 4+ pick an additional strategy.")],
  "scout/Explorer": [manual("Post-battle: roll a D6; on a 5+ gain 1 Territory.")],

  /* ---------------- Sniper (pg 75) ---------------- */
  "sniper/Marksman": [reroll("hit", "ones", { phase: "shooting" })],
  "sniper/Assassin": [reroll("wound", "ones", { phase: "shooting" })],
  "sniper/Sharpshooter": [modifier("hit", 1, { phase: "shooting", condition: "readied" })],
  "sniper/Deadeye": [manual("On an unmodified wound roll of 6 in the Shooting phase, increase that attack's Damage by 1.")],
  "sniper/Armour Piercing": [manual("On an unmodified wound roll of 6 in the Shooting phase, improve that attack's AP by 1.")],
  "sniper/Mobile": [
    ignorePenalty("heavyMoved"),
    ignorePenalty("assaultAdvanced")
  ],
  "sniper/Eagle-eye": [characteristic("range", 6)],

  /* ---------------- Veteran (pg 76) ---------------- */
  "veteran/Grizzled": [ignorePenalty("leadership")],
  "veteran/Practised": [manual("Re-roll one hit roll or wound roll for this model in each battle round.")],
  "veteran/Seen It All": [modifier("nerve", -1, { scope: "friendly", range: 3, condition: "notShaken" })],
  "veteran/Survivor": [modifier("save", 1)],
  "veteran/One-man Army": [manual("Generates 1 Command Point at the beginning of each battle round, usable only for Veteran Tactics.")],
  "veteran/Battle Scarred": [characteristic("leadership", -1, { scope: "enemy", range: 6, condition: "notShaken" })],
  "veteran/Nerves of Steel": [reroll("hit", "failed", { condition: "overwatch" })],

  /* ---------------- Zealot (pg 77) ---------------- */
  "zealot/Frenzied": [
    characteristic("attacks", 1, { condition: "charged" }),
    characteristic("strength", 1, { condition: "charged" })
  ],
  "zealot/Exultant": [manual("Opponents re-roll unmodified hit rolls of 6 for models within 3\" of this model.")],
  "zealot/Flagellant": [ignoreWound(6)],
  "zealot/Puritan": [reroll("hit", "all", { phase: "fight", condition: "noFactionInCommon" })],
  "zealot/Rousing": [characteristic("leadership", 1, { scope: "friendly", range: 6, condition: "notShaken" })],
  "zealot/Fanatical": [autoPass("nerve")],
  "zealot/Strength of Spirit": [modifier("injury", -1)]
};

/** Rules for a specialism ability, or an empty array if none are recorded. */
export function rulesForAbility(specialismKey, abilityName) {
  return SPECIALIST_RULES[`${specialismKey}/${abilityName}`] ?? [];
}

/** Count of abilities that are automated versus left to the player. */
export function coverage() {
  const entries = Object.values(SPECIALIST_RULES);
  const manualOnly = entries.filter(rs => rs.every(r => r.type === "manual")).length;
  return { total: entries.length, automated: entries.length - manualOnly, manual: manualOnly };
}
