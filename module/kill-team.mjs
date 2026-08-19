import { KT, SYSTEM_ID } from "./helpers/config.mjs";
import * as dice from "./helpers/dice.mjs";
import OperativeData from "./data/actor-operative.mjs";
import KillTeamData from "./data/actor-killteam.mjs";
import { WeaponData, AbilityData, WargearData, SpecialismData } from "./data/items.mjs";
import FactionData from "./data/item-faction.mjs";
import { KTActor, KTItem } from "./documents/documents.mjs";
import KTOperativeSheet from "./sheets/operative-sheet.mjs";
import KTKillTeamSheet from "./sheets/killteam-sheet.mjs";
import KTItemSheet from "./sheets/item-sheet.mjs";

/* -------------------------------------------- */
/*  Initialisation                               */
/* -------------------------------------------- */

Hooks.once("init", function () {
  console.log(`${SYSTEM_ID} | Initialising Kill Team 2018`);

  CONFIG.KT = KT;
  game.killteam = { dice, documents: { KTActor, KTItem } };

  // Document classes
  CONFIG.Actor.documentClass = KTActor;
  CONFIG.Item.documentClass = KTItem;

  // Data models, matching the subtypes declared in system.json
  CONFIG.Actor.dataModels = {
    operative: OperativeData,
    killteam: KillTeamData
  };
  CONFIG.Item.dataModels = {
    weapon: WeaponData,
    ability: AbilityData,
    wargear: WargearData,
    specialism: SpecialismData,
    faction: FactionData
  };

  // Kill Team rolls off with 2D6 in the Initiative phase.
  CONFIG.Combat.initiative = { formula: "2d6", decimals: 0 };

  // Sheets
  const DocumentSheetConfig = foundry.applications.apps.DocumentSheetConfig;
  DocumentSheetConfig.registerSheet(Actor, SYSTEM_ID, KTOperativeSheet, {
    types: ["operative"], makeDefault: true, label: "KT.Sheet.Operative"
  });
  DocumentSheetConfig.registerSheet(Actor, SYSTEM_ID, KTKillTeamSheet, {
    types: ["killteam"], makeDefault: true, label: "KT.Sheet.KillTeam"
  });
  DocumentSheetConfig.registerSheet(Item, SYSTEM_ID, KTItemSheet, {
    types: ["weapon", "ability", "wargear", "specialism"], makeDefault: true, label: "KT.Sheet.Item"
  });

  registerHandlebarsHelpers();
  return preloadTemplates();
});

/* -------------------------------------------- */
/*  Handlebars                                   */
/* -------------------------------------------- */

function preloadTemplates() {
  return foundry.applications.handlebars.loadTemplates([
    `systems/${SYSTEM_ID}/templates/actor/operative-sheet.hbs`,
    `systems/${SYSTEM_ID}/templates/actor/killteam-sheet.hbs`,
    `systems/${SYSTEM_ID}/templates/item/item-sheet.hbs`
  ]);
}

function registerHandlebarsHelpers() {
  // 3 -> "3+", used for WS, BS and Sv throughout the datacard.
  Handlebars.registerHelper("ktPlus", value => {
    if (value === null || value === undefined || value === "") return "-";
    return `${value}+`;
  });

  // 0 -> "0", -1 -> "-1", 1 -> "+1"
  Handlebars.registerHelper("ktSigned", value => {
    const n = Number(value) || 0;
    return n > 0 ? `+${n}` : `${n}`;
  });

  Handlebars.registerHelper("ktEq", (a, b) => a === b);
}

/* -------------------------------------------- */
/*  Runtime hooks                                */
/* -------------------------------------------- */

// Bind the Injury roll button on attack chat cards.
Hooks.on("renderChatMessageHTML", (message, html) => dice.activateChatListeners(html));

// Clear per-round movement flags for every operative when a new round starts.
Hooks.on("combatRound", async (combat) => {
  if (!game.user.isGM) return;
  for (const combatant of combat.combatants) {
    await combatant.actor?.resetBattleRound?.();
  }
});

Hooks.once("ready", function () {
  console.log(`${SYSTEM_ID} | Ready`);
});
