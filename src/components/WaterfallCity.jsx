import React, { useContext, useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { CityContext } from '../context/CityContext'
import '../styles/WaterfallCity.css'

// WaterfallCity
// - Reads `data` and `selectedCity` from CityContext
// - Aggregates per-step volumes for the selected city
// - Steps considered (if present): collected (total), recycled, compost, landfill, incinerated, treated
// - If none of these steps exist, component renders a small placeholder
// Data extraction documented inline in the code below.

export default function WaterfallCity({ className }){
  const { data, selectedCity } = useContext(CityContext)
  const svgRef = useRef()
  const wrapperRef = useRef()

  useEffect(()=>{
    if(!data || data.length===0) return
    if(!selectedCity) return

    // Filter rows for city
    const rows = data.filter(d => d.city === selectedCity)
    if(!rows || rows.length===0) {
      d3.select(svgRef.current).selectAll('*').remove()
      return
    }

    // Aggregate logic (documented):
    // - totalCollected: sum of `value` for the city (represents total waste generated/collected)
    // - recycled: aggregate either from recyclingRate (%) or disposal method 'Recyclage'
    // - compost: disposal method 'Compost'
    // - landfill: disposal method matching landfill/deposit terms
    // - incinerated: disposal method matching incineration terms
    // - treated/other: fallback aggregated into 'Autre'

    const totalCollected = d3.sum(rows, d => (d.value || 0))

    // recycled estimate using recyclingRate if available
    const recycledByRate = d3.sum(rows, d => (d.value || 0) * ((d.recyclingRate || 0) / 100))

    // disposal-based aggregates
    const isLandfill = s => /depos|landfill|décharge|dump/i.test(s)
    const isIncineration = s => /incin|inciner/i.test(s)
    const isCompost = s => /compost/i.test(s)
    const isRecycled = s => /recycl|recycle/i.test(s)

    const byDisposal = d3.rollups(rows, v => d3.sum(v, d => d.value || 0), d => (d.disposal || '').toString())
    const disposalMap = new Map(byDisposal)

    let recycled = 0, landfill = 0, incinerated = 0, compost = 0
    disposalMap.forEach((val, key) => {
      const k = key || ''
      if(isRecycled(k)) recycled += val
      else if(isLandfill(k)) landfill += val
      else if(isIncineration(k)) incinerated += val
      else if(isCompost(k)) compost += val
    })

    // prefer measured recycled from disposal if exists, otherwise use recyclingRate estimate
    if(recycled <= 0 && recycledByRate > 0) recycled = recycledByRate

    // any residual (not captured by known disposals) grouped as other
    const sumKnown = recycled + landfill + incinerated + compost
    const other = Math.max(0, totalCollected - sumKnown)

    // Prepare waterfall steps in desired order
    const steps = [
      { key: 'collected', name: 'Collecté', value: totalCollected },
    ]

    // optionally include 'trié' if dataset has 'treated' or similar fields - we skip if not present
    // for now, we consider 'recycled' as the main processed step
    if(recycled > 0) steps.push({ key: 'recycled', name: 'Recyclé', value: recycled })
    if(compost > 0) steps.push({ key: 'compost', name: 'Compost', value: compost })
    if(landfill > 0) steps.push({ key: 'landfill', name: 'Envoyé en décharge', value: landfill })
    if(incinerated > 0) steps.push({ key: 'incinerated', name: 'Incinéré', value: incinerated })
    if(other > 0) steps.push({ key: 'other', name: 'Autre', value: other })

    // Only draw if we have at least 2 steps (collected + something)
    if(steps.length < 2){
      d3.select(svgRef.current).selectAll('*').remove()
      return
    }

    drawWaterfall(svgRef.current, wrapperRef.current, steps)
  },[data, selectedCity])

  return (
    <div className={`waterfall-card ${className||''}`} ref={wrapperRef}>
      <div className="waterfall-header"><h4>Parcours des déchets — {selectedCity || 'Ville'}</h4></div>
      <svg ref={svgRef} className="waterfall-svg" />
      <div className="waterfall-legend" />
      <div className="waterfall-note">Les valeurs sont agrégées depuis la dataset locale; les étapes manquantes sont omises.</div>
    </div>
  )
}

function drawWaterfall(svgNode, wrapperNode, steps){
  if(!svgNode || !wrapperNode) return
  const svg = d3.select(svgNode)
  svg.selectAll('*').remove()

  const width = wrapperNode.clientWidth || 520
  const height = 260
  const margin = { top: 20, right: 12, bottom: 48, left: 64 }
  const innerW = Math.max(320, width) - margin.left - margin.right
  const innerH = height - margin.top - margin.bottom

  svg.attr('viewBox', `0 0 ${width} ${height}`).style('width','100%').style('height',`${height}px`)

  // total collected for percentages
  const totalCollected = steps.length ? steps[0].value : 0

  // build waterfall values as changes relative to previous cumulative
  // first entry is totalCollected (positive), following steps are negative (reductions)
  const data = []
  let cumulative = 0
  steps.forEach((s, i) => {
    if(i === 0){
      data.push({ name: s.name, value: s.value, type: 'total', start: 0, end: s.value })
      cumulative = s.value
    } else {
      const change = -Math.max(0, s.value) // negative drop
      const start = cumulative
      const end = cumulative + change
      data.push({ name: s.name, value: change, type: 'change', start, end, orig: s.value })
      cumulative = end
    }
  })

  // scales
  const x = d3.scaleBand().domain(data.map(d=>d.name)).range([0, innerW]).padding(0.3)
  const y = d3.scaleLinear().domain([0, totalCollected]).range([innerH, 0]).nice()

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  // axes
  g.append('g').attr('transform', `translate(0,${innerH})`).call(d3.axisBottom(x)).selectAll('text').attr('fill','var(--text-primary)')
  g.append('g').call(d3.axisLeft(y).ticks(5)).selectAll('text').attr('fill','var(--text-primary)')
  g.append('text').attr('x', -innerH/2).attr('y', -48).attr('transform','rotate(-90)').attr('text-anchor','middle').attr('fill','var(--text-muted)').text('Tonnes')

  // Local color definitions for WaterfallCity (component-local — DO NOT use global CSS vars)
  // Change these values here to update Waterfall colors without affecting other charts.
  const defaultPalette = ['#7FC8A0','#FFD600','#8AD1FF','#F6D87A','#9EA0B8']
  // explicit color map for known step keys — ensures 'collected' is green and 'recycled' is yellow
  const colorMap = {
    collected: '#fc9e12', // Collecte -> green (local)
    recycled: '#25af23',  // Recyclé -> yellow (local, matches legend)
    compost: '#f68a57',
    landfill: '#6bb5e6',
    incinerated: '#7c4ee6',
    other: '#ff9aa2'
  }
  // fallback palette used for any unmapped steps (kept local)
  const palette = defaultPalette.slice()

  // draw bars
  const bars = g.selectAll('.wf-bar').data(data).join('g').attr('class','wf-bar').attr('transform', d=>`translate(${x(d.name)},0)`)

  // build a color array aligned with `steps` so each bar gets the intended color
  const stepColors = steps.map((s, idx) => {
    // prefer explicit mapping by key, otherwise fallback to local palette
    return (s.key && colorMap[s.key]) ? colorMap[s.key] : palette[idx % palette.length]
  })

  bars.append('rect')
    .attr('class','wf-rect')
    .attr('x', 0)
    .attr('y', d => d.type === 'total' ? y(d.end) : y(Math.max(d.start, d.end)))
    .attr('width', x.bandwidth())
    .attr('height', d => Math.abs(y(d.start) - y(d.end)) || 2)
    // use precomputed stepColors by index so colors exactly match legend
    .attr('fill', (d,i) => stepColors[i])
    .attr('rx', 4)
    .attr('opacity', 0)
    .transition().duration(700).attr('opacity', 0.95)

  // labels inside bars: value and percent
  bars.append('text')
    .attr('class','wf-label')
    .attr('x', x.bandwidth()/2)
    .attr('y', d => (d.type === 'total' ? y(d.end) : y(Math.max(d.start, d.end))) + 18)
    .attr('text-anchor','middle')
    .attr('fill','var(--text-primary)')
    .attr('font-size',12)
    .text(d => {
      if(d.type === 'total') return `${d3.format(',')(Math.round(d.end))} t`
      const percent = totalCollected ? Math.round( (Math.abs(d.orig) / totalCollected) * 100 ) : 0
      return `${d3.format(',')(Math.round(Math.abs(d.orig)))} t (${percent}%)`
    })

  // tooltip logic
  const tip = d3.select(wrapperNode).select('.waterfall-tooltip')
  if(tip.empty()){
    d3.select(wrapperNode).append('div').attr('class','waterfall-tooltip').style('display','none')
  }
  const tooltip = d3.select(wrapperNode).select('.waterfall-tooltip')

  bars.on('mouseover', function(event,d){
    tooltip.style('display','block').style('opacity',1)
    const html = d.type === 'total'
      ? `<div class="tip-title">${d.name}</div><div>Total collecté: <strong>${d3.format(',')(Math.round(d.end))} t</strong></div>`
      : `<div class="tip-title">${d.name}</div><div>Quantité: <strong>${d3.format(',')(Math.round(Math.abs(d.orig || d.value || 0)))} t</strong></div><div>Share: <strong>${totalCollected ? Math.round((Math.abs(d.orig || d.value || 0) / totalCollected)*100) : 0}%</strong></div>`
    tooltip.html(html)
    const [mx,my] = d3.pointer(event, wrapperNode)
    tooltip.style('left', Math.min(wrapperNode.clientWidth - 220, mx + 12) + 'px').style('top', Math.max(8, my + 6) + 'px')
    d3.select(this).select('rect').attr('stroke','#fff').attr('stroke-width',1.2)
  }).on('mousemove', function(event){ const [mx,my] = d3.pointer(event, wrapperNode); tooltip.style('left', Math.min(wrapperNode.clientWidth - 220, mx + 12) + 'px').style('top', Math.max(8, my + 6) + 'px') })
    .on('mouseout', function(){ tooltip.style('opacity',0); setTimeout(()=> tooltip.style('display','none'), 160); d3.select(this).select('rect').attr('stroke','none') })

  // legend
  const legend = d3.select(wrapperNode).select('.waterfall-legend')
  legend.html('')
  const legItems = legend.selectAll('.leg').data(stepsExceptFirst(steps)).join('div').attr('class','leg-item')
  // stepsExceptFirst corresponds to steps[1..], so pick colors from stepColors offset by 1
  legItems.append('span').attr('class','sw').style('background', (d,i)=> stepColors[i+1] || palette[i%palette.length])
  legItems.append('span').attr('class','lbl').text(d=>d.name)
}

function stepsExceptFirst(steps){
  if(!steps || steps.length<=1) return []
  return steps.slice(1)
}
