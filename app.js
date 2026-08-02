const APP_NAME = "The Weimar Republic Companion";
const APP_BUILD = "phase-39-new-year-turn-order-card";
const LOCAL_SAVE_KEY = "wr-companion-state-v6";
const AUTO_SAVE_DELAY_MS = 350;

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

const mapSpaces = [
  { id: "schleswig_holstein", label: "Schleswig-Holstein", type: "region", population: 3, politicalValue: 1 },
  { id: "mecklenburg", label: "Mecklenburg", type: "region", population: 4, politicalValue: 1 },
  { id: "pommern", label: "Pommern", type: "region", population: 4, politicalValue: 1 },
  { id: "posen_westpreussen", label: "Posen-Westpreussen", type: "region", population: 2, politicalValue: 1 },
  { id: "ostpreussen", label: "Ostpreussen", type: "region", population: 5, politicalValue: 2 },
  { id: "oldenburg", label: "Oldenburg", type: "region", population: 2, politicalValue: 1 },
  { id: "provinz_hannover", label: "Provinz Hannover", type: "region", population: 7, politicalValue: 2 },
  { id: "provinz_sachsen", label: "Provinz Sachsen", type: "region", population: 6, politicalValue: 2 },
  { id: "brandenburg", label: "Brandenburg", type: "region", population: 6, politicalValue: 2 },
  { id: "provinz_westfalen", label: "Provinz Westfalen", type: "region", population: 10, politicalValue: 4 },
  { id: "waldeck_lippe", label: "Waldeck and Lippe", type: "region", population: 2, politicalValue: 1 },
  { id: "braunschweig_anhalt", label: "Braunschweig and Anhalt", type: "region", population: 3, politicalValue: 1 },
  { id: "sachsen", label: "Sachsen", type: "region", population: 5, politicalValue: 2 },
  { id: "niederschlesien", label: "Niederschlesien", type: "region", population: 6, politicalValue: 2 },
  { id: "oberschlesien", label: "Oberschlesien", type: "region", population: 4, politicalValue: 1 },
  { id: "rheinprovinz", label: "Rheinprovinz", type: "region", population: 14, politicalValue: 3 },
  { id: "hessenprovinz", label: "Hessenprovinz", type: "region", population: 5, politicalValue: 2 },
  { id: "thueringen", label: "Thueringen", type: "region", population: 4, politicalValue: 1 },
  { id: "hessen", label: "Hessen", type: "region", population: 4, politicalValue: 1 },
  { id: "baden", label: "Baden", type: "region", population: 6, politicalValue: 2 },
  { id: "wuerttemberg", label: "Wuerttemberg", type: "region", population: 6, politicalValue: 2 },
  { id: "bayern", label: "Bayern", type: "region", population: 14, politicalValue: 5 },
  { id: "hamburg", label: "Hamburg", type: "city", population: 4, politicalValue: 4 },
  { id: "koeln", label: "Koeln", type: "city", population: 3, politicalValue: 3 },
  { id: "muenchen", label: "Muenchen", type: "city", population: 4, politicalValue: 4 },
  { id: "berlin", label: "Berlin", type: "city", population: 6, politicalValue: 6 }
];

const electionRegions = mapSpaces.map(space => space.label);

const spaceAliases = {
  koln: "koeln",
  cologne: "koeln",
  munchen: "muenchen",
  munich: "muenchen",
  bavaria: "bayern",
  thuringen: "thueringen",
  thuringia: "thueringen",
  wurttemberg: "wuerttemberg",
  "posen westpreussen": "posen_westpreussen",
  "waldeck and lippe": "waldeck_lippe",
  "braunschweig and anhalt": "braunschweig_anhalt",
  "northern states": "schleswig_holstein",
  "southern states": "bayern",
  "prussian provinces": "brandenburg",
  "clique a": "provinz_westfalen",
  "clique b": "provinz_hannover",
  "clique c": "bayern"
};

const controlOptions = [["uncontrolled", "Uncontrolled"], ...factionIds.map(id => [id, factions[id].short])];

const unitPieces = {
  coalition: { label: "Coalition FK", strength: 2, full: "Coalition Freikorps unit; skull/crossbones with yellow border; SV 2" },
  kpd: { label: "Militia", strength: 1, full: "KPD Worker Militia units; five-point yellow star on red; SV 1" },
  nsdap: { label: "SA", strength: 1, full: "NSDAP SA unit; brown background with SA initials inside a white circle; SV 1" },
  radical_conservatives: { label: "Rogue FK", strength: 2, full: "Radical Conservative Rogue Freikorps units; skull/crossbones without yellow border; SV 2" }
};

const specialUnitPieces = {
  reichswehr: { label: "Reichswehr", strength: 3, full: "Coalition Reichswehr unit; yellow background with iron cross; SV 3", faction: "coalition" }
};

function guideSpace({ c = 0, k = 0, n = 0, r = 0, cu = 0, rw = 0, ku = 0, nu = 0, ru = 0, kc = 0, nc = 0, cc = 0, sup = "", strike = false, uprising = false, yl = 0, bl = 0, assassinations = "", tokens = [], notes = "" } = {}) {
  return {
    supremacy: sup,
    influence: { coalition: c, kpd: k, nsdap: n, radical_conservatives: r },
    units: { coalition: cu, kpd: ku, nsdap: nu, radical_conservatives: ru },
    specialUnits: { reichswehr: rw },
    guideTokens: tokens,
    markers: {
      strike,
      uprising,
      kpdCadre: kc,
      nsdapCadre: nc,
      conservativeClique: cc,
      yellowLeverage: yl === true ? 1 : yl,
      blackLeverage: bl === true ? 1 : bl,
      assassinations
    },
    notes
  };
}

const guideCommonCrisisNorth = {
  schleswig_holstein: guideSpace({ c: 1 }),
  mecklenburg: guideSpace({ c: 1 }),
  pommern: guideSpace({ c: 1, r: 1 }),
  posen_westpreussen: guideSpace({ r: 1 }),
  ostpreussen: guideSpace({ c: 1, r: 1 }),
  oldenburg: guideSpace({ c: 1 }),
  provinz_hannover: guideSpace({ c: 2 }),
  provinz_sachsen: guideSpace({ c: 2 }),
  brandenburg: guideSpace({ c: 1, r: 1 }),
  waldeck_lippe: guideSpace({ c: 1 }),
  braunschweig_anhalt: guideSpace({ c: 1, k: 1 }),
  niederschlesien: guideSpace({ c: 1, r: 1 }),
  oberschlesien: guideSpace({ c: 1, r: 1 }),
  hessenprovinz: guideSpace({ c: 2 }),
  thueringen: guideSpace({ c: 1, k: 1 }),
  hessen: guideSpace({ c: 1 }),
  baden: guideSpace({ c: 2, r: 1 }),
  wuerttemberg: guideSpace({ c: 1, r: 1 }),
  hamburg: guideSpace({ c: 1 }),
  koeln: guideSpace({ c: 1, cu: 1, sup: "coalition", tokens: ["Coalition FK strength 2"] }),
  muenchen: guideSpace({ c: 1, k: 1, n: 1, r: 1, cu: 1, sup: "coalition", tokens: ["Coalition FK strength 2"] })
};

const scenarioSpaceSetups = {
  tutorial_1921: {
    ...guideCommonCrisisNorth,
    provinz_westfalen: guideSpace({ c: 4, k: 3 }),
    sachsen: guideSpace({ k: 2, ku: 1, sup: "kpd", strike: true, tokens: ["KPD Militia strength 1"] }),
    rheinprovinz: guideSpace({ c: 5, k: 4 }),
    bayern: guideSpace({ c: 2, k: 3, n: 1, r: 5, cu: 1, ku: 1, cc: 1, sup: "coalition", bl: 2, notes: "Graphic Guide A shows two black Leverage markers. KPD Militia is the five-point yellow star on red; Coalition FK is the skull/crossbones counter with a yellow border." }),
    muenchen: guideSpace({ c: 1, k: 1, n: 1, r: 1, cu: 1, ku: 1, nu: 1, nc: 1, sup: "coalition", tokens: ["Coalition FK strength 2", "KPD Militia strength 2", "NSDAP SA strength 1"] }),
    berlin: guideSpace({ c: 2, k: 2, r: 2, cu: 2, ku: 2, ru: 2, kc: 1, sup: "coalition", tokens: ["Coalition FK strength 2 x2", "KPD Militia strength 1 x2", "Rogue FK strength 2 x2"] })
  },
  revolution_1919: {
    ...guideCommonCrisisNorth,
    provinz_westfalen: guideSpace({ c: 4, k: 2 }),
    sachsen: guideSpace({ k: 1 }),
    rheinprovinz: guideSpace({ c: 5, k: 3 }),
    bayern: guideSpace({ c: 4, k: 2, r: 3, ru: 1, notes: "Rogue FK is the skull/crossbones counter without a yellow border." }),
    muenchen: guideSpace({ c: 1, k: 1, n: 1, r: 1, cu: 1, sup: "coalition", tokens: ["Coalition FK strength 2"] }),
    berlin: guideSpace({ c: 2, k: 2, r: 1, cu: 2, ku: 1, ru: 1, sup: "coalition", tokens: ["Coalition FK strength 2 x2", "KPD Militia strength 1", "Rogue FK strength 2"] })
  },
  new_hope_1924: {
    schleswig_holstein: guideSpace({ c: 1, r: 1 }),
    mecklenburg: guideSpace({ c: 1 }),
    pommern: guideSpace({ r: 1 }),
    posen_westpreussen: guideSpace({ r: 1 }),
    ostpreussen: guideSpace({ r: 2, cc: 1 }),
    oldenburg: guideSpace({ c: 1 }),
    provinz_hannover: guideSpace({ c: 2 }),
    provinz_sachsen: guideSpace({ c: 2 }),
    brandenburg: guideSpace({ c: 2, r: 2 }),
    provinz_westfalen: guideSpace({ c: 3, k: 1 }),
    waldeck_lippe: guideSpace({ c: 1 }),
    braunschweig_anhalt: guideSpace({ c: 1 }),
    sachsen: guideSpace({ c: 1, k: 1 }),
    niederschlesien: guideSpace({ c: 2, r: 1 }),
    oberschlesien: guideSpace({ c: 2, r: 1 }),
    rheinprovinz: guideSpace({ c: 4, k: 3 }),
    hessenprovinz: guideSpace({ c: 2 }),
    thueringen: guideSpace({ c: 1, k: 1 }),
    hessen: guideSpace({ c: 1 }),
    baden: guideSpace({ c: 2, r: 1 }),
    wuerttemberg: guideSpace({ c: 2, r: 1 }),
    bayern: guideSpace({ c: 4, k: 2, n: 1, r: 2, cc: 1, bl: 1 }),
    hamburg: guideSpace({ c: 1 }),
    koeln: guideSpace({ c: 1 }),
    muenchen: guideSpace({ c: 1, n: 1, r: 1, cu: 1, nc: 1, sup: "nsdap", tokens: ["Coalition FK strength 1"] }),
    berlin: guideSpace({ c: 3, k: 2, r: 1, cu: 1, ku: 1, ru: 1, kc: 1, sup: "coalition", tokens: ["Coalition FK strength 3", "KPD Militia strength 1", "Rogue FK strength 2"] })
  },
  black_sun_1928: {
    schleswig_holstein: guideSpace({ c: 1 }),
    mecklenburg: guideSpace({ c: 1 }),
    pommern: guideSpace({ c: 1, r: 1 }),
    posen_westpreussen: guideSpace({ c: 1, r: 1 }),
    ostpreussen: guideSpace({ r: 2, ru: 1, cc: 1, sup: "radical_conservatives", bl: 1, tokens: ["Rogue FK strength 2"], notes: "Graphic Guide D also shows a strength-2 Rogue Freikorps token." }),
    oldenburg: guideSpace({ c: 1 }),
    provinz_hannover: guideSpace({ c: 2 }),
    provinz_sachsen: guideSpace({ c: 2 }),
    brandenburg: guideSpace({ c: 2, n: 1, r: 1 }),
    provinz_westfalen: guideSpace({ c: 3, k: 2 }),
    waldeck_lippe: guideSpace({ c: 1 }),
    braunschweig_anhalt: guideSpace({ c: 1 }),
    sachsen: guideSpace({ c: 1, k: 2 }),
    niederschlesien: guideSpace({ c: 1, n: 1, r: 1 }),
    oberschlesien: guideSpace({ c: 1, r: 1 }),
    rheinprovinz: guideSpace({ c: 4, k: 3 }),
    hessenprovinz: guideSpace({ c: 2 }),
    thueringen: guideSpace({ c: 1, k: 1 }),
    hessen: guideSpace({ c: 1 }),
    baden: guideSpace({ c: 2, r: 2 }),
    wuerttemberg: guideSpace({ c: 2, r: 2 }),
    bayern: guideSpace({ c: 4, k: 1, n: 2, r: 4, cu: 1, ku: 1, cc: 1, sup: "radical_conservatives", bl: 1, tokens: ["KPD Militia strength 2", "Coalition FK strength 1"] }),
    hamburg: guideSpace({ c: 1, ku: 1, sup: "kpd", tokens: ["KPD Militia strength 1"] }),
    koeln: guideSpace({ c: 1, k: 1, ku: 2, kc: 1, sup: "kpd", tokens: ["KPD Militia strength 1 x2"] }),
    muenchen: guideSpace({ c: 2, n: 1, r: 1, cu: 1, nu: 1, nc: 1, sup: "coalition", tokens: ["Coalition FK strength 1", "Coalition FK strength 3", "NSDAP SA strength 1"] }),
    berlin: guideSpace({ c: 3, k: 1, n: 1, r: 1, cu: 1, ku: 1, ru: 1, yl: 1, sup: "coalition", tokens: ["Coalition FK strength 1", "Coalition FK strength 3", "KPD Militia strength 1", "Rogue FK strength 2"] })
  },
  fate_1919: {
    ...guideCommonCrisisNorth,
    provinz_westfalen: guideSpace({ c: 4, k: 2 }),
    sachsen: guideSpace({ k: 1 }),
    rheinprovinz: guideSpace({ c: 5, k: 3 }),
    bayern: guideSpace({ c: 4, k: 2, r: 3, ru: 1, notes: "Rogue FK is the skull/crossbones counter without a yellow border." }),
    muenchen: guideSpace({ c: 1, k: 1, n: 1, r: 1, cu: 1, sup: "coalition", tokens: ["Coalition FK strength 2"] }),
    berlin: guideSpace({ c: 2, k: 2, r: 1, cu: 2, ku: 1, ru: 1, sup: "coalition", tokens: ["Coalition FK strength 2 x2", "KPD Militia strength 1", "Rogue FK strength 2"] })
  }
};

const effectModes = [
  ["influence", "Influence"],
  ["unit", "Units"],
  ["control", "Control"],
  ["marker", "Markers"],
  ["mcs", "MCS"],
  ["track", "Tracks"],
  ["note", "Note"]
];

const markerOptions = [
  ["strike", "Strike"],
  ["uprising", "Uprising"],
  ["reform", "Coalition Reform"],
  ["kpdCadre", "KPD Cadre"],
  ["nsdapCadre", "NSDAP Cadre"],
  ["conservativeClique", "Conservative Clique"],
  ["yellowLeverage", "Yellow Leverage"],
  ["blackLeverage", "Black Leverage"],
  ["assassinations", "Assassinations"]
];

const boardTrackOptions = [
  ["progress", "Progress"],
  ["reaction", "Reaction"],
  ["economy", "Economy"],
  ["unity", "Coalition Unity"],
  ["usDeals", "U.S. Deals"],
  ["ussrDeals", "U.S.S.R. Deals"],
  ["kpdStance", "KPD Stance"],
  ["nsdapStance", "NSDAP Stance"],
  ["generalStrikeActive", "General Strike"],
  ["yellowProgressLeverage", "Yellow Leverage / Progress"],
  ["blackReactionLeverage", "Black Leverage / Reaction"],
  ["yellowEconomyLeverage", "Yellow Leverage / Economy marker"],
  ["blackEconomyLeverage", "Black Leverage / Economy marker"],
  ["reactionLimitIgnored", "Reaction cap"]
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
  kpd_stance_in_play: "KPD Stance track must be in play",
  nsdap_stance_in_play: "NSDAP Stance track must be in play",
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

const economyLeverageOptions = [
  ["none", "None"],
  ["hyper", "Hyperinflation side"],
  ["mass", "Mass Unemployment side"],
  ["both", "Both sides"]
];

function normalizeEconomyLeverage(value) {
  return economyLeverageOptions.some(([id]) => id === value) ? value : "none";
}

function economyLeverageLabel(value) {
  return economyLeverageOptions.find(([id]) => id === value)?.[1] || "None";
}

function economyDistanceFromStable() {
  const currentIndex = economyOptions.findIndex(([id]) => id === state.boardState.economy);
  const stableIndex = economyOptions.findIndex(([id]) => id === "stable");
  if (currentIndex < 0 || stableIndex < 0) return 0;
  return Math.abs(currentIndex - stableIndex);
}

function economySideForCurrentMarker() {
  if (String(state.boardState.economy || "").startsWith("mass")) return "mass";
  if (String(state.boardState.economy || "").startsWith("hyper")) return "hyper";
  return "";
}

function firstEconomyLeverageSide(value) {
  if (value === "hyper" || value === "both") return "hyper";
  if (value === "mass") return "mass";
  return "";
}

function coalitionEconomyLeverageSide() {
  return firstEconomyLeverageSide(state.boardState.blackEconomyLeverage) || economySideForCurrentMarker() || "hyper";
}

function rcEconomyLeverageSide() {
  return eraForYear(state.year).label === "Crisis" ? "hyper" : "mass";
}

function shouldCoalitionUseEconomyLeverage() {
  return economyDistanceFromStable() >= 2 || normalizeEconomyLeverage(state.boardState.blackEconomyLeverage) !== "none";
}

const progressReactionBoxes = Array.from({ length: 6 }, (_, index) => String(index + 1));
const dealTrackBoxes = Array.from({ length: 5 }, (_, index) => String(index + 1));

const scenarioTrackPieceData = {
  tutorial_1921: {
    progressReaction: { yellowLeverage: [2, 3], blackLeverage: [2, 3], middleClass: [3, 4, 5], reforms: [2, 3, 4, 5], assassinations: [2], nsdapCadres: [4], conservativeCliques: [5] },
    economy: { middleClass: ["hyper_2", "hyper_2"], dollarDependence: [] },
    usDeals: { yellowLeverage: [2, 3, 4, 5], blackLeverage: [], dollarDependence: [3, 4, 5] },
    ussrDeals: { yellowLeverage: [4], blackLeverage: [3], reichswehr: [1, 3, 5], kpdCadres: [4, 5] }
  },
  revolution_1919: {
    progressReaction: { yellowLeverage: [], blackLeverage: [2], middleClass: [2, 3, 4, 5], reforms: [2, 3, 4, 5], assassinations: [2], nsdapCadres: [3, 4], conservativeCliques: [5] },
    economy: { middleClass: ["stable", "stable"], dollarDependence: [] },
    usDeals: { yellowLeverage: [1, 2, 3, 4, 5], blackLeverage: [], dollarDependence: [3, 4, 5] },
    ussrDeals: { yellowLeverage: [2, 4], blackLeverage: [3], reichswehr: [1, 3, 5], kpdCadres: [2, 4, 5] }
  },
  new_hope_1924: {
    progressReaction: { yellowLeverage: [2, 3], blackLeverage: [2, 3], middleClass: [4, 5], reforms: [2, 3, 4, 5], assassinations: [2], nsdapCadres: [4], conservativeCliques: [5] },
    economy: { middleClass: ["stable", "stable"], dollarDependence: [] },
    usDeals: { yellowLeverage: [3, 4, 5], blackLeverage: [], dollarDependence: [3, 4, 5] },
    ussrDeals: { yellowLeverage: [2, 4], blackLeverage: [3], reichswehr: [3, 5], kpdCadres: [4, 5] }
  },
  black_sun_1928: {
    progressReaction: { yellowLeverage: [2, 3, 4], blackLeverage: [2, 3], middleClass: [4, 5], reforms: [2, 3, 4, 5], assassinations: [2], nsdapCadres: [3, 4], conservativeCliques: [5] },
    economy: { middleClass: ["stable", "stable"], dollarDependence: ["hyperinflation", "hyper_3"] },
    usDeals: { yellowLeverage: [4, 5], blackLeverage: [], dollarDependence: [5] },
    ussrDeals: { yellowLeverage: [4], blackLeverage: [], reichswehr: [5], kpdCadres: [4, 5] }
  },
  fate_1919: {
    progressReaction: { yellowLeverage: [], blackLeverage: [2], middleClass: [2, 3, 4, 5], reforms: [2, 3, 4, 5], assassinations: [2], nsdapCadres: [3, 4], conservativeCliques: [5] },
    economy: { middleClass: ["stable", "stable"], dollarDependence: [] },
    usDeals: { yellowLeverage: [1, 2, 3, 4, 5], blackLeverage: [], dollarDependence: [3, 4, 5] },
    ussrDeals: { yellowLeverage: [2, 4], blackLeverage: [1, 3], reichswehr: [1, 3, 5], kpdCadres: [2, 4, 5] }
  }
};

function countMapFromList(keys, items = []) {
  const map = Object.fromEntries(keys.map(key => [key, 0]));
  (Array.isArray(items) ? items : []).forEach(item => {
    const key = String(item);
    if (Object.prototype.hasOwnProperty.call(map, key)) map[key] += 1;
  });
  return map;
}

function normalizeCountMap(source, keys, max = 20) {
  const data = source && typeof source === "object" && !Array.isArray(source) ? source : {};
  return Object.fromEntries(keys.map(key => [key, clampInt(data[key], 0, max)]));
}

function countMapHasAny(map) {
  return Object.values(map || {}).some(value => Number(value) > 0);
}

function countMapLabel(map) {
  const parts = Object.entries(map || {})
    .filter(([, value]) => Number(value) > 0)
    .map(([key, value]) => Number(value) > 1 ? `${key} x${value}` : key);
  return parts.length ? parts.join(", ") : "none";
}

function blankEconomicLeverageBoxes() {
  return {
    usDeals: { yellow: [], black: [] },
    ussrDeals: { yellow: [], black: [] }
  };
}

function normalizeBoxList(value) {
  return Array.isArray(value)
    ? [...new Set(value.map(item => clampInt(item, 1, 5)).filter(Boolean))].sort((a, b) => a - b)
    : [];
}

function normalizeEconomicLeverageBoxes(existing = {}) {
  const source = existing && typeof existing === "object" && !Array.isArray(existing) ? existing : {};
  return {
    usDeals: {
      yellow: normalizeBoxList(source.usDeals?.yellow),
      black: normalizeBoxList(source.usDeals?.black)
    },
    ussrDeals: {
      yellow: normalizeBoxList(source.ussrDeals?.yellow),
      black: normalizeBoxList(source.ussrDeals?.black)
    }
  };
}

function economicLeverageBoxesEmpty(boxes) {
  const normalized = normalizeEconomicLeverageBoxes(boxes);
  return !normalized.usDeals.yellow.length
    && !normalized.usDeals.black.length
    && !normalized.ussrDeals.yellow.length
    && !normalized.ussrDeals.black.length;
}

function boxListLabel(boxes) {
  const list = normalizeBoxList(boxes);
  return list.length ? list.join(", ") : "none";
}

function leverageRelationForBoxes(boxes, currentValue) {
  return normalizeBoxList(boxes).includes(Number(currentValue)) ? "above" : "none";
}

function scenarioLeverageDefaults(scenarioId, start = {}) {
  const pieces = scenarioTrackPieceData[scenarioId] || {};
  const progressReaction = pieces.progressReaction || {};
  const usDeals = pieces.usDeals || {};
  const ussrDeals = pieces.ussrDeals || {};
  return {
    yellowProgressLeverage: leverageRelationForBoxes(progressReaction.yellowLeverage, start.progress),
    blackReactionLeverage: leverageRelationForBoxes(progressReaction.blackLeverage, start.reaction),
    economicLeverageBoxes: normalizeEconomicLeverageBoxes({
      usDeals: { yellow: usDeals.yellowLeverage || [], black: usDeals.blackLeverage || [] },
      ussrDeals: { yellow: ussrDeals.yellowLeverage || [], black: ussrDeals.blackLeverage || [] }
    })
  };
}

const mcsTrackTypes = ["progressReaction", "economy"];
const mcsNumericBoxes = progressReactionBoxes;

function blankTrackPieces() {
  const blankProgress = () => Object.fromEntries(progressReactionBoxes.map(box => [box, 0]));
  const blankDeal = () => Object.fromEntries(dealTrackBoxes.map(box => [box, 0]));
  const blankEconomy = () => Object.fromEntries(economyOptions.map(([id]) => [id, 0]));
  return {
    progressReaction: {
      yellowLeverage: blankProgress(),
      blackLeverage: blankProgress(),
      reforms: blankProgress(),
      assassinations: blankProgress(),
      nsdapCadres: blankProgress(),
      conservativeCliques: blankProgress()
    },
    economy: {
      dollarDependence: blankEconomy()
    },
    usDeals: {
      yellowLeverage: blankDeal(),
      blackLeverage: blankDeal(),
      dollarDependence: blankDeal()
    },
    ussrDeals: {
      yellowLeverage: blankDeal(),
      blackLeverage: blankDeal(),
      reichswehr: blankDeal(),
      kpdCadres: blankDeal()
    }
  };
}

function normalizeTrackPieces(existing = {}) {
  const source = existing && typeof existing === "object" && !Array.isArray(existing) ? existing : {};
  const progress = source.progressReaction || {};
  const economy = source.economy || {};
  const usDeals = source.usDeals || {};
  const ussrDeals = source.ussrDeals || {};
  return {
    progressReaction: {
      yellowLeverage: normalizeCountMap(progress.yellowLeverage, progressReactionBoxes, 9),
      blackLeverage: normalizeCountMap(progress.blackLeverage, progressReactionBoxes, 9),
      reforms: normalizeCountMap(progress.reforms, progressReactionBoxes, 9),
      assassinations: normalizeCountMap(progress.assassinations, progressReactionBoxes, 9),
      nsdapCadres: normalizeCountMap(progress.nsdapCadres, progressReactionBoxes, 9),
      conservativeCliques: normalizeCountMap(progress.conservativeCliques, progressReactionBoxes, 9)
    },
    economy: {
      dollarDependence: normalizeCountMap(economy.dollarDependence, economyOptions.map(([id]) => id), 9)
    },
    usDeals: {
      yellowLeverage: normalizeCountMap(usDeals.yellowLeverage, dealTrackBoxes, 9),
      blackLeverage: normalizeCountMap(usDeals.blackLeverage, dealTrackBoxes, 9),
      dollarDependence: normalizeCountMap(usDeals.dollarDependence, dealTrackBoxes, 9)
    },
    ussrDeals: {
      yellowLeverage: normalizeCountMap(ussrDeals.yellowLeverage, dealTrackBoxes, 9),
      blackLeverage: normalizeCountMap(ussrDeals.blackLeverage, dealTrackBoxes, 9),
      reichswehr: normalizeCountMap(ussrDeals.reichswehr, dealTrackBoxes, 9),
      kpdCadres: normalizeCountMap(ussrDeals.kpdCadres, dealTrackBoxes, 9)
    }
  };
}

function trackPiecesEmpty(pieces) {
  const normalized = normalizeTrackPieces(pieces);
  return !Object.values(normalized).some(group => Object.values(group).some(countMapHasAny));
}

const trackPieceLabels = {
  progressReaction: "Progress / Reaction",
  economy: "Economy",
  usDeals: "U.S. Deals",
  ussrDeals: "U.S.S.R. Deals",
  yellowLeverage: "Yellow Leverage",
  blackLeverage: "Black Leverage",
  reforms: "Reforms",
  assassinations: "Assassinations",
  nsdapCadres: "NSDAP Cadres",
  conservativeCliques: "Conservative Cliques",
  dollarDependence: "Dollar Dependence",
  reichswehr: "Reichswehr",
  kpdCadres: "KPD Cadres"
};

function trackPieceLabel(key) {
  return trackPieceLabels[key] || key;
}

function scenarioTrackPieceDefaults(scenarioId) {
  const data = scenarioTrackPieceData[scenarioId] || {};
  const progress = data.progressReaction || {};
  const economy = data.economy || {};
  const usDeals = data.usDeals || {};
  const ussrDeals = data.ussrDeals || {};
  return {
    progressReaction: {
      yellowLeverage: countMapFromList(progressReactionBoxes, progress.yellowLeverage),
      blackLeverage: countMapFromList(progressReactionBoxes, progress.blackLeverage),
      reforms: countMapFromList(progressReactionBoxes, progress.reforms),
      assassinations: countMapFromList(progressReactionBoxes, progress.assassinations),
      nsdapCadres: countMapFromList(progressReactionBoxes, progress.nsdapCadres),
      conservativeCliques: countMapFromList(progressReactionBoxes, progress.conservativeCliques)
    },
    economy: {
      dollarDependence: countMapFromList(economyOptions.map(([id]) => id), economy.dollarDependence)
    },
    usDeals: {
      yellowLeverage: countMapFromList(dealTrackBoxes, usDeals.yellowLeverage),
      blackLeverage: countMapFromList(dealTrackBoxes, usDeals.blackLeverage),
      dollarDependence: countMapFromList(dealTrackBoxes, usDeals.dollarDependence)
    },
    ussrDeals: {
      yellowLeverage: countMapFromList(dealTrackBoxes, ussrDeals.yellowLeverage),
      blackLeverage: countMapFromList(dealTrackBoxes, ussrDeals.blackLeverage),
      reichswehr: countMapFromList(dealTrackBoxes, ussrDeals.reichswehr),
      kpdCadres: countMapFromList(dealTrackBoxes, ussrDeals.kpdCadres)
    }
  };
}

function blankMiddleClassPawns() {
  return {
    mats: Object.fromEntries(factionIds.map(id => [id, 0])),
    tracks: {
      progressReaction: Object.fromEntries(mcsNumericBoxes.map(box => [box, 0])),
      economy: Object.fromEntries(economyOptions.map(([id]) => [id, 0]))
    }
  };
}

function scenarioMiddleClassPawnDefaults(scenarioId) {
  const data = scenarioTrackPieceData[scenarioId] || {};
  const pawns = blankMiddleClassPawns();
  pawns.tracks.progressReaction = countMapFromList(mcsNumericBoxes, data.progressReaction?.middleClass);
  pawns.tracks.economy = countMapFromList(economyOptions.map(([id]) => id), data.economy?.middleClass);
  return pawns;
}

function normalizeMiddleClassPawns(existing = {}) {
  const source = existing && typeof existing === "object" && !Array.isArray(existing) ? existing : {};
  const mats = source.mats && typeof source.mats === "object" ? source.mats : {};
  const tracks = source.tracks && typeof source.tracks === "object" ? source.tracks : {};
  const hasSharedProgressReaction = tracks.progressReaction && typeof tracks.progressReaction === "object";
  const sharedProgressReaction = hasSharedProgressReaction
    ? normalizeCountMap(tracks.progressReaction, mcsNumericBoxes, 20)
    : Object.fromEntries(mcsNumericBoxes.map(box => [box, clampInt(tracks.progress?.[box], 0, 20) + clampInt(tracks.reaction?.[box], 0, 20)]));
  const normalized = {
    mats: Object.fromEntries(factionIds.map(id => [id, clampInt(mats[id], 0, 20)])),
    tracks: {
      progressReaction: sharedProgressReaction,
      economy: Object.fromEntries(economyOptions.map(([id]) => [id, clampInt(tracks.economy?.[id], 0, 20)]))
    }
  };
  const legacyAvailable = clampInt(source.available, 0, 20);
  if (legacyAvailable) normalized.tracks.progressReaction["1"] += legacyAvailable;
  return normalized;
}

function normalizeMcsLocation(location) {
  const [type, id] = String(location || "").split(":");
  if ((type === "progress" || type === "reaction") && Object.prototype.hasOwnProperty.call(Object.fromEntries(mcsNumericBoxes.map(box => [box, true])), id)) {
    return `progressReaction:${id}`;
  }
  return String(location || "");
}

function mcsLocationOptions() {
  return [
    ...factionIds.map(id => [`mat:${id}`, `${factions[id].short} playmat`]),
    ...mcsNumericBoxes.map(box => [`progressReaction:${box}`, `Progress/Reaction box ${box}`]),
    ...economyOptions.map(([id, label]) => [`economy:${id}`, `Economy ${label}`])
  ];
}

function mcsLocationLabel(location) {
  return mcsLocationOptions().find(([id]) => id === location)?.[1] || location;
}

function mcsTrackLocationOptions() {
  return mcsLocationOptions().filter(([id]) => !id.startsWith("mat:"));
}

function defaultMcsTrackLocation() {
  const progressBox = String(Math.max(1, Math.min(6, Number(state.boardState?.progress || 1))));
  return `progressReaction:${progressBox}`;
}

function firstOccupiedMcsTrackLocation() {
  const pawns = normalizeMiddleClassPawns(state.boardState.middleClassPawns);
  for (const [location] of mcsTrackLocationOptions()) {
    const [track, id] = location.split(":");
    if (Number(pawns.tracks[track]?.[id] || 0) > 0) return location;
  }
  return defaultMcsTrackLocation();
}

function defaultMcsDestinationForFaction(factionId = state.activeFaction) {
  return factions[factionId] ? `mat:${factionId}` : defaultMcsTrackLocation();
}

function totalMiddleClassPawns(pawns = state.boardState.middleClassPawns) {
  const normalized = normalizeMiddleClassPawns(pawns);
  const matTotal = Object.values(normalized.mats).reduce((sum, value) => sum + value, 0);
  const trackTotal = mcsTrackTypes.reduce((sum, track) => {
    return sum + Object.values(normalized.tracks[track] || {}).reduce((inner, value) => inner + value, 0);
  }, 0);
  return matTotal + trackTotal;
}

const stanceOptions = [
  ["not_in_play", "Not in play"],
  ["revolutionary", "Revolutionary"],
  ["left_revolutionary", "1 left of Revolutionary"],
  ["pragmatic", "Pragmatic"],
  ["democratic", "Democratic"]
];

function stanceLabel(value) {
  return stanceOptions.find(([id]) => id === value)?.[1] || value;
}

const scenarios = [
  {
    id: "tutorial_1921",
    title: "Tutorial Scenario",
    years: "1921-1923",
    rounds: 6,
    length: "1-2 hours",
    source: "Playbook 9.2, pages 2-3",
    start: { year: 1921, round: 1, momentumFaction: "coalition", economy: "hyper_2", progress: 2, reaction: 3, unity: "sound", usDeals: 1, ussrDeals: 2, kpdStance: "not_in_play", nsdapStance: "not_in_play", reactionLimitIgnored: true },
    special: ["Ignore Event card Requires requirements.", "KPD and NSDAP Stance tracks are not in play; treat both as Pragmatic for Events.", "Reaction is not limited by Progress."],
    victory: ["If no Sudden Victory or General Election Victory by Late Year 1923, immediately hold Regional Elections and then a General Election.", "The General Election winner wins."],
    setup: [
      "Crisis deck prepared; each faction draws 5 Event cards.",
      "Article 48: Coalition. Reichstag Seats: Uncontrolled and set aside until the next General Election. All Parliamentary Control cards: Coalition.",
      "Economy: 2 boxes left of Stable toward Hyperinflation, with 2 Middle Class Sympathies, one in each box.",
      "Progress 2 / Reaction 3: yellow Leverage boxes 2-3; black Leverage boxes 2-3; Middle Class Sympathies boxes 3-5; Reforms boxes 2-5; Assassinations box 2; NSDAP Cadre box 4; Conservative Clique box 5.",
      "U.S. Deals 1: yellow Leverage boxes 2-5; Dollar Dependence boxes 3-5.",
      "U.S.S.R. Deals 2: Reichswehr boxes 1, 3, and 5; KPD Cadres boxes 4-5; black Leverage box 3; yellow Leverage box 4.",
      "Faction mats and map: use Playbook Graphic Guide A; Coalition marker in all Parliamentary Control boxes; set aside faction PV markers."
    ]
  },
  {
    id: "revolution_1919",
    title: "A Time for Revolution?",
    years: "1919-1923",
    rounds: 10,
    length: "1.5-2 hours",
    source: "Playbook 9.3, pages 4-6",
    start: { year: 1919, round: 1, momentumFaction: "coalition", economy: "stable", progress: 1, reaction: 2, unity: "sound", usDeals: 1, ussrDeals: 1, kpdStance: "left_revolutionary", nsdapStance: "revolutionary", reactionLimitIgnored: true },
    special: ["Reaction is not limited by Progress.", "The Momentum faction may call one Extra Election with an Available Parliamentary Control card or Reichstag Seats card."],
    victory: ["If no Sudden Victory or General Election Victory by Late Year 1923, immediately hold Regional Elections and then a General Election.", "Apply the scenario final-election PV modifiers before determining the winner."],
    setup: [
      "Crisis deck prepared; each faction draws 7 Event cards.",
      "Article 48: Coalition. Reichstag Seats: Uncontrolled and set aside until the next General Election. All Parliamentary Control cards: Coalition.",
      "Economy: Stable, with 2 Middle Class Sympathies, one in each box.",
      "Progress 1 / Reaction 2: no yellow Leverage; black Leverage box 2; Middle Class Sympathies boxes 2-5; Reforms boxes 2-5; Assassinations box 2; NSDAP Cadres boxes 3-4; Conservative Clique box 5.",
      "U.S. Deals 1: yellow Leverage boxes 1-5; Dollar Dependence boxes 3-5.",
      "U.S.S.R. Deals 1: Reichswehr boxes 1, 3, and 5; yellow Leverage boxes 2 and 4; KPD Cadres boxes 2, 4, and 5; black Leverage box 3.",
      "Faction mats and map: use Playbook Graphic Guide B; shuffle Freikorps and set Coalition Freikorps unrevealed; Coalition marker in all Parliamentary Control boxes; set aside faction PV markers."
    ]
  },
  {
    id: "new_hope_1924",
    title: "A New Hope",
    years: "1924-1933",
    rounds: 20,
    length: "4-6 hours",
    source: "Playbook 9.4, pages 7-8",
    start: { year: 1924, round: 1, momentumFaction: "coalition", economy: "stable", progress: 2, reaction: 3, unity: "strong", usDeals: 2, ussrDeals: 2, kpdStance: "pragmatic", nsdapStance: "pragmatic", reactionLimitIgnored: false },
    special: [],
    victory: ["If no Sudden Victory, General Election Victory, or Event Card Victory by Late Year 1933, check Coalition Held Cards Penalty.", "If Coalition had any Held Cards Penalty in the last round, hold elections; otherwise Coalition wins."],
    setup: [
      "Remove Crisis Era cards. Set aside Decline Era cards until 1930. Prepare Golden Twenties deck; each faction draws 9 Event cards.",
      "Article 48: Coalition. Reichstag Seats: Radical Conservatives. All Parliamentary Control cards: Coalition.",
      "Economy: Stable, with 2 Middle Class Sympathies, one in each box.",
      "Progress 2 / Reaction 3: yellow Leverage boxes 2-3; black Leverage boxes 2-3; Middle Class Sympathies boxes 4-5; Reforms boxes 2-5; Assassinations box 2; NSDAP Cadre box 4; Conservative Clique box 5.",
      "U.S. Deals 2: yellow Leverage boxes 3-5; Dollar Dependence boxes 3-5.",
      "U.S.S.R. Deals 2: Reichswehr boxes 3 and 5; yellow Leverage boxes 2 and 4; black Leverage box 3; KPD Cadres boxes 4-5.",
      "Faction mats and map: use Playbook Graphic Guide C; reveal Coalition Freikorps, remove 3 revealed Rogue Freikorps and 3 loyal Freikorps, put remaining revealed Rogue Freikorps on RC mat; Coalition marker in all Parliamentary Control boxes."
    ]
  },
  {
    id: "black_sun_1928",
    title: "Black Sun Rising",
    years: "1928-1933",
    rounds: 12,
    length: "2-3 hours",
    source: "Playbook 9.5, pages 9-11",
    start: { year: 1928, round: 1, momentumFaction: "coalition", economy: "stable", progress: 4, reaction: 3, unity: "sound", usDeals: 4, ussrDeals: 4, kpdStance: "not_in_play", nsdapStance: "not_in_play", reactionLimitIgnored: true },
    special: ["KPD and NSDAP Stance tracks are not in play; treat both as Pragmatic for Events.", "Reaction is not limited by Progress."],
    victory: ["If no Sudden Victory, General Election Victory, or Event Card Victory by Late Year 1933, check Coalition Held Cards Penalty.", "If Coalition had any Held Cards Penalty in the last round, hold elections; otherwise Coalition wins."],
    setup: [
      "Remove all Crisis Era cards and Golden Twenties Election cards. Set aside Decline Era cards until 1930.",
      "Lingering Events #54 Gustav Stresemann and #57 Paul von Hindenburg start in effect. Randomly draw 3 other Golden Twenties Lingering Events to start in effect.",
      "Each faction draws 3 Event cards.",
      "Article 48: Coalition. Reichstag Seats: Radical Conservatives. Koeln Parliamentary Control: Uncontrolled until the next Regional Election in Koeln. Other Parliamentary Control cards: Coalition.",
      "Economy: Stable, with 2 Middle Class Sympathies and 2 Dollar Dependence markers, one each in the two leftmost boxes.",
      "Progress 4 / Reaction 3: yellow Leverage boxes 2-4; black Leverage boxes 2-3; Middle Class Sympathies boxes 4-5; Reforms boxes 2-5; Assassinations box 2; NSDAP Cadres boxes 3-4; Conservative Clique box 5.",
      "U.S. Deals 4: yellow Leverage boxes 4-5; Dollar Dependence box 5.",
      "U.S.S.R. Deals 4: Reichswehr box 5; yellow Leverage box 4; KPD Cadres boxes 4-5.",
      "Faction mats and map: use Playbook Graphic Guide D; reveal Coalition Freikorps, remove 3 revealed Rogue Freikorps and 3 loyal Freikorps, put remaining revealed Rogue Freikorps on RC mat; leave Koeln Parliamentary Control empty."
    ]
  },
  {
    id: "fate_1919",
    title: "The Fate of the Republic",
    years: "1919-1933",
    rounds: 30,
    length: "5-8 hours",
    source: "Playbook 9.6, pages 12-13",
    start: { year: 1919, round: 1, momentumFaction: "coalition", economy: "stable", progress: 1, reaction: 2, unity: "sound", usDeals: 1, ussrDeals: 1, kpdStance: "left_revolutionary", nsdapStance: "revolutionary", reactionLimitIgnored: false },
    special: [],
    victory: ["If no Sudden Victory, General Election Victory, or Event Card Victory by Late Year 1933, check Coalition Held Cards Penalty.", "If Coalition had any Held Cards Penalty in the last round, hold elections; otherwise Coalition wins."],
    setup: [
      "Set aside Golden Twenties and Decline Era cards until 1924 and 1930. Prepare Crisis deck; each faction draws 7 Event cards.",
      "Article 48: Coalition. Reichstag Seats: Uncontrolled and set aside until the next General Election. All remaining Parliamentary Control cards: Coalition.",
      "Economy: Stable, with 2 Middle Class Sympathies, one in each box.",
      "Progress 1 / Reaction 2: no yellow Leverage; black Leverage box 2; Middle Class Sympathies boxes 2-5; Reforms boxes 2-5; Assassinations box 2; NSDAP Cadres boxes 3-4; Conservative Clique box 5.",
      "U.S. Deals 1: yellow Leverage boxes 1-5; Dollar Dependence boxes 3-5.",
      "U.S.S.R. Deals 1: Reichswehr boxes 1, 3, and 5; yellow Leverage boxes 2 and 4; black Leverage boxes 1 and 3; KPD Cadres boxes 2, 4, and 5.",
      "Faction mats and map: use Playbook Graphic Guide E; shuffle Freikorps and set Coalition Freikorps unrevealed; Coalition marker in all Parliamentary Control boxes; set aside faction PV markers."
    ]
  }
];

function currentScenario() {
  return scenarios.find(scenario => scenario.id === state.scenarioId) || null;
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
      summary: "Move one Middle Class Sympathies pawn between a track and a faction mat.",
      requires: ["A Middle Class Sympathies pawn on a faction mat, the Progress/Reaction track, or the Economy track."]
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
      requires: ["An Available Coalition FK or Reichswehr unit.", "Target space has Coalition Parliamentary Control or Coalition Dominance."]
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
      context: ["kpd_stance_in_play"],
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
      summary: "Move one Middle Class Sympathies pawn between a track and a faction mat.",
      requires: ["A Middle Class Sympathies pawn on a faction mat, the Progress/Reaction track, or the Economy track."]
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
      requires: ["An Available KPD Worker Militia unit.", "Target has KPD Dominance, KPD Parliamentary Control, or a KPD Cadre."],
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
      context: ["nsdap_stance_in_play"],
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
      procedure: ["For each Cadre, choose one: move one pawn from a track to NSDAP, move one from RC mat to NSDAP, or return one from any faction mat to a track."]
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
      requires: ["An Available NSDAP SA unit.", "Target has NSDAP Parliamentary Control, NSDAP Dominance, or an NSDAP Cadre."],
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
      summary: "Move one Middle Class Sympathies pawn between a track and a faction mat.",
      requires: ["A Middle Class Sympathies pawn on a faction mat, the Progress/Reaction track, or the Economy track."]
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
  screen: "solo_setup",
  navStack: [],
  scenarioId: "",
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
  mapReturnScreen: "action_resolve",
  sequenceAnswers: {
    actionChoice: "",
    electionPlayed: "",
    suddenVictory: "",
    generalElectionOutcome: "",
    timelineFlip: ""
  },
  choiceDrafts: {},
  choiceLog: [],
  effectDrafts: {},
  effectHistory: [],
  actionPlan: ["", ""],
  selectedActionId: "",
  actionContext: {},
  newYearOrder: {
    card: "",
    order: []
  },
  soloSetupComplete: false,
  boardReturnScreen: "sequence",
  boardNotice: "",
  boardState: {
    progress: 0,
    reaction: 0,
    economy: "stable",
    unity: "sound",
    generalStrikeActive: false,
    yellowProgressLeverage: "unknown",
    blackReactionLeverage: "unknown",
    yellowEconomyLeverage: "none",
    blackEconomyLeverage: "none",
    economicLeverageBoxes: blankEconomicLeverageBoxes(),
    trackPieces: blankTrackPieces(),
    usDeals: 1,
    ussrDeals: 1,
    kpdStance: "left_revolutionary",
    nsdapStance: "revolutionary",
    reactionLimitIgnored: false,
    middleClassPawns: blankMiddleClassPawns(),
    selectedSpace: "berlin",
    spaces: {},
    scenarioSetup: "",
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
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

function clampInt(value, min = 0, max = 99) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.max(min, Math.min(max, Math.trunc(parsed)));
}

function normalizeSpaceId(value) {
  const raw = String(value || "").trim();
  if (!raw) return "berlin";
  const normalized = raw.toLowerCase().replaceAll("ü", "ue").replaceAll("ö", "oe").replaceAll("ä", "ae").replaceAll("ß", "ss");
  const slug = normalized.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  const spaced = normalized.replace(/[^a-z0-9]+/g, " ").trim();
  return mapSpaces.some(space => space.id === slug) ? slug : spaceAliases[slug] || spaceAliases[spaced] || "berlin";
}

function mapSpaceMeta(spaceId) {
  return mapSpaces.find(space => space.id === spaceId) || mapSpaces.find(space => space.id === "berlin");
}

function blankSpaceState(spaceId) {
  const meta = mapSpaceMeta(spaceId);
  return {
    id: spaceId,
    population: meta?.population || 0,
    politicalValue: meta?.politicalValue || 0,
    control: "coalition",
    supremacy: "",
    influence: Object.fromEntries(factionIds.map(id => [id, 0])),
    units: Object.fromEntries(factionIds.map(id => [id, 0])),
    specialUnits: { reichswehr: 0 },
    guideTokens: [],
    markers: {
      strike: false,
      uprising: false,
      reform: false,
      kpdCadre: 0,
      nsdapCadre: 0,
      conservativeClique: 0,
      yellowLeverage: 0,
      blackLeverage: 0,
      assassinations: ""
    },
    notes: ""
  };
}

function normalizeSpaceState(spaceId, existing = {}) {
  const base = blankSpaceState(spaceId);
  const influence = existing.influence && typeof existing.influence === "object" ? existing.influence : {};
  const units = existing.units && typeof existing.units === "object" ? existing.units : {};
  const specialUnits = existing.specialUnits && typeof existing.specialUnits === "object" ? existing.specialUnits : {};
  const markers = existing.markers && typeof existing.markers === "object" ? existing.markers : {};
  const guideTokens = Array.isArray(existing.guideTokens) ? existing.guideTokens : [];
  return {
    ...base,
    population: clampInt(existing.population || base.population, 0, 20),
    politicalValue: clampInt(existing.politicalValue || base.politicalValue, 0, 20),
    control: controlOptions.some(([id]) => id === existing.control) ? existing.control : base.control,
    supremacy: controlOptions.some(([id]) => id === existing.supremacy) ? existing.supremacy : "",
    influence: Object.fromEntries(factionIds.map(id => [id, clampInt(influence[id], 0, 99)])),
    units: Object.fromEntries(factionIds.map(id => [id, clampInt(units[id], 0, 99)])),
    specialUnits: {
      reichswehr: clampInt(specialUnits.reichswehr, 0, 99)
    },
    guideTokens: guideTokens.map(token => String(token || "").trim()).filter(Boolean).slice(0, 24),
    markers: {
      strike: !!markers.strike,
      uprising: !!markers.uprising,
      reform: !!markers.reform,
      kpdCadre: clampInt(markers.kpdCadre, 0, 9),
      nsdapCadre: clampInt(markers.nsdapCadre, 0, 9),
      conservativeClique: clampInt(markers.conservativeClique, 0, 9),
      yellowLeverage: markers.yellowLeverage === true ? 1 : clampInt(markers.yellowLeverage, 0, 9),
      blackLeverage: markers.blackLeverage === true ? 1 : clampInt(markers.blackLeverage, 0, 9),
      assassinations: markers.assassinations || ""
    },
    notes: existing.notes || ""
  };
}

function defaultSpacesForScenario(scenarioId = "") {
  const spaces = Object.fromEntries(mapSpaces.map(space => [space.id, blankSpaceState(space.id)]));
  const setup = scenarioSpaceSetups[scenarioId] || {};
  for (const [spaceId, seed] of Object.entries(setup)) {
    if (!spaces[spaceId]) continue;
    spaces[spaceId] = normalizeSpaceState(spaceId, {
      ...spaces[spaceId],
      ...seed,
      influence: { ...spaces[spaceId].influence, ...(seed.influence || {}) },
      units: { ...spaces[spaceId].units, ...(seed.units || {}) },
      specialUnits: { ...spaces[spaceId].specialUnits, ...(seed.specialUnits || {}) },
      guideTokens: [...(spaces[spaceId].guideTokens || []), ...(seed.guideTokens || [])],
      markers: { ...spaces[spaceId].markers, ...(seed.markers || {}) },
      notes: [spaces[spaceId].notes, seed.notes].filter(Boolean).join(" | ")
    });
  }
  if (scenarioId === "black_sun_1928") spaces.koeln.control = "uncontrolled";
  return spaces;
}

function normalizeBoardSpaces(existing = {}, scenarioId = state.scenarioId) {
  const scenarioSpaces = defaultSpacesForScenario(scenarioId);
  const source = existing && typeof existing === "object" && !Array.isArray(existing) ? existing : {};
  return Object.fromEntries(mapSpaces.map(space => {
    const saved = source[space.id] || {};
    const seeded = scenarioSpaces[space.id] || blankSpaceState(space.id);
    return [space.id, normalizeSpaceState(space.id, { ...seeded, ...saved })];
  }));
}

function selectedSpace() {
  const id = normalizeSpaceId(state.boardState.selectedSpace);
  return state.boardState.spaces[id] || state.boardState.spaces.berlin || blankSpaceState("berlin");
}

function spaceLabel(spaceId) {
  return mapSpaces.find(space => space.id === spaceId)?.label || spaceId;
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
  if (!Array.isArray(state.navStack)) state.navStack = [];
  state.navStack = state.navStack.slice(-25);
  if (state.scenarioId && !scenarios.some(scenario => scenario.id === state.scenarioId)) state.scenarioId = "";
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
  if (!state.choiceDrafts || typeof state.choiceDrafts !== "object" || Array.isArray(state.choiceDrafts)) state.choiceDrafts = {};
  if (!Array.isArray(state.choiceLog)) state.choiceLog = [];
  state.choiceLog = state.choiceLog.filter(entry => entry && typeof entry === "object").slice(-250);
  if (!state.effectDrafts || typeof state.effectDrafts !== "object" || Array.isArray(state.effectDrafts)) state.effectDrafts = {};
  if (!Array.isArray(state.effectHistory)) state.effectHistory = [];
  state.effectHistory = state.effectHistory.filter(entry => entry && typeof entry === "object").slice(-100);
  if (!Array.isArray(state.actionPlan)) state.actionPlan = ["", ""];
  state.actionPlan = [state.actionPlan[0] || "", state.actionPlan[1] || ""];
  if (typeof state.selectedActionId !== "string") state.selectedActionId = "";
  if (!state.actionContext || typeof state.actionContext !== "object") state.actionContext = {};
  if (!state.newYearOrder || typeof state.newYearOrder !== "object") state.newYearOrder = {};
  state.newYearOrder = {
    card: normalizeBotCardKey(state.newYearOrder.card) || "",
    order: normalizeNewYearOrder(state.newYearOrder.order)
  };
  state.soloSetupComplete = !!state.soloSetupComplete;
  const knownScreens = ["solo_setup", "scenario_setup", "sequence", "turn_order", "faction_turn", "action_resolve", "board_state", "scenario_audit", "map_space", "factions", "rules", "notes", "save_load", "result"];
  if (!knownScreens.includes(state.screen) || state.screen === "dashboard") {
    state.screen = state.soloSetupComplete ? (state.scenarioId ? "sequence" : "scenario_setup") : "solo_setup";
  }
  if (!knownScreens.includes(state.boardReturnScreen) || state.boardReturnScreen === "board_state") state.boardReturnScreen = "sequence";
  if (!knownScreens.includes(state.mapReturnScreen) || state.mapReturnScreen === "map_space") state.mapReturnScreen = "action_resolve";
  if (typeof state.boardNotice !== "string") state.boardNotice = "";
  if (!state.boardState || typeof state.boardState !== "object") state.boardState = {};
  const existingBoard = state.boardState;
  state.boardState = {
    progress: Number.isFinite(Number(state.boardState.progress)) ? Number(state.boardState.progress) : 0,
    reaction: Number.isFinite(Number(state.boardState.reaction)) ? Number(state.boardState.reaction) : 0,
    economy: state.boardState.economy || "stable",
    unity: state.boardState.unity || "sound",
    generalStrikeActive: !!state.boardState.generalStrikeActive,
    yellowProgressLeverage: state.boardState.yellowProgressLeverage || "unknown",
    blackReactionLeverage: state.boardState.blackReactionLeverage || "unknown",
    yellowEconomyLeverage: normalizeEconomyLeverage(state.boardState.yellowEconomyLeverage),
    blackEconomyLeverage: normalizeEconomyLeverage(state.boardState.blackEconomyLeverage),
    economicLeverageBoxes: normalizeEconomicLeverageBoxes(existingBoard.economicLeverageBoxes),
    trackPieces: normalizeTrackPieces(existingBoard.trackPieces),
    usDeals: Number.isFinite(Number(state.boardState.usDeals)) ? Number(state.boardState.usDeals) : 1,
    ussrDeals: Number.isFinite(Number(state.boardState.ussrDeals)) ? Number(state.boardState.ussrDeals) : 1,
    kpdStance: state.boardState.kpdStance || "left_revolutionary",
    nsdapStance: state.boardState.nsdapStance || "revolutionary",
    reactionLimitIgnored: !!state.boardState.reactionLimitIgnored,
    middleClassPawns: normalizeMiddleClassPawns(existingBoard.middleClassPawns),
    selectedSpace: normalizeSpaceId(state.boardState.selectedSpace),
    spaces: normalizeBoardSpaces(existingBoard.spaces, state.scenarioId),
    scenarioSetup: state.boardState.scenarioSetup || "",
    notes: state.boardState.notes || ""
  };
  state.boardState.usDeals = Math.max(0, Math.min(5, state.boardState.usDeals));
  state.boardState.ussrDeals = Math.max(0, Math.min(5, state.boardState.ussrDeals));
  if (!stanceOptions.some(([id]) => id === state.boardState.kpdStance)) state.boardState.kpdStance = "left_revolutionary";
  if (!stanceOptions.some(([id]) => id === state.boardState.nsdapStance)) state.boardState.nsdapStance = "revolutionary";
  const scenarioForLeverage = scenarios.find(scenario => scenario.id === state.scenarioId);
  if (scenarioForLeverage) {
    const leverageDefaults = scenarioLeverageDefaults(scenarioForLeverage.id, scenarioForLeverage.start);
    if (state.boardState.yellowProgressLeverage === "unknown") state.boardState.yellowProgressLeverage = leverageDefaults.yellowProgressLeverage;
    if (state.boardState.blackReactionLeverage === "unknown") state.boardState.blackReactionLeverage = leverageDefaults.blackReactionLeverage;
    if (economicLeverageBoxesEmpty(existingBoard.economicLeverageBoxes)) state.boardState.economicLeverageBoxes = leverageDefaults.economicLeverageBoxes;
    if (trackPiecesEmpty(existingBoard.trackPieces)) state.boardState.trackPieces = scenarioTrackPieceDefaults(scenarioForLeverage.id);
    if (totalMiddleClassPawns(existingBoard.middleClassPawns) === 0) state.boardState.middleClassPawns = scenarioMiddleClassPawnDefaults(scenarioForLeverage.id);
  }
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

function selectedActionForFocus() {
  return findAction(state.selectedActionId) || findAction(defaultActionId()) || currentFactionActions()[0] || null;
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

let autoSaveTimer = null;
let autoSaveReady = false;

function snapshotState() {
  const snapshot = deepClone(state);
  snapshot.navStack = [];
  return snapshot;
}

function pushHistory() {
  if (!autoSaveReady) return;
  state.navStack.push(snapshotState());
  state.navStack = state.navStack.slice(-25);
}

function restoreStateSnapshot(snapshot, navStack) {
  for (const key of Object.keys(state)) delete state[key];
  Object.assign(state, snapshot);
  state.navStack = navStack;
  normalizeState();
}

function autoSaveStateNow() {
  if (!autoSaveReady) return;
  try {
    state.lastSavedAt = new Date().toISOString();
    localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(state));
  } catch (error) {
    // Private browsing or full storage should not block play.
  }
}

function scheduleAutoSave() {
  if (!autoSaveReady) return;
  if (autoSaveTimer) window.clearTimeout(autoSaveTimer);
  autoSaveTimer = window.setTimeout(autoSaveStateNow, AUTO_SAVE_DELAY_MS);
}

function loadAutoSavedState() {
  try {
    const raw = localStorage.getItem(LOCAL_SAVE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    for (const key of Object.keys(state)) delete state[key];
    Object.assign(state, parsed);
    normalizeState();
  } catch (error) {
    localStorage.removeItem(LOCAL_SAVE_KEY);
  }
}

function setScreen(screen, remember = true) {
  if (remember && state.screen !== screen) pushHistory();
  state.screen = screen;
  render();
}

function goToSequence() {
  if (state.screen !== "sequence") pushHistory();
  state.screen = "sequence";
  render();
}

function continueToScenarioSetup() {
  state.soloSetupComplete = true;
  setScreen("scenario_setup");
}

function continueFromScenarioSetup() {
  if (!state.scenarioId) return;
  setScreen("sequence");
}

function takeFactionTurn() {
  pushHistory();
  state.actionPage = "turn";
  state.actionSubpage = isActiveBot() ? "bot_summary" : "choice";
  state.screen = "faction_turn";
  render();
}

function editBoardStateFlow() {
  pushHistory();
  const returnScreens = ["solo_setup", "scenario_setup", "sequence", "faction_turn", "action_resolve", "map_space"];
  state.boardReturnScreen = returnScreens.includes(state.screen) ? state.screen : "sequence";
  state.previousActionPage = state.actionPage || "turn";
  state.actionPage = "board";
  state.screen = "board_state";
  render();
}

function openSpaceMapView(spaceId = state.boardState.selectedSpace, remember = true) {
  if (remember && state.screen !== "map_space") pushHistory();
  state.mapReturnScreen = state.screen === "map_space" ? state.mapReturnScreen : state.screen;
  state.boardState.selectedSpace = normalizeSpaceId(spaceId);
  state.screen = "map_space";
  render();
}

function closeSpaceMapView() {
  const returnScreen = state.mapReturnScreen || state.boardReturnScreen || "action_resolve";
  state.screen = returnScreen === "map_space" ? "action_resolve" : returnScreen;
  render();
}

function editTurnOrderFlow() {
  setScreen("turn_order");
}

function saveTurnOrderFlow() {
  pushHistory();
  state.activeTurnIndex = 0;
  state.activeFaction = state.turnOrder[0] || "coalition";
  resetCurrentFactionPrompts();
  setScreen("sequence");
}

function chooseTurnOption(value) {
  if (!actionChoices.some(option => option.id === value)) return;
  if (state.sequenceAnswers.actionChoice !== value) pushHistory();
  state.sequenceAnswers.actionChoice = value;
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
  state.screen = "action_resolve";
  render();
}

function setFaction(factionId) {
  if (!factions[factionId]) return;
  state.selectedFaction = factionId;
  render();
}

function setActiveFaction(factionId) {
  if (!factions[factionId]) return;
  if (state.activeFaction !== factionId) pushHistory();
  state.activeFaction = factionId;
  const index = state.turnOrder.indexOf(factionId);
  if (index >= 0) state.activeTurnIndex = index;
  state.actionPlan = ["", ""];
  state.selectedActionId = "";
  state.actionContext = {};
  state.newYearOrder = { card: "", order: [] };
  state.botTurn = emptyBotTurn();
  render();
}

function setMomentumFaction(factionId) {
  if (!factions[factionId]) return;
  state.momentumFaction = factionId;
  state.newYearOrder = { card: "", order: normalizeNewYearOrder([]) };
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

function normalizeNewYearOrder(order = state.newYearOrder?.order) {
  const momentum = factions[state.momentumFaction] ? state.momentumFaction : "coalition";
  const source = Array.isArray(order) ? order : [];
  const clean = source.filter(id => factions[id] && id !== momentum);
  for (const id of factionIds) {
    if (id !== momentum && !clean.includes(id)) clean.push(id);
  }
  return clean.slice(0, factionIds.length - 1);
}

function ensureNewYearOrderDraft() {
  if (!state.newYearOrder || typeof state.newYearOrder !== "object") state.newYearOrder = { card: "", order: [] };
  state.newYearOrder.card = normalizeBotCardKey(state.newYearOrder.card) || "";
  state.newYearOrder.order = normalizeNewYearOrder(state.newYearOrder.order);
  const data = botCardDatabase[state.newYearOrder.card];
  if (state.newYearOrder.card && data && data.faction !== state.momentumFaction) state.newYearOrder.card = "";
  return state.newYearOrder;
}

function chooseNewYearBotCard(cardNumber) {
  const key = normalizeBotCardKey(cardNumber);
  const data = botCardDatabase[key];
  if (!data || data.faction !== state.momentumFaction) return;
  state.newYearOrder.card = key;
  state.newYearOrder.order = normalizeNewYearOrder(state.newYearOrder.order);
  render();
}

function drawNewYearBotCard() {
  const keys = botCardRanges[state.momentumFaction] || [];
  if (!keys.length) return;
  const key = keys[Math.floor(Math.random() * keys.length)];
  chooseNewYearBotCard(key);
}

function setNewYearOrderSlot(slot, factionId) {
  if (!factions[factionId] || factionId === state.momentumFaction) return;
  const index = Number(slot);
  if (index < 0 || index >= factionIds.length - 1) return;
  const order = normalizeNewYearOrder(state.newYearOrder?.order);
  const existingIndex = order.indexOf(factionId);
  if (existingIndex >= 0) {
    const displaced = order[index];
    order[existingIndex] = displaced;
  }
  order[index] = factionId;
  state.newYearOrder.order = normalizeNewYearOrder(order);
  render();
}

function applyNewYearTurnOrderFromCard() {
  pushHistory();
  const draft = ensureNewYearOrderDraft();
  state.turnOrder = [...draft.order, state.momentumFaction];
  state.activeTurnIndex = 0;
  state.activeFaction = state.turnOrder[0] || "coalition";
  resetCurrentFactionPrompts();
  state.sequenceChecks["new_year:turn_order"] = true;
  state.sequenceChecks["new_year:bot"] = true;
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
  if (state.year !== parsed) pushHistory();
  state.year = parsed;
  state.activeTurnIndex = 0;
  state.activeFaction = state.turnOrder[0] || "coalition";
  resetSequenceForNextAction();
  render();
}

function setRound(round) {
  if (state.round !== (round === 2 ? 2 : 1)) pushHistory();
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
  scheduleAutoSave();
}

function updateNotes(value) {
  state.notes = value;
  scheduleAutoSave();
}

function updateSaveLoadText(value) {
  state.saveLoadText = value;
}

function completeSoloSetup() {
  state.soloSetupComplete = true;
  setScreen(state.scenarioId ? "sequence" : "scenario_setup");
}

function editSoloSetup() {
  state.soloSetupComplete = false;
  render();
}

function setBoardState(key, value) {
  if (!Object.prototype.hasOwnProperty.call(state.boardState, key)) return;
  if (key === "progress" || key === "reaction" || key === "usDeals" || key === "ussrDeals") {
    const parsed = Number(value);
    const max = key === "usDeals" || key === "ussrDeals" ? 5 : 6;
    state.boardState[key] = Number.isFinite(parsed) ? Math.max(0, Math.min(max, parsed)) : 0;
  } else if (key === "generalStrikeActive" || key === "reactionLimitIgnored") {
    state.boardState[key] = value === true || value === "true";
  } else if (key === "yellowEconomyLeverage" || key === "blackEconomyLeverage") {
    state.boardState[key] = normalizeEconomyLeverage(value);
  } else {
    state.boardState[key] = value;
  }
  render();
}

function actionLabelForId(actionId) {
  if (actionId === "special") {
    const special = botSpecialForDie();
    return special ? `Special Action: ${special.title}` : "Special Action";
  }
  return findAction(actionId)?.title || "";
}

function currentChoiceContext() {
  const subpage = state.actionSubpage;
  const controller = activeController() === "bot" ? "Bot" : "Human";
  const slot = subpage === "action2" || subpage === "bot_action2" ? 1 : 0;
  let kind = currentSequencePhase().title;
  let actionLabel = "";

  if (subpage === "event") {
    kind = "Event";
    actionLabel = state.eventTitle || "Event card";
  } else if (subpage === "action1" || subpage === "action2") {
    kind = `Action ${slot + 1}`;
    actionLabel = actionLabelForId(state.actionPlan[slot] || state.selectedActionId || defaultActionId());
  } else if (subpage === "bot_summary") {
    kind = "Bot card";
    actionLabel = state.botTurn.card ? `Bot card ${state.botTurn.card}` : "Bot card reveal";
  } else if (subpage === "bot_action1" || subpage === "bot_action2") {
    kind = `Bot Action ${slot + 1}`;
    actionLabel = actionLabelForId(currentBotAction());
  } else if (subpage === "election" || subpage === "bot_election") {
    kind = "Election check";
    actionLabel = state.sequenceAnswers.electionPlayed === "yes" ? "Election card played" : "No Election card";
  }

  const key = [
    state.year,
    state.round,
    state.activeFaction,
    controller,
    subpage,
    slot,
    actionLabel
  ].join("|");

  return { key, controller, kind, slot, actionLabel };
}

function currentChoiceDraft() {
  const context = currentChoiceContext();
  return state.choiceDrafts[context.key] || { choice: "", target: "", result: "", notes: "" };
}

function updateChoiceDraft(field, value) {
  if (!["choice", "target", "result", "notes"].includes(field)) return;
  const context = currentChoiceContext();
  state.choiceDrafts[context.key] = {
    ...currentChoiceDraft(),
    [field]: value
  };
  scheduleAutoSave();
}

function recordChoice() {
  const context = currentChoiceContext();
  const draft = currentChoiceDraft();
  const hasContent = [draft.choice, draft.target, draft.result, draft.notes, context.actionLabel].some(value => String(value || "").trim());
  if (!hasContent) return;
  pushHistory();
  state.choiceLog.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    recordedAt: new Date().toISOString(),
    year: state.year,
    round: state.round,
    half: currentHalfLabel(),
    faction: state.activeFaction,
    factionLabel: activeFaction().short,
    controller: context.controller,
    phase: context.kind,
    action: context.actionLabel,
    choice: draft.choice || "",
    target: draft.target || "",
    result: draft.result || "",
    notes: draft.notes || ""
  });
  state.choiceLog = state.choiceLog.slice(0, 250);
  delete state.choiceDrafts[context.key];
  render();
}

function deleteChoiceLogEntry(entryId) {
  pushHistory();
  state.choiceLog = state.choiceLog.filter(entry => entry.id !== entryId);
  render();
}

function currentResolutionActionId() {
  if (state.actionSubpage === "action1") return state.actionPlan[0] || state.selectedActionId || defaultActionId();
  if (state.actionSubpage === "action2") return state.actionPlan[1] || state.selectedActionId || defaultActionId();
  if (state.actionSubpage === "bot_action1" || state.actionSubpage === "bot_action2") return currentBotBoardEffectActionId();
  return "";
}

function defaultEffectForAction(actionId) {
  if (actionId === "place_influence") return { mode: "influence", operation: "add", amount: 1 };
  if (actionId === "remove_influence") return { mode: "influence", operation: "remove", amount: 1 };
  if (actionId === "place_unit") return { mode: "unit", operation: "add", amount: 1 };
  if (actionId === "place_cadre") {
    return { mode: "marker", marker: state.activeFaction === "nsdap" ? "nsdapCadre" : "kpdCadre", markerOperation: "add", amount: 1 };
  }
  if (actionId === "place_clique") return { mode: "marker", marker: "conservativeClique", markerOperation: "add", amount: 1 };
  if (actionId === "place_strike") return { mode: "marker", marker: "strike", markerOperation: "set", amount: 1 };
  if (actionId === "flip_strike") return { mode: "marker", marker: "uprising", markerOperation: "set", amount: 1 };
  if (actionId === "place_reform") return { mode: "marker", marker: "reform", markerOperation: "set", amount: 1 };
  if (actionId === "place_assassinations") return { mode: "marker", marker: "assassinations", markerOperation: "set", markerValue: "yellow_red", amount: 1 };
  if (actionId === "place_leverage_map") return { mode: "marker", marker: state.activeFaction === "radical_conservatives" ? "blackLeverage" : "yellowLeverage", markerOperation: "set", amount: 1 };
  if (actionId === "place_leverage_track") return { mode: "track", track: state.activeFaction === "radical_conservatives" ? "blackReactionLeverage" : "yellowProgressLeverage", trackValue: "above", operation: "set", amount: 1 };
  if (actionId === "coalition_economic_leverage") return { mode: "track", track: "yellowEconomyLeverage", trackValue: coalitionEconomyLeverageSide(), operation: "set", amount: 1 };
  if (actionId === "rc_economic_leverage") return { mode: "track", track: "blackEconomyLeverage", trackValue: rcEconomyLeverageSide(), operation: "set", amount: 1 };
  if (actionId === "remove_leverage") return { mode: "marker", marker: "yellowLeverage", markerOperation: "clear", amount: 1 };
  if (actionId === "advance_progress") return { mode: "track", track: "progress", operation: "add", amount: 1 };
  if (actionId === "advance_reaction") return { mode: "track", track: "reaction", operation: "add", amount: 1 };
  if (actionId === "increase_deals") return { mode: "track", track: "usDeals", operation: "add", amount: 1 };
  if (actionId === "increase_ussr_deals") return { mode: "track", track: "ussrDeals", operation: "add", amount: 1 };
  if (actionId === "increase_unity") return { mode: "track", track: "unity", operation: "add", amount: 1 };
  if (actionId === "change_stance") return { mode: "track", track: state.activeFaction === "nsdap" ? "nsdapStance" : "kpdStance", operation: "set", trackValue: state.boardState[state.activeFaction === "nsdap" ? "nsdapStance" : "kpdStance"] };
  if (actionId === "move_mcs") return { mode: "mcs", mcsSource: firstOccupiedMcsTrackLocation(), mcsDestination: defaultMcsDestinationForFaction(), amount: 1 };
  if (actionId === "assault") return { mode: "note", notes: "Resolve Assault, then record casualties/control changes as separate board effects." };
  if (actionId === "special") return { mode: "note", notes: "Resolve the selected bot Special Action, then apply the concrete board change." };
  return {};
}

function currentBotBoardEffectActionId() {
  const actionId = currentBotAction();
  if (actionId !== "special") return actionId;
  return botSpecialBoardEffectActionId() || "special";
}

function botSpecialBoardEffectActionId() {
  const special = botSpecialForDie();
  if (!special) return "";
  const title = special.title || "";
  if (title.includes("Military")) return "place_unit";
  if (title.includes("Stance")) return "change_stance";
  if (title.includes("Strike")) return state.boardState.generalStrikeActive ? "flip_strike" : "place_strike";
  if (title.includes("Cadre")) return "place_cadre";
  if (title.includes("Assassination")) return "place_assassinations";
  if (title.includes("Reform")) return "place_reform";
  if (title.includes("Political")) return state.activeFaction === "coalition" ? "increase_unity" : "move_mcs";
  if (title.includes("Cultural Leverage")) return "place_leverage_track";
  if (title.includes("Economic Leverage")) return state.activeFaction === "radical_conservatives" ? "rc_economic_leverage" : "place_leverage_track";
  if (title.includes("Economic")) return shouldCoalitionUseEconomyLeverage() ? "coalition_economic_leverage" : "place_leverage_map";
  if (title.includes("Agitation")) return derivedContextValue("reaction_can_advance") === false ? "place_assassinations" : "advance_reaction";
  return "";
}

function boardEffectActionLabel(actionId) {
  if (!actionId) return "";
  if (actionId === "increase_ussr_deals") return "Increase U.S.S.R. Deals";
  if (actionId === "move_mcs") return "Move Middle Class Sympathies";
  if (actionId === "coalition_economic_leverage") return "Yellow Economy Leverage";
  if (actionId === "rc_economic_leverage") return "Black Economy Leverage";
  if (actionId === "change_stance") return "Change Stance";
  if (actionId === "special") return "Special Action";
  return findAction(actionId)?.title || actionLabelForId(actionId) || actionId;
}

function currentEffectDraft() {
  const context = currentChoiceContext();
  const space = normalizeSpaceId(state.botTurn.impulse || state.boardState.selectedSpace);
  return {
    mode: "influence",
    space,
    faction: state.activeFaction,
    operation: "add",
    amount: 1,
    control: state.activeFaction,
    marker: "strike",
    markerOperation: "set",
    markerValue: "",
    track: "progress",
    trackValue: "",
    mcsSource: firstOccupiedMcsTrackLocation(),
    mcsDestination: defaultMcsDestinationForFaction(),
    notes: "",
    ...defaultEffectForAction(currentResolutionActionId()),
    ...(state.effectDrafts[context.key] || {})
  };
}

function updateEffectDraft(field, value) {
  const allowed = ["mode", "space", "faction", "operation", "amount", "control", "marker", "markerOperation", "markerValue", "track", "trackValue", "mcsSource", "mcsDestination", "notes"];
  if (!allowed.includes(field)) return;
  const context = currentChoiceContext();
  const draft = currentEffectDraft();
  const nextDraft = {
    ...draft,
    [field]: field === "space" ? normalizeSpaceId(value) : value
  };
  if (field === "mode" && value === "influence" && !factions[nextDraft.faction]) nextDraft.faction = state.activeFaction;
  if (field === "mode" && value === "unit" && !factions[nextDraft.faction] && !specialUnitPieces[nextDraft.faction]) nextDraft.faction = state.activeFaction;
  state.effectDrafts[context.key] = nextDraft;
  if (field === "space") state.boardState.selectedSpace = normalizeSpaceId(value);
  state.boardNotice = "";
  scheduleAutoSave();
  render();
}

function applyNumberOperation(current, operation, amount) {
  const parsed = clampInt(amount, 0, 99);
  if (operation === "remove") return Math.max(0, Number(current || 0) - parsed);
  if (operation === "set") return parsed;
  return Number(current || 0) + parsed;
}

function assignBoardTrack(track, value, operation = "set", amount = 1) {
  if (!Object.prototype.hasOwnProperty.call(state.boardState, track)) return "";
  if (track === "progress" || track === "reaction" || track === "usDeals" || track === "ussrDeals") {
    const max = track === "usDeals" || track === "ussrDeals" ? 5 : 6;
    const next = operation === "set" ? clampInt(value || amount, 0, max) : Math.max(0, Math.min(max, applyNumberOperation(state.boardState[track], operation, amount)));
    state.boardState[track] = next;
    return `${boardTrackOptions.find(([id]) => id === track)?.[1] || track} -> ${next}`;
  }
  if (track === "generalStrikeActive" || track === "reactionLimitIgnored") {
    const next = value === true || value === "true" || value === "active";
    state.boardState[track] = next;
    return `${boardTrackOptions.find(([id]) => id === track)?.[1] || track} -> ${next ? "active/ignored" : "off/normal"}`;
  }
  if (track === "unity" && operation !== "set") {
    const order = ["fragile", "shaky", "sound", "strong"];
    const current = Math.max(0, order.indexOf(state.boardState.unity));
    const direction = operation === "remove" ? -1 : 1;
    const next = order[Math.max(0, Math.min(order.length - 1, current + direction))];
    state.boardState.unity = next;
    return `Coalition Unity -> ${next}`;
  }
  if (track === "yellowEconomyLeverage" || track === "blackEconomyLeverage") {
    const next = operation === "remove" ? "none" : normalizeEconomyLeverage(value || state.boardState[track]);
    state.boardState[track] = next;
    return `${boardTrackOptions.find(([id]) => id === track)?.[1] || track} -> ${economyLeverageLabel(next)}`;
  }
  const next = value || state.boardState[track];
  state.boardState[track] = next;
  return `${boardTrackOptions.find(([id]) => id === track)?.[1] || track} -> ${next}`;
}

function clearEconomyLeverageTrack(track) {
  if (normalizeEconomyLeverage(state.boardState[track]) === "none") return "";
  state.boardState[track] = "none";
  return `${boardTrackOptions.find(([id]) => id === track)?.[1] || track} -> None`;
}

function getMiddleClassLocationCount(location, pawns = state.boardState.middleClassPawns) {
  const normalized = normalizeMiddleClassPawns(pawns);
  const [type, id] = normalizeMcsLocation(location).split(":");
  if (type === "mat" && factions[id]) return normalized.mats[id];
  if (mcsTrackTypes.includes(type) && Object.prototype.hasOwnProperty.call(normalized.tracks[type], id)) return normalized.tracks[type][id];
  return 0;
}

function writeMiddleClassLocationCount(pawns, location, value) {
  const next = normalizeMiddleClassPawns(pawns);
  const count = clampInt(value, 0, 20);
  const [type, id] = normalizeMcsLocation(location).split(":");
  if (type === "mat" && factions[id]) next.mats[id] = count;
  if (mcsTrackTypes.includes(type) && Object.prototype.hasOwnProperty.call(next.tracks[type], id)) next.tracks[type][id] = count;
  return next;
}

function moveMiddleClassPawns(source, destination, amount = 1) {
  const parsed = clampInt(amount, 0, 20);
  if (!parsed) return "";
  source = normalizeMcsLocation(source);
  destination = normalizeMcsLocation(destination);
  if (!mcsLocationOptions().some(([id]) => id === source) || !mcsLocationOptions().some(([id]) => id === destination)) return "";
  if (source === destination) return `MCS already at ${mcsLocationLabel(destination)}`;
  const sourceCount = getMiddleClassLocationCount(source);
  const moved = Math.min(parsed, sourceCount);
  if (!moved) return `No MCS pawn at ${mcsLocationLabel(source)}`;
  let pawns = writeMiddleClassLocationCount(state.boardState.middleClassPawns, source, sourceCount - moved);
  pawns = writeMiddleClassLocationCount(pawns, destination, getMiddleClassLocationCount(destination, pawns) + moved);
  state.boardState.middleClassPawns = pawns;
  return `MCS ${moved} moved from ${mcsLocationLabel(source)} to ${mcsLocationLabel(destination)}`;
}

function setMiddleClassLocation(location, value) {
  state.boardState.middleClassPawns = writeMiddleClassLocationCount(state.boardState.middleClassPawns, location, value);
  render();
}

function setTrackPiece(track, piece, box, value) {
  const pieces = normalizeTrackPieces(state.boardState.trackPieces);
  if (!pieces[track] || !pieces[track][piece] || !Object.prototype.hasOwnProperty.call(pieces[track][piece], box)) return;
  pieces[track][piece][box] = clampInt(value, 0, 9);
  state.boardState.trackPieces = pieces;
  render();
}

function applyBoardEffect() {
  const context = currentChoiceContext();
  const draft = currentEffectDraft();
  const spaceId = normalizeSpaceId(draft.space);
  const space = state.boardState.spaces[spaceId];
  if (!space) return;
  pushHistory();
  let summary = "";

  if (draft.mode === "influence") {
    if (!factions[draft.faction]) return;
    const next = applyNumberOperation(space.influence[draft.faction], draft.operation, draft.amount);
    space.influence[draft.faction] = next;
    summary = `${spaceLabel(spaceId)} ${factions[draft.faction].short} influence -> ${next}`;
  } else if (draft.mode === "unit") {
    if (specialUnitPieces[draft.faction]) {
      ensureSpecialUnits(space);
      const next = applyNumberOperation(space.specialUnits[draft.faction], draft.operation, draft.amount);
      space.specialUnits[draft.faction] = next;
      summary = `${spaceLabel(spaceId)} ${unitPieceLabel(draft.faction)} units -> ${next}`;
    } else {
      if (!factions[draft.faction]) return;
      const next = applyNumberOperation(space.units[draft.faction], draft.operation, draft.amount);
      space.units[draft.faction] = next;
      summary = `${spaceLabel(spaceId)} ${unitPieceLabel(draft.faction)} units -> ${next}`;
    }
  } else if (draft.mode === "control") {
    if (!controlOptions.some(([id]) => id === draft.control)) return;
    space.control = draft.control;
    summary = `${spaceLabel(spaceId)} control -> ${controlOptions.find(([id]) => id === draft.control)?.[1] || draft.control}`;
  } else if (draft.mode === "marker") {
    const marker = draft.marker;
    if (!Object.prototype.hasOwnProperty.call(space.markers, marker)) return;
    if (["kpdCadre", "nsdapCadre", "conservativeClique", "yellowLeverage", "blackLeverage"].includes(marker)) {
      space.markers[marker] = applyNumberOperation(space.markers[marker], draft.markerOperation === "clear" ? "set" : draft.markerOperation, draft.markerOperation === "clear" ? 0 : draft.amount);
    } else if (marker === "assassinations") {
      space.markers.assassinations = draft.markerOperation === "clear" ? "" : draft.markerValue || "yellow_red";
    } else {
      space.markers[marker] = draft.markerOperation !== "clear";
    }
    summary = `${spaceLabel(spaceId)} ${markerOptions.find(([id]) => id === marker)?.[1] || marker} updated`;
  } else if (draft.mode === "track") {
    summary = assignBoardTrack(draft.track, draft.trackValue, draft.operation, draft.amount);
    if (currentResolutionActionId() === "coalition_economic_leverage" && draft.track === "yellowEconomyLeverage") {
      const removedSummary = clearEconomyLeverageTrack("blackEconomyLeverage");
      summary = [removedSummary, summary].filter(Boolean).join("; ");
    }
    if (currentResolutionActionId() === "rc_economic_leverage" && draft.track === "blackEconomyLeverage") {
      const removedSummary = clearEconomyLeverageTrack("yellowEconomyLeverage");
      summary = [removedSummary, summary].filter(Boolean).join("; ");
    }
    if (currentResolutionActionId() === "increase_unity" && draft.track === "unity" && draft.operation === "add") {
      const spendSummary = moveMiddleClassPawns("mat:coalition", defaultMcsTrackLocation(), 1);
      if (spendSummary) summary = [summary, spendSummary].filter(Boolean).join("; ");
    }
  } else if (draft.mode === "mcs") {
    summary = moveMiddleClassPawns(draft.mcsSource, draft.mcsDestination, draft.amount);
  } else if (draft.mode === "note") {
    const text = String(draft.notes || "").trim();
    if (text) space.notes = [space.notes, text].filter(Boolean).join(" | ");
    summary = text ? `${spaceLabel(spaceId)} note added` : `${spaceLabel(spaceId)} note checked`;
  }

  state.boardState.selectedSpace = spaceId;
  state.effectHistory.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    year: state.year,
    half: currentHalfLabel(),
    faction: state.activeFaction,
    phase: context.kind,
    action: context.actionLabel,
    summary
  });
  state.effectHistory = state.effectHistory.slice(0, 100);
  state.boardNotice = summary ? `Applied to board state: ${summary}` : "Applied to board state.";
  delete state.effectDrafts[context.key];
  if (["influence", "unit", "control", "marker", "note"].includes(draft.mode)) {
    state.mapReturnScreen = state.screen;
    state.screen = "map_space";
  }
  render();
}

function setSelectedSpace(spaceId) {
  state.boardState.selectedSpace = normalizeSpaceId(spaceId);
  render();
}

function setSpacePopulation(spaceId, value) {
  const space = state.boardState.spaces[normalizeSpaceId(spaceId)];
  if (!space) return;
  space.population = clampInt(value, 0, 20);
  render();
}

function setSpacePoliticalValue(spaceId, value) {
  const space = state.boardState.spaces[normalizeSpaceId(spaceId)];
  if (!space) return;
  space.politicalValue = clampInt(value, 0, 20);
  render();
}

function setSpaceControl(spaceId, control) {
  const space = state.boardState.spaces[normalizeSpaceId(spaceId)];
  if (!space || !controlOptions.some(([id]) => id === control)) return;
  space.control = control;
  render();
}

function setSpaceSupremacy(spaceId, factionId) {
  const space = state.boardState.spaces[normalizeSpaceId(spaceId)];
  if (!space) return;
  space.supremacy = factions[factionId] ? factionId : "";
  render();
}

function setSpaceSupremacyToCalculated(spaceId) {
  const space = state.boardState.spaces[normalizeSpaceId(spaceId)];
  if (!space) return;
  space.supremacy = calculatedSupremacy(space).faction || "";
  render();
}

function setSpaceValue(spaceId, group, factionId, value) {
  const space = state.boardState.spaces[normalizeSpaceId(spaceId)];
  if (!space || !["influence", "units"].includes(group) || !factions[factionId]) return;
  space[group][factionId] = clampInt(value, 0, 99);
  render();
}

function setSpaceSpecialUnit(spaceId, unitId, value) {
  const space = state.boardState.spaces[normalizeSpaceId(spaceId)];
  if (!space || !specialUnitPieces[unitId]) return;
  ensureSpecialUnits(space);
  space.specialUnits[unitId] = clampInt(value, 0, 99);
  render();
}

function setSpaceMarker(spaceId, marker, value) {
  const space = state.boardState.spaces[normalizeSpaceId(spaceId)];
  if (!space || !Object.prototype.hasOwnProperty.call(space.markers, marker)) return;
  if (["kpdCadre", "nsdapCadre", "conservativeClique", "yellowLeverage", "blackLeverage"].includes(marker)) {
    space.markers[marker] = clampInt(value, 0, 9);
  } else if (marker === "assassinations") {
    space.markers.assassinations = value || "";
  } else {
    space.markers[marker] = value === true || value === "true";
  }
  render();
}

function setSpaceNotes(spaceId, value) {
  const space = state.boardState.spaces[normalizeSpaceId(spaceId)];
  if (!space) return;
  space.notes = value;
  scheduleAutoSave();
}

function setSpaceGuideTokens(spaceId, value) {
  const space = state.boardState.spaces[normalizeSpaceId(spaceId)];
  if (!space) return;
  space.guideTokens = String(value || "")
    .split(/[,|]/)
    .map(token => token.trim())
    .filter(Boolean)
    .slice(0, 24);
  scheduleAutoSave();
  render();
}

function scenarioSetupText(scenario) {
  if (!scenario) return "";
  return [
    `${scenario.title} (${scenario.years})`,
    `Source: ${scenario.source}`,
    "Special rules:",
    ...(scenario.special.length ? scenario.special.map(item => `- ${item}`) : ["- None listed."]),
    "Victory:",
    ...scenario.victory.map(item => `- ${item}`),
    "Setup:",
    ...scenario.setup.map(item => `- ${item}`)
  ].join("\n");
}

function applyScenario(scenarioId) {
  const scenario = scenarios.find(item => item.id === scenarioId);
  if (!scenario) return;
  pushHistory();
  state.scenarioId = scenario.id;
  state.year = scenario.start.year;
  state.round = scenario.start.round;
  state.momentumFaction = scenario.start.momentumFaction;
  state.turnOrder = ["coalition", "kpd", "nsdap", "radical_conservatives"];
  state.activeTurnIndex = 0;
  state.activeFaction = state.turnOrder[0];
  state.actionPage = "setup";
  state.actionSubpage = "choice";
  state.previousActionPage = "turn";
  state.sequenceStepIndex = 0;
  state.completedSequence = [];
  state.sequenceChecks = {};
  state.sequenceAnswers = {
    actionChoice: "",
    electionPlayed: "",
    suddenVictory: "",
    generalElectionOutcome: "",
    timelineFlip: ""
  };
  state.choiceDrafts = {};
  state.choiceLog = [];
  state.effectDrafts = {};
  state.effectHistory = [];
  state.actionPlan = ["", ""];
  state.selectedActionId = "";
  state.actionContext = {};
  state.botTurn = emptyBotTurn();
  const leverageDefaults = scenarioLeverageDefaults(scenario.id, scenario.start);
  const trackPieceDefaults = scenarioTrackPieceDefaults(scenario.id);
  state.boardState = {
    ...state.boardState,
    progress: scenario.start.progress,
    reaction: scenario.start.reaction,
    economy: scenario.start.economy,
    unity: scenario.start.unity,
    generalStrikeActive: false,
    yellowProgressLeverage: leverageDefaults.yellowProgressLeverage,
    blackReactionLeverage: leverageDefaults.blackReactionLeverage,
    yellowEconomyLeverage: "none",
    blackEconomyLeverage: "none",
    economicLeverageBoxes: leverageDefaults.economicLeverageBoxes,
    trackPieces: trackPieceDefaults,
    usDeals: scenario.start.usDeals,
    ussrDeals: scenario.start.ussrDeals,
    kpdStance: scenario.start.kpdStance,
    nsdapStance: scenario.start.nsdapStance,
    reactionLimitIgnored: scenario.start.reactionLimitIgnored,
    middleClassPawns: scenarioMiddleClassPawnDefaults(scenario.id),
    selectedSpace: scenario.id === "black_sun_1928" ? "koeln" : "berlin",
    spaces: defaultSpacesForScenario(scenario.id),
    scenarioSetup: scenarioSetupText(scenario),
    notes: state.boardState.notes || ""
  };
  render();
}

function setActionPage(page) {
  if (!["setup", "turn", "board"].includes(page)) return;
  if (state.actionPage !== page) pushHistory();
  if (page === "board") state.previousActionPage = state.actionPage === "board" ? "turn" : state.actionPage;
  state.actionPage = page;
  render();
}

function saveTurnSetup() {
  pushHistory();
  state.activeTurnIndex = 0;
  state.activeFaction = state.turnOrder[0] || "coalition";
  resetCurrentFactionPrompts();
  state.actionPage = "turn";
  state.actionSubpage = isActiveBot() ? "bot_summary" : "choice";
  render();
}

function saveBoardStatePage() {
  pushHistory();
  state.actionPage = state.previousActionPage || "turn";
  state.screen = state.boardReturnScreen || "sequence";
  state.boardReturnScreen = "sequence";
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
  if (state.sequenceAnswers[key] !== value) pushHistory();
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
  pushHistory();
  state.actionPlan[index] = actionId;
  state.selectedActionId = actionId || state.selectedActionId;
  const context = currentChoiceContext();
  delete state.effectDrafts[context.key];
  delete state.choiceDrafts[context.key];
  render();
}

function clearActionSlot(slot) {
  const index = Number(slot);
  if (![0, 1].includes(index)) return;
  pushHistory();
  state.actionPlan[index] = "";
  state.selectedActionId = defaultActionId();
  render();
}

function setController(factionId, controller) {
  if (!factions[factionId]) return;
  if (state.controllers[factionId] !== controller) pushHistory();
  state.controllers[factionId] = controller === "bot" ? "bot" : "human";
  state.actionPlan = ["", ""];
  state.selectedActionId = "";
  state.botTurn = emptyBotTurn();
  render();
}

function updateBotTurn(key, value) {
  if (!["card", "summary", "factionOrder", "impulse", "specialDie", "action"].includes(key)) return;
  if (key === "summary" && state.botTurn.summary !== value) pushHistory();
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
    const firstAction = firstAvailableBotActionFrom(0);
    const nextStart = Math.max(0, priorityIndexForAction(firstAction) + 1);
    state.botTurn.actions = [firstAction, value === "event_two_actions" ? firstAvailableBotActionFrom(nextStart) : ""];
    state.botTurn.specialDice = ["", ""];
    state.botTurn.action = firstAction;
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
  pushHistory();
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
          state.screen = "action_resolve";
          render();
          return;
        }
      } else if (advanceHumanActionSubpage()) {
        state.screen = "action_resolve";
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
      state.screen = "sequence";
      render();
      return;
    }
    setSequencePhase("sudden_victory");
    state.actionPage = "setup";
    state.screen = "sequence";
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
      state.screen = "sequence";
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
      state.newYearOrder = { card: "", order: [] };
      setSequencePhase("new_year");
      state.sequenceAnswers.timelineFlip = "";
      state.screen = "sequence";
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
    state.screen = "sequence";
    render();
    return;
  }

  if (phase.id === "new_era") {
    resetSequenceForNextAction();
    state.screen = "sequence";
    render();
  }
}

function jumpToSequencePhase(phaseId) {
  pushHistory();
  setSequencePhase(phaseId);
  render();
}

function advanceRound() {
  pushHistory();
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
  pushHistory();
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
  payload.navStack = [];
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
  state.navStack = [];
  state.screen = "solo_setup";
  state.scenarioId = "";
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
  state.choiceDrafts = {};
  state.choiceLog = [];
  state.effectDrafts = {};
  state.effectHistory = [];
  state.actionPlan = ["", ""];
  state.selectedActionId = "";
  state.actionContext = {};
  state.newYearOrder = { card: "", order: [] };
  state.soloSetupComplete = false;
  state.boardReturnScreen = "sequence";
  state.boardNotice = "";
  state.boardState = {
    progress: 0,
    reaction: 0,
    economy: "stable",
    unity: "sound",
    generalStrikeActive: false,
    yellowProgressLeverage: "unknown",
    blackReactionLeverage: "unknown",
    yellowEconomyLeverage: "none",
    blackEconomyLeverage: "none",
    economicLeverageBoxes: blankEconomicLeverageBoxes(),
    trackPieces: blankTrackPieces(),
    usDeals: 1,
    ussrDeals: 1,
    kpdStance: "left_revolutionary",
    nsdapStance: "revolutionary",
    reactionLimitIgnored: false,
    middleClassPawns: blankMiddleClassPawns(),
    selectedSpace: "berlin",
    spaces: defaultSpacesForScenario(),
    scenarioSetup: "",
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
  try {
    localStorage.removeItem(LOCAL_SAVE_KEY);
  } catch (error) {
    // Ignore storage failures on reset.
  }
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

function unitPieceOptionsHtml(selectedId) {
  const options = [
    ...Object.entries(specialUnitPieces).map(([id, unit]) => [id, unit.label]),
    ...factionIds.map(id => [id, unitPieces[id].label])
  ];
  return selectOptionsHtml(options, selectedId);
}

function unitPieceLabel(pieceId) {
  if (specialUnitPieces[pieceId]) return specialUnitPieces[pieceId].label;
  if (unitPieces[pieceId]) return unitPieces[pieceId].label;
  return pieceId;
}

function ensureSpecialUnits(space) {
  if (!space.specialUnits || typeof space.specialUnits !== "object") space.specialUnits = { reichswehr: 0 };
  Object.keys(specialUnitPieces).forEach(id => {
    if (!Number.isFinite(Number(space.specialUnits[id]))) space.specialUnits[id] = 0;
  });
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

function scenarioPickerHtml() {
  const selected = currentScenario();
  const scenarioButtons = `<div class="source-grid">
    ${scenarios.map(scenario => `<button class="source-card ${state.scenarioId === scenario.id ? "selected" : ""}" onclick="applyScenario('${scenario.id}')">
      <div class="row">
        <div>
          <div class="source-title">${esc(scenario.title)}</div>
          <div class="muted">${esc(scenario.years)} | ${scenario.rounds} rounds | ${esc(scenario.length)}</div>
        </div>
        ${badge(scenario.source.replace("Playbook ", ""), state.scenarioId === scenario.id ? "good" : "")}
      </div>
    </button>`).join("")}
  </div>`;
  if (selected) {
    return `<div class="scenario-picker">
      <div class="section-head">
        <div>
          <div class="kicker">Scenario</div>
          <h2>${esc(selected.title)}</h2>
          <p class="muted">${esc(selected.years)} | ${selected.rounds} rounds | ${esc(selected.length)} | ${esc(selected.source)}</p>
        </div>
        ${badge("Auto-saved", "good")}
      </div>
      <details class="compact-details">
        <summary>Scenario setup and restrictions</summary>
        <div class="walk-block">
          <div class="field-label">Special rules</div>
          ${listHtml(selected.special.length ? selected.special : ["None listed."])}
        </div>
        <div class="walk-block">
          <div class="field-label">Victory conditions</div>
          ${listHtml(selected.victory)}
        </div>
        <div class="walk-block">
          <div class="field-label">Setup checklist</div>
          ${listHtml(selected.setup)}
        </div>
      </details>
      <details class="compact-details">
        <summary>Change scenario</summary>
        <div class="walk-block">${scenarioButtons}</div>
      </details>
    </div>`;
  }
  return `<div class="scenario-picker">
    <div class="section-head">
      <div>
        <div class="kicker">Scenario</div>
        <h2>Choose a starting setup</h2>
        <p class="muted">Apply a Playbook scenario to set the starting year, tracks, stance rules, and setup checklist.</p>
      </div>
      ${badge("Playbook", "warn")}
    </div>
    ${scenarioButtons}
  </div>`;
}

function turnSetupControlsHtml() {
  return `<div class="runner-page">
    ${scenarioPickerHtml()}
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

function selectOptionsHtml(options, selected) {
  return options.map(([value, label]) => `<option value="${value}" ${selected === value ? "selected" : ""}>${esc(label)}</option>`).join("");
}

function spaceOptionsHtml(selected) {
  return mapSpaces.map(space => `<option value="${space.id}" ${selected === space.id ? "selected" : ""}>${esc(space.label)}</option>`).join("");
}

function numberInputHtml(value, onchange, min = 0, max = 99) {
  return `<input class="text-input compact-input number-input" type="number" min="${min}" max="${max}" value="${esc(value)}" onchange="${onchange}">`;
}

function placementGuidanceForAction(actionId) {
  const commonInfluence = [
    "Check the target space Population before placing Influence.",
    "Do not place and remove Influence in the same space during the same Action Step.",
    "Assassinations markers can block Influence placement by marker side."
  ];
  if (actionId === "place_influence") {
    const byFaction = {
      coalition: "Coalition placement starts from Berlin, adjacent to Berlin, or Coalition Presence/adjacency.",
      kpd: "KPD placement starts from Berlin/adjacency, KPD Presence/adjacency, or a KPD Cadre.",
      nsdap: "NSDAP placement starts from Muenchen/Bayern, NSDAP Presence/adjacency, an NSDAP Cadre, or RC Dominance.",
      radical_conservatives: "RC placement starts from Berlin/adjacency or Conservative Clique range using RC Middle Class Sympathies, minimum range 1."
    };
    return [byFaction[state.activeFaction] || "Check the active faction placement source.", ...commonInfluence];
  }
  if (actionId === "remove_influence") {
    return ["Do not remove a faction that has Supremacy in the target space.", "Respect same-turn place/remove limits.", "Use the map-space view to confirm current Presence, Supremacy, Population, and Political Value."];
  }
  if (actionId === "move_mcs") {
    return ["Progress/Reaction Middle Class Sympathies are shared by both sides.", "Moving or removing one from the shared row makes it unavailable to the other side.", "Pawns may live on faction mats, the shared Progress/Reaction track, or the Economy track."];
  }
  if (actionId === "place_reform") {
    return ["Target needs Coalition Parliamentary Control.", "Do not place where Strike, Uprising, black Leverage, Assassinations, or Reform is already present.", "Coalition Unity must be Sound or Strong."];
  }
  if (actionId === "place_cadre") {
    return ["Cadres need matching faction Dominance or Parliamentary Control.", "A space cannot already contain any Cadre.", "KPD and NSDAP Cadres are separate marker types."];
  }
  if (actionId === "place_clique") {
    return ["Conservative Cliques need RC Dominance.", "Do not place into a brown/black Assassinations space.", "Conservative Clique markers are not Rogue Freikorps units."];
  }
  if (actionId === "place_unit" || actionId === "move_units") {
    return ["Check whether the action places, moves, or removes actual units, not cadres or cliques.", "Coalition Reichswehr SV 3; Freikorps SV 2; KPD Militia and NSDAP SA SV 1.", "Movement is usually adjacent, with Strike/Uprising and General Strike restrictions."];
  }
  if (actionId === "place_leverage_map") {
    return ["Map Leverage requires matching faction Presence in the target space.", "Coalition yellow Leverage clears Strike and/or KPD Cadre there.", "RC black Leverage clears Assassinations or NSDAP Cadre there."];
  }
  if (actionId === "place_leverage_track" || actionId === "coalition_economic_leverage" || actionId === "rc_economic_leverage") {
    return ["Track Leverage is placed on the Progress, Reaction, U.S. Deals, U.S.S.R. Deals, or Economy track as allowed by the action.", "Economic Leverage can affect which Economy side is blocked or cleared.", "Use the Scenario track pieces section to reconcile exact setup boxes."];
  }
  if (actionId === "place_assassinations") {
    return ["Target must have a vulnerable enemy Presence allowed by the action.", "Do not place where an Assassinations marker is already present.", "The marker side determines which factions are blocked later."];
  }
  if (actionId === "place_strike") {
    return ["Target needs KPD Dominance and/or KPD Parliamentary Control.", "Do not place into a space that already has Strike or Uprising.", "Three total Strikes plus Uprisings can trigger General Strike cleanup."];
  }
  return globalActionLimits.slice(0, 3);
}

function placementGuidanceHtml() {
  const actionId = currentResolutionActionId();
  const items = placementGuidanceForAction(actionId);
  if (!items.length) return "";
  return `<div class="info-band"><strong>Placement reminders:</strong>${listHtml(items)}</div>`;
}

function choiceTrackerHtml() {
  const context = currentChoiceContext();
  const draft = currentEffectDraft();
  const actionText = context.actionLabel || "Current step";
  const resolvedActionId = currentResolutionActionId();
  const resolvedActionText = isActiveBot() && currentBotAction() === "special" && resolvedActionId && resolvedActionId !== "special"
    ? ` | Board effect default: ${boardEffectActionLabel(resolvedActionId)}`
    : "";
  const notice = state.boardNotice ? `<div class="toast-note">${esc(state.boardNotice)}</div>` : "";
  return `<section class="board-effect-panel">
    <div class="section-head">
      <div>
        <div class="field-label">Board monitor</div>
        <h3>Apply board effect</h3>
        <p class="muted">${esc(context.controller)} ${esc(context.kind)} | ${esc(actionText)}${esc(resolvedActionText)}</p>
      </div>
      ${badge("Autosaves", "good")}
    </div>
    <div class="segmented mode-tabs">
      ${effectModes.map(([id, label]) => `<button class="${draft.mode === id ? "selected" : ""}" onclick="updateEffectDraft('mode', '${id}')">${esc(label)}</button>`).join("")}
    </div>
    ${placementGuidanceHtml()}
    ${effectFieldsHtml(draft)}
    ${effectLegalityHintHtml(draft)}
    ${notice}
    <div class="sequence-actions">
      ${btn("Apply to board state", "applyBoardEffect()", "primary")}
    </div>
  </section>`;
}

function effectFieldsHtml(draft) {
  const spacePicker = `<div>
    <div class="context-label">Location</div>
    <select class="select-input" onchange="updateEffectDraft('space', this.value)">${spaceOptionsHtml(draft.space)}</select>
  </div>`;

  if (draft.mode === "influence" || draft.mode === "unit") {
    const isUnit = draft.mode === "unit";
    return `<div class="choice-grid">
      ${spacePicker}
      <div>
        <div class="context-label">${isUnit ? "Piece" : "Faction"}</div>
        <select class="select-input" onchange="updateEffectDraft('faction', this.value)">${isUnit ? unitPieceOptionsHtml(draft.faction) : factionOptionsHtml(draft.faction)}</select>
      </div>
      <div>
        <div class="context-label">${isUnit ? "Unit" : "Influence"} change</div>
        <select class="select-input" onchange="updateEffectDraft('operation', this.value)">
          <option value="add" ${draft.operation === "add" ? "selected" : ""}>Add</option>
          <option value="remove" ${draft.operation === "remove" ? "selected" : ""}>Remove</option>
          <option value="set" ${draft.operation === "set" ? "selected" : ""}>Set to</option>
        </select>
      </div>
      <div>
        <div class="context-label">Amount</div>
        ${numberInputHtml(draft.amount, "updateEffectDraft('amount', this.value)", 0, 99)}
      </div>
    </div>`;
  }

  if (draft.mode === "control") {
    return `<div class="choice-grid">
      ${spacePicker}
      <div>
        <div class="context-label">Parliamentary Control</div>
        <select class="select-input" onchange="updateEffectDraft('control', this.value)">${selectOptionsHtml(controlOptions, draft.control)}</select>
      </div>
    </div>`;
  }

  if (draft.mode === "marker") {
    const numericMarker = ["kpdCadre", "nsdapCadre", "conservativeClique", "yellowLeverage", "blackLeverage"].includes(draft.marker);
    const assassinationMarker = draft.marker === "assassinations";
    return `<div class="choice-grid">
      ${spacePicker}
      <div>
        <div class="context-label">Marker</div>
        <select class="select-input" onchange="updateEffectDraft('marker', this.value)">${selectOptionsHtml(markerOptions, draft.marker)}</select>
      </div>
      <div>
        <div class="context-label">Change</div>
        <select class="select-input" onchange="updateEffectDraft('markerOperation', this.value)">
          <option value="set" ${draft.markerOperation === "set" ? "selected" : ""}>Place / set</option>
          ${numericMarker ? `<option value="add" ${draft.markerOperation === "add" ? "selected" : ""}>Add</option><option value="remove" ${draft.markerOperation === "remove" ? "selected" : ""}>Remove</option>` : ""}
          <option value="clear" ${draft.markerOperation === "clear" ? "selected" : ""}>Clear</option>
        </select>
      </div>
      ${numericMarker ? `<div>
        <div class="context-label">Amount</div>
        ${numberInputHtml(draft.amount, "updateEffectDraft('amount', this.value)", 0, 9)}
      </div>` : assassinationMarker ? `<div>
        <div class="context-label">Assassinations side</div>
        <select class="select-input" onchange="updateEffectDraft('markerValue', this.value)">
          <option value="yellow_red" ${draft.markerValue === "yellow_red" ? "selected" : ""}>Yellow / red</option>
          <option value="brown_black" ${draft.markerValue === "brown_black" ? "selected" : ""}>Brown / black</option>
        </select>
      </div>` : `<div>
        <div class="context-label">State</div>
        <div class="small-note">${draft.markerOperation === "clear" ? "Marker will be removed." : "Marker will be present after applying."}</div>
      </div>`}
    </div>`;
  }

  if (draft.mode === "mcs") {
    return `<div class="choice-grid">
      <div>
        <div class="context-label">From</div>
        <select class="select-input" onchange="updateEffectDraft('mcsSource', this.value)">${selectOptionsHtml(mcsLocationOptions(), draft.mcsSource)}</select>
      </div>
      <div>
        <div class="context-label">To</div>
        <select class="select-input" onchange="updateEffectDraft('mcsDestination', this.value)">${selectOptionsHtml(mcsLocationOptions(), draft.mcsDestination)}</select>
      </div>
      <div>
        <div class="context-label">Pawns</div>
        ${numberInputHtml(draft.amount, "updateEffectDraft('amount', this.value)", 0, 20)}
      </div>
      <div>
        <div class="context-label">Current source</div>
        <div class="small-note">${getMiddleClassLocationCount(draft.mcsSource)} at ${esc(mcsLocationLabel(draft.mcsSource))}</div>
      </div>
    </div>`;
  }

  if (draft.mode === "track") {
    return `<div class="choice-grid">
      <div>
        <div class="context-label">Track</div>
        <select class="select-input" onchange="updateEffectDraft('track', this.value)">${selectOptionsHtml(boardTrackOptions, draft.track)}</select>
      </div>
      ${trackEffectInputHtml(draft)}
    </div>`;
  }

  return `<div class="choice-grid">
    ${spacePicker}
    <div>
      <div class="context-label">Board note</div>
      <input class="text-input compact-input" value="${esc(draft.notes)}" oninput="updateEffectDraft('notes', this.value)" placeholder="Short note for this location">
    </div>
  </div>`;
}

function trackEffectInputHtml(draft) {
  if (draft.track === "progress" || draft.track === "reaction" || draft.track === "usDeals" || draft.track === "ussrDeals") {
    const max = draft.track === "usDeals" || draft.track === "ussrDeals" ? 5 : 6;
    return `<div>
      <div class="context-label">Change</div>
      <select class="select-input" onchange="updateEffectDraft('operation', this.value)">
        <option value="add" ${draft.operation === "add" ? "selected" : ""}>Advance / add</option>
        <option value="remove" ${draft.operation === "remove" ? "selected" : ""}>Move back / remove</option>
        <option value="set" ${draft.operation === "set" ? "selected" : ""}>Set to</option>
      </select>
    </div>
    <div>
      <div class="context-label">Amount / value</div>
      ${numberInputHtml(draft.amount, "updateEffectDraft('amount', this.value)", 0, max)}
    </div>`;
  }
  if (draft.track === "economy") {
    return `<div>
      <div class="context-label">Economy box</div>
      <select class="select-input" onchange="updateEffectDraft('trackValue', this.value)">${selectOptionsHtml(economyOptions, draft.trackValue || state.boardState.economy)}</select>
    </div>`;
  }
  if (draft.track === "yellowEconomyLeverage" || draft.track === "blackEconomyLeverage") {
    return `<div>
      <div class="context-label">Economy side</div>
      <select class="select-input" onchange="updateEffectDraft('trackValue', this.value)">${selectOptionsHtml(economyLeverageOptions, draft.trackValue || state.boardState[draft.track])}</select>
    </div>
    <div>
      <div class="context-label">Change</div>
      <select class="select-input" onchange="updateEffectDraft('operation', this.value)">
        <option value="set" ${draft.operation === "set" ? "selected" : ""}>Place / set</option>
        <option value="remove" ${draft.operation === "remove" ? "selected" : ""}>Remove all</option>
      </select>
    </div>`;
  }
  if (draft.track === "unity") {
    const unityOptions = [["fragile", "Fragile"], ["shaky", "Shaky"], ["sound", "Sound"], ["strong", "Strong"]];
    return `<div>
      <div class="context-label">Change</div>
      <select class="select-input" onchange="updateEffectDraft('operation', this.value)">
        <option value="add" ${draft.operation === "add" ? "selected" : ""}>Increase one box</option>
        <option value="remove" ${draft.operation === "remove" ? "selected" : ""}>Decrease one box</option>
        <option value="set" ${draft.operation === "set" ? "selected" : ""}>Set to</option>
      </select>
    </div>
    <div>
      <div class="context-label">Unity box</div>
      <select class="select-input" onchange="updateEffectDraft('trackValue', this.value)">${selectOptionsHtml(unityOptions, draft.trackValue || state.boardState.unity)}</select>
    </div>`;
  }
  if (draft.track === "kpdStance" || draft.track === "nsdapStance") {
    return `<div>
      <div class="context-label">Stance box</div>
      <select class="select-input" onchange="updateEffectDraft('trackValue', this.value)">${selectOptionsHtml(stanceOptions, draft.trackValue || state.boardState[draft.track])}</select>
    </div>`;
  }
  if (draft.track === "generalStrikeActive") {
    return `<div>
      <div class="context-label">General Strike</div>
      <select class="select-input" onchange="updateEffectDraft('trackValue', this.value)">
        <option value="true" ${String(draft.trackValue || state.boardState.generalStrikeActive) === "true" ? "selected" : ""}>Active</option>
        <option value="false" ${String(draft.trackValue || state.boardState.generalStrikeActive) === "false" ? "selected" : ""}>Not active</option>
      </select>
    </div>`;
  }
  if (draft.track === "reactionLimitIgnored") {
    return `<div>
      <div class="context-label">Reaction cap</div>
      <select class="select-input" onchange="updateEffectDraft('trackValue', this.value)">
        <option value="false" ${String(draft.trackValue || state.boardState.reactionLimitIgnored) === "false" ? "selected" : ""}>Normal</option>
        <option value="true" ${String(draft.trackValue || state.boardState.reactionLimitIgnored) === "true" ? "selected" : ""}>Ignored</option>
      </select>
    </div>`;
  }
  const leverageOptions = [["unknown", "Unknown"], ["above", "Yes, above"], ["none", "No"]];
  return `<div>
    <div class="context-label">Leverage relation</div>
    <select class="select-input" onchange="updateEffectDraft('trackValue', this.value)">${selectOptionsHtml(leverageOptions, draft.trackValue || state.boardState[draft.track])}</select>
  </div>`;
}

function effectLegalityHintHtml(draft) {
  if (draft.mode !== "influence") return "";
  const space = state.boardState.spaces[normalizeSpaceId(draft.space)];
  if (!space) return "";
  const current = Number(space.influence[draft.faction] || 0);
  const nextFaction = applyNumberOperation(current, draft.operation, draft.amount);
  const currentTotal = factionIds.reduce((sum, id) => sum + Number(space.influence[id] || 0), 0);
  const projectedTotal = currentTotal - current + nextFaction;
  const pvText = Number(space.politicalValue || 0) ? ` Political Value ${space.politicalValue}.` : " Political Value is blank.";
  if (!space.population) return `<div class="small-note">Population is blank for ${esc(spaceLabel(space.id))}; set it in Board State to let the app flag Influence over-cap.${pvText}</div>`;
  if (projectedTotal > space.population) return `<div class="warn-box"><strong>Check legality:</strong> projected Influence ${projectedTotal} exceeds Population ${space.population} in ${esc(spaceLabel(space.id))}.</div>`;
  return `<div class="small-note">Projected Influence ${projectedTotal} / Population ${space.population} in ${esc(spaceLabel(space.id))}.${pvText}</div>`;
}

function choiceLogHtml(limit = 6) {
  const entries = state.choiceLog.slice(0, limit);
  if (!entries.length) return `<div class="small-note">No in-game choices recorded yet.</div>`;
  return `<div class="choice-log">
    ${entries.map(entry => `<article class="choice-entry">
      <div class="row">
        <div>
          <div class="choice-title">${esc(entry.year)} ${esc(entry.half)} | ${esc(entry.factionLabel)} | ${esc(entry.controller)} ${esc(entry.phase)}</div>
          <div class="muted">${esc(entry.action || "Current step")}</div>
        </div>
        <button class="mini-btn" onclick="deleteChoiceLogEntry('${esc(entry.id)}')">Delete</button>
      </div>
      ${entry.choice ? `<p><strong>Choice:</strong> ${esc(entry.choice)}</p>` : ""}
      ${entry.target ? `<p><strong>Target:</strong> ${esc(entry.target)}</p>` : ""}
      ${entry.result ? `<p><strong>Result:</strong> ${esc(entry.result)}</p>` : ""}
      ${entry.notes ? `<p><strong>Notes:</strong> ${esc(entry.notes)}</p>` : ""}
    </article>`).join("")}
  </div>`;
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
  const spaces = Object.values(board.spaces || {});
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
  if (key === "reaction_can_advance") return board.reactionLimitIgnored || board.reaction <= board.progress;
  if (key === "kpd_stance_in_play") return board.kpdStance !== "not_in_play";
  if (key === "nsdap_stance_in_play") return board.nsdapStance !== "not_in_play";
  if (key === "coalition_mcs_available") return getMiddleClassLocationCount("mat:coalition") > 0 || state.actionContext[key];
  if (key === "strike_available") return spaces.some(space => space.markers?.strike);
  if (key === "kpd_cadre_available") return spaces.some(space => Number(space.markers?.kpdCadre) > 0) || state.actionContext[key];
  if (key === "nsdap_cadre_available") return spaces.some(space => Number(space.markers?.nsdapCadre) > 0) || state.actionContext[key];
  if (key === "conservative_clique_available") return spaces.some(space => Number(space.markers?.conservativeClique) > 0) || state.actionContext[key];
  if (key === "assassination_available") return spaces.some(space => space.markers?.assassinations) || state.actionContext[key];
  if (key === "leverage_available") return spaces.some(space => space.markers?.yellowLeverage || space.markers?.blackLeverage) || state.actionContext[key];
  if (key === "unit_available") return spaces.some(spaceHasUnits) || state.actionContext[key];
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

function markerSummaryHtml(space) {
  const markers = [];
  if (space.supremacy) markers.push(`${factions[space.supremacy]?.short || space.supremacy} Supremacy`);
  if (space.markers.strike) markers.push("Strike");
  if (space.markers.uprising) markers.push("Uprising");
  if (space.markers.reform) markers.push("Reform");
  if (space.markers.kpdCadre) markers.push(`KPD Cadre ${space.markers.kpdCadre}`);
  if (space.markers.nsdapCadre) markers.push(`NSDAP Cadre ${space.markers.nsdapCadre}`);
  if (space.markers.conservativeClique) markers.push(`Conservative Clique ${space.markers.conservativeClique}`);
  if (space.markers.yellowLeverage) markers.push(`Yellow Leverage ${space.markers.yellowLeverage}`);
  if (space.markers.blackLeverage) markers.push(`Black Leverage ${space.markers.blackLeverage}`);
  if (space.markers.assassinations) markers.push(space.markers.assassinations === "brown_black" ? "Brown/black Assassinations" : "Yellow/red Assassinations");
  for (const token of space.guideTokens || []) markers.push(token);
  return markers.length ? markers.map(item => `<span>${esc(item)}</span>`).join("") : `<span>Clear</span>`;
}

function spaceInfluenceTotal(space) {
  return factionIds.reduce((sum, id) => sum + Number(space.influence?.[id] || 0), 0);
}

function spaceValidity(space) {
  const totalInfluence = spaceInfluenceTotal(space);
  const population = Number(space.population || 0);
  const politicalValue = Number(space.politicalValue || 0);
  const issues = [];
  if (!population) issues.push("Missing Population Number.");
  if (!politicalValue) issues.push("Missing Political Value.");
  if (population && totalInfluence > population) issues.push(`Influence ${totalInfluence} exceeds Population ${population}.`);
  return { ok: issues.length === 0, issues, totalInfluence, population, politicalValue };
}

function factionUnitSv(space, factionId) {
  const mapUnits = Number(space.units?.[factionId] || 0) * Number(unitPieces[factionId]?.strength || 0);
  const specialUnits = Object.entries(specialUnitPieces).reduce((sum, [unitId, unit]) => {
    if (unit.faction !== factionId) return sum;
    return sum + Number(space.specialUnits?.[unitId] || 0) * Number(unit.strength || 0);
  }, 0);
  return mapUnits + specialUnits;
}

function unitSvBreakdown(space, factionId) {
  const parts = [];
  const mapCount = Number(space.units?.[factionId] || 0);
  if (mapCount) parts.push(`${unitPieces[factionId].label} ${mapCount}x${unitPieces[factionId].strength}`);
  Object.entries(specialUnitPieces).forEach(([unitId, unit]) => {
    if (unit.faction !== factionId) return;
    const count = Number(space.specialUnits?.[unitId] || 0);
    if (count) parts.push(`${unit.label} ${count}x${unit.strength}`);
  });
  return parts.join(" + ");
}

function calculatedSupremacy(space) {
  const scores = Object.fromEntries(factionIds.map(id => [id, factionUnitSv(space, id)]));
  const max = Math.max(...Object.values(scores));
  if (max <= 0) return { faction: "", max: 0, tied: false, leaders: [], scores };
  const leaders = factionIds.filter(id => scores[id] === max);
  return { faction: leaders.length === 1 ? leaders[0] : "", max, tied: leaders.length > 1, leaders, scores };
}

function unitSvSummaryHtml(space) {
  const calc = calculatedSupremacy(space);
  const scoreText = factionIds.map(id => {
    const breakdown = unitSvBreakdown(space, id);
    const detail = breakdown ? ` (${breakdown})` : "";
    return `${factions[id].short} ${calc.scores[id]}${detail}`;
  }).join(" | ");
  let result = "Calculated Supremacy: none";
  if (calc.faction) result = `Calculated Supremacy: ${factions[calc.faction].short} by unit SV ${calc.max}`;
  if (calc.tied) result = `Calculated Supremacy: tied at unit SV ${calc.max} (${calc.leaders.map(id => factions[id].short).join(", ")})`;
  return `<div class="small-note">${esc(result)}. Unit SV: ${esc(scoreText)}.</div>`;
}

function calculatedSupremacyLabel(space) {
  const calc = calculatedSupremacy(space);
  if (calc.faction) return `${factions[calc.faction].short} by SV ${calc.max}`;
  if (calc.tied) return `Tied at SV ${calc.max}`;
  return "None by SV";
}

function spaceValidityHtml(space) {
  const validity = spaceValidity(space);
  if (validity.ok) {
    return `<div class="small-note">Valid: Influence ${validity.totalInfluence} / Population ${validity.population}; Political Value ${validity.politicalValue}.</div>${unitSvSummaryHtml(space)}`;
  }
  return `<div class="warn-box"><strong>Board-state check:</strong> ${esc(spaceLabel(space.id))} ${esc(validity.issues.join(" "))}</div>${unitSvSummaryHtml(space)}`;
}

function boardValiditySummaryHtml() {
  const spaces = Object.values(state.boardState.spaces || {});
  const invalid = spaces.filter(space => !spaceValidity(space).ok);
  if (!invalid.length) {
    return `<div class="toast-note">Board-state values valid: every map space has Population, Political Value, and Influence within Population.</div>`;
  }
  return `<div class="warn-box">
    <strong>Board-state checks need attention:</strong>
    ${listHtml(invalid.slice(0, 8).map(space => `${spaceLabel(space.id)}: ${spaceValidity(space).issues.join(" ")}`))}
    ${invalid.length > 8 ? `<div class="small-note">${invalid.length - 8} more spaces need review.</div>` : ""}
  </div>`;
}

function displayAuditValue(value) {
  if (typeof value === "boolean") return value ? "on" : "off";
  if (value === "" || value === undefined || value === null) return "none";
  return String(value);
}

function markerAuditLabel(marker) {
  return markerOptions.find(([id]) => id === marker)?.[1] || marker;
}

function pushCountMapDrift(items, label, current, expected) {
  const currentLabel = countMapLabel(current);
  const expectedLabel = countMapLabel(expected);
  if (currentLabel !== expectedLabel) items.push(`${label}: current ${currentLabel}, setup ${expectedLabel}`);
}

function scenarioTrackAuditItems(scenario) {
  if (!scenario) return [];
  const board = state.boardState;
  const leverageDefaults = scenarioLeverageDefaults(scenario.id, scenario.start);
  const trackDefaults = scenarioTrackPieceDefaults(scenario.id);
  const currentPieces = normalizeTrackPieces(board.trackPieces);
  const expectedPawns = scenarioMiddleClassPawnDefaults(scenario.id);
  const currentPawns = normalizeMiddleClassPawns(board.middleClassPawns);
  const fields = [
    ["year", "Year", state.year, scenario.start.year],
    ["round", "Half-year", state.round, scenario.start.round],
    ["momentumFaction", "Momentum", state.momentumFaction, scenario.start.momentumFaction],
    ["progress", "Progress", board.progress, scenario.start.progress],
    ["reaction", "Reaction", board.reaction, scenario.start.reaction],
    ["economy", "Economy", board.economy, scenario.start.economy],
    ["unity", "Coalition Unity", board.unity, scenario.start.unity],
    ["usDeals", "U.S. Deals", board.usDeals, scenario.start.usDeals],
    ["ussrDeals", "U.S.S.R. Deals", board.ussrDeals, scenario.start.ussrDeals],
    ["kpdStance", "KPD Stance", board.kpdStance, scenario.start.kpdStance],
    ["nsdapStance", "NSDAP Stance", board.nsdapStance, scenario.start.nsdapStance],
    ["reactionLimitIgnored", "Reaction cap", board.reactionLimitIgnored, scenario.start.reactionLimitIgnored],
    ["yellowProgressLeverage", "Yellow above Progress", board.yellowProgressLeverage, leverageDefaults.yellowProgressLeverage],
    ["blackReactionLeverage", "Black above Reaction", board.blackReactionLeverage, leverageDefaults.blackReactionLeverage],
    ["usDealsYellowLeverage", "U.S. Deals yellow Leverage", boxListLabel(board.economicLeverageBoxes?.usDeals?.yellow), boxListLabel(leverageDefaults.economicLeverageBoxes.usDeals.yellow)],
    ["usDealsBlackLeverage", "U.S. Deals black Leverage", boxListLabel(board.economicLeverageBoxes?.usDeals?.black), boxListLabel(leverageDefaults.economicLeverageBoxes.usDeals.black)],
    ["ussrDealsYellowLeverage", "U.S.S.R. Deals yellow Leverage", boxListLabel(board.economicLeverageBoxes?.ussrDeals?.yellow), boxListLabel(leverageDefaults.economicLeverageBoxes.ussrDeals.yellow)],
    ["ussrDealsBlackLeverage", "U.S.S.R. Deals black Leverage", boxListLabel(board.economicLeverageBoxes?.ussrDeals?.black), boxListLabel(leverageDefaults.economicLeverageBoxes.ussrDeals.black)]
  ];
  return fields
    .filter(([, , current, expected]) => current !== expected)
    .map(([, label, current, expected]) => `${label}: current ${displayAuditValue(current)}, setup ${displayAuditValue(expected)}`)
    .concat((() => {
      const items = [];
      pushCountMapDrift(items, "Shared Progress/Reaction MCS", currentPawns.tracks.progressReaction, expectedPawns.tracks.progressReaction);
      pushCountMapDrift(items, "Economy MCS", currentPawns.tracks.economy, expectedPawns.tracks.economy);
      pushCountMapDrift(items, "Progress/Reaction yellow Leverage boxes", currentPieces.progressReaction.yellowLeverage, trackDefaults.progressReaction.yellowLeverage);
      pushCountMapDrift(items, "Progress/Reaction black Leverage boxes", currentPieces.progressReaction.blackLeverage, trackDefaults.progressReaction.blackLeverage);
      pushCountMapDrift(items, "Progress/Reaction Reforms", currentPieces.progressReaction.reforms, trackDefaults.progressReaction.reforms);
      pushCountMapDrift(items, "Progress/Reaction Assassinations", currentPieces.progressReaction.assassinations, trackDefaults.progressReaction.assassinations);
      pushCountMapDrift(items, "Progress/Reaction NSDAP Cadres", currentPieces.progressReaction.nsdapCadres, trackDefaults.progressReaction.nsdapCadres);
      pushCountMapDrift(items, "Progress/Reaction Conservative Cliques", currentPieces.progressReaction.conservativeCliques, trackDefaults.progressReaction.conservativeCliques);
      pushCountMapDrift(items, "Economy Dollar Dependence", currentPieces.economy.dollarDependence, trackDefaults.economy.dollarDependence);
      pushCountMapDrift(items, "U.S. Deals Dollar Dependence", currentPieces.usDeals.dollarDependence, trackDefaults.usDeals.dollarDependence);
      pushCountMapDrift(items, "U.S.S.R. Deals Reichswehr", currentPieces.ussrDeals.reichswehr, trackDefaults.ussrDeals.reichswehr);
      pushCountMapDrift(items, "U.S.S.R. Deals KPD Cadres", currentPieces.ussrDeals.kpdCadres, trackDefaults.ussrDeals.kpdCadres);
      return items;
    })());
}

function spaceScenarioDiffs(spaceId, baselineSpaces) {
  const current = normalizeSpaceState(spaceId, state.boardState.spaces?.[spaceId] || {});
  const baseline = normalizeSpaceState(spaceId, baselineSpaces[spaceId] || {});
  const diffs = [];
  [["population", "Population"], ["politicalValue", "Political Value"], ["control", "Control"], ["supremacy", "Manual Supremacy"]].forEach(([field, label]) => {
    if (current[field] !== baseline[field]) diffs.push(`${label}: current ${displayAuditValue(current[field])}, setup ${displayAuditValue(baseline[field])}`);
  });
  factionIds.forEach(id => {
    if (current.influence[id] !== baseline.influence[id]) diffs.push(`${factions[id].short} Influence: current ${current.influence[id]}, setup ${baseline.influence[id]}`);
    if (current.units[id] !== baseline.units[id]) diffs.push(`${unitPieces[id].label}: current ${current.units[id]}, setup ${baseline.units[id]}`);
  });
  Object.entries(specialUnitPieces).forEach(([id, unit]) => {
    const currentCount = Number(current.specialUnits?.[id] || 0);
    const baselineCount = Number(baseline.specialUnits?.[id] || 0);
    if (currentCount !== baselineCount) diffs.push(`${unit.label}: current ${currentCount}, setup ${baselineCount}`);
  });
  Object.keys(current.markers).forEach(marker => {
    if (current.markers[marker] !== baseline.markers[marker]) diffs.push(`${markerAuditLabel(marker)}: current ${displayAuditValue(current.markers[marker])}, setup ${displayAuditValue(baseline.markers[marker])}`);
  });
  const currentGuideTokens = (current.guideTokens || []).join(" | ");
  const baselineGuideTokens = (baseline.guideTokens || []).join(" | ");
  if (currentGuideTokens !== baselineGuideTokens) diffs.push(`Guide tokens: current ${displayAuditValue(currentGuideTokens)}, setup ${displayAuditValue(baselineGuideTokens)}`);
  return diffs;
}

function scenarioSpaceDriftItems(scenarioId) {
  if (!scenarioId) return [];
  const baselineSpaces = defaultSpacesForScenario(scenarioId);
  return mapSpaces
    .map(space => ({ space, diffs: spaceScenarioDiffs(space.id, baselineSpaces) }))
    .filter(item => item.diffs.length > 0);
}

function supremacyAuditItems() {
  return Object.values(state.boardState.spaces || {}).map(space => {
    const calc = calculatedSupremacy(space);
    const manual = space.supremacy || "";
    let issue = "";
    if (manual && calc.faction && manual !== calc.faction) issue = `Manual ${factions[manual]?.short || manual}; calculated ${factions[calc.faction].short} by SV ${calc.max}.`;
    else if (manual && calc.tied) issue = `Manual ${factions[manual]?.short || manual}; calculated tie at SV ${calc.max} (${calc.leaders.map(id => factions[id].short).join(", ")}).`;
    else if (!manual && calc.faction) issue = `No manual Supremacy; calculated ${factions[calc.faction].short} by SV ${calc.max}.`;
    return issue ? { space, issue } : null;
  }).filter(Boolean);
}

const guideStrengthRules = [
  { re: /Coalition FK strength\s+(\d+)/i, label: "Coalition FK", expected: 2 },
  { re: /Rogue FK strength\s+(\d+)/i, label: "Rogue FK", expected: 2 },
  { re: /KPD Militia strength\s+(\d+)/i, label: "KPD Militia", expected: 1 },
  { re: /NSDAP SA strength\s+(\d+)/i, label: "NSDAP SA", expected: 1 },
  { re: /Reichswehr strength\s+(\d+)/i, label: "Reichswehr", expected: 3 }
];

function guideTokenAuditItems() {
  return Object.values(state.boardState.spaces || {}).flatMap(space => (space.guideTokens || []).map(token => {
    const rule = guideStrengthRules.find(item => item.re.test(token));
    const match = rule ? token.match(rule.re) : null;
    const found = match ? Number(match[1]) : null;
    return {
      space,
      token,
      issue: rule && found !== rule.expected ? `${rule.label} printed SV is modeled as ${rule.expected}, guide note says ${found}.` : ""
    };
  }));
}

function boardValidityAuditItems() {
  return Object.values(state.boardState.spaces || {})
    .map(space => ({ space, validity: spaceValidity(space) }))
    .filter(item => !item.validity.ok);
}

function auditRowHtml(title, body, action = "") {
  return `<article class="choice-entry">
    <div class="row">
      <div>
        <div class="choice-title">${esc(title)}</div>
        <div class="muted">${esc(body)}</div>
      </div>
      ${action}
    </div>
  </article>`;
}

function auditListHtml(items, emptyText, renderItem, limit = 12) {
  if (!items.length) return `<div class="toast-note">${esc(emptyText)}</div>`;
  return `<div class="choice-log">
    ${items.slice(0, limit).map(renderItem).join("")}
    ${items.length > limit ? `<div class="small-note">${items.length - limit} more items not shown.</div>` : ""}
  </div>`;
}

function scenarioAuditHtml() {
  const scenario = currentScenario();
  const validityItems = boardValidityAuditItems();
  const supremacyItems = supremacyAuditItems();
  const guideItems = guideTokenAuditItems();
  const guideConflicts = guideItems.filter(item => item.issue);
  const driftItems = scenario ? scenarioSpaceDriftItems(scenario.id) : [];
  const trackItems = scenario ? scenarioTrackAuditItems(scenario) : [];
  return `<div class="runner-page">
    <div class="section-head">
      <div>
        <div class="kicker">Scenario Audit</div>
        <h2>${scenario ? esc(scenario.title) : "No scenario selected"}</h2>
        <p class="muted">Check setup drift, Population/PV validity, Supremacy from unit SV, and guide notes still needing conversion.</p>
      </div>
      ${badge(`${validityItems.length + supremacyItems.length + guideConflicts.length + driftItems.length + trackItems.length} flags`, validityItems.length || supremacyItems.length || guideConflicts.length ? "warn" : "good")}
    </div>
    <div class="board-state-grid">
      <div class="context-item">
        <div class="context-label">Validity</div>
        <h3>${validityItems.length}</h3>
        <p class="small-note">Population, Political Value, and Influence cap flags.</p>
      </div>
      <div class="context-item">
        <div class="context-label">Supremacy / SV</div>
        <h3>${supremacyItems.length}</h3>
        <p class="small-note">Manual Supremacy missing or different from calculated unit SV.</p>
      </div>
      <div class="context-item">
        <div class="context-label">Guide tokens</div>
        <h3>${guideItems.length}</h3>
        <p class="small-note">${guideConflicts.length} printed-SV conflicts found.</p>
      </div>
      <div class="context-item">
        <div class="context-label">Setup drift</div>
        <h3>${driftItems.length + trackItems.length}</h3>
        <p class="small-note">Current board compared with selected scenario seed.</p>
      </div>
    </div>
    <div class="walk-block">
      <div class="field-label">Board-state validity</div>
      ${auditListHtml(validityItems, "No Population/PV/influence-cap issues.", item => auditRowHtml(spaceLabel(item.space.id), item.validity.issues.join(" "), `<button class="mini-btn" onclick="openSpaceMapView('${item.space.id}')">Open</button>`))}
    </div>
    <div class="walk-block">
      <div class="field-label">Supremacy from unit SV</div>
      ${auditListHtml(supremacyItems, "Manual Supremacy matches calculated unit SV, or no unit-SV leader exists.", item => auditRowHtml(spaceLabel(item.space.id), item.issue, `<button class="mini-btn" onclick="openSpaceMapView('${item.space.id}')">Open</button>`))}
    </div>
    <div class="walk-block">
      <div class="field-label">Guide-token conversion</div>
      ${auditListHtml(guideItems, "No guide-token placeholders remain on the current board state.", item => auditRowHtml(spaceLabel(item.space.id), item.issue || `Guide note: ${item.token}`, `<button class="mini-btn" onclick="openSpaceMapView('${item.space.id}')">Open</button>`), 16)}
    </div>
    <div class="walk-block">
      <div class="field-label">Scenario track drift</div>
      ${auditListHtml(trackItems, "Tracks match the selected scenario start.", item => auditRowHtml("Track", item))}
    </div>
    <div class="walk-block">
      <div class="field-label">Scenario map drift</div>
      ${auditListHtml(driftItems, "Current map-space state matches the selected scenario seed.", item => auditRowHtml(spaceLabel(item.space.id), item.diffs.slice(0, 5).join(" | "), `<button class="mini-btn" onclick="openSpaceMapView('${item.space.id}')">Open</button>`), 16)}
    </div>
  </div>`;
}

function visualTokenHtml(label, count, klass, title = "") {
  const parsed = clampInt(count, 0, 99);
  if (!parsed) return "";
  return `<span class="visual-token ${klass}" title="${esc(title || label)}">
    <b>${esc(label)}</b>
    ${parsed > 1 ? `<small>x${parsed}</small>` : ""}
  </span>`;
}

function unitCounterHtml(pieceId, label, count, klass, title = "") {
  const parsed = clampInt(count, 0, 99);
  if (!parsed) return "";
  const symbolMap = {
    coalition_fk: "FK",
    reichswehr: "+",
    kpd_militia: "*",
    nsdap_sa: "SA",
    rogue_fk: "FK"
  };
  const svMap = {
    coalition_fk: 2,
    reichswehr: 3,
    kpd_militia: 1,
    nsdap_sa: 1,
    rogue_fk: 2
  };
  return `<span class="unit-counter ${klass} ${pieceId}" title="${esc(title || label)}">
    <span class="counter-sv">${svMap[pieceId] || ""}</span>
    <span class="counter-symbol">${esc(symbolMap[pieceId] || label)}</span>
    <span class="counter-label">${esc(label)}</span>
    ${parsed > 1 ? `<span class="counter-count">x${parsed}</span>` : ""}
  </span>`;
}

function booleanMarkerTokenHtml(active, label, klass) {
  return active ? `<span class="visual-marker ${klass}">${esc(label)}</span>` : "";
}

function spaceInfluenceTokensHtml(space) {
  const tokens = factionIds.map(id => visualTokenHtml(factions[id].short[0], space.influence[id], `cube ${factions[id].tone}`, `${factions[id].short} Influence`)).join("");
  return tokens || `<span class="empty-token">No influence cubes</span>`;
}

function spaceHasUnits(space) {
  return factionIds.some(id => Number(space.units?.[id] || 0) > 0) || Object.keys(specialUnitPieces).some(id => Number(space.specialUnits?.[id] || 0) > 0);
}

function spaceUnitTokensHtml(space) {
  const specialTokens = Object.entries(specialUnitPieces)
    .map(([id, unit]) => unitCounterHtml(id, unit.label, space.specialUnits?.[id], factions[unit.faction].tone, unit.full))
    .join("");
  const pieceIds = {
    coalition: "coalition_fk",
    kpd: "kpd_militia",
    nsdap: "nsdap_sa",
    radical_conservatives: "rogue_fk"
  };
  const tokens = [
    specialTokens,
    ...factionIds.map(id => unitCounterHtml(pieceIds[id], unitPieces[id].label, space.units[id], factions[id].tone, unitPieces[id].full))
  ].join("");
  return tokens || `<span class="empty-token">No units</span>`;
}

function spaceMarkerTokensHtml(space) {
  const markers = [
    booleanMarkerTokenHtml(space.markers.strike, "Strike", "strike"),
    booleanMarkerTokenHtml(space.markers.uprising, "Uprising", "uprising"),
    booleanMarkerTokenHtml(space.markers.reform, "Reform", "reform"),
    visualTokenHtml("KPD Cadre", space.markers.kpdCadre, "cadre kpd", "KPD Cadres"),
    visualTokenHtml("NSDAP Cadre", space.markers.nsdapCadre, "cadre nsdap", "NSDAP Cadres"),
    visualTokenHtml("Cons. Clique", space.markers.conservativeClique, "cadre radcon", "Conservative Cliques"),
    visualTokenHtml("Yellow Leverage", space.markers.yellowLeverage, "marker yellow-leverage", "Yellow Leverage markers"),
    visualTokenHtml("Black Leverage", space.markers.blackLeverage, "marker black-leverage", "Black Leverage markers"),
    space.markers.assassinations ? `<span class="visual-marker assassinations">${space.markers.assassinations === "brown_black" ? "Brown/black" : "Yellow/red"} Assassinations</span>` : ""
  ].join("");
  return markers || `<span class="empty-token">No markers</span>`;
}

function spaceGuideTokensHtml(space) {
  const tokens = (space.guideTokens || []).map(token => `<span>${esc(token)}</span>`).join("");
  return tokens ? `<div class="map-guide-row">${tokens}</div>` : "";
}

function mapSpaceVisualHtml(space) {
  const meta = mapSpaces.find(item => item.id === space.id) || { type: "region" };
  const control = controlOptions.find(([id]) => id === space.control)?.[1] || "Uncontrolled";
  const supremacy = space.supremacy ? `${factions[space.supremacy]?.short || space.supremacy} Supremacy` : "No Supremacy";
  const calculated = `Calc: ${calculatedSupremacyLabel(space)}`;
  const population = Number(space.population || 0) ? `Pop ${space.population}` : "Pop ?";
  const politicalValue = Number(space.politicalValue || 0) ? `PV ${space.politicalValue}` : "PV ?";
  return `<article class="map-space-card control-${esc(space.control)} ${esc(meta.type)}">
    <div class="map-space-board">
      <div class="map-space-topline">
        <span>${esc(meta.type)}</span>
        <span>${esc(population)} | ${esc(politicalValue)}</span>
      </div>
      <div class="map-space-name">${esc(spaceLabel(space.id))}</div>
      <div class="map-control-band">
        <strong>${esc(control)}</strong>
        <span>${esc(supremacy)} | ${esc(calculated)}</span>
      </div>
      <div class="map-token-section influence-zone">
        <div class="map-token-label">Influence</div>
        <div class="map-token-tray">${spaceInfluenceTokensHtml(space)}</div>
      </div>
      <div class="map-token-section unit-zone">
        <div class="map-token-label">Units</div>
        <div class="map-token-tray">${spaceUnitTokensHtml(space)}</div>
      </div>
      <div class="map-token-section marker-zone">
        <div class="map-token-label">Markers</div>
        <div class="map-token-tray">${spaceMarkerTokensHtml(space)}</div>
      </div>
    </div>
    ${spaceValidityHtml(space)}
    ${spaceGuideTokensHtml(space)}
    ${space.notes ? `<div class="map-space-note">${esc(space.notes)}</div>` : ""}
  </article>`;
}

function mapSpacePickerHtml(spaceId) {
  return `<div class="choice-grid">
    <div>
      <div class="context-label">Inspect another space</div>
      <select class="select-input" onchange="openSpaceMapView(this.value, false)">${spaceOptionsHtml(spaceId)}</select>
    </div>
    <div>
      <div class="context-label">Quick edit</div>
      ${btn("Open full board editor", "editBoardStateFlow()")}
    </div>
  </div>`;
}

function pieceLegendHtml() {
  return `<details class="compact-details">
    <summary>Piece names used here</summary>
    <div class="walk-block">
      <div class="field-label">Unit buckets</div>
      <div class="pill-list">
        ${Object.values(specialUnitPieces).map(unit => `<span>${esc(unit.label)}: ${esc(unit.full)}</span>`).join("")}
        ${factionIds.map(id => `<span>${esc(unitPieces[id].label)}: ${esc(unitPieces[id].full)}</span>`).join("")}
        <span>Coalition FK and Rogue FK can be opposite sides of a physical Freikorps counter; the app tracks the visible/current side.</span>
      </div>
    </div>
    <div class="walk-block">
      <div class="field-label">Markers</div>
      <div class="pill-list">
        <span>Conservative Clique: RC marker, not a Rogue Freikorps unit</span>
        <span>Yellow Leverage: Coalition map Leverage</span>
        <span>Black Leverage: Radical Conservative map Leverage</span>
        <span>Cadres: KPD or NSDAP cadre markers</span>
        <span>Strike / Uprising / Reform / Assassinations</span>
      </div>
    </div>
  </details>`;
}

function boardSpaceSnapshotHtml(limit = 4) {
  const activeSpaces = Object.values(state.boardState.spaces || {}).filter(space => {
    const influence = factionIds.some(id => Number(space.influence[id]) > 0);
    const units = spaceHasUnits(space);
    const markers = space.markers && Object.values(space.markers).some(value => !!value);
    const guideTokens = Array.isArray(space.guideTokens) && space.guideTokens.length > 0;
    return influence || units || markers || guideTokens || space.control !== "coalition" || space.notes;
  });
  if (!activeSpaces.length) return `<div class="small-note">No space-level changes entered yet. Use Board State or Apply board effect to fill the monitor as play unfolds.</div>`;
  return `<div class="space-snapshot">
    ${activeSpaces.slice(0, limit).map(space => `<article class="space-row" onclick="openSpaceMapView('${esc(space.id)}')">
      <div>
        <strong>${esc(spaceLabel(space.id))}</strong>
        <span>${esc(controlOptions.find(([id]) => id === space.control)?.[1] || "Uncontrolled")} | Pop ${esc(space.population || "?")} | PV ${esc(space.politicalValue || "?")}</span>
      </div>
      <div class="pill-list">${factionIds.filter(id => Number(space.influence[id]) > 0).map(id => `<span>${esc(factions[id].short)} ${space.influence[id]}</span>`).join("") || "<span>No influence</span>"}</div>
      <div class="pill-list">${markerSummaryHtml(space)}</div>
    </article>`).join("")}
  </div>`;
}

function boardMonitorSummaryHtml() {
  const board = state.boardState;
  return `<div class="board-monitor-summary">
    ${boardSummaryLineHtml()}
    ${boardSpaceSnapshotHtml()}
    <div class="sequence-actions">
      ${btn("Open Board State", "setActionPage('board')", "primary")}
    </div>
  </div>`;
}

function spaceEditorHtml() {
  const space = selectedSpace();
  const spaceId = space.id;
  const control = controlOptions.find(([id]) => id === space.control)?.[1] || "Uncontrolled";
  const calcSup = calculatedSupremacy(space);
  return `<details class="compact-details map-space-editor" open>
    <summary>Map-space monitor: ${esc(spaceLabel(spaceId))} (${esc(control)})</summary>
    <div class="walk-block">
      <div class="choice-grid">
        <div>
          <div class="context-label">Selected location</div>
          <select class="select-input" onchange="setSelectedSpace(this.value)">${spaceOptionsHtml(spaceId)}</select>
        </div>
        <div>
          <div class="context-label">Population</div>
          ${numberInputHtml(space.population, `setSpacePopulation('${spaceId}', this.value)`, 0, 20)}
        </div>
        <div>
          <div class="context-label">Political Value</div>
          ${numberInputHtml(space.politicalValue, `setSpacePoliticalValue('${spaceId}', this.value)`, 0, 20)}
        </div>
        <div>
          <div class="context-label">Parliamentary Control</div>
          <select class="select-input" onchange="setSpaceControl('${spaceId}', this.value)">${selectOptionsHtml(controlOptions, space.control)}</select>
        </div>
        <div>
          <div class="context-label">Supremacy</div>
          <select class="select-input" onchange="setSpaceSupremacy('${spaceId}', this.value)">
            <option value="" ${!space.supremacy ? "selected" : ""}>None</option>
            ${factionOptionsHtml(space.supremacy)}
          </select>
          ${calcSup.faction ? `<button class="mini-btn" onclick="setSpaceSupremacyToCalculated('${spaceId}')">Use calculated ${esc(factions[calcSup.faction].short)}</button>` : `<div class="small-note">${esc(calculatedSupremacyLabel(space))}</div>`}
        </div>
        <div>
          <div class="context-label">Assassinations</div>
          <select class="select-input" onchange="setSpaceMarker('${spaceId}', 'assassinations', this.value)">
            <option value="" ${!space.markers.assassinations ? "selected" : ""}>None</option>
            <option value="yellow_red" ${space.markers.assassinations === "yellow_red" ? "selected" : ""}>Yellow / red</option>
            <option value="brown_black" ${space.markers.assassinations === "brown_black" ? "selected" : ""}>Brown / black</option>
          </select>
        </div>
      </div>
      ${spaceValidityHtml(space)}
    </div>
    <div class="walk-block">
      <div class="field-label">Influence</div>
      <div class="space-value-grid">
        ${factionIds.map(id => `<label><span>${esc(factions[id].short)}</span>${numberInputHtml(space.influence[id], `setSpaceValue('${spaceId}', 'influence', '${id}', this.value)`, 0, 99)}</label>`).join("")}
      </div>
    </div>
    <div class="walk-block">
      <div class="field-label">Units</div>
      <div class="space-value-grid">
        ${Object.entries(specialUnitPieces).map(([id, unit]) => `<label><span>${esc(unit.label)}</span>${numberInputHtml(space.specialUnits?.[id] || 0, `setSpaceSpecialUnit('${spaceId}', '${id}', this.value)`, 0, 99)}</label>`).join("")}
        ${factionIds.map(id => `<label><span>${esc(unitPieces[id].label)}</span>${numberInputHtml(space.units[id], `setSpaceValue('${spaceId}', 'units', '${id}', this.value)`, 0, 99)}</label>`).join("")}
      </div>
      <div class="small-note">${[...Object.values(specialUnitPieces), ...factionIds.map(id => unitPieces[id])].map(unit => `${unit.label}: ${unit.full}`).join(" | ")} Coalition FK and Rogue FK may be opposite sides of a physical Freikorps counter, but track the current side/status separately.</div>
    </div>
    <div class="walk-block">
      <div class="field-label">Markers</div>
      <div class="choice-grid">
        <div>
          <div class="context-label">Strike</div>
          <div class="segmented two">
            <button class="${space.markers.strike ? "selected" : ""}" onclick="setSpaceMarker('${spaceId}', 'strike', true)">On</button>
            <button class="${!space.markers.strike ? "selected" : ""}" onclick="setSpaceMarker('${spaceId}', 'strike', false)">Off</button>
          </div>
        </div>
        <div>
          <div class="context-label">Uprising</div>
          <div class="segmented two">
            <button class="${space.markers.uprising ? "selected danger" : ""}" onclick="setSpaceMarker('${spaceId}', 'uprising', true)">On</button>
            <button class="${!space.markers.uprising ? "selected" : ""}" onclick="setSpaceMarker('${spaceId}', 'uprising', false)">Off</button>
          </div>
        </div>
        <div>
          <div class="context-label">Reform</div>
          <div class="segmented two">
            <button class="${space.markers.reform ? "selected" : ""}" onclick="setSpaceMarker('${spaceId}', 'reform', true)">On</button>
            <button class="${!space.markers.reform ? "selected" : ""}" onclick="setSpaceMarker('${spaceId}', 'reform', false)">Off</button>
          </div>
        </div>
        <div>
          <div class="context-label">Yellow Leverage</div>
          ${numberInputHtml(space.markers.yellowLeverage, `setSpaceMarker('${spaceId}', 'yellowLeverage', this.value)`, 0, 9)}
        </div>
        <div>
          <div class="context-label">Black Leverage</div>
          ${numberInputHtml(space.markers.blackLeverage, `setSpaceMarker('${spaceId}', 'blackLeverage', this.value)`, 0, 9)}
        </div>
        <div>
          <div class="context-label">KPD Cadre</div>
          ${numberInputHtml(space.markers.kpdCadre, `setSpaceMarker('${spaceId}', 'kpdCadre', this.value)`, 0, 9)}
        </div>
        <div>
          <div class="context-label">NSDAP Cadre</div>
          ${numberInputHtml(space.markers.nsdapCadre, `setSpaceMarker('${spaceId}', 'nsdapCadre', this.value)`, 0, 9)}
        </div>
        <div>
          <div class="context-label">Conservative Clique</div>
          ${numberInputHtml(space.markers.conservativeClique, `setSpaceMarker('${spaceId}', 'conservativeClique', this.value)`, 0, 9)}
        </div>
      </div>
    </div>
    <div class="walk-block">
      <div class="field-label">Guide tokens</div>
      <input class="text-input compact-input" value="${esc((space.guideTokens || []).join(', '))}" oninput="setSpaceGuideTokens('${spaceId}', this.value)" placeholder="Visual guide tokens not yet modeled elsewhere">
    </div>
    <div class="walk-block">
      <div class="field-label">Space notes</div>
      <input class="text-input compact-input" value="${esc(space.notes)}" oninput="setSpaceNotes('${spaceId}', this.value)" placeholder="Local restriction, adjacency reminder, unresolved combat note">
    </div>
  </details>`;
}

function middleClassPawnsHtml() {
  const pawns = normalizeMiddleClassPawns(state.boardState.middleClassPawns);
  const matTotal = Object.values(pawns.mats).reduce((sum, value) => sum + value, 0);
  const trackTotal = mcsTrackTypes.reduce((sum, track) => sum + Object.values(pawns.tracks[track]).reduce((inner, value) => inner + value, 0), 0);
  const input = (location, value, label) => `<label><span>${esc(label)}</span>${numberInputHtml(value, `setMiddleClassLocation('${location}', this.value)`, 0, 20)}</label>`;
  return `<div class="context-item wide mcs-editor">
    <div class="context-label">Middle Class pawns</div>
    <div class="mcs-quick-row">
      <span>Total ${totalMiddleClassPawns(pawns)}</span>
      <span>Playmats ${matTotal}</span>
      <span>Tracks ${trackTotal}</span>
    </div>
    <details class="mcs-details">
      <summary>Edit pawn locations</summary>
      <div class="mcs-grid">
        ${factionIds.map(id => input(`mat:${id}`, pawns.mats[id], `${factions[id].short} mat`)).join("")}
      </div>
      <div class="mcs-subhead">Shared Progress / Reaction track</div>
      <div class="small-note">These pawns are a shared physical pool. If one side removes a pawn from this row, it is no longer available to the other side.</div>
      <div class="mcs-grid">${mcsNumericBoxes.map(box => input(`progressReaction:${box}`, pawns.tracks.progressReaction[box], box)).join("")}</div>
      <div class="mcs-subhead">Economy track</div>
      <div class="mcs-grid">${economyOptions.map(([id, label]) => input(`economy:${id}`, pawns.tracks.economy[id], label)).join("")}</div>
    </details>
  </div>`;
}

function economicLeverageBoxesHtml() {
  const boxes = normalizeEconomicLeverageBoxes(state.boardState.economicLeverageBoxes);
  return `<div class="context-item wide">
    <div class="context-label">Economic track leverage setup</div>
    <div class="mcs-quick-row">
      <span>U.S. Deals yellow: ${esc(boxListLabel(boxes.usDeals.yellow))}</span>
      <span>U.S. Deals black: ${esc(boxListLabel(boxes.usDeals.black))}</span>
      <span>U.S.S.R. Deals yellow: ${esc(boxListLabel(boxes.ussrDeals.yellow))}</span>
      <span>U.S.S.R. Deals black: ${esc(boxListLabel(boxes.ussrDeals.black))}</span>
    </div>
  </div>`;
}

function trackPieceRowsHtml(track, group, boxes) {
  const pieces = normalizeTrackPieces(state.boardState.trackPieces);
  const boxLabel = box => track === "economy" ? (economyOptions.find(([id]) => id === box)?.[1] || box) : box;
  return Object.entries(pieces[track] || {}).map(([piece, counts]) => `<div class="mcs-subhead">${esc(trackPieceLabel(piece))}</div>
    <div class="mcs-grid">${boxes.map(box => `<label><span>${esc(boxLabel(box))}</span>${numberInputHtml(counts[box], `setTrackPiece('${track}', '${piece}', '${box}', this.value)`, 0, 9)}</label>`).join("")}</div>`).join("");
}

function trackPiecesHtml() {
  const pieces = normalizeTrackPieces(state.boardState.trackPieces);
  const pr = pieces.progressReaction;
  const economy = pieces.economy;
  const us = pieces.usDeals;
  const ussr = pieces.ussrDeals;
  return `<div class="context-item wide mcs-editor">
    <div class="context-label">Scenario track pieces</div>
    <div class="mcs-quick-row">
      <span>Progress/Reaction L: ${esc(countMapLabel(pr.yellowLeverage))} / ${esc(countMapLabel(pr.blackLeverage))}</span>
      <span>Reforms: ${esc(countMapLabel(pr.reforms))}</span>
      <span>Assassinations: ${esc(countMapLabel(pr.assassinations))}</span>
      <span>NSDAP Cadres: ${esc(countMapLabel(pr.nsdapCadres))}</span>
      <span>Conservative Cliques: ${esc(countMapLabel(pr.conservativeCliques))}</span>
      <span>Economy Dollar: ${esc(countMapLabel(economy.dollarDependence))}</span>
      <span>U.S. Deals Dollar: ${esc(countMapLabel(us.dollarDependence))}</span>
      <span>U.S.S.R. Reichswehr: ${esc(countMapLabel(ussr.reichswehr))}</span>
      <span>U.S.S.R. KPD Cadres: ${esc(countMapLabel(ussr.kpdCadres))}</span>
    </div>
    <details class="mcs-details">
      <summary>Edit track pieces</summary>
      <div class="small-note">Middle Class pawns are edited in their own shared-pool section below. Economic leverage is summarized above and mirrored here by exact box.</div>
      <div class="mcs-subhead">Progress / Reaction</div>
      ${trackPieceRowsHtml("progressReaction", pr, progressReactionBoxes)}
      <div class="mcs-subhead">Economy</div>
      ${trackPieceRowsHtml("economy", economy, economyOptions.map(([id]) => id))}
      <div class="mcs-subhead">U.S. Deals</div>
      ${trackPieceRowsHtml("usDeals", us, dealTrackBoxes)}
      <div class="mcs-subhead">U.S.S.R. Deals</div>
      ${trackPieceRowsHtml("ussrDeals", ussr, dealTrackBoxes)}
    </details>
  </div>`;
}

function boardStateControlsHtml() {
  const board = state.boardState;
  const progressOptions = Array.from({ length: 7 }, (_, value) => `<option value="${value}" ${board.progress === value ? "selected" : ""}>${value}</option>`).join("");
  const reactionOptions = Array.from({ length: 7 }, (_, value) => `<option value="${value}" ${board.reaction === value ? "selected" : ""}>${value}</option>`).join("");
  const dealOptionsHtml = selected => Array.from({ length: 6 }, (_, value) => `<option value="${value}" ${selected === value ? "selected" : ""}>${value}</option>`).join("");
  const stanceOptionHtml = selected => stanceOptions.map(([value, label]) => `<option value="${value}" ${selected === value ? "selected" : ""}>${esc(label)}</option>`).join("");
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
      <div class="context-label">U.S. Deals</div>
      <select class="select-input" onchange="setBoardState('usDeals', this.value)">
        ${dealOptionsHtml(board.usDeals)}
      </select>
    </div>
    <div class="context-item">
      <div class="context-label">U.S.S.R. Deals</div>
      <select class="select-input" onchange="setBoardState('ussrDeals', this.value)">
        ${dealOptionsHtml(board.ussrDeals)}
      </select>
    </div>
    <div class="context-item">
      <div class="context-label">KPD Stance</div>
      <select class="select-input" onchange="setBoardState('kpdStance', this.value)">${stanceOptionHtml(board.kpdStance)}</select>
    </div>
    <div class="context-item">
      <div class="context-label">NSDAP Stance</div>
      <select class="select-input" onchange="setBoardState('nsdapStance', this.value)">${stanceOptionHtml(board.nsdapStance)}</select>
    </div>
    <div class="context-item wide">
      <div class="context-label">Reaction / Progress cap</div>
      <div class="segmented two">
        <button class="${!board.reactionLimitIgnored ? "selected" : ""}" onclick="setBoardState('reactionLimitIgnored', false)">Normal</button>
        <button class="${board.reactionLimitIgnored ? "selected danger" : ""}" onclick="setBoardState('reactionLimitIgnored', true)">Ignored</button>
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
    <div class="context-item">
      <div class="context-label">Yellow Economy-marker Leverage</div>
      <select class="select-input" onchange="setBoardState('yellowEconomyLeverage', this.value)">${selectOptionsHtml(economyLeverageOptions, board.yellowEconomyLeverage)}</select>
    </div>
    <div class="context-item">
      <div class="context-label">Black Economy-marker Leverage</div>
      <select class="select-input" onchange="setBoardState('blackEconomyLeverage', this.value)">${selectOptionsHtml(economyLeverageOptions, board.blackEconomyLeverage)}</select>
    </div>
    ${economicLeverageBoxesHtml()}
    ${trackPiecesHtml()}
    ${middleClassPawnsHtml()}
    <div class="context-item wide">
      <div class="context-label">Board notes</div>
      <input class="text-input compact-input" value="${esc(board.notes)}" oninput="setBoardState('notes', this.value)" placeholder="Optional notes: available units, key map spaces, odd lingering effects">
    </div>
    ${board.scenarioSetup ? `<div class="context-item wide">
      <div class="context-label">Scenario setup checklist</div>
      ${listHtml(board.scenarioSetup.split("\n").filter(Boolean))}
    </div>` : ""}
  </div>
  ${spaceEditorHtml()}`;
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
      <button class="mini-btn" onclick="setScreen('scenario_audit')">Audit scenario</button>
    </div>
    ${boardStateControlsHtml()}
    ${boardValiditySummaryHtml()}
    <div class="small-note">Current: Progress ${board.progress}, Reaction ${board.reaction}, Economy ${esc(economyLabel(board.economy))}, Unity ${esc(board.unity)}, MCS ${totalMiddleClassPawns(board.middleClassPawns)}, U.S. Deals ${board.usDeals}, U.S.S.R. Deals ${board.ussrDeals}, General Strike ${board.generalStrikeActive ? "active" : "not active"}.</div>
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
  const action = selectedActionForFocus();
  if (!action) return "";
  const status = actionStatus(action);
  const blockedText = status.blocked.map(key => actionStateQuestions[key]);
  const unknownText = status.unknown.map(key => actionStateQuestions[key]);
  const slotTargets = state.actionSubpage === "action1" ? [0] : state.actionSubpage === "action2" ? [1] : requiredActionSlots();
  const assignedSlot = slotTargets.length === 1 ? slotTargets[0] : -1;
  const isAssigned = assignedSlot >= 0 && state.actionPlan[assignedSlot] === action.id;
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
        <div class="field-label">What must be true</div>
        ${listHtml(action.requires)}
      </div>
      ${action.procedure ? `<div>
        <div class="field-label">What to do now</div>
        ${listHtml(action.procedure)}
      </div>` : ""}
      ${action.warnings ? `<div>
        <div class="field-label">Watch For</div>
        ${listHtml(action.warnings)}
      </div>` : ""}
    </div>
    <div class="slot-actions">
      ${isAssigned
        ? `<span class="small-note">Action ${assignedSlot + 1} selected. Apply board effects below, then continue.</span><button class="mini-btn" onclick="clearActionSlot(${assignedSlot})">Change action</button>`
        : slotTargets.map(index => `<button class="mini-btn" ${status.tone === "blocked" ? "disabled" : `onclick="chooseActionForSlot(${index}, '${action.id}')"`}>Use as Action ${index + 1}</button>`).join("")}
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

function flowStickyHtml(active = "") {
  const item = (label, action, key) => btn(label, action, active === key ? "primary" : "");
  return `<div class="sticky-actions">
    ${item("Setup", "setScreen('solo_setup')", "setup")}
    ${item("Scenario", "setScreen('scenario_setup')", "scenario")}
    ${item("Board", "editBoardStateFlow()", "board")}
    ${item("Audit", "setScreen('scenario_audit')", "audit")}
    ${btn("Save", "setScreen('save_load')", active === "save" ? "primary" : "secondary")}
  </div>`;
}

function controllerSummaryHtml() {
  return `<div class="pill-list">
    ${factionIds.map(id => {
      const controller = state.controllers[id] === "bot" ? "Bot" : "Human";
      return `<span>${esc(factions[id].short)}: ${esc(controller)}</span>`;
    }).join("")}
  </div>`;
}

function scenarioSummaryHtml() {
  const scenario = currentScenario();
  if (!scenario) {
    return `<div class="info-band">Choose a scenario before starting the sequence.</div>`;
  }
  return `<div class="note-list compact">
    <div class="note-item"><strong>${esc(scenario.title)}</strong><br>${esc(scenario.years)} | ${scenario.rounds} rounds | ${esc(scenario.length)} | ${esc(scenario.source)}</div>
    <div class="note-item">Current turn: ${esc(state.year)} ${esc(currentHalfLabel())}. Momentum: ${esc(factions[state.momentumFaction]?.short || state.momentumFaction)}.</div>
  </div>`;
}

function renderSoloSetup(app) {
  app.innerHTML = `
    <section class="panel flow-panel">
      <div class="section-head">
        <div>
          <div class="kicker">Solo Setup</div>
          <h1>Who is playing?</h1>
          <p class="muted">Set each faction as human or bot. That is the whole step.</p>
        </div>
      </div>
      ${controllerControlsHtml()}
      <div class="sequence-actions">
        ${btn(state.scenarioId ? "Save setup" : "Continue", "completeSoloSetup()", "primary")}
      </div>
    </section>
    ${state.scenarioId ? flowStickyHtml("setup") : ""}
  `;
}

function renderScenarioSetup(app) {
  app.innerHTML = `
    <section class="panel flow-panel">
      ${scenarioPickerHtml()}
      <div class="sequence-actions">
        <button class="btn primary" ${state.scenarioId ? "onclick=\"continueFromScenarioSetup()\"" : "disabled"}>Continue to sequence</button>
      </div>
    </section>
    ${flowStickyHtml("scenario")}
  `;
}

function renderTurnOrder(app) {
  const momentum = factions[state.momentumFaction] || factions.coalition;
  app.innerHTML = `
    <section class="panel flow-panel">
      ${orientationStripHtml()}
      <div class="section-head">
        <div>
          <div class="kicker">Turn Order</div>
          <h1>Who acts next?</h1>
          <p class="muted">Set Momentum and arrange the faction order for the current year.</p>
        </div>
        ${badge(momentum.short, momentum.tone)}
      </div>
      <div class="question-stack">
        <div class="question-card">
          <div class="field-label">Momentum faction</div>
          ${momentumButtonsHtml()}
        </div>
        <div class="question-card">
          <div class="field-label">Faction order</div>
          ${turnOrderSetupHtml()}
          <p class="small-note">Saving restarts the Action Step at slot 1 with the first faction shown here.</p>
        </div>
      </div>
      <div class="info-band">At New Year, the Momentum faction determines turn order. If the Momentum faction is bot-controlled, use the relevant bot-card faction order and put that NP faction last when required by the solo rules.</div>
      <div class="sequence-actions">
        ${btn("Save turn order", "saveTurnOrderFlow()", "primary")}
      </div>
    </section>
    ${flowStickyHtml()}
  `;
}

function turnOrderSummaryHtml() {
  return `<div class="turn-rail">
    ${state.turnOrder.map((id, index) => {
      const faction = factions[id] || factions.coalition;
      const controller = state.controllers[id] === "bot" ? "Bot" : "Human";
      const active = index === state.activeTurnIndex;
      return `<div class="turn-rail-item ${active ? "active" : ""}">
        <span class="turn-order-label">${index + 1}</span>
        <span>
          <strong>${esc(faction.short)}</strong>
          <small>${esc(active ? "Next turn" : controller)}</small>
        </span>
      </div>`;
    }).join("")}
  </div>`;
}

function turnOrderSummaryBlockHtml() {
  const momentum = factions[state.momentumFaction] || factions.coalition;
  return `<section class="turn-order-summary-block">
    <div class="field-label">Turn order</div>
    ${turnOrderSummaryHtml()}
    <div class="small-note">Momentum: ${esc(momentum.short)}. The Momentum faction determines turn order for the upcoming year.</div>
    <div class="sequence-actions compact-sequence-actions">
      ${btn("Edit turn order", "editTurnOrderFlow()")}
    </div>
  </section>`;
}

function sequenceOverviewControlsHtml() {
  const phase = currentSequencePhase();
  if (phase.id === "action") {
    const disabled = state.scenarioId ? "" : "disabled";
    return `<div class="sequence-actions">
      <button class="btn primary" ${disabled} onclick="takeFactionTurn()">Take ${esc(activeFaction().short)} turn</button>
      ${state.scenarioId ? "" : `<div class="small-note blocked-note">Choose a scenario before starting faction turns.</div>`}
    </div>`;
  }
  return `
    ${sequenceControlsHtml()}
    <div class="sequence-actions">
      ${continueButtonHtml()}
      ${continueHelpHtml()}
    </div>
  `;
}

function renderSequence(app) {
  const phase = currentSequencePhase();
  const active = activeFaction();
  const era = eraForYear(state.year);
  app.innerHTML = `
    <section class="panel flow-panel">
      ${orientationStripHtml()}
      <div class="section-head">
        <div>
          <div class="kicker">Sequence Of Play</div>
          <h1>${esc(phase.title)}</h1>
          <p class="muted">${esc(phase.prompt)}</p>
        </div>
        <div class="badge-stack">
          ${badge(active.short, active.tone)}
          ${badge(era.label, "dark")}
        </div>
      </div>
      ${sequenceProgressHtml()}
      ${scenarioSummaryHtml()}
      ${turnOrderSummaryBlockHtml()}
      ${controllerSummaryHtml()}
      ${sequenceOverviewControlsHtml()}
      <details class="compact-details turn-aid-details">
        <summary>Turn Aid reminders</summary>
        ${reminderListHtml(phase.reminders)}
      </details>
    </section>
    ${flowStickyHtml()}
  `;
}

function turnOptionButtonsHtml() {
  return `<div class="option-grid solo-option-grid">
    ${actionChoices.map(option => {
      const selected = state.sequenceAnswers.actionChoice === option.id;
      return `<button class="option-card ${selected ? "selected" : ""}" onclick="chooseTurnOption('${option.id}')">
        <span class="option-title">${esc(option.label)}</span>
        <span class="option-detail">${esc(option.detail)}</span>
      </button>`;
    }).join("")}
  </div>`;
}

function renderFactionTurn(app) {
  const active = activeFaction();
  if (isActiveBot()) {
    app.innerHTML = `
      <section class="panel flow-panel ${active.tone}">
        ${orientationStripHtml()}
        ${pageHeaderHtml("Faction Turn", `${active.short}: bot turn`, "Reveal the bot card and resolve only this faction's turn.")}
        ${botActionSubpageHtml()}
        <div class="sequence-actions">
          ${continueButtonHtml()}
          ${continueHelpHtml()}
        </div>
      </section>
      ${flowStickyHtml()}
    `;
    return;
  }
  app.innerHTML = `
    <section class="panel flow-panel ${active.tone}">
      ${orientationStripHtml()}
      <div class="section-head">
        <div>
          <div class="kicker">Faction Turn</div>
          <h1>${esc(active.short)}</h1>
          <p class="muted">${esc(active.role)}</p>
        </div>
        ${badge(state.controllers[state.activeFaction] === "bot" ? "Bot" : "Human", active.tone)}
      </div>
      ${turnOptionButtonsHtml()}
    </section>
    ${flowStickyHtml()}
  `;
}

function humanActionBoardHtml() {
  return humanActionSubpageHtml();
}

function renderActionResolve(app) {
  const active = activeFaction();
  app.innerHTML = `
    <section class="panel flow-panel ${active.tone}">
      ${orientationStripHtml()}
      ${isActiveBot() ? botActionSubpageHtml() : humanActionBoardHtml()}
      <div class="sequence-actions">
        ${continueButtonHtml()}
        ${continueHelpHtml()}
      </div>
    </section>
    ${flowStickyHtml()}
  `;
}

function renderBoardState(app) {
  app.innerHTML = `
    <section class="panel flow-panel">
      ${orientationStripHtml()}
      ${boardStateCompactHtml()}
    </section>
    ${flowStickyHtml("board")}
  `;
}

function renderScenarioAudit(app) {
  app.innerHTML = `
    <section class="panel flow-panel">
      ${orientationStripHtml()}
      ${scenarioAuditHtml()}
    </section>
    ${flowStickyHtml("audit")}
  `;
}

function renderMapSpace(app) {
  const space = selectedSpace();
  const notice = state.boardNotice ? `<div class="toast-note">${esc(state.boardNotice)}</div>` : "";
  app.innerHTML = `
    <section class="panel flow-panel">
      ${orientationStripHtml()}
      <div class="runner-page">
        <div class="section-head">
          <div>
            <div class="kicker">Map Space</div>
            <h2>${esc(spaceLabel(space.id))}</h2>
            <p class="muted">Current remembered pieces and markers after the latest board-state update.</p>
          </div>
          ${badge("Visual check", "good")}
        </div>
        ${notice}
        ${mapSpaceVisualHtml(space)}
        ${pieceLegendHtml()}
        ${mapSpacePickerHtml(space.id)}
        <div class="sequence-actions">
          ${btn("Continue", "closeSpaceMapView()", "primary")}
        </div>
      </div>
    </section>
    ${flowStickyHtml("board")}
  `;
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
  const stored = state.botTurn.actions[index] || (index === 0 ? state.botTurn.action : "") || "";
  if (stored) return stored;
  if (state.actionSubpage !== "bot_action1" && state.actionSubpage !== "bot_action2") return "";
  if (index === 0) return firstAvailableBotActionFrom(0);
  const previousAction = state.botTurn.actions[0] || state.botTurn.action || firstAvailableBotActionFrom(0);
  const nextStart = Math.max(0, priorityIndexForAction(previousAction) + 1);
  return firstAvailableBotActionFrom(nextStart);
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

function currentOperationLabel() {
  const phase = currentSequencePhase();
  if (phase.id !== "action") return phase.title.replace(" Step", "");
  if (state.screen === "faction_turn" || state.actionSubpage === "choice") return "Turn option";
  if (state.actionSubpage === "event") return "Event";
  if (state.actionSubpage === "action1") return requiredActionSlots().length > 1 ? "Action 1 of 2" : "Action 1";
  if (state.actionSubpage === "action2") return "Action 2 of 2";
  if (state.actionSubpage === "election") return "Election check";
  if (state.actionSubpage === "bot_summary") return "Bot card";
  if (state.actionSubpage === "bot_action1") return state.botTurn.summary === "event_two_actions" ? "Bot Action 1 of 2" : "Bot Action";
  if (state.actionSubpage === "bot_action2") return "Bot Action 2 of 2";
  if (state.actionSubpage === "bot_election") return "Bot election check";
  return phase.title.replace(" Step", "");
}

function orientationStripHtml() {
  const phase = currentSequencePhase();
  const faction = activeFaction();
  return `<div class="orientation-strip">
    <span>${esc(state.year)} ${esc(currentHalfLabel().replace(" Year", ""))}</span>
    <span>${esc(faction.short)}</span>
    <span>${esc(phase.title.replace(" Step", ""))}</span>
    <span>${esc(currentOperationLabel())}</span>
  </div>`;
}

function boardSummaryLineHtml() {
  const board = state.boardState;
  return `<div class="board-summary-line">
    <span>Progress ${board.progress}</span>
    <span>Reaction ${board.reaction}</span>
    <span>${esc(economyLabel(board.economy))}</span>
    <span>Eco marker Y ${esc(economyLeverageLabel(board.yellowEconomyLeverage))}</span>
    <span>Eco marker B ${esc(economyLeverageLabel(board.blackEconomyLeverage))}</span>
    <span>Unity ${esc(board.unity)}</span>
    <span>U.S. ${board.usDeals}</span>
    <span>U.S.S.R. ${board.ussrDeals}</span>
    <span>MCS ${totalMiddleClassPawns(board.middleClassPawns)}</span>
    <span>KPD ${esc(stanceLabel(board.kpdStance))}</span>
    <span>NSDAP ${esc(stanceLabel(board.nsdapStance))}</span>
    <span>${board.generalStrikeActive ? "Strike active" : "No strike"}</span>
  </div>`;
}

function yesNoUnknownControlHtml(key, yesActive, noActive) {
  const value = state.actionContext[key];
  const yesSelected = value === true || (value === undefined && yesActive);
  const noSelected = value === false || (value === undefined && noActive);
  const unknownSelected = value === undefined && !yesActive && !noActive;
  return `<div class="segmented">
    <button class="${yesSelected ? "selected" : ""}" onclick="setActionContext('${key}', 'yes')">Yes</button>
    <button class="${noSelected ? "selected danger" : ""}" onclick="setActionContext('${key}', 'no')">No</button>
    <button class="${unknownSelected ? "selected muted-choice" : ""}" onclick="setActionContext('${key}', 'unknown')">?</button>
  </div>`;
}

function compactProgressSelectHtml() {
  const options = Array.from({ length: 7 }, (_, value) => `<option value="${value}" ${state.boardState.progress === value ? "selected" : ""}>${value}</option>`).join("");
  return `<select class="select-input" onchange="setBoardState('progress', this.value)">${options}</select>`;
}

function compactReactionSelectHtml() {
  const options = Array.from({ length: 7 }, (_, value) => `<option value="${value}" ${state.boardState.reaction === value ? "selected" : ""}>${value}</option>`).join("");
  return `<select class="select-input" onchange="setBoardState('reaction', this.value)">${options}</select>`;
}

function compactStanceSelectHtml(trackKey) {
  return `<select class="select-input" onchange="setBoardState('${trackKey}', this.value)">
    ${stanceOptions.map(([value, label]) => `<option value="${value}" ${state.boardState[trackKey] === value ? "selected" : ""}>${esc(label)}</option>`).join("")}
  </select>`;
}

function actionFactControlHtml(key) {
  const board = state.boardState;
  if (key === "yellow_leverage_above_progress") {
    return `<div class="context-item wide">
      <div class="context-label">Yellow Leverage above Progress?</div>
      <div class="choice-grid">
        <div>${compactProgressSelectHtml()}</div>
        <div><select class="select-input" onchange="setBoardState('yellowProgressLeverage', this.value)">
          <option value="unknown" ${board.yellowProgressLeverage === "unknown" ? "selected" : ""}>Unknown</option>
          <option value="above" ${board.yellowProgressLeverage === "above" ? "selected" : ""}>Yes, above current Progress</option>
          <option value="none" ${board.yellowProgressLeverage === "none" ? "selected" : ""}>No</option>
        </select></div>
      </div>
    </div>`;
  }
  if (key === "black_leverage_above_reaction") {
    return `<div class="context-item wide">
      <div class="context-label">Black Leverage above Reaction?</div>
      <div class="choice-grid">
        <div>${compactReactionSelectHtml()}</div>
        <div><select class="select-input" onchange="setBoardState('blackReactionLeverage', this.value)">
          <option value="unknown" ${board.blackReactionLeverage === "unknown" ? "selected" : ""}>Unknown</option>
          <option value="above" ${board.blackReactionLeverage === "above" ? "selected" : ""}>Yes, above current Reaction</option>
          <option value="none" ${board.blackReactionLeverage === "none" ? "selected" : ""}>No</option>
        </select></div>
      </div>
    </div>`;
  }
  if (key === "reaction_can_advance") {
    return `<div class="context-item wide">
      <div class="context-label">Reaction / Progress cap</div>
      <div class="choice-grid">
        <div>${compactProgressSelectHtml()}</div>
        <div>${compactReactionSelectHtml()}</div>
      </div>
      <div class="segmented two fact-toggle">
        <button class="${!board.reactionLimitIgnored ? "selected" : ""}" onclick="setBoardState('reactionLimitIgnored', false)">Normal</button>
        <button class="${board.reactionLimitIgnored ? "selected danger" : ""}" onclick="setBoardState('reactionLimitIgnored', true)">Ignored</button>
      </div>
    </div>`;
  }
  if (key === "coalition_influence_allowed") {
    return `<div class="context-item wide">
      <div class="context-label">Economy marker</div>
      <div class="track-strip economy-track compact-economy-track">
        ${economyOptions.map(([value, label]) => `<button class="${board.economy === value ? "selected" : ""}" onclick="setBoardState('economy', '${value}')">${esc(label)}</button>`).join("")}
      </div>
    </div>`;
  }
  if (key === "general_strike_clear") {
    return `<div class="context-item">
      <div class="context-label">General Strike</div>
      <div class="segmented two">
        <button class="${board.generalStrikeActive ? "selected danger" : ""}" onclick="setBoardState('generalStrikeActive', true)">Active</button>
        <button class="${!board.generalStrikeActive ? "selected" : ""}" onclick="setBoardState('generalStrikeActive', false)">Not active</button>
      </div>
    </div>`;
  }
  if (key === "unity_sound_strong") {
    return `<div class="context-item">
      <div class="context-label">Coalition Unity</div>
      <select class="select-input" onchange="setBoardState('unity', this.value)">
        <option value="fragile" ${board.unity === "fragile" ? "selected" : ""}>Fragile</option>
        <option value="shaky" ${board.unity === "shaky" ? "selected" : ""}>Shaky</option>
        <option value="sound" ${board.unity === "sound" ? "selected" : ""}>Sound</option>
        <option value="strong" ${board.unity === "strong" ? "selected" : ""}>Strong</option>
      </select>
    </div>`;
  }
  if (key === "kpd_stance_in_play") {
    return `<div class="context-item">
      <div class="context-label">KPD Stance</div>
      ${compactStanceSelectHtml("kpdStance")}
    </div>`;
  }
  if (key === "nsdap_stance_in_play") {
    return `<div class="context-item">
      <div class="context-label">NSDAP Stance</div>
      ${compactStanceSelectHtml("nsdapStance")}
    </div>`;
  }
  const derived = derivedContextValue(key);
  return `<div class="context-item">
    <div class="context-label">${esc(actionStateQuestions[key] || key)}</div>
    ${yesNoUnknownControlHtml(key, derived === true, derived === false)}
  </div>`;
}

function actionRelevantBoardFactsHtml(action) {
  const keys = Array.from(new Set(action?.context || []));
  if (!keys.length) return "";
  return `<section class="fact-panel">
    <div class="field-label">Relevant board facts</div>
    <div class="context-grid focused-context-grid">
      ${keys.map(actionFactControlHtml).join("")}
    </div>
  </section>`;
}

function humanActionSelectionPageHtml(slot) {
  const actionNumber = slot + 1;
  const assignedActionId = state.actionPlan[slot] || "";
  const action = assignedActionId ? findAction(assignedActionId) : selectedActionForFocus();
  if (!assignedActionId) {
    return `
      ${pageHeaderHtml(`Action ${actionNumber}`, `Choose ${activeFaction().short} Action ${actionNumber}`, "Pick exactly one legal action for this slot. Board updates appear after the action is chosen.")}
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
  return `
    ${pageHeaderHtml(`Action ${actionNumber}`, `Resolve ${activeFaction().short} Action ${actionNumber}`, "Apply only the board-state changes for the selected action, then continue.")}
    ${boardSummaryLineHtml()}
    ${selectedActionDetailHtml()}
    ${actionRelevantBoardFactsHtml(action)}
    ${choiceTrackerHtml()}
    <div class="sequence-actions board-shortcut">
      ${btn("Open full board", "editBoardStateFlow()")}
    </div>
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
      ${choiceTrackerHtml()}
    `;
  }
  if (state.actionSubpage === "action1") return humanActionSelectionPageHtml(0);
  if (state.actionSubpage === "action2") return humanActionSelectionPageHtml(1);
  if (state.actionSubpage === "election") {
    return `
      ${pageHeaderHtml("Election check", "Was an Election card played?", "This answer controls whether the sequence branches to Elections after all faction turns.")}
      <div class="walk-block">${yesNoHtml("electionPlayed", "Election card played", "No Election card")}</div>
      ${choiceTrackerHtml()}
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
  const selected = currentBotAction();
  const waitingForSpecialDie = selected === "special" && !currentBotSpecialDie();
  return `
    ${pageHeaderHtml(`Bot Action ${actionNumber}`, `${activeFaction().short}: resolve selected bot Action`, selected === "special" ? "Choose the Special Action die result, then apply the matching board effect." : "The first legal priority is selected; apply its board effect, then continue.")}
    ${botStepStatusHtml()}
    ${boardSummaryLineHtml()}
    <div class="walk-block">
      <div class="field-label">Bot Action priority</div>
      <div class="priority-row">${priorities.map((item, index) => `<span class="${currentBotAction() === botPriorityActionId(item) ? "selected" : ""}"><strong>${index + 1}</strong> ${esc(item)}</span>`).join("")}</div>
    </div>
    ${botSelectedActionDetailHtml()}
    ${waitingForSpecialDie ? "" : choiceTrackerHtml()}
    <details class="compact-details">
      <summary>Change selected bot action</summary>
      <div class="walk-block">
        <div class="field-label">Available bot actions</div>
        ${botActionPickerHtml()}
      </div>
    </details>
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
      ${choiceTrackerHtml()}
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
      ${choiceTrackerHtml()}
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

function newYearTurnOrderHelperHtml() {
  const draft = ensureNewYearOrderDraft();
  const momentum = factions[state.momentumFaction] || factions.coalition;
  const keys = botCardRanges[state.momentumFaction] || [];
  const data = botCardDatabase[draft.card];
  const orderOptions = selected => factionIds
    .filter(id => id !== state.momentumFaction)
    .map(id => `<option value="${id}" ${selected === id ? "selected" : ""}>${esc(factions[id].short)}</option>`)
    .join("");
  const appliedOrder = [...draft.order, state.momentumFaction].map(id => factions[id]?.short || id).join(" > ");
  return `<div class="walk-block">
    <div class="field-label">Turn order helper</div>
    <div class="info-band">At New Year, use a bot card from the Momentum faction deck. Read the three faction icons at the top from left to right, then put ${esc(momentum.short)} last for the solo bot procedure.</div>
    <div class="mcs-quick-row">
      <span>Momentum: ${esc(momentum.short)}</span>
      <span>Applied preview: ${esc(appliedOrder)}</span>
    </div>
    <div class="grid2">
      <button class="btn secondary" onclick="drawNewYearBotCard()">Draw random Momentum card</button>
      <button class="btn primary" onclick="applyNewYearTurnOrderFromCard()">Apply card order</button>
    </div>
    <div class="bot-card-grid">
      ${keys.map(key => {
        const card = botCardDatabase[key];
        return `<button class="${draft.card === key ? "selected" : ""}" onclick="chooseNewYearBotCard('${key}')">
          <strong>${Number(key)}</strong>
          <span>${esc(card.impulse)}</span>
        </button>`;
      }).join("")}
    </div>
    ${data ? `<div class="bot-card-preview">
      <img src="${esc(data.image)}" alt="Momentum bot card ${esc(draft.card)}">
      <div>
        <div class="info-band"><strong>Card ${esc(draft.card)}:</strong> ${esc(data.impulse)} | ${esc(botCardSummaryLabel(data.summary))}${data.reshuffle ? " | Reshuffle" : ""}</div>
        <div class="choice-grid">
          ${draft.order.map((id, index) => `<div>
            <div class="context-label">Top icon ${index + 1}</div>
            <select class="select-input" onchange="setNewYearOrderSlot(${index}, this.value)">${orderOptions(id)}</select>
          </div>`).join("")}
        </div>
      </div>
    </div>` : `<div class="small-note">Choose or draw a Momentum bot card, then set the top-strip icons left to right before applying turn order.</div>`}
  </div>`;
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
    ${newYearTurnOrderHelperHtml()}
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

    <section class="panel">
      ${scenarioPickerHtml()}
    </section>

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

    <section class="panel">
      <div class="section-head">
        <div>
          <div class="kicker">Board Monitor</div>
          <h2>Tracked board state</h2>
          <p class="muted">Menus update tracks, map spaces, markers, Influence, and units as each faction action resolves.</p>
        </div>
        ${badge(`${Object.keys(state.boardState.spaces || {}).length} spaces`, "good")}
      </div>
      ${boardMonitorSummaryHtml()}
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
        <p>The current game auto-saves in this browser. JSON export/import can move a game state between browsers.</p>
      </div>
    </section>

    <section class="panel">
      <div class="grid2">
        ${btn("Save now", "saveStateLocal()", "primary")}
        ${btn("Load from browser", "loadStateLocal()")}
        ${btn("Export JSON", "exportStateText()")}
        ${btn("Import JSON", "importStateText()")}
      </div>
      <p class="muted save-note">Autosave key: ${LOCAL_SAVE_KEY}${state.lastSavedAt ? " | Last saved: " + state.lastSavedAt : ""}</p>
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

  if (state.screen === "solo_setup") {
    renderSoloSetup(app);
    scheduleAutoSave();
    return;
  }
  if (state.screen === "scenario_setup") {
    renderScenarioSetup(app);
    scheduleAutoSave();
    return;
  }
  if (state.screen === "sequence") {
    renderSequence(app);
    scheduleAutoSave();
    return;
  }
  if (state.screen === "turn_order") {
    renderTurnOrder(app);
    scheduleAutoSave();
    return;
  }
  if (state.screen === "faction_turn") {
    renderFactionTurn(app);
    scheduleAutoSave();
    return;
  }
  if (state.screen === "action_resolve") {
    renderActionResolve(app);
    scheduleAutoSave();
    return;
  }
  if (state.screen === "board_state") {
    renderBoardState(app);
    scheduleAutoSave();
    return;
  }
  if (state.screen === "scenario_audit") {
    renderScenarioAudit(app);
    scheduleAutoSave();
    return;
  }
  if (state.screen === "map_space") {
    renderMapSpace(app);
    scheduleAutoSave();
    return;
  }
  if (state.screen === "factions") {
    renderFactions(app);
    scheduleAutoSave();
    return;
  }
  if (state.screen === "rules") {
    renderRules(app);
    scheduleAutoSave();
    return;
  }
  if (state.screen === "notes") {
    renderNotes(app);
    scheduleAutoSave();
    return;
  }
  if (state.screen === "save_load") {
    renderSaveLoad(app);
    scheduleAutoSave();
    return;
  }
  if (state.screen === "result") {
    renderResult(app);
    scheduleAutoSave();
    return;
  }
  renderSequence(app);
  scheduleAutoSave();
}

function back() {
  if (state.navStack.length) {
    const stack = [...state.navStack];
    const snapshot = stack.pop();
    restoreStateSnapshot(snapshot, stack);
    render();
    return;
  }
  if (state.screen !== "sequence") setScreen("sequence", false);
}

window.state = state;
window.render = render;
window.back = back;
window.setScreen = setScreen;
window.goToSequence = goToSequence;
window.continueToScenarioSetup = continueToScenarioSetup;
window.continueFromScenarioSetup = continueFromScenarioSetup;
window.takeFactionTurn = takeFactionTurn;
window.editBoardStateFlow = editBoardStateFlow;
window.openSpaceMapView = openSpaceMapView;
window.closeSpaceMapView = closeSpaceMapView;
window.editTurnOrderFlow = editTurnOrderFlow;
window.saveTurnOrderFlow = saveTurnOrderFlow;
window.chooseTurnOption = chooseTurnOption;
window.setFaction = setFaction;
window.setActiveFaction = setActiveFaction;
window.setMomentumFaction = setMomentumFaction;
window.setTurnOrderSlot = setTurnOrderSlot;
window.chooseNewYearBotCard = chooseNewYearBotCard;
window.drawNewYearBotCard = drawNewYearBotCard;
window.setNewYearOrderSlot = setNewYearOrderSlot;
window.applyNewYearTurnOrderFromCard = applyNewYearTurnOrderFromCard;
window.setActiveTurnIndex = setActiveTurnIndex;
window.setSource = setSource;
window.setYear = setYear;
window.setRound = setRound;
window.setCurrentStep = setCurrentStep;
window.toggleStep = toggleStep;
window.setSequenceAnswer = setSequenceAnswer;
window.updateChoiceDraft = updateChoiceDraft;
window.recordChoice = recordChoice;
window.deleteChoiceLogEntry = deleteChoiceLogEntry;
window.updateEffectDraft = updateEffectDraft;
window.applyBoardEffect = applyBoardEffect;
window.setSelectedSpace = setSelectedSpace;
window.setSpacePopulation = setSpacePopulation;
window.setSpacePoliticalValue = setSpacePoliticalValue;
window.setSpaceControl = setSpaceControl;
window.setSpaceSupremacy = setSpaceSupremacy;
window.setSpaceSupremacyToCalculated = setSpaceSupremacyToCalculated;
window.setSpaceValue = setSpaceValue;
window.setSpaceSpecialUnit = setSpaceSpecialUnit;
window.setSpaceMarker = setSpaceMarker;
window.setSpaceNotes = setSpaceNotes;
window.setSpaceGuideTokens = setSpaceGuideTokens;
window.setMiddleClassLocation = setMiddleClassLocation;
window.setTrackPiece = setTrackPiece;
window.toggleSequenceCheck = toggleSequenceCheck;
window.continueSequence = continueSequence;
window.jumpToSequencePhase = jumpToSequencePhase;
window.setActionContext = setActionContext;
window.selectAction = selectAction;
window.setActionSlot = setActionSlot;
window.chooseActionForSlot = chooseActionForSlot;
window.clearActionSlot = clearActionSlot;
window.setController = setController;
window.completeSoloSetup = completeSoloSetup;
window.editSoloSetup = editSoloSetup;
window.setBoardState = setBoardState;
window.setActionPage = setActionPage;
window.saveTurnSetup = saveTurnSetup;
window.saveBoardStatePage = saveBoardStatePage;
window.applyScenario = applyScenario;
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

loadAutoSavedState();
autoSaveReady = true;
render();
