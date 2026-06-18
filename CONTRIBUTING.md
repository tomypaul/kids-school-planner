# Contributing to Kids Class Planner

Thanks for forking or contributing! This document covers everything you need to run your own instance or submit a PR.

---

## Fork Prerequisites

**Each fork requires its own credentials.** The app does not share API keys or OAuth tokens between deployments.

You need to set up three things independently:

### 1. Your own Google Cloud project
- Go to [console.cloud.google.com](https://console.cloud.google.com)
- Create a **new project** (don't reuse someone else's)
- Enable **Google Calendar API** for your project
- Create an **OAuth 2.0 Client ID** (Web application type)
- Add your redirect URIs (localhost + your deployed domain)
- Set **OAuth consent screen** to External; add your email as a test user

> **Why?** Each deployment needs its own OAuth client to manage its own redirect URIs and user consent. Sharing a client causes redirect URI mismatches.

### 2. Your own Gemini API key
- Go to [aistudio.google.com](https://aistudio.google.com) → Get API key
- Free tier: 1,500 requests/day on Gemini 2.5 Flash

> **Why?** API keys are rate-limited per key. Using someone else's key depletes their quota.

### 3. Your own Upstash Redis instance
- Go to [upstash.com](https://upstash.com) → Create a free Redis database
- Copy the REST URL and REST Token

> **Why?** Redis stores OAuth refresh tokens (user credentials). Each deployment must be isolated for security.

---

## Local Development Setup

```bash
# 1. Fork and clone
git clone https://github.com/YOUR-USERNAME/kids-class-planner.git
cd kids-class-planner

# 2. Install dependencies
npm install

# 3. Copy and fill the env template
cp .env.local.example .env.local
# Open .env.local and fill in your credentials

# 4. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## `.env.local.example`

The repo includes `.env.local.example` listing every variable the app needs. Never commit `.env.local` itself — it's in `.gitignore`. If you add a new environment variable, add it to `.env.local.example` with an empty value and a comment explaining where to get it.

---

## Testing Checklist

Before opening a PR, manually verify:

- [ ] Sign in with Google — OAuth flow completes, no error
- [ ] `/setup` — add a child, confirm Google Calendar appears in Google Calendar
- [ ] Home page — paste a test message with relative dates, click Extract
- [ ] Review page — events appear with correct resolved dates, kid assignment correct
- [ ] Edit a title and date on the review page — changes are preserved on save
- [ ] "Add to Calendar" — events appear in the correct child's calendar
- [ ] On Android (if applicable): install as PWA, share a message, confirm kid picker appears

**Test message with relative dates (paste this on the home page):**
```
Dear parents, tomorrow there is a Maths test for chapter 5.
Please send the EVS project by coming Friday.
Next Monday is a holiday.
Activity day is day after tomorrow, children should wear house colours.
```

---

## Submitting a PR

1. Create a feature branch: `git checkout -b feature/my-change`
2. Make your changes
3. Run `npx tsc --noEmit` — must pass with zero errors
4. Run `npm run build` — must complete successfully
5. Complete the testing checklist above
6. Open a PR with:
   - A short description of what changed and why
   - Screenshots if it's a UI change
   - Notes on any new environment variables added

---

## Architecture Notes

- **Server components** handle auth checks and initial data fetching (Redis, session)
- **Client components** (`HomeClient`, `ReviewClient`, `KidsClient`) handle all user interaction
- **API routes** are all auth-guarded — they check `await auth()` before any logic
- **Gemini extraction** uses structured JSON output (`responseSchema`) to guarantee parseable results
- **Relative dates** are resolved by Gemini given `today = YYYY-MM-DD` in the system prompt — no client-side date math
- **Android Share Target** stores text in Redis with a 10-minute TTL; the review page resolves it by token

---

## Code Style

- TypeScript strict mode — no `any` unless absolutely necessary
- No comments that explain *what* — only *why* (non-obvious constraints or workarounds)
- Server actions for sign-in/sign-out; fetch calls for all other API interactions
- Tailwind for all styling — no external UI libraries
