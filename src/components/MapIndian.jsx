import React from 'react'
import '../styles/MapIndian.css'

export default function MapIndian(){
  const mapSrc = '/map.png'

  return (
    <div className="viz-card viz-card--full map-card">
      <div className="viz-card-header"><h3>Carte de la collecte (Inde)</h3></div>
      <div className="viz-card-body">
        <div className="map-glass">
          <div className="map-dark-wrapper">
            <img src={mapSrc} alt="Carte de la collecte - Inde" className="map-image" />
          </div>
        </div>
      </div>
    </div>
  )
}
