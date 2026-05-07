"""
seed_users.py — Insert 20 demo Bangalore users + 1 admin (idempotent).

HOW TO RUN:
  1. Make sure your .env has DATABASE_URL set
     e.g. DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:54322/postgres
  2. alembic upgrade head
  3. cd backend && python scripts/seed_users.py
  4. python scripts/verify_seed.py   ← confirm it worked
  5. To reset: alembic downgrade base && alembic upgrade head
                python scripts/seed.py && python scripts/seed_users.py

Uses ON CONFLICT (phone) DO NOTHING — safe to run repeatedly.
"""

import asyncio
import asyncpg
import sys
from datetime import datetime, timedelta, date, UTC
from pathlib import Path

# Load DATABASE_URL from .env (same directory as config.py reads it)
backend_dir = Path(__file__).resolve().parent.parent
env_path = backend_dir / ".env"

if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line.startswith("DATABASE_URL=") and not line.startswith("#"):
                raw_url = line.split("=", 1)[1].strip()
                break
        else:
            print("ERROR: DATABASE_URL not found in .env")
            sys.exit(1)
else:
    print("ERROR: .env not found at", env_path)
    sys.exit(1)

now = datetime.now(UTC).replace(tzinfo=None)  # naive UTC for DB compatibility

# Strip +asyncpg prefix for raw asyncpg
DB_URL = raw_url.replace("+asyncpg", "")

# ─────────────────────────────────────────────────────────────────────────────
# 20 REALISTIC BANGALORE USERS — hardcoded with diverse personalities
# Vector: [adventure, energy, social, openness, conscientiousness]
# ─────────────────────────────────────────────────────────────────────────────

USERS = [
    # ── TECH (4) ──
    {
        "supabase_uid": "demo-user-001", "phone": "+919876543201",
        "name": "Aravind Rajan", "email": "aravind.r@email.com",
        "date_of_birth": "1998-07-12", "gender": "male",
        "verification_status": "verified",
        "verified_at": now - timedelta(days=65),
        "personality_vector": "[0.85,0.82,0.62,0.78,0.55]",  # adventurous dev
        "interests": ["hiking", "tech", "photography", "cycling", "coffee"],
        "activity_preferences": ["outdoor", "networking", "workshops"],
        "vibe": "adventurous",
        "home_area": "Koramangala", "home_lat": 12.9352, "home_lng": 77.6245,
        "role": "user", "onboarding_completed": True,
        "screen_time_before": 9, "screen_time_after": 6,
        "total_experiences": 4,
        "created_at": now - timedelta(days=80),
    },
    {
        "supabase_uid": "demo-user-002", "phone": "+919876543202",
        "name": "Divya Srinivasan", "email": "divya.sri@email.com",
        "date_of_birth": "2000-03-22", "gender": "female",
        "verification_status": "verified",
        "verified_at": now - timedelta(days=50),
        "personality_vector": "[0.35,0.42,0.30,0.88,0.72]",  # introvert techie
        "interests": ["coding", "reading", "music", "art"],
        "activity_preferences": ["workshops", "wellness", "cultural"],
        "vibe": "intellectual",
        "home_area": "HSR Layout", "home_lat": 12.9116, "home_lng": 77.6389,
        "role": "user", "onboarding_completed": True,
        "screen_time_before": 8, "screen_time_after": 6,
        "total_experiences": 1,
        "created_at": now - timedelta(days=40),
    },
    {
        "supabase_uid": "demo-user-003", "phone": "+919876543203",
        "name": "Karthik Iyer", "email": "karthik.i@email.com",
        "date_of_birth": "1996-11-08", "gender": "male",
        "verification_status": "verified",
        "verified_at": now - timedelta(days=70),
        "personality_vector": "[0.72,0.68,0.78,0.65,0.50]",  # social PM
        "interests": ["startup", "coffee", "gaming", "fitness", "travel"],
        "activity_preferences": ["networking", "outdoor", "nightlife"],
        "vibe": "social",
        "home_area": "Indiranagar", "home_lat": 12.9784, "home_lng": 77.6408,
        "role": "user", "onboarding_completed": True,
        "screen_time_before": 7, "screen_time_after": 4,
        "total_experiences": 3,
        "created_at": now - timedelta(days=85),
    },
    {
        "supabase_uid": "demo-user-004", "phone": "+919876543204",
        "name": "Megha Nair", "email": "megha.n@email.com",
        "date_of_birth": "1999-05-17", "gender": "female",
        "verification_status": "verified",
        "verified_at": now - timedelta(days=55),
        "personality_vector": "[0.60,0.72,0.70,0.75,0.62]",  # balanced eng
        "interests": ["tech", "yoga", "cooking", "movies"],
        "activity_preferences": ["wellness", "workshops", "cultural"],
        "vibe": "balanced",
        "home_area": "Koramangala", "home_lat": 12.9352, "home_lng": 77.6245,
        "role": "user", "onboarding_completed": True,
        "screen_time_before": 7, "screen_time_after": 5,
        "total_experiences": 2,
        "created_at": now - timedelta(days=30),
    },

    # ── STUDENTS (3) ──
    {
        "supabase_uid": "demo-user-005", "phone": "+919876543205",
        "name": "Rohit Patil", "email": "rohit.p@email.com",
        "date_of_birth": "2002-09-14", "gender": "male",
        "verification_status": "verified",
        "verified_at": now - timedelta(days=40),
        "personality_vector": "[0.90,0.88,0.85,0.60,0.35]",  # social butterfly
        "interests": ["gaming", "music", "fitness", "movies", "coffee"],
        "activity_preferences": ["nightlife", "outdoor", "sports"],
        "vibe": "social",
        "home_area": "Koramangala", "home_lat": 12.9352, "home_lng": 77.6245,
        "role": "user", "onboarding_completed": True,
        "screen_time_before": 8, "screen_time_after": 5,
        "total_experiences": 5,
        "created_at": now - timedelta(days=25),
    },
    {
        "supabase_uid": "demo-user-006", "phone": "+919876543206",
        "name": "Anjali Deshmukh", "email": "anjali.d@email.com",
        "date_of_birth": "2001-12-03", "gender": "female",
        "verification_status": "verified",
        "verified_at": now - timedelta(days=45),
        "personality_vector": "[0.25,0.35,0.40,0.78,0.70]",  # chill student
        "interests": ["reading", "music", "art", "yoga"],
        "activity_preferences": ["cultural", "wellness", "workshops"],
        "vibe": "chill",
        "home_area": "Jayanagar", "home_lat": 12.9308, "home_lng": 77.5838,
        "role": "user", "onboarding_completed": True,
        "screen_time_before": 6, "screen_time_after": 4,
        "total_experiences": 2,
        "created_at": now - timedelta(days=35),
    },
    {
        "supabase_uid": "demo-user-007", "phone": "+919876543207",
        "name": "Vikram Shetty", "email": "vikram.s@email.com",
        "date_of_birth": "2000-06-28", "gender": "male",
        "verification_status": "verified",
        "verified_at": now - timedelta(days=60),
        "personality_vector": "[0.78,0.80,0.55,0.70,0.45]",  # adventurous student
        "interests": ["hiking", "cycling", "fitness", "photography", "travel"],
        "activity_preferences": ["outdoor", "sports", "nightlife"],
        "vibe": "adventurous",
        "home_area": "Whitefield", "home_lat": 12.9698, "home_lng": 77.7499,
        "role": "user", "onboarding_completed": True,
        "screen_time_before": 7, "screen_time_after": 4,
        "total_experiences": 3,
        "created_at": now - timedelta(days=60),
    },

    # ── CREATIVE (3) ──
    {
        "supabase_uid": "demo-user-008", "phone": "+919876543208",
        "name": "Tanvi Rao", "email": "tanvi.r@email.com",
        "date_of_birth": "1997-02-19", "gender": "female",
        "verification_status": "verified",
        "verified_at": now - timedelta(days=75),
        "personality_vector": "[0.55,0.50,0.35,0.92,0.60]",  # introverted artist
        "interests": ["art", "photography", "music", "coffee", "reading"],
        "activity_preferences": ["cultural", "workshops", "wellness"],
        "vibe": "creative",
        "home_area": "Indiranagar", "home_lat": 12.9784, "home_lng": 77.6408,
        "role": "user", "onboarding_completed": True,
        "screen_time_before": 6, "screen_time_after": 3,
        "total_experiences": 1,
        "created_at": now - timedelta(days=75),
    },
    {
        "supabase_uid": "demo-user-009", "phone": "+919876543209",
        "name": "Nikhil Joshi", "email": "nikhil.j@email.com",
        "date_of_birth": "1998-10-05", "gender": "male",
        "verification_status": "verified",
        "verified_at": now - timedelta(days=55),
        "personality_vector": "[0.70,0.75,0.80,0.82,0.50]",  # social designer
        "interests": ["art", "photography", "coffee", "movies", "travel"],
        "activity_preferences": ["cultural", "outdoor", "nightlife"],
        "vibe": "creative",
        "home_area": "Koramangala", "home_lat": 12.9352, "home_lng": 77.6245,
        "role": "user", "onboarding_completed": True,
        "screen_time_before": 8, "screen_time_after": 5,
        "total_experiences": 4,
        "created_at": now - timedelta(days=50),
    },
    {
        "supabase_uid": "demo-user-010", "phone": "+919876543210",
        "name": "Priya Menon", "email": "priya.m@email.com",
        "date_of_birth": "1999-08-11", "gender": "female",
        "verification_status": "verified",
        "verified_at": now - timedelta(days=48),
        "personality_vector": "[0.62,0.58,0.72,0.85,0.48]",  # expressive creative
        "interests": ["art", "cooking", "music", "photography", "reading"],
        "activity_preferences": ["cultural", "nightlife", "workshops"],
        "vibe": "creative",
        "home_area": "HSR Layout", "home_lat": 12.9116, "home_lng": 77.6389,
        "role": "user", "onboarding_completed": True,
        "screen_time_before": 7, "screen_time_after": 5,
        "total_experiences": 2,
        "created_at": now - timedelta(days=42),
    },

    # ── BUSINESS / FINANCE (3) ──
    {
        "supabase_uid": "demo-user-011", "phone": "+919876543211",
        "name": "Aditya Kulkarni", "email": "aditya.k@email.com",
        "date_of_birth": "1995-04-30", "gender": "male",
        "verification_status": "verified",
        "verified_at": now - timedelta(days=85),
        "personality_vector": "[0.50,0.65,0.72,0.55,0.80]",  # conscientious biz
        "interests": ["startup", "fitness", "coffee", "reading", "travel"],
        "activity_preferences": ["networking", "outdoor", "workshops"],
        "vibe": "balanced",
        "home_area": "Whitefield", "home_lat": 12.9698, "home_lng": 77.7499,
        "role": "user", "onboarding_completed": True,
        "screen_time_before": 8, "screen_time_after": 5,
        "total_experiences": 3,
        "created_at": now - timedelta(days=90),
    },
    {
        "supabase_uid": "demo-user-012", "phone": "+919876543212",
        "name": "Shreya Agarwal", "email": "shreya.a@email.com",
        "date_of_birth": "1997-01-15", "gender": "female",
        "verification_status": "verified",
        "verified_at": now - timedelta(days=60),
        "personality_vector": "[0.40,0.55,0.65,0.60,0.85]",  # cautious finance
        "interests": ["reading", "yoga", "food", "travel", "movies"],
        "activity_preferences": ["cultural", "wellness", "food"],
        "vibe": "chill",
        "home_area": "Indiranagar", "home_lat": 12.9784, "home_lng": 77.6408,
        "role": "user", "onboarding_completed": True,
        "screen_time_before": 6, "screen_time_after": 4,
        "total_experiences": 1,
        "created_at": now - timedelta(days=55),
    },
    {
        "supabase_uid": "demo-user-013", "phone": "+919876543213",
        "name": "Rahul Kapoor", "email": "rahul.kap@email.com",
        "date_of_birth": "1996-12-22", "gender": "male",
        "verification_status": "verified",
        "verified_at": now - timedelta(days=68),
        "personality_vector": "[0.75,0.78,0.85,0.55,0.42]",  # social businessman
        "interests": ["startup", "gaming", "fitness", "coffee", "travel"],
        "activity_preferences": ["networking", "nightlife", "sports"],
        "vibe": "social",
        "home_area": "Koramangala", "home_lat": 12.9352, "home_lng": 77.6245,
        "role": "user", "onboarding_completed": True,
        "screen_time_before": 9, "screen_time_after": 6,
        "total_experiences": 5,
        "created_at": now - timedelta(days=70),
    },

    # ── MIXED / OTHER (4) — teacher, chef, architect, journalist ──
    {
        "supabase_uid": "demo-user-014", "phone": "+919876543214",
        "name": "Lakshmi Krishnan", "email": "lakshmi.k@email.com",
        "date_of_birth": "1996-06-08", "gender": "female",
        "verification_status": "verified",
        "verified_at": now - timedelta(days=72),
        "personality_vector": "[0.30,0.40,0.82,0.70,0.55]",  # warm teacher
        "interests": ["reading", "music", "cooking", "art", "yoga"],
        "activity_preferences": ["cultural", "wellness", "workshops"],
        "vibe": "social",
        "home_area": "Jayanagar", "home_lat": 12.9308, "home_lng": 77.5838,
        "role": "user", "onboarding_completed": True,
        "screen_time_before": 5, "screen_time_after": 3,
        "total_experiences": 3,
        "created_at": now - timedelta(days=65),
    },
    {
        "supabase_uid": "demo-user-015", "phone": "+919876543215",
        "name": "Suresh Reddy", "email": "suresh.r@email.com",
        "date_of_birth": "1995-09-18", "gender": "male",
        "verification_status": "verified",
        "verified_at": now - timedelta(days=78),
        "personality_vector": "[0.65,0.70,0.45,0.75,0.58]",  # thoughtful chef
        "interests": ["cooking", "food", "travel", "photography", "music"],
        "activity_preferences": ["food", "cultural", "outdoor"],
        "vibe": "creative",
        "home_area": "HSR Layout", "home_lat": 12.9116, "home_lng": 77.6389,
        "role": "user", "onboarding_completed": True,
        "screen_time_before": 6, "screen_time_after": 3,
        "total_experiences": 2,
        "created_at": now - timedelta(days=78),
    },
    {
        "supabase_uid": "demo-user-016", "phone": "+919876543216",
        "name": "Neha Gupta", "email": "neha.g@email.com",
        "date_of_birth": "2000-02-25", "gender": "female",
        "verification_status": "verified",
        "verified_at": now - timedelta(days=35),
        "personality_vector": "[0.72,0.68,0.55,0.82,0.48]",  # creative architect
        "interests": ["art", "photography", "travel", "coffee", "reading"],
        "activity_preferences": ["cultural", "outdoor", "nightlife"],
        "vibe": "adventurous",
        "home_area": "Whitefield", "home_lat": 12.9698, "home_lng": 77.7499,
        "role": "user", "onboarding_completed": True,
        "screen_time_before": 7, "screen_time_after": 5,
        "total_experiences": 3,
        "created_at": now - timedelta(days=28),
    },
    {
        "supabase_uid": "demo-user-017", "phone": "+919876543217",
        "name": "Arun Prasad", "email": "arun.p@email.com",
        "date_of_birth": "1998-11-03", "gender": "male",
        "verification_status": "verified",
        "verified_at": now - timedelta(days=52),
        "personality_vector": "[0.58,0.55,0.70,0.68,0.55]",  # curious journalist
        "interests": ["reading", "coffee", "travel", "movies", "startup"],
        "activity_preferences": ["cultural", "food", "networking"],
        "vibe": "intellectual",
        "home_area": "Indiranagar", "home_lat": 12.9784, "home_lng": 77.6408,
        "role": "user", "onboarding_completed": True,
        "screen_time_before": 8, "screen_time_after": 6,
        "total_experiences": 2,
        "created_at": now - timedelta(days=45),
    },

    # ── MORE TECH to round out to 10 male/10 female ──
    # (we have 10 male, 7 female so far — need 3 more female)
    {
        "supabase_uid": "demo-user-018", "phone": "+919876543218",
        "name": "Sanya Bhat", "email": "sanya.b@email.com",
        "date_of_birth": "1999-07-29", "gender": "female",
        "verification_status": "verified",
        "verified_at": now - timedelta(days=58),
        "personality_vector": "[0.82,0.85,0.68,0.62,0.38]",  # adventurous female
        "interests": ["hiking", "cycling", "fitness", "travel", "photography"],
        "activity_preferences": ["outdoor", "sports", "nightlife"],
        "vibe": "adventurous",
        "home_area": "HSR Layout", "home_lat": 12.9116, "home_lng": 77.6389,
        "role": "user", "onboarding_completed": True,
        "screen_time_before": 7, "screen_time_after": 4,
        "total_experiences": 4,
        "created_at": now - timedelta(days=48),
    },
    {
        "supabase_uid": "demo-user-019", "phone": "+919876543219",
        "name": "Kavya Venkatesh", "email": "kavya.v@email.com",
        "date_of_birth": "2001-04-10", "gender": "female",
        "verification_status": "verified",
        "verified_at": now - timedelta(days=32),
        "personality_vector": "[0.22,0.30,0.28,0.80,0.72]",  # introvert wellness
        "interests": ["yoga", "reading", "cooking", "music", "art"],
        "activity_preferences": ["wellness", "cultural", "workshops"],
        "vibe": "chill",
        "home_area": "Jayanagar", "home_lat": 12.9308, "home_lng": 77.5838,
        "role": "user", "onboarding_completed": True,
        "screen_time_before": 5, "screen_time_after": 3,
        "total_experiences": 0,
        "created_at": now - timedelta(days=20),
    },
    {
        "supabase_uid": "demo-user-020", "phone": "+919876543220",
        "name": "Pooja Sharma", "email": "pooja.s@email.com",
        "date_of_birth": "1997-08-20", "gender": "female",
        "verification_status": "verified",
        "verified_at": now - timedelta(days=62),
        "personality_vector": "[0.55,0.60,0.78,0.70,0.55]",  # social female eng
        "interests": ["tech", "reading", "coffee", "movies", "travel"],
        "activity_preferences": ["networking", "workshops", "food"],
        "vibe": "social",
        "home_area": "Koramangala", "home_lat": 12.9352, "home_lng": 77.6245,
        "role": "user", "onboarding_completed": True,
        "screen_time_before": 8, "screen_time_after": 5,
        "total_experiences": 2,
        "created_at": now - timedelta(days=55),
    },
]

# ── ADMIN USER ───────────────────────────────────────────────────────────────
ADMIN = {
    "supabase_uid": "demo-admin-001",
    "phone": "+919999999999",
    "name": "Wander Admin",
    "email": "admin@wander.app",
    "date_of_birth": "1995-01-01",
    "gender": "male",
    "verification_status": "verified",
    "verified_at": now - timedelta(days=90),
    "personality_vector": "[0.75,0.80,0.70,0.75,0.85]",
    "interests": ["travel", "coffee", "reading", "fitness"],
    "activity_preferences": ["outdoor", "cultural", "networking"],
    "vibe": "balanced",
    "home_area": "Indiranagar", "home_lat": 12.9784, "home_lng": 77.6408,
    "role": "admin", "onboarding_completed": True,
    "screen_time_before": 6, "screen_time_after": 4,
    "total_experiences": 5,
    "created_at": now - timedelta(days=90),
}


async def seed():
    conn = await asyncpg.connect(DB_URL)

    # Handle --reset
    if "--reset" in sys.argv:
        print("⚠️  --reset requested.")
        print("   To truly reset the DB, run:")
        print("     alembic downgrade base && alembic upgrade head")
        print("   Then re-run:")
        print("     python scripts/seed.py && python scripts/seed_users.py")
        print()
        print("   Continuing with idempotent insert (will NOT delete anything)...")
        print()

    # Insert all users (20 demo + 1 admin)
    all_users = USERS + [ADMIN]
    inserted = 0
    skipped = 0

    for u in all_users:
        # Convert date string to date object for asyncpg
        dob = datetime.strptime(u["date_of_birth"], "%Y-%m-%d").date()

        result = await conn.execute("""
            INSERT INTO users (
                supabase_uid, phone, name, email, date_of_birth, gender,
                verification_status, verified_at,
                personality_vector,
                interests, activity_preferences, vibe,
                home_area, home_lat, home_lng, city,
                onboarding_completed, role,
                screen_time_before, screen_time_after,
                total_experiences, created_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6,
                $7, $8,
                $9::vector,
                $10::text[], $11::text[], $12,
                $13, $14, $15, $16,
                $17, $18,
                $19, $20,
                $21, $22
            )
            ON CONFLICT (phone) DO NOTHING
        """,
            u["supabase_uid"], u["phone"], u["name"], u["email"],
            dob, u["gender"],
            u["verification_status"], u["verified_at"],
            u["personality_vector"],
            u["interests"], u["activity_preferences"], u["vibe"],
            u["home_area"], u["home_lat"], u["home_lng"], "Bangalore",
            u["onboarding_completed"], u["role"],
            u["screen_time_before"], u["screen_time_after"],
            u["total_experiences"], u["created_at"],
        )

        if result == "INSERT 0 1":
            inserted += 1
        else:
            skipped += 1

    print(f"Inserted {inserted}, Skipped {skipped}")
    if inserted > 0:
        print(f"  - {len(USERS)} demo users (10 male, 10 female)")
        print(f"  - 1 admin (phone: {ADMIN['phone']})")
    if skipped > 0:
        print("  (some phones already existed — idempotent seed)")

    await conn.close()


if __name__ == "__main__":
    asyncio.run(seed())
