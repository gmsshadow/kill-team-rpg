import { KT } from "../helpers/config.mjs";

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

      // Command roster size: twenty for matched play, twelve to start a campaign.
      rosterLimit: new fields.NumberField({ required: true, integer: true, min: 0, initial: 20, label: "KT.RosterLimit" }),

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

  /** Operatives currently selected for the kill team. */
  get selected() {
    return this.members.filter(m => m.entry.inKillTeam).map(m => m.actor);
  }

  /* -------------------------------------------- */
  /*  Battle-forged validation (pg 62)            */
  /* -------------------------------------------- */

  /**
   * Check the kill team against the Battle-forged restrictions.
   * @returns {{ok: boolean, issues: {severity: string, text: string}[]}}
   */
  get battleForged() {
    const issues = [];
    const team = this.selected;
    const add = (severity, key, data) =>
      issues.push({ severity, text: game.i18n.format(key, data ?? {}) });

    // Between three and twenty models.
    if (team.length < 3) add("error", "KT.Validate.TooFewModels", { count: team.length });
    else if (team.length > 20) add("error", "KT.Validate.TooManyModels", { count: team.length });

    // Exactly one Leader.
    const leaders = team.filter(a => a.system.isLeader).length;
    if (leaders === 0) add("error", "KT.Validate.NoLeader");
    else if (leaders > 1) add("error", "KT.Validate.TooManyLeaders", { count: leaders });

    // Up to three specialists besides the Leader.
    const specialists = team.filter(a => a.system.isSpecialist && !a.system.isLeader);
    if (specialists.length > 3) {
      add("error", "KT.Validate.TooManySpecialists", { count: specialists.length });
    }

    // Each specialism must be unique within the kill team (pg 66). More than
    // one of a kind may sit on the command roster, just not in the same team.
    const seen = new Map();
    for (const actor of team.filter(a => a.system.isSpecialist)) {
      const key = actor.system.specialism;
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    for (const [key, count] of seen) {
      if (count > 1) {
        add("error", "KT.Validate.DuplicateSpecialism", {
          specialism: game.i18n.localize(KT.specialisms[key] ?? key), count
        });
      }
    }

    // Only Level 1 specialists belong in a normal matched play game (pg 67).
    const advanced = team.filter(a => a.system.isSpecialist && a.system.level > 1);
    if (advanced.length) {
      add("warning", "KT.Validate.AdvancedSpecialists", {
        count: advanced.length,
        names: advanced.map(a => a.name).join(", ")
      });
    }

    // All models must share a Faction keyword.
    const factions = [...new Set(team.map(a => a.system.faction?.trim()).filter(Boolean))];
    if (factions.length > 1) add("error", "KT.Validate.MixedFactions", { factions: factions.join(", ") });
    else if (factions.length === 0 && team.length) add("warning", "KT.Validate.NoFaction");

    // Force limit.
    const force = this.force;
    if (force > this.forceLimit) {
      add("error", "KT.Validate.OverForce", { force, limit: this.forceLimit });
    }

    // Max number of any one datasheet.
    const counts = {};
    for (const actor of team) {
      const key = actor.system.datasheet;
      counts[key] ??= { count: 0, max: actor.system.maxCount };
      counts[key].count += 1;
      // Keep the lowest stated Max if datacards disagree.
      if (actor.system.maxCount !== null) {
        counts[key].max = counts[key].max === null
          ? actor.system.maxCount
          : Math.min(counts[key].max, actor.system.maxCount);
      }
    }
    for (const [name, { count, max }] of Object.entries(counts)) {
      if (max !== null && count > max) {
        add("error", "KT.Validate.OverMax", { name, count, max });
      }
    }

    // Command roster size is a separate limit from the kill team itself.
    if (this.roster.length > this.rosterLimit) {
      add("warning", "KT.Validate.OverRoster", { count: this.roster.length, limit: this.rosterLimit });
    }

    return { ok: !issues.some(i => i.severity === "error"), issues };
  }

  /* -------------------------------------------- */
  /*  Command Points (pg 64)                      */
  /* -------------------------------------------- */

  /**
   * The highest Force among all kill teams in the world, used for the
   * first-round Command Point bonus.
   */
  get highestRivalForce() {
    const forces = game.actors
      .filter(a => a.type === "killteam" && a.id !== this.parent.id)
      .map(a => a.system.force);
    return forces.length ? Math.max(...forces) : this.force;
  }

  /**
   * Command Points generated at the start of a battle round: always 1, plus
   * 1 more for each full 10 points this kill team's Force sits below the
   * highest Force in the battle. The bonus applies in the first round only.
   */
  commandPointsForRound(firstRound = false) {
    let gain = 1;
    let bonus = 0;
    if (firstRound) {
      const difference = this.highestRivalForce - this.force;
      bonus = difference > 0 ? Math.floor(difference / 10) : 0;
      gain += bonus;
    }
    return { gain, bonus };
  }

  /** Add this round's Command Points to the pool and announce them. */
  async generateCommandPoints(firstRound = false) {
    const { gain, bonus } = this.commandPointsForRound(firstRound);
    const total = this.commandPoints.value + gain;
    await this.parent.update({
      "system.commandPoints.value": total,
      "system.commandPoints.max": Math.max(total, this.commandPoints.max)
    });

    const key = firstRound && bonus
      ? "KT.Chat.CommandPointsFirstRound"
      : "KT.Chat.CommandPoints";
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.parent }),
      content: `<div class="kill-team chat-card"><p>${game.i18n.format(key, { gain, bonus, total })}</p></div>`
    });
    return total;
  }

  /** Spend Command Points, refusing if the pool is too low. */
  async spendCommandPoints(cost, label) {
    if (this.commandPoints.value < cost) {
      ui.notifications.warn(game.i18n.format("KT.Warn.NotEnoughCP", {
        cost, value: this.commandPoints.value
      }));
      return false;
    }
    await this.parent.update({ "system.commandPoints.value": this.commandPoints.value - cost });
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.parent }),
      content: `<div class="kill-team chat-card"><p>${game.i18n.format("KT.Chat.TacticUsed", {
        name: label, cost, remaining: this.commandPoints.value - cost
      })}</p></div>`
    });
    return true;
  }
}
