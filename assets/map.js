/* PCS website Map demo. Fictional local data; no network or saved app state. */
(function (root) {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const WIDTH = 1000, HEIGHT = 700;
  // Production's six Map tones, assigned to the demo's authored groups.
  // Keep assignments stable across filters, layouts and hidden themes.
  const groupTones = new Map([['Everyday', 0], ['Work', 1], ['Family', 2], ['Home', 3], ['Community', 4], ['Friends', 5], ['Plans', 1]]);
  const toneClass = node => `pcs-map-group-${groupTones.get(node?.group) ?? 0}`;
  const edgeKey = (a, b) => [a, b].sort().join('|');
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;
  let serial = 0;

  function deriveGraph(data, type = 'all') {
    const themes = new Map(data.themes.map(theme => [theme.id, theme]));
    const nodes = new Map(), edges = new Map();
    const records = data.records.filter(record => type === 'all' || record.type === type);
    for (const record of records) {
      const ids = [...new Set(record.themes)].filter(id => themes.has(id)).sort();
      for (const id of ids) {
        if (!nodes.has(id)) nodes.set(id, {...themes.get(id), count: 0, records: [], date: ''});
        const node = nodes.get(id);
        node.count++; node.records.push(record);
        if (record.date > node.date) node.date = record.date;
      }
      for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) {
        const id = edgeKey(ids[a], ids[b]);
        if (!edges.has(id)) edges.set(id, {id, from: ids[a], to: ids[b], count: 0, records: []});
        const edge = edges.get(id); edge.count++; edge.records.push(record);
      }
    }
    const byDate = (a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id);
    for (const node of nodes.values()) node.records.sort(byDate);
    for (const edge of edges.values()) edge.records.sort(byDate);
    return {nodes: [...nodes.values()].sort((a, b) => a.label.localeCompare(b.label)), edges: [...edges.values()], records};
  }

  // Same tie policy as PCS 0.9.50: whole equal-count groups, nearest percentage,
  // choosing fewer dotted connections when the distance is exactly equal.
  function dottedConnections(edges, percent = 60) {
    const target = clamp(Number(percent) || 0, 0, 100), groups = new Map();
    for (const edge of edges) groups.set(edge.count, (groups.get(edge.count) || 0) + 1);
    let cutoff = 0, count = 0, cumulative = 0, distance = target * edges.length;
    for (const [strength, size] of [...groups].sort((a, b) => a[0] - b[0])) {
      cumulative += size;
      const next = Math.abs(100 * cumulative - target * edges.length);
      if (next < distance) { distance = next; count = cumulative; cutoff = strength; }
    }
    return {cutoff, count, total: edges.length};
  }

  function visibleGraph(graph, state) {
    const hidden = new Set(state.hidden || []), hiddenEdges = new Set(state.hiddenEdges || []);
    let nodes = graph.nodes.filter(node => !hidden.has(node.id));
    const ids = new Set(nodes.map(node => node.id));
    let edges = graph.edges.filter(edge => ids.has(edge.from) && ids.has(edge.to) && !hiddenEdges.has(edge.id) && (!state.repeated || edge.count >= 2));
    const anchor = state.anchor ?? state.selected;
    if ((state.layout === 'rings' || state.layout === 'compare') && ids.has(anchor)) {
      const anchors = new Set([anchor]);
      if (state.layout === 'compare' && ids.has(state.compare)) anchors.add(state.compare);
      const wanted = new Set(anchors);
      for (const edge of edges) if (anchors.has(edge.from) || anchors.has(edge.to)) { wanted.add(edge.from); wanted.add(edge.to); }
      nodes = nodes.filter(node => wanted.has(node.id));
      edges = edges.filter(edge => wanted.has(edge.from) && wanted.has(edge.to));
    }
    return {nodes, edges};
  }

  function layoutGraph(graph, mode, selected, compare) {
    const nodes = graph.nodes, positions = new Map(), headings = [];
    if (!nodes.length) return {positions, headings};
    if (mode === 'grid') {
      const columns = Math.min(5, Math.ceil(Math.sqrt(nodes.length * 1.35))), rows = Math.ceil(nodes.length / columns);
      nodes.forEach((node, i) => positions.set(node.id, {x: 95 + (i % columns) * 810 / Math.max(1, columns - 1), y: 95 + Math.floor(i / columns) * 470 / Math.max(1, rows - 1)}));
    } else if (mode === 'rings') {
      positions.set(selected, {x: 500, y: 340});
      const others = nodes.filter(node => node.id !== selected);
      others.forEach((node, i) => { const angle = -Math.PI / 2 + i * Math.PI * 2 / others.length;
        positions.set(node.id, {x: 500 + Math.cos(angle) * 370, y: 330 + Math.sin(angle) * 225}); });
    } else if (mode === 'date') {
      const groups = new Map();
      for (const node of nodes) {
        const date = new Date(node.date + 'T12:00:00Z');
        const day = Number.isFinite(date.getTime()) ? Math.floor(date.getTime() / 86400000) : 0;
        const week = day - ((day + 3) % 7);
        if (!groups.has(week)) groups.set(week, []); groups.get(week).push(node);
      }
      // Recent records often share a week. Give that week enough columns rather
      // than stacking its themes on top of one another in a single narrow lane.
      const ordered = [...groups].sort((a, b) => a[0] - b[0]);
      const columns = ordered.reduce((sum, [, group]) => sum + Math.ceil(group.length / 5), 0);
      const xAt = column => columns === 1 ? 500 : 90 + column * 820 / (columns - 1);
      let offset = 0;
      ordered.forEach(([week, group]) => {
        const width = Math.ceil(group.length / 5);
        headings.push({x: (xAt(offset) + xAt(offset + width - 1)) / 2, label: new Date(week * 86400000).toLocaleDateString('en-US', {month: 'short', day: 'numeric', timeZone: 'UTC'})});
        group.forEach((node, i) => positions.set(node.id, {x: xAt(offset + Math.floor(i / 5)), y: 140 + (i % 5) * 105}));
        offset += width;
      });
    } else if (mode === 'compare' && compare && selected !== compare) {
      const left = new Set(), right = new Set();
      for (const edge of graph.edges) {
        if (edge.from === selected || edge.to === selected) left.add(edge.from === selected ? edge.to : edge.from);
        if (edge.from === compare || edge.to === compare) right.add(edge.from === compare ? edge.to : edge.from);
      }
      positions.set(selected, {x: 260, y: 95}); positions.set(compare, {x: 740, y: 95});
      const groups = [[], [], []];
      for (const node of nodes) if (node.id !== selected && node.id !== compare) groups[left.has(node.id) && right.has(node.id) ? 1 : left.has(node.id) ? 0 : 2].push(node);
      groups.forEach((group, column) => {
        const columns = Math.ceil(group.length / 5), starts = [90, 420, 670], widths = [240, 160, 240];
        group.forEach((node, i) => {
          const x = columns === 1 ? [210, 500, 790][column] : starts[column] + Math.floor(i / 5) * widths[column] / (columns - 1);
          positions.set(node.id, {x, y: 225 + (i % 5) * 90});
        });
      });
    } else {
      const groups = [...new Set(nodes.map(node => node.group))].sort();
      nodes.forEach((node, i) => {
        const group = groups.indexOf(node.group), angle = group * Math.PI * 2 / groups.length - Math.PI / 2;
        positions.set(node.id, {x: 500 + Math.cos(angle) * 285 + Math.cos(i * 2.4) * 66, y: 325 + Math.sin(angle) * 190 + Math.sin(i * 2.4) * 55});
      });
      // Deterministic, bounded settling. No animation or changing simulation.
      for (let step = 0; step < 180; step++) {
        const forces = new Map(nodes.map(node => [node.id, {x: 0, y: 0}]));
        for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
          const a = positions.get(nodes[i].id), b = positions.get(nodes[j].id), dx = a.x - b.x || .1, dy = a.y - b.y || .1;
          const distance = Math.max(20, Math.hypot(dx, dy)), force = 6800 / (distance * distance);
          forces.get(nodes[i].id).x += dx / distance * force; forces.get(nodes[i].id).y += dy / distance * force;
          forces.get(nodes[j].id).x -= dx / distance * force; forces.get(nodes[j].id).y -= dy / distance * force;
        }
        for (const edge of graph.edges) {
          const a = positions.get(edge.from), b = positions.get(edge.to), dx = b.x - a.x, dy = b.y - a.y, distance = Math.max(1, Math.hypot(dx, dy));
          const force = (distance - 175) * .006;
          forces.get(edge.from).x += dx / distance * force; forces.get(edge.from).y += dy / distance * force;
          forces.get(edge.to).x -= dx / distance * force; forces.get(edge.to).y -= dy / distance * force;
        }
        for (const node of nodes) {
          const point = positions.get(node.id), force = forces.get(node.id);
          point.x = clamp(point.x + clamp(force.x, -5, 5), 95, 905);
          point.y = clamp(point.y + clamp(force.y, -5, 5), 80, 575);
        }
      }
    }
    return {positions, headings};
  }

  function curvePoint(route, t) {
    const u = 1 - t;
    return {x: u * u * route.from.x + 2 * u * t * route.control.x + t * t * route.to.x,
      y: u * u * route.from.y + 2 * u * t * route.control.y + t * t * route.to.y};
  }

  function routeEdges(edges, positions, selected, mode) {
    const anchors = [], points = [...positions.values()], center = positions.get(selected) || {x: 500, y: 340};
    const ordered = [...edges].sort((a, b) => Number(b.from === selected || b.to === selected) - Number(a.from === selected || a.to === selected) || b.count - a.count || a.id.localeCompare(b.id));
    return ordered.map(edge => {
      const from = positions.get(edge.from), to = positions.get(edge.to), middle = {x: (from.x + to.x) / 2, y: (from.y + to.y) / 2};
      const length = Math.max(1, Math.hypot(to.x - from.x, to.y - from.y));
      const perpendicular = {x: -(to.y - from.y) / length, y: (to.x - from.x) / length};
      const spoke = edge.from === selected || edge.to === selected;
      const outwardLength = Math.hypot(middle.x - center.x, middle.y - center.y);
      const direction = mode === 'rings' && outwardLength > 1 ? {x: (middle.x - center.x) / outwardLength, y: (middle.y - center.y) / outwardLength} : perpendicular;
      const initialBend = spoke ? 0 : mode === 'rings' ? 80 : 30;
      let best = null;
      // Give every accessible edge button its own real point on the curve.
      // A full diagonal path's bounding-box center is not a reliable click target.
      for (const bend of [initialBend, initialBend + 55, initialBend - 55, initialBend + 110, initialBend - 110, initialBend + 165, initialBend - 165, initialBend + 220, initialBend - 220, initialBend + 275, initialBend - 275, initialBend + 330, initialBend - 330]) {
        const route = {id: edge.id, from, to, control: {x: clamp(middle.x + direction.x * bend, 40, WIDTH - 40), y: clamp(middle.y + direction.y * bend, 40, HEIGHT - 65)}};
        for (const t of [.5, .43, .57, .36, .64, .29, .71, .22, .78, .15, .85]) {
          const point = curvePoint(route, t);
          const clearance = Math.min(...points.map(node => Math.hypot(point.x - node.x, point.y - node.y) - 44), ...anchors.map(anchor => Math.hypot(point.x - anchor.x, point.y - anchor.y) - 30));
          const candidate = {...route, point, clearance};
          if (!best || clearance > best.clearance) best = candidate;
          if (clearance >= 0) { best = candidate; break; }
        }
        if (best.clearance >= 0) break;
      }
      anchors.push(best.point);
      return {...best, d: `M ${from.x} ${from.y} Q ${best.control.x} ${best.control.y} ${to.x} ${to.y}`};
    });
  }

  function closestEdge(routes, point, tolerance = 10) {
    let chosen = null, distance = tolerance;
    for (const route of routes) {
      let start = route.from;
      for (let i = 1; i <= 40; i++) {
        const end = curvePoint(route, i / 40), dx = end.x - start.x, dy = end.y - start.y;
        const t = clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy || 1), 0, 1);
        const next = Math.hypot(point.x - start.x - t * dx, point.y - start.y - t * dy);
        if (next < distance - .01) { distance = next; chosen = route.id; }
        start = end;
      }
    }
    return chosen;
  }

  function create(host, data) {
    if (host.dataset.pcsMapReady) return null;
    const doc = host.ownerDocument, win = doc.defaultView, prefix = `pcs-map-${++serial}`;
    const element = (tag, className, text) => { const item = doc.createElement(tag); if (className) item.className = 'pcs-map-' + className; if (text !== undefined) item.textContent = text; return item; };
    const svgElement = (tag, attrs, text) => { const item = doc.createElementNS(NS, tag); for (const [name, value] of Object.entries(attrs || {})) item.setAttribute(name, String(value)); if (text !== undefined) item.textContent = text; return item; };
    const button = (text, callback, className = 'button') => { const item = element('button', className, text); item.type = 'button'; item.addEventListener('click', callback); return item; };
    const field = (label, input) => { const wrapper = element('label', 'field'), title = element('span', 'field-label', label); wrapper.append(title, input); return wrapper; };
    const select = (choices, callback) => { const input = element('select', 'select'); for (const [value, label] of choices) { const option = element('option', '', label); option.value = value; input.append(option); } input.addEventListener('change', callback); return input; };
    host.classList.add('pcs-map'); host.dataset.pcsMapReady = 'true';
    if (!data || !Array.isArray(data.themes) || !Array.isArray(data.records) || !data.themes.length) { host.append(element('p', 'empty', 'The fictional Map is unavailable. You can still explore the rest of this page.')); return null; }
    const lookup = new Map(data.themes.map(theme => [theme.id, theme]));
    const initialTheme = lookup.has('photography') ? 'photography' : data.themes[0].id;
    // Focus rings follows the selected theme without resetting the camera.
    // Keep its anchor separately so edge inspection and deselection retain it.
    let state = {selected: initialTheme, anchor: initialTheme, edge: null, layout: 'rings', compare: '', type: 'all', repeated: false, hidden: [], hiddenEdges: []};
    let percent = 60, listMode = false, tab = 'overview', past = [], future = [], positions = new Map(), graph, visible, layout;
    let box = {x: 0, y: 0, width: WIDTH, height: HEIGHT}, drag = null, moved = false;
    const overrides = new Map(), controls = {}, snapshot = () => JSON.stringify(state);
    // An arrangement belongs to its focused neighborhood. A theme dragged in
    // the outer ring must not carry that offset when it becomes the center.
    const positionKey = id => state.layout === 'rings' ? `rings:${state.anchor}:${id}` : `${state.layout}:${id}`;
    const announce = message => { status.textContent = message; };
    function change(mutator, message, resetView = true) { const before = snapshot(); mutator(); if (before !== snapshot()) { past.push(before); if (past.length > 60) past.shift(); future = []; } if (resetView) resetBox(); render(); if (message) announce(message); }
    function resetBox() { box = {x: 0, y: 0, width: WIDTH, height: HEIGHT}; applyBox(); }
    function applyBox() { svg.setAttribute('viewBox', `${box.x} ${box.y} ${box.width} ${box.height}`); }
    function zoom(factor, point = {x: box.x + box.width / 2, y: box.y + box.height / 2}) { const width = clamp(box.width * factor, 300, 2200), ratio = width / box.width; box = {x: point.x - (point.x - box.x) * ratio, y: point.y - (point.y - box.y) * ratio, width, height: box.height * ratio}; applyBox(); }
    function choose(id) {
      if (state.selected === id && !state.edge && !state.hidden.includes(id) && (state.layout !== 'rings' || state.anchor === id)) return;
      const reveal = !visible.nodes.some(node => node.id === id);
      const refocus = state.layout === 'rings';
      change(() => {
        state.selected = id; state.edge = null;
        if (refocus || reveal) {
          const newAnchor = state.anchor !== id; state.anchor = id;
          if (refocus && newAnchor) overrides.delete(positionKey(id));
        }
        state.hidden = state.hidden.filter(item => item !== id);
      }, `${lookup.get(id).label} ${refocus ? 'focused' : 'selected'}.`, reveal && !refocus);
    }
    function chooseEdge(id) { if (state.edge === id) return; change(() => { state.edge = id; }, 'Connection selected. Shared records and authored notes are in the details panel.', false); }
    function clearSelection() { change(() => { state.selected = ''; state.edge = null; }, 'Selection cleared. Choose a theme or connection to inspect its evidence.', false); }
    function navigate(back) { const source = back ? past : future, target = back ? future : past; if (!source.length) return; target.push(snapshot()); state = JSON.parse(source.pop()); resetBox(); render(); announce(back ? 'Previous view restored.' : 'Next view restored.'); }

    const header = element('div', 'header'), heading = element('div', 'heading');
    heading.append(element('p', 'eyebrow', 'Interactive website demo'), element('h3', 'title', `${data.person?.name || 'A fictional person'}’s continuity map`));
    const intro = element('p', 'intro', `Follow ${data.person?.name || 'one person'}’s work, home, and everyday plans. Select a theme to read the evidence.`);
    const about = element('details', 'about');
    about.append(element('summary', '', `About ${data.person?.name || 'this fictional person'}`), intro, element('p', '', data.person?.intro || 'This is a fictional collection of saved memories and notebooks.'));
    about.append(element('p', '', 'Colors distinguish the sample’s theme groups. They do not measure importance or certainty.'));
    const fullscreen = button('Full screen ↗', async () => {
      try { if (doc.fullscreenElement === host) await doc.exitFullscreen(); else if (host.requestFullscreen) await host.requestFullscreen(); else announce('Full screen is unavailable in this browser.'); }
      catch (_) { announce('This browser did not allow full screen. The Map is still available here.'); }
    });
    fullscreen.disabled = !host.requestFullscreen; fullscreen.title = fullscreen.disabled ? 'Full screen is unavailable in this browser' : 'Open this demo in full screen';
    header.append(heading, fullscreen); host.append(header, about);
    const toolbar = element('div', 'toolbar'), search = element('form', 'search');
    const searchInput = element('input', 'input'); searchInput.type = 'search'; searchInput.placeholder = 'Photography, home, work…'; searchInput.autocomplete = 'off'; searchInput.setAttribute('aria-label', 'Find a theme in this fictional Map');
    const searchResults = element('div', 'search-results'); searchResults.id = prefix + '-search'; searchInput.setAttribute('aria-controls', searchResults.id); searchResults.hidden = true;
    const find = button('Find', () => search.requestSubmit());
    search.append(field('Find a theme', searchInput), find, searchResults);
    function matches() { const query = searchInput.value.trim().toLocaleLowerCase(); return query ? graph.nodes.filter(theme => `${theme.label} ${theme.summary}`.toLocaleLowerCase().includes(query)).sort((a, b) => Number(b.label.toLocaleLowerCase() === query) - Number(a.label.toLocaleLowerCase() === query)) : []; }
    searchInput.addEventListener('input', () => { searchResults.replaceChildren(); const found = matches(); searchResults.hidden = !searchInput.value.trim(); for (const theme of found.slice(0, 6)) searchResults.append(button(theme.label, () => { choose(theme.id); searchResults.hidden = true; searchInput.value = theme.label; })); if (!found.length && searchInput.value.trim()) searchResults.append(element('p', 'muted', 'No matching themes. Try another word.')); });
    searchInput.addEventListener('keydown', event => { if (event.key === 'Escape') searchResults.hidden = true; });
    host.addEventListener('pointerdown', event => { if (!search.contains(event.target)) searchResults.hidden = true; });
    search.addEventListener('submit', event => { event.preventDefault(); const found = matches(); if (found.length) { choose(found[0].id); searchResults.hidden = true; } else announce('No matching theme. Try a name shown in the Map or List.'); });
    const type = select([['all', 'Memories & notebooks'], ['memory', 'Memories'], ['notebook', 'Notebooks']], () => change(() => { state.type = type.value; state.edge = null; }));
    controls.type = type; toolbar.append(search, field('Source type', type));
    const options = element('div', 'options'), repeated = element('input', 'checkbox'); repeated.type = 'checkbox'; repeated.addEventListener('change', () => change(() => { state.repeated = repeated.checked; state.edge = null; })); controls.repeated = repeated;
    const repeatLabel = element('label', 'check'); repeatLabel.append(repeated, doc.createTextNode('Repeated links only (2+ records)'));
    const dotted = element('input', 'range'); dotted.type = 'range'; dotted.min = '0'; dotted.max = '100'; dotted.step = '10'; dotted.value = '60'; dotted.setAttribute('aria-label', 'Target percentage of weakest connections drawn dotted');
    const dottedOutput = element('output', 'range-output', '60%'); dottedOutput.htmlFor = dotted.id = prefix + '-dotted';
    dotted.addEventListener('input', () => { percent = Number(dotted.value); dottedOutput.value = `${percent}%`; renderGraph(); });
    const rangeLabel = element('label', 'dotted'); rangeLabel.append(doc.createTextNode('Dotted connections'), dotted, dottedOutput);
    options.append(repeatLabel, rangeLabel);
    const filters = element('div', 'filters'); filters.append(toolbar, options); host.append(filters);
    const viewbar = element('div', 'viewbar'), layouts = select([['overview', 'Overview'], ['rings', 'Focus rings'], ['grid', 'Grid'], ['date', 'Saved-date'], ['compare', 'Compare']], () => change(() => { state.layout = layouts.value; state.anchor = state.selected || state.anchor; }));
    controls.layouts = layouts;
    const comparison = select([], () => change(() => { state.compare = comparison.value; state.edge = null; })), compareField = field('Compare with', comparison);
    const focus = button('Focus selected', () => change(() => { state.layout = 'rings'; state.anchor = state.selected; state.edge = null; overrides.delete(positionKey(state.selected)); }));
    const showAll = button('Show all', () => change(() => { state.layout = 'overview'; state.edge = null; }));
    const hide = button('Hide selected', () => change(() => { if (state.edge) { state.hiddenEdges.push(state.edge); state.edge = null; } else { state.hidden.push(state.selected); state.selected = ''; } }, 'Selection hidden in this demo. Its records are unchanged.'));
    const restore = button('Reset hidden', () => change(() => { state.hidden = []; state.hiddenEdges = []; }, 'Hidden themes and connections restored.'));
    const views = element('div', 'view-switch'); views.setAttribute('role', 'group'); views.setAttribute('aria-label', 'Map presentation');
    const graphView = button('Map', () => { listMode = false; render(); }), listView = button('List', () => { listMode = true; render(); }); views.append(graphView, listView);
    viewbar.append(field('Layout', layouts), compareField, focus, showAll, hide, restore, views); host.append(viewbar);
    const caption = element('p', 'caption'), legend = element('p', 'legend'); host.append(caption, legend);
    const workspace = element('div', 'workspace'), canvas = element('div', 'canvas'), stage = element('div', 'stage');
    const svg = svgElement('svg', {class: 'pcs-map-svg', viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: 'group', 'aria-label': 'Fictional continuity graph. Tab to themes, Enter to inspect; arrow keys move between themes.', tabindex: '0'});
    const graphTools = element('div', 'graph-tools');
    const zoomIn = button('+', () => zoom(.8)), zoomOut = button('−', () => zoom(1.25)), fit = button('Fit', () => { overrides.clear(); resetBox(); renderGraph(); announce('Layout and zoom reset.'); });
    zoomIn.setAttribute('aria-label', 'Zoom in'); zoomOut.setAttribute('aria-label', 'Zoom out'); fit.title = 'Reset zoom and dragged positions'; graphTools.append(zoomIn, zoomOut, fit);
    const history = element('nav', 'history'); history.setAttribute('aria-label', 'Map exploration history');
    const back = button('← Back', () => navigate(true)), forward = button('Forward →', () => navigate(false)); history.append(back, forward);
    stage.append(svg, graphTools, history);
    const list = element('div', 'list'); list.setAttribute('aria-label', 'Themes in the current view');
    const help = element('p', 'navigation-help', 'In Focus rings, select a theme to center its neighborhood without resetting pan or zoom. Drag the background to pan or a theme to arrange it. Scroll to zoom. Double-click empty space or press Escape to clear the selection. Tab to themes; Enter selects. Arrow keys move between themes. + / − zoom, 0 fits. List offers the same evidence.');
    canvas.append(stage, list, help);
    const inspector = element('aside', 'inspector'); inspector.setAttribute('aria-label', 'Selected theme or connection details');
    workspace.append(canvas, inspector); host.append(workspace);
    const status = element('p', 'status'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); status.setAttribute('aria-atomic', 'true');
    host.append(status, element('p', 'footnote', 'Fictional website demo · Everything here stays in this page. No AI request, account, upload, or change to a PCS vault. Counts show shared records, not certainty or importance.'));

    function recordCard(record, open = false) {
      const card = element('details', 'record'); card.open = open;
      const summary = element('summary', 'record-summary'); summary.append(element('span', 'record-meta', `${record.type === 'notebook' ? 'Notebook' : 'Memory'} · ${new Date(record.date + 'T12:00:00Z').toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC'})}`), element('strong', 'record-title', record.title));
      const body = element('div', 'record-body'); body.append(element('p', '', record.text));
      if (record.correction) { const correction = element('div', 'correction'); correction.append(element('strong', '', `${data.person?.name || 'Owner'}’s correction`), element('p', '', record.correction)); body.append(correction); }
      if (record.original) { const original = element('details', 'original'); const label = element('summary', '', record.type === 'notebook' ? 'Read the original note excerpt' : 'Read the original conversation excerpt'); original.append(label, element('blockquote', '', record.original)); body.append(original); }
      const themes = element('p', 'record-themes', record.themes.map(id => lookup.get(id)?.label).filter(Boolean).join(' · ')); body.append(themes); card.append(summary, body); return card;
    }
    function ownerNotes(edge) { return (data.connectionNotes || []).filter(note => edgeKey(note.from, note.to) === edge.id); }
    function noteCard(note) { const card = element('div', 'owner-note'); card.append(element('strong', '', `${data.person?.name || 'Owner'}’s connection note`), element('p', '', note.text)); return card; }
    function renderInspector() {
      const active = doc.activeElement, focusTab = active?.closest?.('.pcs-map-tab')?.dataset.tab;
      inspector.replaceChildren();
      const edge = visible.edges.find(item => item.id === state.edge), node = graph.nodes.find(item => item.id === state.selected) || (edge && graph.nodes.find(item => item.id === edge.from));
      if (!node) { inspector.append(element('h4', '', visible.nodes.length ? 'No selection' : 'No themes in this view'), element('p', 'muted', visible.nodes.length ? 'Select a theme or connection to inspect its evidence. The current layout stays in place.' : 'Choose another source type or reset hidden items to explore the fictional records.')); return; }
      const title = edge ? `${lookup.get(edge.from).label} + ${lookup.get(edge.to).label}` : node.label;
      const related = visible.edges.filter(item => item.from === node.id || item.to === node.id).sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
      const records = edge ? edge.records : node.records;
      inspector.append(element('p', 'eyebrow', edge ? 'Shared evidence' : 'Selected theme'), element('h4', 'inspector-title', title), element('p', 'inspector-count', edge ? `${plural(edge.count, 'shared record')}` : `${plural(node.count, 'record')} · ${plural(related.length, 'displayed connection')}`));
      if (edge) inspector.append(button('← Back to theme', () => change(() => { state.selected = node.id; state.edge = null; }, '', false)));
      const tabs = element('div', 'tabs'); tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', 'Evidence details');
      const panels = [['overview', 'Overview'], ['records', `Records (${records.length})`], ['connections', `Connections (${related.length})`]];
      const body = element('div', 'inspector-body'); body.id = prefix + '-panel'; body.setAttribute('role', 'tabpanel'); body.setAttribute('aria-labelledby', prefix + '-tab-' + tab); body.tabIndex = 0;
      for (const [id, label] of panels) {
        const item = button(label, () => { tab = id; renderInspector(); inspector.querySelector(`[data-tab="${id}"]`).focus(); }, 'tab'); item.id = prefix + '-tab-' + id; item.dataset.tab = id; item.setAttribute('role', 'tab'); item.setAttribute('aria-selected', String(tab === id)); item.setAttribute('aria-controls', body.id); item.tabIndex = tab === id ? 0 : -1;
        item.addEventListener('keydown', event => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return; event.preventDefault(); const index = panels.findIndex(panel => panel[0] === tab); tab = panels[event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + (event.key === 'ArrowRight' ? 1 : 2)) % 3][0]; renderInspector(); inspector.querySelector(`[data-tab="${tab}"]`).focus(); }); tabs.append(item);
      }
      inspector.append(tabs, body);
      if (tab === 'overview') {
        body.append(element('p', 'summary', edge ? `${plural(edge.count, 'record')} in this source filter mention both themes. This is a connection in the saved wording, not a conclusion about cause or importance.` : node.summary));
        if (edge) for (const note of ownerNotes(edge)) body.append(noteCard(note));
        else {
          const notes = (data.connectionNotes || []).filter(note => note.from === node.id || note.to === node.id);
          for (const note of notes) { const card = noteCard(note), other = note.from === node.id ? note.to : note.from; card.prepend(element('p', 'note-topic', `${node.label} + ${lookup.get(other)?.label || other}`)); body.append(card); }
        }
        body.append(element('h5', 'subheading', 'Start with the evidence'), recordCard(records[0], true));
        if (records.length > 1) body.append(button(`Read all ${records.length} records`, () => { tab = 'records'; renderInspector(); inspector.querySelector('[data-tab="records"]').focus(); }));
      } else if (tab === 'records') {
        body.append(element('p', 'muted', 'Current wording, original excerpts, and owner corrections are kept distinct. Open a record to read it.'));
        for (let i = 0; i < records.length; i++) body.append(recordCard(records[i], i === 0));
      } else {
        body.append(element('p', 'muted', 'Counts come from the same saved records appearing under both themes. Select a connection to inspect its evidence.'));
        if (!related.length) body.append(element('p', 'empty', 'No connections in this view. Try turning off Repeated links only or showing all themes.'));
        for (const connection of related) {
          const other = connection.from === node.id ? connection.to : connection.from;
          const item = button('', () => { tab = 'overview'; chooseEdge(connection.id); }, 'connection'); item.append(element('strong', '', lookup.get(other).label), element('span', 'connection-count', plural(connection.count, 'shared record')));
          for (const note of ownerNotes(connection)) item.append(element('span', 'connection-note', `${data.person?.name || 'Owner'}’s note: ${note.text}`)); body.append(item);
        }
      }
      if (focusTab) inspector.querySelector(`[data-tab="${focusTab}"]`)?.focus();
    }

    function renderGraph() {
      const activeId = doc.activeElement?.closest?.('[data-theme]')?.dataset.theme;
      const activeEdge = doc.activeElement?.closest?.('.pcs-map-edge-control')?.dataset.edge;
      const bounds = svg.getBoundingClientRect();
      const scale = Math.min((bounds.width || 1000) / WIDTH, (bounds.height || 700) / HEIGHT);
      const labelSize = clamp(12 / scale, 15, 52), countSize = clamp(11 / scale, 15, 48), lineHeight = Math.max(18, labelSize + 2);
      const dots = dottedConnections(visible.edges, percent);
      legend.textContent = `Dotted: weakest ${percent}% target, keeping equal counts together. Showing ${dots.count} of ${dots.total} connections dotted${dots.total ? ` (${Math.round(dots.count / dots.total * 100)}%)` : ''}. The rest are solid.`;
      svg.replaceChildren();
      layout = layoutGraph(visible, state.layout, state.anchor, state.compare); positions = layout.positions;
      for (const node of visible.nodes) { const movedPoint = overrides.get(positionKey(node.id)); if (movedPoint) positions.set(node.id, {...movedPoint}); }
      for (const heading of layout.headings) svg.append(svgElement('text', {x: heading.x, y: 55, class: 'pcs-map-date-heading', 'text-anchor': 'middle'}, `Week of ${heading.label}`));
      const routes = routeEdges(visible.edges, positions, state.anchor, state.layout), routeLookup = new Map(routes.map(route => [route.id, route])), edgeControls = [];
      for (const edge of visible.edges) {
        const route = routeLookup.get(edge.id), selected = edge.id === state.edge, related = edge.from === state.selected || edge.to === state.selected;
        const tone = toneClass(lookup.get(related ? state.selected : edge.from));
        const group = svgElement('g', {class: `pcs-map-edge ${tone}${selected ? ' pcs-map-edge-selected' : related ? ' pcs-map-edge-related' : ''}`, 'data-edge': edge.id});
        const line = svgElement('path', {d: route.d, class: 'pcs-map-edge-line', 'stroke-width': 1.1 + Math.min(2.6, Math.log2(edge.count + 1) * .75)});
        if (edge.count <= dots.cutoff) line.setAttribute('stroke-dasharray', '3 7');
        group.append(svgElement('path', {d: route.d, class: 'pcs-map-edge-hit'}), line); group.append(svgElement('title', {}, `${lookup.get(edge.from).label} + ${lookup.get(edge.to).label}: ${plural(edge.count, 'shared record')}`));
        group.addEventListener('click', event => {
          if (moved) return;
          const transform = svg.getScreenCTM(); if (!transform) return;
          const point = svg.createSVGPoint(); point.x = event.clientX; point.y = event.clientY;
          const id = closestEdge(routes, point.matrixTransform(transform.inverse()));
          if (id) chooseEdge(id);
        });
        const control = svgElement('g', {class: `pcs-map-edge-control ${tone}${selected || related ? ' pcs-map-edge-control-shown' : ''}`, transform: `translate(${route.point.x},${route.point.y})`, role: 'button', tabindex: '-1', 'aria-pressed': String(selected), 'aria-label': `${lookup.get(edge.from).label} and ${lookup.get(edge.to).label}: ${plural(edge.count, 'shared record')}`, 'data-edge': edge.id});
        control.append(svgElement('circle', {r: 13, class: 'pcs-map-edge-control-hit'}), svgElement('circle', {r: 9, class: 'pcs-map-edge-control-dot'}), svgElement('text', {y: 4, 'text-anchor': 'middle', class: 'pcs-map-edge-control-count'}, edge.count));
        control.addEventListener('click', event => { event.stopPropagation(); if (!moved) chooseEdge(edge.id); });
        control.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); chooseEdge(edge.id); } });
        group.addEventListener('pointerenter', () => control.classList.add('pcs-map-edge-control-hover'));
        group.addEventListener('pointerleave', () => control.classList.remove('pcs-map-edge-control-hover'));
        svg.append(group); edgeControls.push(control);
      }
      // Put the compact buttons above all paths, so crossing strokes cannot
      // capture a click intended for a named connection's selection target.
      svg.append(...edgeControls);
      for (const node of visible.nodes) {
        const point = positions.get(node.id), selected = node.id === state.selected, edgeSelected = visible.edges.find(edge => edge.id === state.edge), adjacent = edgeSelected && [edgeSelected.from, edgeSelected.to].includes(node.id);
        const group = svgElement('g', {class: `pcs-map-node ${toneClass(node)}${selected ? ' pcs-map-node-selected' : ''}${adjacent ? ' pcs-map-node-adjacent' : ''}`, transform: `translate(${point.x},${point.y})`, role: 'button', tabindex: '0', 'data-theme': node.id, 'aria-pressed': String(selected), 'aria-label': `${node.label}, ${plural(node.count, 'record')}. Inspect theme.`});
        const words = node.label.split(' '), lines = []; let line = '';
        for (const word of words) { if (line && (line + ' ' + word).length > 19) { lines.push(line); line = ''; } line += (line ? ' ' : '') + word; } if (line) lines.push(line);
        const halfLabel = Math.max(...lines.map(text => text.length * labelSize * .29), 35);
        const labelX = clamp(point.x, halfLabel + 10, WIDTH - halfLabel - 10) - point.x;
        const hitRadius = Math.max(27, 22 / scale);
        group.append(svgElement('circle', {r: hitRadius, class: 'pcs-map-node-hit'}));
        group.append(svgElement('circle', {r: 43, class: 'pcs-map-node-halo'}), svgElement('circle', {r: 37, class: 'pcs-map-node-ring'}));
        group.append(selected ? svgElement('path', {d: 'M 0 -34 L 10 -10 L 34 0 L 10 10 L 0 34 L -10 10 L -34 0 L -10 -10 Z', class: 'pcs-map-node-star'}) : svgElement('circle', {r: 24, class: 'pcs-map-node-dot'}));
        const countLabel = svgElement('text', {y: countSize * .34, 'text-anchor': 'middle', class: 'pcs-map-node-count'}, node.count); countLabel.style.fontSize = `${countSize}px`; group.append(countLabel);
        lines.forEach((text, i) => { const label = svgElement('text', {x: labelX, y: 53 + i * lineHeight, 'text-anchor': 'middle', class: 'pcs-map-node-label'}, text); label.style.fontSize = `${labelSize}px`; group.append(label); });
        group.addEventListener('click', () => { if (!moved) choose(node.id); });
        group.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(node.id); return; }
          if (!event.key.startsWith('Arrow')) return;
          event.preventDefault(); event.stopPropagation();
          const direction = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]}[event.key];
          const options = visible.nodes.filter(candidate => candidate.id !== node.id).map(candidate => { const p = positions.get(candidate.id), dx = p.x - point.x, dy = p.y - point.y, along = dx * direction[0] + dy * direction[1]; return {id: candidate.id, along, distance: Math.hypot(dx, dy) + Math.abs(dx * direction[1] - dy * direction[0])}; }).filter(candidate => candidate.along > 0).sort((a, b) => a.distance - b.distance);
          if (options.length) [...svg.querySelectorAll('[data-theme]')].find(item => item.dataset.theme === options[0].id)?.focus();
        }); svg.append(group);
      }
      if (!visible.nodes.length) svg.append(svgElement('text', {x: 500, y: 320, 'text-anchor': 'middle', class: 'pcs-map-empty-label'}, 'No themes in this view. Reset hidden items or change the source type.'));
      if (activeId) [...svg.querySelectorAll('[data-theme]')].find(item => item.dataset.theme === activeId)?.focus();
      if (activeEdge) [...svg.querySelectorAll('.pcs-map-edge-control')].find(item => item.dataset.edge === activeEdge)?.focus();
    }

    function render() {
      const activeListId = doc.activeElement?.dataset?.listTheme;
      searchResults.hidden = true;
      graph = deriveGraph(data, state.type);
      const eligible = graph.nodes.filter(node => !state.hidden.includes(node.id));
      if (state.selected && !eligible.some(node => node.id === state.selected)) { state.selected = ''; state.edge = null; }
      if (!eligible.some(node => node.id === state.anchor)) state.anchor = eligible.find(node => node.id === state.selected)?.id || eligible[0]?.id || '';
      if (!eligible.some(node => node.id === state.compare && node.id !== state.anchor)) state.compare = eligible.find(node => node.id !== state.anchor)?.id || '';
      visible = visibleGraph(graph, state);
      if (!visible.edges.some(edge => edge.id === state.edge)) state.edge = null;
      controls.type.value = state.type; controls.repeated.checked = state.repeated; controls.layouts.value = state.layout;
      comparison.replaceChildren(); for (const node of eligible) if (node.id !== state.anchor) { const option = element('option', '', node.label); option.value = node.id; comparison.append(option); } comparison.value = state.compare; compareField.hidden = state.layout !== 'compare';
      comparison.disabled = eligible.length < 2; focus.disabled = !state.selected; hide.disabled = !state.selected && !state.edge; restore.disabled = !state.hidden.length && !state.hiddenEdges.length;
      back.disabled = !past.length; forward.disabled = !future.length;
      graphView.setAttribute('aria-pressed', String(!listMode)); listView.setAttribute('aria-pressed', String(listMode));
      stage.hidden = listMode; list.hidden = !listMode; help.hidden = listMode;
      const explanation = state.layout === 'rings' && state.anchor ? `Focus rings show ${lookup.get(state.anchor).label} and its direct connections. Select another theme to follow its neighborhood; pan and zoom stay in place.` : state.layout === 'compare' && state.anchor ? `Compare shows ${lookup.get(state.anchor).label} and ${lookup.get(state.compare)?.label || 'another theme'} with their direct connections.` : state.layout === 'date' ? 'Saved-date groups themes by the latest record saved in this source filter, not when a thought began.' : 'Select a theme or connection to inspect its evidence.';
      caption.textContent = `${visible.nodes.length} of ${graph.nodes.length} themes · ${plural(visible.edges.length, 'connection')} · ${state.hidden.length + state.hiddenEdges.length} hidden. ${explanation}`;
      renderGraph(); list.replaceChildren();
      for (const node of visible.nodes) { const item = button('', () => choose(node.id), 'list-item'); item.classList.add(toneClass(node)); item.dataset.listTheme = node.id; item.setAttribute('aria-pressed', String(node.id === state.selected)); item.append(element('strong', '', node.label), element('span', 'muted', `${node.group} · ${plural(node.count, 'record')}`), element('span', '', node.summary)); list.append(item); }
      if (!visible.nodes.length) list.append(element('p', 'empty', 'No themes in this view. Reset hidden items or change the source type.'));
      renderInspector();
      if (activeListId) [...list.children].find(item => item.dataset.listTheme === activeListId)?.focus();
    }

    svg.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); clearSelection(); svg.focus({preventScroll: true}); return; }
      if (event.target !== svg && !['+', '=', '-', '0'].includes(event.key)) return;
      if (['+', '=', '-', '0', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.preventDefault();
      if (event.key === '+' || event.key === '=') zoom(.8); else if (event.key === '-') zoom(1.25); else if (event.key === '0') resetBox();
      else { const amount = box.width * .06; if (event.key === 'ArrowLeft') box.x -= amount; if (event.key === 'ArrowRight') box.x += amount; if (event.key === 'ArrowUp') box.y -= amount; if (event.key === 'ArrowDown') box.y += amount; applyBox(); }
    });
    svg.addEventListener('wheel', event => {
      // Preserve browser zoom and other modifier gestures. Only an ordinary
      // wheel movement belongs to the Map's zoom controls.
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      if (drag || !Number.isFinite(event.deltaY) || !event.deltaY) return;
      const transform = svg.getScreenCTM(); if (!transform) return;
      const point = svg.createSVGPoint(); point.x = event.clientX; point.y = event.clientY;
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? svg.getBoundingClientRect().height : 1;
      event.preventDefault();
      zoom(Math.exp(clamp(event.deltaY * unit, -240, 240) * .002), point.matrixTransform(transform.inverse()));
    }, {passive: false});
    svg.addEventListener('dblclick', event => {
      if (moved || event.target.closest?.('[data-theme], [data-edge]')) return;
      event.preventDefault(); clearSelection(); svg.focus({preventScroll: true});
    });
    svg.addEventListener('pointerdown', event => {
      if (event.button !== 0 || event.isPrimary === false) return;
      const node = event.target.closest?.('[data-theme]'), edge = event.target.closest?.('[data-edge]');
      if (edge && !node) return;
      const bounds = svg.getBoundingClientRect(); if (!bounds.width || !bounds.height) return;
      const scale = Math.min(bounds.width / box.width, bounds.height / box.height);
      drag = {id: node?.dataset.theme || null, x: event.clientX, y: event.clientY, box: {...box}, point: node ? {...positions.get(node.dataset.theme)} : null, scale}; moved = false;
    });
    svg.addEventListener('pointermove', event => {
      if (!drag) return;
      if (event.buttons === 0) { drag = null; return; }
      const dx = (event.clientX - drag.x) / drag.scale, dy = (event.clientY - drag.y) / drag.scale;
      if (!moved && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 5) return;
      // Do not retarget ordinary theme clicks to the SVG. Capture only once a
      // gesture has actually become a drag.
      if (!moved) svg.setPointerCapture?.(event.pointerId);
      moved = true;
      if (drag.id) { overrides.set(positionKey(drag.id), {x: clamp(drag.point.x + dx, 60, WIDTH - 60), y: clamp(drag.point.y + dy, 70, HEIGHT - 85)}); renderGraph(); }
      else { box.x = drag.box.x - dx; box.y = drag.box.y - dy; applyBox(); }
    });
    function stopDrag(event) { if (svg.hasPointerCapture?.(event.pointerId)) svg.releasePointerCapture(event.pointerId); drag = null; win.setTimeout(() => { moved = false; }, 0); }
    svg.addEventListener('pointerup', stopDrag); svg.addEventListener('pointercancel', stopDrag);
    svg.addEventListener('lostpointercapture', () => { drag = null; });
    doc.addEventListener('fullscreenchange', () => { fullscreen.textContent = doc.fullscreenElement === host ? 'Exit full screen ↙' : 'Full screen ↗'; });
    const pageHeader = doc.querySelector('.site-header');
    const measurePageHeader = () => host.style.setProperty('--pcs-map-header-height', `${pageHeader?.getBoundingClientRect().height || 0}px`);
    measurePageHeader();
    win.addEventListener('resize', measurePageHeader);
    render();
    if (win.ResizeObserver) {
      const observer = new win.ResizeObserver(() => { if (!listMode) renderGraph(); }); observer.observe(stage);
      if (pageHeader) { const headerObserver = new win.ResizeObserver(measurePageHeader); headerObserver.observe(pageHeader); }
    }
    return {render, getState: () => ({...state, hidden: [...state.hidden], hiddenEdges: [...state.hiddenEdges]})};
  }

  function mountAll(doc = root.document, data = root.PCS_MAP_DATA) { if (!doc) return []; return [...doc.querySelectorAll('[data-pcs-map]')].map(host => create(host, data)); }
  const api = {deriveGraph, dottedConnections, visibleGraph, layoutGraph, routeEdges, curvePoint, closestEdge, create, mountAll};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.PCSMapDemo = api;
  if (root.document) { if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', () => mountAll()); else mountAll(); }
})(typeof window !== 'undefined' ? window : globalThis);
