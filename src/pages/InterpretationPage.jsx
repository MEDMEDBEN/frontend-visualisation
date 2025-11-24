import React from 'react'
import ImageSlider from '../components/ImageSlider'
import '../styles/InterpretationPage.css'

export default function InterpretationPage(){
  return (
    <main className="interpretation-page">
      <header className="interp-header">
        <h1>Interprétation & Contexte — Inde</h1>
        <p className="lead">Résumé du positionnement de l'Inde en gestion des déchets, impacts, et pistes d'amélioration.</p>
      </header>

      <section className="interp-top">
        <div className="interp-left card">
          <h3>Résumé national</h3>
          <p>L'Inde figure parmi les plus grands producteurs mondiaux de déchets. Classements globaux récents indiquent une position défavorable (ex. IPE 2022: 151e / 180).</p>
          <ul className="kpis">
            <li><strong>Landfill actuel :</strong> 87 000 000 tonnes (CPCB 2022)</li>
            <li><strong>Sites actifs :</strong> 1 356 décharges (2023)</li>
            <li><strong>Déchets mis en décharge:</strong> ≈41 000 t / jour (CPCB 2022)</li>
            <li><strong>Taux de recyclage national (moyenne) :</strong> voir données officielles par ville</li>
          </ul>
        </div>

        <div className="interp-right card">
          <h3>Impact & Classements</h3>
          <table className="impact-table">
            <thead><tr><th>Type</th><th>Impact</th></tr></thead>
            <tbody>
              <tr><td>Air</td><td>Pollution par incinération, émissions toxiques</td></tr>
              <tr><td>Eau</td><td>Lessivage des lixiviats, contamination de nappes</td></tr>
              <tr><td>Santé</td><td>Exposition aux polluants, maladies respiratoires</td></tr>
              <tr><td>Climat</td><td>Émissions de GES liées au traitement et à la décomposition</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="interp-slider card">
        <h3>Galerie — Sites & Contexte</h3>
        <ImageSlider imageCount={6} interval={2000} />
      </section>

      <section className="reasons-section card">
        <h3>Raisons de la forte pollution en Inde</h3>
        <ul className="reasons-list">
          <li className="reason-item"> <span className="reason-icon">🏙️</span> Urbanisation rapide et croissance démographique massive</li>
          <li className="reason-item"> <span className="reason-icon">🚛</span> Insuffisance des infrastructures de collecte et traitement des déchets</li>
          <li className="reason-item"> <span className="reason-icon">🧪</span> Forte proportion de déchets non triés ou toxiques mal éliminés</li>
          <li className="reason-item"> <span className="reason-icon">🔥</span> Brûlage de déchets à ciel ouvert et dans les décharges</li>
          <li className="reason-item"> <span className="reason-icon">🚮</span> Importante production de plastiques et faible taux de recyclage</li>
          <li className="reason-item"> <span className="reason-icon">🌧️</span> Ruissellement et infiltration des lixiviats dans l'eau et les sols</li>
          <li className="reason-item"> <span className="reason-icon">📉</span> Faiblesse de la réglementation environnementale et du contrôle</li>
          <li className="reason-item"> <span className="reason-icon">🤝</span> Sensibilisation limitée et manque d'implication du public</li>
        </ul>
      </section>

      <section className="impact-stats-section card">
        <h3>Impact de la pollution en Inde (2024-2025)</h3>
        <p>
          La pollution atmosphérique et hydrique en Inde atteint des niveaux parmi les plus élevés au monde. Elle provoque des dommages sanitaires, économiques et écologiques majeurs, en particulier dans les grandes agglomérations urbaines et les régions riveraines.
        </p>

        <div className="impact-table-wrap">
          <table className="impact-stats-table">
            <thead>
              <tr>
                <th>Indicateur</th>
                <th>Statistiques</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Mortalité attribuée à la pollution (Inde, 2019-2024)</td>
                <td>~1,7 million/an<br/>18% de la mortalité totale</td>
                <td>Lancet, Dalberg</td>
              </tr>
              <tr>
                <td>Impact sur l’espérance de vie (Delhi et grandes villes)</td>
                <td>-9 ans à Delhi,<br/>-2,5 à -2,9 ans dans d’autres régions</td>
                <td>Le Monde, Univ. Chicago</td>
              </tr>
              <tr>
                <td>Niveaux de particules fines (PM2.5, Delhi, Nov. 2024)</td>
                <td>Jusqu’à 907 µg/m³ (OMS : 15 µg/m³)</td>
                <td>IQAir, RTL</td>
              </tr>
              <tr>
                <td>Pertes économiques annuelles (2019)</td>
                <td>95 milliards USD (≈3% du PIB)</td>
                <td>Dalberg</td>
              </tr>
              <tr>
                <td>Principales maladies associées</td>
                <td>Cancers, maladies cardio-respiratoires, décès précoces</td>
                <td>OMS, Lancet</td>
              </tr>
              <tr>
                <td>Niveau de pollution de l’eau (rivières principales, 2023)</td>
                <td>DBO atteignant jusqu’à 490 mg/L</td>
                <td>CPCB Inde, Wikipedia</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="impact-note">Données synthétisées d’études et rapports publics (Lancet, OMS, Dalberg, IQAir, CPCB).</p>
      </section>

      <section className="interp-tables">
        <div className="card">
          <h3>Conséquences synthétiques</h3>
          <table className="cons-table">
            <thead><tr><th>Conséquence</th><th>Description</th></tr></thead>
            <tbody>
              <tr><td>Pollution</td><td>Déversements et émissions affectant sols, eau et air</td></tr>
              <tr><td>Santé publique</td><td>Maladies liées à la mauvaise gestion des déchets</td></tr>
              <tr><td>Biodiversité</td><td>Perte d'habitats due aux sites de stockage</td></tr>
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>Villes / Sites (exemples)</h3>
          <table className="sites-table">
            <thead><tr><th>Ville / Site</th><th>Type</th><th>Remarque</th></tr></thead>
            <tbody>
              <tr><td>Mumbai</td><td>Décharge</td><td>Grand volume, pression urbaine</td></tr>
              <tr><td>Delhi</td><td>Incineration / Décharge</td><td>Mixte; problématiques air/eau</td></tr>
              <tr><td>Indore</td><td>Modèle urbain (zéro déchet efforts)</td><td>Initiatives locales notables</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <footer className="interp-footer card">
        <p className="citation">Sources: CPCB 2022-2023, rapports IPE 2022 et statistiques nationales. Les images proviennent du dossier <code>/public</code>.</p>
      </footer>
    </main>
  )
}
