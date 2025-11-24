import React, { useEffect, useRef, useState, useContext } from 'react'
import * as d3 from 'd3'
import '../styles/GaugeChartLandfillIndian.css'
import { CityContext } from '../context/CityContext'

export default function GaugeChartLandfillIndian(){
  const { data, selectedCity } = useContext(CityContext)
  const [stats, setStats] = useState({ generated:0, capacity:1, pct:0 })
  const svgRef = useRef()
  const tooltipRef = useRef()
  // compute stats for the currently-selected city from CityContext
  useEffect(()=>{
    if(!data || data.length===0 || !selectedCity) return
    const rows = data.filter(r=>r.city === selectedCity)
    if(rows.length === 0){ setStats({generated:0, capacity:1, pct:0}); return }
    // prefer latest year per city
    const years = Array.from(new Set(rows.map(r=>r.year))).filter(y=>!!y)
    const targetYear = years.length ? Math.max(...years) : null
    const filtered = targetYear ? rows.filter(r=>r.year === targetYear) : rows

    const generated = d3.sum(filtered, d=>d.value)
    // capacity logic: group by landfill and take max per landfill, then sum
    const grouped = d3.group(filtered, d=>d.landfill)
    let capacity = 0
    grouped.forEach((groupRows, lname) => {
      const maxCap = d3.max(groupRows, r=>r.landfillCapacity) || 0
      capacity += maxCap
    })
    if(capacity <= 0) capacity = 1
    const pct = (generated / capacity) * 100
    setStats({ generated, capacity, pct })
  },[data, selectedCity])

  // draw gauge when stats change
  useEffect(()=>{
    drawGauge(svgRef.current, tooltipRef.current, stats)
  },[stats])

  return (
    <div className="gauge-card">
      <div className="gauge-header">
        <h3>Occupation des décharges</h3>
        <p className="gauge-sub">Taux = (Waste Generated) / (Landfill Capacity)</p>
      </div>
      <div className="gauge-body">
        <div className="gauge-area">
          <svg ref={svgRef} className="gauge-svg" />
          <div ref={tooltipRef} className="gauge-tooltip" style={{opacity:0}} />
        </div>
      </div>
    </div>
  )
}

function drawGauge(svgNode, tooltipNode, stats){
  if(!svgNode) return
  const svg = d3.select(svgNode)
  const width = Math.min(700, Math.max(320, svgNode.parentElement.clientWidth || 320))
  const height = Math.floor(width * 0.3)
  svg.selectAll('*').remove()
  svg.attr('width', width).attr('height', height)

  const cx = width/2
  const cy = height*0.6
  const radius = Math.min(width, height) * 0.42

  const startAngle = -Math.PI/2
  const endAngle = Math.PI/2

  const arc = d3.arc().innerRadius(radius*0.68).outerRadius(radius).startAngle(d=>d.start).endAngle(d=>d.end)

  // color zones
  const zones = [ {t:0, end:60, color:'#2b8a3e'}, {t:60, end:85, color:'#e0b21c'}, {t:85, end:100, color:'#c73a3a'} ]
  const zoneData = zones.map(z => ({ start: startAngle + (endAngle-startAngle)*(z.t/100), end: startAngle + (endAngle-startAngle)*(Math.min(z.end,100)/100), color: z.color }))

  const g = svg.append('g')

  // draw zones
  g.selectAll('.zone').data(zoneData).join('path')
    .attr('class','zone')
    .attr('d', arc)
    .attr('transform', `translate(${cx},${cy})`)
    .attr('fill', d=>d.color)

  // ticks
  const ticks = d3.range(0, 101, 10)
  const tickGroup = svg.append('g')
  tickGroup.selectAll('line').data(ticks).join('line')
    .attr('x1', d=> cx + (radius*0.72) * Math.cos(startAngle + (endAngle-startAngle)*(d/100)))
    .attr('y1', d=> cy + (radius*0.72) * Math.sin(startAngle + (endAngle-startAngle)*(d/100)))
    .attr('x2', d=> cx + (radius*0.92) * Math.cos(startAngle + (endAngle-startAngle)*(d/100)))
    .attr('y2', d=> cy + (radius*0.92) * Math.sin(startAngle + (endAngle-startAngle)*(d/100)))
    .attr('stroke','#fff').attr('stroke-width',1)

  // needle
  const pct = Math.max(0, stats && stats.pct ? stats.pct : 0)
  const clampedPct = Math.min(pct, 200) // allow over 100% but clamp visual
  const angleForPct = startAngle + (endAngle - startAngle) * (clampedPct/100)

  const needleLen = radius * 0.92
  const needle = svg.append('g').attr('class','needle-group').attr('transform', `translate(${cx},${cy})`)
  needle.append('line').attr('class','needle-line').attr('x1',0).attr('y1',0).attr('x2', needleLen * Math.cos(angleForPct)).attr('y2', needleLen * Math.sin(angleForPct)).attr('stroke','#333').attr('stroke-width',4).attr('stroke-linecap','round')
  needle.append('circle').attr('class','needle-hub').attr('cx',0).attr('cy',0).attr('r',6).attr('fill','#333')

  // percentage text
  svg.append('text').attr('x', cx).attr('y', cy - radius*0.24).attr('text-anchor','middle').attr('class','gauge-percent').text(`${clampedPct.toFixed(1)}%`)

  // animate needle from previous position if present
  // We'll store previous angle in DOM node dataset
  const prev = svgNode.dataset.prevAngle ? Number(svgNode.dataset.prevAngle) : startAngle
  svgNode.dataset.prevAngle = angleForPct
  const interp = d3.interpolateNumber(prev, angleForPct)
  d3.select(needle.node()).transition().duration(900).tween('rotate', () => t => {
    const a = interp(t)
    const x2 = needleLen * Math.cos(a)
    const y2 = needleLen * Math.sin(a)
    needle.select('.needle-line').attr('x2', x2).attr('y2', y2)
  })

  
}
