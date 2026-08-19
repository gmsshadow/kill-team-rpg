import { KT } from "../helpers/config.mjs";

const fields = foundry.data.fields;

/**
 * An operative: one model on the battlefield, matching a Kill Team datacard.
 */
export default class OperativeData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      points: new fields.NumberField({
        required: true, integer: true, min: 0, initial: 0, label: "KT.Points"
      }),

      // The datacard profile row: NAME M WS BS S T W A Ld Sv
      profile: new fields.SchemaField({
        move: new fields.StringField({
          required: true, blank: false, initial: "6\"", label: "KT.Move"
        }),
        ws: new fields.NumberField({
          required: true, integer: true, min: 1, max: 6, initial: 4, label: "KT.WeaponSkill"
        }),
        bs: new fields.NumberField({
          required: true, integer: true, min: 1, max: 6, initial: 4, label: "KT.BallisticSkill"
        }),
        strength: new fields.NumberField({
          required: true, integer: true, min: 1, initial: 3, label: "KT.Strength"
        }),
        toughness: new fields.NumberField({
          required: true, integer: true, min: 1, initial: 3, label: "KT.Toughness"
        }),
        attacks: new fields.NumberField({
          required: true, integer: true, min: 0, initial: 1, label: "KT.Attacks"
        }),
        ld: new fields.NumberField({
          required: true, integer: true, min: 1, initial: 7, label: "KT.Leadership"
        }),
        save: new fields.NumberField({
          required: true, integer: true, min: 1, max: 7, initial: 5, label: "KT.Save"
        }),
        invulnerable: new fields.NumberField({
          required: false, integer: true, min: 1, max: 7, initial: null, nullable: true,
          label: "KT.Invulnerable"
        })
      }),

      // Wounds are tracked separately so they can drive the token bar.
      wounds: new fields.SchemaField({
        value: new fields.NumberField({
          required: true, integer: true, min: 0, initial: 1, label: "KT.WoundsCurrent"
        }),
        max: new fields.NumberField({
          required: true, integer: true, min: 1, initial: 1, label: "KT.WoundsMax"
        })
      }),

      // "Max" column on a datasheet: how many of this model a kill team may include.
      maxNumber: new fields.StringField({
        required: true, initial: "-", label: "KT.MaxNumber"
      }),

      specialism: new fields.StringField({
        required: true, initial: "none", choices: KT.specialisms, label: "KT.SpecialismLabel"
      }),
      /**
       * Specialist level is derived from the experience track. This overrides
       * it for one-off games where experience is not being tracked; leave it
       * null to let the track drive the level.
       */
      levelOverride: new fields.NumberField({
        required: false, nullable: true, integer: true, min: 1, max: 4, initial: null,
        label: "KT.LevelOverride"
      }),
      demeanour: new fields.StringField({
        required: true, initial: "", label: "KT.Demeanour"
      }),

      // Campaign progression boxes from the bottom of the datacard.
      experience: new fields.NumberField({
        required: true, integer: true, min: 0, max: KT.experienceBoxes, initial: 0,
        label: "KT.Experience"
      }),
      fleshWounds: new fields.NumberField({
        required: true, integer: true, min: 0, max: KT.fleshWoundBoxes, initial: 0,
        label: "KT.FleshWounds"
      }),
      convalescence: new fields.BooleanField({ initial: false, label: "KT.Convalescence" }),
      newRecruit: new fields.BooleanField({ initial: false, label: "KT.NewRecruit" }),

      // Transient battle state.
      status: new fields.SchemaField({
        shaken: new fields.BooleanField({ initial: false, label: "KT.Shaken" }),
        readied: new fields.BooleanField({ initial: false, label: "KT.Readied" }),
        advanced: new fields.BooleanField({ initial: false, label: "KT.Advanced" }),
        charged: new fields.BooleanField({ initial: false, label: "KT.Charged" }),
        fellBack: new fields.BooleanField({ initial: false, label: "KT.FellBack" }),
        retreated: new fields.BooleanField({ initial: false, label: "KT.Retreated" }),
        outOfAction: new fields.BooleanField({ initial: false, label: "KT.OutOfAction" }),
        broken: new fields.BooleanField({ initial: false, label: "KT.Broken" })
      }),

      // Datasheet the operative was built from, e.g. "Skitarii Ranger". The Max
      // restriction (pg 62) counts models sharing a datasheet, not a given name.
      modelType: new fields.StringField({ required: true, initial: "", label: "KT.ModelType" }),

      faction: new fields.StringField({ required: true, initial: "", label: "KT.Faction" }),
      keywords: new fields.StringField({ required: true, initial: "", label: "KT.Keywords" }),
      abilities: new fields.HTMLField({ required: true, initial: "", label: "KT.Abilities" }),
      notes: new fields.HTMLField({ required: true, initial: "", label: "KT.Notes" })
    };
  }

  /* -------------------------------------------- */

  prepareBaseData() {
    // Each flesh wound is a cumulative -1 to hit and +1 to Injury rolls.
    this.hitModifier = -this.fleshWounds;
    this.injuryModifier = this.fleshWounds;
    if (this.status.broken) this.hitModifier -= 1;
  }

  prepareDerivedData() {
    // A model may not act at all while shaken.
    this.canAct = !this.status.shaken && !this.status.outOfAction;

    // A model that Advanced, charged, Fell Back or Retreated cannot shoot
    // later in the battle round (Assault weapons and FLY aside).
    this.canShoot = this.canAct
      && !this.status.charged
      && !this.status.fellBack
      && !this.status.retreated;

    // Total force cost: the operative plus any wargear or weapon upgrades.
    let force = this.points;
    for (const item of this.parent.items) force += item.system.points ?? 0;
    this.force = force;

    // Battle-forged bookkeeping (pg 62).
    this.isLeader = this.specialism === "leader";
    this.isSpecialist = this.specialism !== "none";

    /* --- Specialist progression (pg 66, 204) --- */

    // Each level-up box crossed on the experience track raises the level.
    this.levelFromExperience = 1 + KT.levelUpBoxes
      .filter(box => this.experience >= box).length;
    this.level = this.levelOverride ?? this.levelFromExperience;
    this.usingLevelOverride = this.levelOverride !== null;

    // Experience remaining until the next level, and the box that grants it.
    this.nextLevelBox = KT.levelUpBoxes.find(box => this.experience < box) ?? null;
    this.experienceToNextLevel = this.nextLevelBox === null
      ? 0
      : this.nextLevelBox - this.experience;

    // How many specialism abilities this operative should have chosen.
    this.abilitiesAllowed = this.isSpecialist
      ? (KT.specialistAbilitiesByLevel[this.level] ?? 0)
      : 0;
    // A Max of "-" means unlimited.
    const parsedMax = Number.parseInt(this.maxNumber, 10);
    this.maxCount = Number.isNaN(parsedMax) ? null : parsedMax;
    this.datasheet = this.modelType?.trim() || this.parent.name;

    this.levelUpAt = KT.levelUpBoxes;
  }

  /** Convenience accessor used by the attack workflow. */
  skillFor(weapon) {
    return KT.meleeTypes.includes(weapon.system.weaponType)
      ? this.profile.ws
      : this.profile.bs;
  }
}
