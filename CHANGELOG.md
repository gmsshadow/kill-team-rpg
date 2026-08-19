# Changelog

All notable changes to this system are documented here. This project uses semantic versioning;
bump the patch number in `system.json` on every rebuild.

## 0.4.0

### Changed
- **Breaking:** the system id is now `kill-team-rpg`, matching the repository. The system must
  live in `Data/systems/kill-team-rpg`. Rename any existing install folder before launching, or
  Foundry will not find the system. Worlds created under the old id will need their `system` key
  updated in `world.json`.

## 0.3.1

### Changed
- Manifest, download and url now point at `gmsshadow/kill-team-rpg`, matching the actual
  repository. `download` uses the `main` branch archive.

## 0.3.0

Adds the Kill Teams chapter, pg 62-65.

### Added
- **Battle-forged validation** on the roster sheet (pg 62). Checks three to twenty models,
  exactly one Leader, no more than three other specialists, a shared Faction keyword, the
  100-point Force limit and the Max number per datasheet. Errors and warnings are listed
  under the roster with a valid/invalid banner.
- **Model Type** on the datacard, sitting under the operative's given name as it does on the
  printed card. The Max restriction counts models sharing a datasheet rather than a name.
- **Command Points** (pg 64). One per battle round, plus one for each full 10 points the kill
  team's Force sits below the highest Force in the battle, first round only. The sheet shows
  the first-round total before you commit, and generation posts to chat.
- `spendCommandPoints()` on the kill team model, which refuses when the pool is short.
- **Roster limit** field, twenty for matched play and twelve to start a campaign (pg 203).
- The six core **Tactics** (pg 65) in the sample-data script, as ability items with their
  printed Command Point costs.

## 0.2.0

### Added
- Invulnerable saves in the attack sequence. The dialog pre-fills from the targeted operative;
  the defender uses whichever of the armour or invulnerable save needs the lower roll, and the
  invulnerable save is never modified by Armour Penetration (pg 33). The chat card names which
  save was used.
- `Retreated` as a tracked battle-round status, the second of the two Reactions to a charge.
  Like Falling Back it blocks shooting later in the battle round, and it clears on a new round.

### Fixed
- Drag and drop on both actor sheets. The `dragDrop` sheet option is a v1 sheet feature that
  ApplicationV2 does not implement, so dropping a weapon onto a datacard silently did nothing.
  Handlers are now attached directly to the rendered element, with the root drop target bound
  once rather than once per render.
- The datacard portrait now opens the file picker (`data-action="editImage"`).

## 0.1.0

Initial bare-bones release.

### Added
- `operative` and `killteam` actor subtypes with `TypeDataModel` schemas.
- `weapon`, `ability`, `wargear` and `specialism` item subtypes.
- Operative datacard sheet (ApplicationV2) matching the printed card layout, including the
  experience track with level-up boxes at 3, 7 and 12.
- Command roster sheet with campaign resources, force total against a force limit, and a
  drag-and-drop member list.
- Full attack workflow: hit rolls, wound rolls and saving throws in a single chat card, with an
  Injury roll button that writes the result back to the injured operative.
- Nerve test, Advance, charge, initiative and psychic test helpers.
- Combat tracker initiative set to 2D6.
