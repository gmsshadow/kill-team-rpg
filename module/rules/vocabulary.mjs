/**
 * The rule vocabulary.
 *
 * Abilities are written as prose in the book. To make them do work rather than
 * just remind, each is tagged with zero or more machine-readable rules. A rule
 * is deliberately small and declarative: the dice engine asks "what applies to
 * this roll?" and sums the answers, rather than every ability carrying its own
 * code.
 *
 * Bucketing the 70 specialist abilities showed roughly two-thirds fall into
 * five shapes, so the vocabulary covers those and marks the rest MANUAL. An
 * ability tagged MANUAL is not a failure - campaign effects, Command Point
 * generation and anything needing a table decision belong to the player, and
 * saying so honestly is better than half-automating it.
 *
 * SHAPES
 *   reroll        Re-roll some dice in a roll: hit, wound, save, charge,
 *                 Advance, damage, Injury, Nerve.
 *   modifier      Add to or subtract from a roll or a characteristic.
 *   autoPass      A test succeeds without rolling.
 *   ignorePenalty Cancel a specific named penalty.
 *   ignoreWound   Roll to discard a wound before it is lost.
 *   manual        Recorded, surfaced to the player, never applied.
 */

/** What a rule acts on. */
export const ROLLS = {
  hit: "KT.Roll.Hit",
  wound: "KT.Roll.Wound",
  save: "KT.Roll.Save",
  charge: "KT.Roll.Charge",
  advance: "KT.Roll.Advance",
  damage: "KT.Roll.Damage",
  injury: "KT.Roll.Injury",
  nerve: "KT.Roll.Nerve"
};

/** Characteristics a modifier can target, as opposed to a roll. */
export const CHARACTERISTICS = {
  attacks: "KT.Attacks",
  strength: "KT.Strength",
  toughness: "KT.Toughness",
  leadership: "KT.Leadership",
  save: "KT.Save",
  range: "KT.Range",
  ap: "KT.ArmourPenetration",
  weaponDamage: "KT.Damage"
};

/** Which dice in a roll a re-roll applies to. */
export const REROLL_WHEN = {
  ones: "KT.Reroll.Ones",
  failed: "KT.Reroll.Failed",
  all: "KT.Reroll.All"
};

/** Named penalties an ability can cancel. */
export const PENALTIES = {
  heavyMoved: "KT.Penalty.HeavyMoved",
  assaultAdvanced: "KT.Penalty.AssaultAdvanced",
  longRange: "KT.Penalty.LongRange",
  fleshWound: "KT.Penalty.FleshWound",
  obscured: "KT.Penalty.Obscured",
  leadership: "KT.Penalty.Leadership",
  apMinusOne: "KT.Penalty.ApMinusOne",
  dangerousTerrain: "KT.Penalty.DangerousTerrain"
};

/** When a rule is live. */
export const PHASES = {
  any: "KT.Phase.Any",
  movement: "KT.Phase.Movement",
  shooting: "KT.Phase.Shooting",
  fight: "KT.Phase.Fight",
  morale: "KT.Phase.Morale"
};

/** Who a rule reaches. */
export const SCOPES = {
  self: "KT.Scope.Self",
  friendly: "KT.Scope.Friendly",
  enemy: "KT.Scope.Enemy"
};

/**
 * Extra conditions, checked against the roll context. Anything not listed here
 * cannot be checked automatically, and an ability needing one should be MANUAL.
 */
export const CONDITIONS = {
  notShaken: "KT.Condition.NotShaken",
  readied: "KT.Condition.Readied",
  charged: "KT.Condition.Charged",
  targetObscured: "KT.Condition.TargetObscured",
  overwatch: "KT.Condition.Overwatch",
  autoHitWeapon: "KT.Condition.AutoHitWeapon",
  grenadeWeapon: "KT.Condition.GrenadeWeapon",
  randomDamage: "KT.Condition.RandomDamage",
  noFactionInCommon: "KT.Condition.NoFactionInCommon"
};

/* -------------------------------------------- */
/*  Constructors                                */
/* -------------------------------------------- */

/**
 * Every constructor returns the same flat shape, so the engine never has to
 * branch on where a rule came from.
 * @returns {object}
 */
function rule(type, data = {}) {
  return {
    type,
    roll: null,
    characteristic: null,
    when: null,
    value: 0,
    penalty: null,
    phase: "any",
    scope: "self",
    range: null,
    condition: null,
    note: "",
    ...data
  };
}

export const reroll = (roll, when = "ones", opts = {}) => rule("reroll", { roll, when, ...opts });
export const modifier = (roll, value, opts = {}) => rule("modifier", { roll, value, ...opts });
export const characteristic = (name, value, opts = {}) =>
  rule("modifier", { characteristic: name, value, ...opts });
export const autoPass = (roll, opts = {}) => rule("autoPass", { roll, ...opts });
export const ignorePenalty = (penalty, opts = {}) => rule("ignorePenalty", { penalty, ...opts });
export const ignoreWound = (on, opts = {}) => rule("ignoreWound", { value: on, ...opts });
export const manual = (note) => rule("manual", { note });

/* -------------------------------------------- */
/*  Querying                                     */
/* -------------------------------------------- */

/**
 * Collect every rule an actor currently has from its items, skipping inactive
 * ones. Datasheet abilities, specialist abilities and wargear all contribute
 * through the same path.
 * @param {Actor} actor
 * @returns {object[]}
 */
export function collectRules(actor) {
  const rules = [];
  for (const item of actor?.items ?? []) {
    if (item.system?.active === false) continue;
    for (const r of item.system?.rules ?? []) rules.push({ ...r, source: item.name });
  }
  return rules;
}

/**
 * Filter rules down to those that apply to a roll.
 * @param {object[]} rules
 * @param {object} context  { type, roll, phase, conditions: string[] }
 */
export function rulesFor(rules, { type, roll, characteristic: char = null, phase = "any", conditions = [] }) {
  const active = new Set(conditions);
  return rules.filter(r => {
    if (r.type !== type) return false;
    if (roll && r.roll !== roll) return false;
    if (char && r.characteristic !== char) return false;
    if (!roll && !char && r.roll) return false;
    // A rule tied to a phase only fires in that phase.
    if (r.phase !== "any" && phase !== "any" && r.phase !== phase) return false;
    // Auras and conditionals are only applied when the caller confirms them.
    // An aura's condition was already checked against the model projecting it,
    // so re-checking it against the recipient would wrongly discard it.
    if (r.condition && !r.fromAura && !active.has(r.condition)) return false;
    return true;
  });
}

/** Sum the values of every modifier that applies. */
export function totalModifier(rules, context) {
  return rulesFor(rules, { ...context, type: "modifier" })
    .reduce((total, r) => total + (r.value ?? 0), 0);
}

/** The strongest re-roll available for a roll: all beats failed beats ones. */
export function bestReroll(rules, context) {
  const matches = rulesFor(rules, { ...context, type: "reroll" });
  if (!matches.length) return null;
  const order = { all: 3, failed: 2, ones: 1 };
  return matches.reduce((best, r) => (order[r.when] > order[best.when] ? r : best));
}

/** True if any rule cancels the named penalty. */
export function cancels(rules, penalty, conditions = []) {
  return rulesFor(rules, { type: "ignorePenalty", conditions })
    .some(r => r.penalty === penalty);
}

/** True if a test is automatically passed. */
export function passesAutomatically(rules, roll, conditions = []) {
  return rulesFor(rules, { type: "autoPass", roll, conditions }).length > 0;
}
