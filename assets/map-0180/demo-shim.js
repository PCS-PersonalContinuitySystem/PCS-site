"use strict";
// PCS website Map demo: stands in for the PCS server and app shell around the
// unmodified PCS 0.9.180 Map client (continuity_map_ui.js and its modules).
// It answers the Map's five endpoints from responses recorded with PCS's own
// Map code on an invented vault, keeps Map choices and notes in memory for
// this visit only, and makes no request except for this site's own data files.
// No cookies, storage, analytics or AI requests. Website demo code, GPL-3.0-only.
(() => {
  const DATA = "data/";
  const VERSION = "0180-r1";
  const MAP = "/api/continuity-map/";
  const NOT_IN_DEMO = "Not part of this demo: ";
  const notice = document.getElementById("demo-notice");
  let noticeTimer = null;
  function standIn(text) {
    if (!notice) return;
    notice.textContent = NOT_IN_DEMO + text;
    notice.hidden = false;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => { notice.hidden = true; notice.textContent = ""; }, 7000);
  }
  const fetchJson = name => fetch(DATA + name + "?v=" + VERSION, {credentials: "omit", cache: "force-cache"})
    .then(response => { if (!response.ok) throw new Error("The demo data could not be loaded. Reload the page to try again."); return response.json(); });
  let manifest = null, table = null;
  const memo = new Map(), sets = new Map();
  const ready = Promise.all([fetchJson("manifest.json"), fetchJson("table-core.json")]).then(([m, t]) => { manifest = m; table = t; });
  // table-core.json holds what the opening view needs; table-rest.json is
  // fetched with the first other filter set.
  let rest = null;
  const loadRest = () => rest ||= fetchJson("table-rest.json").then(t => { table = table.concat(t); }).catch(error => { rest = null; throw error; });
  // Values shared between responses are stored once and referenced as "\u0000" + base-36 index.
  function decode(value) {
    if (typeof value === "string") {
      if (value.charCodeAt(0) !== 0) return value;
      const index = parseInt(value.slice(1), 36);
      if (!memo.has(index)) memo.set(index, decode(table[index]));
      return memo.get(index);
    }
    if (Array.isArray(value)) return value.map(decode);
    if (value && typeof value === "object") { const out = {}; for (const key of Object.keys(value)) out[key] = decode(value[key]); return out; }
    return value;
  }
  // Each answer is a fresh copy, as a server response would be.
  const answer = value => JSON.parse(JSON.stringify(decode(value)));
  const filterKey = body => JSON.stringify(manifest.key_order.map(key => body?.[key]));
  function loadSet(key) {
    const name = manifest.sets[key];
    if (!name) return Promise.resolve(null);
    if (!sets.has(name)) sets.set(name, Promise.all([fetchJson(name), key === manifest.default ? null : loadRest()])
      .then(([set]) => set).catch(error => { sets.delete(name); throw error; }));
    return sets.get(name);
  }
  function notRecorded(body) {
    if (typeof body?.query === "string" && body.query.trim())
      return NOT_IN_DEMO + "saved-word scope was not recorded. Clear Only records containing these words and choose Apply to return to the full overview.";
    if (typeof body?.through === "string" && body.through > manifest.today)
      return "Choose today or an earlier UTC saved-through date.";
    // The Map disables Today without a view, so the shim clears the through
    // date for the next request: Refresh then returns to Today.
    setTimeout(() => { const through = document.getElementById("map-through"); if (through) through.value = ""; }, 0);
    return NOT_IN_DEMO + "this saved-through date was not recorded. Today works with every Map setting, and ← and → step through 30- and 90-day windows with the opening settings. Choose Refresh to return to Today.";
  }
  // Presentation is kept for this visit only: never written to storage.
  let presentation = null;
  const layoutBytes = value => new TextEncoder().encode(JSON.stringify(value)).length;
  async function api(path, options = {}) {
    if (options.signal?.aborted) throw new Error("The operation took too long. Check its status before trying again; it may have completed.");
    await ready;
    const body = options.body;
    if (path === MAP + "layout") {
      if (!body || Object.keys(body).length) throw new Error("Request the current map layout with an empty object.");
      if (!presentation) presentation = answer(manifest.layout);
      return JSON.parse(JSON.stringify(presentation));
    }
    if (path === MAP + "layout/save") {
      if (!body || typeof body !== "object" || layoutBytes(body) > 256000) throw new Error("Map names, notes, views and preferences share 256 KB of capacity.");
      presentation = JSON.parse(JSON.stringify(body));
      return {saved: true};
    }
    if (path === MAP + "browse" || path === MAP + "inspect") {
      const set = await loadSet(filterKey(body));
      if (!set) throw new Error(notRecorded(body));
      if (path.endsWith("browse")) return answer(set.browse);
      const snapshot = decode(set.browse.snapshot);
      if (body.snapshot !== snapshot) throw new Error("Saved records or the current page changed. Refresh the map before inspecting it.");
      const recorded = set.inspect[`${body.selection?.kind}|${body.selection?.id}|${body.offset}`];
      if (!recorded) throw new Error("Choose a visible theme or connection from a refreshed map.");
      return answer(recorded);
    }
    if (path === MAP + "index") throw new Error(NOT_IN_DEMO + "this invented vault is small, so it has no connection index to build.");
    throw new Error(NOT_IN_DEMO + "this part of PCS is not included.");
  }
  // The app shell's state, as an unlocked vault on the Continuity → Map page.
  const context = () => ({generation: 1, session: 1, temporaryGeneration: 0, controller: "website-demo",
    unlocked: true, locking: false, closed: false, temporary: false, phase: "idle", provider: null,
    route: null, research: false, transitioning: false, renewing: false, inputGeneration: 0, page: "memories",
    memoryEnabled: true, materialsEnabled: true, memoryTotal: 74});
  const mapUI = window.PCSContinuityMap.create({document, api, context,
    authorize: async () => {},
    draftChanged: () => {},
    inspect: async () => standIn("in PCS, Inspect opens the full saved record in Continuity → Library, with its history and sources."),
    reviewSelection: async () => standIn("in PCS, this prepares a draft from the records you chose. You review it in Conversation before anything is sent."),
    searchLibrary: () => standIn("in PCS, this searches every saved record in Continuity → Library."),
    openThought: () => standIn("in PCS, this opens the thought in PCS Perspective, with its basis and uncertainty."),
  });
  for (const id of ["ideas-show-library", "map-open-library"])
    document.getElementById(id)?.addEventListener("click", () => standIn("in PCS, Library lists, searches and inspects every saved memory and notebook."));
  // A phone opens on List, the real Map's own keyboard- and touch-friendly view.
  const narrow = window.matchMedia("(max-width: 600px)").matches;
  ready.then(() => {
    mapUI.setActive(true);
    mapUI.pageChanged();
    if (narrow) {
      const list = document.getElementById("map-list-mode");
      const open = () => { if (!list.disabled) { list.click(); observer.disconnect(); } };
      const observer = new MutationObserver(open);
      observer.observe(list, {attributes: true, attributeFilter: ["disabled"]});
      open();
    }
  }, error => {
    const status = document.getElementById("map-status");
    if (status) status.textContent = error.message;
  });
})();
