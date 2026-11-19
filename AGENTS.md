# AGENTS.md — H&M Servicios

## Stack
- **Backend:** Node.js, Express, @libsql/client, JWT auth
- **Frontend:** Vanilla JS SPA (no framework), served from `public/`
- **DB:** Turso (libSQL) when `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` are set; otherwise a local SQLite file (same client, `file:` mode). Auto-creates and seeds at first start.
- **No ORM** — raw SQL queries through `server/config/database.js`'s `db` shim (async: `await db.prepare(sql).get/.all/.run(...)`, `await db.transaction(fn)()`)
- Migrated off `better-sqlite3` (Nov 2026): it's a native module that failed to compile on Vercel's build image, and even when it built, `/tmp` on Vercel serverless isn't persistent or shared across instances, so data kept disappearing. `@libsql/client` fixes both: no native compile, and Turso is a real persistent remote DB.

## Commands
| Command | Action |
|---------|--------|
| `npm run dev` | Dev server with `node --watch` on port 3000 |
| `npm start` | Production start |
| `npm test` | Runs `node tests/api.test.js` (real assertions: geolocation, helpers, DB seed/search; does NOT cover the auth/validation/requests controllers) |
| `npm run setup` | Verifies the landing-page asset exists (`scripts/copy-assets.js`) — it's already committed to the repo, so this is just a sanity check now |

**Order:** `npm run setup` → `npm run dev`

## Setup
1. `npm install`
2. Copy `.env.example` → `.env` (defaults work for dev)
3. `npm run setup`
4. `npm run dev`

Without `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` set, DB auto-creates at `DB_PATH` (default `./data/hm_servicios.db`) as a local SQLite file. With them set, it connects to the real Turso database instead — same schema, same code path. No migrations needed either way (`CREATE TABLE IF NOT EXISTS` + seed only runs when `users` is empty).

In production (Vercel), `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` must be set as project environment variables — without them, Vercel silently falls back to the non-persistent `/tmp` SQLite file (a startup warning is logged when this happens with `VERCEL` set).

## Architecture
```
server/
  server.js          — Express app entry, routes, error handler
  config/database.js — DB init, tables, seed data
  controllers/       — 7 controllers (auth, services, technicians, requests, payments, reviews, admin)
  middleware/        — auth.js (JWT + role guard), security.js, validation.js
  routes/            — one file per controller
  utils/             — geolocation.js (Haversine), helpers.js
public/
  index.html         — SPA shell, script order: api.js → auth.js → services.js → technicians.js → payments.js → dashboard.js → app.js
  js/                — vanilla JS SPA modules
  css/styles.css
HM-Sistema/          — unused admin dashboard prototype (HTML/CSS/JS, not served by Express — see HM-Sistema/README.md)
tests/api.test.js    — real assertions, limited coverage (see Commands table)
```

## API endpoints
All under `/api/`: `/auth`, `/services`, `/technicians` (includes `/nearby`), `/requests`, `/payments`, `/reviews`, `/admin`

## Auth
- JWT Bearer token via `Authorization` header
- Roles: `client`, `technician`, `admin`
- Middleware: `verifyToken`, `requireRole(...roles)`, `optionalAuth`

## Test Credentials (auto-seeded)
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hmservicios.com | Admin123! |
| Technician | carlos.martinez@email.com | Tecnico123! |
| Technician | maria.rodriguez@email.com | Tecnico123! |
| Client | ana.morales@email.com | Cliente123! |

## Linting y formato
- `npm run lint` (ESLint 9, flat config en `eslint.config.js`) y `npm run format` (Prettier, check-only; `npm run format:fix` para reescribir). `npm run lint` corre con 0 errores actualmente (solo warnings de `error` no usado en catch blocks, bajo riesgo).
- Prettier aún no se ha aplicado al código existente (`npm run format` marca ~28 archivos) — se dejó así a propósito para no generar un diff masivo de una sola vez; correr `npm run format:fix` cuando convenga revisar ese diff aparte.
- `public/js/**/*.js` declara `auth`/`api`/`services`/`technicians`/`payments`/`dashboard` como globals de solo lectura (patrón sin bundler, cada archivo expone un global vía `<script>`); el archivo que define cada uno tiene `no-redeclare` apagado solo para sí mismo, porque su propio `const X = (() => {...})()` se ve como "redeclaración" de ese global.

## Quirks
- **PAGOS SIMULADOS**: `payments.controller.js` no está conectado a ninguna pasarela de pago real (Wompi/PayU/Mercado Pago/Stripe, etc.). Solo registra el pago como `completed` en la base de datos y reparte la comisión — no mueve dinero real. Hay que integrar una pasarela real antes de cobrar a clientes de verdad.
- `.gitignore` exists and covers `node_modules/`, `data/`, `.env`, `.vercel` — no issue here.
- `HM-Sistema/` is a separate standalone static dashboard prototype (HTML/CSS/JS) — **not wired into the Express app**. See `HM-Sistema/README.md` for details. The real admin panel is `public/js/dashboard.js` (rendered inside the main SPA).
- `scripts/copy-assets.js` used to copy `landing-page-mockup.png` from a hardcoded Windows absolute path that only existed on the original dev's machine (always failed elsewhere). The asset is already committed in `public/img/` and `docs/assets/`, so the script now just verifies both are present instead of trying to copy from anywhere.
- `server/routes/auth.routes.js` wires `registerRules`/`loginRules`/`forgotPasswordRules` (from `validation.js`) to `/register`, `/login`, `/forgot-password`. Registration requires a password with min. 8 chars, upper/lower/digit/symbol — matches `public/js/auth.js`'s client-side copy, keep both in sync if this changes.
- Self-service password recovery (`POST /auth/forgot-password`) verifies identity by matching the registered email AND phone (no email provider is configured in this project) and sets the new password directly in the same call. To switch to a real "email link" flow, add an email provider (Resend/SendGrid/SMTP) with its own credentials and replace this endpoint.
- DB seed only runs when `users` table is empty (safe to delete `data/hm_servicios.db` to reset locally; against Turso, drop the tables instead)
- `db.prepare(sql).get/.all/.run()` and `db.transaction(fn)()` are all **async** now — every call site must `await`. The transaction shim uses `AsyncLocalStorage` so `db.prepare(...).run()` calls made inside a `db.transaction(async () => {...})` closure automatically route to that same libSQL transaction.
- `undefined` bind params (an optional body field the client didn't send) are normalized to `null` inside the shim before hitting `@libsql/client`, which otherwise throws on `undefined`.
- Commission rate: 15% (company) / 85% (technician) from `COMPANY_COMMISSION_RATE` env var
- Rate limit: 100 requests per 15 min on `/api/*`
