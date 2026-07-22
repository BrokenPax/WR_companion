const APP_NAME = "The Weimar Republic Companion";
const APP_BUILD = "phase-2-faction-timeline";
const LOCAL_SAVE_KEY = "wr-companion-state-v2";

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
    status: "Next",
    body: "Extract exact round structure, event timing, initiative, and cleanup steps from the turn aid and rulebook."
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

const state = {
  screen: "dashboard",
  selectedFaction: "coalition",
  currentSource: "rulebook",
  year: 1919,
  round: 1,
  activeFaction: "coalition",
  eventTitle: "",
  currentStep: "event",
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

function currentFaction() {
  return factions[state.selectedFaction] || factions.coalition;
}

function activeFaction() {
  return factions[state.activeFaction] || factions.coalition;
}

function currentSource() {
  return sources.find(source => source.id === state.currentSource) || sources[0];
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
  render();
}

function setRound(round) {
  state.round = round === 2 ? 2 : 1;
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
  render();
}

function rewindRound() {
  if (state.round === 2) {
    state.round = 1;
  } else if (state.year > years[0]) {
    state.year -= 1;
    state.round = 2;
  }
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

function renderDashboard(app) {
  const source = currentSource();
  const active = activeFaction();

  app.innerHTML = `
    <section class="hero">
      <div>
        <div class="kicker">GMT Games</div>
        <h1>${APP_NAME}</h1>
        <p>Round tracker and faction reference foundation. Rules automation will grow from verified rulebook data.</p>
      </div>
      ${badge(APP_BUILD, "dark")}
    </section>

    <section class="panel">
      <div class="section-head">
        <div>
          <div class="kicker">Current Round</div>
          <h2>${state.year}, Round ${state.round}</h2>
        </div>
        ${badge(active.short, active.tone)}
      </div>
      ${timelineHtml()}
      <div class="round-controls">
        ${btn("Round 1", "setRound(1)", state.round === 1 ? "primary" : "")}
        ${btn("Round 2", "setRound(2)", state.round === 2 ? "primary" : "")}
      </div>
      <div class="grid2">
        ${btn("Previous Round", "rewindRound()")}
        ${btn("Advance Round", "advanceRound()", "primary")}
      </div>
    </section>

    <section class="panel">
      <div class="section-head">
        <div>
          <div class="kicker">Round Flow</div>
          <h2>${esc(stepLabels[state.currentStep])}</h2>
        </div>
        ${badge("To verify", "warn")}
      </div>
      <input class="text-input" value="${esc(state.eventTitle)}" oninput="updateEventTitle(this.value)" placeholder="Current event/card title or reminder">
      <div class="step-list">${stepChecklistHtml()}</div>
      <div class="small-note">This is a working skeleton until the exact sequence is extracted from the rulebook.</div>
    </section>

    <section class="panel">
      <div class="section-head">
        <div>
          <div class="kicker">Active Faction</div>
          <h2>${esc(active.label)}</h2>
        </div>
      </div>
      <div class="grid4">${activeFactionButtonsHtml()}</div>
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
      ${btn("Factions", "setScreen('factions')", "primary")}
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
