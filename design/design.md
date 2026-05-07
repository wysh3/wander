# Wander App UI Mockup Specifications

Here is every screen in the app required for mockups, organized by flow with context and layout.

---

## 1. Auth Flow

| # | Screen | Context & Layout |
|:---|:---|:---|
| 1 | **Signup — Phone Entry** | Full-screen gradient (teal fade). Centered card with "Wander" title, "Go outside." subtitle, +91 prefix phone input, "Send OTP" button. No nav bars. |
| 2 | **Signup — OTP Entry** | Same gradient. 6-digit OTP input (large, centered, tracking-widest). "Verify OTP" button. "Change phone number?" link. |
| 3 | **Verification** | Centered card with shield icon. Title "Verify Your Identity". Two buttons: "Verify with DigiLocker" (outline), "Verify with Aadhaar OTP" (secondary). Loading spinner state on tap. |

---

## 2. Onboarding Flow (3-step wizard)

| # | Screen | Context & Layout |
|:---|:---|:---|
| 4 | **Onboarding Step 1 — Interests** | Header bar with "Profile Setup" + "3 questions to get started". Progress bar (33%). 2×3 grid of toggle buttons: Outdoors / Creative / Social / Fitness / Learning / Food & Drink. Bottom: "Next" button. Back not shown on step 1. |
| 5 | **Onboarding Step 2 — Energy Level** | Same header, progress at 66%. 3 radio-style cards: "High Energy" (always moving), "Balanced" (up for anything), "Chill" (relaxed). Back + Next buttons bottom. |
| 6 | **Onboarding Step 3 — Availability** | Same header, progress at 100%. Multi-select pills: Weekends / Weekday Evenings / Weekday Mornings / Afternoons. Back + "Finish" button. |

---

## 3. Main App (App Shell with Mobile Tab Bar / Desktop Sidebar)

| # | Screen | Context & Layout |
|:---|:---|:---|
| 7 | **Activity Feed (Discover)** | Title: "Discover", subtitle "No algorithm feed. No infinite scroll." Horizontally scrollable category filter pills (All / Physical / Social Good / Skill / Mental / Chaotic / Explore / Slow). Responsive grid (1/2/3 cols) of activity cards. Each card: gradient hero with emoji + category badge + "Phone-Free Zone" green badge + title + date/area/people metadata. |
| 8 | **Activity Detail** | Gradient hero banner (emoji). Category badge. Title, description. 2×2 info grid: scheduled datetime / duration / area / group size. Full-width "I'm In — Find My Group" CTA button. |
| 9 | **Matching Engine** | Title: "AI Matching Engine", subtitle about CP-SAT solver. 4 animated phase steps: Filtering → Constraints → Solving → Done. SVG progress ring with percentage. On completion: 2×2 constraint stats grid (Personality Similarity %, Repeat Pairs Avoided, Women-Only Groups, Hosts Assigned). Group result cards with match scores and member name pills. |
| 10 | **Groups List** | Title "Your Groups" with count. List of group cards: activity title, member count, status badge, chevron arrow. Empty state: Users icon + "No groups yet". |
| 11 | **Group Detail** | Card with activity title + match score badge. Calendar date/time. Host section (gradient avatar initial, name, "Wander Host" label, star rating). Members list (avatar initials, names, role badges). Full-width "Open Group Chat" button. |
| 12 | **Group Chat** | Full-height chat. Top bar: countdown timer (days/hours) + "Chat disappears — take the conversation outside" line + connection status ("Connecting..." when offline). Message bubbles: own messages right-aligned (primary bg), others left-aligned (muted bg, name label). Input bar: text field + send icon button. |
| 13 | **SOS (Idle State)** | Title "Emergency SOS", subtitle "Hold for 2 seconds". Large red circular button (192px) with conic gradient progress ring + siren icon. Label: "Hold 2s for SOS". |
| 14 | **SOS (Active State)** | Same button fully red with pulsing siren. Active SOS card: "SOS Active", Nandi Hills location placeholder, police station info, "Cancel SOS (False Alarm)" button. Below: simulated emergency contact alert card (user name, lat/lng, police station, host info, "Call User" + "Navigate" buttons). |
| 15 | **Wander Report** | Header: "AI-Generated Wander Report" + user name + tagline. Screen Time Reduction hero card (green gradient, big %). 2×2 stat grid: Experiences / People Met / Neighborhoods / Streak (each with icon + number). Badges row (rounded pills). Inspirational blockquote footer. |
| 16 | **Host Dashboard** | Title "Host Dashboard", subtitle "Your hosted experiences". 2-column stat cards: "Experiences Hosted" count, "Rating" average. "Upcoming Groups" section with list items or empty state. |

---

## 4. Layout References (for context)

| # | Screen | Context & Layout |
|:---|:---|:---|
| 17 | **Desktop Layout** | Full desktop viewport. Left sidebar (256px, fixed): Wander logo, 5 nav links (Discover/Users/Report/Emergency/Host with icons). Main content area on right. |
| 18 | **Mobile Layout** | Full mobile viewport. Main content with safe-area padding top. Fixed bottom tab bar (4 tabs: Discover/Groups/Report/SOS with icons, active tab highlighted). Safe area bottom for home indicator. |

---

**Total:** 18 screens (2 auth + 3 onboarding + 12 main app + 2 layout references)

**Instructions:**
To use with your vision LLM: paste these descriptions + generate mockups for each, then replace the existing components with the new shadcn/ui-styled versions. The key screens for judge impact are:
*   **#9 (Matching Engine)** — showstopper, constraint stats animation
*   **#12 (Group Chat)** — countdown timer + ephemeral feel
*   **#14 (SOS Active)** — dramatic red alert with dual-view
*   **#15 (Wander Report)** — screen time headline, green gradient
