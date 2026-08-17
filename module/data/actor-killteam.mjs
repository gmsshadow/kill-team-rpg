const fields = foundry.data.fields;

/**
 * A kill team / command roster. Holds the campaign resources and a list of
 * operatives, each referenced by UUID so the same operative can appear on
 * more than one roster.
 */
export default class KillTeamData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      playerName: new fields.StringField({ required: true, initial: "", label: "KT.PlayerName" }),
      faction: new fields.StringField({ required: true, initial: "", label: "KT.Faction" }),
      mission: new fields.StringField({ required: true, initial: "", label: "KT.Mission" }),
      squadQuirk: new fields.StringField({ required: true, initial: "", label: "KT.SquadQuirk" }),
      background: new fields.HTMLField({ required: true, initial: "", label: "KT.Background" }),

      resources: new fields.SchemaField({
        intelligence: new fields.NumberField({ required: true, integer: true, initial: 8, label: "KT.Intelligence" }),
        materiel: new fields.NumberField({ required: true, integer: true, initial: 8, label: "KT.Materiel" }),
        morale: new fields.NumberField({ required: true, integer: true, initial: 8, label: "KT.Morale" }),
        territory: new fields.NumberField({ required: true, integer: true, initial: 8, label: "KT.Territory" })
      }),

      commandPoints: new fields.SchemaField({
        value: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        max: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 })
      }),

      // Force limit for a Battle-forged kill team; 150 after Escalation.
      forceLimit: new fields.NumberField({ required: true, integer: true, min: 0, initial: 100, label: "KT.ForceLimit" }),

      roster: new fields.ArrayField(
        new fields.SchemaField({
          uuid: new fields.DocumentUUIDField({ type: "Actor" }),
          inKillTeam: new fields.BooleanField({ initial: true })
        }),
        { initial: [], label: "KT.Roster" }
      ),

      notes: new fields.HTMLField({ required: true, initial: "", label: "KT.Notes" })
    };
  }

  prepareDerivedData() {
    // A faction reduced to 0 or less in any resource becomes a guerrilla faction.
    this.guerrilla = Object.values(this.resources).some(v => v <= 0);
  }

  /** Resolve roster entries into Actor documents (synchronously where cached). */
  get members() {
    return this.roster
      .map(entry => ({ entry, actor: fromUuidSync(entry.uuid) }))
      .filter(m => !!m.actor);
  }

  /** Total points of every operative currently marked as in the kill team. */
  get force() {
    return this.members
      .filter(m => m.entry.inKillTeam)
      .reduce((total, m) => total + (m.actor.system.force ?? m.actor.system.points ?? 0), 0);
  }
}
