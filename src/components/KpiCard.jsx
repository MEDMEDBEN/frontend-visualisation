import React from 'react'
import '../styles/KpiCard.css'

export default function KpiCard({ title, value, Icon }){
  return (
    <div className="kpi-card kpi-card--compact">
      <div className="kpi-card-top">
        <div className="kpi-icon">{Icon ? <Icon /> : null}</div>
        <div className="kpi-title"><h4>{title}</h4></div>
      </div>

      <div className="kpi-value"><h2>{value}</h2></div>
    </div>
  )
}
