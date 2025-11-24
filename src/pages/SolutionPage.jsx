import React from 'react'
import '../styles/SolutionPage.css'

// SolutionPage: propose des solutions par type de déchet.
// Structure: a grid of cards, one card per waste type, plus a synthesis card.
// Each card contains 2-3 solutions with a short justification and whether
// the approach est présente dans le dataset ou une recommandation.
export default function SolutionPage(){
  return (
    <main className="page page-solution">
      <header>
        <h2>Solutions par type de déchets</h2>
        <p className="lead">Actions concrètes, justification courte et statut (présent dans le dataset / recommandation à étendre).</p>
      </header>

      <section className="solutions-grid">
        {/* Card: Plastique */}
        <article className="card waste-card">
          <h3>Plastique</h3>
          <ul>
            <li>
              <strong>Tri sélectif & centres de tri</strong> — Mise en place de points de collecte séparés et centres de tri mécanique.
              <div className="meta">Justification: permet d'extraire flux recyclables; <em>statut:</em> présent dans certaines villes, à étendre.</div>
            </li>
            <li>
              <strong>Interdiction / régulation du plastique à usage unique</strong> — taxes/quotas et alternatives biodégradables.
              <div className="meta">Justification: réduit le flux résiduel; <em>statut:</em> recommandation à renforcer.</div>
            </li>
            <li>
              <strong>Upcycling & filières locales</strong> — valorisation par artisans/startups (pavés, matériaux composites).
              <div className="meta">Justification: crée de la valeur locale et emplois; <em>statut:</em> initiatives locales existantes, à industrialiser.</div>
            </li>
          </ul>
        </article>

        {/* Card: Organique */}
        <article className="card waste-card">
          <h3>Organique (déchets alimentaires)</h3>
          <ul>
            <li>
              <strong>Compostage de proximité</strong> — composteurs de quartier et compostage industriel pour biodéchets.
              <div className="meta">Justification: réduit les mises en décharge et produit amendement; <em>statut:</em> présent dans le dataset pour quelques villes, à déployer massivement.</div>
            </li>
            <li>
              <strong>Collecte séparée & réseaux de collecte organique</strong> — bacs dédiés, routes de collecte dédiées.
              <div className="meta">Justification: qualité du flux pour compostage; <em>statut:</em> recommandation à prioriser.</div>
            </li>
            <li>
              <strong>Valorisation énergétique contrôlée (biogaz)</strong> — méthanisation pour sites à fort gisement.
              <div className="meta">Justification: énergie locale et traitement propre; <em>statut:</em> projets pilotes recommandés.</div>
            </li>
          </ul>
        </article>

        {/* Card: E-waste */}
        <article className="card waste-card">
          <h3>Déchets électriques & électroniques (E-waste)</h3>
          <ul>
            <li>
              <strong>Centres de collecte spécialisés & filières de recyclage</strong> — points de collecte et partenariats avec recycleurs certifiés.
              <div className="meta">Justification: récupération de métaux critiques; <em>statut:</em> souvent informel dans le dataset, doit être formalisé.</div>
            </li>
            <li>
              <strong>Programmes de reprise (take-back)</strong> — obligations pour fabricants / incitations pour retour produit.
              <div className="meta">Justification: responsabilise producteurs; <em>statut:</em> recommandation réglementaire.</div>
            </li>
          </ul>
        </article>

        {/* Card: Construction & démolition */}
        <article className="card waste-card">
          <h3>Déchets de construction</h3>
          <ul>
            <li>
              <strong>Ségrégation sur chantier & centres de broyage</strong> — tri in situ, concassage et réutilisation comme granulats.
              <div className="meta">Justification: réduit extraction primaire; <em>statut:</em> bonnes pratiques à promouvoir.</div>
            </li>
            <li>
              <strong>Normes d'éco-construction & réemploi</strong> — catalogue matériaux réutilisables, incitations fiscales.
              <div className="meta">Justification: économie circulaire dans le bâtiment; <em>statut:</em> recommandation stratégique.</div>
            </li>
          </ul>
        </article>

        {/* Card: Dangereux */}
        <article className="card waste-card">
          <h3>Déchets dangereux</h3>
          <ul>
            <li>
              <strong>Points de collecte sécurisés & filières agréées</strong> — hospitaliers, industriels et ménagers (piles, solvants).
              <div className="meta">Justification: protège santé et sols; <em>statut:</em> partiellement présent, doit être normalisé.</div>
            </li>
            <li>
              <strong>Formation & certification des opérateurs</strong> — gestion sûre et traçabilité via registres.
              <div className="meta">Justification: minimise risques de manipulation illégale; <em>statut:</em> recommandation urgente.</div>
            </li>
          </ul>
        </article>
      </section>

      {/* Synthesis / Priorities card */}
      <section className="card synthesis-card">
        <h3>Synthèse & actions prioritaires</h3>
        <ul className="priorities">
          <li><strong>Déployer le tri sélectif à l'échelle municipale</strong> — campagnes, bacs, centres de tri.</li>
          <li><strong>Multiplier les centres de recyclage et filières certifiées</strong> — et renforcer la chaîne formelle pour e-waste et plastiques.</li>
          <li><strong>Étendre le compostage urbain et la méthanisation</strong> — prioritaire pour réduire les mises en décharge.</li>
          <li><strong>Renforcer la réglementation plastique & take-back</strong> — instruments économiques et contrôle.</li>
          <li><strong>Campagnes d'éducation ciblées</strong> — écoles, quartiers et industries pour changer les comportements.</li>
        </ul>

        <div className="examples">
          <h4>Villes exemples</h4>
          <p>Indore (exemples d'initiatives locales), Mumbai (fort gisement, besoin d'infrastructures), Delhi (problèmes air/eau; prioriser tri & incinération contrôlée où pertinent).</p>
        </div>

        <div className="customize-note">
          {/* Guidance for maintainers */}
          <strong>Comment personnaliser:</strong>
          <p>Remplacez les mentions de statut par des vérifications directes du dataset (`CityContext` / `Indian.csv`) pour marquer précisément quelles villes pratiquent déjà chaque solution.</p>
        </div>
      </section>
    </main>
  )
}
