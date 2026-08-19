/**
 * The ten specialisms (pg 66-77).
 *
 * The names, keys and page references are known from the core book's contents.
 * The `abilities` and `tactics` arrays are deliberately empty: the trees
 * themselves are printed on pg 68-77, which has not been transcribed yet.
 * These definitions exist so the compendium, the sheet and the progression
 * machinery are in place; filling in the trees is pure data entry afterwards.
 *
 * Each ability takes the shape:
 *   { name: "...", level: 2, description: "..." }
 * where `level` is the specialist level at which it becomes available, or 0
 * for one available at any level.
 */
export const SPECIALISMS = [
  {
    key: "leader", name: "Leader", page: 68,
    description: "A kill team is built around its Leader, whose presence steadies the squad and directs its efforts. Every Battle-forged kill team must include one, and only one.",
    abilities: [],
    tactics: []
  },
  {
    key: "combat", name: "Combat", page: 69,
    description: "Specialists in the close-quarters kill, trained to close the distance and finish a fight with the blade.",
    abilities: [],
    tactics: []
  },
  {
    key: "comms", name: "Comms", page: 70,
    description: "Vox operators and signallers who keep a scattered team acting as one, relaying orders and coordinating fire.",
    abilities: [],
    tactics: []
  },
  {
    key: "demolitions", name: "Demolitions", page: 71,
    description: "Experts with grenades and explosive charges, deployed to breach, sabotage and clear entrenched positions.",
    abilities: [],
    tactics: []
  },
  {
    key: "heavy", name: "Heavy", page: 72,
    description: "The bearer of the squad's heaviest weapon, trained to set up, brace and lay down suppressing fire.",
    abilities: [],
    tactics: []
  },
  {
    key: "medic", name: "Medic", page: 73,
    description: "Field medics who drag the wounded back from the brink and keep a depleted team fighting.",
    abilities: [],
    tactics: []
  },
  {
    key: "scout", name: "Scout", page: 74,
    description: "Forward operatives who move ahead of the team, finding routes and reaching objectives first.",
    abilities: [],
    tactics: []
  },
  {
    key: "sniper", name: "Sniper", page: 75,
    description: "Marksmen who wait, unseen and unhurried, for the single shot that decides an engagement.",
    abilities: [],
    tactics: []
  },
  {
    key: "veteran", name: "Veteran", page: 76,
    description: "Hardened survivors of a dozen campaigns, whose experience makes them steady where others falter.",
    abilities: [],
    tactics: []
  },
  {
    key: "zealot", name: "Zealot", page: 77,
    description: "Driven by faith or fury, zealots press on through wounds that would stop a lesser warrior.",
    abilities: [],
    tactics: []
  }
];

/** Specialisms that still need their ability tree transcribed. */
export const UNPOPULATED = SPECIALISMS.filter(s => s.abilities.length === 0).map(s => s.key);
