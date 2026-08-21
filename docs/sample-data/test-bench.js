/**
 * Kill Team - test bench
 *
 * Paste into a Script macro and run. Builds three operatives from the
 * compendiums, each set up to exercise a part of the system that has not been
 * confirmed in Foundry, and reports what to look for.
 *
 * Safe to re-run: it deletes any operative it made previously, by flag.
 *
 * Creates:
 *   TEST Sniper    Intercessor, Sniper specialism, 7 XP (Level 3), a bolt rifle.
 *                  Marksman and Sharpshooter granted, so the rules engine has
 *                  something to apply.
 *   TEST Combi     Tactical Sergeant with a combi-plasma, for the profile chooser.
 *   TEST Necron    Necron Warrior, as a target with a 4+ save to shoot at.
 */

const FLAG = "kt-test-bench";
const SYSTEM = "kill-team-rpg";

/* -------------------------------------------- */

async function packIndex(name) {
  const pack = game.packs.get(`${SYSTEM}.${name}`);
  if (!pack) throw new Error(`Compendium ${SYSTEM}.${name} not found.`);
  await pack.getIndex({ fields: ["system.specialismKey", "system.faction"] });
  return pack;
}

/** Find a document in a pack by name, case-insensitively. */
async function fromPack(pack, docName) {
  const entry = pack.index.find(e => e.name.toLowerCase() === docName.toLowerCase());
  if (!entry) {
    ui.notifications.warn(`Not found in ${pack.metadata.label}: ${docName}`);
    return null;
  }
  return pack.getDocument(entry._id);
}

/* -------------------------------------------- */

async function build() {
  const [models, weapons, specialisms] = await Promise.all([
    packIndex("models"), packIndex("weapons"), packIndex("specialisms")
  ]);

  // Clear anything from a previous run so the macro can be re-run freely.
  const old = game.actors.filter(a => a.getFlag(SYSTEM, FLAG));
  if (old.length) await Actor.deleteDocuments(old.map(a => a.id));

  const report = [];

  /* --- 1. Sniper: the rules engine --- */
  const intercessor = await fromPack(models, "Intercessor");
  const sniperDef = await fromPack(specialisms, "Sniper");
  const boltRifle = await fromPack(weapons, "Bolt rifle");

  if (intercessor && sniperDef) {
    const sniper = await Actor.create({
      name: "TEST Sniper",
      type: "operative",
      flags: { [SYSTEM]: { [FLAG]: true } }
    });
    await sniper.update({
      ...intercessor.system.toOperativeUpdate(),
      // 7 XP puts the operative at Level 3, so three abilities are allowed.
      "system.experience": 7,
      "system.specialism": "sniper"
    });

    // Grant the Level 1 and Level 2 abilities directly, so an attack has
    // something to apply without clicking through the picker first.
    const wanted = ["Marksman", "Sharpshooter"];
    const grants = sniperDef.system.abilities
      .filter(a => wanted.includes(a.name))
      .map(a => ({
        name: a.name,
        type: "ability",
        img: "icons/svg/upgrade.svg",
        system: {
          abilityType: "specialism",
          specialismKey: "sniper",
          level: a.level,
          rules: a.rules ?? [],
          description: `<p>${a.description}</p>`
        }
      }));
    await sniper.createEmbeddedDocuments("Item", grants);
    if (boltRifle) await sniper.createEmbeddedDocuments("Item", [boltRifle.toObject()]);

    const tagged = grants.filter(g => g.system.rules.length).length;
    report.push(`TEST Sniper: Level ${sniper.system.level}, `
      + `${grants.length} abilities (${tagged} carrying rules), `
      + `${sniper.system.abilitiesAllowed} allowed at this level.`);
  }

  /* --- 2. Combi-weapon: the profile chooser --- */
  const sergeant = await fromPack(models, "Tactical Sergeant");
  // The catalogue splits multi-profile weapons into separate entries rather
  // than one weapon with sub-profiles ("Plasma gun - standard" and
  // "Plasma gun - supercharge"), so there is nothing to exercise the profile
  // chooser with. Both halves are added so the pair can be compared.
  const plasmaStandard = await fromPack(weapons, "Plasma gun - standard");
  const plasmaSupercharge = await fromPack(weapons, "Plasma gun - supercharge");

  if (sergeant) {
    const actor = await Actor.create({
      name: "TEST Combi",
      type: "operative",
      flags: { [SYSTEM]: { [FLAG]: true } }
    });
    await actor.update(sergeant.system.toOperativeUpdate());
    const plasma = [plasmaStandard, plasmaSupercharge].filter(Boolean);
    if (plasma.length) {
      await actor.createEmbeddedDocuments("Item", plasma.map(w => w.toObject()));
    }
    report.push(`TEST Combi: ${plasma.length} plasma gun entries. Note these import as `
      + `separate weapons, not one weapon with two profiles.`);
  }

  /* --- 3. A target to shoot at --- */
  const warrior = await fromPack(models, "Necron Warrior");
  if (warrior) {
    const target = await Actor.create({
      name: "TEST Necron",
      type: "operative",
      flags: { [SYSTEM]: { [FLAG]: true } }
    });
    await target.update(warrior.system.toOperativeUpdate());
    report.push(`TEST Necron: T${target.system.profile.toughness} `
      + `Sv${target.system.profile.save}+, W${target.system.wounds.value}.`);
  }

  /* -------------------------------------------- */

  const checks = [
    "<strong>What to check</strong>",
    "1. Open TEST Sniper. Level should read 3, with three ability slots and two filled.",
    "2. Click the empty slot: it should offer only the Level 3 abilities connected to Sharpshooter "
      + "(Mobile and Eagle-eye), not the two under Assassin.",
    "3. Target TEST Necron, then roll the bolt rifle from TEST Sniper. The chat card should list "
      + "<em>Marksman: re-roll 1s hit</em> underneath the dice.",
    "4. Toggle Readied on TEST Sniper and roll again: <em>Sharpshooter: +1 hit</em> should appear. "
      + "Un-toggle it and it should disappear.",
    "5. Roll each plasma gun on TEST Combi. No profile chooser will appear: the imported data "
      + "splits multi-profile weapons into separate entries, so that feature is currently unused. "
      + "Check the two differ correctly, S7 D1 against S8 D2.",
    "6. Check a re-rolled die is replaced once, not rolled until it succeeds."
  ];

  await ChatMessage.create({
    content: `<div class="kill-team chat-card"><h3>Kill Team test bench</h3>`
      + `<p>${report.join("<br/>")}</p><hr/><p>${checks.join("<br/>")}</p></div>`
  });
  ui.notifications.info("Test bench ready. See chat for what to check.");
}

build().catch(err => {
  console.error(err);
  ui.notifications.error(`Test bench failed: ${err.message}`);
});
