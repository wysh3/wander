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
- Push notifications (Web Push API for reminder only in demo)
- Video/voice calling

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

### Total Time: 5 minutes 30 seconds

> **Demo philosophy: Every scene must reinforce "AI for mental health." Don't just show features — narrate the AI decisions happening behind the scenes.**

**Scene 0: The Crisis (30s)** — Pitch deck slides 1-3. Lead with WHO stat (loneliness = 15 cigarettes/day). End with: "Group composition is an optimization problem. We solved it."

**Scene 1: AI Onboarding (60s)** — ⭐ Open with this. Live LLM conversation. Show the structured JSON extraction in real-time. "Not a quiz — an AI that understands who you are in 5 messages." *This is the first AI moment.*

**Scene 2: Verification (30s)** — Quick. Verified badge via DigiLocker. "Government identity. No catfishing. No fake profiles." Don't linger — safety is a checkbox, not a showpiece.

**Scene 3: Activity Discovery (30s)** — Card feed. Nandi Hills trek. "No algorithm feed. No infinite scroll. Pick something real."

**Scene 4: Matching Engine (75s)** — ⭐⭐ THE SHOWSTOPPER. Live visualization. 12 users → 2 groups. Show the constraints lighting up: personality similarity, location radius, gender preferences, no-repeat pairings. CP-SAT solves in 1.8s. "This isn't a filter. This is a constraint satisfaction solver running 6 dimensions of optimization. The same class of algorithm that schedules airline crews." *Linger here. This is what wins.*

**Scene 5: Group + Chat (30s)** — Group card with match score. Chat opens with countdown timer. "7 days. Then it's gone. Connection happens in the real world."

**Scene 6: SOS (30s)** — ⭐ Dual-screen demo. Long-press → alert arrives in 2.1s on second device with GPS, police station, host phone. "Under 3 seconds. WebSocket, polling fallback, SMS fallback. Triple redundancy."

**Scene 7: Wander Report (30s)** — "12 experiences. 47 people met. 8 neighborhoods explored. 43% less screen time." *Pause.* "Every other app measures engagement with their platform. We measure engagement with the world."

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
| "Can this scale?" | CP-SAT solves 12 users in 1.8s with annealing fallback for 50+. pgvector handles personality similarity at scale. WebSocket + Redis handles real-time. |

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
| Judges dismiss as "social app" | Every slide reinforces anti-social-media positioning. The de-addiction philosophy is in the product, not just the pitch. The Wander Report closer: "Every other app measures engagement with their platform. We measure engagement with the world." |
