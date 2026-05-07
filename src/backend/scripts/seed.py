import asyncio
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.models import User, Host, Activity, Group, GroupMember, Venue, FriendConnection
from app.config import get_settings

settings = get_settings()


async def seed():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # ── Hosts (5) ──────────────────────────────────────────────────────
        host_users = [
            User(supabase_uid=f"host_{i}", phone=f"+91999900000{i}", name=name,
                 gender=gender, verification_status="verified",
                 onboarding_completed=True,
                 role="admin" if i == 0 else "host",
                 personality_vector=pv,
                 home_lat=hlat, home_lng=hlng, home_area=area, travel_radius_km=15,
                 live_lat=hlat, live_lng=hlng, last_active_at=datetime.utcnow(), preferred_radius_km=20)
            for i, (name, gender, pv, hlat, hlng, area) in enumerate([
                ("Arjun Kumar", "male", [0.80, 0.70, 0.90, 0.75, 0.95], 13.3702, 77.6835, "Nandi Hills"),
                ("Meera Nair", "female", [0.60, 0.50, 0.85, 0.90, 0.80], 12.9716, 77.6411, "Indiranagar"),
                ("Vikram Rao", "male", [0.90, 0.85, 0.70, 0.60, 0.75], 12.9716, 77.5946, "Cubbon Park"),
                ("Deepa Menon", "female", [0.55, 0.60, 0.75, 0.85, 0.90], 12.9344, 77.6100, "Koramangala"),
                ("Rohan Shetty", "male", [0.75, 0.65, 0.60, 0.80, 0.85], 12.9121, 77.6446, "HSR Layout"),
            ])
        ]
        session.add_all(host_users)
        await session.flush()

        for user, (specialties, rating) in zip(host_users, [
            (["trekking", "photography"], 4.8),
            (["pottery", "painting"], 4.9),
            (["cycling", "fitness"], 4.6),
            (["yoga", "meditation"], 4.7),
            (["board_games", "cooking"], 4.6),
        ]):
            session.add(Host(user_id=user.id, specialties=specialties, rating_avg=rating,
                             background_verified=True, interview_completed=True, active=True))

        # ── Demo Users (20) ────────────────────────────────────────────────
        demo_users = [
            User(supabase_uid=f"demo_{i}", phone=f"+9198880000{i:02d}", name=name,
                 gender=gender, verification_status="verified",
                 onboarding_completed=True,
                 personality_vector=pv, interests=interests,
                 home_lat=hlat, home_lng=hlng, home_area=area,
                 travel_radius_km=15, preferred_radius_km=20,
                 live_lat=hlat, live_lng=hlng, last_active_at=datetime.utcnow(),
                 emergency_contact_name=ec_name, emergency_contact_phone=ec_phone)
            for i, (name, gender, pv, interests, hlat, hlng, area, ec_name, ec_phone) in enumerate([
                # ── Users near Devanahalli (for hyperlocal matching demo) ──
                ("Priya Sharma", "female", [0.72, 0.65, 0.70, 0.82, 0.78],
                 ["trekking", "photography", "pottery"], 13.2460, 77.7110, "Devanahalli", "Rahul Verma", "+919876500001"),
                ("Rahul Verma", "male", [0.70, 0.60, 0.65, 0.80, 0.75],
                 ["trekking", "cycling"], 13.2500, 77.7150, "Devanahalli", "Priya Sharma", "+919876500002"),
                # ── Users in central Bangalore (Indiranagar, Koramangala) ──
                ("Ananya Patel", "female", [0.75, 0.70, 0.80, 0.85, 0.70],
                 ["board_games", "painting"], 12.9344, 77.6100, "Koramangala", None, None),
                ("Karan Joshi", "male", [0.80, 0.75, 0.60, 0.65, 0.80],
                 ["cycling", "cooking"], 12.9121, 77.6446, "HSR Layout", None, None),
                ("Sneha Reddy", "female", [0.55, 0.50, 0.75, 0.80, 0.85],
                 ["yoga", "meditation"], 12.9716, 77.5946, "Cubbon Park", None, None),
                ("Aditya Gupta", "male", [0.85, 0.80, 0.70, 0.55, 0.60],
                 ["fitness", "cycling"], 12.9716, 77.6071, "MG Road", None, None),
                ("Riya Kapoor", "female", [0.60, 0.55, 0.85, 0.70, 0.75],
                 ["pottery", "photography"], 12.9716, 77.6411, "Indiranagar", None, None),
                ("Nikhil Mathur", "male", [0.78, 0.72, 0.68, 0.80, 0.82],
                 ["trekking", "photography"], 12.9063, 77.5857, "JP Nagar", None, None),
                ("Divya Sharma", "female", [0.65, 0.60, 0.72, 0.78, 0.80],
                 ["cooking", "board_games"], 12.9698, 77.7500, "Whitefield", None, None),
                ("Amit Singh", "male", [0.82, 0.78, 0.55, 0.60, 0.72],
                 ["fitness", "cycling"], 12.9716, 77.5946, "Cubbon Park", None, None),
                ("Neha Agarwal", "female", [0.58, 0.52, 0.80, 0.85, 0.78],
                 ["yoga", "painting"], 12.9121, 77.6446, "HSR Layout", None, None),
                ("Sandeep Kumar", "male", [0.76, 0.68, 0.62, 0.75, 0.85],
                 ["board_games", "photography"], 12.9344, 77.6100, "Koramangala", None, None),
                ("Manisha Das", "female", [0.70, 0.55, 0.78, 0.82, 0.72],
                 ["cooking", "trekking"], 12.9716, 77.6411, "Indiranagar", None, None),
                ("Vikash Patel", "male", [0.88, 0.75, 0.50, 0.60, 0.78],
                 ["running", "cycling"], 12.9716, 77.6071, "MG Road", None, None),
                ("Tanya Iyer", "female", [0.62, 0.68, 0.82, 0.75, 0.85],
                 ["painting", "yoga"], 13.0226, 77.5880, "Yelahanka", None, None),
                ("Rajesh Nair", "male", [0.72, 0.70, 0.60, 0.78, 0.80],
                 ["photography", "exploring"], 12.9063, 77.5857, "JP Nagar", None, None),
                ("Kavita Rao", "female", [0.58, 0.50, 0.72, 0.85, 0.78],
                 ["meditation", "reading"], 12.9121, 77.6446, "HSR Layout", None, None),
                ("Sunil Menon", "male", [0.82, 0.78, 0.65, 0.62, 0.75],
                 ["fitness", "trekking"], 12.9698, 77.7500, "Whitefield", None, None),
                ("Lakshmi K", "female", [0.68, 0.60, 0.80, 0.78, 0.82],
                 ["board_games", "volunteering"], 12.9344, 77.6100, "Koramangala", None, None),
                ("Gaurav Bhat", "male", [0.78, 0.72, 0.58, 0.70, 0.85],
                 ["cooking", "photography"], 12.9716, 77.6411, "Indiranagar", None, None),
            ])
        ]
        session.add_all(demo_users)
        await session.flush()

        # ── Venues ──────────────────────────────────────────────────────────
        venues = [
            Venue(name="Devanahalli Fort", area="Devanahalli", lat=13.2460, lng=77.7110,
                  venue_type="historical", city="Bangalore", wander_verified=True),
            Venue(name="Nandi Hills Trailhead", area="Nandi Hills", lat=13.3702, lng=77.6835,
                  venue_type="outdoor", city="Bangalore", wander_verified=True),
            Venue(name="Cubbon Park Bandstand", area="Cubbon Park", lat=12.9716, lng=77.5946,
                  venue_type="park", city="Bangalore", wander_verified=True),
            Venue(name="Lahe Lahe", area="Indiranagar", lat=12.9716, lng=77.6411,
                  venue_type="creative_space", city="Bangalore", wander_verified=True),
            Venue(name="Rangoli Metro Art Center", area="MG Road", lat=12.9716, lng=77.6071,
                  venue_type="art_center", city="Bangalore", wander_verified=True),
            Venue(name="Yelahanka Lake", area="Yelahanka", lat=13.1000, lng=77.5960,
                  venue_type="lake", city="Bangalore", wander_verified=True),
            Venue(name="Hebbal Lake", area="Hebbal", lat=13.0358, lng=77.5970,
                  venue_type="lake", city="Bangalore", wander_verified=True),
            Venue(name="JP Nagar Park", area="JP Nagar", lat=12.9063, lng=77.5857,
                  venue_type="park", city="Bangalore", wander_verified=True),
            Venue(name="Whitefield Community Hall", area="Whitefield", lat=12.9698, lng=77.7500,
                  venue_type="indoor", city="Bangalore", wander_verified=True),
            Venue(name="Electronic City Phase 1", area="Electronic City", lat=12.8456, lng=77.6603,
                  venue_type="outdoor", city="Bangalore", wander_verified=True),
        ]
        session.add_all(venues)
        await session.flush()

        # ── Activities — 30+ across all distance bands from Devanahalli ─────
        # Reference point: Devanahalli (13.2453, 77.7104)
        # Walking (< 2km), Nearby (2-10), Within Radius (10-20), Reachable (20-30), Far (30+)

        activities = [
            # ═══════════════════════════════════════════════════════════════
            # BAND 1: WALKING DISTANCE (< 2km from Devanahalli)
            # ═══════════════════════════════════════════════════════════════
            Activity(title="Devanahalli Fort Heritage Walk",
                     description="Explore the historic fort where Tipu Sultan was born. 30-min guided walk.",
                     category="explore", area="Devanahalli",
                     lat=13.2460, lng=77.7110, venue_id=venues[0].id,
                     scheduled_at=datetime.utcnow() + timedelta(days=1, hours=7),
                     group_size_min=4, group_size_max=8, max_groups=2,
                     host_ids=[host_users[0].id], status="open"),
            Activity(title="Morning Chai at Devanahalli Local",
                     description="Filter coffee and fresh vada at the famous local tapri. Hyperlocal vibes.",
                     category="slow", area="Devanahalli",
                     lat=13.2475, lng=77.7120,
                     scheduled_at=datetime.utcnow() + timedelta(days=2, hours=6),
                     group_size_min=3, group_size_max=6, max_groups=1,
                     host_ids=[host_users[1].id], status="open"),
            Activity(title="Devanahalli Ranganatha Temple Visit",
                     description="Peaceful temple visit with history walk around the village.",
                     category="slow", area="Devanahalli",
                     lat=13.2440, lng=77.7090,
                     scheduled_at=datetime.utcnow() + timedelta(days=3, hours=8),
                     group_size_min=3, group_size_max=8, max_groups=2,
                     host_ids=[host_users[0].id], status="open"),
            Activity(title="Sunrise Walk — Devanahalli Farms",
                     description="Walk through organic farms on the outskirts of Devanahalli. Fresh air, fresh produce.",
                     category="physical", area="Devanahalli",
                     lat=13.2510, lng=77.7200,
                     scheduled_at=datetime.utcnow() + timedelta(days=4, hours=5, minutes=30),
                     group_size_min=4, group_size_max=10, max_groups=2,
                     host_ids=[host_users[2].id], phone_free_encouraged=True, status="open"),

            # ═══════════════════════════════════════════════════════════════
            # BAND 2: NEARBY (2–10 km from Devanahalli)
            # ═══════════════════════════════════════════════════════════════
            Activity(title="Nandi Hills Sunrise Trek",
                     description="Hike to the top for a magical sunrise. 3 km trek, moderate difficulty.",
                     category="physical", area="Nandi Hills",
                     lat=13.3702, lng=77.6835, venue_id=venues[1].id,
                     scheduled_at=datetime.utcnow() + timedelta(days=3),
                     group_size_min=4, group_size_max=8, max_groups=2,
                     host_ids=[host_users[0].id], phone_free_encouraged=True, status="open",
                     tags=["trekking", "outdoors", "sunrise", "nature", "hiking"]),
            Activity(title="Birdwatching at Yelahanka Lake",
                     description="Spot migratory birds with binoculars and an expert naturalist.",
                     category="explore", area="Yelahanka",
                     lat=13.1000, lng=77.5960, venue_id=venues[5].id,
                     scheduled_at=datetime.utcnow() + timedelta(days=5, hours=6),
                     group_size_min=3, group_size_max=6, max_groups=1,
                     host_ids=[host_users[1].id], status="open",
                     tags=["birdwatching", "nature", "outdoors", "lake", "exploring"]),
            Activity(title="Cycling to Nandi Hills Base",
                     description="20 km cycle from Devanahalli to Nandi Hills base. Moderate pace, scenic route.",
                     category="physical", area="Nandi Hills",
                     lat=13.3200, lng=77.6900,
                     scheduled_at=datetime.utcnow() + timedelta(days=6, hours=5),
                     group_size_min=4, group_size_max=8, max_groups=2,
                     host_ids=[host_users[2].id], status="open",
                     tags=["cycling", "fitness", "outdoors", "scenic", "sports"]),
            Activity(title="Ranganatha Temple Yelahanka Visit",
                     description="500-year-old temple architecture + guided spiritual walk.",
                     category="mental", area="Yelahanka",
                     lat=13.1000, lng=77.5960,
                     scheduled_at=datetime.utcnow() + timedelta(days=7, hours=9),
                     group_size_min=3, group_size_max=6, max_groups=1,
                     host_ids=[host_users[3].id], status="open",
                     tags=["temple", "heritage", "spiritual", "walking", "architecture"]),

            # ═══════════════════════════════════════════════════════════════
            # BAND 3: WITHIN YOUR RADIUS (10–20 km from Devanahalli)
            # ═══════════════════════════════════════════════════════════════
            Activity(title="Hebbal Lake Cleanup & Walk",
                     description="Community lake cleanup followed by a 2 km walking meditation.",
                     category="social_good", area="Hebbal",
                     lat=13.0358, lng=77.5970, venue_id=venues[6].id,
                     scheduled_at=datetime.utcnow() + timedelta(days=2, hours=7),
                     group_size_min=6, group_size_max=12, max_groups=3,
                     host_ids=[host_users[0].id], status="open",
                     tags=["volunteering", "environment", "lake", "walking", "social_good"]),
            Activity(title="Pottery Workshop — Yelahanka",
                     description="Learn wheel pottery from a local artisan. Take your creation home!",
                     category="skill", area="Yelahanka",
                     lat=13.0226, lng=77.5880,
                     scheduled_at=datetime.utcnow() + timedelta(days=4, hours=10),
                     group_size_min=4, group_size_max=6, max_groups=2,
                     host_ids=[host_users[1].id], status="open",
                     tags=["pottery", "creativity", "art", "hands-on", "learning"]),
            Activity(title="Sunday Morning Yoga — Hebbal",
                     description="Vinyasa flow by the lake. All levels welcome.",
                     category="slow", area="Hebbal",
                     lat=13.0358, lng=77.5970,
                     scheduled_at=datetime.utcnow() + timedelta(days=1, hours=6),
                     group_size_min=4, group_size_max=10, max_groups=2,
                     host_ids=[host_users[3].id], status="open",
                     tags=["yoga", "meditation", "wellness", "morning", "outdoors"]),

            # ═══════════════════════════════════════════════════════════════
            # BAND 4: REACHABLE (20–30 km from Devanahalli)
            # ═══════════════════════════════════════════════════════════════
            Activity(title="Pottery + Chai at Lahe Lahe",
                     description="Get your hands dirty with clay. Throwing, trimming, glazing.",
                     category="skill", area="Indiranagar",
                     lat=12.9716, lng=77.6411, venue_id=venues[3].id,
                     scheduled_at=datetime.utcnow() + timedelta(days=2),
                     group_size_min=4, group_size_max=6, max_groups=2,
                     host_ids=[host_users[1].id], status="open",
                     tags=["pottery", "creativity", "art", "chai", "hands-on"]),
            Activity(title="Cubbon Park Cleanup Drive",
                     description="Clean the park, meet good people. Gloves and bags provided.",
                     category="social_good", area="Cubbon Park",
                     lat=12.9716, lng=77.5946, venue_id=venues[2].id,
                     scheduled_at=datetime.utcnow() + timedelta(days=4),
                     group_size_min=6, group_size_max=12, max_groups=3,
                     host_ids=[host_users[2].id], status="open",
                     tags=["volunteering", "outdoors", "environment", "social_good", "park"]),
            Activity(title="Board Game Night — Indiranagar",
                     description="Settlers of Catan, Coup, Secret Hitler. Chai and cookies provided.",
                     category="mental", area="Indiranagar",
                     lat=12.9716, lng=77.6411,
                     scheduled_at=datetime.utcnow() + timedelta(days=5, hours=18),
                     group_size_min=4, group_size_max=6, max_groups=2,
                     host_ids=[host_users[4].id], status="open",
                     tags=["board_games", "strategy", "social", "indoor", "gaming"]),
            Activity(title="Koramangala Food Walk",
                     description="4 street food stops, 1 happy group. From dosa to dessert.",
                     category="explore", area="Koramangala",
                     lat=12.9344, lng=77.6100,
                     scheduled_at=datetime.utcnow() + timedelta(days=6, hours=17),
                     group_size_min=4, group_size_max=8, max_groups=2,
                     host_ids=[host_users[0].id], status="open",
                     tags=["food", "exploring", "street_food", "walking", "social"]),
            Activity(title="Slow Reading Club — JP Nagar",
                     description="Bring a book. Read in silence for 45 min. Discuss over filter coffee.",
                     category="slow", area="JP Nagar",
                     lat=12.9063, lng=77.5857,
                     scheduled_at=datetime.utcnow() + timedelta(days=3, hours=16),
                     group_size_min=4, group_size_max=6, max_groups=1,
                     host_ids=[host_users[1].id], status="open",
                     tags=["reading", "books", "discussion", "coffee", "slow", "learning"]),
            Activity(title="Lalbagh Heritage Walk",
                     description="Botanical garden tour with a historian. 200-year-old trees + rare species.",
                     category="explore", area="JP Nagar",
                     lat=12.9063, lng=77.5857,
                     scheduled_at=datetime.utcnow() + timedelta(days=4, hours=7),
                     group_size_min=6, group_size_max=10, max_groups=2,
                     host_ids=[host_users[0].id], status="open",
                      tags=["heritage", "walking", "history", "outdoors", "exploring"]),

            # ═══════════════════════════════════════════════════════════════
            # BAND 5: FARTHER AWAY (30+ km from Devanahalli)
            # ═══════════════════════════════════════════════════════════════
            Activity(title="Evening Cycling — Outer Ring Road",
                     description="18 km ride along the ORR service road. Moderate pace, sunset views.",
                     category="physical", area="Whitefield",
                     lat=12.9698, lng=77.7500,
                     scheduled_at=datetime.utcnow() + timedelta(days=2, hours=16),
                     group_size_min=4, group_size_max=8, max_groups=2,
                     host_ids=[host_users[2].id], status="open",
                     tags=["cycling", "fitness", "outdoors", "evening", "sports"]),
            Activity(title="Dumbbell + Brunch — HSR Layout",
                     description="30 min HIIT. Then unlimited dosas. Fitness + feast.",
                     category="physical", area="HSR Layout",
                     lat=12.9121, lng=77.6446,
                     scheduled_at=datetime.utcnow() + timedelta(days=7, hours=8),
                     group_size_min=4, group_size_max=8, max_groups=2,
                     host_ids=[host_users[2].id], status="open",
                     tags=["fitness", "workout", "food", "brunch", "strength"]),
            Activity(title="Mindfulness + Meditation — HSR Layout",
                     description="Guided meditation, breathwork, and journaling. Quiet your mind.",
                     category="mental", area="HSR Layout",
                     lat=12.9121, lng=77.6446,
                     scheduled_at=datetime.utcnow() + timedelta(days=3, hours=7),
                     group_size_min=4, group_size_max=6, max_groups=2,
                     host_ids=[host_users[3].id], status="open",
                     tags=["meditation", "mindfulness", "journaling", "wellness", "mental_health"]),
            Activity(title="Wall Art + Mural Painting — HSR",
                     description="Beautify a community wall together. All art supplies provided.",
                     category="social_good", area="HSR Layout",
                     lat=12.9121, lng=77.6446,
                     scheduled_at=datetime.utcnow() + timedelta(days=5, hours=9),
                     group_size_min=4, group_size_max=8, max_groups=2,
                     host_ids=[host_users[1].id], status="open",
                     tags=["painting", "creativity", "art", "outdoors", "community"]),
            Activity(title="Tech Meetup — Electronic City",
                     description="Casual tech talk + networking. AI, startups, and snacks.",
                     category="skill", area="Electronic City",
                     lat=12.8456, lng=77.6603, venue_id=venues[9].id,
                     scheduled_at=datetime.utcnow() + timedelta(days=8, hours=18),
                     group_size_min=4, group_size_max=8, max_groups=2,
                     host_ids=[host_users[4].id], status="open",
                     tags=["tech", "networking", "learning", "social", "indoor"]),
            Activity(title="Electronic City Lake Walk",
                     description="Evening walk around the lake with fellow wanderers. Binoculars provided.",
                     category="slow", area="Electronic City",
                     lat=12.8456, lng=77.6603,
                     scheduled_at=datetime.utcnow() + timedelta(days=9, hours=17),
                     group_size_min=4, group_size_max=8, max_groups=2,
                     host_ids=[host_users[0].id], status="open",
                     tags=["walking", "lake", "outdoors", "evening", "social"]),
        ]
        session.add_all(activities)
        await session.flush()

        # ── Past completed groups for Wander Report ──────────────────────────
        past_activities = [
            Activity(title="Trek to Savandurga", description="Asia's largest monolith trek.",
                     category="physical", area="Savandurga", city="Bangalore",
                     scheduled_at=datetime.utcnow() - timedelta(days=30), status="completed"),
            Activity(title="Board Games Meetup", description="Strategy games evening.",
                     category="mental", area="Indiranagar", city="Bangalore",
                     scheduled_at=datetime.utcnow() - timedelta(days=60), status="completed"),
            Activity(title="Ulsoor Lake Cleanup", description="Community clean-up.",
                     category="social_good", area="MG Road", city="Bangalore",
                     scheduled_at=datetime.utcnow() - timedelta(days=90), status="completed"),
        ]
        session.add_all(past_activities)
        await session.flush()

        for pa in past_activities:
            group = Group(activity_id=pa.id, host_id=host_users[0].id,
                         match_score=0.88, no_show_risk=0.10, status="completed",
                         chat_opens_at=pa.scheduled_at - timedelta(days=3),
                         chat_expires_at=pa.scheduled_at + timedelta(days=4))
            session.add(group)
            await session.flush()
            for demo_user in demo_users[:4]:
                session.add(GroupMember(group_id=group.id, user_id=demo_user.id, checked_in=True, rating=5))

        # Set report stats for Priya (first demo user)
        priya = demo_users[0]

        # Create 5 interest-based communities
        community_data = [
            ("Weekend Trekkers", ["trekking", "hiking", "outdoors", "nature"],
             "A community of trail enthusiasts exploring Bangalore's best treks every weekend.",
             "Pack your own water. No plastic. Leave no trace.", host_users[0].id),
            ("Board Game Geeks", ["board_games", "strategy", "gaming", "social"],
             "Settlers of Catan, Coup, Azul — every Tuesday & Friday. Beginners welcome.",
             "No spoilers. No rage quits. Respect the game host.", host_users[4].id),
            ("Yoga & Mindfulness Circle", ["yoga", "meditation", "wellness", "mindfulness"],
             "Sunday morning yoga under the banyan tree. Guided meditation. Journaling.",
             "Arrive 5 minutes early. Silence your phone. Listen to your body.", host_users[3].id),
            ("Street Food Explorers", ["food", "exploring", "street_food", "walking"],
             "4 stops. 1 happy group. Discover hidden gems across Bangalore's food streets.",
             "Let the group decide the route. Respect dietary restrictions.", host_users[0].id),
            ("Photography Walk Club", ["photography", "walking", "street_photography", "creativity"],
             "Capture Old Bangalore through your lens. Monthly themes. No fancy gear needed.",
             "Ask before photographing people. Share your best shot in the group.", host_users[0].id),
        ]

        for name, tags, desc, rules, host_id in community_data:
            comm = Group(
                group_type="community",
                name=name,
                interest_tags=tags,
                description=desc,
                rules=rules,
                member_limit=100,
                status="active",
                host_id=host_id,
            )
            session.add(comm)
            await session.flush()

            # Add host as founder
            session.add(GroupMember(group_id=comm.id, user_id=host_id, role="founder"))

            # Add 3-5 demo users to each community
            import random
            member_count = random.randint(3, 5)
            for demo_user in random.sample(demo_users, min(member_count, len(demo_users))):
                if demo_user.id != host_id:
                    session.add(GroupMember(group_id=comm.id, user_id=demo_user.id, role="member"))

        priya.total_experiences = 12
        priya.total_people_met = 47
        priya.total_neighborhoods_explored = 8
        priya.streak_weeks = 4
        priya.screen_time_before = 300
        priya.screen_time_after = 180

        # Seed friend connection: Priya + Rahul are pre-connected (demo setup)
        rahul = demo_users[1]
        session.add(FriendConnection(
            user_id=priya.id,
            friend_id=rahul.id,
            status="accepted",
            compatibility_score=0.92,
        ))

        await session.commit()
        print("Seed data created successfully!")
        print("  - 5 hosts, 20 demo users")
        print("  - 10 venues")
        print(f"  - {len(activities)} activities across 5 distance bands (Walking to Far)")


if __name__ == "__main__":
    asyncio.run(seed())
