"use strict";
((root) => {
  // Presentation only: callers own fetching, freshness, disclosure and cleanup.
  // A memory revision or Map snapshot is never substituted for source identity.
  const bounded = (value, max) => typeof value === "string" && value.length <= max ? value : "";
  function render({document, source = {}, presentation = source.presentation, text = source.text,
    range = null, truncated, availability = "available", current = () => true, actions = [], excerpt = false}) {
    const node = (tag, value, cls = "") => { const n = document.createElement(tag); n.textContent = value; n.className = cls; return n; };
    const card = node("section", "", "source-evidence");
    if (!current()) { card.append(node("p", "This source view changed. Reopen the saved record.", "field-hint")); return card; }
    card.append(node("strong", bounded(presentation?.title, 160) || "Saved source wording"));
    const role = bounded(source.role, 64) || "unavailable", origin = bounded(source.origin, 320) || "unavailable";
    const speaker = bounded(presentation?.speaker, 160), label = bounded(presentation?.origin, 320);
    if (speaker || label) card.append(node("p", [speaker, label].filter(Boolean).join(" · "), "field-hint"));
    card.append(node("small", "Recorded role: " + role + " · Origin: " + origin));
    const id = bounded(source.id, 100) || "unavailable";
    const revision = Number.isSafeInteger(source.revision) && source.revision > 0 ? source.revision : "unavailable";
    card.append(node("small", "Source: " + id + " · Source revision: " + revision));
    if (/^[a-f0-9]{64}$/.test(source.content_digest || "")) card.append(node("small", "Content SHA-256: " + source.content_digest));
    if (availability !== "available") {
      card.append(node("p", availability === "changed" ? "This source changed. Reopen the saved record before relying on it."
        : "This original is no longer available; its historical link is retained.", "field-hint"));
      return card;
    }
    const notice = bounded(presentation?.notice, 1000) || "Saved source wording. Inspect its recorded role and origin; it is not independently verified evidence.";
    card.append(node("p", notice, "field-hint"));
    const validRange = typeof text === "string" && range && [range.start, range.end, range.total].every(Number.isSafeInteger)
      && range.start >= 0 && range.end >= range.start && range.total >= range.end && range.end - range.start === Array.from(text).length;
    card.append(node("small", validRange
      ? `Characters ${range.end > range.start ? range.start + 1 : range.start}–${range.end} of ${range.total}. Exact saved text.`
      : "Exact excerpt range unavailable in this view."));
    if (truncated === true) card.append(node("small", "Excerpt; additional saved text is not shown."));
    else if (truncated !== false) card.append(node("small", "Truncation status unavailable in this view."));
    if (typeof text === "string") card.append(node(excerpt ? "blockquote" : "pre", text, excerpt ? "" : "memory-json"));
    if (actions.length) {
      const controls = node("div", "", "inline-form");
      for (const action of actions) {
        if (!bounded(action?.label, 160) || typeof action.run !== "function") continue;
        const button = node("button", action.label, "text-button"); button.type = "button";
        button.disabled = !current();
        button.addEventListener("click", () => { if (current()) return action.run(); });
        controls.append(button);
      }
      card.append(controls);
    }
    return card;
  }
  const exported = {render}; root.PCSSourceEvidence = exported;
  if (typeof module !== "undefined") module.exports = exported;
})(typeof window !== "undefined" ? window : globalThis);
