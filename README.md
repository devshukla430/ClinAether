# ClinAether - Clinical Trials and Molecular Data Explorer

ClinAether is a web application I built to search for diseases, drugs, and chemical molecules and view matching clinical trials and chemical properties in one clean interface. It queries live public databases in real-time on the client side, so it doesn't require any backend server or database setup.

Live Demo: https://clinaether.vercel.app

---

## Features

*   **Real-time Search**: Search by condition (e.g., Diabetes) or drug name (e.g., Metformin) to fetch matching records.
*   **Molecular Card**: Uses the PubChem REST API to show molecular structures, formula, weight, polar surface area (TPSA), and synonyms.
*   **Trials Breakdown**: Displays trial phase distribution using a Chart.js radar chart and highlights active phases on a visual progression timeline.
*   **Study Explorer**: Lists matching studies from ClinicalTrials.gov with filters for recruitment status, trial phase, and country, including details modals for inclusion and exclusion eligibility rules.
*   **Responsive UI**: Optimized for mobile screens, automatically changing the desktop sidebar into a bottom navigation tab bar for phone layouts.

---

## Data Sources & Compliance

To keep the application free and open-source without requiring commercial database licenses (like DrugBank), ClinAether queries public government APIs:

*   **Clinical Trials**: ClinicalTrials.gov API v2 (500,000+ public records)
*   **Molecules**: PubChem REST API (110M+ compound registry)
*   **Approved Drugs**: openFDA + RxNorm (20,000+ standardized listings)
*   **Conditions**: MeSH classification thesaurus (10,000+ disease headings)

---

## Technologies Used

*   HTML5 (Semantic markup)
*   CSS3 (Custom properties, CSS grid, Flexbox, glassmorphic styles)
*   JavaScript (ES6, Fetch API, async/await)
*   Chart.js (Radar chart visualization)
*   Lucide Icons (Iconography library)

---

## Development Setup

To run and test the application locally without build tools:

1. Clone the repository:
   ```bash
   git clone https://github.com/devshukla430/ClinAether.git
   ```
2. Start a local HTTP server in the root directory:
   ```bash
   python -m http.server 3000
   ```
3. Open `http://localhost:3000` in your web browser.
