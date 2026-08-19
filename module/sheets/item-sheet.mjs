import { KT, SYSTEM_ID } from "../helpers/config.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

/**
 * One sheet covering weapons, abilities, wargear and specialisms.
 */
export default class KTItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["kill-team", "sheet", "item"],
    position: { width: 520, height: "auto" },
    window: { resizable: true, contentClasses: ["kt-sheet-content"] },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      rollWeapon: KTItemSheet.#onRollWeapon
    }
  };

  static PARTS = {
    item: { template: `systems/${SYSTEM_ID}/templates/item/item-sheet.hbs` }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const item = this.document;
    const system = item.system;
    const TextEditorImpl = foundry.applications.ux.TextEditor.implementation;

    return Object.assign(context, {
      item,
      system,
      systemFields: system.schema.fields,
      editable: this.isEditable,
      typeLabel: game.i18n.localize(`TYPES.Item.${item.type}`),
      isWeapon: item.type === "weapon",
      isAbility: item.type === "ability",
      isWargear: item.type === "wargear",
      isSpecialism: item.type === "specialism",
      isFaction: item.type === "faction",
      allegianceOptions: Object.entries(KT.allegiances).map(([value, label]) => ({
        value, label: game.i18n.localize(label)
      })),
      weaponTypeOptions: Object.entries(KT.weaponTypes)
        .map(([value, label]) => ({ value, label: game.i18n.localize(label) })),
      specialismOptions: Object.entries(KT.specialisms)
        .map(([value, label]) => ({ value, label: game.i18n.localize(label) })),
      enrichedDescription: await TextEditorImpl.enrichHTML(system.description, {
        rollData: item.getRollData(), relativeTo: item, secrets: item.isOwner
      })
    });
  }

  static async #onRollWeapon() {
    await this.document.roll();
  }
}
