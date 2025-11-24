import React, { useEffect, useRef, useState, useContext } from 'react'
import * as d3 from 'd3'
import { sankey, sankeyLinkHorizontal } from 'd3-sankey'
import '../styles/SankeyDiagramIndian.css'
import { CityContext } from '../context/CityContext'

export default function SankeyDiagramIndian(){
  const { data, selectedCity } = useContext(CityContext)
  const [filterMode, setFilterMode] = useState('type') // 'type' | 'year' (city filtering always applied from CityContext)
  const [filterValue, setFilterValue] = useState('')
  const options = React.useMemo(()=>{
    if(!data || data.length===0) return { type:[], year:[] }
    const type = Array.from(new Set(data.map(r=>r.type).filter(Boolean))).sort()
    const year = Array.from(new Set(data.map(r=>r.year).filter(Boolean))).sort((a,b)=>a-b)
    return { type, year }
  },[data])
  const wrapperRef = useRef()
  const svgRef = useRef()
  const tooltipRef = useRef()
  // options derived from global data (CityContext); we keep only type/year options here
  // do not set state synchronously here; use the selected `filterValue` when available,
  // and fall back to the first available option when computing the sankey data.

  // recompute sankey on filter change
  useEffect(()=>{
    if(!data || data.length===0) return
    // choose applied filter: explicit value or fallback to first option available
    const fallback = (options && options[filterMode] && options[filterMode][0]) || ''
    const appliedFilter = filterValue || fallback
    // Always apply city filter from CityContext, then refine by mode/value
    drawSankey(svgRef.current, wrapperRef.current, tooltipRef.current, data, selectedCity, filterMode, appliedFilter)
    const onResize = () => drawSankey(svgRef.current, wrapperRef.current, tooltipRef.current, data, selectedCity, filterMode, appliedFilter)
    window.addEventListener('resize', onResize)
    return ()=> window.removeEventListener('resize', onResize)
  },[data, selectedCity, filterMode, filterValue, options])

  return (
    <div className="sankey-card" ref={wrapperRef}>
      <div className="sankey-header">
        <h3>Flux des déchets — Sankey</h3>
        <p className="sankey-sub">Filtrer par ville, type de déchet, ou année</p>
      </div>

      <div className="sankey-controls">
        <label>Filtrer par</label>
        <select value={filterMode} onChange={e=>{ setFilterMode(e.target.value); const first = (options[e.target.value]||[])[0] || ''; setFilterValue(first) }}>
          <option value="type">Waste Type</option>
          <option value="year">Year</option>
        </select>

        <label>Valeur</label>
        <select value={filterValue} onChange={e=>setFilterValue(e.target.value)}>
          {(options[filterMode]||[]).map(o => <option key={o} value={o}>{String(o)}</option>)}
        </select>
      </div>

      <div className="sankey-area">
        <svg ref={svgRef} className="sankey-svg" />
        <div ref={tooltipRef} className="sankey-tooltip" style={{opacity:0}} />
        <div className="sankey-legend" />
      </div>
    </div>
  )
}
function drawSankey(svgNode, wrapperNode, tooltipNode, data, selectedCity, filterMode, filterValue){
  if(!svgNode || !wrapperNode) return
  const svg = d3.select(svgNode)
  const width = Math.max(20, wrapperNode.clientWidth || 760)
  const height = Math.max(40, Math.floor(width * 0.4))
  svg.selectAll('*').remove()
  // responsive svg
  svg.attr('viewBox', `0 0 ${width} ${height}`).attr('preserveAspectRatio','xMidYMid meet').style('width','100%').style('height','340px')

  // filter data according to selection
  let rows = data || []
  if(selectedCity) rows = rows.filter(d => d.city === selectedCity)
  if(filterMode === 'type' && filterValue) rows = rows.filter(d=>d.type === filterValue)
  else if(filterMode === 'year' && filterValue) rows = rows.filter(d=>d.year === +filterValue)

  // Normalize disposal methods to a small set
  const normalizeDisposal = s => {
    if(!s) return 'Autre'
    const t = String(s).toLowerCase()
    if(t.includes('recycl')) return 'Recyclage'
    if(t.includes('décharge') || t.includes('landfill') || t.includes('dump')) return 'Décharge'
    if(t.includes('incin') || t.includes('inciner')) return 'Incinération'
    if(t.includes('compost')) return 'Compost'
    return 'Autre'
  }

  // Determine source field
  const sourceField = filterMode === 'type' ? 'type' : (filterMode === 'year' ? 'year' : 'city')

  // Aggregate totals per source and normalized disposal
  const nested = d3.rollups(rows, v => d3.sum(v, d=>d.value || 0), d => d[sourceField], d => normalizeDisposal(d.disposal))

  // Build simple top sources (top 4) and group rest into 'Autres'
  const sourceTotals = nested.map(([src, dests]) => ({ src: src || 'Unknown', total: d3.sum(dests, d=>d[1] || 0), dests }))
    .sort((a,b)=>b.total - a.total)
  const top = sourceTotals.slice(0,4).map(d=>d.src)
  const others = sourceTotals.slice(4)

  // Fixed small set of destinations
  const destinations = ['Recyclage','Décharge','Incinération','Compost','Autre']

  // Build nodes array
  const sourceNodes = top.slice() // copy
  if(others.length) sourceNodes.push('Autres')
  const nodes = sourceNodes.map(s => ({ id: `src:${s}`, name: String(s), type: 'source' }))
  destinations.forEach(d => nodes.push({ id: `dst:${d}`, name: d, type: 'dest' }))

  // Build links
  const linksMap = new Map()
  // helper to add value
  const addLink = (sName, dName, v) => {
    const key = `${sName}-->${dName}`
    linksMap.set(key, (linksMap.get(key)||0) + (v||0))
  }

  sourceTotals.forEach(s => {
    const sName = top.includes(s.src) ? s.src : (others.length ? 'Autres' : s.src)
    s.dests.forEach(([dName, val])=>{
      const norm = normalizeDisposal(dName)
      addLink(sName, norm, val)
    })
  })

  const links = Array.from(linksMap.entries()).map(([k,v]) => {
    const [sName,dName] = k.split('-->')
    return { source: `src:${sName}`, target: `dst:${dName}`, value: v }
  })

  // Apply min link scaling: ensure links have a minimum visible thickness
  const rawMax = d3.max(links, d=>d.value) || 1
  const minLinkValue = Math.max(1, 0.05 * rawMax) // 5% of max flux
  const scaledLinks = links.map(l => ({ source: l.source, target: l.target, value: Math.max(l.value, minLinkValue), originalValue: l.value }))

  // Build index maps for sankey using scaled values (layout uses these values)
  const nodeIndex = new Map(nodes.map((n,i)=>[n.id,i]))
  const graph = {
    nodes: nodes.map(n=>Object.assign({}, n)),
    links: scaledLinks.map(l=>({ source: nodeIndex.get(l.source), target: nodeIndex.get(l.target), value: l.value, originalValue: l.originalValue }))
  }

  const sank = sankey()
    .nodeWidth(20)
    .nodePadding(18)
    .extent([[36,20],[width-36, height-20]])

  sank(graph)

  // Colors: prefer CSS vars or colorsConfig palette
  const defaultPalette = ['#B99BFF','#7FC8A0','#8AD1FF','#F6D87A','#9EA0B8']
  const cssVars = typeof window !== 'undefined' && window.getComputedStyle ? window.getComputedStyle(document.documentElement) : null
  const palette = destinations.map((d,i)=> (cssVars && cssVars.getPropertyValue(`--chart-${(i%5)+1}`) ? cssVars.getPropertyValue(`--chart-${(i%5)+1}`).trim() : defaultPalette[i%defaultPalette.length]))
  const destColorMap = new Map(destinations.map((d,i)=>[d, palette[i]]))

  // Draw links
  const linkG = svg.append('g').attr('class','links')
  const link = linkG.selectAll('path').data(graph.links).join('path')
    .attr('d', sankeyLinkHorizontal())
    .attr('fill','none')
    .attr('stroke', d => {
      const t = graph.nodes[d.target] ? graph.nodes[d.target].name : null
      return destColorMap.get(t) || '#9aa'
    })
    .attr('stroke-linecap','round')
    .attr('stroke-opacity',0.88)
    .attr('stroke-width',0)
    .on('mouseenter', function(event,d){
      const s = graph.nodes[d.source] ? graph.nodes[d.source].name : ''
      const t = graph.nodes[d.target] ? graph.nodes[d.target].name : ''
      const tt = d3.select(tooltipNode)
      tt.html(`<div class="tip-title"><strong>${s}</strong> → <strong>${t}</strong></div><div>Quantité: ${Number(d.originalValue || d.value).toLocaleString()} t</div>`)
      tt.style('opacity',1).style('left', (event.layerX + 12) + 'px').style('top', (event.layerY + 12) + 'px')
      d3.select(this).attr('stroke-width', (parseFloat(d3.select(this).attr('stroke-width'))||0) + 6).attr('stroke','white').attr('stroke-opacity',1)
    }).on('mousemove', function(event){ d3.select(tooltipNode).style('left', (event.layerX + 12) + 'px').style('top', (event.layerY + 12) + 'px') })
    .on('mouseleave', function(){ d3.select(tooltipNode).style('opacity',0); d3.select(this).attr('stroke', d => destColorMap.get(graph.nodes[d.target].name) || '#9aa').attr('stroke-opacity',0.88) })

  // animate links drawing
  // compute scale for stroke widths based on link values (use originalValue if present)
  const maxLinkVal = d3.max(graph.links, d=> d.value) || 1
  const minStroke = 6
  const maxStroke = Math.max(14, Math.round(width / 30))
  const strokeScale = d3.scaleLinear().domain([minLinkValue, maxLinkVal]).range([minStroke, maxStroke])

  link.each(function(){
    const node = d3.select(this).node()
    if(node && typeof node.getTotalLength === 'function'){
      const L = node.getTotalLength()
      d3.select(this).attr('stroke-dasharray', `${L} ${L}`).attr('stroke-dashoffset', L)
    }
  })
  link.transition().duration(900).attr('stroke-width', d => strokeScale(d.value)).attr('stroke-dashoffset', 0)

  // Draw nodes with clear labels
  const nodeG = svg.append('g').attr('class','nodes')
  const node = nodeG.selectAll('g').data(graph.nodes).join('g').attr('transform', d=>`translate(${d.x0},${d.y0})`)

  node.append('rect')
    .attr('width', d => Math.max(8, (d.x1 - d.x0) || 10))
    .attr('height', d => Math.max(8, (d.y1 - d.y0) || 10))
    .attr('fill', d=> d.type === 'dest' ? (destColorMap.get(d.name) || '#9aa') : '#e6f3ea')
    .attr('stroke','rgba(255,255,255,0.06)')

  // labels: source left, dest right
  node.append('text')
    .text(d => d.name)
    .attr('x', d => d.type === 'source' ? -8 : (d.x1 - d.x0) + 8)
    .attr('y', d => Math.max(12, (d.y1 - d.y0)/2))
    .attr('text-anchor', d => d.type === 'source' ? 'end' : 'start')
    .attr('fill','var(--text-primary)')
    .attr('font-size', 13)

  // Legend: append into wrapper's .sankey-legend
  const legendWrap = d3.select(wrapperNode).select('.sankey-legend')
  if(!legendWrap.empty()){
    legendWrap.html('')
    const items = legendWrap.selectAll('.leg').data(destinations).join('div').attr('class','leg').style('display','inline-flex').style('align-items','center').style('gap','8px').style('margin-right','12px')
    items.append('span').attr('class','sw').style('width','14px').style('height','12px').style('display','inline-block').style('background', d=>destColorMap.get(d)).style('border-radius','3px')
    items.append('span').text(d=>d).style('color','var(--text-muted)').style('font-size','13px')
  }
}
