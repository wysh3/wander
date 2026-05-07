from pydantic import BaseModel
from datetime import datetime
import uuid


class MatchStartedResponse(BaseModel):
    match_key: str
    status: str
    total_users: int


class MatchStatusResponse(BaseModel):
    status: str
    progress: int = 0
    total_users: int = 0
    phase: str | None = None


class GroupResult(BaseModel):
    id: uuid.UUID | None = None
    host_id: uuid.UUID | None = None
    host_name: str | None = None
    match_score: float = 0.0
    member_ids: list[uuid.UUID] = []
    members: list[dict] = []


class ConstraintStats(BaseModel):
    personality_similarity_avg: float = 0.0
    repeat_pairs_avoided: int = 0
    women_only_groups: int = 0
    hosts_assigned: int = 0
    total_constraints: int = 6


class MatchResultResponse(BaseModel):
    groups: list[GroupResult]
    solved_in_ms: float = 0.0
    solver: str = "cp-sat"
    total_users: int = 0
    total_groups: int = 0
    constraint_stats: ConstraintStats | None = None
