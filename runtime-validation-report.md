# Runtime Validation Report

**Generated:** 2026-10-04  
**Target:** `C:\SIH`

## Summary

| Step | Status | Exit code | Details |
|---|---|---:|---|
| Startup | PASS | n/a | FastAPI `/api/health` and Vite `/` both responded successfully. |
| Backend integration | PASS | 0 | 3 unittest modules passed: routes/map layers, simulations, and citizen rescue request persistence/status updates. |
| Frontend build | PASS | 0 | `npm run build` completed. Vite reports the existing >500 kB bundle-size advisory. |
| Frontend lint | PASS | 0 | `npm run lint` completed with no lint findings. |
| Browser flow | PASS | 0 | Dashboard → map → scenario → dam break → risk → evacuation → shelters → safe route → rescue operations → citizen request → alerts. No page errors. |
| Map outage fallback | PASS | 0 | Blocked OpenStreetMap tile requests; the map showed its DEMO DATA fallback label and retained 13 interactive SVG map paths. |
| CORS | PASS | 0 | Browser-origin OPTIONS preflight for `http://localhost:5173` returned 200 with the expected allow-origin header. |

## Test Evidence

- Backend: `python -m unittest discover -s tests -v` — 3 tests passed.
- Python source and tests compiled successfully with `compileall`.
- Browser verified flood-zone popup, GeoJSON layer rendering, backend KPI updates, dam-break API, persisted help request, rescue status update, and active alerts.
- API route coverage: health, dashboard, map data, rescue operations, report creation, report status update, scenario simulation, dam-break simulation, alert listing, and alert trigger.

## Environment and Gaps

- Docker: unavailable; the app uses its configured local SQLite database and does not require Docker.
- Node.js: available (`v24.19.0`).
- Browser validation: available through the VS Code integrated browser.
- External feeds: weather, river, and GIS providers are not connected; application data is explicitly simulated/demonstration data.
- Basemap tiles: OpenStreetMap is external. When blocked, local DEMO DATA polygons, markers, and routes remain visible over the local grid fallback.
- Authentication: not implemented by this prototype; authentication-failure testing is not applicable.
- Build advisory: the production JavaScript bundle is approximately 850 kB minified. This is a warning, not a build failure.

**Overall:** PASS for the local demonstration workflow; not connected to real emergency dispatch or live flood feeds.
