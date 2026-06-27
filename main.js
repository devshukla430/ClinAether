/* ==========================================================================
   CLINAETHER DISCOVERY & TRIAL EXPLORER - APPLICATION CORE LOGIC
   ========================================================================== */

// --- Global State ---
let currentSearchQuery = "";
let currentPage = 1;
let nextPageToken = null;
let pageTokens = [null]; // Index 1 is null (first page)
let chartInstance = null;

// Filter States
let filterStatus = "";
let filterPhase = "";
let filterCountry = "";

// --- Helper / Utility Functions ---
function escapeHTML(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cleanEligibilityText(text) {
  if (!text) return "";
  // Remove literal "\u200b" strings and raw zero-width space characters
  let cleaned = String(text).replace(/\\u200b/gi, "").replace(/\u200b/g, "");
  // Remove backslash escapes before typical mathematical or markup characters
  cleaned = cleaned.replace(/\\([\[\]<>=*\-\\\/])/g, "$1");
  // Remove any other stray backslashes preceding characters
  cleaned = cleaned.replace(/\\(.)/g, "$1");
  return cleaned;
}

// Common search terms for autocomplete
const COMMON_SUGGESTIONS = [
  { name: "Diabetes", type: "Condition" },
  { name: "Alzheimer's Disease", type: "Condition" },
  { name: "Hypertension", type: "Condition" },
  { name: "Rheumatoid Arthritis", type: "Condition" },
  { name: "Asthma", type: "Condition" },
  { name: "Crohn's Disease", type: "Condition" },
  { name: "Metformin", type: "Drug / Molecule" },
  { name: "Aspirin", type: "Drug / Molecule" },
  { name: "Ibuprofen", type: "Drug / Molecule" },
  { name: "Penicillin", type: "Drug / Molecule" },
  { name: "Paracetamol", type: "Drug / Molecule" },
  { name: "Atorvastatin", type: "Drug / Molecule" },
  { name: "Pembrolizumab", type: "Drug / Molecule" },
  { name: "Insulin", type: "Drug / Molecule" }
];

// --- DOM Elements ---
const elSearchInput = document.getElementById("global-search");
const elSearchBtn = document.getElementById("search-btn");
const elSearchSpinner = document.getElementById("search-spinner");
const elAutocomplete = document.getElementById("search-autocomplete");
const elWelcomeView = document.getElementById("welcome-view");
const elDashboardView = document.getElementById("dashboard-view");
const elQuickTags = document.querySelectorAll(".quick-tag");

// Molecular Card elements
const elMolCID = document.getElementById("molecule-cid");
const elMolImg = document.getElementById("molecule-img");
const elMolPlaceholder = document.getElementById("structure-placeholder");
const elMolFormula = document.getElementById("mol-formula");
const elMolWeight = document.getElementById("mol-weight");
const elMolTPSA = document.getElementById("mol-tpsa");
const elMolXLogP = document.getElementById("mol-xlogp");
const elMolDescription = document.getElementById("mol-description");
const elMolSynonyms = document.getElementById("mol-synonyms");
const elMolProfilePanel = document.getElementById("molecular-profile-panel");

// Timeline elements
const elTimelineSummary = document.getElementById("timeline-summary");
const timelinePhases = ["early-phase1", "phase1", "phase2", "phase3", "phase4"];

// Trials list elements
const elTotalTrialsCount = document.getElementById("total-trials-count");
const elTrialsGrid = document.getElementById("trials-grid");
const elTrialsLoader = document.getElementById("trials-loader");
const elTrialsEmpty = document.getElementById("trials-empty");
const elFilterStatus = document.getElementById("filter-status");
const elFilterPhase = document.getElementById("filter-phase");
const elFilterCountry = document.getElementById("filter-country");
const elPrevPageBtn = document.getElementById("prev-page-btn");
const elNextPageBtn = document.getElementById("next-page-btn");
const elPageIndicator = document.getElementById("page-indicator");

// Modal elements
const elStudyModal = document.getElementById("study-modal");
const elCloseModal = document.getElementById("close-modal");
const elModalNctId = document.getElementById("modal-nct-id");
const elModalTitle = document.getElementById("modal-title");
const elModalStatus = document.getElementById("modal-status");
const elModalPhase = document.getElementById("modal-phase");
const elModalSponsor = document.getElementById("modal-sponsor");
const elModalStartDate = document.getElementById("modal-start-date");
const elModalSummary = document.getElementById("modal-summary");
const elModalEligibility = document.getElementById("modal-eligibility");

/* ==========================================================================
   1. CANVAS INTERACTIVE BACKGROUND (CONSTELLATION NET)
   ========================================================================== */

const canvas = document.getElementById("bg-canvas");
const ctx = canvas.getContext("2d");

let particles = [];
const particleCount = 70;
const connectionDistance = 110;
const mouse = { x: null, y: null, radius: 150 };

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = (Math.random() - 0.5) * 0.4;
    this.radius = Math.random() * 2 + 1;
    this.baseAlpha = Math.random() * 0.5 + 0.2;
    this.alpha = this.baseAlpha;
    this.alphaSpeed = 0.005 + Math.random() * 0.005;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    // Bounce off edges
    if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
    if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

    // Pulse opacity
    this.alpha += this.alphaSpeed;
    if (this.alpha > 0.8 || this.alpha < 0.2) {
      this.alphaSpeed *= -1;
    }
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 240, 255, ${this.alpha})`;
    ctx.fill();
  }
}

function initParticles() {
  particles = [];
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  particles.forEach(p => {
    p.update();
    p.draw();
  });

  // Draw lines
  for (let i = 0; i < particles.length; i++) {
    const p1 = particles[i];
    
    // Draw line to mouse
    if (mouse.x !== null && mouse.y !== null) {
      const dx = p1.x - mouse.x;
      const dy = p1.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < mouse.radius) {
        const alpha = (1 - dist / mouse.radius) * 0.25;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = `rgba(0, 235, 212, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    for (let j = i + 1; j < particles.length; j++) {
      const p2 = particles[j];
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < connectionDistance) {
        const alpha = (1 - dist / connectionDistance) * 0.15;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
  }

  requestAnimationFrame(animateParticles);
}

// Attach background events
window.addEventListener("resize", resizeCanvas);
window.addEventListener("mousemove", (e) => {
  mouse.x = e.x;
  mouse.y = e.y;
});
window.addEventListener("mouseleave", () => {
  mouse.x = null;
  mouse.y = null;
});

// Run Canvas Engine
resizeCanvas();
initParticles();
animateParticles();

/* ==========================================================================
   2. SEARCH INTERFACE & SUGGESTIONS
   ========================================================================== */

// Input Typing: show autocomplete suggestions
elSearchInput.addEventListener("input", (e) => {
  const value = e.target.value.trim().toLowerCase();
  if (value.length < 2) {
    elAutocomplete.classList.add("hidden");
    return;
  }

  const matches = COMMON_SUGGESTIONS.filter(item => 
    item.name.toLowerCase().includes(value)
  );

  if (matches.length > 0) {
    elAutocomplete.innerHTML = matches.map(item => `
      <div class="autocomplete-item" data-value="${item.name}">
        <span>${item.name}</span>
        <span class="item-type">${item.type}</span>
      </div>
    `).join("");
    elAutocomplete.classList.remove("hidden");
  } else {
    elAutocomplete.classList.add("hidden");
  }
});

// Click autocomplete item
elAutocomplete.addEventListener("click", (e) => {
  const item = e.target.closest(".autocomplete-item");
  if (item) {
    elSearchInput.value = item.getAttribute("data-value");
    elAutocomplete.classList.add("hidden");
    triggerSearch();
  }
});

// Click outside suggestion closes it
document.addEventListener("click", (e) => {
  if (!elSearchInput.contains(e.target) && !elAutocomplete.contains(e.target)) {
    elAutocomplete.classList.add("hidden");
  }
});

// Quick tags click
elQuickTags.forEach(tag => {
  tag.addEventListener("click", () => {
    elSearchInput.value = tag.textContent;
    triggerSearch();
  });
});

// Enter key trigger
elSearchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    triggerSearch();
  }
});

// Analyze button trigger
elSearchBtn.addEventListener("click", triggerSearch);

function triggerSearch() {
  const query = elSearchInput.value.trim();
  if (!query) return;

  currentSearchQuery = query;
  currentPage = 1;
  nextPageToken = null;
  pageTokens = [null]; // reset pagination

  // Show spinner
  elSearchSpinner.classList.remove("hidden");
  elAutocomplete.classList.add("hidden");

  // Run searches
  Promise.all([
    searchPubChem(query),
    searchClinicalTrials(query)
  ]).finally(() => {
    elSearchSpinner.classList.add("hidden");
    elWelcomeView.classList.add("hidden");
    
    const elRegistriesView = document.getElementById("registries-view");
    if (elRegistriesView) elRegistriesView.classList.add("hidden");
    
    elDashboardView.classList.remove("hidden");
    
    // Set Dashboard tab as active in navigation
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(nav => nav.classList.remove("active"));
    const dashboardTab = document.querySelector('.nav-item[title="Dashboard"]');
    if (dashboardTab) dashboardTab.classList.add("active");
    
    // Reset scrolls so new query starts at the top
    window.scrollTo({ top: 0, behavior: "smooth" });
    const mainContent = document.querySelector(".main-content");
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
}

/* ==========================================================================
   3. PUBCHEM API INTEGRATION
   ========================================================================== */

async function searchPubChem(name) {
  try {
    resetMolecularCard();
    elMolProfilePanel.classList.remove("hidden");

    // Step 1: Resolve compound name to CID
    const urlCids = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/cids/JSON`;
    const cidResponse = await fetch(urlCids);
    if (!cidResponse.ok) throw new Error("Not a compound");
    
    const cidData = await cidResponse.json();
    const cid = cidData.IdentifierList.CID[0];

    // Update CID UI
    elMolCID.textContent = `CID ${cid}`;
    elMolCID.className = "badge badge-purple";

    // Step 2: Fetch chemical properties
    const urlProps = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,XLogP,TPSA/JSON`;
    const propsResponse = await fetch(urlProps);
    if (propsResponse.ok) {
      const propsData = await propsResponse.json();
      const props = propsData.PropertyTable.Properties[0];
      elMolFormula.textContent = props.MolecularFormula || "--";
      elMolWeight.textContent = props.MolecularWeight ? `${props.MolecularWeight} g/mol` : "--";
      elMolTPSA.textContent = props.TPSA ? `${props.TPSA} Å²` : "--";
      elMolXLogP.textContent = props.XLogP !== undefined ? props.XLogP : "--";
    }

    // Step 3: Fetch compound description
    const urlDesc = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/description/JSON`;
    fetch(urlDesc)
      .then(r => r.ok ? r.json() : null)
      .then(descData => {
        if (descData && descData.InformationList && descData.InformationList.Information) {
          const infoArray = descData.InformationList.Information;
          // Find first item with a Description
          const item = infoArray.find(info => info.Description);
          if (item) {
            elMolDescription.textContent = item.Description;
            return;
          }
        }
        elMolDescription.textContent = "No pharmacological summary description found in PubChem records.";
      })
      .catch(() => {
        elMolDescription.textContent = "No description loaded.";
      });

    // Step 4: Fetch Synonyms
    const urlSyn = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/synonyms/JSON`;
    fetch(urlSyn)
      .then(r => r.ok ? r.json() : null)
      .then(synData => {
        if (synData && synData.InformationList && synData.InformationList.Information) {
          const synonyms = synData.InformationList.Information[0].Synonym || [];
          // Display top 4 synonyms
          if (synonyms.length > 0) {
            elMolSynonyms.innerHTML = synonyms.slice(0, 4).map(s => `
              <span class="tag-synonym" title="${escapeHTML(s)}">${escapeHTML(s)}</span>
            `).join("");
            return;
          }
        }
        elMolSynonyms.innerHTML = `<span class="tag-synonym">None recorded</span>`;
      })
      .catch(() => {
        elMolSynonyms.innerHTML = `<span class="tag-synonym">None recorded</span>`;
      });

    // Step 5: Render 2D image structure
    elMolImg.src = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/PNG`;
    elMolImg.onload = () => {
      elMolImg.classList.remove("hidden");
      elMolPlaceholder.classList.add("hidden");
    };

  } catch (error) {
    // If name doesn't resolve in Pubchem, hide the molecular panel or show "disease search" message.
    elMolCID.textContent = "Disease / Condition";
    elMolCID.className = "badge badge-coral";
    elMolImg.classList.add("hidden");
    elMolPlaceholder.classList.remove("hidden");
    elMolPlaceholder.innerHTML = `
      <i data-lucide="shield-alert" class="icon-placeholder accent-coral"></i>
      <span class="accent-coral">Biological Condition Profile</span>
    `;
    lucide.createIcons();
    elMolFormula.textContent = "N/A";
    elMolWeight.textContent = "N/A";
    elMolTPSA.textContent = "N/A";
    elMolXLogP.textContent = "N/A";
    elMolDescription.textContent = `"${name}" is analyzed as a disease/condition. Displaying clinical trial statistics, geographic profiles, and study details on the explorer panels.`;
    elMolSynonyms.innerHTML = `<span class="tag-synonym">${escapeHTML(name)}</span>`;
  }
}

function resetMolecularCard() {
  elMolCID.textContent = "CID --";
  elMolImg.classList.add("hidden");
  elMolPlaceholder.classList.remove("hidden");
  elMolPlaceholder.innerHTML = `
    <i data-lucide="binary" class="icon-placeholder"></i>
    <span>Loading structure...</span>
  `;
  lucide.createIcons();
  elMolFormula.textContent = "--";
  elMolWeight.textContent = "--";
  elMolTPSA.textContent = "--";
  elMolXLogP.textContent = "--";
  elMolDescription.textContent = "Fetching pharmacological summary...";
  elMolSynonyms.innerHTML = `<span class="tag-synonym">--</span>`;
}

/* ==========================================================================
   4. CLINICALTRIALS.GOV API INTEGRATION & RENDER
   ========================================================================== */

async function searchClinicalTrials(query) {
  // Reset grids and details
  elTrialsGrid.innerHTML = "";
  elTrialsEmpty.classList.add("hidden");
  elTrialsLoader.classList.remove("hidden");

  try {
    // Phase 1: Fetch overall statistics (maximum 300 records, light fields)
    const statsUrl = `https://clinicaltrials.gov/api/v2/studies?query.term=${encodeURIComponent(query)}&pageSize=300&fields=protocolSection.designModule.phases,protocolSection.statusModule.overallStatus`;
    const statsResponse = await fetch(statsUrl);
    if (!statsResponse.ok) throw new Error("Failed to load trial statistics");
    const statsData = await statsResponse.json();

    const studies = statsData.studies || [];
    compileTrialStats(studies);

    // Phase 2: Load paginated grid items
    await loadPaginatedTrials();

  } catch (error) {
    console.error("Clinical trials fetch error:", error);
    elTrialsLoader.classList.add("hidden");
    elTrialsEmpty.classList.remove("hidden");
    elTotalTrialsCount.textContent = "0 Trials found";
  }
}

// Compile stats from the list of studies
function compileTrialStats(studies) {
  const phaseCounts = {
    'early-phase1': 0, // Phase 0
    'phase1': 0,
    'phase2': 0,
    'phase3': 0,
    'phase4': 0,
    'na': 0
  };

  studies.forEach(study => {
    const phases = study.protocolSection?.designModule?.phases || [];
    if (phases.length === 0) {
      phaseCounts['na']++;
    } else {
      phases.forEach(p => {
        const mapped = p.toLowerCase().replace('_', '-');
        if (phaseCounts[mapped] !== undefined) {
          phaseCounts[mapped]++;
        } else {
          phaseCounts['na']++;
        }
      });
    }
  });

  // Calculate total active/completed count
  const totalInStats = studies.length;

  // 1. Update Timeline counters
  elTimelineSummary.textContent = `${totalInStats} studies analyzed in aggregate`;
  
  timelinePhases.forEach(ph => {
    document.getElementById(`count-${ph}`).textContent = phaseCounts[ph];
  });

  // Highlight current active phase (highest count among 1 to 4)
  let maxCount = 0;
  let activePhase = null;
  timelinePhases.forEach(ph => {
    const count = phaseCounts[ph];
    const element = document.querySelector(`.timeline-step[data-phase="${ph}"]`);
    element.className = "timeline-step"; // reset classes
    
    if (count > 0) {
      element.classList.add("completed");
    }
    
    if (count > maxCount) {
      maxCount = count;
      activePhase = ph;
    }
  });

  if (activePhase) {
    const activeElement = document.querySelector(`.timeline-step[data-phase="${activePhase}"]`);
    activeElement.className = "timeline-step active";
  }

  // 2. Render Chart.js shares
  renderPhaseChart(phaseCounts);
}

// Render curved area phase chart with neon gradients
function renderPhaseChart(phaseCounts) {
  const chartCanvas = document.getElementById("phase-chart");
  
  if (chartInstance) {
    chartInstance.destroy();
  }

  const dataValues = [
    phaseCounts['early-phase1'],
    phaseCounts['phase1'],
    phaseCounts['phase2'],
    phaseCounts['phase3'],
    phaseCounts['phase4']
  ];

  // If no data, show dummy values
  const hasData = dataValues.some(v => v > 0);
  const chartData = hasData ? dataValues : [0, 0, 0, 0, 0];

  chartInstance = new Chart(chartCanvas, {
    type: 'radar',
    data: {
      labels: ['Phase 0', 'Phase I', 'Phase II', 'Phase III', 'Phase IV'],
      datasets: [{
        label: 'Clinical Trial Share',
        data: chartData,
        backgroundColor: 'rgba(0, 240, 255, 0.15)',
        borderColor: '#00f0ff',
        borderWidth: 2,
        pointBackgroundColor: '#00ebd4',
        pointBorderColor: '#05070f',
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#a855f7',
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        r: {
          angleLines: { color: 'rgba(255, 255, 255, 0.05)' },
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          pointLabels: {
            color: '#94a3b8',
            font: { family: 'Outfit', size: 11, weight: '500' }
          },
          ticks: {
            display: false,
            maxTicksLimit: 3
          }
        }
      }
    }
  });
}

// Load paginated list of matching clinical trial cards
async function loadPaginatedTrials() {
  elTrialsGrid.innerHTML = "";
  elTrialsLoader.classList.remove("hidden");
  elTrialsEmpty.classList.add("hidden");

  // Construct filters
  let url = `https://clinicaltrials.gov/api/v2/studies?query.term=${encodeURIComponent(currentSearchQuery)}&pageSize=10`;
  
  if (filterStatus) {
    url += `&filter.overallStatus=${filterStatus}`;
  }

  let advFilters = [];
  if (filterPhase) {
    advFilters.push(`AREA[Phase]${filterPhase}`);
  }
  if (advFilters.length > 0) {
    url += `&filter.advanced=${encodeURIComponent(advFilters.join(' AND '))}`;
  }

  if (filterCountry) {
    url += `&query.locn=${encodeURIComponent(filterCountry)}`;
  }

  // Page token check
  const activeToken = pageTokens[currentPage];
  if (activeToken) {
    url += `&pageToken=${encodeURIComponent(activeToken)}`;
  }

  // Count total fields
  url += `&countTotal=true`;
  url += `&fields=protocolSection.identificationModule.nctId,protocolSection.identificationModule.briefTitle,protocolSection.statusModule.overallStatus,protocolSection.designModule.phases,protocolSection.descriptionModule.briefSummary,protocolSection.sponsorCollaboratorsModule.leadSponsor.name,protocolSection.eligibilityModule.eligibilityCriteria,protocolSection.statusModule.startDateStruct.date`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to load studies list");
    const data = await response.json();

    elTrialsLoader.classList.add("hidden");

    const totalCount = data.totalCount || 0;
    elTotalTrialsCount.textContent = `${totalCount} Trials found`;

    const studies = data.studies || [];
    if (studies.length === 0) {
      elTrialsEmpty.classList.remove("hidden");
      elPrevPageBtn.disabled = currentPage === 1;
      elNextPageBtn.disabled = true;
      return;
    }

    // Capture nextPageToken
    nextPageToken = data.nextPageToken || null;

    // Render Cards
    studies.forEach(study => {
      const pSec = study.protocolSection;
      const nctId = pSec.identificationModule?.nctId || "NCT--";
      const title = pSec.identificationModule?.briefTitle || "No Title Loaded";
      const status = pSec.statusModule?.overallStatus || "UNKNOWN";
      const phases = pSec.designModule?.phases || [];
      const summary = pSec.descriptionModule?.briefSummary || "No description provided.";
      const sponsor = pSec.sponsorCollaboratorsModule?.leadSponsor?.name || "Unknown Sponsor";
      const eligibility = pSec.eligibilityModule?.eligibilityCriteria || "Not provided.";
      const startDate = pSec.statusModule?.startDateStruct?.date || "No Start Date";

      // Formulate Phase string
      const phaseStr = phases.length > 0 ? phases.join('/') : "Phase N/A";
      const statusClean = status.replace(/_/g, ' ');

      // Badges classes
      let statusClass = "badge-teal";
      if (status === "RECRUITING") statusClass = "badge-green";
      else if (status === "COMPLETED") statusClass = "badge-teal";
      else if (["SUSPENDED", "TERMINATED", "WITHDRAWN"].includes(status)) statusClass = "badge-coral";
      else statusClass = "badge-cyan";

      const card = document.createElement("div");
      card.className = "trial-card";
      
      const cleanedSummary = cleanEligibilityText(summary);
      const cleanedEligibility = cleanEligibilityText(eligibility);
      
      card.innerHTML = `
        <div class="card-top">
          <div class="card-badges">
            <span class="badge ${statusClass}">${escapeHTML(statusClean)}</span>
            <span class="badge badge-purple">${escapeHTML(phaseStr)}</span>
          </div>
          <span class="card-nct">${escapeHTML(nctId)}</span>
        </div>
        <h4>${escapeHTML(title)}</h4>
        <p>${escapeHTML(cleanedSummary)}</p>
        <div class="card-bottom">
          <div class="sponsor-info">
            <i data-lucide="building-2"></i>
            <span class="sponsor-name" title="${escapeHTML(sponsor)}">${escapeHTML(sponsor)}</span>
          </div>
          <span class="view-link">
            <span>Details</span>
            <i data-lucide="arrow-up-right"></i>
          </span>
        </div>
      `;

      // Setup click modal event
      card.addEventListener("click", () => {
        openDetailModal({
          nctId,
          title,
          status: statusClean,
          statusClass,
          phase: phaseStr,
          sponsor,
          summary: cleanedSummary,
          eligibility: cleanedEligibility,
          startDate
        });
      });

      elTrialsGrid.appendChild(card);
    });

    // Update Pagination indicators
    elPageIndicator.textContent = `Page ${currentPage}`;
    elPrevPageBtn.disabled = currentPage === 1;
    elNextPageBtn.disabled = !nextPageToken;

    // Draw icons inside cards
    lucide.createIcons();

  } catch (error) {
    console.error("Pagination load error:", error);
    elTrialsLoader.classList.add("hidden");
    elTrialsEmpty.classList.remove("hidden");
  }
}

/* ==========================================================================
   5. FILTER HANDLERS
   ========================================================================== */

elFilterStatus.addEventListener("change", (e) => {
  filterStatus = e.target.value;
  currentPage = 1;
  pageTokens = [null];
  loadPaginatedTrials();
});

elFilterPhase.addEventListener("change", (e) => {
  filterPhase = e.target.value;
  currentPage = 1;
  pageTokens = [null];
  loadPaginatedTrials();
});

// Delay country search input execution (debounce)
let countryDebounce = null;
elFilterCountry.addEventListener("input", (e) => {
  clearTimeout(countryDebounce);
  countryDebounce = setTimeout(() => {
    filterCountry = e.target.value.trim();
    currentPage = 1;
    pageTokens = [null];
    loadPaginatedTrials();
  }, 500);
});

/* ==========================================================================
   6. PAGINATION CONTROLS
   ========================================================================== */

elPrevPageBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    loadPaginatedTrials();
  }
});

elNextPageBtn.addEventListener("click", () => {
  if (nextPageToken) {
    currentPage++;
    pageTokens[currentPage] = nextPageToken; // Cache the next page token
    loadPaginatedTrials();
  }
});

/* ==========================================================================
   7. STUDY DETAIL MODAL HANDLERS
   ========================================================================== */

function openDetailModal(study) {
  elModalNctId.textContent = study.nctId;
  elModalTitle.textContent = study.title;
  elModalStatus.textContent = study.status;
  elModalStatus.className = `meta-val badge ${study.statusClass}`;
  elModalPhase.textContent = study.phase;
  elModalSponsor.textContent = study.sponsor;
  elModalStartDate.textContent = study.startDate;
  elModalSummary.textContent = study.summary;
  elModalEligibility.textContent = study.eligibility;

  elStudyModal.classList.remove("hidden");
  document.body.style.overflow = "hidden"; // disable scroll
}

function closeModal() {
  elStudyModal.classList.add("hidden");
  document.body.style.overflow = "auto"; // enable scroll
}

elCloseModal.addEventListener("click", closeModal);
elStudyModal.addEventListener("click", (e) => {
  if (e.target === elStudyModal) {
    closeModal();
  }
});

// Close modal on Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !elStudyModal.classList.contains("hidden")) {
    closeModal();
  }
});

// Sidebar & Bottom Tab Navigation View Switch & Scroll Interaction
const navItems = document.querySelectorAll(".nav-item");
navItems.forEach(item => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    
    // Switch active state classes
    navItems.forEach(nav => nav.classList.remove("active"));
    item.classList.add("active");
    
    const title = item.getAttribute("title");
    const elRegistriesView = document.getElementById("registries-view");
    
    if (title === "Registries") {
      // Show Registries view, hide others
      elWelcomeView.classList.add("hidden");
      elDashboardView.classList.add("hidden");
      if (elRegistriesView) elRegistriesView.classList.remove("hidden");
      
      // Scroll to top of registries view
      window.scrollTo({ top: 0, behavior: "smooth" });
      const mainContent = document.querySelector(".main-content");
      if (mainContent) mainContent.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    
    // For other tabs, ensure registries is hidden
    if (elRegistriesView) elRegistriesView.classList.add("hidden");
    
    // Check if a search was already performed
    const hasSearch = !elDashboardView.classList.contains("hidden") || currentSearchQuery !== "";
    
    if (hasSearch) {
      elWelcomeView.classList.add("hidden");
      elDashboardView.classList.remove("hidden");
    } else {
      elWelcomeView.classList.remove("hidden");
      elDashboardView.classList.add("hidden");
    }
    
    if (title === "Dashboard") {
      // Scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });
      const mainContent = document.querySelector(".main-content");
      if (mainContent) mainContent.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // If no search run, focus search bar at the top of welcome page
      if (!hasSearch) {
        elSearchInput.focus();
        elSearchInput.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      
      if (title === "Clinical Trials" || title === "Trials") {
        const elTrialsSection = document.querySelector(".trials-list-panel");
        if (elTrialsSection) {
          elTrialsSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      } else if (title === "Molecular Profiles" || title === "Molecules") {
        const elMolSection = document.querySelector(".molecular-card");
        if (elMolSection) {
          elMolSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }
  });
});
