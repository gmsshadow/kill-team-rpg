/**
 * Static configuration for the Kill Team 2018 system.
 * Everything here is intended to be extended later (extra factions,
 * specialisms and abilities from other Warhammer sources).
 */

export const SYSTEM_ID = "kill-team-rpg";

import { FACTIONS, FACTION_CHOICES } from "./factions.mjs";

export const KT = {};

/** The sixteen core-book factions (pg 78-189). */
KT.factions = FACTIONS;
KT.factionChoices = FACTION_CHOICES;

/** Loose grouping used for sorting the faction compendium. */
KT.allegiances = {
  imperium: "KT.Allegiance.Imperium",
  chaos: "KT.Allegiance.Chaos",
  xenos: "KT.Allegiance.Xenos"
};

/** Ranged and melee weapon types (Core Rules, Shooting/Fight phases). */
KT.weaponTypes = {
  assault: "KT.WeaponType.Assault",
  heavy: "KT.WeaponType.Heavy",
  rapidFire: "KT.WeaponType.RapidFire",
  grenade: "KT.WeaponType.Grenade",
  pistol: "KT.WeaponType.Pistol",
  melee: "KT.WeaponType.Melee"
};

/** Weapon types resolved with Weapon Skill rather than Ballistic Skill. */
KT.meleeTypes = ["melee"];

/** The ten specialisms in the core book. */
KT.specialisms = {
  none: "KT.Specialism.None",
  leader: "KT.Specialism.Leader",
  combat: "KT.Specialism.Combat",
  comms: "KT.Specialism.Comms",
  demolitions: "KT.Specialism.Demolitions",
  heavy: "KT.Specialism.Heavy",
  medic: "KT.Specialism.Medic",
  scout: "KT.Specialism.Scout",
  sniper: "KT.Specialism.Sniper",
  veteran: "KT.Specialism.Veteran",
  zealot: "KT.Specialism.Zealot"
};

/**
 * Experience track from the datacard: twelve boxes, with a level-up box
 * (drawn with an orange outline) at positions 3, 7 and 12.
 */
KT.experienceBoxes = 12;
KT.levelUpBoxes = [3, 7, 12];

/** Flesh wound boxes on the datacard. */
KT.fleshWoundBoxes = 3;

/** Situational hit roll modifiers, all cumulative, all -1. */
KT.hitModifiers = {
  longRange: "KT.Modifier.LongRange",
  obscured: "KT.Modifier.Obscured",
  intervening: "KT.Modifier.Intervening",
  broken: "KT.Modifier.Broken"
};

/** Campaign resources tracked on the command roster. */
KT.resources = ["intelligence", "materiel", "morale", "territory"];

/**
 * Wound roll target numbers, indexed by the ratio of attack Strength to
 * target Toughness. Returns the D6 result required to wound.
 */
KT.woundRoll = function (strength, toughness) {
  if (strength >= toughness * 2) return 2;
  if (strength > toughness) return 3;
  if (strength === toughness) return 4;
  if (strength * 2 <= toughness) return 6;
  return 5;
};

/** Injury roll result thresholds. */
KT.injury = {
  outOfActionThreshold: 4
};

/** Default battle length for a mission. */
KT.battleRounds = 5;
