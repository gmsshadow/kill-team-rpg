import { KT, SYSTEM_ID } from "./config.mjs";
import { WeaponData } from "../data/items.mjs";
import * as Rules from "../rules/vocabulary.mjs";
import * as Measure from "./measure.mjs";

const FormDataExtended = foundry.applications.ux?.FormDataExtended ?? globalThis.FormDataExtended;
const DialogV2 = foundry.applications.api.DialogV2;

/* -------------------------------------------- */
/*  Small utilities                              */
/* -------------------------------------------- */

/** Evaluate a value that may be a flat number or a formula such as "D3". */
async function evaluateValue(value, rollData = {}) {
  const raw = String(value ?? "1").trim();
  const flat = Number(raw);
  if (Number.isFinite(flat)) return { total: flat, roll: null };
  const roll = new Roll(raw.replace(/D/g, "d"), rollData);
  await roll.evaluate();
  return { total: roll.total, roll };
}

function speakerFor(actor) {
  return ChatMessage.getSpeaker({ actor });
}

async function postCard({ actor, flavor, content, rolls = [] }) {
  return ChatMessage.create({
    speaker: speakerFor(actor),
    flavor,
    content: `<div class="kill-team chat-card">${content}</div>`,
    rolls,
    sound: rolls.length ? CONFIG.sounds.dice : null
  });
}

/* -------------------------------------------- */
/*  Attack sequence                              */
/* -------------------------------------------- */

/**
 * Open the attack dialog for a weapon, then resolve the attack.
 * @param {Actor} actor    The attacking operative.
 * @param {Item} weapon    The weapon item being used.
 */
/**
 * Ask which profile to attack with, where a weapon offers more than one.
 * Combi-weapons may fire both, at a cumulative -1 to hit.
 * @returns {object[]|null} the chosen profiles, or null if cancelled
 */
async function chooseProfiles(weapon) {
  const system = weapon.system;
  if (!system.hasProfiles) return system.attackProfiles;

  const options = system.attackProfiles.map(profile =>
    `<option value="${profile.index}">${profile.name} &mdash; ${profile.typeLine}, S ${profile.strength}, AP ${profile.apLabel}, D ${profile.damage}</option>`
  );
  if (system.allowsBothProfiles) {
    options.push(`<option value="both">${game.i18n.localize("KT.Dialog.BothProfiles")}</option>`);
  }

  const DialogV2 = foundry.applications.api.DialogV2;
  const FormDataExtended = foundry.applications.ux?.FormDataExtended ?? globalThis.FormDataExtended;
  const data = await DialogV2.prompt({
    window: { title: `${weapon.name}: ${game.i18n.localize("KT.Dialog.ChooseProfile")}` },
    content: `<div class="kt-dialog"><label>${game.i18n.localize("KT.Dialog.Profile")}
        <select name="profile">${options.join("")}</select></label></div>`,
    ok: {
      label: game.i18n.localize("KT.Dialog.Continue"),
      callback: (event, button) => new FormDataExtended(button.form).object
    },
    rejectClose: false
  });
  if (!data) return null;
  if (data.profile === "both") return system.attackProfiles;
  return [system.attackProfiles[Number(data.profile)]];
}

/**
 * Prompt for and resolve an attack. Multi-profile weapons ask which profile
 * first; firing both applies -1 to every hit roll made with the weapon.
 */
export async function promptAttack(actor, weapon) {
  const chosen = await chooseProfiles(weapon);
  if (!chosen?.length) return null;
  const bothPenalty = chosen.length > 1 ? -1 : 0;

  let result = null;
  for (const profile of chosen) {
    result = await promptProfileAttack(actor, weapon, profile, bothPenalty);
  }
  return result;
}

async function promptProfileAttack(actor, weapon, profile, extraModifier = 0) {
  const system = weapon.system;
  const isMelee = profile.isMelee;

  // Work out from the canvas what can be worked out, so the player only
  // confirms rather than re-deriving. Melee has no range band, so only the
  // shooting checks are used there.
  const attackerToken = actor.getActiveTokens?.()[0] ?? null;
  const targetToken = game.user.targets.first() ?? null;
  const measured = Measure.measureAttack(attackerToken, targetToken, profile.range);
  const auto = (value) => (value ? "checked" : "");
  const skill = isMelee ? actor.system.profile.ws : actor.system.profile.bs;

  // Default number of attacks: the weapon's profile, or the operative's
  // Attacks characteristic for melee.
  const defaultAttacks = isMelee
    ? actor.system.profile.attacks
    : (Number(profile.attacks) || 1);

  // Pick up a targeted token so Toughness and Save can be pre-filled.
  const target = game.user.targets.first()?.actor;
  const targetToughness = target?.system?.profile?.toughness ?? 3;
  const targetSave = target?.system?.profile?.save ?? 5;
  const targetInvuln = target?.system?.profile?.invulnerable ?? 0;

  const content = `
    <div class="kt-dialog">
      <p class="kt-dialog-weapon">${profileLabel(weapon, profile)} &mdash; ${profile.typeLine}, S ${profile.strength}, AP ${profile.apLabel}, D ${profile.damage}</p>
      <div class="kt-dialog-grid">
        <label>${game.i18n.localize("KT.Dialog.Attacks")}
          <input type="number" name="attacks" value="${defaultAttacks}" min="1" step="1"/>
        </label>
        <label>${game.i18n.localize(isMelee ? "KT.WeaponSkill" : "KT.BallisticSkill")}
          <input type="number" name="skill" value="${skill}" min="1" max="6" step="1"/>
        </label>
        <label>${game.i18n.localize("KT.Dialog.TargetToughness")}
          <input type="number" name="toughness" value="${targetToughness}" min="1" step="1"/>
        </label>
        <label>${game.i18n.localize("KT.Dialog.TargetSave")}
          <input type="number" name="save" value="${targetSave}" min="1" max="7" step="1"/>
        </label>
        <label>${game.i18n.localize("KT.Dialog.TargetInvulnerable")}
          <input type="number" name="invuln" value="${targetInvuln ?? 0}" min="0" max="7" step="1"
                 data-tooltip="${game.i18n.localize("KT.Dialog.InvulnerableHint")}"/>
        </label>
      </div>
      <fieldset class="kt-dialog-modifiers">
        <legend>${game.i18n.localize("KT.Dialog.Modifiers")}</legend>
        <label><input type="checkbox" name="longRange" ${auto(!isMelee && measured.longRange)}/> ${game.i18n.localize("KT.Modifier.LongRange")} (-1)</label>
        <label><input type="checkbox" name="obscured" ${auto(measured.obscured)}/> ${game.i18n.localize("KT.Modifier.Obscured")} (-1)</label>
        ${isMelee ? `<label><input type="checkbox" name="intervening"/> ${game.i18n.localize("KT.Modifier.Intervening")} (-1)</label>` : ""}
        ${system.weaponType === "rapidFire" ? `<label><input type="checkbox" name="halfRange" ${auto(measured.halfRange)}/> ${game.i18n.localize("KT.Dialog.HalfRange")}</label>` : ""}
        ${system.weaponType === "heavy" ? `<label><input type="checkbox" name="moved"/> ${game.i18n.localize("KT.Dialog.MovedThisPhase")} (-1)</label>` : ""}
        ${system.weaponType === "assault" ? `<label><input type="checkbox" name="advanced" ${actor.system.status.advanced ? "checked" : ""}/> ${game.i18n.localize("KT.Dialog.Advanced")} (-1)</label>` : ""}
        ${isMelee ? "" : `<label><input type="checkbox" name="overwatch"/> ${game.i18n.localize("KT.Dialog.Overwatch")}</label>`}
        <label>${game.i18n.localize("KT.Dialog.OtherModifier")}
          <input type="number" name="other" value="0" step="1"/>
        </label>
      </fieldset>
      ${measured.distance === null ? "" : `<p class="kt-measured">
        ${game.i18n.format("KT.Measured.Distance", { distance: measured.distance })}
        ${measured.outOfRange ? `<strong class="kt-warn">${game.i18n.format("KT.Measured.OutOfRange",
          { distance: measured.distance, range: profile.range })}</strong>` : ""}
        ${measured.visible === false ? `<strong class="kt-warn">${game.i18n.localize("KT.Measured.NoLineOfSight")}</strong>` : ""}
      </p>`}
      <p class="kt-dialog-note">${game.i18n.format("KT.Dialog.AutoModifiers", {
        value: actor.system.hitModifier
      })}</p>
    </div>`;

  const data = await DialogV2.prompt({
    window: { title: `${game.i18n.localize("KT.Dialog.AttackWith")} ${weapon.name}` },
    classes: ["kill-team"],
    content,
    ok: {
      label: game.i18n.localize("KT.Dialog.Roll"),
      icon: "fa-solid fa-dice-d6",
      callback: (event, button) => new FormDataExtended(button.form).object
    },
    rejectClose: false
  });

  if (!data) return null;
  data.other = (Number(data.other) || 0) + extraModifier;
  data.profile = profile;
  return resolveAttack(actor, weapon, data);
}

/** "Combi-plasma (Plasma gun)" for multi-profile weapons, else the name. */
function profileLabel(weapon, profile) {
  return weapon.system.hasProfiles ? `${weapon.name} (${profile.name})` : weapon.name;
}

/**
 * Resolve a full attack: hit rolls, wound rolls and saving throws.
 */

/* -------------------------------------------- */
/*  Re-roll support                             */
/* -------------------------------------------- */

/** Human label for a re-roll rule, e.g. "re-roll 1s". */
function rerollLabel(rule) {
  return game.i18n.localize(`KT.Reroll.${rule.when[0].toUpperCase()}${rule.when.slice(1)}`);
}

/**
 * Re-roll the dice a rule allows and keep the new results.
 *
 * A die may only be re-rolled once (pg 20), so this replaces the eligible dice
 * in a single pass rather than looping until they succeed.
 *
 * @param {{die: number, success: boolean}[]} detail
 * @param {object} rule     A reroll rule: when is "ones", "failed" or "all".
 * @param {Function} test   Re-evaluates success for a new die result.
 */
async function applyReroll(detail, rule, test, collected = []) {
  const eligible = detail
    .map((d, index) => ({ ...d, index }))
    .filter(d => {
      if (rule.when === "all") return true;
      if (rule.when === "failed") return !d.success;
      return d.die === 1;                     // "ones"
    });
  if (!eligible.length) return detail;

  const roll = new Roll(`${eligible.length}d6`);
  await roll.evaluate();
  // Attach it to the message so the dice are animated and the message's roll
  // data matches what the card shows.
  collected.push(roll);
  const fresh = roll.dice[0].results.map(r => r.result);

  const out = [...detail];
  eligible.forEach((entry, i) => {
    const die = fresh[i];
    // `was` keeps the discarded result so the card can show what changed.
    out[entry.index] = { die, success: test(die), rerolled: true, was: entry.die };
  });
  return out;
}

export async function resolveAttack(actor, weapon, config) {
  const system = weapon.system;
  // Single-profile weapons resolve against their own statistics.
  const profile = config.profile ?? system.attackProfiles[0];
  const isMelee = profile.isMelee;
  const overwatch = !!config.overwatch;

  let attacks = Math.max(1, Number(config.attacks) || 1);
  if (config.halfRange) attacks *= 2; // Rapid Fire within half range

  /* --- Rules in play --- */
  // Everything the operative's items contribute, filtered per roll below.
  // The attacker's own rules, plus any reaching it from other models on the
  // battlefield. Aura rules live on the model projecting them, so without this
  // an ability like Paragon sits on the Leader's sheet and never reaches anyone.
  const attackerToken = actor.getActiveTokens?.()[0] ?? null;
  const rules = [
    ...Rules.collectRules(actor),
    ...(Measure.measurementEnabled() ? Measure.auraRules(attackerToken, Rules.collectRules) : [])
  ];
  const phase = isMelee ? "fight" : "shooting";
  const rerollRolls = [];   // extra Roll objects, attached to the message below

  // Conditions the engine can verify. A rule naming anything else is only
  // applied when the caller has confirmed it in the dialog.
  const conditions = [];
  if (!actor.system.status?.shaken) conditions.push("notShaken");
  if (actor.system.status?.readied) conditions.push("readied");
  if (actor.system.status?.charged) conditions.push("charged");
  if (config.obscured) conditions.push("targetObscured");
  if (overwatch) conditions.push("overwatch");
  if (/D3|D6/i.test(String(profile.damage))) conditions.push("randomDamage");
  if (profile.weaponType === "grenade") conditions.push("grenadeWeapon");
  if (/automatically hits/i.test(profile.abilities ?? "")) conditions.push("autoHitWeapon");

  const ruleContext = { phase, conditions };
  const applied = [];   // what fired, for the chat card

  // Cumulative hit modifiers.
  let modifier = actor.system.hitModifier + (Number(config.other) || 0);
  if (config.longRange && !Rules.cancels(rules, "longRange", conditions)) modifier -= 1;
  if (config.obscured) modifier -= 1;
  if (config.intervening) modifier -= 1;
  if (config.moved && !Rules.cancels(rules, "heavyMoved", conditions)) modifier -= 1;
  if (config.advanced && !Rules.cancels(rules, "assaultAdvanced", conditions)) modifier -= 1;

  // Modifiers contributed by abilities.
  const hitBonus = Rules.totalModifier(rules, { ...ruleContext, roll: "hit" });
  modifier += hitBonus;
  for (const r of Rules.rulesFor(rules, { ...ruleContext, type: "modifier", roll: "hit" })) {
    applied.push(`${r.source}: ${r.value > 0 ? "+" : ""}${r.value} ${game.i18n.localize("KT.Roll.Hit")}`);
  }
  for (const penalty of ["heavyMoved", "assaultAdvanced", "longRange"]) {
    if (Rules.cancels(rules, penalty, conditions)) {
      const r = rules.find(x => x.penalty === penalty);
      applied.push(`${r.source}: ${game.i18n.localize("KT.Rules.Cancels")} ${game.i18n.localize(`KT.Penalty.${penalty[0].toUpperCase()}${penalty.slice(1)}`)}`);
    }
  }

  const skill = Math.max(1, Number(config.skill) || 4);
  const toughness = Math.max(1, Number(config.toughness) || 3);
  const saveTarget = Math.max(1, Number(config.save) || 7);

  /* --- Hit rolls --- */
  const hitRoll = new Roll(`${attacks}d6`);
  await hitRoll.evaluate();
  const hitDice = hitRoll.dice[0].results.map(r => r.result);

  const succeedsOnHit = die => {
    if (overwatch) return die === 6;                 // Overwatch always needs a 6
    if (die === 1) return false;                     // Unmodified 1 always fails
    if (die === 6) return true;                      // Unmodified 6 always hits
    return (die + modifier) >= skill;
  };

  let hitDetail = hitDice.map(die => ({ die, success: succeedsOnHit(die) }));
  const hitReroll = Rules.bestReroll(rules, { ...ruleContext, roll: "hit" });
  if (hitReroll) {
    hitDetail = await applyReroll(hitDetail, hitReroll, succeedsOnHit, rerollRolls);
    applied.push(`${hitReroll.source}: ${rerollLabel(hitReroll)} ${game.i18n.localize("KT.Roll.Hit")}`);
  }
  const hits = hitDetail.filter(d => d.success).length;

  /* --- Wound rolls --- */
  const strength = WeaponData.resolveStrength(profile.strength, actor.system.profile.strength);
  const woundTarget = KT.woundRoll(strength, toughness);
  let woundRoll = null;
  let woundDetail = [];
  let wounds = 0;

  if (hits > 0) {
    woundRoll = new Roll(`${hits}d6`);
    await woundRoll.evaluate();
    const woundBonus = Rules.totalModifier(rules, { ...ruleContext, roll: "wound" });
    if (woundBonus) {
      for (const r of Rules.rulesFor(rules, { ...ruleContext, type: "modifier", roll: "wound" })) {
        applied.push(`${r.source}: ${r.value > 0 ? "+" : ""}${r.value} ${game.i18n.localize("KT.Roll.Wound")}`);
      }
    }
    const succeedsOnWound = die => {
      if (die === 1) return false;
      if (die === 6) return true;
      return (die + woundBonus) >= woundTarget;
    };

    woundDetail = woundRoll.dice[0].results.map(r => ({ die: r.result, success: succeedsOnWound(r.result) }));
    const woundReroll = Rules.bestReroll(rules, { ...ruleContext, roll: "wound" });
    if (woundReroll) {
      woundDetail = await applyReroll(woundDetail, woundReroll, succeedsOnWound, rerollRolls);
      applied.push(`${woundReroll.source}: ${rerollLabel(woundReroll)} ${game.i18n.localize("KT.Roll.Wound")}`);
    }
    wounds = woundDetail.filter(d => d.success).length;
  }

  /* --- Saving throws --- */
  // An invulnerable save is never modified by Armour Penetration, so the
  // defender uses whichever of the two needs the lower roll (pg 33).
  const modifiedSave = saveTarget - profile.ap; // AP is stored as a negative number
  const invulnSave = Math.max(0, Number(config.invuln) || 0);
  const usingInvulnerable = invulnSave > 0 && invulnSave < modifiedSave;
  const effectiveSave = usingInvulnerable ? invulnSave : modifiedSave;

  let saveRoll = null;
  let saveDetail = [];
  let failedSaves = 0;

  if (wounds > 0) {
    saveRoll = new Roll(`${wounds}d6`);
    await saveRoll.evaluate();
    saveDetail = saveRoll.dice[0].results.map(r => {
      const die = r.result;
      const success = die !== 1 && die >= effectiveSave; // Unmodified 1 always fails
      return { die, success };
    });
    failedSaves = saveDetail.filter(d => !d.success).length;
  }

  /* --- Chat card --- */
  const diceRow = (label, detail, note) => `
    <div class="kt-result-row">
      <span class="kt-result-label">${label}</span>
      <span class="kt-result-dice">${detail.map(d => d.rerolled
        ? `<span class="kt-die is-discarded" data-tooltip="${game.i18n.localize("KT.Roll.Rerolled")}">${d.was}</span>`
          + `<span class="kt-die ${d.success ? "is-success" : "is-failure"} is-reroll">${d.die}</span>`
        : `<span class="kt-die ${d.success ? "is-success" : "is-failure"}">${d.die}</span>`).join("")}</span>
      <span class="kt-result-note">${note}</span>
    </div>`;

  const modifierText = modifier === 0 ? "" : ` (${modifier > 0 ? "+" : ""}${modifier})`;
  const parts = [
    `<p class="kt-weapon-line"><strong>${profileLabel(weapon, profile)}</strong> &mdash; ${profile.typeLine} &middot; S ${strength} &middot; AP ${profile.apLabel} &middot; D ${profile.damage}${overwatch ? ` &middot; ${game.i18n.localize("KT.Dialog.Overwatch")}` : ""}</p>`,
    diceRow(game.i18n.localize("KT.Roll.Hits"), hitDetail,
      overwatch ? "6+" : `${skill}+${modifierText}`),
  ];
  if (hits > 0) {
    parts.push(diceRow(game.i18n.localize("KT.Roll.Wounds"), woundDetail, `${woundTarget}+`));
  }
  if (wounds > 0) {
    const saveNote = effectiveSave > 6
      ? game.i18n.localize("KT.Roll.NoSave")
      : `${effectiveSave}+${usingInvulnerable ? ` ${game.i18n.localize("KT.Roll.InvulnerableTag")}` : ""}`;
    parts.push(diceRow(game.i18n.localize("KT.Roll.Saves"), saveDetail, saveNote));
  }

  // List the abilities that changed this attack, so the result can be checked.
  if (applied.length) {
    parts.push(`<ul class="kt-applied">${
      [...new Set(applied)].map(a => `<li>${a}</li>`).join("")
    }</ul>`);
  }

  let summary;
  if (hits === 0) summary = game.i18n.localize("KT.Roll.NoHits");
  else if (wounds === 0) summary = game.i18n.localize("KT.Roll.NoWounds");
  else if (failedSaves === 0) summary = game.i18n.localize("KT.Roll.AllSaved");
  else summary = game.i18n.format("KT.Roll.DamageDealt", {
    count: failedSaves, damage: profile.damage
  });

  parts.push(`<p class="kt-summary">${summary}</p>`);
  /* --- Damage (pg 31-33) --- */
  //
  // Each failed save inflicts the weapon's Damage, and the model loses one
  // wound per point. Only when a model is reduced to 0 wounds is an Injury roll
  // made, so a two-wound model taking a single point simply drops to one wound.
  // Once it reaches 0, any further attacks from this weapon against it are not
  // resolved (pg 32), which is why this allocates one failed save at a time
  // rather than summing them.
  const targetActor = game.user.targets.first()?.actor ?? null;
  let remaining = targetActor?.system?.wounds?.value ?? null;
  const allocation = [];
  let injuryDice = null;
  let unresolved = 0;

  for (let i = 0; i < failedSaves; i++) {
    if (injuryDice !== null) { unresolved = failedSaves - i; break; }
    const { total: inflicted, roll: damageRoll } = await evaluateValue(profile.damage);
    if (damageRoll) rerollRolls.push(damageRoll);
    const amount = Math.max(1, inflicted);
    allocation.push(amount);
    if (remaining === null) continue;      // no target: report only
    remaining -= amount;
    if (remaining <= 0) {
      remaining = 0;
      // The Damage characteristic of the attack that took the last wound
      // decides how many Injury dice are rolled.
      injuryDice = amount;
    }
  }

  if (allocation.length) {
    const total = allocation.reduce((a, b) => a + b, 0);
    parts.push(`<div class="kt-result-row">
      <span class="kt-result-label">${game.i18n.localize("KT.Roll.Damage")}</span>
      <span class="kt-result-dice">${allocation.map(a => `<span class="kt-die">${a}</span>`).join("")}</span>
      <span class="kt-result-note">${total}</span>
    </div>`);
  }

  if (unresolved) {
    parts.push(`<p class="kt-hint">${game.i18n.format("KT.Roll.Unresolved", { count: unresolved })}</p>`);
  }

  if (failedSaves > 0 && targetActor) {
    if (remaining !== null && injuryDice === null) {
      parts.push(`<p class="kt-summary">${game.i18n.format("KT.Roll.WoundsRemaining", {
        name: targetActor.name, value: remaining, max: targetActor.system.wounds.max
      })}</p>`);
    }
    // Writing to the target needs ownership, which an attacking player will not
    // usually have, so the update is offered as a button anyone permitted can use.
    parts.push(`<button type="button" class="kt-chat-button" data-kt-action="damage"
      data-actor-uuid="${targetActor.uuid}" data-amount="${allocation.reduce((a, b) => a + b, 0)}"
      data-injury-dice="${injuryDice ?? ""}">
      <i class="fa-solid fa-heart-crack"></i> ${game.i18n.localize("KT.Roll.ApplyDamage")}</button>`);
  } else if (failedSaves > 0) {
    parts.push(`<button type="button" class="kt-chat-button" data-kt-action="injury"
      data-actor-uuid="" data-damage="${profile.damage}">
      <i class="fa-solid fa-skull"></i> ${game.i18n.localize("KT.Roll.InjuryRoll")}</button>`);
  }

  const rolls = [hitRoll, woundRoll, saveRoll, ...rerollRolls].filter(r => r);
  await postCard({
    actor,
    flavor: isMelee ? game.i18n.localize("KT.Roll.CloseCombatAttack") : game.i18n.localize("KT.Roll.ShootingAttack"),
    content: parts.join(""),
    rolls
  });

  return { hits, wounds, failedSaves };
}

/* -------------------------------------------- */
/*  Injury, Nerve and movement rolls             */
/* -------------------------------------------- */

/**
 * Injury roll: D6 (or one die per point of Damage) plus flesh wounds.
 * 4+ takes the model out of action, otherwise it suffers a flesh wound.
 */
export async function rollInjury(actor, { damage = "1", damageDice = null } = {}) {
  // The number of Injury dice is the Damage characteristic of the attack that
  // took the last wound. Where that was random, it is the value actually rolled
  // when inflicting damage, not a fresh roll (pg 33), so an explicit count is
  // preferred over re-evaluating the formula.
  let count;
  if (Number.isFinite(Number(damageDice)) && Number(damageDice) > 0) {
    count = Math.floor(Number(damageDice));
  } else {
    const { total: dice } = await evaluateValue(damage);
    count = Math.max(1, dice);
  }
  const modifier = actor?.system?.injuryModifier ?? 0;

  const roll = new Roll(`${count}d6`);
  await roll.evaluate();
  const results = roll.dice[0].results.map(r => r.result + modifier);
  const best = Math.max(...results);
  const outOfAction = best >= KT.injury.outOfActionThreshold;

  const content = `
    <div class="kt-result-row">
      <span class="kt-result-label">${game.i18n.localize("KT.Roll.InjuryRoll")}</span>
      <span class="kt-result-dice">${roll.dice[0].results.map(r =>
        `<span class="kt-die">${r.result}</span>`).join("")}</span>
      <span class="kt-result-note">${modifier ? `+${modifier}` : ""}</span>
    </div>
    <p class="kt-summary ${outOfAction ? "is-bad" : ""}">
      ${outOfAction
        ? game.i18n.localize("KT.Roll.OutOfAction")
        : game.i18n.localize("KT.Roll.FleshWound")} (${best})
    </p>`;

  await postCard({ actor, flavor: actor?.name ?? "", content, rolls: [roll] });

  // Apply the result to the operative.
  if (actor?.type === "operative") {
    if (outOfAction) {
      await actor.update({ "system.status.outOfAction": true, "system.wounds.value": 0 });
    } else if (actor.system.fleshWounds >= KT.fleshWoundBoxes) {
      await actor.update({ "system.status.outOfAction": true, "system.wounds.value": 0 });
    } else {
      await actor.update({
        "system.fleshWounds": actor.system.fleshWounds + 1,
        "system.wounds.value": 1
      });
    }
  }

  return { outOfAction, best };
}

/**
 * Nerve test: D6 plus modifiers against Leadership.
 * The test fails if the result exceeds Ld; an unmodified 1 always passes.
 */
export async function rollNerve(actor, { modifier = 0 } = {}) {
  const roll = new Roll("1d6");
  await roll.evaluate();
  const die = roll.dice[0].results[0].result;
  const total = die + modifier;
  const ld = actor.system.profile.ld;
  const passed = (die === 1) || (total <= ld);

  const content = `
    <div class="kt-result-row">
      <span class="kt-result-label">${game.i18n.localize("KT.Roll.NerveTest")}</span>
      <span class="kt-result-dice"><span class="kt-die ${passed ? "is-success" : "is-failure"}">${die}</span></span>
      <span class="kt-result-note">${modifier ? `${modifier > 0 ? "+" : ""}${modifier} ` : ""}vs Ld ${ld}</span>
    </div>
    <p class="kt-summary ${passed ? "" : "is-bad"}">
      ${passed ? game.i18n.localize("KT.Roll.NervePassed") : game.i18n.localize("KT.Roll.NerveFailed")}
    </p>`;

  await postCard({ actor, flavor: actor.name, content, rolls: [roll] });
  if (!passed) await actor.update({ "system.status.shaken": true });
  return passed;
}

/** Advance roll: D6 added to the Move characteristic for this phase. */
export async function rollAdvance(actor) {
  const roll = new Roll("1d6");
  await roll.evaluate();
  const content = `<p class="kt-summary">${game.i18n.format("KT.Roll.AdvanceResult", {
    move: actor.system.profile.move, bonus: roll.total
  })}</p>`;
  await postCard({ actor, flavor: game.i18n.localize("KT.Roll.Advance"), content, rolls: [roll] });
  await actor.update({ "system.status.advanced": true });
  return roll.total;
}

/** Charge roll: 2D6 inches. */
export async function rollCharge(actor) {
  const roll = new Roll("2d6");
  await roll.evaluate();
  const content = `<p class="kt-summary">${game.i18n.format("KT.Roll.ChargeResult", { distance: roll.total })}</p>`;
  await postCard({ actor, flavor: game.i18n.localize("KT.Roll.Charge"), content, rolls: [roll] });
  await actor.update({ "system.status.charged": true });
  return roll.total;
}

/** Psychic test: 2D6 against a warp charge value, with Perils on doubles 1 or 6. */
export async function rollPsychic(actor, warpCharge = 5) {
  const roll = new Roll("2d6");
  await roll.evaluate();
  const dice = roll.dice[0].results.map(r => r.result);
  const perils = (dice[0] === dice[1]) && (dice[0] === 1 || dice[0] === 6);
  const manifested = roll.total >= warpCharge;

  const content = `
    <div class="kt-result-row">
      <span class="kt-result-label">${game.i18n.localize("KT.Roll.PsychicTest")}</span>
      <span class="kt-result-dice">${dice.map(d => `<span class="kt-die">${d}</span>`).join("")}</span>
      <span class="kt-result-note">${roll.total} vs WC ${warpCharge}</span>
    </div>
    <p class="kt-summary ${manifested ? "" : "is-bad"}">
      ${manifested ? game.i18n.localize("KT.Roll.Manifested") : game.i18n.localize("KT.Roll.Failed")}
      ${perils ? ` &mdash; ${game.i18n.localize("KT.Roll.Perils")}` : ""}
    </p>`;

  await postCard({ actor, flavor: actor.name, content, rolls: [roll] });
  return { manifested, perils, total: roll.total };
}

/* -------------------------------------------- */
/*  Chat card buttons                            */
/* -------------------------------------------- */

export function activateChatListeners(html) {
  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root) return;
  for (const button of root.querySelectorAll("[data-kt-action]")) {
    button.addEventListener("click", async event => {
      event.preventDefault();
      const { ktAction, actorUuid, damage, amount, injuryDice } = event.currentTarget.dataset;
      const actor = (actorUuid ? await fromUuid(actorUuid) : null)
        ?? game.user.targets.first()?.actor
        ?? canvas.tokens?.controlled[0]?.actor;
      if (!actor) return ui.notifications.warn(game.i18n.localize("KT.Warning.NoActor"));

      if (ktAction === "damage") {
        if (!actor.isOwner) {
          return ui.notifications.warn(game.i18n.format("KT.Warning.NoPermission", { name: actor.name }));
        }
        const lost = Math.max(0, Number(amount) || 0);
        const before = actor.system.wounds.value;
        const after = Math.max(0, before - lost);
        await actor.update({ "system.wounds.value": after });

        await ChatMessage.create({
          speaker: speakerFor(actor),
          content: `<div class="kill-team chat-card"><p>${game.i18n.format("KT.Roll.DamageApplied", {
            name: actor.name, lost, value: after, max: actor.system.wounds.max
          })}</p></div>`
        });

        // An Injury roll follows only when the model has been reduced to 0.
        if (after === 0) await rollInjury(actor, { damageDice: injuryDice || null, damage });
        return;
      }

      if (ktAction !== "injury") return;
      // Injury rolls are made by the attacker, so anyone may click this.
      await rollInjury(actor, { damage, damageDice: injuryDice || null });
    });
  }
}

export const SYSTEM = SYSTEM_ID;
