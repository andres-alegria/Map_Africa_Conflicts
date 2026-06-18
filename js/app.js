/* ============================================================================
   COMMUNITY–AGRIBUSINESS CONFLICTS MAP  —  EDITORIAL CONFIG
   ----------------------------------------------------------------------------
   Almost everything you'll want to change lives in the CONFIG object below.
   You normally won't need to touch the code further down.
   ========================================================================== */

const CONFIG = {

  /* ---- TEXT -------------------------------------------------------------- */
  // EDIT: the title (Rowan font) and subtitle (Public Sans) shown in the header,
  // and the footnote shown under the map.
  title:    "Conflicts between communities and agribusinesses in the Congo Basin",
  subtitle: "Mapping land, environmental and labour disputes between rural " +
            "communities and agribusinesses across the Congo Basin and beyond.",
  footnote: "Coordinates are approximate site locations for visualization, not " +
            "survey points. Intensity reflects the reported severity of the " +
            "community–company conflict; status indicates whether the dispute is " +
            "currently active, resolved, or tied to a failed venture.<br>" +
            "Sources: HydroSheds; Mongabay Investigation",

  /* ---- COLORS & FONTS ---------------------------------------------------- */
  // EDIT: header background color.
  headerBg:    "#181818",   // Charcoal
  headerText:  "#FCFCFC",

  // EDIT: font sizes (any CSS unit). Font FAMILIES are set in css/style.css.
  titleSize:    "30px",   // also auto-shrinks on small screens (see style.css)
  subtitleSize: "14px",
  bodySize:     "13px",   // legend, popup, footnote

  // EDIT: dot color per INTENSITY. The KEY must match the "Intensity" column
  // value in data/points.csv exactly. Order here also sets the legend order.
  colors: {
    "High":   "#530e0d",
    "Medium": "#e66d6d",
    "Low":    "#f6bcb3"
  },

  /* ---- MARKERS ----------------------------------------------------------- */
  markerRadius:   7,      // EDIT: uniform marker size (px). Same for every point.
  markerOpacity:  0.9,
  markerStroke:   "#ffffff",
  markerStrokeW:  1.5,

  /* ---- BASEMAP ----------------------------------------------------------- */
  // EDIT: swap the basemap here.
  //   • Default below is CARTO Positron (free, no key).
  //   • To use a MAPBOX STYLE, set basemapUrl to:
  //       https://api.mapbox.com/styles/v1/USERNAME/STYLEID/tiles/256/{z}/{x}/{y}@2x?access_token=YOUR_TOKEN
  basemapUrl: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  basemapAttribution: "© OpenStreetMap © CARTO",

  /* ---- BACKGROUND POLYGON (Congo Basin extent) --------------------------- */
  // EDIT: GeoJSON drawn beneath the markers as a background. Set basinPath to
  // null to hide it. Colors/opacity/outline are spec'd here.
  basinPath:        "data/congo_basin.json",
  basinFill:        "#bdeaaf",
  basinFillOpacity: 0.7,
  basinOutline:     "#006a54",
  basinWeight:      0.5,    // outline width (px ≈ pt at screen scale)
  basinLabel:       "Congo Basin extent",
  // EDIT: CSS blend mode for the fill against the basemap below.
  //   "normal"   = plain opacity (no blending)
  //   "multiply" = "Darken"-style: multiplies colors, darkening what's beneath
  //   "darken"   = keeps the darker of fill vs. basemap, pixel by pixel
  //   other options: "overlay", "screen", "color-burn", etc.
  basinBlend:       "multiply",

  // EDIT: starting view. If fitToData is true the map auto-frames all points
  // on load and ignores center/zoom.
  fitToData: true,
  center: [-1, 22],
  zoom: 4,

  /* ---- DATA -------------------------------------------------------------- */
  // EDIT: path to the CSV. Update that file to change points & popup content.
  csvPath: "data/points.csv",
  latField: "Lat",
  lonField: "Long",
  typeField: "Intensity",   // drives marker color + legend

  // EDIT: which CSV columns appear in the popup, and their display labels.
  // Reorder, remove, or add rows freely — each must be a column in the CSV.
  // The popup heading always uses the popupHeadingField column.
  popupHeadingField: "Locality",
  popupFields: [
    { field: "Country",             label: "Country" },
    { field: "Company",             label: "Company" },
    { field: "Company_Description", label: "Company description" },
    { field: "Conflict_type",       label: "Conflict type" },
    { field: "Intensity",           label: "Intensity" },
    { field: "Status",              label: "Status" },
    { field: "Year",                label: "Year" }
  ],
  // EDIT: column holding a URL to render as a link (or set to null).
  linkField: null,
  linkLabel: ""
};

/* ============================================================================
   ENGINE  —  you usually don't need to edit below this line.
   ========================================================================== */

// Push config-driven values into CSS variables so style.css can use them.
(function applyTheme() {
  const r = document.documentElement.style;
  r.setProperty("--header-bg", CONFIG.headerBg);
  r.setProperty("--header-text", CONFIG.headerText);
  r.setProperty("--title-size", CONFIG.titleSize);
  r.setProperty("--subtitle-size", CONFIG.subtitleSize);
  r.setProperty("--body-size", CONFIG.bodySize);
})();

document.getElementById("title").textContent = CONFIG.title;
document.getElementById("subtitle").textContent = CONFIG.subtitle;
document.getElementById("footnote").innerHTML = CONFIG.footnote;

const map = L.map("map", { scrollWheelZoom: true }).setView(CONFIG.center, CONFIG.zoom);
L.tileLayer(CONFIG.basemapUrl, { maxZoom: 19, attribution: CONFIG.basemapAttribution }).addTo(map);

// Background polygon (Congo Basin extent). Loaded first so markers sit on top.
// Uses its own Leaflet pane below the marker pane to guarantee stacking order.
function loadBasin() {
  if (!CONFIG.basinPath) return;
  map.createPane("basinPane");
  map.getPane("basinPane").style.zIndex = 350;          // below markers (overlayPane=400)
  map.getPane("basinPane").style.pointerEvents = "none"; // never intercepts marker clicks
  if (CONFIG.basinBlend && CONFIG.basinBlend !== "normal") {
    map.getPane("basinPane").style.mixBlendMode = CONFIG.basinBlend;
  }
  fetch(CONFIG.basinPath)
    .then(r => r.json())
    .then(geo => {
      L.geoJSON(geo, {
        pane: "basinPane",
        interactive: false,
        style: {
          fillColor:   CONFIG.basinFill,
          fillOpacity: CONFIG.basinFillOpacity,
          color:       CONFIG.basinOutline,
          weight:      CONFIG.basinWeight,
          opacity:     1
        }
      }).addTo(map);
    })
    .catch(err => console.error("Could not load basin polygon:", err));
}
loadBasin();

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function buildPopup(row) {
  const heading = esc(row[CONFIG.popupHeadingField] || "");
  const type = row[CONFIG.typeField] || "";
  const color = CONFIG.colors[type] || "#888";
  let rows = "";
  CONFIG.popupFields.forEach(f => {
    let val = row[f.field];
    if (val == null || val === "") return;
    rows += `<tr><td class="k">${esc(f.label)}</td><td>${esc(val)}</td></tr>`;
  });
  if (CONFIG.linkField && row[CONFIG.linkField]) {
    rows += `<tr><td class="k"></td><td><a href="${esc(row[CONFIG.linkField])}" ` +
            `target="_blank" rel="noopener">${esc(CONFIG.linkLabel)}</a></td></tr>`;
  }
  return `<div class="popup"><h3>${heading}</h3>` +
         `<span class="st" style="background:${color}">${esc(type)}</span>` +
         `<table>${rows}</table></div>`;
}

function buildLegend(typesPresent) {
  const el = document.getElementById("legend");
  el.innerHTML = "";
  Object.keys(CONFIG.colors).forEach(type => {
    if (typesPresent && !typesPresent.has(type)) return;
    const item = document.createElement("div");
    item.className = "legend-item";
    item.innerHTML = `<span class="dot" style="background:${CONFIG.colors[type]}"></span>${esc(type)}`;
    el.appendChild(item);
  });
  // Background polygon swatch (square) appended after the intensity dots.
  if (CONFIG.basinPath && CONFIG.basinLabel) {
    const b = document.createElement("div");
    b.className = "legend-item";
    b.innerHTML = `<span class="swatch" style="background:${CONFIG.basinFill};` +
                  `opacity:${CONFIG.basinFillOpacity};border-color:${CONFIG.basinOutline}"></span>` +
                  `${esc(CONFIG.basinLabel)}`;
    el.appendChild(b);
  }
}

function render(rows) {
  const bounds = [];
  const typesPresent = new Set();

  rows.forEach(row => {
    const lat = parseFloat(row[CONFIG.latField]);
    const lon = parseFloat(row[CONFIG.lonField]);
    if (isNaN(lat) || isNaN(lon)) return;
    const type = row[CONFIG.typeField] || "";
    typesPresent.add(type);

    L.circleMarker([lat, lon], {
      radius: CONFIG.markerRadius,
      color: CONFIG.markerStroke,
      weight: CONFIG.markerStrokeW,
      fillColor: CONFIG.colors[type] || "#888",
      fillOpacity: CONFIG.markerOpacity
    }).addTo(map).bindPopup(buildPopup(row), { maxWidth: 320 });
    bounds.push([lat, lon]);
  });

  buildLegend(typesPresent);
  if (CONFIG.fitToData && bounds.length) map.fitBounds(bounds, { padding: [40, 40] });
}

// Load the CSV. (Served over http/https this just works. Opening index.html
// directly from disk may block this fetch — run a local server or deploy.)
Papa.parse(CONFIG.csvPath, {
  download: true,
  header: true,
  skipEmptyLines: true,
  complete: res => render(res.data),
  error: err => {
    document.getElementById("legend").innerHTML =
      '<span style="color:#a33">Could not load data/points.csv — ' +
      'serve the folder over http (see README), then reload.</span>';
    console.error(err);
  }
});
