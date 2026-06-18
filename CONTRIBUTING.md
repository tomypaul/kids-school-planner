# Contributing to Kids Class Planner

Thanks for forking or contributing! This document covers everything you need to run your own instance or submit a PR.

---

## Fork Prerequisites

**Each fork requires its own credentials.** The app does not share API keys or OAuth tokens between deployments.

### 1. Your own Google Cloud project
- Go to [console.cloud.google.com](https://console.cloud.google.com)
- Create a **new project** (don't reuse someone else's)
- Enable **Google Calendar API** for your project
- Create an **OAuth 2.0 Client ID** (Web application type)
- Add your redirect URIs (localhost + your deployed domain)
- Set **OAuth consent screen** to External; add your email as a test user

> **Why?** Each deployment needs its own OAuth client to manage its own redirect URIs and user consent. Sharing a client causes redirect URI mismatches.

### 2. Your own Gemini API key

- Go to [aistudio.google.com](https://aistudio.google.com) → **API Keys** → **Create API key**
- **Create it in a new project without billing enabled.** Free-tier quota only applies to billing-free projects. Keys linked to Cloud projects with billing use prepay credits, which deplete quickly.
- After creating, check **Rate Limits** in the left sidebar → confirm `Gemini 2.5 Flash` shows a non-zero RPD (requests per day) quota

**Free tier quota reality check** — quota varies by model in this project type:

| Model | RPM | RPD | Notes |
|---|---|---|---|
| `gemini-2.5-flash` | 5 | 20 | Primary model used |
| `gemini-2.5-flash-lite` | 10 | 20 | First fallback |
| `gemini-3.1-flash-lite` | 15 | 500 | Second fallback |
| `gemini-2.0-flash` | 0 | 0 | Zero free quota — do not use |

The app automatically rotates through fallback models when quota is hit — see [`lib/gemini.ts`](lib/gemini.ts). For a personal family app, 20 RPD on the primary model is more than sufficient.

> **Why a billing-free project?** API keys in billing-enabled projects use prepay credits rather than the free tier. New projects without billing always start with free tier quotas.

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

**Expected:** 3–4 events with correct YYYY-MM-DD dates, no relative date strings remaining.

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
- **API routes** are all auth-guarded — they check `await auth()` before any logic; they also reject requests when `session.error === "RefreshTokenError"` (expired token)
- **Gemini extraction** uses `responseMimeType: "application/json"` with a detailed prompt — no `responseSchema` (it caused empty responses on multilingual content)
- **Model auto-rotation** — `lib/gemini.ts` iterates through `MODELS` array and retries on 429/RESOURCE_EXHAUSTED; non-quota errors (auth failure, bad request) are rethrown immediately
- **Relative dates** are resolved by Gemini given `today = YYYY-MM-DD` in the system prompt — no client-side date math
- **Android Share Target** stores text in Redis with a 10-minute TTL and a 10,000-character cap; the review page resolves it by token; the endpoint is intentionally unauthenticated (OS share fires before the app can authenticate)
- **Security headers** — CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy are set in `next.config.ts`

---

## Adding or Updating Gemini Fallback Models

Edit the `MODELS` array in [`lib/gemini.ts`](lib/gemini.ts):

```typescript
const MODELS = [
  { id: "gemini-2.5-flash",      thinkingBudget: 0 },  // primary
  { id: "gemini-2.5-flash-lite", thinkingBudget: undefined },
  { id: "gemini-3.1-flash-lite", thinkingBudget: undefined },
  // add more here
];
```

To find valid model IDs and their free-tier quotas for your project: AI Studio → **Rate Limits** → select your project → check the RPD column for non-zero values.

`thinkingBudget: 0` disables thinking mode on models that support it (like `gemini-2.5-flash`), keeping response time ~2s instead of ~30s.

---

## Code Style

- TypeScript strict mode — no `any` unless absolutely necessary
- No comments that explain *what* — only *why* (non-obvious constraints or workarounds)
- Server actions for sign-in/sign-out; fetch calls for all other API interactions
- Tailwind for all styling — no external UI libraries
