# ClinAether - BioMed Discovery & Trial Explorer

ClinAether is a premium, interactive web application designed for exploring global clinical trial pipelines, chemical compounds, and approved medications. It features a sci-fi medical themed interface with glassmorphic cards, active neural network canvas animations, and interactive visualizations.

🚀 **Live Demo:** [Will be filled with your Vercel Link]

---

## 🌟 Key Features

*   **Interactive Search**: Instantly lookup conditions (e.g., *Diabetes*), drug formulations (e.g., *Metformin*), or molecular identifiers.
*   **Molecular Profile Card**: Dynamic integration with the NIH PubChem API to display 2D molecular structures, formulas, masses, synonyms, and description records.
*   **Visual Trial Roadmap**: Aggregates study data into a curved neon radar chart (via Chart.js) and a Phase Development Timeline (Phase 0 to Phase IV).
*   **Study Explorer**: Browse matching clinical studies with advanced pagination, recruitment status filters, and country location queries.
*   **Eligibility Details View**: Click cards to view overlay modals containing study descriptions, coordinators, and full unescaped inclusion/exclusion criteria.
*   **Dynamic Responsive Layout**: Switches automatically from a desktop sidebar to an iOS/Android bottom navigation tab bar with side-scrollable touch columns.

---

## 📊 Sourced Registries Overview

All data is queried in real-time on the client side using secure public API endpoints. The app is **100% legally compliant, keyless, and free of commercial fees**.

| Category | Official Registry Source | Approx. Size | Sourcing Profile |
| :--- | :--- | :--- | :--- |
| **Diseases & Conditions** | ClinicalTrials.gov + MeSH Thesaurus | 10,000+ Headings | Public Domain (US NLM) |
| **Drugs & Molecules** | NIH PubChem Chemical Database | 110M+ Compounds | Open Access (NCBI PUG-REST) |
| **Approved Medications** | FDA Drug Listings (openFDA) + RxNorm | 20,000+ Brand/Generic | Public Records (U.S. FDA) |
| **Clinical Studies** | U.S. NIH ClinicalTrials.gov API v2 | 500,000+ Records | Public Domain (U.S. NIH) |

> [!NOTE]
> Commercial proprietary databases (such as DrugBank) are intentionally excluded to keep the application free of expensive licensing agreements.

---

## 🛠️ Technology Stack

*   **Markup & Layout**: HTML5, Semantic DOM structure, SVG icons.
*   **Styling & Design System**: Vanilla CSS3, backdrop blur filters, glowing gradients, responsive Flexbox/Grid.
*   **Logic & Rendering**: Vanilla ES6 JavaScript, async REST fetch clients.
*   **Iconography**: Lucide Icons (CDN).
*   **Data Visualization**: Chart.js Radar charting (CDN).

---

## 💻 Local Setup

You don't need to install Node.js, Webpack, or NPM. The app is a Single Page Application (SPA) that can be run using a simple local web server:

1.  Clone or download the project files.
2.  Open your terminal in the project directory and run:
    ```bash
    python -m http.server 3000
    ```
3.  Open your browser and navigate to **http://localhost:3000**.
