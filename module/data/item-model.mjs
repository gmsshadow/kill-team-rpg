const fields = foundry.data.fields;
import { KT } from "../helpers/config.mjs";

/**
 * A model datasheet, e.g. "Intercessor" or "Skitarii Ranger".
 *
 * This is the base an operative is built from: dropping one onto an operative
 * stamps its characteristics, points, faction, keywords, Max number and the
 * specialisms it is allowed to take. Everything afterwards - wargear, a
 * specialism, experience - is layered on top by the player.
 *
 * The datacard the operative fills in is a copy, not a link. Editing a
 * datasheet later does not retroactively change operatives already built from
 * it, which matches the paper game where a datacard is written out by hand.
 */
export default class ModelData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      points: new fields.NumberField({
        required: true, integer: true, min: 0, initial: 0, label: "KT.Points"
      }),

      profile: new fields.SchemaField({
        move: new fields.StringField({ required: true, initial: "6\"", label: "KT.MoveCharacteristic" }),
        ws: new fields.NumberField({ required: true, integer: true, min: 1, max: 7, initial: 4, label: "KT.WeaponSkill" }),
        bs: new fields.NumberField({ required: true, integer: true, min: 1, max: 7, initial: 4, label: "KT.BallisticSkill" }),
        strength: new fields.NumberField({ required: true, integer: true, min: 1, initial: 3, label: "KT.Strength" }),
        toughness: new fields.NumberField({ required: true, integer: true, min: 1, initial: 3, label: "KT.Toughness" }),
        wounds: new fields.NumberField({ required: true, integer: true, min: 1, initial: 1, label: "KT.Wounds" }),
        attacks: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1, label: "KT.Attacks" }),
        ld: new fields.NumberField({ required: true, integer: true, min: 1, initial: 6, label: "KT.Leadership" }),
        save: new fields.NumberField({ required: true, integer: true, min: 1, max: 7, initial: 5, label: "KT.Save" }),
        invulnerable: new fields.NumberField({
          required: false, nullable: true, integer: true, min: 1, max: 7, initial: null,
          label: "KT.Invulnerable"
        })
      }),

      /** Max number of this model in a kill team; "-" means unlimited. */
      maxNumber: new fields.StringField({ required: true, initial: "-", label: "KT.MaxNumber" }),

      faction: new fields.StringField({ required: true, initial: "", label: "KT.Faction" }),
      keywords: new fields.StringField({ required: true, initial: "", label: "KT.Keywords" }),

      /**
       * Which specialisms this model may take. A datasheet lists these, and a
       * model may only be given a specialism from its own list (pg 66).
       */
      /**
       * Specialisms this model may take, as written in the source data.
       *
       * Deliberately not constrained to KT.specialisms: the Commanders and
       * Elites expansions add their own (Fortitude, Logistics, Strategist and
       * so on), and a fixed choice list would make every imported Commander
       * fail validation and drop out of the compendium.
       */
      specialisms: new fields.ArrayField(
        new fields.StringField(), { initial: [], label: "KT.Specialisms" }
      ),

      /** Text description of the model's default wargear, as printed. */
      wargear: new fields.StringField({ required: true, initial: "", label: "KT.Wargear" }),

      /**
       * Datasheet abilities, one entry per printed paragraph. Applied to the
       * operative's ABILITIES box, matching where they sit on a datacard.
       */
      abilities: new fields.ArrayField(
        new fields.StringField(), { initial: [], label: "KT.Abilities" }
      ),

      /** Machine-readable rules for the datasheet abilities above. */
      rules: new fields.ArrayField(new fields.ObjectField(), { initial: [], label: "KT.RulesLabel" }),

      page: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0, label: "KT.Page" }),
      source: new fields.StringField({ required: true, initial: "", label: "KT.Source" }),
      description: new fields.HTMLField({ required: true, initial: "", label: "KT.Description" })
    };
  }

  /* -------------------------------------------- */

  prepareDerivedData() {
    this.specialismLabels = this.specialisms.map(key => {
      const known = KT.specialisms[key] ?? KT.specialisms[key.toLowerCase()];
      return known ? game.i18n.localize(known) : key;
    });
    const max = Number.parseInt(this.maxNumber, 10);
    this.maxCount = Number.isNaN(max) ? null : max;

    // Rendered for the operative's ABILITIES box.
    this.abilitiesHtml = this.abilities.length
      ? `<ul>${this.abilities.map(a => `<li>${a}</li>`).join("")}</ul>`
      : "";
  }

  /**
   * The update payload that applies this datasheet to an operative.
   * Wounds are set to full, since a freshly written datacard is undamaged.
   * @returns {object}
   */
  toOperativeUpdate() {
    return {
      "system.modelType": this.parent.name,
      "system.points": this.points,
      "system.maxNumber": this.maxNumber,
      "system.faction": this.faction,
      "system.keywords": this.keywords,
      "system.profile.move": this.profile.move,
      "system.profile.ws": this.profile.ws,
      "system.profile.bs": this.profile.bs,
      "system.profile.strength": this.profile.strength,
      "system.profile.toughness": this.profile.toughness,
      "system.profile.attacks": this.profile.attacks,
      "system.profile.ld": this.profile.ld,
      "system.profile.save": this.profile.save,
      "system.profile.invulnerable": this.profile.invulnerable,
      "system.wounds.max": this.profile.wounds,
      "system.wounds.value": this.profile.wounds,
      "system.abilities": this.abilitiesHtml
    };
  }
}
