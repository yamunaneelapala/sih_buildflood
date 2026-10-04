from __future__ import annotations

import math

from sqlalchemy.orm import Session

from app.database import SessionLocal, init_db
from app.models import AlertThreshold, CitizenReport, FloodEvent, RescueTeam, RiskZone, Shelter


def seed_demo_data() -> None:
    init_db()
    db: Session = SessionLocal()
    try:
        existing_event = db.query(FloodEvent).first()
        if existing_event is not None:
            if existing_event.warning_source.strip().lower() == "simulated":
                existing_event.warning_source = "SIMULATED / DEMONSTRATION"
            if not any(zone.name == "Canal Road" for zone in existing_event.risk_zones):
                db.add(
                    RiskZone(
                        event_id=existing_event.id,
                        name="Canal Road",
                        severity="medium",
                        population=17800,
                        lat=25.6060,
                        lon=85.1810,
                        radius_meters=2600,
                        is_verified=False,
                        status="monitoring",
                    )
                )
            else:
                next(
                    zone for zone in existing_event.risk_zones if zone.name == "Canal Road"
                ).is_verified = False
            db.commit()
            return

        event = FloodEvent(
            name="Monsoon Surge - District West",
            district="Patna",
            state="Bihar",
            severity="Extreme",
            status="predicted",
            warning_source="SIMULATED / DEMONSTRATION",
            risk_score=82.4,
            estimated_people_at_risk=128450,
            water_coverage=38.2,
            alert_window_hours=6.5,
            description="Heavy rainfall and rising river levels are expected to inundate low-lying neighborhoods and critical transport corridors.",
        )
        db.add(event)
        db.flush()

        db.add_all([
            AlertThreshold(
                event_id=event.id,
                rainfall_mm=90.0,
                river_level_m=12.6,
                predicted_inundation_pct=45.0,
                evacuation_priority="critical",
            ),
            RiskZone(
                event_id=event.id,
                name="North River Belt",
                severity="critical",
                population=42000,
                lat=25.6210,
                lon=85.1440,
                radius_meters=5800,
                is_verified=False,
                status="evacuating",
            ),
            RiskZone(
                event_id=event.id,
                name="Old Town Cluster",
                severity="high",
                population=28100,
                lat=25.6120,
                lon=85.1650,
                radius_meters=4300,
                is_verified=False,
                status="pending",
            ),
            RiskZone(
                event_id=event.id,
                name="Canal Road",
                severity="medium",
                population=17800,
                lat=25.6060,
                lon=85.1810,
                radius_meters=2600,
                is_verified=False,
                status="monitoring",
            ),
            Shelter(
                event_id=event.id,
                name="Patna City School Shelter",
                category="school",
                capacity=850,
                occupancy=430,
                lat=25.6301,
                lon=85.1532,
                accessible=True,
                status="open",
            ),
            Shelter(
                event_id=event.id,
                name="District Hospital Relief Center",
                category="hospital",
                capacity=450,
                occupancy=220,
                lat=25.6152,
                lon=85.1387,
                accessible=True,
                status="ready",
            ),
            Shelter(
                event_id=event.id,
                name="Municipal Annex Hall",
                category="government",
                capacity=600,
                occupancy=310,
                lat=25.6039,
                lon=85.1711,
                accessible=True,
                status="open",
            ),
            RescueTeam(
                event_id=event.id,
                name="Team Alpha",
                leader="Maj. Arun Singh",
                specialty="rapid evacuation",
                resources="boats, medics, drone",
                status="deployed",
                assigned_zone="North River Belt",
            ),
            RescueTeam(
                event_id=event.id,
                name="Team Bravo",
                leader="Capt. Meera Nair",
                specialty="infrastructure access",
                resources="ambulance, generators",
                status="mobilized",
                assigned_zone="Old Town Cluster",
            ),
            CitizenReport(
                event_id=event.id,
                reporter="R. Verma",
                locality="Kankarbagh",
                issue_type="road_blocked",
                severity="high",
                lat=25.6130,
                lon=85.1500,
                description="Road near the canal remains submerged and emergency vehicles are struggling to pass.",
                resolved=False,
                status="pending",
            ),
            CitizenReport(
                event_id=event.id,
                reporter="J. Khan",
                locality="Sultanganj",
                issue_type="water_level_rising",
                severity="medium",
                lat=25.6270,
                lon=85.1750,
                description="Water is entering the lower alleyways and residents are reporting rising water after the latest rain burst.",
                resolved=False,
                status="pending",
            ),
        ])
        db.commit()
    finally:
        db.close()


def get_dashboard_data() -> dict:
    init_db()
    db: Session = SessionLocal()
    try:
        event = db.query(FloodEvent).first()
        if not event:
            seed_demo_data()
            event = db.query(FloodEvent).first()

        zones = [
            {
                "id": z.id,
                "name": z.name,
                "severity": z.severity,
                "population": z.population,
                "lat": z.lat,
                "lon": z.lon,
                "radius_meters": z.radius_meters,
                "is_verified": z.is_verified,
                "status": z.status,
            }
            for z in event.risk_zones
        ]

        shelters = [
            {
                "id": s.id,
                "name": s.name,
                "category": s.category,
                "capacity": s.capacity,
                "occupancy": s.occupancy,
                "lat": s.lat,
                "lon": s.lon,
                "accessible": s.accessible,
                "status": s.status,
            }
            for s in event.shelters
        ]

        rescue_teams = [
            {
                "id": t.id,
                "name": t.name,
                "leader": t.leader,
                "specialty": t.specialty,
                "resources": t.resources,
                "status": t.status,
                "assigned_zone": t.assigned_zone,
            }
            for t in event.rescue_teams
        ]

        reports = [
            {
                "id": r.id,
                "reporter": r.reporter,
                "locality": r.locality,
                "issue_type": r.issue_type,
                "severity": r.severity,
                "lat": r.lat,
                "lon": r.lon,
                "description": r.description,
                "resolved": r.resolved,
                "status": r.status or ("resolved" if r.resolved else "pending"),
            }
            for r in event.reports
        ]

        shelters_ready = sum(1 for shelter in shelters if shelter["status"] in {"open", "ready"})
        active_reports = sum(1 for report in reports if report["status"] != "resolved")
        evacuation_percent = min(95, max(15, round(100 - event.risk_score * 0.35)))

        return {
            "status": "operational",
            "event_name": event.name,
            "district": event.district,
            "state": event.state,
            "severity": event.severity,
            "warning_source": event.warning_source,
            "risk_score": round(event.risk_score, 1),
            "people_at_risk": event.estimated_people_at_risk,
            "water_coverage": round(event.water_coverage, 1),
            "alert_window_hours": round(event.alert_window_hours, 1),
            "map_center": [25.618, 85.156],
            "zones": zones,
            "shelters": shelters,
            "rescue_teams": rescue_teams,
            "reports": reports,
            "evacuation_priority": [
                "Priority 1: Low-lying riverbank settlements",
                "Priority 2: Medical and school zone access roads",
                "Priority 3: Elderly care neighborhoods",
            ],
            "safe_routes": [
                {"route": "Route A", "distance_km": 4.2, "status": "open"},
                {"route": "Route B", "distance_km": 6.7, "status": "partially obstructed"},
                {"route": "Route C", "distance_km": 3.1, "status": "clear"},
            ],
            "kpis": {
                "peopleAtRisk": event.estimated_people_at_risk,
                "sheltersReady": shelters_ready,
                "evacuationPercent": evacuation_percent,
                "alertsActive": active_reports + sum(1 for zone in zones if zone["severity"] in {"critical", "high"}),
            },
        }
    finally:
        db.close()


def _get_active_event(db: Session) -> FloodEvent:
    event = db.query(FloodEvent).first()
    if event is None:
        seed_demo_data()
        event = db.query(FloodEvent).first()
    if event is None:
        raise RuntimeError("Flood event data could not be initialized")
    return event


def _set_simulated_risk(event: FloodEvent, *, risk_score: float, people: int, coverage: float, severity: str) -> None:
    event.risk_score = min(100, max(0, risk_score))
    event.estimated_people_at_risk = people
    event.water_coverage = coverage
    event.severity = severity
    event.warning_source = "SIMULATED / DEMONSTRATION"

    zones = sorted(event.risk_zones, key=lambda zone: zone.id)
    zone_values = (
        [
            ("critical", "evacuating", 7000),
            ("high", "pending", 5200),
            ("medium", "monitoring", 3400),
        ]
        if risk_score >= 90
        else [
            ("high", "evacuating", 5600),
            ("medium", "pending", 4200),
            ("low", "monitoring", 2800),
        ]
    )
    for index, zone in enumerate(zones):
        zone.severity, zone.status, zone.radius_meters = zone_values[min(index, 2)]
        zone.is_verified = False
    for team in event.rescue_teams:
        team.status = "deployed" if risk_score >= 90 else "mobilized"
        if risk_score >= 90 and zones:
            team.assigned_zone = zones[0].name


def launch_demo_scenario(intensity: str) -> dict:
    init_db()
    db: Session = SessionLocal()
    try:
        event = _get_active_event(db)
        if intensity == "moderate":
            risk_score, people, coverage, severity = 68.5, 94500, 31.4, "High"
        else:
            risk_score, people, coverage, severity = 94.2, 164800, 54.6, "Critical"
        event.name = "DEMONSTRATION - Monsoon Surge, District West"
        _set_simulated_risk(event, risk_score=risk_score, people=people, coverage=coverage, severity=severity)
        db.commit()
        return get_dashboard_data()
    finally:
        db.close()


def simulate_dam_break(dam_name: str, release_volume_mcm: float) -> dict:
    init_db()
    db: Session = SessionLocal()
    try:
        event = _get_active_event(db)
        risk_score = min(100, max(event.risk_score + release_volume_mcm * 0.12, 92 + release_volume_mcm * 0.04))
        people = max(event.estimated_people_at_risk, int(150000 + release_volume_mcm * 700))
        coverage = min(90, max(event.water_coverage + release_volume_mcm * 0.15, 45 + release_volume_mcm * 0.25))
        event.name = f"DEMONSTRATION - {dam_name} Dam Break"
        event.alert_window_hours = max(0.5, 4.0 - release_volume_mcm / 100)
        _set_simulated_risk(
            event,
            risk_score=risk_score,
            people=people,
            coverage=coverage,
            severity="Critical",
        )
        existing_zone = next((zone for zone in event.risk_zones if zone.name == "Downstream Dam Corridor"), None)
        if existing_zone is None:
            db.add(
                RiskZone(
                    event_id=event.id,
                    name="Downstream Dam Corridor",
                    severity="critical",
                    population=int(release_volume_mcm * 1200),
                    lat=25.5900,
                    lon=85.2050,
                    radius_meters=8500,
                    is_verified=False,
                    status="immediate_evacuation",
                )
            )
        else:
            existing_zone.population = int(release_volume_mcm * 1200)
            existing_zone.radius_meters = 8500
            existing_zone.severity = "critical"
            existing_zone.status = "immediate_evacuation"
        db.commit()
        return get_dashboard_data()
    finally:
        db.close()


def _polygon_for_zone(zone: dict) -> dict:
    ring = []
    for index in range(17):
        angle = 2 * math.pi * index / 16
        ring.append([
            zone["lon"] + math.cos(angle) * zone["radius_meters"] / 111320,
            zone["lat"] + math.sin(angle) * zone["radius_meters"] / 110540,
        ])
    return {
        "type": "Feature",
        "properties": {
            "id": zone["id"],
            "name": zone["name"],
            "severity": zone["severity"],
            "population": zone["population"],
            "status": zone["status"],
            "is_verified": zone["is_verified"],
            "source": "SIMULATED / DEMONSTRATION",
        },
        "geometry": {"type": "Polygon", "coordinates": [ring]},
    }


def get_map_data() -> dict:
    data = get_dashboard_data()
    facilities = [
        {
            "id": "school-patna",
            "name": "Patna Central School",
            "category": "school",
            "lat": 25.6242,
            "lon": 85.1772,
            "status": "open",
            "source": "SIMULATED / DEMONSTRATION",
        },
        {
            "id": "hospital-city",
            "name": "Patna City Hospital",
            "category": "hospital",
            "lat": 25.6090,
            "lon": 85.1355,
            "status": "operational",
            "source": "SIMULATED / DEMONSTRATION",
        },
        {
            "id": "dam-kosi",
            "name": "Kosi Barrage",
            "category": "dam",
            "lat": 25.5900,
            "lon": 85.2050,
            "status": "monitored",
            "source": "SIMULATED / DEMONSTRATION",
        },
    ]
    routes = [
        {
            "id": "route-a",
            "name": "North River Belt → Patna City School Shelter",
            "distance_km": 4.2,
            "status": "open",
            "coordinates": [[25.621, 85.144], [25.625, 85.149], [25.6301, 85.1532]],
            "source": "SIMULATED / DEMONSTRATION",
        },
        {
            "id": "route-b",
            "name": "Old Town → District Hospital Relief Center",
            "distance_km": 6.7,
            "status": "partially obstructed",
            "coordinates": [[25.612, 85.165], [25.614, 85.15], [25.6152, 85.1387]],
            "source": "SIMULATED / DEMONSTRATION",
        },
    ]
    return {
        "zones": data["zones"],
        "zones_geojson": {
            "type": "FeatureCollection",
            "features": [_polygon_for_zone(zone) for zone in data["zones"]],
        },
        "shelters": data["shelters"],
        "facilities": facilities,
        "rescue_requests": data["reports"],
        "routes": routes,
        "source": "SIMULATED / DEMONSTRATION",
    }


def create_citizen_report(payload: dict) -> dict:
    init_db()
    db: Session = SessionLocal()
    try:
        event = _get_active_event(db)
        report = CitizenReport(
            event_id=event.id,
            reporter=payload["reporter"],
            locality=payload["locality"],
            issue_type=payload["issue_type"],
            severity=payload["severity"],
            lat=payload["lat"],
            lon=payload["lon"],
            description=payload["description"],
            resolved=False,
            status="pending",
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        return {
            "id": report.id,
            "reporter": report.reporter,
            "locality": report.locality,
            "issue_type": report.issue_type,
            "severity": report.severity,
            "lat": report.lat,
            "lon": report.lon,
            "description": report.description,
            "resolved": report.resolved,
            "status": report.status,
            "source": "SIMULATED / DEMONSTRATION",
        }
    finally:
        db.close()


def update_report_status(report_id: int, status: str) -> dict | None:
    init_db()
    db: Session = SessionLocal()
    try:
        report = db.get(CitizenReport, report_id)
        if report is None:
            return None
        report.status = status
        report.resolved = status == "resolved"
        db.commit()
        return {"id": report.id, "status": report.status, "resolved": report.resolved}
    finally:
        db.close()


def get_alerts() -> list[dict]:
    data = get_dashboard_data()
    alerts = [
        {
            "id": f"zone-{zone['id']}",
            "title": f"{zone['severity'].title()} flood risk: {zone['name']}",
            "description": f"{zone['population']:,} residents are affected. Response status: {zone['status']}.",
            "severity": zone["severity"],
            "source": "SIMULATED / DEMONSTRATION",
        }
        for zone in data["zones"]
        if zone["severity"] in {"critical", "high"}
    ]
    alerts.extend(
        {
            "id": f"request-{report['id']}",
            "title": f"Rescue request: {report['locality']}",
            "description": report["description"],
            "severity": report["severity"],
            "source": "SIMULATED / DEMONSTRATION",
        }
        for report in data["reports"]
        if report["status"] != "resolved"
    )
    return alerts
