import React, { useContext } from 'react';
import '../styles/visualization.css';
import { CityProvider, CityContext } from '../context/CityContext';
import IndiaOverview from '../components/IndiaOverview';
import CityPanel from '../components/CityPanel';
import HistogramIndian from '../components/HistogramIndian';
import LineChartIndian from '../components/LineChartIndian';
import HeatmapIndian from '../components/HeatmapIndian';
import PieChartDechetTotal from '../components/PieChartDechetTotal';
import PieChartRecyclageTotal from '../components/PieChartRecyclageTotal';
import WaterfallCity from '../components/WaterfallCity';
import BarChartCampaignsPaged from '../components/BarChartCampaignsPaged';
import RadarChartMunicipalIndian from '../components/RadarChartMunicipalIndian';
import GaugeChartLandfillIndian from '../components/GaugeChartLandfillIndian';
import SankeyDiagramIndian from '../components/SankeyDiagramIndian';

const VisualizationPage = () => {
  function MiniSummary(){
    const { data, selectedCity } = useContext(CityContext) || { data: [], selectedCity: null }

    let miniRows = []
    if (selectedCity && Array.isArray(data) && data.length) {
      const cityRows = data.filter(r => r.city === selectedCity)
      const grouped = cityRows.reduce((acc, r) => {
        const t = r.type || 'Autre'
        if (!acc[t]) acc[t] = { type: t, quantity: 0, recyclingSum: 0, recyclingCount: 0, methods: {}, scoreSum: 0, scoreCount: 0, campaigns: 0 }
        acc[t].quantity += Number(r.value || 0)
        if (!Number.isNaN(Number(r.recyclingRate))) { acc[t].recyclingSum += Number(r.recyclingRate); acc[t].recyclingCount += 1 }
        if (r.disposal) acc[t].methods[r.disposal] = (acc[t].methods[r.disposal] || 0) + 1
        if (!Number.isNaN(Number(r.municipalScore))) { acc[t].scoreSum += Number(r.municipalScore); acc[t].scoreCount += 1 }
        acc[t].campaigns += Number(r.campaigns || 0)
        return acc
      }, {})

      miniRows = Object.values(grouped).map(g => {
        const method = Object.entries(g.methods).sort((a, b) => b[1] - a[1])[0]
        return {
          type: g.type,
          quantity: Math.round(g.quantity),
          recycling: g.recyclingCount ? Math.round(g.recyclingSum / g.recyclingCount) + '%' : '-',
          method: method ? method[0] : '-',
          score: g.scoreCount ? Math.round(g.scoreSum / g.scoreCount) : '-',
          campaigns: g.campaigns || 0
        }
      })
    }

    return (
      <div id="mini-summary" className="viz-card viz-card--mini">
        <div className="viz-card-header"><h5>Synthèse déchets — ville sélectionnée</h5></div>
        <div className="viz-card-body">
          {(!selectedCity || !miniRows.length) ? (
            <div className="mini-note">Données en cours de chargement ou pas de données pour la ville sélectionnée.</div>
          ) : (
            <div className="mini-summary-body">
              <table className="mini-summary-table">
                <thead>
                  <tr>
                    <th>Type de déchet</th>
                    <th>Quantité (t/j)</th>
                    <th>Taux recyclage</th>
                    <th>Méthode</th>
                    <th>Score</th>
                    <th>Campagnes</th>
                  </tr>
                </thead>
                <tbody>
                  {miniRows.map((r, i) => (
                    <tr key={r.type + i}>
                      <td className="type-col">{r.type}</td>
                      <td className="qty-col">{r.quantity.toLocaleString()}</td>
                      <td className="recy-col">{r.recycling}</td>
                      <td className="method-col">{r.method}</td>
                      <td className="score-col">{r.score}</td>
                      <td className="camp-col">{r.campaigns}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )
  }
  return (
    <CityProvider>
      <div className="visualization-wrapper">
        {/* top controls / overview */}
        <IndiaOverview />
              <div id="barcampaigns" className="row full-row">
        <BarChartCampaignsPaged />
      </div>
        <div className="city-panel"><CityPanel /></div>

        {/* Bloc 1 - Histogramme (full width) */}
        <section id="block-histogram" className="viz-block viz-appear">
          <div id="histogram" className="viz-card viz-card--full">
            <div className="viz-card-header"><h3>Histogramme — Distribution</h3></div>
            <div className="viz-card-body"><HistogramIndian /></div>
          </div>
        </section>

        {/* Bloc 2 - Heatmap (left) + Line chart (right) */}
        <section id="block-heat-line" className="viz-block viz-appear">
          <div className="viz-card-row">
            <div id="heatmap" className="viz-card viz-card--half">
              <div className="viz-card-header"><h3>Heatmap — Carte</h3></div>
              <div className="viz-card-body"><HeatmapIndian /></div>
            </div>
            <div id="linechart" className="viz-card viz-card--half">
              <div className="viz-card-header"><h3>Graphe associé — Tendances</h3></div>
              <div className="viz-card-body"><LineChartIndian /></div>
            </div>
          </div>
        </section>

        {/* Bloc 3 - Pie charts (stack left) + Scatter (right) + Gauge (under scatter) */}
        <section id="block-pie-scatter" className="viz-block viz-appear">
          <div className="viz-card viz-card--large">
            <div className="viz-card-grid">
              <div className="viz-left-stack">
                <div className="viz-card-inner">
                  <div className="viz-card-header"><h4>Déchets — Totaux</h4></div>
                  <div className="viz-card-body stack">
                    <div id="pie-total" className="stack-item"><PieChartDechetTotal /></div>
                    <div id="pie-recycle" className="stack-item"><PieChartRecyclageTotal /></div>
                  </div>
                </div>
              </div>

              <div className="viz-right-main">
                <div id="scatter" className="viz-card-inner">
                  <div className="viz-card-header"><h4>Parcours ville — Waterfall</h4></div>
                  <div className="viz-card-body"><WaterfallCity /></div>
                </div>
                <div id="gauge" className="viz-card-inner viz-gauge-wrap">
                  <div className="viz-card-body gauge-centered"><GaugeChartLandfillIndian /></div>
                </div>
                {/* Mini summary table for selected city: placed under the gauges and above the pies area.
                    Structure: one row per waste type with quantity (t/j), recycling %, main method, municipal score and campaigns count.
                    Comments: replace the hardcoded examples with dynamic values from CityContext when available. */}
                {/* Use a proper viz-card so styling matches other cards exactly */}
                <MiniSummary />
              </div>
            </div>
          </div>
        </section>

        {/* Bloc 4 - Radar (full width) */}
        <section id="block-radar" className="viz-block viz-appear">
          <div className="viz-card viz-card--full">
            <div className="viz-card-header"><h3>Radar — Indicateurs municipaux</h3></div>
            <div className="viz-card-body"><RadarChartMunicipalIndian /></div>
          </div>
        </section>

        {/* Sankey (separate full-width row) */}
        <section id="block-sankey" className="viz-block viz-appear">
          <div className="viz-card viz-card--full">
            <div className="viz-card-header"><h3>Sankey — Flux</h3></div>
            <div className="viz-card-body"><SankeyDiagramIndian /></div>
          </div>
        </section>

      </div>
    </CityProvider>
  );
};

export default VisualizationPage;
