# AGENTS.md — H&M Servicios

## Stack
- **Backend:** Node.js, Express, better-sqlite3, JWT auth
- **Frontend:** Vanilla JS SPA (no framework), served from `public/`
- **DB:** SQLite (WAL mode), auto-creates and seeds at first start
- **No ORM** — raw SQL queries with better-sqlite3

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

DB auto-creates at `DB_PATH` (default `./data/hm_servicios.db`). No migrations needed.

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
- DB seed only runs when `users` table is empty (safe to delete `data/hm_servicios.db` to reset)
- Commission rate: 15% (company) / 85% (technician) from `COMPANY_COMMISSION_RATE` env var
- Rate limit: 100 requests per 15 min on `/api/*`
