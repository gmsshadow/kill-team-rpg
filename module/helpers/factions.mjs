/**
 * The sixteen factions in the Kill Team (2018) core book.
 *
 * `keyword`       - the Faction keyword as printed on datasheets, and the value
 *                   written to an operative's `system.faction`.
 * `parentKeyword` - a broader Faction keyword the models also carry, where the
 *                   book gives one (Deathwatch are also Adeptus Astartes; the
 *                   Death Guard and Thousand Sons are also Heretic Astartes).
 * `page`          - the faction's section in the core book.
 *
 * Sub-factions are deliberately kept as separate entries rather than folded
 * into their parent, because a kill team is built around one Faction keyword
 * and a Deathwatch team is not an Adeptus Astartes team.
 */
export const FACTIONS = [
  {
    key: "adeptus-astartes", name: "Adeptus Astartes", keyword: "Adeptus Astartes",
    allegiance: "imperium", page: 78, commonKeywords: "Imperium, Infantry",
    description: "The Space Marines: genetically engineered transhuman warriors, deployed in small squads where a whole company would be wasted."
  },
  {
    key: "deathwatch", name: "Deathwatch", keyword: "Deathwatch",
    parentKeyword: "Adeptus Astartes", allegiance: "imperium", page: 88,
    commonKeywords: "Imperium, Infantry",
    description: "The Chamber Militant of the Ordo Xenos, drawn from every Chapter and trained to destroy alien threats."
  },
  {
    key: "grey-knights", name: "Grey Knights", keyword: "Grey Knights",
    parentKeyword: "Adeptus Astartes", allegiance: "imperium", page: 92,
    commonKeywords: "Imperium, Infantry, Psyker",
    description: "Silver-armoured daemon hunters, every one of them a psyker, whose existence is a secret kept from the wider Imperium."
  },
  {
    key: "astra-militarum", name: "Astra Militarum", keyword: "Astra Militarum",
    allegiance: "imperium", page: 96, commonKeywords: "Imperium, Infantry",
    description: "The Imperial Guard: the hammer of the Emperor, numberless and expendable, holding the line through sheer weight of bodies."
  },
  {
    key: "adeptus-mechanicus", name: "Adeptus Mechanicus", keyword: "Adeptus Mechanicus",
    allegiance: "imperium", page: 104, commonKeywords: "Imperium, Infantry",
    description: "The Priesthood of Mars, part flesh and part machine, who venerate the Omnissiah and hoard the knowledge of the Dark Age of Technology."
  },
  {
    key: "heretic-astartes", name: "Heretic Astartes", keyword: "Heretic Astartes",
    allegiance: "chaos", page: 112, commonKeywords: "Chaos, Infantry",
    description: "The Traitor Legions and renegade warbands who turned on the Imperium during the Horus Heresy and have warred against it ever since."
  },
  {
    key: "death-guard", name: "Death Guard", keyword: "Death Guard",
    parentKeyword: "Heretic Astartes", allegiance: "chaos", page: 118,
    commonKeywords: "Chaos, Nurgle, Infantry",
    description: "Nurgle's chosen: bloated, rotting and impossibly resilient, spreading contagion wherever they walk."
  },
  {
    key: "thousand-sons", name: "Thousand Sons", keyword: "Thousand Sons",
    parentKeyword: "Heretic Astartes", allegiance: "chaos", page: 124,
    commonKeywords: "Chaos, Tzeentch, Infantry",
    description: "Sorcerers of Tzeentch and the automaton Rubricae, animated dust bound inside empty armour."
  },
  {
    key: "asuryani", name: "Asuryani", keyword: "Asuryani",
    allegiance: "xenos", page: 130, commonKeywords: "Aeldari, Infantry",
    description: "The Craftworld Aeldari, an ancient and dwindling people who walk the Path and see the consequences of every action before they take it."
  },
  {
    key: "drukhari", name: "Drukhari", keyword: "Drukhari",
    allegiance: "xenos", page: 138, commonKeywords: "Aeldari, Infantry",
    description: "The Dark Eldar of Commorragh, raiders and torturers who sustain themselves on the suffering of others."
  },
  {
    key: "harlequins", name: "Harlequins", keyword: "Harlequins",
    allegiance: "xenos", page: 146, commonKeywords: "Aeldari, Infantry",
    description: "The travelling players of the Laughing God, whose dances are both performance and lethal battle drill."
  },
  {
    key: "necrons", name: "Necrons", keyword: "Necrons",
    allegiance: "xenos", page: 150, commonKeywords: "Infantry",
    description: "An ancient race who traded flesh for living metal and slept for sixty million years, now waking to reclaim a galaxy they consider theirs."
  },
  {
    key: "orks", name: "Orks", keyword: "Orks",
    allegiance: "xenos", page: 158, commonKeywords: "Infantry",
    description: "Brutal, cunning and utterly delighted by violence, the Orks fight for the sheer joy of a good scrap."
  },
  {
    key: "tau-empire", name: "T'au Empire", keyword: "T'au Empire",
    allegiance: "xenos", page: 166, commonKeywords: "Infantry",
    description: "A young, expansionist power built on advanced technology and the doctrine of the Greater Good."
  },
  {
    key: "tyranids", name: "Tyranids", keyword: "Tyranids",
    allegiance: "xenos", page: 174, commonKeywords: "Infantry",
    description: "A hive fleet from beyond the galactic rim, an all-consuming swarm driven by a single directing intelligence."
  },
  {
    key: "genestealer-cults", name: "Genestealer Cults", keyword: "Genestealer Cults",
    allegiance: "xenos", page: 182, commonKeywords: "Infantry",
    description: "Hidden broods burrowed into Imperial worlds, awaiting the arrival of the hive fleet they unknowingly summon."
  }
];

/** Lookup of key to display name, for select fields and autocomplete. */
export const FACTION_CHOICES = Object.fromEntries(
  FACTIONS.map(faction => [faction.key, faction.name])
);
