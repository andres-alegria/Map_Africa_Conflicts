# Conflicts between communities and agribusinesses in the Congo Basin

An interactive Leaflet map of disputes between rural communities and agribusinesses
across the Congo Basin and neighbouring countries. Points are colored by conflict
intensity (High / Medium / Low).

## Run locally

The map loads `data/points.csv` via fetch, which browsers block when you open
`index.html` directly from disk. Serve the folder over HTTP instead:

```bash
cd Congo_Basin_Conflicts
python3 -m http.server 8000
# then open http://localhost:8000
```

## Editing

Almost everything editorial lives in the `CONFIG` object at the top of
`js/app.js`:

- **title / subtitle / footnote** — header and caption text.
- **headerBg** — banner color (currently charcoal `#181818`).
- **colors** — marker + legend color per `Intensity` value. The keys must match
  the `Intensity` column in `data/points.csv` exactly; their order sets the
  legend order.
- **popupFields** — which CSV columns appear in each marker popup, and their
  labels. The popup heading uses `Locality`.

## Data

`data/points.csv` columns: `Locality, Country, Lat, Long, Company,
Company_Description, Conflict_type, Intensity, Status, Year`. Use `Lat` / `Long`
to plot points. 29 locations across DRC, Cameroon, Rwanda, Burundi,
Ivory Coast and Chad.
