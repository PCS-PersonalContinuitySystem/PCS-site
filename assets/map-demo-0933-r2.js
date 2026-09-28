/* Curated invented Map sample. No requests, persistence, animation, or app APIs. */
(() => {
  "use strict";
  const root = document.querySelector("[data-map-demo]");
  if (!root) return;
  let data;
  try { data = JSON.parse(root.querySelector("[data-map-data]").textContent); }
  catch (_) { return; }
  if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) return;
  const nodes = new Map(data.nodes.map(node => [node.id, node]));
  const nodeLinks = [...root.querySelectorAll("[data-map-node]")];
  const edges = new Map(data.edges.map(edge => [edge.id, edge]));
  const edgeLines = [...root.querySelectorAll("[data-map-edge]")];
  const svg = root.querySelector(".pcs-map-svg");
  const surface = root.querySelector("[data-map-surface]");
  const selector = root.querySelector("#pcs-map-theme-select");
  const title = root.querySelector("#pcs-map-selected-title");
  const meta = root.querySelector("[data-map-selected-meta]");
  const records = root.querySelector("[data-map-records]");
  const connections = root.querySelector("[data-map-connections]");
  const status = root.querySelector("[data-map-status]");
  const zoomLabel = root.querySelector("[data-map-zoom-label]");
  const zoomIn = root.querySelector('[data-map-zoom="in"]');
  const zoomOut = root.querySelector('[data-map-zoom="out"]');
  let selected = data.selected;
  let zoom = 1;
  let center = { x: 405, y: 325 };
  function make(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function updateView() {
    const width = 810 / zoom, height = 650 / zoom;
    center.x = Math.max(width / 2, Math.min(810 - width / 2, center.x));
    center.y = Math.max(height / 2, Math.min(650 - height / 2, center.y));
    svg.setAttribute("viewBox", `${center.x - width / 2} ${center.y - height / 2} ${width} ${height}`);
    zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
    zoomIn.disabled = zoom >= 2;
    zoomOut.disabled = zoom <= 1;
  }
  function selectTheme(id, announce = true) {
    const node = nodes.get(id);
    if (!node) return;
    selected = id;
    selector.value = id;
    const related = new Set(node.neighbors.map(neighbor => neighbor.id));
    for (const link of nodeLinks) {
      const linkID = link.dataset.mapNode;
      link.classList.toggle("is-selected", linkID === id);
      link.classList.toggle("is-related", related.has(linkID));
      if (linkID === id) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    }
    for (const line of edgeLines) {
      const edge = edges.get(line.dataset.mapEdge);
      line.classList.toggle("is-connected", edge.from === id || edge.to === id);
    }
    title.textContent = node.label;
    meta.textContent = `${node.count} sample records · ${node.neighbors.length} visible connections`;
    const recordContent = document.createDocumentFragment();
    for (const record of node.records) {
      const article = make("article", "pcs-map-record");
      article.append(make("h5", "", record.title), make("p", "", record.text));
      recordContent.append(article);
    }
    records.replaceChildren(recordContent);
    const connectionContent = document.createDocumentFragment();
    for (const neighbor of node.neighbors) {
      const link = make("a", "", nodes.get(neighbor.id).label);
      link.href = "#pcs-map-reading";
      link.dataset.mapTheme = neighbor.id;
      connectionContent.append(link);
    }
    connections.replaceChildren(connectionContent);
    if (zoom > 1) { center = { x: node.x, y: node.y }; updateView(); }
    if (announce) {
      // Move only the map's own scrollport, never the surrounding webpage.
      // Rendered bounds account for the SVG viewBox and its current zoom.
      const target = nodeLinks.find(link => link.dataset.mapNode === id);
      if (target && (surface.scrollWidth > surface.clientWidth + 1 || surface.scrollHeight > surface.clientHeight + 1)) {
        const targetBounds = target.getBoundingClientRect();
        const surfaceBounds = surface.getBoundingClientRect();
        surface.scrollTo({
          left: surface.scrollLeft + targetBounds.left + targetBounds.width / 2 - surfaceBounds.left - surface.clientLeft - surface.clientWidth / 2,
          top: surface.scrollTop + targetBounds.top + targetBounds.height / 2 - surfaceBounds.top - surface.clientTop - surface.clientHeight / 2,
          behavior: "auto"
        });
      }
      status.textContent = `${node.label}. ${node.count} supporting sample records and ${node.neighbors.length} visible connections. The example records below have updated.`;
    }
  }
  root.addEventListener("click", event => {
    const link = event.target.closest("[data-map-theme]");
    if (!link || !root.contains(link)) return;
    event.preventDefault();
    const fromInspector = connections.contains(link);
    selectTheme(link.dataset.mapTheme);
    // Replacing the connected-theme list removes the activating link. Retain
    // keyboard focus on the stable native selector instead of losing it.
    if (fromInspector) selector.focus({ preventScroll: true });
  });
  selector.addEventListener("change", () => selectTheme(selector.value));
  root.addEventListener("focusin", event => {
    const link = event.target.closest("[data-map-node]");
    if (!link || zoom === 1) return;
    // Keep every keyboard-reached node visible when the view is magnified.
    const node = nodes.get(link.dataset.mapNode);
    if (node) { center = { x: node.x, y: node.y }; updateView(); }
  });
  root.querySelector("[data-map-reset]").addEventListener("click", () => {
    zoom = 1;
    center = { x: 405, y: 325 };
    surface.scrollLeft = 0;
    surface.scrollTop = 0;
    updateView();
    status.textContent = "Map view reset to 100 percent.";
  });
  for (const button of [zoomIn, zoomOut]) button.addEventListener("click", () => {
    zoom = Math.max(1, Math.min(2, Math.round((zoom + (button === zoomIn ? .25 : -.25)) * 100) / 100));
    const node = nodes.get(selected);
    center = zoom === 1 ? { x: 405, y: 325 } : { x: node.x, y: node.y };
    updateView();
    status.textContent = `Map zoom ${Math.round(zoom * 100)} percent, centered on ${node.label}.`;
  });
  // No wheel handlers: scrolling the webpage continues to work normally.
  surface.addEventListener("keydown", event => {
    if (event.target !== surface || zoom === 1 || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const step = 40 / zoom;
    if (event.key === "ArrowLeft") center.x -= step;
    if (event.key === "ArrowRight") center.x += step;
    if (event.key === "ArrowUp") center.y -= step;
    if (event.key === "ArrowDown") center.y += step;
    updateView();
  });
  const reading = document.querySelector("#pcs-map-reading");
  root.querySelector(".pcs-map-reading-link").addEventListener("click", () => { if (reading) reading.open = true; });
  selectTheme(selected, false);
  updateView();
  root.classList.add("is-enhanced");
  surface.setAttribute("aria-label", "Sample connection map. Select a theme or use the theme list above. When zoomed, focus this map and use arrow keys to pan. On small screens, scroll sideways to explore.");
  for (const control of root.querySelectorAll("[data-map-controls]")) control.hidden = false;
})();
