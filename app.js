const APP_NAME = "The Weimar Republic Companion";
const APP_BUILD = "phase-11-economy-bot-status";
const LOCAL_SAVE_KEY = "wr-companion-state-v6";

const sources = [
  {
    id: "rulebook",
    label: "Rulebook",
    file: "assets/The+Weimar+Republic_Rule+book_WEB.pdf",
    note: "Core rules source for the implementation pass."
  },
  {
    id: "playbook",
    label: "Playbook",
    file: "assets/The_Weimar_Republic_Playbook_Web.pdf",
    note: "Examples, scenarios, and tutorial/reference material."
  },
  {
    id: "turn_aid",
    label: "Turn Aid",
    file: "assets/WR_Turn_Aid.pdf",
    note: "Quick sequence and turn-flow reference."
  },
  {
    id: "bot_aid",
    label: "Bot Aid",
    file: "assets/WR_Bot_Aid.pdf",
    note: "Bot/non-player flow reference for future automation."
  }
];

const factions = {
  coalition: {
    label: "Democratic Coalition",
    short: "Coalition",
    tone: "coalition",
    role: "The government faction trying to preserve the Republic.",
    focus: ["Reforms", "Unity", "State apparatus", "Defending democratic control"],
    notes: [
      "Represents the Social Democrats, Liberals, and Centre Party working as the governing bloc.",
      "Must manage an unstable economy while resisting pressure from extremist factions.",
      "Armed forces and Freikorps reliability are important rules targets for extraction."
    ],
    victorySketch: "Survive through the timeline or implement enough reforms. Exact checks still need rulebook extraction."
  },
  kpd: {
    label: "KPD",
    short: "KPD",
    tone: "kpd",
    role: "The Soviet-backed Communist Party.",
    focus: ["Strikes", "Uprisings", "Worker militia", "Parliamentary or revolutionary stance"],
    notes: [
      "Can pursue power through elections or revolution, depending on strategic stance.",
      "Uses labor unrest and street-level organization as key pressure tools.",
      "Needs a precise action/stance model from the rulebook before automation."
    ],
    victorySketch: "Establish a Soviet-style dictatorship through electoral or revolutionary means. Exact thresholds pending."
  },
  nsdap: {
    label: "NSDAP",
    short: "NSDAP",
    tone: "nsdap",
    role: "The National Socialist faction.",
    focus: ["Propaganda", "Street violence", "Party growth", "Parliamentary or revolutionary stance"],
    notes: [
      "Starts as a small extremist movement and grows in the shadow of the broader far right.",
      "Shares a stance concept with the KPD but uses different faction tools.",
      "Card and event handling should be especially careful and historically neutral."
    ],
    victorySketch: "Seize power by building enough political control and support. Exact conditions pending."
  },
  radical_conservatives: {
    label: "Radical Conservatives",
    short: "RadCons",
    tone: "radcon",
    role: "The far-right reactionary faction.",
    focus: ["Conservative cliques", "Economic leverage", "Freikorps", "Anti-democratic pressure"],
    notes: [
      "Represents a loose network rather than a single unified party.",
      "Uses conservative cliques and influence webs differently from the party factions.",
      "Freikorps defection/recruitment rules are a priority extraction target."
    ],
    victorySketch: "Bring down the Republic through reactionary control and anti-democratic leverage. Exact conditions pending."
  }
};

const years = Array.from({ length: 15 }, (_, index) => 1919 + index);
const factionIds = Object.keys(factions);

const implementationBacklog = [
  {
    id: "sequence",
    title: "Sequence Of Play",
    status: "Active",
    body: "The Turn Aid sequence is now modeled as a guided walkthrough. Detailed legality checks still need rulebook extraction."
  },
  {
    id: "actions",
    title: "Faction Actions",
    status: "Next",
    body: "Model available actions, legality gates, costs, and results for each faction."
  },
  {
    id: "bots",
    title: "Bot / Solo System",
    status: "Next",
    body: "Use the bot aid to model automated faction impulses after the human-facing flow is stable."
  },
  {
    id: "cards",
    title: "Cards",
    status: "Later",
    body: "Avoid full card ingestion for now. Add card support only when a focused feature needs it."
  }
];

const sequencePhases = [
  {
    id: "action",
    title: "Action Step",
    citation: "6.0",
    prompt: "The active faction chooses its turn option.",
    source: "WR Turn Aid, Player Aid Card 1",
    reminders: [
      "Resolve factions in turn order.",
      "Election and Mandatory cards cannot be discarded.",
      "Mandatory and Election cards must be played to avoid the Held Card Penalty.",
      "The active faction may also play Reichstag Seats and/or one Parliamentary Control card. The Coalition may play Article 48."
    ]
  },
  {
    id: "sudden_victory",
    title: "Sudden Victory Step",
    citation: "3.0",
    prompt: "Each faction checks sudden victory in turn order.",
    source: "WR Turn Aid, Player Aid Card 1",
    reminders: [
      "Check only factions whose Sudden Victory marker is on the Timeline.",
      "Use the faction player aid or rulebook for exact faction requirements.",
      "If a faction qualifies, the game ends immediately."
    ]
  },
  {
    id: "elections_gate",
    title: "Elections Check",
    citation: "7.0",
    prompt: "Did an Election card get played during the Action Step?",
    source: "WR Turn Aid, Player Aid Card 1",
    reminders: [
      "Skip Elections if no Election card was played this turn.",
      "If an Election card was played, resolve Regional Elections first, then the General Election."
    ]
  },
  {
    id: "elections",
    title: "Elections Step",
    citation: "7.1, 7.2",
    prompt: "Resolve Regional Elections, then the General Election.",
    source: "WR Turn Aid, Player Aid Card 1",
    reminders: [
      "Conduct Regional Elections in eligible Regions and Cities with no Assassinations and no Uprising.",
      "Calculate PV for each faction in every election space.",
      "The faction with the most total PV takes the Parliamentary Control card.",
      "Add PVs to each faction's PV Total regardless of who wins the regional contest.",
      "Then calculate Total PV for the General Election."
    ]
  },
  {
    id: "advance_timeline",
    title: "Advance Timeline Step",
    citation: "4.0",
    prompt: "Clean up time-sensitive markers, then flip or advance the turn marker.",
    source: "WR Turn Aid, Player Aid Card 1",
    reminders: [
      "KPD may remove Strikes and Uprisings.",
      "Remove the General Strike marker if fewer than three Strikes plus Uprisings remain on the map.",
      "Remove Assassination markers from spaces with Reichswehr or Coalition Freikorps units.",
      "If the Economy is at Hyperinflation, the Momentum faction removes one Coalition Influence from any space."
    ]
  },
  {
    id: "new_year",
    title: "New Year Step",
    citation: "4.0",
    prompt: "Resolve annual economy and turn-order procedures.",
    source: "WR Turn Aid, Player Aid Card 1",
    reminders: [
      "This step only occurs after the turn marker flips from Late Year to Early Year.",
      "The Momentum faction determines turn order for the upcoming year.",
      "For bot play, the Turn Aid notes drawing a bot card and using faction order, with the NP faction last."
    ]
  },
  {
    id: "new_era",
    title: "New Era Step",
    citation: "4.0",
    prompt: "Resolve era transition procedures for 1924 or 1930.",
    source: "WR Turn Aid, Player Aid Card 1",
    reminders: [
      "Reveal held cards and pay Held Card Penalties.",
      "Remove Lingering Events scheduled to end with the previous Era.",
      "Remove the previous Era deck and discards, then use the new Era deck.",
      "Each faction draws a new hand for the new Era."
    ]
  }
];

const sequencePhaseIds = sequencePhases.map(phase => phase.id);

const actionChoices = [
  {
    id: "one_action",
    label: "Take 1 Action",
    detail: "Resolve one legal faction action, then continue."
  },
  {
    id: "event_then_actions",
    label: "Event, then 2 Actions",
    detail: "Play one Event card before resolving both actions."
  },
  {
    id: "actions_then_event",
    label: "2 Actions, then Event",
    detail: "Resolve both actions before playing one Event card."
  },
  {
    id: "pass",
    label: "Pass",
    detail: "May discard one Event card, then draw one Event card."
  }
];

const electionRegions = [
  "Hamburg",
  "Muenchen",
  "Koeln",
  "Berlin",
  "Bayern",
  "Northern States",
  "Southern States",
  "Prussian Provinces"
];

const generalElectionOutcomes = [
  {
    id: "coalition",
    label: "Coalition wins",
    detail: "The game continues after Clean Slate procedures."
  },
  {
    id: "kpd",
    label: "KPD wins",
    detail: "The game ends and the winner is determined."
  },
  {
    id: "nsdap",
    label: "NSDAP wins",
    detail: "The game ends and the winner is determined."
  },
  {
    id: "radical_conservatives",
    label: "RC wins",
    detail: "The game ends and the winner is determined."
  }
];

const globalActionLimits = [
  "Do not exceed a space's Population Number with Influence.",
  "A faction may not both place and remove Influence in the same space during the same Action Step.",
  "Influence cannot be placed in a space with an Assassinations marker matching that faction's color.",
  "If two Assault Actions are performed, each must target a different space.",
  "Election and Mandatory cards may never be discarded.",
  "In-play Lingering Events may alter or block Actions."
];

const actionStateQuestions = {
  general_strike_clear: "General Strike must be Not active",
  coalition_influence_allowed: "Economy must allow Coalition Influence placement",
  unity_sound_strong: "Coalition Unity must be Sound or Strong",
  yellow_leverage_above_progress: "Yellow Leverage must be above current Progress",
  black_leverage_above_reaction: "Black Leverage must be above current Reaction",
  reaction_can_advance: "Reaction must not already be more than one above Progress",
  coalition_mcs_available: "Coalition has / can move a Middle Class Sympathies pawn",
  strike_available: "There is an eligible Strike marker",
  kpd_cadre_available: "KPD has an available Cadre",
  nsdap_cadre_available: "NSDAP has an available Cadre",
  conservative_clique_available: "RC has an available Conservative Clique",
  assassination_available: "An Assassinations marker is available",
  leverage_available: "A matching Leverage marker is available",
  unit_available: "A matching unit is available",
  sudden_victory_marker_available: "The faction's Sudden Victory marker is available"
};

const economyOptions = [
  ["hyperinflation", "Hyperinflation"],
  ["hyper_3", "Left 3"],
  ["hyper_2", "Left 2"],
  ["hyper_1", "Left 1"],
  ["stable", "Stable"],
  ["mass_1", "Right 1"],
  ["mass_2", "Right 2"],
  ["mass_3", "Right 3"],
  ["mass_unemployment", "Mass Unemployment"]
];

function economyLabel(value) {
  return economyOptions.find(([id]) => id === value)?.[1] || value;
}

const commonActions = {
  assault: {
    id: "assault",
    title: "Assault",
    citation: "6.2",
    summary: "Fight in one space where the active faction has units and an opposing unit, Strike, or Uprising is present.",
    requires: [
      "Active faction units in the target space.",
      "At least one opposing faction unit, Strike, or Uprising in the target space.",
      "If this is a second Assault this Action Step, choose a different space."
    ],
    procedure: [
      "Pick one opposing faction as the target.",
      "Ask whether any faction will loan units before combat, attacker first.",
      "If Coalition and RC units oppose each other, perform Coalition Loyalty Checks.",
      "Calculate each side's unit SV plus modifiers, then subtract one die roll.",
      "Apply hits: units first, then Strike/Uprising if KPD participated, then Influence.",
      "Highest modified strength minus die roll becomes Momentum."
    ],
    warnings: [
      "Coalition Reichswehr and Freikorps may be affected by Loyalty Checks against RC units.",
      "KPD/NSDAP defender shifts Stance one box toward Revolutionary after the Assault."
    ]
  }
};

const factionActions = {
  coalition: [
    {
      id: "advance_progress",
      title: "Advance Progress Track",
      citation: "6.3",
      summary: "Increase Progress by one box.",
      context: ["yellow_leverage_above_progress"],
      requires: ["Yellow Leverage must be in the box above the current Progress level."]
    },
    commonActions.assault,
    {
      id: "gain_momentum",
      title: "Gain Momentum",
      citation: "6.3",
      summary: "Coalition becomes the Momentum faction.",
      requires: ["No map requirement."]
    },
    {
      id: "increase_deals",
      title: "Increase Deals Track",
      citation: "6.3",
      summary: "Shift either the U.S. Deals or U.S.S.R. Deals track one box to the right.",
      requires: ["Choose U.S. Deals or U.S.S.R. Deals."]
    },
    {
      id: "increase_unity",
      title: "Increase Unity",
      citation: "6.3",
      summary: "Spend a Coalition Middle Class Sympathies pawn to shift Unity one box right.",
      context: ["coalition_mcs_available"],
      requires: ["A Middle Class Sympathies pawn must be on the Coalition faction mat.", "An empty Middle Class Sympathies holding box is needed."]
    },
    {
      id: "move_mcs",
      title: "Move Middle Class Sympathies",
      citation: "6.3",
      summary: "Move one Available pawn to the Coalition mat, or return one pawn from any faction mat.",
      requires: ["Either an Available Middle Class Sympathies pawn or a pawn on a faction mat."]
    },
    {
      id: "move_units",
      title: "Move Units",
      citation: "6.3",
      summary: "Move up to three Coalition Freikorps and/or Reichswehr units.",
      requires: ["Each unit moves independently into adjacent spaces.", "Move up to three spaces, or only one if its origin has a Strike/Uprising or General Strike is active."]
    },
    {
      id: "place_influence",
      title: "Place Influence",
      citation: "6.3",
      summary: "Place one Coalition Influence in an eligible space.",
      context: ["coalition_influence_allowed"],
      requires: ["Economy must allow Coalition Influence placement.", "Target has no yellow/red Assassinations marker.", "Target is Berlin, adjacent to Berlin, or has/adjacent to Coalition Presence.", "Respect Population and same-turn place/remove limits."]
    },
    {
      id: "place_leverage_map",
      title: "Place Leverage on Map",
      citation: "6.3",
      summary: "Place yellow Leverage in a space with Coalition Presence and clear KPD pressure.",
      context: ["general_strike_clear", "leverage_available"],
      requires: ["General Strike marker is not on the Timeline.", "An Available yellow Leverage marker.", "Target space has Coalition Presence."],
      procedure: ["Place yellow Leverage.", "Remove any Strike and/or KPD Cadre from that space."]
    },
    {
      id: "place_leverage_track",
      title: "Place Leverage on Track",
      citation: "6.3",
      summary: "Place yellow Leverage on the Progress or Economy track.",
      context: ["leverage_available"],
      requires: ["An Available yellow Leverage marker.", "If using Economy, do not place on a side already containing black Leverage.", "Adjust Economy if appropriate."]
    },
    {
      id: "place_reform",
      title: "Place Reform",
      citation: "6.3",
      summary: "Place one Coalition Reform in a controlled clean space.",
      context: ["unity_sound_strong"],
      requires: ["Unity must be Sound or Strong.", "An Available Reform marker.", "Target has Coalition Parliamentary Control.", "Target has no Strike, Uprising, black Leverage, Assassinations, or Reform already present."]
    },
    {
      id: "place_sudden_victory",
      title: "Place Sudden Victory Marker",
      citation: "6.3",
      summary: "Place the Coalition Reformation marker on the Timeline in the current year.",
      context: ["sudden_victory_marker_available"],
      requires: ["Coalition Reformation marker must be Available.", "Victory is checked later during the Sudden Victory Step."]
    },
    {
      id: "place_unit",
      title: "Place Unit",
      citation: "6.3",
      summary: "Place one Coalition Freikorps or Reichswehr unit.",
      context: ["unit_available"],
      requires: ["An Available Coalition unit.", "Target space has Coalition Parliamentary Control or Coalition Dominance."]
    },
    {
      id: "remove_influence",
      title: "Remove Influence",
      citation: "6.3",
      summary: "Remove one opposing Influence cube near Coalition Presence.",
      requires: ["Target has no yellow/red Assassinations marker.", "Target has or is adjacent to Coalition Presence.", "Do not target a faction with Supremacy in that space.", "Respect same-turn place/remove limits."]
    },
    {
      id: "remove_leverage",
      title: "Remove Leverage",
      citation: "6.3",
      summary: "Remove any one yellow or black Leverage marker from the map or a track.",
      requires: ["A Leverage marker exists on the map or any track."]
    }
  ],
  kpd: [
    commonActions.assault,
    {
      id: "change_stance",
      title: "Change Stance",
      citation: "6.4",
      summary: "Shift KPD Stance one box in either direction.",
      requires: ["KPD Stance track is in use for the scenario."]
    },
    {
      id: "flip_strike",
      title: "Flip Strike to Uprising",
      citation: "6.4",
      summary: "Flip any one Strike marker on the map to its Uprising side.",
      context: ["strike_available"],
      requires: ["A Strike marker exists on the map."]
    },
    {
      id: "gain_momentum",
      title: "Gain Momentum",
      citation: "6.4",
      summary: "KPD becomes the Momentum faction.",
      requires: ["No map requirement."]
    },
    {
      id: "move_mcs",
      title: "Move Middle Class Sympathies",
      citation: "6.4",
      summary: "Move one Available pawn to the KPD mat, or return one pawn from any faction mat.",
      requires: ["Either an Available Middle Class Sympathies pawn or a pawn on a faction mat."]
    },
    {
      id: "move_units",
      title: "Move Units",
      citation: "6.4",
      summary: "Move up to three KPD Worker Militia units.",
      requires: ["Each unit moves independently into adjacent spaces.", "Move up to three spaces, or only one if its origin has a Strike/Uprising or General Strike is active."],
      warnings: ["If a Worker Militia ends with NSDAP SA, KPD must immediately conduct a free Assault against NSDAP."]
    },
    {
      id: "place_cadre",
      title: "Place Cadre",
      citation: "6.4",
      summary: "Place one KPD Cadre.",
      context: ["kpd_cadre_available"],
      requires: ["An Available KPD Cadre.", "Target has KPD Dominance or Parliamentary Control.", "Target does not already contain any Cadre."]
    },
    {
      id: "place_influence",
      title: "Place Influence",
      citation: "6.4",
      summary: "Place KPD Influence up to the Economy track amount.",
      requires: ["Target has no yellow/red Assassinations marker.", "Target is Berlin/adjacent, has or is adjacent to KPD Presence, or has a KPD Cadre.", "Respect Population and same-turn place/remove limits."]
    },
    {
      id: "place_strike",
      title: "Place Strike",
      citation: "6.4",
      summary: "Place one Strike and remove Leverage from that space.",
      context: ["strike_available"],
      requires: ["An Available Strike marker.", "Target has KPD Dominance and/or KPD Parliamentary Control.", "Target has no Strike or Uprising marker."],
      procedure: ["Return any Leverage from the selected space.", "If this creates at least three total Strikes plus Uprisings, place General Strike on the Timeline.", "When General Strike is placed, remove one Coalition Reform if any and remove all map/Economy-track Leverage."]
    },
    {
      id: "place_sudden_victory",
      title: "Place Sudden Victory Marker",
      citation: "6.4",
      summary: "Place the KPD Revolution marker on the Timeline in the current year.",
      context: ["sudden_victory_marker_available"],
      requires: ["KPD Revolution marker must be Available.", "Victory is checked later during the Sudden Victory Step."]
    },
    {
      id: "place_unit",
      title: "Place Unit",
      citation: "6.4",
      summary: "Place one Worker Militia unit.",
      context: ["unit_available"],
      requires: ["An Available Worker Militia.", "Target has KPD Dominance, KPD Parliamentary Control, or a KPD Cadre."],
      warnings: ["If placed with NSDAP SA, KPD must immediately conduct a free Assault against NSDAP."]
    },
    {
      id: "remove_influence",
      title: "Remove Influence",
      citation: "6.4",
      summary: "Remove opposing Influence up to the Economy track amount.",
      requires: ["Target has no yellow/red Assassinations marker.", "Target has or is adjacent to KPD Presence and/or has a KPD Cadre.", "Multiple factions may be targeted.", "Do not target a faction with Supremacy in that space.", "Respect same-turn place/remove limits."]
    }
  ],
  nsdap: [
    commonActions.assault,
    {
      id: "change_stance",
      title: "Change Stance",
      citation: "6.5",
      summary: "Shift NSDAP Stance one box in either direction.",
      requires: ["NSDAP Stance track is in use for the scenario."]
    },
    {
      id: "gain_momentum",
      title: "Gain Momentum",
      citation: "6.5",
      summary: "NSDAP becomes the Momentum faction.",
      requires: ["No map requirement."]
    },
    {
      id: "move_mcs",
      title: "Move Middle Class Sympathies",
      citation: "6.5",
      summary: "For each NSDAP Cadre on the map, move or return one Middle Class Sympathies pawn.",
      requires: ["At least one NSDAP Cadre on the map for this to have effect."],
      procedure: ["For each Cadre, choose one: move an Available pawn to NSDAP, move one from RC mat to NSDAP, or return one from any faction mat."]
    },
    {
      id: "move_units",
      title: "Move Units",
      citation: "6.5",
      summary: "Move up to three NSDAP SA units.",
      requires: ["Each unit moves independently into adjacent spaces.", "Move up to three spaces, or only one if its origin has a Strike/Uprising or General Strike is active."],
      warnings: ["If an SA ends with KPD Worker Militia, NSDAP must immediately conduct a free Assault against KPD."]
    },
    {
      id: "place_assassinations",
      title: "Place Assassinations",
      citation: "6.5",
      summary: "Target Coalition/KPD or RC with an Assassinations marker and remove Influence or a key piece.",
      context: ["assassination_available"],
      requires: ["An Available Assassinations marker.", "If targeting Coalition/KPD, target a space with Coalition and/or KPD Presence.", "If targeting RC, target a space with RC Presence."],
      procedure: ["Yellow/red side removes up to two total Coalition/KPD Influence, or one Coalition Reform, or one KPD Cadre.", "Brown/black side removes up to two RC Influence.", "If two or more Conservative Cliques are on the map and another marker is available, also target a vulnerable Conservative Clique."]
    },
    {
      id: "place_cadre",
      title: "Place Cadre",
      citation: "6.5",
      summary: "Place one NSDAP Cadre.",
      context: ["nsdap_cadre_available"],
      requires: ["An Available NSDAP Cadre.", "Target has NSDAP Dominance or Parliamentary Control.", "Target does not already contain any Cadre."]
    },
    {
      id: "place_influence",
      title: "Place Influence",
      citation: "6.5",
      summary: "Place NSDAP Influence up to the Economy track amount.",
      requires: ["Target has no brown/black Assassinations marker.", "Target is Muenchen/Bayern, has or is adjacent to NSDAP Presence, has an NSDAP Cadre, or has RC Dominance.", "Respect Population and same-turn place/remove limits."]
    },
    {
      id: "place_sudden_victory",
      title: "Place Sudden Victory Marker",
      citation: "6.5",
      summary: "Place the NSDAP Brown Putsch marker on the Timeline in the current year.",
      context: ["sudden_victory_marker_available"],
      requires: ["NSDAP Putsch marker must be Available.", "Victory is checked later during the Sudden Victory Step."]
    },
    {
      id: "place_unit",
      title: "Place Unit",
      citation: "6.5",
      summary: "Place one SA unit.",
      context: ["unit_available"],
      requires: ["An Available SA unit.", "Target has NSDAP Parliamentary Control, NSDAP Dominance, or an NSDAP Cadre."],
      warnings: ["If placed with KPD Worker Militia, NSDAP must immediately conduct a free Assault against KPD."]
    },
    {
      id: "remove_influence",
      title: "Remove Influence",
      citation: "6.5",
      summary: "Remove opposing Influence up to the Economy track amount.",
      requires: ["Target has no brown/black Assassinations marker.", "Target has or is adjacent to NSDAP Presence and/or has an NSDAP Cadre.", "Multiple factions may be targeted.", "Do not target a faction with Supremacy in that space.", "Respect same-turn place/remove limits."]
    }
  ],
  radical_conservatives: [
    {
      id: "advance_reaction",
      title: "Advance Reaction Track",
      citation: "6.6",
      summary: "Increase Reaction by one box.",
      context: ["black_leverage_above_reaction", "reaction_can_advance"],
      requires: ["Black Leverage must be in the box above current Reaction.", "Reaction can never exceed Progress by more than one box."]
    },
    commonActions.assault,
    {
      id: "gain_momentum",
      title: "Gain Momentum",
      citation: "6.6",
      summary: "RC becomes the Momentum faction.",
      requires: ["No map requirement."]
    },
    {
      id: "move_mcs",
      title: "Move Middle Class Sympathies",
      citation: "6.6",
      summary: "Move one Available pawn to the RC mat, or return one pawn from any faction mat.",
      requires: ["Either an Available Middle Class Sympathies pawn or a pawn on a faction mat."]
    },
    {
      id: "move_units",
      title: "Move Units",
      citation: "6.6",
      summary: "Move up to three RC Rogue Freikorps units.",
      requires: ["Each unit moves independently into adjacent spaces.", "Move up to three spaces, or only one if its origin has a Strike/Uprising or General Strike is active."]
    },
    {
      id: "place_assassinations",
      title: "Place Assassinations",
      citation: "6.6",
      summary: "Target Coalition/KPD or NSDAP with an Assassinations marker.",
      context: ["assassination_available"],
      requires: ["An Available Assassinations marker.", "If targeting Coalition/KPD, target a space with Coalition and/or KPD Presence.", "If targeting NSDAP, target a space with NSDAP Presence."],
      procedure: ["Yellow/red side removes up to two Coalition/KPD Influence, or one Coalition Reform, or one KPD Cadre.", "Brown/black side removes up to two NSDAP Influence or one NSDAP Cadre."]
    },
    {
      id: "place_clique",
      title: "Place Conservative Clique",
      citation: "6.6",
      summary: "Place one Conservative Clique in a right-wing stronghold.",
      context: ["conservative_clique_available"],
      requires: ["An Available Conservative Clique.", "Target has RC Dominance.", "Target has no brown/black Assassinations marker."]
    },
    {
      id: "place_influence",
      title: "Place Influence",
      citation: "6.6",
      summary: "Place RC Influence up to the Reaction track amount.",
      requires: ["Target has no brown/black Assassinations marker.", "Target is Berlin/adjacent or within RC Middle Class Sympathies range of a Conservative Clique, minimum range 1.", "Respect Population and same-turn place/remove limits."]
    },
    {
      id: "place_leverage_map",
      title: "Place Leverage on Map",
      citation: "6.6",
      summary: "Place black Leverage in a space with RC Presence and clear rival pressure.",
      context: ["general_strike_clear", "leverage_available"],
      requires: ["General Strike marker is not on the Timeline.", "An Available black Leverage marker.", "Target space has RC Presence."],
      procedure: ["Place black Leverage.", "Remove any Assassinations marker or NSDAP Cadre from that space."]
    },
    {
      id: "place_leverage_track",
      title: "Place Leverage on Track",
      citation: "6.6",
      summary: "Place black Leverage on the Reaction or Economy track.",
      context: ["leverage_available"],
      requires: ["An Available black Leverage marker.", "Adjust Economy if appropriate."]
    },
    {
      id: "place_sudden_victory",
      title: "Place Sudden Victory Marker",
      citation: "6.6",
      summary: "Place the RC Black Putsch marker on the Timeline in the current year.",
      context: ["sudden_victory_marker_available"],
      requires: ["RC Putsch marker must be Available.", "Victory is checked later during the Sudden Victory Step."]
    },
    {
      id: "place_unit",
      title: "Place Unit",
      citation: "6.6",
      summary: "Place one Rogue Freikorps unit.",
      context: ["unit_available"],
      requires: ["An Available Rogue Freikorps unit.", "Target has RC Parliamentary Control or RC Dominance."]
    },
    {
      id: "remove_influence",
      title: "Remove Influence",
      citation: "6.6",
      summary: "Remove opposing Influence up to the Reaction track amount.",
      requires: ["Target is within Conservative Clique range equal to RC Middle Class Sympathies pawns, minimum 1.", "Target has no brown/black Assassinations marker.", "Multiple factions may be targeted.", "Do not target a faction with Supremacy in that space.", "Respect same-turn place/remove limits."]
    },
    {
      id: "remove_leverage",
      title: "Remove Leverage",
      citation: "6.6",
      summary: "Remove any one yellow or black Leverage marker from the map or a track.",
      requires: ["A Leverage marker exists on the map or any track."]
    }
  ]
};

const botActionPriorities = {
  coalition: ["Special Action", "Place Influence", "Remove Influence"],
  kpd: ["Place Influence", "Special Action", "Remove Influence"],
  nsdap: ["Place Influence", "Special Action", "Remove Influence"],
  radical_conservatives: ["Place Conservative Clique", "Place Influence", "Special Action", "Remove Influence"]
};

const botOptionGuidelines = {
  coalition: [
    "Remove opposing units and pieces.",
    "Place Coalition units and pieces.",
    "Gain Parliamentary Control.",
    "Increase Progress.",
    "Decrease Reaction.",
    "Shift Unity right.",
    "Shift Economy toward Stable.",
    "Move Middle Class Sympathies.",
    "Place yellow Leverage.",
    "Remove black Leverage."
  ],
  kpd: [
    "Remove opposing units and pieces.",
    "Place KPD units and pieces.",
    "Gain Parliamentary Control.",
    "Decrease Progress.",
    "Decrease Reaction.",
    "Shift Economy toward Mass Unemployment.",
    "Move Middle Class Sympathies."
  ],
  nsdap: [
    "Remove opposing units and pieces.",
    "Move Middle Class Sympathies.",
    "Place NSDAP units and pieces.",
    "Gain Parliamentary Control.",
    "Increase Reaction.",
    "Decrease Progress.",
    "Shift Economy toward Mass Unemployment."
  ],
  radical_conservatives: [
    "Remove opposing units and pieces.",
    "Move Middle Class Sympathies.",
    "Gain Parliamentary Control.",
    "Place RC units and pieces.",
    "Increase Reaction.",
    "Decrease Progress if Reaction is not greater than Progress.",
    "Shift Economy toward Hyperinflation.",
    "Place black Leverage.",
    "Remove yellow Leverage."
  ]
};

const botPiecePriority = [
  "Reform",
  "Uprising",
  "Middle Class Sympathies, opposing faction mat first",
  "Conservative Clique",
  "Strike",
  "Assassinations",
  "Leverage",
  "Cadre",
  "Unit, Reichswehr before Freikorps and revealed before unrevealed",
  "Influence cube"
];

const botSpacePriority = [
  "Use Special Action-specific instructions first.",
  "For Influence placement/removal/replacement: gain active bot Dominance, then remove opposing Dominance.",
  "For unit placement/removal/replacement: gain active bot Supremacy where opposing units are present, then remove opposing Supremacy, then gain Supremacy in a space without units.",
  "For unit/piece track choices: faction mat, then Progress/Reaction, Economy, U.S. Deals, U.S.S.R. Deals, then map spaces.",
  "Otherwise use Impulse Space/Region, closest space, highest PV, highest Population, then random."
];

const botSpecialTables = {
  coalition: [
    {
      range: "1-2",
      title: "Reform Actions",
      actions: [
        "Place Sudden Victory Marker only in Golden Twenties or Decline if Coalition meets Sudden Victory requirements.",
        "Place Reform in a space or region without a Reform marker.",
        "Advance Progress Track.",
        "Place Leverage on a Track, then Remove Leverage.",
        "Increase U.S. Deals one box."
      ]
    },
    {
      range: "3",
      title: "Political Actions",
      actions: [
        "Move Middle Class Sympathies to Coalition mat first if possible, otherwise remove one from an opposing mat.",
        "Then shift Unity one box right."
      ]
    },
    {
      range: "4",
      title: "Military Actions",
      actions: [
        "Place Unit, then Assault the first eligible opposing faction where Coalition Potential Assault Strength is greater.",
        "If that cannot be performed, Increase U.S.S.R. Deals one box."
      ]
    },
    {
      range: "5-6",
      title: "Economic Actions",
      actions: [
        "If Economy is at least two boxes from Stable or black Economy Leverage exists, remove black Economy Leverage, then place yellow Economy Leverage.",
        "Place Leverage on the Map, selecting a space with a Strike first.",
        "Increase U.S. Deals one box."
      ]
    }
  ],
  kpd: [
    {
      range: "1",
      title: "Military Actions",
      actions: ["Place Unit, then Assault the first eligible opposing faction where KPD Potential Assault Strength is greater."]
    },
    {
      range: "2",
      title: "Stance Actions",
      actions: ["Change Stance: roll a die plus KPD Cadres on map. On 4+, shift toward Revolutionary; otherwise shift toward Democratic."]
    },
    {
      range: "3-4",
      title: "Strike Actions",
      actions: ["Flip Strike to Uprising only if General Strike is on the Timeline.", "If that cannot be performed, Place Strike."]
    },
    {
      range: "5",
      title: "Cadre Actions",
      actions: ["Place Cadre."]
    },
    {
      range: "6",
      title: "Political Actions",
      actions: ["Move Middle Class Sympathies."]
    }
  ],
  nsdap: [
    {
      range: "1",
      title: "Military Actions",
      actions: ["Place Unit, then Assault the first eligible opposing faction where NSDAP Potential Assault Strength is greater."]
    },
    {
      range: "2",
      title: "Stance Actions",
      actions: ["Change Stance: roll a die plus NSDAP Cadres on map. On 4+, shift toward Revolutionary; otherwise shift toward Democratic."]
    },
    {
      range: "3-4",
      title: "Assassination Actions",
      actions: ["Place Assassinations only in a space that does not already have an Assassinations marker."]
    },
    {
      range: "5",
      title: "Cadre Actions",
      actions: ["Place Cadre."]
    },
    {
      range: "6",
      title: "Political Actions",
      actions: ["Move Middle Class Sympathies."]
    }
  ],
  radical_conservatives: [
    {
      range: "1",
      title: "Military Actions",
      actions: ["Place Unit, or if no RC Freikorps are available, test Coalition Loyalty in spaces with Rogue Freikorps first.", "Then Assault where RC Potential Assault Strength is greater."]
    },
    {
      range: "2",
      title: "Cultural Leverage Actions",
      actions: ["Place Leverage on a Track.", "Then remove the highest yellow Leverage from the Progress track."]
    },
    {
      range: "3",
      title: "Economic Leverage Actions",
      actions: ["Remove one yellow Leverage from the Economy track.", "Then place black Leverage on the Economy track: Hyperinflation side in Crisis, Mass Unemployment side otherwise."]
    },
    {
      range: "4",
      title: "Political Actions",
      actions: ["Move Middle Class Sympathies."]
    },
    {
      range: "5-6",
      title: "Agitation Actions",
      actions: ["Advance Reaction Track.", "If that cannot be performed, Place Assassinations in a space without an Assassinations marker."]
    }
  ]
};

const botCardDatabase = {
  "01": { faction: "coalition", impulse: "Berlin", summary: "event_two_actions", priority: ["Special Actions", "Place Influence", "Remove Influence"], image: "assets/cards/bots/bot_01.jpg" },
  "02": { faction: "coalition", impulse: "Berlin", summary: "event_two_actions", priority: ["Special Actions", "Place Influence", "Remove Influence"], reshuffle: true, image: "assets/cards/bots/bot_02.jpg" },
  "03": { faction: "coalition", impulse: "Northern States", summary: "one_action", priority: ["Special Actions", "Place Influence", "Remove Influence"], image: "assets/cards/bots/bot_03.jpg" },
  "04": { faction: "coalition", impulse: "Munchen", summary: "event_two_actions", priority: ["Special Actions", "Place Influence", "Remove Influence"], image: "assets/cards/bots/bot_04.jpg" },
  "05": { faction: "coalition", impulse: "Munchen", summary: "event_two_actions", priority: ["Special Actions", "Place Influence", "Remove Influence"], image: "assets/cards/bots/bot_05.jpg" },
  "06": { faction: "coalition", impulse: "Southern States", summary: "one_action", priority: ["Special Actions", "Place Influence", "Remove Influence"], image: "assets/cards/bots/bot_06.jpg" },
  "07": { faction: "coalition", impulse: "Koln", summary: "event_two_actions", priority: ["Special Actions", "Place Influence", "Remove Influence"], image: "assets/cards/bots/bot_07.jpg" },
  "08": { faction: "coalition", impulse: "Hamburg", summary: "event_two_actions", priority: ["Special Actions", "Place Influence", "Remove Influence"], image: "assets/cards/bots/bot_08.jpg" },
  "09": { faction: "coalition", impulse: "Prussian Provinces", summary: "event_two_actions", priority: ["Special Actions", "Place Influence", "Remove Influence"], image: "assets/cards/bots/bot_09.jpg" },
  "10": { faction: "kpd", impulse: "Berlin", summary: "event_two_actions", priority: ["Place Influence", "Special Actions", "Remove Influence"], image: "assets/cards/bots/bot_10.jpg" },
  "11": { faction: "kpd", impulse: "Berlin", summary: "event_two_actions", priority: ["Place Influence", "Special Actions", "Remove Influence"], reshuffle: true, image: "assets/cards/bots/bot_11.jpg" },
  "12": { faction: "kpd", impulse: "Northern States", summary: "event_two_actions", priority: ["Place Influence", "Special Actions", "Remove Influence"], image: "assets/cards/bots/bot_12.jpg" },
  "13": { faction: "kpd", impulse: "Munchen", summary: "event_two_actions", priority: ["Place Influence", "Special Actions", "Remove Influence"], image: "assets/cards/bots/bot_13.jpg" },
  "14": { faction: "kpd", impulse: "Hamburg", summary: "event_two_actions", priority: ["Place Influence", "Special Actions", "Remove Influence"], image: "assets/cards/bots/bot_14.jpg" },
  "15": { faction: "kpd", impulse: "Hamburg", summary: "one_action", priority: ["Place Influence", "Special Actions", "Remove Influence"], image: "assets/cards/bots/bot_15.jpg" },
  "16": { faction: "kpd", impulse: "Southern States", summary: "event_two_actions", priority: ["Place Influence", "Special Actions", "Remove Influence"], image: "assets/cards/bots/bot_16.jpg" },
  "17": { faction: "kpd", impulse: "Koln", summary: "event_two_actions", priority: ["Place Influence", "Special Actions", "Remove Influence"], image: "assets/cards/bots/bot_17.jpg" },
  "18": { faction: "kpd", impulse: "Koln", summary: "one_action", priority: ["Place Influence", "Special Actions", "Remove Influence"], image: "assets/cards/bots/bot_18.jpg" },
  "19": { faction: "nsdap", impulse: "Munchen", summary: "event_two_actions", priority: ["Place Influence", "Special Actions", "Remove Influence"], image: "assets/cards/bots/bot_19.jpg" },
  "20": { faction: "nsdap", impulse: "Munchen", summary: "event_two_actions", priority: ["Place Influence", "Special Actions", "Remove Influence"], reshuffle: true, image: "assets/cards/bots/bot_20.jpg" },
  "21": { faction: "nsdap", impulse: "Munchen", summary: "event_two_actions", priority: ["Place Influence", "Special Actions", "Remove Influence"], image: "assets/cards/bots/bot_21.jpg" },
  "22": { faction: "nsdap", impulse: "Berlin", summary: "event_two_actions", priority: ["Place Influence", "Special Actions", "Remove Influence"], image: "assets/cards/bots/bot_22.jpg" },
  "23": { faction: "nsdap", impulse: "Hamburg", summary: "event_two_actions", priority: ["Place Influence", "Special Actions", "Remove Influence"], image: "assets/cards/bots/bot_23.jpg" },
  "24": { faction: "nsdap", impulse: "Hamburg", summary: "one_action", priority: ["Place Influence", "Special Actions", "Remove Influence"], image: "assets/cards/bots/bot_24.jpg" },
  "25": { faction: "nsdap", impulse: "Berlin", summary: "event_two_actions", priority: ["Place Influence", "Special Actions", "Remove Influence"], image: "assets/cards/bots/bot_25.jpg" },
  "26": { faction: "nsdap", impulse: "Koln", summary: "event_two_actions", priority: ["Place Influence", "Special Actions", "Remove Influence"], image: "assets/cards/bots/bot_26.jpg" },
  "27": { faction: "nsdap", impulse: "Koln", summary: "one_action", priority: ["Place Influence", "Special Actions", "Remove Influence"], image: "assets/cards/bots/bot_27.jpg" },
  "28": { faction: "radical_conservatives", impulse: "Clique A", summary: "event_two_actions", priority: ["Place Conservative Clique", "Place Influence", "Special Actions", "Remove Influence"], image: "assets/cards/bots/bot_28.jpg" },
  "29": { faction: "radical_conservatives", impulse: "Clique A", summary: "event_two_actions", priority: ["Place Conservative Clique", "Place Influence", "Special Actions", "Remove Influence"], reshuffle: true, image: "assets/cards/bots/bot_29.jpg" },
  "30": { faction: "radical_conservatives", impulse: "Clique A", summary: "one_action", priority: ["Place Conservative Clique", "Place Influence", "Special Actions", "Remove Influence"], image: "assets/cards/bots/bot_30.jpg" },
  "31": { faction: "radical_conservatives", impulse: "Clique C", summary: "event_two_actions", priority: ["Place Conservative Clique", "Place Influence", "Special Actions", "Remove Influence"], image: "assets/cards/bots/bot_31.jpg" },
  "32": { faction: "radical_conservatives", impulse: "Clique B", summary: "event_two_actions", priority: ["Place Conservative Clique", "Place Influence", "Special Actions", "Remove Influence"], image: "assets/cards/bots/bot_32.jpg" },
  "33": { faction: "radical_conservatives", impulse: "Clique B", summary: "one_action", priority: ["Place Conservative Clique", "Place Influence", "Special Actions", "Remove Influence"], image: "assets/cards/bots/bot_33.jpg" },
  "34": { faction: "radical_conservatives", impulse: "Clique B", summary: "event_two_actions", priority: ["Place Conservative Clique", "Place Influence", "Special Actions", "Remove Influence"], image: "assets/cards/bots/bot_34.jpg" },
  "35": { faction: "radical_conservatives", impulse: "Clique C", summary: "event_two_actions", priority: ["Place Conservative Clique", "Place Influence", "Special Actions", "Remove Influence"], image: "assets/cards/bots/bot_35.jpg" },
  "36": { faction: "radical_conservatives", impulse: "Clique C", summary: "event_two_actions", priority: ["Place Conservative Clique", "Place Influence", "Special Actions", "Remove Influence"], image: "assets/cards/bots/bot_36.jpg" }
};

const botCardRanges = {
  coalition: ["01", "02", "03", "04", "05", "06", "07", "08", "09"],
  kpd: ["10", "11", "12", "13", "14", "15", "16", "17", "18"],
  nsdap: ["19", "20", "21", "22", "23", "24", "25", "26", "27"],
  radical_conservatives: ["28", "29", "30", "31", "32", "33", "34", "35", "36"]
};

const botPriorityActionMap = {
  "Special Actions": "special",
  "Place Influence": "place_influence",
  "Remove Influence": "remove_influence",
  "Place Conservative Clique": "place_clique"
};

const state = {
  screen: "dashboard",
  selectedFaction: "coalition",
  currentSource: "rulebook",
  year: 1919,
  round: 1,
  momentumFaction: "coalition",
  turnOrder: ["coalition", "kpd", "nsdap", "radical_conservatives"],
  activeTurnIndex: 0,
  activeFaction: "coalition",
  eventTitle: "",
  currentStep: "event",
  sequenceStepIndex: 0,
  actionPage: "setup",
  actionSubpage: "choice",
  previousActionPage: "turn",
  sequenceAnswers: {
    actionChoice: "",
    electionPlayed: "",
    suddenVictory: "",
    generalElectionOutcome: "",
    timelineFlip: ""
  },
  actionPlan: ["", ""],
  selectedActionId: "",
  actionContext: {},
  soloSetupComplete: false,
  boardState: {
    progress: 0,
    reaction: 0,
    economy: "stable",
    unity: "sound",
    generalStrikeActive: false,
    yellowProgressLeverage: "unknown",
    blackReactionLeverage: "unknown",
    notes: ""
  },
  controllers: {
    coalition: "human",
    kpd: "bot",
    nsdap: "bot",
    radical_conservatives: "bot"
  },
  botTurn: {
    card: "",
    summary: "",
    factionOrder: "",
    impulse: "",
    specialDie: "",
    action: "",
    actions: ["", ""],
    specialDice: ["", ""]
  },
  sequenceChecks: {},
  completedSequence: [],
  notes: "",
  saveLoadText: "",
  lastSavedAt: null,
  completedSteps: {
    event: false,
    factionTurns: false,
    electionCheck: false,
    cleanup: false
  }
};

const stepLabels = {
  event: "Event / special card",
  factionTurns: "Faction turns",
  electionCheck: "Election / control check",
  cleanup: "Cleanup / advance"
};

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function btn(label, onclick, klass = "") {
  return `<button class="btn ${klass}" onclick="${onclick}">${esc(label)}</button>`;
}

function badge(label, tone = "") {
  return `<span class="badge ${tone}">${esc(label)}</span>`;
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function emptyBotTurn() {
  return {
    card: "",
    summary: "",
    factionOrder: "",
    impulse: "",
    specialDie: "",
    action: "",
    actions: ["", ""],
    specialDice: ["", ""]
  };
}

function normalizeState() {
  if (!years.includes(Number(state.year))) state.year = 1919;
  state.year = Number(state.year);
  state.round = state.round === 2 ? 2 : 1;
  if (!factions[state.momentumFaction]) state.momentumFaction = "coalition";
  if (!Array.isArray(state.turnOrder)) state.turnOrder = [...factionIds];
  const cleanOrder = state.turnOrder.filter(id => factions[id]);
  for (const id of factionIds) {
    if (!cleanOrder.includes(id)) cleanOrder.push(id);
  }
  state.turnOrder = cleanOrder.slice(0, factionIds.length);
  if (!Number.isInteger(state.activeTurnIndex)) state.activeTurnIndex = 0;
  if (state.activeTurnIndex < 0 || state.activeTurnIndex >= state.turnOrder.length) state.activeTurnIndex = 0;
  if (!factions[state.selectedFaction]) state.selectedFaction = "coalition";
  state.activeFaction = state.turnOrder[state.activeTurnIndex] || state.activeFaction;
  if (!factions[state.activeFaction]) state.activeFaction = "coalition";
  if (!sources.some(source => source.id === state.currentSource)) state.currentSource = "rulebook";
  if (!state.sequenceAnswers || typeof state.sequenceAnswers !== "object") state.sequenceAnswers = {};
  if (!["setup", "turn", "board"].includes(state.actionPage)) state.actionPage = "setup";
  if (!["choice", "event", "action1", "action2", "election", "bot_summary", "bot_action1", "bot_action2", "bot_election", "done"].includes(state.actionSubpage)) state.actionSubpage = "choice";
  if (!["setup", "turn", "board"].includes(state.previousActionPage)) state.previousActionPage = "turn";
  state.sequenceAnswers = {
    actionChoice: "",
    electionPlayed: "",
    suddenVictory: "",
    generalElectionOutcome: "",
    timelineFlip: "",
    ...state.sequenceAnswers
  };
  if (!Array.isArray(state.actionPlan)) state.actionPlan = ["", ""];
  state.actionPlan = [state.actionPlan[0] || "", state.actionPlan[1] || ""];
  if (typeof state.selectedActionId !== "string") state.selectedActionId = "";
  if (!state.actionContext || typeof state.actionContext !== "object") state.actionContext = {};
  state.soloSetupComplete = !!state.soloSetupComplete;
  if (!state.boardState || typeof state.boardState !== "object") state.boardState = {};
  state.boardState = {
    progress: Number.isFinite(Number(state.boardState.progress)) ? Number(state.boardState.progress) : 0,
    reaction: Number.isFinite(Number(state.boardState.reaction)) ? Number(state.boardState.reaction) : 0,
    economy: state.boardState.economy || "stable",
    unity: state.boardState.unity || "sound",
    generalStrikeActive: !!state.boardState.generalStrikeActive,
    yellowProgressLeverage: state.boardState.yellowProgressLeverage || "unknown",
    blackReactionLeverage: state.boardState.blackReactionLeverage || "unknown",
    notes: state.boardState.notes || ""
  };
  if (!state.controllers || typeof state.controllers !== "object") state.controllers = {};
  state.controllers = {
    coalition: state.controllers.coalition === "bot" ? "bot" : "human",
    kpd: state.controllers.kpd === "human" ? "human" : "bot",
    nsdap: state.controllers.nsdap === "human" ? "human" : "bot",
    radical_conservatives: state.controllers.radical_conservatives === "human" ? "human" : "bot"
  };
  if (!state.botTurn || typeof state.botTurn !== "object") state.botTurn = {};
  state.botTurn = {
    card: "",
    summary: "",
    factionOrder: "",
    impulse: "",
    specialDie: "",
    action: "",
    actions: ["", ""],
    specialDice: ["", ""],
    ...state.botTurn
  };
  if (!Array.isArray(state.botTurn.actions)) state.botTurn.actions = [state.botTurn.action || "", ""];
  state.botTurn.actions = [state.botTurn.actions[0] || state.botTurn.action || "", state.botTurn.actions[1] || ""];
  if (!Array.isArray(state.botTurn.specialDice)) state.botTurn.specialDice = [state.botTurn.specialDie || "", ""];
  state.botTurn.specialDice = [state.botTurn.specialDice[0] || state.botTurn.specialDie || "", state.botTurn.specialDice[1] || ""];
  if (!state.sequenceChecks || typeof state.sequenceChecks !== "object") state.sequenceChecks = {};
  if (!Array.isArray(state.completedSequence)) state.completedSequence = [];
  if (!Number.isInteger(state.sequenceStepIndex)) state.sequenceStepIndex = 0;
  if (state.sequenceStepIndex < 0 || state.sequenceStepIndex >= sequencePhases.length) state.sequenceStepIndex = 0;
  if (!state.completedSteps || typeof state.completedSteps !== "object") {
    state.completedSteps = {
      event: false,
      factionTurns: false,
      electionCheck: false,
      cleanup: false
    };
  }
}

function currentFaction() {
  return factions[state.selectedFaction] || factions.coalition;
}

function activeFaction() {
  return factions[state.activeFaction] || factions.coalition;
}

function currentSource() {
  return sources.find(source => source.id === state.currentSource) || sources[0];
}

function currentFactionActions() {
  return factionActions[state.activeFaction] || factionActions.coalition;
}

function findAction(actionId) {
  return currentFactionActions().find(action => action.id === actionId) || null;
}

function defaultActionId() {
  const actions = currentFactionActions();
  return (actions.find(action => actionStatus(action).tone !== "blocked") || actions[0] || {}).id || "";
}

function activeController() {
  return state.controllers[state.activeFaction] || "human";
}

function isActiveBot() {
  return activeController() === "bot";
}

function currentSequencePhase() {
  return sequencePhases[state.sequenceStepIndex] || sequencePhases[0];
}

function currentHalfLabel() {
  return state.round === 1 ? "Early Year" : "Late Year";
}

function eraForYear(year) {
  if (year <= 1923) return { label: "Crisis", handSize: 7 };
  if (year <= 1929) return { label: "Golden Twenties", handSize: 9 };
  return { label: "Decline", handSize: 6 };
}

function setSequencePhase(phaseId) {
  const index = sequencePhaseIds.indexOf(phaseId);
  if (index < 0) return;
  state.sequenceStepIndex = index;
}

function markSequenceComplete(phaseId) {
  if (!state.completedSequence.includes(phaseId)) {
    state.completedSequence.push(phaseId);
  }
}

function clearSequenceChecks(prefix) {
  for (const key of Object.keys(state.sequenceChecks)) {
    if (key.startsWith(prefix)) delete state.sequenceChecks[key];
  }
}

function setScreen(screen) {
  state.screen = screen;
  render();
}

function setFaction(factionId) {
  if (!factions[factionId]) return;
  state.selectedFaction = factionId;
  render();
}

function setActiveFaction(factionId) {
  if (!factions[factionId]) return;
  state.activeFaction = factionId;
  const index = state.turnOrder.indexOf(factionId);
  if (index >= 0) state.activeTurnIndex = index;
  state.actionPlan = ["", ""];
  state.selectedActionId = "";
  state.actionContext = {};
  state.botTurn = emptyBotTurn();
  render();
}

function setMomentumFaction(factionId) {
  if (!factions[factionId]) return;
  state.momentumFaction = factionId;
  render();
}

function setTurnOrderSlot(slot, factionId) {
  const index = Number(slot);
  if (!factions[factionId] || index < 0 || index >= factionIds.length) return;
  const order = [...state.turnOrder];
  const existingIndex = order.indexOf(factionId);
  if (existingIndex >= 0) {
    const displaced = order[index];
    order[existingIndex] = displaced;
  }
  order[index] = factionId;
  state.turnOrder = order;
  if (state.actionPage === "setup") {
    state.activeTurnIndex = 0;
    state.activeFaction = state.turnOrder[0] || state.activeFaction;
  } else {
    state.activeFaction = state.turnOrder[state.activeTurnIndex] || state.activeFaction;
  }
  render();
}

function setActiveTurnIndex(index) {
  const parsed = Number(index);
  if (parsed < 0 || parsed >= state.turnOrder.length) return;
  state.activeTurnIndex = parsed;
  setActiveFaction(state.turnOrder[parsed]);
}

function setSource(sourceId) {
  state.currentSource = sourceId;
  render();
}

function setYear(year) {
  const parsed = Number(year);
  if (!years.includes(parsed)) return;
  state.year = parsed;
  state.activeTurnIndex = 0;
  state.activeFaction = state.turnOrder[0] || "coalition";
  resetSequenceForNextAction();
  render();
}

function setRound(round) {
  state.round = round === 2 ? 2 : 1;
  state.activeTurnIndex = 0;
  state.activeFaction = state.turnOrder[0] || "coalition";
  resetSequenceForNextAction();
  render();
}

function setCurrentStep(step) {
  if (!stepLabels[step]) return;
  state.currentStep = step;
  render();
}

function toggleStep(step) {
  if (!stepLabels[step]) return;
  state.completedSteps[step] = !state.completedSteps[step];
  render();
}

function updateEventTitle(value) {
  state.eventTitle = value;
}

function updateNotes(value) {
  state.notes = value;
}

function updateSaveLoadText(value) {
  state.saveLoadText = value;
}

function completeSoloSetup() {
  state.soloSetupComplete = true;
  render();
}

function editSoloSetup() {
  state.soloSetupComplete = false;
  render();
}

function setBoardState(key, value) {
  if (!Object.prototype.hasOwnProperty.call(state.boardState, key)) return;
  if (key === "progress" || key === "reaction") {
    const parsed = Number(value);
    state.boardState[key] = Number.isFinite(parsed) ? Math.max(0, Math.min(6, parsed)) : 0;
  } else if (key === "generalStrikeActive") {
    state.boardState[key] = value === true || value === "true";
  } else {
    state.boardState[key] = value;
  }
  render();
}

function setActionPage(page) {
  if (!["setup", "turn", "board"].includes(page)) return;
  if (page === "board") state.previousActionPage = state.actionPage === "board" ? "turn" : state.actionPage;
  state.actionPage = page;
  render();
}

function saveTurnSetup() {
  state.activeTurnIndex = 0;
  state.activeFaction = state.turnOrder[0] || "coalition";
  resetCurrentFactionPrompts();
  state.actionPage = "turn";
  state.actionSubpage = isActiveBot() ? "bot_summary" : "choice";
  render();
}

function saveBoardStatePage() {
  state.actionPage = state.previousActionPage || "turn";
  render();
}

function resetCurrentFactionPrompts() {
  state.sequenceAnswers.actionChoice = "";
  state.actionSubpage = isActiveBot() ? "bot_summary" : "choice";
  state.actionPlan = ["", ""];
  state.selectedActionId = "";
  state.eventTitle = "";
  state.botTurn = emptyBotTurn();
  clearSequenceChecks("bot:");
}

function setSequenceAnswer(key, value) {
  state.sequenceAnswers[key] = value;
  if (key === "actionChoice") {
    state.actionPlan = ["", ""];
    state.selectedActionId = "";
    if (value === "pass" || value === "one_action") {
      state.sequenceAnswers.electionPlayed = "no";
    } else {
      state.sequenceAnswers.electionPlayed = "";
    }
    if (value === "pass") state.actionSubpage = "election";
    if (value === "one_action") state.actionSubpage = "action1";
    if (value === "event_then_actions") state.actionSubpage = "event";
    if (value === "actions_then_event") state.actionSubpage = "action1";
  }
  if (key === "electionPlayed" && value === "no") {
    state.sequenceAnswers.generalElectionOutcome = "";
    clearSequenceChecks("elections:");
  }
  render();
}

function setActionContext(key, value) {
  if (!actionStateQuestions[key]) return;
  if (value === "unknown") {
    delete state.actionContext[key];
  } else {
    state.actionContext[key] = value === "yes";
  }
  render();
}

function selectAction(actionId) {
  if (!findAction(actionId)) return;
  state.selectedActionId = actionId;
  render();
}

function setActionSlot(slot, actionId) {
  const index = Number(slot);
  if (![0, 1].includes(index)) return;
  if (actionId && !findAction(actionId)) return;
  state.actionPlan[index] = actionId;
  state.selectedActionId = actionId || state.selectedActionId;
  render();
}

function chooseActionForSlot(slot, actionId) {
  const index = Number(slot);
  if (![0, 1].includes(index)) return;
  if (actionId && !findAction(actionId)) return;
  state.actionPlan[index] = actionId;
  state.selectedActionId = actionId || state.selectedActionId;
  if (index === 0 && requiredActionSlots().length > 1) {
    state.actionSubpage = "action2";
  } else if (state.sequenceAnswers.actionChoice === "actions_then_event") {
    state.actionSubpage = "event";
  } else {
    state.actionSubpage = "election";
  }
  render();
}

function setController(factionId, controller) {
  if (!factions[factionId]) return;
  state.controllers[factionId] = controller === "bot" ? "bot" : "human";
  state.actionPlan = ["", ""];
  state.selectedActionId = "";
  state.botTurn = emptyBotTurn();
  render();
}

function updateBotTurn(key, value) {
  if (!["card", "summary", "factionOrder", "impulse", "specialDie", "action"].includes(key)) return;
  if (key === "action") {
    const index = currentBotActionIndex();
    state.botTurn.actions[index] = value;
    state.botTurn.action = index === 0 ? value : state.botTurn.action;
    if (value !== "special") {
      state.botTurn.specialDice[index] = "";
      if (index === 0) state.botTurn.specialDie = "";
    }
    render();
    return;
  }
  if (key === "specialDie") {
    const index = currentBotActionIndex();
    state.botTurn.specialDice[index] = value;
    if (index === 0) state.botTurn.specialDie = value;
    render();
    return;
  }
  state.botTurn[key] = value;
  if (key === "card") {
    const data = botCardData();
    if (data) {
      applyBotCardData(data);
    }
  }
  if (key === "summary") {
    state.sequenceAnswers.electionPlayed = value === "one_action" ? "no" : "";
    state.botTurn.actions = ["", ""];
    state.botTurn.specialDice = ["", ""];
    state.botTurn.action = "";
    state.botTurn.specialDie = "";
    clearSequenceChecks("bot:");
    state.actionSubpage = "bot_action1";
  }
  render();
}

function chooseBotCard(cardNumber) {
  state.botTurn.card = normalizeBotCardKey(cardNumber) || cardNumber;
  const data = botCardData();
  if (data) applyBotCardData(data);
  render();
}

function toggleSequenceCheck(key) {
  state.sequenceChecks[key] = !state.sequenceChecks[key];
  render();
}

function resetSequenceForNextAction() {
  state.sequenceStepIndex = 0;
  state.actionPage = "setup";
  state.actionSubpage = "choice";
  state.previousActionPage = "turn";
  state.sequenceAnswers.actionChoice = "";
  state.sequenceAnswers.electionPlayed = "";
  state.sequenceAnswers.suddenVictory = "";
  state.sequenceAnswers.generalElectionOutcome = "";
  state.sequenceAnswers.timelineFlip = "";
  state.activeTurnIndex = 0;
  state.activeFaction = state.turnOrder[0] || "coalition";
  resetCurrentFactionPrompts();
  state.completedSequence = [];
}

function endWithResult(title, body) {
  state.result = { title, body };
  setScreen("result");
}

function shiftUnityRight() {
  const order = ["fragile", "shaky", "sound", "strong"];
  const index = order.indexOf(state.boardState.unity);
  state.boardState.unity = order[Math.min(order.length - 1, Math.max(0, index) + 1)];
}

function applyHumanActionMemoryUpdates() {
  if (isActiveBot()) return;
  for (const actionId of state.actionPlan) {
    if (!actionId) continue;
    if (actionId === "gain_momentum") {
      state.momentumFaction = state.activeFaction;
    }
    if (actionId === "advance_progress") {
      state.boardState.progress = Math.min(6, Number(state.boardState.progress) + 1);
      state.boardState.yellowProgressLeverage = "unknown";
    }
    if (actionId === "advance_reaction") {
      state.boardState.reaction = Math.min(6, Number(state.boardState.reaction) + 1);
      state.boardState.blackReactionLeverage = "unknown";
    }
    if (actionId === "increase_unity") {
      shiftUnityRight();
    }
  }
}

function advanceHumanActionSubpage() {
  if (state.actionSubpage === "choice") {
    const choice = state.sequenceAnswers.actionChoice;
    if (choice === "pass") state.actionSubpage = "election";
    if (choice === "one_action") state.actionSubpage = "action1";
    if (choice === "event_then_actions") state.actionSubpage = "event";
    if (choice === "actions_then_event") state.actionSubpage = "action1";
    return true;
  }
  if (state.actionSubpage === "event") {
    state.actionSubpage = state.sequenceAnswers.actionChoice === "event_then_actions" ? "action1" : "election";
    return true;
  }
  if (state.actionSubpage === "action1") {
    if (requiredActionSlots().length > 1) {
      state.actionSubpage = "action2";
    } else {
      state.actionSubpage = "election";
    }
    return true;
  }
  if (state.actionSubpage === "action2") {
    state.actionSubpage = state.sequenceAnswers.actionChoice === "actions_then_event" ? "event" : "election";
    return true;
  }
  if (state.actionSubpage === "election") {
    state.actionSubpage = "done";
    return false;
  }
  return false;
}

function advanceBotActionSubpage() {
  if (state.actionSubpage === "bot_summary") {
    state.actionSubpage = "bot_action1";
    return true;
  }
  if (state.actionSubpage === "bot_action1") {
    state.sequenceChecks["bot:action1"] = true;
    state.actionSubpage = state.botTurn.summary === "event_two_actions" ? "bot_action2" : "bot_election";
    return true;
  }
  if (state.actionSubpage === "bot_action2") {
    state.sequenceChecks["bot:action2"] = true;
    state.actionSubpage = "bot_election";
    return true;
  }
  if (state.actionSubpage === "bot_election") {
    state.actionSubpage = "done";
    return false;
  }
  return false;
}

function continueSequence() {
  const phase = currentSequencePhase();
  markSequenceComplete(phase.id);

  if (phase.id === "action") {
    if (state.actionPage === "setup") {
      state.actionPage = "turn";
      render();
      return;
    }
    if (state.actionPage === "board") {
      saveBoardStatePage();
      return;
    }
    if (state.actionSubpage !== "done") {
      if (isActiveBot()) {
        if (!state.sequenceAnswers.electionPlayed) state.sequenceAnswers.electionPlayed = "no";
        if (advanceBotActionSubpage()) {
          render();
          return;
        }
      } else if (advanceHumanActionSubpage()) {
        render();
        return;
      }
    }
    if (isActiveBot() && !state.sequenceAnswers.electionPlayed) {
      state.sequenceAnswers.electionPlayed = "no";
    }
    applyHumanActionMemoryUpdates();
    if (state.activeTurnIndex < state.turnOrder.length - 1) {
      state.activeTurnIndex += 1;
      state.activeFaction = state.turnOrder[state.activeTurnIndex];
      resetCurrentFactionPrompts();
      state.actionPage = "turn";
      state.actionSubpage = isActiveBot() ? "bot_summary" : "choice";
      render();
      return;
    }
    setSequencePhase("sudden_victory");
    state.actionPage = "setup";
    render();
    return;
  }

  if (phase.id === "sudden_victory") {
    if (state.sequenceAnswers.suddenVictory === "yes") {
      endWithResult("Game ends", "A faction met its Sudden Victory requirements. Use that faction's player aid or the rulebook to confirm final victory details.");
      return;
    }
    setSequencePhase("elections_gate");
    render();
    return;
  }

  if (phase.id === "elections_gate") {
    if (state.sequenceAnswers.electionPlayed === "yes") {
      setSequencePhase("elections");
    } else {
      setSequencePhase("advance_timeline");
    }
    render();
    return;
  }

  if (phase.id === "elections") {
    const outcome = state.sequenceAnswers.generalElectionOutcome;
    if (outcome && outcome !== "coalition") {
      const winner = factions[outcome]?.short || "the winning faction";
      endWithResult("Game ends", `${winner} won the General Election. Resolve the final winner per rule 3.2.`);
      return;
    }
    setSequencePhase("advance_timeline");
    render();
    return;
  }

  if (phase.id === "advance_timeline") {
    if (state.sequenceAnswers.timelineFlip === "early_to_late") {
      state.round = 2;
      resetSequenceForNextAction();
      render();
      return;
    }
    if (state.sequenceAnswers.timelineFlip === "late_to_early") {
      if (state.year >= years[years.length - 1]) {
        endWithResult("Scenario end reached", "The last listed year has ended. Check the scenario victory conditions before continuing.");
        return;
      }
      state.year += 1;
      state.round = 1;
      setSequencePhase("new_year");
      state.sequenceAnswers.timelineFlip = "";
      render();
      return;
    }
    render();
    return;
  }

  if (phase.id === "new_year") {
    if (state.year === 1924 || state.year === 1930) {
      setSequencePhase("new_era");
    } else {
      resetSequenceForNextAction();
    }
    render();
    return;
  }

  if (phase.id === "new_era") {
    resetSequenceForNextAction();
    render();
  }
}

function jumpToSequencePhase(phaseId) {
  setSequencePhase(phaseId);
  render();
}

function advanceRound() {
  if (state.round === 1) {
    state.round = 2;
  } else if (state.year < years[years.length - 1]) {
    state.year += 1;
    state.round = 1;
  }
  state.completedSteps = {
    event: false,
    factionTurns: false,
    electionCheck: false,
    cleanup: false
  };
  state.currentStep = "event";
  state.eventTitle = "";
  resetSequenceForNextAction();
  render();
}

function rewindRound() {
  if (state.round === 2) {
    state.round = 1;
  } else if (state.year > years[0]) {
    state.year -= 1;
    state.round = 2;
  }
  resetSequenceForNextAction();
  render();
}

function saveStateLocal() {
  const payload = deepClone(state);
  payload.lastSavedAt = new Date().toISOString();
  localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(payload));
  state.lastSavedAt = payload.lastSavedAt;
  state.result = {
    title: "State saved",
    body: "The current Weimar Republic companion state was saved in this browser."
  };
  setScreen("result");
}

function loadStateLocal() {
  const raw = localStorage.getItem(LOCAL_SAVE_KEY);
  if (!raw) {
    state.result = {
      title: "No save found",
      body: "There is no saved Weimar Republic companion state in this browser yet."
    };
    setScreen("result");
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    for (const key of Object.keys(state)) delete state[key];
    Object.assign(state, parsed);
    normalizeState();
    render();
  } catch (error) {
    state.result = {
      title: "Load failed",
      body: String(error)
    };
    setScreen("result");
  }
}

function exportStateText() {
  state.saveLoadText = JSON.stringify(state, null, 2);
  render();
}

function importStateText() {
  try {
    const parsed = JSON.parse(state.saveLoadText || "{}");
    for (const key of Object.keys(state)) delete state[key];
    Object.assign(state, parsed);
    normalizeState();
    render();
  } catch (error) {
    state.result = {
      title: "Import failed",
      body: String(error)
    };
    setScreen("result");
  }
}

function resetApp() {
  state.screen = "dashboard";
  state.selectedFaction = "coalition";
  state.currentSource = "rulebook";
  state.year = 1919;
  state.round = 1;
  state.momentumFaction = "coalition";
  state.turnOrder = ["coalition", "kpd", "nsdap", "radical_conservatives"];
  state.activeTurnIndex = 0;
  state.activeFaction = "coalition";
  state.eventTitle = "";
  state.currentStep = "event";
  state.sequenceStepIndex = 0;
  state.actionPage = "setup";
  state.actionSubpage = "choice";
  state.previousActionPage = "turn";
  state.sequenceAnswers = {
    actionChoice: "",
    electionPlayed: "",
    suddenVictory: "",
    generalElectionOutcome: "",
    timelineFlip: ""
  };
  state.actionPlan = ["", ""];
  state.selectedActionId = "";
  state.actionContext = {};
  state.soloSetupComplete = false;
  state.boardState = {
    progress: 0,
    reaction: 0,
    economy: "stable",
    unity: "sound",
    generalStrikeActive: false,
    yellowProgressLeverage: "unknown",
    blackReactionLeverage: "unknown",
    notes: ""
  };
  state.controllers = {
    coalition: "human",
    kpd: "bot",
    nsdap: "bot",
    radical_conservatives: "bot"
  };
  state.botTurn = emptyBotTurn();
  state.sequenceChecks = {};
  state.completedSequence = [];
  state.notes = "";
  state.saveLoadText = "";
  state.lastSavedAt = null;
  state.completedSteps = {
    event: false,
    factionTurns: false,
    electionCheck: false,
    cleanup: false
  };
  state.result = null;
  render();
}

function factionButtonHtml([id, faction]) {
  const selected = state.selectedFaction === id;
  return `<button class="faction-tab ${faction.tone} ${selected ? "selected" : ""}" onclick="setFaction('${id}')">
    <span>${esc(faction.short)}</span>
  </button>`;
}

function activeFactionButtonsHtml() {
  return Object.entries(factions).map(([id, faction]) => {
    const selected = state.activeFaction === id;
    return btn(faction.short, `setActiveFaction('${id}')`, selected ? "primary" : "");
  }).join("");
}

function timelineHtml() {
  return `<div class="timeline">
    ${years.map(year => `<button class="year ${state.year === year ? "selected" : ""}" onclick="setYear(${year})">${year}</button>`).join("")}
  </div>`;
}

function factionOptionsHtml(selectedId) {
  return factionIds.map(id => `<option value="${id}" ${selectedId === id ? "selected" : ""}>${esc(factions[id].short)}</option>`).join("");
}

function momentumButtonsHtml() {
  return `<div class="grid4">
    ${factionIds.map(id => btn(factions[id].short, `setMomentumFaction('${id}')`, state.momentumFaction === id ? "primary" : "")).join("")}
  </div>`;
}

function turnOrderSetupHtml() {
  return `<div class="turn-order-grid">
    ${state.turnOrder.map((id, index) => {
      const active = index === 0;
      return `<div class="turn-order-item ${active ? "active" : ""}">
        <div class="turn-order-label">${index + 1}</div>
        <select class="select-input" onchange="setTurnOrderSlot(${index}, this.value)">
          ${factionOptionsHtml(id)}
        </select>
      </div>`;
    }).join("")}
  </div>`;
}

function turnOrderRailHtml() {
  return `<div class="turn-rail">
    ${state.turnOrder.map((id, index) => {
      const faction = factions[id] || factions.coalition;
      const active = index === state.activeTurnIndex;
      const complete = index < state.activeTurnIndex;
      const controller = state.controllers[id] === "bot" ? "Bot" : "Human";
      return `<div class="turn-rail-item ${active ? "active" : ""} ${complete ? "complete" : ""}">
        <span class="turn-order-label">${complete ? "OK" : index + 1}</span>
        <span>
          <strong>${esc(faction.short)}</strong>
          <small>${esc(active ? "Acting now" : controller)}</small>
        </span>
      </div>`;
    }).join("")}
  </div>`;
}

function turnQuestionStackHtml() {
  const momentum = factions[state.momentumFaction] || factions.coalition;
  const firstFaction = factions[state.turnOrder[0]] || factions.coalition;
  return `
    <div class="question-stack">
      <div class="question-card">
        <div class="field-label">1. What year is it?</div>
        ${timelineHtml()}
      </div>
      <div class="question-card">
        <div class="field-label">2. Early or Late Year?</div>
        <div class="round-controls">
          ${btn("Early Year", "setRound(1)", state.round === 1 ? "primary" : "")}
          ${btn("Late Year", "setRound(2)", state.round === 2 ? "primary" : "")}
        </div>
      </div>
      <div class="question-card">
        <div class="field-label">3. Who has Momentum?</div>
        ${momentumButtonsHtml()}
        <p class="small-note">Current Momentum: ${esc(momentum.short)}.</p>
      </div>
      <div class="question-card">
        <div class="field-label">4. What is the turn order?</div>
        ${turnOrderSetupHtml()}
        <p class="small-note">${esc(firstFaction.short)} will act first. Continue will then advance through this list automatically.</p>
      </div>
    </div>
  `;
}

function turnContextSummaryHtml() {
  const active = activeFaction();
  const momentum = factions[state.momentumFaction] || factions.coalition;
  const order = state.turnOrder.map(id => factions[id]?.short || id).join(" > ");
  return `<div class="mobile-turn-summary">
    <div>
      <div class="summary-main">${esc(state.year)} ${esc(currentHalfLabel())} | ${esc(active.short)} acting</div>
      <div class="summary-sub">Momentum: ${esc(momentum.short)} | Order: ${esc(order)}</div>
    </div>
    ${badge(activeController() === "bot" ? "Bot" : "Human", active.tone)}
  </div>`;
}

function turnSetupControlsHtml() {
  return `<div class="runner-page">
    ${turnQuestionStackHtml()}
    <div class="sequence-actions">
      ${btn("Save setup and start turns", "saveTurnSetup()", "primary")}
    </div>
  </div>`;
}

function stepChecklistHtml() {
  return Object.entries(stepLabels).map(([key, label]) => {
    const complete = !!state.completedSteps[key];
    const current = state.currentStep === key;
    return `<div class="step-row ${complete ? "done" : ""} ${current ? "current" : ""}">
      <button class="step-main" onclick="setCurrentStep('${key}')">
        <span class="check-dot">${complete ? "OK" : "--"}</span>
        <span>${esc(label)}</span>
      </button>
      <button class="mini-btn" onclick="toggleStep('${key}')">${complete ? "Undo" : "Done"}</button>
    </div>`;
  }).join("");
}

function sourceCardsHtml() {
  return sources.map(source => {
    const active = state.currentSource === source.id;
    return `<button class="source-card ${active ? "selected" : ""}" onclick="setSource('${source.id}')">
      <div class="row">
        <div>
          <div class="source-title">${esc(source.label)}</div>
          <div class="muted">${esc(source.note)}</div>
        </div>
        ${badge(active ? "Active" : "PDF", active ? "good" : "")}
      </div>
    </button>`;
  }).join("");
}

function sequenceProgressHtml() {
  return `<div class="progress-strip">
    ${sequencePhases.map((phase, index) => {
      const active = index === state.sequenceStepIndex;
      const done = state.completedSequence.includes(phase.id);
      return `<div class="phase-dot ${active ? "active" : ""} ${done ? "done" : ""}" title="${esc(phase.title)}">
        <span>${index + 1}</span>
        <small>${esc(phase.title.replace(" Step", "").replace(" Check", ""))}</small>
      </div>`;
    }).join("")}
  </div>`;
}

function optionsHtml(options, answerKey) {
  return `<div class="option-grid">
    ${options.map(option => {
      const selected = state.sequenceAnswers[answerKey] === option.id;
      return `<button class="option-card ${selected ? "selected" : ""}" onclick="setSequenceAnswer('${answerKey}', '${option.id}')">
        <span class="option-title">${esc(option.label)}</span>
        <span class="option-detail">${esc(option.detail)}</span>
      </button>`;
    }).join("")}
  </div>`;
}

function yesNoHtml(answerKey, yesLabel, noLabel) {
  return optionsHtml([
    { id: "no", label: noLabel, detail: "Continue to the next applicable sequence step." },
    { id: "yes", label: yesLabel, detail: "Resolve this branch before advancing." }
  ], answerKey);
}

function checkItemHtml(key, label) {
  const complete = !!state.sequenceChecks[key];
  return `<button class="check-item ${complete ? "done" : ""}" onclick="toggleSequenceCheck('${key}')">
    <span class="check-dot">${complete ? "OK" : "--"}</span>
    <span>${esc(label)}</span>
  </button>`;
}

function reminderListHtml(items) {
  return `<div class="note-list compact">
    ${items.map(item => `<div class="note-item">${esc(item)}</div>`).join("")}
  </div>`;
}

function listHtml(items) {
  if (!items || !items.length) return "";
  return `<ul class="rule-list">${items.map(item => `<li>${esc(item)}</li>`).join("")}</ul>`;
}

function continueButtonLabel() {
  const phase = currentSequencePhase();
  if (phase.id === "action" && state.actionPage === "turn") {
    if (isActiveBot()) {
      if (state.actionSubpage === "bot_summary") return "Start Bot Action 1";
      if (state.actionSubpage === "bot_action1") return state.botTurn.summary === "event_two_actions" ? "Complete Bot Action 1" : "Finish bot turn";
      if (state.actionSubpage === "bot_action2") return "Finish bot turn";
      if (state.actionSubpage === "bot_election") return "Next faction";
    } else {
      if (state.actionSubpage === "choice") return "Use this turn option";
      if (state.actionSubpage === "event") return "Event resolved";
      if (state.actionSubpage === "action1") return requiredActionSlots().length > 1 ? "Complete Action 1" : "Finish action";
      if (state.actionSubpage === "action2") return state.sequenceAnswers.actionChoice === "actions_then_event" ? "Go to Event" : "Finish actions";
      if (state.actionSubpage === "election") return "Next faction";
    }
  }
  return "Continue";
}

function continueButtonHtml(label = continueButtonLabel()) {
  const disabled = !canContinueSequence();
  return `<button class="btn primary" ${disabled ? "disabled" : "onclick=\"continueSequence()\""}>${esc(label)}</button>`;
}

function continueHelpHtml() {
  const phase = currentSequencePhase();
  if (phase.id !== "action" || state.actionPage !== "turn" || canContinueSequence()) return "";
  if (isActiveBot()) {
    if (state.actionSubpage === "bot_summary") return `<div class="small-note blocked-note">Choose the bot Action Step Summary.</div>`;
    if ((state.actionSubpage === "bot_action1" || state.actionSubpage === "bot_action2") && currentBotAction() === "special") return `<div class="small-note blocked-note">Select the Special Action die result.</div>`;
    if (state.actionSubpage === "bot_action1" || state.actionSubpage === "bot_action2") return `<div class="small-note blocked-note">Select the bot Action being resolved.</div>`;
    return "";
  }
  if (state.actionSubpage === "choice" && !state.sequenceAnswers.actionChoice) return `<div class="small-note blocked-note">Choose whether this faction takes Actions, plays an Event, or passes.</div>`;
  if (state.actionSubpage === "action1" && !state.actionPlan[0]) return `<div class="small-note blocked-note">Choose Action 1.</div>`;
  if (state.actionSubpage === "action2" && !state.actionPlan[1]) return `<div class="small-note blocked-note">Choose Action 2.</div>`;
  if (state.actionSubpage === "election" && !state.sequenceAnswers.electionPlayed) return `<div class="small-note blocked-note">Answer whether an Election card was played.</div>`;
  if (!state.sequenceAnswers.actionChoice) return `<div class="small-note blocked-note">Choose whether this faction takes Actions, plays an Event, or passes.</div>`;
  if ((state.sequenceAnswers.actionChoice === "event_then_actions" || state.sequenceAnswers.actionChoice === "actions_then_event") && !state.sequenceAnswers.electionPlayed) {
    return `<div class="small-note blocked-note">Answer whether an Election card was played.</div>`;
  }
  return `<div class="small-note blocked-note">Choose and assign the required Action slot before continuing.</div>`;
}

function canContinueSequence() {
  const phase = currentSequencePhase();
  if (phase.id === "action") {
    if (state.actionPage === "setup" || state.actionPage === "board") return true;
    if (isActiveBot()) {
      if (state.actionSubpage === "bot_summary") return !!state.botTurn.summary;
      if (state.actionSubpage === "bot_action1" || state.actionSubpage === "bot_action2") {
        const action = currentBotAction();
        if (action === "special") return !!currentBotSpecialDie();
        return !!action;
      }
      if (state.actionSubpage === "bot_election") return true;
      return state.actionSubpage === "done";
    }
    if (state.actionSubpage === "choice") return !!state.sequenceAnswers.actionChoice;
    if (state.actionSubpage === "event") return true;
    if (state.actionSubpage === "action1") {
      const action = findAction(state.actionPlan[0]);
      return !!action && actionStatus(action).tone !== "blocked";
    }
    if (state.actionSubpage === "action2") {
      const action = findAction(state.actionPlan[1]);
      return !!action && actionStatus(action).tone !== "blocked";
    }
    if (state.actionSubpage === "election") return !!state.sequenceAnswers.electionPlayed;
    return state.actionSubpage === "done";
  }
  if (phase.id === "sudden_victory") return !!state.sequenceAnswers.suddenVictory;
  if (phase.id === "elections_gate") return !!state.sequenceAnswers.electionPlayed;
  if (phase.id === "elections") return !!state.sequenceAnswers.generalElectionOutcome;
  if (phase.id === "advance_timeline") return !!state.sequenceAnswers.timelineFlip;
  return true;
}

function requiredActionSlots() {
  if (state.sequenceAnswers.actionChoice === "one_action") return [0];
  if (state.sequenceAnswers.actionChoice === "event_then_actions" || state.sequenceAnswers.actionChoice === "actions_then_event") return [0, 1];
  return [];
}

function derivedContextValue(key) {
  const board = state.boardState;
  if (key === "general_strike_clear") return !board.generalStrikeActive;
  if (key === "coalition_influence_allowed") {
    return !["hyperinflation", "hyper_3", "hyper_2", "hyper_1"].includes(board.economy);
  }
  if (key === "unity_sound_strong") return board.unity === "sound" || board.unity === "strong";
  if (key === "yellow_leverage_above_progress") {
    if (board.yellowProgressLeverage === "unknown") return undefined;
    return board.yellowProgressLeverage === "above";
  }
  if (key === "black_leverage_above_reaction") {
    if (board.blackReactionLeverage === "unknown") return undefined;
    return board.blackReactionLeverage === "above";
  }
  if (key === "reaction_can_advance") return board.reaction <= board.progress;
  return state.actionContext[key];
}

function actionStatus(action) {
  const contextKeys = action.context || [];
  const blocked = contextKeys.filter(key => derivedContextValue(key) === false);
  const unknown = contextKeys.filter(key => derivedContextValue(key) === undefined);
  if (blocked.length) return { tone: "blocked", label: "Blocked", blocked, unknown };
  if (unknown.length) return { tone: "check", label: "Check table", blocked, unknown };
  return { tone: "ready", label: "Candidate", blocked, unknown };
}

function actionSlotHtml(index) {
  const action = findAction(state.actionPlan[index]);
  const label = action ? action.title : `Choose Action ${index + 1}`;
  const tone = action ? actionStatus(action).tone : "";
  return `<button class="action-slot ${tone}" onclick="setActionSlot(${index}, state.selectedActionId || '')">
    <span class="slot-number">${index + 1}</span>
    <span>${esc(label)}</span>
  </button>`;
}

function actionContextControlsHtml() {
  const keys = Array.from(new Set(currentFactionActions().flatMap(action => action.context || [])));
  if (!keys.length) return "";
  return `<div class="context-grid">
    ${keys.map(key => {
      const value = state.actionContext[key];
      return `<div class="context-item">
        <div class="context-label">${esc(actionStateQuestions[key])}</div>
        <div class="segmented">
          <button class="${value === true ? "selected" : ""}" onclick="setActionContext('${key}', 'yes')">Yes</button>
          <button class="${value === false ? "selected danger" : ""}" onclick="setActionContext('${key}', 'no')">No</button>
          <button class="${value === undefined ? "selected muted-choice" : ""}" onclick="setActionContext('${key}', 'unknown')">?</button>
        </div>
      </div>`;
    }).join("")}
  </div>`;
}

function boardStateControlsHtml() {
  const board = state.boardState;
  const progressOptions = Array.from({ length: 7 }, (_, value) => `<option value="${value}" ${board.progress === value ? "selected" : ""}>${value}</option>`).join("");
  const reactionOptions = Array.from({ length: 7 }, (_, value) => `<option value="${value}" ${board.reaction === value ? "selected" : ""}>${value}</option>`).join("");
  return `<div class="board-state-grid">
    <div class="context-item">
      <div class="context-label">Progress level</div>
      <select class="select-input" onchange="setBoardState('progress', this.value)">${progressOptions}</select>
    </div>
    <div class="context-item">
      <div class="context-label">Reaction level</div>
      <select class="select-input" onchange="setBoardState('reaction', this.value)">${reactionOptions}</select>
    </div>
    <div class="context-item wide">
      <div class="context-label">Economy marker</div>
      <div class="track-strip economy-track">
        ${economyOptions.map(([value, label]) => `<button class="${board.economy === value ? "selected" : ""}" onclick="setBoardState('economy', '${value}')">${esc(label)}</button>`).join("")}
      </div>
      <div class="track-captions"><span>Hyperinflation</span><span>Mass Unemployment</span></div>
    </div>
    <div class="context-item">
      <div class="context-label">Coalition Unity</div>
      <select class="select-input" onchange="setBoardState('unity', this.value)">
        <option value="fragile" ${board.unity === "fragile" ? "selected" : ""}>Fragile</option>
        <option value="shaky" ${board.unity === "shaky" ? "selected" : ""}>Shaky</option>
        <option value="sound" ${board.unity === "sound" ? "selected" : ""}>Sound</option>
        <option value="strong" ${board.unity === "strong" ? "selected" : ""}>Strong</option>
      </select>
    </div>
    <div class="context-item">
      <div class="context-label">General Strike</div>
      <div class="segmented two">
        <button class="${board.generalStrikeActive ? "selected danger" : ""}" onclick="setBoardState('generalStrikeActive', true)">Active</button>
        <button class="${!board.generalStrikeActive ? "selected" : ""}" onclick="setBoardState('generalStrikeActive', false)">Not active</button>
      </div>
    </div>
    <div class="context-item">
      <div class="context-label">Yellow Leverage above Progress?</div>
      <select class="select-input" onchange="setBoardState('yellowProgressLeverage', this.value)">
        <option value="unknown" ${board.yellowProgressLeverage === "unknown" ? "selected" : ""}>Unknown</option>
        <option value="above" ${board.yellowProgressLeverage === "above" ? "selected" : ""}>Yes, above current Progress</option>
        <option value="none" ${board.yellowProgressLeverage === "none" ? "selected" : ""}>No</option>
      </select>
    </div>
    <div class="context-item">
      <div class="context-label">Black Leverage above Reaction?</div>
      <select class="select-input" onchange="setBoardState('blackReactionLeverage', this.value)">
        <option value="unknown" ${board.blackReactionLeverage === "unknown" ? "selected" : ""}>Unknown</option>
        <option value="above" ${board.blackReactionLeverage === "above" ? "selected" : ""}>Yes, above current Reaction</option>
        <option value="none" ${board.blackReactionLeverage === "none" ? "selected" : ""}>No</option>
      </select>
    </div>
    <div class="context-item wide">
      <div class="context-label">Board notes</div>
      <input class="text-input compact-input" value="${esc(board.notes)}" oninput="setBoardState('notes', this.value)" placeholder="Optional notes: available units, key map spaces, odd lingering effects">
    </div>
  </div>`;
}

function boardStateCompactHtml() {
  const board = state.boardState;
  return `<div class="runner-page">
    <div class="section-head">
      <div>
        <div class="kicker">Board State</div>
        <h2>Update remembered board state</h2>
        <p class="muted">Stored in this browser save and reused for action checks. Track-only changes can be updated automatically by some human Actions.</p>
      </div>
    </div>
    ${boardStateControlsHtml()}
    <div class="small-note">Current: Progress ${board.progress}, Reaction ${board.reaction}, Economy ${esc(economyLabel(board.economy))}, Unity ${esc(board.unity)}, General Strike ${board.generalStrikeActive ? "active" : "not active"}.</div>
    <div class="sequence-actions">
      ${btn("Save board state", "saveBoardStatePage()", "primary")}
    </div>
  </div>`;
}

function actionCardsHtml() {
  return `<div class="action-card-grid">
    ${currentFactionActions().map(action => {
      const selected = state.selectedActionId === action.id;
      const status = actionStatus(action);
      return `<button class="action-choice ${selected ? "selected" : ""} ${status.tone}" onclick="selectAction('${action.id}')">
        <span class="action-choice-head">
          <span>${esc(action.title)}</span>
          ${badge(status.label, status.tone)}
        </span>
        <span class="option-detail">${esc(action.summary)}</span>
        <span class="citation">Rule ${esc(action.citation)}</span>
      </button>`;
    }).join("")}
  </div>`;
}

function compactActionPickerHtml() {
  const defaultId = defaultActionId();
  return `<div class="compact-action-list">
    ${currentFactionActions().map(action => {
      const selected = state.selectedActionId === action.id || (!state.selectedActionId && action.id === defaultId);
      const status = actionStatus(action);
      return `<button class="compact-action ${selected ? "selected" : ""} ${status.tone}" onclick="selectAction('${action.id}')">
        <span>${esc(action.title)}</span>
        ${badge(status.label, status.tone)}
      </button>`;
    }).join("")}
  </div>`;
}

function selectedActionDetailHtml() {
  const action = findAction(state.selectedActionId) || findAction(defaultActionId()) || currentFactionActions()[0];
  if (!action) return "";
  const status = actionStatus(action);
  const blockedText = status.blocked.map(key => actionStateQuestions[key]);
  const unknownText = status.unknown.map(key => actionStateQuestions[key]);
  const slotTargets = state.actionSubpage === "action1" ? [0] : state.actionSubpage === "action2" ? [1] : requiredActionSlots();
  return `<article class="action-detail ${status.tone}">
    <div class="row">
      <div>
        <div class="kicker">Selected Action</div>
        <h3>${esc(action.title)}</h3>
      </div>
      ${badge("Rule " + action.citation, status.tone)}
    </div>
    <p class="muted">${esc(action.summary)}</p>
    ${blockedText.length ? `<div class="warn-box"><strong>Blocked by your table-state answers:</strong>${listHtml(blockedText)}</div>` : ""}
    ${unknownText.length ? `<div class="warn-box soft"><strong>Confirm before resolving:</strong>${listHtml(unknownText)}</div>` : ""}
    <div class="detail-grid">
      <div>
        <div class="field-label">Requirements</div>
        ${listHtml(action.requires)}
      </div>
      ${action.procedure ? `<div>
        <div class="field-label">Procedure</div>
        ${listHtml(action.procedure)}
      </div>` : ""}
      ${action.warnings ? `<div>
        <div class="field-label">Watch For</div>
        ${listHtml(action.warnings)}
      </div>` : ""}
    </div>
    <div class="slot-actions">
      ${slotTargets.map(index => `<button class="mini-btn" ${status.tone === "blocked" ? "disabled" : `onclick="chooseActionForSlot(${index}, '${action.id}')"`}>Use as Action ${index + 1}</button>`).join("")}
    </div>
  </article>`;
}

function actionPlanSummaryHtml() {
  const slots = requiredActionSlots();
  if (!slots.length) {
    return `<div class="info-band"><strong>Pass selected:</strong> no Actions will be performed. You may discard one non-Election, non-Mandatory Event card and draw a replacement.</div>`;
  }
  return `<div class="action-slots">
    ${slots.map(actionSlotHtml).join("")}
  </div>`;
}

function actionGuideHtml() {
  if (!state.sequenceAnswers.actionChoice) {
    return `<div class="info-band">Choose the faction's turn option first. The app will then ask for the matching one or two Actions.</div>`;
  }
  if (state.sequenceAnswers.actionChoice === "pass") {
    return actionPlanSummaryHtml();
  }
  return `
    <div class="walk-block">
      <div class="field-label">Planned actions</div>
      ${actionPlanSummaryHtml()}
      <p class="small-note">Select an action card, then assign it to Action 1 or Action 2. Repeating an action is allowed unless a global limit blocks the specific target, such as two Assaults in the same space.</p>
    </div>
    <div class="walk-block">
      <div class="field-label">Current board state</div>
      ${boardStateControlsHtml()}
    </div>
    <div class="walk-block mobile-action-picker">
      <div class="field-label">Choose action</div>
      ${compactActionPickerHtml()}
    </div>
    ${selectedActionDetailHtml()}
    <div class="walk-block">
      <div class="field-label">${esc(activeFaction().short)} action menu</div>
      <div class="desktop-action-menu">${actionCardsHtml()}</div>
    </div>
    <div class="walk-block">
      <div class="field-label">Global Action limits</div>
      ${listHtml(globalActionLimits)}
    </div>
  `;
}

function humanEventPromptHtml() {
  if (state.sequenceAnswers.actionChoice === "event_then_actions" || state.sequenceAnswers.actionChoice === "actions_then_event") {
    const timing = state.sequenceAnswers.actionChoice === "event_then_actions" ? "before your two Actions" : "after your two Actions";
    return `
      <div class="walk-block">
        <div class="field-label">Event card</div>
        <input class="text-input" value="${esc(state.eventTitle)}" oninput="updateEventTitle(this.value)" placeholder="Event card title or short note">
        <div class="info-band">You chose to play the Event ${esc(timing)}. Resolve the card completely before moving to the next operation.</div>
      </div>
    `;
  }
  if (state.sequenceAnswers.actionChoice === "pass") {
    return `<div class="info-band">Pass: you may discard one non-Election, non-Mandatory Event card, then draw one replacement if the deck is not empty.</div>`;
  }
  return "";
}

function controllerControlsHtml() {
  return `<div class="controller-grid">
    ${Object.entries(factions).map(([id, faction]) => {
      const controller = state.controllers[id] || "human";
      return `<div class="controller-item">
        <div class="controller-title">${esc(faction.short)}</div>
        <div class="segmented">
          <button class="${controller === "human" ? "selected" : ""}" onclick="setController('${id}', 'human')">Human</button>
          <button class="${controller === "bot" ? "selected" : ""}" onclick="setController('${id}', 'bot')">Bot</button>
        </div>
      </div>`;
    }).join("")}
  </div>`;
}

function soloSetupPanelHtml() {
  if (state.soloSetupComplete) return "";
  return `<section class="panel setup-panel">
    <div class="section-head">
      <div>
        <div class="kicker">Solo Setup</div>
        <h2>Who are you playing?</h2>
        <p class="muted">Set each faction once. After you confirm, this setup panel disappears from the turn runner.</p>
      </div>
    </div>
    ${controllerControlsHtml()}
    <div class="sequence-actions">
      ${btn("Confirm solo setup", "completeSoloSetup()", "primary")}
    </div>
  </section>`;
}

function botSetSummaryHtml() {
  const options = [
    {
      id: "event_two_actions",
      label: "Event + 2 Bot Actions",
      detail: "Reveal the top Event card, perform it, then take two bot Actions."
    },
    {
      id: "one_action",
      label: "1 Bot Action",
      detail: "Skip Event play and perform one bot Action."
    }
  ];
  return `<div class="option-grid">
    ${options.map(option => {
      const selected = state.botTurn.summary === option.id;
      return `<button class="option-card ${selected ? "selected" : ""}" onclick="updateBotTurn('summary', '${option.id}')">
        <span class="option-title">${esc(option.label)}</span>
        <span class="option-detail">${esc(option.detail)}</span>
      </button>`;
    }).join("")}
  </div>`;
}

function botSpecialForDie() {
  const die = Number(currentBotSpecialDie());
  if (!Number.isInteger(die) || die < 1 || die > 6) return null;
  return (botSpecialTables[state.activeFaction] || []).find(row => {
    if (row.range.includes("-")) {
      const [low, high] = row.range.split("-").map(Number);
      return die >= low && die <= high;
    }
    return Number(row.range) === die;
  }) || null;
}

function currentBotActionIndex() {
  return state.actionSubpage === "bot_action2" ? 1 : 0;
}

function currentBotAction() {
  const index = currentBotActionIndex();
  return state.botTurn.actions[index] || (index === 0 ? state.botTurn.action : "") || "";
}

function currentBotSpecialDie() {
  const index = currentBotActionIndex();
  return state.botTurn.specialDice[index] || (index === 0 ? state.botTurn.specialDie : "") || "";
}

function normalizeBotCardKey(value) {
  const digits = String(value || "").match(/\d+/)?.[0] || "";
  if (!digits) return "";
  return digits.padStart(2, "0").slice(-2);
}

function botCardData() {
  const key = normalizeBotCardKey(state.botTurn.card);
  return key ? botCardDatabase[key] || null : null;
}

function botCardSummaryLabel(summary) {
  return summary === "event_two_actions" ? "Event + 2 Bot Actions" : "1 Bot Action";
}

function botPriorityActionId(priorityLabel) {
  return botPriorityActionMap[priorityLabel] || "";
}

function botActionPriorityLabels() {
  const data = botCardData();
  return data?.priority || botActionPriorities[state.activeFaction] || [];
}

function firstAvailableBotActionFrom(startIndex = 0) {
  const labels = botActionPriorityLabels();
  for (let index = startIndex; index < labels.length; index += 1) {
    const actionId = botPriorityActionId(labels[index]);
    if (!actionId) continue;
    if (actionId === "special") return actionId;
    const action = findAction(actionId);
    if (action && actionStatus(action).tone !== "blocked") return actionId;
  }
  return "";
}

function priorityIndexForAction(actionId) {
  const labels = botActionPriorityLabels();
  return labels.findIndex(label => botPriorityActionId(label) === actionId);
}

function applyBotCardData(data) {
  state.botTurn.summary = data.summary || state.botTurn.summary;
  state.botTurn.impulse = data.impulse || state.botTurn.impulse;
  state.botTurn.actions = ["", ""];
  state.botTurn.specialDice = ["", ""];
  state.botTurn.action = "";
  state.botTurn.specialDie = "";
  clearSequenceChecks("bot:");
  state.sequenceAnswers.electionPlayed = data.summary === "one_action" ? "no" : "";

  const firstAction = firstAvailableBotActionFrom(0);
  state.botTurn.actions[0] = firstAction;
  state.botTurn.action = firstAction;
  if (data.summary === "event_two_actions") {
    const nextStart = Math.max(0, priorityIndexForAction(firstAction) + 1);
    state.botTurn.actions[1] = firstAvailableBotActionFrom(nextStart);
  }
}

function botCardLookupHtml() {
  const data = botCardData();
  if (data) {
    const mismatch = data.faction !== state.activeFaction ? `<div class="warn-box soft"><strong>Wrong faction deck?</strong> Card ${esc(normalizeBotCardKey(state.botTurn.card))} belongs to ${esc(factions[data.faction]?.short || data.faction)}.</div>` : "";
    return `
      <div class="bot-card-preview">
        <img src="${esc(data.image)}" alt="Bot card ${esc(normalizeBotCardKey(state.botTurn.card))}">
        <div>
          <div class="info-band"><strong>Card ${esc(normalizeBotCardKey(state.botTurn.card))} loaded:</strong> ${esc(data.impulse)} | ${esc(botCardSummaryLabel(data.summary))}${data.reshuffle ? " | Reshuffle" : ""}</div>
          ${mismatch}
        </div>
      </div>`;
  }
  return `<div class="small-note">Enter or tap a bot card number to load its scan and printed action priority.</div>`;
}

function botCardPickerHtml() {
  const current = normalizeBotCardKey(state.botTurn.card);
  const keys = botCardRanges[state.activeFaction] || [];
  return `<div class="bot-card-grid">
    ${keys.map(key => {
      const data = botCardDatabase[key];
      return `<button class="${current === key ? "selected" : ""}" onclick="chooseBotCard('${key}')">
        <strong>${Number(key)}</strong>
        <span>${esc(data.impulse)}</span>
      </button>`;
    }).join("")}
  </div>`;
}

function botSubpageOrder(subpage) {
  return ["bot_summary", "bot_action1", "bot_action2", "bot_election", "done"].indexOf(subpage);
}

function botStepState(step) {
  const subpage = state.actionSubpage;
  const subpageOrder = botSubpageOrder(subpage);
  if (step === "event") {
    if (state.botTurn.summary !== "event_two_actions") return "skip";
    return subpage !== "bot_summary" ? "done" : "current";
  }
  if (step === "action1") {
    if (state.sequenceChecks["bot:action1"] || subpageOrder > botSubpageOrder("bot_action1")) return "done";
    if (subpage === "bot_action1") return "current";
    return "pending";
  }
  if (step === "action2") {
    if (state.botTurn.summary !== "event_two_actions") return "skip";
    if (state.sequenceChecks["bot:action2"] || subpageOrder > botSubpageOrder("bot_action2")) return "done";
    if (subpage === "bot_action2") return "current";
    return "pending";
  }
  if (step === "reshuffle") {
    return ["bot_election", "done"].includes(subpage) ? "current" : "pending";
  }
  return "pending";
}

function botStepStatusHtml() {
  const steps = [
    ["event", "Event resolved"],
    ["action1", "Bot Action 1"],
    ["action2", "Bot Action 2"],
    ["reshuffle", "Reshuffle checked"]
  ].filter(([key]) => botStepState(key) !== "skip");
  return `<div class="bot-step-strip">
    ${steps.map(([key, label]) => {
      const status = botStepState(key);
      const marker = status === "done" ? "OK" : status === "current" ? "Now" : "--";
      return `<div class="bot-step ${status}">
        <span class="check-dot">${marker}</span>
        <span>${esc(label)}</span>
      </div>`;
    }).join("")}
  </div>`;
}

function botActionPickerHtml() {
  const selectedAction = currentBotAction();
  const data = botCardData();
  const options = data
    ? data.priority.map((label, index) => {
      const id = botPriorityActionId(label);
      const action = id === "special" ? null : findAction(id);
      const status = action ? actionStatus(action) : { tone: "ready", label: "Bot table" };
      return {
        id,
        title: label.replace("Actions", "Action"),
        summary: action?.summary || "Roll on the faction Special Action table.",
        orderLabel: `Priority ${index + 1}`,
        ...status
      };
    }).filter(option => option.id)
    : [
      {
        id: "special",
        title: "Special Action",
        summary: "Roll on the faction Special Action table.",
        tone: "ready",
        label: "Bot table"
      },
      ...currentFactionActions().map(action => ({
        id: action.id,
        title: action.title,
        summary: action.summary,
        ...actionStatus(action)
      }))
    ];
  return `<div class="compact-action-list">
    ${options.map(option => {
      const selected = selectedAction === option.id;
      const blocked = option.tone === "blocked";
      return `<button class="compact-action ${selected ? "selected" : ""} ${option.tone || ""}" ${blocked ? "disabled" : `onclick="updateBotTurn('action', '${option.id}')"`}>
        <span>${esc(option.title)}${option.orderLabel ? `<small>${esc(option.orderLabel)}</small>` : ""}</span>
        ${selected ? badge("Selected", "ready") : badge(option.label || "Candidate", option.tone || "ready")}
      </button>`;
    }).join("")}
  </div>`;
}

function botSelectedActionDetailHtml() {
  const selectedAction = currentBotAction();
  if (!selectedAction) {
    return `<div class="info-band">Choose the first bot Action that can have legal effect. For a second bot Action, continue from the next priority instead of restarting at the top.</div>`;
  }
  if (selectedAction === "special") {
    return botSpecialTableHtml();
  }
  const action = findAction(selectedAction);
  if (!action) return "";
  const status = actionStatus(action);
  return `<article class="action-detail ${status.tone}">
    <div class="row">
      <div>
        <div class="kicker">Bot Action</div>
        <h3>${esc(action.title)}</h3>
      </div>
      ${badge("Rule " + action.citation, status.tone)}
    </div>
    <p class="muted">${esc(action.summary)}</p>
    <div class="detail-grid">
      <div>
        <div class="field-label">Requirements</div>
        ${listHtml(action.requires)}
      </div>
      ${action.procedure ? `<div>
        <div class="field-label">Procedure</div>
        ${listHtml(action.procedure)}
      </div>` : ""}
      ${action.warnings ? `<div>
        <div class="field-label">Watch For</div>
        ${listHtml(action.warnings)}
      </div>` : ""}
    </div>
  </article>`;
}

function botSpecialDieButtonsHtml() {
  const selectedDie = Number(currentBotSpecialDie());
  return `<div class="die-strip">
    ${[1, 2, 3, 4, 5, 6].map(die => `<button class="mini-btn ${selectedDie === die ? "selected" : ""}" onclick="updateBotTurn('specialDie', '${die}')">${die}</button>`).join("")}
  </div>`;
}

function botSpecialTableHtml() {
  const selected = botSpecialForDie();
  return `<div class="bot-special">
    <div class="row">
      <div>
        <div class="field-label">Special Action die</div>
        ${botSpecialDieButtonsHtml()}
      </div>
      ${selected ? badge(selected.range + ": " + selected.title, "check") : badge("Roll if Special", "warn")}
    </div>
    ${selected ? `<div class="info-band"><strong>${esc(selected.title)}:</strong>${listHtml(selected.actions)}</div>` : ""}
    <details class="compact-details">
      <summary>Full Special Action table</summary>
      <div class="action-card-grid">
        ${(botSpecialTables[state.activeFaction] || []).map(row => `<article class="mini-rule">
          <div class="action-choice-head"><span>${esc(row.range)} ${esc(row.title)}</span></div>
          ${listHtml(row.actions)}
        </article>`).join("")}
      </div>
    </details>
  </div>`;
}

function botRunnerHtml() {
  const active = activeFaction();
  const priorities = botActionPriorities[state.activeFaction] || [];
  const actionCount = state.botTurn.summary === "event_two_actions" ? "two Bot Actions after the Event" : state.botTurn.summary === "one_action" ? "one Bot Action" : "the bot card's listed Action Step Summary";
  return `
    <div class="info-band"><strong>${esc(active.short)} is bot-controlled.</strong> Reveal its top bot card, then enter the card cues below.</div>
    <div class="walk-block">
      <div class="field-label">Bot card selected</div>
      <input class="text-input" value="${esc(state.botTurn.card)}" oninput="updateBotTurn('card', this.value)" placeholder="Bot card number/name">
    </div>
    <div class="walk-block">
      <div class="field-label">Action Step Summary</div>
      ${botSetSummaryHtml()}
    </div>
    <div class="grid2 walk-block">
      <div>
        <div class="field-label">Faction Order from bot card</div>
        <input class="text-input" value="${esc(state.botTurn.factionOrder)}" oninput="updateBotTurn('factionOrder', this.value)" placeholder="e.g. KPD, Coalition, RC">
      </div>
      <div>
        <div class="field-label">Impulse Space / Region</div>
        <input class="text-input" value="${esc(state.botTurn.impulse)}" oninput="updateBotTurn('impulse', this.value)" placeholder="Space, Region, or RC Clique letter">
      </div>
    </div>
    <div class="walk-block">
      <div class="field-label">Bot turn script</div>
      <div class="note-list compact">
        <div class="note-item">Reveal the top ${esc(active.short)} bot card and use it to perform ${esc(actionCount)}.</div>
        <div class="note-item">If Event + 2 Bot Actions: reveal the top Event card from the bot stack and resolve it first. In 1923, 1929, or 1933, check unplayed bot Events for Mandatory/Election cards first.</div>
        <div class="note-item">NP factions do not perform Move Units Actions, never loan units, always accept loaned units, and never spend Middle Class Sympathies during Assaults.</div>
        <div class="note-item">At the end of the bot turn, apply any Reshuffle Bot Deck instruction on the revealed bot card.</div>
      </div>
    </div>
    <div class="walk-block">
      <div class="field-label">Resolve bot steps</div>
      <div class="check-list">
        ${state.botTurn.summary === "event_two_actions" ? checkItemHtml("bot:event", "Event card revealed and resolved") : ""}
        ${checkItemHtml("bot:action1", "First Bot Action resolved")}
        ${state.botTurn.summary === "event_two_actions" ? checkItemHtml("bot:action2", "Second Bot Action resolved") : ""}
        ${checkItemHtml("bot:reshuffle", "Reshuffle instruction checked")}
      </div>
    </div>
    <div class="walk-block">
      <div class="field-label">Bot Action priority</div>
      <div class="priority-row">${priorities.map((item, index) => `<span><strong>${index + 1}</strong> ${esc(item)}</span>`).join("")}</div>
    </div>
    <div class="walk-block">
      <div class="field-label">Select bot Action to resolve</div>
      ${botActionPickerHtml()}
      ${botSelectedActionDetailHtml()}
    </div>
    <details class="compact-details">
      <summary>Bot targeting and option priorities</summary>
      <div class="walk-block">
        <div class="field-label">Faction option preferences</div>
        ${listHtml(botOptionGuidelines[state.activeFaction] || [])}
      </div>
      <div class="grid2 walk-block">
        <div>
          <div class="field-label">Affected piece priority</div>
          ${listHtml(botPiecePriority)}
        </div>
        <div>
          <div class="field-label">Space selection priority</div>
          ${listHtml(botSpacePriority)}
        </div>
      </div>
    </details>
  `;
}

function pageHeaderHtml(kicker, title, subtitle = "") {
  return `<div class="turn-page-head">
    <div>
      <div class="kicker">${esc(kicker)}</div>
      <h2>${esc(title)}</h2>
      ${subtitle ? `<p class="muted">${esc(subtitle)}</p>` : ""}
    </div>
  </div>`;
}

function boardSummaryLineHtml() {
  const board = state.boardState;
  return `<div class="board-summary-line">
    <span>Progress ${board.progress}</span>
    <span>Reaction ${board.reaction}</span>
    <span>${esc(economyLabel(board.economy))}</span>
    <span>Unity ${esc(board.unity)}</span>
    <span>${board.generalStrikeActive ? "Strike active" : "No strike"}</span>
  </div>`;
}

function humanActionSelectionPageHtml(slot) {
  const actionNumber = slot + 1;
  return `
    ${pageHeaderHtml(`Action ${actionNumber}`, `Choose ${activeFaction().short} Action ${actionNumber}`, "Tap an available candidate, then confirm it for this action slot.")}
    ${boardSummaryLineHtml()}
    <div class="walk-block mobile-action-picker always-show">
      <div class="field-label">Available actions</div>
      ${compactActionPickerHtml()}
    </div>
    ${selectedActionDetailHtml()}
    <details class="compact-details">
      <summary>Global Action limits</summary>
      ${listHtml(globalActionLimits)}
    </details>
  `;
}

function humanActionSubpageHtml() {
  if (state.actionSubpage === "choice") {
    return `
      ${pageHeaderHtml("Faction turn", `${activeFaction().short}: choose turn option`, "This choice determines the next page of the turn.")}
      <div class="walk-block">
        ${optionsHtml(actionChoices, "actionChoice")}
      </div>
    `;
  }
  if (state.actionSubpage === "event") {
    return `
      ${pageHeaderHtml("Event", "Resolve the Event card", "Complete the card text, then continue to the next part of this faction turn.")}
      ${humanEventPromptHtml()}
    `;
  }
  if (state.actionSubpage === "action1") return humanActionSelectionPageHtml(0);
  if (state.actionSubpage === "action2") return humanActionSelectionPageHtml(1);
  if (state.actionSubpage === "election") {
    return `
      ${pageHeaderHtml("Election check", "Was an Election card played?", "This answer controls whether the sequence branches to Elections after all faction turns.")}
      <div class="walk-block">${yesNoHtml("electionPlayed", "Election card played", "No Election card")}</div>
    `;
  }
  return `${pageHeaderHtml("Faction complete", `${activeFaction().short} turn complete`, "Continue to the next faction in turn order.")}`;
}

function botCardCuesHtml() {
  return `<details class="compact-details">
    <summary>Bot card cues</summary>
    <div class="walk-block">
      <div class="field-label">Faction Order from bot card</div>
      <input class="text-input" value="${esc(state.botTurn.factionOrder)}" oninput="updateBotTurn('factionOrder', this.value)" placeholder="e.g. KPD, Coalition, RC">
    </div>
    <div class="walk-block">
      <div class="field-label">Impulse Space / Region</div>
      <input class="text-input" value="${esc(state.botTurn.impulse)}" oninput="updateBotTurn('impulse', this.value)" placeholder="Space, Region, or RC Clique letter">
    </div>
  </details>`;
}

function botActionResolutionPageHtml(slot) {
  const actionNumber = slot + 1;
  const priorities = botActionPriorityLabels();
  return `
    ${pageHeaderHtml(`Bot Action ${actionNumber}`, `${activeFaction().short}: choose legal bot Action`, "Use the first priority that has legal effect. For Action 2, continue from the next priority.")}
    ${botStepStatusHtml()}
    ${boardSummaryLineHtml()}
    <div class="walk-block">
      <div class="field-label">Bot Action priority</div>
      <div class="priority-row">${priorities.map((item, index) => `<span class="${currentBotAction() === botPriorityActionId(item) ? "selected" : ""}"><strong>${index + 1}</strong> ${esc(item)}</span>`).join("")}</div>
    </div>
    <div class="walk-block">
      <div class="field-label">Available bot actions</div>
      ${botActionPickerHtml()}
      ${botSelectedActionDetailHtml()}
    </div>
    <details class="compact-details">
      <summary>Bot targeting and option priorities</summary>
      <div class="walk-block">
        <div class="field-label">Faction option preferences</div>
        ${listHtml(botOptionGuidelines[state.activeFaction] || [])}
      </div>
      <div class="grid2 walk-block">
        <div>
          <div class="field-label">Affected piece priority</div>
          ${listHtml(botPiecePriority)}
        </div>
        <div>
          <div class="field-label">Space selection priority</div>
          ${listHtml(botSpacePriority)}
        </div>
      </div>
    </details>
  `;
}

function botActionSubpageHtml() {
  if (state.actionSubpage === "bot_summary") {
    return `
      ${pageHeaderHtml("Bot turn", `${activeFaction().short}: reveal bot card`, "Choose the printed Action Step Summary. Other card cues are optional notes.")}
      ${botStepStatusHtml()}
      <div class="walk-block">
        <div class="field-label">Bot card selected</div>
        <input class="text-input" value="${esc(state.botTurn.card)}" oninput="updateBotTurn('card', this.value)" placeholder="Bot card number/name">
        ${botCardPickerHtml()}
        ${botCardLookupHtml()}
      </div>
      <div class="walk-block">
        <div class="field-label">Action Step Summary</div>
        ${botSetSummaryHtml()}
      </div>
      ${botCardCuesHtml()}
      <details class="compact-details">
        <summary>Bot turn reminders</summary>
        <div class="note-list compact">
          <div class="note-item">If Event + 2 Bot Actions: reveal the top Event card from the bot stack and resolve it first.</div>
          <div class="note-item">NP factions do not perform Move Units Actions, never loan units, always accept loaned units, and never spend Middle Class Sympathies during Assaults.</div>
          <div class="note-item">At the end of the bot turn, apply any Reshuffle Bot Deck instruction on the revealed bot card.</div>
        </div>
      </details>
    `;
  }
  if (state.actionSubpage === "bot_action1") return botActionResolutionPageHtml(0);
  if (state.actionSubpage === "bot_action2") return botActionResolutionPageHtml(1);
  if (state.actionSubpage === "bot_election") {
    return `
      ${pageHeaderHtml("Bot election check", "Did the bot play an Election card?", "Leave this as No unless the bot event revealed an Election card.")}
      ${botStepStatusHtml()}
      <div class="walk-block">${yesNoHtml("electionPlayed", "Election card played", "No Election card")}</div>
    `;
  }
  return `${pageHeaderHtml("Bot complete", `${activeFaction().short} bot turn complete`, "Continue to the next faction in turn order.")}`;
}

function actionControlsHtml() {
  if (state.actionPage === "setup") {
    return `
      ${turnContextSummaryHtml()}
      ${turnSetupControlsHtml()}
    `;
  }
  if (state.actionPage === "board") {
    return `
      ${turnContextSummaryHtml()}
      ${boardStateCompactHtml()}
    `;
  }
  const runnerTop = `
    ${turnContextSummaryHtml()}
    ${turnOrderRailHtml()}
    <div class="runner-toolbar">
      ${btn("Edit setup", "setActionPage('setup')")}
      ${btn("Board state", "setActionPage('board')")}
    </div>
  `;
  if (isActiveBot()) {
    return `
      ${runnerTop}
      ${botActionSubpageHtml()}
    `;
  }
  return `
    ${runnerTop}
    ${humanActionSubpageHtml()}
  `;
}

function suddenVictoryControlsHtml() {
  return `
    <div class="walk-block">
      <div class="field-label">Sudden Victory result</div>
      ${yesNoHtml("suddenVictory", "A faction qualifies", "No sudden victory")}
    </div>
  `;
}

function electionsGateControlsHtml() {
  return `
    <div class="walk-block">
      <div class="field-label">Election trigger</div>
      ${yesNoHtml("electionPlayed", "Election card was played", "No Election card was played")}
    </div>
  `;
}

function electionsControlsHtml() {
  return `
    <div class="walk-block">
      <div class="field-label">Regional election spaces</div>
      <div class="pill-list">${electionRegions.map(region => `<span>${esc(region)}</span>`).join("")}</div>
      <p class="small-note">Only resolve spaces with no Assassinations and no Uprising.</p>
    </div>
    <div class="walk-block">
      <div class="field-label">Election checklist</div>
      <div class="check-list">
        ${checkItemHtml("elections:regional", "Regional Elections resolved")}
        ${checkItemHtml("elections:pv", "PV totals added for each faction")}
        ${checkItemHtml("elections:control", "Parliamentary Control card awarded")}
        ${checkItemHtml("elections:clean_slate", "Clean Slate procedures completed if game continues")}
      </div>
    </div>
    <div class="walk-block">
      <div class="field-label">General Election result</div>
      ${optionsHtml(generalElectionOutcomes, "generalElectionOutcome")}
    </div>
  `;
}

function advanceTimelineControlsHtml() {
  const suggestedFlip = state.round === 1 ? "early_to_late" : "late_to_early";
  const flipOptions = [
    {
      id: "early_to_late",
      label: "Early -> Late",
      detail: "Flip the turn marker and return to the Action Step in the same year."
    },
    {
      id: "late_to_early",
      label: "Late -> Early",
      detail: "Advance into the next year, then resolve the New Year Step."
    }
  ];
  if (!state.sequenceAnswers.timelineFlip) state.sequenceAnswers.timelineFlip = suggestedFlip;
  return `
    <div class="walk-block">
      <div class="field-label">Cleanup checklist</div>
      <div class="check-list">
        ${checkItemHtml("advance:kpd", "KPD Strikes / Uprisings option checked")}
        ${checkItemHtml("advance:general_strike", "General Strike marker checked")}
        ${checkItemHtml("advance:assassinations", "Eligible Assassination markers removed")}
        ${checkItemHtml("advance:economy", "Hyperinflation effect checked")}
      </div>
    </div>
    <div class="walk-block">
      <div class="field-label">Turn marker flip</div>
      ${optionsHtml(flipOptions, "timelineFlip")}
    </div>
  `;
}

function newYearEconomyReminder() {
  if (state.year >= 1920 && state.year <= 1923) {
    return "Shift the Economy one box toward Hyperinflation unless blocked by yellow Leverage.";
  }
  if (state.year === 1930) {
    return "Shift the Economy marker to the rightmost occupied Dollar Dependence marker, if any. Then the Momentum faction returns all Economy track Leverage to empty holding boxes.";
  }
  if (state.year >= 1931 && state.year <= 1933) {
    return "Shift the Economy one box toward Mass Unemployment unless blocked by yellow Leverage.";
  }
  return "No automatic economy shift is listed on the Turn Aid for this year.";
}

function newYearControlsHtml() {
  const nextStep = state.year === 1924 || state.year === 1930 ? "New Era Step" : "Action Step";
  return `
    <div class="info-band">
      <strong>${esc(state.year)} economy:</strong> ${esc(newYearEconomyReminder())}
    </div>
    <div class="walk-block">
      <div class="field-label">New Year checklist</div>
      <div class="check-list">
        ${checkItemHtml("new_year:economy", "Economy procedure resolved")}
        ${checkItemHtml("new_year:turn_order", "Momentum faction set turn order")}
        ${checkItemHtml("new_year:bot", "Bot / NP faction order checked if playing solo")}
      </div>
    </div>
    <p class="small-note">Next branch after this step: ${esc(nextStep)}.</p>
  `;
}

function newEraControlsHtml() {
  const era = eraForYear(state.year);
  return `
    <div class="info-band">
      <strong>${esc(era.label)} Era:</strong> each faction draws ${era.handSize} cards after deck transition procedures.
    </div>
    <div class="walk-block">
      <div class="field-label">New Era checklist</div>
      <div class="check-list">
        ${checkItemHtml("new_era:held_cards", "Held cards revealed")}
        ${checkItemHtml("new_era:penalties", "Held Card Penalties paid")}
        ${checkItemHtml("new_era:lingering", "Expired Lingering Events removed")}
        ${checkItemHtml("new_era:deck", "Deck and discards replaced")}
        ${checkItemHtml("new_era:hands", "New hands drawn")}
      </div>
    </div>
  `;
}

function sequenceControlsHtml() {
  const phase = currentSequencePhase();
  if (phase.id === "action") return actionControlsHtml();
  if (phase.id === "sudden_victory") return suddenVictoryControlsHtml();
  if (phase.id === "elections_gate") return electionsGateControlsHtml();
  if (phase.id === "elections") return electionsControlsHtml();
  if (phase.id === "advance_timeline") return advanceTimelineControlsHtml();
  if (phase.id === "new_year") return newYearControlsHtml();
  if (phase.id === "new_era") return newEraControlsHtml();
  return "";
}

function renderDashboard(app) {
  const source = currentSource();
  const active = activeFaction();
  const phase = currentSequencePhase();
  const era = eraForYear(state.year);

  app.innerHTML = `
    <section class="hero">
      <div>
        <div class="kicker">GMT Games</div>
        <h1>${APP_NAME}</h1>
        <p>A guided sequence-of-play companion. It walks the table through the current turn branch, while detailed faction legality remains tied to the rulebook/player aids.</p>
      </div>
      ${badge(APP_BUILD, "dark")}
    </section>

    ${soloSetupPanelHtml()}

    <section class="panel turn-panel">
      <div class="section-head">
        <div>
          <div class="kicker">Current Turn</div>
          <h2>${state.year}, ${currentHalfLabel()}</h2>
        </div>
        <div class="badge-stack">
          ${badge(active.short, active.tone)}
          ${badge(era.label, "dark")}
        </div>
      </div>
      ${timelineHtml()}
      <div class="round-controls">
        ${btn("Early Year", "setRound(1)", state.round === 1 ? "primary" : "")}
        ${btn("Late Year", "setRound(2)", state.round === 2 ? "primary" : "")}
      </div>
      <div class="grid2">
        ${btn("Previous Turn", "rewindRound()")}
        ${btn("Manual Advance", "advanceRound()")}
      </div>
    </section>

    <section class="panel sequence-panel">
      <div class="section-head">
        <div>
          <div class="kicker">Sequence Of Play</div>
          <h2>${esc(phase.title)}</h2>
          <p class="muted">${esc(phase.prompt)}</p>
        </div>
        ${badge("Rule " + phase.citation, "warn")}
      </div>
      ${sequenceProgressHtml()}
      ${sequenceControlsHtml()}
      <div class="sequence-actions">
        ${continueButtonHtml()}
        ${continueHelpHtml()}
      </div>
      <details class="compact-details turn-aid-details">
        <summary>Turn Aid reminders</summary>
        ${reminderListHtml(phase.reminders)}
      </details>
      <div class="small-note">Source: ${esc(phase.source)}. This walkthrough models the Turn Aid sequence; exact action legality and faction-specific victory requirements still need rulebook/player-aid extraction.</div>
    </section>

    <section class="panel source-panel">
      <div class="section-head">
        <div>
          <div class="kicker">Source Material</div>
          <h2>Reference PDFs</h2>
        </div>
        <a class="link-btn" href="${esc(source.file)}" target="_blank" rel="noreferrer">Open ${esc(source.label)}</a>
      </div>
      <div class="source-grid">${sourceCardsHtml()}</div>
    </section>

    <div class="sticky-actions">
      ${btn("Factions", "setScreen('factions')")}
      ${btn("Rules Plan", "setScreen('rules')")}
      ${btn("Notes", "setScreen('notes')")}
      ${btn("Save", "setScreen('save_load')", "secondary")}
    </div>
  `;
}

function renderFactions(app) {
  const faction = currentFaction();

  app.innerHTML = `
    <section class="hero ${faction.tone}">
      <div>
        <div class="kicker">Faction Reference</div>
        <h1>${esc(faction.label)}</h1>
        <p>${esc(faction.role)}</p>
      </div>
      ${badge(faction.short, faction.tone)}
    </section>

    <section class="panel">
      <div class="faction-tabs">${Object.entries(factions).map(factionButtonHtml).join("")}</div>
    </section>

    <section class="grid2">
      <article class="card">
        <h3>Focus</h3>
        <div class="pill-list">${faction.focus.map(item => `<span>${esc(item)}</span>`).join("")}</div>
      </article>
      <article class="card">
        <h3>Victory Sketch</h3>
        <p class="muted">${esc(faction.victorySketch)}</p>
      </article>
    </section>

    <section class="panel">
      <div class="section-head">
        <div>
          <div class="kicker">Implementation Notes</div>
          <h2>Rules To Extract</h2>
        </div>
        ${badge("Unverified", "warn")}
      </div>
      <div class="note-list">
        ${faction.notes.map(note => `<div class="note-item">${esc(note)}</div>`).join("")}
      </div>
    </section>

    <div class="sticky-actions">
      ${btn("Dashboard", "setScreen('dashboard')", "primary")}
      ${btn("Rules Plan", "setScreen('rules')")}
    </div>
  `;
}

function renderRules(app) {
  app.innerHTML = `
    <section class="hero">
      <div>
        <div class="kicker">Build Plan</div>
        <h1>Rules Extraction</h1>
        <p>We are keeping card ingestion out of scope until the app has reliable core flow and faction action data.</p>
      </div>
    </section>

    <section class="grid2">
      ${implementationBacklog.map(item => `<article class="card">
        <div class="row">
          <h3>${esc(item.title)}</h3>
          ${badge(item.status, item.status === "Next" ? "warn" : "")}
        </div>
        <p class="muted">${esc(item.body)}</p>
      </article>`).join("")}
    </section>

    <section class="panel">
      <div class="section-head">
        <div>
          <div class="kicker">Needed Assets</div>
          <h2>Best Additions</h2>
        </div>
      </div>
      <div class="note-list">
        <div class="note-item">Player aids and sequence-of-play sheets.</div>
        <div class="note-item">Setup sheets and scenario summaries.</div>
        <div class="note-item">Bot/non-player aids, if available.</div>
        <div class="note-item">Full card scans can wait unless we build a card reference feature.</div>
      </div>
    </section>

    <div class="sticky-actions">
      ${btn("Dashboard", "setScreen('dashboard')", "primary")}
      ${btn("Factions", "setScreen('factions')")}
    </div>
  `;
}

function renderNotes(app) {
  app.innerHTML = `
    <section class="hero">
      <div>
        <div class="kicker">Workspace</div>
        <h1>Notes</h1>
        <p>Use this for page references, rule questions, and data-model decisions during extraction.</p>
      </div>
    </section>

    <section class="panel">
      <textarea oninput="updateNotes(this.value)" placeholder="Rulebook notes, playbook page references, implementation questions, or test cases.">${esc(state.notes)}</textarea>
    </section>

    <div class="sticky-actions">
      ${btn("Dashboard", "setScreen('dashboard')", "primary")}
      ${btn("Save / Load", "setScreen('save_load')")}
    </div>
  `;
}

function renderSaveLoad(app) {
  app.innerHTML = `
    <section class="hero">
      <div>
        <div class="kicker">Persistence</div>
        <h1>Save / Load</h1>
        <p>Local saves stay in this browser. JSON export/import can move a game state between browsers.</p>
      </div>
    </section>

    <section class="panel">
      <div class="grid2">
        ${btn("Save in browser", "saveStateLocal()", "primary")}
        ${btn("Load from browser", "loadStateLocal()")}
        ${btn("Export JSON", "exportStateText()")}
        ${btn("Import JSON", "importStateText()")}
      </div>
      <p class="muted save-note">Save key: ${LOCAL_SAVE_KEY}${state.lastSavedAt ? " | Last saved: " + state.lastSavedAt : ""}</p>
      <textarea oninput="updateSaveLoadText(this.value)" placeholder="Exported JSON appears here. Paste JSON here to import.">${esc(state.saveLoadText)}</textarea>
    </section>

    <div class="sticky-actions">
      ${btn("Dashboard", "setScreen('dashboard')", "primary")}
      ${btn("Reset", "resetApp()")}
    </div>
  `;
}

function renderResult(app) {
  const result = state.result || { title: "Done", body: "" };
  app.innerHTML = `
    <section class="panel result">
      <h2>${esc(result.title)}</h2>
      <p>${esc(result.body)}</p>
    </section>
    <div class="sticky-actions">
      ${btn("Dashboard", "setScreen('dashboard')", "primary")}
      ${btn("Save / Load", "setScreen('save_load')")}
    </div>
  `;
}

function render() {
  const app = document.getElementById("app");
  if (!app) return;

  if (state.screen === "factions") {
    renderFactions(app);
    return;
  }
  if (state.screen === "rules") {
    renderRules(app);
    return;
  }
  if (state.screen === "notes") {
    renderNotes(app);
    return;
  }
  if (state.screen === "save_load") {
    renderSaveLoad(app);
    return;
  }
  if (state.screen === "result") {
    renderResult(app);
    return;
  }
  renderDashboard(app);
}

function back() {
  if (state.screen === "dashboard") return;
  setScreen("dashboard");
}

window.state = state;
window.render = render;
window.back = back;
window.setScreen = setScreen;
window.setFaction = setFaction;
window.setActiveFaction = setActiveFaction;
window.setMomentumFaction = setMomentumFaction;
window.setTurnOrderSlot = setTurnOrderSlot;
window.setActiveTurnIndex = setActiveTurnIndex;
window.setSource = setSource;
window.setYear = setYear;
window.setRound = setRound;
window.setCurrentStep = setCurrentStep;
window.toggleStep = toggleStep;
window.setSequenceAnswer = setSequenceAnswer;
window.toggleSequenceCheck = toggleSequenceCheck;
window.continueSequence = continueSequence;
window.jumpToSequencePhase = jumpToSequencePhase;
window.setActionContext = setActionContext;
window.selectAction = selectAction;
window.setActionSlot = setActionSlot;
window.chooseActionForSlot = chooseActionForSlot;
window.setController = setController;
window.completeSoloSetup = completeSoloSetup;
window.editSoloSetup = editSoloSetup;
window.setBoardState = setBoardState;
window.setActionPage = setActionPage;
window.saveTurnSetup = saveTurnSetup;
window.saveBoardStatePage = saveBoardStatePage;
window.updateBotTurn = updateBotTurn;
window.chooseBotCard = chooseBotCard;
window.updateEventTitle = updateEventTitle;
window.updateNotes = updateNotes;
window.updateSaveLoadText = updateSaveLoadText;
window.advanceRound = advanceRound;
window.rewindRound = rewindRound;
window.saveStateLocal = saveStateLocal;
window.loadStateLocal = loadStateLocal;
window.exportStateText = exportStateText;
window.importStateText = importStateText;
window.resetApp = resetApp;

document.getElementById("backBtn").onclick = back;
document.getElementById("resetBtn").onclick = resetApp;

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

render();
