# Implementation reference

A map from the Kill Team 2018 core rules to the code that implements them, so the next increment
has a clear starting point. Page numbers refer to the Core Manual.

## Datasheets and weapons (pg 18–19)

| Characteristic | Field | Notes |
| --- | --- | --- |
| Move (M) | `system.profile.move` | Stored as a string so `2D6"` profiles work. |
| Weapon Skill (WS) | `system.profile.ws` | Stored as the number, rendered as `n+`. |
| Ballistic Skill (BS) | `system.profile.bs` | As above. |
| Strength (S) | `system.profile.strength` | |
| Toughness (T) | `system.profile.toughness` | |
| Wounds (W) | `system.wounds.max` / `.value` | `value` drives the token bar. |
| Attacks (A) | `system.profile.attacks` | Default number of close combat attacks. |
| Leadership (Ld) | `system.profile.ld` | Used by the Nerve test. |
| Save (Sv) | `system.profile.save` | Rendered as `n+`; AP is subtracted at roll time. |
| Max | `system.maxNumber` | Free text, since it is often `-`. |

Weapon Strength notation (`User`, `+1`, `x2`) is resolved in `WeaponData#resolveStrength`.
Multiplication is applied before addition, matching the modifying-characteristics sidebar.

A characteristic of `-` is not yet modelled — a model that cannot fight or shoot is currently
represented by leaving it without melee or ranged weapons.

## Battle round (pg 20)

Initiative is a 2D6 roll-off, so `CONFIG.Combat.initiative` is set to `2d6`. The `combatRound` hook
clears each operative's Readied / Advanced / Charged / Fell Back flags at the top of a new round.

## Movement phase (pg 21–25)

- **Advancing** — `dice.rollAdvance` rolls a D6, reports Move + result, and sets the Advanced flag.
  That flag then feeds the -1 Assault weapon penalty in the attack dialog.
- **Charging** — `dice.rollCharge` rolls 2D6 and sets the Charged flag.
- Readying, Falling Back and Retreating are tracked as flags only; the geometry is left to the table.

## Shooting phase (pg 28–33)

The whole sequence lives in `helpers/dice.mjs`.

1. **Hit roll** — one D6 per attack against BS (or WS in melee). Cumulative modifiers: long range,
   obscured, each flesh wound on the attacker, and a broken kill team. Unmodified 1 always fails,
   unmodified 6 always hits. Overwatch ignores all of that and needs a natural 6.
2. **Wound roll** — `KT.woundRoll(strength, toughness)` returns the target number from the wound
   table. Unmodified 1 always fails, unmodified 6 always wounds.
3. **Saving throw** — the target's Save modified by the weapon's AP. Unmodified 1 always fails.
   Invulnerable saves are stored on the operative but are not yet offered in the roll dialog.
4. **Damage and Injury roll** — the chat card offers an Injury roll button that rolls one die per
   point of Damage, takes the highest, adds the injured model's flesh wounds, and applies flesh
   wound or out of action.

Weapon types affect the roll as follows: Rapid Fire doubles attacks within half range, Heavy takes
-1 after moving, Assault takes -1 after Advancing. Grenade (one per kill team per phase) and Pistol
(fire into melee at the closest model) are recorded as types but are not enforced.

### Saving throws and invulnerable saves (pg 31, 33)

The die is modified by the weapon's Armour Penetration, which is stored as a negative number, so
the required roll is `Save - AP`. An unmodified 1 always fails. Where the target has an
invulnerable save, `resolveAttack` uses whichever of the two needs the lower roll and reports it
on the chat card; an invulnerable save is never modified by Armour Penetration, and a model with
more than one may only use one.

## Fight phase (pg 34–35)

Close combat uses the same attack workflow with the Weapon Skill and an intervening terrain
modifier. Pile in and consolidate moves are left to the table.

### Reactions (pg 23)

Both Reactions to a charge are tracked. Overwatch is a checkbox in the attack dialog that forces
an unmodified 6 to hit regardless of Ballistic Skill or modifiers. Retreat is a status toggle;
like Falling Back it prevents the model shooting later in the battle round, and both clear when a
new battle round begins. The 3" Retreat move itself is made on the table.

## Morale phase (pg 36)

`dice.rollNerve` rolls a D6, adds the modifier you enter, and fails if the total exceeds Leadership.
An unmodified 1 always passes. A failed test sets the shaken flag. The dialog reminds you of the
modifiers (+1 per friendly model shaken or out of action, -1 per other friendly model within 2").
Checking whether a kill team is broken is currently a manual toggle on the sheet.

## Choosing a kill team (pg 62)

`KillTeamData#battleForged` validates the selected operatives against every Battle-forged
restriction: three to twenty models, one and only one Leader, up to three other specialists, a
shared Faction keyword, the 100-point Force limit, and the Max number from each datasheet. Max is
counted per `system.modelType`, falling back to the actor name when that is blank, because the
restriction applies to the datasheet rather than the operative's given name. Results render under
the roster as errors and warnings; nothing is blocked, so an illegal team can still be played.

## Command Points and Tactics (pg 64–65)

`commandPointsForRound(firstRound)` returns 1, plus 1 for each full 10 points the kill team's
Force sits below the highest Force among the kill team actors in the world. The bonus applies in
the first battle round only. Both worked examples from the book hold: 19 points lower generates 2
Command Points, 20 points lower generates 3. Unused points carry over because the pool is only
ever added to.

The six core Tactics ship in the sample-data script as `ability` items of type `tactic` with their
printed costs. `spendCommandPoints()` deducts a cost and posts to chat, refusing when the pool is
short. The once-per-phase restriction is left to the table.

## Campaigns (pg 202–205)

The `killteam` actor holds Intelligence, Materiel, Morale and Territory, and flags a guerrilla
faction when any resource reaches 0 or less. Force is summed from the operatives marked as being in
the kill team and compared against the force limit (100 points, or 150 after Escalation).

Experience is twelve boxes with level-up boxes at 3, 7 and 12, matching the datacard. Casualty
rolls, fire team advances and Crack Troops cost increases are not yet automated.

## Where to extend next

- **Specialisms** — the ten specialisms are named in `config.mjs` but none of their level 1–4
  abilities or Tactics are present. This needs pg 66–77.
- **Faction datasheets** — pg 78 onwards, ideally as compendium packs built with the Foundry CLI.
- **Character creation** — with pg 66–77 in hand, a creation dialog can pick a datasheet, apply a
  specialism and roll a demeanour.
- **Compendium packs** — declare packs in `system.json` and build them with the Foundry CLI.
- **Psychic phase** — `dice.rollPsychic` exists (2D6 vs warp charge, Perils on double 1 or 6) but
  nothing on the sheet calls it yet; a `power` item type would be the natural home.
