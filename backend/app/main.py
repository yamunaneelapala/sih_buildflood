from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.schemas import (
    CitizenReportRequest,
    DamBreakRequest,
    DashboardResponse,
    ReportStatusRequest,
    ScenarioRequest,
)
from app.services.flood_service import (
    create_citizen_report,
    get_alerts,
    get_dashboard_data,
    get_map_data as build_map_data,
    launch_demo_scenario,
    seed_demo_data,
    simulate_dam_break,
    update_report_status,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    seed_demo_data()
    yield


app = FastAPI(
    title="FloodGuard AI",
    version="1.0.0",
    description="AI-powered flood prediction and emergency coordination prototype",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check() -> dict:
    return {"status": "ok", "service": "FloodGuard AI API"}


@app.get("/api/dashboard", response_model=DashboardResponse)
def get_dashboard() -> dict:
    data = get_dashboard_data()
    if not data:
        raise HTTPException(status_code=503, detail="Dashboard data unavailable")
    return data


@app.get("/api/map-data")
def get_map_data() -> dict:
    return build_map_data()


@app.get("/api/rescue-operations")
def get_rescue_operations() -> dict:
    data = get_dashboard_data()
    return {"teams": data["rescue_teams"], "reports": data["reports"], "source": "SIMULATED / DEMONSTRATION"}


@app.post("/api/reports")
def submit_report(payload: CitizenReportRequest) -> dict:
    report = create_citizen_report(payload.model_dump())
    return {"status": "queued", "message": "Rescue request received and routed to the operations desk.", "report": report}


@app.patch("/api/reports/{report_id}/status")
def set_report_status(report_id: int, payload: ReportStatusRequest) -> dict:
    report = update_report_status(report_id, payload.status)
    if report is None:
        raise HTTPException(status_code=404, detail="Rescue request not found")
    return report


@app.post("/api/simulation/scenario", response_model=DashboardResponse)
def run_demo_scenario(payload: ScenarioRequest) -> dict:
    return launch_demo_scenario(payload.intensity)


@app.post("/api/simulation/dam-break", response_model=DashboardResponse)
def run_dam_break(payload: DamBreakRequest) -> dict:
    return simulate_dam_break(payload.dam_name, payload.release_volume_mcm)


@app.get("/api/alerts")
def list_alerts() -> dict:
    return {"alerts": get_alerts(), "source": "SIMULATED / DEMONSTRATION"}


@app.post("/api/alerts/trigger", response_model=DashboardResponse)
def trigger_alert() -> dict:
    return launch_demo_scenario("severe")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
