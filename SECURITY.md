# Security Policy

## Reporting a Vulnerability

If you find a security vulnerability, **please do not open a public GitHub issue.**

Email: tomy.paul@kone.com

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact

I'll acknowledge within 48 hours and aim to release a fix within 7 days for critical issues.

## Scope

This is a personal self-hosted app. Each user runs their own instance with their own credentials — there is no shared backend, no user data stored beyond your own OAuth tokens and kid profiles in your own Redis instance.

## Known Design Decisions

- `/api/share` is intentionally unauthenticated — required by the Web Share Target API spec (the OS fires the POST before the app can authenticate). The endpoint is rate-limited by body size (20 KB max) and stores only short-lived tokens (10-min TTL, consumed on first use).
- The app requests Google Calendar OAuth scope — tokens are stored encrypted in your own Upstash Redis instance and never leave your deployment.
