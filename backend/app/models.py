from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class FloodEvent(Base):
    __tablename__ = "flood_events"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    district = Column(String(120), nullable=False)
    state = Column(String(120), nullable=False)
    severity = Column(String(40), default="high")
    status = Column(String(40), default="predicted")
    warning_source = Column(String(120), default="simulated")
    risk_score = Column(Float, default=0.0)
    estimated_people_at_risk = Column(Integer, default=0)
    water_coverage = Column(Float, default=0.0)
    alert_window_hours = Column(Float, default=6.0)
    description = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    alert_thresholds = relationship("AlertThreshold", back_populates="event")
    risk_zones = relationship("RiskZone", back_populates="event")
    shelters = relationship("Shelter", back_populates="event")
    rescue_teams = relationship("RescueTeam", back_populates="event")
    reports = relationship("CitizenReport", back_populates="event")


class AlertThreshold(Base):
    __tablename__ = "alert_thresholds"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("flood_events.id"), nullable=False)
    rainfall_mm = Column(Float, default=80.0)
    river_level_m = Column(Float, default=11.0)
    predicted_inundation_pct = Column(Float, default=30.0)
    evacuation_priority = Column(String(40), default="high")
    event = relationship("FloodEvent", back_populates="alert_thresholds")


class RiskZone(Base):
    __tablename__ = "risk_zones"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("flood_events.id"), nullable=False)
    name = Column(String(120), nullable=False)
    severity = Column(String(40), default="critical")
    population = Column(Integer, default=12000)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    radius_meters = Column(Float, default=4000.0)
    is_verified = Column(Boolean, default=False)
    status = Column(String(40), default="evacuating")
    event = relationship("FloodEvent", back_populates="risk_zones")


class Shelter(Base):
    __tablename__ = "shelters"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("flood_events.id"), nullable=False)
    name = Column(String(150), nullable=False)
    category = Column(String(60), default="school")
    capacity = Column(Integer, default=500)
    occupancy = Column(Integer, default=260)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    accessible = Column(Boolean, default=True)
    status = Column(String(40), default="open")
    event = relationship("FloodEvent", back_populates="shelters")


class RescueTeam(Base):
    __tablename__ = "rescue_teams"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("flood_events.id"), nullable=False)
    name = Column(String(120), nullable=False)
    leader = Column(String(120), default="Field Op")
    specialty = Column(String(80), default="evacuation")
    resources = Column(String(200), default="boats, medical")
    status = Column(String(40), default="deployed")
    assigned_zone = Column(String(120), default="North River Belt")
    event = relationship("FloodEvent", back_populates="rescue_teams")


class CitizenReport(Base):
    __tablename__ = "citizen_reports"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("flood_events.id"), nullable=False)
    reporter = Column(String(120), default="anonymous")
    locality = Column(String(120), default="Ward 12")
    issue_type = Column(String(80), default="street_flooding")
    severity = Column(String(40), default="medium")
    lat = Column(Float, default=0.0)
    lon = Column(Float, default=0.0)
    description = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved = Column(Boolean, default=False)
    status = Column(String(40), default="pending")
    event = relationship("FloodEvent", back_populates="reports")
