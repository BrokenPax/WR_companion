const APP_NAME = "The Weimar Republic Companion";
const APP_BUILD = "phase-1-shell";
const LOCAL_SAVE_KEY = "wr-companion-shell-state-v1";

const sources = [
  {
    id: "playbook",
    label: "Playbook",
    file: "assets/The_Weimar_Republic_Playbook_Web.pdf",
    note: "Scenarios, examples, play aids, and design/reference material."
  },
  {
    id: "rulebook",
    label: "Rulebook",
    file: "assets/The+Weimar+Republic_Rule+book_WEB.pdf",
    note: "Core rules source for the WR implementation."
  }
];

const shellAreas = [
  {
    id: "rules",
    title: "Rules Model",
    status: "Next",
    body: "Extract phases, factions, sequence of play, actions, and decision priorities from the WR rulebook."
  },
  {
    id: "flow",
    title: "Game Flow",
    status: "Shell",
    body: "Use one state object, screen-based rendering, guided prompts, result traces, and save/load."
  },
  {
    id: "data",
    title: "Game Data",
    status: "Stub",
    body: "Create structured WR data before adding automation. Avoid embedding rules directly in render code."
  },
  {
    id: "ui",
    title: "Mobile UI",
    status: "Shell",
    body: "Phone-first static PWA with cards, panels, sticky controls, and local browser persistence."
  }
];

const state = {
  screen: "dashboard",
  currentSource: "rulebook",
  notes: "",
  saveLoadText: "",
  lastSavedAt: null,
  migrationPhase: 1,
  checklist: {
    shell: true,
    pdfs: true,
    rulesData: false,
    gameFlow: false,
    validation: false
  }
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

function currentSource() {
  return sources.find(source => source.id === state.currentSource) || sources[0];
}

function setScreen(screen) {
  state.screen = screen;
  render();
}

function setSource(sourceId) {
  state.currentSource = sourceId;
  render();
}

function updateNotes(value) {
  state.notes = value;
}

function updateSaveLoadText(value) {
  state.saveLoadText = value;
}

function saveStateLocal() {
  const payload = deepClone(state);
  payload.lastSavedAt = new Date().toISOString();
  localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(payload));
  state.lastSavedAt = payload.lastSavedAt;
  state.result = {
    title: "State saved",
    body: "The current WR companion shell state was saved in this browser."
  };
  setScreen("result");
}

function loadStateLocal() {
  const raw = localStorage.getItem(LOCAL_SAVE_KEY);
  if (!raw) {
    state.result = {
      title: "No save found",
      body: "There is no saved WR shell state in this browser yet."
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

function resetShell() {
  state.screen = "dashboard";
  state.currentSource = "rulebook";
  state.notes = "";
  state.saveLoadText = "";
  state.lastSavedAt = null;
  state.migrationPhase = 1;
  state.checklist = {
    shell: true,
    pdfs: true,
    rulesData: false,
    gameFlow: false,
    validation: false
  };
  state.result = null;
  render();
}

function checklistHtml() {
  const rows = [
    ["shell", "WR app shell"],
    ["pdfs", "Rulebook and playbook in assets"],
    ["rulesData", "Structured WR rules data"],
    ["gameFlow", "Implemented WR game flow"],
    ["validation", "Rules validation pass"]
  ];

  return rows.map(([key, label]) => {
    const complete = !!state.checklist[key];
    return `<div class="check-row ${complete ? "done" : ""}">
      <span class="check-dot">${complete ? "OK" : "--"}</span>
      <span>${esc(label)}</span>
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
  app.innerHTML = `
    <section class="hero">
      <div>
        <div class="kicker">GMT Games</div>
        <h1>${APP_NAME}</h1>
        <p>Phase 1 project shell for building a dedicated Weimar Republic companion app.</p>
      </div>
      ${badge(APP_BUILD, "dark")}
    </section>

    <section class="panel">
      <div class="section-head">
        <div>
          <div class="kicker">Source Material</div>
          <h2>PDFs Added</h2>
        </div>
        <a class="link-btn" href="${esc(source.file)}" target="_blank" rel="noreferrer">Open ${esc(source.label)}</a>
      </div>
      <div class="source-grid">${sourceCardsHtml()}</div>
    </section>

    <section class="grid2">
      ${shellAreas.map(area => `<article class="card">
        <div class="row">
          <h3>${esc(area.title)}</h3>
          ${badge(area.status, area.status === "Next" ? "warn" : "")}
        </div>
        <p class="muted">${esc(area.body)}</p>
      </article>`).join("")}
    </section>

    <section class="panel">
      <div class="section-head">
        <div>
          <div class="kicker">Migration</div>
          <h2>Phase 1 Checklist</h2>
        </div>
        ${badge("Phase " + state.migrationPhase, "dark")}
      </div>
      <div class="checklist">${checklistHtml()}</div>
    </section>

    <section class="panel">
      <div class="section-head">
        <div>
          <div class="kicker">Working Notes</div>
          <h2>Extraction Notes</h2>
        </div>
      </div>
      <textarea oninput="updateNotes(this.value)" placeholder="Notes from the WR PDFs, implementation questions, or data-model sketches.">${esc(state.notes)}</textarea>
    </section>

    <div class="sticky-actions">
      ${btn("References", "setScreen('references')")}
      ${btn("Save / Load", "setScreen('save_load')", "secondary")}
    </div>
  `;
}

function renderReferences(app) {
  app.innerHTML = `
    <section class="hero">
      <div>
        <div class="kicker">Reference Library</div>
        <h1>WR Sources</h1>
        <p>These files are stored locally in the project under assets and will drive the rules-data extraction phase.</p>
      </div>
    </section>

    <section class="source-grid">
      ${sources.map(source => `<article class="card">
        <div class="row">
          <h3>${esc(source.label)}</h3>
          ${badge("PDF")}
        </div>
        <p class="muted">${esc(source.note)}</p>
        <a class="full-link" href="${esc(source.file)}" target="_blank" rel="noreferrer">Open ${esc(source.file)}</a>
      </article>`).join("")}
    </section>

    <div class="sticky-actions">
      ${btn("Back", "setScreen('dashboard')", "primary")}
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
        <p>Local saves use a WR-specific browser key for this companion.</p>
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
      ${btn("Back", "setScreen('dashboard')", "primary")}
      ${btn("Reset Shell", "resetShell()")}
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
      ${btn("Back to Dashboard", "setScreen('dashboard')", "primary")}
      ${btn("Save / Load", "setScreen('save_load')")}
    </div>
  `;
}

function render() {
  const app = document.getElementById("app");
  if (!app) return;

  if (state.screen === "references") {
    renderReferences(app);
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
window.setSource = setSource;
window.updateNotes = updateNotes;
window.updateSaveLoadText = updateSaveLoadText;
window.saveStateLocal = saveStateLocal;
window.loadStateLocal = loadStateLocal;
window.exportStateText = exportStateText;
window.importStateText = importStateText;
window.resetShell = resetShell;

document.getElementById("backBtn").onclick = back;
document.getElementById("resetBtn").onclick = resetShell;

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

render();
