import { SYSTEM_ID, KT } from "../helpers/config.mjs";
import * as dice from "../helpers/dice.mjs";

/**
 * The battle round (pg 20).
 *
 * Kill Team does not use per-combatant initiative. All players roll off once at
 * the start of a round, and that order applies to every phase in it. Foundry's
 * tracker assumes one initiative per combatant, so this rolls once per side and
 * gives every model on that side the same result, which produces the right
 * ordering in the tracker without fighting it.
 *
 * The tracker reports the phase and steps through it. It deliberately does not
 * enforce anything: it will not stop a model shooting after it Advanced. Kill
 * Team has enough exceptions - Assault weapons, FLY, Pistols in melee - that a
 * system policing them is wrong at the worst moment, and the table is better
 * placed to judge.
 */

/** The phases of a battle round, in order. */
export const PHASES = [
  { key: "initiative", label: "KT.Phase.Initiative" },
  { key: "movement", label: "KT.Phase.Movement" },
  { key: "psychic", label: "KT.Phase.Psychic" },
  { key: "shooting", label: "KT.Phase.Shooting" },
  { key: "fight", label: "KT.Phase.Fight" },
  { key: "morale", label: "KT.Phase.Morale" }
];

export class KillTeamCombat extends Combat {

  /** Index of the current phase within PHASES. */
  get phaseIndex() {
    return this.getFlag(SYSTEM_ID, "phase") ?? 0;
  }

  get phase() {
    return PHASES[Math.max(0, Math.min(this.phaseIndex, PHASES.length - 1))];
  }

  /* -------------------------------------------- */

  /**
   * Roll off once per side rather than once per model.
   *
   * Every combatant sharing a token disposition is treated as one kill team and
   * given the same result, so the tracker orders sides rather than individuals.
   * Ties are re-rolled, as the rules require a definite order.
   */
  async rollInitiative(ids, options = {}) {
    const combatants = (Array.isArray(ids) ? ids : [ids])
      .map(id => this.combatants.get(id))
      .filter(c => c);
    if (!combatants.length) return this;

    // Group by side.
    const sides = new Map();
    for (const c of combatants) {
      const side = c.token?.disposition ?? 0;
      if (!sides.has(side)) sides.set(side, []);
      sides.get(side).push(c);
    }

    const results = new Map();
    let attempts = 0;
    do {
      results.clear();
      for (const side of sides.keys()) {
        const roll = new Roll(CONFIG.Combat.initiative.formula || "2d6");
        await roll.evaluate();
        results.set(side, roll.total);
      }
      attempts += 1;
      // Re-roll while two sides are tied, as the order must be definite (pg 20).
    } while (new Set(results.values()).size < results.size && attempts < 10);

    const updates = [];
    for (const [side, members] of sides) {
      for (const c of members) updates.push({ _id: c.id, initiative: results.get(side) });
    }
    await this.updateEmbeddedDocuments("Combatant", updates);

    const summary = [...sides.keys()]
      .sort((a, b) => results.get(b) - results.get(a))
      .map(side => `${sideName(side)}: <strong>${results.get(side)}</strong>`)
      .join(" &middot; ");
    await ChatMessage.create({
      flavor: game.i18n.localize("KT.Round.InitiativeRollOff"),
      content: `<div class="kill-team chat-card"><p>${summary}</p>
        <p class="kt-hint">${game.i18n.localize("KT.Round.OrderApplies")}</p></div>`
    });
    return this;
  }

  /* -------------------------------------------- */

  /** Move to the next phase, rolling into the next round after Morale. */
  async nextPhase() {
    const next = this.phaseIndex + 1;
    if (next >= PHASES.length) return this.nextRound();
    await this.setFlag(SYSTEM_ID, "phase", next);
    await this.resetActed(PHASES[next].key);
    return this.announcePhase();
  }

  async previousPhase() {
    await this.setFlag(SYSTEM_ID, "phase", Math.max(0, this.phaseIndex - 1));
    return this.announcePhase();
  }

  /* -------------------------------------------- */
  /*  Activation                                   */
  /* -------------------------------------------- */

  /** Ids of combatants that have already acted in the current phase. */
  get acted() {
    return this.getFlag(SYSTEM_ID, `acted.${this.phase.key}`) ?? [];
  }

  hasActed(id) {
    return this.acted.includes(id);
  }

  /** Mark a combatant as having acted, or clear it. */
  async setActed(id, state = true) {
    const current = new Set(this.acted);
    if (state) current.add(id);
    else current.delete(id);
    await this.setFlag(SYSTEM_ID, `acted.${this.phase.key}`, [...current]);
    this.refreshTracker();
  }

  /** Forget who has acted, for one phase or all of them. */
  async resetActed(phaseKey = null) {
    if (phaseKey) await this.setFlag(SYSTEM_ID, `acted.${phaseKey}`, []);
    else await this.setFlag(SYSTEM_ID, "acted", {});
    this.refreshTracker();
  }

  /**
   * The order models act in during the current phase.
   *
   * Initiative decides the order of play, but two phases put a group in front
   * of it: Readied models shoot before all others (pg 28), and models that
   * charged fight before all others (pg 34). Those are ordered first here, so
   * the list matches the sequence actually played rather than raw initiative.
   */
  get activationOrder() {
    const phase = this.phase.key;
    const entries = this.combatants.contents
      .filter(c => c.actor)
      .map(c => {
        const status = c.actor.system?.status ?? {};
        let priority = 1;
        let note = null;
        if (phase === "shooting" && status.readied) { priority = 0; note = "KT.Readied"; }
        if (phase === "fight" && status.charged) { priority = 0; note = "KT.Charged"; }
        return {
          id: c.id,
          name: c.name,
          initiative: c.initiative ?? null,
          acted: this.hasActed(c.id),
          outOfAction: !!status.outOfAction,
          shaken: !!status.shaken,
          priority,
          note
        };
      });

    return entries.sort((a, b) =>
      a.priority - b.priority
      || (b.initiative ?? -Infinity) - (a.initiative ?? -Infinity)
      || a.name.localeCompare(b.name));
  }

  /** Models still to act: not yet acted, and able to (pg 36 - shaken models cannot). */
  get pending() {
    return this.activationOrder.filter(e => !e.acted && !e.outOfAction && !e.shaken);
  }

  /**
   * Redraw the tracker.
   *
   * Foundry only re-renders the tracker for changes it knows about - round,
   * turn, whether the encounter is active. A flag change is invisible to it, so
   * the phase bar would keep showing whatever it said when it was first drawn.
   */
  refreshTracker() {
    ui.combat?.render();
  }

  /**
   * Clear every combatant's initiative so the next roll-off can be made.
   * Uses Foundry's resetAll where available, falling back to clearing the
   * values directly.
   */
  async clearInitiative() {
    try {
      if (typeof this.resetAll === "function") return await this.resetAll();
    } catch (err) {
      // Fall through to the manual path below.
    }
    const updates = this.combatants.map(c => ({ _id: c.id, initiative: null }));
    if (updates.length) await this.updateEmbeddedDocuments("Combatant", updates);
    this.refreshTracker();
  }

  async announcePhase() {
    this.refreshTracker();
    await ChatMessage.create({
      content: `<div class="kill-team chat-card"><p><strong>`
        + `${game.i18n.format("KT.Round.Number", { round: this.round })}</strong> &mdash; `
        + `${game.i18n.localize(this.phase.label)}</p></div>`
    });
  }

  /* -------------------------------------------- */

  /**
   * A new battle round clears everything that only lasted the last one:
   * Readied, Advanced, Charged, Fell Back and Retreated. Shaken is not cleared
   * here - it is removed during the Morale phase (pg 36), and clearing it twice
   * would let a model shrug off a failed Nerve test.
   */
  async nextRound() {
    const result = await super.nextRound();
    await this.setFlag(SYSTEM_ID, "phase", 0);
    await this.resetActed();

    // Foundry keeps initiative between rounds, so the roll button never comes
    // back. Kill Team rolls off again at the start of every battle round
    // (pg 20), so it is cleared here to make the new roll-off possible.
    await this.clearInitiative();

    const updates = [];
    for (const combatant of this.combatants) {
      const actor = combatant.actor;
      if (actor?.type !== "operative") continue;
      updates.push(actor.update({
        "system.status.readied": false,
        "system.status.advanced": false,
        "system.status.charged": false,
        "system.status.fellBack": false,
        "system.status.retreated": false
      }));
    }
    await Promise.all(updates);

    await ChatMessage.create({
      content: `<div class="kill-team chat-card"><p><strong>`
        + `${game.i18n.format("KT.Round.Number", { round: this.round })}</strong></p>`
        + `<p class="kt-hint">${game.i18n.localize("KT.Round.StatusesCleared")}</p>`
      + `<p class="kt-hint">${game.i18n.localize("KT.Round.RollOffAgain")}</p></div>`
    });
    return result;
  }
}

/**
 * The moves a model can make in the Movement phase (pg 21-24).
 *
 * Declaring one here is what sets the status the later phases read. Without it
 * the Readied and Charged flags were only reachable from the datacard, so the
 * ordering rules that depend on them - Readied models shooting first, chargers
 * fighting first - never came into play.
 */
export const MOVES = [
  { key: "normal", label: "KT.Move.Normal" },
  { key: "advance", label: "KT.Move.Advance", rolls: true },
  { key: "charge", label: "KT.Move.Charge", rolls: true },
  { key: "ready", label: "KT.Move.Ready", status: "readied" },
  { key: "fallBack", label: "KT.Move.FallBack", status: "fellBack" },
  { key: "retreat", label: "KT.Move.Retreat", status: "retreated" },
  { key: "stationary", label: "KT.Move.Stationary" }
];

/**
 * Apply a declared move to an operative.
 *
 * Every movement status is cleared first, so changing a declaration does not
 * leave the previous one set. Advance and charge are rolled through the normal
 * dice functions, which set their own status and post the roll.
 */
export async function declareMove(actor, key) {
  const move = MOVES.find(m => m.key === key);
  if (!actor || !move) return;

  await actor.update({
    "system.status.readied": false,
    "system.status.advanced": false,
    "system.status.charged": false,
    "system.status.fellBack": false,
    "system.status.retreated": false
  });

  if (move.key === "advance") return dice.rollAdvance(actor);
  if (move.key === "charge") return dice.rollCharge(actor);
  if (move.status) {
    await actor.update({ [`system.status.${move.status}`]: true });
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<div class="kill-team chat-card"><p>${game.i18n.format("KT.Move.Declared", {
        name: actor.name, move: game.i18n.localize(move.label)
      })}</p></div>`
    });
  }
}

/** Ask which move a model is making, then apply it. */
export async function promptMove(actor) {
  const DialogV2 = foundry.applications.api.DialogV2;
  const FormDataExtended = foundry.applications.ux?.FormDataExtended ?? globalThis.FormDataExtended;

  const rows = MOVES.map((m, i) => `
    <label class="kt-choice">
      <input type="radio" name="move" value="${m.key}" ${i === 0 ? "checked" : ""}/>
      <span>${game.i18n.localize(m.label)}</span>
    </label>`).join("");

  const data = await DialogV2.prompt({
    window: { title: game.i18n.format("KT.Move.Title", { name: actor.name }) },
    content: `<div class="kt-dialog kt-choices">${rows}</div>`,
    ok: {
      label: game.i18n.localize("KT.Move.Confirm"),
      callback: (event, button) => new FormDataExtended(button.form).object
    },
    rejectClose: false
  });
  if (!data) return false;
  await declareMove(actor, data.move);
  return true;
}

/** A readable name for a token disposition. */
function sideName(disposition) {
  const D = CONST.TOKEN_DISPOSITIONS;
  if (disposition === D.FRIENDLY) return game.i18n.localize("KT.Round.Friendly");
  if (disposition === D.HOSTILE) return game.i18n.localize("KT.Round.Hostile");
  return game.i18n.localize("KT.Round.Neutral");
}

/* -------------------------------------------- */

/**
 * Add a phase bar to the combat tracker.
 *
 * Injected on render rather than replacing the tracker template, so a Foundry
 * update to the tracker does not break the system.
 */
export function renderPhaseBar(app, html) {
  const combat = game.combat;
  if (!combat || !(combat instanceof KillTeamCombat)) return;

  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root) return;

  // Always rebuild rather than updating in place. Foundry re-renders the
  // tracker in ways that can leave a previously inserted bar detached from the
  // live document, and a detached bar is invisible but still matches a
  // selector - which is how the buttons came to stop responding after rolling
  // initiative. Clicks are handled by delegation, so rebuilding costs nothing.
  root.querySelectorAll(".kt-phase-bar, .kt-activation").forEach(el => el.remove());

  const encounter = root.querySelector(
    ".combat-tracker-header, header.encounters, .encounters, #combat-round, .combat-controls"
  );
  if (!encounter) return;

  const pending = combat.pending.length;
  const bar = document.createElement("div");
  bar.classList.add("kt-phase-bar");
  bar.innerHTML = `
    <a class="kt-phase-step" data-kt-phase="prev" data-tooltip="${game.i18n.localize("KT.Round.PreviousPhase")}">
      <i class="fa-solid fa-caret-left"></i></a>
    <span class="kt-phase-name">${game.i18n.localize(combat.phase.label)}</span>
    <a class="kt-phase-step ${pending === 0 ? "is-ready" : ""}" data-kt-phase="next"
       data-tooltip="${game.i18n.localize("KT.Round.NextPhase")}">
      <i class="fa-solid fa-caret-right"></i></a>`;
  encounter.after(bar);

  // The Initiative phase has no activations to track.
  if (combat.phase.key === "initiative") return;

  const order = combat.activationOrder;
  if (!order.length) return;

  const panel = document.createElement("div");
  panel.classList.add("kt-activation");
  panel.innerHTML = `
    <div class="kt-activation-head">
      <span>${pending
        ? game.i18n.format("KT.Round.Remaining", { count: pending })
        : game.i18n.localize("KT.Round.AllActed")}</span>
      <a data-kt-acted="reset" data-tooltip="${game.i18n.localize("KT.Round.ResetActed")}">
        <i class="fa-solid fa-rotate-left"></i></a>
    </div>
    <ol class="kt-activation-list">
      ${order.map(e => `
        <li class="kt-activation-entry ${e.acted ? "is-acted" : ""} ${e.outOfAction || e.shaken ? "is-unable" : ""}"
            data-kt-acted="${e.id}">
          <span class="kt-init">${e.initiative ?? "-"}</span>
          <span class="kt-activation-name">${e.name}</span>
          ${e.note ? `<span class="kt-activation-note">${game.i18n.localize(e.note)}</span>` : ""}
          ${e.outOfAction ? `<span class="kt-activation-note">${game.i18n.localize("KT.OutOfAction")}</span>`
            : e.shaken ? `<span class="kt-activation-note">${game.i18n.localize("KT.Shaken")}</span>` : ""}
          <i class="fa-solid ${e.acted ? "fa-square-check" : "fa-square"}"></i>
        </li>`).join("")}
    </ol>`;
  bar.after(panel);
}

/**
 * Handle phase clicks by delegation, bound once to the document.
 *
 * Binding to the bar itself ties the listener to a particular element, which
 * does not survive the tracker being re-rendered and re-inserted. Listening at
 * the document means it keeps working however often the tracker is redrawn.
 */
export function activatePhaseControls() {
  document.addEventListener("click", async event => {
    const control = event.target?.closest?.("[data-kt-phase]");
    if (!control) return;
    const combat = game.combat;
    if (!combat || !(combat instanceof KillTeamCombat)) return;
    event.preventDefault();

    if (!game.user.isGM) {
      return ui.notifications.warn(game.i18n.localize("KT.Round.GMOnly"));
    }
    if (control.dataset.ktPhase === "next") await combat.nextPhase();
    else await combat.previousPhase();
  });

  // Marking a model as having acted, by the same delegation.
  document.addEventListener("click", async event => {
    const entry = event.target?.closest?.("[data-kt-acted]");
    if (!entry) return;
    const combat = game.combat;
    if (!combat || !(combat instanceof KillTeamCombat)) return;
    event.preventDefault();

    if (!game.user.isGM) {
      return ui.notifications.warn(game.i18n.localize("KT.Round.GMOnly"));
    }
    const id = entry.dataset.ktActed;
    if (id === "reset") return combat.resetActed(combat.phase.key);

    const marking = !combat.hasActed(id);
    // In the Movement phase, what a model did decides the statuses the later
    // phases read, so ask rather than silently recording a bare activation.
    if (marking && combat.phase.key === "movement") {
      const actor = combat.combatants.get(id)?.actor;
      if (actor && !(await promptMove(actor))) return;   // cancelled
    }
    await combat.setActed(id, marking);
  });
}
