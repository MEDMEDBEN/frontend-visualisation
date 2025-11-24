import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import '../styles/ScatterPlotIndian.css'

export default function ScatterPlotIndian({ className }){
  const [data, setData] = useState([])
  const [cities, setCities] = useState([])
  const svgRef = useRef()
  const wrapperRef = useRef()

  useEffect(()=>{
    d3.csv('/Indian.csv', d => ({
      city: d['City/District'],
      type: d['Waste Type'],
      value: +d['Waste Generated (Tons/Day)'] || 0,
      recyclingRate: +d['Recycling Rate (%)'] || 0,
      populationDensity: +d['Population Density (People/km²)'] || +d['Population Density (People/km)'] || 0,
      cost: +d['Cost of Waste Management (₹/Ton)'] || +d['Cost of Waste Management (Rs/ton)'] || 0,
      year: +d['Year']
    })).then(rows=>{
      setData(rows)
      const cityList = Array.from(new Set(rows.map(r=>r.city))).sort()
      setCities(['All Cities', ...cityList])
    }).catch(err=>console.error('Failed to load CSV', err))
  },[])

  useEffect(()=>{
    if(!data || data.length===0) return

    // aggregate per city
    const byCity = d3.rollups(
      data,
      v=>{
        const totalGenerated = d3.sum(v, d=>d.value)
        // populationDensity: take mean (if multiple rows)
        const pop = d3.mean(v, d=>d.populationDensity) || 0
        const avgCost = d3.mean(v, d=>d.cost) || 0
        // primary type: type with max generated volume
        const byType = d3.rollups(v, vv=>d3.sum(vv, d=>d.value), d=>d.type)
        const primary = byType.sort((a,b)=>b[1]-a[1])[0]
        const primaryType = primary ? primary[0] : 'Unknown'
        return { totalGenerated, populationDensity: pop, avgCost, primaryType }
      },
      d=>d.city
    )

    const points = byCity.map(([city, vals])=>({ city, ...vals }))
    drawScatter(svgRef.current, wrapperRef.current, points)
  },[data])

  return (
    <div className={`scatter-card ${className||''}`} ref={wrapperRef}>
      <div className="scatter-header">
        <h2 className="scatter-title">Population Density vs Waste Generated</h2>
      </div>
      <svg ref={svgRef} className="scatter-svg" />

      <div className="scatter-legend">
        <div className="legend-colors"><strong>Primary Type</strong></div>
        <div className="legend-sizes"><strong>Cost scale</strong></div>
      </div>

      <div className="scatter-tooltip" style={{display:'none'}} />
    </div>
  )
}

function drawScatter(svgNode, wrapperNode, points){
  const margin = { top: 24, right: 18, bottom: 56, left: 72 }
  const containerWidth = wrapperNode ? wrapperNode.clientWidth : 900
  const width = Math.min(1100, Math.max(520, containerWidth * 0.5)) - margin.left - margin.right
  const height = 260 - margin.top - margin.bottom

  const svg = d3.select(svgNode)
  svg.selectAll('*').remove()
  svg.attr('width', width + margin.left + margin.right).attr('height', height + margin.top + margin.bottom)
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  // scales
  const xExtent = d3.extent(points, d=>d.populationDensity)
  const x = d3.scaleLinear().domain([Math.max(0, xExtent[0] || 0), (xExtent[1] || 1) * 1.05]).range([0, width]).nice()
  const yExtent = d3.extent(points, d=>d.totalGenerated)
  const y = d3.scaleLinear().domain([0, (yExtent[1] || 1) * 1.05]).range([height, 0]).nice()

  // color by primaryType
  const types = Array.from(new Set(points.map(d=>d.primaryType)))
  const color = d3.scaleOrdinal().domain(types).range(d3.schemeCategory10)

  // size by avgCost
  const costExtent = d3.extent(points, d=>d.avgCost)
  const size = d3.scaleSqrt().domain([costExtent[0]||0, costExtent[1]||1]).range([5,20])

  // axes
  g.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x))
  g.append('g').call(d3.axisLeft(y))
  // axis labels
  g.append('text').attr('x', width/2).attr('y', height + 44).attr('text-anchor','middle').attr('fill','#234b35').text('Population Density (People/km²)')
  g.append('text').attr('transform', 'rotate(-90)').attr('x', -height/2).attr('y', -54).attr('text-anchor','middle').attr('fill','#234b35').text('Total Waste Generated (Tons/Day)')

  // points group
  const ptGroup = g.append('g').attr('class','points')

  const circles = ptGroup.selectAll('circle').data(points, d=>d.city).join(
    enter => enter.append('circle').attr('cx', d=>x(d.populationDensity)).attr('cy', d=>y(d.totalGenerated)).attr('r',0).attr('fill', d=>color(d.primaryType)).attr('opacity',0),
    update => update,
    exit => exit.remove()
  )

  // animate position/appearance
  circles.transition().duration(700).attr('cx', d=>x(d.populationDensity)).attr('cy', d=>y(d.totalGenerated)).attr('r', d=>size(d.avgCost)).attr('opacity',1).ease(d3.easeCubicOut)

  // tooltip behavior
  circles.on('mouseover', function(e,d){
    const tip = d3.select(wrapperNode).select('.scatter-tooltip')
    tip.style('display','block')
    tip.html(`<strong>${d.city}</strong><br/>Density: ${Math.round(d.populationDensity)}<br/>Generated: ${d3.format(',')(Math.round(d.totalGenerated))}<br/>Cost: ${d3.format(',')(Math.round(d.avgCost))}<br/>Type: ${d.primaryType}`)
    tip.classed('show', true)
    const [mx,my] = d3.pointer(e, wrapperNode)
    tip.style('left', `${mx+14}px`).style('top', `${my+10}px`)
  }).on('mousemove', function(e){ const tip = d3.select(wrapperNode).select('.scatter-tooltip'); const [mx,my] = d3.pointer(e, wrapperNode); tip.style('left', `${mx+14}px`).style('top', `${my+10}px`) })
    .on('mouseout', function(){ const tip = d3.select(wrapperNode).select('.scatter-tooltip'); tip.classed('show', false); setTimeout(()=> tip.style('display','none'), 140) })

  // legend for color (types)
  const legend = svg.append('g').attr('transform', `translate(${margin.left + 8}, ${8})`)
  const legItems = legend.selectAll('.leg-item').data(types).join('g').attr('class','leg-item').attr('transform', (d,i)=>`translate(${i*110},0)`)
  legItems.append('rect').attr('width',12).attr('height',12).attr('fill', d=>color(d)).attr('rx',3)
  legItems.append('text').attr('x',18).attr('y',10).text(d=>d).attr('fill','#234b35').attr('font-size',12)

  // legend for size (cost) – simple linear icons
  const sizeLegendX = width - 150
  const sizeLegend = svg.append('g').attr('transform', `translate(${margin.left + sizeLegendX}, ${8})`)
  const sampleCosts = [costExtent[0]||0, (costExtent[0]||0 + costExtent[1]||1)/2, costExtent[1]||1]
  sizeLegend.selectAll('circle').data(sampleCosts).join('circle').attr('cx', (d,i)=> i*36).attr('cy',6).attr('r', d=> size(d)).attr('fill','#9fbf9f').attr('opacity',0.9)
  sizeLegend.append('text').attr('x',0).attr('y',28).text('Cost scale').attr('fill','#234b35').attr('font-size',12)
}
