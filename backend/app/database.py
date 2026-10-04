from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import get_settings

DATABASE_URL = get_settings().database_url

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def init_db() -> None:
    from app.models import FloodEvent, AlertThreshold, Shelter, RiskZone, RescueTeam, CitizenReport

    Base.metadata.create_all(bind=engine)
    with engine.begin() as connection:
        report_columns = {
            column["name"]
            for column in connection.exec_driver_sql("PRAGMA table_info(citizen_reports)")
        }
        if "status" not in report_columns:
            connection.exec_driver_sql(
                "ALTER TABLE citizen_reports ADD COLUMN status VARCHAR(40) NOT NULL DEFAULT 'pending'"
            )
