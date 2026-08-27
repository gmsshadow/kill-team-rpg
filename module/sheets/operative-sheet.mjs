import { KT, SYSTEM_ID } from "../helpers/config.mjs";
import * as dice from "../helpers/dice.mjs";
import { attachDragDrop, getDragData, handledOnce } from "../helpers/drag-drop.mjs";

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
      rollCloseCombat: KTOperativeSheet.#onRollCloseCombat,
      createItem: KTOperativeSheet.#onCreateItem,
      editItem: KTOperativeSheet.#onEditItem,
      deleteItem: KTOperativeSheet.#onDeleteItem,
      postItem: KTOperativeSheet.#onPostItem,
      setExperience: KTOperativeSheet.#onSetExperience,
      setFleshWounds: KTOperativeSheet.#onSetFleshWounds,
      toggleStatus: KTOperativeSheet.#onToggleStatus,
      chooseAbility: KTOperativeSheet.#onChooseAbility,
      rollNerve: KTOperativeSheet.#onRollNerve,
      rollInjury: KTOperativeSheet.#onRollInjury,
      rollAdvance: KTOperativeSheet.#onRollAdvance,
      rollCharge: KTOperativeSheet.#onRollCharge,
      resetRound: KTOperativeSheet.#onResetRound
    }
  };

  static PARTS = {
    card: { template: `systems/${SYSTEM_ID}/templates/actor/operative-sheet.hbs` }
  };

  /* -------------------------------------------- */

  _onRender(context, options) {
    super._onRender(context, options);
    attachDragDrop(this);
  }

  /* -------------------------------------------- */

  /**
   * Locate the definition for this operative's specialism: a world Item if one
   * exists, otherwise the entry in the system compendium.
   */
  static async #findSpecialism(key) {
    const world = game.items.find(i => i.type === "specialism" && i.system.specialismKey === key);
    if (world) return world;

    const pack = game.packs.get(`${SYSTEM_ID}.specialisms`);
    if (!pack) return null;
    const index = await pack.getIndex({ fields: ["system.specialismKey"] });
    const entry = index.find(e => e.system?.specialismKey === key);
    return entry ? pack.getDocument(entry._id) : null;
  }

  /**
   * Choose a specialist ability for a level. Level 1 is granted rather than
   * chosen, Level 2 offers both branches, Level 3 only the branch connected to
   * the Level 2 already taken, and Level 4 anything left (pg 66).
   */
  static async #onChooseAbility(event, target) {
    const actor = this.document;
    const level = Number(target.closest("[data-level]")?.dataset.level) || 1;

    if (!actor.system.isSpecialist) {
      return ui.notifications.warn(game.i18n.localize("KT.Warn.NoSpecialism"));
    }
    if (level > actor.system.level) {
      return ui.notifications.warn(game.i18n.format("KT.Warn.LevelTooLow", { level }));
    }

    const definition = await KTOperativeSheet.#findSpecialism(actor.system.specialism);
    if (!definition) {
      return ui.notifications.warn(game.i18n.localize("KT.Warn.NoSpecialismDefinition"));
    }

    const taken = actor.items
      .filter(i => i.type === "ability" && i.system.abilityType === "specialism")
      .map(i => i.name);
    const options = definition.system.availableAbilities(level, taken);
    if (!options.length) {
      return ui.notifications.warn(game.i18n.localize("KT.Warn.NoAbilitiesAvailable"));
    }

    // The Level 1 ability is automatic, so take it without asking.
    let chosen = options[0];
    if (level > 1 || options.length > 1) {
      const DialogV2 = foundry.applications.api.DialogV2;
      const FormDataExtended = foundry.applications.ux?.FormDataExtended ?? globalThis.FormDataExtended;
      const rows = options.map((ability, index) => `
        <label class="kt-choice">
          <input type="radio" name="ability" value="${index}" ${index === 0 ? "checked" : ""}/>
          <span><strong>${ability.name}</strong>${ability.parent
            ? ` <em>(${game.i18n.localize("KT.Parent")} ${ability.parent})</em>` : ""}<br/>${ability.description}</span>
        </label>`).join("");

      const data = await DialogV2.prompt({
        window: { title: game.i18n.format("KT.Dialog.ChooseAbilityTitle", { level }) },
        content: `<div class="kt-dialog kt-choices">${rows}</div>`,
        ok: {
          label: game.i18n.localize("KT.Dialog.Choose"),
          callback: (ev, button) => new FormDataExtended(button.form).object
        },
        rejectClose: false
      });
      if (!data) return;
      chosen = options[Number(data.ability)];
    }

    await actor.createEmbeddedDocuments("Item", [{
      name: chosen.name,
      type: "ability",
      img: "icons/svg/upgrade.svg",
      system: {
        abilityType: "specialism",
        specialismKey: actor.system.specialism,
        level: chosen.level,
        // Carry the machine-readable rules across, so the ability does work
        // rather than only reminding.
        rules: chosen.rules ?? [],
        description: `<p>${chosen.description}</p>`,
        source: `${definition.name}, pg ${definition.system.page}`
      }
    }]);
  }

  /** Accept weapons, abilities and wargear dropped onto the datacard. */
  async _onDrop(event) {
    if (!this.isEditable) return;
    // Ignore a repeat delivery of the same drop, which would duplicate the item.
    if (!handledOnce(event)) return;
    const data = getDragData(event);
    if (data?.type !== "Item") return;
    const item = await Item.implementation.fromDropData(data);
    if (!item) return;

    // A faction is applied to the operative rather than embedded: it sets the
    // Faction keyword the Battle-forged check reads, and merges its keywords.
    // Embedding it as well would leave two sources of truth.
    if (item.type === "faction") {
      await this.document.update(item.system.toActorUpdate(this.document));
      ui.notifications.info(game.i18n.format("KT.Info.FactionApplied", {
        faction: item.name, actor: this.document.name
      }));
      return;
    }

    // A model datasheet stamps the operative's base profile. It is applied
    // rather than embedded: the datacard is a copy, so editing the datasheet
    // later does not silently rewrite operatives already built from it.
    if (item.type === "model") {
      const confirmed = await foundry.applications.api.DialogV2.confirm({
        window: { title: game.i18n.localize("KT.Dialog.ApplyModelTitle") },
        content: `<p>${game.i18n.format("KT.Dialog.ApplyModel", {
          model: item.name, actor: this.document.name
        })}</p>`,
        rejectClose: false
      });
      if (!confirmed) return;
      await this.document.update(item.system.toOperativeUpdate());
      ui.notifications.info(game.i18n.format("KT.Info.ModelApplied", {
        model: item.name, actor: this.document.name
      }));
      return;
    }

    // A specialism definition sets the operative's specialism rather than being
    // embedded. Its abilities are chosen individually as the operative levels.
    if (item.type === "specialism") {
      await this.document.update({ "system.specialism": item.system.specialismKey });
      ui.notifications.info(game.i18n.format("KT.Info.SpecialismApplied", {
        specialism: item.name, actor: this.document.name
      }));
      return;
    }

    // Dropping an item the operative already owns is a no-op rather than a duplicate.
    if (item.parent === this.document) return;
    await this.document.createEmbeddedDocuments("Item", [item.toObject()]);
  }

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

    // Abilities granted by the operative's specialism, as opposed to its
    // datasheet abilities, which are not tied to the progression track.
    const specialistAbilities = items.ability
      .filter(item => item.system.abilityType === "specialism");

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

      /* --- Specialist progression --- */
      specialistAbilities,
      abilitiesChosen: specialistAbilities.length,
      // Over the allowance usually means a level was lost, or one was added by hand.
      abilitySlots: Array.fromRange(Math.max(system.abilitiesAllowed, specialistAbilities.length), 1)
        .map(i => ({
          index: i,
          ability: specialistAbilities[i - 1] ?? null,
          overAllowance: i > system.abilitiesAllowed
        })),
      levelOptions: [1, 2, 3, 4].map(level => ({
        value: level, label: game.i18n.format("KT.LevelN", { level })
      })),

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

  /**
   * Attack with the close combat weapon every model is assumed to carry
   * (pg 34). It is built as an unsaved Item so the normal attack sequence
   * applies to it unchanged, and nothing is left behind on the actor.
   */
  static async #onRollCloseCombat() {
    const weapon = new Item.implementation({
      name: game.i18n.localize(KT.closeCombatWeapon.name),
      type: "weapon",
      img: "icons/svg/sword.svg",
      system: {
        range: KT.closeCombatWeapon.range,
        weaponType: KT.closeCombatWeapon.weaponType,
        attacks: KT.closeCombatWeapon.attacks,
        strength: KT.closeCombatWeapon.strength,
        ap: KT.closeCombatWeapon.ap,
        damage: KT.closeCombatWeapon.damage,
        points: 0
      }
    }, { parent: this.document });
    await weapon.roll();
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
