import json
import urllib.error
import urllib.request


BASE_URL = "http://127.0.0.1:8000"


def request_json(path, method="GET", payload=None):
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        f"{BASE_URL}{path}",
        data=body,
        method=method,
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        return error.code, json.loads(error.read().decode("utf-8"))


def delete_report(report_id):
    from app.database import SessionLocal
    from app.models import CitizenReport

    db = SessionLocal()
    try:
        report = db.get(CitizenReport, report_id)
        if report is not None:
            db.delete(report)
            db.commit()
    finally:
        db.close()


def reset_demo_scenario():
    from app.database import SessionLocal
    from app.models import FloodEvent, RescueTeam, RiskZone

    db = SessionLocal()
    try:
        event = db.query(FloodEvent).first()
        if event is None:
            return
        event.name = "Monsoon Surge - District West"
        event.severity = "Extreme"
        event.warning_source = "SIMULATED / DEMONSTRATION"
        event.risk_score = 82.4
        event.estimated_people_at_risk = 128450
        event.water_coverage = 38.2
        event.alert_window_hours = 6.5
        zone_defaults = {
            "North River Belt": ("critical", 5800, "evacuating"),
            "Old Town Cluster": ("high", 4300, "pending"),
            "Canal Road": ("medium", 2600, "monitoring"),
        }
        for zone in list(event.risk_zones):
            if zone.name == "Downstream Dam Corridor":
                db.delete(zone)
                continue
            values = zone_defaults.get(zone.name)
            if values:
                zone.severity, zone.radius_meters, zone.status = values
                zone.is_verified = False
        team_defaults = {
            "Team Alpha": ("deployed", "North River Belt"),
            "Team Bravo": ("mobilized", "Old Town Cluster"),
        }
        for team in event.rescue_teams:
            if team.name in team_defaults:
                team.status, team.assigned_zone = team_defaults[team.name]
        db.commit()
    finally:
        db.close()
