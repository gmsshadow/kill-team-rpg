# Changelog

All notable changes to this system are documented here. This project uses semantic versioning;
bump the patch number in `system.json` on every rebuild.

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
