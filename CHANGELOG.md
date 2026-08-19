# Changelog

All notable changes to this system are documented here. This project uses semantic versioning;
bump the patch number in `system.json` on every rebuild.

## 0.5.1

### Fixed
- **Localisation was completely broken in 0.5.0.** Every label rendered as its raw key. Foundry
  runs `expandObject` over the flat, dot-separated keys in a language file, so a key cannot be
  both a value and a namespace. `KT.Allegiance` was a string while `KT.Allegiance.Imperium` and
  its siblings needed it to be an object, expansion threw, and the entire file was discarded.
  The label is now `KT.AllegianceLabel`, matching the existing `KT.SpecialismLabel` pattern.
- `tools/check-lang.mjs` reproduces Foundry's expansion and fails the build on any collision,
  duplicate key, non-string value or missing file. This class of error is total but easy to miss,
  since the only symptom is an error in the console at startup.
- `.gitignore` excluded `*.log`, which would have dropped LevelDB write-ahead files from a
  committed pack and shipped one missing entries. Compiled packs are now excluded wholesale and
  `packs/_source` is the tracked truth. Also removed a duplicated `node_modules/` line.

## 0.5.0

Begins the Item-based structure, starting with factions.

### Added
- **Faction Item type**, carrying the Faction keyword as printed on a datasheet, an optional
  parent keyword, an allegiance grouping, the keywords models of that faction commonly share,
  and the core-book page.
- **Faction compendium** with all sixteen core-book factions, compiled to LevelDB and registered
  in a "Kill Team" compendium folder.
- Dropping a faction onto an operative sets its Faction keyword and merges the faction's keywords
  into its keyword line. The merge is case-insensitive and idempotent, so re-dropping is safe.
  Dropping one onto a kill team sets the roster's faction. Factions are applied rather than
  embedded, so there is a single source of truth for the Battle-forged check.
- `tools/build-packs.mjs`, which writes `packs/_source/factions/*.json` and compiles the pack.
  Document ids are derived from the faction key, so rebuilds update entries rather than
  duplicating them.

## 0.4.1

### Fixed
- Long field labels such as MAX PER KILL TEAM and INVULNERABLE SAVE overran their inputs. Label
  spans had a `min-width` but no `flex-shrink: 0`, so flexbox squeezed them below their own text
  while `white-space: nowrap` kept the text at full width. Labels no longer shrink, inputs get
  `min-width: 0` and give up the space instead, and the datacard meta block is now a single
  four-track grid so both label columns align and size to their widest label.
- The roster and resources grids were widened to 14rem tracks, which had the same problem on
  labels like COMMAND POINTS.

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
