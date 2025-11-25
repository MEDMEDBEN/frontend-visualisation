import React, { useContext, useEffect, useRef } from 'react'
import * as d3 from 'd3'
import '../styles/CostBoxPlot.css'
import { CityContext } from '../context/CityContext'
import vizColors from '../config/visualizationColors'

export default function CostBoxPlot(){
  const { data = [], cities = [], selectedCity } = useContext(CityContext) || {}
  const wrapperRef = useRef(null)
  const svgRef = useRef(null)

  useEffect(()=>{
    if(!svgRef.current || !wrapperRef.current) return
    const years = [2019,2020,2021,2022,2023]

    // group cost values per year for the selected city
    const series = years.map(y => {
      const vals = data
        .filter(d => d && (d.city === selectedCity))
        .filter(d => Number(d.year) === y)
        .map(d => Number(d.cost || 0))
        .filter(v => Number.isFinite(v) && v > 0)
      vals.sort((a,b)=>a-b)
      return { year: y, values: vals }
    })

    drawBoxplot(svgRef.current, wrapperRef.current, series)
  },[data, selectedCity])

  return (
    <div className="cost-boxplot-card">
      <div className="cost-card-header">
        <div className="cost-header-left">
          <h3>Coût moyen de gestion — par année</h3>
          <div className="cost-city">{selectedCity ? `Ville sélectionnée : ${selectedCity}` : 'Aucune ville sélectionnée'}</div>
        </div>
      </div>

      <div className="cost-card-body" ref={wrapperRef}>
        <svg ref={svgRef} className="cost-svg" />
      </div>
    </div>
  )
}

function drawBoxplot(svgNode, wrapperNode, series){
  // increase top margin so the title does not get clipped
  const margin = { top: 40, right: 18, bottom: 40, left: 64 }
  const width = Math.max(320, wrapperNode.clientWidth) - margin.left - margin.right
  const height = 320 - margin.top - margin.bottom

  const svg = d3.select(svgNode)
  svg.selectAll('*').remove()
  svg.attr('width', width + margin.left + margin.right).attr('height', height + margin.top + margin.bottom)

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  // ensure tooltip element exists inside wrapperNode
  const wrapperSel = d3.select(wrapperNode)
  let tooltip = wrapperSel.select('.cost-tooltip')
  if (tooltip.empty()) {
    tooltip = wrapperSel.append('div').attr('class', 'cost-tooltip').style('display', 'none')
  }

  const years = series.map(s=>s.year)
  const allVals = series.flatMap(s=>s.values)
  const vmin = d3.min(allVals) || 0
  const vmax = d3.max(allVals) || 1

  const x = d3.scaleBand().domain(years.map(String)).range([0, width]).padding(0.3)
  const y = d3.scaleLinear().domain([Math.max(0, vmin - (vmax-vmin)*0.05), vmax + (vmax-vmin)*0.05]).nice().range([height, 0])

  // axes
  const xAxisG = g.append('g').attr('transform', `translate(0, ${height})`)
  xAxisG.call(d3.axisBottom(x).tickFormat(d=>d))
  xAxisG.selectAll('text').attr('fill', '#fff')
  xAxisG.selectAll('path, line').attr('stroke', '#fff')

  const yAxisG = g.append('g')
  yAxisG.call(d3.axisLeft(y).ticks(6).tickFormat(d3.format('~s')))
  yAxisG.selectAll('text').attr('fill', '#fff')
  yAxisG.selectAll('path, line').attr('stroke', '#fff')

  // draw boxes per year
  const boxWidth = Math.max(12, x.bandwidth() * 0.6)

  // derive colors from shared visualization palette so boxes match other charts
  const palette = (vizColors && vizColors.palette && vizColors.palette.length) ? vizColors.palette : ['#9ad0f6','#bfd8a6','#f7c6c6','#f7e3b4','#cbb7e6']
  function hexToRgba(hex, a){
    const h = hex.replace('#','')
    const bigint = parseInt(h,16)
    const r = (bigint >> 16) & 255
    const g = (bigint >> 8) & 255
    const b = bigint & 255
    return `rgba(${r},${g},${b},${a})`
  }
  const outlierFill = 'rgba(255,99,71,0.95)'

  const boxG = g.selectAll('.box-group').data(series).join('g').attr('class','box-group').attr('transform', d => `translate(${x(String(d.year)) + x.bandwidth()/2},0)`)

  boxG.each(function(d,i){
    const vals = d.values
    const gnode = d3.select(this)
    if(!vals || vals.length === 0){
      // draw empty marker
      gnode.append('text').attr('y', height/2).attr('text-anchor','middle').text('—').attr('fill','var(--text-color, #111)')
      return
    }

    // choose a color for this year from the palette
    const baseColor = palette[i % palette.length]
    // increase opacity so boxes are more visible on the translucent background
    const boxFill = hexToRgba(baseColor, 0.8)
    const boxStroke = hexToRgba(baseColor, 0.9)
    const whiskerStroke = hexToRgba(baseColor, 0.6)
    const medianStroke = hexToRgba(baseColor, 0.95)

    const q1 = d3.quantile(vals, 0.25)
    const median = d3.quantile(vals, 0.5)
    const q3 = d3.quantile(vals, 0.75)
    const iqr = q3 - q1
    const whiskerMin = d3.min(vals.filter(v => v >= (q1 - 1.5 * iqr)))
    const whiskerMax = d3.max(vals.filter(v => v <= (q3 + 1.5 * iqr)))

    // vertical line (whiskers)
    gnode.append('line')
      .attr('x1',0).attr('x2',0)
      .attr('y1', y(whiskerMin)).attr('y2', y(whiskerMax))
      .attr('stroke', whiskerStroke)
      .attr('stroke-width', 1.25)

    // box
    gnode.append('rect')
      .attr('x', -boxWidth/2)
      .attr('y', y(q3))
      .attr('width', boxWidth)
      .attr('height', Math.max(1, y(q1) - y(q3)))
      .attr('fill', boxFill)
      .attr('stroke', boxStroke)
      .attr('stroke-width', 1)
      .attr('rx',6)

    // median line
    gnode.append('line')
      .attr('x1', -boxWidth/2).attr('x2', boxWidth/2)
      .attr('y1', y(median)).attr('y2', y(median))
      .attr('stroke', medianStroke)
      .attr('stroke-width',2)

    // whisker end caps
    gnode.append('line')
      .attr('x1', -boxWidth/4).attr('x2', boxWidth/4)
      .attr('y1', y(whiskerMin)).attr('y2', y(whiskerMin))
      .attr('stroke', whiskerStroke)
      .attr('stroke-width',1)
    gnode.append('line')
      .attr('x1', -boxWidth/4).attr('x2', boxWidth/4)
      .attr('y1', y(whiskerMax)).attr('y2', y(whiskerMax))
      .attr('stroke', whiskerStroke)
      .attr('stroke-width',1)

    // outliers
    const outliers = vals.filter(v => v < whiskerMin || v > whiskerMax)
    gnode.selectAll('.outlier').data(outliers).join('circle')
      .attr('class','outlier').attr('cx',0).attr('cy', v => y(v)).attr('r',3).attr('fill', outlierFill)

    // interaction: show tooltip with box stats
    gnode.on('mouseover', function(event){
      const [mx, my] = d3.pointer(event, wrapperNode)
      const count = vals.length
      const min = d3.min(vals)
      const max = d3.max(vals)
      const q1s = q1
      const med = median
      const q3s = q3
      const html = `<div class="tip-title">Année ${d.year}</div><div><strong>n:</strong> ${count}</div><div><strong>min:</strong> ${min}</div><div><strong>Q1:</strong> ${q1s}</div><div><strong>median:</strong> ${med}</div><div><strong>Q3:</strong> ${q3s}</div><div><strong>max:</strong> ${max}</div>`
      tooltip.style('display', 'block').html(html).classed('show', true)
      // clamp position so tooltip stays in wrapper
      const left = Math.min(wrapperNode.clientWidth - 240, mx + 12)
      const top = Math.max(8, my + 6)
      tooltip.style('left', left + 'px').style('top', top + 'px')
    }).on('mousemove', function(event){
      const [mx, my] = d3.pointer(event, wrapperNode)
      const left = Math.min(wrapperNode.clientWidth - 240, mx + 12)
      const top = Math.max(8, my + 6)
      tooltip.style('left', left + 'px').style('top', top + 'px')
    }).on('mouseout', function(){
      tooltip.classed('show', false)
      setTimeout(()=> tooltip.style('display','none'), 160)
    })
  })

  // titles
  // place title safely inside margin so it doesn't get clipped
  g.append('text')
    .attr('x', 0)
    .attr('y', -12)
    .attr('fill','#fff')
    .text('Coût de gestion (₹/tonne)')
    .attr('font-size',12)
}
