"""Onboarding service — structured answers → NVIDIA profile generation."""

import json
import structlog

from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.config import get_settings

settings = get_settings()
logger = structlog.get_logger()


async def call_nvidia(prompt: str) -> dict | None:
    """Call NVIDIA Nemotron to generate a personality profile from structured answers."""
    if not settings.NVIDIA_API_KEY:
        return None

    try:
        import openai
        client = openai.AsyncOpenAI(
            api_key=settings.NVIDIA_API_KEY,
            base_url=settings.NVIDIA_BASE_URL,
        )
        response = await client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are a personality profiler. Given a user's interests, energy level, and availability, output a JSON object with exactly these keys:\n"
                               "- personality_vector: [adventure, energy, social, openness, conscientiousness] each 0.0-1.0\n"
                               "- vibe: one word (chill, energetic, curious, balanced, adventurous, creative)\n"
                               "Reply ONLY with the JSON. No other text.",
                },
                {"role": "user", "content": prompt},
            ],
            max_tokens=500,
            temperature=0.3,
        )
        content = response.choices[0].message.content
        if content:
            # Strip markdown code fences if present
            content = content.strip()
            if content.startswith("```"):
                lines = content.split("\n")
                content = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
            return json.loads(content)
    except Exception as e:
        logger.error("nvidia_profile_failed", error=str(e))
        return None


def fallback_profile(interests: list[str], energy: str, availability: list[str]) -> dict:
    """Deterministic fallback when LLM is unavailable."""
    energy_map = {
        "high": {"adventure": 0.85, "energy": 0.9, "social": 0.8, "openness": 0.75, "conscientiousness": 0.5, "vibe": "energetic"},
        "balanced": {"adventure": 0.65, "energy": 0.6, "social": 0.65, "openness": 0.75, "conscientiousness": 0.65, "vibe": "balanced"},
        "chill": {"adventure": 0.35, "energy": 0.3, "social": 0.55, "openness": 0.7, "conscientiousness": 0.7, "vibe": "chill"},
    }
    base = energy_map.get(energy, energy_map["balanced"])

    # Boost adventure for outdoors/physical interests
    if any(i in interests for i in ["outdoors", "fitness", "trekking"]):
        base["adventure"] = min(1.0, base["adventure"] + 0.15)
    if any(i in interests for i in ["creative", "learning"]):
        base["openness"] = min(1.0, base["openness"] + 0.1)
    if any(i in interests for i in ["social", "food & drink"]):
        base["social"] = min(1.0, base["social"] + 0.15)

    return {
        "personality_vector": [base["adventure"], base["energy"], base["social"], base["openness"], base["conscientiousness"]],
        "vibe": base["vibe"],
        "interests": interests,
        "availability": availability,
    }


async def complete_onboarding(
    db: AsyncSession,
    user: User,
    interests: list[str],
    energy: str,
    availability: list[str],
) -> dict:
    prompt = (
        f"User interests: {', '.join(interests)}.\n"
        f"Energy level: {energy}.\n"
        f"Available: {', '.join(availability)}.\n"
        f"Generate personality_vector and vibe as JSON."
    )

    result = await call_nvidia(prompt)

    if result and isinstance(result.get("personality_vector"), list) and len(result["personality_vector"]) == 5:
        pv = result["personality_vector"]
        vibe = result.get("vibe", "balanced")
    else:
        fallback = fallback_profile(interests, energy, availability)
        pv = fallback["personality_vector"]
        vibe = fallback["vibe"]

    user.personality_vector = pv
    user.personality_raw = dict(zip(["adventure", "energy", "social", "openness", "conscientiousness"], pv))
    user.interests = interests
    user.vibe = vibe
    user.availability = availability
    user.onboarding_completed = True
    await db.commit()

    return {
        "personality_vector": pv,
        "interests": interests,
        "vibe": vibe,
        "availability": availability,
    }
