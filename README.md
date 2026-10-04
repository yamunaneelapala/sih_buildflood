# FLOODGUARD AI

Prototype for a Smart India Hackathon flood-risk and rescue coordination platform.

## Stack

- Frontend: React + Vite + Tailwind + Leaflet + Recharts
- Backend: FastAPI + SQLAlchemy + SQLite
- Data model: simulation-first architecture with clear `simulated` vs verified tagging

## Open the standalone demonstration

For a frontend demonstration without starting a server, open `frontend\index.html` in Microsoft Edge (double-click it in File Explorer, or right-click and choose **Open with → Microsoft Edge**). It runs from the `file://` protocol with embedded styles, scripts, map layers, and clearly labelled SIMULATED / DEMONSTRATION data; it makes no network requests and does not need Vite, npm, or the FastAPI backend.

The standalone version includes the landing page and interactive command center, local flood and dam-break scenarios, clickable map features, sample evacuation routes, alerts, shelter/rescue status, and a citizen help form. Requests and status updates are stored only in the browser's local storage and do not reach emergency services. This local-only mode is for presentations, not operational use.

The existing React application remains the version used when the same page is opened through Vite. Its API-backed features still require the backend and frontend servers described below.

## Run locally

### 1) Install frontend dependencies

```bash
cd frontend
npm install
```

### 2) Install backend dependencies

```bash
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

### 3) Start the backend

```bash
cd backend
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 4) Start the frontend

```bash
cd frontend
npm run dev -- --host 0.0.0.0
```

The UI is available on `http://localhost:5173` and the API is available on `http://localhost:8000`.

The presentation-ready landing page is the entry screen. Open the command center from its primary button; launch the demo scenario there or directly from the landing page. The command center adds simulation-labelled rainfall, river-level and population exposure trends, flood-risk KPIs, evacuation progress, shelter occupancy and rescue-desk status.

## End-to-end demonstration

The Flood Map controls call `POST /api/simulation/scenario` and `POST /api/simulation/dam-break`. The dashboard, GeoJSON risk zones, facilities, safe routes, rescue requests, and alerts are loaded from the FastAPI service. Vite proxies `/api` requests to `http://127.0.0.1:8000` during development; the backend also enables local browser CORS.

The citizen help form creates a persisted demonstration rescue request with `POST /api/reports`. Rescue Operations can update its status with `PATCH /api/reports/{id}/status`. All generated flood, facility, route, alert, and request data is labelled **SIMULATED / DEMONSTRATION** and is not connected to real emergency services.

With the backend running, run the backend integration journeys from the `backend` directory:

```powershell
..\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

## Notes

- The current prototype uses simulated flood intelligence to demonstrate the full workflow without relying on proprietary or unavailable external APIs.
- If the backend cannot be reached, the frontend clearly indicates that it is using DEMO DATA and keeps the main simulation and citizen-request interactions available locally.
- If OpenStreetMap tiles cannot be reached, the map labels the basemap outage and keeps its local GeoJSON polygons, markers, and routes visible over a grid fallback.
- The backend is structured so official weather, river, and GIS feeds can be swapped in later without changing the user experience.
