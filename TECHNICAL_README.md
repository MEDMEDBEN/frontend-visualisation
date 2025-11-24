# Documentation Technique — Dashboard de visualisation des déchets

Ce document fournit une synthèse technique et visuelle complète du projet, destinée à la maintenance, reprise et documentation.
Le contenu est basé sur l'analyse automatique des fichiers sources présents dans le dépôt (`src/`, `public/Indian.csv`, etc.).

---

**Table des matières**
- Résumé exécutif
- Stack & dépendances
- Organisation du projet
- Thème visuel et styles (exemples de classes / variables)
- Pages principales (détails par page)
  - Visualisation (liste des graphes & détails techniques)
  - Chats
  - Solution
  - Interpretation
- Navigation / Navbar
- Flux de données & CityContext
- Inventaire des outils et helpers
- Bonnes pratiques & recommandations pour la reprise
- Comment lancer le projet

---

## Résumé exécutif

Application React/Vite qui visualise des données de déchets (fichier `public/Indian.csv`).
Toutes les visualisations sont implémentées avec D3 (pas de librairie chart-ready comme Recharts). Le thème est sombre et « glassy » (glassmorphism) avec des cartes arrondies, des fonds semi-transparents et des variables CSS centralisées.

## Stack & dépendances

- React (v19) — UI et routing
- react-dom
- react-router-dom — navigation client
- d3 (v7) — toutes les visualisations (scales, axes, transitions)
- d3-sankey — layout Sankey
- Vite — dev server & build
- ESLint et plugins (devDependencies)

Fichier principal des dépendances : `package.json`.

## Organisation du projet

Arborescence principale (essentielle) :

- `public/` : `Indian.csv` (données), images, autres assets
- `src/`
  - `main.jsx`, `App.jsx`, `index.css`, `App.css` — bootstrap, thèmes et variables globales
  - `context/CityContext.jsx` — chargement et normalisation du CSV, provider central
  - `pages/` — pages routées : `VisualizationPage.jsx`, `ChatsPage.jsx`, `SolutionPage.jsx`, `InterpretationPage.jsx`, `HomePage.jsx`
  - `components/` — composants et graphiques (voir liste ci-dessous)
  - `styles/` — CSS par composant et fichiers globaux (`visualization.css`, `Navbar.css`, etc.)

Composants de chart (dans `src/components/`)
- `PieChartDechetTotal.jsx`, `PieChartRecyclageTotal.jsx`
- `LineChartIndian.jsx`
- `HeatmapIndian.jsx`
- `HistogramIndian.jsx`
- `BarChartCampaignsPaged.jsx`
- `RadarChartMunicipalIndian.jsx`
- `GaugeChartLandfillIndian.jsx`
- `SankeyDiagramIndian.jsx`
- `ScatterPlotIndian.jsx`
- `WaterfallCity.jsx`
- UI: `Navbar.jsx`, `CityPanel.jsx`, `ThemeSwitch.jsx`, `ImageSlider.jsx`, `IndiaOverview.jsx`, `FloatingNote.jsx`

## Thème visuel & styles

Thème principal : sombre + glassmorphism.

Principales caractéristiques :
- Fond sombre, gradient animé (`--bg-gradient`) — défini dans `src/index.css`.
- Cartes « glassy » : `.viz-card`, `.viz-card--mini`, etc. (définitions dans `src/styles/visualization.css`).
  - `--card-bg` (ex: `rgba(33,45,70,0.52)`)
  - `--card-backdrop` (ex: `blur(8px) saturate(120%)`)
  - `--card-radius` (ex: 14–16px)
  - `--card-shadow`
- Typographie: `Inter` / système. Couleurs principales: `--text-primary`, `--text-muted`.
- Palette des charts: variables CSS `--chart-1` … `--chart-10` (définies dans `src/index.css`). Les composants consultent ces variables via `getComputedStyle(document.documentElement).getPropertyValue('--chart-X')` et appliquent des fallbacks si absent.
- Selects & contrôles: style "glassy" appliqué aux `select` et inputs (ex: `.glassy-select` helper, `.city-select`, `.pie-controls select`, `.sankey-controls select`). Noter que certains OS/navigateurs peuvent limiter le styling des `<option>`.

Exemples :
- `:root` dans `src/index.css` — définit `--card-bg`, `--chart-*`, `--text-primary`.
- `.viz-card` dans `src/styles/visualization.css` — règle réutilisable pour tous les cards.
- `.app-navbar` dans `src/styles/Navbar.css` — barre sticky avec `backdrop-filter`.

## Pages principales — détail

### Visualisation (`src/pages/VisualizationPage.jsx`)
Disposition générale : `div.visualization-wrapper` qui contient des blocs/sections. Layout combinant des `grid` et `flex` via `.viz-card-grid`, `.viz-card-row`, `.viz-left-stack`, `.viz-right-main`.

Graphes présents (liste + détails) :

- Histogram (`HistogramIndian.jsx`) — D3 grouped bars
  - Palette: lit `--chart-1..--chart-5` et crée des variantes par interpolation
  - Legends: SVG legend generated
  - CSS: `src/styles/HistogramIndian.css`

- Line Chart (`LineChartIndian.jsx`) — D3
  - Palette: composant-local (defaultPalette = `['#39FF14', '#E580FF']`) — isolation volontaire
  - Points alignment: positions arrondies pour éviter sub-pixel offsets
  - Tooltips: supprimés (pas d'élément tooltip)
  - Inline stroke styles to avoid CSS overrides

- Heatmap (`HeatmapIndian.jsx`) — D3
  - Color scale: `d3.scaleSequential` + `d3.interpolateRgbBasis([...])` avec stops pour legend
  - Legend: gradient `<defs>` construit à partir du même interpolator (exact match)
  - Tooltips: DOM `.heat-tooltip`

- Pie Charts (`PieChartDechetTotal.jsx`, `PieChartRecyclageTotal.jsx`) — D3 pie/arc
  - Colors: préfère `--chart-1..--chart-5`, fallback defined in component
  - Interactions: hover tooltips, arc animation via `attrTween`
  - Controls: year `select` (lié à `CityContext`)
  - Legend: HTML `.pie-legend`

- Waterfall (`WaterfallCity.jsx`) — D3
  - Colors: `colorMap` local (explicit mapping) to ensure recycled/collected colors are consistent
  - Tooltip: DOM appended to wrapper
  - Legend sync with bars

- Sankey (`SankeyDiagramIndian.jsx`) — d3 + d3-sankey
  - Uses `sankey()` layout and `sankeyLinkHorizontal`
  - Colors: read from CSS vars `--chart-*` fallback defaultPalette
  - Controls: two selects (mode & value) — filtering by `type` or `year`

- Radar, Gauge, Scatter, BarCampaigns — each implemented in D3 and using either CSS vars or component-local palettes

Data flow for charts: tous les composants lisent `data` et `selectedCity` depuis `CityContext`. Les composants réagissent via `useEffect([data, selectedCity, ...])`.

### Chats (`src/pages/ChatsPage.jsx`)
- Structure: grid two columns (`comments-card` left, `bot-card` right)
- Comments: static sample data + add comment form (local state)
- Chatbot: simulated responses in front-end (no backend)
- Styles: chat bubbles, presets buttons, auto-scroll messages
- Bibliothèques: aucune additionnelle

### Solution (`src/pages/SolutionPage.jsx`)
- Structure: grid of solution cards (`.solutions-grid`) — one card per waste type
- Each card: title, list of proposals, meta/status
- Synthesis card with priorities and guidance

### Interpretation (`src/pages/InterpretationPage.jsx`)
- Content: narrative, KPIs, image slider (`ImageSlider`), tables, and cards
- Use-case: context & storytelling to support visualizations

## Navigation / Navbar (`src/components/Navbar.jsx`)
- Sticky header (`position: sticky; top:0`) defined in `src/styles/Navbar.css`
- Top row: brand, search form (`.nav-search`), actions (ThemeSwitch)
- Search capabilities:
  - Keyword -> pages map (`pages` map in `Navbar.jsx`)
  - Keyword -> id mapping for Visualisation (`targets` map)
  - Behavior: `handleSearchSubmit` peut `navigate('/visualisation')` puis `scrollIntoView` for element with target id
- Tabs: `NavLink` for routing

## Flux de données & `CityContext`

- `src/context/CityContext.jsx` charge `public/Indian.csv` via `d3.csv`.
- Transformation: map CSV columns → normalized fields `{ city, type, value, recyclingRate, populationDensity, municipalScore, disposal, cost, campaigns, landfill, landfillLocation, landfillCapacity, year }`.
- `CityContext` fournit `{ data, cities, selectedCity, setSelectedCity, cityStats }`.
- `cityStats` is a `Map` computed from grouped data (totalGenerated, populationDensity, ...).

## Inventaire des outils / helpers utilisés

- D3 (core) — scales, axes, transitions, line/arc/pie, interpolateRgb, axis formatters, rollups
- d3-sankey — sankey layout
- React Context — `CityContext`
- CSS variables & glassmorphism patterns
- Small inline helper logic per-component (normalization, disposal regexes, local colorMap)
- No third-party chart-specific UI libs (no Recharts, no Chart.js)

## Recommandations & bonnes pratiques pour reprise

- Centraliser la logique de palette: créer `src/config/visualizationColors.js` (ou utiliser celui existant) et importer depuis les composants au lieu de copier la même fallback logic.
- Extraire helpers D3 répétitifs (e.g., `createLegendGradient`, palette builder, tooltip helpers) dans `src/utils/d3Helpers.js`.
- Tester la compatibilité des `select` styling sur Windows/Chrome — si le style natif empêche la personnalisation, remplacer le `<select>` par un `GlassySelect` React custom.
- Documenter le schéma CSV attendu dans le README et ajouter un sample minimal de `Indian.csv` pour les tests.
- Ajouter `prefers-reduced-motion` support pour animations lourdes (charts transitions) si nécessaire.

## Lancer le projet (développement)

1. Installer les dépendances:

```powershell
npm install
```

2. Lancer le serveur en développement:

```powershell
npm run dev
```

3. Ouvrir `http://localhost:5173` (ou l'URL indiquée par Vite).

Notes: s'assurer que `public/Indian.csv` est présent. En cas d'erreur de build, lire la sortie Vite dans le terminal.

---

## Emplacements clés à connaître rapidement

- Thèmes / variables: `src/index.css`, `src/App.css`
- Provider / CSV parsing: `src/context/CityContext.jsx`
- Visualisation layout: `src/pages/VisualizationPage.jsx`, `src/styles/visualization.css`
- Navbar & search: `src/components/Navbar.jsx`, `src/styles/Navbar.css`
- Chart components: `src/components/*.jsx`
- Chart styles: `src/styles/*.css`

---

## Conclusion

Ce document fournit un état des lieux technique et visuel du projet prêt à intégrer dans la documentation officielle. Il est possible de générer une version `README.md` plus synthétique ou d'ajouter un guide "How to contribute / Add new chart" détaillé. Dites-moi si vous souhaitez que je:

- Ajoute ce contenu directement dans `README.md` (remplacement/surcouche),
- Génére un `CONTRIBUTING.md` avec une checklist technique (comment ajouter chart, où mettre palettes),
- Implémente un utilitaire centralisé pour palettes et legends.


*Fichier généré automatiquement par analyse du code source — revérifiez avant publication.*
