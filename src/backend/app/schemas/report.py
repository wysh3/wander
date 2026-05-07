from pydantic import BaseModel
import uuid


class WanderReportResponse(BaseModel):
    user_id: uuid.UUID
    name: str
    total_experiences: int = 0
    total_people_met: int = 0
    total_neighborhoods_explored: int = 0
    streak_weeks: int = 0
    top_categories: list[dict] = []
    screen_time_delta: int = 0
    screen_time_percent: float = 0.0
    recent_groups: list[dict] = []
    badges: list[dict] = []
    quote: str = ""
