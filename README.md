# Kill Team 2018 — a lightweight RPG system for Foundry VTT

A bare-bones Foundry VTT game system built on the **Warhammer 40,000: Kill Team (2018)** core rules,
designed as the foundation for a fuller roleplaying system (character creation, extra abilities from
other Warhammer sources) that will be layered on later.

- **System id:** `kill-team-rpg`
- **Version:** 0.14.1
- **Foundry:** v14 (ApplicationV2 sheets, `TypeDataModel` schemas, `documentTypes` in `system.json`).
  Minimum v13.

## Compendium packs

`packs/_source/` holds readable JSON, one file per entry, and is the thing to edit.
`packs/factions/` and `packs/weapons/` are the compiled LevelDB databases Foundry actually reads.

Both are committed, because the usual way to run this is to clone the repo into
`Data/systems/kill-team-rpg`. If the compiled packs are absent, Foundry still registers each pack
from `system.json` and LevelDB quietly creates an empty database in its place: the compendium
opens and lists nothing, with no error in the console. The giveaway is a pack directory with no
`.ldb` file in it.

After editing anything under `packs/_source/`, or the data files in `module/helpers/`, rebuild
and commit both:

```
npm install --no-save @foundryvtt/foundryvtt-cli
node tools/build-packs.mjs
```

## What's in v0.14.1

### Documents

| Document | Subtype | Purpose |
| --- | --- | --- |
| Actor | `operative` | One model. The sheet reproduces the printed datacard. |
| Actor | `killteam` | Command roster: campaign resources, force total, member list. |
| Item | `weapon` | A weapon profile — Range, Type, S, AP, D, Abilities. |
| Item | `ability` | A named special rule, specialism ability or Tactic. |
| Item | `wargear` | Non-weapon equipment with a points cost. |
| Item | `specialism` | A specialism track, so a level and its chosen abilities can be recorded. |

### The operative sheet

The card portion follows the layout of the blank datacard: points in the top right, the
`NAME M WS BS S T W A Ld Sv` profile bar, the weapon table, an abilities box, specialism and
demeanour, and the experience / flesh wound / convalescence / new recruit boxes. Experience boxes
at positions 3, 7 and 12 are drawn with the orange level-up outline. Click a box to set the track
to that value; click the box you're already on to step back one.

Below the card sits a play area that isn't part of the printed card: current wounds, the round
state toggles (Readied, Advanced, Charged, Fell Back, Retreated, Shaken, Broken, Out of Action), roll buttons
and wargear.

### Implemented mechanics

- **Attack sequence.** Click a weapon name to open the attack dialog, then hit rolls, wound rolls
  and saving throws resolve in one chat card. Unmodified 1s always fail and unmodified 6s always
  succeed on hit and wound rolls; unmodified 1s always fail saves. Overwatch needs natural 6s.
- **Hit modifiers.** Long range, obscured, intervening terrain, moving with a Heavy weapon and
  Advancing with an Assault weapon are all offered in the dialog. Flesh wounds and a broken kill
  team are applied automatically from the operative's own state.
- **Rapid Fire** doubles the attacks when you tick "all targets within half range".
- **Weapon Strength** accepts a flat number, `User`, `+1` or `x2` and resolves against the wielder.
- **Wound table** as printed: 2+ at double Toughness, 3+ above, 4+ equal, 5+ below, 6+ at half or less.
- **Saving throws** apply Armour Penetration to the die, and take an invulnerable save instead
  when it needs a lower roll — invulnerable saves ignore AP. An unmodified 1 always fails.
- **Injury rolls** roll one die per point of Damage and take the highest, add flesh wounds, and 4+
  takes the model out of action. The result is written back to the operative.
- **Nerve tests** roll against Leadership, always pass on an unmodified 1, and mark the model shaken.
- **Advance** and **charge** rolls, and a 2D6 initiative roll on the roster sheet.
- **Combat tracker** initiative is set to 2D6.

### Not yet implemented

Psychic phase beyond a bare psychic test helper, Command Points and Tactics spending, mission and
killzone rules, campaign resource bookkeeping after a mission, and compendium content. These are
the natural next increments.

## Installation

1. Copy this folder into `Data/systems/kill-team-rpg` in your Foundry user data directory, or
   install from the manifest URL.
2. Create a world using the **Kill Team 2018** system.

## Sample data

`docs/sample-data/create-sample-data.js` is a script macro that builds a Space Marine Intercessor
with a bolt rifle and bolt pistol, plus the ranged weapon profiles shown in the reference images.
Paste it into a new Script macro and run it. Points costs are left at 0 — fill them in from your
book, since the points tables weren't part of the source images used to build this.

## Documentation

See `docs/` for the implementation reference that maps each rule to the code that implements it.

## Licence

This system is unofficial fan-made software. Warhammer 40,000, Kill Team and all associated names,
marks and rules text are © Games Workshop Limited. No Games Workshop content is redistributed with
this system — you need your own copy of the rulebook to play. See `LICENSE.md`.
