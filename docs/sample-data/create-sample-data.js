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

intercessor?.sheet.render(true);
ui.notifications.info("Kill Team sample data created.");
