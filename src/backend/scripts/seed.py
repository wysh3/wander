import asyncio
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.models import User, Host, Activity, Group, GroupMember, Venue
from app.config import get_settings

settings = get_settings()


async def seed():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Create 5 Wander Hosts
        host_users = [
            User(supabase_uid=f"host_{i}", phone=f"+91999900000{i}", name=name,
                 gender=gender, verification_status="verified",
                 onboarding_completed=True,
                 personality_vector=pv,
                 home_lat=hlat, home_lng=hlng, home_area=area, travel_radius_km=15)
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

        # Create 20 demo users with personality vectors
        demo_users = [
            User(supabase_uid=f"demo_{i}", phone=f"+9198880000{i:02d}", name=name,
                 gender=gender, verification_status="verified",
                 onboarding_completed=True,
                 personality_vector=pv, interests=interests,
                 home_lat=hlat, home_lng=hlng, home_area=area,
                 travel_radius_km=15,
                 emergency_contact_name=ec_name, emergency_contact_phone=ec_phone)
            for i, (name, gender, pv, interests, hlat, hlng, area, ec_name, ec_phone) in enumerate([
                ("Priya Sharma", "female", [0.72, 0.65, 0.70, 0.82, 0.78],
                 ["trekking", "photography", "pottery"], 12.9716, 77.5946, "Cubbon Park", "Rahul Verma", "+919876500001"),
                ("Rahul Verma", "male", [0.70, 0.60, 0.65, 0.80, 0.75],
                 ["trekking", "cycling"], 12.9716, 77.6411, "Indiranagar", "Priya Sharma", "+919876500002"),
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

        # Create venues
        venues = [
            Venue(name="Nandi Hills Trailhead", area="Nandi Hills", lat=13.3702, lng=77.6835,
                  venue_type="outdoor", city="Bangalore", wander_verified=True),
            Venue(name="Cubbon Park Bandstand", area="Cubbon Park", lat=12.9716, lng=77.5946,
                  venue_type="park", city="Bangalore", wander_verified=True),
            Venue(name="Lahe Lahe", area="Indiranagar", lat=12.9716, lng=77.6411,
                  venue_type="creative_space", city="Bangalore", wander_verified=True),
            Venue(name="Rangoli Metro Art Center", area="MG Road", lat=12.9716, lng=77.6071,
                  venue_type="art_center", city="Bangalore", wander_verified=True),
        ]
        session.add_all(venues)
        await session.flush()

        # Create 15 activities across 7 categories
        activities = [
            Activity(title="Nandi Hills Sunrise Trek", description="Hike to the top for a magical sunrise.",
                     category="physical", area="Nandi Hills", lat=13.3702, lng=77.6835,
                     scheduled_at=datetime.utcnow() + timedelta(days=3), venue_id=venues[0].id,
                     group_size_min=4, group_size_max=8, max_groups=2,
                     host_ids=[host_users[0].id], phone_free_encouraged=True, status="open",
                     tags=["trekking", "outdoors", "sunrise", "nature", "hiking"]),
            Activity(title="Pottery + Chai at Lahe Lahe", description="Get your hands dirty with clay.",
                     category="skill", area="Indiranagar", lat=12.9716, lng=77.6411,
                     scheduled_at=datetime.utcnow() + timedelta(days=2), venue_id=venues[2].id,
                     group_size_min=4, group_size_max=6, max_groups=2,
                     host_ids=[host_users[1].id], status="open",
                     tags=["pottery", "creativity", "art", "chai", "hands-on"]),
            Activity(title="Cubbon Park Cleanup Drive", description="Clean the park, meet good people.",
                     category="social_good", area="Cubbon Park", lat=12.9716, lng=77.5946,
                     scheduled_at=datetime.utcnow() + timedelta(days=4), venue_id=venues[1].id,
                     group_size_min=6, group_size_max=12, max_groups=3,
                     host_ids=[host_users[2].id], status="open",
                     tags=["volunteering", "outdoors", "environment", "social_good", "park"]),
            Activity(title="Board Game Night", description="Settlers of Catan, Coup, and chai.",
                     category="mental", area="Indiranagar",
                     scheduled_at=datetime.utcnow() + timedelta(days=5),
                     group_size_min=4, group_size_max=6, max_groups=2,
                     host_ids=[host_users[4].id], status="open",
                     tags=["board_games", "strategy", "social", "indoor", "gaming"]),
            Activity(title="Sunday Morning Yoga", description="Hatha yoga under a banyan tree.",
                     category="slow", area="Cubbon Park", lat=12.9716, lng=77.5946,
                     scheduled_at=datetime.utcnow() + timedelta(days=1), venue_id=venues[1].id,
                     group_size_min=4, group_size_max=8, max_groups=2,
                     host_ids=[host_users[3].id], status="open",
                     tags=["yoga", "meditation", "wellness", "morning", "outdoors"]),
            Activity(title="Koramangala Food Walk", description="4 street food stops, 1 happy group.",
                     category="explore", area="Koramangala",
                     scheduled_at=datetime.utcnow() + timedelta(days=6),
                     group_size_min=4, group_size_max=8, max_groups=2,
                     host_ids=[host_users[0].id], status="open",
                     tags=["food", "exploring", "street_food", "walking", "social"]),
            Activity(title="Midnight Chaos Bowling", description="Bowling at 11 PM. No rules, just fun.",
                     category="chaotic", area="MG Road",
                     scheduled_at=datetime.utcnow() + timedelta(days=7),
                     group_size_min=4, group_size_max=6, max_groups=2,
                     host_ids=[host_users[2].id], status="open",
                     tags=["bowling", "night", "social", "indoor", "fun"]),
            Activity(title="Slow Reading Club", description="Bring a book. Read. Discuss over filter coffee.",
                     category="slow", area="JP Nagar",
                     scheduled_at=datetime.utcnow() + timedelta(days=3),
                     group_size_min=4, group_size_max=6, max_groups=1,
                     host_ids=[host_users[1].id], status="open",
                     tags=["reading", "books", "discussion", "coffee", "slow", "learning"]),
            Activity(title="Lalbagh Heritage Walk", description="Botanical garden tour with historian.",
                     category="explore", area="JP Nagar",
                     scheduled_at=datetime.utcnow() + timedelta(days=4),
                     group_size_min=6, group_size_max=10, max_groups=2,
                     host_ids=[host_users[0].id], status="open",
                     tags=["heritage", "walking", "history", "outdoors", "exploring"]),
            Activity(title="Evening Cycling — Outer Ring", description="15km ride, moderate pace.",
                     category="physical", area="Whitefield",
                     scheduled_at=datetime.utcnow() + timedelta(days=2),
                     group_size_min=4, group_size_max=8, max_groups=2,
                     host_ids=[host_users[2].id], status="open",
                     tags=["cycling", "fitness", "outdoors", "evening", "sports"]),
            Activity(title="Wall Art + Mural Painting", description="Beautify a community wall together.",
                     category="social_good", area="HSR Layout",
                     scheduled_at=datetime.utcnow() + timedelta(days=5),
                     group_size_min=4, group_size_max=8, max_groups=2,
                     host_ids=[host_users[1].id], status="open",
                     tags=["painting", "creativity", "art", "outdoors", "community"]),
            Activity(title="Photography Walk — Chickpet", description="Street photography in Old Bangalore.",
                     category="skill", area="MG Road",
                     scheduled_at=datetime.utcnow() + timedelta(days=6),
                     group_size_min=4, group_size_max=6, max_groups=1,
                     host_ids=[host_users[0].id], status="open",
                     tags=["photography", "walking", "street_photography", "creativity", "exploring"]),
            Activity(title="Dumbbell + Brunch", description="30 min HIIT. Then unlimited dosas.",
                     category="physical", area="HSR Layout",
                     scheduled_at=datetime.utcnow() + timedelta(days=7),
                     group_size_min=4, group_size_max=8, max_groups=2,
                     host_ids=[host_users[2].id], status="open",
                     tags=["fitness", "workout", "food", "brunch", "strength"]),
            Activity(title="Mindfulness + Meditation", description="Guided meditation and journaling.",
                     category="mental", area="Yelahanka",
                     scheduled_at=datetime.utcnow() + timedelta(days=3),
                     group_size_min=4, group_size_max=6, max_groups=2,
                     host_ids=[host_users[3].id], status="open",
                     tags=["meditation", "mindfulness", "journaling", "wellness", "mental_health"]),
            Activity(title="Saree + Filter Coffee Walk", description="Wear a saree, walk, drink coffee.",
                     category="chaotic", area="Indiranagar",
                     scheduled_at=datetime.utcnow() + timedelta(days=8),
                     group_size_min=6, group_size_max=10, max_groups=2, women_only=True,
                     host_ids=[host_users[1].id], status="open",
                     tags=["walking", "social", "coffee", "fashion", "culture"]),
        ]
        session.add_all(activities)
        await session.flush()

        # Create 3 past completed groups for Wander Report data
        past_activities = [
            Activity(title="Trek to Savandurga", description="Asia's largest monolith.",
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

        # Set report stats for Priya
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

        await session.commit()
        print("Seed data created successfully!")


if __name__ == "__main__":
    asyncio.run(seed())
