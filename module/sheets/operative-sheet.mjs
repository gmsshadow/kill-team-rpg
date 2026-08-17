import { KT, SYSTEM_ID } from "../helpers/config.mjs";
import * as dice from "../helpers/dice.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

/**
 * The operative datacard sheet.
 */
export default class KTOperativeSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["kill-team", "sheet", "operative"],
    position: { width: 760, height: 800 },
    window: { resizable: true, contentClasses: ["kt-sheet-content"] },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      rollWeapon: KTOperativeSheet.#onRollWeapon,
      createItem: KTOperativeSheet.#onCreateItem,
      editItem: KTOperativeSheet.#onEditItem,
      deleteItem: KTOperativeSheet.#onDeleteItem,
      postItem: KTOperativeSheet.#onPostItem,
      setExperience: KTOperativeSheet.#onSetExperience,
      setFleshWounds: KTOperativeSheet.#onSetFleshWounds,
      toggleStatus: KTOperativeSheet.#onToggleStatus,
      rollNerve: KTOperativeSheet.#onRollNerve,
      rollInjury: KTOperativeSheet.#onRollInjury,
      rollAdvance: KTOperativeSheet.#onRollAdvance,
      rollCharge: KTOperativeSheet.#onRollCharge,
      resetRound: KTOperativeSheet.#onResetRound
    },
    dragDrop: [{ dragSelector: ".draggable", dropSelector: null }]
  };

  static PARTS = {
    card: { template: `systems/${SYSTEM_ID}/templates/actor/operative-sheet.hbs` }
  };

  /* -------------------------------------------- */

  get title() {
    return `${this.document.name} — ${game.i18n.localize("KT.Operative")}`;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.document;
    const system = actor.system;
    const TextEditorImpl = foundry.applications.ux.TextEditor.implementation;

    const items = { weapon: [], ability: [], wargear: [], specialism: [] };
    for (const item of actor.items) {
      if (items[item.type]) items[item.type].push(item);
    }
    for (const list of Object.values(items)) list.sort((a, b) => a.sort - b.sort);

    return Object.assign(context, {
      actor,
      system,
      systemFields: system.schema.fields,
      items,
      editable: this.isEditable,

      enrichedAbilities: await TextEditorImpl.enrichHTML(system.abilities, {
        rollData: actor.getRollData(), relativeTo: actor, secrets: actor.isOwner
      }),
      enrichedNotes: await TextEditorImpl.enrichHTML(system.notes, {
        rollData: actor.getRollData(), relativeTo: actor, secrets: actor.isOwner
      }),

      specialismOptions: Object.entries(KT.specialisms)
        .map(([value, label]) => ({ value, label: game.i18n.localize(label) })),

      experienceBoxes: Array.fromRange(KT.experienceBoxes, 1).map(i => ({
        index: i,
        checked: system.experience >= i,
        levelUp: KT.levelUpBoxes.includes(i)
      })),
      fleshWoundBoxes: Array.fromRange(KT.fleshWoundBoxes, 1).map(i => ({
        index: i,
        checked: system.fleshWounds >= i
      })),

      hitModifier: system.hitModifier,
      force: system.force
    });
  }

  /* -------------------------------------------- */
  /*  Action handlers                              */
  /* -------------------------------------------- */

  /** Resolve the clicked element back to an owned item. */
  #getItem(target) {
    const id = target.closest("[data-item-id]")?.dataset.itemId;
    return this.document.items.get(id);
  }

  static async #onRollWeapon(event, target) {
    const item = this.#getItem(target);
    if (item) await item.roll();
  }

  static async #onPostItem(event, target) {
    const item = this.#getItem(target);
    if (item) await item.toChat();
  }

  static async #onCreateItem(event, target) {
    const type = target.dataset.type ?? "weapon";
    const name = game.i18n.format("KT.NewItem", {
      type: game.i18n.localize(`TYPES.Item.${type}`)
    });
    const [item] = await this.document.createEmbeddedDocuments("Item", [{ name, type }]);
    item?.sheet.render(true);
  }

  static async #onEditItem(event, target) {
    this.#getItem(target)?.sheet.render(true);
  }

  static async #onDeleteItem(event, target) {
    const item = this.#getItem(target);
    if (!item) return;
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: game.i18n.localize("KT.DeleteItem") },
      content: `<p>${game.i18n.format("KT.DeleteItemPrompt", { name: item.name })}</p>`
    });
    if (confirmed) await item.delete();
  }

  static async #onSetExperience(event, target) {
    const index = Number(target.dataset.index);
    // Clicking the box you're already on clears it, so a mis-click is undoable.
    const value = this.document.system.experience === index ? index - 1 : index;
    await this.document.update({ "system.experience": Math.max(0, value) });
  }

  static async #onSetFleshWounds(event, target) {
    const index = Number(target.dataset.index);
    const value = this.document.system.fleshWounds === index ? index - 1 : index;
    await this.document.update({ "system.fleshWounds": Math.max(0, value) });
  }

  static async #onToggleStatus(event, target) {
    const key = target.dataset.status;
    const current = foundry.utils.getProperty(this.document, `system.status.${key}`);
    await this.document.update({ [`system.status.${key}`]: !current });
  }

  static async #onRollNerve() {
    const modifier = await KTOperativeSheet.#promptModifier("KT.Roll.NerveTest");
    if (modifier === null) return;
    await dice.rollNerve(this.document, { modifier });
  }

  static async #onRollInjury() {
    await dice.rollInjury(this.document, { damage: "1" });
  }

  static async #onRollAdvance() {
    await dice.rollAdvance(this.document);
  }

  static async #onRollCharge() {
    await dice.rollCharge(this.document);
  }

  static async #onResetRound() {
    await this.document.resetBattleRound();
  }

  /** Small shared dialog asking for a numeric modifier. */
  static async #promptModifier(titleKey) {
    const FormDataExtended = foundry.applications.ux?.FormDataExtended ?? globalThis.FormDataExtended;
    const data = await foundry.applications.api.DialogV2.prompt({
      window: { title: game.i18n.localize(titleKey) },
      classes: ["kill-team"],
      content: `<div class="kt-dialog"><label>${game.i18n.localize("KT.Dialog.Modifier")}
        <input type="number" name="modifier" value="0" step="1"/></label>
        <p class="kt-dialog-note">${game.i18n.localize("KT.Dialog.NerveHint")}</p></div>`,
      ok: {
        label: game.i18n.localize("KT.Dialog.Roll"),
        callback: (event, button) => new FormDataExtended(button.form).object
      },
      rejectClose: false
    });
    return data ? (Number(data.modifier) || 0) : null;
  }
}
