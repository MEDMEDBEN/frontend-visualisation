import React from 'react'
import '../styles/HomePage.css'
import HomeIndianTable from '../components/HomeIndianTable'

export default function HomePage(){
  return (
    <section className="home-page">
      <div className="home-container">
        <h1 className="home-title"><b>Med and Jess</b> Dashboard</h1>
        <h2>Gestion et suivi de déchet en Inde</h2>
        <div className="home-card">
        </div>

        <HomeIndianTable />
      </div>
    </section>
  )
}
