# Changelog

All notable changes to this system are documented here. This project uses semantic versioning;
bump the patch number in `system.json` on every rebuild.

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
