# 🌍 Wander

> **We don't have a technology problem. We have a belonging problem.**

The most connected generation in history is the loneliest. Friend groups have been reduced to WhatsApp chats. Hanging out has become sharing reels. We spend hours scrolling on screens but still don't know who to grab a coffee with on a Saturday evening. 

**Wander** is an AI-powered platform designed to fix exactly this. It takes strangers from the same city, forms AI-optimized small groups, gives them a real activity to do together—and gets out of the way so the rest can happen naturally.

It’s not a dating app. It’s not an event directory. It’s not another feed to scroll infinitely. It’s a tool to manufacture real-world belonging.

---

## 💡 What It Actually Does

Instead of swiping on profiles or joining massive 50-person meetups (where nobody talks to each other), Wander uses AI to curate the perfect group chemistry:

1. **The Vibe Check (AI Onboarding):** Instead of filling out boring forms, you chat with our AI to figure out your personality, interests, and general "vibe".
2. **Pick an Activity:** Browse curated, real-world activities happening in your city (e.g., Pottery making, Go-Karting, Board Game cafes).
3. **Smart Matching:** Our AI engine groups you with 4-8 strangers who actually match your energy, optimizing for better group dynamics instead of random chaos.
4. **Ephemeral Chat:** The group chat only opens 2 days before the event, and deletes itself completely a few days after. No friend counts, no lingering notifications, no social media addiction—just real connections.
5. **Rock-Solid Safety:** Government-verified IDs (DigiLocker integration) so you know exactly who you are meeting, plus an SOS emergency system that acts in under 3 seconds.

## 🛠️ The Tech Under the Hood

We built Wander to prove that algorithms can be used to bring people together in real life, rather than hijack their attention span.

- **Frontend:** Next.js 14, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend:** FastAPI (Python 3.11+), SQLAlchemy 2.0
- **The Brains (Matching Engine):** LLMs for personality extraction, vector similarity (pgvector), and a Constraint Programming solver (CP-SAT) to enforce optimal group dimensions (age limits, gender ratios, personality synergy).

## 🚀 Running It Locally

If you want to spin the whole project up locally, you'll need two terminals:

### 1. Backend (FastAPI)
```bash
cd src/backend
uv venv
uv sync
uvicorn app.main:app --reload
```

### 2. Frontend (Next.js)
```bash
cd src/frontend
npm install
npm run dev
```

---

## 🎯 Built for Hackverse-2k26

Created during the 24-hour **Hackverse-2k26** hackathon (May 7-8, 2026) for the **AI for Social Impact** domain. 

*Because algorithms need to stop being selfish and actually start helping people.*