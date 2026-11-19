"use strict";

// Pure, local presentation geometry. Edges are the caller's checked graph;
// adjacency here never invents an edge or asserts a shared source record.
((root, factory) => {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PCSMapLayouts = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  const GAP = 32, PADDING = 32;
  const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
  const labelKey = node => node.label.normalize("NFKC").toLowerCase();
  const ordered = nodes => [...nodes].sort((a, b) => compare(labelKey(a), labelKey(b)) || compare(a.id, b.id));
  const dimension = (value, fallback) => Number.isFinite(value) && value > 0 ? Math.max(240, Math.min(value, 4000)) : fallback;

  // Match continuity_map_ui.wrapLabel, including its two-line truncation.
  function wrapLabel(label) {
    const words = label.split(/\s+/), lines = []; let line = "";
    for (const word of words) {
      if (line && line.length + word.length > 19) { lines.push(line); line = ""; }
      line += (line ? " " : "") + word;
    }
    if (line) lines.push(line);
    return lines.slice(0, 2).map((s, i) => s.length > 21 ? s.slice(0, 20) + "…" : i === 1 && lines.length > 2 ? s + "…" : s);
  }

  function footprint(node, measuredWidth) {
    const support = Number.isFinite(node.support_count) && node.support_count > 0 ? node.support_count : 1;
    const radius = Math.min(29, 13 + Math.sqrt(support) * 2);
    const lines = wrapLabel(node.label);
    // Renderer labels use 14px system-ui and 16px line spacing. A conservative
    // 14px per UTF-16 unit covers wide glyphs without DOM/canvas measurements;
    // allowances include stroked text, selected star and pointer halo.
    const estimatedWidth = Math.max(0, ...lines.map(line => line.length * 14));
    // The caller can measure the exact wrapped renderer lines at its actual
    // font size. Invalid/unbounded measurements never replace the fallback.
    const labelWidth = Number.isFinite(measuredWidth) && measuredWidth > 0 && measuredWidth <= 768
      ? measuredWidth : estimatedWidth;
    return {radius, lines, halfWidth: Math.max(radius + 20, labelWidth / 2 + 12),
      halfHeight: radius + 30 + Math.max(0, lines.length - 1) * 16 + 12};
  }

  function arrange(rawNodes, edges, width, height, mode, options = {}) {
    width = dimension(width, 860); height = dimension(height, 590);
    if (!["focus", "compare", "grid", "saved-date"].includes(mode)) throw new RangeError("Unsupported Map layout.");
    const byId = new Map();
    for (const node of Array.isArray(rawNodes) ? rawNodes : []) {
      if (node && typeof node.id === "string" && typeof node.label === "string" && !byId.has(node.id)) byId.set(node.id, node);
    }
    const nodes = ordered(byId.values()), positions = new Map(), footprints = new Map();
    const neighbors = new Map(nodes.map(node => [node.id, new Set()]));
    for (const edge of Array.isArray(edges) ? edges : []) {
      if (edge && edge.from !== edge.to && byId.has(edge.from) && byId.has(edge.to)) {
        neighbors.get(edge.from).add(edge.to); neighbors.get(edge.to).add(edge.from);
      }
    }
    const sortIds = ids => ordered([...ids].map(id => byId.get(id))).map(node => node.id);
    const result = {width, height, positions, footprints, mode, needsSelection: false, message: "",
      visibleIds: [], omittedIds: nodes.map(node => node.id), omittedCount: nodes.length};
    const need = message => { result.needsSelection = true; result.message = message; return result; };
    let visible, first = [], second = [], left = [], right = [], common = [];
    if (mode === "focus") {
      if (!byId.has(options.center)) return need("Choose a theme to center the Focus layout.");
      first = sortIds(neighbors.get(options.center));
      const firstSet = new Set(first), secondSet = new Set();
      if (options.secondRing === true) for (const id of first) for (const next of neighbors.get(id)) {
        if (next !== options.center && !firstSet.has(next)) secondSet.add(next);
      }
      second = sortIds(secondSet);
      const neighborhoodIds = [options.center, ...first, ...second];
      // Readable Focus pages are only a presentation window. Keep the complete
      // checked neighborhood for List and path discovery, and bring an actual
      // first-step neighbor along when a page contains a two-step theme.
      if (Number.isInteger(options.focusPageSize) && options.focusPageSize >= 1 && options.focusPageSize <= 24) {
        const allFirst = first, allSecond = second, candidates = [...first, ...second];
        const pageCount = Math.max(1, Math.ceil(candidates.length / options.focusPageSize));
        const page = Math.max(0, Math.min(pageCount - 1, Number.isInteger(options.focusPage) ? options.focusPage : 0));
        const pageIds = candidates.slice(page * options.focusPageSize, (page + 1) * options.focusPageSize);
        const included = new Set(pageIds), available = new Set(candidates);
        for (const id of Array.isArray(options.requiredIds) ? options.requiredIds : []) if (available.has(id)) included.add(id);
        for (const id of allSecond) if (included.has(id)) {
          const parent = allFirst.find(firstId => neighbors.get(id).has(firstId));
          if (parent) included.add(parent);
        }
        first = allFirst.filter(id => included.has(id)); second = allSecond.filter(id => included.has(id));
        Object.assign(result, {neighborhoodIds, neighborTotal: candidates.length, neighborPage: page,
          neighborPageCount: pageCount, neighborPageIds: pageIds, focusPageSize: options.focusPageSize,
          additionalIds: [...included].filter(id => !pageIds.includes(id))});
      }
      visible = [options.center, ...first, ...second];
      Object.assign(result, {center: options.center, firstRingIds: first, secondRingIds: second});
    } else if (mode === "compare") {
      const anchors = options.anchors;
      if (!Array.isArray(anchors) || anchors.length !== 2 || anchors[0] === anchors[1]
          || !anchors.every(id => byId.has(id))) return need("Choose two different themes for the Compare layout.");
      const [a, b] = anchors, aNeighbors = neighbors.get(a), bNeighbors = neighbors.get(b);
      common = sortIds([...aNeighbors].filter(id => id !== a && id !== b && bNeighbors.has(id)));
      left = sortIds([...aNeighbors].filter(id => id !== b && !bNeighbors.has(id)));
      right = sortIds([...bNeighbors].filter(id => id !== a && !aNeighbors.has(id)));
      // A caller-supplied shortest route can pass through themes beyond both
      // neighborhoods. Those route themes join the middle column in route order.
      const shown = new Set([a, b, ...left, ...common, ...right]);
      const route = (Array.isArray(options.routeIds) ? options.routeIds : [])
        .filter((id, index, all) => byId.has(id) && !shown.has(id) && all.indexOf(id) === index);
      visible = [a, b, ...left, ...common, ...route, ...right];
      Object.assign(result, {anchors: [...anchors], leftOnlyIds: left, rightOnlyIds: right,
        commonNeighborIds: common, routeIds: route, anchorsConnected: aNeighbors.has(b)});
    } else visible = nodes.map(node => node.id);
    const visibleSet = new Set(visible);
    result.visibleIds = visible;
    result.omittedIds = nodes.filter(node => !visibleSet.has(node.id)).map(node => node.id);
    result.omittedCount = result.omittedIds.length;
    if (mode === "saved-date") {
      result.dateThrough = /^\d{4}-\d{2}-\d{2}$/.test(options.today || "") && Number.isFinite(Date.parse(options.today+"T00:00:00Z"))
        ? options.today : new Date().toISOString().slice(0,10);
      result.dateBuckets = [];
    }
    if (!visible.length) return result;
    const labelWidths = options.labelWidths;
    for (const id of visible) {
      const measuredWidth = labelWidths instanceof Map ? labelWidths.get(id)
        : labelWidths && typeof labelWidths === "object" ? labelWidths[id] : undefined;
      footprints.set(id, footprint(byId.get(id), measuredWidth));
    }
    const halfWidth = Math.max(...[...footprints.values()].map(item => item.halfWidth));
    const halfHeight = Math.max(...[...footprints.values()].map(item => item.halfHeight));
    const cellWidth = 2 * halfWidth + GAP, cellHeight = 2 * halfHeight + GAP;
    const put = (id, x, y) => {
      const node = byId.get(id), measured = footprints.get(id);
      positions.set(id, {id, x, y, radius: measured.radius, group: node.group});
    };
    if (mode === "saved-date") {
      const today = result.dateThrough;
      const month = today.slice(0,7), recent = new Date(today+"T00:00:00Z");recent.setUTCDate(1);recent.setUTCMonth(recent.getUTCMonth()-2);
      const buckets = [
        {id:"future",label:"Future saved date"}, {id:"month",label:"This month"},
        {id:"recent",label:"Previous two months"}, {id:"year",label:"Earlier this year"},
        {id:"older",label:"Earlier years"}, {id:"unknown",label:"Saved date unavailable"}
      ].map(bucket=>({...bucket,ids:[]}));
      const dates=new Map();
      for (const id of visible) {
        const raw=byId.get(id).last_saved, validDate=typeof raw==="string" && /^\d{4}-\d{2}-\d{2}(?:T|$)/.test(raw)
          && Number.isFinite(Date.parse(raw.slice(0,10)+"T00:00:00Z")) && new Date(raw.slice(0,10)+"T00:00:00Z").toISOString().slice(0,10)===raw.slice(0,10);
        const time=validDate?Date.parse(raw):NaN;
        const day=Number.isFinite(time)?new Date(time).toISOString().slice(0,10):null;
        dates.set(id,day);
        const key=!day?"unknown":day>today?"future":day.slice(0,7)===month?"month"
          :day>=recent.toISOString().slice(0,10)?"recent":day.slice(0,4)===today.slice(0,4)?"year":"older";
        buckets.find(bucket=>bucket.id===key).ids.push(id);
      }
      const used=buckets.filter(bucket=>bucket.ids.length), heading=40;
      // Date bands run across the viewport, with extra columns for a busy
      // period. Keep the existing UTC bucket meanings and missing-date bucket.
      let rows=1,best=Infinity;
      const bandWidth=count=>Math.max(260,Math.ceil(count/rows)*cellWidth);
      for(let count=1;count<=Math.max(...used.map(bucket=>bucket.ids.length));count++){
        const requiredWidth=used.reduce((sum,bucket)=>sum+Math.max(260,Math.ceil(bucket.ids.length/count)*cellWidth)+GAP,2*PADDING-GAP);
        const scale=Math.max(requiredWidth/width,(count*cellHeight+heading+2*PADDING)/height);
        if(scale<best){best=scale;rows=count;}
      }
      const requiredWidth=used.reduce((sum,bucket)=>sum+bandWidth(bucket.ids.length)+GAP,2*PADDING-GAP);
      result.width=Math.max(width,requiredWidth);
      result.height=Math.max(height,rows*cellHeight+heading+2*PADDING);
      let x=(result.width-requiredWidth)/2+PADDING;
      const y=(result.height-(rows*cellHeight+heading))/2;
      result.dateBuckets=[];
      for(const bucket of used){
        bucket.ids.sort((a,b)=>compare(dates.get(b)||"",dates.get(a)||"")||compare(labelKey(byId.get(a)),labelKey(byId.get(b)))||compare(a,b));
        const span=bandWidth(bucket.ids.length), columns=Math.ceil(bucket.ids.length/rows);
        result.dateBuckets.push({id:bucket.id,label:bucket.label,count:bucket.ids.length,x:x+span/2,y:y+14});
        bucket.ids.forEach((id,index)=>put(id,x+span/2-(columns-1)*cellWidth/2+Math.floor(index/rows)*cellWidth,y+heading+halfHeight+(index%rows)*cellHeight));
        x+=span+GAP;
      }
    } else if (mode === "grid") {
      // Choose a balanced world extent before Fit. Restricting columns to the
      // initial viewport width creates a tall strip and wastes horizontal room
      // once the complete layout is uniformly scaled into a wide viewport.
      let columns = 1, bestScale = Infinity, bestWaste = Infinity;
      for (let candidate = 1; candidate <= visible.length; candidate++) {
        const rows = Math.ceil(visible.length / candidate);
        const requiredWidth = candidate * cellWidth + 2 * PADDING;
        const requiredHeight = rows * cellHeight + 2 * PADDING;
        const scale = Math.max(requiredWidth / width, requiredHeight / height);
        const waste = candidate * rows - visible.length;
        if (scale < bestScale || scale === bestScale && waste < bestWaste) {
          columns = candidate; bestScale = scale; bestWaste = waste;
        }
      }
      const rows = Math.ceil(visible.length / columns);
      result.width = Math.max(width, columns * cellWidth + 2 * PADDING);
      result.height = Math.max(height, rows * cellHeight + 2 * PADDING);
      const startX = (result.width - (columns - 1) * cellWidth) / 2;
      const startY = (result.height - (rows - 1) * cellHeight) / 2;
      visible.forEach((id, index) => put(id, startX + index % columns * cellWidth, startY + Math.floor(index / columns) * cellHeight));
      Object.assign(result, {columns, rows});
    } else if (mode === "compare") {
      const middle=[...common,...result.routeIds];
      const largest=Math.max(left.length,right.length,middle.length,1);
      let columns=1,best=Infinity;
      for(let count=1;count<=largest;count++){
        const scale=Math.max((3*count*cellWidth+2*GAP+2*PADDING)/width,((Math.ceil(largest/count)+1)*cellHeight+2*PADDING)/height);
        if(scale<best){best=scale;columns=count;}
      }
      const rows=Math.ceil(largest/columns)+1, lane=columns*cellWidth+GAP;
      result.width = Math.max(width, 3*lane-GAP+2*PADDING);
      result.height = Math.max(height, rows*cellHeight+2*PADDING);
      const centerX=result.width/2, firstY=(result.height-(rows-1)*cellHeight)/2;
      put(options.anchors[0], centerX-lane, firstY);
      put(options.anchors[1], centerX+lane, firstY);
      for (const [ids, x] of [[left, centerX-lane], [middle, centerX], [right, centerX+lane]]) {
        ids.forEach((id,index)=>put(id,x-(columns-1)*cellWidth/2+(index%columns)*cellWidth,firstY+(Math.floor(index/columns)+1)*cellHeight));
      }
      result.compareColumns=columns;
    } else {
      // Fit actual rectangular label footprints, rather than an enclosing disk
      // stretched a second time. That old bound shrank wide Focus views badly.
      let best=null;
      for(const aspect of [1,1.25,1.5,1.75,2,2.5,3]){
        const unit=[{id:options.center,x:0,y:0}];
        for(const [ids,radius] of [[first,1],[second,2]]) ids.forEach((id,index)=>{
          const angle=-Math.PI/2+index*Math.PI*2/ids.length;
          unit.push({id,x:Math.cos(angle)*radius*aspect,y:Math.sin(angle)*radius});
        });
        let scale=0;
        for(let i=0;i<unit.length;i++)for(let j=i+1;j<unit.length;j++){
          const a=unit[i],b=unit[j],fa=footprints.get(a.id),fb=footprints.get(b.id);
          scale=Math.max(scale,Math.min((fa.halfWidth+fb.halfWidth+GAP)/Math.max(1e-12,Math.abs(a.x-b.x)),
            (fa.halfHeight+fb.halfHeight+GAP)/Math.max(1e-12,Math.abs(a.y-b.y))));
        }
        scale+=1; // Stable clearance against floating-point boundary rounding.
        const extent=second.length?2:first.length?1:0;
        const w=Math.max(width,2*(extent*scale*aspect+halfWidth+PADDING));
        const h=Math.max(height,2*(extent*scale+halfHeight+PADDING));
        const score=Math.max(w/width,h/height);
        if(!best || score<best.score)best={aspect,scale,w,h,score};
      }
      const aspect=best.aspect,innerRadius=first.length?best.scale:0,outerRadius=second.length?2*best.scale:0;
      result.width=best.w;result.height=best.h;
      const x = result.width / 2, y = result.height / 2;
      put(options.center, x, y);
      for (const [ids, radius] of [[first, innerRadius], [second, outerRadius]]) ids.forEach((id, index) => {
        const angle = -Math.PI / 2 + index * Math.PI * 2 / ids.length;
        put(id, x + Math.cos(angle) * radius*aspect, y + Math.sin(angle) * radius);
      });
      Object.assign(result, {innerRadius, outerRadius, ringAspect:aspect});
    }
    return result;
  }
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

  function curvePoint(curve, t = .5) {
    const u = 1 - t;
    return {x: u * u * curve.a.x + 2 * u * t * curve.control.x + t * t * curve.b.x,
      y: u * u * curve.a.y + 2 * u * t * curve.control.y + t * t * curve.b.y};
  }

  function connectionCurve(edge, positions) {
    const [from, to] = [edge.from, edge.to].sort(), a = positions.get(from), b = positions.get(to);
    if (!a || !b) return null;
    const dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy);
    const middle = {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2};
    const lengthSquared = dx * dx + dy * dy, softLength = Math.sqrt(lengthSquared + 48 * 48);
    const normal = {x: -dy / softLength, y: dx / softLength};
    const shortEdge = lengthSquared / (lengthSquared + 80 * 80), restBend = 64 * length / (length + 240);
    let pressure = 0;
    for (const [id, p] of positions) if (id !== from && id !== to) {
      const px = p.x - middle.x, py = p.y - middle.y;
      const t = clamp(.5 + (px * dx + py * dy) / (lengthSquared + 48 * 48), 0, 1);
      const along = 16 * t * t * (1 - t) * (1 - t), rest = 2 * t * (1 - t) * restBend * shortEdge;
      const distance = px * normal.x + py * normal.y - rest;
      const reach = 120 + (p.radius || 24), q = distance / reach;
      if (Math.abs(q) >= 1) continue;
      const falloff = (1 - q * q) ** 3;
      pressure -= 160 * along * falloff * distance / Math.sqrt(distance * distance + 36 * 36);
    }
    const bend = shortEdge * (restBend + 180 * Math.tanh(pressure / 180));
    const chosen = {a, b, control: {x: middle.x + normal.x * bend, y: middle.y + normal.y * bend}};
    chosen.path = `M ${a.x} ${a.y} Q ${chosen.control.x} ${chosen.control.y} ${b.x} ${b.y}`;
    chosen.badge = curvePoint(chosen);
    return chosen;
  }

  return {arrange, wrapLabel, footprint, curvePoint, connectionCurve};
});
