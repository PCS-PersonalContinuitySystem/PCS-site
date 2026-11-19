"use strict";
((root) => {
  // Presentation only: the same map, inspector and editors stay mounted. This
  // controller never reads records, saves a view or grants private ownership.
  function create({document, environment = root, available, resized}) {
    const host = document.getElementById("map-view"), enter = document.getElementById("map-fullscreen"),
      leave = document.getElementById("map-fullscreen-exit"), bar = document.getElementById("map-fullscreen-bar");
    if (!host || !enter || !leave || !bar) return null;
    const history = document.getElementById("map-history"), graphDock = document.getElementById("map-history-dock"),
      listDock = document.getElementById("map-list-history-dock"), stage = document.getElementById("map-stage");
    const historyHome = history?.parentNode, historyNext = history?.nextSibling;
    let expanded = false, native = false, serial = 0, returnFocus = null, outside = [];
    const original = {role: host.getAttribute("role"), label: host.getAttribute("aria-label"), labelled: host.getAttribute("aria-labelledby")};
    const attribute = (name, value) => value === null ? host.removeAttribute(name) : host.setAttribute(name, value);
    function resize() { const run = () => { if (available()) resized(); }; if (environment.requestAnimationFrame) environment.requestAnimationFrame(run); else run(); }
    function paint() {
      host.classList.toggle("map-expanded", expanded);
      document.body?.classList.toggle("map-fullscreen-open", expanded);
      bar.hidden = !expanded; enter.hidden = expanded; enter.disabled = !available();
      enter.setAttribute("aria-expanded", String(expanded));
      // Move the existing controls so their listeners, disabled state and trail
      // remain the same. Restore their exact footer position on every exit.
      if (history && historyHome && graphDock) {
        const dock = stage?.hidden && listDock ? listDock : graphDock;
        const focused = document.activeElement, keepFocus = history.contains(focused);
        graphDock.hidden = !expanded || dock !== graphDock;
        if (listDock) listDock.hidden = !expanded || dock !== listDock;
        if (expanded && history.parentNode !== dock) dock.append(history);
        else if (!expanded && history.parentNode !== historyHome)
          historyHome.insertBefore(history, historyNext?.parentNode === historyHome ? historyNext : null);
        if (keepFocus && document.activeElement !== focused) focused.focus({preventScroll: true});
      }
      if (expanded) {
        host.setAttribute("role", "dialog"); host.setAttribute("aria-modal", "true");
        host.setAttribute("aria-label", "Continuity map, full screen"); host.removeAttribute("aria-labelledby");
      } else {
        attribute("role", original.role); attribute("aria-label", original.label); attribute("aria-labelledby", original.labelled);
        host.removeAttribute("aria-modal");
      }
    }
    function containFocus() {
      for (let current = host; current.parentElement; current = current.parentElement) {
        for (const sibling of current.parentElement.children) if (sibling !== current && !["SCRIPT", "STYLE", "LINK"].includes(sibling.tagName)) {
          outside.push([sibling, sibling.inert]); sibling.inert = true;
        }
      }
    }
    async function exit({restoreFocus = true} = {}) {
      const wasExpanded = expanded, focus = returnFocus;
      serial++; expanded = false; native = false; returnFocus = null;
      for (const [element, inert] of outside) element.inert = inert;
      outside = []; paint();
      if (document.fullscreenElement === host) {
        try { await document.exitFullscreen?.(); } catch { /* Page style still returns to its normal layout. */ }
      }
      if (wasExpanded) {
        resize();
        if (restoreFocus && available() && focus?.isConnected !== false) focus?.focus?.({preventScroll: true});
      }
    }
    async function open() {
      if (expanded || !available()) return;
      const request = ++serial; expanded = true; returnFocus = document.activeElement || enter;
      containFocus(); paint(); leave.focus({preventScroll: true}); resize();
      // The viewport presentation is already usable if fullscreen is denied,
      // unavailable, or embedded in a browser that disallows this capability.
      try {
        if (host.requestFullscreen) await host.requestFullscreen();
        if (request !== serial || !available()) {
          if (document.fullscreenElement === host) await document.exitFullscreen?.();
          return;
        }
        native = document.fullscreenElement === host; resize();
      } catch { if (request === serial && !available()) await exit({restoreFocus: false}); }
    }
    function update() { if (expanded && !available()) void exit({restoreFocus: false}); else paint(); }
    enter.addEventListener("click", open); leave.addEventListener("click", () => exit());
    document.addEventListener?.("fullscreenchange", () => {
      if (document.fullscreenElement === host) {
        if (!expanded || !available()) { void exit({restoreFocus: false}); return; }
        native = true; resize();
      } else if (expanded && native) void exit();
    });
    host.addEventListener("keydown", event => {
      if (!expanded) return;
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation?.(); void exit(); return; }
      if (event.key !== "Tab") return;
      const items = [...host.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, a[href], [tabindex="0"]')]
        .filter(element => !element.hidden && (!element.getClientRects || element.getClientRects().length));
      const first = items[0] || leave, last = items.at(-1) || leave;
      if (event.shiftKey && (document.activeElement === first || !host.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !host.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    });
    paint(); return {open, exit, update, active: () => expanded};
  }
  const exported = {create}; if (typeof module !== "undefined") module.exports = exported;
  root.PCSMapFullscreen = exported;
})(typeof window !== "undefined" ? window : globalThis);
