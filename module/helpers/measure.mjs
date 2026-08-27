import { SYSTEM_ID } from "./config.mjs";

/**
 * Measuring the battlefield.
 *
 * Kill Team measures in inches, between the closest points of the models' bases
 * (pg 16). Foundry measures between token centres by default, so every distance
 * here subtracts both tokens' radii to get base-to-base. On a 1 inch grid a
 * 32mm base is roughly a quarter of a square, so ignoring it would overstate
 * every distance by half an inch or more - enough to push a target from within
 * half range to long range.
 *
 * Everything degrades safely: with no canvas, no tokens or no scene, each
 * function returns null and the caller falls back to asking the player.
 */

/* -------------------------------------------- */
/*  Distance                                     */
/* -------------------------------------------- */

/** The token's radius in grid units, for base-to-base measurement. */
function radiusInUnits(token) {
  if (!token || !canvas?.scene) return 0;
  const grid = canvas.scene.grid;
  const pixels = Math.max(token.w ?? 0, token.h ?? 0) / 2;
  return (pixels / grid.size) * grid.distance;
}

/**
 * Distance between two tokens in scene units, base to base.
 * @returns {number|null} null when it cannot be measured
 */
export function distanceBetween(a, b) {
  if (!a || !b || !canvas?.ready) return null;
  const from = a.center ?? a;
  const to = b.center ?? b;
  if (from?.x === undefined || to?.x === undefined) return null;

  let centres;
  try {
    // v12+ measures a path; older builds expose measureDistance.
    centres = canvas.grid.measurePath
      ? canvas.grid.measurePath([from, to]).distance
      : canvas.grid.measureDistance(from, to);
  } catch (err) {
    return null;
  }
  if (!Number.isFinite(centres)) return null;

  const edgeToEdge = centres - radiusInUnits(a) - radiusInUnits(b);
  return Math.max(0, Math.round(edgeToEdge * 100) / 100);
}

/* -------------------------------------------- */
/*  Visibility                                   */
/* -------------------------------------------- */

/** Test whether sight is blocked between two points. */
function blocked(origin, dest) {
  try {
    const backend = CONFIG.Canvas.polygonBackends?.sight;
    if (backend?.testCollision) {
      return backend.testCollision(origin, dest, { type: "sight", mode: "any" });
    }
    const sweep = foundry.canvas?.geometry?.ClockwiseSweepPolygon;
    if (sweep?.testCollision) {
      return sweep.testCollision(origin, dest, { type: "sight", mode: "any" });
    }
  } catch (err) {
    return false;
  }
  return false;
}

/**
 * Whether a target is obscured from an attacker (pg 30).
 *
 * The book asks whether the target is even partially hidden from the firing
 * model's best point of view. That is approximated by casting rays at the
 * target's centre and the four points of its base: all clear means visible,
 * all blocked means no line of sight at all, and anything between is obscured.
 *
 * @returns {{visible: boolean, obscured: boolean}|null}
 */
export function visibility(attacker, target) {
  if (!attacker || !target || !canvas?.ready) return null;
  const origin = attacker.center;
  const c = target.center;
  const rx = (target.w ?? 0) / 2;
  const ry = (target.h ?? 0) / 2;

  // Points are pulled slightly inside the base so a ray does not clip a wall
  // that merely touches its edge.
  const inset = 0.9;
  const points = [
    c,
    { x: c.x - rx * inset, y: c.y },
    { x: c.x + rx * inset, y: c.y },
    { x: c.x, y: c.y - ry * inset },
    { x: c.x, y: c.y + ry * inset }
  ];

  const clear = points.filter(p => !blocked(origin, p)).length;
  if (clear === 0) return { visible: false, obscured: true };
  return { visible: true, obscured: clear < points.length };
}

/* -------------------------------------------- */
/*  Auras                                        */
/* -------------------------------------------- */

/**
 * Tokens within a range of another, optionally filtered by disposition.
 * @param {Token} token
 * @param {number} range      In scene units.
 * @param {string} relation   "friendly", "enemy" or "any".
 */
export function tokensWithin(token, range, relation = "any") {
  if (!token || !canvas?.ready) return [];
  return canvas.tokens.placeables.filter(other => {
    if (other.id === token.id) return false;
    if (!other.actor) return false;
    if (relation !== "any") {
      const same = other.document.disposition === token.document.disposition;
      if (relation === "friendly" && !same) return false;
      if (relation === "enemy" && same) return false;
    }
    const d = distanceBetween(token, other);
    return d !== null && d <= range;
  });
}

/**
 * Rules reaching an actor from other models on the battlefield.
 *
 * An aura rule lives on the model that projects it, so this walks nearby tokens
 * and collects the ones whose scope and range reach the subject. Without this,
 * an ability like Inspiring sits on the Leader's sheet and never affects anyone.
 *
 * @param {Token} token       The model being rolled for.
 * @param {Function} collect  collectRules from the vocabulary module.
 * @returns {object[]}
 */
export function auraRules(token, collect) {
  if (!token || !canvas?.ready) return [];
  const out = [];
  for (const other of canvas.tokens.placeables) {
    if (!other.actor || other.id === token.id) continue;
    const sameSide = other.document.disposition === token.document.disposition;

    for (const rule of collect(other.actor)) {
      if (!rule.range || rule.scope === "self") continue;
      if (rule.scope === "friendly" && !sameSide) continue;
      if (rule.scope === "enemy" && sameSide) continue;
      // The projecting model's own state gates its aura.
      if (rule.condition === "notShaken" && other.actor.system?.status?.shaken) continue;

      const d = distanceBetween(other, token);
      if (d === null || d > rule.range) continue;
      out.push({ ...rule, source: `${other.name}: ${rule.source ?? ""}`.trim(), fromAura: true });
    }
  }
  return out;
}

/* -------------------------------------------- */

/** Whether automatic measurement is switched on. */
export function measurementEnabled() {
  try {
    return game.settings.get(SYSTEM_ID, "autoMeasure");
  } catch (err) {
    return true;
  }
}

/**
 * Everything the attack dialog can work out for itself.
 * @returns {{distance: number|null, longRange: boolean|null, obscured: boolean|null,
 *            visible: boolean|null, halfRange: boolean|null}}
 */
export function measureAttack(attackerToken, targetToken, weaponRange) {
  const blank = { distance: null, longRange: null, obscured: null, visible: null, halfRange: null };
  if (!measurementEnabled()) return blank;

  const distance = distanceBetween(attackerToken, targetToken);
  if (distance === null) return blank;

  const sight = visibility(attackerToken, targetToken);
  const range = Number.parseFloat(String(weaponRange).replace(/[^0-9.]/g, ""));
  const hasRange = Number.isFinite(range) && range > 0;

  return {
    distance,
    // Long range is more than half the weapon's Range characteristic (pg 31).
    longRange: hasRange ? distance > range / 2 : null,
    halfRange: hasRange ? distance <= range / 2 : null,
    obscured: sight ? sight.obscured : null,
    visible: sight ? sight.visible : null,
    outOfRange: hasRange ? distance > range : null
  };
}
