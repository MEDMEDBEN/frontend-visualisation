import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import '../styles/BarChartCampaignsPaged.css'

// Shows campaigns per city, paged by 10 cities per page.
export default function BarChartCampaignsPaged(){
  const [data, setData] = useState([])
  const [pages, setPages] = useState([])
  const [pageIndex, setPageIndex] = useState(0)
  const svgRef = useRef()
  const wrapperRef = useRef()

  useEffect(()=>{
    d3.csv('/Indian.csv', d=>({
      city: d['City/District'],
      campaigns: +d['Awareness Campaigns Count'] || 0,
      year: +d['Year'] || null
    })).then(rows=>{
      setData(rows)
      // aggregate total campaigns by city across all years
      const sums = Array.from(d3.rollups(rows, v=>d3.sum(v, d=>d.campaigns), d=>d.city)
        .map(([city, campaigns])=>({ city, campaigns })))
      // sort by campaigns desc for useful ordering
      sums.sort((a,b)=>b.campaigns - a.campaigns || a.city.localeCompare(b.city))
      // chunk into pages of 10
      const chunkSize = 10
      const newPages = []
      for(let i=0;i<sums.length;i+=chunkSize) newPages.push(sums.slice(i, i+chunkSize))
      setPages(newPages)
      setPageIndex(0)
    }).catch(err=>console.error('Failed to load CSV', err))
  },[])

  useEffect(()=>{
    if(!pages || pages.length===0) return
    drawPage(svgRef.current, wrapperRef.current, pages[pageIndex] || [])
  },[pages, pageIndex])

  return (
    <div className="bar-paged-card" ref={wrapperRef}>
      <div className="bar-paged-header">
        <h2 className="bar-paged-title">Awareness Campaigns — Cities (paged)</h2>
        <div className="bar-paged-note">Affiche 10 villes par partie; sélectionnez une partie à droite.</div>
      </div>

      <div className="bar-paged-body">
        <div className="bar-paged-chart">
          <svg ref={svgRef} className="bar-paged-svg" />
        </div>

        <div className="bar-paged-pages" role="navigation" aria-label="Pagination parts">
          {pages.map((pg, i) => (
            <button
              key={i}
              className={`bar-paged-part ${i===pageIndex? 'active':''}`}
              onClick={()=>setPageIndex(i)}
              aria-pressed={i===pageIndex}
            >
              Partie {i+1}
            </button>
          ))}
        </div>
      </div>

      <div className="bar-paged-tooltip" style={{display:'none'}} />
    </div>
  )
}

function drawPage(svgNode, wrapperNode, items){
  const margin = { top: 20, right: 12, bottom: 140, left: 120 }
  const containerWidth = wrapperNode ? wrapperNode.clientWidth : 900
  // reserve width for pager column (approx 160px) when available
  const pagerReserve = Math.min(220, Math.max(120, Math.floor(containerWidth * 0.3)))
  const width = Math.max(400, containerWidth - pagerReserve) - margin.left - margin.right
  const height = 340 - margin.top - margin.bottom

  const svg = d3.select(svgNode)
  svg.selectAll('*').remove()
  svg.attr('width', width + margin.left + margin.right).attr('height', height + margin.top + margin.bottom)

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  const cities = items.map(d=>d.city)
  const x = d3.scaleBand().domain(cities).range([0, width]).padding(0.22)
  const y = d3.scaleLinear().domain([0, d3.max(items, d=>d.campaigns) || 1]).nice().range([height, 0])

  // axes
  g.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x)).selectAll('text')
    .attr('transform','rotate(-40)').attr('text-anchor','end').attr('dx','-0.6em').attr('dy','0.1em')
  g.append('g').call(d3.axisLeft(y).ticks(6))

  // bars
  // create per-bar gradients based on value
  const svgDefs = svg.append('defs')
  const campVals = items.map(d=>d.campaigns)
  const cmin = d3.min(campVals) || 0
  const cmax = d3.max(campVals) || 1
  const normalize = v => cmin === cmax ? 0.5 : (v - cmin) / (cmax - cmin)
  const dark = '#05295C' // dark navy
  const lightBase = '#6EA8FF' // light blue

  function safeId(s){ return String(s).replace(/[^a-z0-9-]/gi, '-').toLowerCase() }
  items.forEach(d => {
    const t = normalize(d.campaigns)
    const mixed = d3.interpolateRgb(dark, lightBase)(t)
    const id = `grad-${safeId(d.city)}`
    const lg = svgDefs.append('linearGradient').attr('id', id).attr('x1','0').attr('y1','0').attr('x2','0').attr('y2','1')
    lg.append('stop').attr('offset','0%').attr('stop-color', d3.color(mixed).darker(0.6))
    lg.append('stop').attr('offset','100%').attr('stop-color', mixed)
  })

  const bars = g.selectAll('.bp').data(items, d=>d.city).join('rect')
    .attr('class','bp')
    .attr('x', d=> x(d.city))
    .attr('y', ()=> y(0))
    .attr('width', x.bandwidth())
    .attr('height', 0)
    .attr('rx', 6)
    .attr('fill', d=> `url(#grad-${safeId(d.city)})`)
    .attr('opacity', 0.96)
    .on('mouseover', function(e,d){
      const tip = d3.select(wrapperNode).select('.bar-paged-tooltip')
      tip.style('display','block')
      tip.html(`<div class="tip-title">${d.city}</div><div>Campaigns: ${d3.format(',')(d.campaigns)}</div>`)
      tip.classed('show', true)
      const [mx,my] = d3.pointer(e, wrapperNode)
      tip.style('left', `${Math.min(wrapperNode.clientWidth - 220, mx+14)}px`).style('top', `${Math.max(8, my+10)}px`)

      // show value label above the hovered bar (remove any existing)
      g.selectAll('.bar-hover-label').remove()
      g.append('text')
        .attr('class', 'bar-hover-label')
        .attr('x', x(d.city) + x.bandwidth() / 2)
        .attr('y', Math.max(12, y(d.campaigns) - 8))
        .attr('text-anchor', 'middle')
        .text(d3.format(',')(d.campaigns))
        .attr('fill', 'var(--text-primary)')
        .attr('font-size', 12)
        .attr('font-weight', 700)
    })
    .on('mousemove', function(e){ const tip = d3.select(wrapperNode).select('.bar-paged-tooltip'); const [mx,my] = d3.pointer(e, wrapperNode); tip.style('left', `${Math.min(wrapperNode.clientWidth - 220, mx+14)}px`).style('top', `${Math.max(8, my+10)}px`) })
    .on('mouseout', function(){ const tip = d3.select(wrapperNode).select('.bar-paged-tooltip'); tip.classed('show', false); setTimeout(()=> tip.style('display','none'), 140); g.selectAll('.bar-hover-label').remove() })

  // animate grow
  bars.transition().duration(700).attr('y', d=> y(d.campaigns)).attr('height', d=> Math.max(0, height - y(d.campaigns))).ease(d3.easeCubicOut)

  // subtle group fade-in
  g.style('opacity',0).transition().duration(300).style('opacity',1)
  
  // add subtle hover effect for bars
  bars.on('mouseover', function(){
    d3.select(this).transition().duration(180).attr('opacity',1).attr('transform', 'translate(0,-4)')
  }).on('mouseout', function(){ d3.select(this).transition().duration(180).attr('opacity',0.96).attr('transform','translate(0,0)') })
}
