import * as dice from "../helpers/dice.mjs";

/**
 * Actor subclass for the Kill Team system.
 */
export class KTActor extends Actor {
  /** Roll data made available to inline rolls and macros. */
  getRollData() {
    const data = { ...super.getRollData(), ...this.system };
    if (this.type === "operative") {
      const p = this.system.profile;
      Object.assign(data, {
        m: p.move, ws: p.ws, bs: p.bs, s: p.strength, t: p.toughness,
        a: p.attacks, ld: p.ld, sv: p.save,
        w: this.system.wounds.value
      });
    }
    return data;
  }

  /** Every weapon this operative is carrying. */
  get weapons() {
    return this.items.filter(i => i.type === "weapon");
  }

  /** Clear the per-round movement and shooting flags. */
  async resetBattleRound() {
    if (this.type !== "operative") return;
    return this.update({
      "system.status.readied": false,
      "system.status.advanced": false,
      "system.status.charged": false,
      "system.status.fellBack": false,
      "system.status.retreated": false
    });
  }

  async rollNerve(options) { return dice.rollNerve(this, options); }
  async rollInjury(options) { return dice.rollInjury(this, options); }
  async rollAdvance() { return dice.rollAdvance(this); }
  async rollCharge() { return dice.rollCharge(this); }
  async rollPsychic(warpCharge) { return dice.rollPsychic(this, warpCharge); }
}

/**
 * Item subclass for the Kill Team system.
 */
export class KTItem extends Item {
  getRollData() {
    const data = { ...super.getRollData(), ...this.system };
    if (this.actor) data.actor = this.actor.getRollData();
    return data;
  }

  /** Roll an attack with this weapon. */
  async roll() {
    if (this.type !== "weapon") return this.toChat();
    if (!this.actor) return ui.notifications.warn(game.i18n.localize("KT.Warning.NoActor"));
    return dice.promptAttack(this.actor, this);
  }

  /** Post a plain description card for non-weapon items. */
  async toChat() {
    const TextEditorImpl = foundry.applications.ux.TextEditor.implementation;
    const description = await TextEditorImpl.enrichHTML(this.system.description ?? "", {
      rollData: this.getRollData(), relativeTo: this
    });
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: this.name,
      content: `<div class="kill-team chat-card">${description || "<p><em>&mdash;</em></p>"}</div>`
    });
  }
}
