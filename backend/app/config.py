from functools import lru_cache
from pydantic import BaseModel


class Settings(BaseModel):
    app_name: str = "FloodGuard AI"
    debug: bool = True
    database_url: str = "sqlite:///./floodguard.db"
    weather_api_base_url: str = "https://api.open-meteo.com/v1/forecast"
    map_tile_url: str = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"


@lru_cache
def get_settings() -> Settings:
    return Settings()
