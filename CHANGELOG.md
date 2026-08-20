# Changelog

All notable changes to this system are documented here. This project uses semantic versioning;
bump the patch number in `system.json` on every rebuild.

## 0.9.1

### Added
- **All eleven Adeptus Astartes datasheets completed** from pg 84-85: real characteristics, Max
  numbers, keywords, default wargear, allowed specialisms and datasheet abilities. The placeholder
  entries from 0.9.0 are gone.
- Model datasheets now carry their abilities, which are written into the operative's ABILITIES box
  when the datasheet is applied. Abilities common to every Astartes model are defined once rather
  than repeated on each entry; wargear-conditional ones (camo cloak, auspex, grapnel launcher,
  grav-chute) sit on the datasheets that can take them.

### Notes
- Sergeants correctly differ from their rank and file: +1 Attack, Ld 8, Max 1, and Leader added to
  their specialism list. Gunners have Max 2 and Heavy.
- Scouts are the outlier in the faction: Sv 4+ and a single wound, where every other Astartes model
  is 3+.

## 0.9.0

### Added
- **InSv and Max moved onto the stat line**, immediately after Sv, matching how later editions
  print them. Both are removed from the details block below, so each appears in one place only.
  An invulnerable save shows blank rather than 0 when the model has none.
- **Model Datasheet item type.** Dropping one onto an operative stamps its characteristics,
  points, faction, keywords and Max number, and sets wounds to full. It asks for confirmation
  first, since it overwrites the stat line. Wargear, specialism and experience are left alone.
  The datacard is a copy rather than a link, so editing a datasheet later does not rewrite
  operatives already built from it - the same way a paper datacard is written out by hand.
- **Model Datasheets compendium** with the eleven Adeptus Astartes entries and their points.
- **Compendium folders by faction.** The weapons and models packs are now organised into a folder
  per faction rather than one flat list, which is what will keep them usable as more factions are
  added. Verified: every item sits in its faction folder, none orphaned.
- A datasheet records which specialisms the model may take, ready for validating that an operative
  is only given a specialism its datasheet allows.

### Incomplete
- Only the Intercessor has real characteristics. The other ten Astartes datasheets are on pg 84-85,
  which has not been transcribed, so they carry correct points and Max but schema defaults for
  their profile. Each says so in its description rather than looking authoritative.

## 0.8.2

### Fixed
- **All Font Awesome icons rendered as empty boxes**, in the window header and on the edit and
  delete controls alike. The cause was the guard rule added in 0.5.2, which named an icon font
  family explicitly. Foundry sets the family and weight on the icon classes themselves, so naming
  a family that does not resolve replaces every glyph with tofu. The rule now neutralises only the
  inherited text properties and never touches the font. Scoping the button styling to
  `.window-content` was the fix the header actually needed; the extra rule was both unnecessary
  and harmful.

## 0.8.1

### Added
- **Specialist ability picker.** The ability slots on a datacard are now clickable. Choosing one
  opens a dialog listing only the abilities legal at that level: both branches at Level 2, only
  those connected to the Level 2 already taken at Level 3, and anything unchosen at Level 4. The
  Level 1 ability is granted without asking, since it is not a choice. Verified against the
  Sniper walkthrough on pg 66.
- The definition is looked up from a world Specialism item if one exists, otherwise from the
  Specialisms compendium.

### Fixed
- **Items dropped from a compendium were created twice.** Rather than rely on binding exactly one
  listener, the drop event is now tagged the first time it is handled and ignored on any repeat
  delivery, so a second handler from anywhere cannot duplicate the item. Listeners are also torn
  down with an AbortController before rebinding on each render.

## 0.8.0

The specialism ability trees, transcribed from pg 66-77.

### Added
- **All ten ability trees**: 70 abilities in total. Every tree has one Level 1 ability the
  specialist always has, two Level 2 abilities to choose between, and four Level 3 abilities, two
  hanging off each Level 2 choice. Each Level 3 ability records which Level 2 ability it connects
  to, because it may only be taken if that parent was chosen. Verified structurally: all ten trees
  are 1/2/4 with two children per branch and no orphaned parent links.
- **All 30 specialist Tactics**, three per specialism, with their levels and Command Point costs.
- `availableAbilities(level, taken)` implements the choice rules: Level 2 offers both options,
  Level 3 only those connected to the Level 2 already taken, Level 4 anything unchosen.
- **Each specialism must be unique within a kill team** (pg 66), now checked by the Battle-forged
  validator. Duplicates on the command roster remain fine.
- **Specialist points surcharge** (pg 67): +0, +4, +8 and +12 at Levels 1 to 4, included in an
  operative's Force.
- A warning when a kill team contains specialists above Level 1, since normal matched play allows
  Level 1 only.

### Fixed
- **The Level 1 ability assumption in 0.7.0 was wrong.** A specialist starts at Level 1 *with* the
  ability in that band, granted automatically rather than chosen, so the counts are now 1, 2, 3 and
  4 abilities at Levels 1 to 4 rather than 0, 1, 2 and 3.

### Note
- The connecting lines in the ability trees are drawn graphically and cannot be read from the PDF
  text layer, so each tree was transcribed from the rendered page. The Sniper tree matches the
  worked example on pg 66.

## 0.7.0

Establishes the specialist progression machinery (pg 66, 204).

### Added
- **Specialist level is derived from the experience track.** The datacard's level-up boxes at 3, 7
  and 12 drive it: 0-2 XP is Level 1, 3-6 Level 2, 7-11 Level 3, and 12 Level 4. The sheet shows
  the level as a badge and how much experience remains until the next one.
- **Level override** for one-off games where experience is not tracked. The badge is outlined in
  orange when the level is set by hand rather than earned.
- **Specialist ability slots.** A specialist shows one slot per ability it should have chosen,
  filled or empty, with a count against its allowance. Abilities beyond the allowance are flagged
  rather than removed, since losing a level should not silently delete anything.
- **Specialism Item type** built out into a real definition: an ability tree and a Tactics list,
  each entry carrying the level at which it unlocks, plus a page reference.
- **Specialisms compendium** with all ten definitions, their names, descriptions and page numbers.
- Dropping a specialism onto an operative sets its specialism, matching how factions behave.
- Ability items now carry a `specialismKey` and a `level`, so a specialist ability knows which
  tree it came from.

### Not yet present
- **The ability trees themselves are empty.** They are printed on pg 68-77, which has not been
  transcribed. Every specialism definition is in place and the progression works; filling in the
  abilities is data entry against the existing schema.
- `KT.specialistAbilitiesByLevel` in `config.mjs` assumes a specialist gains its first ability at
  Level 2, on the basis of pg 204. If pg 66 says otherwise, that is a one-line correction.

## 0.6.2

### Fixed
- Compiled compendium packs are now committed rather than gitignored. Running the system from a
  clone left `packs/factions/` and `packs/weapons/` absent, so Foundry registered both packs from
  `system.json` and LevelDB created an empty database in their place. Each compendium opened and
  listed nothing, with no error. Only the LevelDB `LOCK` and `LOG` runtime files stay ignored.
- README documents the source-then-compile workflow and the symptom, since the failure is silent.

## 0.6.1

### Fixed
- Pack documents now carry a full `_stats` block including `coreVersion` and `systemVersion`.
  Foundry compares `coreVersion` against the running core to decide whether a pack predates the
  current release; without it a pack is treated as legacy, which can leave the compendium
  listing empty.

## 0.6.0

Adds the Adeptus Astartes armoury, pg 86-87.

### Added
- **Multi-profile weapons.** A weapon may carry named sub-profiles with no statistics of its own,
  matching the printed layout. `chooseOne` covers the missile launcher and the plasma weapons;
  `chooseOneOrBoth` covers combi-weapons, where firing both applies -1 to every hit roll. Attacking
  with such a weapon asks which profile first, and firing both resolves each in turn with the
  penalty pre-applied.
- **Weapons & Wargear compendium** with all 33 Adeptus Astartes entries: 24 ranged weapons, 4 melee
  weapons and 5 pieces of wargear, with their points costs and printed abilities text.
- The datacard renders sub-profiles indented beneath their parent, as the book prints them.

### Changed
- `resolveStrength` is now static so any profile can be resolved against its wielder. Verified
  against the printed values: a power fist is x2, so S8 on a Marine; a chainsword is User, so S4.

### Known deviation
- The shock grenade prints `*` for Strength, AP and Damage. Strength keeps the asterisk, but AP is
  numeric in the schema and shows 0, and Damage is stored as 0. The weapon inflicts no damage, and
  its abilities text carries the actual rule.

## 0.5.2

### Fixed
- Window header controls rendered as empty boxes instead of their icons. Foundry puts the Font
  Awesome classes directly on the header buttons, so an unscoped `.kill-team button` rule
  outranked `.fa-solid` on specificity and replaced the icon font with the sheet's display face.
  Button styling is now scoped to `.window-content`, and a guard rule keeps the icon font on any
  element carrying an `fa-` class.

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
