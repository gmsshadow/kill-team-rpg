const fields = foundry.data.fields;

/**
 * A Faction.
 *
 * Every model in a kill team must share a Faction keyword (pg 62), so the
 * keyword is the load-bearing field here — the rest is reference material.
 * Factions are Items so they can live in a compendium and be dragged onto
 * an operative or a roster, which is the same pattern weapons and wargear
 * will use.
 */
export default class FactionData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      /**
       * The Faction keyword exactly as printed on a datasheet, e.g.
       * "ADEPTUS ASTARTES". This is what gets written to an operative and
       * what the Battle-forged check compares.
       */
      keyword: new fields.StringField({
        required: true, initial: "", label: "KT.FactionKeyword"
      }),

      /**
       * A broader keyword this faction sits inside, where one exists. Death
       * Guard models are also HERETIC ASTARTES, Deathwatch are also ADEPTUS
       * ASTARTES. Blank where the faction stands alone.
       */
      parentKeyword: new fields.StringField({
        required: true, initial: "", label: "KT.ParentKeyword"
      }),

      /** Loose grouping for sorting and filtering, not a rules term. */
      allegiance: new fields.StringField({
        required: true, initial: "xenos",
        choices: {
          imperium: "KT.Allegiance.Imperium",
          chaos: "KT.Allegiance.Chaos",
          xenos: "KT.Allegiance.Xenos"
        },
        label: "KT.Allegiance"
      }),

      /**
       * Keywords every model in this faction carries, beyond the Faction
       * keyword itself. Comma separated, matching the operative field.
       */
      commonKeywords: new fields.StringField({
        required: true, initial: "", label: "KT.CommonKeywords"
      }),

      /** Page in the core book, kept as a traceability anchor. */
      page: new fields.NumberField({
        required: true, integer: true, min: 0, initial: 0, nullable: false, label: "KT.Page"
      }),

      description: new fields.HTMLField({ required: true, initial: "", label: "KT.Description" })
    };
  }

  /* -------------------------------------------- */

  prepareDerivedData() {
    // The full keyword line an operative of this faction would carry.
    const parts = [this.parentKeyword, this.keyword, this.commonKeywords]
      .flatMap(part => (part ?? "").split(","))
      .map(part => part.trim())
      .filter(Boolean);
    this.keywordLine = [...new Set(parts)].join(", ");
  }

  /**
   * The update payload for applying this faction to an operative or a kill
   * team. Existing keywords on the target are preserved and merged.
   * @param {Actor} actor
   * @returns {object}
   */
  toActorUpdate(actor) {
    const update = { "system.faction": this.keyword };
    if (actor.type !== "operative") return update;

    const existing = (actor.system.keywords ?? "")
      .split(",").map(k => k.trim()).filter(Boolean);
    const incoming = this.keywordLine.split(",").map(k => k.trim()).filter(Boolean);
    // Case-insensitive merge, keeping whatever spelling is already there.
    const seen = new Map(existing.map(k => [k.toLowerCase(), k]));
    for (const keyword of incoming) {
      if (!seen.has(keyword.toLowerCase())) seen.set(keyword.toLowerCase(), keyword);
    }
    update["system.keywords"] = [...seen.values()].join(", ");
    return update;
  }
}
