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
| `npm test` | Runs `node tests/api.test.js` (skeleton, no real tests) |
| `npm run setup` | Copies assets via `scripts/copy-assets.js` (hardcoded source path) |

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
HM-Sistema/          — standalone admin dashboard (HTML/CSS/JS, not served by Express)
tests/api.test.js    — skeleton only
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

## Quirks
- **No linter/formatter config** files exist on disk (only described in docs/04-programacion.md as intended, not enforced)
- **No `.gitignore`** — be careful not to commit `data/`, `.env`, `node_modules/`
- `HM-Sistema/` is a separate standalone static dashboard — not wired into the Express app
- `scripts/copy-assets.js` has a hardcoded absolute source path — will fail if run outside original machine; only copies a PNG
- DB seed only runs when `users` table is empty (safe to delete `data/hm_servicios.db` to reset locally; against Turso, drop the tables instead)
- `db.prepare(sql).get/.all/.run()` and `db.transaction(fn)()` are all **async** now — every call site must `await`. The transaction shim uses `AsyncLocalStorage` so `db.prepare(...).run()` calls made inside a `db.transaction(async () => {...})` closure automatically route to that same libSQL transaction.
- `undefined` bind params (an optional body field the client didn't send) are normalized to `null` inside the shim before hitting `@libsql/client`, which otherwise throws on `undefined`.
- Commission rate: 15% (company) / 85% (technician) from `COMPANY_COMMISSION_RATE` env var
- Rate limit: 100 requests per 15 min on `/api/*`
