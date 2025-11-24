import React from 'react'
import '../styles/HomePage.css'

export default function HomePage(){
  return (
    <section className="home-page">
      <div className="home-container">
        <h1 className="home-title">Med and Jesse</h1>
        <p className="home-sub">Visualisez, interprétez et collaborez — une interface moderne pour vos données médicales.</p>
        <div className="home-card">
          <p>Commencez par importer vos données dans l'onglet "Visualisation".</p>
        </div>
      </div>
    </section>
  )
}
