# Kids Class Planner

A zero-friction Progressive Web App that turns chaotic WhatsApp school messages into structured Google Calendar events — automatically, for each of your kids.

---

## The Problem

Class teachers send schedules, test dates, and activity reminders through WhatsApp groups. These messages get buried in noisy chats. They're unstructured, often multilingual (English, Malayalam, Hindi), and use relative dates like *"coming Friday"* or *"day after tomorrow"*. Important events get missed.

## The Solution

A self-hosted PWA that plugs directly into your phone's **Share Menu**. Long-press any WhatsApp message → tap "Kids Planner" → review the AI-extracted events → add them to Google Calendar in two taps. No copy-paste. No third-party automation tools. No monthly subscription.

```
WhatsApp message
      ↓  (Android Share / paste on desktop)
  Kids Planner PWA
      ↓  (Gemini 2.5 Flash)
  Extracted events (title, date, subject, type)
      ↓  (Google Calendar API)
  Annabel's School 🟣  /  Adam's School 🔵
```

---

## Features

- **Android Share Menu integration** — share directly from WhatsApp without leaving the app
- **AI-powered extraction** — Gemini 2.5 Flash understands English, Malayalam, and Hindi
- **Relative date resolution** — "tomorrow", "coming Friday", "next Monday" all resolved correctly
- **Multi-child support** — separate colour-coded Google Calendars per child
- **Review before saving** — edit titles, dates, or kid assignment before it hits the calendar
- **Desktop / iPhone** — paste messages manually; full PWA for iPhone Add-to-Home-Screen
- **$0/month** — Vercel free tier + Gemini free tier + Upstash free tier

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Hosting | Vercel Free |
| Auth | Auth.js v5 — Google OAuth with offline access |
| AI | Google Gemini 2.5 Flash API |
| Calendar | Google Calendar API v3 |
| Storage | Upstash Redis — OAuth tokens + kid profiles |
| PWA | `@ducanh2912/next-pwa` + Web Share Target API |

---

## Architecture

```
Browser/Android
    │
    ├── POST /api/share  ← Android Share Target (multipart/form-data)
    │       └── store text in Redis (10 min TTL) → redirect /review?token=…
    │
    ├── POST /api/extract  ← Gemini 2.5 Flash
    │       └── returns structured JSON events with resolved absolute dates
    │
    └── POST /api/calendar/events  ← Google Calendar API v3
            └── inserts all-day events into the child's calendar
```

---

## Prerequisites

You need accounts/credentials from **three Google services** before deploying. They live in different places — don't mix them up.

### 1. Google Cloud Console — OAuth + Calendar API

Go to [console.cloud.google.com](https://console.cloud.google.com)

1. **Create a project** → name it "Kids Class Planner"
2. **APIs & Services → Enable APIs** → search and enable: **Google Calendar API**
3. **APIs & Services → OAuth consent screen**
   - User type: External
   - App name: Kids Class Planner
   - Add your own Gmail as a **Test User** (keeps the app in testing mode — no Google review needed)
4. **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized redirect URIs — add both:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://YOUR-APP.vercel.app/api/auth/callback/google` *(add after first deploy)*
5. Copy **Client ID** and **Client Secret**

### 2. Google AI Studio — Gemini API Key

Go to [aistudio.google.com](https://aistudio.google.com)

1. Click **Get API key** → Create API key
2. Free tier: **1,500 requests/day** on Gemini 2.5 Flash — more than enough for personal use
3. Copy the **API Key**

### 3. Upstash Redis — Token Storage

Go to [upstash.com](https://upstash.com)

1. Sign up (free), create a **Redis** database
2. Choose a region close to you (e.g. `ap-south-1` for India)
3. Copy the **REST URL** and **REST Token**
4. Free tier: 10,000 commands/day, 256 MB — zero cost for personal use

---

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in all values:

| Variable | Where to get it |
|---|---|
| `AUTH_SECRET` | Run: `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` | Google Cloud Console → Credentials |
| `AUTH_GOOGLE_SECRET` | Google Cloud Console → Credentials |
| `AUTH_TRUST_HOST` | Set to `true` |
| `UPSTASH_REDIS_REST_URL` | Upstash dashboard |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash dashboard |
| `GEMINI_API_KEY` | Google AI Studio |
| `NEXTAUTH_URL` | `http://localhost:3000` locally, your Vercel URL in production |

---

## Local Development

```bash
git clone https://github.com/YOUR-USERNAME/kids-class-planner.git
cd kids-class-planner
npm install
cp .env.local.example .env.local
# Fill in .env.local with your credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploying to Vercel

**Step 1 — Push to GitHub**
```bash
git init && git add . && git commit -m "initial"
# Create a repo on github.com, then:
git remote add origin https://github.com/YOUR-USERNAME/kids-class-planner.git
git push -u origin main
```

**Step 2 — Import on Vercel**
1. Go to [vercel.com](https://vercel.com) → New Project → Import your GitHub repo
2. Framework: **Next.js** (auto-detected)
3. Add all environment variables from the table above
4. Click **Deploy** (~2 minutes)

**Step 3 — Update Google OAuth redirect URI**
1. Copy your Vercel URL (e.g. `https://kids-class-planner.vercel.app`)
2. Go back to Google Cloud Console → Credentials → edit your OAuth 2.0 client
3. Add: `https://YOUR-APP.vercel.app/api/auth/callback/google`
4. Also update `NEXTAUTH_URL` in Vercel environment variables

---

## Installing as PWA on Android

The Share Menu integration only works when the app is installed as a PWA.

1. Open Chrome on Android, navigate to your app URL
2. Tap the **⋮ menu** → **Add to Home Screen**
3. Confirm — "Kids Planner" now appears on your home screen
4. Open the installed app once (so the browser registers the Share Target)
5. Go to WhatsApp → long-press a message → **Share** → **Kids Planner** ✓

---

## Day-to-Day Usage

### Android (two taps after share)
1. Long-press a WhatsApp message → Share → **Kids Planner**
2. Tap **whose class it's for** (Annabel / Adam)
3. Gemini extracts events (spinner, ~2 seconds)
4. Review and edit if needed → **Add to Calendar**

### Desktop / iPhone
1. Open the app → paste the message → select the child → **Extract & Schedule Events**
2. Review events → **Add to Calendar**

### First-time setup
1. Sign in with Google → authorise Calendar access
2. Go to **Setup** → add each child, pick a colour → **Create Calendar**
3. Two colour-coded calendars appear in Google Calendar automatically

---

## Self-Hosting (Alternative to Vercel)

The app is a standard Next.js server. You can run it anywhere Node.js runs:

```bash
npm run build
npm run start  # Listens on port 3000
```

Behind an nginx reverse proxy, or on a GCP Cloud Run container, or an Oracle Cloud ARM VM — it works the same way. Just set all the environment variables.

---

## Project Structure

```
kids-class-planner/
├── app/
│   ├── page.tsx              # Home — sign-in or share input
│   ├── HomeClient.tsx        # Client: textarea + kid selector
│   ├── setup/page.tsx        # Onboarding — create kid calendars
│   ├── review/
│   │   ├── page.tsx          # Server: fetch pending text + kids
│   │   └── ReviewClient.tsx  # Client: kid picker → events → save
│   ├── kids/
│   │   ├── page.tsx          # Server: fetch kids
│   │   └── KidsClient.tsx    # Client: list + remove
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── share/route.ts    # Android Share Target (POST multipart)
│       ├── extract/route.ts  # Gemini extraction
│       ├── kids/route.ts     # GET/DELETE kids
│       └── calendar/
│           ├── create/route.ts   # Create Google Calendar per kid
│           └── events/route.ts   # Insert events
├── components/
│   ├── Header.tsx            # Nav with user avatar + My Kids link
│   ├── KidSelector.tsx       # Pill buttons (small) or full-width (large/Android)
│   └── EventCard.tsx         # Editable event tile
└── lib/
    ├── auth.ts               # Auth.js v5 config + token refresh
    ├── gemini.ts             # Gemini 2.5 Flash extraction
    ├── google-calendar.ts    # Calendar API helpers
    ├── redis.ts              # Upstash client + kid profile CRUD
    └── colors.ts             # Kid color palette
```

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for fork setup instructions, local development, and PR guidelines.

---

## License

MIT
