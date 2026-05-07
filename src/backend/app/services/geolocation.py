"""Geolocation utilities — Haversine distance, Google Distance Matrix, Redis geo-indexing."""

import math
import httpx
import structlog
from typing import Optional

from app.config import get_settings

settings = get_settings()
logger = structlog.get_logger()

# Earth's radius in kilometers
EARTH_RADIUS_KM = 6371.0


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate great-circle distance in km between two lat/lng points."""
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlng / 2) ** 2
    )
    c = 2 * math.asin(math.sqrt(a))
    return EARTH_RADIUS_KM * c


def haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate great-circle distance in meters."""
    return haversine_km(lat1, lng1, lat2, lng2) * 1000


def bounding_box(lat: float, lng: float, radius_km: float):
    """
    Return (min_lat, max_lat, min_lng, max_lng) bounding box that
    fully contains the circle of given radius_km around (lat, lng).
    """
    lat_delta = radius_km / 111.0  # ~111 km per degree latitude
    lng_delta = radius_km / (111.0 * math.cos(math.radians(lat)))
    return (
        lat - lat_delta,
        lat + lat_delta,
        lng - lng_delta,
        lng + lng_delta,
    )


async def get_travel_time_minutes(
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
    mode: str = "driving",
) -> Optional[float]:
    """
    Query Google Distance Matrix API for estimated travel time.
    Falls back to Haversine-based estimation if API key is not configured.
    """
    if not settings.GOOGLE_MAPS_API_KEY:
        # Fallback: assume 30 km/h average speed in city
        distance_km = haversine_km(origin_lat, origin_lng, dest_lat, dest_lng)
        return (distance_km / 30.0) * 60.0  # minutes

    url = "https://maps.googleapis.com/maps/api/distancematrix/json"
    params = {
        "origins": f"{origin_lat},{origin_lng}",
        "destinations": f"{dest_lat},{dest_lng}",
        "mode": mode,
        "departure_time": "now",
        "traffic_model": "best_guess",
        "key": settings.GOOGLE_MAPS_API_KEY,
    }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url, params=params)
            data = resp.json()

            if data.get("status") != "OK":
                logger.warning("distance_matrix_api_error", status=data.get("status"))
                return None

            element = data["rows"][0]["elements"][0]
            if element["status"] != "OK":
                logger.warning("distance_matrix_element_error", status=element["status"])
                return None

            # duration_in_traffic if available, otherwise duration
            duration = element.get("duration_in_traffic", element.get("duration"))
            if duration:
                return duration["value"] / 60.0  # seconds -> minutes

    except Exception as e:
        logger.error("distance_matrix_request_failed", error=str(e))

    # Fallback estimation
    distance_km = haversine_km(origin_lat, origin_lng, dest_lat, dest_lng)
    return (distance_km / 30.0) * 60.0


async def batch_travel_times(
    origin_lat: float,
    origin_lng: float,
    destinations: list[tuple[float, float, str]],  # [(lat, lng, user_id), ...]
    max_time_minutes: float = 30.0,
    mode: str = "driving",
) -> list[str]:
    """
    Check multiple destinations against origin. Returns list of user_ids
    that are reachable within max_time_minutes.

    Uses batch Distance Matrix API call if available, otherwise Haversine.
    """
    if not destinations:
        return []

    if not settings.GOOGLE_MAPS_API_KEY or len(destinations) <= 1:
        # Sequential Haversine-based estimation
        reachable = []
        for dest_lat, dest_lng, user_id in destinations:
            time_min = await get_travel_time_minutes(
                origin_lat, origin_lng, dest_lat, dest_lng, mode
            )
            if time_min is not None and time_min <= max_time_minutes:
                reachable.append(user_id)
        return reachable

    # Batch API call (up to 25 destinations per request)
    batch_size = 25
    reachable = []

    for i in range(0, len(destinations), batch_size):
        batch = destinations[i : i + batch_size]
        dest_strings = [f"{lat},{lng}" for lat, lng, _ in batch]

        url = "https://maps.googleapis.com/maps/api/distancematrix/json"
        params = {
            "origins": f"{origin_lat},{origin_lng}",
            "destinations": "|".join(dest_strings),
            "mode": mode,
            "departure_time": "now",
            "traffic_model": "best_guess",
            "key": settings.GOOGLE_MAPS_API_KEY,
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params=params)
                data = resp.json()

            if data.get("status") != "OK":
                continue

            for j, element in enumerate(data["rows"][0]["elements"]):
                if element["status"] != "OK":
                    continue
                duration = element.get("duration_in_traffic", element.get("duration"))
                if duration and duration["value"] / 60.0 <= max_time_minutes:
                    reachable.append(batch[j][2])

        except Exception as e:
            logger.error("batch_distance_matrix_failed", error=str(e))
            continue

    return reachable


def calculate_geo_hash(lat: float, lng: float, precision: int = 7) -> str:
    """
    Simple geohash-like encoding for Redis geo-indexing.
    Returns a string key used for proximity bucketing.

    precision=7 gives ~150m accuracy, good for nearby user queries.
    """
    min_lat, max_lat = -90.0, 90.0
    min_lng, max_lng = -180.0, 180.0
    bits = 0
    bit_count = 0
    result = []
    even = True

    total_bits = precision * 5  # 5 bits per character

    while len(result) * 5 < total_bits:
        if even:
            mid = (min_lng + max_lng) / 2
            if lng > mid:
                bits = (bits << 1) | 1
                min_lng = mid
            else:
                bits = (bits << 1) | 0
                max_lng = mid
        else:
            mid = (min_lat + max_lat) / 2
            if lat > mid:
                bits = (bits << 1) | 1
                min_lat = mid
            else:
                bits = (bits << 1) | 0
                max_lat = mid

        even = not even
        bit_count += 1

        if bit_count == 5:
            result.append("0123456789bcdefghjkmnpqrstuvwxyz"[bits])
            bits = 0
            bit_count = 0

    return "".join(result)


# Pre-computed neighbor offsets for geohash proximity expansion
GEOHASH_NEIGHBORS = {
    "n": [1, 0],
    "s": [-1, 0],
    "e": [0, 1],
    "w": [0, -1],
    "ne": [1, 1],
    "nw": [1, -1],
    "se": [-1, 1],
    "sw": [-1, -1],
}
