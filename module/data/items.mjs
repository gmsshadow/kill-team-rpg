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
    const typeLabel = game.i18n.localize(KT.weaponTypes[this.weaponType] ?? this.weaponType);
    this.typeLine = this.isMelee ? typeLabel : `${typeLabel} ${this.attacks}`;
    this.apLabel = this.ap === 0 ? "0" : `${this.ap}`;
  }

  /**
   * Resolve this weapon's Strength against a wielder.
   * Handles "User", "+N", "-N" and "xN" notation.
   */
  resolveStrength(wielderStrength) {
    const raw = String(this.strength).trim();
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
      active: new fields.BooleanField({ initial: true, label: "KT.Active" })
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
      level: new fields.NumberField({ required: true, integer: true, min: 1, max: 4, initial: 1, label: "KT.Level" })
    };
  }
}
