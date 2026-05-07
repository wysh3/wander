"""Location API — live GPS updates, nearby users, WebSocket streaming."""

import asyncio
import json
import structlog
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field

from app.api.deps import get_db, get_current_user, get_redis
from app.models.user import User
from app.services.nearby_users import (
    update_user_location,
    fetch_active_users_within_radius,
    filter_by_travel_time,
    get_nearby_count_redis,
)
from app.services.privacy import apply_privacy_filter
from app.core.exceptions import AppError

router = APIRouter()
logger = structlog.get_logger()

# WebSocket connection manager for live location streaming
_ws_connections: dict[str, WebSocket] = {}


class LocationUpdateRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90, description="Latitude")
    lng: float = Field(..., ge=-180, le=180, description="Longitude")
    preferred_radius_km: int | None = Field(None, ge=5, le=50, description="Preferred matching radius in km")


class LocationUpdateResponse(BaseModel):
    ok: bool = True
    nearby_count: int = 0
    timestamp: str


class NearbyUserSummary(BaseModel):
    id: str
    name: str | None = None
    distance_km: float
    vibe: str | None = None
    interests: list[str] = []

    class Config:
        from_attributes = True


class NearbyUsersResponse(BaseModel):
    users: list[NearbyUserSummary]
    count: int
    search_radius_km: float
    filtered_by_travel_time: bool = False


@router.post("/update", response_model=LocationUpdateResponse)
async def update_location(
    body: LocationUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update the current user's live GPS coordinates."""
    await update_user_location(
        db=db,
        user=current_user,
        lat=body.lat,
        lng=body.lng,
        preferred_radius_km=body.preferred_radius_km,
    )

    # Get approximate nearby count from Redis (fast)
    radius = body.preferred_radius_km or current_user.preferred_radius_km
    nearby_count = await get_nearby_count_redis(body.lat, body.lng, radius)

    logger.info(
        "location_updated",
        user_id=str(current_user.id),
        lat=body.lat,
        lng=body.lng,
        nearby_count=nearby_count,
    )

    return LocationUpdateResponse(
        ok=True,
        nearby_count=nearby_count,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/nearby", response_model=NearbyUsersResponse)
async def get_nearby_users(
    radius_km: float = Query(20.0, ge=5, le=50, description="Search radius in km"),
    include_travel_time: bool = Query(False, description="Filter by 30-min travel time"),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get nearby active users within the specified radius."""
    if current_user.live_lat is None or current_user.live_lng is None:
        raise AppError(
            "LOCATION_REQUIRED",
            "Update your location first via POST /location/update",
            400,
        )

    # Fetch users within radius
    users = await fetch_active_users_within_radius(
        db=db,
        origin_lat=float(current_user.live_lat),
        origin_lng=float(current_user.live_lng),
        radius_km=radius_km,
        user_id_to_exclude=str(current_user.id),
        limit=limit,
    )

    filtered_by_travel_time = False
    if include_travel_time and users:
        before_count = len(users)
        users = await filter_by_travel_time(
            origin_lat=float(current_user.live_lat),
            origin_lng=float(current_user.live_lng),
            users=users,
            max_travel_minutes=30.0,
        )
        filtered_by_travel_time = True
        logger.info(
            "travel_time_filter",
            before=before_count,
            after=len(users),
        )

    # Build response
    summaries = []
    for u in users:
        if u.live_lat and u.live_lng:
            from app.services.geolocation import haversine_km

            dist = haversine_km(
                float(current_user.live_lat),
                float(current_user.live_lng),
                float(u.live_lat),
                float(u.live_lng),
            )
        else:
            dist = 0.0

        filtered = apply_privacy_filter(current_user.id, u)
        summaries.append(
            NearbyUserSummary(
                id=str(u.id),
                name=filtered.get("name"),
                distance_km=round(dist, 2),
                vibe=filtered.get("vibe"),
                interests=filtered.get("interests", []),
            )
        )

    return NearbyUsersResponse(
        users=summaries,
        count=len(summaries),
        search_radius_km=radius_km,
        filtered_by_travel_time=filtered_by_travel_time,
    )


@router.websocket("/ws")
async def location_websocket(websocket: WebSocket):
    """
    WebSocket endpoint for real-time location streaming.

    Client sends: {"type": "location_update", "lat": 12.9716, "lng": 77.5946, "radius_km": 20}
    Server sends: {"type": "nearby_update", "count": 15, "users": [...]}
    Server sends: {"type": "user_moved", "user_id": "...", "lat": ..., "lng": ...}
    """
    await websocket.accept()
    user_id = None
    user_token = None

    try:
        # Wait for auth message
        auth_msg = await asyncio.wait_for(websocket.receive_text(), timeout=10.0)
        auth_data = json.loads(auth_msg)

        if auth_data.get("type") != "auth":
            await websocket.close(code=4001, reason="Auth required first")
            return

        token = auth_data.get("token")
        if not token:
            await websocket.close(code=4001, reason="Missing token")
            return

        # Authenticate the WebSocket user
        from app.core.security import decode_access_token
        from sqlalchemy import select
        from app.db.session import async_session_factory

        try:
            payload = decode_access_token(token)
            supabase_uid = payload.get("sub")
        except ValueError:
            await websocket.close(code=4001, reason="Invalid token")
            return

        async with async_session_factory() as db:
            result = await db.execute(
                select(User).where(User.supabase_uid == supabase_uid)
            )
            user = result.scalar_one_or_none()
            if not user:
                await websocket.close(code=4001, reason="User not found")
                return

            user_id = str(user.id)
            user_token = token

            # Register connection
            _ws_connections[user_id] = websocket
            logger.info("ws_connected", user_id=user_id)

            # Listen for location updates from this client
            while True:
                try:
                    data = await asyncio.wait_for(websocket.receive_text(), timeout=120.0)
                    msg = json.loads(data)

                    if msg.get("type") == "location_update":
                        lat = msg.get("lat")
                        lng = msg.get("lng")
                        radius = msg.get("radius_km", user.preferred_radius_km)

                        if lat is not None and lng is not None:
                            # Update location in DB
                            user.live_lat = lat
                            user.live_lng = lng
                            user.last_active_at = datetime.now(timezone.utc)
                            if radius:
                                user.preferred_radius_km = radius
                            await db.commit()
                            await db.refresh(user)

                            # Cache in Redis
                            from app.services.nearby_users import cache_location_in_redis

                            cache_location_in_redis(user, lat, lng)

                            # Get nearby count
                            nearby_count = await get_nearby_count_redis(
                                lat, lng, radius or user.preferred_radius_km
                            )

                            # Respond with nearby count
                            await websocket.send_json(
                                {
                                    "type": "nearby_update",
                                    "count": nearby_count,
                                    "radius_km": radius or user.preferred_radius_km,
                                    "timestamp": datetime.now(timezone.utc).isoformat(),
                                }
                            )

                    elif msg.get("type") == "ping":
                        await websocket.send_json({"type": "pong"})

                except asyncio.TimeoutError:
                    # Send keepalive ping
                    try:
                        await websocket.send_json({"type": "ping"})
                    except Exception:
                        break

    except WebSocketDisconnect:
        logger.info("ws_disconnected", user_id=user_id)
    except Exception as e:
        logger.error("ws_error", user_id=user_id, error=str(e))
    finally:
        if user_id and user_id in _ws_connections:
            del _ws_connections[user_id]


# Redis pub/sub listener for broadcasting location changes
async def start_location_pubsub():
    """Subscribe to Redis location:updates channel and broadcast to WebSocket clients."""
    try:
        from app.db.redis import _redis_pool

        redis = _redis_pool
        if redis is None:
            logger.warning("redis_not_available_for_pubsub")
            return

        pubsub = redis.pubsub()
        await pubsub.subscribe("location:updates")

        logger.info("location_pubsub_started")

        async for message in pubsub.listen():
            if message["type"] != "message":
                continue

            try:
                data = json.loads(message["data"])
                # Don't echo back to the sender
                sender_id = data.get("user_id")

                # Broadcast to other connected clients
                for uid, ws in _ws_connections.items():
                    if uid != sender_id:
                        try:
                            await ws.send_json(
                                {
                                    "type": "user_moved",
                                    "user_id": data["user_id"],
                                    "lat": data["lat"],
                                    "lng": data["lng"],
                                    "geohash": data.get("geohash"),
                                }
                            )
                        except Exception:
                            pass
            except Exception as e:
                logger.error("pubsub_broadcast_error", error=str(e))

    except Exception as e:
        logger.error("pubsub_setup_error", error=str(e))
