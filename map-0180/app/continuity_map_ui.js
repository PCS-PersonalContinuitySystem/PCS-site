"use strict";

// Private map presentation stays out of localStorage and analytics. The nonprivate
// line-style percentage comes from browser Appearance preferences. Only explicitly
// reviewed supporting records enter the existing Conversation handoff path.
((root) => {
  const {render: sourceEvidence} = root.PCSSourceEvidence || (typeof module !== "undefined" && require("./source_evidence_ui.js"));
  const NS = "http://www.w3.org/2000/svg";
  // The four-point mark from pcs-star.svg, centered at (29, 19) below.
  const BRAND_STAR_PATH = "m29 5 4 9 10 4-10 4-4 11-4-11-10-4 10-4Z";
  // 0.9.107: up to 50,000 memories once the connection index is built.
  const MAX_NODES = 1000, MAX_EDGES = 10000, MAX_MEMORIES = 50000, MAX_NOTEBOOKS = 128;
  const MAX_RECORDS = MAX_MEMORIES + MAX_NOTEBOOKS, MAX_SAVED_ITEMS = 250, YOUNG_VAULT_MEMORIES = 12;
  const MODES = ["connections", "groups", "circle", "focus", "compare", "grid", "saved-date"];
  const POSITION_MODES = ["connections", "groups", "circle", "grid"];
  // 0.9.119: where themes come from; the server sets aside phrasing that
  // recurs across many records. 0.9.139: labels and repeated wording is the
  // default; a Local account contributes the names in its statements.
  const THEME_SOURCES = ["labels", "labels_first", "all"], ACTIVITY_MONTHS = 12;
  // 0.9.160: Map opens on the sky (All links). An explicitly saved
  // Constellations view is kept; Focus, Compare and the retired Circle, Grid
  // and Saved-date layouts open as the sky. Saved positions stay unchanged.
  const openingMode = saved => saved === "groups" ? "groups" : "connections";
  const RETIRED_MODES = ["circle", "grid", "saved-date"];
  const PRESENTATION_MAX_BYTES=256000;
  const presentationFits = value => {
    const serialized=JSON.stringify(value);
    let bytes=0;for(const char of serialized){const point=char.codePointAt(0);bytes+=point<128?1:point<2048?2:point<65536?3:4;}
    return bytes<=PRESENTATION_MAX_BYTES;
  };
  const mapLayouts = typeof module !== "undefined" && module.exports ? require("./map_layouts.js") : root.PCSMapLayouts;
  const constellations = typeof module !== "undefined" && module.exports ? require("./map_constellations.js") : root.PCSMapConstellations;
  const validId = value => typeof value === "string" && /^theme_[a-f0-9]{20}$/.test(value);
  const validLink = value => typeof value === "string" && /^link_[a-f0-9]{20}$/.test(value);
  const text = (value, max) => typeof value === "string" && value.length <= max * 2 && Array.from(value).length <= max;
  const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
  const ref = item => ({kind: item.kind, id: item.id, revision: item.revision});
  const validRecord = item => item && ["memory", "notebook"].includes(item.kind)
    && typeof item.id === "string" && new RegExp("^" + (item.kind === "memory" ? "mem" : "notebook") + "_[a-f0-9]{32}$").test(item.id)
    && integer(item.revision, 1, 2147483647) && text(item.title, 160) && text(item.excerpt, 600);
  const provenance = item => ["distinct_cited_passage_count","records_without_cited_passages","citation_status","evidence_group_count"].every(key=>item[key]===undefined)
    || integer(item.distinct_cited_passage_count,0,2147483647) && integer(item.records_without_cited_passages,0,item.support_count)
      && ["available","unknown"].includes(item.citation_status) && integer(item.evidence_group_count,1,item.support_count);
  const validEvidenceId = value => typeof value==="string" && /^evidence_[a-f0-9]{20}$/.test(value);
  const recordIdentity = item => item && ["memory","notebook"].includes(item.kind)
    && new RegExp("^"+(item.kind==="memory"?"mem":"notebook")+"_[a-f0-9]{32}$").test(item.id || "") && integer(item.revision,1,2147483647);
  function matchContexts(record) {
    if (record.match_contexts===undefined) return true;
    return Array.isArray(record.match_contexts) && record.match_contexts.length<=2 && record.match_contexts.every(context=>
      text(context.term,64) && text(context.label,64) && ["saved_label","recurring_wording"].includes(context.basis)
      && text(context.text,600) && context.span_offset_unit==="utf16" && typeof context.truncated_before==="boolean" && typeof context.truncated_after==="boolean"
      && Array.isArray(context.spans) && context.spans.length>0 && context.spans.length<=16
      && context.spans.every((span,i)=>integer(span.start,0,context.text.length-1) && integer(span.end,span.start+1,context.text.length)
        && (!i || span.start>=context.spans[i-1].end)));
  }
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const themeCount = count => `${count} ${count===1?"theme":"themes"}`;
  const safeText = (value,max,multiline=false,empty=false) => text(value,max) && (empty || value.trim().length>0)
    && !/[\uD800-\uDFFF]/u.test(Array.from(value).filter(char=>char.length===1).join(""))
    && !(multiline ? /[\u0000-\u0008\u000b-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/ : /[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/).test(value);
  function checkedNamedView(value) {
    const keys=["id","name","filters","mode","pins","focus_only","list_mode","focus_center","compare_anchors","second_ring","viewport"];
    const f=value?.filters,b=value?.viewport, fail=()=>{throw new Error("Saved map views could not be checked.");};
    if(!value || Object.keys(value).length!==keys.length || !keys.every(key=>Object.hasOwn(value,key))
      || !/^view_[a-f0-9]{32}$/.test(value.id || "") || !safeText(value.name,60) || !MODES.includes(value.mode)
      || !["focus_only","list_mode","second_ring"].every(key=>typeof value[key]==="boolean")
      || !Array.isArray(value.pins) || value.pins.length>3 || !value.pins.every(validId) || new Set(value.pins).size!==value.pins.length
      || value.focus_center!==null && !validId(value.focus_center) || !Array.isArray(value.compare_anchors) || value.compare_anchors.length>2
      || !value.compare_anchors.every(id=>id===null || validId(id))
      || new Set(value.compare_anchors.filter(Boolean)).size!==value.compare_anchors.filter(Boolean).length
      || !f || !["query","days","kind","strong_only","include_single"].every(key=>Object.hasOwn(f,key))
      || Object.keys(f).some(key=>!["query","days","kind","strong_only","include_single","through"].includes(key))
      || !safeText(f.query,300,false,true) || ![0,30,90].includes(f.days) || !["all","memory","notebook"].includes(f.kind)
      || typeof f.strong_only!=="boolean" || typeof f.include_single!=="boolean"
      || f.through!==undefined && f.through!=="" && (dayNumber(f.through)===null || f.through<"1900-01-01")
      || !b || Object.keys(b).length!==4 || !["x","y","width","height"].every(key=>Number.isFinite(b[key])
        && (["width","height"].includes(key)?b[key]>=.02 && b[key]<=20:b[key]>=-8 && b[key]<=8))) fail();
    return JSON.parse(JSON.stringify(value));
  }
  const dayNumber = value => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const time = Date.parse(value + "T00:00:00Z");
    return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value ? time / 86400000 : null;
  };
  const dayText = value => new Date(value * 86400000).toISOString().slice(0, 10);
  function checkedTimeline(t, coverage) {
    const fail = () => { throw new Error("The saved-date comparison could not be checked. Refresh the map."); };
    if (!t || t.basis !== "current_record_last_saved_utc" || ![0,30,90].includes(t.days)
      || !["today","earliest","through"].every(k => dayNumber(t[k]) !== null)
      || t.earliest > t.today || t.through > t.today || t.through < "1900-01-01"
      || t.current_records !== coverage.records_in_scope || !integer(t.previous_records, 0, MAX_RECORDS-t.current_records)
      || !integer(t.undated_records,0,MAX_RECORDS) || !integer(t.future_dated_records,0,MAX_RECORDS)
      || !Array.isArray(t.rows) || t.rows.length > MAX_NODES) fail();
    const end = dayNumber(t.through) + 1;
    if (t.days ? (t.start !== dayText(end-t.days) || t.previous_start !== dayText(end-2*t.days)
        || t.previous_through !== dayText(end-t.days-1))
      : (t.start !== null || t.previous_start !== null || t.previous_through !== null || t.previous_records !== 0 || t.rows.length)) fail();
    if (new Set(t.rows.map(row => row.id)).size !== t.rows.length) fail();
    for (const row of t.rows) {
      const a=row.current_count,b=row.previous_count;
      if (!validId(row.id) || !text(row.label,64) || !row.label.trim()
        || !integer(a,0,t.current_records) || !integer(b,0,t.previous_records) || !a&&!b
        || row.change !== (!b?"only_current":!a?"only_previous":a>b?"more":a<b?"less":"same")) fail();
    }
    return t;
  }
  function shortestPath(view, from, to) {
    if (!view?.nodeMap.has(from) || !view.nodeMap.has(to)) return null;
    const queue=[from], seen=new Map([[from,null]]), via=new Map();
    for (let i=0;i<queue.length && !seen.has(to);i++) {
      const id=queue[i];
      const adjacent=view.edges.filter(e=>e.from===id||e.to===id).map(e=>({id:e.from===id?e.to:e.from,edge:e.id}))
        .sort((a,b)=>a.id.localeCompare(b.id));
      for(const next of adjacent) if(!seen.has(next.id)) {seen.set(next.id,id);via.set(next.id,next.edge);queue.push(next.id);}
    }
    if(!seen.has(to)) return null;
    const nodes=[],edges=[];
    for(let id=to;id!==null;id=seen.get(id)) {nodes.push(id);if(via.has(id))edges.push(via.get(id));}
    return {nodes:nodes.reverse(),edges:edges.reverse()};
  }
  function bridgePaths(view) {
    // Only existing two-edge routes, never a guessed new relationship.
    const direct=new Set(view.edges.map(e=>[e.from,e.to].sort().join(":"))), best=new Map();
    for(const middle of view.nodes) {
      const adjacent=view.edges.filter(e=>e.from===middle.id||e.to===middle.id)
        .map(e=>({id:e.from===middle.id?e.to:e.from,edge:e})).sort((a,b)=>a.id.localeCompare(b.id));
      for(let i=0;i<adjacent.length;i++) for(let j=i+1;j<adjacent.length;j++) {
        const a=adjacent[i],b=adjacent[j],key=[a.id,b.id].join(":"); if(direct.has(key))continue;
        const score=Math.min(a.edge.support_count,b.edge.support_count);
        const route={nodes:[a.id,middle.id,b.id],edges:[a.edge.id,b.edge.id],score};
        const old=best.get(key);
        if(!old||score>old.score||score===old.score&&middle.id<old.nodes[1])best.set(key,route);
      }
    }
    return [...best.values()].sort((a,b)=>b.score-a.score||a.nodes.join(":").localeCompare(b.nodes.join(":"))).slice(0,6);
  }
  // 0.9.160: optional, unsigned navigation between the owner's map and PCS's
  // own map. Anything malformed is dropped whole; it never blocks the map.
  const THOUGHT_KINDS = ["interest", "inquiry", "perspective", "encounter", "reflection"];
  const thoughtId = value => typeof value === "string" && /^ps_[0-9a-f]{32}$/.test(value);
  function checkedCompanions(value, nodeMap) {
    const empty = {thoughts: [], byTheme: new Map(), start: null};
    try {
      if (!value || !Array.isArray(value.thoughts) || value.thoughts.length > 64) return empty;
      const thoughts = value.thoughts.map(row => {
        if (!row || !thoughtId(row.id) || !THOUGHT_KINDS.includes(row.kind) || !text(row.title, 200) || !row.title.trim()
          || !text(row.state, 24) || typeof row.needs_review !== "boolean"
          || !Array.isArray(row.themes) || row.themes.length > 12 || !row.themes.every(validId)) throw new Error("thought");
        return {id: row.id, kind: row.kind, state: row.state, title: row.title, needs_review: row.needs_review,
          themes: row.themes.filter(id => nodeMap.has(id))};
      });
      const byTheme = new Map();
      for (const thought of thoughts) for (const id of thought.themes) { if (!byTheme.has(id)) byTheme.set(id, []); byTheme.get(id).push(thought); }
      let start = null;
      const s = value.start;
      if (s) {
        const more = s.more === undefined ? [] : s.more;
        if (!Array.isArray(more) || more.length > 250 || !more.every(group => Array.isArray(group) && group.length === 2 && text(group[0], 64)
            && Array.isArray(group[1]) && group[1].length <= 250 && group[1].every(name => text(name, 64) && name.trim()))
          || more.reduce((sum, group) => sum + group[1].length, 0) > 250
          || s.names_left_out !== undefined && !integer(s.names_left_out, 0, MAX_RECORDS * 160)) throw new Error("start");
        if (!Array.isArray(s.areas) || s.areas.length > 24 || !Array.isArray(s.frontier) || s.frontier.length > 24 || !s.frontier.every(thoughtId)
          || !integer(s.scanned, 0, MAX_MEMORIES) || !integer(s.total, 0, MAX_MEMORIES)
          || !s.areas.every(a => a && validId(a.id) && text(a.label, 64) && a.label.trim() && Array.isArray(a.also) && a.also.length <= 3
            && a.also.every(word => text(word, 64)) && integer(a.records, 1, MAX_MEMORIES))) throw new Error("start");
        start = {areas: s.areas.map(a => ({id: a.id, label: a.label, also: [...a.also], records: a.records})),
          more: more.map(group => [group[0], [...group[1]]]), namesLeftOut: s.names_left_out || 0,
          frontier: [...s.frontier], scanned: s.scanned, total: s.total};
      }
      return {thoughts, byTheme, start};
    } catch (_) { return empty; }
  }
  function checked(value, requestedFilters) {
    if (requestedFilters !== undefined && value?.filters?.themes !== requestedFilters.themes)
      throw new Error("This map's theme source changed. Refresh to try again.");
    if (!value || value.schema_version !== 1 || !/^[a-f0-9]{64}$/.test(value.snapshot || "")
      || !Array.isArray(value.nodes) || value.nodes.length > MAX_NODES
      || !Array.isArray(value.edges) || value.edges.length > MAX_EDGES
      || !value.nodes.every(n => validId(n.id) && text(n.label, 64) && n.label.trim()
        && ["saved_label", "recurring_wording"].includes(n.basis) && text(n.summary, 160)
        && text(n.last_saved, 64) && text(n.sample, 600) && integer(n.support_count, 1, MAX_RECORDS)
        && integer(n.memory_count, 0, MAX_MEMORIES) && integer(n.notebook_count, 0, MAX_NOTEBOOKS)
        && n.memory_count + n.notebook_count === n.support_count && typeof n.limited_evidence === "boolean"
        && integer(n.group, 0, MAX_NODES - 1) && (n.term===undefined || text(n.term,64)) && provenance(n)
        && (n.monthly_counts===undefined || Array.isArray(n.monthly_counts) && n.monthly_counts.length===ACTIVITY_MONTHS
          && n.monthly_counts.every(c=>integer(c,0,n.support_count)) && n.monthly_counts.reduce((a,c)=>a+c,0)<=n.support_count))) throw new Error("This map could not be checked. Refresh to try again.");
    const nodeMap = new Map(value.nodes.map(n => [n.id, n]));
    const edgeMap = new Map(value.edges.map(e => [e.id, e]));
    if (nodeMap.size !== value.nodes.length || edgeMap.size !== value.edges.length
      || !value.edges.every(e => validLink(e.id) && nodeMap.has(e.from) && nodeMap.has(e.to) && e.from !== e.to
        && e.basis === "shared_records" && text(e.label, 160) && integer(e.support_count, 1, MAX_RECORDS)
        && e.support_count <= Math.min(nodeMap.get(e.from).support_count, nodeMap.get(e.to).support_count)
        && typeof e.repeated === "boolean" && e.repeated === (e.support_count >= 2)
        && Number.isFinite(e.weight) && e.weight > 0 && e.weight <= 1 && provenance(e)))
      throw new Error("The map connections could not be checked. Refresh to try again.");
    const coverage = value.coverage;
    if (!coverage || !integer(coverage.records_in_scope, 0, MAX_RECORDS)
      || !integer(coverage.memory_scanned, 0, MAX_MEMORIES) || !integer(coverage.notebook_scanned, 0, MAX_NOTEBOOKS)
      || !integer(coverage.memory_total, 0, 50000) || !integer(coverage.notebook_total, 0, 128)
      || typeof coverage.records_limited !== "boolean"
      || !integer(coverage.date_excluded, 0, MAX_RECORDS) || !integer(coverage.text_limited, 0, coverage.records_in_scope)
      || !integer(coverage.candidate_themes, 0, MAX_RECORDS * 160) || coverage.themes_shown !== value.nodes.length
      || !integer(coverage.links_omitted, 0, MAX_NODES * (MAX_NODES - 1) / 2))
      throw new Error("The map coverage could not be checked. Refresh to try again.");
    if((coverage.theme_source!==undefined || value.filters?.themes!==undefined) && (!THEME_SOURCES.includes(coverage.theme_source)
      || coverage.theme_source!==value.filters?.themes || !integer(coverage.phrasing_set_aside,0,MAX_RECORDS*160)
      || !integer(coverage.labeled_records,0,coverage.records_in_scope) || !value.nodes.every(n=>n.monthly_counts!==undefined)))
      throw new Error("The map theme sources could not be checked. Refresh to try again.");
    if(coverage.date_filtered_before_sampling!==undefined){
      if(coverage.date_filtered_before_sampling!==true || dayNumber(coverage.earliest_matching_save)===null)
        throw new Error("The saved-date sample coverage could not be checked.");
      for(const kind of ["memory","notebook"]){
        const total=coverage[kind+"_total"],eligible=coverage[kind+"_date_matching"],scanned=coverage[kind+"_scanned"];
        const current=coverage[kind+"_current_total"],previous=coverage[kind+"_previous_total"];
        const currentRead=coverage[kind+"_current_scanned"],previousRead=coverage[kind+"_previous_scanned"];
        if(!integer(eligible,0,total) || !integer(current,0,eligible) || !integer(previous,0,eligible)
          || current+previous!==eligible || !integer(currentRead,0,current) || !integer(previousRead,0,previous)
          || currentRead+previousRead!==scanned)throw new Error("The saved-date sample counts could not be checked.");
      }
    }
    if (value.timeline !== undefined) {
      checkedTimeline(value.timeline, coverage);
      if (value.timeline.days !== value.filters?.days || value.filters?.through && value.timeline.through !== value.filters.through)
        throw new Error("The saved-date comparison does not match the selected filters.");
    }
    return {...value, nodeMap, edgeMap, companions: checkedCompanions(value.companions, nodeMap)};
  }
  function checkedDetail(value, view, selection) {
    const item = selection.kind === "theme" ? view.nodeMap.get(selection.id) : view.edgeMap.get(selection.id);
    if (!value || value.schema_version !== 1 || value.snapshot !== view.snapshot
      || value.selection?.id !== selection.id || value.selection?.kind !== selection.kind || !item
      || value.item?.id !== item.id || value.total !== item.support_count || !integer(value.offset, 0, MAX_RECORDS - 1)
      || !Array.isArray(value.records) || value.records.length > 12
      || value.records.length !== Math.min(12, Math.max(0, value.total - value.offset))
      || value.next_offset !== (value.offset + 12 < value.total ? value.offset + 12 : null)
      || !value.records.every(r => validRecord(r) && text(r.origin, 120) && text(r.updated_at, 64)
        && Array.isArray(r.source_previews) && r.source_previews.length <= 2
        && r.source_previews.every(s => /^src_[a-f0-9]{32}$/.test(s.id || "") && text(s.text, 280)
          && text(s.role, 64) && text(s.created_at, 64) && typeof s.truncated === "boolean"
          && (s.basis===undefined || s.basis==="original_cited_passage")) && matchContexts(r)
        && (r.citation_status===undefined || ["available","unknown"].includes(r.citation_status))
        && (r.unavailable_source_count===undefined || integer(r.unavailable_source_count,0,2147483647))
        && (r.evidence_group_id===undefined || validEvidenceId(r.evidence_group_id) && integer(r.evidence_group_size,1,value.total))))
      throw new Error("This evidence no longer matches the map. Refresh before inspecting it.");
    if (new Set(value.records.map(r => r.kind + ":" + r.id)).size !== value.records.length)
      throw new Error("The map evidence contains duplicate records. Refresh to try again.");
    if (value.evidence_groups!==undefined) {
      const groups=value.evidence_groups, refs=[];
      if (!Array.isArray(groups) || groups.length>value.total || !groups.every(group=>validEvidenceId(group.id)
          && integer(group.record_count,1,value.total) && Array.isArray(group.records) && group.records.length===group.record_count && group.records.every(recordIdentity))
          || new Set(groups.map(group=>group.id)).size!==groups.length) throw new Error("The evidence grouping could not be checked.");
      for (const group of groups) refs.push(...group.records.map(record=>record.kind+":"+record.id));
      if (refs.length!==value.total || new Set(refs).size!==refs.length || !value.records.every(record=>groups.some(group=>group.id===record.evidence_group_id
          && group.record_count===record.evidence_group_size && group.records.some(item=>item.kind===record.kind && item.id===record.id && item.revision===record.revision))))
        throw new Error("The evidence grouping does not match its records.");
    }
    return value;
  }
  function neighborhood(view, selected, pins = [], focused = false) {
    const focus = new Set(pins.filter(id => view.nodeMap.has(id)));
    if ((focused || focus.size) && selected && view.nodeMap.has(selected)) focus.add(selected);
    if (!focus.size) return new Set(view.nodes.map(n => n.id));
    const visible = new Set(focus);
    for (const e of view.edges) if (focus.has(e.from) || focus.has(e.to)) { visible.add(e.from); visible.add(e.to); }
    return visible;
  }
  // Selection and visibility have different lifetimes. Both ends of an
  // inspected connection remain anchors alongside any pinned neighborhoods.
  function selectionNeighborhood(view, selection, pins = [], focused = false) {
    const edge = selection?.kind === "connection" && view.edgeMap.get(selection.id);
    const anchors = edge && (focused || pins.length) ? [...pins, edge.from, edge.to] : pins;
    return neighborhood(view, selection?.kind === "theme" ? selection.id : null, anchors, focused);
  }
  // 0.9.139: each current statement of a Local account is one observation;
  // other records count once. Records still back inspection and the 2+ filter.
  const observations = item => integer(item?.observation_count, item?.support_count, 1e7) ? item.observation_count : item.support_count;
  const observed = item => observations(item) !== item.support_count;
  const recordsText = (count, item, noun = "records") => observed(item)
    ? `${observations(item)} observations in ${count} ${count === 1 ? noun.replace(/s$/, "") : noun}`
    : `${count} ${count === 1 ? noun.replace(/s$/, "") : noun}`;
  const displayCount = (item, unique = false) => unique && integer(item.evidence_group_count, 1, item.support_count)
    ? item.evidence_group_count : observations(item);
  // This is always the owner's literal note text, never a copied theme label.
  const noteTitle = value => {
    const first = String(value || "").split(/\r?\n/).find(line => line.trim())?.trim() || "";
    return Array.from(first).length > 80 ? Array.from(first).slice(0, 79).join("") + "…" : first;
  };
  function findTheme(nodes, query) {
    const q = query.trim().normalize("NFKC").toLocaleLowerCase();
    if (!q) return [];
    return nodes.filter(n => n.label.normalize("NFKC").toLocaleLowerCase().includes(q))
      .sort((a, b) => (a.label.toLocaleLowerCase() === q ? -1 : 0) - (b.label.toLocaleLowerCase() === q ? -1 : 0)
        || b.support_count - a.support_count || a.id.localeCompare(b.id));
  }
  function layoutGraph(nodes, edges, width = 860, height = 590, mode = "connections", options = {}) {
    if (["focus", "compare", "grid", "saved-date"].includes(mode)) return {...mapLayouts.arrange(nodes, edges, width, height, mode, options),
      viewportWidth:Number.isFinite(width)&&width>0?width:860,viewportHeight:Number.isFinite(height)&&height>0?height:590};
    if (mode === "connections") return constellations.groupedLayout(nodes, edges, width, height, options);
    width = clamp(Number.isFinite(width) ? width : 860, 360, 1800);
    height = clamp(Number.isFinite(height) ? height : 590, 360, 1000);
    mode = ["connections", "groups", "circle"].includes(mode) ? mode : "connections";
    const groups = [...new Set(nodes.map(n => n.group))].sort((a, b) => a - b);
    const positions = new Map();
    const n = nodes.length;
    const radius = Math.min(width, height) * .25;
    if (mode === "circle") {
      [...nodes].sort((a, b) => a.id.localeCompare(b.id)).forEach((node, i) => {
        const angle = -Math.PI / 2 + i * Math.PI * 2 / Math.max(1, n);
        positions.set(node.id, {id: node.id, x: width / 2 + (n > 1 ? Math.cos(angle) * Math.min(width, height) * .35 : 0),
          y: height / 2 + (n > 1 ? Math.sin(angle) * Math.min(width, height) * .35 : 0),
          radius: Math.min(29, 13 + Math.sqrt(node.support_count) * 2), group: node.group});
      });
      return {width, height, positions};
    }
    if (mode === "groups") {
      // Give each visual group its own cell. Physics anchors crowd labels on
      // wide canvases when several groups contain many themes.
      const buckets = groups.map(group => nodes.filter(node => node.group === group).sort((a, b) => a.id.localeCompare(b.id)));
      const groupColumns = groups.length > 1 && width >= 720 ? 2 : 1;
      const groupRows = Math.ceil(groups.length / groupColumns);
      const nodeColumns = Math.min(4, Math.max(1, Math.ceil(Math.sqrt(Math.max(...buckets.map(bucket => bucket.length), 1)))));
      const nodeRows = Math.ceil(Math.max(...buckets.map(bucket => bucket.length), 1) / nodeColumns);
      const cellWidth = (nodeColumns - 1) * 155 + 100;
      const cellHeight = (nodeRows - 1) * 80 + 42;
      const gapX = 75, gapY = 48;
      const startX = (width - (groupColumns * cellWidth + (groupColumns - 1) * gapX)) / 2;
      const startY = (height - (groupRows * cellHeight + (groupRows - 1) * gapY)) / 2;
      buckets.forEach((bucket, groupIndex) => bucket.forEach((node, i) => {
        const groupColumn = groupIndex % groupColumns, groupRow = Math.floor(groupIndex / groupColumns);
        positions.set(node.id, {id: node.id,
          x: startX + groupColumn * (cellWidth + gapX) + 50 + i % nodeColumns * 155,
          y: startY + groupRow * (cellHeight + gapY) + 28 + Math.floor(i / nodeColumns) * 80,
          radius: Math.min(29, 13 + Math.sqrt(node.support_count) * 2), group: node.group});
      }));
      return {width, height, positions};
    }
    nodes.forEach((node, i) => {
      const groupIndex = groups.indexOf(node.group), angle = groupIndex * Math.PI * 2 / Math.max(1, groups.length) - Math.PI / 2;
      const spiral = (i + 1) * 2.399963229728653;
      positions.set(node.id, {id: node.id, x: width / 2 + (groups.length > 1 ? Math.cos(angle) * radius : 0) + Math.cos(spiral) * (25 + i * 2),
        y: height / 2 + (groups.length > 1 ? Math.sin(angle) * radius : 0) + Math.sin(spiral) * (25 + i * 2),
        radius: Math.min(29, 13 + Math.sqrt(node.support_count) * 2), group: node.group});
    });
    // Settle before drawing. No never-ending physics loop or animation timer.
    // Node centers, labels and count rings keep a generous collision footprint.
    for (let step = 0; step < 180; step++) {
      const forces = new Map(nodes.map(node => [node.id, {x: 0, y: 0}]));
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        const a = positions.get(nodes[i].id), b = positions.get(nodes[j].id);
        let dx = b.x - a.x, dy = b.y - a.y;
        if (Math.abs(dx) + Math.abs(dy) < .01) { dx = 1; dy = .3; }
        const dist = Math.max(1, Math.hypot(dx, dy));
        let f = 1600 / (dist * dist);
        const collision = Math.abs(dx) < 118 && Math.abs(dy) < 91;
        if (collision) f += Math.min(4, (125 - dist) * .07 + 1.5);
        const fa = forces.get(a.id), fb = forces.get(b.id);
        fa.x -= dx / dist * f; fa.y -= dy / dist * f;
        fb.x += dx / dist * f; fb.y += dy / dist * f;
      }
      for (const edge of edges) {
        const a = positions.get(edge.from), b = positions.get(edge.to); if (!a || !b) continue;
        const dx = b.x - a.x, dy = b.y - a.y, dist = Math.max(1, Math.hypot(dx, dy));
        const f = (dist - (125 + (1 - edge.weight) * 55)) * .008;
        const fa = forces.get(a.id), fb = forces.get(b.id);
        fa.x += dx / dist * f; fa.y += dy / dist * f;
        fb.x -= dx / dist * f; fb.y -= dy / dist * f;
      }
      for (const p of positions.values()) {
        const f = forces.get(p.id), groupIndex = groups.indexOf(p.group);
        const angle = groupIndex * Math.PI * 2 / Math.max(1, groups.length) - Math.PI / 2;
        const ax = width / 2 + (groups.length > 1 ? Math.cos(angle) * radius : 0), ay = height / 2 + (groups.length > 1 ? Math.sin(angle) * radius : 0);
        const anchor = .006;
        p.x = clamp(p.x + clamp(f.x + (ax - p.x) * anchor, -9, 9), 64, width - 64);
        p.y = clamp(p.y + clamp(f.y + (ay - p.y) * anchor, -9, 9), 50, height - 86);
      }
    }
    return {width, height, positions};
  }
  function fitBox(layout, edges = []) {
    const points = [...layout.positions.values()];
    if (!points.length) return {x:0, y:0, width:layout.width, height:layout.height};
    // Include labels/rings, preserve the viewport aspect, and cap automatic
    // magnification so a tiny vault does not produce enormous single nodes.
    const headings=[...(layout.dateBuckets || []),...(layout.groupHeadings || [])];
    let left=Math.min(...points.map(p=>p.x-(layout.footprints?.get(p.id)?.halfWidth || 95)),...headings.map(p=>p.x-(p.width/2 || 180))), right=Math.max(...points.map(p=>p.x+(layout.footprints?.get(p.id)?.halfWidth || 95)),...headings.map(p=>p.x+(p.width/2 || 180)));
    let top=Math.min(...points.map(p=>p.y-(layout.footprints?.get(p.id)?.halfHeight || p.radius+66)),...headings.map(p=>p.y-16)), bottom=Math.max(...points.map(p=>p.y+(layout.footprints?.get(p.id)?.halfHeight || p.radius+64)));
    // Repelled curves can extend beyond node bounds. Include exact quadratic
    // extrema and count footprints so Fit never crops their visible evidence.
    for(const edge of edges){
      const curve=connectionCurve(edge,layout.positions);if(!curve)continue;
      const samples=[curve.a,curve.b];
      for(const axis of ["x","y"]){
        const denominator=curve.a[axis]-2*curve.control[axis]+curve.b[axis];
        const t=(curve.a[axis]-curve.control[axis])/denominator;
        if(t>0 && t<1)samples.push(curvePoint(curve,t));
      }
      const badgeHalfWidth=Math.max(18,String(edge.support_count||0).length*7+10)/2+6;
      left=Math.min(left,curve.badge.x-badgeHalfWidth,...samples.map(p=>p.x-6));
      right=Math.max(right,curve.badge.x+badgeHalfWidth,...samples.map(p=>p.x+6));
      top=Math.min(top,curve.badge.y-16,...samples.map(p=>p.y-6));
      bottom=Math.max(bottom,curve.badge.y+16,...samples.map(p=>p.y+6));
    }
    const viewportWidth=layout.viewportWidth || layout.width, viewportHeight=layout.viewportHeight || layout.height;
    const scale=Math.max((right-left)/viewportWidth,(bottom-top)/viewportHeight,0.70);
    const width=viewportWidth*scale, height=viewportHeight*scale;
    return {x:(left+right-width)/2, y:(top+bottom-height)/2, width, height};
  }
  const curvePoint = (curve, t = .5) => mapLayouts.curvePoint(curve, t);
  const connectionCurve = (edge, positions) => mapLayouts.connectionCurve(edge, positions);
  const wrapLabel = label => mapLayouts.wrapLabel(label);
  function measureLabelWidths(document, nodes) {
    const widths = new Map();
    try {
      const canvas = document.createElement("canvas"), measure = canvas.getContext?.("2d");
      if (!measure) return widths;
      // Match the SVG label's widest selected style; never retain measured text.
      measure.font = "650 14px system-ui, sans-serif";
      for (const node of nodes) {
        const width = Math.max(...wrapLabel(node.label).map(line => measure.measureText(line).width));
        if (Number.isFinite(width) && width > 0 && width <= 768) widths.set(node.id, width);
      }
    } catch (_) { /* Pure/test environments use the conservative helper fallback. */ }
    return widths;
  }
  // Width and brightness describe a count of shared saved records, never the
  // truth, confidence or independence of that evidence. Log scaling stays
  // readable when a few connections have many more records than the rest.
  function connectionStyle(count, mode = null) {
    const amount = Math.max(1, Number.isFinite(count) ? count : 1), weight = Math.min(1, Math.log2(amount) / 6);
    return mode === "connections" ? {width: .45 + .9 * weight, opacity: .12 + .2 * weight}
      : {width: 1 + 3.2 * weight, opacity: .25 + .47 * weight};
  }
  function dottedConnections(edges, percent = 60) {
    const groups = new Map();
    for (const edge of edges) groups.set(edge.support_count, (groups.get(edge.support_count) || 0) + 1);
    let dottedCount = 0, cutoff = 0, cumulative = 0, distance = percent * edges.length;
    // Compare integer distances to the target so equally close cutoffs choose
    // fewer dotted lines. Equal shared-record counts always stay together.
    for (const [count, size] of [...groups].sort((a, b) => a[0] - b[0])) {
      cumulative += size;
      const nextDistance = Math.abs(100 * cumulative - percent * edges.length);
      if (nextDistance < distance) { distance = nextDistance; dottedCount = cumulative; cutoff = count; }
    }
    return {cutoff, dottedCount, total: edges.length};
  }
  function create({document, api, context, authorize, inspect, reviewSelection, searchLibrary, draftChanged = () => {}, openThought = () => {}, environment = root}) {
    const $ = name => document.getElementById("map-" + name);
    let singleChosen = false, singleDefaulted = false; // 0.9.163 young-vault default; see defaultSingle().
    const selectionClearedNotice = "Selection cleared. Your notes, pins and saved viewing choices are kept.";
    const el = (tag, cls = "", content) => {
      const item = document.createElement(tag); item.className = cls;
      if (content !== undefined) item.textContent = content; return item;
    };
    const svgEl = (tag, attributes = {}, content) => {
      const item = document.createElementNS(NS, tag);
      for (const [k, v] of Object.entries(attributes)) item.setAttribute(k, String(v));
      if (content !== undefined) item.textContent = content; return item;
    };
    const brandStar = (radius, cls) => svgEl("path", {d: BRAND_STAR_PATH, class: cls,
      transform: `scale(${radius / 14}) translate(-29,-19)`});
    const button = (label, callback, cls = "text-button") => {
      const b = el("button", cls, label); b.type = "button"; b.addEventListener("click", callback); return b;
    };
    const date = value => { const d = new Date(value); return Number.isFinite(d.getTime()) ? d.toLocaleDateString(undefined, {year: "numeric", month: "short", day: "numeric"}) : "Date unavailable"; };
    // Monthly counts cover twelve UTC months ending with the map's through
    // date; position 11 is that month.
    const monthName = position => {
      const through = dayNumber(view?.timeline?.through), day = through === null ? null : new Date(through * 86400000);
      return day ? new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth() - (ACTIVITY_MONTHS - 1 - position), 1))
        .toLocaleDateString(undefined, {year: "numeric", month: "short", timeZone: "UTC"}) : "";
    };
    const sparkline = (counts, cls = "map-sparkline") => {
      const peak = Math.max(1, ...counts), chart = svgEl("svg", {class: cls, viewBox: `0 0 ${ACTIVITY_MONTHS * 6} 16`,
        preserveAspectRatio: "none", "aria-hidden": "true", focusable: "false"});
      counts.forEach((value, i) => { const height = value ? Math.max(3, Math.round(value / peak * 16)) : 1;
        chart.append(svgEl("rect", {x: i * 6, y: 16 - height, width: 4, height, class: value ? "map-spark-bar" : "map-spark-empty"})); });
      return chart;
    };
    const monthsSummary = counts => {
      const total = counts.reduce((a, c) => a + c, 0), peak = Math.max(...counts), busiest = counts.lastIndexOf(peak);
      return total ? `${total} saved in the 12 months through ${monthName(ACTIVITY_MONTHS - 1)} · busiest ${monthName(busiest)} (${peak})`
        : `None saved in the 12 months through ${monthName(ACTIVITY_MONTHS - 1)}`;
    };
    const themeSourceText = c => ({labels: "Themes come from saved labels only.",
      labels_first: "Themes come from saved labels, with wording for records that have none.",
      all: "Themes come from saved labels and repeated wording."}[c.theme_source]
      + ` ${c.labeled_records} of ${c.records_in_scope} records carry saved labels.`
      + (c.phrasing_set_aside ? ` ${c.phrasing_set_aside} frequent ${c.phrasing_set_aside === 1 ? "phrase is" : "phrases are"} set aside.` : ""));
    const unlabeledText = c => c.theme_source === "labels" && c.records_in_scope > 0 && c.labeled_records < c.records_in_scope
      ? "No saved labels make themes under these filters. In Map settings, choose Themes from → Labels, then wording, to include records without labels." : "";
    let active = false, view = null, selected = null, detail = null, pins = [], focusOnly = false;
    let operation = 0, detailOperation = 0, busy = false, detailBusy = false, errorText = "";
    let indexBuild = null;
    let layout = null, box = null, dragged = null, clickSuppressed = false;
    let clustering = null, clusterAnchor = null, clusterPage = 0, cloudPageSize = 12, activeLabel = null;
    let dragFrame = null, viewportFrame = null, fitBounds = null;
    let toast = null;
    let layoutConfirmation = null;
    const renderedNodes = new Map(), incidentLines = new Map();
    let layoutMode = "groups", savedPositions = new Map(), positionsByMode = new Map(POSITION_MODES.map(mode=>[mode,new Map()])), layoutOwner = null, layoutEpoch = 0;
    // Connections bundles links between constellations into one counted line
    // until the owner opens that bundle (0.9.106). Presentation only.
    let expandedBundles = new Set();
    let hiddenThemes = new Set(), hiddenLinks = new Set(), presentationUndo = [], focusCenter = null, focusPage = 0, compareAnchors = [], secondRing = false;
    let past = [], future = [], navigating = false, navigationJob = null, chosenRecords = new Map();
    let namedViews=[],connectionNotes=new Map(),noteDrafts=new Map(),namedViewRevision=0;
    let discovery=null, landmarkCompose=null, pendingLandmark=null, thoughtAnchor=null;
    const discoveryControls=new Map();
    let layoutLoading = false, layoutLoaded = false, layoutLoadPromise = null, layoutRevision = 0;
    let pendingLayoutSave = null, layoutSaving = false, layoutSavePromise = null;
    let confirmedLayoutRevision=0, savedViewName="";
    let transportTail = Promise.resolve();
    const transportReads = new Set();
    let listMode = false, route = null, pointerGestures = [], uniqueCounts = false;
    let focusPageControls = null;
    let inspectorTab = "overview", resetInspectorScroll = false;
    // Compare with… keeps one transient chooser and the displayed shortest route.
    let compareChooser = null, compareRoute = null;
    // Labels keep a readable on-screen size; overlapping lower-priority labels
    // are hidden instead of every label disappearing below a zoom cutoff.
    let labelEntries = [], labelScale = null;
    const eligible = () => { const c = context(); return c.unlocked && !c.locking && !c.closed && !c.temporary; };
    const onPage = () => active && context().page === "memories";
    const fullscreenModule = typeof module !== "undefined" && module.exports ? require("./map_fullscreen_ui.js") : root.PCSMapFullscreen;
    const fullscreen = fullscreenModule?.create({document, environment, available: () => eligible() && onPage(), resized: () => { if (view) relayout(); }});
    const owner = () => { const c = context(); return {generation: c.generation, session: c.session, temporaryGeneration: c.temporaryGeneration, controller: c.controller}; };
    const current = bound => {
      const c = context(); return bound && eligible() && bound.generation === c.generation && bound.session === c.session
        && bound.temporaryGeneration === c.temporaryGeneration && (!bound.controller || bound.controller === c.controller);
    };
    function clearToast() {
      if (toast?.timer !== undefined) environment.clearTimeout?.(toast.timer);
      toast = null;
      const notice = $("toast");
      if (notice) { notice.hidden = true; notice.textContent = ""; notice.setAttribute("data-fading", "false"); }
    }
    function showToast(message) {
      clearToast();
      const notice = $("toast");
      if (!notice || !onPage() || !eligible()) return;
      const token = {owner: owner()}; toast = token;
      notice.textContent = message; notice.hidden = false;
      token.timer = environment.setTimeout?.(() => {
        if (toast !== token) return;
        if (!current(token.owner) || !onPage()) { clearToast(); return; }
        notice.setAttribute("data-fading", "true");
        token.timer = environment.setTimeout?.(() => { if (toast === token) clearToast(); }, 250);
      }, 4000);
    }
    // Authored presentation belongs to the unlocked vault/page, independently
    // of the conversation whose evidence projection is currently displayed.
    const presentationCurrent = bound => {
      const c = context(); return bound && eligible() && bound.generation === c.generation
        && bound.temporaryGeneration === c.temporaryGeneration && (!bound.controller || bound.controller === c.controller);
    };
    function setThoughtAnchor(value) {
      thoughtAnchor=null;
      if(value && eligible() && typeof value.id==="string" && value.id.length<=200
        && Number.isSafeInteger(value.revision) && value.revision>0 && text(value.title,160) && value.title.trim()
        && (value.next_step===undefined || text(value.next_step,2000)))
        thoughtAnchor={id:value.id,revision:value.revision,title:value.title,next_step:value.next_step||"",owner:owner()};
      renderDiscovery();
    }
    function discoveryCandidates() {
      const graph=displayedGraph();if(!graph)return [];
      const center=selected?.kind==="theme"?selected.id:focusCenter;
      return graph.edges.filter(edge=>!discovery?.seen.has(edge.id)).sort((a,b)=>
        Number(connectionNotes.has(a.id))-Number(connectionNotes.has(b.id))
        || Number(b.from===center||b.to===center)-Number(a.from===center||a.to===center)
        || count(b)-count(a)||a.id.localeCompare(b.id));
    }
    async function discoverNext() {
      if(!view || !current(view.owner) || !onPage() || busy || detailBusy)return;
      if(!discovery)discovery={owner:{...view.owner},seen:new Set(),edgeId:null};
      if(!current(discovery.owner) || discovery.seen.size>=3)return;
      const edge=discoveryCandidates()[0];if(!edge){renderDiscovery();return;}
      discovery.seen.add(edge.id);discovery.edgeId=edge.id;landmarkCompose=null;
      await choose({kind:"connection",id:edge.id});
      renderDiscovery();
      if(discovery?.edgeId===edge.id && detail && !detailBusy)discoveryControls.get("leave")?.focus?.({preventScroll:true});
    }
    function finishDiscovery() {
      const restoreStart=document.activeElement?.getAttribute?.("data-map-discovery-action")==="Finish exploring";
      discovery=null;landmarkCompose=null;renderDiscovery();if(view)renderInspector();
      // The focused Finish control no longer exists in the idle prompt. Keep
      // keyboard navigation inside the map without moving programmatic focus.
      if(restoreStart)discoveryControls.get("Discover a connection")?.focus?.({preventScroll:true});
    }
    function composeLandmark(id) {
      if(!view || !current(view.owner) || !onPage() || selected?.kind!=="connection" || selected.id!==id || !detail || detailBusy || !layoutWritable())return;
      landmarkCompose=id;renderInspector();
      const input=document.getElementById("map-connection-note");input?.focus?.({preventScroll:true});
    }
    function renderDiscovery() {
      const host=$("discovery");if(!host)return;
      const focusKey=document.activeElement?.getAttribute?.("data-map-discovery-action");
      host.replaceChildren();discoveryControls.clear();
      const action=(label,callback,cls="text-button",key=label)=>{
        const control=button(label,callback,cls);control.setAttribute("data-map-discovery-action",key);discoveryControls.set(key,control);return control;
      };
      if(thoughtAnchor && !current(thoughtAnchor.owner))thoughtAnchor=null;
      if(discovery && !current(discovery.owner))discovery=null;
      if(!view || !current(view.owner) || !onPage()){host.hidden=true;return;}
      host.hidden=false;
      if(thoughtAnchor){
        const anchor=thoughtAnchor,row=el("div","map-thought-anchor");
        row.append(el("small","eyebrow","YOUR CHOSEN THOUGHT"),el("strong","",anchor.title));
        if(anchor.next_step)row.append(el("p","map-muted",anchor.next_step));
        row.append(el("small","map-muted","Use this question to guide your exploration. It does not add themes or connections."),
          action("Set thought aside",()=>{if(thoughtAnchor===anchor)setThoughtAnchor(null);}));host.append(row);
      }
      const panel=el("div","map-discovery-prompt");
      if(!discovery){
        panel.className+=" map-discovery-idle";
        const invitation=el("div","");
        invitation.append(el("strong","","Find something worth returning to"),el("small","map-muted","Explore one connection. Leave a landmark if it matters to you."));
        panel.append(invitation);
        const start=action("Discover a connection",discoverNext,"button secondary");start.disabled=busy||detailBusy||!discoveryCandidates().length;panel.append(start);
        if(!discoveryCandidates().length)panel.append(el("small","map-muted","No connections in this view. Choose another theme or adjust the filters."));
      }else{
        const currentDiscovery=discovery,inspected=selected?.kind==="connection" && selected.id===discovery.edgeId && detail && !detailBusy;
        panel.className+=" map-discovery-active";
        const copy=el("div","map-discovery-copy"),actions=el("div","map-discovery-actions");
        copy.append(el("strong","",`Connection ${discovery.seen.size} of up to 3`),el("p","map-muted",inspected
          ? "Read the saved words. Keep a landmark to revisit."
          : "Open the connection's current evidence before leaving a landmark."));
        panel.append(copy,actions);
        const leave=action("Leave a landmark",()=>{if(discovery===currentDiscovery)composeLandmark(currentDiscovery.edgeId);},"button secondary","leave");
        leave.disabled=!inspected||!layoutWritable();actions.append(leave);
        if(discovery.seen.size<3 && discoveryCandidates().length){const next=action("Try another connection",discoverNext);next.disabled=busy||detailBusy;actions.append(next);}
        else copy.append(el("small","map-muted","That is the end of this short exploration. There is nothing to complete or earn."));
        actions.append(action("Finish exploring",()=>{if(discovery===currentDiscovery)finishDiscovery();}));
      }
      host.append(panel);
      const landmarks=el("div","map-landmark-return"),bound=layoutOwner;
      if(connectionNotes.size){
        landmarks.append(el("strong","","Your landmarks & notes"));
        for(const [id,value]of [...connectionNotes].slice(0,6)){
          const graph=presentationGraph(),edge=graph?.edgeMap.get(id),title=noteTitle(value)||"Untitled connection note";
          const revisit=action(title,async()=>{if(layoutOwner===bound && presentationCurrent(bound) && connectionNotes.get(id)===value && onPage()){
            finishDiscovery();if(edge && presentationGraph()?.edgeMap.has(id))return choose({kind:"connection",id});
            await fullscreen?.exit({restoreFocus:false});
            if(layoutOwner!==bound || !presentationCurrent(bound) || connectionNotes.get(id)!==value || !onPage())return;
            const manager=$("saved-notes");if(manager){setPopover("views-panel");for(let p=manager.parentNode;p;p=p.parentNode)if(p.tagName==="DETAILS")p.open=true;
              const note=Array.from(manager.children).find(row=>row.getAttribute?.("data-map-saved-note")===id);if(note)note.open=true;
              (note||manager).scrollIntoView?.({block:"nearest"});}
          }},"map-landmark-chip","note:"+id);
          revisit.setAttribute("aria-label",(edge?"Revisit ":"Read note; connection unavailable in this view: ")+title);
          if(!edge)revisit.append(el("small","map-muted","Connection unavailable here"));
          if(layoutRevision!==confirmedLayoutRevision)revisit.append(el("small","map-muted","Save pending"));landmarks.append(revisit);
        }
        if(connectionNotes.size>6)landmarks.append(el("small","map-muted","All notes remain under Views & notes."));
        host.append(landmarks);
      }
      if(focusKey)discoveryControls.get(focusKey)?.focus?.({preventScroll:true});
      sizeCanvas();
    }
    function mapDottedPercent() {
      const raw = document.documentElement?.getAttribute?.("data-map-dotted-percent"), value = Number(raw);
      return typeof raw === "string" && raw.trim() && Number.isInteger(value) && value >= 0 && value <= 100 ? value : 60;
    }
    const count = item => displayCount(item, uniqueCounts);
    const countedEdges = edges => edges.some(edge=>uniqueCounts||observed(edge)) ? edges.map(edge=>({...edge,support_count:count(edge)})) : edges;
    const bundleIndexes = new WeakMap();
    function bundleOf(edge) {
      // Only the full Connections web bundles; a route or a selected theme or
      // link always shows its own lines.
      if (layoutMode !== "connections" || layout?.mode !== "connections" || !Array.isArray(layout.bridges) || route) return null;
      if (!bundleIndexes.has(layout)) bundleIndexes.set(layout, new Map(layout.bridges.flatMap(bridge => bridge.edgeIds.map(id => [id, bridge]))));
      const bridge = bundleIndexes.get(layout).get(edge.id);
      if (!bridge || expandedBundles.has(bridge.id)) return null;
      if (selected?.kind === "theme" && (selected.id === edge.from || selected.id === edge.to)) return null;
      if (selected?.kind === "connection" && selected.id === edge.id) return null;
      return bridge;
    }
    function renderedEdges(visible = visibleIds(), {bundled = false} = {}) {
      if (!view || !layout || layout.cloudOverview || !current(view.owner)) return [];
      const first = new Set(layout.firstRingIds || []), second = new Set(layout.secondRingIds || []);
      return view.edges.filter(edge => !hiddenLinks.has(edge.id) && visible.has(edge.from) && visible.has(edge.to)
        && Boolean(bundleOf(edge)) === bundled
        && layout.positions.has(edge.from) && layout.positions.has(edge.to)
        && (layoutMode !== "focus" || route || edge.id === selected?.id
          || edge.from === focusCenter || edge.to === focusCenter
          || first.has(edge.from) && second.has(edge.to) || first.has(edge.to) && second.has(edge.from)));
    }
    function updateMapLegend(style = dottedConnections(countedEdges(renderedEdges()), mapDottedPercent())) {
      const percent = mapDottedPercent(), legend = $("line-legend"), summary = $("coverage-summary");
      const byObservation=!uniqueCounts && !!view?.nodes.some(observed);
      const unit=uniqueCounts?"distinct content-and-provenance groups":byObservation?"shared observations":"shared saved records";
      const wording = layout?.cloudOverview ? "Each cloud contains up to 12 displayed themes. Bridges count displayed theme connections between clouds, not shared records. Open a cloud to inspect its themes and their saved evidence." : `Dotted: weakest ${percent}% of displayed connections, keeping equal ${uniqueCounts?"content-group":"shared-record"} counts together.`
        + (style.total ? ` Showing ${style.dottedCount} of ${style.total} dotted (${Math.round(style.dottedCount / style.total * 100)}%); the rest are solid.`
          : " No connections are displayed.")
        + ` Repeated links only is a separate 2+ record filter. Counts are ${unit}, not certainty.`
        + (layoutMode === "connections" && layout?.bridges?.length ? " Links between constellations are bundled into one line with a count; select it to show each link." : "")
        + (restingCount ? ` Until you choose a theme, each constellation draws only its strongest links; ${restingCount} other ${restingCount === 1 ? "link appears" : "links appear"} when you choose or point at one of their themes.` : "");
      if (legend && legend.textContent !== wording) legend.textContent = wording;
      const key=$("visual-key");if(key)key.textContent=layout?.cloudOverview
        ? "Cloud size / number: displayed themes. Bridge thickness: displayed theme connections between clouds on this page. Cloud names come from member themes; distance and color are visual aids."
        : `Size / number: ${uniqueCounts?"distinct current content-and-provenance groups":byObservation?"observations (each current statement of a Local account counts once; other records count once)":"supporting saved records"}. Color: visual group. Thicker, brighter lines: more ${unit}. Dotted lines mark the weakest percentage chosen in Appearance. Counts do not establish truth or independent evidence; distance is only for layout.`;
      if (summary) {
        const coverage = view && current(view.owner) ? view.coverage : null;
        const grouped = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        const text = `Display limit: ${grouped(MAX_NODES)} themes and ${grouped(MAX_EDGES)} connections.`
          + (coverage?.links_omitted ? ` Each theme keeps its strongest links; ${grouped(coverage.links_omitted)} weaker links are not drawn.` : "")
          + (coverage?.records_limited ? " Records in scope are a bounded sample; use saved-word scope to explore more." : "")
          + (coverage?.text_limited ? ` ${coverage.text_limited} records use bounded text excerpts.` : "");
        if (summary.textContent !== text) summary.textContent = text;
      }
    }
    function refreshLineAppearance() {
      const style = dottedConnections(countedEdges(renderedEdges()), mapDottedPercent()), seen = new Set();
      if (view && current(view.owner)) for (const entries of incidentLines.values()) for (const entry of entries) {
        if (seen.has(entry.line)) continue;
        seen.add(entry.line);
        entry.line.setAttribute("stroke-dasharray", entry.supportCount <= style.cutoff ? "4 5" : "");
      }
      updateMapLegend(style);
    }
    function setLayoutStatus(message, {transient = false} = {}) {
      if (layoutConfirmation?.timer !== undefined) environment.clearTimeout?.(layoutConfirmation.timer);
      layoutConfirmation = null;
      const notice = $("layout-status");
      notice.textContent = transient && (!onPage() || !eligible()) ? "" : message;
      notice.setAttribute("data-fading", "false");
      if (!transient || !message || !onPage() || !eligible()) return;
      const token = {owner: owner()}; layoutConfirmation = token;
      token.timer = environment.setTimeout?.(() => {
        if (layoutConfirmation !== token) return;
        if (!presentationCurrent(token.owner) || !onPage()) { setLayoutStatus(""); return; }
        notice.setAttribute("data-fading", "true");
        token.timer = environment.setTimeout?.(() => { if (layoutConfirmation === token) setLayoutStatus(""); }, 250);
      }, 4000);
    }
    function clearLayoutConfirmation() { if (layoutConfirmation) setLayoutStatus(""); }
    // Preferences include authored notes. A failed read never authorizes an
    // empty/default replacement, even when the graph itself is available.
    const layoutWritable = () => layoutLoaded && !layoutLoading && presentationCurrent(layoutOwner);
    const preferenceButton = (label, callback) => {
      const action = button(label, () => { if (layoutWritable()) callback(); });
      action.disabled = !layoutWritable(); return action;
    };
    function retireReads({all = false, snapshots = false} = {}) {
      for (const read of transportReads) if (all || !read.owns(read.owner)
        || read.snapshot && (snapshots || !read.ready())) read.abort.abort();
    }
    function transport(path, options, bound, ready = () => true) {
      const owns = path.startsWith("/api/continuity-map/layout") ? presentationCurrent : current;
      const read = path === "/api/continuity-map/layout/save" ? null
        : {owner: bound, owns, ready, snapshot: path !== "/api/continuity-map/layout", abort: new AbortController()};
      if (read) transportReads.add(read);
      const task = transportTail.then(async () => {
        if (!owns(bound) || !ready() || read?.abort.signal.aborted) throw new Error("This map is no longer active.");
        // Writes keep their settlement order: aborting a request cannot prove a
        // layout save did not commit. Revoked or superseded reads must not hold
        // the next inspection while a transport ignores or delays cancellation.
        if (!read) return api(path, options);
        let cancelled;
        const retired = new Promise((_, reject) => {
          cancelled = () => reject(new Error("This map is no longer active."));
          read.abort.signal.addEventListener("abort", cancelled, {once: true});
        });
        try { return await Promise.race([api(path, {...options, signal: read.abort.signal}), retired]); }
        finally { read.abort.signal.removeEventListener("abort", cancelled); }
      }).finally(() => { if (read) transportReads.delete(read); });
      // A rejected request must not stop later owned requests in this queue.
      transportTail = task.then(() => {}, () => {});
      return task;
    }
    const layoutPayload = () => ({version: 2, mode: layoutMode,
      layouts: Object.fromEntries(POSITION_MODES.map(mode=>[mode,[...positionsByMode.get(mode)].map(([id,point])=>({id,x:point.x,y:point.y}))])),
      hidden_themes: [...hiddenThemes], hidden_links: [...hiddenLinks],named_views:JSON.parse(JSON.stringify(namedViews)),
      connection_notes:[...connectionNotes].map(([id,text])=>({id,text}))});
    function unfinishedDraft() {
      if (!presentationCurrent(layoutOwner)) return null;
      const notes = [...noteDrafts].filter(([id,text]) => text !== (connectionNotes.get(id) || ""))
        .map(([id,text]) => ({id,text}));
      const pending = layoutRevision !== confirmedLayoutRevision;
      const fieldName = $("view-name")?.value || "", name = fieldName !== savedViewName ? fieldName : "";
      if (!notes.length && !pending && !name) return null;
      return {connection_note_drafts: notes, view_name: name,
        ...(pending ? {unconfirmed_presentation: layoutPayload()} : {}),
        recovery_note: "Copy and review these Map edits before saving. A pending save may already have completed. Recovery never applies presentation changes or shares notes."};
    }
    function checkedLayout(value) {
      if (!value || ![1,2].includes(value.version) || !MODES.includes(value.mode)
          || value.version===1 && (!POSITION_MODES.slice(0,3).includes(value.mode) || Object.keys(value).length!==3)
          || value.version===2 && (!value.layouts || Array.isArray(value.layouts) || typeof value.layouts!=="object"
            || Object.keys(value.layouts).some(mode=>!POSITION_MODES.includes(mode))
            || Object.keys(value).some(key=>!["version","mode","layouts","hidden_themes","hidden_links","named_views","connection_notes"].includes(key)))) throw new Error("Saved map layout is unavailable.");
      const readPositions = points => {
        if (!Array.isArray(points) || points.length>MAX_SAVED_ITEMS) throw new Error("Saved map layout is unavailable.");
        const positions = new Map();
        for (const point of points) {
        if (!point || !validId(point.id) || positions.has(point.id)
            || !Number.isFinite(point.x) || !Number.isFinite(point.y)
            || point.x < -4 || point.x > 5 || point.y < -4 || point.y > 5)
          throw new Error("Saved map layout is unavailable.");
        positions.set(point.id, {x: point.x, y: point.y});
        }
        return positions;
      };
      const layouts = new Map(POSITION_MODES.map(mode=>[mode,readPositions(value.version===1 ? mode===value.mode?value.positions:[] : value.layouts[mode]===undefined?[]:value.layouts[mode]) ]));
      const readHidden = (values, valid) => {
        if (!Array.isArray(values) || values.length>MAX_SAVED_ITEMS || !values.every(valid) || new Set(values).size!==values.length) throw new Error("Saved map layout is unavailable.");
        return new Set(values);
      };
      const views=value.named_views===undefined?[]:value.named_views,notes=value.connection_notes===undefined?[]:value.connection_notes;
      if(!Array.isArray(views) || views.length>8 || !Array.isArray(notes) || notes.length>MAX_SAVED_ITEMS
        || new Set(views.map(item=>item?.id)).size!==views.length || new Set(notes.map(item=>item?.id)).size!==notes.length
        || !notes.every(note=>note && Object.keys(note).length===2 && validLink(note.id) && safeText(note.text,1000,true)) || !presentationFits(value))
        throw new Error("Saved map names and notes could not be checked.");
      return {mode:value.mode,layouts,hiddenThemes:readHidden(value.version===1?[]:value.hidden_themes,validId),hiddenLinks:readHidden(value.version===1?[]:value.hidden_links,validLink),
        namedViews:views.map(checkedNamedView),connectionNotes:new Map(notes.map(note=>[note.id,note.text]))};
    }
    function discardLayout() {
      layoutEpoch++; layoutRevision++; layoutOwner = null; layoutLoading = false; layoutLoaded = false;
      layoutLoadPromise = null; pendingLayoutSave = null; layoutMode = "groups"; savedPositions = new Map();
      positionsByMode = new Map(POSITION_MODES.map(mode=>[mode,new Map()])); positionsByMode.set("groups",savedPositions);
      compareChooser=null; compareRoute=null;
      hiddenThemes=new Set(); hiddenLinks=new Set(); presentationUndo=[]; focusCenter=null; compareAnchors=[]; secondRing=false;
      past=[];future=[];chosenRecords.clear();navigating=false;navigationJob=null;
      namedViews=[];connectionNotes.clear();noteDrafts.clear();namedViewRevision++;
      discovery=null;landmarkCompose=null;pendingLandmark=null;thoughtAnchor=null;
      confirmedLayoutRevision=layoutRevision;
      savedViewName="";
      $("view-name") && ($("view-name").value=""); $("named-views")?.replaceChildren();$("saved-notes")?.replaceChildren();
      setLayoutStatus("");
    }
    async function loadLayout(bound) {
      if (layoutOwner && !presentationCurrent(layoutOwner)) discardLayout();
      if (presentationCurrent(layoutOwner) && layoutLoaded) return;
      if (presentationCurrent(layoutOwner) && layoutLoadPromise) return layoutLoadPromise;
      const epoch = ++layoutEpoch, revision = layoutRevision;
      layoutOwner = {...bound}; layoutLoading = true;
      setLayoutStatus("Loading saved Map choices and notes…"); update();
      let task;
      task = (async () => {
        try {
          const value = checkedLayout(await transport("/api/continuity-map/layout", {method: "POST", body: {},
            headers: {"X-PCS-Controller": bound.controller}}, bound, () => epoch === layoutEpoch && onPage()));
          if (epoch !== layoutEpoch || !presentationCurrent(bound) || revision !== layoutRevision) return;
          layoutMode = openingMode(value.mode); positionsByMode = value.layouts; savedPositions=positionsByMode.get(layoutMode) || new Map();
          hiddenThemes=value.hiddenThemes; hiddenLinks=value.hiddenLinks;namedViews=value.namedViews;connectionNotes=value.connectionNotes;layoutLoaded = true;
          confirmedLayoutRevision=layoutRevision;
          setLayoutStatus("");
        } catch {
          if (epoch === layoutEpoch && presentationCurrent(bound)) setLayoutStatus("Saved Map choices and notes could not be loaded. You can still inspect the map. Retry Map loading before changing or saving them.");
        } finally {
          if (epoch === layoutEpoch) {
            layoutLoading = false;
            if (layoutLoadPromise === task) layoutLoadPromise = null;
            update();
          }
        }
      })();
      layoutLoadPromise = task;
      return task;
    }
    async function drainLayoutSaves() {
      if (layoutSaving) return;
      layoutSaving = true;
      try {
        while (pendingLayoutSave) {
          const job = pendingLayoutSave; pendingLayoutSave = null;
          if (job.epoch !== layoutEpoch || !presentationCurrent(job.owner)) continue;
          try {
            const result = await transport("/api/continuity-map/layout/save", {method: "POST", body: job.payload,
              headers: {"X-PCS-Controller": job.owner.controller}}, job.owner, () => job.epoch === layoutEpoch);
            if (result?.saved !== true) throw new Error("Layout save was not confirmed.");
            if (job.epoch === layoutEpoch && job.revision === layoutRevision && presentationCurrent(job.owner) && !pendingLayoutSave) {
              confirmedLayoutRevision=job.revision;
              setLayoutStatus("Layout saved.", {transient: true});
              if(pendingLandmark && connectionNotes.get(pendingLandmark.id)===pendingLandmark.text){
                const title=noteTitle(pendingLandmark.text);pendingLandmark=null;discovery=null;landmarkCompose=null;
                showToast(`Landmark saved: ${title}. Return through Your landmarks & notes.`);
              }
            }
          } catch {
            if (job.epoch === layoutEpoch && job.revision === layoutRevision && presentationCurrent(job.owner) && !pendingLayoutSave)
              setLayoutStatus("Map save was not confirmed. Local names, notes and viewing choices are retained here; use Retry Map save.");
          }
          if(view && current(view.owner) && onPage()){renderNamedViews();renderSavedNotes();renderInspector();draw();update();}
        }
      } finally { layoutSaving = false; update(); draftChanged(); }
    }
    function saveLayout() {
      if (!layoutWritable()) return;
      const payload=layoutPayload();
      layoutRevision++;
      // A visible position/mode change is unsaved even when it cannot fit. Retire
      // an older queued payload so it cannot mask the newer unsaved presentation.
      if(!presentationFits(payload)) {
        pendingLayoutSave=null;draftChanged();
        setLayoutStatus("Map presentation has reached its 256 KB capacity. Shorten notes or remove a saved view; your unsaved changes are retained.");
        renderNamedViews();renderSavedNotes();if(view && onPage())renderInspector();update();return;
      }
      pendingLayoutSave = {owner: {...layoutOwner}, epoch: layoutEpoch, revision: layoutRevision, payload};
      draftChanged();
      setLayoutStatus("Saving layout…");
      renderNamedViews();renderSavedNotes();if(view && onPage())renderInspector();update();
      if (!layoutSaving) layoutSavePromise = drainLayoutSaves();
    }
    function filters() { return {query: $("query").value.trim(), days: Number($("days").value), kind: $("kind").value,
      strong_only: $("strong").checked, include_single: $("single").checked, ...($("through") ? {through: $("through").value} : {}),
      ...($("themes") ? {themes: $("themes").value || "all"} : {})}; }
    // Theme source is a page-only choice; named views keep their saved format.
    const viewFilters = () => Object.fromEntries(Object.entries(view.filters).filter(([key]) => key !== "themes"));
    function presentationGraph() {
      if (!view) return null;
      const nodes=view.nodes.filter(node=>!hiddenThemes.has(node.id)), nodeMap=new Map(nodes.map(node=>[node.id,node]));
      const edges=view.edges.filter(edge=>!hiddenLinks.has(edge.id) && nodeMap.has(edge.from) && nodeMap.has(edge.to));
      return {...view,nodes,edges,nodeMap,edgeMap:new Map(edges.map(edge=>[edge.id,edge]))};
    }
    function displayedGraph() {
      // The constellation overview draws clouds, not themes; its displayed
      // themes are every theme the clouds contain.
      const graph=presentationGraph();if (!graph || !layout?.visibleIds || layout.cloudOverview) return graph;
      const visible=new Set(layout.neighborhoodIds || layout.visibleIds), nodes=graph.nodes.filter(node=>visible.has(node.id)), nodeMap=new Map(nodes.map(node=>[node.id,node]));
      const edges=graph.edges.filter(edge=>nodeMap.has(edge.from) && nodeMap.has(edge.to));
      return {...graph,nodes,edges,nodeMap,edgeMap:new Map(edges.map(edge=>[edge.id,edge]))};
    }
    function trailState() {
      return view && {filters:{...view.filters},selection:selected?{...selected}:null,offset:detail?.offset || 0,
        inspectorTab,scroll:$("inspector")._scrollBody?.scrollTop || 0,box:box?{...box}:null,pins:[...pins],focusOnly,listMode,
        layoutMode,clusterAnchor,clusterPage,focusCenter,focusPage,compareAnchors:[...compareAnchors],secondRing,owner:{...view.owner}};
    }
    function rememberTrail() {
      if (navigating) return;
      const step=trailState(); if (!step) return;
      past=[...past,step].slice(-24); future=[];
    }
    async function navigateTrail(direction, steps = 1) {
      if (!view || busy || detailBusy || navigating || !current(view.owner) || !onPage()) return;
      const source=direction==="back"?past:future;
      // A trail crumb can go back several steps at once. Forward stays one step.
      steps=direction==="back" && Number.isInteger(steps) ? clamp(steps,1,Math.max(1,source.length)) : 1;
      const step=source.at(-steps); if (!step || !current(step.owner)) return;
      const now=trailState();
      if (direction==="back") {const skipped=past.slice(-steps).slice(1).reverse();past=past.slice(0,-steps);future=[...future,now,...skipped].slice(-24);}
      else {future=future.slice(0,-1);past=[...past,now].slice(-24);}
      navigating=true;const job={};navigationJob=job;
      for (const [key,value] of Object.entries(step.filters)) {
        const input=$({strong_only:"strong",include_single:"single"}[key] || key); if (!input) continue;
        if (typeof value==="boolean") input.checked=value; else input.value=String(value);
      }
      singleDefaulted = true; // A restored step keeps its own filters.
      try {
        const expectedOperation=operation+1;
        await refresh({keepTrail:true});
        if (navigationJob!==job || operation!==expectedOperation || !view || !current(step.owner) || !onPage()) return;
        const restoredView=view;
        layoutMode=step.layoutMode; savedPositions=positionsByMode.get(layoutMode) || new Map();
        clusterAnchor=step.clusterAnchor || null; clusterPage=step.clusterPage || 0;focusCenter=step.focusCenter; focusPage=step.focusPage || 0; compareAnchors=step.compareAnchors; secondRing=step.secondRing;
        const graph=presentationGraph(); pins=step.pins.filter(id=>graph.nodeMap.has(id));focusOnly=step.focusOnly;listMode=step.listMode;
        relayout();renderPins();renderV2();
        const selection=step.selection, exists=selection && (selection.kind==="theme"?graph.nodeMap:graph.edgeMap).has(selection.id);
        const expectedDetailOperation=exists?detailOperation+1:detailOperation;
        if (exists) await choose(selection,step.offset,false);
        if (navigationJob!==job || operation!==expectedOperation || detailOperation!==expectedDetailOperation || view!==restoredView || !current(step.owner) || !onPage()) return;
        inspectorTab=step.inspectorTab;resetInspectorScroll=false;renderInspector();
        if ($("inspector")._scrollBody) $("inspector")._scrollBody.scrollTop=step.scroll;
        if (step.box) {box={...step.box};applyBox();}
        renderList();
        if (selection && !exists) $("status").textContent="The earlier selection is no longer visible under the current evidence or hidden-item choices.";
      } finally {if(navigationJob===job){navigationJob=null;navigating=false;}update();}
    }
    // A readable trail of where this exploration has been. Each earlier crumb
    // is the same Back history, so it revalidates current evidence on return.
    function trailLabel(step) {
      const label=id=>view?.nodeMap.get(id)?.label;
      const selection=step.selection, edge=selection?.kind==="connection" && view?.edgeMap.get(selection.id);
      if(edge)return `${label(edge.from)} ↔ ${label(edge.to)}`;
      if(step.layoutMode==="focus")return label(step.focusCenter) || label(selection?.id) || "Focus";
      if(selection?.kind==="theme" && label(selection.id))return label(selection.id);
      if(step.layoutMode==="compare"){const [a,b]=step.compareAnchors||[];return label(a) && label(b) ? `${label(a)} and ${label(b)}` : "Compare";}
      if(step.layoutMode==="groups"){
        if(!step.clusterAnchor)return "Constellations";
        const cluster=clustering?.clusters.find(c=>c.id===clustering.membership.get(step.clusterAnchor));
        // Two member names keep a constellation crumb distinct from its theme.
        return cluster?.labels.slice(0,2).join(" · ") || label(step.clusterAnchor) || "Constellation";
      }
      return step.layoutMode==="connections" ? "All links" : "Map";
    }
    function renderTrail() {
      const host=$("trail");if(!host)return;
      host.replaceChildren();
      if(!view || !current(view.owner))return;
      const now=trailState();if(!now)return;
      const entries=[...past.map((step,index)=>({label:trailLabel(step),back:past.length-index})),{label:trailLabel(now),back:0}];
      // Repeated stops (paging, re-inspecting) collapse into their latest step.
      const crumbs=entries.filter((entry,i)=>i===entries.length-1 || entry.label!==entries[i+1].label);
      const shown=crumbs.slice(-5);
      if(crumbs.length>shown.length)host.append(el("span","map-trail-more","…"));
      const disabled=busy || detailBusy || navigating;
      shown.forEach((entry,i)=>{
        if(i || crumbs.length>shown.length)host.append(el("span","map-trail-sep","›"));
        if(!entry.back){const here=el("span","map-trail-current",entry.label);here.setAttribute("aria-current","location");host.append(here);return;}
        const crumb=button(entry.label,()=>{if(!busy && !detailBusy && !navigating)navigateTrail("back",entry.back);},"map-trail-crumb");
        crumb.disabled=disabled;crumb.setAttribute("aria-label","Back to "+entry.label);host.append(crumb);
      });
    }
    // Following a theme opens Focus around it. This is navigation: it is kept
    // in Back history but does not rewrite the saved layout preference.
    function followTheme(id) {
      if(!view || !current(view.owner) || !onPage() || !presentationGraph().nodeMap.has(id))return;
      if(layoutMode==="focus")return choose({kind:"theme",id});
      rememberTrail();cancelDrag();compareChooser=null;
      layoutMode="focus";savedPositions=positionsByMode.get("focus") || new Map();focusCenter=id;focusPage=0;clusterAnchor=null;route=null;
      selected=null;detail=null;detailOperation++;detailBusy=false;chosenRecords.clear();errorText="";
      relayout();renderList();renderV2();
      return choose({kind:"theme",id},0,false);
    }
    function startCompare(first, second) {
      const graph=presentationGraph();
      if(!view || !current(view.owner) || !onPage() || first===second || !graph?.nodeMap.has(first) || !graph.nodeMap.has(second))return;
      rememberTrail();cancelDrag();compareChooser=null;
      compareAnchors=[first,second];layoutMode="compare";savedPositions=positionsByMode.get("compare") || new Map();
      clusterAnchor=null;route=null;selected=null;detail=null;detailOperation++;detailBusy=false;chosenRecords.clear();errorText="";
      relayout();renderList();renderV2();emptyDetail();update();
    }
    function finishCompare() {
      if(!view || !current(view.owner) || !onPage() || layoutMode!=="compare")return;
      if(past.length)return navigateTrail("back");
      rememberTrail();layoutMode="groups";savedPositions=positionsByMode.get("groups") || new Map();compareAnchors=[];
      selected=null;detail=null;detailOperation++;detailBusy=false;relayout();renderList();renderV2();emptyDetail();update();
    }
    const POPOVERS=[["views-toggle","views-panel"],["settings-toggle","settings-panel"]];
    function setPopover(name) {
      for(const [toggleName,panelName] of POPOVERS){
        const toggle=$(toggleName),panel=$(panelName);if(!toggle || !panel)continue;
        const open=panelName===name;panel.hidden=!open;toggle.setAttribute("aria-expanded",String(open));
      }
    }
    const openPopover=()=>POPOVERS.find(([,panelName])=>$(panelName) && !$(panelName).hidden);
    function renderPresentationControls() {
      const graph=presentationGraph(); if (!graph) return;
      const original=view;
      if (focusCenter && !graph.nodeMap.has(focusCenter)) focusCenter=null;
      compareAnchors=compareAnchors.map(id=>graph.nodeMap.has(id)?id:null);
      for (const [name,value] of [["focus-center",focusCenter],["compare-left",compareAnchors[0]],["compare-right",compareAnchors[1]]]) {
        const select=$(name); if (!select) continue;
        select.replaceChildren();const empty=el("option","","Choose a theme…");empty.value="";select.append(empty);
        for (const node of [...graph.nodes].sort((a,b)=>a.label.localeCompare(b.label)||a.id.localeCompare(b.id))) {const option=el("option","",node.label);option.value=node.id;select.append(option);}
        select.value=value || "";
      }
      if ($("anchor-controls")) $("anchor-controls").hidden=!["focus","compare"].includes(layoutMode);
      if ($("focus-controls")) $("focus-controls").hidden=layoutMode!=="focus";
      if ($("compare-controls")) $("compare-controls").hidden=layoutMode!=="compare";
      if ($("second-ring")) $("second-ring").checked=secondRing;
      const hidden=$("hidden-items");
      if (hidden) {
        hidden.replaceChildren();
        for (const [kind,ids] of [["theme",hiddenThemes],["connection",hiddenLinks]]) for (const id of ids) {
          const item=(kind==="theme"?view.nodeMap:view.edgeMap).get(id);
          hidden.append(button("Restore "+(item ? kind==="theme"?item.label:view.nodeMap.get(item.from).label+" ↔ "+view.nodeMap.get(item.to).label : "hidden "+kind),()=>{if(view===original && current(original.owner))setHidden(kind,id,false);}));
        }
        if (!hidden.children.length) hidden.append(el("p","map-muted","No hidden themes or connections."));
      }
      if ($("presentation-status")) $("presentation-status").textContent=hiddenThemes.size || hiddenLinks.size
        ? `${hiddenThemes.size} hidden themes · ${hiddenLinks.size} hidden connections. Hidden items limit Map, List, paths and suggested routes; saved records remain available in Library.` : "";
      $("stats").textContent=`${graph.nodes.length} themes · ${graph.edges.length} connections`;
      renderNamedViews();
      renderSavedNotes();
    }
    function namedViewSnapshot(id,name) {
      // Groups uses the existing theme-anchor fields without a new encrypted
      // schema: focus_center opens a constellation; one compare anchor locates
      // an overview page. These page references never become Compare choices.
      const anchors=layoutMode==="groups" ? (layout.cloudOverview && layout.clusters.length ? [layout.clusters[0].anchor] : []) : [...compareAnchors];
      return checkedNamedView({id,name,filters:viewFilters(),mode:layoutMode,pins:[...pins],focus_only:focusOnly,list_mode:listMode,
        focus_center:layoutMode==="groups"?clusterAnchor:focusCenter,compare_anchors:anchors,second_ring:secondRing,
        viewport:{x:clamp(box.x/layout.width,-8,8),y:clamp(box.y/layout.height,-8,8),
          width:clamp(box.width/layout.width,.02,20),height:clamp(box.height/layout.height,.02,20)}});
    }
    function saveNamedView(replaceId=null) {
      if(!view || busy || !layoutWritable() || !current(view.owner) || !onPage() || !box || !layout) return;
      const name=$("view-name").value.trim();
      if(!safeText(name,60)) {setLayoutStatus("Use a view name of 1–60 characters without control characters.");return;}
      if(!replaceId && namedViews.length>=8) {setLayoutStatus("Eight named views are saved. Replace or delete a view first.");return;}
      if(replaceId && !namedViews.some(item=>item.id===replaceId)) return;
      const crypto=environment.crypto || root.crypto,random=new Uint8Array(16);
      if(crypto?.getRandomValues)crypto.getRandomValues(random);else for(let i=0;i<random.length;i++)random[i]=Math.floor(Math.random()*256);
      const id=replaceId || "view_"+[...random].map(value=>value.toString(16).padStart(2,"0")).join("");
      const saved=namedViewSnapshot(id,name),previous=namedViews;
      namedViews=replaceId?namedViews.map(item=>item.id===replaceId?saved:item):[...namedViews,saved];
      if(!presentationFits(layoutPayload())){namedViews=previous;setLayoutStatus("Map presentation has reached its 256 KB capacity. Shorten notes or remove a view.");return;}
      savedViewName=$("view-name").value;namedViewRevision++;renderNamedViews();saveLayout();
    }
    function renderNamedViews() {
      const host=$("named-views");if(!host)return;host.replaceChildren();
      const original=view,revision=namedViewRevision;
      const owned=()=>view===original && original && current(original.owner) && onPage() && !busy && layoutWritable() && revision===namedViewRevision;
      for(const saved of namedViews){
        const row=el("div","map-saved-view"),label=el("strong","",saved.name+(layoutRevision!==confirmedLayoutRevision?" · save pending":""));
        row.append(label,button("Open",()=>{if(owned())openNamedView(saved.id);}),
          button("Replace with current view",()=>{if(owned()){$("view-name").value=saved.name;saveNamedView(saved.id);}}),
          button("Delete view",()=>{if(owned()){namedViews=namedViews.filter(item=>item.id!==saved.id);namedViewRevision++;renderNamedViews();saveLayout();}}));
        for(const action of row.children)if(action.tagName==="BUTTON")action.setAttribute("aria-label",action.textContent+": "+saved.name);
        host.append(row);
      }
      if(!namedViews.length)host.append(el("p","map-muted",layoutLoaded ? "No named views saved." : "Saved views have not loaded yet."));
      if(layoutMode==="focus")host.append(el("p","map-muted","Focus views keep the center, depth and viewport, and reopen at the first neighbor page."));
    }
    function renderSavedNotes(){
      const host=$("saved-notes");if(!host)return;host.replaceChildren();const bound=layoutOwner;
      const owns=()=>layoutOwner===bound && presentationCurrent(bound) && onPage() && layoutWritable();
      // A wording connection can disappear after a correction or filter change.
      // Its authored draft remains available independently of graph evidence.
      const drafts=[...noteDrafts].filter(([id,text])=>text!==(connectionNotes.get(id)||""));
      for(const [id,text]of drafts){
        const edge=view?.edgeMap.get(id),row=el("details","map-saved-note map-unsaved-note");
        const connection=edge?view.nodeMap.get(edge.from).label+" ↔ "+view.nodeMap.get(edge.to).label:"Connection unavailable in this map";
        const label=noteTitle(text) || connection;
        const exact=el("textarea","map-note-copy"),status=el("p","map-muted");
        exact.value=text;exact.readOnly=true;exact.rows=4;exact.setAttribute("aria-label","Unsaved note: "+label);
        row.append(el("summary","","Unsaved note · "+label),el("small","map-muted",connection),exact,
          button("Select note text",()=>{if(owns() && noteDrafts.get(id)===text){exact.focus();exact.select?.();status.textContent="Text selected. Copy it with your browser's Copy command or Ctrl+C.";}}),
          button("Discard unsaved note",()=>{
            if(!owns() || noteDrafts.get(id)!==text)return;
            noteDrafts.delete(id);renderSavedNotes();if(view)renderInspector();draftChanged();update();
          }),status,el("p","map-muted","This draft has not been saved. Discard removes only these unsaved edits; any saved note stays unchanged."));
        host.append(row);
      }
      for(const [id,text]of connectionNotes){
        const edge=view?.edgeMap.get(id),row=el("details","map-saved-note");
        row.setAttribute("data-map-saved-note",id);
        const connection=edge?view.nodeMap.get(edge.from).label+" ↔ "+view.nodeMap.get(edge.to).label:"Connection unavailable in this map";
        row.append(el("summary","",(layoutRevision!==confirmedLayoutRevision?"Save pending · ":"")+(noteTitle(text)||connection)),el("small","map-muted",connection),
          el("p","map-note-text",text));
        if(presentationGraph()?.edgeMap.has(id))row.append(button("Revisit connection",()=>{
          if(owns() && connectionNotes.get(id)===text){setPopover(null);finishDiscovery();return choose({kind:"connection",id});}
        }));
        row.append(button("Delete saved note",()=>{
            if(!owns() || connectionNotes.get(id)!==text)return;
            connectionNotes.delete(id);if(noteDrafts.get(id)===text)noteDrafts.delete(id);renderSavedNotes();renderInspector();saveLayout();
          }));host.append(row);
      }
      if(!connectionNotes.size)host.append(el("p","map-muted",layoutLoaded ? "No saved connection notes." : "Saved connection notes have not loaded yet."));
      renderDiscovery();
    }
    async function openNamedView(id) {
      const saved=namedViews.find(item=>item.id===id);if(!saved || !view || busy || !current(view.owner) || !onPage())return;
      setPopover(null);compareChooser=null;
      const bound={...view.owner},revision=namedViewRevision;rememberTrail();const job={};navigationJob=job;navigating=true;
      for(const [key,value]of Object.entries(saved.filters)){
        const input=$({strong_only:"strong",include_single:"single"}[key] || key);if(!input)continue;
        if(typeof value==="boolean")input.checked=value;else input.value=String(value);
      }
      singleDefaulted = true; // A saved view keeps its own filters.
      if($("through") && saved.filters.through===undefined)$("through").value="";
      try{
        const expectedOperation=operation+1;await refresh({keepTrail:true});
        if(navigationJob!==job || operation!==expectedOperation || revision!==namedViewRevision || !view || !current(bound) || !onPage())return;
        const graph=presentationGraph();layoutMode=RETIRED_MODES.includes(saved.mode)?"groups":saved.mode;savedPositions=positionsByMode.get(layoutMode) || new Map();
        pins=saved.pins.filter(id=>graph.nodeMap.has(id));focusOnly=saved.focus_only;listMode=saved.list_mode;
        focusCenter=graph.nodeMap.has(saved.focus_center)?saved.focus_center:null;focusPage=0;compareAnchors=saved.compare_anchors.map(id=>graph.nodeMap.has(id)?id:null);secondRing=saved.second_ring;
        clusterAnchor=layoutMode==="groups"?focusCenter:null;
        const pageAnchor=layoutMode==="groups" && !saved.focus_center && saved.compare_anchors.length===1 ? saved.compare_anchors[0] : null;
        if(layoutMode==="groups")compareAnchors=[];
        relayout();
        if(pageAnchor && clustering.membership.has(pageAnchor)){
          clusterPage=Math.floor(clustering.clusters.findIndex(c=>c.id===clustering.membership.get(pageAnchor))/cloudPageSize);relayout();
        }
        emptyDetail();box={x:saved.viewport.x*layout.width,y:saved.viewport.y*layout.height,
          width:saved.viewport.width*layout.width,height:saved.viewport.height*layout.height};applyBox();
        renderPins();renderList();renderV2();renderPresentationControls();
        const missing=saved.pins.length-pins.length+(saved.focus_center && !focusCenter?1:0)
          +(layoutMode==="groups"?(pageAnchor && !graph.nodeMap.has(pageAnchor)?1:0):saved.compare_anchors.filter(Boolean).length-compareAnchors.filter(Boolean).length);
        $("status").textContent=`Opened “${saved.name}” with freshly checked current records. Hidden items and manual positions are shared across named views. `
          +(missing?`${missing} saved theme choices are unavailable under current evidence or hidden choices. `:"")
          +(layoutMode === "focus" ? "Focus opens at the first neighbor page. " : "")+"Transient selections and reviewed drafts were not restored.";
      }finally{if(navigationJob===job){navigationJob=null;navigating=false;}update();}
    }
    function setHidden(kind,id,hide) {
      if (!view || !current(view.owner) || !onPage() || !layoutWritable()) return;
      const ids=kind==="theme"?hiddenThemes:hiddenLinks, valid=kind==="theme"?validId:validLink;
      if (!valid(id) || hide && ids.size>=MAX_SAVED_ITEMS || hide===ids.has(id)) return;
      const next=new Set(ids);if(hide)next.add(id);else next.delete(id);
      if(!hiddenPresentationFits(kind==="theme"?[...next]:[...hiddenThemes],kind==="theme"?[...hiddenLinks]:[...next]))return;
      presentationUndo=[...presentationUndo,{themes:[...hiddenThemes],links:[...hiddenLinks]}].slice(-20);
      if (hide) ids.add(id); else ids.delete(id);
      refreshPresentation();saveLayout();
    }
    function hiddenPresentationFits(themes,links) {
      if(presentationFits({...layoutPayload(),hidden_themes:themes,hidden_links:links}))return true;
      setLayoutStatus("Map presentation has reached its 256 KB capacity. Hidden choices were not changed. Shorten notes or remove a saved view.");return false;
    }
    function refreshPresentation() {
      const graph=presentationGraph();if (!graph) return;
      pins=pins.filter(id=>graph.nodeMap.has(id));route=null;
      if (selected && !(selected.kind==="theme"?graph.nodeMap:graph.edgeMap).has(selected.id)) {selected=null;detail=null;chosenRecords.clear();detailOperation++;detailBusy=false;}
      relayout();renderList();renderPins();renderInspector();renderV2();renderPresentationControls();update();
    }
    function emptyDetail() {
      $("inspector")._scrollBody = null;
      const live = view && current(view.owner);
      if (live && highlight === "start" && view.companions?.start && layout && !layout.cloudOverview) { renderStartPanel(); return; }
      if (live && layoutMode==="groups" && clustering && clusterAnchor) { renderConstellationInspector(); return; }
      if (live && layoutMode==="compare") { renderComparePanel(); return; }
      const center = live && layoutMode === "focus" && view.nodeMap.get(focusCenter);
      if (center) {
        const original = view;
        $("inspector").replaceChildren(el("div", "eyebrow", "FOCUS"), el("h3", "", center.label),
          el("p", "map-muted", "Select a theme to inspect its saved records. Start here, or choose a neighbor to follow another thread. Lines do not establish agreement or importance."),
          button("Inspect this theme", () => { if (view === original && current(original.owner) && onPage()) choose({kind:"theme",id:center.id}); }, "button secondary"),
          el("p", "map-note", "A circle becomes a star only when you select it. No supporting records are open."));
        return;
      }
      if (live && presentationGraph().nodes.length) { renderPatterns(); return; }
      $("inspector").replaceChildren(el("div", "eyebrow", "FOLLOW A THREAD"), el("h3", "", "What connects here?"),
        el("p", "map-muted", "Select a theme to see its current saved records. Select a line to see why two themes were placed together."),
        el("p", "map-note", "These are suggested wording groups, not a profile, a belief assessment, or a measure of what matters most to you."));
    }
    // The start panel reads only the checked graph already on screen: shared
    // record counts and last-saved dates. No new request, score or inference.
    function renderPatterns() {
      const host=$("inspector"),original=view,graph=presentationGraph();
      const guarded=callback=>()=>{if(view===original && current(original.owner) && onPage())callback();};
      const today=dayNumber(view.timeline?.today) ?? Math.floor(Date.now()/86400000);
      const savedDay=value=>{const time=Date.parse(value);return Number.isFinite(time)?Math.floor(time/86400000):null;};
      const item=(title,detailText,callback,node)=>{const b=button("",guarded(callback),"map-pattern-item");b.append(el("strong","",title),el("span","map-muted",detailText));
        if(node?.monthly_counts)b.append(sparkline(node.monthly_counts));return b;};
      const section=(title,items,emptyText)=>{const s=el("section","map-pattern-section");s.append(el("h4","",title));
        if(items.length)s.append(...items);else s.append(el("p","map-muted",emptyText));return s;};
      const label=id=>graph.nodeMap.get(id).label;
      const strongest=[...graph.edges].sort((a,b)=>count(b)-count(a)||a.id.localeCompare(b.id)).slice(0,5)
        .map(edge=>item(`${label(edge.from)} ↔ ${label(edge.to)}`,`Together in ${edge.support_count} saved ${edge.support_count===1?"record":"records"}`,()=>choose({kind:"connection",id:edge.id})));
      const dated=graph.nodes.filter(node=>savedDay(node.last_saved)!==null);
      const recent=[...dated].sort((a,b)=>Date.parse(b.last_saved)-Date.parse(a.last_saved)||a.id.localeCompare(b.id)).slice(0,4)
        .map(node=>item(node.label,`Last saved ${date(node.last_saved)}`,()=>followTheme(node.id),node));
      const quiet=dated.filter(node=>node.support_count>=3 && today-savedDay(node.last_saved)>=120)
        .sort((a,b)=>count(b)-count(a)||a.id.localeCompare(b.id)).slice(0,3)
        .map(node=>item(node.label,`${node.support_count} records · last saved ${date(node.last_saved)}`,()=>followTheme(node.id),node));
      // Latest three months against the three before, from monthly counts. A
      // saved-date window already narrows the records, so it is not repeated.
      const c=view.coverage, monthly=c.theme_source!==undefined && !view.filters.days;
      const lately=monthly ? graph.nodes.map(node=>{const m=node.monthly_counts;return {node,recent:m[9]+m[10]+m[11],before:m[6]+m[7]+m[8]};})
        .filter(row=>row.recent>=3 && row.recent>=2*row.before)
        .sort((a,b)=>(b.recent-b.before)-(a.recent-a.before)||a.node.id.localeCompare(b.node.id)).slice(0,4)
        .map(({node,recent,before})=>item(node.label,`${recent} saved in the latest 3 months · ${before} in the 3 before`,()=>followTheme(node.id),node)) : [];
      host.replaceChildren(el("div","eyebrow","PATTERNS"),el("h3","","What stands out"));
      if(c.theme_source!==undefined){
        const note=el("div","map-source-note");note.append(el("p","map-muted",themeSourceText(c)));
        if(c.theme_source==="labels" && c.records_in_scope>=5 && c.labeled_records*2<c.records_in_scope){
          note.append(el("p","map-muted","Most records here have no saved labels, so they do not appear as themes."),
            button("Include wording from unlabeled records",guarded(()=>{if(busy || !$("themes"))return;$("themes").value="labels_first";void refresh();}),"button secondary"));
        }
        host.append(note);
      }
      host.append(section("Strongest connections",strongest,"No connections under the current filters."));
      if(monthly)host.append(section("Saved more often lately",lately,`No theme was saved at least twice as often in the 3 months through ${monthName(ACTIVITY_MONTHS-1)} as in the 3 before.`));
      host.append(section("Saved most recently",recent,"No dated themes in this map."),
        section("Gone quiet",quiet,"No theme with three or more records has gone 120 days without a save."));
      if(layoutMode==="groups" && clustering && !clusterAnchor){
        const list=clustering.clusters.map(cluster=>item(cluster.label,`${themeCount(cluster.count)}${cluster.labels.length>1?" · "+cluster.labels.slice(1).join(", "):""}`,()=>openConstellation(cluster.anchor)));
        host.append(section("Constellations",list,"No constellations under the current filters."));
      }
      host.append(el("p","map-note",`Counts are saved records and dates are last saves${monthly?"; bars show each theme's saves per UTC month":""}. These lists show what the map holds, not what matters most to you.`));
    }
    function renderComparePanel() {
      const host=$("inspector"),original=view,graph=presentationGraph(),[a,b]=compareAnchors;
      const guarded=callback=>()=>{if(view===original && current(original.owner) && onPage())callback();};
      host.replaceChildren(el("div","eyebrow","COMPARING TWO THEMES"));
      if(!graph.nodeMap.has(a) || !graph.nodeMap.has(b)){
        host.append(el("h3","","Choose two themes"),el("p","map-muted","Use the Compare selectors above the map, or choose Compare with… on a theme."));
        return;
      }
      const label=id=>graph.nodeMap.get(id).label;
      host.append(el("h3","",`${label(a)} and ${label(b)}`));
      const routeSection=el("section","map-pattern-section");routeSection.append(el("h4","","Shortest route"));
      if(compareRoute){
        const chain=el("div","map-route");
        compareRoute.nodes.forEach((id,i)=>{
          if(i){const edge=graph.edgeMap.get(compareRoute.edges[i-1]);
            const step=button(`${edge.support_count}`,guarded(()=>choose({kind:"connection",id:edge.id})),"map-route-link");
            step.setAttribute("aria-label",`Why ${label(compareRoute.nodes[i-1])} and ${label(id)} connect: ${edge.support_count} shared ${edge.support_count===1?"record":"records"}`);
            chain.append(step);}
          chain.append(button(label(id),guarded(()=>followTheme(id)),"map-route-step"));
        });
        routeSection.append(chain,el("p","map-muted",(compareRoute.edges.length===1?"They appear together directly. ":`${compareRoute.nodes.length-2} ${compareRoute.nodes.length===3?"theme":"themes"} in between. Each step is a connection you can read. `)
          +"A route is a way to walk through your records, not a cause or an agreement."));
      } else routeSection.append(el("p","map-note","No route in this bounded, filtered map. This does not prove the themes are unrelated. Broaden the date, source or repeated-link filters."));
      host.append(routeSection);
      const common=(layout?.commonNeighborIds || []).filter(id=>graph.nodeMap.has(id));
      const shared=el("section","map-pattern-section");shared.append(el("h4","","Both connect to"));
      const linkCount=(x,y)=>graph.edges.find(edge=>edge.from===x && edge.to===y || edge.from===y && edge.to===x)?.support_count || 0;
      for(const id of common){
        const row=button("",guarded(()=>choose({kind:"theme",id})),"map-pattern-item");
        row.append(el("strong","",label(id)),el("span","map-muted",`${linkCount(a,id)} with ${label(a)} · ${linkCount(b,id)} with ${label(b)}`));
        shared.append(row);
      }
      if(!common.length)shared.append(el("p","map-muted","No theme connects directly to both."));
      host.append(shared,button("Done comparing",guarded(finishCompare),"button secondary"));
    }
    function reset(message, keepTrail=false) {
      retireIndex();
      retireReads({snapshots: true});
      clearToast();
      clearLayoutConfirmation();
      cancelViewportPaint(); fitBounds = null;
      cancelDragPaint(); renderedNodes.clear(); incidentLines.clear();
      clustering=null;clusterAnchor=null;clusterPage=0;focusPage=0;activeLabel=null;expandedBundles=new Set();clearActiveLabel();$("constellation-trail")?.replaceChildren();
      focusPageControls = null;
      $("focus-summary")?.replaceChildren(); if ($("focus-summary")) $("focus-summary").hidden=true;
      operation++; detailOperation++; busy = false; detailBusy = false;
      route = null;
      discovery=null;landmarkCompose=null;pendingLandmark=null;
      if (!keepTrail) {past=[];future=[];navigating=false;navigationJob=null;} chosenRecords.clear();
      for (const name of ["path-result", "bridges", "activity", "timeline-caption"]) $(name)?.replaceChildren();
      for (const name of ["path-from", "path-to"]) $(name)?.replaceChildren();
      if ($("scrubber")) { $("scrubber").min = "0"; $("scrubber").max = "0"; $("scrubber").value = "0"; $("scrubber").setAttribute("aria-valuetext", ""); }
      view = null; selected = null; detail = null; pins = []; focusOnly = false; layout = null; box = null; dragged = null; errorText = "";
      inspectorTab = "overview"; resetInspectorScroll = false; compareChooser = null; compareRoute = null; labelEntries = []; labelScale = null;
      $("scene").replaceChildren(); $("list").replaceChildren(); $("pins").replaceChildren(); $("matches").replaceChildren();
      $("scope").textContent = ""; $("stats").textContent = ""; $("status").textContent = message;
      $("empty").hidden = false; $("empty").textContent = message; emptyDetail();
      for (const name of ["hidden-items","presentation-status","layout-explanation","named-views","saved-notes"]) $(name)?.replaceChildren();
      for (const name of ["focus-center","compare-left","compare-right"]) $(name)?.replaceChildren();
      renderSavedNotes();
    }
    function clear() {
      retireReads({all: true});
      void fullscreen?.exit({restoreFocus: false});
      discardLayout();
      reset("Unlock your vault to explore its connections.");
      if ($("through")) $("through").value = "";
      uniqueCounts=false;if($("count-mode"))$("count-mode").value="records";if($("themes"))$("themes").value="all";
      $("query").value = ""; $("find").value = ""; $("days").value = "0"; $("kind").value = "all";
      $("strong").checked = false; $("single").checked = false; singleChosen = false; singleDefaulted = false; update();
    }
    function invalidate(message = "Saved records changed. Refresh the map to see current connections.") { thoughtAnchor=null;reset(message); update(); }
    function update() {
      if (!eligible() || !onPage()) retireIndex();
      retireReads();
      if(!eligible()){uniqueCounts=false;if($("count-mode"))$("count-mode").value="records";}
      if (!eligible() || !onPage()) { clearToast(); clearLayoutConfirmation(); }
      if (layoutOwner && !presentationCurrent(layoutOwner)) discardLayout();
      if (view && !current(view.owner)) reset("The page or vault changed. Refresh the map.");
      if (!eligible() && (view || detail || busy)) reset("Unlock your vault outside a conversation without saving to explore the map.");
      updateMapLegend();
      renderIndexPanel(view?.coverage, view?.filters);
      $("refresh").disabled = busy || !eligible(); $("scope-submit").disabled = busy || !eligible();
      for (const name of ["find-button", "fit", "zoom-in", "zoom-out", "graph-mode", "list-mode", "clear-pins"])
        $(name).disabled = !view || !eligible();
      if ($("clear-selection")) $("clear-selection").disabled = !selected || !view || !eligible();
      for (const name of ["days", "kind", "strong", "single", "query", "find"])
        $(name).disabled = busy || !eligible();
      if ($("themes")) $("themes").disabled = busy || !eligible();
      if($("count-mode"))$("count-mode").disabled=!view || busy || !eligible()
        || !view.nodes.every(node=>node.evidence_group_count!==undefined) || !view.edges.every(edge=>edge.evidence_group_count!==undefined);
      for (const mode of ["focus","groups","connections"]) {
        const control=$("mode-"+mode);if(control){control.disabled=!view || busy || !layoutWritable();control.setAttribute("aria-pressed",String(layoutMode===mode));}
      }
      if ($("layout-mode")) { $("layout-mode").value = layoutMode; $("layout-mode").disabled = !view || !layoutWritable(); }
      $("reset-layout").disabled = !view || !layoutWritable() || !POSITION_MODES.includes(layoutMode) || Boolean(layout?.cloudOverview);
      $("graph-mode").setAttribute("aria-pressed", String(!listMode)); $("list-mode").setAttribute("aria-pressed", String(listMode));
      for (const name of ["through", "scrubber", "today", "previous-window", "next-window", "path-from", "path-to", "path-find", "path-clear"])
        if ($(name)) $(name).disabled = busy || !eligible() || (!view && name !== "through");
      if ($("previous-window")) $("previous-window").disabled ||= !view?.timeline?.days;
      if ($("next-window")) $("next-window").disabled ||= !view?.timeline?.days || view.timeline.through === view.timeline.today;
      $("stage").hidden = listMode; $("list").hidden = !listMode;
      fullscreen?.update();
      if ($("back")) $("back").disabled=busy || detailBusy || navigating || !view || !past.length || !eligible();
      if ($("forward")) $("forward").disabled=busy || detailBusy || navigating || !view || !future.length || !eligible();
      for (const name of ["focus-center","compare-left","compare-right","second-ring","restore-hidden"]) if ($(name)) $(name).disabled=!view || busy || !layoutWritable();
      if ($("undo-hide")) $("undo-hide").disabled=!view || !presentationUndo.length || !layoutWritable();
      for(const name of ["view-name","save-view"])if($(name))$(name).disabled=!view || busy || !layoutWritable() || navigating;
      if($("retry-load")) {
        $("retry-load").hidden=!presentationCurrent(layoutOwner) || layoutLoaded || layoutLoading;
        $("retry-load").disabled=busy || !eligible() || !onPage();
      }
      if($("retry-save")) {
        $("retry-save").hidden=!layoutWritable() || layoutRevision===confirmedLayoutRevision;
        $("retry-save").disabled=!view || !layoutWritable() || layoutSaving || layoutRevision===confirmedLayoutRevision;
      }
      for (const [toggleName] of POPOVERS) if ($(toggleName)) $(toggleName).disabled = !eligible();
      if (!eligible() || !onPage()) setPopover(null);
      renderTrail();
      renderDiscovery();
    }
    async function request(path, body, bound, serial, admitted = () => true) {
      const ready = () => current(bound) && serial === operation && onPage() && admitted();
      if (!ready()) throw new Error("This map is no longer active.");
      const readsSnapshot = path === "/api/continuity-map/browse" || path === "/api/continuity-map/inspect";
      if (readsSnapshot && presentationCurrent(layoutOwner) && layoutSavePromise) await layoutSavePromise;
      if (!ready()) throw new Error("This map is no longer active.");
      await authorize();
      if (!ready()) throw new Error("This map is no longer active.");
      const controller = context().controller;
      if (typeof controller !== "string" || !controller) throw new Error("PCS could not confirm this page. Refresh to try again.");
      bound.controller = controller;
      // A layout write rotates the private response projection stamp. A save
      // started during authorization must finish before either snapshot read.
      if (readsSnapshot && presentationCurrent(layoutOwner) && layoutSavePromise) await layoutSavePromise;
      if (!ready()) throw new Error("This map is no longer active.");
      const result = await transport(path, {method: "POST", body, headers: {"X-PCS-Controller": controller}},
        bound, ready);
      if (!ready()) throw new Error("This map is no longer active.");
      return result;
    }
    // The running connection index lets the map read the whole archive.
    // Building it is an explicit owner action because it changes the vault
    // format; batches repeat until every memory is indexed.
    function retireIndex() {
      indexBuild = null;
      for (const name of ["index-text", "index-status"]) if ($(name)) $(name).textContent = "";
      if ($("index-panel")) $("index-panel").hidden = true;
      if ($("index-build")) $("index-build").disabled = true;
    }
    function renderIndexPanel(c, filter) {
      const panel = $("index-panel"), index = c?.connection_index;
      if (!panel) return;
      const unread = c && filter?.kind !== "notebook" && c.memory_scanned < c.memory_date_matching;
      const pending = index?.enabled && (index.worded_records > 0 || index.not_read > 0);
      panel.hidden = !eligible() || !onPage() || !index || !(pending || (!index.enabled && unread));
      $("index-build").disabled = panel.hidden || !!indexBuild || busy;
      if (panel.hidden) return;
      $("index-text").textContent = index.enabled
        ? `${(index.worded_records + index.not_read).toLocaleString()} memories are not in the connection index yet, so the map read them directly or left them out. Finish indexing to include them.`
        : `The map read the newest ${c.memory_scanned.toLocaleString()} of ${c.memory_date_matching.toLocaleString()} matching memories. Indexing the whole archive lets it read all of them (up to 50,000) and keeps the index current as memories are saved. It takes about a minute per 10,000 memories. Afterwards this vault needs PCS 0.9.107 or newer to open.`;
      $("index-build").textContent = index.enabled ? "Finish indexing" : "Index the whole archive";
    }
    async function buildIndex() {
      if (!view || $("index-build").disabled) return;
      const job = {owner: view.owner, serial: operation};
      const owns = () => indexBuild === job && job.serial === operation && current(job.owner) && onPage();
      indexBuild = job; $("index-build").disabled = true;
      try {
        for (;;) {
          const result = await request("/api/continuity-map/index", {action: "build"}, job.owner, job.serial, owns);
          if (!owns()) return;
          if (!result || typeof result.complete !== "boolean" || !Number.isInteger(result.indexed) || !Number.isInteger(result.memory_total))
            throw new Error("The connection index result could not be checked.");
          $("index-status").textContent = `Indexed ${result.indexed.toLocaleString()} of ${result.memory_total.toLocaleString()} memories…`;
          if (result.complete) break;
        }
        $("index-status").textContent = "The whole archive is indexed. Refreshing the map…";
        await refresh({keepTrail: true});
      } catch (error) {
        if (owns())
          $("index-status").textContent = (error?.message || "Indexing stopped.") + " Press the button again to continue; finished batches are kept.";
      } finally { if (indexBuild === job) { indexBuild = null; update(); } }
    }
    $("index-build")?.addEventListener("click", () => { void buildIndex(); });
    // 0.9.163: a young vault (fewer than 12 saved memories) shows themes found
    // only once by default, so a first conversation has something to show. An
    // explicit choice of that box wins for this unlocked page, as before.
    function defaultSingle() {
      if (singleChosen || singleDefaulted) return;
      const total = context().memoryTotal;
      if (!Number.isSafeInteger(total) || total < 0) return;
      singleDefaulted = true;
      if (total < YOUNG_VAULT_MEMORIES) $("single").checked = true;
    }
    async function refresh(options={}) {
      if (!eligible() || !onPage() || busy) { update(); return; }
      defaultSingle();
      const filter = filters();
      if (!options.keepTrail) {navigationJob=null;navigating=false;}
      if (Array.from(filter.query).length > 300) { $("status").textContent = "Use at most 300 characters for saved-word scope."; return; }
      if (!options.keepTrail) rememberTrail();
      reset("Finding recurring wording in saved continuity…",true);
      const bound = owner(), serial = operation; busy = true; update();
      try {
        const value = checked(await request("/api/continuity-map/browse", filter, bound, serial), filter);
        await loadLayout(bound);
        if (serial !== operation || !current(bound) || !onPage()) return;
        view = {...value, filters: filter, owner: bound};
        const c = value.coverage;
        $("status").textContent = value.nodes.length ? "" : unlabeledText(c)
          || "No themes match these filters yet. Try All dates, enable Themes found only once, or broaden saved-word scope.";
        $("empty").hidden = value.nodes.length > 0; $("empty").textContent = $("status").textContent;
        $("stats").textContent = `${value.nodes.length} themes · ${value.edges.length} connections`;
        $("scope").textContent = `${c.records_in_scope} current records in scope. Scanned ${c.memory_scanned} of ${c.memory_total} matching memories and ${c.notebook_scanned} of ${c.notebook_total} matching notebooks. `
          + (c.date_filtered_before_sampling ? `Saved-date eligibility is applied first: ${c.memory_date_matching} matching memories and ${c.notebook_date_matching} matching notebooks${value.timeline?.days?" across the selected and preceding windows":""}. ` : "")
          + (c.records_limited ? "This is a bounded sample of eligible records; narrow the saved window or saved-word scope to explore beyond it. " : "")
          + (c.text_limited ? `${c.text_limited} records have bounded text excerpts. ` : "")
          + (c.candidate_themes > value.nodes.length ? `Showing up to ${MAX_NODES} nonredundant wording groups. ` : "")
          + (c.links_omitted ? `${c.links_omitted} weaker links are outside the display limit. ` : "")
          + (c.theme_source ? themeSourceText(c) + " " : "")
          + "Dates mean last saved/edited, not last discussed. Revisions do not increase record counts.";
        if(layoutMode==="focus" && !presentationGraph().nodeMap.has(focusCenter))focusCenter=presentationGraph().nodes[0]?.id || null;
        relayout(); renderList(); renderPins(); emptyDetail(); renderV2();renderPresentationControls();
      } catch (error) {
        if (serial === operation && current(bound) && onPage()) { $("status").textContent = error.message; $("empty").textContent = error.message; }
      } finally { if (serial === operation) { busy = false; update(); } }
    }
    function cancelDrag() {
      cancelDragPaint();
      if (!dragged) return;
      if (dragged.id && layout?.positions.has(dragged.id)) Object.assign(layout.positions.get(dragged.id), dragged.position);
      try { $("canvas").releasePointerCapture?.(dragged.pointer); } catch (_) { /* Capture may already have ended. */ }
      dragged = null; clickSuppressed = false;
    }
    function relayout(settleSize = true, retained = null) {
      if (!view) return;
      fitBounds = null;
      cancelDrag();
      sizeCanvas();
      const rect = $("canvas").getBoundingClientRect();
      const graph=presentationGraph();
      const layoutNodes=uniqueCounts||graph.nodes.some(observed)?graph.nodes.map(node=>({...node,support_count:count(node)})):graph.nodes;
      clustering=constellations.clusterGraph(layoutNodes,graph.edges);
      if (clusterAnchor && !clustering.membership.has(clusterAnchor)) clusterAnchor=null;
      // 0.9.118: the overview is the Map's landing view; fit two rows of clouds
      // in an ordinary desktop canvas before paging. Labels stay readable.
      cloudPageSize=clamp(Math.max(1,Math.floor((rect.width||860)/210))*Math.max(1,Math.floor((rect.height||590)/170)),1,12);
      clusterPage=clamp(clusterPage,0,Math.max(0,Math.ceil(clustering.clusters.length/cloudPageSize)-1));
      const cluster=clusterAnchor && clustering.clusters.find(c=>c.id===clustering.membership.get(clusterAnchor));
      const members=cluster && new Set(cluster.ids);
      // Compare with… shows the shortest displayed route; its middle themes join
      // the Compare arrangement. A route is navigation, never a new link.
      compareRoute = layoutMode === "compare" && compareAnchors.length === 2 && compareAnchors[0] && compareAnchors[1]
        && compareAnchors[0] !== compareAnchors[1] ? shortestPath(graph, compareAnchors[0], compareAnchors[1]) : null;
      const nodes=layoutMode==="groups" && members ? layoutNodes.filter(n=>members.has(n.id)) : layoutNodes;
      const edges=layoutMode==="groups" && members ? graph.edges.filter(e=>members.has(e.from)&&members.has(e.to)) : graph.edges;
      layout = layoutMode==="groups" && !cluster ? {...constellations.constellationLayout(clustering.clusters.slice(clusterPage*cloudPageSize,(clusterPage+1)*cloudPageSize),rect.width||860,rect.height||590),cloudOverview:true,visibleIds:[]}
        : layoutGraph(nodes, edges, rect.width || 860, rect.height || 590, layoutMode==="groups"?"connections":layoutMode,
          {center:focusCenter,anchors:compareAnchors,routeIds:compareRoute?.nodes || [],secondRing,today:view.timeline?.today,labelWidths:measureLabelWidths(document,nodes),
            focusPageSize: rect.width < 560 ? 4 : 8, focusPage,
            requiredIds: [...pins, ...(route?.nodes || []), ...(selected?.kind === "theme" ? [selected.id]
              : selected?.kind === "connection" && graph.edgeMap.has(selected.id) ? [graph.edgeMap.get(selected.id).from,graph.edgeMap.get(selected.id).to] : [])],
            // Only the full Connections graph reuses this same synchronous
            // relayout's grouping. An opened constellation has its own subset.
            clustering: layoutMode === "connections" ? clustering : undefined});
      if (layoutMode === "focus") focusPage = layout.neighborPage || 0;
      // Removing temporary Focus context should not move the surviving themes
      // or reset an owner's pan/zoom. A changed page or newly required theme
      // still gets a fresh readable arrangement.
      const keepGeometry = retained && layoutMode === "focus" && retained.layout.center === layout.center
        && retained.layout.neighborPage === layout.neighborPage
        && layout.visibleIds.every(id => retained.layout.positions.has(id));
      if (keepGeometry) {
        for (const key of ["width", "height", "innerRadius", "outerRadius", "ringAspect"]) layout[key] = retained.layout[key];
        for (const id of layout.visibleIds) layout.positions.set(id, {...retained.layout.positions.get(id)});
      }
      for (const [id, point] of POSITION_MODES.includes(layoutMode) && !layout.cloudOverview?savedPositions:[]) {
        const position = layout.positions.get(id);
        if (position) { position.x = point.x * layout.width; position.y = point.y * layout.height; }
      }
      activeLabel=null;clearActiveLabel();
      renderConstellationTrail();renderFocusSummary();
      $("navigation-help").textContent = layout.cloudOverview ? "Open a constellation to explore its themes. Bridges join constellations on this page; All links shows the full web. Use List for every constellation, or page through the clouds. Drag empty space to pan; scroll to zoom."
        : "Drag the background to pan; "
        + (!layoutWritable() ? "theme positions stay fixed until saved Map choices load. " : ["focus","compare","saved-date"].includes(layoutMode) ? "theme positions stay fixed in this layout. " : "drag a theme to move it. ")
        + "Scroll to zoom. Double-click empty space to clear selection; your notes stay. Keyboard: use Clear selection, or focus the map for arrows, + / −, and 0 to fit. Theme buttons and List offer keyboard access.";
      const outside=layout.neighborhoodIds ? graph.nodes.length-layout.neighborhoodIds.length : layout.omittedCount;
      const omitted=outside ? ` ${outside} other ${outside === 1 ? "theme is" : "themes are"} outside this layout. Choose All links to see the full filtered map.` : "";
      if ($("layout-explanation")) $("layout-explanation").textContent=layout.message || (layoutMode==="focus"
        ? (secondRing ? "Focus rings show direct neighbors and a second step through displayed links; " : "Focus rings show the center and its direct neighbors. Enable the second ring to explore another step; ")
          +"ring number is not conceptual distance. Neighbor pages keep labels readable. List and paths include the full neighborhood. Focus shows center links and two-step links; All links shows the full web."+omitted
        : layoutMode==="compare" ? `${layout.commonNeighborIds?.length || 0} middle themes are directly connected to both chosen themes. This does not mean one record contains all three. `
          +(layout.anchorsConnected?"The two anchors also have a displayed direct connection.":"The two anchors have no displayed direct connection.")+omitted
        : layoutMode==="grid"?"Grid keeps labels in stable rows. Dimmed lines remain in this map."
        : layoutMode==="saved-date"?"Saved-date groups themes by the latest supporting record save or edit, in UTC, relative to "+layout.dateThrough+". This is not when a topic was discussed or a historical event. Missing dates stay in their own bucket; links are unchanged.":"");
      $("empty").hidden=!layout.needsSelection && graph.nodes.length>0;
      if (layout.needsSelection) $("empty").textContent=layout.message;
      else if (!graph.nodes.length) $("empty").textContent=view.nodes.length
        ? "All themes in this filtered map are hidden. Restore hidden items to show them, or search saved records in Library."
        : unlabeledText(view.coverage) || "No themes match these filters. Broaden the saved-word scope, source type or date window.";
      renderPresentationControls();
      updateMapLegend();
      sizeCanvas();
      const settled = $("canvas").getBoundingClientRect();
      // A newly shown/wrapped control row changes the space above the stage.
      // Resolve that once before fitting; do not depend on a later observer.
      if (settleSize && (Math.abs(settled.width-rect.width)>1 || Math.abs(settled.height-rect.height)>1)) {
        relayout(false, retained); return;
      }
      box = keepGeometry ? {...retained.box} : fittedBox(); draw();
    }
    function refreshFocusContext() {
      if (layoutMode === "focus" && layout && box) relayout(true, {layout, box: {...box}});
      else draw();
    }
    function sizeCanvas() {
      const style = $("view")?.style;
      if (!style?.setProperty || !Number.isFinite(environment.innerHeight)) return;
      if (fullscreen?.active() || environment.innerWidth <= 1180) { style.removeProperty?.("--map-canvas-height"); return; }
      // Use the actual controls' position, including browser chrome/zoom and
      // wrapped rows. Scrolling the page must not continuously grow the map.
      const stage = $(listMode ? "list" : "stage").getBoundingClientRect();
      const top = stage.top + (environment.scrollY || 0)
        + (document.getElementById("page-memories")?.scrollTop || 0);
      // Measure the help disclosure as shown: a closed one is only its summary.
      const help = $("navigation-help"), navigation = listMode ? 0 : (help.closest?.("details") || help).getBoundingClientRect().height;
      // 0.9.118: Back/Forward sit above the map. The saved-date strip below it
      // stays in the same viewport, so the graph takes the remaining height.
      const strip = $("timeline-panel")?.getBoundingClientRect?.().height;
      const tail = Number.isFinite(strip) ? strip + 40 : 30;
      const height = Math.round(clamp(environment.innerHeight - top - navigation - tail, 280, 980));
      style.setProperty("--map-canvas-height", height + "px");
    }
    function renderFocusSummary() {
      const host = $("focus-summary"); if (!host) return;
      focusPageControls = null;
      host.replaceChildren();host.hidden = !view || !current(view.owner) || layoutMode !== "focus";
      if (host.hidden || !view.nodeMap.has(focusCenter)) return;
      const original=view, center=focusCenter, oldLayout=layout;
      const owned=()=>view===original && current(original.owner) && onPage() && layout===oldLayout;
      const title=el("div","map-focus-heading");
      title.append(el("span","eyebrow","AROUND"),button(view.nodeMap.get(center).label,()=>{if(owned())choose({kind:"theme",id:center});},"map-focus-title"));
      const total=layout.neighborTotal || 0,start=focusPage*layout.focusPageSize;
      const count=route ? `Path: ${route.nodes.length} themes` : listMode ? `${total} neighbors in this list`
        : total ? `Neighbors ${start+1}–${Math.min(total,start+layout.focusPageSize)} of ${total}` : "No direct neighbors in this filtered map";
      const extras=layout.additionalIds?.length || 0;
      const caption=el("span","map-focus-count",count+(!route && !listMode && extras ? ` · ${extras} additional context ${extras===1?"theme":"themes"} shown` : ""));
      host.append(title,caption);
      if (!route && !listMode && layout.neighborPageCount>1) {
        const page=direction=>{
          if(!owned() || busy || detailBusy || focusPage+direction<0 || focusPage+direction>=layout.neighborPageCount)return;
          rememberTrail();focusPage+=direction;route=null;relayout();renderList();renderV2();update();
          const controls=focusPageControls;if(!controls)return;
          const preferred=direction>0?controls.next:controls.previous;
          (preferred.disabled?(direction>0?controls.previous:controls.next):preferred).focus();
        };
        const nav=el("nav","map-focus-pages"),previous=button("Previous neighbors",()=>page(-1),"chip-button"),next=button("Next neighbors",()=>page(1),"chip-button");
        focusPageControls={previous,next};
        nav.setAttribute("aria-label","Focus neighbor pages");previous.disabled=focusPage===0;next.disabled=focusPage+1===layout.neighborPageCount;
        const position=el("span","map-focus-page-position",`Page ${focusPage+1} of ${layout.neighborPageCount}`);
        position.id="map-focus-page-position";
        position.setAttribute("role","status");position.setAttribute("aria-live","polite");position.setAttribute("aria-atomic","true");
        previous.setAttribute("aria-describedby",position.id);next.setAttribute("aria-describedby",position.id);
        nav.append(previous,position,next);host.append(nav);
      }
      if (!listMode && !route && layout.neighborPageCount>1) host.append(button("List all neighbors",()=>{
        if(owned()){listMode=true;update();renderList();renderFocusSummary();$("list").children[0]?.focus();}
      },"text-button"));
    }
    // Fit depends on geometry and visible edges, never the pan/zoom viewport.
    // Retire it whenever those inputs change, rather than rerouting hundreds
    // of curves for every wheel tick in a dense Focus neighborhood.
    function fittedBox() { if (!fitBounds) fitBounds = fitBox(layout,renderedEdges()); return {...fitBounds}; }
    function cancelViewportPaint() {
      const pending = viewportFrame; viewportFrame = null;
      if (pending && environment.cancelAnimationFrame) environment.cancelAnimationFrame(pending.handle);
    }
    function scheduleViewportPaint() {
      if (viewportFrame) return;
      if (!environment.requestAnimationFrame) { applyBox(); return; }
      const pending = {view, layout}; viewportFrame = pending;
      pending.handle = environment.requestAnimationFrame(() => {
        if (viewportFrame !== pending) return;
        viewportFrame = null;
        if (view === pending.view && layout === pending.layout && current(view?.owner) && onPage()) applyBox();
      });
    }
    function applyBox() {
      cancelViewportPaint();
      if (!box) return;
      $("canvas").setAttribute("viewBox", `${box.x} ${box.y} ${box.width} ${box.height}`);
      const rect=$("canvas").getBoundingClientRect(),scale=Math.min(rect.width/box.width,rect.height/box.height);
      $("canvas").setAttribute("data-distant",String(!layout.cloudOverview && scale<.64));
      cullLabels(scale);
      positionActiveLabel();
    }
    // Zoomed out, labels keep about 14px on screen (up to 4x their map size).
    // Where they would overlap, the theme with more records keeps its label;
    // selected, centered and compared themes always keep theirs. Hover, focus
    // and List still name every theme.
    function cullLabels(scale) {
      if (!labelEntries.length || !layout || !Number.isFinite(scale) || scale <= 0) return;
      const k = clamp(1 / scale, 1, 4);
      if (labelScale !== null && Math.abs(k - labelScale) < .02) return;
      labelScale = k;
      $("canvas").style?.setProperty?.("--map-label-scale", k.toFixed(3));
      const placed = [];
      for (const entry of [...labelEntries].sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))) {
        const p = layout.positions.get(entry.id); if (!p) continue;
        const offset = p.radius + (entry.pressed ? 30 : 19) * k, half = entry.width * k / 2 + 2 * k;
        entry.label.setAttribute("y", offset.toFixed(2));
        const box = {x0: p.x - half, x1: p.x + half, y0: p.y + offset - 13 * k, y1: p.y + offset + (entry.lines * 16.1 - 9) * k};
        const keep = entry.always || !placed.some(b => box.x0 < b.x1 && box.x1 > b.x0 && box.y0 < b.y1 && box.y1 > b.y0);
        entry.label.setAttribute("class", keep ? "map-node-label" : "map-node-label map-label-culled");
        if (keep) placed.push(box);
      }
    }
    function clearActiveLabel() { const label=$("active-label");if(label){label.hidden=true;label.textContent="";} }
    function positionActiveLabel() {
      const label=$("active-label"),id=activeLabel || (selected?.kind==="theme"?selected.id:null),point=layout?.positions.get(id);
      if(!label || !point || layout.cloudOverview || !view || !current(view.owner) || !onPage() || !visibleIds().has(id)){clearActiveLabel();return;}
      const rect=$("canvas").getBoundingClientRect(),stage=$("stage").getBoundingClientRect();
      const scale=Math.min(rect.width/box.width,rect.height/box.height);
      const x=(rect.width-box.width*scale)/2+(point.x-box.x)*scale,y=(rect.height-box.height*scale)/2+(point.y-box.y)*scale;
      if(x<0 || x>rect.width || y<0 || y>rect.height){clearActiveLabel();return;}
      label.textContent=view.nodeMap.get(id).label;label.hidden=false;
      label.style.left=`${clamp(rect.left-stage.left+x,90,Math.max(90,rect.width-90))}px`;
      label.style.top=`${rect.top-stage.top+y+point.radius*scale+13}px`;
    }
    function renderConstellationTrail() {
      const host=$("constellation-trail");if(!host)return;host.replaceChildren();
      if(!view || !current(view.owner) || layoutMode!=="groups" || !clustering)return;
      const cluster=clustering.clusters.find(c=>c.id===clustering.membership.get(clusterAnchor));
      const original=view;
      // The overview needs no "back to overview" button; an open one does.
      if(cluster)host.append(button("All constellations",()=>{if(view===original && current(original.owner) && onPage())openConstellation(null);},"chip-button"));
      host.append(el("span","map-muted",cluster?`${cluster.label} · ${themeCount(cluster.count)}`:`${clustering.clusters.length} constellations`));
      if(!cluster && clustering.clusters.length>cloudPageSize){
        const original=view,change=delta=>{if(view!==original || !current(original.owner) || !onPage())return;clusterPage+=delta;relayout();renderList();};
        const previous=button("Previous constellations",()=>change(-1)),next=button("Next constellations",()=>change(1));
        previous.disabled=clusterPage===0;next.disabled=(clusterPage+1)*cloudPageSize>=clustering.clusters.length;
        host.append(previous,el("span","map-muted",`${clusterPage*cloudPageSize+1}–${Math.min((clusterPage+1)*cloudPageSize,clustering.clusters.length)} of ${clustering.clusters.length}`),next);
      }
    }
    function openConstellation(anchor) {
      if(!view || !current(view.owner) || !onPage() || layoutMode!=="groups" || (anchor && !clustering?.membership.has(anchor)))return;
      rememberTrail();clusterAnchor=anchor;selected=null;detail=null;detailOperation++;detailBusy=false;chosenRecords.clear();route=null;
      relayout();renderList();emptyDetail();renderV2();update();
    }
    function renderConstellationInspector() {
      const host=$("inspector"),original=view,group=clustering.clusters.find(c=>c.id===clustering.membership.get(clusterAnchor));
      host.replaceChildren(el("div","eyebrow","CONSTELLATIONS"),el("h3","",group?group.label:"A wider view"),
        el("p","map-muted",group?"Explore a theme, then follow its connections into the rest of your map.":"Open a constellation to see its themes. All links shows the full web."));
      const guarded=callback=>()=>{if(view===original && current(original.owner) && onPage())callback();};
      if(!group) for(const cluster of clustering.clusters) host.append(button(`${cluster.label} · ${themeCount(cluster.count)}`,guarded(()=>openConstellation(cluster.anchor)),"map-cluster-choice"));
      else {
        for(const id of group.ids) host.append(button(view.nodeMap.get(id).label,guarded(()=>choose({kind:"theme",id})),"map-cluster-choice"));
        const bridges=clustering.bridges.filter(b=>b.from===group.id||b.to===group.id);
        if(bridges.length)host.append(el("h4","","Beyond this constellation"));
        for(const bridge of bridges){const other=clustering.clusters.find(c=>c.id===(bridge.from===group.id?bridge.to:bridge.from));
          host.append(button(`${other.label} · ${bridge.count} theme connections`,guarded(()=>openConstellation(other.anchor)),"map-cluster-choice"));}
      }
      host.append(el("p","map-note","Constellations follow displayed links. Their names come from member themes; they can change with your filters and saved text. They are not categories or conclusions about your life."));
    }
    function bundleCenter(ids, visible) {
      const points = ids.filter(id => visible.has(id)).map(id => layout.positions.get(id)).filter(Boolean);
      return points.length ? {x: points.reduce((sum, p) => sum + p.x, 0) / points.length, y: points.reduce((sum, p) => sum + p.y, 0) / points.length} : null;
    }
    function drawBundles(scene, visible, badgeLayer) {
      if (layoutMode !== "connections" || layout?.mode !== "connections" || !Array.isArray(layout.bridges) || route) return 0;
      let badges = 0;
      const counts = new Map();
      for (const edge of renderedEdges(visible, {bundled: true})) { const bridge = bundleOf(edge); counts.set(bridge.id, (counts.get(bridge.id) || 0) + 1); }
      const clusterById = new Map((layout.clusters || []).map(cluster => [cluster.id, cluster]));
      for (const bridge of layout.bridges) {
        const open = expandedBundles.has(bridge.id), amount = open ? bridge.count : counts.get(bridge.id) || 0;
        const left = clusterById.get(bridge.from), right = clusterById.get(bridge.to);
        if (!amount || !left || !right) continue;
        const a = bundleCenter(left.ids, visible), b = bundleCenter(right.ids, visible);
        if (!a || !b) continue;
        const toggle = () => { if (clickSuppressed) return; open ? expandedBundles.delete(bridge.id) : expandedBundles.add(bridge.id); draw(); updateMapLegend(); };
        const words = `${amount} ${amount === 1 ? "link" : "links"} between ${left.label} and ${right.label}`;
        const g = svgEl("g", {class: "map-bundle" + (open ? " expanded" : "") + (selected ? " muted" : ""), role: "button", tabindex: "0",
          "aria-expanded": String(open), "aria-label": `${words}. ${open ? "Bundle them again." : "Show each link."}`, "data-map-bundle": bridge.id});
        const d = `M${a.x},${a.y} L${b.x},${b.y}`;
        g.append(svgEl("title", {}, `${words}. ${open ? "Select to bundle them again." : "Select to show each link."}`),
          svgEl("path", {d, fill: "none", class: "map-edge-hit"}),
          svgEl("path", {d, fill: "none", class: "map-bundle-line", "stroke-width": open ? 1 : Math.min(9, 2 + Math.log2(amount + 1))}));
        g.addEventListener("click", toggle);
        g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
        scene.append(g);
        if (!open) {
          const width = Math.max(26, String(amount).length * 7 + 22), badge = svgEl("g", {class: "map-bundle-badge", "aria-hidden": "true",
            transform: `translate(${(a.x + b.x) / 2},${(a.y + b.y) / 2})`, "data-map-bundle-badge": bridge.id});
          badge.append(svgEl("rect", {x: -width / 2, y: -11, width, height: 22, rx: 11}), svgEl("text", {"text-anchor": "middle", y: 4}, `⇄ ${amount}`));
          badge.addEventListener("click", toggle); badgeLayer.append(badge); badges++;
        }
      }
      return badges;
    }
    function drawConstellations(scene) {
      const original=view;
      for(const bridge of clustering.bridges){
        const a=layout.positions.get(bridge.from),b=layout.positions.get(bridge.to);if(!a || !b)continue;
        const line=svgEl("path",{d:`M${a.x},${a.y} Q${(a.x+b.x)/2+35},${(a.y+b.y)/2-30} ${b.x},${b.y}`,class:"map-cloud-bridge",fill:"none","stroke-width":1+Math.log2(bridge.count+1)*.35});
        line.append(svgEl("title",{},`${bridge.count} displayed theme connections between these constellations`));scene.append(line);
      }
      for(const cluster of layout.clusters){
        const p=layout.positions.get(cluster.id),g=svgEl("g",{class:`map-cloud map-group-${cluster.group%6}`,transform:`translate(${p.x},${p.y})`,tabindex:0,role:"button","data-map-cluster":cluster.id,"aria-label":`${cluster.label}, ${themeCount(cluster.count)}. Open constellation.`});
        g.append(svgEl("circle",{r:p.radius+24,class:"map-cloud-hit"}),svgEl("circle",{r:p.radius+14,class:"map-cloud-aura"}),svgEl("circle",{r:p.radius,class:"map-cloud-body"}));
        for(let i=0;i<cluster.count;i++){const angle=i*2.39996323,r=Math.sqrt((i+.5)/cluster.count)*p.radius*.75;
          g.append(svgEl("circle",{cx:Math.cos(angle)*r,cy:Math.sin(angle)*r,r:i?2.1:3.2,class:"map-cloud-star"}));}
        const label=svgEl("text",{"text-anchor":"middle",y:p.radius+28,class:"map-cloud-label"}),lines=layout.footprints.get(cluster.id).lines;
        lines.forEach((line,i)=>label.append(svgEl("tspan",{x:0,dy:i?17:0},line)));g.append(label);
        // Name the next member themes so a constellation reads before it is opened.
        const members=cluster.labels.slice(1,3).join(" · "),below=p.radius+28+17*lines.length;
        if(members)g.append(svgEl("text",{"text-anchor":"middle",y:below+2,class:"map-cloud-members"},Array.from(members).length>34?Array.from(members).slice(0,33).join("")+"…":members));
        g.append(svgEl("text",{"text-anchor":"middle",y:members?below+20:p.radius+70,class:"map-cloud-count"},themeCount(cluster.count)));
        const open=()=>{if(view===original && current(original.owner))openConstellation(cluster.anchor);};
        g.addEventListener("click",open);g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();open();}});scene.append(g);
      }
      applyBox();updateMapLegend();
    }
    function visibleIds(allFocusPages = false) {
      const graph=presentationGraph(); if (!graph) return new Set();
      const visible=route?new Set(route.nodes):selectionNeighborhood(graph,selected,pins,focusOnly);
      const membership=allFocusPages && layout?.neighborhoodIds || layout?.visibleIds;
      return new Set([...visible].filter(id=>graph.nodeMap.has(id) && (!membership || membership.includes(id))));
    }
    // 0.9.160: at rest the sky draws a spanning skeleton of each constellation's
    // displayed links, strongest first, plus links that carry your note.
    // Links between constellations are never hidden here. Presentation only:
    // every link stays in the document, in List and in the inspector.
    let restingCount = 0;
    // 0.9.160 highlights: page-only emphasis from data already on screen. They
    // dim, never hide, and change no filter, saved choice or request.
    const HIGHLIGHTS = ["lately", "quiet", "strong", "thoughts", "start"];
    let highlight = null;
    function highlighted() {
      const graph = presentationGraph();
      if (!highlight || !graph || !layout || layout.cloudOverview || !current(view.owner)) return null;
      const nodes = new Set(), edges = new Set(), companions = view.companions;
      const today = dayNumber(view.timeline?.today) ?? Math.floor(Date.now() / 86400000);
      const age = node => { const time = Date.parse(node.last_saved); return Number.isFinite(time) ? Math.max(0, today - Math.floor(time / 86400000)) : null; };
      if (highlight === "lately") for (const node of graph.nodes) { const days = age(node); if (days !== null && days <= 45) nodes.add(node.id); }
      else if (highlight === "quiet") for (const node of graph.nodes) { const days = age(node); if (days !== null && days >= 120) nodes.add(node.id); }
      else if (highlight === "strong") for (const edge of [...graph.edges].sort((a, b) => count(b) - count(a) || a.id.localeCompare(b.id)).slice(0, 5)) {
        edges.add(edge.id); nodes.add(edge.from); nodes.add(edge.to); }
      else if (highlight === "thoughts") for (const id of companions?.byTheme.keys() || []) nodes.add(id);
      else if (highlight === "start") {
        for (const area of companions?.start?.areas || []) nodes.add(area.id);
        // Further names arrive as wording only; light the displayed themes that carry them.
        const named = new Set((companions?.start?.more || []).flatMap(group => group[1]));
        for (const area of companions?.start?.areas || []) for (const word of area.also) named.add(word);
        for (const node of graph.nodes) if (named.has(node.label)) nodes.add(node.id);
      }
      return {nodes, edges};
    }
    function renderHighlights() {
      const usable = Boolean(view && layout && !layout.cloudOverview && current(view.owner));
      const has = {thoughts: usable && view.companions?.byTheme.size > 0, start: usable && Boolean(view.companions?.start)};
      if (highlight && (!usable || has[highlight] === false)) highlight = null;
      for (const name of HIGHLIGHTS) {
        const control = $("highlight-" + name); if (!control) continue;
        control.disabled = !usable; control.setAttribute("aria-pressed", String(highlight === name));
        if (name in has) control.hidden = !has[name];
      }
      $("canvas")?.setAttribute("data-highlight", highlight || "none");
    }
    const THOUGHT_WORDS = {interest: "Interest", inquiry: "Question", perspective: "View", encounter: "Example", reflection: "Reflection"};
    function thoughtButton(thought, guard) {
      const b = button("", guard(() => openThought(thought.id)), "map-pattern-item map-thought-item");
      b.append(el("strong", "", THOUGHT_WORDS[thought.kind] + (thought.needs_review ? " · held back for review" : thought.state === "parked" ? " · parked" : "")),
        el("span", "map-thought-title", thought.title));
      b.setAttribute("aria-label", `PCS ${THOUGHT_WORDS[thought.kind].toLowerCase()}: ${thought.title}. Open in PCS Perspective.`);
      return b;
    }
    // What the startup packets would name now, from both maps. Names and
    // counts only; whether they are sent depends on the conversation's settings.
    function renderStartPanel() {
      const host = $("inspector"), original = view, start = view.companions.start, graph = presentationGraph();
      const guard = callback => () => { if (view === original && current(original.owner) && onPage()) callback(); };
      host.replaceChildren(el("div", "eyebrow", "WHEN A CONVERSATION STARTS"), el("h3", "", "What PCS can be told"),
        el("p", "map-muted", "A short version of both maps, so PCS knows what it can look up. It carries names and counts, not your saved wording, and PCS must search before relying on a detail. It is sent only while Help notice relevant memories is on and the connection has room for it. Local sees the area names when it decides whether to search."));
      const areas = el("section", "map-pattern-section"); areas.append(el("h4", "", "From your map"));
      for (const area of start.areas) {
        const shown = graph.nodeMap.has(area.id), b = button("", guard(() => { if (shown) void choose({kind: "theme", id: area.id}); }), "map-pattern-item");
        b.disabled = !shown;
        b.append(el("strong", "", area.label), el("span", "map-muted", `${area.records} ${area.records === 1 ? "record" : "records"}`
          + (area.also.length ? " · also worded: " + area.also.join(", ") : "") + (shown ? "" : " · not in this map view")));
        areas.append(b);
      }
      areas.append(el("p", "map-muted", start.areas.length
        ? `${start.areas.length} of up to 24 areas with counts, read from ${start.scanned} of ${start.total} memories. Dimmed themes are saved but not named; PCS can still find them by searching.`
        : "No saved area is named yet. An area needs wording that recurs across current memories."));
      const thoughts = el("section", "map-pattern-section map-thoughts"), byId = new Map(view.companions.thoughts.map(thought => [thought.id, thought]));
      thoughts.append(el("h4", "", "From PCS's map"));
      const sent = start.frontier.map(id => byId.get(id)).filter(Boolean);
      for (const thought of sent) thoughts.append(thoughtButton(thought, guard));
      thoughts.append(el("p", "map-muted", sent.length
        ? "PCS's open questions and latest views, by title. Parked, retired and held-back thoughts are left out."
        : "Nothing from PCS Perspective would be sent: it is off, or it holds no open question or current view."));
      const further = start.more.reduce((sum, group) => sum + group[1].length, 0);
      if (!further) { host.append(areas, thoughts); return; }
      const also = el("section", "map-pattern-section"); also.append(el("h4", "", "Also named"));
      for (const [key, names] of start.more) also.append(el("p", "map-start-names", (key ? `With ${key}: ` : "On their own: ") + names.join(", ")));
      also.append(el("p", "map-muted", `${further} further ${further === 1 ? "theme is" : "themes are"} named without counts`
        + (start.namesLeftOut ? `, and ${start.namesLeftOut} more did not fit` : "") + ". On a connection with less room these names are dropped first."));
      host.append(areas, also, thoughts);
    }
    function restingLinks(edges) {
      const hidden = new Set();
      if (layout?.mode !== "connections" || !(layout.membership instanceof Map) || route) return hidden;
      const parent = new Map(), find = id => { let top = id; while (parent.has(top)) top = parent.get(top); return top; };
      const inside = edges.filter(edge => layout.membership.get(edge.from) === layout.membership.get(edge.to));
      for (const edge of [...inside].sort((a, b) => count(b) - count(a) || a.id.localeCompare(b.id))) {
        const a = find(edge.from), b = find(edge.to);
        if (a !== b) parent.set(a, b);
        else if (!connectionNotes.has(edge.id)) hidden.add(edge.id);
      }
      return hidden;
    }
    function draw() {
      if (!view || !layout) return;
      fitBounds = null;
      const renderedView = view;
      cancelDragPaint(); renderedNodes.clear(); incidentLines.clear();
      const visible = visibleIds(), scene = $("scene");
      const edges = renderedEdges(visible), lineStyle = dottedConnections(countedEdges(edges), mapDottedPercent());
      $("canvas").setAttribute("data-density", edges.length > 160 ? "dense" : "normal");
      $("canvas").setAttribute("data-layout", layoutMode);
      const resting = layout.cloudOverview ? new Set() : restingLinks(edges);
      restingCount = resting.size;
      $("canvas").setAttribute("data-selection", selected || route ? "active" : "none");
      // Clear a highlight this view can no longer show before anything is dimmed for it.
      if (highlight === "thoughts" && !(view.companions?.byTheme.size > 0) || highlight === "start" && !view.companions?.start) highlight = null;
      const lit = highlighted();
      const mapDay = dayNumber(view.timeline?.today) ?? Math.floor(Date.now() / 86400000);
      const focusedNode = document.activeElement?.getAttribute?.("data-map-node");
      const focusedEdge = document.activeElement?.getAttribute?.("data-map-link");
      scene.replaceChildren(); labelEntries = []; labelScale = null;
      if(layout.cloudOverview){drawConstellations(scene);return;}
      for(const heading of layout.groupHeadings || []) {
        const label=svgEl("text",{x:heading.x,y:heading.y,class:"map-constellation-heading","text-anchor":"middle"});
        (heading.lines || [heading.label]).forEach((line,i)=>label.append(svgEl("tspan",{x:heading.x,dy:i?20:0},line)));scene.append(label);
      }
      for(const bucket of layout.dateBuckets || [])scene.append(svgEl("text",{x:bucket.x,y:bucket.y,class:"map-date-bucket","text-anchor":"middle"},bucket.label+" · "+bucket.count));
      const selectionEdge = selected?.kind === "connection" && view.edgeMap.get(selected.id);
      const selectedNodes = new Set(selected?.kind === "theme" ? [selected.id] : selectionEdge ? [selectionEdge.from, selectionEdge.to] : []);
      const emphasized = new Set(selectedNodes);
      for (const e of view.edges) if (selectedNodes.has(e.from) || selectedNodes.has(e.to)) { emphasized.add(e.from); emphasized.add(e.to); }
      // A crossing link's generous invisible hit stroke must never cover a
      // visible count. Keep all count targets above link strokes, below nodes.
      const badgeLayer=svgEl("g",{class:"map-edge-badges"});
      for (const edge of edges) {
        const a = layout.positions.get(edge.from), b = layout.positions.get(edge.to);
        const related = !selected || selectedNodes.has(edge.from) || selectedNodes.has(edge.to);
        const tone = selected?.kind === "theme" && related ? view.nodeMap.get(selected.id).group : view.nodeMap.get(edge.from).group;
        const g = svgEl("g", {class: "map-edge map-group-" + (tone % 6) + (selected && related ? " connected" : "")
          + (resting.has(edge.id) && !lit?.edges.has(edge.id) ? " map-edge-rest" : "")
          + (lit?.edges.has(edge.id) ? " map-edge-strong" : lit && !(lit.nodes.has(edge.from) && lit.nodes.has(edge.to)) ? " map-dim" : "")
          + (selected?.id === edge.id ? " selected" : "")
          + (connectionNotes.has(edge.id) ? " has-landmark" : "")
          + (selectionEdge?.id === edge.id && selectedNodes.has(edge.from) && selectedNodes.has(edge.to) && !route ? " focused-connection" : "")
          + (route?.edges.includes(edge.id) || layoutMode === "compare" && compareRoute?.edges.includes(edge.id) ? " route" : "") + (related || route ? "" : " muted"),
          role: "button", tabindex: selected && related ? "0" : "-1", "aria-label": `${view.nodeMap.get(edge.from).label} and ${view.nodeMap.get(edge.to).label}: ${recordsText(edge.support_count, edge, "shared records")}.${uniqueCounts?` ${count(edge)} distinct content-and-provenance groups.`:""} Select to inspect.`,
          "data-map-link": edge.id,"data-has-landmark":connectionNotes.has(edge.id)});
        const amount=count(edge),curve=connectionCurve(edge,layout.positions), attrs = {d:curve.path,fill:"none"}, strength = connectionStyle(amount, layoutMode);
        g.style.setProperty("--map-link-opacity", String(strength.opacity)); // CSSOM: no inline style attribute under CSP
        g.setAttribute("data-shared-records", edge.support_count);
        const hit = svgEl("path", {...attrs, class: "map-edge-hit"}),
          line = svgEl("path", {...attrs, class: "map-edge-line", "stroke-width": strength.width, "stroke-dasharray": amount <= lineStyle.cutoff ? "4 5" : ""});
        const badge=svgEl("g",{class:"map-edge-badge map-group-"+(tone%6)+(resting.has(edge.id) && !lit?.edges.has(edge.id)?" map-edge-rest":""),transform:`translate(${curve.badge.x},${curve.badge.y})`,
          "data-map-badge":edge.id,"data-revealed":Boolean(selected && related || lit?.edges.has(edge.id)),"data-landmark":connectionNotes.has(edge.id),"aria-hidden":"true"});
        const badgeWidth=Math.max(18,String(amount).length*7+10);
        badge.append(svgEl("rect",{x:-badgeWidth/2,y:-10,width:badgeWidth,height:20,rx:10}),
          svgEl("text",{"text-anchor":"middle",y:3.5},amount));
        if(connectionNotes.has(edge.id))badge.append(svgEl("text",{x:badgeWidth/2+5,y:4,class:"map-landmark-symbol"},"◇"));
        g.append(svgEl("title", {}, edge.label + ". Select to inspect the shared records."+(connectionNotes.has(edge.id)?" Your note: "+noteTitle(connectionNotes.get(edge.id)):"")), hit, line);
        // A small travelling mark on the chosen theme's links. Decorative.
        const pulse = selected && related && !route ? svgEl("path", {...attrs, class: "map-edge-pulse", "aria-hidden": "true"}) : null;
        if (pulse) g.append(pulse);
        badgeLayer.append(badge);
        for (const id of [edge.from,edge.to]) {
          if (!incidentLines.has(id)) incidentLines.set(id, []);
          incidentLines.get(id).push({edge, g, hit, line, badge, pulse, supportCount: amount});
        }
        const inspectConnection=()=>{if(!clickSuppressed)choose({kind:"connection",id:edge.id});};
        g.addEventListener("click", inspectConnection);badge.addEventListener("click",inspectConnection);
        for(const [event,attribute,value] of [["pointerenter","data-hovered",true],["pointerleave","data-hovered",false],
          ["focus","data-focused",true],["blur","data-focused",false]])g.addEventListener(event,()=>badge.setAttribute(attribute,value));
        g.addEventListener("keydown", e => {if(e.key==="Enter" || e.key===" "){e.preventDefault();choose({kind:"connection",id:edge.id});}});
        scene.append(g);
        if(focusedEdge===edge.id) g.focus?.({preventScroll:true});
      }
      const bundleBadges = drawBundles(scene, visible, badgeLayer);
      if(edges.length || bundleBadges)scene.append(badgeLayer);
      for (const node of view.nodes) {
        if (!visible.has(node.id)) continue;
        const p = layout.positions.get(node.id), pressed = selectedNodes.has(node.id);
        if (!p) continue;
        const g = svgEl("g", {class: "map-node map-group-" + (node.group % 6) + (pressed ? " selected" : "")
          + (pressed && !route ? " focused" : "")
          + (layoutMode === "focus" && node.id === focusCenter && !route ? " focus-anchor" : "")
          + (pins.includes(node.id) ? " pinned" : "") + (selected && !route && !emphasized.has(node.id) ? " muted" : "")
          + (lit && !pressed && !lit.nodes.has(node.id) ? " map-dim" : ""),
          transform: `translate(${p.x},${p.y})`, tabindex: "0", role: "button", "aria-pressed": String(pressed),
          "aria-label": `${node.label}, ${recordsText(node.support_count, node, "supporting records")}.${uniqueCounts?` ${count(node)} distinct content-and-provenance groups.`:""} Inspect theme.`, "data-map-node": node.id});
        if ((view.companions?.byTheme.get(node.id)?.length || 0) > 0) g.setAttribute("aria-label", g.getAttribute("aria-label") + " PCS has saved thoughts resting here.");
        // Brightness follows the last save of a supporting record, counted from
        // the map's current UTC day. It is not importance or confidence.
        const savedAt = Date.parse(node.last_saved), age = Number.isFinite(savedAt) ? Math.max(0, mapDay - Math.floor(savedAt / 86400000)) : null;
        g.setAttribute("data-recency", age === null ? "undated" : age <= 45 ? "fresh" : age >= 120 ? "quiet" : "recent");
        g.style?.setProperty?.("--map-recency", age === null ? "0.5" : Math.max(0, 1 - age / 365).toFixed(2)); // CSSOM: no inline style attribute under CSP
        g.append(svgEl("title", {}, `${node.label}\n${node.summary}\nLast saved: ${date(node.last_saved)}\n${node.sample}`),
          // Keep the same generous circular pointer target when the visible
          // silhouette changes. Identity, drag ownership and keyboard stay on g.
          svgEl("circle", {r: p.radius + 14, class: "map-node-hit", "aria-hidden": "true"}));
        if (pressed) {
          g.append(brandStar(p.radius + 17, "map-node-halo map-node-star-halo"),
            brandStar(p.radius + 13, "map-node-ring map-node-star-ring"),
            brandStar(p.radius + 9, "map-node-star"));
        } else {
          g.append(svgEl("circle", {r: p.radius + 14, class: "map-node-halo"}),
            svgEl("circle", {r: p.radius + 5, class: "map-node-ring"}),
            svgEl("circle", {r: p.radius, class: "map-node-dot"}));
        }
        g.append(svgEl("text", {class: "map-node-count", "text-anchor": "middle", y: 4}, count(node)));
        // A small amber PCS star: PCS's own saved thoughts rest on a record behind this theme.
        const thoughtsHere = view.companions?.byTheme.get(node.id)?.length || 0;
        if (thoughtsHere) {
          const mark = svgEl("g", {class: "map-node-thoughts", "aria-hidden": "true", transform: `translate(${p.radius + 9},${-p.radius - 8})`});
          mark.append(brandStar(7, "map-node-thought-star"), svgEl("text", {class: "map-node-thought-count", x: 9, y: 4}, thoughtsHere));
          g.append(mark);
        }
        const label = svgEl("text", {class: "map-node-label", "text-anchor": "middle", y: p.radius + (pressed ? 30 : 19)});
        const lines = wrapLabel(node.label);
        lines.forEach((line, i) => label.append(svgEl("tspan", {x: 0, dy: i ? "1.15em" : 0}, line)));
        g.append(label);
        const anchored = pressed || layoutMode === "focus" && node.id === focusCenter || compareAnchors.includes(node.id) && layoutMode === "compare";
        labelEntries.push({id: node.id, label, pressed, lines: lines.length, always: anchored,
          width: Math.max(...lines.map(line => Array.from(line).length)) * 7.8 + 4,
          priority: (anchored ? 1e9 : 0) + (route?.nodes.includes(node.id) || compareRoute?.nodes.includes(node.id) ? 1e8 : 0) + count(node)});
        g.addEventListener("click", () => { if (view === renderedView && !clickSuppressed) choose({kind: "theme", id: node.id}); });
        g.addEventListener("keydown", e => {
          if (view === renderedView && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); choose({kind: "theme", id: node.id}); }
        });
        const peek = shown => { for (const entry of incidentLines.get(node.id) || []) entry.g.setAttribute("data-peek", String(shown)); };
        for(const event of ["pointerenter","focus"])g.addEventListener(event,()=>{if(view===renderedView && current(view.owner)){activeLabel=node.id;positionActiveLabel();peek(true);}});
        for(const event of ["pointerleave","blur"])g.addEventListener(event,()=>{peek(false);if(activeLabel===node.id){activeLabel=null;positionActiveLabel();}});
        scene.append(g);
        renderedNodes.set(node.id, g);
        if (focusedNode === node.id) g.focus?.({preventScroll: true});
      }
      applyBox();
      updateMapLegend(lineStyle);
      renderHighlights();
    }
    function cancelDragPaint() {
      const pending = dragFrame; dragFrame = null;
      if (pending && environment.cancelAnimationFrame) environment.cancelAnimationFrame(pending.handle);
    }
    function paintMovedTheme(id) {
      fitBounds = null;
      const point = layout?.positions.get(id), element = renderedNodes.get(id);
      if (!point || !element) return;
      element.setAttribute("transform", `translate(${point.x},${point.y})`);
      // Routes avoid all displayed nodes, so moving even an unrelated node can
      // change a curve. Repaint each bounded rendered edge once in this frame.
      const repainted=new Set();
      for (const entries of incidentLines.values()) for(const {edge,hit,line,badge,pulse} of entries) {
        if(repainted.has(edge.id))continue;
        repainted.add(edge.id);
        const curve=connectionCurve(edge,layout.positions);
        hit.setAttribute("d",curve.path);line.setAttribute("d",curve.path);pulse?.setAttribute("d",curve.path);
        badge.setAttribute("transform",`translate(${curve.badge.x},${curve.badge.y})`);
      }
    }
    function scheduleDragPaint() {
      if (dragFrame || !dragged?.id) return;
      if (!environment.requestAnimationFrame) { paintMovedTheme(dragged.id); return; }
      const pending = {drag: dragged, view, layout}; dragFrame = pending;
      pending.handle = environment.requestAnimationFrame(() => {
        if (dragFrame !== pending) return;
        dragFrame = null;
        if (dragged === pending.drag && view === pending.view && layout === pending.layout && current(view?.owner) && onPage())
          paintMovedTheme(dragged.id);
      });
    }
    function renderList() {
      $("list").replaceChildren(); if (!view) return;
      const renderedView = view;
      if(layout?.cloudOverview){for(const cluster of clustering.clusters)$("list").append(button(`${cluster.label} · ${themeCount(cluster.count)}`,()=>{if(view===renderedView)openConstellation(cluster.anchor);},"map-list-item"));return;}
      const visible = visibleIds(true);
      const nodes=uniqueCounts||view.nodes.some(observed)?[...view.nodes].sort((a,b)=>count(b)-count(a)):view.nodes;
      for (const n of nodes) if (visible.has(n.id)) {
        const b = button("", () => { if (view === renderedView) choose({kind: "theme", id: n.id}); }, "map-list-item map-group-" + (n.group % 6));
        b.setAttribute("aria-pressed", String(selected?.id === n.id));
        b.append(el("strong", "", n.label), el("span", "map-muted", `${recordsText(n.support_count, n)}${uniqueCounts?` · ${count(n)} distinct content groups`:""} · last saved ${date(n.last_saved)}`));
        $("list").append(b);
      }
    }
    function renderPins() {
      $("pins").replaceChildren();
      // 0.9.118 retires pinning as a tool. An older saved view can still bring
      // pins back; they show here with Clear pins until cleared.
      if ($("pins-row")) $("pins-row").hidden = !view || !pins.length;
      if (!view || !pins.length) return;
      $("pins").append(el("span", "eyebrow", "PINNED"));
      for (const id of pins) $("pins").append(button(view.nodeMap.get(id).label + " ×", () => togglePin(id), "chip-button"));
      $("pins").append(el("span", "map-muted", "Showing pinned neighborhoods and the current selection, not a claim they are equivalent."));
    }
    function togglePin(id) {
      route = null; renderPath();
      if (!view || !current(view.owner) || !view.nodeMap.has(id)) return;
      if (pins.includes(id)) pins = pins.filter(p => p !== id);
      else if (pins.length < 3) pins = [...pins, id];
      renderPins(); refreshFocusContext(); renderList(); renderInspector();
    }
    async function choose(selection, offset = 0, recordHistory = true, recenterFocus = true) {
      if (!view || !current(view.owner) || !onPage()) return;
      const graph=presentationGraph(), item = selection.kind === "theme" ? graph.nodeMap.get(selection.id) : graph.edgeMap.get(selection.id);
      if (!item) return;
      clearToast();
      // A searched theme can join the visible focus without discarding pins.
      // This permits comparisons between initially separate clusters.
      const sameSelection = selected?.kind === selection.kind && selected?.id === selection.id;
      // Explicit theme navigation follows that theme's neighborhood. Restored
      // history and inspector paging retain their own center and viewport.
      const moveFocus = recenterFocus && recordHistory && layoutMode === "focus"
        && selection.kind === "theme" && focusCenter !== selection.id;
      if (recordHistory && navigating) {navigationJob=null;navigating=false;}
      // 0.9.118: choosing a theme in Constellations follows it into Focus. The
      // constellation step stays in Back history; the saved layout is unchanged.
      const followFromGroups = recenterFocus && recordHistory && layoutMode === "groups" && selection.kind === "theme";
      if (recordHistory && (!sameSelection || moveFocus || followFromGroups)) rememberTrail();
      if (!sameSelection) chosenRecords.clear();
      if (!sameSelection) inspectorTab = "overview";
      else if (offset !== 0) inspectorTab = "records";
      resetInspectorScroll = !sameSelection || offset !== (detail?.offset ?? 0);
      if (!sameSelection) compareChooser = null;
      selected = {...selection}; detail = null; detailBusy = true; errorText = "";
      const serial = operation, subserial = ++detailOperation, original = view;
      let movedCluster=false;
      if(followFromGroups){
        cancelDrag();layoutMode="focus";savedPositions=positionsByMode.get("focus") || new Map();
        focusCenter=selection.id;focusPage=0;clusterAnchor=null;route=null;movedCluster=true;relayout();renderV2();
      }
      else if(layoutMode==="groups"){
        if(selection.kind==="connection" && clustering.membership.get(item.from)!==clustering.membership.get(item.to)){
          layoutMode="connections";savedPositions=positionsByMode.get(layoutMode);movedCluster=true;
        }else{
          const anchor=selection.kind==="theme"?selection.id:item.from;
          if(layout.cloudOverview || clustering.membership.get(anchor)!==clustering.membership.get(clusterAnchor)){clusterAnchor=anchor;movedCluster=true;}
        }
        if(movedCluster){route=null;relayout();renderV2();}
      }
      if (moveFocus) {focusCenter = selection.id; focusPage=0; route = null; relayout(); renderV2();}
      else if(layoutMode === "focus" && (selection.kind === "theme" ? [selection.id] : [item.from,item.to])
        .some(id=>layout.neighborhoodIds?.includes(id) && !layout.positions.has(id)))relayout();
      else if(!movedCluster)draw();
      renderList(); renderInspector();
      update();
      try {
        const result = await request("/api/continuity-map/inspect", {...view.filters, snapshot: view.snapshot, selection, offset}, view.owner, serial,
          () => subserial === detailOperation && view === original);
        if (subserial !== detailOperation || view !== original) return;
        detail = checkedDetail(result, original, selection);
      } catch (error) {
        if (serial !== operation || subserial !== detailOperation || !current(original.owner)) return;
        // Do not keep old private evidence on screen after an uncertain or
        // stale read; a fresh graph is needed, not a silent retry with new IDs.
        invalidate(error.message + " Refresh the map before continuing."); return;
      } finally {
        if (serial === operation && subserial === detailOperation) { detailBusy = false; renderInspector(); update(); }
      }
    }
    function renderInspector() {
      if (!view || !selected) { emptyDetail(); return; }
      const host = $("inspector"), previousScroll = host._scrollBody?.scrollTop || 0;
      const inspectorView=view, inspectorSelection={...selected}, activeInspection=()=>view===inspectorView && current(inspectorView.owner)
        && selected?.kind===inspectorSelection.kind && selected?.id===inspectorSelection.id && onPage();
      const activeElement = document.activeElement;
      const noteFocus=activeElement?.getAttribute?.("data-map-note"),noteCursor=[activeElement?.selectionStart,activeElement?.selectionEnd];let noteEditor=null;
      const focusedAction = activeElement?.getAttribute?.("data-map-inspector-action");
      host.replaceChildren();
      const isTheme = selected.kind === "theme", item = isTheme ? view.nodeMap.get(selected.id) : view.edgeMap.get(selected.id);
      if (!item) { emptyDetail(); return; }
      const actionControls = new Map();
      const action = (key, label, callback, cls = "button secondary") => {
        const control = button(label, () => { if (activeInspection()) callback(); }, cls);
        control.setAttribute("data-map-inspector-action", key); actionControls.set(key, control); return control;
      };
      // One scrolling panel: title and actions stay put; saved words come first.
      const header = el("header", "map-inspector-header"), body = el("div", "map-inspector-body");
      body.id = "map-inspector-panel-overview"; host._scrollBody = body;
      const graph = presentationGraph();
      const links = isTheme ? graph.edges.filter(e => e.from === item.id || e.to === item.id) : [];
      if (isTheme) {
        header.append(el("div", "eyebrow", item.basis === "saved_label" ? "SAVED LABEL" : "RECURRING WORDING"));
        const heading = el("div", "map-inspector-heading map-group-" + (item.group % 6));
        const badge = svgEl("svg", {class: "map-inspector-star", viewBox: "-40 -40 80 80", "aria-hidden": "true", focusable: "false"});
        badge.append(brandStar(35, "map-node-star"), svgEl("text", {class: "map-node-count", "text-anchor": "middle", y: 5}, observations(item)));
        const title = el("div", "map-inspector-title");
        title.append(el("h3", "", item.label), el("p", "map-muted", `${recordsText(item.support_count, item, "current records")} · ${links.length} map connections · last saved ${date(item.last_saved)}`));
        if (item.monthly_counts) {
          const months = el("div", "map-months"); months.append(sparkline(item.monthly_counts, "map-sparkline map-sparkline-wide"), el("span", "map-muted", monthsSummary(item.monthly_counts)));
          title.append(months);
        }
        heading.append(badge, title); header.append(heading);
      } else {
        const a = view.nodeMap.get(item.from), b = view.nodeMap.get(item.to);
        header.append(el("div", "eyebrow", "WHY CONNECTED?"), el("h3", "", a.label + " ↔ " + b.label),
          el("p", "map-connection-label", `Both appear in ${item.support_count} saved ${item.support_count === 1 ? "record" : "records"}. What the link means is yours to decide.`));
      }
      const controls = el("div", "map-inspector-actions");
      const evidence = el("section", "map-evidence");
      evidence.id = "map-inspector-records";
      const reviewRecords = async () => {
        if (!reviewSelection || !activeInspection() || !detail || !chosenRecords.size) return;
        const bound=view.owner, selection={...selected};
        const inspectionOperation=detailOperation;
        const records=[...chosenRecords.values()], recordSignature=JSON.stringify(records);
        const stillChosen=()=>activeInspection() && detailOperation===inspectionOperation && JSON.stringify([...chosenRecords.values()])===recordSignature;
        const body={origin:"map",...view.filters,snapshot:view.snapshot,map_selection:selection,selection:records};
        try {
          if(fullscreen?.active())await fullscreen.exit({restoreFocus:false});
          if(!stillChosen())return;
          await reviewSelection(body,stillChosen);
        }
        catch(error) {if (current(bound) && onPage()) $("status").textContent=error.message;}
      };
      const chooseRecords = () => {
        if (!detail) return;
        const first=evidence.querySelector?.(".map-record");if(first){first.open=true;const group=first.closest?.(".map-evidence-group");if(group)group.open=true;}
        evidence.scrollIntoView?.({block:"start"});
        evidence.querySelector?.('input[type="checkbox"]')?.focus?.({preventScroll:true});
      };
      const continueLabel = () => chosenRecords.size ? `Review ${chosenRecords.size} chosen for Conversation` : "Continue in Conversation";
      const continuing = action("continue", continueLabel(), () => chosenRecords.size ? reviewRecords() : chooseRecords(), "button primary");
      continuing.disabled = !detail || detailBusy || !reviewSelection;
      controls.append(continuing);
      if (isTheme) {
        if (layoutMode !== "focus" || focusCenter !== item.id) controls.append(action("follow", "Follow in Focus", () => followTheme(item.id)));
        controls.append(action("compare", compareChooser === item.id ? "Cancel compare" : "Compare with…", () => {
          compareChooser = compareChooser === item.id ? null : item.id; renderInspector();
          if (compareChooser) document.getElementById("map-compare-with")?.focus?.({preventScroll:true});
        }));
      } else {
        const a = view.nodeMap.get(item.from), b = view.nodeMap.get(item.to);
        for (const n of [a, b]) controls.append(action("explore:" + n.id, "Explore " + n.label, () => followTheme(n.id), "text-button"));
      }
      const more = el("details", "map-more");
      more.append(el("summary", "", "More"));
      const moreItems = el("div", "map-more-items");
      if (isTheme) moreItems.append(preferenceButton("Hide theme",()=>{if(activeInspection())setHidden("theme",item.id,true);}));
      else moreItems.append(preferenceButton("Hide connection",()=>{if(activeInspection())setHidden("connection",item.id,true);}),
        button("Compare these themes",()=>{if(activeInspection())startCompare(item.from,item.to);}));
      more.append(moreItems); controls.append(more);
      header.append(controls);
      if (isTheme && compareChooser === item.id) {
        const chooser = el("div", "map-compare-chooser"), label = el("label", "", `Compare ${item.label} with`), select = el("select");
        select.id = "map-compare-with"; label.setAttribute("for", select.id);
        const empty = el("option", "", "Choose a theme…"); empty.value = ""; select.append(empty);
        for (const node of [...graph.nodes].filter(node => node.id !== item.id).sort((x, y) => x.label.localeCompare(y.label) || x.id.localeCompare(y.id))) {
          const option = el("option", "", node.label); option.value = node.id; select.append(option);
        }
        const go = action("compare-go", "Compare", () => { if (select.value) startCompare(item.id, select.value); });
        go.disabled = true; select.addEventListener("change", () => { go.disabled = !select.value; });
        chooser.append(label, select, go, el("small", "map-muted", "Shows the shortest route through shared records and the themes both connect to."));
        header.append(chooser);
      }
      if (detailBusy) { const loading = el("p", "map-muted", "Checking current revisions and sources…"); loading.setAttribute("role", "status"); loading.setAttribute("aria-live", "polite"); body.append(loading); }
      if (errorText) body.append(el("p", "map-note", errorText));
      if (detail) {
        const stillInspected = activeInspection;
        const matchPreview=el("section","map-match-evidence");matchPreview.append(el("h4","","What you saved"));
        for (const record of detail.records.slice(0,3)) {
          const contexts=record.match_contexts || [];
          if (!contexts.length) continue;
          const preview=el("div","map-match-record");preview.append(el("strong","",record.title),el("small","map-muted",record.origin));
          for (const context of contexts) {
            preview.append(el("small","map-muted",(context.basis==="saved_label"?"Saved topic label":"Recurring wording")+" · "+context.label));
            const quote=el("blockquote","map-match-text");let start=0;
            if (context.truncated_before) quote.append(el("span","","…"));
            for (const span of context.spans) {quote.append(el("span","",context.text.slice(start,span.start)),el("mark","",context.text.slice(span.start,span.end)));start=span.end;}
            quote.append(el("span","",context.text.slice(start)));if (context.truncated_after) quote.append(el("span","","…"));
            preview.append(quote);
          }
          matchPreview.append(preview);
        }
        if (matchPreview.children.length>1) body.append(matchPreview);
        if (item.distinct_cited_passage_count!==undefined) body.append(el("p","map-provenance",
          `${item.support_count} saved records · ${item.distinct_cited_passage_count} distinct cited passage${item.distinct_cited_passage_count===1?"":"s"}. `
          +(item.records_without_cited_passages?`${item.records_without_cited_passages} records have unknown passage provenance. `:"")
          +"Passage counts do not establish independent conversations or independent evidence."));
        if(item.evidence_group_count!==undefined && item.evidence_group_count<item.support_count)body.append(el("p","map-muted",
          `${item.evidence_group_count} distinct current content-and-provenance groups among these records. Identical saved content is grouped below; this does not establish independent evidence.`));
        const recordsHandoff=button("Review selected records for Conversation",reviewRecords,"button secondary");
        recordsHandoff.disabled=!reviewSelection || !chosenRecords.size;
        const selectionCount=el("p","map-muted",`${chosenRecords.size} of 3 records chosen for review.`);
        selectionCount.setAttribute("role","status");selectionCount.setAttribute("aria-live","polite");
        evidence.append(el("h4","",`Records (${detail.total})`),
          el("p","map-muted","Choose up to three records to carry into an editable Conversation draft. Sending remains a separate action."),
          selectionCount,el("p", "map-muted", `${detail.offset + 1}–${detail.offset + detail.records.length} of ${detail.total}. Source excerpts are limited; Inspect opens the full saved record.`));
        const groups=new Map();
        for (const record of detail.records) {
          const article = el("details", "map-record");
          const summary = el("summary", "map-record-summary");
          const preview = el("span", "map-record-preview", record.excerpt);
          preview.setAttribute("aria-hidden", "true");
          summary.append(el("span", "map-record-meta", `${record.kind === "memory" ? "Memory" : "Notebook"} · revision ${record.revision} · ${date(record.updated_at)}`),
            el("span", "map-record-title", record.title), preview);
          article.append(summary);
          const full = el("div", "map-record-full");
          full.append(el("p", "map-record-text", record.excerpt), el("small", "map-muted", record.origin));
          const choice=el("label","check-row"), checkbox=el("input");checkbox.type="checkbox";checkbox.checked=chosenRecords.has(record.kind+":"+record.id);
          checkbox.setAttribute("aria-label","Include "+record.title+" in Conversation review");
          checkbox.addEventListener("change",()=>{
            if (!stillInspected()) return;
            const key=record.kind+":"+record.id;
            if (!checkbox.checked) chosenRecords.delete(key);
            else if (chosenRecords.size<3) chosenRecords.set(key,ref(record));else checkbox.checked=false;
            recordsHandoff.disabled=!reviewSelection || !chosenRecords.size;
            continuing.textContent=continueLabel();
            selectionCount.textContent=`${chosenRecords.size} of 3 records chosen for review.`;
          });
          choice.append(checkbox,el("span","","Include in Conversation review"));full.append(choice);
          if (record.source_count!==undefined) full.append(el("small","map-muted",`${record.source_count} cited passages; ${record.source_previews.length} previews shown.`
            +(record.unavailable_source_count?` ${record.unavailable_source_count} unavailable sources.`:"")+(record.citation_status==="unknown"?" Passage provenance is unknown.":"")));
          if (record.source_previews.length) {
            const sourceDetails = el("details", "map-sources"); sourceDetails.append(el("summary", "", `Original source excerpts (${record.source_previews.length} shown)`));
            for (const source of record.source_previews) {
              sourceDetails.append(sourceEvidence({document, source, truncated: source.truncated, excerpt: true, current: stillInspected}),
                el("small", "map-muted", "Saved " + date(source.created_at)));
            }
            full.append(sourceDetails);
          } else full.append(el("small", "map-muted", "No original passage preview in this view. Inspect for available references."));
          const bound = view.owner;
          full.append(button("Inspect saved " + (record.kind === "memory" ? "memory" : "notebook") + " ↗", async () => {
            if (view && current(bound) && onPage()) {
              try { await fullscreen?.exit(); if (view && current(bound) && onPage()) await inspect(ref(record)); } catch (error) { if (current(bound)) $("status").textContent = error.message; }
            }
          }));
          article.append(full);
          if (record.evidence_group_id && record.evidence_group_size>1) {
            let group=groups.get(record.evidence_group_id);
            if (!group) {const shown=detail.records.filter(item=>item.evidence_group_id===record.evidence_group_id).length;
              group=el("details","map-evidence-group");group.append(el("summary","",`${record.evidence_group_size} saved records with identical current content and provenance · ${shown} shown on this page`));
              if(shown<record.evidence_group_size)group.append(el("p","map-muted","Other members are on other record pages. Use Previous/Next records to inspect them individually."));
              groups.set(record.evidence_group_id,group);evidence.append(group);}
            group.append(article);
          } else evidence.append(article);
        }
        const pager = el("div", "map-inspector-actions");
        if (detail.offset > 0) pager.append(button("Previous records", () => choose(selected, Math.max(0, detail.offset - 12), true, false)));
        if (detail.next_offset !== null) pager.append(button("Next records", () => choose(selected, detail.next_offset, true, false)));
        evidence.append(pager,recordsHandoff);
      }
      if(!isTheme){
        const section=el("details","map-owner-note"),label=el("label","","Owner-written note · use the first line as its title"),input=el("textarea"),status=el("p","map-muted");noteEditor=input;
        input.id="map-connection-note";input.setAttribute("data-map-note",item.id);input.maxLength=2000;input.rows=4;
        input.placeholder="A title you will recognize later\nYour connection note…";
        input.value=noteDrafts.has(item.id)?noteDrafts.get(item.id):connectionNotes.get(item.id) || "";
        section.open=landmarkCompose===item.id || noteFocus===item.id || connectionNotes.has(item.id) || noteDrafts.has(item.id) && input.value!==(connectionNotes.get(item.id)||"");
        input.disabled=!layoutWritable();label.setAttribute("for",input.id);
        const noteStatus=()=>{status.textContent=input.value!==(connectionNotes.get(item.id)||"")?"Unsaved note retained for this connection on this page."
          :layoutRevision!==confirmedLayoutRevision?"Map save is not yet confirmed. Local note text is retained; Retry Map save is available."
          :"Owner-written context, separate from matching evidence. Not included in Conversation drafts.";};noteStatus();
        input.addEventListener("input",()=>{if(activeInspection()){noteDrafts.set(item.id,input.value);noteStatus();renderSavedNotes();draftChanged();}});
        const save=button("Save note",()=>{
          if(!activeInspection() || !layoutWritable())return;
          const value=input.value.trim()?input.value:"";
          if(value && !safeText(value,1000,true)){status.textContent="Use at most 1,000 characters without unsupported controls. Your unsaved text is retained.";return;}
          const previous=connectionNotes.get(item.id);
          if(value && !connectionNotes.has(item.id) && connectionNotes.size>=MAX_SAVED_ITEMS){status.textContent="250 connection notes are saved. Clear a saved note first; your draft is retained.";return;}
          if(value)connectionNotes.set(item.id,value);else connectionNotes.delete(item.id);
          if(!presentationFits(layoutPayload())){if(previous===undefined)connectionNotes.delete(item.id);else connectionNotes.set(item.id,previous);status.textContent="Map presentation has reached its 256 KB capacity. Your unsaved note is retained.";return;}
          if(landmarkCompose===item.id && value)pendingLandmark={id:item.id,text:value};
          noteDrafts.set(item.id,value);input.value=value;saveLayout();renderSavedNotes();noteStatus();
        }),clear=button("Clear note",()=>{if(activeInspection() && layoutWritable()){connectionNotes.delete(item.id);noteDrafts.delete(item.id);input.value="";saveLayout();renderSavedNotes();noteStatus();}});
        save.disabled=clear.disabled=!layoutWritable();
        section.append(el("summary","","Your connection note"),label,input,el("small","map-muted","The first line is your note title, including when the connection disappears. No theme wording is copied automatically. Up to 1,000 characters including title; 250 notes within the shared 256 KB encrypted Map capacity."),save,clear,status);
        if(landmarkCompose===item.id)section.append(el("p","map-landmark-guidance","Name this landmark in your own words. You could add what changed, what you want to try, or a question to revisit. Add a date yourself if useful. This saves your note; returning checks the current connection, not a historical source snapshot."));
        else {const landmark=button("Leave a landmark",()=>{if(activeInspection())composeLandmark(item.id);});landmark.disabled=!detail||detailBusy||!layoutWritable();section.append(landmark);}
        body.append(section);
      }
      body.append(evidence);
      if (isTheme) {
        const thoughtsHere = view.companions?.byTheme.get(item.id) || [];
        if (thoughtsHere.length) {
          const resting = el("section", "map-pattern-section map-thoughts"); resting.append(el("h4", "", "PCS's thoughts resting here"));
          for (const thought of thoughtsHere) resting.append(thoughtButton(thought, callback => () => { if (activeInspection()) callback(); }));
          resting.append(el("p", "map-muted", "PCS's own saved thoughts whose basis includes a record behind this theme. They are its appraisals, not facts about you."));
          body.append(resting);
        }
        const related = el("section", "map-related"); related.append(el("h4", "", "Connected themes"));
        if (!links.length) related.append(el("p", "map-muted", $("strong")?.checked
          ? "No links under the current filters. Turn off the 2+ records filter in Map settings to include single-record associations."
          : $("themes")?.value === "all" ? "No other displayed theme shares a saved record or observation with this one."
          : "No links under the current filters. In Map settings, Themes from → Labels and repeated wording adds names and wording that can connect themes."));
        const rows = el("div", "map-related-rows");
        for (const edge of [...links].sort((a, b) => count(b) - count(a) || a.id.localeCompare(b.id))) {
          const other = view.nodeMap.get(edge.from === item.id ? edge.to : edge.from), row = el("div", "map-related-row");
          const link = button("", () => choose({kind: "connection", id: edge.id}), "map-related-link map-group-" + (other.group % 6));
          link.append(el("span", "map-related-label", other.label), el("span", "map-related-count", ` · ${edge.support_count} shared records`));
          const follow = button("Follow", () => { if (activeInspection()) followTheme(other.id); }, "text-button map-related-follow");
          follow.setAttribute("aria-label", "Follow " + other.label + " in Focus");
          row.append(link, follow); rows.append(row);
        }
        related.append(rows); body.append(related);
        const basis = el("details", "map-theme-basis"); basis.append(el("summary", "", "How this theme was found"),
          el("p", "map-muted", item.basis === "saved_label" ? "This label occurs in a saved tags, themes, topics or interests field. Other records may share its wording. It is not an independently verified classification."
            : "PCS grouped this wording across current saved records. Similar wording can mean different things; check the records above."));
        body.append(basis);
      } else {
        const meaning = el("details", "map-theme-basis");
        meaning.append(el("summary", "", "What this connection means"),
          el("p", "map-muted", "Both labels occur in each supporting record. This does not prove causation, agreement, a dependency, or that the underlying memory is correct."), el("p","map-muted",item.label+"."));
        body.append(meaning);
      }
      host.append(header, body);
      if(noteFocus===item.id && noteEditor){noteEditor.focus?.({preventScroll:true});if(noteCursor.every(Number.isInteger))noteEditor.setSelectionRange?.(...noteCursor);}
      else if(focusedAction && actionControls.has(focusedAction))actionControls.get(focusedAction).focus?.({preventScroll:true});
      body.scrollTop = resetInspectorScroll ? 0 : previousScroll;
      // Record paging returns to the records rather than the top of the panel.
      if (resetInspectorScroll && inspectorTab === "records" && detail) evidence.scrollIntoView?.({block:"start"});
      resetInspectorScroll = false;
    }
    function center(id) {
      if (!layout || !box || !layout.positions.has(id)) return;
      const p = layout.positions.get(id); box.x = p.x - box.width / 2; box.y = p.y - box.height / 2; applyBox();
    }
    function find() {
      $("matches").replaceChildren(); if (!view || !current(view.owner)) return;
      const query=$("find").value.trim(), matches = findTheme(presentationGraph().nodes, query);
      const searchedView=view;
      if (!matches.length) {
        $("matches").append(el("span", "map-muted", "No matching theme in this bounded map. Saved records may still contain these words."),
          button("Use these words as saved-word scope",()=>{if (view!==searchedView || !current(searchedView.owner) || !onPage()) return;$("query").value=query;refresh();},"chip-button"));
        if (searchLibrary) $("matches").append(button("Search saved records in Library",()=>{if (view===searchedView && current(searchedView.owner) && onPage()) searchLibrary(query);},"chip-button"));
        return;
      }
      route = null; renderPath(); focusOnly = false; renderPins();
      const reveal=n=>{
        if(view!==searchedView || !current(searchedView.owner) || !onPage())return;
        if (layoutMode==="compare" && !layout?.positions.has(n.id)) {focusOnly=false;renderPins();followTheme(n.id);return;}
        focusOnly=false;renderPins();choose({kind:"theme",id:n.id});center(n.id);
      };
      for (const n of matches.slice(0, 6)) $("matches").append(button(n.label,()=>reveal(n),"chip-button"));
      reveal(matches[0]);
    }
    function zoom(factor, deferred = false) {
      if (!box || !layout) return;
      const viewportWidth=layout.viewportWidth || layout.width, viewportHeight=layout.viewportHeight || layout.height;
      const ratio = clamp(box.width * factor / viewportWidth, .35, Math.max(2.5,fittedBox().width/viewportWidth*1.5)), w = viewportWidth * ratio, h = viewportHeight * ratio;
      box.x += (box.width - w) / 2; box.y += (box.height - h) / 2; box.width = w; box.height = h;
      if (deferred) scheduleViewportPaint(); else applyBox();
    }
    function renderPath() {
      if (!$("path-result")) return;
      const host=$("path-result");host.replaceChildren();
      if(!view || !current(view.owner))return;
      if(!route){host.append(el("p","map-muted","Choose two visible themes. A path uses the fewest displayed links, not a causal or semantic explanation."));return;}
      host.append(el("p","map-note",`${route.edges.length} displayed link${route.edges.length===1?"":"s"}. Each step has its own supporting records; the endpoints need not appear in the same record. Other routes or omitted links may exist.`));
      for(let i=0;i<route.edges.length;i++){
        const edge=view.edgeMap.get(route.edges[i]);
        host.append(button(`${view.nodeMap.get(route.nodes[i]).label} → ${view.nodeMap.get(route.nodes[i+1]).label} · ${edge.support_count} shared records`,
          ()=>choose({kind:"connection",id:edge.id}),"map-related-link"));
      }
      if(!route.edges.length)host.append(el("p","map-muted","Both endpoints are the same theme."));
    }
    function showPath(from,to) {
      if(!view || !current(view.owner) || !onPage())return;
      route=shortestPath(displayedGraph(),from,to);focusOnly=false;pins=[];
      renderPath();renderPins();if(layoutMode==="focus")relayout();else draw();renderList();
      if(!route)$("path-result").append(el("p","map-note","No path in this bounded, filtered map. This does not prove the themes are unrelated. Broaden the date, source, or repeated-link filters."));
    }
    function renderV2() {
      if(!view || !current(view.owner))return;
      const t=view.timeline, original=view;
      const stillCurrent=()=>view===original && current(original.owner) && onPage();
      if(t && $("timeline-caption")) {
        $("through").max=t.today;$("through").min="1900-01-01";
        // An empty date is a relative Today choice. Rendering the resolved
        // day must not turn that intent into a fixed historical cutoff.
        $("through").value=view.filters.through || "";
        const slider=$("scrubber");slider.min=String(Math.min(dayNumber(t.earliest),dayNumber(t.through)));
        slider.max=String(dayNumber(t.today));slider.value=String(dayNumber(t.through));
        slider.setAttribute("aria-valuetext",t.through+" UTC");
        $("timeline-caption").textContent=(t.start?`${t.start} through ${t.through}`:`All saved dates through ${t.through}`)
          +(!view.filters.through?" · Today follows the current UTC day":" · Fixed through date")
          +` (UTC). ${t.current_records} current records. This filters last-save dates; it does not reconstruct what was known then.`;
        // The strip shows one line; the complete caption remains its title.
        $("timeline-caption").title=$("timeline-caption").textContent;
        const activity=$("activity");activity.replaceChildren();
        if(!t.days)activity.append(el("p","map-muted","Choose a 30- or 90-day window to compare it with the preceding equal-length window."));
        else {
          activity.append(el("p","map-muted",`Selected: ${t.start}–${t.through} (${t.current_records} records). Preceding: ${t.previous_start}–${t.previous_through} (${t.previous_records} records). Counts use each current record's last save, not conversations, interest strength, or full revision history. Corrections and imports can change these counts.`));
          if(view.coverage.date_filtered_before_sampling){
            const c=view.coverage,kinds=view.filters.kind==="all"?["memory","notebook"]:[view.filters.kind];
            const sum=suffix=>kinds.reduce((total,kind)=>total+c[kind+suffix],0);
            activity.append(el("p",c.records_limited?"map-note":"map-muted",
              `Sample coverage: ${sum("_current_scanned")} of ${sum("_current_total")} eligible selected-window records; ${sum("_previous_scanned")} of ${sum("_previous_total")} eligible preceding-window records. `
              +(c.records_limited?"Theme changes below compare these samples, not complete period totals. Narrow the saved-word scope for a fuller comparison.":"Both periods fit within this sample.")));
          }
          const wording={more:"More saved records",less:"Fewer saved records",only_current:"Only in selected window",only_previous:"Only in preceding window",same:"Same count"};
          const list=el("div","map-activity-rows");
          for(const row of t.rows){
            const card=el("div","map-activity-row");card.append(el("strong","",row.label),
              el("span","map-muted",`${row.previous_count} → ${row.current_count} · ${wording[row.change]}`));
            if(view.nodeMap.has(row.id))card.append(button("Inspect selected window",()=>choose({kind:"theme",id:row.id})));
            else if(row.previous_count)card.append(button("Explore preceding window",async()=>{
              if(!stillCurrent() || busy)return;
              const expectedOperation=operation+1;
              $("through").value=t.previous_through;await refresh();
              if(operation===expectedOperation && current(original.owner) && view && current(view.owner)) {
                if(view.nodeMap.has(row.id))choose({kind:"theme",id:row.id});
                else $("status").textContent="The preceding window is open. This label is not among its displayed themes; use saved-word scope to narrow the records.";
              }
            }));
            list.append(card);
          }
          if(!t.rows.length)activity.append(el("p","map-muted","No comparable labels in this sample under the current single-record filter."));
          activity.append(list);
        }
        if(t.undated_records||t.future_dated_records)activity.append(el("p","map-note",`${t.undated_records} undated and ${t.future_dated_records} future-dated records in the scanned sample. They cannot be assigned to an ordinary past window.`));
      }
      if(!$("path-from"))return;
      for(const name of ["path-from","path-to"]){
        const select=$(name);select.replaceChildren();const empty=el("option","","Choose a theme…");empty.value="";select.append(empty);
        for(const n of [...displayedGraph().nodes].sort((a,b)=>a.label.localeCompare(b.label))){const option=el("option","",n.label);option.value=n.id;select.append(option);}
        select.value="";
      }
      renderPath();const bridges=$("bridges");bridges.replaceChildren();
      const routes=bridgePaths(displayedGraph());
      if(!routes.length)bridges.append(el("p","map-muted","No indirect two-step routes among the displayed themes."));
      for(const r of routes)bridges.append(button(r.nodes.map(id=>view.nodeMap.get(id).label).join(" → "),()=>{
        if(!stillCurrent())return;
        const graph=displayedGraph();if(!r.nodes.every(id=>graph.nodeMap.has(id)) || !r.edges.every(id=>graph.edgeMap.has(id)))return;
        route={nodes:[...r.nodes],edges:[...r.edges]};pins=[];focusOnly=false;
        $("path-from").value=r.nodes[0];$("path-to").value=r.nodes[2];
        renderPath();renderPins();if(layoutMode==="focus")relayout();else draw();renderList();
      },"map-related-link"));
    }
    $("through")?.addEventListener("change",refresh);
    $("scrubber")?.addEventListener("input",()=>{
      const day=Number($("scrubber").value);
      if(!view || !Number.isInteger(day) || day<Number($("scrubber").min) || day>Number($("scrubber").max))return;
      $("through").value=dayText(day);$("scrubber").setAttribute("aria-valuetext",dayText(day)+" UTC; release to update");
    });
    $("scrubber")?.addEventListener("change",refresh);
    $("today")?.addEventListener("click",()=>{$("through").value="";refresh();});
    for(const [name,sign] of [["previous-window",-1],["next-window",1]]) $(name)?.addEventListener("click",()=>{
      const t=view?.timeline;if(!t?.days || busy || !current(view.owner))return;
      const day=Math.min(dayNumber(t.today),Math.max(dayNumber("1900-01-01"),dayNumber(t.through)+sign*t.days));
      $("through").value=dayText(day);refresh();
    });
    $("path-find")?.addEventListener("click",()=>showPath($("path-from").value,$("path-to").value));
    $("path-clear")?.addEventListener("click",()=>{route=null;renderPath();if(layoutMode==="focus")relayout();else draw();renderList();});
    function pageChanged() {
      if (!onPage() || !eligible()) { retireIndex(); retireReads(); clearToast(); clearLayoutConfirmation(); }
      fullscreen?.update();
      if (onPage() && eligible()) { if (!view && !busy) return refresh(); update(); }
      else if (busy || detailBusy) { reset("Refresh to explore the current saved records."); update(); }
    }
    function setActive(value) {
      active = Boolean(value);
      if (!active) {
        retireReads({snapshots: true});
        clearToast();
        cancelDragPaint();
        cancelViewportPaint();
        void fullscreen?.exit({restoreFocus: false});
        activeLabel=null;clearActiveLabel();
        operation++; detailOperation++; busy = false; detailBusy = false;
        if (dragged?.id && dragged.position && layout?.positions.has(dragged.id)) {
          Object.assign(layout.positions.get(dragged.id), dragged.position); draw();
        } else if (dragged?.moved && dragged?.start) { box = dragged.start; applyBox(); }
        dragged = null;
      }
      else { pageChanged(); if (view) { relayout(); if (selected && !detail) choose(selected, 0, false); } }
      update();
    }
    $("refresh").addEventListener("click", refresh);
    $("scope-form").addEventListener("submit", e => { e.preventDefault(); refresh(); });
    $("find-form").addEventListener("submit", e => { e.preventDefault(); find(); });
    for (const name of ["days", "kind", "strong", "single"]) $(name).addEventListener("change", name === "single"
      ? event => { singleChosen = true; return refresh(event); } : refresh);
    $("themes")?.addEventListener("change", refresh);
    $("count-mode")?.addEventListener("change",()=>{
      if(!view || !current(view.owner) || !onPage() || $("count-mode").disabled)return;
      uniqueCounts=$("count-mode").value==="unique";
      relayout();renderList();renderInspector();
    });
    $("fit").addEventListener("click", () => { if (layout) { box = fittedBox(); applyBox(); } });
    $("zoom-in").addEventListener("click", () => zoom(.8)); $("zoom-out").addEventListener("click", () => zoom(1.25));
    function clearSelection() {
      if (!view || !current(view.owner) || !onPage() || !selected) return;
      rememberTrail(); detailOperation++; detailBusy = false; selected = null; detail = null; errorText = "";
      focusOnly = false; chosenRecords.clear(); emptyDetail(); refreshFocusContext(); renderList(); update();
      showToast(selectionClearedNotice);
    }
    $("clear-selection")?.addEventListener("click", clearSelection);
    $("canvas").addEventListener("dblclick", event => {
      const gestures = pointerGestures; pointerGestures = [];
      if (dragged || clickSuppressed || gestures.some(value => !value.empty || value.moved)
          || event.target.closest?.("[data-map-node]") || event.target.closest?.("[data-map-link]") || event.target.closest?.("[data-map-badge]")) return;
      event.preventDefault(); clearSelection();
    });
    $("clear-pins").addEventListener("click", () => {
      if (!view || !current(view.owner) || !onPage()) return;
      pins = []; route = null; renderPath(); focusOnly = false; renderPins(); refreshFocusContext(); renderList(); renderInspector();
    });
    $("graph-mode").addEventListener("click", () => { listMode = false; update(); relayout(); });
    $("list-mode").addEventListener("click", () => { listMode = true; update(); renderList(); renderFocusSummary(); });
    function changeLayout(next, nextFocusCenter = null) {
      if (!view || !current(view.owner) || !layoutWritable() || !MODES.includes(next)) { update(); return; }
      navigationJob=null;navigating=false;
      cancelDrag();
      // Start from the inspected theme when Focus has no surviving anchor.
      // An existing explicit/saved anchor remains a deliberate viewing choice.
      if (next==="focus" && !nextFocusCenter && !presentationGraph().nodeMap.has(focusCenter)
          ) nextFocusCenter=selected?.kind==="theme"?selected.id:presentationGraph().nodes[0]?.id;
      const moveFocus=next==="focus" && nextFocusCenter && presentationGraph().nodeMap.has(nextFocusCenter)
        && nextFocusCenter!==focusCenter;
      if (next!==layoutMode || moveFocus || next==="groups" && (clusterAnchor || selected)) rememberTrail();
      clusterAnchor=null;compareChooser=null;
      if(next==="groups"){selected=null;detail=null;detailOperation++;detailBusy=false;chosenRecords.clear();}
      if (moveFocus) {focusCenter=nextFocusCenter;focusPage=0;}
      if (next!==layoutMode) {layoutMode=next;savedPositions=positionsByMode.get(next) || new Map();saveLayout();}
      route=null;relayout();renderList();renderV2();if(!selected)emptyDetail();update();
    }
    for(const mode of ["focus","groups","connections"])$("mode-"+mode)?.addEventListener("click",()=>changeLayout(mode));
    for (const name of HIGHLIGHTS) $("highlight-" + name)?.addEventListener("click", () => {
      if (!view || !current(view.owner)) return;
      highlight = highlight === name ? null : name;
      draw(); if (!selected) emptyDetail();
    });
    // 0.9.118 removes the layout picker from the page. Older embedders and
    // tests may still provide it; the retired layouts stay readable.
    $("layout-mode")?.addEventListener("change", () => {
      changeLayout($("layout-mode").value);
    });
    $("reset-layout").addEventListener("click", () => {
      if (!view || !current(view.owner) || !layoutWritable()) return;
      savedPositions.clear();relayout();saveLayout();update();
    });
    $("back")?.addEventListener("click",()=>navigateTrail("back")); $("forward")?.addEventListener("click",()=>navigateTrail("forward"));
    for (const name of ["focus-center","compare-left","compare-right","second-ring"]) $(name)?.addEventListener("change",()=>{
      if (!view || !current(view.owner) || !onPage()) return;
      if (name==="focus-center" && layoutMode==="focus" && $(name).value)
        return choose({kind:"theme",id:$(name).value});
      rememberTrail();focusCenter=$("focus-center").value || null;focusPage=0;
      compareAnchors=[$("compare-left").value || null,$("compare-right").value || null];secondRing=$("second-ring").checked;
      route=null;relayout();renderList();renderV2();if(!selected)emptyDetail();update();
    });
    $("undo-hide")?.addEventListener("click",()=>{
      if (!view || !current(view.owner) || !onPage() || !presentationUndo.length || !layoutWritable()) return;
      const prior=presentationUndo.at(-1);if(!hiddenPresentationFits(prior.themes,prior.links))return;
      presentationUndo.pop();hiddenThemes=new Set(prior.themes);hiddenLinks=new Set(prior.links);refreshPresentation();saveLayout();
    });
    $("restore-hidden")?.addEventListener("click",()=>{
      if (!view || !current(view.owner) || !onPage() || !layoutWritable() || !(hiddenThemes.size || hiddenLinks.size)) return;
      presentationUndo=[...presentationUndo,{themes:[...hiddenThemes],links:[...hiddenLinks]}].slice(-20);
      hiddenThemes.clear();hiddenLinks.clear();refreshPresentation();saveLayout();
    });
    $("save-view")?.addEventListener("click",()=>saveNamedView());
    $("retry-load")?.addEventListener("click",()=>{if(eligible() && onPage() && !busy && !layoutLoading && !layoutLoaded)return refresh();});
    $("retry-save")?.addEventListener("click",()=>{if(view && current(view.owner) && onPage() && layoutWritable() && !layoutSaving)saveLayout();});
    $("canvas").addEventListener("wheel", e => {
      if (!view || !current(view.owner) || !onPage() || e.ctrlKey || e.metaKey || !Number.isFinite(e.deltaY) || e.deltaY === 0) return;
      // Trackpads emit many small pixel deltas; one pixel is not a full mouse
      // notch. Normalize line/page devices and compose proportional increments
      // into the existing single viewport paint per animation frame.
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? $("canvas").getBoundingClientRect().height : 1;
      const pixels = clamp(e.deltaY * unit, -500, 500);
      e.preventDefault(); zoom(Math.exp(pixels * .001), true);
    }, {passive: false});
    $("canvas").addEventListener("pointerdown", e => {
      if (!view || !current(view.owner) || e.button !== 0 || !layout || !box) return;
      if(e.target.closest?.("[data-map-cluster]")){clickSuppressed=false;return;}
      const rect = $("canvas").getBoundingClientRect(), node = e.target.closest?.("[data-map-node]");
      const id = node?.getAttribute("data-map-node"), p = id && layout.positions.get(id);
      const link = e.target.closest?.("[data-map-badge]")?.getAttribute("data-map-badge")
        || e.target.closest?.("[data-map-link]")?.getAttribute("data-map-link");
      // A stationary captured tap suppresses its duplicate click. A new tap
      // must clear that flag even in layouts whose nodes cannot be dragged.
      clickSuppressed = false;
      if (p && (!layoutWritable() || ["focus","compare","saved-date"].includes(layoutMode))) return;
      dragged = {pointer: e.pointerId, clientX: e.clientX, clientY: e.clientY, rect, start: {...box},
        id: p ? id : null, link, position: p ? {...p} : null, moved: false};
      $("canvas").setPointerCapture?.(e.pointerId);
    });
    $("canvas").addEventListener("pointermove", e => {
      if (!dragged || dragged.pointer !== e.pointerId || !current(view?.owner)) return;
      const dx = (e.clientX - dragged.clientX) * dragged.start.width / Math.max(1, dragged.rect.width),
        dy = (e.clientY - dragged.clientY) * dragged.start.height / Math.max(1, dragged.rect.height);
      if (Math.abs(e.clientX - dragged.clientX) + Math.abs(e.clientY - dragged.clientY) > 5) dragged.moved = true;
      if (!dragged.moved) return;
      if (dragged.id) {
        if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;
        const p = layout.positions.get(dragged.id);
        if (!p) { cancelDrag(); return; }
        p.x = clamp(dragged.position.x + dx, -4 * layout.width, 5 * layout.width);
        p.y = clamp(dragged.position.y + dy, -4 * layout.height, 5 * layout.height);
        scheduleDragPaint();
      } else { box.x = dragged.start.x - dx; box.y = dragged.start.y - dy; scheduleViewportPaint(); }
    });
    const endDrag = e => {
      if (!dragged || dragged.pointer !== e.pointerId) return;
      cancelDragPaint();
      clickSuppressed = dragged.moved;
      // Pointer capture retargets pointerup/click to the SVG root. Explicitly
      // select a stationary node here so ordinary mouse/touch taps still work.
      const id = dragged.id, link = dragged.link, moved = dragged.moved, initial = dragged.position, start = dragged.start; dragged = null;
      pointerGestures = [...pointerGestures, {empty: !id && !link, moved: moved || e.type === "pointercancel"}].slice(-2);
      $("canvas").releasePointerCapture?.(e.pointerId);
      if (!id && moved && e.type === "pointercancel") { box = start; applyBox(); }
      else if (!id && moved) applyBox();
      if (id && moved && layout?.positions.has(id)) {
        const position = layout.positions.get(id);
        if (e.type === "pointercancel" || !current(view?.owner) || !Number.isFinite(position.x) || !Number.isFinite(position.y)) {
          Object.assign(position, initial); paintMovedTheme(id);
        } else {
          paintMovedTheme(id);
          savedPositions.delete(id);
          savedPositions.set(id, {x: clamp(position.x / layout.width, -4, 5), y: clamp(position.y / layout.height, -4, 5)});
          if (savedPositions.size > MAX_SAVED_ITEMS) savedPositions.delete(savedPositions.keys().next().value);
          saveLayout();
        }
      }
      if (!moved && e.type !== "pointercancel") {
        if (id) { clickSuppressed = true; choose({kind: "theme", id}); }
        else if (link) { clickSuppressed = true; choose({kind: "connection", id: link}); }
      }
    };
    $("canvas").addEventListener("pointerup", endDrag); $("canvas").addEventListener("pointercancel", endDrag);
    $("canvas").addEventListener("keydown", e => {
      if (e.target !== $("canvas") || !box) return;
      if (["+", "=", "-", "0", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        if (e.key === "+" || e.key === "=") zoom(.8); else if (e.key === "-") zoom(1.25);
        else if (e.key === "0") { box = fittedBox(); applyBox(); }
        else { box.x += e.key === "ArrowLeft" ? -40 : e.key === "ArrowRight" ? 40 : 0; box.y += e.key === "ArrowUp" ? -40 : e.key === "ArrowDown" ? 40 : 0; applyBox(); }
      }
    });
    // ResizeObserver does not re-run force layout on every pointer move and
    // ignores hidden-tab measurements; no permanent animation work is done.
    if (environment?.ResizeObserver) {
      let lastWidth = 0, lastHeight = 0;
      new environment.ResizeObserver(entries => {
        const width = entries[0]?.contentRect?.width || 0, height = entries[0]?.contentRect?.height ?? $("canvas").getBoundingClientRect().height;
        if (onPage() && view && width > 0 && height > 0 && (Math.abs(width - lastWidth) > 20 || Math.abs(height - lastHeight) > 20)) {
          lastWidth = width; lastHeight = height; relayout();
        }
      }).observe($("canvas"));
    }
    $("view-name")?.addEventListener("input", draftChanged);
    // Views & notes and Map settings are ordinary disclosure popovers: their
    // controls stay mounted, keep their state and keep their own checks.
    for (const [toggleName, panelName] of POPOVERS) {
      $(toggleName)?.addEventListener("click", () => setPopover($(panelName)?.hidden === false ? null : panelName));
      $(panelName)?.addEventListener("click", event => {
        if (!event.target?.closest?.("[data-map-popover-close]")) return;
        setPopover(null); $(toggleName)?.focus?.({preventScroll: true});
      });
    }
    // Escape closes an open popover before full screen handles Escape.
    $("view").addEventListener("keydown", event => {
      const open = event.key === "Escape" && openPopover(); if (!open) return;
      event.preventDefault(); event.stopPropagation?.(); setPopover(null); $(open[0])?.focus?.({preventScroll: true});
    }, true);
    document.addEventListener?.("pointerdown", event => {
      const open = openPopover(); if (!open) return;
      if ($(open[1])?.contains?.(event.target) || $(open[0])?.contains?.(event.target)) return;
      setPopover(null);
    });
    setPopover(null);
    environment.addEventListener?.("pcs-appearance-change", refreshLineAppearance);
    environment.addEventListener?.("resize",()=>{if(view && current(view.owner) && onPage())relayout();});
    $("view").addEventListener("toggle",()=>{if(view && current(view.owner) && onPage())relayout();},true);
    clear();
    return {refresh, setActive, pageChanged, update, clear, invalidate, unfinishedDraft,
      setThoughtAnchor,clearThoughtAnchor:()=>setThoughtAnchor(null),
      fullscreenActive: () => fullscreen?.active() === true, exitFullscreen: () => fullscreen?.exit({restoreFocus: false})};
  }
  const exported = {create, checked, checkedDetail, checkedTimeline, shortestPath, bridgePaths, dayNumber, dayText, layoutGraph, fitBox, findTheme, neighborhood, selectionNeighborhood, displayCount, noteTitle, wrapLabel, measureLabelWidths,checkedNamedView,presentationFits,connectionStyle,dottedConnections,connectionCurve,curvePoint};
  if (typeof module !== "undefined" && module.exports) module.exports = exported;
  else root.PCSContinuityMap = exported;
})(typeof window !== "undefined" ? window : this);
