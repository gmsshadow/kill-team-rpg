# Changelog

All notable changes to this system are documented here. This project uses semantic versioning;
bump the patch number in `system.json` on every rebuild.

## 0.18.0

The battle round (pg 20), as a tracker rather than a warden.

### Added
- **Team initiative.** Kill Team rolls off once per side at the start of a round and applies that
  order to every phase, where Foundry's tracker assumes one initiative per combatant. Rolling
  initiative now rolls 2D6 once per token disposition and gives every model on that side the same
  result, so the tracker orders sides rather than individuals. Ties are re-rolled, since the order
  must be definite.
- **A phase bar in the combat tracker**, stepping through Initiative, Movement, Psychic, Shooting,
  Fight and Morale, announcing each in chat. Stepping past Morale begins the next round. It is
  injected on render rather than replacing the tracker template, so a Foundry change to the tracker
  cannot break the system.
- **A new round clears the statuses that only lasted the last one**: Readied, Advanced, Charged,
  Fell Back and Retreated. Shaken is deliberately not cleared here, because it is removed during
  the Morale phase - clearing it in both places would let a model shrug off a failed Nerve test.

### Deliberately not done
- **No enforcement.** The tracker will not stop a model shooting after it Advanced, or charging
  twice. Kill Team has enough exceptions - Assault weapons, FLY, Pistols in melee, Overwatch - that
  a system policing them is wrong at the worst moment. The state is tracked and shown; the table
  decides.

## 0.17.0

The Morale phase (pg 36), played from one button on the roster.

### Added
- **Broken check.** Every model compromised breaks the team outright; more than half rolls 2D6
  against the highest Leadership among the models still standing. Exactly half does not test, which
  is the easy mistake. Once broken, the team stays broken.
- **Shaken tokens are removed before Nerve tests**, in the printed order. Doing it the other way
  round would leave models shaken permanently, since a model shaken this round would never recover.
- **Nerve tests** for every model with a flesh wound, and every model if the team is broken. The
  result fails when it exceeds Leadership, an unmodified 1 always passes, and the modifiers are
  applied: +1 for each other friendly model shaken or out of action, -1 for each other friendly
  model within 2".
- The 2" support modifier is **measured from the canvas**. Models with no token are skipped rather
  than guessed at, and the card says which.
- The whole phase runs through the existing rules engine, so Bold and Fanatical pass automatically,
  And They Shall Know No Fear re-rolls a failure, and the auras added in 0.15.0 apply: Seen It All
  subtracts 1 for friends within 3", Tyrant adds 1 for enemies within 6".

### Fixed
- `KT.Morale` was a value and became a namespace, which would have broken every string in the
  system. Caught by the localisation validator before shipping, and renamed to `KT.MoraleResource`.

## 0.16.0

Damage is applied properly (pg 31-33). This corrects a rules error, not just a missing feature.

### Fixed
- **A failed save went straight to an Injury roll, skipping damage entirely.** The rules reduce
  wounds by the weapon's Damage, and an Injury roll is made only when a model reaches 0 wounds. A
  two-wound Intercessor taking one point now drops to one wound with no Injury roll, where before
  it faced one immediately. The error was invisible on one-wound models, so it would have played
  correctly for Necrons and wrongly for Astartes in the same game.
- **Further attacks against a model already reduced to 0 wounds are no longer resolved** (pg 32).
  Damage is allocated one failed save at a time, and the card reports how many attacks went
  unresolved.
- **The Injury roll used a fresh roll of a random Damage characteristic.** Where a weapon does D6
  damage, the Injury dice are the value actually rolled when inflicting it (pg 33) - a D6 that
  rolled 2 gives 2 Injury dice, not a new D6. An explicit count is now carried through.

### Added
- An **Apply damage** button on the attack card, which subtracts the wounds, reports what is left,
  and rolls the Injury only if the model reached 0. It checks ownership first and asks the GM
  rather than failing silently, since an attacking player will not usually own the target.

### Verified
- Allocation tested against the worked example on pg 33: a three-wound model failing one save
  against a Damage 3 weapon is reduced to 0 and rolls three Injury dice. Also checked across
  one-wound and two-wound models, and for random damage where the second of two hits took the last
  wound - the Injury dice follow that hit's value.

## 0.15.1

### Added
- **The close combat weapon every model is assumed to carry** (pg 34): Melee, S User, AP 0, D 1.
  It appears on every datacard below the listed weapons and can be attacked with directly.

  It is derived rather than added as an item, so it cannot be deleted, costs no points, and is
  present on an operative that has no weapons at all - which was previously left with nothing to
  fight with. Rolling it builds an unsaved weapon document, so the whole attack sequence, including
  ability rules and re-rolls, applies to it unchanged and nothing is left behind on the actor.

  Strength resolves from the wielder, so a Marine swings at S4 and a Flayed One at S4, while a
  Commander with S5 gets S5 without any special handling.

## 0.15.0

Range and visibility are measured from the canvas.

### Added
- **`module/helpers/measure.mjs`.** Distances are measured base to base, as the book does (pg 16),
  by subtracting both tokens' radii from the centre-to-centre distance. On a 1 inch grid that is
  worth half an inch or more, which is often the difference between half range and long range.
- **The attack dialog pre-fills itself.** Long range, obscured and the Rapid Fire half-range box
  are ticked from the tokens' positions, and the measured distance is shown. Out of range and no
  line of sight are called out in red rather than silently ignored - the roll is still allowed,
  since the table may know better than the canvas.
- **Obscured is derived from line of sight**, casting rays at the target's centre and the four
  points of its base: all clear is visible, all blocked is no line of sight, anything between is
  obscured (pg 30).
- **Auras now work.** Rules with a scope and a range are collected from other models on the
  battlefield, so Inspiring, Paragon, Vox Ghost and the rest finally reach their targets. Recorded
  since 0.11.0, inert until now.
- **New scenes default to 1 inch per square at 100 pixels**, configurable, so canvas distances
  match printed weapon ranges without the GM setting anything up.
- Two settings: automatic measurement can be turned off to go back to ticking boxes by hand, and
  the default grid size is adjustable.

### Notes
- An aura's condition is checked against the model projecting it, not the recipient: a shaken
  Leader stops inspiring, but the recipient being shaken is irrelevant.
- Everything degrades safely. With no canvas, no token or no target, measurement returns nothing
  and the dialog behaves as it did before.

## 0.14.3

### Fixed
- **Re-rolls happened silently.** The card showed only the final dice, so a re-roll was invisible
  apart from the line naming the ability. The discarded result is now shown struck through beside
  its replacement, which is outlined, so the card records what actually happened.
- **The re-rolled dice were not attached to the message.** Only the original Roll was, so Dice So
  Nice animated dice that no longer matched the card and the message's roll data disagreed with
  what was displayed. Every re-roll Roll is now included.

### Verified
- Re-roll semantics tested deterministically rather than waiting on a 1 at the table: a die is
  replaced once and only once, so a re-rolled 1 that comes up 1 again stays a 1 (pg 20). Dice not
  eligible for the re-roll are left untouched, and re-rolling failures leaves successes alone.

## 0.14.2

### Added
- `docs/sample-data/test-bench.js`, a macro that builds three operatives from the compendiums to
  exercise the parts of the system never confirmed in Foundry: a Level 3 Sniper carrying Marksman
  and Sharpshooter for the rules engine, a Tactical Sergeant with plasma weapons, and a Necron
  Warrior to shoot at. It reports what to look for and can be re-run safely.

### Known regression
- **Multi-profile weapons are no longer present in the data.** The catalogue splits them into
  separate entries - "Plasma gun - standard" and "Plasma gun - supercharge" rather than one weapon
  with two profiles - so the profile chooser added in 0.6.0 now has nothing to act on. The feature
  and its schema remain; the importer would need to recombine entries sharing a stem, and the
  combi-weapon rule that firing both profiles costs -1 to hit is currently unrepresented.

## 0.14.1

### Fixed
- **The system could not be installed or updated through Foundry.** The `download` URL pointed at
  the `main` branch archive, and GitHub nests branch archives inside a `<repo>-<branch>/` folder,
  so Foundry unpacked it, found no `system.json` at the root and reported that the package did not
  contain the expected manifest. `download` now points at a release asset.
- Added `.github/workflows/release.yml`, which builds a correctly-rooted zip on a version tag,
  checks the tag matches `system.json`, runs the localisation validator, verifies the manifest is
  at the archive root before publishing, and attaches both the zip and `system.json` to the release.

## 0.14.0

All 24 playable factions imported: 414 models and 735 weapons.

### Added
- Every faction from the New Recruit catalogues, each in its own compendium folder, with
  characteristics, points, Max, keywords, wargear options, allowed specialisms and weapon profiles.
- `module/helpers/factions/_index.mjs` collects the playable factions for the build.

### Fixed
- **Models with a linked profile were dropped silently.** Many models carry no inline profile and
  reference a shared one by infoLink. Requiring an inline profile discarded them without warning -
  Thousand Sons imported 10 models where the catalogue holds 11, and Grey Knights 9 where it holds
  12. Profiles are now resolved by id.
- **The specialism group is named both "Specialism" and "Specialisms".** Matching only the singular
  stripped specialisms from whole factions: Thousand Sons lost 7 of 10, Astra Militarum 12 of 24,
  Heretic Astartes 9 of 22. Both spellings are matched now.
- **Compendium documents were being lost to id collisions.** `stableId` seeded from the first
  8 characters of a key, which are identical for every model, leaving only 8 characters of real
  entropy. It now hashes the whole key twice with different offsets.
- **Source filenames collided across factions.** Every faction wrote `captain.json`, so one
  faction's Captain overwrote another's before compilation - 49 models never reached the pack.
  Filenames are namespaced by faction, and the built count now matches the source exactly.

### Notes
- Excluded: `Space Marines` is a shared library the Astartes, Deathwatch and Sororitas catalogues
  draw from rather than a kill team; `Unaligned` holds scenario NPCs with no points; `Exodite
  Dragon Masters` is empty in the source.
- Two weapons are lost to same-name duplicates within a single faction, 735 built from 737.
- Models without specialisms are usually correct rather than missing: T'au Drones, turrets and
  named characters cannot take one.

## 0.13.0

### Added
- **Cross-catalogue resolution in the importer.** Adeptus Astartes, Deathwatch and Adepta
  Sororitas hold only a faction overlay for their models - which may be taken, and what
  specialisms they get - while the characteristics, weapons and points live in Space Marines.cat,
  referenced by id. The importer now follows the catalogue link, merges the linked profile under
  the local overlay, and searches both files for weapon and ability profiles.
- **Adeptus Astartes re-imported: 51 models and 84 weapons**, up from 11 and 33. Includes the
  Primaris range and 13 Commanders, every model with its allowed specialisms.

### Changed
- The hand-transcribed Astartes and Necron data files are removed. Faction data now has a single
  source, and re-importing is a one-line command per faction.
- Expansion-era stats apply throughout: the Tactical Marine is W2 at 14 points where the 2018 book
  printed W1 at 12.

### Fixed
- Model specialisms are no longer constrained to the ten core specialisms. The Commanders and
  Elites expansions add their own, and a fixed choice list would have made every imported
  Commander fail validation and vanish from the compendium.

### Verified
- Necron Dynasty is a self-contained sub-faction picker with no profiles or points, so nothing was
  hidden there. Only three of the 27 catalogues link out, all to Space Marines.

## 0.12.0

Faction data now comes from the New Recruit catalogues rather than hand transcription.

### Added
- **`tools/import_catalogue.py`**, which reads a BattleScribe `.cat` file and writes a generated
  faction data file. Models, characteristics, Max, points, keywords, wargear options, allowed
  specialisms and weapon profiles all import; ability text imports as prose.
- **Necrons re-imported from the catalogue**, replacing the hand transcription. 13 models and 26
  weapons, up from 4 and 5, now including Lychguard, Triarch Praetorian and seven Commanders.
- **`module/rules/faction-rules.mjs`** tags faction abilities by name, applied at build time. The
  imported files are generated and overwritten, so keeping the rules work outside them means
  re-importing never destroys it.
- The importer resolves specialisms through catalogue-level entry links and shared groups, not
  just inline ones, and flags Commanders by their expansion-only specialisms.

### Changed
- **The catalogue is a later data vintage than the 2018 core manual and now wins.** The Immortal
  is T5 A2 at 17 points where the book printed T4 A1 at 16; the Deathmark is BS2+ T5 at 16 where
  the book printed BS3+ T4 at 15. Both reflect errata and the Elites expansion.

### Known gaps
- The catalogue splits the Space Marines across two files. `Adeptus Astartes.cat` holds the
  2018-era Scouts and Tactical Marines with their specialisms; `Space Marines.cat` holds the
  Primaris models but assigns specialisms only to its 14 Commanders, leaving 30 models without.
  The hand-transcribed Astartes datasheets are therefore still in use, pending a decision on
  which list to follow.
- Ankra the Colossus imports with no specialisms; the catalogue records none.

## 0.11.0

The rules engine. Abilities now change dice rolls instead of only describing them.

### Added
- **A rule vocabulary** (`module/rules/vocabulary.mjs`). Bucketing the 70 specialist abilities
  showed most collapse into five shapes: re-roll, modifier, auto-pass, ignore-penalty and
  ignore-wound. A rule is declarative data, so the engine asks what applies to a roll rather than
  each ability carrying its own code.
- **All 70 specialist abilities tagged** (`module/rules/specialist-rules.mjs`). 45 are automated;
  25 are marked MANUAL and surfaced to the player. Campaign effects, Command Point generation and
  anything needing a judgement call are deliberately left alone - half-automating those is worse
  than not automating them, because the player stops checking.
- **The attack sequence consumes rules.** Hit and wound rolls pick up modifiers and re-rolls,
  named penalties can be cancelled, and conditions are checked against the roll: Sharpshooter only
  applies while Readied, Marksman only in the Shooting phase, Puritan only against a target with
  no Faction keyword in common.
- **Re-rolls follow the rule that a die may be re-rolled only once** (pg 20), so eligible dice are
  replaced in a single pass rather than rolled until they succeed. Where several re-rolls apply,
  the strongest wins: all beats failed beats ones.
- **The chat card lists what fired**, so a result can be checked rather than taken on trust.
- **Faction abilities use the same vocabulary.** And They Shall Know No Fear is a Nerve test
  re-roll, Transhuman Physiology cancels the flesh wound penalty, Terror Troops is a Leadership
  aura. All 15 model datasheets carry rules.

### Notes
- Reanimation Protocols is MANUAL by design: it inverts the meaning of an Injury roll of 6 rather
  than modifying the roll, so it does not fit the modifier shape.
- Auras (`scope: friendly`, `range: 3`) are recorded but not yet measured against the battlefield;
  they apply when the roll's conditions confirm them. Measuring distance automatically is the next
  step for those.

## 0.10.0

### Added
- **Necrons** (pg 154-156): all four datasheets, four ranged weapons and one melee weapon, in
  their own faction folders alongside the Adeptus Astartes entries. Verified against the printed
  tables.
- Every Necron shares Reanimation Protocols and Ld 10, and every one has a single wound, so the
  faction's resilience comes from Injury rolls rather than from soaking damage.
- The Flayed One is the outlier: BS 6+ and three Attacks, built for the Fight phase. It is also
  the cheapest model in the faction at 10 points.
- No Necron weapon costs points, so a Necron kill team's Force is its models alone.

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
