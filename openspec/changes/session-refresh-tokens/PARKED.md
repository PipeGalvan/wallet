# Status: PARKED (not implemented) — 2026-06-24

## Why this exists
Full SDD exploration → proposal → spec → design → tasks for refresh token
rotation (DB-backed, family-based reuse detection, httpOnly cookie,
single-flight interceptor, boot gate). It was implemented and passed 84
backend tests with a clean build.

## Why it was reverted
During apply the user clarified the real scope: this is a **personal expense
tracker** ("tengo 100.000.000"), NOT a wallet handling real money, bank
credentials, or sensitive data. The threat model that justified the
enterprise-grade refresh-token system (XSS stealing long-lived tokens on a
financial app) does not apply. The full design was over-engineering for the
actual risk. This was an orchestrator misjudgment ("wallet" read as fintech).

## What shipped instead (the actual fix)
One line in `backend/src/app.module.ts`:

```ts
signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }, // was '15m'
```

The access token now lives 30 days in the existing Zustand `persist`
localStorage. Sessions survive browser restarts for 30 days. Done.

Tradeoff accepted: a stolen token is valid up to 30 days. For a personal
expense tracker with no real money and no third-party scripts, this risk is
acceptable.

## When to revive this design
If the app ever becomes a real financial product (real money movement, bank
credentials, multi-user/public), re-run this change. The design is complete,
tested, and ready — proposal/spec/design/tasks are all here.
