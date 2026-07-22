const APP_NAME = "The Weimar Republic Companion";
const APP_BUILD = "phase-3-guided-sequence";
const LOCAL_SAVE_KEY = "wr-companion-state-v3";

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

const state = {
  screen: "dashboard",
  selectedFaction: "coalition",
  currentSource: "rulebook",
  year: 1919,
  round: 1,
  activeFaction: "coalition",
  eventTitle: "",
  currentStep: "event",
  sequenceStepIndex: 0,
  sequenceAnswers: {
    actionChoice: "",
    electionPlayed: "",
    suddenVictory: "",
    generalElectionOutcome: "",
    timelineFlip: ""
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

function normalizeState() {
  if (!years.includes(Number(state.year))) state.year = 1919;
  state.year = Number(state.year);
  state.round = state.round === 2 ? 2 : 1;
  if (!factions[state.selectedFaction]) state.selectedFaction = "coalition";
  if (!factions[state.activeFaction]) state.activeFaction = "coalition";
  if (!sources.some(source => source.id === state.currentSource)) state.currentSource = "rulebook";
  if (!state.sequenceAnswers || typeof state.sequenceAnswers !== "object") state.sequenceAnswers = {};
  state.sequenceAnswers = {
    actionChoice: "",
    electionPlayed: "",
    suddenVictory: "",
    generalElectionOutcome: "",
    timelineFlip: "",
    ...state.sequenceAnswers
  };
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
  render();
}

function setSource(sourceId) {
  state.currentSource = sourceId;
  render();
}

function setYear(year) {
  const parsed = Number(year);
  if (!years.includes(parsed)) return;
  state.year = parsed;
  resetSequenceForNextAction();
  render();
}

function setRound(round) {
  state.round = round === 2 ? 2 : 1;
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

function setSequenceAnswer(key, value) {
  state.sequenceAnswers[key] = value;
  if (key === "actionChoice" && value === "pass") {
    state.sequenceAnswers.electionPlayed = "no";
  }
  if (key === "electionPlayed" && value === "no") {
    state.sequenceAnswers.generalElectionOutcome = "";
    clearSequenceChecks("elections:");
  }
  render();
}

function toggleSequenceCheck(key) {
  state.sequenceChecks[key] = !state.sequenceChecks[key];
  render();
}

function resetSequenceForNextAction() {
  state.sequenceStepIndex = 0;
  state.sequenceAnswers.actionChoice = "";
  state.sequenceAnswers.electionPlayed = "";
  state.sequenceAnswers.suddenVictory = "";
  state.sequenceAnswers.generalElectionOutcome = "";
  state.sequenceAnswers.timelineFlip = "";
  state.completedSequence = [];
}

function endWithResult(title, body) {
  state.result = { title, body };
  setScreen("result");
}

function continueSequence() {
  const phase = currentSequencePhase();
  markSequenceComplete(phase.id);

  if (phase.id === "action") {
    setSequencePhase("sudden_victory");
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
  state.activeFaction = "coalition";
  state.eventTitle = "";
  state.currentStep = "event";
  state.sequenceStepIndex = 0;
  state.sequenceAnswers = {
    actionChoice: "",
    electionPlayed: "",
    suddenVictory: "",
    generalElectionOutcome: "",
    timelineFlip: ""
  };
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
      return `<button class="phase-dot ${active ? "active" : ""} ${done ? "done" : ""}" onclick="jumpToSequencePhase('${phase.id}')" title="${esc(phase.title)}">
        <span>${index + 1}</span>
      </button>`;
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

function continueButtonHtml(label = "Continue") {
  const disabled = !canContinueSequence();
  return `<button class="btn primary" ${disabled ? "disabled" : "onclick=\"continueSequence()\""}>${esc(label)}</button>`;
}

function canContinueSequence() {
  const phase = currentSequencePhase();
  if (phase.id === "action") return !!state.sequenceAnswers.actionChoice;
  if (phase.id === "sudden_victory") return !!state.sequenceAnswers.suddenVictory;
  if (phase.id === "elections_gate") return !!state.sequenceAnswers.electionPlayed;
  if (phase.id === "elections") return !!state.sequenceAnswers.generalElectionOutcome;
  if (phase.id === "advance_timeline") return !!state.sequenceAnswers.timelineFlip;
  return true;
}

function actionControlsHtml() {
  const active = activeFaction();
  return `
    <div class="walk-block">
      <div class="field-label">Active faction</div>
      <div class="grid4">${activeFactionButtonsHtml()}</div>
      <p class="small-note">Current active faction: ${esc(active.label)}</p>
    </div>
    <div class="walk-block">
      <div class="field-label">Choose the faction's turn option</div>
      ${optionsHtml(actionChoices, "actionChoice")}
    </div>
    <div class="walk-block">
      <div class="field-label">Card / event reminder</div>
      <input class="text-input" value="${esc(state.eventTitle)}" oninput="updateEventTitle(this.value)" placeholder="Optional card title, event, or rules reminder">
      <div class="field-label">Was an Election card played?</div>
      ${yesNoHtml("electionPlayed", "Election card played", "No Election card")}
    </div>
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

    <section class="panel">
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

    <section class="panel">
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
      <div class="walk-block">
        <div class="field-label">Turn Aid reminders</div>
        ${reminderListHtml(phase.reminders)}
      </div>
      <div class="sequence-actions">
        ${continueButtonHtml()}
      </div>
      <div class="small-note">Source: ${esc(phase.source)}. This walkthrough models the Turn Aid sequence; exact action legality and faction-specific victory requirements still need rulebook/player-aid extraction.</div>
    </section>

    <section class="panel">
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
window.setSource = setSource;
window.setYear = setYear;
window.setRound = setRound;
window.setCurrentStep = setCurrentStep;
window.toggleStep = toggleStep;
window.setSequenceAnswer = setSequenceAnswer;
window.toggleSequenceCheck = toggleSequenceCheck;
window.continueSequence = continueSequence;
window.jumpToSequencePhase = jumpToSequencePhase;
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
