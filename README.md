# Humanit challenge — Clients API + UI

Full-stack implementation of the exercise: **Express + Prisma + SQLite** REST API with **cookie-based sessions**, **Swagger**, and a **Vite + React + Tailwind** client (morph / glass / glow styling).

## Requirements coverage

- Client CRUD with nested **document files** (1:N): uploads stored on disk with metadata in SQLite; profile updates stay JSON.
- Entities: client (`firstName`, `lastName`, `taxIdentifier`, `email`, `phoneNumber`, documents); document (`originalName`, `storageKey`, `mimeType`, `sizeBytes`, optional `description`, `expirationDate`).
- SQLite + Prisma **migrations** under `backend/prisma/migrations/`.
- **Login** via `POST /api/auth/login` (HttpOnly cookie + server-side session, not JWT).
- **Swagger UI** at `http://localhost:4000/api/docs/` (OpenAPI JSON at `/api/openapi.json`).

## Project layout

- `backend/` — API, Prisma schema, migrations.
- `frontend/` — React SPA (proxies `/api` to the backend in dev).

## Local development

### 1. Backend

**First-time setup (or after you change `prisma/schema.prisma`):** apply migrations so the SQLite file has the right tables. You do **not** need to run migrate every time you start the server—only when the database is missing/out of date.

```bash
cd backend
cp ../.env.example .env   # optional; defaults match local dev (SQLite under prisma/data)
npm install
npx prisma migrate dev    # creates/updates DB from committed migrations; may run seed (see package.json)
npm run db:seed           # idempotent seed user (default admin@example.com / changeme)
```

**Day to day:** once `prisma/data/dev.db` exists and matches migrations, just run:

```bash
cd backend
npm run dev               # http://localhost:4000
```

If you prefer to apply migrations without the interactive “dev” flow (e.g. CI or a clean tree), use `npm run db:migrate` (`prisma migrate deploy`).

- Health: `GET http://localhost:4000/api/health`
- Swagger: `http://localhost:4000/api/docs/`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                # http://localhost:5173 — proxies /api → :4000
```

Use the seeded account (**admin@example.com** / **changeme**) unless you changed `SEED_*` in `.env`.

### Default login credentials

- Email: `admin@example.com`
- Password: `changeme`

## QA gate

Run the full QA validation from repository root:

```bash
npm run qa:all
```

Available stages:

- `npm run qa:backend` - backend Jest + Supertest suite.
- `npm run qa:frontend` - frontend lint and production build.
- `npm run qa:docker:smoke` - compose startup + smoke requests for API and web.

Manual browser scenarios (button clicks, fake-account logins, invalid uploads, and form-edge checks) are documented in [`docs/qa-manual-browser.md`](docs/qa-manual-browser.md).

## Production / Docker

Requires a running Docker engine (Docker Desktop, Colima, etc.).

```bash
docker compose up --build
```

- UI + reverse proxy: **http://localhost:8080** (`/api` forwarded to the API container).
- API (direct): **http://localhost:4000**
- Set `SESSION_SECRET` (and optionally `SEED_EMAIL` / `SEED_PASSWORD`) in your environment before running compose in real deployments.

The API container runs `prisma migrate deploy`, seeds the admin user, then starts Node.

## API summary

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/api/health` | No |
| GET | `/api/openapi.json` | No |
| GET | `/api/docs/` | No |
| POST | `/api/auth/login` | No |
| POST | `/api/auth/logout` | No (clears cookie if present) |
| POST | `/api/clients` | Cookie session |
| GET | `/api/clients` | Cookie session |
| GET | `/api/clients/:id` | Cookie session |
| PUT | `/api/clients/:id` | Cookie session (profile fields only) |
| DELETE | `/api/clients/:id` | Cookie session (moves client + documents to trash) |
| POST | `/api/clients/:clientId/documents` | Cookie session (multipart: `file`, `expirationDate`, optional `description`) |
| GET | `/api/clients/:clientId/documents/:documentId/download` | Cookie session |
| PATCH | `/api/clients/:clientId/documents/:documentId` | Cookie session |
| DELETE | `/api/clients/:clientId/documents/:documentId` | Cookie session (moves file to trash) |
| GET | `/api/clients/trash` | Cookie session |
| POST | `/api/clients/:clientId/restore` | Cookie session |
| DELETE | `/api/clients/:clientId/permanent` | Cookie session |
| GET | `/api/clients/documents/trash` | Cookie session |
| POST | `/api/clients/documents/:documentId/restore` | Cookie session |
| DELETE | `/api/clients/documents/:documentId/permanent` | Cookie session |

Files are stored under `UPLOAD_DIR` (default `backend/uploads`, or `/data/uploads` in Docker). Max size defaults to 10 MB (`MAX_UPLOAD_BYTES`).

Trash behavior:
- Deleting a **client** or **document** performs soft-delete (`status=DELETED`, `deletedAt` set).
- Associated files are moved from `UPLOAD_DIR` to `TRASH_DIR` (default `backend/trash`).
- Storage paths use this structure in both upload and trash roots: `YYYY-MM-DD/<client-name>/documents/<file>`.
- Items disappear from normal dashboard lists.
- Dashboard trash actions can restore or permanently delete.
- Permanent delete is the only action that removes records/files irreversibly.
- After file moves/deletes, empty parent folders are automatically removed.

Document expiration status:
- `Expired`: document expiration date is before today.
- `Expiring soon`: document expires in 0 to 30 days.
- `Valid`: document expires in more than 30 days.

## License

See [LICENSE](LICENSE).
