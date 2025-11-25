import React, { useEffect, useState } from 'react'
import * as d3 from 'd3'
import '../styles/HomeIndianTable.css'

export default function HomeIndianTable(){
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [noticeIndex, setNoticeIndex] = useState(0)

  const notices = [
    "Pollution urbaine : hausse des émissions et impacts sanitaires.",
    "Classement mondial : l'Inde est parmi les pays avec un fort volume de déchets générés.",
    "Conséquence : pollution des sols et des eaux, risques pour la santé publique.",
    "Solution : amélioration du tri à la source et augmentation des capacités de recyclage.",
    "Sensibilisation : campagnes et infrastructures locales réduisent les décharges sauvages."
  ]

  useEffect(()=>{
    let mounted = true
    d3.csv('/Indian.csv', d=>({
      city: d['City/District'] || d['City'] || '',
      type: d['Waste Type'] || '',
      value: +d['Waste Generated (Tons/Day)'] || +d['Waste Generated (Tons)'] || 0,
      recyclingRate: +d['Recycling Rate (%)'] || 0,
      populationDensity: +d['Population Density (People/km²)'] || +d['Population Density (People/km)'] || 0,
      municipalScore: +d['Municipal Efficiency Score (1-10)'] || 0,
      cost: +d['Cost of Waste Management (₹/Ton)'] || +d['Cost of Waste Management (Rs/ton)'] || 0,
      year: +(d['Year'] || 0)
    })).then(data=>{
      if(!mounted) return
      setRows(data)
    }).catch(err=>{
      console.error('Failed to load Indian.csv', err)
    }).finally(()=>{ if(mounted) setLoading(false) })
    return ()=>{ mounted = false }
  },[])

  useEffect(()=>{
    const t = setInterval(()=> setNoticeIndex(i => (i+1) % notices.length), 3000)
    return ()=> clearInterval(t)
  },[])

  return (
    <div className="home-indian-section">
      <div className="notice-area">
        <div className="notice-label">Infos</div>
        <div className="notice-text" role="status" aria-live="polite">{notices[noticeIndex]}</div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h3>Dataset — Indian.csv</h3>
          <div className="table-meta">Affiche les premières 50 lignes — Données brutes</div>
        </div>

        <div className="table-body">
          {loading ? (
            <div className="table-loading">Chargement des données…</div>
          ) : (
            <div className="table-scroll">
              <table className="indian-table">
                <thead>
                  <tr>
                    <th>Ville</th>
                    <th>Année</th>
                    <th>Type</th>
                    <th>Quantité (t/j)</th>
                    <th>Recyclage %</th>
                    <th>Densité (hab/km²)</th>
                    <th>Coût (₹/t)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0,50).map((r, i) => (
                    <tr key={r.city + '-' + r.year + '-' + i}>
                      <td className="city-col">{r.city}</td>
                      <td>{r.year || '-'}</td>
                      <td>{r.type || '-'}</td>
                      <td className="num-col">{r.value ? Math.round(r.value).toLocaleString() : '-'}</td>
                      <td className="num-col">{r.recyclingRate ? +r.recyclingRate.toFixed(1) + ' %' : '-'}</td>
                      <td className="num-col">{r.populationDensity ? Math.round(r.populationDensity) : '-'}</td>
                      <td className="num-col">{r.cost ? +r.cost.toFixed(0) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
