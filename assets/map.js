/* PCS website Map demo. Fictional local data; no network or saved app state. */
(function (root) {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const WIDTH = 1000, HEIGHT = 700;
  // Production's six Map tones, assigned to the demo's authored groups.
  // Keep assignments stable across filters, layouts and hidden themes.
  const groupTones = new Map([['Everyday', 0], ['Work', 1], ['Family', 2], ['Home', 3], ['Community', 4], ['Friends', 5], ['Plans', 1], ['Learning', 0]]);
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
    if (state.layout === 'constellations') {
      nodes = nodes.filter(node => node.group === state.cluster);
      const members = new Set(nodes.map(node => node.id));
      return {nodes, edges: edges.filter(edge => members.has(edge.from) && members.has(edge.to))};
    }
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

  function constellationGraph(graph, state = {}) {
    const visible = visibleGraph(graph, {...state, layout: 'overview'}), byId = new Map(visible.nodes.map(node => [node.id, node]));
    const groups = new Map(), links = new Map();
    for (const node of visible.nodes) {
      if (!groups.has(node.group)) groups.set(node.group, {id: node.group, group: node.group, label: node.group, themes: []});
      groups.get(node.group).themes.push(node);
    }
    for (const edge of visible.edges) {
      const from = byId.get(edge.from).group, to = byId.get(edge.to).group;
      if (from === to) continue;
      const id = edgeKey(from, to);
      if (!links.has(id)) { const [a, b] = [from, to].sort(); links.set(id, {id, from: a, to: b, edgeIds: [], records: new Map()}); }
      links.get(id).edgeIds.push(edge.id);
      for (const record of edge.records) links.get(id).records.set(record.id, record);
    }
    const order = [...groupTones.keys()];
    return {nodes: [...groups.values()].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id) || a.id.localeCompare(b.id)).map(group => ({...group, count: group.themes.length})),
      edges: [...links.values()].map(edge => ({...edge, count: edge.edgeIds.length, records: [...edge.records.values()].sort((a, b) => a.id.localeCompare(b.id))})).sort((a, b) => b.count - a.count || a.id.localeCompare(b.id))};
  }

  // As in PCS 0.9.114, bundles count theme links, not shared records.
  // A selected theme's links, or the selected link, remain individually visible.
  function connectionPresentation(graph, state, expanded = new Set()) {
    if (state.layout !== 'overview') return {edges: graph.edges, bundles: []};
    const groups = constellationGraph(graph), bundled = new Set(), bundles = [];
    for (const bridge of groups.edges) {
      const hidden = bridge.edgeIds.filter(id => {
        const edge = graph.edges.find(item => item.id === id);
        return state.edge ? id !== state.edge : ![edge.from, edge.to].includes(state.selected);
      });
      const open = expanded.has(bridge.id), count = open ? bridge.count : hidden.length;
      if (!count) continue;
      if (!open) for (const id of hidden) bundled.add(id);
      bundles.push({...bridge, count, expanded: open});
    }
    return {edges: graph.edges.filter(edge => !bundled.has(edge.id)), bundles};
  }

  function constellationLayout(groups) {
    const positions = new Map(), columns = Math.min(4, groups.length), rows = Math.ceil(groups.length / Math.max(1, columns));
    groups.forEach((group, index) => {
      const row = Math.floor(index / columns), inRow = Math.min(columns, groups.length - row * columns);
      positions.set(group.id, {x: WIDTH / 2 + (index % columns - (inRow - 1) / 2) * 240, y: rows === 1 ? 300 : 185 + row * 280});
    });
    return {positions, width: WIDTH, height: Math.max(HEIGHT, 185 + Math.max(0, rows - 1) * 280 + 155)};
  }

  function labelLines(value) {
    const words = String(value).split(/\s+/), lines = []; let line = '';
    for (const word of words) {
      if (line && (line + ' ' + word).length > 14) { lines.push(line); line = ''; }
      for (let start = 0; start < word.length; start += 14) {
        const part = word.slice(start, start + 14);
        if (start) { if (line) lines.push(line); line = part; }
        else line += (line ? ' ' : '') + part;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function layoutGraph(graph, mode, selected, compare) {
    const nodes = graph.nodes, positions = new Map(), headings = [];
    let width = WIDTH, height = HEIGHT, maximumLabelSize = 24;
    const cellWidth = 220, cellHeight = Math.max(160, 105 + Math.max(1, ...nodes.map(node => labelLines(node.label).length)) * 26);
    const bounds = (columns, rows, top = 100) => {
      width = Math.max(WIDTH, 260 + Math.max(0, columns - 1) * cellWidth);
      height = Math.max(HEIGHT, top + Math.max(0, rows - 1) * cellHeight + 155);
    };
    const result = () => ({positions, headings, width, height, labelSize: maximumLabelSize,
      labelMetrics: new Map(nodes.map(node => { const lines = labelLines(node.label); return [node.id, {
        halfWidth: Math.max(...lines.map(line => line.length * maximumLabelSize * .32), 35), top: 53 - maximumLabelSize, bottom: 59 + (lines.length - 1) * (maximumLabelSize + 2)}]; }))});
    if (!nodes.length) return result();
    if (mode === 'constellations') {
      const columns = Math.min(4, Math.ceil(Math.sqrt(nodes.length * 1.4))), rows = Math.ceil(nodes.length / columns);
      bounds(columns, rows);
      nodes.forEach((node, index) => {
        const row = Math.floor(index / columns), inRow = Math.min(columns, nodes.length - row * columns);
        positions.set(node.id, {x: width / 2 + (index % columns - (inRow - 1) / 2) * 235,
          y: rows === 1 ? 310 : rows === 2 ? 180 + row * 260 : 110 + row * Math.max(cellHeight, 450 / (rows - 1))});
      });
    } else if (mode === 'rings' && nodes.some(node => node.id === selected) && nodes.length <= 9) {
      positions.set(selected, {x: 500, y: 340});
      const others = nodes.filter(node => node.id !== selected);
      others.forEach((node, i) => { const angle = -Math.PI / 2 + i * Math.PI * 2 / others.length;
        positions.set(node.id, {x: 500 + Math.cos(angle) * 370, y: 330 + Math.sin(angle) * 225}); });
    } else if (mode === 'rings' && nodes.some(node => node.id === selected)) {
      // Rectangular rings reserve complete node-and-label cells. The compact
      // ellipse above stays unchanged for the ordinary small neighborhoods.
      const others = nodes.filter(node => node.id !== selected), slots = [];
      let ring = 0;
      while (slots.length < others.length) {
        ring++;
        const border = [];
        for (let row = -ring; row <= ring; row++) for (let column = -ring; column <= ring; column++) {
          if (Math.max(Math.abs(row), Math.abs(column)) === ring) border.push({column, row});
        }
        border.sort((a, b) => Math.atan2(a.row, a.column) - Math.atan2(b.row, b.column)); slots.push(...border);
      }
      bounds(ring * 2 + 1, ring * 2 + 1);
      const center = {x: width / 2, y: 100 + ring * cellHeight}; positions.set(selected, center);
      others.forEach((node, i) => positions.set(node.id, {x: center.x + slots[i].column * cellWidth, y: center.y + slots[i].row * cellHeight}));
    } else if (mode === 'date') {
      const groups = new Map();
      for (const node of nodes) {
        const date = new Date(node.date + 'T12:00:00Z');
        const day = Number.isFinite(date.getTime()) ? Math.floor(date.getTime() / 86400000) : 0;
        const week = day - ((day + 3) % 7);
        if (!groups.has(week)) groups.set(week, []); groups.get(week).push(node);
      }
      const ordered = [...groups].sort((a, b) => a[0] - b[0]);
      const rows = Math.max(3, Math.ceil(Math.sqrt(nodes.length / 1.7)));
      const columns = ordered.reduce((sum, [, group]) => sum + Math.ceil(group.length / rows), 0);
      bounds(columns, Math.min(rows, Math.max(...ordered.map(([, group]) => group.length))), 145);
      const xAt = column => width / 2 + (column - (columns - 1) / 2) * cellWidth;
      let offset = 0;
      ordered.forEach(([week, group]) => {
        const span = Math.ceil(group.length / rows);
        headings.push({x: (xAt(offset) + xAt(offset + span - 1)) / 2, label: new Date(week * 86400000).toLocaleDateString('en-US', {month: 'short', day: 'numeric', timeZone: 'UTC'})});
        group.forEach((node, i) => positions.set(node.id, {x: xAt(offset + Math.floor(i / rows)), y: 145 + (i % rows) * cellHeight}));
        offset += span;
      });
    } else if (mode === 'compare' && nodes.some(node => node.id === selected) && nodes.some(node => node.id === compare) && selected !== compare) {
      const left = new Set(), right = new Set();
      for (const edge of graph.edges) {
        if (edge.from === selected || edge.to === selected) left.add(edge.from === selected ? edge.to : edge.from);
        if (edge.from === compare || edge.to === compare) right.add(edge.from === compare ? edge.to : edge.from);
      }
      const groups = [[], [], []];
      for (const node of nodes) if (node.id !== selected && node.id !== compare) groups[left.has(node.id) && right.has(node.id) ? 1 : left.has(node.id) ? 0 : 2].push(node);
      const rows = Math.max(3, Math.ceil(Math.sqrt(nodes.length / 1.7)));
      const spans = groups.map(group => Math.max(1, Math.ceil(group.length / rows))), columns = spans.reduce((a, b) => a + b, 0) + 2;
      bounds(columns, Math.min(rows, Math.max(1, ...groups.map(group => group.length))), 270);
      const starts = [0, spans[0] + 1, spans[0] + spans[1] + 2];
      const xAt = column => width / 2 + (column - (columns - 1) / 2) * cellWidth;
      positions.set(selected, {x: xAt((spans[0] - 1) / 2), y: 95});
      positions.set(compare, {x: xAt(starts[2] + (spans[2] - 1) / 2), y: 95});
      groups.forEach((group, column) => {
        group.forEach((node, i) => {
          positions.set(node.id, {x: xAt(starts[column] + Math.floor(i / rows)), y: 270 + (i % rows) * cellHeight});
        });
      });
    } else if (mode === 'overview') {
      // The full web is an authored starfield: stable, separated constellations
      // with an asymmetric local pattern, rather than sixty alphabetical cells.
      const order = [...groupTones.keys()], groups = [...new Set(nodes.map(node => node.group))].sort((a, b) => order.indexOf(a) - order.indexOf(b) || a.localeCompare(b));
      const slots = [[-60, -15], [15, -230], [205, 55], [-240, -175], [-330, 30], [270, -170], [90, 285], [-190, 245], [350, 250], [-410, 230]];
      const centers = [[520, 420], [1490, 340], [2470, 420], [3420, 370], [520, 1160], [1490, 1260], [2470, 1160], [3420, 1230]];
      width = 3920; height = Math.max(1650, Math.ceil(groups.length / 4) * 840); maximumLabelSize = 18;
      groups.forEach((group, index) => {
        const center = centers[index] || [520 + (index % 4) * 970, 420 + Math.floor(index / 4) * 840];
        const members = nodes.filter(node => node.group === group).sort((a, b) => (b.count || 0) - (a.count || 0) || a.label.localeCompare(b.label));
        headings.push({kind: 'group', x: center[0], y: center[1] - 265, label: group});
        members.forEach((node, i) => {
          const slot = slots[i] || [-410 + (i % 4) * 240, 480 + Math.floor((i - slots.length) / 4) * 170];
          positions.set(node.id, {x: center[0] + slot[0] * .8 * (index % 2 ? -1 : 1), y: center[1] + slot[1] * .8});
        });
      });
    } else {
      const columns = Math.ceil(Math.sqrt(nodes.length * 1.7)), rows = Math.ceil(nodes.length / columns);
      bounds(columns, rows);
      // Overview keeps authored groups together along a serpentine path. Grid
      // uses label order. Both reserve enough space for complete wrapped labels,
      // without a force simulation compressing sixty themes into a fixed box.
      const ordered = mode === 'grid' ? nodes : [...nodes].sort((a, b) => a.group.localeCompare(b.group) || a.label.localeCompare(b.label));
      ordered.forEach((node, i) => {
        const row = Math.floor(i / columns), column = mode !== 'grid' && row % 2 ? columns - 1 - i % columns : i % columns;
        positions.set(node.id, {x: width / 2 + (column - (columns - 1) / 2) * cellWidth, y: 100 + row * cellHeight});
      });
    }
    return result();
  }

  function curvePoint(route, t) {
    const u = 1 - t;
    return {x: u * u * route.from.x + 2 * u * t * route.control.x + t * t * route.to.x,
      y: u * u * route.from.y + 2 * u * t * route.control.y + t * t * route.to.y};
  }

  function routeEdges(edges, positions, selected, mode, bounds = {}) {
    const anchors = [], points = [...positions.values()];
    const width = bounds.width || Math.max(WIDTH, ...points.map(point => point.x + 130));
    const height = bounds.height || Math.max(HEIGHT, ...points.map(point => point.y + 155));
    const center = positions.get(selected) || {x: width / 2, y: height / 2};
    const labelBoxes = [...positions].map(([id, point]) => {
      const label = bounds.labelMetrics?.get(id); return label ? {left: point.x - label.halfWidth, right: point.x + label.halfWidth, top: point.y + label.top, bottom: point.y + label.bottom} : null;
    }).filter(Boolean);
    const clearanceAt = point => Math.min(
      ...points.map(node => Math.hypot(point.x - node.x, point.y - node.y) - (bounds.nodeClearance || 58)),
      ...labelBoxes.map(label => Math.hypot(Math.max(label.left - point.x, 0, point.x - label.right), Math.max(label.top - point.y, 0, point.y - label.bottom)) - 16),
      ...anchors.map(anchor => Math.hypot(point.x - anchor.x, point.y - anchor.y) - (bounds.anchorClearance || 30)));
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
        const route = {id: edge.id, from, to, control: {x: clamp(middle.x + direction.x * bend, 40, width - 40), y: clamp(middle.y + direction.y * bend, 40, height - 65)}};
        for (const t of [.5, .43, .57, .36, .64, .29, .71, .22, .78, .15, .85]) {
          const point = curvePoint(route, t);
          const clearance = clearanceAt(point);
          const candidate = {...route, point, clearance};
          if (!best || clearance > best.clearance) best = candidate;
          if (clearance >= 0) { best = candidate; break; }
        }
        if (best.clearance >= 0) break;
      }
      if (best.clearance < 0) {
        // Dense crossing groups occasionally exhaust bends on one axis. Try a
        // fixed two-dimensional control lattice, never an unbounded search.
        const controls = [];
        for (let row = 0; row <= 12; row++) for (let column = 0; column <= 16; column++) controls.push({x: 40 + column * (width - 80) / 16, y: 40 + row * (height - 105) / 12});
        controls.sort((a, b) => Math.hypot(a.x - middle.x, a.y - middle.y) - Math.hypot(b.x - middle.x, b.y - middle.y));
        search: for (const control of controls) for (const t of [.5, .35, .65]) {
          const route = {id: edge.id, from, to, control}, point = curvePoint(route, t), clearance = clearanceAt(point);
          if (clearance > best.clearance) best = {...route, point, clearance};
          if (clearance >= 0) break search;
        }
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

  // Only an explicit Keep changes this page-local reading progress. Opening a
  // passage, exploring the graph and skipping to the ending never count it.
  function createStoryJourney(story) {
    const clues = story?.clues || [], required = new Set(clues.flatMap(clue => clue.records)), kept = new Set();
    return {
      has: id => kept.has(id),
      keep(id) { if (!required.has(id) || kept.has(id)) return false; kept.add(id); return true; },
      reset() { kept.clear(); },
      progress() {
        const threads = clues.map(clue => ({id: clue.id, kept: clue.records.filter(id => kept.has(id)).length, total: clue.records.length,
          complete: clue.records.every(id => kept.has(id))}));
        return {kept: kept.size, total: required.size, threads, complete: required.size > 0 && kept.size === required.size};
      },
      next(clueId) {
        const start = Math.max(0, clues.findIndex(clue => clue.id === clueId));
        for (let offset = 0; offset < clues.length; offset++) {
          const clue = clues[(start + offset) % clues.length], record = clue.records.find(id => !kept.has(id));
          if (record) return {clueId: clue.id, recordId: record};
        }
        return null;
      }
    };
  }

  function create(host, data) {
    if (host.dataset.pcsMapReady) return null;
    const doc = host.ownerDocument, win = doc.defaultView, prefix = `pcs-map-${++serial}`;
    const element = (tag, className, text) => { const item = doc.createElement(tag); if (className) item.className = 'pcs-map-' + className; if (text !== undefined) item.textContent = text; return item; };
    const svgElement = (tag, attrs, text) => { const item = doc.createElementNS(NS, tag); for (const [name, value] of Object.entries(attrs || {})) item.setAttribute(name, String(value)); if (text !== undefined) item.textContent = text; return item; };
    const button = (text, callback, className = 'button') => { const item = element('button', className, text); item.type = 'button'; item.addEventListener('click', callback); return item; };
    const field = (label, input) => { const wrapper = element('label', 'field'), title = element('span', 'field-label', label); wrapper.append(title, input); return wrapper; };
    host.classList.add('pcs-map'); host.dataset.pcsMapReady = 'true';
    if (!data || !Array.isArray(data.themes) || !Array.isArray(data.records) || !data.themes.length) { host.append(element('p', 'empty', 'The fictional Map is unavailable. You can still explore the rest of this page.')); return null; }
    const lookup = new Map(data.themes.map(theme => [theme.id, theme]));
    const story = data.story, journey = createStoryJourney(story);
    const storyRecords = new Set((story?.clues || []).flatMap(clue => clue.records));
    const initialTheme = story?.clues?.[0]?.theme || data.themes[0].id;
    let storyStep = null, storyEnding = false, storyStarted = false, storyRecord = null, lastStoryStep = null;
    let updateStoryReading = null;
    // Focus rings follows the selected theme without resetting the camera.
    // Keep its anchor separately so edge inspection and deselection retain it.
    let state = {selected: initialTheme, anchor: initialTheme, edge: null, layout: 'rings', cluster: '', compare: '', type: 'all', repeated: false, hidden: [], hiddenEdges: []};
    const percent = 60;
    let listMode = false, tab = 'overview', past = [], future = [], positions = new Map(), graph, visible, layout, constellations;
    let box = {x: 0, y: 0, width: WIDTH, height: HEIGHT}, drag = null, moved = false, hoveredTheme = '', focusedTheme = '';
    const overrides = new Map(), snapshot = () => JSON.stringify(state);
    const expandedBundles = new Set(), landmarks = new Map(), landmarkDrafts = new Map(), discovered = new Set();
    let discoveryEdge = null, landmarkCompose = null;
    // An arrangement belongs to its focused neighborhood. A theme dragged in
    // the outer ring must not carry that offset when it becomes the center.
    const positionKey = id => state.layout === 'rings' ? `rings:${state.anchor}:${id}` : `${state.layout}:${id}`;
    const announce = message => { status.textContent = message; };
    function change(mutator, message, resetView = true, keepStory = false) { if (!keepStory) { storyStep = null; storyEnding = false; } const before = snapshot(); mutator(); if (before !== snapshot()) { past.push(before); if (past.length > 60) past.shift(); future = []; } if (resetView) resetBox(); render(); if (message) announce(message); }
    function resetBox() {
      const current = deriveGraph(data, state.type), projected = visibleGraph(current, state);
      const fitted = state.layout === 'constellations' && !state.cluster ? constellationLayout(constellationGraph(current, state).nodes) : layoutGraph(projected, state.layout, state.anchor, state.compare);
      box = {x: 0, y: 0, width: fitted.width, height: fitted.height}; applyBox();
    }
    function applyBox() {
      svg.setAttribute('viewBox', `${box.x} ${box.y} ${box.width} ${box.height}`);
      if (state.layout === 'overview' && box.width > (layout?.width || WIDTH) * .7) svg.classList.add('pcs-map-full-web');
      else svg.classList.remove('pcs-map-full-web');
      updateActiveLabel();
    }
    function updateActiveLabel() {
      const bounds = svg.getBoundingClientRect(), width = bounds.width || WIDTH, height = bounds.height || HEIGHT;
      const scale = Math.min(width / box.width, height / box.height);
      const needsLabel = state.layout === 'overview' && (layout?.labelSize || 18) * scale < 11;
      if (needsLabel) svg.classList.add('pcs-map-overlay-labels'); else svg.classList.remove('pcs-map-overlay-labels');
      const id = hoveredTheme || focusedTheme || state.selected, point = positions.get(id), node = lookup.get(id);
      activeLabel.hidden = !needsLabel || !point || !node;
      if (activeLabel.hidden) return;
      const x = (width - box.width * scale) / 2 + (point.x - box.x) * scale;
      const y = (height - box.height * scale) / 2 + (point.y - box.y) * scale;
      if (x < 0 || x > width || y < 0 || y > height) { activeLabel.hidden = true; return; }
      const labelWidth = Math.min(240, Math.max(60, node.label.length * 7.2 + 20), Math.max(40, width - 16));
      activeLabel.textContent = node.label;
      activeLabel.style.width = `${labelWidth}px`;
      activeLabel.style.left = `${clamp(x, labelWidth / 2 + 8, width - labelWidth / 2 - 8)}px`;
      activeLabel.style.top = `${clamp(y + 15, 8, height - 42)}px`;
    }
    function zoom(factor, point = {x: box.x + box.width / 2, y: box.y + box.height / 2}) { const width = clamp(box.width * factor, 300, Math.max(2200, (layout?.width || WIDTH) * 2.2)), ratio = width / box.width; box = {x: point.x - (point.x - box.x) * ratio, y: point.y - (point.y - box.y) * ratio, width, height: box.height * ratio}; applyBox(); }
    function choose(id) {
      const leavingStory = storyStep || storyEnding; storyStep = null; storyEnding = false;
      if (!leavingStory && state.selected === id && !state.edge && !state.hidden.includes(id) && (state.layout !== 'rings' || state.anchor === id)) return;
      const reveal = !visible.nodes.some(node => node.id === id);
      const refocus = state.layout === 'rings';
      change(() => {
        state.selected = id; state.edge = null;
        if (state.layout === 'constellations') state.cluster = lookup.get(id).group;
        if (refocus || reveal) {
          const newAnchor = state.anchor !== id; state.anchor = id;
          if (refocus && newAnchor) overrides.delete(positionKey(id));
        }
        state.hidden = state.hidden.filter(item => item !== id);
      }, `${lookup.get(id).label} ${refocus ? 'focused' : 'selected'}.`, reveal && !refocus);
    }
    function openCluster(group) {
      change(() => { state.layout = 'constellations'; state.cluster = group; state.selected = ''; state.edge = null; }, `${group || 'All constellations'}. Choose a theme to inspect its evidence.`);
      const target = group ? svg.querySelector('[data-theme]') : svg.querySelector('[data-cluster]');
      (listMode ? list.querySelector('button') : target)?.focus({preventScroll: true});
    }
    function chooseEdge(id) {
      if (state.edge === id && !storyStep && !storyEnding) return;
      storyStep = null; storyEnding = false;
      const edge = graph.edges.find(item => item.id === id); if (!edge) return;
      const outside = !visible.edges.some(item => item.id === id);
      change(() => {
        if (outside) { state.layout = 'rings'; state.anchor = state.selected && [edge.from, edge.to].includes(state.selected) ? state.selected : edge.from; }
        if (![edge.from, edge.to].includes(state.selected)) state.selected = edge.from;
        state.edge = id;
      }, `${lookup.get(edge.from).label} and ${lookup.get(edge.to).label} focused. Their connections are highlighted; shared records are in the details panel.`, outside);
    }
    function clearSelection() { storyStep = null; storyEnding = false; change(() => { state.selected = ''; state.edge = null; }, 'Selection cleared. Choose a theme or connection to inspect its evidence.', false); }
    function navigate(back) { const source = back ? past : future, target = back ? future : past; if (!source.length) return; storyStep = null; storyEnding = false; target.push(snapshot()); state = JSON.parse(source.pop()); resetBox(); render(); announce(back ? 'Previous view restored.' : 'Next view restored.'); }

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
    header.append(heading, fullscreen); host.append(header);
    const storyPanel = element('section', 'story'), storyProgress = element('p', 'story-progress');
    const storyGuide = element('details', 'story-guide');
    const storySteps = new Map();
    const endingButton = button('Read the ending', () => openStoryEnding(false));
    const startStory = button('Start story', resumeStory);
    startStory.classList.add('pcs-map-story-primary');
    const endingHint = element('p', 'story-instruction');
    function updateStoryProgress() {
      if (!story) return;
      const progress = journey.progress();
      storyProgress.textContent = `${progress.kept} of ${progress.total} passages kept${progress.complete ? ' · Story complete' : ''}`;
      endingButton.disabled = !progress.complete;
      endingHint.textContent = progress.complete ? 'You have kept all eight passages. The ending is ready.'
        : 'No puzzle to solve: the story takes you through every passage in order. You can also skip ahead to the ending.';
      startStory.textContent = progress.complete ? 'Read the ending' : storyStarted || progress.kept ? 'Resume story' : 'Start story';
      for (const [index, clue] of story.clues.entries()) {
        const control = storySteps.get(clue.id);
        if (control) {
          const thread = progress.threads[index];
          control.count.textContent = `${thread.kept} of ${thread.total} passages kept${thread.complete ? ' · Complete' : ''}`;
          control.button.setAttribute('aria-current', storyStep === clue.id ? 'step' : 'false');
        }
      }
      updateStoryReading?.();
    }
    function resumeStory() {
      if (journey.progress().complete) { openStoryEnding(false); return; }
      const next = journey.next(lastStoryStep);
      exploreStory(story.clues.find(clue => clue.id === next?.clueId) || story.clues[0], next?.recordId);
    }
    function exploreStory(clue, recordId) {
      storyGuide.open = false;
      storyStarted = true; storyStep = clue.id; lastStoryStep = clue.id; storyEnding = false;
      storyRecord = recordId || clue.records.find(id => !journey.has(id)) || clue.records[0];
      change(() => { state.type = 'all'; state.repeated = false; state.hidden = []; state.hiddenEdges = []; state.layout = 'rings'; state.cluster = lookup.get(clue.theme).group; state.selected = clue.theme; state.anchor = clue.theme; state.edge = null; },
        `${clue.label}. Passage ${story.clues.flatMap(item => item.records).indexOf(storyRecord) + 1} of ${journey.progress().total} is open. Read it, then use the Keep and continue button below the passage.`, true, true);
      focusStoryInspector();
    }
    function focusStoryInspector() {
      inspector.focus({preventScroll: true});
      if (win.matchMedia?.('(max-width: 800px)').matches) inspector.scrollIntoView({block: 'start'});
      else host.scrollIntoView({block: 'start'});
    }
    function exploreFreely(connections = false) {
      storyStep = null; storyEnding = false;
      change(() => { if (connections) { state.layout = 'overview'; state.edge = null; } }, 'Explore freely. Your kept passages remain on this page; choose Resume story to return.', connections);
      (listMode ? list.querySelector('button') : svg).focus({preventScroll: true});
      if (win.matchMedia?.('(max-width: 800px)').matches) canvas.scrollIntoView({block: 'start'});
      else host.scrollIntoView({block: 'start'});
    }
    function openStoryEnding(skipped) {
      if (!story || (!skipped && !journey.progress().complete)) return;
      storyGuide.open = false;
      storyStep = null; storyEnding = true; renderInspector();
      announce(skipped ? 'The ending is open. You can return to its supporting passages at any time.' : 'All three threads connect. Read what Mara did next.');
      focusStoryInspector();
    }
    if (story?.clues?.length) {
      const title = element('h4', 'story-title', 'Follow Mara’s story'); title.id = prefix + '-story-title';
      storyPanel.setAttribute('aria-labelledby', title.id);
      const steps = element('ol', 'story-steps');
      const options = element('div', 'story-actions');
      for (const [index, clue] of story.clues.entries()) {
        const step = button('', () => exploreStory(clue)), count = element('span', 'story-step-count'), item = element('li', 'story-step');
        step.dataset.storyStep = clue.id;
        step.append(element('span', 'story-step-title', `${index + 1}. ${clue.label}`), count);
        storySteps.set(clue.id, {button: step, count}); item.append(step); steps.append(item);
      }
      options.append(startStory, button('Explore freely', () => exploreFreely()));
      const summary = element('div', 'story-summary');
      summary.append(title, element('p', 'story-question', 'How did an old idea find a place in Mara’s life? Read eight short passages to see the connection.'));
      const guideSummary = element('summary', 'story-guide-toggle', 'Story guide');
      const endingActions = element('div', 'story-actions');
      endingActions.append(endingButton, button('Skip to the ending', () => openStoryEnding(true), 'story-skip'));
      storyGuide.append(guideSummary,
        element('p', 'story-instruction', '1. Start story. 2. Read the passage, then choose Keep & continue. 3. After passage 8, read the ending. The map follows along automatically; you do not need to find anything.'),
        steps, endingHint, endingActions,
        element('p', 'story-instruction', 'Keep marks a passage as read for this demo. Opening it alone does not count. Your progress stays on this page and resets when you leave or reload.'));
      storyPanel.append(summary, options, storyProgress, storyGuide);
      host.append(storyPanel); updateStoryProgress();
    }
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
    toolbar.append(search); host.append(toolbar);
    const showAll = button('← All constellations', () => openCluster('')), clusterCaption = element('span', 'cluster-caption');
    const views = element('div', 'view-switch'); views.setAttribute('role', 'group'); views.setAttribute('aria-label', 'Map presentation');
    const graphView = button('Map', () => { listMode = false; render(); }), listView = button('List', () => { listMode = true; render(); }); views.append(graphView, listView);
    const navigation = element('div', 'constellation-navigation'); navigation.append(views); host.append(navigation);
    const primaryViews = element('div', 'primary-views'); primaryViews.setAttribute('role', 'group'); primaryViews.setAttribute('aria-label', 'Explore the Map');
    const focusView = button('Focus', () => {
      if (!state.selected && story?.clues?.length) { exploreStory(story.clues[0]); return; }
      change(() => { state.layout = 'rings'; state.anchor = state.selected || state.anchor; state.edge = null; }, 'Focus shows one theme and its direct connections.', true, true);
    });
    const constellationView = button('Constellations', () => change(() => { state.layout = 'constellations'; state.cluster = ''; state.selected = ''; state.edge = null; }, 'Open a constellation to explore its themes.', true, true));
    const connectionsView = button('Connections', () => change(() => { state.layout = 'overview'; state.edge = null; }, 'The full web shows all themes. Select a thread to focus both themes and their connections.', true, true));
    primaryViews.append(focusView, constellationView, connectionsView); navigation.prepend(primaryViews);
    toolbar.prepend(navigation);
    const caption = element('p', 'caption'), legend = element('p', 'legend');
    const contextBar = element('div', 'context-bar'); contextBar.append(showAll, clusterCaption, caption); host.append(contextBar);
    const bundleReset = button('Bundle all again', () => { expandedBundles.clear(); render(); announce('Links between constellations are bundled again. Selected evidence stays visible.'); });
    contextBar.append(bundleReset);
    const discoveryPanel = element('section', 'discovery'); discoveryPanel.setAttribute('aria-label', 'Discover and revisit a connection'); host.append(discoveryPanel);
    const workspace = element('div', 'workspace'), canvas = element('div', 'canvas'), stage = element('div', 'stage');
    const svg = svgElement('svg', {class: 'pcs-map-svg', viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: 'group', 'aria-label': 'Fictional continuity graph. Tab to themes, Enter to inspect; arrow keys move between themes.', tabindex: '0'});
    const activeLabel = element('div', 'active-label'); activeLabel.hidden = true; activeLabel.style.fontSize = '13px'; activeLabel.setAttribute('aria-hidden', 'true');
    const graphTools = element('div', 'graph-tools');
    const zoomIn = button('+', () => zoom(.8)), zoomOut = button('−', () => zoom(1.25)), fit = button('Fit', () => { overrides.clear(); resetBox(); renderGraph(); announce('Layout and zoom reset.'); });
    zoomIn.setAttribute('aria-label', 'Zoom in'); zoomOut.setAttribute('aria-label', 'Zoom out'); fit.title = 'Reset zoom and dragged positions'; graphTools.append(zoomIn, zoomOut, fit, button('Clear selection', clearSelection));
    const history = element('nav', 'history'); history.setAttribute('aria-label', 'Map exploration history');
    const back = button('← Back', () => navigate(true)), forward = button('Forward →', () => navigate(false)); history.append(back, forward);
    stage.append(svg, activeLabel, graphTools, history);
    const list = element('div', 'list'); list.setAttribute('aria-label', 'Themes in the current view');
    const help = element('p', 'navigation-help', 'In Focus rings, select a theme to center its neighborhood without resetting pan or zoom. Drag the background to pan or a theme to arrange it. Scroll to zoom. Double-click empty space or press Escape to clear the selection. Tab to themes; Enter selects. Arrow keys move between themes. + / − zoom, 0 fits. List offers the same evidence.');
    canvas.append(stage, list);
    const inspector = element('aside', 'inspector'); inspector.setAttribute('aria-label', 'Selected theme or connection details'); inspector.tabIndex = -1;
    workspace.append(canvas, inspector); host.append(workspace);
    const status = element('p', 'status'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); status.setAttribute('aria-atomic', 'true');
    const mapHelp = element('details', 'help');
    mapHelp.append(element('summary', '', 'How to explore the map'), help, legend, about);
    host.append(status, mapHelp, element('p', 'footnote', 'Fictional demo · No AI requests or uploads. Story progress, arrangements and your demo landmarks stay only on this page and reset on reload. Nothing is saved to PCS. Individual lines count shared records; bundles count theme links. Neither establishes cause or importance.'));

    function toggleBundle(id) {
      expandedBundles.has(id) ? expandedBundles.delete(id) : expandedBundles.add(id);
      render();
      const selector = listMode ? '[data-list-bundle]' : '[data-bundle]';
      [...host.querySelectorAll(selector)].find(item => (item.dataset.bundle || item.dataset.listBundle) === id)?.focus({preventScroll: true});
      announce(`${id.split('|').join(' and ')}: ${expandedBundles.has(id) ? 'individual links shown' : 'links bundled again'}. Counts describe theme links, not records.`);
    }
    function discoverNext() {
      const candidates = visibleGraph(graph, {...state, layout: 'overview'}).edges
        .filter(edge => !discovered.has(edge.id) && !edge.records.some(record => record.id === story?.epilogueRecord))
        .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
      if (!candidates.length) { announce('You have explored the available demo connections. Continue freely or revisit a landmark.'); return; }
      const edge = candidates[0]; discovered.add(edge.id); discoveryEdge = edge.id; landmarkCompose = null; tab = 'overview';
      chooseEdge(edge.id); renderDiscovery(); renderInspector();
      inspector.focus({preventScroll: true});
    }
    function composeLandmark(id) {
      landmarkCompose = id; tab = 'overview'; renderInspector();
      inspector.querySelector('[data-landmark-input]')?.focus({preventScroll: true});
    }
    function renderDiscovery() {
      const active = doc.activeElement?.dataset?.discoveryAction;
      discoveryPanel.replaceChildren();
      const intro = element('div', 'discovery-intro');
      intro.append(element('strong', '', 'Find something worth returning to'), element('p', 'muted', 'Inspect a connection, then try a landmark in your own words. Demo notes last only for this visit.'));
      const actions = element('div', 'discovery-actions');
      const next = button(discoveryEdge ? 'Try another connection' : 'Discover a connection', discoverNext); next.dataset.discoveryAction = 'next'; actions.append(next);
      if (discoveryEdge) {
        const current = state.edge === discoveryEdge;
        const inspect = button('Read its records', () => { tab = 'records'; chooseEdge(discoveryEdge); renderInspector(); inspector.focus({preventScroll: true}); }); inspect.dataset.discoveryAction = 'inspect';
        const leave = button('Leave a landmark', () => composeLandmark(discoveryEdge)); leave.disabled = !current; leave.dataset.discoveryAction = 'leave';
        const finish = button('Finish exploring', () => { discoveryEdge = null; landmarkCompose = null; renderDiscovery(); renderInspector(); announce('Continue exploring freely. Your demo landmarks remain available on this page.'); }); finish.dataset.discoveryAction = 'finish';
        actions.append(inspect, leave, finish);
      }
      discoveryPanel.append(intro, actions);
      if (landmarks.size) {
        const saved = element('div', 'landmarks'); saved.append(element('strong', '', 'Your demo landmarks'));
        for (const [id, text] of landmarks) {
          const item = button(text.split('\n')[0].slice(0, 70), () => { discoveryEdge = null; tab = 'overview'; chooseEdge(id); renderDiscovery(); renderInspector(); inspector.focus({preventScroll: true}); }, 'landmark-chip');
          item.dataset.landmark = id; saved.append(item);
        }
        discoveryPanel.append(saved);
      }
      if (active) discoveryPanel.querySelector(`[data-discovery-action="${active}"]`)?.focus({preventScroll: true});
    }
    function landmarkEditor(edge, body) {
      const section = element('section', 'landmark-editor'); section.append(element('h5', 'subheading', 'Your demo landmark'));
      if (landmarks.has(edge.id)) section.append(element('p', 'landmark-text', landmarks.get(edge.id)));
      if (landmarkCompose !== edge.id) {
        section.append(button(landmarks.has(edge.id) ? 'Edit your landmark' : 'Leave a landmark', () => composeLandmark(edge.id))); body.append(section); return;
      }
      const input = element('textarea', 'landmark-input'); input.rows = 4; input.dataset.landmarkInput = edge.id;
      input.value = landmarkDrafts.get(edge.id) ?? landmarks.get(edge.id) ?? '';
      input.addEventListener('input', () => landmarkDrafts.set(edge.id, input.value));
      input.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); landmarkCompose = null; renderInspector(); inspector.querySelector('.pcs-map-landmark-editor button')?.focus({preventScroll: true}); } });
      section.append(field('A title, a question or a next step in your own words', input), element('p', 'muted', 'Up to 1,000 characters. This note stays in this page’s memory and disappears on reload. It does not change Mara’s records.'));
      const feedback = element('p', 'muted'); feedback.setAttribute('role', 'status');
      section.append(button('Keep landmark for this visit', () => {
        const value = input.value.trim();
        if (!value || [...value].length > 1000) { feedback.textContent = value ? 'Use at most 1,000 characters. Your draft is retained.' : 'Write a landmark first.'; return; }
        landmarks.set(edge.id, value); landmarkDrafts.delete(edge.id); landmarkCompose = null; discoveryEdge = null;
        renderDiscovery(); renderInspector(); announce('Landmark kept for this visit. Return through Your demo landmarks. Reloading clears it.');
      }), button('Cancel', () => { landmarkCompose = null; renderInspector(); }));
      if (landmarks.has(edge.id)) section.append(button('Remove this landmark', () => { landmarks.delete(edge.id); landmarkDrafts.delete(edge.id); landmarkCompose = null; renderDiscovery(); renderInspector(); announce('Demo landmark removed. Mara’s records are unchanged.'); }));
      section.append(feedback); body.append(section);
    }

    function keepStoryPassage(record) {
      const added = journey.keep(record.id), progress = journey.progress();
      const index = story.clues.findIndex(clue => clue.records.includes(record.id)), thread = progress.threads[index];
      updateStoryProgress();
      const message = `${added ? 'Kept' : 'Already kept'}: ${record.title}. ${thread.kept} of ${thread.total} passages in this thread; ${progress.kept} of ${progress.total} overall.${progress.complete ? ' All eight passages are kept. The ending is ready.' : ''}`;
      announce(message); return message;
    }
    function recordCard(record, open = false, guided = false) {
      const ending = record.id === story?.epilogueRecord;
      const card = element(guided ? 'article' : 'details', 'record'); card.dataset.recordId = record.id; card.open = open && (!ending || storyEnding);
      if (guided) card.classList.add('pcs-map-record-guided');
      const summary = element(guided ? 'div' : 'summary', 'record-summary'); summary.append(element('span', 'record-meta', `${record.type === 'notebook' ? 'Notebook' : 'Memory'} · ${new Date(record.date + 'T12:00:00Z').toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC'})}`), element('strong', 'record-title', record.title));
      if (ending && !storyEnding) summary.prepend(element('span', 'record-meta', 'Ending (spoilers) · Open to read'));
      const body = element('div', 'record-body'); body.append(element('p', '', record.text));
      if (storyRecords.has(record.id) && !guided) {
        const keep = button(journey.has(record.id) ? 'Kept for this story' : 'Keep for this story', () => {
          keepStoryPassage(record); keep.textContent = 'Kept for this story'; keep.setAttribute('aria-pressed', 'true');
        });
        keep.setAttribute('aria-pressed', String(journey.has(record.id))); keep.dataset.keepRecord = record.id; body.append(keep);
      }
      if (record.correction) { const correction = element('div', 'correction'); correction.append(element('strong', '', `${data.person?.name || 'Owner'}’s correction`), element('p', '', record.correction)); body.append(correction); }
      if (record.original) { const original = element('details', 'original'); const label = element('summary', '', record.type === 'notebook' ? 'Read the original note excerpt' : 'Read the original conversation excerpt'); original.append(label, element('blockquote', '', record.original)); body.append(original); }
      const themes = element('p', 'record-themes', record.themes.map(id => lookup.get(id)?.label).filter(Boolean).join(' · ')); body.append(themes); card.append(summary, body); return card;
    }
    function ownerNotes(edge) { return (data.connectionNotes || []).filter(note => edgeKey(note.from, note.to) === edge.id); }
    function noteCard(note) {
      const card = element(note.spoiler ? 'details' : 'div', 'owner-note');
      card.append(element(note.spoiler ? 'summary' : 'strong', '', `${data.person?.name || 'Owner'}’s connection note${note.spoiler ? ' · Ending spoilers' : ''}`), element('p', '', note.text));
      return card;
    }
    function renderInspector() {
      const active = doc.activeElement, focusTab = active?.closest?.('.pcs-map-tab')?.dataset.tab;
      inspector.replaceChildren();
      updateStoryReading = null;
      host.dataset.storyMode = storyStep || storyEnding ? 'reading' : 'exploring';
      // The reading pane comes first in both the visual and keyboard order.
      // Free exploration restores the graph's original placement and geometry.
      workspace.prepend(storyStep || storyEnding ? inspector : canvas);
      inspector.setAttribute('aria-label', 'Selected theme or connection details');
      updateStoryProgress();
      if (story && (storyStep || storyEnding)) {
        inspector.append(element('p', 'eyebrow', storyEnding ? 'The connection, made real' : 'Follow the evidence'));
        const body = element('div', 'inspector-body'); body.tabIndex = 0; body.setAttribute('aria-label', 'Mara’s story passages');
        if (storyEnding) {
          inspector.append(element('h4', 'inspector-title', story.answerTitle));
          inspector.append(element('p', 'inspector-count', journey.progress().complete ? 'All eight passages kept · three threads complete' : `Ending preview · ${journey.progress().kept} of ${journey.progress().total} passages kept`));
          for (const paragraph of story.answer) body.append(element('p', '', paragraph));
          const outcome = data.records.find(record => record.id === story.epilogueRecord);
          if (outcome) body.append(element('h5', 'subheading', 'What happened next'), recordCard(outcome, true));
          body.append(element('p', 'story-reflection', story.reflection), element('p', 'muted', 'This is an authored fictional story. In your own Map, connections are starting points for questions; the records and your judgment give them meaning.'));
          body.append(element('p', 'summary', 'A theme gathers records. A line joins themes that share a record. Try selecting a line to inspect what connects them.'), button('Explore Connections', () => exploreFreely(true)));
          const own = element('a', 'button', 'Start your own thinking space ↗'); own.href = 'getting-started.html'; body.append(own);
          if (!journey.progress().complete) body.append(button('Return to unkept passages', resumeStory));
          body.append(button('Start again · clear story progress', () => { journey.reset(); exploreStory(story.clues[0]); }));
          inspector.append(body);
        } else {
          const clue = story.clues.find(item => item.id === storyStep);
          const record = data.records.find(item => item.id === storyRecord), index = clue.records.indexOf(storyRecord);
          inspector.setAttribute('aria-label', `${clue.label}. Passage ${index + 1} of ${clue.records.length}`);
          const allPassages = story.clues.flatMap(item => item.records), passageNumber = allPassages.indexOf(record.id) + 1;
          inspector.append(element('p', 'reader-position', `Passage ${passageNumber} of ${allPassages.length} · ${clue.label}`));
          inspector.append(element('h4', 'inspector-title', record.title));
          const passageNav = element('nav', 'story-passages'); passageNav.setAttribute('aria-label', 'Passages in this thread');
          const passageButtons = clue.records.map((id, offset) => {
            const item = button('', () => { storyRecord = id; renderInspector(); focusStoryInspector(); });
            item.dataset.storyPassage = id; item.setAttribute('aria-current', id === storyRecord ? 'true' : 'false');
            item.title = data.records.find(value => value.id === id).title;
            passageNav.append(item); return {item, id, offset};
          });
          const passagePicker = element('details', 'passage-picker');
          passagePicker.append(element('summary', '', 'Revisit a passage in this thread'), passageNav);
          body.append(recordCard(record, true, true));
          const insight = element('div', 'owner-note'); insight.append(element('strong', '', 'This thread, connected'), element('p', '', clue.insight)); body.append(insight);
          const controls = element('div', 'story-reader-controls'), feedback = element('p', 'story-reader-feedback'), actions = element('div', 'story-reader-actions');
          const next = button('', () => {
            if (!journey.has(record.id)) keepStoryPassage(record);
            const target = journey.next(clue.id);
            if (target) exploreStory(story.clues.find(item => item.id === target.clueId), target.recordId);
            else openStoryEnding(false);
          });
          next.dataset.storyNext = 'true'; next.dataset.keepRecord = record.id; next.classList.add('pcs-map-story-primary');
          updateStoryReading = () => {
            const progress = journey.progress(), thread = progress.threads.find(item => item.id === clue.id), kept = journey.has(record.id), target = journey.next(clue.id);
            for (const {item, id, offset} of passageButtons) item.textContent = `${journey.has(id) ? '✓ ' : ''}Passage ${offset + 1}`;
            insight.hidden = !thread.complete;
            feedback.textContent = `${progress.kept} of ${progress.total} kept. ${kept ? 'You have already kept this passage.' : 'When you finish reading, keep this passage and move to the next one.'}`;
            const finalKeep = !kept && progress.kept === progress.total - 1;
            next.textContent = kept ? (target ? 'Continue story →' : 'Read the ending →') : finalKeep ? 'Keep & read the ending →' : 'Keep & continue →';
          };
          actions.append(next); controls.append(feedback, actions); body.append(passagePicker); inspector.append(body, controls); updateStoryReading();
        }
        return;
      }
      if (state.layout === 'constellations' && !state.selected && !state.edge) {
        inspector.append(element('p', 'eyebrow', state.cluster ? 'One constellation' : 'A fictional life, at a glance'),
          element('h4', 'inspector-title', state.cluster || 'Start with a constellation'));
        const body = element('div', 'inspector-body');
        body.append(element('p', 'summary', state.cluster ? 'Choose a theme to read its records. Connections within this constellation appear on the Map; a selected theme also offers connections beyond it.' : 'Explore one part of Mara’s life at a time. Open a constellation, choose a theme, then follow the connections into its saved records.'));
        if (state.cluster) {
          for (const node of visible.nodes) { const item = button(node.label, () => choose(node.id), 'connection'); item.dataset.clusterTheme = node.id; body.append(item); }
          const bridges = constellations.edges.filter(edge => edge.from === state.cluster || edge.to === state.cluster);
          if (bridges.length) body.append(element('h5', 'subheading', 'Connections beyond this constellation'), element('p', 'muted', 'Each record touching both constellations counts once. These links suggest places to explore, not causes or conclusions.'));
          for (const bridge of bridges) {
            const other = bridge.from === state.cluster ? bridge.to : bridge.from;
            body.append(button(`${other} · ${plural(bridge.count, 'shared record')}`, () => openCluster(other), 'connection'));
          }
        } else {
          for (const group of constellations.nodes) {
            const item = button(`${group.label} · ${plural(group.count, 'theme')}`, () => openCluster(group.id), 'connection'); item.dataset.openCluster = group.id; body.append(item);
          }
        }
        inspector.append(body); return;
      }
      const edge = visible.edges.find(item => item.id === state.edge), node = graph.nodes.find(item => item.id === state.selected) || (edge && graph.nodes.find(item => item.id === edge.from));
      if (!node) { inspector.append(element('h4', '', visible.nodes.length ? 'No selection' : 'No themes in this view'), element('p', 'muted', visible.nodes.length ? 'Select a theme or connection to inspect its evidence. The current layout stays in place.' : 'Choose Connections to explore the fictional records.')); return; }
      const title = edge ? `${lookup.get(edge.from).label} + ${lookup.get(edge.to).label}` : node.label;
      const evidenceEdges = state.layout === 'constellations' ? visibleGraph(graph, {...state, layout: 'overview'}).edges : visible.edges;
      const endpoints = new Set(edge ? [edge.from, edge.to] : [node.id]);
      const related = evidenceEdges.filter(item => endpoints.has(item.from) || endpoints.has(item.to)).sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
      const records = edge ? edge.records : node.records;
      inspector.append(element('p', 'eyebrow', edge ? 'Shared evidence' : 'Selected theme'), element('h4', 'inspector-title', title), element('p', 'inspector-count', edge ? `${plural(edge.count, 'shared record')}` : `${plural(node.count, 'record')} · ${plural(related.length, state.layout === 'constellations' ? 'connection' : 'displayed connection')}`));
      if (edge) inspector.append(button('← Back to theme', () => change(() => { state.selected = node.id; state.edge = null; }, '', false)));
      if (edge && lookup.get(edge.from).group !== lookup.get(edge.to).group) {
        for (const group of [lookup.get(edge.from).group, lookup.get(edge.to).group]) inspector.append(button(`Open ${group} constellation`, () => openCluster(group)));
      }
      const tabs = element('div', 'tabs'); tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', 'Evidence details');
      const panels = [['overview', 'Overview'], ['records', `Records (${records.length})`], ['connections', `Connections (${related.length})`]];
      const body = element('div', 'inspector-body'); body.id = prefix + '-panel'; body.setAttribute('role', 'tabpanel'); body.setAttribute('aria-labelledby', prefix + '-tab-' + tab); body.tabIndex = 0;
      for (const [id, label] of panels) {
        const item = button(label, () => { tab = id; renderInspector(); inspector.querySelector(`[data-tab="${id}"]`).focus(); }, 'tab'); item.id = prefix + '-tab-' + id; item.dataset.tab = id; item.setAttribute('role', 'tab'); item.setAttribute('aria-selected', String(tab === id)); item.setAttribute('aria-controls', body.id); item.tabIndex = tab === id ? 0 : -1;
        item.addEventListener('keydown', event => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return; event.preventDefault(); const index = panels.findIndex(panel => panel[0] === tab); tab = panels[event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + (event.key === 'ArrowRight' ? 1 : 2)) % 3][0]; renderInspector(); inspector.querySelector(`[data-tab="${tab}"]`).focus(); }); tabs.append(item);
      }
      inspector.append(tabs, body);
      if (tab === 'overview') {
        body.append(element('p', 'summary', edge ? `${plural(edge.count, 'record')} mention both themes. This is a connection in the saved wording, not a conclusion about cause or importance.` : node.summary));
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
        if (!related.length) body.append(element('p', 'empty', 'No connections in this view. Choose Connections to see the full web.'));
        for (const connection of related) {
          const other = connection.from === node.id ? connection.to : connection.from;
          const label = edge ? `${lookup.get(connection.from).label} + ${lookup.get(connection.to).label}` : lookup.get(other).label;
          const item = button('', () => { tab = 'overview'; chooseEdge(connection.id); }, 'connection'); item.dataset.connection = connection.id; item.append(element('strong', '', label), element('span', 'connection-count', `${plural(connection.count, 'shared record')}${!edge && lookup.get(other).group !== node.group ? ' · ' + lookup.get(other).group : ''}`));
          for (const note of ownerNotes(connection)) item.append(element('span', 'connection-note', note.spoiler ? 'Connection note available · Ending spoilers' : `${data.person?.name || 'Owner'}’s note: ${note.text}`)); body.append(item);
        }
      }
      if (edge && tab !== 'connections') landmarkEditor(edge, body);
      if (focusTab) inspector.querySelector(`[data-tab="${focusTab}"]`)?.focus();
    }

    function renderConstellations() {
      const active = doc.activeElement?.closest?.('[data-cluster]')?.dataset.cluster;
      layout = constellationLayout(constellations.nodes); positions = layout.positions; svg.replaceChildren();
      legend.textContent = 'Each small star is a theme. Bridges count displayed theme links between constellations, not shared records. They do not imply cause or importance.';
      const bridges = [];
      for (const [index, edge] of constellations.edges.entries()) {
        const from = positions.get(edge.from), to = positions.get(edge.to);
        const path = svgElement('path', {d: `M ${from.x} ${from.y} Q ${(from.x + to.x) / 2} ${(from.y + to.y) / 2 - 55} ${to.x} ${to.y}`,
          class: `pcs-map-constellation-bridge${index < 3 ? ' pcs-map-constellation-bridge-visible' : ''}`, 'aria-hidden': 'true'});
        path.append(svgElement('title', {}, `${edge.from} + ${edge.to}: ${plural(edge.count, 'theme link')}`)); svg.append(path); bridges.push({path, edge, index});
      }
      const highlight = group => {
        for (const bridge of bridges) {
          bridge.path.classList.remove('pcs-map-constellation-bridge-visible', 'pcs-map-constellation-bridge-active');
          if (group ? [bridge.edge.from, bridge.edge.to].includes(group) : bridge.index < 3) bridge.path.classList.add(group ? 'pcs-map-constellation-bridge-active' : 'pcs-map-constellation-bridge-visible');
        }
      };
      const allEdges = visibleGraph(graph, {...state, layout: 'overview'}).edges;
      for (const constellation of constellations.nodes) {
        const point = positions.get(constellation.id), group = svgElement('g', {class: `pcs-map-constellation ${toneClass(constellation)}`,
          transform: `translate(${point.x},${point.y})`, role: 'button', tabindex: '0', 'data-cluster': constellation.id,
          'aria-label': `${constellation.label} constellation, ${plural(constellation.count, 'theme')}. Open to explore.`});
        group.append(svgElement('ellipse', {rx: 108, ry: 88, class: 'pcs-map-constellation-hit'}), svgElement('ellipse', {rx: 97, ry: 67, class: 'pcs-map-constellation-glow'}));
        const stars = new Map();
        constellation.themes.forEach((theme, index) => {
          const radius = 76 * Math.sqrt((index + .5) / constellation.count), angle = index * 2.399963 + .35;
          stars.set(theme.id, {x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * .7});
        });
        for (const edge of allEdges.filter(edge => stars.has(edge.from) && stars.has(edge.to)).sort((a, b) => b.count - a.count || a.id.localeCompare(b.id)).slice(0, 8)) {
          const from = stars.get(edge.from), to = stars.get(edge.to);
          group.append(svgElement('line', {x1: from.x, y1: from.y, x2: to.x, y2: to.y, class: 'pcs-map-constellation-thread', 'aria-hidden': 'true'}));
        }
        for (const [id, star] of stars) group.append(svgElement('circle', {cx: star.x, cy: star.y, r: 3.6, class: 'pcs-map-constellation-star', 'data-cluster-star': id, 'aria-hidden': 'true'}));
        group.append(svgElement('text', {y: 94, 'text-anchor': 'middle', class: 'pcs-map-constellation-label'}, constellation.label),
          svgElement('text', {y: 122, 'text-anchor': 'middle', class: 'pcs-map-constellation-count'}, plural(constellation.count, 'theme')));
        group.addEventListener('click', () => { if (!moved) openCluster(constellation.id); });
        group.addEventListener('pointerenter', () => highlight(constellation.id)); group.addEventListener('pointerleave', () => highlight(active || ''));
        group.addEventListener('focus', () => highlight(constellation.id)); group.addEventListener('blur', () => highlight(''));
        group.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openCluster(constellation.id); return; }
          const direction = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]}[event.key];
          if (!direction) return;
          event.preventDefault(); event.stopPropagation();
          const choices = constellations.nodes.filter(node => node.id !== constellation.id).map(node => {
            const next = positions.get(node.id), dx = next.x - point.x, dy = next.y - point.y;
            return {id: node.id, along: dx * direction[0] + dy * direction[1], distance: Math.hypot(dx, dy) + Math.abs(dx * direction[1] - dy * direction[0])};
          }).filter(node => node.along > 0).sort((a, b) => a.distance - b.distance);
          if (choices.length) [...svg.querySelectorAll('[data-cluster]')].find(node => node.dataset.cluster === choices[0].id)?.focus();
        });
        svg.append(group);
      }
      if (active) [...svg.querySelectorAll('[data-cluster]')].find(node => node.dataset.cluster === active)?.focus();
      if (!constellations.nodes.length) svg.append(svgElement('text', {x: 500, y: 320, 'text-anchor': 'middle', class: 'pcs-map-empty-label'}, 'No themes in this view. Choose Connections to see the full web.'));
    }

    function renderGraph() {
      if (state.layout === 'constellations' && !state.cluster) { renderConstellations(); updateActiveLabel(); return; }
      const activeId = doc.activeElement?.closest?.('[data-theme]')?.dataset.theme;
      const activeEdge = doc.activeElement?.closest?.('.pcs-map-edge-control')?.dataset.edge;
      const activeBundle = doc.activeElement?.closest?.('[data-bundle]')?.dataset.bundle;
      hoveredTheme = ''; focusedTheme = activeId || '';
      const bounds = svg.getBoundingClientRect();
      layout = layoutGraph(visible, state.layout, state.anchor, state.compare); positions = layout.positions;
      const scale = Math.min((bounds.width || WIDTH) / layout.width, (bounds.height || HEIGHT) / layout.height);
      const labelSize = clamp(12 / scale, 15, layout.labelSize), countSize = clamp(11 / scale, 15, 32), lineHeight = Math.max(18, labelSize + 2);
      const presentation = connectionPresentation(visible, state, expandedBundles);
      const dots = dottedConnections(presentation.edges, percent);
      legend.textContent = `Dotted: weakest ${percent}% target, keeping equal shared-record counts together. Showing ${dots.count} of ${dots.total} individual connections dotted${dots.total ? ` (${Math.round(dots.count / dots.total * 100)}%)` : ''}. The rest are solid.${state.layout === 'overview' ? ' Bundled lines join constellations: select a line to show its theme links. Their counts are available in List.' : ''}`;
      svg.replaceChildren();
      for (const node of visible.nodes) { const movedPoint = overrides.get(positionKey(node.id)); if (movedPoint) positions.set(node.id, {...movedPoint}); }
      for (const heading of layout.headings) svg.append(svgElement('text', {x: heading.x, y: heading.y || 55, class: heading.kind === 'group' ? 'pcs-map-group-heading' : 'pcs-map-date-heading', 'text-anchor': 'middle'}, heading.kind === 'group' ? heading.label : `Week of ${heading.label}`));
      const routes = routeEdges(presentation.edges, positions, state.anchor, state.layout, layout), routeLookup = new Map(routes.map(route => [route.id, route])), edgeControls = [];
      if (presentation.bundles.length) {
        const groupPositions = new Map();
        for (const group of new Set(visible.nodes.map(node => node.group))) {
          const points = visible.nodes.filter(node => node.group === group).map(node => positions.get(node.id));
          groupPositions.set(group, {x: points.reduce((sum, point) => sum + point.x, 0) / points.length, y: points.reduce((sum, point) => sum + point.y, 0) / points.length});
        }
        const narrow = bounds.width < 500, routeScale = 1 / Math.min((bounds.width || WIDTH) / box.width, (bounds.height || HEIGHT) / box.height);
        const bundleRoutes = routeEdges(presentation.bundles, groupPositions, '', 'overview', {width: layout.width, height: layout.height, anchorClearance: (narrow ? 33 : 53) * routeScale, nodeClearance: (narrow ? 15 : 22) * routeScale});
        for (const bridge of presentation.bundles) {
          const route = bundleRoutes.find(item => item.id === bridge.id), words = `${plural(bridge.count, 'theme link')} between ${bridge.from} and ${bridge.to}`;
          const group = svgElement('g', {class: `pcs-map-bundle${bridge.expanded ? ' pcs-map-bundle-expanded' : ''}`, 'data-bundle-path': bridge.id, role: 'button', tabindex: '0', 'data-bundle': bridge.id, 'data-x': route.point.x, 'data-y': route.point.y, 'aria-expanded': String(bridge.expanded), 'aria-label': `${words}. ${bridge.expanded ? 'Bundle them again.' : 'Show each link.'}`});
          const path = svgElement('path', {d: route.d, class: 'pcs-map-bundle-line', fill: 'none', 'stroke-width': bridge.expanded ? 1 : 1.2 + Math.log2(bridge.count + 1) * .3, 'vector-effect': 'non-scaling-stroke'});
          group.append(svgElement('path', {d: route.d, class: 'pcs-map-bundle-hit', fill: 'none', 'vector-effect': 'non-scaling-stroke'}), path);
          group.addEventListener('click', event => {
            event.stopPropagation(); if (moved) return;
            const transform = svg.getScreenCTM(); if (!transform) return;
            const point = svg.createSVGPoint(); point.x = event.clientX; point.y = event.clientY;
            const id = closestEdge(bundleRoutes, point.matrixTransform(transform.inverse()));
            if (id) toggleBundle(id);
          }); svg.append(group);
          group.append(svgElement('title', {}, words));
          group.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); toggleBundle(bridge.id); } });
        }
      }
      // A selected thread focuses both endpoints, independently of the theme
      // previously inspected. Keep the arrangement and camera in place.
      const selectedEdge = visible.edges.find(edge => edge.id === state.edge);
      const selectedNodes = new Set(selectedEdge ? [selectedEdge.from, selectedEdge.to] : state.selected ? [state.selected] : []);
      const neighborhood = new Set(selectedNodes);
      for (const edge of visible.edges) if (selectedNodes.has(edge.from) || selectedNodes.has(edge.to)) { neighborhood.add(edge.from); neighborhood.add(edge.to); }
      for (const edge of presentation.edges) {
        const route = routeLookup.get(edge.id), selected = edge.id === state.edge, related = selectedNodes.has(edge.from) || selectedNodes.has(edge.to);
        const tone = toneClass(lookup.get(selectedNodes.has(edge.to) && !selectedNodes.has(edge.from) ? edge.to : edge.from));
        const group = svgElement('g', {class: `pcs-map-edge ${tone}${selected ? ' pcs-map-edge-selected' : related ? ' pcs-map-edge-related' : selectedEdge ? ' pcs-map-edge-muted' : ''}`, 'data-edge': edge.id});
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
        const control = svgElement('g', {class: `pcs-map-edge-control ${tone}${selected || related ? ' pcs-map-edge-control-shown' : ''}`, transform: `translate(${route.point.x},${route.point.y})`, role: 'button', tabindex: selected || related ? '0' : '-1', 'aria-pressed': String(selected), 'aria-label': `${lookup.get(edge.from).label} and ${lookup.get(edge.to).label}: ${plural(edge.count, 'shared record')}`, 'data-edge': edge.id});
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
        const point = positions.get(node.id), selected = selectedNodes.has(node.id);
        const emphasis = selected ? ' pcs-map-node-selected' : selectedEdge ? neighborhood.has(node.id) ? ' pcs-map-node-related' : ' pcs-map-node-muted' : '';
        const group = svgElement('g', {class: `pcs-map-node ${toneClass(node)}${emphasis}`, transform: `translate(${point.x},${point.y})`, role: 'button', tabindex: '0', 'data-theme': node.id, 'aria-pressed': String(selected), 'aria-label': `${node.label}, ${plural(node.count, 'record')}. Inspect theme.`});
        group.append(svgElement('title', {}, `${node.label}: ${plural(node.count, 'record')}`));
        const lines = labelLines(node.label);
        const halfLabel = Math.max(...lines.map(text => text.length * labelSize * .29), 35);
        const labelX = clamp(point.x, halfLabel + 10, layout.width - halfLabel - 10) - point.x;
        const hitRadius = clamp(22 / scale, 27, 43);
        group.append(svgElement('circle', {r: hitRadius, class: 'pcs-map-node-hit'}));
        group.append(svgElement('circle', {r: 43, class: 'pcs-map-node-halo'}), svgElement('circle', {r: 37, class: 'pcs-map-node-ring'}));
        group.append(selected ? svgElement('path', {d: 'M 0 -34 L 10 -10 L 34 0 L 10 10 L 0 34 L -10 10 L -34 0 L -10 -10 Z', class: 'pcs-map-node-star'}) : svgElement('circle', {r: 24, class: 'pcs-map-node-dot'}));
        const countLabel = svgElement('text', {y: countSize * .34, 'text-anchor': 'middle', class: 'pcs-map-node-count'}, node.count); countLabel.style.fontSize = `${countSize}px`; group.append(countLabel);
        lines.forEach((text, i) => { const label = svgElement('text', {x: labelX, y: 53 + i * lineHeight, 'text-anchor': 'middle', class: 'pcs-map-node-label'}, text); label.style.fontSize = `${labelSize}px`; group.append(label); });
        group.addEventListener('click', () => { if (!moved) choose(node.id); });
        group.addEventListener('pointerenter', () => { hoveredTheme = node.id; updateActiveLabel(); });
        group.addEventListener('pointerleave', () => { if (hoveredTheme === node.id) hoveredTheme = ''; updateActiveLabel(); });
        group.addEventListener('focus', () => { focusedTheme = node.id; updateActiveLabel(); });
        group.addEventListener('blur', () => { if (focusedTheme === node.id) focusedTheme = ''; updateActiveLabel(); });
        group.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(node.id); return; }
          if (!event.key.startsWith('Arrow')) return;
          event.preventDefault(); event.stopPropagation();
          const direction = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]}[event.key];
          const options = visible.nodes.filter(candidate => candidate.id !== node.id).map(candidate => { const p = positions.get(candidate.id), dx = p.x - point.x, dy = p.y - point.y, along = dx * direction[0] + dy * direction[1]; return {id: candidate.id, along, distance: Math.hypot(dx, dy) + Math.abs(dx * direction[1] - dy * direction[0])}; }).filter(candidate => candidate.along > 0).sort((a, b) => a.distance - b.distance);
          if (options.length) [...svg.querySelectorAll('[data-theme]')].find(item => item.dataset.theme === options[0].id)?.focus();
        }); svg.append(group);
      }
      if (!visible.nodes.length) svg.append(svgElement('text', {x: 500, y: 320, 'text-anchor': 'middle', class: 'pcs-map-empty-label'}, 'No themes in this view. Choose Connections to see the full web.'));
      if (activeId) [...svg.querySelectorAll('[data-theme]')].find(item => item.dataset.theme === activeId)?.focus();
      if (activeEdge) [...svg.querySelectorAll('.pcs-map-edge-control')].find(item => item.dataset.edge === activeEdge)?.focus();
      if (activeBundle) [...svg.querySelectorAll('[data-bundle]')].find(item => item.dataset.bundle === activeBundle)?.focus();
      applyBox();
    }

    function render() {
      const activeListId = doc.activeElement?.dataset?.listTheme;
      searchResults.hidden = true;
      graph = deriveGraph(data, state.type);
      constellations = constellationGraph(graph, state);
      if (state.cluster && !constellations.nodes.some(group => group.id === state.cluster)) state.cluster = '';
      const eligible = graph.nodes.filter(node => !state.hidden.includes(node.id));
      if (state.selected && !eligible.some(node => node.id === state.selected)) { state.selected = ''; state.edge = null; }
      if (!eligible.some(node => node.id === state.anchor)) state.anchor = eligible.find(node => node.id === state.selected)?.id || eligible[0]?.id || '';
      if (!eligible.some(node => node.id === state.compare && node.id !== state.anchor)) state.compare = eligible.find(node => node.id !== state.anchor)?.id || '';
      visible = visibleGraph(graph, state);
      if (!visible.edges.some(edge => edge.id === state.edge)) state.edge = null;
      showAll.disabled = state.layout === 'constellations' && !state.cluster;
      showAll.hidden = state.layout !== 'constellations' || !state.cluster;
      focusView.setAttribute('aria-pressed', String(state.layout === 'rings'));
      constellationView.setAttribute('aria-pressed', String(state.layout === 'constellations'));
      connectionsView.setAttribute('aria-pressed', String(state.layout === 'overview'));
      bundleReset.hidden = state.layout !== 'overview' || !expandedBundles.size;
      clusterCaption.textContent = state.layout === 'constellations' ? state.cluster || 'Mara’s constellations' : state.layout === 'rings' ? `Around ${lookup.get(state.anchor)?.label || 'one theme'}` : 'All connections';
      back.disabled = !past.length; forward.disabled = !future.length;
      graphView.setAttribute('aria-pressed', String(!listMode)); listView.setAttribute('aria-pressed', String(listMode));
      stage.hidden = listMode; list.hidden = !listMode; help.hidden = listMode;
      const constellationOverview = state.layout === 'constellations' && !state.cluster;
      caption.textContent = constellationOverview ? `${plural(constellations.nodes.length, 'constellation')} · ${plural(constellations.nodes.reduce((sum, group) => sum + group.count, 0), 'theme')}` :
        `${visible.nodes.length} of ${graph.nodes.length} themes · ${plural(visible.edges.length, 'connection')}`;
      const viewHelp = {
        overview: 'Select a bundled line to show each theme link between two constellations; select it again to collapse. Bundle counts are available in List. Individual links count shared records. Select a thread to inspect both themes and their evidence. Hover or focus a star to read its name. Choose Focus for its neighborhood, or Constellations to explore one group.',
        rings: 'Focus shows one theme and its direct connections. Select a neighboring theme to center its neighborhood without resetting pan or zoom.',
        compare: 'Compare shows the two chosen themes and their direct connections. Selecting a star inspects its evidence while keeping both comparison anchors.',
        grid: 'Grid arranges themes by name. Select a theme or connection to inspect its evidence without moving the layout.',
        date: 'Saved-date groups themes by the latest supporting record’s saved date. Select a theme or connection to inspect its evidence.'
      };
      help.textContent = state.layout === 'constellations' ? 'Open a constellation, then select a theme. Tab and Enter work throughout; arrow keys move between stars. Scroll to zoom, drag empty space to pan, and use All constellations to return.' :
        `${viewHelp[state.layout] || viewHelp.overview} Drag empty space to pan, scroll to zoom, and use Fit to return. Tab and arrow keys move between themes; Enter selects, Escape clears. List offers the same evidence.`;
      renderGraph(); list.replaceChildren();
      if (state.layout === 'overview') {
        const bundles = element('div', 'bundle-list'); bundles.append(element('h4', '', 'Between constellations'), element('p', 'muted', 'These counts are theme links. Open a bundle, then select a theme to inspect its records and individual connections.'));
        for (const bridge of connectionPresentation(visible, state, expandedBundles).bundles) {
          const item = button(`${bridge.from} + ${bridge.to} · ${plural(bridge.count, 'theme link')} · ${bridge.expanded ? 'Bundle again' : 'Show links'}`, () => toggleBundle(bridge.id));
          item.dataset.listBundle = bridge.id; item.setAttribute('aria-expanded', String(bridge.expanded)); bundles.append(item);
        }
        list.append(bundles);
      }
      const listEdge = visible.edges.find(edge => edge.id === state.edge);
      const listSelection = new Set(listEdge ? [listEdge.from, listEdge.to] : [state.selected]);
      if (constellationOverview) {
        for (const group of constellations.nodes) { const item = button('', () => openCluster(group.id), 'list-item'); item.classList.add(toneClass(group)); item.dataset.listCluster = group.id; item.append(element('strong', '', group.label), element('span', 'muted', plural(group.count, 'theme')), element('span', '', 'Open this constellation')); list.append(item); }
      } else for (const node of visible.nodes) { const item = button('', () => choose(node.id), 'list-item'); item.classList.add(toneClass(node)); item.dataset.listTheme = node.id; item.setAttribute('aria-pressed', String(listSelection.has(node.id))); item.append(element('strong', '', node.label), element('span', 'muted', `${node.group} · ${plural(node.count, 'record')}`), element('span', '', node.summary)); list.append(item); }
      if (!(constellationOverview ? constellations.nodes.length : visible.nodes.length)) list.append(element('p', 'empty', 'No themes in this view. Choose Connections to see the full web.'));
      renderInspector();
      renderDiscovery();
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
      if (moved || event.target.closest?.('[data-theme], [data-edge], [data-cluster], [data-bundle], [data-bundle-path]')) return;
      event.preventDefault(); clearSelection(); svg.focus({preventScroll: true});
    });
    svg.addEventListener('pointerdown', event => {
      if (event.button !== 0 || event.isPrimary === false) return;
      const node = event.target.closest?.('[data-theme]'), edge = event.target.closest?.('[data-edge]');
      if (edge && !node || event.target.closest?.('[data-bundle], [data-bundle-path]')) return;
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
      if (drag.id) { overrides.set(positionKey(drag.id), {x: clamp(drag.point.x + dx, 110, layout.width - 110), y: clamp(drag.point.y + dy, 70, layout.height - 135)}); renderGraph(); }
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
    resetBox();
    if (win.ResizeObserver) {
      const observer = new win.ResizeObserver(() => { if (!listMode) renderGraph(); }); observer.observe(stage);
      if (pageHeader) { const headerObserver = new win.ResizeObserver(measurePageHeader); headerObserver.observe(pageHeader); }
    }
    return {render, getState: () => ({...state, hidden: [...state.hidden], hiddenEdges: [...state.hiddenEdges]})};
  }

  function mountAll(doc = root.document, data = root.PCS_MAP_DATA) { if (!doc) return []; return [...doc.querySelectorAll('[data-pcs-map]')].map(host => create(host, data)); }
  const api = {deriveGraph, dottedConnections, visibleGraph, constellationGraph, connectionPresentation, constellationLayout, labelLines, layoutGraph, routeEdges, curvePoint, closestEdge, createStoryJourney, create, mountAll};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.PCSMapDemo = api;
  if (root.document) { if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', () => mountAll()); else mountAll(); }
})(typeof window !== 'undefined' ? window : globalThis);
