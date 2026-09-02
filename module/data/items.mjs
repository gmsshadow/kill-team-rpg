import { KT } from "../helpers/config.mjs";

const fields = foundry.data.fields;

/** Fields shared by every item type. */
function commonFields() {
  return {
    description: new fields.HTMLField({ required: true, initial: "", label: "KT.Description" }),
    points: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0, label: "KT.Points" }),
    source: new fields.StringField({ required: true, initial: "", label: "KT.Source" })
  };
}

/**
 * A weapon profile: RANGE TYPE S AP D ABILITIES.
 * Strength, attacks and damage are strings because profiles legitimately use
 * "User", "x2", "+1", "D3" and "D6" as well as flat numbers.
 */
export class WeaponData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...commonFields(),

      /**
       * Multi-profile weapons. A combi-weapon or a missile launcher prints a
       * header row with no statistics of its own, followed by named profiles.
       * When this array is populated the top-level statistics are ignored and
       * the bearer picks a profile when attacking.
       */
      profileMode: new fields.StringField({
        required: true, initial: "single",
        choices: {
          single: "KT.ProfileMode.Single",
          chooseOne: "KT.ProfileMode.ChooseOne",
          chooseOneOrBoth: "KT.ProfileMode.ChooseOneOrBoth"
        },
        label: "KT.ProfileModeLabel"
      }),
      profiles: new fields.ArrayField(
        new fields.SchemaField({
          name: new fields.StringField({ required: true, initial: "", label: "KT.Name" }),
          range: new fields.StringField({ required: true, initial: "12\"", label: "KT.Range" }),
          weaponType: new fields.StringField({
            required: true, initial: "assault", choices: KT.weaponTypes, label: "KT.Type"
          }),
          attacks: new fields.StringField({ required: true, initial: "1", label: "KT.Attacks" }),
          strength: new fields.StringField({ required: true, initial: "4", label: "KT.Strength" }),
          ap: new fields.NumberField({ required: true, integer: true, initial: 0, label: "KT.ArmourPenetration" }),
          damage: new fields.StringField({ required: true, initial: "1", label: "KT.Damage" }),
          abilities: new fields.StringField({ required: true, initial: "", label: "KT.Abilities" })
        }),
        { initial: [], label: "KT.Profiles" }
      ),

      range: new fields.StringField({ required: true, initial: "12\"", label: "KT.Range" }),
      weaponType: new fields.StringField({
        required: true, initial: "assault", choices: KT.weaponTypes, label: "KT.Type"
      }),
      attacks: new fields.StringField({ required: true, initial: "1", label: "KT.Attacks" }),
      strength: new fields.StringField({ required: true, initial: "4", label: "KT.Strength" }),
      ap: new fields.NumberField({ required: true, integer: true, initial: 0, label: "KT.ArmourPenetration" }),
      damage: new fields.StringField({ required: true, initial: "1", label: "KT.Damage" }),
      abilities: new fields.StringField({ required: true, initial: "", label: "KT.Abilities" }),
      equipped: new fields.BooleanField({ initial: true, label: "KT.Equipped" })
    };
  }

  prepareDerivedData() {
    this.isMelee = KT.meleeTypes.includes(this.weaponType);
    // Type line as printed on the card, e.g. "Rapid Fire 1".
    this.typeLine = WeaponData.typeLine(this.weaponType, this.attacks);
    this.apLabel = WeaponData.apLabel(this.ap);

    this.hasProfiles = this.profiles.length > 0;

    /**
     * Every attack option this weapon offers, in a single shape, so callers do
     * not have to branch on whether the weapon is multi-profile.
     */
    this.attackProfiles = this.hasProfiles
      ? this.profiles.map((profile, index) => ({
          index,
          name: profile.name,
          range: profile.range,
          weaponType: profile.weaponType,
          attacks: profile.attacks,
          strength: profile.strength,
          ap: profile.ap,
          damage: profile.damage,
          abilities: profile.abilities,
          isMelee: KT.meleeTypes.includes(profile.weaponType),
          typeLine: WeaponData.typeLine(profile.weaponType, profile.attacks),
          apLabel: WeaponData.apLabel(profile.ap)
        }))
      : [{
          index: 0,
          name: this.parent?.name ?? "",
          range: this.range,
          weaponType: this.weaponType,
          attacks: this.attacks,
          strength: this.strength,
          ap: this.ap,
          damage: this.damage,
          abilities: this.abilities,
          isMelee: this.isMelee,
          typeLine: this.typeLine,
          apLabel: this.apLabel
        }];

    // Combi-weapons may fire both profiles at a cumulative -1 to hit.
    this.allowsBothProfiles = this.profileMode === "chooseOneOrBoth";
  }

  /** "Rapid Fire 1", or just "Melee" for melee weapons. */
  static typeLine(weaponType, attacks) {
    const label = game.i18n.localize(KT.weaponTypes[weaponType] ?? weaponType);
    return KT.meleeTypes.includes(weaponType) ? label : `${label} ${attacks}`;
  }

  static apLabel(ap) {
    return ap === 0 ? "0" : `${ap}`;
  }

  /**
   * Resolve this weapon's Strength against a wielder.
   * Handles "User", "+N", "-N" and "xN" notation.
   */
  resolveStrength(wielderStrength) {
    return WeaponData.resolveStrength(this.strength, wielderStrength);
  }

  /**
   * Resolve a Strength value against a wielder.
   * Handles "User", "+N", "-N" and "xN" notation.
   */
  static resolveStrength(value, wielderStrength) {
    const raw = String(value).trim();
    if (/^user$/i.test(raw)) return wielderStrength;
    const multiplier = raw.match(/^x\s*(\d+)$/i);
    if (multiplier) return wielderStrength * Number(multiplier[1]);
    const relative = raw.match(/^([+-])\s*(\d+)$/);
    if (relative) {
      const delta = Number(relative[2]);
      return relative[1] === "+" ? wielderStrength + delta : Math.max(1, wielderStrength - delta);
    }
    const flat = Number(raw);
    return Number.isFinite(flat) ? flat : wielderStrength;
  }
}

/** A named special rule printed in the ABILITIES box. */
export class AbilityData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...commonFields(),
      abilityType: new fields.StringField({
        required: true, initial: "datasheet",
        choices: {
          datasheet: "KT.AbilityType.Datasheet",
          specialism: "KT.AbilityType.Specialism",
          faction: "KT.AbilityType.Faction",
          fireTeam: "KT.AbilityType.FireTeam",
          tactic: "KT.AbilityType.Tactic"
        },
        label: "KT.Type"
      }),
      // Tactics have a Command Point cost.
      cost: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0, label: "KT.CommandPointCost" }),

      /** Which specialism this belongs to, for specialism abilities and Tactics. */
      specialismKey: new fields.StringField({
        required: true, initial: "none", choices: KT.specialisms, label: "KT.SpecialismLabel"
      }),

      /**
       * The specialist level at which this becomes available. 0 means it is
       * not level-gated, which covers datasheet and faction abilities.
       */
      level: new fields.NumberField({
        required: true, integer: true, min: 0, max: 4, initial: 0, label: "KT.Level"
      }),

      active: new fields.BooleanField({ initial: true, label: "KT.Active" }),

      /**
       * Machine-readable rules, in the vocabulary defined in
       * module/rules/vocabulary.mjs. An empty array means the ability is
       * reference text only.
       */
      rules: new fields.ArrayField(new fields.ObjectField(), { initial: [], label: "KT.RulesLabel" })
    };
  }
}

/** Non-weapon equipment. */
export class WargearData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...commonFields(),
      quantity: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1, label: "KT.Quantity" }),
      equipped: new fields.BooleanField({ initial: true, label: "KT.Equipped" })
    };
  }
}

/** A specialism track, so levels and their chosen abilities can be recorded. */
export class SpecialismData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...commonFields(),
      specialismKey: new fields.StringField({
        required: true, initial: "leader", choices: KT.specialisms, label: "KT.SpecialismLabel"
      }),

      /** Page in the core book, kept as a traceability anchor. */
      page: new fields.NumberField({
        required: true, integer: true, min: 0, initial: 0, label: "KT.Page"
      }),

      /**
       * The specialism's ability tree. A specialist chooses one ability each
       * time it reaches a new level. `level` is the level at which an ability
       * becomes available; 0 means available at any level.
       */
      abilities: new fields.ArrayField(
        new fields.SchemaField({
          name: new fields.StringField({ required: true, initial: "", label: "KT.Name" }),
          level: new fields.NumberField({ required: true, integer: true, min: 0, max: 4, initial: 0, label: "KT.Level" }),
          /**
           * The Level 2 ability this one connects to. A Level 3 ability may
           * only be taken if its parent was the Level 2 choice (pg 66).
           */
          parent: new fields.StringField({ required: false, nullable: true, initial: null, label: "KT.Parent" }),
          description: new fields.StringField({ required: true, initial: "", label: "KT.Description" }),
          rules: new fields.ArrayField(new fields.ObjectField(), { initial: [] })
        }),
        { initial: [], label: "KT.Abilities" }
      ),

      /** Tactics this specialism unlocks, with their Command Point costs. */
      tactics: new fields.ArrayField(
        new fields.SchemaField({
          name: new fields.StringField({ required: true, initial: "", label: "KT.Name" }),
          cost: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1, label: "KT.CommandPointCost" }),
          level: new fields.NumberField({ required: true, integer: true, min: 0, max: 4, initial: 0, label: "KT.Level" }),
          description: new fields.StringField({ required: true, initial: "", label: "KT.Description" })
        }),
        { initial: [], label: "KT.TacticsLabel" }
      )
    };
  }

  /* -------------------------------------------- */

  prepareDerivedData() {
    this.abilityCount = this.abilities.length;
    this.tacticCount = this.tactics.length;
    // A definition with no abilities yet is scaffolding awaiting its data.
    this.isPopulated = this.abilityCount > 0;
  }

  /**
   * Which abilities a specialist may choose on reaching a level (pg 66).
   * Level 1 is granted automatically. Level 2 offers both Level 2 abilities.
   * Level 3 offers only those connected to the Level 2 ability already taken.
   * Level 4 offers anything from the tree not already chosen.
   * @param {number} level   The level being advanced to.
   * @param {string[]} taken Names of abilities the specialist already has.
   */
  availableAbilities(level, taken = []) {
    const held = new Set(taken);
    if (level <= 1) return this.abilities.filter(a => a.level === 1);
    if (level === 4) return this.abilities.filter(a => !held.has(a.name));
    if (level === 3) {
      const chosenAtTwo = this.abilities.find(a => a.level === 2 && held.has(a.name));
      return this.abilities.filter(a =>
        a.level === 3 && !held.has(a.name)
        && (!chosenAtTwo || a.parent === chosenAtTwo.name));
    }
    return this.abilities.filter(a => a.level === level && !held.has(a.name));
  }

  /** The ability every specialist of this specialism starts with. */
  get baseAbility() {
    return this.abilities.find(a => a.level === 1) ?? null;
  }

  /** Tactics unlocked at the given level. */
  availableTactics(level) {
    return this.tactics.filter(tactic => tactic.level === 0 || tactic.level <= level);
  }
}
