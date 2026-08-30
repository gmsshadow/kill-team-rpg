import { SYSTEM_ID, KT } from "../helpers/config.mjs";

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
    return this.announcePhase();
  }

  async previousPhase() {
    await this.setFlag(SYSTEM_ID, "phase", Math.max(0, this.phaseIndex - 1));
    return this.announcePhase();
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

  // If a bar is already present, update it in place. Returning early here was
  // the bug: on a re-render that reused the element, the label never changed.
  const existing = root.querySelector(".kt-phase-bar .kt-phase-name");
  if (existing) {
    existing.textContent = game.i18n.localize(combat.phase.label);
    return;
  }

  const encounter = root.querySelector(
    ".combat-tracker-header, header.encounters, .encounters, #combat-round, .combat-controls"
  );
  if (!encounter) return;

  const bar = document.createElement("div");
  bar.classList.add("kt-phase-bar");
  bar.innerHTML = `
    <a class="kt-phase-step" data-kt-phase="prev" data-tooltip="${game.i18n.localize("KT.Round.PreviousPhase")}">
      <i class="fa-solid fa-caret-left"></i></a>
    <span class="kt-phase-name">${game.i18n.localize(combat.phase.label)}</span>
    <a class="kt-phase-step" data-kt-phase="next" data-tooltip="${game.i18n.localize("KT.Round.NextPhase")}">
      <i class="fa-solid fa-caret-right"></i></a>`;

  bar.querySelector('[data-kt-phase="prev"]').addEventListener("click", () => combat.previousPhase());
  bar.querySelector('[data-kt-phase="next"]').addEventListener("click", () => combat.nextPhase());
  encounter.after(bar);
}
