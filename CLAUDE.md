@AGENTS.md

# Frontend

Next.js 16 (App Router, TypeScript, Tailwind) talking to a separate
Laravel API. Runs on http://localhost:3000.

## Backend

Laravel 13 at ~/projects/mdr_gh_api, running on http://localhost:8000.
Postgres database `mdr_gh`; the test suite uses `mdr_gh_testing`.

Key files:
- routes/api.php — all endpoints
- app/Http/Controllers/AuthController.php — register, login, logout
- app/Http/Controllers/EmailVerificationController.php — six-digit code
  verification; PasswordResetController.php — forgotten-password codes
- app/Models/ — Eloquent models; check these for field names before
  writing TypeScript interfaces
- database/migrations/ — authoritative schema

## Auth

Sanctum cookie-based SPA auth, not tokens. Every POST must be preceded
by a GET to /sanctum/csrf-cookie. The axios instance in lib/axios.ts
handles this; use it rather than calling fetch directly.

## Conventions

- API returns snake_case; don't convert to camelCase
- Validation errors come back as 422 with { message, errors }
- Types for API responses live in lib/auth.ts