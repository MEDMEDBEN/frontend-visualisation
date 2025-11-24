import React, { useEffect, useRef, useState, useContext } from 'react'
import * as d3 from 'd3'
import '../styles/HeatmapIndian.css'
import { CityContext } from '../context/CityContext'

export default function HeatmapIndian(){
  const { data, selectedCity } = useContext(CityContext)
  const svgRef = useRef()
  const wrapperRef = useRef()


  useEffect(()=>{
    if(!data || data.length===0 || !selectedCity) return
    const filtered = data.filter(d=>d.city === selectedCity)

    // years and types
    const years = Array.from(new Set(filtered.map(d=>d.year))).sort((a,b)=>a-b)
    const types = Array.from(new Set(filtered.map(d=>d.type))).sort()

    // build aggregation map: key = year|type -> sum
    const sumMap = new Map()
    filtered.forEach(d=>{
      const key = `${d.year}|${d.type}`
      sumMap.set(key, (sumMap.get(key)||0) + d.value)
    })

    // matrix entries: for each type (y) and year (x)
    const matrix = []
    types.forEach((t,i)=>{
      years.forEach((y)=>{
        matrix.push({ year: y, type: t, value: sumMap.get(`${y}|${t}`) || 0 })
      })
    })

    drawHeatmap(svgRef.current, wrapperRef.current, { years, types, matrix })
  },[data, selectedCity])

  return (
    <div className="heat-card" ref={wrapperRef}>
      <div className="heat-header">
        <h3 className="heat-title">Heatmap — Generated Waste by Type & Year</h3>
      </div>

      <svg ref={svgRef} className="heat-svg" />

      <div className="heat-legend" aria-hidden />
      <div className="heat-tooltip" style={{display:'none'}} />
    </div>
  )
}

function drawHeatmap(svgNode, wrapperNode, { years, types, matrix }){
  const margin = { top: 40, right: 40, bottom: 80, left: 140 }
  const containerWidth = wrapperNode ? wrapperNode.clientWidth : 900
  const width = Math.min(500, Math.max(520, containerWidth * 0.95)) - margin.left - margin.right
  const cellSize = Math.max(28, Math.floor(width / Math.max(1, years.length)))
  const height = types.length * cellSize

  const svg = d3.select(svgNode)
  svg.selectAll('*').remove()
  svg.attr('width', width + margin.left + margin.right).attr('height', height + margin.top + margin.bottom)

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  // use zero padding so cells touch and form a continuous surface
  const x = d3.scaleBand().domain(years).range([0, width]).paddingInner(0).paddingOuter(0)
  const y = d3.scaleBand().domain(types).range([0, height]).paddingInner(0).paddingOuter(0)

  // color scale continuous
  const values = matrix.map(d=>d.value)
  const vmin = d3.min(values) || 0
  const vmax = d3.max(values) || 1
  const color =  d3.scaleSequential()
  .domain([vmin, vmax])
  .interpolator(t => {
    return d3.interpolateRgbBasis([
      "#3AAFA9",  // turquoise (low)
      "#7FDBB6",  // light green
      "#F6D55C",  // soft yellow
      "#ED553B"   // coral (high)
    ])(t)
  })


  // cells
  const cells = g.selectAll('.cell').data(matrix).join('rect')
    .attr('class','cell')
    // overlap slightly to avoid subpixel gaps in some browsers
    .attr('x', d=> x(d.year) - 0.5)
    .attr('y', d=> y(d.type) - 0.5)
    .attr('width', Math.ceil(x.bandwidth()) + 1)
    .attr('height', Math.ceil(y.bandwidth()) + 1)
    .attr('rx',0)
    .attr('fill', d => color(d.value))
    .style('opacity', 0)
    .on('mouseover', function(e,d){
      const tip = d3.select(wrapperNode).select('.heat-tooltip')
      tip.style('display','block')
      tip.html(`<strong>Year:</strong> ${d.year}<br/><strong>Type:</strong> ${d.type}<br/><strong>Value:</strong> ${d3.format(',')(d.value)}`)
      const [mx,my] = d3.pointer(e, wrapperNode)
      tip.style('left', `${mx+14}px`).style('top', `${my+10}px`).classed('show', true)
    })
    .on('mousemove', function(e){
      const tip = d3.select(wrapperNode).select('.heat-tooltip')
      const [mx,my] = d3.pointer(e, wrapperNode)
      tip.style('left', `${mx+14}px`).style('top', `${my+10}px`)
    })
    .on('mouseout', function(){
      const tip = d3.select(wrapperNode).select('.heat-tooltip')
      tip.classed('show', false)
      setTimeout(()=> tip.style('display','none'), 180)
    })

  // fade-in animation: staggered per cell for a filling effect
  cells.transition().delay((d,i)=> Math.min(600, i * 6)).duration(360).style('opacity',1).ease(d3.easeCubicOut)
  // also fade in whole group for smoother appearance
  g.style('opacity',0).transition().duration(500).style('opacity',1)

  // axes labels
  const xAxis = g.append('g').attr('class','x-axis').attr('transform', `translate(0, ${height})`)
  xAxis.selectAll('text').data(years).join('text')
    .attr('x', d=> x(d) + x.bandwidth()/2)
    .attr('y', 18)
    .attr('text-anchor','middle')
    .text(d=>d)
    .attr('fill','#214e3a')

  const yAxis = g.append('g').attr('class','y-axis')
  yAxis.selectAll('text').data(types).join('text')
    .attr('x', -10)
    .attr('y', d=> y(d) + y.bandwidth()/2)
    .attr('text-anchor','end')
    .attr('alignment-baseline','middle')
    .text(d=>d)
    .attr('fill','#214e3a')

  // legend gradient: use the exact same color scale/interpolator as the heatmap
  const defs = svg.append('defs')
  const gradId = 'heat-legend-grad'
  const grad = defs.append('linearGradient').attr('id', gradId).attr('x1','0%').attr('x2','100%')
  // create stops across domain using the same `color` scale so colors match exactly
  const stops = 8
  for(let i=0;i<=stops;i++){
    const t = i / stops
    const v = vmin + t * (vmax - vmin)
    grad.append('stop').attr('offset', `${t*100}%`).attr('stop-color', color(v))
  }

  const legendW = Math.min(360, width)

  const legendG = svg.append('g').attr('class','heat-legend').attr('transform', `translate(${margin.left}, ${height + margin.top + 20})`)
  legendG.append('rect').attr('x',0).attr('y',0).attr('width', legendW).attr('height',12).attr('fill', `url(#${gradId})`).attr('rx',6)

  // legend scale: same domain as color scale
  const legendScale = d3.scaleLinear().domain([vmin, vmax]).range([0, legendW])
  const legendAxis = d3.axisBottom(legendScale).ticks(4).tickFormat(d3.format('~s'))
  const legendAxisG = legendG.append('g').attr('transform', `translate(0,12)`).call(legendAxis)
  // style ticks/text so they align and are readable against the card
  legendAxisG.selectAll('text').attr('fill','#214e3a').attr('font-size', 12).attr('text-anchor','middle')
  legendAxisG.selectAll('.tick line').attr('stroke', 'none')
  // center min/max labels if needed by nudging first/last
  const ticks = legendAxisG.selectAll('.tick').nodes()
  if(ticks.length){
    d3.select(ticks[0]).select('text').attr('text-anchor','start')
    d3.select(ticks[ticks.length-1]).select('text').attr('text-anchor','end')
  }
}
