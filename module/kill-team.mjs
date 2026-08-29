import { KT, SYSTEM_ID } from "./helpers/config.mjs";
import * as dice from "./helpers/dice.mjs";
import OperativeData from "./data/actor-operative.mjs";
import KillTeamData from "./data/actor-killteam.mjs";
import { WeaponData, AbilityData, WargearData, SpecialismData } from "./data/items.mjs";
import FactionData from "./data/item-faction.mjs";
import { KillTeamCombat, renderPhaseBar } from "./documents/combat.mjs";
import ModelData from "./data/item-model.mjs";
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
    faction: FactionData,
    model: ModelData
  };

  // Kill Team rolls off with 2D6 in the Initiative phase.
  CONFIG.Combat.documentClass = KillTeamCombat;
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

  registerSettings();
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

/* -------------------------------------------- */
/*  Settings                                     */
/* -------------------------------------------- */

function registerSettings() {
  game.settings.register(SYSTEM_ID, "autoMeasure", {
    name: "KT.Settings.AutoMeasure",
    hint: "KT.Settings.AutoMeasureHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(SYSTEM_ID, "gridSize", {
    name: "KT.Settings.GridSize",
    hint: "KT.Settings.GridSizeHint",
    scope: "world",
    config: true,
    type: Number,
    default: 100
  });
}

/**
 * New scenes default to one inch per grid square at 100 pixels, so distances
 * measured on the canvas match the ranges printed on a weapon profile without
 * the GM configuring anything.
 */
Hooks.on("preCreateScene", (scene, data) => {
  if (data.grid?.size || data.grid?.distance) return;   // respect an explicit choice
  let size = 100;
  try {
    size = game.settings.get(SYSTEM_ID, "gridSize") || 100;
  } catch (err) {
    // Settings are unavailable during early world setup; the default stands.
  }
  scene.updateSource({
    grid: { size, distance: 1, units: "in" }
  });
});

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
  Handlebars.registerHelper("ktGt", (a, b) => Number(a) > Number(b));
}

/* -------------------------------------------- */
/*  Runtime hooks                                */
/* -------------------------------------------- */

// Bind the Injury roll button on attack chat cards.
// The phase bar is injected on render rather than replacing the tracker
// template, so a Foundry change to the tracker cannot break the system.
Hooks.on("renderCombatTracker", renderPhaseBar);

// A phase change is stored as a flag, which Foundry does not treat as a reason
// to redraw the tracker, so ask for one whenever ours changes.
Hooks.on("updateCombat", (combat, changed) => {
  if (foundry.utils.hasProperty(changed, `flags.${SYSTEM_ID}.phase`)) ui.combat?.render();
});

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
