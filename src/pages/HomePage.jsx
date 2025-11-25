import React from 'react'
import '../styles/HomePage.css'
import HomeIndianTable from '../components/HomeIndianTable'

export default function HomePage(){
  return (
    <section className="home-page">
      <div className="home-container">
        <h1 className="home-title">Med and Jesse — Données Déchet de L'Inde</h1>

        <div className="home-card">
          <p className="home-intro">Bienvenue — aperçu rapide des données indiennes sur la gestion des déchets. Ci-dessous, une sélection de la table de données et des notifications informatives qui tournent toutes les 3 secondes.</p>
        </div>

        <HomeIndianTable />
      </div>
    </section>
  )
}
