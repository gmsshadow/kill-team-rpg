/**
 * Kill Team 2018 — sample data.
 *
 * Paste this into a new Script macro and run it. It creates:
 *   - the six ranged weapon profiles from the Adeptus Astartes weapon table
 *   - an Intercessor operative armed with a bolt rifle and bolt pistol
 *
 * Points costs are all 0. Fill them in from the points tables in your own copy
 * of the Core Manual.
 */

const WEAPONS = [
  {
    name: "Astartes shotgun", range: '12"', weaponType: "assault", attacks: "2",
    strength: "4", ap: 0, damage: "1",
    abilities: "If the target is within half range, add 1 to this weapon's Strength."
  },
  { name: "Auto bolt rifle", range: '24"', weaponType: "assault", attacks: "2", strength: "4", ap: 0, damage: "1", abilities: "" },
  { name: "Bolt carbine", range: '24"', weaponType: "assault", attacks: "2", strength: "4", ap: 0, damage: "1", abilities: "" },
  { name: "Bolt pistol", range: '12"', weaponType: "pistol", attacks: "1", strength: "4", ap: 0, damage: "1", abilities: "" },
  { name: "Bolt rifle", range: '30"', weaponType: "rapidFire", attacks: "1", strength: "4", ap: -1, damage: "1", abilities: "" },
  { name: "Boltgun", range: '24"', weaponType: "rapidFire", attacks: "1", strength: "4", ap: 0, damage: "1", abilities: "" }
];

const CLOSE_COMBAT_WEAPON = {
  name: "Close combat weapon", range: "Melee", weaponType: "melee", attacks: "1",
  strength: "User", ap: 0, damage: "1", abilities: ""
};

function weaponItem(data) {
  return {
    name: data.name,
    type: "weapon",
    img: "icons/weapons/guns/gun-blaster-rifle.webp",
    system: {
      range: data.range,
      weaponType: data.weaponType,
      attacks: data.attacks,
      strength: data.strength,
      ap: data.ap,
      damage: data.damage,
      abilities: data.abilities,
      points: 0,
      source: "Adeptus Astartes weapon profiles"
    }
  };
}

// 1. World items, so they can be dragged onto any operative.
const created = await Item.createDocuments(
  [...WEAPONS, CLOSE_COMBAT_WEAPON].map(weaponItem)
);
console.log(`Created ${created.length} weapon items.`);

// 2. An Intercessor with its own copies of the weapons it carries.
const intercessor = await Actor.create({
  name: "Intercessor",
  type: "operative",
  img: "icons/svg/mystery-man.svg",
  system: {
    points: 0,
    profile: {
      move: '6"',
      ws: 3, bs: 3,
      strength: 4, toughness: 4,
      attacks: 2, ld: 7, save: 3
    },
    wounds: { value: 2, max: 2 },
    maxNumber: "-",
    faction: "Adeptus Astartes",
    keywords: "Imperium, Adeptus Astartes, Primaris, Infantry, Intercessor",
    specialism: "none",
    abilities: "<p>Fill in from the datasheet: And They Shall Know No Fear, Shock Assault, and so on.</p>"
  },
  items: [
    weaponItem(WEAPONS.find(w => w.name === "Bolt rifle")),
    weaponItem(WEAPONS.find(w => w.name === "Bolt pistol")),
    weaponItem(CLOSE_COMBAT_WEAPON)
  ]
});

// Add the model type so the Max restriction can be validated on a roster.
await intercessor?.update({ "system.modelType": "Intercessor" });

/* -------------------------------------------------------------------------- */
/*  The six core Tactics (pg 65)                                              */
/*                                                                            */
/*  Created as world Items so they can be dragged onto any operative or kept  */
/*  in a folder as a reference. Costs are the printed Command Point costs.     */
/* -------------------------------------------------------------------------- */

const TACTICS = [
  ["Decisive Move", 1, "Start of the Movement phase. Move one model before any others, including an Advance, Fall Back or charge attempt. If another player uses this Tactic, roll off; the winner goes first."],
  ["Decisive Shot", 2, "Start of the Shooting phase. Shoot with one eligible model before any others. If another player uses this Tactic, roll off; the winner goes first."],
  ["Decisive Strike", 2, "Start of the Fight phase. Fight with one eligible model before any others. If another player uses this Tactic, roll off; the winner goes first."],
  ["Tactical Re-roll", 1, "Re-roll a single Advance roll, charge roll, Psychic test, Deny the Witch test, hit roll, wound roll, saving throw, Injury roll or Nerve test."],
  ["Insane Bravery", 1, "Before taking any Nerve tests in the Morale phase, automatically pass a single Nerve test for one model."],
  ["Gritted Teeth", 1, "When a model with one or more flesh wounds is chosen to shoot or fight, its attacks ignore the hit penalty from its own flesh wounds until the end of the phase."]
];

const existingTactics = new Set(game.items.filter(i => i.type === "ability").map(i => i.name));
const newTactics = TACTICS
  .filter(([name]) => !existingTactics.has(name))
  .map(([name, cost, description]) => ({
    name,
    type: "ability",
    img: "icons/svg/upgrade.svg",
    system: { abilityType: "tactic", cost, description: `<p>${description}</p>` }
  }));

if (newTactics.length) await Item.createDocuments(newTactics);

intercessor?.sheet.render(true);
ui.notifications.info(`Kill Team sample data created (${newTactics.length} Tactics added).`);
