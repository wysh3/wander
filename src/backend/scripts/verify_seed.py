"""
verify_seed.py — Check the seeded users and pgvector cosine similarity.

Run: python scripts/verify_seed.py
"""

import asyncio
import asyncpg
import sys
import re
from datetime import datetime, timedelta, UTC
from pathlib import Path

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
            print("ERROR: DATABASE_URL not found")
            sys.exit(1)
else:
    print("ERROR: .env not found")
    sys.exit(1)

DB_URL = raw_url.replace("+asyncpg", "")


async def verify():
    conn = await asyncpg.connect(DB_URL)

    # 1. Total count
    total = await conn.fetchval("SELECT count(*) FROM users")
    print(f"\n{'='*72}")
    print(f"  Total users in DB: {total}")
    print(f"{'='*72}\n")

    # 2. Table of demo users
    rows = await conn.fetch("""
        SELECT name, home_area, vibe,
               personality_vector,
               interests
        FROM users
        WHERE supabase_uid LIKE 'demo-user-%'
        ORDER BY supabase_uid
    """)

    print(f"{'Name':<22} {'Area':<16} {'Vibe':<14} {'Vector':<32} {'Interests'}")
    print("-" * 100)
    for r in rows:
        pv = r["personality_vector"]
        if pv and isinstance(pv, str):
            # Parse pgvector string format: [0.85,0.82,...]
            nums = [float(x) for x in pv.strip("[]").split(",")]
            pv_str = "[" + ",".join(f"{v:.2f}" for v in nums) + "]"
        else:
            pv_str = "NULL"
        interests = r["interests"] or []
        top = interests[:2]
        print(f"{r['name']:<22} {r['home_area']:<16} {r['vibe']:<14} {pv_str:<32} {', '.join(top)}")

    print()

    # 3. Cosine similarity: top 3 most similar to first demo user
    first = await conn.fetchrow("""
        SELECT name, personality_vector
        FROM users
        WHERE supabase_uid = 'demo-user-001'
    """)

    if first and first["personality_vector"]:
        label = first["name"]
        # Parse vector string to float list for the <=> operator
        pv_str = first["personality_vector"]
        if isinstance(pv_str, str):
            pv_list = [float(x.strip()) for x in pv_str.strip("[]").split(",")]
        else:
            pv_list = list(pv_str)

        similar = await conn.fetch("""
            SELECT name, personality_vector <=> $1::vector AS distance
            FROM users
            WHERE id != (SELECT id FROM users WHERE supabase_uid = 'demo-user-001')
              AND personality_vector IS NOT NULL
            ORDER BY distance
            LIMIT 3
        """, pv_str)

        print(f"  Top 3 most similar to {label}:")
        for i, s in enumerate(similar, 1):
            print(f"  {i}. {s['name']:<22}  cosine distance: {s['distance']:.4f}")

    print()
    await conn.close()


if __name__ == "__main__":
    asyncio.run(verify())
