import React, { createContext, useState, useEffect } from 'react'
import * as d3 from 'd3'

export const CityContext = createContext(null)

export function CityProvider({ children }){
  const [data, setData] = useState([])
  const [cities, setCities] = useState([])
  const [selectedCity, setSelectedCity] = useState(null)
  const [cityStats, setCityStats] = useState(new Map())

  useEffect(()=>{
    d3.csv('/Indian.csv', d => ({
      city: d['City/District'] || '',
      type: d['Waste Type'] || '',
      value: +d['Waste Generated (Tons/Day)'] || 0,
      recyclingRate: +d['Recycling Rate (%)'] || 0,
      populationDensity: +d['Population Density (People/km²)'] || 0,
      municipalScore: +d['Municipal Efficiency Score (1-10)'] || 0,
      disposal: d['Disposal Method'] || '',
      cost: +d['Cost of Waste Management (₹/Ton)'] || 0,
      campaigns: +d['Awareness Campaigns Count'] || 0,
      landfill: d['Landfill Name'] || '',
      landfillLocation: d['Landfill Location (Lat, Long)'] || '',
      landfillCapacity: +d['Landfill Capacity (Tons)'] || 0,
      year: +(d['Year'] || 0)
    }))
    .then(rows=>{
      setData(rows)
      const cs = Array.from(new Set(rows.map(r=>r.city))).sort()
      setCities(cs)
      if(cs.length) setSelectedCity(cs[0])

      // compute per-city totals and population density (representative)
      const byCity = d3.group(rows, r=>r.city)
      const stats = new Map()
      byCity.forEach((rows, city)=>{
        const totalGenerated = d3.sum(rows, r=>r.value)
        const popDensity = d3.mean(rows, r=>r.populationDensity) || 0
        stats.set(city, { totalGenerated, populationDensity: Math.round(popDensity) })
      })
      setCityStats(stats)
    }).catch(err=>{
      console.error('CityContext failed to load CSV', err)
    })
  },[])

  const value = { data, cities, selectedCity, setSelectedCity, cityStats }
  return (
    <CityContext.Provider value={value}>{children}</CityContext.Provider>
  )
}

export default CityProvider
