"""Nearby users service — geo-indexed active user queries with Redis caching."""

import asyncio
import math
import structlog
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

from app.models.user import User
from app.services.geolocation import (
    haversine_km,
    bounding_box,
    batch_travel_times,
    calculate_geo_hash,
)
from app.config import get_settings

settings = get_settings()
logger = structlog.get_logger()

# Cache TTLs
LOCATION_REDIS_TTL = 120  # 2 minutes — live location cache
NEARBY_CACHE_TTL = 30  # 30 seconds — nearby query cache


async def update_user_location(
    db: AsyncSession,
    user: User,
    lat: float,
    lng: float,
    preferred_radius_km: int | None = None,
) -> None:
    """Update user's live GPS coordinates and last-active timestamp in PostgreSQL."""
    user.live_lat = lat
    user.live_lng = lng
    user.last_active_at = datetime.now(timezone.utc)
    if preferred_radius_km is not None:
        user.preferred_radius_km = preferred_radius_km

    # Also update PostGIS geography column via raw SQL
    await db.execute(
        text(
            "UPDATE users SET geo_point = ST_SetSRID(ST_MakePoint(:lng, :lat), 4326) "
            "WHERE id = :user_id"
        ),
        {"lat": lat, "lng": lng, "user_id": user.id},
    )

    await db.commit()
    await db.refresh(user)

    # Cache in Redis for real-time access
    cache_location_in_redis(user, lat, lng)


def cache_location_in_redis(user: User, lat: float, lng: float):
    """Store live location in Redis with TTL for fast geo-queries."""
    try:
        from app.db.redis import _redis_pool

        redis = _redis_pool
        if redis is None:
            return

        user_key = f"user:location:{user.id}"
        geo_hash = calculate_geo_hash(lat, lng)

        import json

        pipe = redis.pipeline()
        pipe.setex(
            user_key,
            LOCATION_REDIS_TTL,
            json.dumps(
                {
                    "lat": lat,
                    "lng": lng,
                    "radius_km": user.preferred_radius_km,
                    "last_active": datetime.now(timezone.utc).isoformat(),
                    "geohash": geo_hash,
                }
            ),
        )

        # Add to Redis GEO set for radius queries
        pipe.geoadd("users:geo", (lng, lat, str(user.id)))

        # Publish location update to channel for WebSocket subscribers
        pipe.publish(
            "location:updates",
            json.dumps(
                {
                    "user_id": str(user.id),
                    "lat": lat,
                    "lng": lng,
                    "geohash": geo_hash,
                }
            ),
        )

        pipe.execute()
    except Exception as e:
        logger.warning("redis_location_cache_failed", error=str(e))


async def fetch_active_users_within_radius(
    db: AsyncSession,
    origin_lat: float,
    origin_lng: float,
    radius_km: float,
    user_id_to_exclude: Optional[str] = None,
    limit: int = 200,
    activity_cutoff_minutes: int = 30,
) -> list[User]:
    """
    Fetch users who:
    1. Are within radius_km of origin
    2. Were active within the last N minutes
    3. Have completed onboarding
    4. Have personality vectors ready for matching

    Uses PostGIS for fast spatial filtering when available,
    falls back to bounding-box + Haversine filtering for SQLite.
    """
    cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=activity_cutoff_minutes)

    # Try PostGIS-enabled spatial query first
    try:
        query = text(
            """
            SELECT u.* FROM users u
            WHERE u.personality_vector IS NOT NULL
              AND u.onboarding_completed = TRUE
              AND u.live_lat IS NOT NULL
              AND u.live_lng IS NOT NULL
              AND u.last_active_at >= :cutoff
              AND u.id != :exclude_id
              AND ST_DWithin(
                    u.geo_point,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
                    :radius_meters
                  )
            ORDER BY ST_Distance(
                        u.geo_point,
                        ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)
                     )
            LIMIT :limit
        """
        )

        result = await db.execute(
            query,
            {
                "lat": origin_lat,
                "lng": origin_lng,
                "radius_meters": radius_km * 1000,
                "cutoff": cutoff_time,
                "exclude_id": user_id_to_exclude or "00000000-0000-0000-0000-000000000000",
                "limit": limit,
            },
        )

        users = list(result.mappings().all())
        if users:
            # Convert to User objects
            user_ids = [row["id"] for row in users]
            user_query = select(User).where(User.id.in_(user_ids))
            user_result = await db.execute(user_query)
            user_objects = list(user_result.scalars().all())

            # Sort by distance to maintain ST_Distance ordering
            user_map = {u.id: u for u in user_objects}
            sorted_users = [user_map[uid] for uid in user_ids if uid in user_map]
            logger.info(
                "nearby_users_postgis",
                origin=f"{origin_lat:.4f},{origin_lng:.4f}",
                radius_km=radius_km,
                count=len(sorted_users),
            )
            return sorted_users

    except Exception as e:
        logger.warning("postgis_query_failed_falling_back", error=str(e))

    # Fallback: bounding-box + Haversine
    min_lat, max_lat, min_lng, max_lng = bounding_box(origin_lat, origin_lng, radius_km)

    query = (
        select(User)
        .where(
            User.personality_vector.isnot(None),
            User.onboarding_completed == True,
            User.live_lat.isnot(None),
            User.live_lng.isnot(None),
            User.last_active_at >= cutoff_time,
            User.live_lat.between(min_lat, max_lat),
            User.live_lng.between(min_lng, max_lng),
        )
        .limit(limit * 2)  # Fetch extra to account for Haversine filtering
    )

    if user_id_to_exclude:
        query = query.where(User.id != user_id_to_exclude)

    result = await db.execute(query)
    candidates = list(result.scalars().all())

    # Fine-grained Haversine filtering
    nearby = []
    for user in candidates:
        dist = haversine_km(
            origin_lat, origin_lng, float(user.live_lat), float(user.live_lng)
        )
        if dist <= radius_km:
            nearby.append((user, dist))

    # Sort by distance and limit
    nearby.sort(key=lambda x: x[1])
    users = [u for u, _ in nearby[:limit]]

    logger.info(
        "nearby_users_haversine",
        origin=f"{origin_lat:.4f},{origin_lng:.4f}",
        radius_km=radius_km,
        candidates=len(candidates),
        matched=len(users),
    )

    return users


async def filter_by_travel_time(
    origin_lat: float,
    origin_lng: float,
    users: list[User],
    max_travel_minutes: float = 30.0,
    mode: str = "driving",
) -> list[User]:
    """
    Filter users by estimated travel time ≤ max_travel_minutes.
    Uses Google Distance Matrix API when configured, otherwise
    falls back to Haversine-based speed estimation.
    """
    if not users:
        return []

    # Build destination list for batch check
    destinations = [
        (float(u.live_lat), float(u.live_lng), str(u.id))
        for u in users
        if u.live_lat is not None and u.live_lng is not None
    ]

    if not destinations:
        return []

    reachable_ids = await batch_travel_times(
        origin_lat=origin_lat,
        origin_lng=origin_lng,
        destinations=destinations,
        max_time_minutes=max_travel_minutes,
        mode=mode,
    )

    reachable_set = set(reachable_ids)
    return [u for u in users if str(u.id) in reachable_set]


async def get_nearby_count_redis(lat: float, lng: float, radius_km: float) -> int:
    """Fast approximate nearby user count from Redis GEO data."""
    try:
        from app.db.redis import _redis_pool

        redis = _redis_pool
        if redis is None:
            return 0

        # GEORADIUS with COUNT only (no data returned)
        count = await redis.georadius(
            "users:geo",
            lng,
            lat,
            radius_km,
            unit="km",
            count=None,
        )
        return len(count) if count else 0
    except Exception:
        return 0
