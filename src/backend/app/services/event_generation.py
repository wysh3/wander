"""Local events generation — Exa web search + NVIDIA LLM parsing → structured events."""
import json
import re
import structlog
from datetime import datetime, timedelta

from app.config import get_settings

settings = get_settings()
logger = structlog.get_logger()

AREAS = [
    "Indiranagar", "Koramangala", "MG Road", "Whitefield", "JP Nagar",
    "HSR Layout", "Electronic City", "Yelahanka", "Jayanagar", "Malleshwaram",
]

CATEGORY_MAP = {
    "outdoor": ["trek", "hike", "walk", "park", "nature", "cycling", "run", "marathon", "lake", "hill"],
    "cultural": ["music", "concert", "art", "exhibition", "dance", "theatre", "comedy", "standup", "festival", "heritage", "museum"],
    "food": ["food", "dinner", "restaurant", "brunch", "cooking", "brewery", "wine", "beer", "popup", "supper"],
    "sports": ["sports", "yoga", "fitness", "gym", "cricket", "football", "badminton", "swimming"],
    "wellness": ["meditation", "wellness", "retreat", "therapy", "sound healing", "breathwork"],
    "networking": ["meetup", "networking", "startup", "workshop", "conference", "talk", "seminar"],
}

PARSE_SYSTEM = """You extract event details from web search results into strict JSON.

For each event found, output a JSON array of objects. Each object must have exactly these fields:
{
  "title": "string",
  "description": "string",
  "category": "physical|mental|skill|explore|chaotic|social_good|slow",
  "area": "string (Bangalore neighborhood name)",
  "scheduled_at": "YYYY-MM-DDTHH:MM:SS",
  "duration_minutes": number,
  "ticket_type": "free|paid|donation",
  "ticket_price_inr": number,
  "tags": ["string"],
  "source_url": "string",
  "confidence": 0.0-1.0
}

CRITICAL RULES:
- Only extract REAL events with a clear title, date, and venue/location
- SKIP anything that looks like a search query, index page, or "top events" listicle
- SKIP if no specific date is mentioned
- Dates in past = skip entirely
- For partial dates (e.g. "May 3"), assume upcoming Friday/Saturday/Sunday in May 2026
- duration_minutes: 60 meetup, 90 workshop, 120 concert, 180 trek
- confidence: 0.9+ if you see exact date+venue+description, 0.5 if vague
- Return empty array [] if nothing qualifies
- Output ONLY the JSON array. No markdown, no explanation."""


def _looks_like_query(title: str) -> bool:
    """Filter out search results that are literal queries, not events."""
    title_lower = title.lower().strip()
    query_patterns = [
        r"^what\s+are\s+the\s+",
        r"^top\s+\d+\s+",
        r"^best\s+",
        r"^events?\s+(in|happening|this|near)",
        r"^things?\s+to\s+do\s+",
        r"^upcoming\s+events?\s*$",
        r"^\d+\s+best\s+",
        r"^calendar\s+of\s+events",
        r"events?\s+(this|near|in)\s+\w+\s*$",
    ]
    for pattern in query_patterns:
        if re.search(pattern, title_lower):
            return True
    return False


async def _connect_exa():
    """Create a connection to the Exa MCP server via Streamable HTTP."""
    from mcp import ClientSession
    from mcp.client.streamable_http import streamablehttp_client

    transport = streamablehttp_client("https://mcp.exa.ai/mcp")
    read, write, get_session_id = await transport.__aenter__()
    session = ClientSession(read, write)
    await session.__aenter__()
    await session.initialize()
    return transport, session


async def _search_exa(session, query: str, num_results: int = 5) -> list[dict]:
    """Search Exa for events. Returns only results that look like actual events."""
    result = await session.call_tool(
        "web_search_exa",
        {"query": query, "numResults": num_results},
    )
    items = []
    for item in result.content:
        if hasattr(item, "text"):
            text = item.text
            title_match = re.search(r"^Title:\s*(.+)$", text, re.MULTILINE)
            title = title_match.group(1).strip() if title_match else ""
            if title and not _looks_like_query(title):
                items.append(text)
    return items


async def _parse_with_nvidia(text_chunks: list[str]) -> list[dict]:
    """Parse search result chunks with NVIDIA LLM. Handles broken JSON from Nemotron."""
    if not settings.NVIDIA_API_KEY:
        return []

    import openai
    client = openai.AsyncOpenAI(
        api_key=settings.NVIDIA_API_KEY,
        base_url=settings.NVIDIA_BASE_URL,
    )

    all_events = []

    for chunk in text_chunks:
        user_text = chunk[:2000]

        for attempt in range(3):
            try:
                response = await client.chat.completions.create(
                    model=settings.LLM_MODEL,
                    messages=[
                        {"role": "system", "content": PARSE_SYSTEM},
                        {"role": "user", "content": f"Extract events from:\n{user_text}"},
                    ],
                    max_tokens=2048,
                    temperature=0.1,
                )
                content = response.choices[0].message.content
                if not content:
                    break

                content = content.strip()
                if content.startswith("```"):
                    lines = content.split("\n")
                    inner = "\n".join(lines[1:])
                    if inner.endswith("```"):
                        inner = inner[:-3]
                    content = inner.strip()

                parsed = _repair_and_parse_json(content)
                if isinstance(parsed, list):
                    all_events.extend(parsed)
                    break

            except Exception as e:
                logger.warning("nvidia_parse_attempt_failed", attempt=attempt, error=str(e)[:120])
                if attempt == 0:
                    continue

    return all_events


def _repair_and_parse_json(text: str):
    """Try to parse JSON, with repairs for common Nemotron output issues
    (unescaped newlines in strings, truncation, extra commas)."""
    import re

    text = text.strip()

    # Strategy 1: direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Strategy 2: fix unescaped newlines inside quoted strings
    fixed = _fix_json_newlines(text)
    try:
        return json.loads(fixed)
    except json.JSONDecodeError:
        pass

    # Strategy 3: truncate at last complete object and close the array
    last_brace = text.rfind("}")
    if last_brace > 0:
        truncated = text[:last_brace + 1]
        if not truncated.strip().endswith("]"):
            truncated = truncated.rstrip().rstrip(",") + "\n]"
        fixed2 = _fix_json_newlines(truncated)
        try:
            return json.loads(fixed2)
        except json.JSONDecodeError:
            pass

    # Strategy 4: extract individual JSON objects with regex
    objects = re.findall(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', text)
    if objects:
        results = []
        for obj_str in objects:
            fixed_obj = _fix_json_newlines(obj_str)
            try:
                results.append(json.loads(fixed_obj))
            except json.JSONDecodeError:
                continue
        if results:
            return results

    return []


def _fix_json_newlines(text: str) -> str:
    """Replace unescaped literal newlines within JSON string values with \\n."""
    import re

    result = []
    in_string = False
    escape_next = False
    i = 0

    while i < len(text):
        ch = text[i]

        if escape_next:
            result.append(ch)
            escape_next = False
            i += 1
            continue

        if ch == '\\':
            result.append(ch)
            escape_next = True
            i += 1
            continue

        if ch == '"':
            in_string = not in_string
            result.append(ch)
            i += 1
            continue

        if in_string and ch == '\n':
            result.append('\\n')
            i += 1
            continue

        if in_string and ch == '\r':
            result.append('\\r')
            i += 1
            continue

        if in_string and ch == '\t':
            result.append('\\t')
            i += 1
            continue

        result.append(ch)
        i += 1

    return ''.join(result)


def _assign_category(title: str, description: str) -> str:
    text = f"{title} {description}".lower()
    scores = {}
    for cat, keywords in CATEGORY_MAP.items():
        score = sum(1 for kw in keywords if kw in text)
        if score > 0:
            scores[cat] = score
    return max(scores, key=scores.get) if scores else "explore"


def _normalize_event(raw: dict, search_area: str = "") -> dict:
    title = raw.get("title", "").strip() or "Untitled Event"
    description = raw.get("description", "").strip()
    category = raw.get("category") or _assign_category(title, description)

    area = raw.get("area", "").strip() or search_area
    if area:
        area_clean = area.split(",")[0].strip()
        for a in AREAS:
            if a.lower() in area_clean.lower():
                area = a
                break

    tags = raw.get("tags", [])
    if not isinstance(tags, list):
        tags = []

    scheduled_at = raw.get("scheduled_at", "")
    try:
        dt = datetime.fromisoformat(scheduled_at.replace("Z", "+00:00"))
        if dt < datetime.utcnow():
            dt = datetime.utcnow() + timedelta(days=7)
    except (ValueError, TypeError):
        dt = datetime.utcnow() + timedelta(days=7)

    confidence = raw.get("confidence", 0.5)
    if not isinstance(confidence, (int, float)):
        confidence = 0.5

    return {
        "title": title[:200],
        "description": (description or f"Event in {area or 'Bangalore'}")[:1000],
        "category": category,
        "area": area or search_area or "Indiranagar",
        "city": "Bangalore",
        "lat": None,
        "lng": None,
        "scheduled_at": dt.isoformat(),
        "duration_minutes": raw.get("duration_minutes", 120) or 120,
        "group_size_min": 4,
        "group_size_max": 8,
        "max_groups": 3,
        "min_capacity": 4,
        "max_capacity": 50,
        "ticket_type": raw.get("ticket_type", "free") or "free",
        "ticket_price_inr": raw.get("ticket_price_inr", 0) or 0,
        "visibility": "public",
        "status": "draft",
        "is_local_event": True,
        "tags": [t for t in tags if isinstance(t, str)][:5],
        "women_only": False,
        "phone_free_encouraged": True,
        "source_url": raw.get("source_url", "") or "",
        "confidence": min(max(confidence, 0.0), 1.0),
    }


async def generate_local_events(
    areas: list[str] | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    limit_per_area: int = 3,
) -> dict:
    if areas is None:
        areas = AREAS[:5]

    selected_areas = [a for a in areas if a in AREAS]
    if not selected_areas:
        selected_areas = AREAS[:5]

    logger.info("event_generation_started", areas=selected_areas)

    text_chunks_by_area = []
    total_sources = 0
    transport = None
    session = None

    try:
        transport, session = await _connect_exa()
        logger.info("exa_connected")

        for area in selected_areas:
            queries = [
                f"upcoming events concerts workshops meetups this weekend in {area} Bangalore",
                f"things to do in {area} Bangalore events calendar shows activities",
            ]
            for query in queries:
                if date_from and date_to:
                    query += f" {date_from} to {date_to}"
                try:
                    results = await _search_exa(session, query, num_results=limit_per_area)
                    for text in results:
                        tagged = f"[Searching area: {area}]\n{text}"
                        text_chunks_by_area.append((area, tagged))
                        total_sources += 1
                    logger.info("exa_search_done", area=area, results=len(results))
                except Exception as e:
                    logger.warning("exa_search_error", area=area, error=str(e))

    except Exception as e:
        logger.error("exa_connection_failed", error=str(e))
    finally:
        if session and transport:
            try:
                await session.__aexit__(None, None, None)
                await transport.__aexit__(None, None, None)
            except Exception:
                pass

    if not text_chunks_by_area:
        logger.warning("no_search_results")
        return {"events": [], "stats": {"searched_areas": len(selected_areas), "sources_found": 0, "events_parsed": 0}}

    # Parse with NVIDIA, keeping area context
    parsed_raw = []
    for i in range(0, len(text_chunks_by_area), 4):
        batch = text_chunks_by_area[i:i + 4]
        batch_texts = [text for _, text in batch]
        batch_parsed = await _parse_with_nvidia(batch_texts)
        if isinstance(batch_parsed, list):
            # Attach the searched area to each parsed event
            for event in batch_parsed:
                if isinstance(event, dict) and not event.get("area"):
                    # Try to assign area from any batch item
                    for area, t in batch:
                        if area.lower() in t.lower():
                            event["area"] = area
                            break
            parsed_raw.extend(batch_parsed)
        logger.info("batch_parsed", batch_idx=i // 4, events=len(batch_parsed) if isinstance(batch_parsed, list) else 0)

    # Build area lookup from all chunks
    area_lookup: dict[str, str] = {}
    for area, text in text_chunks_by_area:
        for word in text.split()[:20]:
            for a in AREAS:
                if a.lower() in word.lower() or a.lower() in text[:300].lower():
                    area_lookup[a.lower()] = a

    # Normalize events with area context
    events = []
    seen_titles = set()

    for raw in parsed_raw:
        if not isinstance(raw, dict):
            continue

        # Determine the best area: from LLM output, or from search context
        llm_area = raw.get("area", "").strip()
        search_area = ""
        if not llm_area:
            # Fall back to first matching area from search data
            for area, _ in text_chunks_by_area:
                if area.lower() in raw.get("title", "").lower() or area.lower() in raw.get("description", "").lower():
                    search_area = area
                    break

        normalized = _normalize_event(raw, search_area=llm_area or search_area)

        if normalized["confidence"] < 0.3:
            continue

        key = normalized["title"].lower().strip()[:50]
        if key in seen_titles:
            continue
        seen_titles.add(key)

        events.append(normalized)

    logger.info("generation_complete", events=len(events), sources=total_sources)

    return {
        "events": events,
        "stats": {
            "searched_areas": len(selected_areas),
            "sources_found": total_sources,
            "events_parsed": len(events),
        },
    }
