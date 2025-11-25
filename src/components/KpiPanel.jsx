import React, { useContext, useMemo } from 'react'
import KpiCard from './KpiCard'
import '../styles/KpiPanel.css'
import { CityContext } from '../context/CityContext'

// simple inline SVG icons
const IconWaste = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="7" width="18" height="12" rx="2" fill="#2D6A4F"/><rect x="8" y="3" width="8" height="4" rx="1" fill="#95D5B2"/></svg>
)

const IconRecycle = () => (
  <svg width="36" height="36" viewBox="0 0 24 24"><path d="M12 2 L15 5" stroke="#117A65" strokeWidth="1.5" fill="none"/><circle cx="12" cy="12" r="9" stroke="#2D6A4F" strokeWidth="1.5" fill="#CFF4DE"/></svg>
)

const IconType = () => (
  <svg width="36" height="36" viewBox="0 0 24 24"><rect x="3" y="3" width="6" height="6" rx="1" fill="#3A7CA5"/><rect x="15" y="3" width="6" height="6" rx="1" fill="#7FB3D5"/><rect x="9" y="15" width="6" height="6" rx="1" fill="#2D6A4F"/></svg>
)

const IconScore = () => (
  <svg width="36" height="36" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#FFD43B"/><path d="M8 12 L11 15 L16 9" stroke="#2D6A4F" strokeWidth="1.5" fill="none"/></svg>
)

const IconGauge = () => (
  <svg width="36" height="36" viewBox="0 0 24 24"><path d="M2 12a10 10 0 1 0 20 0" stroke="#2D6A4F" strokeWidth="1.5" fill="none"/><path d="M7 15 L12 12" stroke="#117A65" strokeWidth="1.5"/></svg>
)

const IconCost = () => (
  <svg width="36" height="36" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2" fill="#F0A500"/><text x="12" y="15" textAnchor="middle" fontSize="10" fill="#fff">€</text></svg>
)

const IconCorr = () => (
  <svg width="36" height="36" viewBox="0 0 24 24"><path d="M3 17 L8 12 L12 16 L20 8" stroke="#2D6A4F" strokeWidth="1.5" fill="none"/></svg>
)

export default function KpiPanel(){
  const { data = [], cityStats } = useContext(CityContext) || {}

  const metrics = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return {}

    const numeric = d => { const n = Number(d); return Number.isFinite(n) ? n : null }

    let totalVolume = 0
    let recyclingSum = 0, recyclingCount = 0
    let typeMap = new Map()
    let scoreSum = 0, scoreCount = 0
    let landfillSum = 0, landfillCount = 0
    let costSum = 0, costCount = 0
    let densityVals = [], valueVals = []

    data.forEach(r => {
      const v = numeric(r.value)
      if (v !== null) totalVolume += v

      const rec = numeric(r.recyclingRate ?? r.recycling)
      if (rec !== null) { recyclingSum += rec; recyclingCount += 1 }

      const t = r.type || 'Autre'
      typeMap.set(t, (typeMap.get(t) || 0) + (v || 0))

      const s = numeric(r.municipalScore ?? r.score)
      if (s !== null) { scoreSum += s; scoreCount += 1 }

      const l = numeric(r.landfillUsage ?? r.landfillUsagePct ?? r.landfill)
      if (l !== null) { landfillSum += l; landfillCount += 1 }

      const c = numeric(r.cost ?? r.managementCost ?? r.avgCost)
      if (c !== null) { costSum += c; costCount += 1 }

      const dens = numeric(r.density ?? r.populationDensity)
      if (dens !== null && v !== null) { densityVals.push(dens); valueVals.push(v) }
    })

    // top type share
    const totalByType = Array.from(typeMap.entries()).map(([type, sum]) => ({ type, sum }))
    totalByType.sort((a,b)=>b.sum - a.sum)
    const topTypeShare = totalByType.length ? (totalByType[0].sum / Math.max(1, totalByType.reduce((s,x)=>s+x.sum,0))) * 100 : null

    // correlation Pearson — prefer per-city aggregates from CityContext.cityStats
    let corr = null
    if (cityStats && cityStats instanceof Map && cityStats.size >= 2) {
      const dens = []
      const totals = []
      cityStats.forEach(s => {
        const d = Number(s.populationDensity)
        const t = Number(s.totalGenerated)
        if (Number.isFinite(d) && Number.isFinite(t)) { dens.push(d); totals.push(t) }
      })
      if (dens.length >= 2) {
        const n = dens.length
        const meanX = dens.reduce((s,x)=>s+x,0)/n
        const meanY = totals.reduce((s,x)=>s+x,0)/n
        let num = 0, denX = 0, denY = 0
        for (let i=0;i<n;i++){ const dx = dens[i]-meanX; const dy = totals[i]-meanY; num += dx*dy; denX += dx*dx; denY += dy*dy }
        corr = (num) / (Math.sqrt(denX * denY) || 1)
      }
    } else if (densityVals.length >= 2) {
      // fallback to row-level correlation
      const n = densityVals.length
      const meanX = densityVals.reduce((s,x)=>s+x,0)/n
      const meanY = valueVals.reduce((s,x)=>s+x,0)/n
      let num = 0, denX = 0, denY = 0
      for (let i=0;i<n;i++){ const dx = densityVals[i]-meanX; const dy = valueVals[i]-meanY; num += dx*dy; denX += dx*dx; denY += dy*dy }
      corr = (num) / (Math.sqrt(denX * denY) || 1)
    }

    return {
      totalVolume: Math.round(totalVolume),
      recyclingRate: recyclingCount ? +(recyclingSum / recyclingCount).toFixed(1) : null,
      topTypePercent: topTypeShare ? +topTypeShare.toFixed(1) : null,
      municipalAvg: scoreCount ? +(scoreSum / scoreCount).toFixed(1) : null,
      landfillUsage: landfillCount ? +(landfillSum / landfillCount).toFixed(1) : null,
      avgCost: costCount ? +(costSum / costCount).toFixed(2) : null,
      correlation: corr !== null ? +corr.toFixed(2) : null
    }
  }, [data, cityStats])

  const { totalVolume, recyclingRate, topTypePercent, municipalAvg, landfillUsage, avgCost, correlation } = metrics || {}

  return (
    <div className="kpi-panel-row" role="region" aria-label="KPI summary">
      <KpiCard Icon={IconWaste} title="Volume total de déchets générés" value={totalVolume != null ? totalVolume.toLocaleString() + ' t' : '-'} />
      <KpiCard Icon={IconRecycle} title="Taux de recyclage global" value={recyclingRate != null ? recyclingRate + ' %' : '-'} />
      <KpiCard Icon={IconType} title="Répartition par type de déchet" value={topTypePercent != null ? topTypePercent + ' %' : '-'} />
      <KpiCard Icon={IconScore} title="Efficacité municipale moyenne" value={municipalAvg != null ? municipalAvg : '-'} />
      <KpiCard Icon={IconGauge} title="Taux d’utilisation des décharges" value={landfillUsage != null ? landfillUsage + ' %' : '-'} />
      <KpiCard Icon={IconCost} title="Coût moyen de gestion" value={avgCost != null ? avgCost + ' €' : '-'} />
      <KpiCard Icon={IconCorr} title="Corrélation densité/quantité générée" value={correlation != null ? correlation : '-'} />
    </div>
  )
}
