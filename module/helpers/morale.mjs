import { KT } from "./config.mjs";
import * as Rules from "../rules/vocabulary.mjs";
import * as Measure from "./measure.mjs";

/**
 * The Morale phase (pg 36).
 *
 * Played in three steps, in order:
 *   1. Check whether the kill team is broken.
 *   2. Remove Shaken tokens.
 *   3. Take Nerve tests.
 *
 * The order matters and is easy to get wrong by hand: a model shaken last round
 * stops being shaken at step 2 and can then be shaken again at step 3. Doing it
 * the other way round would leave models permanently shaken.
 */

/** A model counts toward the broken check if it is hurt, shaken or gone. */
function isCompromised(actor) {
  const s = actor.system;
  return s.fleshWounds > 0 || s.status?.shaken || s.status?.outOfAction;
}

/** Models still able to steady the team: not shaken, not out of action. */
function steadyModels(team) {
  return team.filter(a => !a.system.status?.shaken && !a.system.status?.outOfAction);
}

/* -------------------------------------------- */

/**
 * Step 1. Is the kill team broken?
 *
 * All models compromised means broken outright. More than half means a 2D6 roll
 * against the highest Leadership among the models still standing; over that and
 * the team breaks. Once broken it stays broken for the rest of the game.
 *
 * @returns {Promise<{broken: boolean, automatic: boolean, roll: Roll|null,
 *                    target: number|null, tested: boolean}>}
 */
export async function checkBroken(team, alreadyBroken = false) {
  if (alreadyBroken) {
    return { broken: true, automatic: false, roll: null, target: null, tested: false };
  }

  const compromised = team.filter(isCompromised).length;
  if (team.length && compromised === team.length) {
    return { broken: true, automatic: true, roll: null, target: null, tested: false };
  }
  if (compromised <= team.length / 2) {
    return { broken: false, automatic: false, roll: null, target: null, tested: false };
  }

  const steady = steadyModels(team);
  const target = steady.length
    ? Math.max(...steady.map(a => a.system.profile.ld))
    : 0;

  const roll = new Roll("2d6");
  await roll.evaluate();
  return { broken: roll.total > target, automatic: false, roll, target, tested: true };
}

/* -------------------------------------------- */

/**
 * Nerve test modifiers from the rest of the kill team (pg 36).
 *
 * +1 for each other friendly model that is shaken or out of action, and -1 for
 * each other friendly model, other than shaken ones, within 2". The second is
 * measured from the canvas where possible; without tokens it is skipped rather
 * than guessed, and the card says so.
 */
function teamModifiers(actor, team) {
  const others = team.filter(a => a.id !== actor.id);
  const lost = others.filter(a => a.system.status?.shaken || a.system.status?.outOfAction).length;

  let nearby = 0;
  let measured = false;
  const token = actor.getActiveTokens?.()[0] ?? null;
  if (token && Measure.measurementEnabled()) {
    measured = true;
    const ids = new Set(others.map(a => a.id));
    nearby = Measure.tokensWithin(token, KT.nerve.supportRange, "friendly")
      .filter(t => ids.has(t.actor?.id) && !t.actor.system.status?.shaken)
      .length;
  }

  return { lost, nearby, measured, total: lost - nearby };
}

/**
 * Step 3. One Nerve test.
 *
 * Failed when the result exceeds the model's Leadership. An unmodified 1 always
 * passes, and abilities may pass it automatically, modify it or re-roll it.
 */
export async function nerveTest(actor, team) {
  const rules = [
    ...Rules.collectRules(actor),
    ...(Measure.measurementEnabled()
      ? Measure.auraRules(actor.getActiveTokens?.()[0] ?? null, Rules.collectRules)
      : [])
  ];
  const conditions = actor.system.status?.shaken ? [] : ["notShaken"];
  const context = { phase: "morale", conditions, roll: "nerve" };

  // Bold and Fanatical simply pass, with no roll at all.
  if (Rules.passesAutomatically(rules, "nerve", conditions)) {
    const source = Rules.rulesFor(rules, { ...context, type: "autoPass" })[0]?.source;
    return { actor, passed: true, automatic: true, source, roll: null };
  }

  const team_ = teamModifiers(actor, team);
  const fromRules = Rules.totalModifier(rules, context);
  const modifier = team_.total + fromRules;
  const ld = actor.system.profile.ld;

  const roll = new Roll("1d6");
  await roll.evaluate();
  let die = roll.dice[0].results[0].result;
  let rerolled = null;

  const passes = (d) => d === 1 || (d + modifier) <= ld;   // unmodified 1 always passes

  if (!passes(die)) {
    const reroll = Rules.bestReroll(rules, context);
    if (reroll) {
      const second = new Roll("1d6");
      await second.evaluate();
      rerolled = { was: die, roll: second, source: reroll.source };
      die = second.dice[0].results[0].result;
    }
  }

  const applied = Rules.rulesFor(rules, { ...context, type: "modifier" })
    .map(r => `${r.source}: ${r.value > 0 ? "+" : ""}${r.value}`);

  return {
    actor, passed: passes(die), automatic: false, roll, die, rerolled,
    modifier, team: team_, ld, applied
  };
}

/* -------------------------------------------- */

/**
 * Play the whole Morale phase for a kill team and report it.
 * @param {Actor} killTeam  A killteam actor.
 */
export async function runMoralePhase(killTeam) {
  const team = killTeam.system.selected.filter(a => !a.system.status?.outOfAction);
  if (!team.length) {
    return ui.notifications.warn(game.i18n.localize("KT.Morale.NoModels"));
  }

  const parts = [];
  const rolls = [];

  /* --- 1. Broken --- */
  const broken = await checkBroken(team, killTeam.system.broken);
  if (broken.roll) rolls.push(broken.roll);
  if (broken.automatic) {
    parts.push(`<p class="kt-summary is-bad">${game.i18n.localize("KT.Morale.BrokenAutomatic")}</p>`);
  } else if (broken.tested) {
    parts.push(`<p>${game.i18n.format("KT.Morale.BrokenTest", {
      total: broken.roll.total, target: broken.target
    })} <strong>${game.i18n.localize(broken.broken ? "KT.Morale.Broken" : "KT.Morale.Holds")}</strong></p>`);
  } else if (broken.broken) {
    parts.push(`<p>${game.i18n.localize("KT.Morale.AlreadyBroken")}</p>`);
  } else {
    parts.push(`<p>${game.i18n.localize("KT.Morale.NoBrokenTest")}</p>`);
  }
  if (broken.broken && !killTeam.system.broken) {
    await killTeam.update({ "system.broken": true });
  }

  /* --- 2. Remove Shaken --- */
  const wereShaken = team.filter(a => a.system.status?.shaken);
  for (const actor of wereShaken) {
    await actor.update({ "system.status.shaken": false });
  }
  if (wereShaken.length) {
    parts.push(`<p>${game.i18n.format("KT.Morale.Recovered", {
      names: wereShaken.map(a => a.name).join(", ")
    })}</p>`);
  }

  /* --- 3. Nerve tests --- */
  // Every model with a flesh wound, and every model if the team is broken.
  const testing = team.filter(a => a.system.fleshWounds > 0 || broken.broken);
  if (!testing.length) {
    parts.push(`<p>${game.i18n.localize("KT.Morale.NoTests")}</p>`);
  }

  const rows = [];
  for (const actor of testing) {
    const result = await nerveTest(actor, team);
    if (result.roll) rolls.push(result.roll);
    if (result.rerolled) rolls.push(result.rerolled.roll);
    if (!result.passed) await actor.update({ "system.status.shaken": true });

    const detail = result.automatic
      ? game.i18n.format("KT.Morale.AutoPass", { source: result.source })
      : `${result.rerolled ? `<span class="kt-die is-discarded">${result.rerolled.was}</span>` : ""}`
        + `<span class="kt-die ${result.passed ? "is-success" : "is-failure"}">${result.die}</span>`
        + ` ${result.modifier ? `(${result.modifier > 0 ? "+" : ""}${result.modifier})` : ""}`
        + ` vs Ld ${result.ld}`;

    rows.push(`<div class="kt-result-row">
      <span class="kt-result-label">${actor.name}</span>
      <span class="kt-result-dice">${detail}</span>
      <span class="kt-result-note">${game.i18n.localize(result.passed ? "KT.Morale.Steady" : "KT.Morale.Shaken")}</span>
    </div>`);

    if (result.applied?.length) {
      rows.push(`<ul class="kt-applied">${result.applied.map(a => `<li>${a}</li>`).join("")}</ul>`);
    }
  }
  parts.push(...rows);

  const anyUnmeasured = testing.some(a => !a.getActiveTokens?.()[0]);
  if (anyUnmeasured && Measure.measurementEnabled()) {
    parts.push(`<p class="kt-hint">${game.i18n.localize("KT.Morale.Unmeasured")}</p>`);
  }

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: killTeam }),
    flavor: game.i18n.localize("KT.Morale.Phase"),
    content: `<div class="kill-team chat-card">${parts.join("")}</div>`,
    rolls
  });
}
