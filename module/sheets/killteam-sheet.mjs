import { KT, SYSTEM_ID } from "../helpers/config.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

/**
 * The command roster sheet. Operatives are added by dragging them onto it.
 */
export default class KTKillTeamSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["kill-team", "sheet", "killteam"],
    position: { width: 720, height: 700 },
    window: { resizable: true, contentClasses: ["kt-sheet-content"] },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      openMember: KTKillTeamSheet.#onOpenMember,
      removeMember: KTKillTeamSheet.#onRemoveMember,
      toggleMember: KTKillTeamSheet.#onToggleMember,
      rollInitiative: KTKillTeamSheet.#onRollInitiative
    },
    dragDrop: [{ dragSelector: ".draggable", dropSelector: null }]
  };

  static PARTS = {
    roster: { template: `systems/${SYSTEM_ID}/templates/actor/killteam-sheet.hbs` }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.document;
    const system = actor.system;
    const TextEditorImpl = foundry.applications.ux.TextEditor.implementation;

    const members = system.roster.map((entry, index) => {
      const member = fromUuidSync(entry.uuid);
      return {
        index,
        uuid: entry.uuid,
        inKillTeam: entry.inKillTeam,
        actor: member,
        name: member?.name ?? game.i18n.localize("KT.MissingOperative"),
        img: member?.img ?? "icons/svg/mystery-man.svg",
        points: member?.system?.force ?? 0,
        specialismLabel: game.i18n.localize(
          KT.specialisms[member?.system?.specialism ?? "none"] ?? "KT.Specialism.None"
        ),
        experience: member?.system?.experience ?? 0
      };
    });

    return Object.assign(context, {
      actor,
      system,
      systemFields: system.schema.fields,
      editable: this.isEditable,
      members,
      force: system.force,
      overLimit: system.force > system.forceLimit,
      guerrilla: system.guerrilla,
      enrichedBackground: await TextEditorImpl.enrichHTML(system.background, { relativeTo: actor }),
      enrichedNotes: await TextEditorImpl.enrichHTML(system.notes, { relativeTo: actor })
    });
  }

  /* -------------------------------------------- */

  /**
   * Accept dropped operatives onto the roster.
   * The second argument is a document in v13+, but accept raw drop data too.
   */
  async _onDropActor(event, data) {
    if (!this.isEditable) return;
    const actor = (data instanceof foundry.documents.BaseActor) ? data : await Actor.implementation.fromDropData(data);
    if (!actor) return;
    if (actor.type !== "operative") {
      return ui.notifications.warn(game.i18n.localize("KT.Warning.OperativesOnly"));
    }
    const roster = [...this.document.system.roster];
    if (roster.some(entry => entry.uuid === actor.uuid)) {
      return ui.notifications.info(game.i18n.format("KT.Warning.AlreadyOnRoster", { name: actor.name }));
    }
    roster.push({ uuid: actor.uuid, inKillTeam: true });
    await this.document.update({ "system.roster": roster });
  }

  static async #onOpenMember(event, target) {
    const uuid = target.closest("[data-uuid]")?.dataset.uuid;
    const actor = await fromUuid(uuid);
    actor?.sheet.render(true);
  }

  static async #onRemoveMember(event, target) {
    const index = Number(target.closest("[data-index]")?.dataset.index);
    const roster = [...this.document.system.roster];
    roster.splice(index, 1);
    await this.document.update({ "system.roster": roster });
  }

  static async #onToggleMember(event, target) {
    const index = Number(target.closest("[data-index]")?.dataset.index);
    const roster = this.document.system.roster.map(e => ({ ...e }));
    if (!roster[index]) return;
    roster[index].inKillTeam = !roster[index].inKillTeam;
    await this.document.update({ "system.roster": roster });
  }

  static async #onRollInitiative() {
    const roll = new Roll("2d6");
    await roll.evaluate();
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.document }),
      flavor: game.i18n.localize("KT.Roll.InitiativePhase")
    });
  }
}
