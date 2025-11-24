import React, { useEffect, useRef, useState, useContext } from 'react'
import * as d3 from 'd3'
import '../styles/RadarChartMunicipalIndian.css'
import { CityContext } from '../context/CityContext'

export default function RadarChartMunicipalIndian(){
  const [data, setData] = useState([])
  const [cities, setCities] = useState([])
  const { selectedCity } = useContext(CityContext)
  const [selectedCities, setSelectedCities] = useState([]) // up to 3; will always include `selectedCity` when available
  const wrapperRef = useRef()
  const svgRef = useRef()
  const tooltipRef = useRef()

  // palette available to JSX (prefer CSS vars --chart-1..--chart-5)
  const defaultPalette =['#25af23','#ff9aa2','#fc9e12']
  const cssVars = typeof window !== 'undefined' && window.getComputedStyle ? window.getComputedStyle(document.documentElement) : null
  const basePalette = []
  for(let i=1;i<=5;i++){ const v = cssVars ? cssVars.getPropertyValue(`--chart-${i}`) : ''; basePalette.push((v && v.trim()) || defaultPalette[i-1]) }

  // metric configuration: key in parsed row -> label to show on axis
  const metrics = [
    { key: 'municipalScore', label: 'Municipal Efficiency (1-10)' },
    { key: 'recyclingRate', label: 'Recycling Rate (%)' },
    { key: 'populationDensity', label: 'Population Density' },
    { key: 'cost', label: 'Cost (₹/Ton)' },
    { key: 'campaigns', label: 'Awareness Campaigns' },
    { key: 'value', label: 'Waste Generated (Tons/Day)' },
    { key: 'landfillCapacity', label: 'Landfill Capacity (Tons)' }
  ]

  // load CSV and parse same fields used elsewhere in the project
  useEffect(()=>{
    d3.csv('/Indian.csv', d => ({
      city: d['City/District'],
      type: d['Waste Type'],
      value: +d['Waste Generated (Tons/Day)'] || 0,
      recyclingRate: +d['Recycling Rate (%)'] || 0,
      populationDensity: +d['Population Density (People/km²)'] || 0,
      municipalScore: +d['Municipal Efficiency Score (1-10)'] || 0,
      disposal: d['Disposal Method'],
      cost: +d['Cost of Waste Management (₹/Ton)'] || 0,
      campaigns: +d['Awareness Campaigns Count'] || 0,
      landfillCapacity: +d['Landfill Capacity (Tons)'] || 0,
      year: +(d['Year'] || 0)
    })).then(rows=>{
      setData(rows)
      const cityList = Array.from(new Set(rows.map(r=>r.city))).sort()
      setCities(cityList)
      // if a selectedCity is already provided from context, ensure it's included in selection
      if(selectedCity){
        setSelectedCities(prev => {
          const next = Array.from(new Set([selectedCity, ...(prev||[])]))
          // keep at most 3, prefer keeping selectedCity
          if(next.length > 3){
            // remove extras from the end, but keep selectedCity at front
            return [next[0], ...next.slice(1,3)]
          }
          return next
        })
      }
    }).catch(err=>console.error('Failed to load Indian.csv', err))
  },[])

  // helper: compute per-city metric snapshot (latest year).
  const computeCitySnapshots = () => {
    if(!data || data.length===0) return new Map()
    const rowsByCity = d3.group(data, d=>d.city)
    const cityMap = new Map()
    rowsByCity.forEach((rows, city) => {
      // find latest year available for this city
      const years = Array.from(new Set(rows.map(r=>r.year))).filter(y=>!!y)
      const targetYear = years.length ? Math.max(...years) : null
      const filtered = targetYear ? rows.filter(r=>r.year === targetYear) : rows

      // rules: for totals (value, landfillCapacity, campaigns) use sum; for others use mean
      const sumKeys = new Set(['value','landfillCapacity','campaigns'])
      const snapshot = {}
      metrics.forEach(m => {
        const vals = filtered.map(r => +r[m.key] || 0)
        if(vals.length === 0) snapshot[m.key] = 0
        else if(sumKeys.has(m.key)) snapshot[m.key] = d3.sum(vals)
        else snapshot[m.key] = d3.mean(vals)
      })
      cityMap.set(city, { year: targetYear, values: snapshot })
    })
    return cityMap
  }

  // draw radar when data or selection changes
  // Keep selectedCity always present in `selectedCities` whenever it changes
  useEffect(()=>{
    if(!selectedCity) return
    setSelectedCities(prev => {
      const prevList = prev || []
      if(prevList.includes(selectedCity)) return prevList
      // prepend selectedCity so it appears first in legend/plot
      const next = [selectedCity, ...prevList]
      // limit to 3 entries
      return next.slice(0,3)
    })
  },[selectedCity])

  useEffect(()=>{
    const citySnapshots = computeCitySnapshots()
    drawRadar(svgRef.current, wrapperRef.current, tooltipRef.current, metrics, citySnapshots, selectedCities)
    // redraw on window resize
    const onResize = () => drawRadar(svgRef.current, wrapperRef.current, tooltipRef.current, metrics, citySnapshots, selectedCities)
    window.addEventListener('resize', onResize)
    return ()=> window.removeEventListener('resize', onResize)
  },[data, selectedCities, selectedCity])

  const toggleCity = (city) => {
    setSelectedCities(prev => {
      const list = prev || []
      const has = list.includes(city)
      // do not allow removing the city selected in CityPanel
      if(city === selectedCity){
        return list
      }
      if(has){
        // remove this city
        return list.filter(c => c !== city)
      }
      // adding: ensure max 3 entries (including selectedCity)
      if(list.length >= 3) return list
      return [...list, city]
    })
  }

  return (
    <div className="radar-card" ref={wrapperRef}>
      <div className="radar-header">
        <h2>Comparaison Municipale — Radar</h2>
        <p className="radar-sub">Sélectionnez jusqu'à 3 villes pour les comparer</p>
      </div>

      <div className="radar-body">
        <div className="radar-controls" aria-label="Sélection des villes">
          <div className="radar-controls-inner">
            {cities.map(city => {
              // the city chosen in CityPanel must always be present and cannot be unchecked by user here
              const isPanelCity = selectedCity === city
              const checked = selectedCities.includes(city)
              const disabled = isPanelCity || (!checked && selectedCities.length >= 3)
              return (
                <label key={city} className={`city-checkbox ${disabled ? 'disabled' : ''}`}>
                  <input type="checkbox" checked={checked} disabled={disabled} onChange={()=>toggleCity(city)} />
                  <span className="city-name">{city}{isPanelCity ? ' (sélectionnée)' : ''}</span>
                </label>
              )
            })}
          </div>
        </div>

        <div className="radar-area">
          <svg ref={svgRef} className="radar-svg" />
          <div ref={tooltipRef} className="radar-tooltip" style={{opacity:0}} />
          <div className="radar-legend">
            {selectedCities.map((c,i)=> (
              <div key={c} className="legend-item">
                <span className="legend-swatch" style={{background: defaultPalette[i % defaultPalette.length]}} />
                <span className="legend-label">{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function drawRadar(svgNode, wrapperNode, tooltipNode, metrics, citySnapshots, selectedCities){
  if(!svgNode || !wrapperNode) return
  const svg = d3.select(svgNode)
  // sanitize wrapper sizes: ensure we have valid numeric widths (fallback to 360)
  const rawClientWidth = Number(wrapperNode && wrapperNode.clientWidth) || 360
  const width = Math.min(800, Math.max(360, rawClientWidth - 24))
  const rawHeightCandidate = Math.floor(width * 0.6)
  const height = Math.min(700, Math.max(360, Number(rawHeightCandidate) || 360))
  svg.selectAll('*').remove()
  svg.attr('width', width).attr('height', height)

  const cx = width/2
  const cy = height/2
  // ensure outerRadius is always a positive number
  const outerRadius = Math.abs(Math.min(width, height) * 0.38)

  // prepare per-metric max for normalization
  const metricMax = {}
  metrics.forEach(m => {
    let maxVal = 0
    citySnapshots.forEach((v) => {
      const val = (v.values && +v.values[m.key]) || 0
      if(val > maxVal) maxVal = val
    })
    // avoid zero or negative maxima to prevent negative radii
    metricMax[m.key] = (maxVal > 0 ? maxVal : 1)
  })

  const angleSlice = (Math.PI * 2) / metrics.length

  const g = svg.append('g')

  // grid: concentric rings
  const levels = 5
  for(let level=levels; level>0; level--){
    const r = outerRadius * (level/levels)
    g.append('circle')
      .attr('cx', cx).attr('cy', cy).attr('r', r)
      .attr('class','grid-circle')
  }

  // axis lines and labels
  const axisGroup = g.append('g').attr('class','axes')
  metrics.forEach((m, i) => {
    const angle = i * angleSlice - Math.PI/2
    const x = cx + outerRadius * Math.cos(angle)
    const y = cy + outerRadius * Math.sin(angle)
    axisGroup.append('line')
      .attr('x1', cx).attr('y1', cy).attr('x2', x).attr('y2', y)
      .attr('class','axis-line')

    // label placement slightly beyond outer radius
    const lx = cx + (outerRadius + 18) * Math.cos(angle)
    const ly = cy + (outerRadius + 18) * Math.sin(angle)
    axisGroup.append('text')
      .attr('x', lx).attr('y', ly)
      .attr('class','axis-label')
      .attr('text-anchor', Math.cos(angle) > 0.1 ? 'start' : Math.cos(angle) < -0.1 ? 'end' : 'middle')
      .text(m.label)
  })

  // helper to compute points for a city
  const computePoints = (city) => {
    const snap = citySnapshots.get(city)
    const vals = metrics.map((m, i) => {
      const raw = snap && snap.values && +snap.values[m.key] || 0
      const norm = raw / (metricMax[m.key] || 1)
      const r = norm * outerRadius
      const angle = i * angleSlice - Math.PI/2
      return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), value: raw, key: m.key, label: m.label }
    })
    return vals
  }

  // draw for each selected city
  const container = g.append('g').attr('class','radar-container')
  // prepare palette: prefer CSS variables --chart-1..--chart-5, fallback to defaults
  const defaultPalette = ['#25af23','#ff9aa2','#fc9e12']
  const cssVars = typeof window !== 'undefined' && window.getComputedStyle ? window.getComputedStyle(document.documentElement) : null
  const basePalette = []
  for(let i=1;i<=5;i++){ const v = cssVars ? cssVars.getPropertyValue(`--chart-${i}`) : ''; basePalette.push((v && v.trim()) || defaultPalette[i-1]) }

  selectedCities.forEach((city, idx) => {
    const color = defaultPalette[idx % defaultPalette.length]
    const pts = computePoints(city)
    const line = d3.line().x(d=>d.x).y(d=>d.y).curve(d3.curveLinearClosed)

    const group = container.append('g').attr('class','city-group').attr('data-city', city)
    // polygon background
    const poly = group.append('path')
      .attr('d', line(pts))
      .attr('fill', d3.interpolateRgb(color, '#ffffff')(0.14))
      .attr('fill-opacity', 0.6)
      .attr('stroke', d3.color(color).darker(0.6))
      .attr('stroke-width', 2)
      .attr('transform', `scale(0)`)
      .style('transform-origin', `${cx}px ${cy}px`)
      .style('transition', 'transform 600ms ease, opacity 600ms ease')
      .attr('opacity', 0)

    // animate in
    setTimeout(()=>{
      poly.attr('opacity',1).attr('transform', `scale(1)`)
    }, 30)

    // vertices
    const verts = group.selectAll('.vertex').data(pts).join('circle')
      .attr('class','vertex')
      .attr('cx', d=>d.x).attr('cy', d=>d.y).attr('r', 4)
      .attr('fill', '#fff').attr('stroke', color).attr('stroke-width', 1.8)

    // interactive tooltip on vertices
    verts.on('mouseenter', function(event, d){
      const tt = d3.select(tooltipNode)
      tt.html(`<strong>${city}</strong><div>${d.label}: ${Number(d.value).toLocaleString()}</div>`)
      tt.style('opacity',1).style('left', (event.pageX + 8) + 'px').style('top', (event.pageY + 8) + 'px')
    }).on('mousemove', function(event){
      const tt = d3.select(tooltipNode)
      tt.style('left', (event.pageX + 8) + 'px').style('top', (event.pageY + 8) + 'px')
    }).on('mouseleave', function(){
      d3.select(tooltipNode).style('opacity',0)
    })
  })

  // small caption if no city selected
  if(selectedCities.length === 0){
    svg.append('text').attr('x', cx).attr('y', cy).attr('text-anchor','middle').attr('class','radar-empty').text('Sélectionnez jusqu\'à 3 villes à gauche')
  }
}
