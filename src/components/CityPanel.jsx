import React, { useContext } from 'react'
import { CityContext } from '../context/CityContext'
import '../styles/CityPanel.css'
import WaterfallCity from './WaterfallCity'

export default function CityPanel(){
  const { cities, selectedCity, setSelectedCity, cityStats } = useContext(CityContext)

  const rankFor = (city)=>{
    if(!cityStats || cityStats.size===0) return null
    const entries = Array.from(cityStats.entries()).map(([c,s])=>({ city:c, total: s.totalGenerated }))
    entries.sort((a,b)=>b.total - a.total)
    const idx = entries.findIndex(e=>e.city === city)
    return idx >=0 ? idx+1 : null
  }

  const stats = selectedCity ? cityStats.get(selectedCity) : null

  return (
    <div className="city-panel">
      <div className="city-panel-inner">
        <div className="city-select-row">
          <label className="city-select-label">Ville</label>
          <div className="city-select-wrapper">
            <select className="city-select" value={selectedCity||''} onChange={e=>setSelectedCity(e.target.value)}>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="select-arrow" aria-hidden>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M7 10l5 5 5-5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="city-info">
          <div className="city-name">🏙️ {selectedCity || '—'}</div>

          <div className="city-meta">
            <div className="meta-row"><span className="meta-emoji">🗑️</span><span className="meta-text">{selectedCity ? `#${rankFor(selectedCity)} en déchets` : '—'}</span></div>
            <div className="meta-row"><span className="meta-emoji">👥</span><span className="meta-text">{stats ? `${stats.populationDensity.toLocaleString()} people/km²` : '—'}</span></div>
          </div>
          
 
        </div>
      </div>
    </div>
  )
}

export { CityPanel }
