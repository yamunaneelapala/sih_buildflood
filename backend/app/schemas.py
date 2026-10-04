from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class RiskZoneOut(BaseModel):
    id: int
    name: str
    severity: str
    population: int
    lat: float
    lon: float
    radius_meters: float
    is_verified: bool
    status: str


class ShelterOut(BaseModel):
    id: int
    name: str
    category: str
    capacity: int
    occupancy: int
    lat: float
    lon: float
    accessible: bool
    status: str


class RescueTeamOut(BaseModel):
    id: int
    name: str
    leader: str
    specialty: str
    resources: str
    status: str
    assigned_zone: str


class CitizenReportOut(BaseModel):
    id: int
    reporter: str
    locality: str
    issue_type: str
    severity: str
    lat: float
    lon: float
    description: str
    resolved: bool
    status: str = "pending"


class DashboardResponse(BaseModel):
    status: str
    event_name: str
    district: str
    state: str
    severity: str
    warning_source: str
    risk_score: float = Field(..., ge=0, le=100)
    people_at_risk: int
    water_coverage: float
    alert_window_hours: float
    map_center: list[float]
    zones: list[RiskZoneOut]
    shelters: list[ShelterOut]
    rescue_teams: list[RescueTeamOut]
    reports: list[CitizenReportOut]
    evacuation_priority: list[str]
    safe_routes: list[dict]
    kpis: dict


class ScenarioRequest(BaseModel):
    intensity: Literal["moderate", "severe"] = "severe"


class DamBreakRequest(BaseModel):
    dam_name: str = Field(default="Kosi Barrage", min_length=2, max_length=120)
    release_volume_mcm: float = Field(default=35, ge=1, le=500)


class CitizenReportRequest(BaseModel):
    reporter: str = Field(default="Anonymous citizen", min_length=2, max_length=120)
    locality: str = Field(min_length=2, max_length=120)
    issue_type: str = Field(default="rescue_request", min_length=2, max_length=80)
    severity: Literal["low", "medium", "high", "critical"] = "high"
    lat: float = Field(default=25.618, ge=-90, le=90)
    lon: float = Field(default=85.156, ge=-180, le=180)
    description: str = Field(min_length=5, max_length=2000)


class ReportStatusRequest(BaseModel):
    status: Literal["pending", "assigned", "in_progress", "resolved"]
