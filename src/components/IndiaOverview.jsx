import React, { useContext, useEffect, useRef } from 'react'
import { CityContext } from '../context/CityContext'
import * as d3 from 'd3'
import '../styles/IndiaOverview.css'

export default function IndiaOverview(){
  const { data, cityStats } = useContext(CityContext)
  const areaRef = useRef()
  const donutRef = useRef()
  const barRef = useRef()
  const scatterRef = useRef()
  const scatterTipRef = useRef()

  // compute top10 waste cities
  const topCities = React.useMemo(()=>{
    if(!cityStats) return []
    return Array.from(cityStats.entries()).map(([city, s])=>({ city, total: s.totalGenerated, populationDensity: s.populationDensity }))
      .sort((a,b)=>b.total - a.total).slice(0,10)
  },[cityStats])

  // top5 recyclers by mean recyclingRate across data
  const topRecyclers = React.useMemo(()=>{
    if(!data) return []
    const byCity = d3.rollups(data, v => {
      const total = d3.sum(v, d=>d.value * (d.recyclingRate/100))
      const rate = d3.mean(v, d=>d.recyclingRate) || 0
      return { recycled: total, rate }
    }, d=>d.city)
    .map(([city, v])=>({ city, recycled: v.recycled, rate: v.rate }))
    .sort((a,b)=>b.rate - a.rate).slice(0,5)
    return byCity
  },[data])

  // area chart: totals per year (national)
  useEffect(()=>{
    if(!data || data.length===0) return
    const years = Array.from(new Set(data.map(d=>d.year))).sort((a,b)=>a-b)
    const totals = years.map(y => ({ year: y, total: d3.sum(data.filter(d=>d.year===y), d=>d.value) }))
    drawArea(areaRef.current, totals)
  },[data])

  // donut chart by waste type
  useEffect(()=>{
    if(!data || data.length===0) return
    const byType = d3.rollups(data, v=>d3.sum(v,d=>d.value), d=>d.type).map(([type, val])=>({ type, val }))
    drawDonut(donutRef.current, byType)
  },[data])

  // national scatter: one point per city
  useEffect(()=>{
    if(!data || data.length===0) return
    // aggregate per city
    const byCity = d3.rollups(data, v=>{
      const total = d3.sum(v, d=>d.value)
      const density = d3.mean(v, d=>d.populationDensity) || 0
      const avgCost = d3.mean(v, d=>d.cost) || 0
      const byType = d3.rollups(v, vv=>d3.sum(vv, d=>d.value), d=>d.type)
      const primary = byType.sort((a,b)=>b[1]-a[1])[0]
      const primaryType = primary ? primary[0] : 'Unknown'
      return { city: v[0].city, totalGenerated: total, populationDensity: density, avgCost, primaryType }
    }, d=>d.city)

    const points = byCity.map(([city, vals])=>({ city, ...vals }))
    drawScatter(scatterRef.current, scatterTipRef.current, points)
  },[data])

  // bar chart top10
  useEffect(()=>{
    if(!topCities || topCities.length===0) return
    drawBar(barRef.current, topCities)
  },[topCities])

  return (
    <section className="india-overview">
      <h2 className="overview-title">Vue Globale — Inde</h2>

      <div className="overview-row">
        <div className="overview-left">
          <div className="card table-card">
            <h3>TOP 10 — Villes productrices</h3>
            <table className="top-table">
              <thead><tr><th>Rang</th><th>Ville</th><th>Total (Tons)</th><th>Population</th><th>Recyclage %</th></tr></thead>
              <tbody>
                {topCities.map((r,i)=> (
                  <tr key={r.city} className={i===0? 'champion':''}>
                    <td className="rank">{i+1}</td>
                    <td className="cityname">{r.city}</td>
                    <td className="volume">{Math.round(r.total).toLocaleString()}</td>
                    <td className="pop">{r.populationDensity || '—'}</td>
                    <td className="rate">{ /* placeholder: compute average rate */ '—' }</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card table-card">
            <h3>TOP 5 — Meilleurs recycleurs</h3>
            <table className="top-table small">
              <thead><tr><th>Rang</th><th>Ville</th><th>Taux %</th><th>Volume recyclé</th></tr></thead>
              <tbody>
                {topRecyclers.map((r,i)=> (
                  <tr key={r.city} className={i===0? 'champion':''}>
                    <td className="rank">{i+1}</td>
                    <td className="cityname">{r.city}</td>
                    <td className="rate">{r.rate ? r.rate.toFixed(1) : '—'}</td>
                    <td className="volume">{Math.round(r.recycled).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card landfill-card">
            <div className="landfill-inner">
              <div className="landfill-icon">🗑️</div>
              <div className="landfill-text">
                <h3 className="landfill-title">Landfill total — Inde</h3>
                <div className="landfill-number">87 000 000&nbsp;tonnes de déchets actuellement en décharge en Inde (CPCB 2022)</div>
                <div className="landfill-meta">Sites actifs : 1 356 décharges (2023) — ≈ 41 000&nbsp;t / jour</div>
              </div>
            </div>
          </div>
        </div>

        <div className="overview-right">
          <div className="card chart-card area-card"><h4>Evolution annuelle des déchets (Inde)</h4><svg ref={areaRef} className="area-svg" /></div>
          <div className="card small-row">
            <div className="chart-card donut-card"><h4>Répartition par type</h4><svg ref={donutRef} className="donut-svg" /></div>
            <div className="chart-card bar-card"><h4>Top 10 — Villes (bar)</h4><svg ref={barRef} className="bar-svg" /></div>
          </div>
          <div className="card chart-card radar-card">
            <h4>Scores nationaux — Indicateurs</h4>
            <div className="radar-chart-area">
              <svg ref={scatterRef} className="scatter-svg" />
              <div ref={scatterTipRef} className="scatter-tooltip" style={{display:'none'}} />
              <div className="scatter-legend" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* Simple D3 renderers (kept compact) */
function drawArea(node, totals){
  if(!node) return
  const svg = d3.select(node)
  const w = Math.max(120, node.parentElement.clientWidth || 120)
  const h = 180
  svg.selectAll('*').remove(); svg.attr('width', w).attr('height', h)
  const margin = {left:50, right:50, top:12, bottom:28}
  const innerW = w - margin.left - margin.right
  const innerH = h - margin.top - margin.bottom
  const x = d3.scalePoint().domain(totals.map(d=>d.year)).range([0, innerW])
  const y = d3.scaleLinear().domain([0, d3.max(totals, d=>d.total)||1]).range([innerH,0])
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)
  const area = d3.area().x(d=>x(d.year)).y0(innerH).y1(d=>y(d.total)).curve(d3.curveMonotoneX)
  g.append('path').datum(totals).attr('d', area).attr('fill','url(#gradArea)')
  const defs = svg.append('defs')
  const grad = defs.append('linearGradient').attr('id','gradArea').attr('x1','0').attr('x2','0').attr('y1','0').attr('y2','1')
  grad.append('stop').attr('offset','0%').attr('stop-color', 'var(--chart-2)').attr('stop-opacity',0.9)
  grad.append('stop').attr('offset','100%').attr('stop-color', 'var(--chart-4)').attr('stop-opacity',0.18)
  // axes
  g.append('g').attr('transform', `translate(0,${innerH})`).call(d3.axisBottom(x))
  g.append('g').call(d3.axisLeft(y).ticks(4))
}

function drawDonut(node, items){
  if(!node) return
  const svg = d3.select(node); svg.selectAll('*').remove()
  const w = 220, h = 220, r = Math.min(w,h)/2 - 6
  svg.attr('width', w).attr('height', h)
  const g = svg.append('g').attr('transform', `translate(${w/2},${h/2})`)
  const pie = d3.pie().value(d=>d.val).sort(null)
  const arc = d3.arc().innerRadius(r*0.56).outerRadius(r)
  g.selectAll('path').data(pie(items)).join('path').attr('d', arc).attr('fill', (d,i)=>`var(--chart-${(i%10)+1})`).style('opacity',0.95)
}

function drawBar(node, rows){
  if(!node) return
  const svg = d3.select(node); svg.selectAll('*').remove()
  const w = Math.max(360, node.parentElement.clientWidth || 420), h = Math.max(300, rows.length*28+40)
  svg.attr('width', w).attr('height', h)
  const margin = {left:140, right:20, top:12, bottom:24}
  const innerW = w - margin.left - margin.right, innerH = h - margin.top - margin.bottom
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)
  const x = d3.scaleLinear().domain([0, d3.max(rows, d=>d.total)||1]).range([0, innerW])
  const y = d3.scaleBand().domain(rows.map(d=>d.city)).range([0, innerH]).padding(0.12)
  g.selectAll('rect').data(rows).join('rect').attr('y', d=>y(d.city)).attr('x',0).attr('height', y.bandwidth()).attr('width', d=>x(d.total)).attr('fill', (d,i)=> i===0? 'var(--chart-1)': 'var(--chart-3)')
  g.selectAll('.lab').data(rows).join('text').attr('class','lab').attr('x', d=>-8).attr('y', d=> y(d.city)+ y.bandwidth()/2).attr('dy','0.35em').attr('text-anchor','end').text(d=>d.city).attr('fill', 'var(--text-primary)')
}

function drawScatter(svgNode, tipNode, points){
  if(!svgNode || !points) return
  const wrapper = svgNode.parentElement
  const width = (wrapper && wrapper.clientWidth) ? wrapper.clientWidth : (svgNode.clientWidth || 420)
  const height = 300
  const margin = { top: 5, right: 2, bottom: 42, left: 56 }
  const w = width - margin.left - margin.right
  const h = height - margin.top - margin.bottom

  const svg = d3.select(svgNode)
  svg.selectAll('*').remove()
  // make SVG responsive: set viewBox and let CSS control width
  svg.attr('viewBox', `0 0 ${width} ${height}`).attr('preserveAspectRatio','xMidYMid meet')
  svg.style('width','100%').style('height','auto')
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  const xMax = d3.max(points, d=>d.populationDensity) || 1
  const yMax = d3.max(points, d=>d.totalGenerated) || 1
  const costExtent = d3.extent(points, d=>d.avgCost)

  const x = d3.scaleLinear().domain([0, xMax*1.06]).range([0, w]).nice()
  const y = d3.scaleLinear().domain([0, yMax*1.06]).range([h, 0]).nice()

  // palette: prefer CSS vars --chart-1..5
  const defaultPalette = ['#B99BFF','#7FC8A0','#8AD1FF','#F6D87A','#9EA0B8']
  const cssVars = typeof window !== 'undefined' && window.getComputedStyle ? window.getComputedStyle(document.documentElement) : null
  const palette = []
  for(let i=1;i<=5;i++){ const v = cssVars ? cssVars.getPropertyValue(`--chart-${i}`) : ''; palette.push((v && v.trim()) || defaultPalette[i-1]) }

  const types = Array.from(new Set(points.map(d=>d.primaryType)))
  const color = d3.scaleOrdinal().domain(types).range(palette)

  const rScale = d3.scaleSqrt().domain([costExtent[0]||0, costExtent[1]||1]).range([3, 14])

  // axes
  g.append('g').attr('transform', `translate(0,${h})`).call(d3.axisBottom(x).ticks(Math.max(3, Math.min(6, Math.floor(w/100))))).selectAll('text').attr('fill','var(--text-muted)')
  g.append('g').call(d3.axisLeft(y).ticks(5)).selectAll('text').attr('fill','var(--text-muted)')
  g.append('text').attr('x', w/2).attr('y', h + 36).attr('text-anchor','middle').attr('fill','var(--text-muted)').text('Population Density (people/km²)')
  g.append('text').attr('transform','rotate(-90)').attr('x', -h/2).attr('y', -42).attr('text-anchor','middle').attr('fill','var(--text-muted)').text('Total Waste Generated (Tons/Day)')

  // points
  const pts = g.selectAll('.pt').data(points).join('circle')
    .attr('class','pt')
    .attr('cx', d=> x(d.populationDensity))
    .attr('cy', d=> y(d.totalGenerated))
    .attr('r', d=> Math.max(2, rScale(d.avgCost)))
    .attr('fill', d=> color(d.primaryType))
    .attr('stroke','#fff').attr('stroke-width',0.8).attr('opacity',0.95)

  const tip = d3.select(tipNode)
  pts.on('mouseover', function(event,d){
    tip.style('display','block')
    tip.html(`<div class="tip-title">${d.city}</div><div>Type: <strong style="color:${color(d.primaryType)}">${d.primaryType}</strong></div><div>Density: <strong>${Math.round(d.populationDensity)}</strong></div><div>Waste: <strong>${d3.format(',')(Math.round(d.totalGenerated))} t</strong></div><div>Cost: <strong>${d3.format(',')(Math.round(d.avgCost))}</strong></div>`)
    tip.classed('show', true)
    const [mx,my] = d3.pointer(event, wrapper)
    const left = Math.min(Math.max(8, mx + 12), Math.max(8, wrapper.clientWidth - 180))
    const top = Math.max(8, my + 6)
    tip.style('left', `${left}px`).style('top', `${top}px`)
    d3.select(this).raise().transition().duration(140).attr('r', Math.min(28, (rScale(d.avgCost)||4) + 4))
  }).on('mousemove', function(event){ const [mx,my] = d3.pointer(event, wrapper); const left = Math.min(Math.max(8, mx + 12), Math.max(8, wrapper.clientWidth - 180)); const top = Math.max(8, my + 6); tip.style('left', `${left}px`).style('top', `${top}px`) })
    .on('mouseout', function(event,d){ tip.classed('show', false); setTimeout(()=> tip.style('display','none'), 160); d3.select(this).transition().duration(120).attr('r', Math.max(2, rScale(d.avgCost))) })

  // simple legend
  const legend = d3.select(wrapper).select('.scatter-legend')
  legend.html('')
  const legItems = legend.selectAll('.leg').data(types).join('div').attr('class','leg')
  legItems.append('span').attr('class','sw').style('background', d=> color(d))
  legItems.append('span').attr('class','lbl').text(d=>d)
}
