/**
 * The ten specialisms (pg 66-77).
 *
 * ABILITY TREES
 * Every tree has the same shape: one Level 1 ability the specialist always has,
 * two Level 2 abilities to choose between, and four Level 3 abilities, two
 * hanging off each Level 2 choice. `parent` records that connection, because a
 * Level 3 ability may only be taken if its parent was the Level 2 choice. At
 * Level 4 the specialist takes any remaining ability from the tree, so no
 * Level 4 entries are listed.
 *
 * The connections are drawn as lines in the book and cannot be recovered from
 * the PDF text layer, so each tree was read from the rendered page.
 *
 * TACTICS
 * Each specialism has three Tactics, one per level. A Tactic may be used if the
 * specialist is that level or higher and is not shaken or out of action (pg 67).
 */

export const SPECIALISMS = [
  {
    key: "leader", name: "Leader", page: 68,
    description: "A kill team's Leader is its brain and its heart both, trusted with command of a vital mission. Every Battle-forged kill team must include one, and only one.",
    abilities: [
      { name: "Resourceful", level: 1, parent: null, description: "As long as this model is on the battlefield and not shaken, you gain an additional Command Point at the beginning of the battle round." },
      { name: "Bold", level: 2, parent: null, description: "This model automatically passes Nerve tests." },
      { name: "Inspiring", level: 2, parent: null, description: "Friendly models within 3\" of this model - as long as it is not shaken - automatically pass Nerve tests." },
      { name: "Paragon", level: 3, parent: "Bold", description: "Re-roll hit rolls of 1 for friendly models within 3\" of this model, as long as it is not shaken." },
      { name: "Tyrant", level: 3, parent: "Bold", description: "Your opponent(s) must add 1 to Nerve tests for any enemy models within 6\" of this model, as long as it is not shaken." },
      { name: "Tactician", level: 3, parent: "Inspiring", description: "As long as this model is on the battlefield and not shaken, roll a D6 each time you use a Tactic. On a 5+ you gain a Command Point." },
      { name: "Mentor", level: 3, parent: "Inspiring", description: "Once per battle round, when you choose a friendly model within 3\" of this model to shoot in the Shooting phase - as long as this model is not shaken - you can re-roll failed hit rolls for that model until the end of the phase." }
    ],
    tactics: [
      { name: "Lead by Example", level: 1, cost: 1, description: "Use this Tactic when you pick a Leader from your kill team to fight in the Fight phase. Choose another friendly model within 3\" of them that is eligible to fight. You can fight with each of these models, in an order of your choice, before the next player's turn." },
      { name: "Fire on my Target", level: 2, cost: 1, description: "Use this Tactic when you pick a Leader of Level 2 or higher from your kill team to shoot in the Shooting phase. Choose another friendly model within 3\" of them that is eligible to shoot. You can make a shooting attack with each of these models, in an order of your choice, before the next player's turn." },
      { name: "Force of Will", level: 3, cost: 1, description: "Use this Tactic at the start of the battle round, if a Leader of Level 3 or higher from your kill team is on the battlefield and not shaken. In this battle round, your kill team does not suffer the penalty for being broken." }
    ]
  },

  {
    key: "combat", name: "Combat", page: 69,
    description: "Warriors who excel in the close-quarters cut and thrust of battle, ideal for leading headlong charges or intercepting enemies that break through the line.",
    abilities: [
      { name: "Expert Fighter", level: 1, parent: null, description: "Add 1 to this model's Attacks characteristic." },
      { name: "Warrior Adept", level: 2, parent: null, description: "Add 1 to hit rolls for this model in the Fight phase." },
      { name: "Deadly Counter", level: 2, parent: null, description: "If any hit rolls of 1 or less are made for a model's attacks that target this model in the Fight phase, unless this model is shaken, roll a D6. On a 5+, the model that made the attack suffers 1 mortal wound after all of their attacks have been resolved." },
      { name: "Deathblow", level: 3, parent: "Warrior Adept", description: "Any wound rolls of 6 you make for this model in the Fight phase inflict 1 mortal wound on the target in addition to any other damage." },
      { name: "Combat Master", level: 3, parent: "Warrior Adept", description: "Add 1 to the Attacks characteristic of this model for each enemy model within 1\" of it at the start of the Fight phase, until the end of the phase." },
      { name: "Killer Instinct", level: 3, parent: "Deadly Counter", description: "You can re-roll any failed wound rolls you make for this model in the Fight phase." },
      { name: "Bloodlust", level: 3, parent: "Deadly Counter", description: "You can re-roll any failed charge rolls you make for this model." }
    ],
    tactics: [
      { name: "Up and At 'Em!", level: 1, cost: 1, description: "Use this Tactic in the Fight phase, after attacking with a model from your kill team. Pick a Combat specialist from your kill team that has not yet attacked this phase: you can immediately fight with them." },
      { name: "Defensive Fighter", level: 2, cost: 1, description: "Use this Tactic at the start of the Fight phase. Pick a Combat specialist of Level 2 or higher from your kill team. Until the end of the phase, you must subtract 2 from that model's Attacks characteristic (to a minimum of 1), but your opponent(s) must re-roll successful hit rolls made against that model." },
      { name: "Deadly Charge", level: 3, cost: 1, description: "Use this Tactic when a Combat specialist of Level 3 or higher from your kill team finishes a charge move within 1\" of an enemy model. Roll a D6; on a 5+ that enemy model suffers 1 mortal wound." }
    ]
  },

  {
    key: "comms", name: "Comms", page: 70,
    description: "Vox operators and signallers who keep a scattered team acting as one, relaying orders and coordinating fire.",
    abilities: [
      { name: "Scanner", level: 1, parent: null, description: "Once per Shooting phase, when you pick a model from your kill team to shoot that is within 6\" of this model, if this model is not shaken, you can add 1 to hit rolls for that model in this phase." },
      { name: "Expert", level: 2, parent: null, description: "Roll a D6 at the start of each battle round if this model is not shaken. On a 5+, you gain 1 additional Command Point. This additional Command Point is lost at the end of the battle round if not used." },
      { name: "Static Screech", level: 2, parent: null, description: "Once per battle at the start of the Fight phase, if this model is not shaken, subtract 1 from hit rolls for enemy models that make attacks while they are within 6\" of this model until the end of the phase." },
      { name: "Vox Ghost", level: 3, parent: "Expert", description: "Subtract 1 from the Leadership characteristic of enemy models while this model is on the battlefield, as long as it is not shaken." },
      { name: "Command Relay", level: 3, parent: "Expert", description: "Roll a D6 each time you use a Tactic while this model is on the battlefield and not shaken. On a 6 the Command Points spent on that Tactic are immediately refunded." },
      { name: "Triangulator", level: 3, parent: "Static Screech", description: "Once per Shooting phase, when you pick a model from your kill team to shoot a Heavy weapon, if this model is not shaken, you can re-roll the dice when determining the number of attacks that model can make." },
      { name: "Vox Hacker", level: 3, parent: "Static Screech", description: "After each battle in which this model was in your kill team, if this model is not in Convalescence (pg 204) or dead, roll a D6. On a 5+ you gain 1 Intelligence." }
    ],
    tactics: [
      { name: "Rousing Transmission", level: 1, cost: 1, description: "Use this Tactic in the Morale phase before taking any Nerve tests. Until the end of the phase you can subtract 1 from Nerve tests for models from your kill team as though the Comms specialist was within 2\" of them." },
      { name: "Scanner Uplink", level: 2, cost: 2, description: "Use this Tactic when you pick a model from your kill team that is within 6\" of a friendly Comms specialist of Level 2 or higher to shoot in the Shooting phase." },
      { name: "New Intelligence", level: 3, cost: 1, description: "Use this Tactic at the end of the Movement phase. Pick a model from your kill team within 12\" of a friendly Comms specialist of Level 3 or higher. Ready that model." }
    ]
  },

  {
    key: "demolitions", name: "Demolitions", page: 71,
    description: "Warriors who excel in the deployment of bombs, grenades and other pyrotechnic munitions, whether by booby trap, explosive launcher or roaring flamethrower.",
    abilities: [
      { name: "Breacher", level: 1, parent: null, description: "You can add 1 to this model's wound rolls against targets that are obscured." },
      { name: "Pyromaniac", level: 2, parent: null, description: "You can re-roll wound rolls of 1 for this model when it is attacking with a weapon that hits automatically." },
      { name: "Grenadier", level: 2, parent: null, description: "Add 3\" to the range of any Grenade weapon this model uses. You can re-roll hit rolls of 1 for Grenade weapons this model uses." },
      { name: "Saboteur", level: 3, parent: "Pyromaniac", description: "If this model is in your kill team and not out of action when you make your Casualty rolls, roll a D6. On a 5+ choose an opponent who played that mission to lose 1 Materiel." },
      { name: "Sapper", level: 3, parent: "Pyromaniac", description: "If this model is in your kill team and you choose the Plant Traps strategy (pg 49), you can add 1 to the number of pieces of terrain you can booby trap." },
      { name: "Siegemaster", level: 3, parent: "Grenadier", description: "You can add 1 to Injury rolls caused by this model's attacks in the Shooting phase if those Injury rolls are for models that are obscured." },
      { name: "Ammo Hound", level: 3, parent: "Grenadier", description: "If this model is in your kill team and not out of action when you make your Casualty rolls, roll a D6. On a 5+ you gain 1 Materiel." }
    ],
    tactics: [
      { name: "Custom Ammo", level: 1, cost: 1, description: "Use this Tactic when you pick a Demolitions specialist from your kill team to shoot in the Shooting phase. You can add 1 to wound rolls for that model's ranged weapons in this phase." },
      { name: "Lucky Escape", level: 2, cost: 1, description: "Use this Tactic at the start of the Shooting phase. Pick a Demolitions specialist of Level 2 or higher from your kill team. Roll a D6 each time that model loses a wound in this phase; on a 5+ that wound is not lost." },
      { name: "High Explosive", level: 3, cost: 1, description: "Use this Tactic when you pick a Demolitions specialist of Level 3 or higher from your kill team to shoot in the Shooting phase. In this Shooting phase, they can only shoot a single weapon, and that weapon can only fire 1 shot (even if it would normally fire more). However, that weapon's Damage characteristic is increased by 2. You cannot use this Tactic in the same battle round as the Custom Ammo Tactic." }
    ]
  },

  {
    key: "heavy", name: "Heavy", page: 72,
    description: "The bearer of the squad's heaviest weapon, trained to set up, brace and lay down suppressing fire.",
    abilities: [
      { name: "Relentless", level: 1, parent: null, description: "This model does not suffer the -1 penalty for shooting with a Heavy weapon after moving in the preceding Movement phase, or for shooting an Assault weapon after Advancing." },
      { name: "Suppressor", level: 2, parent: null, description: "Enemy models that are targeted by this model in the Shooting phase suffer a -1 penalty to their hit rolls until the end of the phase." },
      { name: "Extra Armour", level: 2, parent: null, description: "Ignore AP characteristics of -1 for attacks that target this model." },
      { name: "Devastator", level: 3, parent: "Suppressor", description: "You can re-roll the damage for this model's ranged weapons that have a random Damage characteristic (e.g. D3)." },
      { name: "Rigorous", level: 3, parent: "Suppressor", description: "You can re-roll hit rolls of 1 for this model in the Shooting phase." },
      { name: "Indomitable", level: 3, parent: "Extra Armour", description: "Once per battle round, you can make your opponent re-roll the Injury dice for this model." },
      { name: "Heavily Muscled", level: 3, parent: "Extra Armour", description: "You can re-roll wound rolls of 1 for this model in the Fight phase." }
    ],
    tactics: [
      { name: "More Bullets", level: 1, cost: 1, description: "Use this Tactic when you pick a Heavy specialist from your kill team to shoot in the Shooting phase. You can add 1 to the number of shots fired by that model's ranged weapons, with the exception of weapons that would otherwise fire 1 shot (e.g. an Assault 2 weapon would fire 3 shots, but a Rapid Fire 1 weapon at long range would fire 1 shot) in this Shooting phase." },
      { name: "Overwhelming Firepower", level: 2, cost: 2, description: "Use this Tactic when you pick a Heavy specialist of Level 2 or higher from your kill team to shoot in the Shooting phase. That model can shoot twice in that phase." },
      { name: "Unkillable", level: 3, cost: 1, description: "Use this Tactic at the start of your turn in the Morale phase. Pick a Heavy specialist of Level 3 or higher from your kill team that has one or more flesh wounds. Remove one of that model's flesh wounds." }
    ]
  },

  {
    key: "medic", name: "Medic", page: 73,
    description: "Field surgeons, flesh-stitchers and stranger things, who keep their comrades in the fight and repair hurts that would otherwise be permanent.",
    abilities: [
      { name: "Reassuring", level: 1, parent: null, description: "This model is never treated as being shaken when taking Nerve tests for other models in your kill team." },
      { name: "Field Medic", level: 2, parent: null, description: "Roll a D6 when a friendly model within 3\" of this model suffers a wound, as long as this model is not shaken; on a 6 that wound is not lost." },
      { name: "Anatomist", level: 2, parent: null, description: "Re-roll wound rolls of 1 for this model in the Fight phase." },
      { name: "Trauma Specialist", level: 3, parent: "Field Medic", description: "When an Injury roll is made for a friendly model within 3\" of this model, as long as this model is not shaken, roll an additional dice and use the lowest result." },
      { name: "Triage Expert", level: 3, parent: "Field Medic", description: "If this model is in your kill team and not out of action at the end of a battle, and you roll a Dead result when making a Casualty roll (pg 204) for a model from your kill team, you can roll a D6. On a 4+ apply the Convalescence result for that model instead." },
      { name: "Interrogator", level: 3, parent: "Anatomist", description: "At the end of any battle in which you were victorious, if this model was in your kill team and not out of action, roll a D6. On a 5+ you gain 1 Intelligence." },
      { name: "Toxin Synthesiser", level: 3, parent: "Anatomist", description: "Before deployment, you can pick up to D3 models from your kill team. Until the end of the battle, add 1 to wound rolls for attacks made with melee weapons those models are armed with." }
    ],
    tactics: [
      { name: "Stimm-shot", level: 1, cost: 1, description: "Use this Tactic at the start of the Movement phase. Pick a model from your kill team within 2\" of a friendly Medic specialist that is not shaken. You can add 1 to Advance rolls and charge rolls for that model, and add 1 to that model's Attacks characteristic until the end of the battle round." },
      { name: "Painkiller", level: 2, cost: 2, description: "Use this Tactic at the end of the Movement phase. Pick a model from your kill team within 2\" of a friendly Medic specialist of Level 2 or higher that is not shaken. Add 2 to that model's Toughness characteristic until the end of the battle round." },
      { name: "Emergency Resuscitation", level: 3, cost: 2, description: "Use this Tactic when a Medic specialist of Level 3 or higher from your kill team that is not shaken is within 2\" of another model from your kill team that suffers an Out of Action Injury roll result. That model suffers a Flesh Wound result instead." }
    ]
  },

  {
    key: "scout", name: "Scout", page: 74,
    description: "Forward operatives who move ahead of the team, finding routes, gathering information and reaching objectives first.",
    abilities: [
      { name: "Swift", level: 1, parent: null, description: "You can re-roll Advance rolls for this model." },
      { name: "Forward Scout", level: 2, parent: null, description: "This model automatically passes dangerous terrain tests (pg 42)." },
      { name: "Pathfinder", level: 2, parent: null, description: "If this model is not in Convalescence (pg 204), you can add or subtract 1 from the result when you roll to determine a mission. If you do, this model must be included in your kill team." },
      { name: "Skirmisher", level: 3, parent: "Forward Scout", description: "Your opponent(s) must subtract 1 from hit rolls for shooting attacks that target this model if the firing model is more than 12\" from this model and this model is not shaken or obscured." },
      { name: "Vanguard", level: 3, parent: "Forward Scout", description: "You can re-roll hit rolls of 1 in the Shooting phase for attacks made by models from your kill team against enemy models that are within 6\" of this model, as long as this model is not shaken." },
      { name: "Observer", level: 3, parent: "Pathfinder", description: "If this model is in your kill team, you can roll a D6 at the start of the Scouting phase. On a 4+ you can pick an additional strategy." },
      { name: "Explorer", level: 3, parent: "Pathfinder", description: "After each battle in which this model was in your kill team, if this model is not in Convalescence (pg 204), you can roll a D6. On a 5+ you gain 1 Territory." }
    ],
    tactics: [
      { name: "Quick March", level: 1, cost: 1, description: "Use this Tactic when you pick a Scout specialist from your kill team to move in the Movement phase. You can either increase the model's Move characteristic by 2\" this phase or you can re-roll the dice when this model Advances in this phase." },
      { name: "Marked Positions", level: 2, cost: 1, description: "Use this Tactic at the start of the Shooting phase. Pick an enemy model within 6\" of a Scout specialist of Level 2 or higher from your kill team." },
      { name: "Move Unseen", level: 3, cost: 2, description: "Use this Tactic at the start of your turn in the Movement phase. Pick a Scout specialist of Level 3 or higher from your kill team that is not shaken. Remove that model from the battlefield and set it up again anywhere within 18\" of its previous position and more than 3\" from any enemy models. It is considered to have Advanced." }
    ]
  },

  {
    key: "sniper", name: "Sniper", page: 75,
    description: "Marksmen who wait, unseen and unhurried, for the single shot that decides an engagement.",
    abilities: [
      { name: "Marksman", level: 1, parent: null, description: "You can re-roll hit rolls of 1 for this model when it makes a shooting attack." },
      { name: "Assassin", level: 2, parent: null, description: "You can re-roll wound rolls of 1 for this model when it makes a shooting attack." },
      { name: "Sharpshooter", level: 2, parent: null, description: "If this model is Readied, add 1 to hit rolls when it makes a shooting attack." },
      { name: "Deadeye", level: 3, parent: "Assassin", description: "On an unmodified wound roll of 6 for this model's shooting attacks, increase the Damage characteristic of that attack by 1." },
      { name: "Armour Piercing", level: 3, parent: "Assassin", description: "On an unmodified wound roll of 6 for this model's shooting attacks, improve the AP characteristic of that attack by 1 (e.g. AP0 becomes AP-1)." },
      { name: "Mobile", level: 3, parent: "Sharpshooter", description: "This model does not suffer the -1 penalty for shooting with a Heavy weapon after moving in the preceding Movement phase, or for shooting an Assault weapon after Advancing." },
      { name: "Eagle-eye", level: 3, parent: "Sharpshooter", description: "Increase the Range characteristic of all Rapid Fire and Heavy weapons this model is armed with by 6\"." }
    ],
    tactics: [
      { name: "Careful Aim", level: 1, cost: 1, description: "Use this Tactic when you choose a Sniper specialist from your kill team to shoot in the Shooting phase. You can add 1 to hit rolls for that model until the end of the phase." },
      { name: "Headshot", level: 2, cost: 1, description: "Use this Tactic when you pick a Sniper specialist of Level 2 or higher from your kill team to shoot in the Shooting phase." },
      { name: "Quick Shot", level: 3, cost: 1, description: "Use this Tactic when you pick a Sniper specialist of Level 3 or higher from your kill team to shoot in the Shooting phase. In this Shooting phase, double the number of shots fired by that model's ranged weapons (e.g. an Assault 2 weapon would fire 4 shots), but subtract 1 from hit rolls for that model. You cannot use this Tactic in the same battle round as the Headshot Tactic." }
    ]
  },

  {
    key: "veteran", name: "Veteran", page: 76,
    description: "Hardened survivors of dozens of war zones, relied upon absolutely to do their duty no matter the circumstances.",
    abilities: [
      { name: "Grizzled", level: 1, parent: null, description: "This model ignores penalties to its Leadership characteristic and Nerve tests." },
      { name: "Practised", level: 2, parent: null, description: "You can re-roll one hit roll or wound roll for this model in each battle round." },
      { name: "Seen It All", level: 2, parent: null, description: "You can subtract 1 from Nerve tests for models from your kill team within 3\" of this model, as long as it is not shaken." },
      { name: "Survivor", level: 3, parent: "Practised", description: "You can add 1 to saving throws for this model." },
      { name: "One-man Army", level: 3, parent: "Practised", description: "This model generates 1 Command Point at the beginning of each battle round, unless it is shaken or out of action. This Command Point can only be used for Veteran Tactics." },
      { name: "Battle Scarred", level: 3, parent: "Seen It All", description: "Enemy models suffer -1 Leadership whilst they are within 6\" of this model, as long as it is not shaken." },
      { name: "Nerves of Steel", level: 3, parent: "Seen It All", description: "You can re-roll failed hit rolls for this model when it fires Overwatch." }
    ],
    tactics: [
      { name: "Adaptive Tactics", level: 1, cost: 1, description: "Use this Tactic at the start of the first battle round, but before the Initiative phase. Pick a Veteran specialist from your kill team. They can make a normal move or Advance. You can only use this Tactic once per battle." },
      { name: "Well Drilled", level: 2, cost: 2, description: "Use this Tactic at the start of your turn in the Shooting phase. Pick a Veteran specialist of Level 2 or higher from your kill team. Ready them unless they are within 1\" of an enemy. They can shoot in that phase as if they had not moved in the Movement phase." },
      { name: "Roll with the Hits", level: 3, cost: 1, description: "Use this Tactic during your opponent's turn in the Shooting phase. Pick a Veteran specialist of Level 3 or higher from your kill team that has been Injured, before your opponent makes the Injury roll. Your opponent can only roll a single dice for that Injury roll." }
    ]
  },

  {
    key: "zealot", name: "Zealot", page: 77,
    description: "Driven by faith or fury, zealots press on through wounds that would stop a lesser warrior.",
    abilities: [
      { name: "Frenzied", level: 1, parent: null, description: "You can add 1 to this model's Attacks and Strength characteristics in a battle round in which they charged." },
      { name: "Exultant", level: 2, parent: null, description: "Opponents must re-roll unmodified hit rolls of 6 for models from their kill team within 3\" of this model, as long as it is not shaken." },
      { name: "Flagellant", level: 2, parent: null, description: "Roll a D6 each time this model loses a wound. On a 6 the wound is ignored." },
      { name: "Puritan", level: 3, parent: "Exultant", description: "You can re-roll hit rolls in the Fight phase for this model against enemy models that do not have a Faction keyword in common with it." },
      { name: "Rousing", level: 3, parent: "Exultant", description: "Add 1 to the Leadership characteristic of models from your kill team within 6\" of this model, as long as it is not shaken." },
      { name: "Fanatical", level: 3, parent: "Flagellant", description: "This model automatically passes Nerve tests." },
      { name: "Strength of Spirit", level: 3, parent: "Flagellant", description: "Subtract 1 for Injury rolls made for this model." }
    ],
    tactics: [
      { name: "Killing Frenzy", level: 1, cost: 1, description: "Use this Tactic when you pick a Zealot specialist from your kill team to fight in the Fight phase. Until the end of the phase, each time you make a hit roll of 6+ for that model you can make an additional attack with the same weapon against the same target. These attacks cannot themselves generate any further attacks." },
      { name: "Martyr", level: 2, cost: 2, description: "Use this Tactic when a Zealot specialist of Level 2 or higher from your kill team loses their last wound, before any player rolls on the Injury table." },
      { name: "Terrifying Rampage", level: 3, cost: 2, description: "Use this Tactic at the start of the Morale phase. Pick a Zealot specialist of Level 3 or higher from your kill team that took an enemy model out of action in the preceding Fight phase. Each enemy model within 6\" of the Zealot must take a Nerve test. If the test is failed the model is shaken." }
    ]
  }
];

/**
 * Additional points a Battle-forged kill team pays for a specialist, by level
 * (pg 67). In a normal matched play game only Level 1 specialists may be
 * included; the higher costs exist for campaign play.
 */
export const SPECIALIST_COST_BY_LEVEL = { 1: 0, 2: 4, 3: 8, 4: 12 };

/** Specialisms that still need their ability tree transcribed. */
export const UNPOPULATED = SPECIALISMS.filter(s => s.abilities.length === 0).map(s => s.key);
