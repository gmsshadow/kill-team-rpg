import { KT, SYSTEM_ID } from "./config.mjs";
import { WeaponData } from "../data/items.mjs";

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
        <label><input type="checkbox" name="longRange"/> ${game.i18n.localize("KT.Modifier.LongRange")} (-1)</label>
        <label><input type="checkbox" name="obscured"/> ${game.i18n.localize("KT.Modifier.Obscured")} (-1)</label>
        ${isMelee ? `<label><input type="checkbox" name="intervening"/> ${game.i18n.localize("KT.Modifier.Intervening")} (-1)</label>` : ""}
        ${system.weaponType === "rapidFire" ? `<label><input type="checkbox" name="halfRange"/> ${game.i18n.localize("KT.Dialog.HalfRange")}</label>` : ""}
        ${system.weaponType === "heavy" ? `<label><input type="checkbox" name="moved"/> ${game.i18n.localize("KT.Dialog.MovedThisPhase")} (-1)</label>` : ""}
        ${system.weaponType === "assault" ? `<label><input type="checkbox" name="advanced" ${actor.system.status.advanced ? "checked" : ""}/> ${game.i18n.localize("KT.Dialog.Advanced")} (-1)</label>` : ""}
        ${isMelee ? "" : `<label><input type="checkbox" name="overwatch"/> ${game.i18n.localize("KT.Dialog.Overwatch")}</label>`}
        <label>${game.i18n.localize("KT.Dialog.OtherModifier")}
          <input type="number" name="other" value="0" step="1"/>
        </label>
      </fieldset>
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
export async function resolveAttack(actor, weapon, config) {
  const system = weapon.system;
  // Single-profile weapons resolve against their own statistics.
  const profile = config.profile ?? system.attackProfiles[0];
  const isMelee = profile.isMelee;
  const overwatch = !!config.overwatch;

  let attacks = Math.max(1, Number(config.attacks) || 1);
  if (config.halfRange) attacks *= 2; // Rapid Fire within half range

  // Cumulative hit modifiers.
  let modifier = actor.system.hitModifier + (Number(config.other) || 0);
  if (config.longRange) modifier -= 1;
  if (config.obscured) modifier -= 1;
  if (config.intervening) modifier -= 1;
  if (config.moved) modifier -= 1;
  if (config.advanced) modifier -= 1;

  const skill = Math.max(1, Number(config.skill) || 4);
  const toughness = Math.max(1, Number(config.toughness) || 3);
  const saveTarget = Math.max(1, Number(config.save) || 7);

  /* --- Hit rolls --- */
  const hitRoll = new Roll(`${attacks}d6`);
  await hitRoll.evaluate();
  const hitDice = hitRoll.dice[0].results.map(r => r.result);

  const hitDetail = hitDice.map(die => {
    let success;
    if (overwatch) success = die === 6;              // Overwatch always needs a 6
    else if (die === 1) success = false;             // Unmodified 1 always fails
    else if (die === 6) success = true;              // Unmodified 6 always hits
    else success = (die + modifier) >= skill;
    return { die, success };
  });
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
    woundDetail = woundRoll.dice[0].results.map(r => {
      const die = r.result;
      let success;
      if (die === 1) success = false;
      else if (die === 6) success = true;
      else success = die >= woundTarget;
      return { die, success };
    });
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
      <span class="kt-result-dice">${detail.map(d =>
        `<span class="kt-die ${d.success ? "is-success" : "is-failure"}">${d.die}</span>`).join("")}</span>
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

  let summary;
  if (hits === 0) summary = game.i18n.localize("KT.Roll.NoHits");
  else if (wounds === 0) summary = game.i18n.localize("KT.Roll.NoWounds");
  else if (failedSaves === 0) summary = game.i18n.localize("KT.Roll.AllSaved");
  else summary = game.i18n.format("KT.Roll.DamageDealt", {
    count: failedSaves, damage: profile.damage
  });

  parts.push(`<p class="kt-summary">${summary}</p>`);
  if (failedSaves > 0) {
    // The Injury roll is made against the injured model. Prefer the targeted
    // actor; otherwise the button falls back to whatever is targeted on click.
    const targetActor = game.user.targets.first()?.actor;
    parts.push(`<button type="button" class="kt-chat-button" data-kt-action="injury"
      data-actor-uuid="${targetActor?.uuid ?? ""}" data-damage="${profile.damage}">
      <i class="fa-solid fa-skull"></i> ${game.i18n.localize("KT.Roll.InjuryRoll")}</button>`);
  }

  const rolls = [hitRoll, woundRoll, saveRoll].filter(r => r);
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
export async function rollInjury(actor, { damage = "1" } = {}) {
  const { total: dice } = await evaluateValue(damage);
  const count = Math.max(1, dice);
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
      const { ktAction, actorUuid, damage } = event.currentTarget.dataset;
      if (ktAction !== "injury") return;
      const actor = (actorUuid ? await fromUuid(actorUuid) : null)
        ?? game.user.targets.first()?.actor
        ?? canvas.tokens?.controlled[0]?.actor;
      if (!actor) return ui.notifications.warn(game.i18n.localize("KT.Warning.NoActor"));
      // Injury rolls are made by the attacker, so anyone may click this.
      await rollInjury(actor, { damage });
    });
  }
}

export const SYSTEM = SYSTEM_ID;
