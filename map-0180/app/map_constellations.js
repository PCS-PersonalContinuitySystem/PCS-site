"use strict";

// Local, temporary presentation of the caller's checked graph. A constellation
// is a bounded connected collection of displayed themes, not a classification
// of the owner. This module never reads records, stores state or calls a model.
((root, factory) => {
  const layouts = typeof module === "object" && module.exports ? require("./map_layouts.js") : root.PCSMapLayouts;
  const api = factory(layouts);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PCSMapConstellations = api;
})(typeof globalThis !== "undefined" ? globalThis : this, layouts => {
  const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
  const labelKey = node => node.label.normalize("NFKC").toLowerCase();
  const order = (a, b) => compare(labelKey(a), labelKey(b)) || compare(a.id, b.id);
  const dimension = (value, fallback) => Number.isFinite(value) && value > 0 ? Math.max(240, Math.min(4000, value)) : fallback;
  const measured = (widths, id) => widths instanceof Map ? widths.get(id) : widths && typeof widths === "object" ? widths[id] : undefined;
  const groupingInputs = new WeakMap();

  function graph(rawNodes, rawEdges) {
    const byId = new Map();
    for (const node of Array.isArray(rawNodes) ? rawNodes : []) {
      if (node && typeof node.id === "string" && typeof node.label === "string" && !byId.has(node.id)) byId.set(node.id, node);
    }
    const nodes = [...byId.values()].sort(order), edges = [], seen = new Set();
    for (const edge of Array.isArray(rawEdges) ? rawEdges : []) {
      if (!edge || edge.from === edge.to || !byId.has(edge.from) || !byId.has(edge.to)) continue;
      const ends = [edge.from, edge.to].sort(compare);
      const id = typeof edge.id === "string" ? edge.id : JSON.stringify(ends);
      if (seen.has(id)) continue;
      seen.add(id);
      // Weight affects arrangement only. It does not become a record count.
      const weight = Number.isFinite(edge.weight) && edge.weight > 0 ? Math.min(1, edge.weight) : 1;
      edges.push({id, from:ends[0], to:ends[1], weight});
    }
    edges.sort((a, b) => compare(a.from, b.from) || compare(a.to, b.to) || compare(a.id, b.id));
    return {nodes, byId, edges};
  }

  function clusterGraph(rawNodes, rawEdges, options = {}) {
    const {nodes, byId, edges} = graph(rawNodes, rawEdges);
    const maxSize = Number.isInteger(options.maxSize) ? Math.max(1, Math.min(12, options.maxSize)) : 12;
    const adjacency = new Map(nodes.map(node => [node.id, new Map()]));
    for (const edge of edges) {
      for (const [a, b] of [[edge.from, edge.to], [edge.to, edge.from]]) {
        adjacency.get(a).set(b, (adjacency.get(a).get(b) || 0) + edge.weight);
      }
    }
    const degree = new Map(nodes.map(node => [node.id, [...adjacency.get(node.id).values()].reduce((sum, weight) => sum + weight, 0)]));
    const remaining = new Set(nodes.map(node => node.id)), memberships = [];
    const ranked = [...nodes].sort((a, b) => degree.get(b.id) - degree.get(a.id) || order(a, b));
    // At most n seeds and n growth steps in total; each growth examines the
    // remaining displayed nodes and their bounded adjacency. Disconnected
    // themes stay separate instead of acquiring a fictional relationship.
    for (const seed of ranked) {
      if (!remaining.has(seed.id)) continue;
      const ids = [seed.id], members = new Set(ids);
      remaining.delete(seed.id);
      while (ids.length < maxSize) {
        let best = null;
        for (const id of remaining) {
          let affinity = 0, links = 0;
          for (const [neighbor, weight] of adjacency.get(id)) if (members.has(neighbor)) { affinity += weight; links++; }
          if (!links) continue;
          // Prefer a theme whose displayed connections stay within this
          // constellation, then stronger adjacency. Stable labels break ties.
          const score = affinity / degree.get(id);
          const candidate = {id, score, affinity};
          if (!best || score > best.score || score === best.score && (affinity > best.affinity
              || affinity === best.affinity && order(byId.get(id), byId.get(best.id)) < 0)) best = candidate;
        }
        if (!best) break;
        ids.push(best.id); members.add(best.id); remaining.delete(best.id);
      }
      memberships.push(ids);
    }
    const clusters = memberships.map(ids => {
      const members = new Set(ids);
      const internalDegree = id => [...adjacency.get(id)].reduce((sum, [next, weight]) => sum + (members.has(next) ? weight : 0), 0);
      // 0.9.139: a saved label names its constellation before a busier name or
      // phrase inside it (a Local account's label, not one of its cassette codes).
      const labelled = node => node.basis === "saved_label" ? 1 : 0;
      const representatives = ids.map(id => byId.get(id)).sort((a, b) => labelled(b) - labelled(a)
        || internalDegree(b.id) - internalDegree(a.id) || order(a, b));
      const anchor = representatives[0];
      return {id:anchor.id, anchor:anchor.id, label:anchor.label, labels:representatives.slice(0, 3).map(node => node.label),
        ids:ids.map(id => byId.get(id)).sort(order).map(node => node.id), count:ids.length,
        group:Number.isInteger(anchor.group) ? anchor.group : 0,
        internalLinkCount:edges.filter(edge => members.has(edge.from) && members.has(edge.to)).length};
    }).sort((a, b) => order(byId.get(a.anchor), byId.get(b.anchor)));
    const membership = new Map();
    for (const cluster of clusters) for (const id of cluster.ids) membership.set(id, cluster.id);
    const bridgeMap = new Map();
    for (const edge of edges) {
      const ends = [membership.get(edge.from), membership.get(edge.to)].sort(compare);
      if (ends[0] === ends[1]) continue;
      const id = JSON.stringify(ends);
      if (!bridgeMap.has(id)) bridgeMap.set(id, {id, from:ends[0], to:ends[1], count:0, edgeIds:[]});
      const bridge = bridgeMap.get(id); bridge.count++; bridge.edgeIds.push(edge.id);
    }
    const bridges = [...bridgeMap.values()].sort((a, b) => compare(a.id, b.id));
    for (const bridge of bridges) bridge.edgeIds.sort(compare);
    const result = {clusters, membership, bridges};
    groupingInputs.set(result, {nodes: rawNodes, edges: rawEdges, maxSize});
    return result;
  }

  // A fixed asymmetric local star pattern avoids an alphabetical grid while
  // pairwise rectangular clearance still guarantees room for full labels.
  const SLOTS = [[0,0],[.3,-1],[1.1,.15],[-.95,-.7],[-1.7,.05],[1.55,-.85],
    [.6,1.25],[-.8,1],[1.8,1.25],[-1.95,1.25],[-.2,-1.85],[2,-1.85]];
  function localLayout(cluster, byId, footprints) {
    const ids = [cluster.anchor, ...cluster.ids.filter(id => id !== cluster.anchor)];
    const unit = ids.map((id, index) => ({id, x:SLOTS[index][0], y:SLOTS[index][1]}));
    let scale = 1;
    for (let i = 0; i < unit.length; i++) for (let j = i + 1; j < unit.length; j++) {
      const a = unit[i], b = unit[j], fa = footprints.get(a.id), fb = footprints.get(b.id);
      scale = Math.max(scale, Math.min((fa.halfWidth + fb.halfWidth + 32) / Math.max(1e-12, Math.abs(a.x - b.x)),
        (fa.halfHeight + fb.halfHeight + 32) / Math.max(1e-12, Math.abs(a.y - b.y))));
    }
    scale += 1;
    const left = Math.min(...unit.map(p => p.x * scale - footprints.get(p.id).halfWidth));
    const right = Math.max(...unit.map(p => p.x * scale + footprints.get(p.id).halfWidth));
    const top = Math.min(...unit.map(p => p.y * scale - footprints.get(p.id).halfHeight));
    const bottom = Math.max(...unit.map(p => p.y * scale + footprints.get(p.id).halfHeight));
    const headingLines = layouts.wrapLabel(cluster.label), headingWidth = Math.max(0, ...headingLines.map(line => line.length * 14));
    const width = Math.max(right - left, headingWidth + 24), height = bottom - top + 72;
    const positions = unit.map(p => ({id:p.id, x:p.x * scale - (left + right) / 2,
      y:p.y * scale - (top + bottom) / 2 + 36, radius:footprints.get(p.id).radius, group:byId.get(p.id).group}));
    return {width, height, positions, headingLines};
  }

  // Place separated rectangles on a deterministic sunflower. Try a few aspect
  // ratios and choose the one that fits the actual viewport with least zoom.
  // No ongoing physics, random seed, animation frame or private cache exists.
  function placeRegions(regions, width, height, gap = 64) {
    if (!regions.length) return {width, height, positions:new Map()};
    const units = regions.map((region, index) => ({id:region.id,
      x:Math.cos(index * 2.399963229728653) * Math.sqrt(index),
      y:Math.sin(index * 2.399963229728653) * Math.sqrt(index)}));
    let best = null;
    for (const aspect of [.65, .85, 1, 1.25, 1.6, 2]) {
      let scale = 1;
      for (let i = 0; i < regions.length; i++) for (let j = i + 1; j < regions.length; j++) {
        scale = Math.max(scale, Math.min(((regions[i].width + regions[j].width) / 2 + gap) / Math.max(1e-12, Math.abs(units[i].x - units[j].x) * aspect),
          ((regions[i].height + regions[j].height) / 2 + gap) / Math.max(1e-12, Math.abs(units[i].y - units[j].y))));
      }
      scale += 1;
      const xs = units.map(p => p.x * scale * aspect), ys = units.map(p => p.y * scale);
      const left = Math.min(...regions.map((r, i) => xs[i] - r.width / 2)), right = Math.max(...regions.map((r, i) => xs[i] + r.width / 2));
      const top = Math.min(...regions.map((r, i) => ys[i] - r.height / 2)), bottom = Math.max(...regions.map((r, i) => ys[i] + r.height / 2));
      const w = Math.max(width, right - left + 64), h = Math.max(height, bottom - top + 64), score = Math.max(w / width, h / height);
      if (!best || score < best.score) best = {width:w, height:h, score, positions:new Map(regions.map((region, i) => [region.id,
        {id:region.id, x:xs[i] - (left + right) / 2 + w / 2, y:ys[i] - (top + bottom) / 2 + h / 2}]))};
    }
    return best;
  }

  function groupedLayout(rawNodes, edges, width = 860, height = 590, options = {}) {
    width = dimension(width, 860); height = dimension(height, 590);
    // Only reuse this module's grouping of the same input arrays and budget.
    // The app passes it synchronously within one relayout, never across edits.
    const input = groupingInputs.get(options.clustering), maxSize = Number.isInteger(options.maxSize) ? Math.max(1, Math.min(12, options.maxSize)) : 12;
    const {nodes, byId} = graph(rawNodes, edges), clustering = input?.nodes === rawNodes && input.edges === edges && input.maxSize === maxSize
      ? options.clustering : clusterGraph(rawNodes, edges, options);
    const footprints = new Map(nodes.map(node => [node.id, layouts.footprint(node, measured(options.labelWidths, node.id))]));
    const regions = clustering.clusters.map(cluster => ({id:cluster.id, cluster, ...localLayout(cluster, byId, footprints)}));
    const packed = placeRegions(regions, width, height, 56), positions = new Map(), headings = [];
    for (const region of regions) {
      const center = packed.positions.get(region.id), cluster = region.cluster;
      for (const point of region.positions) positions.set(point.id, {...point, x:point.x + center.x, y:point.y + center.y});
      headings.push({id:cluster.id, label:cluster.label, lines:region.headingLines, count:cluster.count,
        x:center.x, y:center.y - region.height / 2 + 18, width:region.width, group:cluster.group});
    }
    return {width:packed.width, height:packed.height, viewportWidth:width, viewportHeight:height, positions, footprints,
      ...clustering, headings, groupHeadings:headings, mode:"connections", visibleIds:nodes.map(node => node.id), omittedIds:[], omittedCount:0,
      needsSelection:false, message:"Constellations arrange displayed themes using their current connections; they are not fixed categories."};
  }

  function constellationLayout(clusters, width = 860, height = 590) {
    width = dimension(width, 860); height = dimension(height, 590);
    clusters = Array.isArray(clusters) ? clusters : [];
    const footprints = new Map(), regions = clusters.map(cluster => {
      // Full names remain in the accessible label and inspector. Keep overview
      // captions short enough for a readable, screen-sized cloud directory.
      const lines = layouts.wrapLabel(cluster.label).map(line=>Array.from(line).length>18?Array.from(line).slice(0,17).join("")+"…":line);
      const radius = 23 + Math.sqrt(cluster.count || cluster.ids.length) * 3;
      const lineWidth=line=>Array.from(line).reduce((sum,char)=>sum+(char.codePointAt(0)>255?16:8),0);
      const halfWidth = Math.max(radius + 20, Math.max(0, ...lines.map(lineWidth)) / 2 + 12), halfHeight = radius + 84;
      footprints.set(cluster.id, {halfWidth, halfHeight, radius, lines});
      return {id:cluster.id, width:2 * halfWidth, height:2 * halfHeight};
    });
    // Shallow staggered arcs use the available sky without the wide empty
    // bounds of unrestricted spiral packing. Five clouds become 3 + 2,
    // rather than one row; reserved label rectangles prevent overlap.
    const cellWidth=Math.max(174,...regions.map(r=>r.width))+24;
    const cellHeight=Math.max(180,...regions.map(r=>r.height))+58;
    const columns=Math.max(1,Math.min(clusters.length,clusters.length>=3?Math.ceil(clusters.length/2):2,Math.floor((width-40)/cellWidth)||1));
    const rows=Math.ceil(clusters.length/columns),raw=[];
    clusters.forEach((cluster,i)=>{const row=Math.floor(i/columns),count=Math.min(columns,clusters.length-row*columns),column=i%columns;
      const x=(column-(count-1)/2)*cellWidth+(row%2?.16*cellWidth:0);
      const arc=count>1?18*Math.cos((column-(count-1)/2)*Math.PI/Math.max(1,count-1))*(row%2?-1:1):0;
      raw.push({cluster,x,y:(row-(rows-1)/2)*cellHeight+arc});});
    const left=Math.min(0,...raw.map(p=>p.x-footprints.get(p.cluster.id).halfWidth));
    const right=Math.max(0,...raw.map(p=>p.x+footprints.get(p.cluster.id).halfWidth));
    const top=Math.min(0,...raw.map(p=>p.y-footprints.get(p.cluster.id).halfHeight));
    const bottom=Math.max(0,...raw.map(p=>p.y+footprints.get(p.cluster.id).halfHeight));
    const fieldWidth=Math.max(width,right-left+40),fieldHeight=Math.max(height,bottom-top+40),positions=new Map();
    for(const point of raw){const cluster=point.cluster;positions.set(cluster.id,{id:cluster.id,
      x:fieldWidth/2+point.x-(left+right)/2,y:fieldHeight/2+point.y-(top+bottom)/2,
      radius:footprints.get(cluster.id).radius,group:cluster.group});}
    return {width:fieldWidth, height:fieldHeight, viewportWidth:width, viewportHeight:height,
      positions, footprints, clusters, mode:"groups", visibleIds:clusters.map(cluster => cluster.id),
      omittedIds:[], omittedCount:0, needsSelection:false, message:"Choose a constellation to explore its displayed themes."};
  }

  return {clusterGraph, groupedLayout, constellationLayout};
});
