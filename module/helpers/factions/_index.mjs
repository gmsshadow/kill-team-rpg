/**
 * Every playable faction, collected for the pack build.
 *
 * Generated alongside the faction files by tools/import_catalogue.py. Excluded:
 *   space-marines          - a shared library the Astartes, Deathwatch and
 *                            Sororitas catalogues draw from, not a kill team
 *   unaligned              - scenario NPCs with no points or specialisms
 *   exodite-dragon-masters - empty in the source catalogue
 */

import { ADEPTA_SORORITAS_ITEMS, ADEPTA_SORORITAS_MODEL_ITEMS } from "./adepta-sororitas.mjs";
import { ADEPTUS_ASTARTES_ITEMS, ADEPTUS_ASTARTES_MODEL_ITEMS } from "./adeptus-astartes.mjs";
import { ADEPTUS_CUSTODES_ITEMS, ADEPTUS_CUSTODES_MODEL_ITEMS } from "./adeptus-custodes.mjs";
import { ADEPTUS_MECHANICUS_ITEMS, ADEPTUS_MECHANICUS_MODEL_ITEMS } from "./adeptus-mechanicus.mjs";
import { ASTRA_MILITARUM_ITEMS, ASTRA_MILITARUM_MODEL_ITEMS } from "./astra-militarum.mjs";
import { ASURYANI_ITEMS, ASURYANI_MODEL_ITEMS } from "./asuryani.mjs";
import { CHAOS_DAEMONS_ITEMS, CHAOS_DAEMONS_MODEL_ITEMS } from "./chaos-daemons.mjs";
import { DEATH_GUARD_ITEMS, DEATH_GUARD_MODEL_ITEMS } from "./death-guard.mjs";
import { DEATHWATCH_ITEMS, DEATHWATCH_MODEL_ITEMS } from "./deathwatch.mjs";
import { DRUKHARI_ITEMS, DRUKHARI_MODEL_ITEMS } from "./drukhari.mjs";
import { ELUCIDIAN_STARSTRIDERS_ITEMS, ELUCIDIAN_STARSTRIDERS_MODEL_ITEMS } from "./elucidian-starstriders.mjs";
import { GELLERPOX_INFECTED_ITEMS, GELLERPOX_INFECTED_MODEL_ITEMS } from "./gellerpox-infected.mjs";
import { GENESTEALER_CULTS_ITEMS, GENESTEALER_CULTS_MODEL_ITEMS } from "./genestealer-cults.mjs";
import { GREY_KNIGHTS_ITEMS, GREY_KNIGHTS_MODEL_ITEMS } from "./grey-knights.mjs";
import { HARLEQUINS_ITEMS, HARLEQUINS_MODEL_ITEMS } from "./harlequins.mjs";
import { HERETIC_ASTARTES_ITEMS, HERETIC_ASTARTES_MODEL_ITEMS } from "./heretic-astartes.mjs";
import { KROOT_ITEMS, KROOT_MODEL_ITEMS } from "./kroot.mjs";
import { NECRONS_ITEMS, NECRONS_MODEL_ITEMS } from "./necrons.mjs";
import { ORKS_ITEMS, ORKS_MODEL_ITEMS } from "./orks.mjs";
import { SERVANTS_OF_THE_ABYSS_ITEMS, SERVANTS_OF_THE_ABYSS_MODEL_ITEMS } from "./servants-of-the-abyss.mjs";
import { SISTERS_OF_SILENCE_ITEMS, SISTERS_OF_SILENCE_MODEL_ITEMS } from "./sisters-of-silence.mjs";
import { T_AU_EMPIRE_ITEMS, T_AU_EMPIRE_MODEL_ITEMS } from "./t-au-empire.mjs";
import { THOUSAND_SONS_ITEMS, THOUSAND_SONS_MODEL_ITEMS } from "./thousand-sons.mjs";
import { TYRANIDS_ITEMS, TYRANIDS_MODEL_ITEMS } from "./tyranids.mjs";

export const ALL_FACTION_ITEMS = [
  ...ADEPTA_SORORITAS_ITEMS,
  ...ADEPTUS_ASTARTES_ITEMS,
  ...ADEPTUS_CUSTODES_ITEMS,
  ...ADEPTUS_MECHANICUS_ITEMS,
  ...ASTRA_MILITARUM_ITEMS,
  ...ASURYANI_ITEMS,
  ...CHAOS_DAEMONS_ITEMS,
  ...DEATH_GUARD_ITEMS,
  ...DEATHWATCH_ITEMS,
  ...DRUKHARI_ITEMS,
  ...ELUCIDIAN_STARSTRIDERS_ITEMS,
  ...GELLERPOX_INFECTED_ITEMS,
  ...GENESTEALER_CULTS_ITEMS,
  ...GREY_KNIGHTS_ITEMS,
  ...HARLEQUINS_ITEMS,
  ...HERETIC_ASTARTES_ITEMS,
  ...KROOT_ITEMS,
  ...NECRONS_ITEMS,
  ...ORKS_ITEMS,
  ...SERVANTS_OF_THE_ABYSS_ITEMS,
  ...SISTERS_OF_SILENCE_ITEMS,
  ...T_AU_EMPIRE_ITEMS,
  ...THOUSAND_SONS_ITEMS,
  ...TYRANIDS_ITEMS,
];

export const ALL_FACTION_MODELS = [
  ...ADEPTA_SORORITAS_MODEL_ITEMS,
  ...ADEPTUS_ASTARTES_MODEL_ITEMS,
  ...ADEPTUS_CUSTODES_MODEL_ITEMS,
  ...ADEPTUS_MECHANICUS_MODEL_ITEMS,
  ...ASTRA_MILITARUM_MODEL_ITEMS,
  ...ASURYANI_MODEL_ITEMS,
  ...CHAOS_DAEMONS_MODEL_ITEMS,
  ...DEATH_GUARD_MODEL_ITEMS,
  ...DEATHWATCH_MODEL_ITEMS,
  ...DRUKHARI_MODEL_ITEMS,
  ...ELUCIDIAN_STARSTRIDERS_MODEL_ITEMS,
  ...GELLERPOX_INFECTED_MODEL_ITEMS,
  ...GENESTEALER_CULTS_MODEL_ITEMS,
  ...GREY_KNIGHTS_MODEL_ITEMS,
  ...HARLEQUINS_MODEL_ITEMS,
  ...HERETIC_ASTARTES_MODEL_ITEMS,
  ...KROOT_MODEL_ITEMS,
  ...NECRONS_MODEL_ITEMS,
  ...ORKS_MODEL_ITEMS,
  ...SERVANTS_OF_THE_ABYSS_MODEL_ITEMS,
  ...SISTERS_OF_SILENCE_MODEL_ITEMS,
  ...T_AU_EMPIRE_MODEL_ITEMS,
  ...THOUSAND_SONS_MODEL_ITEMS,
  ...TYRANIDS_MODEL_ITEMS,
];
