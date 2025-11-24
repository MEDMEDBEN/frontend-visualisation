import React, { useEffect, useRef, useState, useContext } from 'react'
import * as d3 from 'd3'
import '../styles/PieChartDechetTotal.css'
import { CityContext } from '../context/CityContext'

export default function PieChartRecyclageTotal({ className }){
  const [selectedYear, setSelectedYear] = useState(null)
  const { data, selectedCity } = useContext(CityContext)
  const years = React.useMemo(() => {
    if (!data || !selectedCity) return []
    return Array.from(new Set(data.filter(d => d.city === selectedCity).map(r => Number(r.year)))).sort((a,b)=>a-b)
  }, [data, selectedCity])
  const svgRef = useRef()
  const wrapperRef = useRef()

  // data and selectedCity provided from CityContext
  useEffect(()=>{
    if ((!selectedYear || !years.includes(Number(selectedYear))) && years.length){
      setTimeout(()=> setSelectedYear(years[0]), 0)
    }
  }, [years, selectedYear])

  useEffect(()=>{
    if(!data || data.length===0 || !selectedCity || !selectedYear) return
    const filtered = data.filter(d=>d.city===selectedCity && d.year===+selectedYear)
    const sumByType = d3.rollups(filtered, v=>d3.sum(v, d=>d.value * (d.recyclingRate/100)), d=>d.type)
      .map(([type, value])=>({ type, value }))
      .filter(d=>d.value>0)
      .sort((a,b)=>b.value-a.value)

    drawPie(svgRef.current, wrapperRef.current, { items: sumByType, title: `Recycled distribution ${selectedCity} — ${selectedYear}` })
  },[data, selectedCity, selectedYear])

  return (
    <div className={`pie-card pie-recycle ${className||''}`} ref={wrapperRef}>
      <div className="pie-header">
        <h2 className="pie-title">Recycled Distribution — Calculated</h2>
          <div className="pie-controls">
            <label>Année:</label>
            <select value={selectedYear||''} onChange={e=>setSelectedYear(e.target.value)}>
              {years.map(y=> <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
      </div>
      <svg ref={svgRef} className="pie-svg" />
      <div className="pie-legend" />
      <div className="pie-tooltip" style={{display:'none'}} />
    </div>
  )
}

function drawPie(svgNode, wrapperNode, { items }) {
  if (!svgNode || !wrapperNode) return;

  const wrapperWidth = wrapperNode.clientWidth || 350;
  const size = Math.min(260, Math.max(180, wrapperWidth * 0.45));
  const radius = size / 2 - 6;

  const svg = d3.select(svgNode);
  svg.selectAll("*").remove();
  svg.attr("width", size).attr("height", size);

  const g = svg
    .append("g")
    .attr("transform", `translate(${size / 2}, ${size / 2})`);

  const total = d3.sum(items, d => d.value);
  const pie = d3.pie().value(d => d.value).sort(null);
  const arcs = pie(items);

  // Colors: prefer CSS variables --chart-1..--chart-5, fallback to extracted pastel palette
  const defaultPalette = ['#B99BFF','#7FC8A0','#8AD1FF','#F6D87A','#9EA0B8']
  const cssVars = typeof window !== 'undefined' && window.getComputedStyle ? window.getComputedStyle(document.documentElement) : null
  const basePalette = []
  for(let i=1;i<=5;i++){ const v = cssVars ? cssVars.getPropertyValue(`--chart-${i}`) : ''; basePalette.push((v && v.trim()) || defaultPalette[i-1]) }
  const colors = items.map((d,i)=>{
    const a = basePalette[i % basePalette.length]
    const b = basePalette[(i+1) % basePalette.length]
    return d3.interpolateRgb(a,b)(0.28)
  })
  const color = d3.scaleOrdinal().domain(items.map(d=>d.type)).range(colors)
  const arcGen = d3.arc().innerRadius(0).outerRadius(radius);

  const tooltip = d3.select(wrapperNode).select(".pie-tooltip");

  /* ===== ARC PATHS ===== */
  const paths = g
    .selectAll("path")
    .data(arcs)
    .join("path")
    .attr("fill", d => color(d.data.type))
    .each(function (d) {
      this._current = { startAngle: d.startAngle, endAngle: d.startAngle };
    })
    .on("mouseover", function (e, d) {
      tooltip
        .style("display", "block")
        .html(
          `<strong>${d.data.type}</strong><br>${d.data.value} tons<br>${(
            (d.data.value / total) *
            100
          ).toFixed(1)}%`
        )
        .classed("show", true);
    })
    .on("mousemove", function (e) {
      const [x, y] = d3.pointer(e, wrapperNode);
      tooltip.style("left", `${x + 15}px`).style("top", `${y + 10}px`);
    })
    .on("mouseout", function () {
      tooltip.classed("show", false);
      setTimeout(() => tooltip.style("display", "none"), 150);
    });

  /* ===== ANIMATION ===== */
  paths
    .transition()
    .duration(900)
    .attrTween("d", function (d) {
      const i = d3.interpolate(this._current, d);
      this._current = i(1);
      return t => arcGen(i(t));
    });

  /* ===== POURCENTAGES SUR LE GRAPH ===== */
  g.selectAll("text")
    .data(arcs)
    .join("text")
    .attr("transform", d => `translate(${arcGen.centroid(d)})`)
    .text(d => ((d.data.value / total) * 100).toFixed(1) + "%")
    .style("font-size", "0.75rem")
    .style("font-weight", "700")
    .style("fill", (cssVars && cssVars.getPropertyValue('--text-primary')) ? cssVars.getPropertyValue('--text-primary').trim() : '#fff')
    .style("pointer-events", "none");

  /* ===== LÉGENDE ===== */
  const legend = d3.select(wrapperNode).select(".pie-legend");
  legend.selectAll("*").remove();

  const leg = legend
    .selectAll(".leg-item")
    .data(items)
    .join("div")
    .attr("class", "leg-item");

  leg.append("span").attr("class", "sw").style("background", d => color(d.type));
  leg.append("span").attr("class", "lbl").text(d => `${d.type}`);
}
