# Wander — Production Implementation Plan

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Design Solution](#design-solution)
3. [System Architecture](#system-architecture)
4. [Project Structure](#project-structure)
5. [Database Schema](#database-schema)
6. [API Reference](#api-reference)
7. [AI Matching Engine](#ai-matching-engine)
8. [Component Design](#component-design)
9. [State Management](#state-management)
10. [Error Handling](#error-handling)
11. [Demo Flow](#demo-flow)
12. [Pitch Deck](#pitch-deck)
13. [Implementation Strategy](#implementation-strategy)
14. [Testing Strategy](#testing-strategy)
15. [Dependencies & Sequencing](#dependencies--sequencing)
16. [Trade-offs & Architectural Decisions](#trade-offs--architectural-decisions)
17. [Potential Challenges & Mitigations](#potential-challenges--mitigations)
18. [Enhanced Feature: Interest-Based Community Groups](#enhanced-feature-interest-based-community-groups)
19. [Enhanced Feature: Local Event Recommendations](#enhanced-feature-local-event-recommendations)
20. [Enhanced Feature: AI-Based Friend Matching](#enhanced-feature-ai-based-friend-matching)

---

## Problem Statement

> **Hackathon Domain: AI for Social Impact — Mental Health & Loneliness**

The most connected generation in history is the loneliest. The average Indian between 18-30 spends 7+ hours daily on a screen. Friend groups have become WhatsApp chats. Hanging out has become sharing reels.

**Key stats:**
- Bangalore: 37% lonely most of the time (national average: 22%), ~50% of 18-24 year olds
- India: #1 globally in mobile usage — 1.12 trillion hours in 2024
- Social media addiction → 4.4x higher odds of loneliness (bidirectional causation, Zhang et al. 2024)
- Existing solutions fail: Meetup (1.2/5 stars, predatory billing), Bumble BFF (CEO admitted swipe format fails)

**Core insight:** We don't have a technology problem. We have a belonging problem.

**Why this is an AI problem:** Loneliness isn't solved by putting random people together — bad group chemistry makes it worse. Wander uses AI at every layer: LLM-driven personality extraction, combinatorial optimization for group matching (CP-SAT solver with 6 constraint dimensions), and behavioral analytics for the de-addiction Wander Report. The AI doesn't just enhance the product — it *is* the product. Without it, you have a meetup board. With it, you have an intelligent system that manufactures belonging.

---

## Design Solution

Wander is a platform that takes strangers from the same city, places them into AI-optimized small groups, gives them a real activity to do together — and lets the rest happen naturally.

### Core Differentiators

| Dimension | Wander | Existing Solutions |
|---|---|---|
| Matching | AI combinatorial optimization (6 constraints) | Manual RSVP or swipe-based |
| Identity | Government-verified (DigiLocker / Aadhaar e-KYC) | Self-reported or none |
| Safety | SOS under 3 seconds, Wander Hosts, women-only groups, full audit trail | Policy pages, no technology |
| De-addiction | No feed, no infinite scroll, ephemeral chat, Wander Report | Designed for maximum engagement |
| Format | Activity-first groups of 4-8 | Event directory or 1:1 swipe |
| Chat | Ephemeral (2-3 days pre-activity, 3-4 days post, auto-deletes) | Permanent, notification-heavy |

### Modules

| Module | Description |
|---|---|
| DigiLocker / Aadhaar verification | Government identity proof via OAuth. No camera. No OCR. Verified name, DOB, gender. |
| AI Chat onboarding | LLM conversation extracts personality vector (5D), interests, and vibe. Structured JSON output via function calling. |
| Activity discovery | Card-based feed with category filters and Google Maps locations. PWA-installable, mobile-first. |
| AI matching engine | CP-SAT solver with simulated annealing fallback. 6 constraint dimensions. Weighted cosine similarity via pgvector. |
| Group chat | Opens 2-3 days before activity. Persists 3-4 days after. Live countdown timer. Redis TTL auto-deletion. |
| SOS emergency system | 2-second hold → WebSocket alert + SMS fallback. GPS + group info + nearest police station. Under 3 seconds. |
| Wander Report | Auto-generated visual: experiences, people met, neighborhoods explored, screen time delta. Shareable. |
| Wander Host dashboard | Assigned experiences, group details, safety tools, member profiles. |
| Activity logging | All groups logged with audit trail: who, where, when. GDPR-ready deletion endpoint. |

### Scope Exclusions


- Complete venue management (seeded venue data)
- User-created activities (15-20 seeded Bangalore activities)
- Push notifications (Web Push API for reminder only in demo; friend requests use in-app Toaster)
- Video/voice calling
- Community content posts / feed (for demo: community chat only)
- Real-time friend request push notifications (polling OK for demo via react-query)
- External event integration (Meetup, Eventbrite) — beyond hackathon scope
- Recommendation engine ML training or A/B testing — static multi-factor scoring for demo
- Friend matching collaborative filtering from interaction data — needs training data
- pgvector IVFFlat index creation (demo with 20 users uses exact KNN `<=>` scan; index for production)

---

## System Architecture

### Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Framer Motion | RSC, server components, mobile-first responsive, professional UI components |
| Frontend deps | react-query, zustand, react-hook-form, zod | Server state caching, client state, form validation |
| Backend | FastAPI (Python 3.11+) + SQLAlchemy 2.0 (async) + Alembic | Async ORM, migrations, auto-docs |
| Backend deps | pydantic-settings, structlog, httpx | Config management, structured logging, HTTP client |
| Auth | Supabase Auth (phone OTP) | Same platform as DB, zero extra vendor, Row Level Security |
| AI | OR-Tools CP-SAT, scikit-learn, OpenAI/Anthropic API | Combinatorial solver, vector operations, LLM onboarding |
| Identity | DigiLocker / Aadhaar e-KYC (mocked for demo) | Government-verified, no camera fragility |
| Database | PostgreSQL + pgvector | Relational data + cosine similarity on personality vectors |
| Real-time | FastAPI WebSockets + Redis | Chat messages (TTL), SOS alerts, location sharing, session cache |
| Maps | Google Maps API (Distance Matrix, Geocoding, Places) | Accurate travel time and venue data |
| PWA | manifest.json + service worker | Installable, offline shell, native feel |
| Testing | pytest (backend) + vitest (frontend) | Full coverage across stack |
| CI/CD | GitHub Actions | Lint → typecheck → test → build on PR |
| Deploy | Vercel (frontend) + Railway (backend) + Supabase (Postgres + Redis) | Serverless frontend, scalable backend |

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                      FRONTEND                              │
│         Next.js 14 App Router + shadcn/ui                  │
│                                                             │
│  /signup        /onboarding       /activities               │
│  /activities/[id]/matching        /groups/[id]/chat         │
│  /report        /sos              /host/dashboard           │
│                                                             │
│  react-query (server state)  ·  zustand (client state)      │
│  zod (validation)  ·  WebSocket hooks (real-time)           │
│  PWA: manifest.json + service worker + install prompt       │
│  Mobile-first: bottom tab bar / desktop: sidebar            │
└──────────────────────┬───────────────────────────────────┘
                       │ HTTPS + WSS (JWT token)
┌──────────────────────┴───────────────────────────────────┐
│                      BACKEND                                │
│               FastAPI + SQLAlchemy 2.0 (async)              │
│                                                             │
│  /api/v1/  →  api/v1/*.py  (route handlers)                │
│  services/ →  matching/engine.py, onboarding.py, chat.py    │
│               sos.py, report.py                             │
│  models/  →  SQLAlchemy ORM  (user, activity, group, ...)   │
│  schemas/ →  Pydantic request/response                     │
│  core/    →  security.py, exceptions.py, logging.py         │
│  db/      →  session.py (async), redis.py                   │
│                                                             │
│  Error:  { error: { code, message, details } }              │
│  Pagination: cursor-based (cursor, limit, next_cursor)      │
│  Rate limiting: X-RateLimit-* headers                       │
└──────────────────────┬───────────────────────────────────┘
                       │
┌──────────────────────┴───────────────────────────────────┐
│                    DATA LAYER                                │
│                                                             │
│  PostgreSQL + pgvector                                      │
│  ├── users (personality_vector VECTOR(5))                   │
│  ├── activities, groups, group_members                      │
│  ├── chat_messages (with expires_at + cleanup)              │
│  ├── sos_events, hosts, venues, user_history                │
│  └── Indexes on high-frequency query columns                │
│                                                             │
│  Redis                                                      │
│  ├── chat:{group_id}:messages  (Sorted Set, TTL)            │
│  ├── chat:{group_id}:meta      (Hash, TTL)                  │
│  ├── ws:user:{id}  /  ws:group:{id}  (connection tracking)  │
│  ├── sos:{sos_id}:status       (Hash, ephemeral)            │
│  ├── location:{group_id}:{user}  (Hash, short TTL)          │
│  └── ratelimit:{user}:{endpoint} (Counter, short TTL)       │
│                                                             │
│  External APIs                                              │
│  ├── Supabase Auth (phone OTP)                              │
│  ├── Google Maps (Distance Matrix, Geocoding, Places)       │
│  ├── OpenAI / Anthropic (LLM onboarding)                    │
│  └── Twilio (SMS fallback for SOS alerts)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Structure

### Backend

```
backend/
├── alembic/
│   ├── versions/              # Migration files
│   └── env.py                 # Async Alembic config
├── alembic.ini
├── app/
│   ├── __init__.py
│   ├── main.py                # create_app(), lifespan, CORS, middleware
│   ├── config.py              # pydantic-settings (env vars)
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py            # get_db, get_current_user, get_redis
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py      # v1 router aggregation
│   │       ├── auth.py        # send-otp, verify-otp, refresh
│   │       ├── users.py       # profile, onboarding, verification
│   │       ├── activities.py  # CRUD, join, discover
│   │       ├── matching.py    # trigger, status, results
│   │       ├── groups.py      # group details, members, ratings
│   │       ├── chat.py        # REST history + ws/chat WebSocket
│   │       ├── sos.py         # trigger, cancel + ws/sos WebSocket
│   │       ├── reports.py     # report JSON + PDF
│   │       └── admin.py       # SOS log, verifications, audit
│   ├── core/
│   │   ├── __init__.py
│   │   ├── security.py        # JWT encode/decode, OTP generation
│   │   ├── exceptions.py      # AppException, error codes
│   │   └── logging.py         # structlog config + middleware
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py            # User ORM
│   │   ├── activity.py        # Activity ORM
│   │   ├── group.py           # Group + GroupMember ORM
│   │   ├── chat_message.py    # ChatMessage ORM
│   │   ├── sos_event.py       # SOSEvent ORM
│   │   ├── host.py            # WanderHost ORM
│   │   ├── venue.py           # Venue ORM
│   │   └── user_history.py    # UserHistory ORM
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── common.py          # Pagination, ErrorResponse
│   │   ├── auth.py            # OTPRequest, TokenResponse
│   │   ├── user.py            # UserResponse, OnboardingRequest
│   │   ├── activity.py        # ActivityResponse
│   │   ├── matching.py        # MatchRequest, MatchStatus, MatchResult
│   │   ├── group.py           # GroupResponse
│   │   ├── chat.py            # ChatMessage schema
│   │   ├── sos.py             # SOSEventResponse
│   │   └── report.py          # WanderReportResponse
│   ├── services/
│   │   ├── __init__.py
│   │   ├── matching/
│   │   │   ├── __init__.py
│   │   │   ├── engine.py      # CP-SAT solver (OR-Tools)
│   │   │   ├── annealing.py   # Simulated annealing fallback
│   │   │   └── scoring.py     # Group scoring functions
│   │   ├── onboarding.py      # LLM chat orchestration + extraction
│   │   ├── chat.py            # Chat TTL management, broadcast
│   │   ├── sos.py             # SOS alert routing (WS + SMS fallback)
│   │   └── report.py          # Report aggregation + PDF generation
│   └── db/
│       ├── __init__.py
│       ├── session.py         # async_session_factory, get_db
│       └── redis.py           # Redis client factory, get_redis
├── tests/
│   ├── conftest.py            # Async fixtures, test DB, test Redis
│   ├── test_auth.py
│   ├── test_activities.py
│   ├── test_matching/
│   │   ├── test_engine.py
│   │   └── test_annealing.py
│   ├── test_chat.py
│   ├── test_sos.py
│   └── test_reports.py
├── pyproject.toml
├── Dockerfile
└── docker-compose.yml
```

### Frontend

```
frontend/
├── app/
│   ├── layout.tsx                # Root: AuthProvider, QueryClientProvider, ThemeProvider
│   ├── globals.css               # Tailwind directives + CSS custom properties
│   ├── (app-shell)/
│   │   ├── layout.tsx            # Mobile tab bar / desktop sidebar
│   │   ├── activities/
│   │   │   ├── page.tsx          # Activity feed (server component)
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Activity details + "I'm In"
│   │   │       └── matching/
│   │   │           └── page.tsx  # Matching visualization
│   │   ├── groups/
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Group details + members
│   │   │       └── chat/
│   │   │           └── page.tsx  # Chat interface
│   │   ├── report/
│   │   │   └── page.tsx          # Wander Report
│   │   ├── sos/
│   │   │   └── page.tsx          # SOS trigger screen
│   │   └── host/
│   │       └── dashboard/
│   │           └── page.tsx      # Host dashboard
│   ├── onboarding/
│   │   └── page.tsx              # AI Chat onboarding
│   ├── signup/
│   │   └── page.tsx              # Signup flow
│   └── verification/
│       └── page.tsx              # DigiLocker/Aadhaar verification
├── components/
│   ├── ui/                       # shadcn/ui primitives (button, card, badge, input, etc.)
│   ├── layout/
│   │   ├── mobile-tab-bar.tsx    # Bottom nav: activities, groups, report, sos
│   │   ├── desktop-sidebar.tsx   # Side nav for large screens
│   │   ├── safe-area-top.tsx     # iOS notch / status bar padding
│   │   └── safe-area-bottom.tsx  # Home indicator padding
│   ├── activities/
│   │   ├── activity-card.tsx     # Card with photo, title, category, host, date
│   │   ├── activity-feed.tsx     # Filtered grid/list of cards
│   │   └── category-filter.tsx   # Horizontal scrollable category pills
│   ├── matching/
│   │   └── matching-visualization.tsx  # Animated solver progress + results
│   ├── chat/
│   │   ├── chat-window.tsx       # Message list + input
│   │   ├── chat-message.tsx      # Individual message bubble
│   │   └── countdown-timer.tsx   # "Chat expires in 3d 14h 22m"
│   ├── sos/
│   │   ├── sos-button.tsx        # Long-press activation with haptic feedback
│   │   ├── sos-alert-screen.tsx  # Emergency contact's alert view
│   │   └── sos-demo.tsx          # Dual-screen SOS demo wrapper
│   ├── onboarding/
│   │   └── ai-chat.tsx           # Chat interface for LLM onboarding
│   ├── report/
│   │   └── wander-report.tsx     # Report card visualization
│   └── shared/
│       ├── verified-badge.tsx    # DigiLocker verified shield
│       ├── star-rating.tsx       # Host rating display
│       └── host-card.tsx         # Wander Host profile card
├── hooks/
│   ├── use-chat.ts               # WebSocket manager + auto-reconnect
│   ├── use-sos.ts                # SOS WebSocket + polling fallback + SMS
│   ├── use-matching.ts           # POST match → poll status → get result
│   └── use-media-query.ts        # Responsive breakpoint detection
├── lib/
│   ├── api-client.ts             # Fetch wrapper: base URL, auth header, error parsing
│   ├── supabase.ts               # Supabase client (auth + DB)
│   ├── validators.ts             # Zod schemas for all form inputs
│   └── constants.ts              # Activity categories, cities, areas
├── stores/
│   ├── auth-store.ts             # Zustand: session, user, login/logout
│   └── ui-store.ts               # Zustand: sidebar open, filter state, theme
├── public/
│   ├── manifest.json             # PWA manifest
│   ├── sw.js                     # Service worker (offline shell caching)
│   ├── icons/                    # App icons (192x192, 512x512, apple-touch)
│   └── screenshots/              # PWA install screenshots
└── tests/
    ├── api-client.test.ts
    ├── use-chat.test.ts
    └── use-sos.test.ts
```

---

## Database Schema

### Migration Order

```
1. users        (no foreign keys)
2. venues       (no foreign keys)
3. activities   (references venues, users)
4. groups       (references activities, users)
5. group_members (references groups, users)
6. chat_messages (references groups, users)
7. sos_events   (references users, groups, activities)
8. hosts        (references users)
9. user_history (references users, activities, groups)
```

### Full Schema

```sql
-- 1. USERS
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supabase_uid VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    name VARCHAR(100),
    email VARCHAR(255),
    date_of_birth DATE,
    gender VARCHAR(20),

    -- Verification
    verification_method VARCHAR(20),
    verification_status VARCHAR(20) DEFAULT 'unverified',
    verified_at TIMESTAMP,
    digilocker_ref VARCHAR(255),
    aadhaar_hashed VARCHAR(255),

    -- Personality (LLM-extracted)
    personality_vector VECTOR(5),
    personality_raw JSONB,
    interests TEXT[] DEFAULT '{}',
    activity_preferences TEXT[] DEFAULT '{}',
    vibe VARCHAR(50),
    availability TEXT[] DEFAULT '{}',

    -- Onboarding
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_chat_log JSONB,

    -- Location
    home_lat DECIMAL(10, 7),
    home_lng DECIMAL(10, 7),
    home_area VARCHAR(100),
    city VARCHAR(50) DEFAULT 'Bangalore',
    travel_radius_km INT DEFAULT 15,

    -- Safety
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(15),
    women_only_preference BOOLEAN DEFAULT FALSE,

    -- Stats
    streak_weeks INT DEFAULT 0,
    total_experiences INT DEFAULT 0,
    total_people_met INT DEFAULT 0,
    total_neighborhoods_explored INT DEFAULT 0,
    screen_time_before INT,
    screen_time_after INT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_city ON users(city);
CREATE INDEX idx_users_verification_status ON users(verification_status);
CREATE INDEX idx_users_onboarding_completed ON users(onboarding_completed);

-- 2. VENUES
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    address TEXT,
    lat DECIMAL(10, 7),
    lng DECIMAL(10, 7),
    area VARCHAR(100),
    city VARCHAR(50) DEFAULT 'Bangalore',
    venue_type VARCHAR(50),
    wander_verified BOOLEAN DEFAULT FALSE,
    capacity INT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_venues_city_area ON venues(city, area);

-- 3. ACTIVITIES
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50),       -- physical, social_good, skill, mental, chaotic, explore, slow
    activity_type VARCHAR(100),
    venue_id UUID REFERENCES venues(id),
    lat DECIMAL(10, 7),
    lng DECIMAL(10, 7),
    area VARCHAR(100),
    city VARCHAR(50) DEFAULT 'Bangalore',
    scheduled_at TIMESTAMP NOT NULL,
    confirmed_at TIMESTAMP,
    duration_minutes INT DEFAULT 180,
    group_size_min INT DEFAULT 4,
    group_size_max INT DEFAULT 8,
    women_only BOOLEAN DEFAULT FALSE,
    max_groups INT DEFAULT 3,
    host_ids UUID[] DEFAULT '{}',
    phone_free_encouraged BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activities_city ON activities(city);
CREATE INDEX idx_activities_area ON activities(area);
CREATE INDEX idx_activities_category ON activities(category);
CREATE INDEX idx_activities_scheduled_at ON activities(scheduled_at);
CREATE INDEX idx_activities_status ON activities(status);

-- 4. GROUPS
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID REFERENCES activities(id) NOT NULL,
    host_id UUID REFERENCES users(id),
    match_score DECIMAL(5, 3),
    no_show_risk DECIMAL(4, 3),
    status VARCHAR(20) DEFAULT 'pending',
    chat_opens_at TIMESTAMP,
    chat_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_groups_activity_id ON groups(activity_id);
CREATE INDEX idx_groups_status ON groups(status);
CREATE INDEX idx_groups_chat_expires ON groups(chat_expires_at);

-- 5. GROUP MEMBERS
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    role VARCHAR(20) DEFAULT 'member',
    checked_in BOOLEAN DEFAULT FALSE,
    sos_triggered BOOLEAN DEFAULT FALSE,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_group_members_group ON group_members(group_id);

-- 6. CHAT MESSAGES
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) NOT NULL,
    user_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    expires_at TIMESTAMP NOT NULL,     -- matched to groups.chat_expires_at
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_group ON chat_messages(group_id, created_at);
CREATE INDEX idx_chat_messages_expires ON chat_messages(expires_at);

-- 7. SOS EVENTS
CREATE TABLE sos_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    group_id UUID REFERENCES groups(id),
    activity_id UUID REFERENCES activities(id),
    lat DECIMAL(10, 7),
    lng DECIMAL(10, 7),
    emergency_contact_notified BOOLEAN DEFAULT FALSE,
    nearest_police_station VARCHAR(200),
    resolved BOOLEAN DEFAULT FALSE,
    triggered_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sos_user ON sos_events(user_id);
CREATE INDEX idx_sos_triggered_at ON sos_events(triggered_at);

-- 8. WANDER HOSTS
CREATE TABLE hosts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) UNIQUE NOT NULL,
    total_experiences_hosted INT DEFAULT 0,
    rating_avg DECIMAL(3, 2),
    background_verified BOOLEAN DEFAULT FALSE,
    interview_completed BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    specialties TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 9. USER HISTORY (no-repeat pairings)
CREATE TABLE user_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    other_user_id UUID REFERENCES users(id) NOT NULL,
    activity_id UUID REFERENCES activities(id),
    group_id UUID REFERENCES groups(id),
    met_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, other_user_id, activity_id)
);

CREATE INDEX idx_user_history_user ON user_history(user_id);
CREATE INDEX idx_user_history_pair ON user_history(user_id, other_user_id);
CREATE INDEX idx_user_history_met_at ON user_history(met_at);
```

### Redis Key Design

```
chat:{group_id}:messages      → Sorted Set (score=timestamp, member=JSON, TTL=chat_expires)
chat:{group_id}:meta          → Hash (opens_at, expires_at, group_name, TTL=chat_expires)

ws:user:{user_id}             → Set of connection_ids
ws:group:{group_id}           → Set of user_ids

sos:{sos_id}:status           → Hash (lat, lng, police, notified, resolved, TTL=3600)

location:{group_id}:{user_id} → Hash (lat, lng, timestamp, TTL=activity_end)

ratelimit:{user_id}:{endpoint} → Counter (TTL=60)

user:{user_id}:profile        → Hash (cached profile, TTL=300)
activity:{activity_id}:detail → Hash (cached detail, TTL=120)

auth:{phone}:otp              → String (hashed OTP, TTL=300)
auth:{phone}:attempts         → Counter (TTL=900)

community:{community_id}:members → Set of user_ids (TTL=86400)
community:{community_id}:meta    → Hash (name, tags, member_count, TTL=86400)

rec:{user_id}:{activity_id}:score → String (JSON score breakdown, TTL=300)
rec:{user_id}:top5                → List (ordered activity IDs, TTL=300)
rec:{user_id}:reason:{activity_id} → String (ai_reason text, TTL=300)

friends:{user_id}:suggestions  → List (JSON array of suggestions, TTL=600)
friends:{user_id}:requests     → Set (request IDs, TTL=300)
```

---

## API Reference

### Conventions

```
Base URL:     /api/v1
All requests: Authorization: Bearer <jwt_token>
Error shape:  { "error": { "code": "string", "message": "string", "details": {} } }
Pagination:   { "items": [...], "cursor": "string|null", "next_cursor": "string|null" }
Rate limits:  X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset (headers)
```

### Endpoints

```
# AUTH
POST   /api/v1/auth/send-otp        → { phone }              → { expires_in }
POST   /api/v1/auth/verify-otp      → { phone, otp }         → { access_token, refresh_token, user }

# VERIFICATION
POST   /api/v1/verify/digilocker/init    → { redirect_url, session_id }
GET    /api/v1/verify/digilocker/status  → { status: "pending"|"approved"|"rejected" }
GET    /api/v1/verify/digilocker/fetch   → { name, dob, gender, address }
POST   /api/v1/verify/aadhaar/init       → { aadhaar_number } → { otp_sent }
POST   /api/v1/verify/aadhaar/confirm    → { aadhaar_number, otp } → { name, dob, gender }

# ONBOARDING
POST   /api/v1/onboarding/chat      → { message }            → { reply, done, profile? }
GET    /api/v1/onboarding/status                                  → { completed, profile }

# ACTIVITIES
GET    /api/v1/activities            → ?category=&area=&date=&cursor=&limit=10
GET    /api/v1/activities/:id
POST   /api/v1/activities/:id/join

# MATCHING
POST   /api/v1/match/:activity_id    → trigger solver
GET    /api/v1/match/:activity_id/status   → { status, progress }
GET    /api/v1/match/:activity_id/result   → { groups: [...] }

# GROUPS
GET    /api/v1/groups/:id            → group + members + host + scores
GET    /api/v1/groups/:id/chat/history → ?cursor=&limit=50   → paginated messages
POST   /api/v1/groups/:id/rate       → { rating: 1-5 }

# CHAT (WebSocket)
WS     /ws/v1/chat/:group_id?token=<jwt>
  C→S: { "type": "send_message", "content": "..." }
  S→C: { "type": "new_message", "id": "...", "user_name": "...", "content": "...", "timestamp": "..." }
  S→C: { "type": "user_joined", "user_name": "..." }
  S→C: { "type": "user_left", "user_name": "..." }
  S→C: { "type": "chat_ttl_update", "remaining_seconds": 123456 }
  S→C: { "type": "chat_expired" }

# SOS
POST   /api/v1/sos/trigger           → Body: { lat?, lng? }  → { sos_id, notified }
POST   /api/v1/sos/cancel             → { sos_id }            → { cancelled }
WS     /ws/v1/sos/:user_id?token=<jwt>
  S→C: { "type": "sos_alert", "user_name": "...", "lat": ..., "lng": ...,
          "police_station": "...", "group_size": ..., "host_name": "...",
          "host_phone": "...", "timestamp": "..." }

# REPORT
GET    /api/v1/report/:user_id        → JSON report data
GET    /api/v1/report/:user_id/pdf    → PDF download

# HOST DASHBOARD
GET    /api/v1/host/dashboard          → upcoming groups, stats, rating
GET    /api/v1/host/groups             → ?status=upcoming|past   → hosted groups

# ADMIN
GET    /api/v1/admin/sos-events        → ?resolved=&cursor=       → SOS log
GET    /api/v1/admin/verifications     → pending verifications
GET    /api/v1/admin/activity-logs     → group audit trail
```

### WebSocket Connection Lifecycle

```
Client connects:
  ws = new WebSocket(`wss://api.wander.app/ws/v1/chat/${groupId}?token=${jwt}`)
  
Server accepts:
  - Validates JWT
  - Verifies user is member of group
  - Registers connection in Redis (ws:user:{id}, ws:group:{id})
  - Broadcasts user_joined to all group members
  - Starts sending chat_ttl_update every 60 seconds

Connection drop:
  Client (exponential backoff): 1s → 2s → 4s → 8s → 16s → max 30s
  Server: on disconnect → remove from Redis sets → broadcast user_left

Heartbeat:
  Client → Server: { "type": "ping" } every 30 seconds
  Server → Client: { "type": "pong" }
  If no pong in 10 seconds → assume disconnected → reconnect
```

---

## AI Matching Engine

### Problem Definition

Given N users interested in Activity A at Time T in Area L, find the optimal partition into groups of size K ± 1.

### Constraints

| # | Constraint | Type | Implementation |
|---|---|---|---|
| 1 | Group size: K_min ≤ members ≤ K_max | Hard | `Add(sum(x[u][g] for u) >= K_min)` and `<= K_max` |
| 2 | Each user in exactly 0 or 1 group | Hard | `Add(sum(x[u][g] for g) <= 1)` |
| 3 | Location: travel_time(user, meeting_point) ≤ 30 min | Hard | Pre-filter users via Google Distance Matrix before solver |
| 4 | Gender: women-only groups if any member opted in | Hard | `Add(x[u][g] == 0)` for men in women-only groups |
| 5 | No-repeat: no pair that met in last 90 days | Hard | `Add(x[u1][g] + x[u2][g] <= 1)` for conflict pairs |
| 6 | Host assignment: exactly 1 host per group | Hard | Host pre-assigned to a group slot; constraint ensures group has exactly K_min+1 members with host |

### Objective (Linearized Pairwise Similarity)

CP-SAT requires linear objectives. Pairwise similarity within groups is modeled via auxiliary variables:

```python
from ortools.sat.python import cp_model

def build_model(users, activity, hosts):
    model = cp_model.CpModel()
    
    n = len(users)
    n_groups = activity.max_groups
    K_min = activity.group_size_min
    K_max = activity.group_size_max
    
    # Decision: x[u][g] = 1 if user u assigned to group g
    x = {}
    for u in range(n):
        for g in range(n_groups):
            x[u, g] = model.NewBoolVar(f'x_{u}_{g}')
    
    # Constraint 1: each user in at most 1 group
    for u in range(n):
        model.Add(sum(x[u, g] for g in range(n_groups)) <= 1)
    
    # Constraint 2: group size bounds
    for g in range(n_groups):
        model.Add(sum(x[u, g] for u in range(n)) >= K_min)
        model.Add(sum(x[u, g] for u in range(n)) <= K_max)
    
    # Constraint 3: location (pre-filtered —  passed users are all within radius)
    # No additional constraint needed at solver level
    
    # Constraint 4: gender
    if activity.women_only:
        for g in range(n_groups):
            for u in range(n):
                if users[u].gender != 'female':
                    model.Add(x[u, g] == 0)
    else:
        # Women-only groups: if any group has a women_only opt-in user
        for g in range(n_groups):
            wog = model.NewBoolVar(f'women_only_{g}')
            for u in range(n):
                if users[u].women_only_preference:
                    model.Add(x[u, g] <= wog)
            # If wog == 1, no men in this group
            for u in range(n):
                if users[u].gender == 'male':
                    model.Add(x[u, g] <= 1 - wog)
    
    # Constraint 5: no-repeat pairings
    for g in range(n_groups):
        for u1 in range(n):
            for u2 in range(u1 + 1, n):
                if have_met_in_last_90_days(users[u1], users[u2]):
                    model.Add(x[u1, g] + x[u2, g] <= 1)
    
    # Constraint 6: host assignment (simplified)
    # Each group gets exactly one host from the activity's host pool
    for g in range(n_groups):
        model.Add(sum(x[h_index][g] for h_index in hosts) == 1)
    
    # OBJECTIVE: maximize personality similarity within groups
    # Linearized: pair_in_group[u1][u2][g] = x[u1][g] AND x[u2][g]
    objective_terms = []
    
    for g in range(n_groups):
        for u1 in range(n):
            for u2 in range(u1 + 1, n):
                # Auxiliary: pair assigned to same group
                pair = model.NewBoolVar(f'pair_{u1}_{u2}_{g}')
                model.Add(pair <= x[u1, g])
                model.Add(pair <= x[u2, g])
                model.Add(pair >= x[u1, g] + x[u2, g] - 1)
                
                # Weighted cosine similarity (pre-computed)
                sim = personality_similarity(users[u1], users[u2])
                
                # Objective: maximize similarity (formulate as minimize negative)
                # Scale to integer for CP-SAT
                objective_terms.append(int(-sim * 1000) * pair)
                
    # Also penalize no-show risk
    for u in range(n):
        for g in range(n_groups):
            risk = no_show_risk(users[u], activity)
            objective_terms.append(int(risk * 100) * x[u, g])
    
    model.Minimize(sum(objective_terms))
    
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 5.0
    solver.parameters.num_search_workers = 4
    status = solver.Solve(model)
    
    if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
        return extract_groups(solver, x, n, n_groups, users)
    else:
        return greedy_annealing_solution(users, hosts, activity)
```

### Personality Similarity Function

```python
def personality_similarity(user1, user2) -> float:
    """
    Weighted cosine similarity on 5D personality vectors.
    
    Vector dimensions: [adventure, energy, social, openness, conscientiousness]
    Weights:           [1.0,       0.8,    0.7,    1.0,      1.5]
    
    Conscientiousness similarity is the strongest predictor of group bonding.
    (Laakasuo et al., 2020, Frontiers in Psychology)
    """
    weights = [1.0, 0.8, 0.7, 1.0, 1.5]
    v1 = user1.personality_vector
    v2 = user2.personality_vector
    
    weighted_dot = sum(w * a * b for w, a, b in zip(weights, v1, v2))
    norm1 = sum(w * a * a for w, a in zip(weights, v1)) ** 0.5
    norm2 = sum(w * b * b for w, b in zip(weights, v2)) ** 0.5
    
    if norm1 == 0 or norm2 == 0:
        return 0.0
    
    return weighted_dot / (norm1 * norm2)
```

### No-Show Risk (Heuristic for Demo)

```python
def no_show_risk(user, activity) -> float:
    """
    Heuristic no-show probability for demo.
    Replace with XGBoost model in production with training data.
    """
    base_risk = 0.10
    
    if activity.scheduled_at.hour < 6:      # Early morning
        base_risk += 0.08
    if user.total_experiences == 0:         # First-timer
        base_risk += 0.05
    if user.last_activity:
        days_since = (activity.scheduled_at - user.last_activity).days
        if days_since > 30:
            base_risk += 0.05
    
    return min(base_risk, 0.40)
```

### Greedy + Simulated Annealing Fallback

```python
def greedy_annealing_solution(users, hosts, activity):
    """
    Fallback when CP-SAT times out or for >50 users.
    
    1. Hierarchical clustering on personality vectors → seed groups
    2. Greedy assign remaining users to nearest group (cosine similarity)
    3. Simulated annealing: random swaps, accept if objective improves
       or with probability exp(-ΔE / T)
    4. 10,000 iterations, temperature decays 0.995 per step
    5. Post-validate all constraints
    """
    from scipy.cluster.hierarchy import fcluster, linkage
    import numpy as np
    import random
    import math
    
    vectors = np.array([u.personality_vector for u in users])
    
    # Step 1: Hierarchical clustering
    linkage_matrix = linkage(vectors, method='ward')
    n_groups = activity.max_groups
    cluster_labels = fcluster(linkage_matrix, n_groups, criterion='maxclust')
    
    # Step 2: Seed groups from largest clusters, greedy fill remaining
    groups = [[] for _ in range(n_groups)]
    # ... (implementation follows standard greedy+annealing pattern)
    
    # Step 3: Anneal
    T = 1.0
    current_score = score_groups(groups, users)
    
    for iteration in range(10000):
        g1, g2 = random.sample(range(n_groups), 2)
        if not groups[g1] or not groups[g2]:
            continue
        
        u1_idx = random.randrange(len(groups[g1]))
        u2_idx = random.randrange(len(groups[g2]))
        
        # Swap
        groups[g1][u1_idx], groups[g2][u2_idx] = groups[g2][u2_idx], groups[g1][u1_idx]
        
        new_score = score_groups(groups, users)
        delta = new_score - current_score
        
        if delta > 0 or random.random() < math.exp(delta / T):
            current_score = new_score
        else:
            # Revert swap
            groups[g1][u1_idx], groups[g2][u2_idx] = groups[g2][u2_idx], groups[g1][u1_idx]
        
        T *= 0.995
    
    # Step 4: Assign hosts (one per group)
    for g in range(n_groups):
        groups[g].host = hosts[g % len(hosts)]
    
    return groups
```

### Matching Visualization (Frontend)

The demo shows a live animated matching visualization. Implementation:

```typescript
// lib/hooks/use-matching.ts
export function useMatching(activityId: string) {
  const [phase, setPhase] = useState<'idle' | 'filtering' | 'constraints' | 'solving' | 'done'>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<MatchResult | null>(null);

  const start = async () => {
    setPhase('filtering');
    // Client-side animation plays while API call is in flight
    await animateProgress(0, 30, 800);  // 0→30% in 800ms
    
    setPhase('constraints');
    const response = await fetch(`/api/v1/match/${activityId}`, { method: 'POST' });
    await animateProgress(30, 70, 600); // 30→70% in 600ms
    
    setPhase('solving');
    await animateProgress(70, 95, 400); // 70→95% in 400ms
    
    const data = await response.json();
    await animateProgress(95, 100, 200); // 95→100% in 200ms
    
    setPhase('done');
    setResult(data);
  };

  return { phase, progress, result, start };
}

// Internal: smooth progress animation
async function animateProgress(from: number, to: number, duration: number) {
  return new Promise<void>(resolve => {
    const start = performance.now();
    const tick = () => {
      const elapsed = performance.now() - start;
      const p = Math.min(elapsed / duration, 1);
      setProgress(from + (to - from) * easeOutCubic(p));
      if (p < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}
```

The animation runs client-side. The actual solver completes in <2 seconds. The animation is ~2 seconds. They finish together. Smooth, theatrical, no fake data.

---

## Component Design

### Verification Flow — DigiLocker

```
1. User taps "Verify Identity" → [DigiLocker] [Aadhaar OTP]

DigiLocker:
  2. POST /api/v1/verify/digilocker/init → { redirect_url, session_id }
  3. Redirect user to redirect_url
  4. User logs in to DigiLocker (Aadhaar OTP), grants consent
  5. User redirected back to Wander callback page
  6. Wander polls GET /api/v1/verify/digilocker/status?session_id=X
     every 2 seconds until status = "approved" or timeout (120s)
  7. GET /api/v1/verify/digilocker/fetch?session_id=X → XML with verified data
  8. Extract name, DOB, gender; store hashed ref; mark verified

Aadhaar e-KYC (fallback):
  2. User enters 12-digit Aadhaar number → POST /api/v1/verify/aadhaar/init
  3. UIDAI sends OTP to registered mobile
  4. User enters OTP → POST /api/v1/verify/aadhaar/confirm
  5. Returns XML: name, DOB, gender, address

Demo mode:
  - Tap "Verify with DigiLocker" → 2s loading animation → verified badge appears
  - Hardcoded verified data for Priya (no real API call in demo)
```

### AI Chat Onboarding

```
Flow:
  User completes signup + verification
  → Redirected to /onboarding
  → Chat interface loads
  → LLM sends first message: "Hey! I'm your Wander guide..."
  → User responds (text input)
  → LLM asks follow-ups (4-5 exchanges total)
  → LLM calls function: complete_onboarding(personality: {...})
  → Structured JSON extracted → stored as personality_vector VECTOR(5) + personality_raw JSONB
  → Animated summary card: "Profile ready!" with extracted traits
  → Redirected to /activities

LLM Config:
  Model: GPT-4o-mini or Claude Haiku
  Max tokens: 500 per exchange
  Temperature: 0.7
  Tools: complete_onboarding function with schema:
    {
      name: "complete_onboarding",
      parameters: {
        personality_vector: [0-1, 0-1, 0-1, 0-1, 0-1],
        interests: string[],
        vibe: string,
        availability: string[]
      }
    }

Fallback:
  3 quick questions → default profile → user can refine later
```

### Ephemeral Chat

```
Lifecycle:
  Activity scheduled: Saturday 5 AM
  Groups confirmed: Wednesday 10 AM
  Chat opens: Wednesday 10 AM (3 days pre-activity)
  Activity: Saturday 5 AM
  Chat expires: Wednesday ~10 AM (4 days post-activity)
  Total: ~7 days

Implementation:
  Redis:
    - Messages stored in Sorted Set: chat:{group_id}:messages
    - TTL set to (chat_expires_at - now) on group creation
    - When TTL expires → Redis auto-deletes all messages
    - WebSocket sends chat_expired event to connected clients

  PostgreSQL:
    - Messages also written to chat_messages table with expires_at
    - Background task runs hourly: DELETE FROM chat_messages WHERE expires_at < NOW()
    - API history endpoint reads from PG (backup); WebSocket uses Redis

  WebSocket:
    - Server pushes chat_ttl_update every 60 seconds with remaining_seconds
    - Client renders countdown: "Chat expires in 3d 14h 22m"
    - When remaining < 3600 (1 hour): count turns red, shows minutes
    - When remaining < 60: counts down in seconds
```

### SOS Emergency System

```
Flow:
  Trigger:
    User long-presses SOS button (2 second hold)
    → POST /api/v1/sos/trigger
    → Creates sos_event record in PostgreSQL
    → Looks up user's emergency contact + current group
    → Primary: sends WebSocket alert to emergency contact's active connection
    → Fallback 1: HTTP polling (GET /api/v1/sos/:user_id/poll every 1s)
    → Fallback 2: SMS via Twilio (if WS + polling both fail after 5 seconds)
    → Returns { sos_id, notified: true }

  Emergency contact receives:
    {
      type: "sos_alert",
      user_name: "Priya Sharma",
      lat: 13.3702, lng: 77.6835,
      nearest_police_station: "Chikkaballapur Rural PS",
      police_phone: "+91 8156 295 300",
      group_size: 6,
      host_name: "Arjun Kumar",
      host_phone: "+91 98765 43210",
      timestamp: "2025-06-15T06:42:00Z"
    }

  UI (emergency contact):
    - Map with GPS marker
    - Call buttons: User, Police, Host
    - Navigate to location

  UI (triggering user):
    - Confirmation: "Rahul has been notified"
    - Cancel SOS button (false alarm with confirmation dialog)

  WebSocket reliability:
    - Client heartbeat every 30 seconds (ping/pong)
    - Auto-reconnect: 1s → 2s → 4s → 8s → 16s → max 30s
    - If WS disconnected >5s → auto-switch to polling fallback
    - SOS state persisted in localStorage (survives page refresh)
    - SMS fallback triggered server-side if WS delivery not acknowledged in 5s

  Target: under 3 seconds from hold to alert delivery (any channel).
```

---

## State Management

### Data Ownership

| State | Tool | Examples |
|---|---|---|
| Server state | react-query (`useQuery`, `useMutation`) | Activities, user profile, groups, report, host dashboard |
| Client state | zustand | Auth session, UI preferences, filter state |
| Real-time state | Custom hooks (`useChat`, `useSOS`) | Chat messages, SOS alerts, WebSocket connection |
| Form state | react-hook-form + zod | Signup, onboarding chat input, rating |
| URL state | Next.js `useSearchParams` | Activity filters (category, area) |

### React Query Keys

```typescript
const queryKeys = {
  activities: {
    all:     ['activities'] as const,
    list:    (filters: ActivityFilters) => ['activities', 'list', filters] as const,
    detail:  (id: string) => ['activities', 'detail', id] as const,
  },
  users: {
    profile: ['users', 'profile'] as const,
    onboarding: ['users', 'onboarding'] as const,
  },
  groups: {
    detail:  (id: string) => ['groups', 'detail', id] as const,
    chat:    (id: string) => ['groups', 'chat', id] as const,
  },
  matching: {
    status:  (activityId: string) => ['matching', 'status', activityId] as const,
    result:  (activityId: string) => ['matching', 'result', activityId] as const,
  },
  report: {
    data:    (userId: string) => ['report', 'data', userId] as const,
  },
  host: {
    dashboard: ['host', 'dashboard'] as const,
  },
} as const;
```

---

## Error Handling

### Backend

```python
# app/core/exceptions.py
class AppError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400, details: dict = None):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}

class NotFoundError(AppError):
    def __init__(self, resource: str, identifier: str):
        super().__init__("NOT_FOUND", f"{resource} not found", 404,
                         {"resource": resource, "identifier": identifier})

class VerificationError(AppError):
    def __init__(self, message: str):
        super().__init__("VERIFICATION_FAILED", message, 400)

class MatchingError(AppError):
    def __init__(self, message: str):
        super().__init__("MATCHING_FAILED", message, 500)

# app/main.py
@app.exception_handler(AppError)
async def app_error_handler(request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.code, "message": exc.message, "details": exc.details}}
    )
```

### Frontend

```typescript
// lib/api-client.ts
class ApiError extends Error {
  constructor(
    public code: string,
    public message: string,
    public status: number,
    public details: Record<string, unknown>
  ) {
    super(message);
  }
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      body.error?.code ?? 'UNKNOWN',
      body.error?.message ?? 'Something went wrong',
      res.status,
      body.error?.details ?? {}
    );
  }
  
  return res.json();
}

// Global error boundary
// components/error-boundary.tsx
'use client';
export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  // Catches unhandled errors, shows fallback UI
}

// Toast notifications for transient errors (sonner)
// hooks/use-toast.ts → wraps API calls with toast.error() on failure
```

### Offline Detection

```typescript
// hooks/use-offline.ts
export function useOffline() {
  const [online, setOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);
  
  return online;
}

// In components:
// if offline → show cached data (react-query) + banner: "You're offline"
// SOS still works via SMS fallback (server-side)
```

---

## Demo Flow

### Setup

- 5 Wander Hosts (profiles, ratings 4.6-4.9, specialties)
- 15 Bangalore activities across all 7 categories
- 20 pre-onboarded users with AI-extracted personality vectors
- Demo persona "Priya" — verified, onboarded, personality stored
- Emergency contact "Rahul" — second device or browser tab
- 3 past completed groups (for Wander Report data)
- Google Maps pre-cached for offline demo safety

### Total Time: ~7 minutes (core 5:30 + 80s enhanced features)

> **Demo philosophy: Every scene must reinforce "AI for mental health." Don't just show features — narrate the AI decisions happening behind the scenes.**
>
> **Note:** If time is tight, Scenes 7.5, 7.6, and 7.7 can be compressed or presented as a rapid-fire "AI Ecosystem" montage (45s total). The core 5:30 via Scenes 0-8 remains the minimum viable demo.

**Scene 0: The Crisis (30s)** — Pitch deck slides 1-3. Lead with WHO stat (loneliness = 15 cigarettes/day). End with: "Group composition is an optimization problem. We solved it."

**Scene 1: AI Onboarding (60s)** — ⭐ Open with this. Live LLM conversation. Show the structured JSON extraction in real-time. "Not a quiz — an AI that understands who you are in 5 messages." *This is the first AI moment.*

**Scene 2: Verification (30s)** — Quick. Verified badge via DigiLocker. "Government identity. No catfishing. No fake profiles." Don't linger — safety is a checkbox, not a showpiece.

**Scene 3: Activity Discovery (30s)** — Card feed. Nandi Hills trek. "No algorithm feed. No infinite scroll. Pick something real."

**Scene 4: Matching Engine (75s)** — ⭐⭐ THE SHOWSTOPPER. Live visualization. 12 users → 2 groups. Show the constraints lighting up: personality similarity, location radius, gender preferences, no-repeat pairings. CP-SAT solves in 1.8s. "This isn't a filter. This is a constraint satisfaction solver running 6 dimensions of optimization. The same class of algorithm that schedules airline crews." *Linger here. This is what wins.*

**Scene 5: Group + Chat (30s)** — Group card with match score. Chat opens with countdown timer. "7 days. Then it's gone. Connection happens in the real world."

**Scene 6: SOS (30s)** — ⭐ Dual-screen demo. Long-press → alert arrives in 2.1s on second device with GPS, police station, host phone. "Under 3 seconds. WebSocket, polling fallback, SMS fallback. Triple redundancy."

**Scene 7: Wander Report (30s)** — "12 experiences. 47 people met. 8 neighborhoods explored. 43% less screen time." *Pause.* "Every other app measures engagement with their platform. We measure engagement with the world."

**Scene 7.5: Communities (30s)** — "But the story doesn't end after one activity." Navigate to Communities tab. Browse interest-tagged communities. Priya's interests (trekking, photography) highlight "Weekend Trekkers" — 87 members, 23 treks completed. She sees Lakshmi from her Nandi Hills group is already here. Join in one tap. Community chat is alive between activities. "This is where belonging lives — not just during activities, but between them."

**Scene 7.6: Friend Matching (30s)** — Navigate to Friends tab. "AI doesn't just match groups — it finds your people." pgvector KNN scans personality vectors. Top suggestion: Rahul at 92% compatibility — both adventurers, both trekkers, both in Indiranagar. Shared interests highlighted. AI-generated reason: "Your trekking passion and creative vibe click perfectly — and you live 3km apart." Send friend request. "1-on-1 matching for genuine friendship, not just activity groups."

**Scene 7.7: Recommendations (20s)** — Return to Activities feed. Top section: "Recommended For You." Nandi Hills Sunrise Trek at 97% match with AI reason. No scrolling. No browsing. "The app knows you. It doesn't give you a feed — it gives you the best answer."

**Scene 8: Closer (15s)** — "Loneliness is the health crisis of our generation. Wander is AI that solves it — not by keeping you on a screen, but by getting you off one."

---

## Pitch Deck

> **Framing rule: This is an AI-powered mental health intervention, not a social app. Every slide reinforces this.**

| # | Slide | Content | Judge Takeaway |
|---|---|---|---|
| 1 | Title | "Wander — AI That Cures Loneliness" · "Go outside." · Team & Institution | Sets the AI+mental health frame immediately |
| 2 | The Crisis | 37% lonely in Bangalore, 50% of 18-24. Social media → 4.4x loneliness odds. WHO: loneliness = 15 cigarettes/day. | This is a **health crisis**, not a lifestyle inconvenience |
| 3 | Why Existing Solutions Fail | Meetup (1.2★), Bumble BFF (CEO admitted failure). Problem: random groups → bad chemistry → people stop showing up. **Group composition is an optimization problem.** | Frames the gap as a *technical* problem that needs AI |
| 4 | Wander's AI Stack | Three AI layers: (1) LLM personality extraction, (2) CP-SAT combinatorial group optimization, (3) behavioral de-addiction analytics. Architecture diagram. | The "holy shit, this is real engineering" slide |
| 5 | AI Matching Deep Dive | 6 constraints, linearized pairwise similarity, CP-SAT solver + annealing fallback. Live code snippet. Solves 12 users in 1.8s. | Technical depth — this is the slide judges remember |
| 6 | AI Onboarding | LLM chat → structured personality vector (5D) via function calling. Not a quiz — data collection disguised as conversation. | Shows AI is integrated end-to-end, not bolted on |
| 7 | Safety (Non-Negotiable) | Gov ID verification, SOS under 3 seconds (triple redundancy), Wander Hosts, women-only groups, full audit trail | Preempts the #1 objection before it's asked |
| 7.5 | The AI Ecosystem | Communities (interest-based persistent groups), Friend Matching (pgvector KNN + 5-factor compatibility), Recommendations (4D scoring engine). Three AI layers that create a complete social fabric — discover → connect → belong. | Shows the product is a platform, not a single feature |
| 8 | The De-Addiction Philosophy | No feed. No likes. Ephemeral chat (7 days). Wander Report measures real-world engagement. "Replacement > restriction." | Differentiator: the only app designed to reduce its own usage |
| 9 | Live Demo | Full app walkthrough (see Demo Flow below) | Where the pitch becomes undeniable |
| 10 | Closer | "Every other app measures engagement with their platform. We measure engagement with the world." | The line they'll quote when discussing winners |

---

## 24-Hour Build Strategy

> **Hackverse-2k26 — May 7-8, 2026. All core logic built during the event. Planning happens now; code happens on-site.**

### Phase 1: Foundation (Hour 0–4)
- [ ] FastAPI project scaffold with layered structure (api/core/models/schemas/services/db)
- [ ] Next.js 14 App Router with shadcn/ui + Tailwind
- [ ] Docker Compose: PostgreSQL (+pgvector) + Redis
- [ ] SQLAlchemy 2.0 async models (all 9 tables)
- [ ] Alembic migrations (all 9 tables in correct order with indexes)
- [ ] User auth API (send-otp, verify-otp) — dev OTP = "123456"
- [ ] Next.js signup page + auth store (zustand)

### Phase 2: Core Backend (Hour 4–10)
- [ ] Activity CRUD + discovery API (paginated, filtered)
- [ ] CP-SAT matching engine (engine.py, annealing.py, scoring.py)
- [ ] Matching engine tests (benchmark on 12/20 users)
- [ ] Group formation API (trigger + status + result)
- [ ] Next.js activity feed + detail page

### Phase 3: AI + Verification (Hour 10–14)
- [ ] LLM integration (NVIDIA Nemotron) for personality extraction
- [ ] Onboarding API (structured form → single LLM call → personality vector)
- [ ] DigiLocker mock verification flow
- [ ] Aadhaar e-KYC mock flow
- [ ] Next.js onboarding page (3-step form)
- [ ] Next.js verification page

### Phase 4: Real-Time Features (Hour 14–20)
- [ ] Chat WebSocket endpoint + REST history
- [ ] Redis TTL for ephemeral chat
- [ ] SOS system: WebSocket + polling fallback + SMS (Twilio)
- [ ] SOS event logging + audit trail
- [ ] Wander Report aggregation service
- [ ] Next.js chat page (useChat hook)
- [ ] Next.js SOS page (useSOS hook, long-press button)

### Phase 5: Polish + Seed (Hour 20–22)
- [ ] All remaining pages: /matching, /groups, /report, /host, /admin
- [ ] Framer Motion animations (matching viz, SOS, countdown, report reveal)
- [ ] Mobile layouts: bottom tab bar, safe area padding, touch targets ≥44px
- [ ] PWA: manifest.json, service worker registration, install prompt
- [ ] Seed data: 5 Hosts, 15 activities, 20 users, 3 past groups
- [ ] Demo personas: Priya, Rahul

### Phase 6: Rehearsal (Hour 22–24)
- [ ] Full 5:30 run-through. Time each scene. Find rough transitions.
- [ ] Test SOS timing 10x (<3s). Test matching live.
- [ ] Test on projector. Check font sizes, contrast.
- [ ] Record backup video walkthrough as insurance.
- [ ] Review Q&A prep. **No new features.**

### Parallel Work Streams
```
Stream A: Backend  →  H0-4 (foundation) → H4-10 (matching/core) → H14-20 (chat+SOS)
Stream B: AI       →  H0-4 (setup)      → H10-14 (LLM+verify)
Stream C: Frontend →  H0-4 (shell)      → H4-20 (screens alongside API) → H20-22 (polish)
Stream D: Infra    →  H0-4 (Docker)     → H20-22 (seed+deploy)
```

### Critical Path
Database → Matching engine → Chat/SOS → Frontend integration → Polish → Seed data → Rehearsal.

AI Onboarding and Verification are off the critical path (Priya can be pre-configured if LLM fails).

### Q&A Prep — Anticipated Judge Questions

| Question | Answer |
|---|---|
| "How is this different from Meetup?" | Meetup is an event directory. Wander is an AI optimization engine — it doesn't just list events, it solves the group composition problem with a CP-SAT solver running 6 constraint dimensions. |
| "Why not just random groups?" | Bad group chemistry makes loneliness worse. Our matching engine optimizes personality similarity (weighted cosine on 5D vectors) while respecting safety constraints. Random ≠ optimal. |
| "Where's the AI?" | Three layers: (1) LLM personality extraction via function calling, (2) CP-SAT combinatorial optimization for group matching, (3) behavioral analytics for the de-addiction Wander Report. |
| "Is the verification real?" | Demo uses DigiLocker mock (real API requires registered org + sandbox). Architecture follows the actual DigiLocker OAuth spec — production integration is straightforward. |
| "How do you make money?" | Freemium (₹199/mo for unlimited activities), B2B corporate team bonding, venue partnerships. But for this hackathon — the focus is the AI and the impact. |
| "What about safety?" | Government ID verification, SOS with triple redundancy (<3s), trained Wander Hosts, women-only groups, full audit trail. Safety is non-negotiable. |
| "Can this scale?" | CP-SAT solves 12 users in 1.8s with annealing fallback for 50+. pgvector KNN handles friend matching at scale (IVFFlat index for production). WebSocket + Redis handles real-time. |
| "How is friend matching different from dating apps?" | Dating apps maximize swipes. Friend matching optimizes for shared interests + personality compatibility + location proximity — weighted multi-factor scoring. No swiping. No profiles to browse. The AI surfaces the best matches. |
| "What keeps users coming back?" | Three layers: (1) Communities — persistent interest-based groups between activities, (2) Friend Matching — genuine 1-on-1 connections, (3) Wander Report — gamified real-world engagement. It's not an activity app — it's a social home. |

---

## Testing Strategy

> Testing exists to ensure the demo doesn't break on stage. Focus on the critical path only — there are 24 hours.

### Critical Path Tests

| Test | Tool | What it validates |
|---|---|---|
| Matching engine (12→2 groups) | pytest | CP-SAT solves correctly, all 6 constraints satisfied |
| Matching edge cases | pytest | Women-only, all-repeat-pairs, single user |
| Annealing fallback (50 users) | pytest | Fallback produces valid groups when CP-SAT times out |
| SOS end-to-end | pytest | Trigger → WebSocket delivery → polling fallback → SMS |
| Chat WebSocket lifecycle | pytest | Connect, send, broadcast, TTL expiry, reconnect |
| Full demo flow | Manual (browser) | signup → onboarding → activities → matching → chat → SOS → report |

### Testing Philosophy

- Write backend tests alongside the code (pytest + SQLite + fakeredis)
- Frontend: manual verification through the demo flow
- SOS timing tested 10x before presenting to ensure <3s delivery
- Matching engine benchmarked on 12/20 users to confirm <2s solve time

---

## Dependencies & Sequencing

### Dependency Graph

```
Phase 1: Foundation (Hour 0-4)
  └── DB schema + Auth + Project setup

Phase 2: Core Backend ── depends on: Phase 1
  ├── Activity API ── parallel with ──→ Matching Engine
  └── Group API ←── depends on: ←── Matching Engine

Phase 3: AI Onboarding ── depends on: Phase 1 (user model)
  ├── LLM integration ── independent ──
  └── Verification flow ── independent ──

Phase 4: Real-Time ── depends on: Phase 2 (groups)
  ├── Chat ── parallel with ──→ SOS
  └── Reports ←── depends on: ←── Activity + Group history

Phase 5: Frontend Polish ── depends on: Phases 1-4 (all APIs)
  └── Animations, PWA, responsive layouts

Phase 6: Seed + Rehearsal ── depends on: Phases 1-5
  └── Seed data, backup video, pitch rehearsal
```

### Parallel Work Streams

```
Stream A: Backend  ──→  H0-4 (foundation) → H4-10 (matching) → H14-20 (chat+SOS)
Stream B: AI       ──→  H0-4 (setup)      → H10-14 (LLM+verify)
Stream C: Frontend ──→  H0-4 (shell)      → H4-20 (screens alongside API) → H20-22 (polish)
Stream D: Infra    ──→  H0-4 (Docker)     → H20-22 (seed+deploy)
```

### Critical Path

Database → Matching engine → Chat/SOS → Frontend integration → Polish → Seed data → Rehearsal.

AI Onboarding and Verification are off the critical path (Priya can be configured manually if LLM fails during the event).

---

## Trade-offs & Architectural Decisions

| # | Decision | Rationale |
|---|---|---|
| 1 | **Supabase Auth over Firebase Auth** | Single platform for Auth + DB + Redis. No vendor fragmentation. Phone OTP with Row Level Security. |
| 2 | **CP-SAT + Annealing over pure greedy** | Deeper tech impresses judges. CP-SAT handles complex multi-constraint optimization. 5-second timeout + fallback ensures reliability. |
| 3 | **LLM Chat over quiz** | Richer data, modern UX, technical showcase. Fallback to basic form if LLM unavailable. |
| 4 | **DigiLocker mock over real API** | Real API requires registered organization + sandbox access. Mock is smooth, reliable, and fast for demo. Real API spec is referenced correctly. |
| 5 | **Redis TTL over cron cleanup** | Automatic, accurate to the second. Messages that expire are truly gone — the entire point. PG backup for audit trail with background cleanup. |
| 6 | **WebSocket + polling + SMS over WebSocket-only** | SOS is safety-critical. Triple redundancy: WebSocket (<3s) → polling (1s) → SMS (5s timeout). |
| 7 | **pgvector over dedicated vector DB** | 5D vectors are trivial for pgvector. No extra infra. Cosine distance via `<=>` operator. |
| 8 | **react-query + zustand over Redux** | react-query handles server cache/refetch/stale-while-revalidate. zustand handles simple client state. Less boilerplate. |
| 9 | **App Router over Pages Router** | React Server Components, streaming, better data fetching patterns. Modern Next.js standard. |
| 10 | **PWA over native app** | Single codebase. Installable. Offline-ready. Native feel without native development cost. |
| 11 | **Heuristic no-show over ML model** | No training data exists for demo. Heuristic is transparent and predictable. ML model is future work. |
| 12 | **24-hour build with detailed plan** | All architecture, schemas, API specs, and component designs fully specified before the event. Team executes from plan during the 24 hours. Parallel work streams (backend/AI/frontend/infra) enable full feature coverage. |
| 13 | **Extend Group table over new Community table** | Communities reuse the existing Group + GroupMember tables with a `group_type` discriminator. Saves ~100 lines of model/API code vs a new table. activity_id becomes nullable. |
| 14 | **Multi-factor static scoring over ML model for recommendations** | No training data exists for the hackathon. Multi-factor scoring (interest + location + personality + social) is transparent, debuggable, and produces correct results. ML model is future work. |
| 15 | **pgvector exact KNN over IVFFlat index for friend matching** | With 20 demo users, exact `<=>` scan is <1ms. IVFFlat index requires data to exist first. Index creation code is prep'd but not migrated — production-ready with one SQL command. |

---

## Potential Challenges & Mitigations

| Risk | Mitigation |
|---|---|
| CP-SAT timeout for large groups | Fallback to annealing. Demo capped at 12-20 users (solved in <2s). |
| LLM API down during demo | Priya is pre-onboarded. Show recording as backup. Matching engine reads stored vectors, not live LLM. |
| WebSocket disconnection | SOS: polling + SMS fallback. Chat: auto-reconnect with backoff. Pre-recorded demo backup. |
| SOS fails to deliver | Test 10x before presenting. Backup video. Show admin dashboard as proof. |
| Google Maps API quota | Pre-cache tiles. Pre-compute Distance Matrix. Static images as fallback. |
| DigiLocker unavailable | Mocked for demo (smooth, reliable). Explain real API integration. |
| Presentation day issues | Detailed plan with allocated time blocks. On-site: build in focused sprints, test on projector, verify all services, rehearse pitch + demo, prep for Q&A. Backup video recorded as insurance. |
| Matching produces bad groups | Post-process validation. Fallback to greedy if solver output violates constraints. Seed data designed for clean results. |
| Team member dropout | Cross-train on each other's code. Document all components. Scope down non-essential features. |
| Enhanced features time overrun | Core demo (Scenes 0-8, 5:30) is the priority. Communities, friends, and recommendations are additive — each scene is independent. Can cut any/all and still deliver a complete demo. |
| pgvector not installed on Supabase | Supabase supports pgvector natively. If unavailable, fall back to Python cosine similarity with in-memory computation (no DB vector operations needed for 20 users). |
| Friend matching produces obvious matches | The demo persona (Priya + Rahul) is designed with complementary vectors + shared interests. Seed data is hand-crafted for clean demos. The AI explanation (Nemotron) adds the "magic" layer even if matches seem obvious. |
| Judges dismiss as "social app" | Every slide reinforces anti-social-media positioning. The de-addiction philosophy is in the product, not just the pitch. The Wander Report closer: "Every other app measures engagement with their platform. We measure engagement with the world." |

---

## Enhanced Feature: Interest-Based Community Groups

### Problem & Rationale

The current Group model is built exclusively for activity-matched ephemeral groups — groups are created by the matching engine, tied to a specific activity, and destroyed after the activity window. But users repeatedly asked: *"Can I stay in touch with my trekking group?"* and *"Is there a space for photography enthusiasts?"*

Interest-based communities are the retention layer. They transform Wander from a "one-time activity app" into a persistent social home. Communities keep users returning between activities, deepen bonds formed during activities, and create the belonging infrastructure that the hackathon problem statement demands.

**Hackathon impact:** Shows the product is a platform, not a feature. Persistent communities demonstrate the "TAM expansion" argument judges look for.

### Reuse of Existing Infrastructure

| Existing Asset | How Communities Reuse It |
|---|---|
| `Group` model | Extended with `group_type = "community"`, making `activity_id` nullable |
| `GroupMember` model | Reused as-is; `role` field already supports "founder" / "admin" / "member" |
| `groups` API module | Extended with community-specific endpoints in same router |
| Chat WebSocket `/ws/v1/chat/:id` | Reused for community chat (no TTL, persistent) |
| `User.interests` column | Drives community discovery and suggestions |
| MobileTabBar / DesktopSidebar | New "Communities" tab added alongside existing 4 tabs |

### Database Changes

#### Extended `groups` table (additive migration)

```sql
ALTER TABLE groups
    ADD COLUMN group_type VARCHAR(20) DEFAULT 'matching',
    ADD COLUMN interest_tags TEXT[] DEFAULT '{}',
    ADD COLUMN description TEXT,
    ADD COLUMN cover_image_url TEXT,
    ADD COLUMN rules TEXT,
    ADD COLUMN member_limit INT DEFAULT 100,
    ALTER COLUMN activity_id DROP NOT NULL;  -- communities don't need an activity

CREATE INDEX idx_groups_group_type ON groups(group_type);
CREATE INDEX idx_groups_interest_tags ON groups USING GIN(interest_tags);
```

#### No new tables needed

`GroupMember` already supports communities. `role` field accommodates:
- `"founder"` — user who created the community
- `"admin"` — appointed by founder
- `"member"` — regular members

### Community Model (SQLAlchemy ORM extension)

```python
# Add to app/models/group.py
@declared_attr
def __mapper_args__(cls):
    return {
        "polymorphic_identity": cls.__tablename__,
        "polymorphic_on": cls.group_type,
    }

# Add columns to Group:
group_type: Mapped[str] = mapped_column(String(20), default="matching")
interest_tags: Mapped[list[str] | None] = mapped_column(ARRAY(Text), default=[])
description: Mapped[str | None] = mapped_column(Text)
cover_image_url: Mapped[str | None] = mapped_column(String(500))
rules: Mapped[str | None] = mapped_column(Text)
member_limit: Mapped[int] = mapped_column(Integer, default=100)
```

### API Design

```
GET    /api/v1/communities              → ?interest=&cursor=&limit=10
                                          → PaginatedResponse[CommunityResponse]
                                          Browse communities by interest tag, sorted by member count desc

GET    /api/v1/communities/suggested    → ?limit=5
                                          → List of communities where community.interest_tags ∩ user.interests ≠ ∅
                                          Sorted by: (overlapping_tags / len(community.interest_tags)) * member_count

GET    /api/v1/communities/:id          → CommunityResponse with members, member count, is_member flag

POST   /api/v1/communities              → Body: { name, interest_tags, description, rules? }
                                          → Create community. Creator auto-assigned role="founder".
                                          Only verified users can create.

POST   /api/v1/communities/:id/join     → Add current_user as member. Return { joined: true }.
                                          Validate: not already member, below member_limit, verified user.

POST   /api/v1/communities/:id/leave    → Remove membership. Founder can't leave (must transfer or disband).

GET    /api/v1/communities/:id/chat/history → Reuses existing chat history endpoint (no TTL for communities)

DELETE /api/v1/communities/:id          → Founder or admin only. Soft-delete (status = "archived").
```

### CommunityResponse Schema

```python
class CommunityResponse(BaseModel):
    id: uuid.UUID
    name: str  # derived from first interest_tag + "Community" or custom name
    interest_tags: list[str]
    description: str | None
    member_count: int
    cover_image_url: str | None
    rules: str | None
    member_limit: int
    is_member: bool = False
    role: str | None = None  # user's role if member (founder/admin/member)
    created_by: str | None = None  # founder name
    created_at: datetime

class CommunityListResponse(BaseModel):
    items: list[CommunityResponse]
    next_cursor: str | None
```

### Frontend Design

#### New Pages

```
frontend/app/(app-shell)/
├── communities/
│   ├── page.tsx                    # Community discovery (feed)
│   └── [id]/
│       ├── page.tsx                # Community detail + members
│       └── chat/
│           └── page.tsx            # Community chat (persistent)
```

#### New Components

```
components/communities/
├── community-card.tsx              # Preview card: interest tag, name, member count, cover
├── community-feed.tsx              # Grid of community cards with interest filter pills
├── interest-filter.tsx             # Horizontal scrollable interest tag pills (reuse category-filter pattern)
├── community-detail.tsx            # Full detail: cover, description, rules, member list
├── community-chat.tsx              # Chat wrapper (reuses chat-window component)
└── create-community-form.tsx       # Modal form: name, tags, description, rules
```

#### Navigation Changes

Add "Communities" as the 5th tab in both MobileTabBar and DesktopSidebar:
```typescript
// MobileTabBar — add to tabs array
{ href: "/communities", label: "Communities", icon: Globe }
// OR replace "Groups" with "Communities" — groups are accessible from community detail

// DesktopSidebar — add to navItems array  
{ href: "/communities", label: "Communities", icon: Globe }
```

#### Chat Behavior

- Activity group chat: ephemeral (Redis TTL 7 days) — unchanged
- Community chat: persistent (no Redis TTL, stored only in PostgreSQL)
- Reuses the same `useChat` WebSocket hook — just with `group_type` discriminator
- When `group_type = "community"`, countdown timer is hidden, no TTL countdown

### Community Discovery Algorithm

```
For each user visiting /communities:
  1. Rank all communities by:
     relevance = (|user.interests ∩ community.interest_tags| / |community.interest_tags|) * 0.6
                + (community.member_count / max_member_count) * 0.4
  2. Top result with relevance > 0 gets "Recommended for You" badge
  3. Fallback: sort by member_count desc (popular communities)
```

### Redis Changes

```
community:{community_id}:members  → Set of user_ids (for fast membership check, TTL=86400)
community:{community_id}:meta     → Hash (name, tags, member_count, TTL=86400)
```

### Demo Scene: Communities (45s add-on)

After the Report reveal: "But the story doesn't end after one activity. Priya joins the Weekend Trekkers community — 87 members who've done 23 treks together. She sees Lakshmi (from her Nandi Hills group) is already here. Community chat has 142 messages. This is where belonging lives between activities."

---

## Enhanced Feature: Local Event Recommendations

### Problem & Rationale

The current activity discovery is functional but dumb — it shows the same 15 activities to every user sorted by scheduled_at. A user who loves peaceful yoga sees "Midnight Chaos Bowling" at the top. This is a missed opportunity to demonstrate AI personalization.

A recommendation engine shows judges that the AI doesn't just match groups — it understands individual preferences and proactively suggests relevant experiences. This closes the loop: LLM extracts personality → recommendations use it → matching forms groups → bonding happens → history feeds back.

**Hackathon impact:** Transforms "activity listing" into "AI-curated experience feed." Visually indistinguishable from Netflix/Spotify recommendation quality.

### Hybrid Recommendation Engine

The engine scores every open activity for every user on 4 weighted dimensions:

```
SCORE(user, activity) = 
    0.40 * interest_match(user, activity)       # Content-based
  + 0.25 * location_score(user, activity)       # Geospatial
  + 0.15 * personality_fit(user, activity)      # Psychographic
  + 0.20 * social_proof(user, activity)         # Collaborative
```

#### Dimension 1: Interest Match (40%)

```python
def interest_match(user, activity) -> float:
    """Jaccard similarity between user interests and activity tags."""
    if not activity.tags:
        return 0.5  # neutral for untagged activities
    
    user_interests = set(user.interests or [])
    activity_tags = set(activity.tags or [])
    
    if not user_interests:
        return 0.5  # neutral for uninterested users
    
    intersection = user_interests & activity_tags
    union = user_interests | activity_tags
    
    return len(intersection) / len(union) if union else 0.0
```

Requires adding a `tags` column to activities:
```sql
ALTER TABLE activities ADD COLUMN tags TEXT[] DEFAULT '{}';
CREATE INDEX idx_activities_tags ON activities USING GIN(tags);
```

Seed activities get tags auto-generated from title + category:

| Activity | Tags |
|---|---|
| Nandi Hills Sunrise Trek | ["trekking", "outdoors", "sunrise", "nature", "hiking"] |
| Pottery + Chai at Lahe Lahe | ["pottery", "creativity", "art", "chai", "hands-on"] |
| Board Game Night | ["board_games", "strategy", "social", "indoor", "gaming"] |
| Sunday Morning Yoga | ["yoga", "meditation", "wellness", "morning", "outdoors"] |
| Koramangala Food Walk | ["food", "exploring", "street_food", "walking", "social"] |
| Midnight Chaos Bowling | ["bowling", "night", "social", "indoor", "fun"] |

#### Dimension 2: Location Score (25%)

```python
def location_score(user, activity) -> float:
    """1.0 if within 5km, linear decay to 0.0 at travel_radius_km."""
    if not (user.home_lat and user.home_lng and activity.lat and activity.lng):
        return 0.5  # neutral if location unknown
    
    dist = haversine_km(user.home_lat, user.home_lng, activity.lat, activity.lng)
    radius = user.travel_radius_km or 15
    
    if dist <= 5.0:
        return 1.0
    if dist >= radius:
        return 0.0
    
    return 1.0 - (dist - 5.0) / (radius - 5.0)
```

#### Dimension 3: Personality Fit (15%)

Category-to-personality ideal vector mapping (hand-crafted based on psychological profiles):

```python
CATEGORY_IDEAL_VECTORS = {
    "physical":    [0.90, 0.85, 0.50, 0.60, 0.50],  # high adventure, high energy
    "social_good": [0.40, 0.45, 0.85, 0.75, 0.80],  # high social, high conscientiousness
    "skill":       [0.40, 0.35, 0.55, 0.90, 0.70],  # high openness
    "mental":      [0.20, 0.20, 0.40, 0.85, 0.85],  # high openness, high conscientiousness
    "chaotic":     [0.85, 0.90, 0.85, 0.70, 0.25],  # low conscientiousness
    "explore":     [0.75, 0.55, 0.70, 0.85, 0.45],  # high adventure, high openness
    "slow":        [0.15, 0.15, 0.45, 0.55, 0.80],  # low adventure, low energy
}

def personality_fit(user, activity) -> float:
    """Cosine similarity between user vector and ideal vector for activity category."""
    if not user.personality_vector or len(user.personality_vector) != 5:
        return 0.5
    
    ideal = CATEGORY_IDEAL_VECTORS.get(activity.category)
    if not ideal:
        return 0.5
    
    return cosine_similarity_vecs(user.personality_vector, ideal)
```

#### Dimension 4: Social Proof (20%)

```python
async def social_proof(user, activity, db) -> float:
    """
    Ratio of similar users who joined this activity.
    Similar = personality_vector within 0.15 cosine distance.
    """
    # Get count of users who joined this activity
    join_count = await count_joins(activity.id, db)
    if join_count == 0:
        return 0.5  # neutral for new activities
    
    # Get count of similar users who joined
    similar_joins = await count_similar_joins(user, activity.id, db)
    
    return min(1.0, similar_joins / max(1, join_count))
```

### LLM-Generated Justification

After scoring, the top-3 recommendations get a one-line AI justification via NVIDIA Nemotron:

```python
async def generate_recommendation_reason(user, activity) -> str:
    prompt = (
        f"This user has interests: {user.interests}. Their vibe is {user.vibe}. "
        f"Personality: adventure={pv[0]}, energy={pv[1]}, social={pv[2]}, openness={pv[3]}, conscientiousness={pv[4]}. "
        f"Recommend this activity: '{activity.title}' ({activity.category}) in {activity.area}. "
        f"Give ONE compelling sentence under 100 chars explaining why it matches them."
    )
    result = await call_nvidia(prompt)
    return result.get("reason", "") if result else _fallback_reason(user, activity)

def _fallback_reason(user, activity) -> str:
    """Deterministic fallback when LLM unavailable."""
    shared = [i for i in (user.interests or []) if i in (activity.tags or [])]
    if shared:
        return f"Perfect for {', '.join(shared[:2])} enthusiasts like you"
    if user.vibe:
        return f"A {activity.category} experience suited for your {user.vibe} vibe"
    return f"Popular in {activity.area or 'your area'}"
```

### API Design

```
GET /api/v1/activities/recommended?limit=5
    → [
        {
          "activity": ActivityResponse,
          "score": 0.87,
          "ai_reason": "Your trekking passion meets the perfect sunrise — this was built for adventurous souls with high energy.",
          "score_breakdown": {
            "interest_match": 0.85,
            "location_score": 1.0,
            "personality_fit": 0.78,
            "social_proof": 0.90
          }
        },
        ...
      ]
```

### Performance Strategy

```
Caching:
  Redis: rec:{user_id}:{activity_id}:score   → Float, TTL=300s
  Redis: rec:{user_id}:top5                   → Sorted Set (score, activity_id), TTL=300s
  
Precomputation:
  - On activity status change → open: compute scores for all active users (background task)
  - On user onboarding complete: compute scores for all open activities (background task)
  - Lazy: compute on first request, cache result

For demo (20 users, 15 activities): trivial. All scores computed in <10ms.
For production: background worker computes recommendations on cron (every 5 min).
```

### Redis Key Additions

```
rec:{user_id}:{activity_id}       → String (JSON score breakdown, TTL=300)
rec:{user_id}:top5                → List (ordered activity IDs, TTL=300)
rec:{user_id}:reason:{activity_id} → String (ai_reason text, TTL=300)
```

### Frontend Design

#### New Page Section

Add "Recommended For You" horizontal scroll section at top of `/activities/page.tsx`:

```
┌─────────────────────────────────────────┐
│  Recommended For You                     │
│  ┌────────┐ ┌────────┐ ┌────────┐       │
│  │ Trek   │ │ Yoga   │ │ Food   │  ...  │
│  │ 97%    │ │ 89%    │ │ 82%    │       │
│  │ match  │ │ match  │ │ match  │       │
│  └────────┘ └────────┘ └────────┘       │
│  "Perfect for trekking enthusiasts..."   │
├─────────────────────────────────────────┤
│  All Activities                 [Filter] │
│  ...                                     │
```

#### New Component

```
components/activities/
├── recommended-carousel.tsx       # Horizontal scrollable curated cards
└── recommended-card.tsx           # Card with: cover, title, score badge, ai_reason, host info
```

The recommended card uses a green-to-red gradient badge for the match score (≥85% green, 70-84% yellow, <70% neutral).

### Activity Tags Column

```sql
ALTER TABLE activities ADD COLUMN tags TEXT[] DEFAULT '{}';
CREATE INDEX idx_activities_tags ON activities USING GIN(tags);
```

Update `Activity` model:
```python
tags: Mapped[list[str] | None] = mapped_column(ARRAY(Text), default=[])
```

Update seed data with tags (see table above).

### RecommendationService

```python
# New file: app/services/recommendations.py

import math
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from app.models.user import User
from app.models.activity import Activity
from app.models.user_history import UserHistory
from app.services.onboarding import call_nvidia

# Implements: interest_match(), location_score(), personality_fit(), social_proof()
# Implements: get_recommendations(user, db, limit=5) -> list[dict]
# Implements: generate_reason(user, activity) -> str
```

### Demo Scene: Recommendations (30s add-on)

After onboarding: "Priya doesn't browse — Wander recommends. Her personality vector (adventurous, high energy, social) meets the activity catalog. Nandi Hills Sunrise Trek lights up at 97% match. The AI reason: 'Your trekking passion meets the perfect sunrise — this was built for adventurous souls.' No scrolling. No algorithm feed. Just the best fit."

---

## Enhanced Feature: AI-Based Friend Matching

### Problem & Rationale

The CP-SAT matching engine optimizes *groups* for *activities*. But what about 1-on-1 connections? What about finding a compatible person to become actual friends with — beyond the 3-hour activity window?

Friend matching is the deepest AI demonstration. It proves the 5D personality vectors aren't just for group composition — they capture enough signal to predict interpersonal compatibility. This is the feature that answers "Where's the AI?" with a mic-drop.

**Hackathon impact:** The most technically impressive feature. Uses pgvector KNN search, multi-factor weighted scoring, vibe compatibility matrix, and LLM-generated compatibility explanations. Shows the personality vectors are meaningful, not random.

### Multi-Factor Compatibility Score

```
COMPATIBILITY(user_a, user_b) =
    0.35 * personality_similarity(user_a, user_b)      # Weighted cosine (existing scoring.py)
  + 0.30 * interest_overlap(user_a, user_b)            # Jaccard of interests
  + 0.10 * vibe_compatibility(user_a, user_b)          # Predefined vibe pairs
  + 0.15 * location_proximity(user_a, user_b)          # Haversine distance scaled
  + 0.10 * complementary_diversity(user_a, user_b)     # Bonus for complementary traits
```

#### Sub-dimension Details

**1. Personality Similarity (35%)** — Already implemented in `scoring.py:personality_similarity()`. Reuse directly.

**2. Interest Overlap (30%)**

```python
def interest_overlap(user_a, user_b) -> float:
    """Jaccard similarity of interest sets."""
    a = set(user_a.interests or [])
    b = set(user_b.interests or [])
    if not a and not b:
        return 0.0
    return len(a & b) / len(a | b)
```

**3. Vibe Compatibility Matrix (10%)**

```python
VIBE_COMPAT = {
    #        chill   balanced   energetic   curious   adventurous   creative
    "chill":        { "chill": 1.0, "balanced": 0.8, "energetic": 0.3, "curious": 0.6, "adventurous": 0.4, "creative": 0.7 },
    "balanced":     { "chill": 0.8, "balanced": 1.0, "energetic": 0.7, "curious": 0.8, "adventurous": 0.6, "creative": 0.7 },
    "energetic":    { "chill": 0.3, "balanced": 0.7, "energetic": 1.0, "curious": 0.6, "adventurous": 0.9, "creative": 0.5 },
    "curious":      { "chill": 0.6, "balanced": 0.8, "energetic": 0.6, "curious": 1.0, "adventurous": 0.8, "creative": 0.9 },
    "adventurous":  { "chill": 0.4, "balanced": 0.6, "energetic": 0.9, "curious": 0.8, "adventurous": 1.0, "creative": 0.6 },
    "creative":     { "chill": 0.7, "balanced": 0.7, "energetic": 0.5, "curious": 0.9, "adventurous": 0.6, "creative": 1.0 },
}

def vibe_compatibility(user_a, user_b) -> float:
    a_v = user_a.vibe or "balanced"
    b_v = user_b.vibe or "balanced"
    return VIBE_COMPAT.get(a_v, {}).get(b_v, 0.5)
```

**4. Location Proximity (15%)**

```python
def location_proximity(user_a, user_b) -> float:
    """1.0 if within 5km of each other, 0.0 if beyond combined travel radius."""
    if not all([user_a.home_lat, user_a.home_lng, user_b.home_lat, user_b.home_lng]):
        return 0.5
    
    dist = haversine_km(user_a.home_lat, user_a.home_lng, user_b.home_lat, user_b.home_lng)
    combined_radius = (user_a.travel_radius_km or 15) + (user_b.travel_radius_km or 15)
    
    if dist <= 5.0:
        return 1.0
    if dist >= combined_radius:
        return 0.0
    
    return 1.0 - (dist - 5.0) / (combined_radius - 5.0)
```

**5. Complementary Diversity (10%)**

Bonus for complementary pairs — people who are different but balanced. For example, high-energy adventurous paired with high-conscientiousness balanced makes great activity buddies.

```python
def complementary_diversity(user_a, user_b) -> float:
    """Reward complementary trait pairs. Not just similarity — balance matters."""
    if not (user_a.personality_vector and user_b.personality_vector):
        return 0.0
    pv_a, pv_b = user_a.personality_vector, user_b.personality_vector
    
    # Check for complementary patterns:
    # high adventure (a) + high conscientiousness (b) in the same pair
    # diverse openness + similar social level
    adv_diff = abs(pv_a[0] - pv_b[0])  # adventure difference
    con_diff = abs(pv_a[4] - pv_b[4])  # conscientiousness difference
    soc_diff = abs(pv_a[2] - pv_b[2])  # social difference
    
    # Score: reward moderate differences (not identical, not opposite)
    # Complementary sweet spot: adv_diff 0.2-0.5, con_diff 0.2-0.5, soc_diff < 0.3
    adv_score = 0.5 - abs(0.35 - adv_diff) / 0.35
    con_score = 0.5 - abs(0.35 - con_diff) / 0.35
    soc_score = 1.0 - soc_diff / 0.3
    
    return max(0.0, (adv_score * 0.35 + con_score * 0.35 + soc_score * 0.3))
```

### pgvector KNN Pipeline

The matching engine uses pgvector's IVFFlat index for efficient nearest-neighbor search:

```python
async def get_friend_suggestions(user: User, db: AsyncSession, limit: int = 10) -> list[dict]:
    """Complete friend suggestion pipeline."""
    
    # Step 1: pgvector KNN — get 50 nearest personality neighbors
    knn_query = text("""
        SELECT id, personality_vector, interests, vibe, home_lat, home_lng, travel_radius_km,
               personality_vector <=> :target_vector AS distance
        FROM users
        WHERE id != :user_id
          AND onboarding_completed = true
          AND verification_status = 'verified'
          AND city = :city
        ORDER BY personality_vector <=> :target_vector
        LIMIT 50
    """)
    
    result = await db.execute(knn_query, {
        "target_vector": str(user.personality_vector),
        "user_id": user.id,
        "city": user.city,
    })
    candidates = result.fetchall()
    
    # Step 2: Filter — exclude past meetings (90 days) and existing connections
    from datetime import datetime, timedelta
    cutoff = datetime.utcnow() - timedelta(days=90)
    
    # Get users already met
    met_query = select(UserHistory.other_user_id).where(
        UserHistory.user_id == user.id,
        UserHistory.met_at >= cutoff,
    )
    met_result = await db.execute(met_query)
    met_ids = {row[0] for row in met_result.fetchall()}
    
    # Get existing friend connections
    from app.models.friend_connection import FriendConnection
    conn_query = select(FriendConnection.friend_id).where(
        FriendConnection.user_id == user.id,
        FriendConnection.status.in_(["accepted", "pending"]),
    )
    conn_result = await db.execute(conn_query)
    connected_ids = {row[0] for row in conn_result.fetchall()}
    
    exclude_ids = met_ids | connected_ids
    
    # Step 3: Score each candidate
    scored = []
    for row in candidates:
        if row[0] in exclude_ids:
            continue
        
        candidate = await db.get(User, row[0])
        if not candidate:
            continue
        
        score = compatibility(user, candidate)
        scored.append({
            "user": candidate,
            "compatibility": round(min(1.0, score), 2),
            "shared_interests": list(set(user.interests or []) & set(candidate.interests or [])),
            "distance_km": round(haversine_km(
                user.home_lat or 0, user.home_lng or 0,
                candidate.home_lat or 0, candidate.home_lng or 0,
            ), 1),
            "personality_distance": float(row.distance),
        })
    
    # Step 4: Sort by compatibility, return top-N
    scored.sort(key=lambda x: x["compatibility"], reverse=True)
    top = scored[:limit]
    
    # Step 5: Generate AI reasons for top-3
    for item in top[:3]:
        item["ai_reason"] = await generate_friend_reason(user, item["user"], item["compatibility"])
    
    return top
```

### LLM-Generated Compatibility Explanation

```python
async def generate_friend_reason(user_a, user_b, score) -> str:
    prompt = (
        f"User A: interests={user_a.interests}, vibe={user_a.vibe}. "
        f"User B: interests={user_b.interests}, vibe={user_b.vibe}. "
        f"Compatibility score: {score:.0%}. "
        f"Shared interests: {list(set(user_a.interests or []) & set(user_b.interests or []))}. "
        f"Give ONE friendly sentence under 120 chars explaining why they'd be good friends."
    )
    result = await call_nvidia(prompt)
    if result and result.get("reason"):
        return result["reason"]
    # Fallback
    shared = list(set(user_a.interests or []) & set(user_b.interests or []))
    if shared:
        return f"You both love {shared[0]} — and you live nearby"
    if user_a.vibe == user_b.vibe:
        return f"Both {user_a.vibe} vibes — instant energy match"
    return f"Strong personality compatibility at {score:.0%}"
```

### Database Changes

#### New Tables

```sql
CREATE TABLE friend_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    friend_id UUID REFERENCES users(id) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',  -- pending | accepted | rejected
    compatibility_score NUMERIC(5, 4),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

CREATE INDEX idx_friend_conn_user ON friend_connections(user_id, status);
CREATE INDEX idx_friend_conn_friend ON friend_connections(friend_id, status);

CREATE TABLE user_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID REFERENCES users(id) NOT NULL,
    blocked_id UUID REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX idx_user_blocks_blocker ON user_blocks(blocker_id);
```

#### New ORM Models

```python
# app/models/friend_connection.py
class FriendConnection(Base):
    __tablename__ = "friend_connections"
    __table_args__ = (UniqueConstraint("user_id", "friend_id"),)
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    friend_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    compatibility_score: Mapped[float | None] = mapped_column(Float(precision=5))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# app/models/user_block.py
class UserBlock(Base):
    __tablename__ = "user_blocks"
    __table_args__ = (UniqueConstraint("blocker_id", "blocked_id"),)
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    blocker_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    blocked_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
```

### API Design

```
GET    /api/v1/friends/suggestions      → ?limit=10
                                          → [
                                              {
                                                "user": { id, name, vibe, interests, area },
                                                "compatibility": 0.92,
                                                "shared_interests": ["trekking", "photography"],
                                                "distance_km": 3.4,
                                                "ai_reason": "Both adventurers with a creative streak — and you live just 3km apart"
                                              },
                                              ...
                                            ]

POST   /api/v1/friends/request/:user_id  → { request_id, status: "pending" }
                                          Validations: not self, not already friend, not pending, not blocked.

GET    /api/v1/friends/requests           → [{ request_id, from_user: { id, name, vibe }, compatibility, created_at }]
                                          Incoming pending friend requests.

POST   /api/v1/friends/accept/:request_id → { connection: { friend_id, name, status: "accepted" } }

POST   /api/v1/friends/reject/:request_id → { request_id, status: "rejected" }

GET    /api/v1/friends                    → [{ friend_id, name, vibe, interests, compatibility_score, connected_at }]
                                          List of accepted friends.

DELETE /api/v1/friends/:friend_id         → { removed: true }
                                          Removes friend connection (both directions).

POST   /api/v1/friends/block/:user_id     → { blocked: true }
                                          Block a user. Removes any existing connection. Excludes from future suggestions.
```

### Frontend Design

#### New Pages

```
frontend/app/(app-shell)/
└── friends/
    ├── page.tsx                      # Friend suggestions (default tab)
    │                                 # Tabs: Suggestions | My Friends | Requests
    └── requests/
        └── page.tsx                  # Friend requests (incoming)
```

#### New Components

```
components/friends/
├── friend-suggestion-card.tsx        # Card: avatar, name, vibe badge, compatibility %, shared interests, ai_reason, "Connect" button
├── friend-list.tsx                   # List of accepted friends with vibe and area info
├── friend-request-card.tsx           # Incoming request: from_user info, Accept/Reject buttons
└── compatibility-badge.tsx           # Color-coded badge: ≥85% green, 70-84% yellow, <70% neutral
```

#### Navigation Changes

Add "Friends" tab to MobileTabBar and DesktopSidebar:

```typescript
// MobileTabBar — add to tabs
{ href: "/friends", label: "Friends", icon: HeartHandshake }

// DesktopSidebar — add to navItems
{ href: "/friends", label: "Friend Match", icon: HeartHandshake }
```

### Schemas

```python
# app/schemas/friend.py
class FriendSuggestionResponse(BaseModel):
    user: UserBriefResponse
    compatibility: float
    shared_interests: list[str]
    distance_km: float
    ai_reason: str | None = None

class FriendRequestResponse(BaseModel):
    id: uuid.UUID
    from_user: UserBriefResponse
    compatibility_score: float | None
    created_at: datetime

class FriendResponse(BaseModel):
    id: uuid.UUID
    friend: UserBriefResponse
    compatibility_score: float | None
    connected_at: datetime

class UserBriefResponse(BaseModel):
    id: uuid.UUID
    name: str | None
    vibe: str | None
    interests: list[str]
    home_area: str | None
    personality_vector: list[float] | None = None  # only visible to friends
```

### Friend Matching Service

```python
# New file: app/services/friend_matching.py

# Implements:
# - compatibility(user_a, user_b) -> float
# - get_suggestions(user, db, limit) -> list[dict]
# - generate_friend_reason(user_a, user_b, score) -> str
# - interest_overlap(a, b) -> float
# - vibe_compatibility(a, b) -> float  
# - location_proximity(a, b) -> float
# - complementary_diversity(a, b) -> float
# - haversine_km(lat1, lng1, lat2, lng2) -> float
```

### Redis Key Additions

```
friends:{user_id}:suggestions     → List (JSON array, TTL=600)
friends:{user_id}:requests        → Set (request IDs, TTL=300)
```

### pgvector Index Optimization

```sql
-- Create IVFFlat index for faster KNN search
-- Should be created after the table has data (at least 100 rows)
CREATE INDEX idx_users_personality_ivfflat
    ON users
    USING ivfflat (personality_vector vector_cosine_ops)
    WITH (lists = 10);

-- Fallback: exact nearest neighbor scan (works even without index)
-- SELECT ... ORDER BY personality_vector <=> :target_vector LIMIT 50
```

For demo with 20 users: IVFFlat index is overkill. Exact KNN via `<=>` operator is instant (< 1ms). The index is prepped but not created in migration (requires data to exist first).

### Demo Scene: Friend Matching (45s add-on)

After the Communities scene: "And when Priya wants to find *her people* — the AI knows. It scans 20 personality vectors via pgvector KNN, scores 4 compatibility dimensions, and surfaces 3 people she'd truly click with. Rahul at 92% — both adventurers, both trekkers, both in Indiranagar. One tap sends a friend request. This isn't matching for an activity. This is matching for life."

---

## Updated Architecture Diagram (Data Layer)

```
┌──────────────────────┴───────────────────────────────────┐
│                    DATA LAYER                                │
│                                                             │
│  PostgreSQL + pgvector                                      │
│  ├── users (personality_vector VECTOR(5))                   │
│  ├── activities (tags TEXT[], recommendations)              │
│  ├── groups (group_type, interest_tags for communities)     │
│  ├── group_members, chat_messages                           │
│  ├── sos_events, hosts, venues, user_history                │
│  ├── friend_connections (NEW)                               │
│  ├── user_blocks (NEW)                                      │
│  └── Indexes: IVFFlat on personality_vector, GIN on tags    │
│                                                             │
│  Redis                                                      │
│  ├── chat:{group_id}:messages  (Sorted Set, community=noTTL)│
│  ├── match:{activity_id}:*     (matching progress/result)   │
│  ├── rec:{user_id}:*           (recommendations + reasons)  │
│  ├── friends:{user_id}:*       (suggestions + requests)     │
│  ├── community:{id}:*          (member set + meta cache)    │
│  ├── ws:user:{id} / ws:group:{id}                           │
│  ├── sos:{sos_id}:status       (Hash, ephemeral)            │
│  ├── location:{group_id}:{user} (Hash, short TTL)           │
│  └── ratelimit:{user}:{endpoint} (Counter, short TTL)       │
│                                                             │
│  External APIs                                              │
│  ├── Supabase Auth (phone OTP)                              │
│  ├── Google Maps (Distance Matrix, Geocoding, Places)       │
│  ├── NVIDIA Nemotron (personality, rec reasons, friend)     │
│  └── Twilio (SMS fallback for SOS alerts)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Updated API Reference (New Endpoints)

### Communities

```
GET    /api/v1/communities              → ?interest=&cursor=&limit=10
                                          → PaginatedResponse[CommunityResponse]
                                          Browse by interest tag, sorted by member count

GET    /api/v1/communities/suggested    → ?limit=5 → List of communities matching user interests  
GET    /api/v1/communities/:id          → CommunityResponse with members + is_member flag
POST   /api/v1/communities              → { name, interest_tags, description, rules? } → CommunityResponse
POST   /api/v1/communities/:id/join     → { joined: true, member_count: N }
POST   /api/v1/communities/:id/leave    → { left: true, member_count: N }
GET    /api/v1/communities/:id/chat/history → Paginated chat messages (persistent, no TTL)
DELETE /api/v1/communities/:id          → { deleted: true }  (founder/admin only)
```

### Recommendations

```
GET    /api/v1/activities/recommended   → ?limit=5
                                          → [
                                              {
                                                "activity": ActivityResponse,
                                                "score": 0.92,
                                                "ai_reason": "Your trekking passion meets the perfect sunrise...",
                                                "score_breakdown": { interest_match, location_score, personality_fit, social_proof }
                                              },
                                              ...
                                            ]
```

### Friends

```
GET    /api/v1/friends/suggestions      → ?limit=10
                                          → [FriendSuggestionResponse]  (compatibility, shared_interests, ai_reason)

POST   /api/v1/friends/request/:user_id → { request_id, status: "pending" }
GET    /api/v1/friends/requests         → [FriendRequestResponse]  (incoming pending)
POST   /api/v1/friends/accept/:request_id → { connection: { friend_id, status: "accepted" } }
POST   /api/v1/friends/reject/:request_id → { request_id, status: "rejected" }
GET    /api/v1/friends                  → [FriendResponse]  (accepted friends)
DELETE /api/v1/friends/:friend_id       → { removed: true }
POST   /api/v1/friends/block/:user_id   → { blocked: true }
```

---

## Updated Project Structure

### Backend New/Changed Files

```
backend/app/
├── api/v1/
│   ├── communities.py          # NEW — community CRUD + join/leave
│   ├── friends.py              # NEW — suggestions, requests, connections, blocks
│   └── activities.py           # CHANGED — add recommended query param
├── models/
│   ├── group.py                # CHANGED — add community columns
│   ├── activity.py             # CHANGED — add tags column
│   ├── friend_connection.py    # NEW — FriendConnection ORM
│   └── user_block.py           # NEW — UserBlock ORM
├── schemas/
│   ├── community.py            # NEW — CommunityResponse, CreateCommunityRequest
│   ├── friend.py               # NEW — FriendSuggestion, FriendRequest, FriendResponse
│   └── activity.py             # CHANGED — add ActivityRecommendationResponse
├── services/
│   ├── recommendations.py      # NEW — scoring engine + LLM reasons
│   └── friend_matching.py      # NEW — compatibility scoring + KNN pipeline
├── alembic/versions/
│   └── 20240507_enhanced_features.py  # NEW — columns + new tables
└── scripts/seed.py             # CHANGED — add community seed + activity tags
```

### Frontend New/Changed Files

```
frontend/
├── app/(app-shell)/
│   ├── communities/            # NEW — community discovery + detail
│   │   ├── page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── chat/page.tsx
│   ├── friends/                # NEW — suggestions + my friends + requests
│   │   ├── page.tsx
│   │   └── requests/page.tsx
│   └── activities/
│       └── page.tsx            # CHANGED — add recommended section
├── components/
│   ├── communities/            # NEW
│   │   ├── community-card.tsx
│   │   ├── community-feed.tsx
│   │   ├── community-detail.tsx
│   │   └── create-community-form.tsx
│   ├── friends/                # NEW
│   │   ├── friend-suggestion-card.tsx
│   │   ├── friend-list.tsx
│   │   └── friend-request-card.tsx
│   └── activities/
│       ├── recommended-carousel.tsx  # NEW
│       └── recommended-card.tsx      # NEW
├── components/layout/
│   ├── mobile-tab-bar.tsx      # CHANGED — add Communities + Friends tabs
│   └── desktop-sidebar.tsx     # CHANGED — add Communities + Friend Match nav items
├── lib/
│   ├── query-keys.ts           # CHANGED — add communities + friends keys
│   └── constants.ts            # CHANGED — add INTEREST_TAGS, VIBE_OPTIONS
├── hooks/
│   └── use-friend-matching.ts  # NEW — fetch suggestions, send/accept requests
└── stores/
    └── ui-store.ts             # CHANGED — add community filter state
```

---

## Updated State Management

### New Query Keys

```typescript
const queryKeys = {
  // ... existing keys ...
  
  communities: {
    all:       ['communities'] as const,
    list:      (filters: { interest?: string }) => ['communities', 'list', filters] as const,
    detail:    (id: string) => ['communities', 'detail', id] as const,
    suggested: ['communities', 'suggested'] as const,
    members:   (id: string) => ['communities', 'members', id] as const,
  } as const,
  
  friends: {
    suggestions: ['friends', 'suggestions'] as const,
    requests:    ['friends', 'requests'] as const,
    list:        ['friends', 'list'] as const,
  } as const,
  
  recommendations: {
    forUser: ['recommendations', 'user'] as const,
  } as const,
};
```

---

## Updated 24-Hour Build Strategy

### Phase 2.5: Enhanced Features (Insert between Phase 2 and Phase 3)

**Priority ordering and timing within 24 hours:**

All three features are designed to be built **incrementally on top of existing infrastructure** — not from scratch.

| # | Feature | Build Time | Dependencies | Demo Scene |
|---|---|---|---|---|
| 1 | Interest-Based Communities | ~90 min | Groups table, GroupMember, chat WebSocket | 45s demo add-on |
| 2 | AI Friend Matching | ~75 min | Personality vectors, pgvector, scoring.py | 45s demo add-on |
| 3 | Event Recommendations | ~60 min | Activity tags, User model, LLM onboarding | 30s demo add-on |

**Build order rationale:**
1. Communities first — extends existing Group infrastructure, adds 2-3 API endpoints
2. Friend matching second — most technically impressive, heavy reuse of scoring infrastructure
3. Recommendations last — lower priority, simpler implementation, great polish item

### Implementation Checklist

#### Communities (90 min)
- [ ] Add migration: group columns (group_type, interest_tags, description, etc.) + index
- [ ] Update Group model with new columns
- [ ] Create `/api/v1/communities` router with 7 endpoints
- [ ] Create Community schemas
- [ ] Create `/communities` page — discovery feed with interest filter
- [ ] Create `/communities/:id` page — detail + member list
- [ ] Create `/communities/:id/chat` — reuse chat window component
- [ ] Add Communities tab to MobileTabBar + DesktopSidebar
- [ ] Seed 5 communities (Weekend Trekkers, Board Gamers, Yoga Circle, etc.)
- [ ] Test: join, chat, leave, discovery

#### Friend Matching (75 min)
- [ ] Add migration: friend_connections + user_blocks tables
- [ ] Create FriendConnection + UserBlock ORM models
- [ ] Implement `compatibility()` scoring function in `services/friend_matching.py`
- [ ] Implement KNN pipeline with pgvector `<->` operator
- [ ] Implement LLM friend reason generation
- [ ] Create `/api/v1/friends` router with 9 endpoints
- [ ] Create Friend schemas
- [ ] Create `/friends` page — suggestions tab + my friends tab
- [ ] Create `/friends/requests` page — incoming requests
- [ ] Add Friend Match tab to MobileTabBar + DesktopSidebar
- [ ] Seed: pre-compute compatibility for demo persona Priya
- [ ] Test: suggestions accuracy, request/accept flow

#### Recommendations (60 min)
- [ ] Add migration: activities.tags column
- [ ] Update Activity model with tags column
- [ ] Implement `get_recommendations()` in `services/recommendations.py`
- [ ] Implement 4 scoring dimensions (interest, location, personality, social)
- [ ] Implement LLM reason generation for top-3 recommendations
- [ ] Add `/api/v1/activities/recommended` endpoint
- [ ] Create RecommendedCarousel + RecommendedCard components
- [ ] Integrate into `/activities` page at top
- [ ] Update seed data: add tags to all 15 activities
- [ ] Cache in Redis (rec:{user_id}:*)
- [ ] Test: score accuracy, caching, LLM fallback

---

## Updated Dependencies & Sequencing

```
Phase 1: Foundation (Hour 0-4)
  └── DB schema + Auth + Project setup
       └── Includes 2 new tables (friend_connections, user_blocks)
       └── Includes 4 new columns (groups, activities)

Phase 2: Core Backend (Hour 4-10)
  ├── Activity API ── parallel with ──→ Matching Engine + Recommendations Engine
  ├── Group API + Community API ── built together (shared model)
  └── Friend API ── depends on personality vectors (already stored in DB)

Phase 3: AI Onboarding (Hour 10-14)
  └── LLM integration (also serves rec reasons + friend matching reasons)

Phase 4: Real-Time Features (Hour 14-20)
  ├── Community chat (persistent variant of activity chat)
  └── Friend request notifications (Toaster, not full push)

Phase 5: Frontend Polish (Hour 20-22)
  ├── Communities pages (discovery, detail, chat, create form)
  ├── Friend pages (suggestions, friends, requests)
  ├── Recommendations (carousel + cards on activities page)
  └── Updated navigation (5 or 6 tabs)

Phase 6: Seed + Rehearsal (Hour 22-24)
  └── Seed: 5 communities, 20 users with compatibility scores, 15 activities with tags
  └── Rehearse new demo scenes (communities, friends, recommendations)
```

---

## Updated Scope Exclusions

- Complete venue management (seeded venue data) — unchanged
- User-created activities (15-20 seeded Bangalore activities) — unchanged
- Push notifications (Web Push API for reminder only in demo) — friend requests use in-app Toaster
- Video/voice calling — unchanged
- Community content posts / feed (for demo: chat only)
- Real-time friend request push notifications (polling OK for demo)
- External event integration (Meetup, Eventbrite) — beyond hackathon scope
- Recommendation engine A/B testing or ML training — static scoring for demo
- Friend matching collaborative filtering from interaction data — needs training data
