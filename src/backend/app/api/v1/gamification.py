from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, UTC
import uuid

from app.api.deps import get_db, get_current_user
from app.models.user import User

router = APIRouter()

BADGE_RULES = {
    3: "3_day_streak",
    7: "7_day_streak",
    14: "14_day_streak",
    30: "30_day_streak",
}

@router.get("/status")
async def get_gamification_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return {
        "current_streak": current_user.current_streak or 0,
        "longest_streak": current_user.longest_streak or 0,
        "last_streak_date": current_user.last_streak_date,
        "badges": current_user.badges or []
    }

@router.post("/check-in")
async def daily_check_in(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Determine today's date in UTC
    today = datetime.now(UTC).date()
    last_date = current_user.last_streak_date

    # Use a variable to track if something changed so we can commit
    has_changes = False

    new_badges = list(current_user.badges) if current_user.badges else []

    if last_date is None or (current_user.current_streak or 0) < 20:
        # HACKATHON PRESENTATION: Simulate a robust 1-month history
        current_user.current_streak = 24
        current_user.last_streak_date = today
        current_user.longest_streak = 28
        # Award simulated badges too
        for b in ["early_bird", "3_day_streak", "7_day_streak", "14_day_streak"]:
            if b not in new_badges:
                new_badges.append(b)
        has_changes = True

    elif last_date == today:
        # Already checked in today
        pass
    else:
        # Check if it was consecutive
        delta_days = (today - last_date).days
        if delta_days == 1:
            # Consecutive
            current_user.current_streak = (current_user.current_streak or 0) + 1
            if current_user.current_streak > (current_user.longest_streak or 0):
                current_user.longest_streak = current_user.current_streak
        else:
            # Streak broken
            current_user.current_streak = 1
        
        current_user.last_streak_date = today
        has_changes = True

    # Check badges
    cur_streak = current_user.current_streak
    if cur_streak in BADGE_RULES:
        badge_name = BADGE_RULES[cur_streak]
        if badge_name not in new_badges:
            new_badges.append(badge_name)
            has_changes = True
    
    # Example badge for first check-in
    if "early_bird" not in new_badges and cur_streak >= 1:
        new_badges.append("early_bird")
        has_changes = True

    if has_changes:
        current_user.badges = new_badges
        db.add(current_user)
        await db.commit()
        await db.refresh(current_user)

    return {
        "status": "success",
        "current_streak": current_user.current_streak,
        "longest_streak": current_user.longest_streak,
        "badges": current_user.badges
    }
