import { SYSTEM_ID, KT } from "./config.mjs";

/**
 * Tactics and the Command Point economy (pg 64-67).
 *
 * A Battle-forged kill team can always use the six core Tactics. Beyond those,
 * each specialist unlocks its specialism's Tactics up to its own level, and a
 * Tactic can only be used while that specialist is on the battlefield and
 * neither shaken nor out of action - so what is available changes during the
 * battle as models are hurt, which is the point of listing it live rather than
 * printing a static card.
 */

/** The six Tactics available to every Battle-forged kill team (pg 65). */
export const CORE_TACTICS = [
  {
    key: "decisive-move", name: "Decisive Move", cost: 1,
    description: "Use this Tactic at the start of the Movement phase. Pick a model from your kill team and make a move with it before any other models, including an Advance move, Fall Back move or charge attempt if you wish. If another player uses this Tactic, roll off: the winner goes first."
  },
  {
    key: "decisive-shot", name: "Decisive Shot", cost: 2,
    description: "Use this Tactic at the start of the Shooting phase. Pick a model from your kill team that is eligible to shoot and shoot with it before any other models. If another player uses this Tactic, roll off: the winner goes first."
  },
  {
    key: "decisive-strike", name: "Decisive Strike", cost: 2,
    description: "Use this Tactic at the start of the Fight phase. Pick a model from your kill team that is eligible to fight and fight with it before any other models. If another player uses this Tactic, roll off: the winner goes first."
  },
  {
    key: "tactical-re-roll", name: "Tactical Re-roll", cost: 1,
    description: "Re-roll a single Advance roll, charge roll, Psychic test, Deny the Witch test, hit roll, wound roll, saving throw, Injury roll or Nerve test."
  },
  {
    key: "insane-bravery", name: "Insane Bravery", cost: 1,
    description: "Use this Tactic before taking any Nerve tests in the Morale phase. You can automatically pass a single Nerve test for a model from your kill team."
  },
  {
    key: "gritted-teeth", name: "Gritted Teeth", cost: 1,
    description: "Use this Tactic when you choose a model with one or more flesh wounds to shoot in the Shooting phase or fight in the Fight phase. Until the end of the phase, this model's attacks do not suffer any penalty to their hit rolls from this model's flesh wound(s)."
  }
];

/* -------------------------------------------- */

/** Specialism definitions, from world items first and the compendium after. */
async function specialismDefinitions(keys) {
  const found = new Map();

  for (const item of game.items) {
    if (item.type !== "specialism") continue;
    if (keys.has(item.system.specialismKey)) found.set(item.system.specialismKey, item);
  }

  const missing = [...keys].filter(k => !found.has(k));
  if (missing.length) {
    const pack = game.packs.get(`${SYSTEM_ID}.specialisms`);
    if (pack) {
      const index = await pack.getIndex({ fields: ["system.specialismKey"] });
      for (const key of missing) {
        const entry = index.find(e => e.system?.specialismKey === key);
        if (entry) found.set(key, await pack.getDocument(entry._id));
      }
    }
  }
  return found;
}

/**
 * Every Tactic the kill team can use right now.
 *
 * @param {Actor} killTeam
 * @returns {Promise<object[]>} entries with name, cost, description, source and
 *          whether they are currently usable, with a reason when they are not.
 */
export async function availableTactics(killTeam) {
  const team = killTeam.system.selected;

  const tactics = CORE_TACTICS.map(t => ({
    ...t,
    source: game.i18n.localize("KT.Tactics.Core"),
    usable: true,
    reason: null
  }));

  // Specialists present, ignoring those that cannot use a Tactic at all.
  const specialists = team.filter(a => a.system.isSpecialist);
  const keys = new Set(specialists.map(a => a.system.specialism));
  if (!keys.size) return tactics;

  const definitions = await specialismDefinitions(keys);

  for (const specialist of specialists) {
    const definition = definitions.get(specialist.system.specialism);
    if (!definition) continue;

    const status = specialist.system.status ?? {};
    // A Tactic needs its specialist able to act (pg 67).
    const blocked = status.outOfAction
      ? "KT.Tactics.OutOfAction"
      : status.shaken ? "KT.Tactics.Shaken" : null;

    for (const tactic of definition.system.tactics) {
      if (tactic.level > specialist.system.level) continue;

      const existing = tactics.find(t => t.name === tactic.name);
      if (existing) {
        // Another specialist of the same specialism may be in better shape.
        if (!existing.usable && !blocked) {
          existing.usable = true;
          existing.reason = null;
          existing.source = specialist.name;
        }
        continue;
      }

      tactics.push({
        key: `${specialist.system.specialism}-${tactic.name}`,
        name: tactic.name,
        cost: tactic.cost,
        description: tactic.description,
        source: `${specialist.name} (${game.i18n.format("KT.Tactics.LevelN", { level: tactic.level })})`,
        usable: !blocked,
        reason: blocked
      });
    }
  }

  return tactics;
}

/**
 * Spend the Command Points for a Tactic and post what it does.
 *
 * The pool check lives in spendCommandPoints, so a Tactic cannot be used the
 * kill team cannot afford.
 */
export async function useTactic(killTeam, tactic) {
  const spent = await killTeam.system.spendCommandPoints(tactic.cost, tactic.name);
  if (!spent) return false;

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: killTeam }),
    flavor: game.i18n.localize("KT.Tactics.Used"),
    content: `<div class="kill-team chat-card">
      <p class="kt-tactic-name"><strong>${tactic.name}</strong>
        <span class="kt-tactic-cost">${game.i18n.format("KT.Tactics.Cost", { cost: tactic.cost })}</span></p>
      <p>${tactic.description}</p>
    </div>`
  });
  return true;
}
