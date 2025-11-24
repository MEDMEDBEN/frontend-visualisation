import React, { useEffect, useRef, useContext } from 'react'
import * as d3 from 'd3'
import '../styles/LineChartIndian.css'
import { CityContext } from '../context/CityContext'

// Default palette used only by this LineChart component.
// CHANGE COLORS HERE (component-local): edit these two hex values to change the two series colors
// These values are local to LineChartIndian and won't affect the global chart palette.
// Requested defaults: neon green and neon mauve.
const defaultPalette = ['#39FF14', '#E580FF']

export default function LineChartIndian({ palette = defaultPalette }){
  const { data, selectedCity } = useContext(CityContext)
  const svgRef = useRef()
  const wrapperRef = useRef()
  useEffect(()=>{
    if(!data || data.length===0 || !selectedCity) return

    const filtered = data.filter(d=>d.city === selectedCity)
    const years = Array.from(new Set(filtered.map(d=>d.year))).sort((a,b)=>a-b)

    // compute totals per year
    const totals = years.map(year => {
      const rows = filtered.filter(r=>r.year === year)
      const totalGenerated = d3.sum(rows, r => r.value)
      const totalRecycled = d3.sum(rows, r => r.value * (r.recyclingRate/100))
      return { year, totalGenerated, totalRecycled }
    })

    // pass the local palette into the drawing function so this chart keeps
    // its own colors independent from global CSS chart variables used elsewhere
    drawLineChart(svgRef.current, wrapperRef.current, { totals, years, palette })
  },[data, selectedCity, palette])

  return (
    <div className="linechart-card" ref={wrapperRef}>
      <div className="linechart-header">
        <h2 className="linechart-title">Waste & Recycled — Yearly Trend</h2>
      </div>

      <svg ref={svgRef} className="linechart-svg" />

      <div className="linechart-legendArea">
        <div className="linechart-legendItem"><span className="linechart-legendSwatch" style={{background: palette[0]}}/>Waste Generated</div>
        <div className="linechart-legendItem"><span className="linechart-legendSwatch" style={{background: palette[1]}}/>Recycled (calculated)</div>
      </div>

      {/* Tooltips removed by request: no tooltip element rendered here */}
    </div>
  )
}

function drawLineChart(svgNode, wrapperNode, { totals, years, palette = ['#1f77b4','#2ca02c'] }){
  const margin = { top: 24, right: 90, bottom: 60, left: 64 }
  const containerWidth = wrapperNode ? wrapperNode.clientWidth : 800
  // compute base sizes then apply a small visual reduction per request
  const computedBaseWidth = Math.min(600, Math.max(600, containerWidth * 0.35)) - margin.left - margin.right
  const computedBaseHeight = 300 - margin.top - margin.bottom
  // subtract 20px width and 5px height
  const width = Math.max(0, computedBaseWidth - 20)
  const height = Math.max(0, computedBaseHeight - 5)

  const svg = d3.select(svgNode)
  svg.selectAll('*').remove()
  svg.attr('width', width + margin.left + margin.right).attr('height', height + margin.top + margin.bottom)

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  const x = d3.scalePoint().domain(years).range([0, width]).padding(0.5)
  const maxY = d3.max(totals, d=>Math.max(d.totalGenerated, d.totalRecycled)) || 0
  const y = d3.scaleLinear().domain([0, maxY * 1.1]).range([height, 0])

  // Compute pixel positions using the same scales used for points so alignment is exact.
  // We round coordinates to integer pixels to avoid sub-pixel rendering differences
  // between the generated path and circle centers which can create a visual offset.
  const xPos = d => Math.round(x(d.year))
  const yGenPos = d => Math.round(y(d.totalGenerated))
  const yRecPos = d => Math.round(y(d.totalRecycled))
  const lineGen = d3.line().x(d=>xPos(d)).y(d=>yGenPos(d)).curve(d3.curveMonotoneX)
  const lineRec = d3.line().x(d=>xPos(d)).y(d=>yRecPos(d)).curve(d3.curveMonotoneX)

  // axes
  g.append('g').attr('class','axis x-axis').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x))
  g.append('g').attr('class','axis y-axis').call(d3.axisLeft(y).ticks(6).tickFormat(d3.format('~s')))

  // gridlines
  g.append('g').attr('class','grid').selectAll('line').data(y.ticks(5)).join('line')
    .attr('x1',0).attr('x2',width).attr('y1',d=>y(d)).attr('y2',d=>y(d)).attr('stroke','#e9f0ea')

  // lines
  // Stroke width and colors for the two series — change `strokeWidth` or `palette` here
  // These are LOCAL to this component and do NOT rely on global CSS variables.
  const strokeWidth = 6 // increase thickness for better visibility (edit this value to tune)
  const pathGen = g.append('path')
    .datum(totals)
    .attr('class','line gen')
    .attr('d', lineGen)
    .attr('fill','none')
    // set inline styles to fully override any global CSS rules
    .style('stroke', palette[0])
    .style('stroke-width', strokeWidth)
    .style('stroke-linecap','round')
    .style('vector-effect','non-scaling-stroke')

  const pathRec = g.append('path')
    .datum(totals)
    .attr('class','line rec')
    .attr('d', lineRec)
    .attr('fill','none')
    .style('stroke', palette[1])
    .style('stroke-width', strokeWidth)
    .style('stroke-linecap','round')
    .style('vector-effect','non-scaling-stroke')

  // animate lines: draw from left to right using stroke-dasharray/dashoffset
  try{
    const lenGen = pathGen.node().getTotalLength()
    pathGen.attr('stroke-dasharray', `${lenGen} ${lenGen}`).attr('stroke-dashoffset', lenGen)
      .transition().duration(1100).ease(d3.easeCubicOut).attr('stroke-dashoffset', 0)
  }catch{ /* ignore if path not ready */ }
  try{
    const lenRec = pathRec.node().getTotalLength()
    pathRec.attr('stroke-dasharray', `${lenRec} ${lenRec}`).attr('stroke-dashoffset', lenRec)
      .transition().duration(1100).delay(120).ease(d3.easeCubicOut).attr('stroke-dashoffset', 0)
  }catch{ /* ignore if path not ready */ }

  // points
  // NOTE: tooltips removed — no mouseover handlers are attached to the points.
  // Points are placed using the exact same scales (`x`, `y`) used by the lines,
  // ensuring perfect alignment with the curve. To change color/width of the
  // series, edit `palette` (above) and the `strokeWidth` variable below.

  const points = g.selectAll('.point')
    .data(totals)
    .join('g')
    .attr('class', 'point')

  // generated points (series 1)
  // Place points using the same rounded positions computed for the line above
  // so circles share exact coordinates with the path vertices (no offset).
  const genDots = points.append('circle')
    .attr('cx', d => xPos(d))
    .attr('cy', d => yGenPos(d))
    .attr('r', 0)
    .attr('fill', palette[0])
    .style('opacity', 0)

  // recycled points (series 2)
  const recDots = points.append('circle')
    .attr('cx', d => xPos(d))
    .attr('cy', d => yRecPos(d))
    .attr('r', 0)
    .attr('fill', palette[1])
    .style('opacity', 0)

  // animate points
  genDots.transition()
    .delay((d,i)=>200 + i*80)
    .duration(360)
    .attr('r',5)
    .style('opacity',1)
    .ease(d3.easeBackOut)

  recDots.transition()
    .delay((d,i)=>360 + i*80)
    .duration(360)
    .attr('r',5)
    .style('opacity',1)
    .ease(d3.easeBackOut)

}

// No tooltip helpers remain; formatNumber and tooltip functions removed per request


/*
  Tooltip helpers
  - showTooltip: populate and display the tooltip, anchored at (left, top) which
    are pixel coordinates relative to the positioned wrapper (.linechart-card).
  - moveTooltip: reposition an already-visible tooltip to the provided wrapper-local
    coordinates. We center the tooltip horizontally on the anchor and place it above
    the point (with a small vertical offset).
*/
// Tooltips removed: helper functions deleted so no tooltip logic remains.
