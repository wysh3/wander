"""
Deep integration tests — all 32 API endpoints via TestClient with SQLite + fakeredis.

Usage:
    cd backend
    uv run pytest tests/test_deep.py -v
"""

import os
import sys
import uuid
import json
import hashlib
import random
import types
from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from fakeredis import aioredis as fakeredis_aioredis
from sqlalchemy import TypeDecorator, text as sa_text
from sqlalchemy import JSON as SA_JSON
from sqlalchemy import String as SA_String
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

# ── Monkeypatch all PostgreSQL-specific types BEFORE any app import ─────────

# 1. Fake pgvector Vector → JSON (SQLite can't do native vectors)
class FakeVector(TypeDecorator):
    """Store personality vectors as JSON arrays in SQLite."""
    impl = SA_JSON
    cache_ok = True
    def __init__(self, dim=None):
        super().__init__()

_fake_pgvector = types.ModuleType("pgvector")
_fake_pgvector_sqlalchemy = types.ModuleType("pgvector.sqlalchemy")
_fake_pgvector_sqlalchemy.Vector = FakeVector
_fake_pgvector.sqlalchemy = _fake_pgvector_sqlalchemy
sys.modules["pgvector"] = _fake_pgvector
sys.modules["pgvector.sqlalchemy"] = _fake_pgvector_sqlalchemy

# 2. Fake postgresql.JSONB → JSON (SQLite compatible)
class SQLiteJSONB(TypeDecorator):
    impl = SA_JSON
    cache_ok = True

# 3. Fake ARRAY → JSON (store arrays as JSON in SQLite)
class SQLiteArray(TypeDecorator):
    impl = SA_JSON
    cache_ok = True
    def __init__(self, item_type=None, **kwargs):
        super().__init__(**kwargs)

# 4. Fake UUID → String(36) with bind/result processing
class SQLiteUUID(TypeDecorator):
    impl = SA_String(36)
    cache_ok = True
    def __init__(self, as_uuid=False, **kwargs):
        super().__init__(**kwargs)
    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        return str(value)
    def process_result_value(self, value, dialect):
        if value is None:
            return value
        return uuid.UUID(value)

# Patch both sqlalchemy.dialects.postgresql AND sqlalchemy top-level
from sqlalchemy.dialects import postgresql as pg_dialect
pg_dialect.JSONB = SQLiteJSONB
pg_dialect.ARRAY = SQLiteArray
pg_dialect.UUID = SQLiteUUID
sa.ARRAY = SQLiteArray

# ── Set test environment ────────────────────────────────────────────────────
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test_deep.db"
os.environ["REDIS_URL"] = "redis://localhost:6379/0"
os.environ["SUPABASE_JWT_SECRET"] = "test-secret-deep"
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["JWT_EXPIRE_MINUTES"] = "60"
os.environ["ENVIRONMENT"] = "test"
os.environ["CORS_ORIGINS"] = '["http://localhost:3000"]'
os.environ["NVIDIA_API_KEY"] = ""
os.environ["OPENAI_API_KEY"] = ""
os.environ["ANTHROPIC_API_KEY"] = ""

# ── Now import app ──────────────────────────────────────────────────────────
from app.main import app
from app.db.session import Base, async_session_factory
from app.api import deps as api_deps
from app.models.user import User
from app.models.group import Group, GroupMember
from app.models.activity import Activity
from app.models.venue import Venue
from app.models.host import Host
from app.models.sos_event import SOSEvent
from app.models.chat_message import ChatMessage
from app.models.user_history import UserHistory
from app.core.security import create_access_token, hash_otp, generate_otp

# ── Test DB engine ──────────────────────────────────────────────────────────
TEST_DB_URL = "sqlite+aiosqlite:///./test_deep.db"
test_engine = create_async_engine(TEST_DB_URL, echo=False)

async def get_test_db():
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

# Override Redis with fakeredis
async def get_fake_redis():
    client = await fakeredis_aioredis.FakeRedis()
    try:
        yield client
    finally:
        await client.close()

app.dependency_overrides[api_deps.get_redis] = get_fake_redis
app.dependency_overrides[api_deps.get_db] = get_test_db

# ── Database setup/teardown ─────────────────────────────────────────────────
@pytest_asyncio.fixture(autouse=True)
async def setup_database():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

# ── Seed helpers ────────────────────────────────────────────────────────────
def _random_vector(dim=5):
    return [round(random.uniform(0.1, 0.9), 2) for _ in range(dim)]

async def seed_user(db: AsyncSession, phone="+919999000001", name="TestUser", **kwargs) -> User:
    user = User(
        id=kwargs.get("id", uuid.uuid4()),
        supabase_uid=f"test-uid-{phone[-4:]}",
        phone=phone,
        name=name,
        role=kwargs.get("role", "user"),
        verification_status=kwargs.get("verification_status", "verified"),
        onboarding_completed=kwargs.get("onboarding_completed", True),
        personality_vector=kwargs.get("personality_vector", _random_vector()),
        home_lat=kwargs.get("home_lat", 12.9716),
        home_lng=kwargs.get("home_lng", 77.5946),
        city=kwargs.get("city", "Bangalore"),
        home_area=kwargs.get("home_area", "Indiranagar"),
        travel_radius_km=kwargs.get("travel_radius_km", 15),
        streak_weeks=kwargs.get("streak_weeks", 4),
        total_experiences=kwargs.get("total_experiences", 3),
        total_people_met=kwargs.get("total_people_met", 47),
        total_neighborhoods_explored=kwargs.get("total_neighborhoods_explored", 8),
        screen_time_before=kwargs.get("screen_time_before", 300),
        screen_time_after=kwargs.get("screen_time_after", 180),
    )
    db.add(user)
    await db.flush()
    return user

async def seed_venue(db: AsyncSession, **kwargs) -> Venue:
    venue = Venue(
        id=kwargs.get("id", uuid.uuid4()),
        name=kwargs.get("name", "Cubbon Park"),
        lat=kwargs.get("lat", 12.9763),
        lng=kwargs.get("lng", 77.5929),
        area=kwargs.get("area", "Cubbon Park"),
        city=kwargs.get("city", "Bangalore"),
        venue_type=kwargs.get("venue_type", "park"),
    )
    db.add(venue)
    await db.flush()
    return venue

async def seed_activity(db: AsyncSession, venue_id=None, **kwargs) -> Activity:
    act = Activity(
        id=kwargs.get("id", uuid.uuid4()),
        title=kwargs.get("title", "Morning Yoga at the Park"),
        description=kwargs.get("description", "Gentle morning yoga session"),
        category=kwargs.get("category", "physical"),
        activity_type=kwargs.get("activity_type", "yoga"),
        venue_id=venue_id,
        lat=kwargs.get("lat", 12.9763),
        lng=kwargs.get("lng", 77.5929),
        area=kwargs.get("area", "Cubbon Park"),
        city=kwargs.get("city", "Bangalore"),
        scheduled_at=kwargs.get("scheduled_at", datetime.now(timezone.utc) + timedelta(days=2)),
        duration_minutes=kwargs.get("duration_minutes", 180),
        group_size_min=kwargs.get("group_size_min", 4),
        group_size_max=kwargs.get("group_size_max", 8),
        max_groups=kwargs.get("max_groups", 3),
        status=kwargs.get("status", "open"),
    )
    db.add(act)
    await db.flush()
    return act

async def seed_group(db: AsyncSession, activity_id=None, host_id=None, **kwargs) -> Group:
    grp = Group(
        id=kwargs.get("id", uuid.uuid4()),
        activity_id=activity_id,
        host_id=host_id,
        match_score=kwargs.get("match_score", 0.85),
        no_show_risk=kwargs.get("no_show_risk", 0.12),
        status=kwargs.get("status", "confirmed"),
        chat_opens_at=kwargs.get("chat_opens_at", datetime.now(timezone.utc) - timedelta(hours=1)),
        chat_expires_at=kwargs.get("chat_expires_at", datetime.now(timezone.utc) + timedelta(hours=23)),
    )
    db.add(grp)
    await db.flush()
    return grp

async def seed_host(db: AsyncSession, user_id=None, **kwargs) -> Host:
    host = Host(
        id=kwargs.get("id", uuid.uuid4()),
        user_id=user_id,
        total_experiences_hosted=kwargs.get("total_experiences_hosted", 5),
        rating_avg=kwargs.get("rating_avg", 4.7),
    )
    db.add(host)
    await db.flush()
    return host

def make_token(user: User) -> str:
    return create_access_token(subject=user.supabase_uid)

# ── Fixtures ────────────────────────────────────────────────────────────────
@pytest_asyncio.fixture
async def db_session():
    async with async_session_factory() as s:
        yield s
        await s.commit()

@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest_asyncio.fixture
async def seeded(db_session):
    """Full seed: user, venue, activity, group, host."""
    user = await seed_user(db_session, role="admin")
    await db_session.flush()
    await db_session.commit()

    token = make_token(user)
    venue = await seed_venue(db_session)
    activity = await seed_activity(db_session, venue_id=venue.id)
    group = await seed_group(db_session, activity_id=activity.id, host_id=user.id)
    host = await seed_host(db_session, user_id=user.id)
    gm = GroupMember(id=uuid.uuid4(), group_id=group.id, user_id=user.id, role="member")
    db_session.add(gm)
    await db_session.flush()
    await db_session.commit()
    return {
        "user": user, "token": token, "venue": venue,
        "activity": activity, "group": group, "host": host,
    }

pytestmark = pytest.mark.asyncio

# ═══════════════════════════════════════════════════════════════════════════
# TESTS
# ═══════════════════════════════════════════════════════════════════════════

class TestHealth:
    async def test_health(self, client: AsyncClient):
        r = await client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"


class TestAuth:
    async def test_send_otp(self, client: AsyncClient):
        r = await client.post("/api/v1/auth/send-otp", json={"phone": "+919999000001"})
        assert r.status_code == 200
        assert r.json()["expires_in"] == 300

    async def test_send_otp_bad_phone(self, client: AsyncClient):
        r = await client.post("/api/v1/auth/send-otp", json={"phone": "bad"})
        assert r.status_code == 422

    async def test_verify_otp_new_user(self, client: AsyncClient):
        phone = "+919999000002"
        r1 = await client.post("/api/v1/auth/send-otp", json={"phone": phone})
        assert r1.status_code == 200
        r2 = await client.post("/api/v1/auth/verify-otp", json={"phone": phone, "otp": "123456"})
        assert r2.status_code == 400  # OTP won't match random

    async def test_verify_otp_invalid(self, client: AsyncClient):
        r = await client.post("/api/v1/auth/verify-otp", json={"phone": "+919999000003", "otp": "000000"})
        assert r.status_code in (400, 404)


class TestUsers:
    async def test_me_unauthorized(self, client: AsyncClient):
        r = await client.get("/api/v1/users/me")
        assert r.status_code in (401, 403, 422)

    async def test_me_authorized(self, client: AsyncClient, seeded):
        r = await client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {seeded['token']}"})
        assert r.status_code == 200

    async def test_update_profile(self, client: AsyncClient, seeded):
        r = await client.patch(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {seeded['token']}"},
            json={"name": "UpdatedName"},
        )
        assert r.status_code == 200
        assert r.json()["name"] == "UpdatedName"


class TestVerification:
    async def test_digilocker_init(self, client: AsyncClient, seeded):
        r = await client.post("/api/v1/verify/digilocker/init", headers={"Authorization": f"Bearer {seeded['token']}"})
        assert r.status_code in (200, 201)

    async def test_digilocker_status(self, client: AsyncClient, seeded):
        r = await client.get("/api/v1/verify/digilocker/status", headers={"Authorization": f"Bearer {seeded['token']}"})
        assert r.status_code in (200, 404)

    async def test_aadhaar_init(self, client: AsyncClient, seeded):
        r = await client.post("/api/v1/verify/aadhaar/init", headers={"Authorization": f"Bearer {seeded['token']}"})
        assert r.status_code in (200, 201)


class TestOnboarding:
    async def test_onboarding_complete(self, client: AsyncClient, seeded):
        r = await client.post(
            "/api/v1/onboarding/complete",
            headers={"Authorization": f"Bearer {seeded['token']}"},
            json={
                "interests": ["outdoors", "social"],
                "energy": "balanced",
                "availability": ["weekends", "weekday_evenings"],
            },
        )
        assert r.status_code == 200
        data = r.json()
        assert data["done"] is True
        assert "personality_vector" in data
        assert "vibe" in data

    async def test_onboarding_status(self, client: AsyncClient, seeded):
        r = await client.get("/api/v1/onboarding/status", headers={"Authorization": f"Bearer {seeded['token']}"})
        assert r.status_code == 200
        assert "completed" in r.json()


class TestActivities:
    async def test_list_activities(self, client: AsyncClient, seeded):
        r = await client.get("/api/v1/activities")
        assert r.status_code == 200
        assert "items" in r.json()

    async def test_list_activities_filtered(self, client: AsyncClient, seeded):
        r = await client.get("/api/v1/activities?category=physical")
        assert r.status_code == 200

    async def test_get_activity(self, client: AsyncClient, seeded):
        aid = str(seeded["activity"].id)
        r = await client.get(f"/api/v1/activities/{aid}")
        assert r.status_code == 200
        assert r.json()["title"] == "Morning Yoga at the Park"

    async def test_get_activity_404(self, client: AsyncClient):
        r = await client.get(f"/api/v1/activities/{uuid.uuid4()}")
        assert r.status_code == 404

    async def test_join_activity(self, client: AsyncClient, seeded):
        aid = str(seeded["activity"].id)
        r = await client.post(f"/api/v1/activities/{aid}/join", headers={"Authorization": f"Bearer {seeded['token']}"})
        assert r.status_code in (200, 201, 409)


class TestMatching:
    async def test_run_matching(self, client: AsyncClient, seeded):
        aid = str(seeded["activity"].id)
        r = await client.post(f"/api/v1/match/{aid}", headers={"Authorization": f"Bearer {seeded['token']}"})
        assert r.status_code in (200, 201, 202)

    async def test_matching_status(self, client: AsyncClient, seeded):
        aid = str(seeded["activity"].id)
        r = await client.get(f"/api/v1/match/{aid}/status")
        assert r.status_code == 200

    async def test_matching_result(self, client: AsyncClient, seeded):
        aid = str(seeded["activity"].id)
        r = await client.get(f"/api/v1/match/{aid}/result")
        assert r.status_code in (200, 404)


class TestGroups:
    async def test_get_group(self, client: AsyncClient, seeded):
        gid = str(seeded["group"].id)
        r = await client.get(f"/api/v1/groups/{gid}", headers={"Authorization": f"Bearer {seeded['token']}"})
        assert r.status_code == 200

    async def test_get_group_404(self, client: AsyncClient, seeded):
        r = await client.get(f"/api/v1/groups/{uuid.uuid4()}", headers={"Authorization": f"Bearer {seeded['token']}"})
        assert r.status_code == 404

    async def test_rate_group(self, client: AsyncClient, seeded):
        gid = str(seeded["group"].id)
        r = await client.post(
            f"/api/v1/groups/{gid}/rate",
            headers={"Authorization": f"Bearer {seeded['token']}"},
            json={"rating": 5},
        )
        assert r.status_code in (200, 201, 404)


class TestChat:
    async def test_chat_history(self, client: AsyncClient, seeded):
        gid = str(seeded["group"].id)
        r = await client.get(
            f"/api/v1/groups/{gid}/chat/history",
            headers={"Authorization": f"Bearer {seeded['token']}"},
        )
        assert r.status_code == 200


class TestSOS:
    async def test_trigger_sos(self, client: AsyncClient, seeded):
        r = await client.post(
            "/api/v1/sos/trigger",
            headers={"Authorization": f"Bearer {seeded['token']}"},
            json={"lat": 12.9716, "lng": 77.5946},
        )
        assert r.status_code in (200, 201)

    async def test_trigger_sos_no_coords(self, client: AsyncClient, seeded):
        r = await client.post("/api/v1/sos/trigger", headers={"Authorization": f"Bearer {seeded['token']}"}, json={})
        assert r.status_code in (200, 201)

    async def test_cancel_sos(self, client: AsyncClient, seeded):
        r1 = await client.post("/api/v1/sos/trigger", headers={"Authorization": f"Bearer {seeded['token']}"}, json={})
        sos_id = r1.json().get("sos_id")
        if sos_id:
            r2 = await client.post(
                "/api/v1/sos/cancel",
                headers={"Authorization": f"Bearer {seeded['token']}"},
                json={"sos_id": sos_id},
            )
            assert r2.status_code in (200, 201)

    async def test_sos_poll(self, client: AsyncClient, seeded):
        uid = str(seeded["user"].id)
        r = await client.get(f"/api/v1/sos/{uid}/poll")
        assert r.status_code == 200


class TestReports:
    async def test_get_report(self, client: AsyncClient, seeded):
        uid = str(seeded["user"].id)
        r = await client.get(f"/api/v1/report/{uid}")
        assert r.status_code == 200

    async def test_get_report_pdf(self, client: AsyncClient, seeded):
        uid = str(seeded["user"].id)
        r = await client.get(f"/api/v1/report/{uid}/pdf")
        assert r.status_code == 200


class TestHost:
    async def test_host_dashboard(self, client: AsyncClient, seeded):
        r = await client.get("/api/v1/host/dashboard", headers={"Authorization": f"Bearer {seeded['token']}"})
        assert r.status_code == 200

    async def test_host_groups(self, client: AsyncClient, seeded):
        r = await client.get("/api/v1/host/groups", headers={"Authorization": f"Bearer {seeded['token']}"})
        assert r.status_code == 200

    async def test_host_dashboard_unauthorized(self, client: AsyncClient):
        r = await client.get("/api/v1/host/dashboard")
        assert r.status_code in (401, 403, 422)


class TestAdmin:
    async def test_admin_sos_events(self, client: AsyncClient, seeded):
        r = await client.get("/api/v1/admin/moderation/sos", headers={"Authorization": f"Bearer {seeded['token']}"})
        assert r.status_code == 200

    async def test_admin_verifications(self, client: AsyncClient, seeded):
        r = await client.get("/api/v1/admin/users?verification_status=pending", headers={"Authorization": f"Bearer {seeded['token']}"})
        assert r.status_code == 200

    async def test_admin_activity_logs(self, client: AsyncClient, seeded):
        r = await client.get("/api/v1/admin/events", headers={"Authorization": f"Bearer {seeded['token']}"})
        assert r.status_code == 200


class TestFrontend:
    async def test_frontend_root(self):
        import httpx
        try:
            r = httpx.get("http://localhost:3000/", follow_redirects=True, timeout=10)
            assert r.status_code == 200
        except httpx.ConnectError:
            pytest.skip("Frontend not running")

    async def test_frontend_signup(self):
        import httpx
        try:
            r = httpx.get("http://localhost:3000/signup", follow_redirects=True, timeout=10)
            assert r.status_code == 200
        except httpx.ConnectError:
            pytest.skip("Frontend not running")
