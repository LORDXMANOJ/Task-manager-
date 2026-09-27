<div align="center">

# ✅ TaskFlow

**A full-stack task manager: plan, prioritise and finish your work.**

React · TypeScript · Tailwind CSS · Express · PostgreSQL · Prisma · JWT · Socket.IO

</div>

![TaskFlow dashboard](docs/screenshots/dashboard-light.png)

## Overview

TaskFlow is a production-style task management web application built as an internship project for **Thiranex**.
Users create an account, sign in, and manage their own tasks: create, edit, complete, delete, search, filter and sort them.
A dashboard shows live statistics. Every task is stored in PostgreSQL and served through a REST API that requires authentication,
and each user can only ever read or change their own tasks.

## Features

**Authentication and security**
- Register, log in and log out with JWT authentication; passwords are hashed with bcrypt (cost 12)
- Forgot/reset password flow with single-use links that expire after 30 minutes (sent by email, or shown in dev mode)
- Protected API routes and protected frontend routes
- **Ownership checks on every task query**: another user's task always returns `404`
- Logout revokes the token server-side. Changing or resetting the password signs out every other session
- Validation on both the client and the server (Zod), with rate limiting on auth endpoints, Helmet headers, CORS restricted to an allow-list, and JSON body size limits
- Consistent error responses that never expose database or internal details

**Tasks**
- Create, read, update and delete tasks, each with a title, description, status, priority and due date
- One-click complete/reopen and "start" (the UI updates immediately and rolls back if the request fails)
- Delete asks for confirmation first
- Overdue tasks get a red marker and a "3 days overdue" label; completed tasks are dimmed and struck through
- **Search** by title or description as you type (debounced)
- **Filters** for status, priority and due date (today / this week / overdue / no date), all combinable
- **Sorting** by newest, oldest, due date, priority or recently updated
- Filter state lives in the URL, so views survive a refresh and can be shared
- Server-side pagination

**Dashboard and UX**
- Greeting, statistics cards (total, pending, in progress, completed, overdue, due today) and a completion chart
- Responsive layout: full sidebar on desktop, collapsible icon rail on tablets, and a bottom tab bar with a floating create button on phones
- Light, dark and system themes, remembered in localStorage and applied before first paint (no flash)
- Toast notifications, skeleton loaders, a separate empty state for each situation, error states with retry, and an offline screen
- Accessible: labelled controls, focus-trapped modals, keyboard navigation, visible focus rings, status never shown by colour alone, and reduced-motion support
- **Real-time sync (optional)**: a change in one tab or device appears in all the others within about 0.5 s (Socket.IO, private room per user)

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, React Router, TanStack Query, Axios, React Hook Form, Zod, Lucide icons, Sonner toasts |
| Backend | Node.js, Express 5, TypeScript, Zod, jsonwebtoken, bcryptjs, Helmet, express-rate-limit, Socket.IO |
| Database | PostgreSQL + Prisma ORM (migrations, typed client) |
| Testing | Vitest + Supertest integration tests against a real PostgreSQL database |
| Deployment | Vercel (frontend) · Render (API) · Neon / Supabase / Render PostgreSQL (database) |

## Architecture

```
┌────────────────────────┐   HTTPS + JSON (Bearer JWT)   ┌──────────────────────────┐   Prisma   ┌─────────────┐
│  React SPA (Vercel)    │ ─────────────────────────────▶│  Express API (Render)    │──────────▶ │ PostgreSQL  │
│  pages → hooks →       │ ◀──────────────────────────── │  routes → middleware →   │            │ (Neon etc.) │
│  services (Axios)      │   Socket.IO: task:* events    │  controllers → services  │            └─────────────┘
└────────────────────────┘ ◀───────────────────────────── └──────────────────────────┘
```

**Request flow:** route → `requireAuth` (verifies the JWT and checks it hasn't been revoked) → `validate(zodSchema)` → controller → service (business logic plus the ownership-scoped Prisma query) → `{ success, data }` envelope. Every thrown error ends up in one central error handler.

```
.
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database models, enums, indexes
│   │   ├── migrations/            # SQL migrations (committed)
│   │   └── seed.ts                # Optional demo data
│   ├── scripts/local-db.ts        # Runs a local PostgreSQL without installing it
│   ├── src/
│   │   ├── config/                # env validation (zod), Prisma client
│   │   ├── controllers/           # HTTP in/out only
│   │   ├── middleware/            # auth, validate, errorHandler, rateLimit
│   │   ├── models/                # Public DTOs (never expose passwordHash)
│   │   ├── realtime/              # Socket.IO server (optional)
│   │   ├── routes/                # auth, tasks, users, health
│   │   ├── services/              # Business logic: auth, tasks, users, tokens, email
│   │   ├── utils/                 # ApiError, response helper, date helpers
│   │   ├── validators/            # Zod request schemas
│   │   ├── app.ts                 # Express app (no listen, so it can be tested)
│   │   └── server.ts              # HTTP server + Socket.IO + graceful shutdown
│   └── tests/                     # Integration tests (auth, CRUD, authorization, filters)
├── frontend/
│   └── src/
│       ├── components/{ui,tasks,dashboard,layout}/   # Reusable components
│       ├── context/               # Auth, Theme, TaskModal providers
│       ├── hooks/                 # useTasks (queries/mutations), useTaskFilters, realtime
│       ├── layouts/               # AppLayout, AuthLayout
│       ├── pages/                 # Login, Register, Forgot/Reset, Dashboard, Tasks, Settings, 404
│       ├── routes/                # Route table + ProtectedRoute / PublicOnlyRoute
│       ├── services/              # Axios API client, one module per resource
│       ├── types/ · utils/        # Shared types, validation, dates, errors
│       └── App.tsx · main.tsx
├── docs/API.md                    # Full API reference
└── render.yaml                    # Render blueprint for the API + database
```

### Authentication flow

1. **Register/Login**: the API validates the input and hashes the password with bcrypt (or compares it on login). It then signs a JWT (`HS256`, 7-day expiry) with `sub` = user id, a unique `jti`, and `ver` = the user's `tokenVersion`.
2. The SPA stores the token in `localStorage`, and an Axios interceptor adds `Authorization: Bearer <token>` to every request.
3. **Every protected request**: `requireAuth` checks the signature and expiry, then confirms the user still exists, that `ver` matches the user's current `tokenVersion`, and that the `jti` isn't in the revoked-token table.
4. **Logout** stores the token's `jti` in `revoked_tokens` (expired rows are cleaned up automatically). **Password change/reset** increments `tokenVersion`, which invalidates every token issued before it.
5. Any `401` makes the frontend clear the session, show "Your session has expired" and redirect to `/login`, and after logging in the user returns to the page they were on.
6. **Authorization**: each task query includes `WHERE userId = <token user>`. A task owned by someone else is indistinguishable from one that doesn't exist (`404`).

> **Why a Bearer token instead of a cookie?** The frontend (Vercel) and API (Render) run on different domains. Cross-site cookies are blocked by Safari and increasingly by other browsers, so a Bearer header is the reliable choice. The main risk of `localStorage` is XSS: React escapes all rendered content, no user HTML is ever injected, and tokens can be revoked server-side.

## Database schema

```
users                                  tasks
────────────────────────────           ─────────────────────────────────────────
id            uuid  PK                 id           uuid  PK
name          varchar(80)              userId       uuid  FK → users.id  ON DELETE CASCADE
email         varchar(254) UNIQUE      title        varchar(200)
passwordHash  text                     description  varchar(2000) NULL
tokenVersion  int  default 0           status       enum(TODO, IN_PROGRESS, COMPLETED)
createdAt     timestamp                priority     enum(LOW, MEDIUM, HIGH)
updatedAt     timestamp                dueDate      date NULL
      │                                completedAt  timestamp NULL
      │ 1                     many     createdAt    timestamp
      └───────────────────────────────▶updatedAt    timestamp

                                       indexes: (userId,status) (userId,priority)
                                                (userId,dueDate) (userId,createdAt) (userId,updatedAt)

password_reset_tokens: id, userId FK, tokenHash UNIQUE (SHA-256), expiresAt, usedAt
revoked_tokens:        jti PK, expiresAt (indexed)
```

A user has many tasks, and a task belongs to exactly one user. Every index starts with `userId` because every query is scoped to one user.
`dueDate` is a SQL `DATE` (no time), so "due today" never shifts across time zones. The client sends its IANA time zone and the server works out "today" from it.

## API endpoints

Full reference with request/response examples: **[docs/API.md](docs/API.md)**

| Method | Endpoint | Auth | Description |
|---|---|:-:|---|
| POST | `/api/auth/register` | | Create account |
| POST | `/api/auth/login` | | Log in, returns a JWT |
| POST | `/api/auth/logout` | 🔒 | Revoke the current token |
| GET | `/api/auth/me` | 🔒 | Current user |
| POST | `/api/auth/forgot-password` | | Send reset link |
| POST | `/api/auth/reset-password` | | Set a new password with the link token |
| GET | `/api/tasks` | 🔒 | List with `search`, `status`, `priority`, `due`, `sort`, `page`, `limit` |
| GET | `/api/tasks/stats` | 🔒 | Dashboard statistics |
| GET | `/api/tasks/:id` | 🔒 | Get one task |
| POST | `/api/tasks` | 🔒 | Create task |
| PUT | `/api/tasks/:id` | 🔒 | Replace task |
| PATCH | `/api/tasks/:id` | 🔒 | Partial update |
| PATCH | `/api/tasks/:id/status` | 🔒 | Change status only |
| DELETE | `/api/tasks/:id` | 🔒 | Delete task |
| PATCH | `/api/users/me` | 🔒 | Update name |
| PATCH | `/api/users/me/password` | 🔒 | Change password |
| DELETE | `/api/users/me` | 🔒 | Delete account |
| GET | `/api/health` | | API + DB health check |

## Getting started (local)

**Prerequisites:** Node.js 20+ and npm. PostgreSQL is optional, because the project can run a local PostgreSQL server from npm.

### 1. Install

```bash
git clone https://github.com/LORDXMANOJ/Task-manager-.git
cd Task-manager-
npm run install:all
```

### 2. Configure environment variables

```bash
cp backend/.env.example backend/.env
cp backend/.env.test.example backend/.env.test     # only needed for `npm test`
cp frontend/.env.example frontend/.env
```

Generate a JWT secret and paste it into `JWT_SECRET` in `backend/.env`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Create the database

**Option A: no install (recommended for a quick start).** In a separate terminal, leave this running:

```bash
npm run db:local
```

It starts a real PostgreSQL 18 server on port `5433` (data in `backend/.pgdata/`) with a `taskflow` database. The default `DATABASE_URL` in `.env.example` already points at it.

**Option B: your own PostgreSQL** (local install, Docker, Neon, Supabase...). Create a database and set `DATABASE_URL`:

```bash
# Docker example
docker run -d --name taskflow-db -e POSTGRES_USER=taskflow -e POSTGRES_PASSWORD=taskflow -e POSTGRES_DB=taskflow -p 5433:5432 postgres:17
```

### 4. Run migrations (and optional demo data)

```bash
npm run db:migrate        # creates all tables
npm run db:seed           # OPTIONAL: demo@taskflow.dev / Demo1234 with 10 sample tasks
```

The seed only creates or resets that one demo account. The app works fine with an empty database.

### 5. Start the app

```bash
npm run dev               # API on http://localhost:5000 and web on http://localhost:5173
```

(or `npm run dev:backend` and `npm run dev:frontend` in two terminals)

### 6. Create your first account

Open **http://localhost:5173**, click **Create one**, and register. You'll land on your (empty) dashboard.
Click **Create Task** to add a task, then try completing, editing, filtering and deleting it.
To see real-time sync, open the app in two tabs.

## Environment variables

**backend/.env**

| Variable | Required | Example | Description |
|---|:-:|---|---|
| `DATABASE_URL` | ✅ | `postgresql://user:pass@host:5432/taskflow?sslmode=require` | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | 96 random hex chars | At least 32 characters. Never commit it |
| `JWT_EXPIRES_IN` | | `7d` | Token lifetime |
| `PORT` | | `5000` | Render/Railway set this automatically |
| `CLIENT_URL` | ✅ | `https://taskflow.vercel.app` | Allowed frontend origin(s), comma-separated. Also used in reset links |
| `NODE_ENV` | | `production` | `development` / `test` / `production` |
| `TRUST_PROXY` | | `1` | Number of proxies in front of the API (Render/Railway: `1`) |
| `RESEND_API_KEY` | | `re_...` | Optional. Sends reset emails through [Resend](https://resend.com); without it, links are logged |
| `EMAIL_FROM` | | `TaskFlow <noreply@yourdomain.com>` | Sender for reset emails |

**frontend/.env**

| Variable | Example | Description |
|---|---|---|
| `VITE_API_URL` | `https://taskflow-api.onrender.com` | API origin, without `/api` |
| `VITE_ENABLE_REALTIME` | `true` | Set to `false` to disable Socket.IO |

The server validates its environment on startup and exits with a clear message if anything is missing. `.env` files are git-ignored; only `.env.example` files are committed.

## Scripts

| Where | Command | What it does |
|---|---|---|
| root | `npm run dev` | API + frontend together |
| root | `npm run build` | Production build of both |
| root | `npm test` | Backend integration tests |
| backend | `npm run db:local` | Local PostgreSQL (no install needed) |
| backend | `npm run db:migrate` | Create/apply migrations (development) |
| backend | `npm run db:deploy` | Apply migrations (production) |
| backend | `npm run db:seed` | Optional demo data |
| backend | `npm run db:studio` | Browse the database in Prisma Studio |
| backend | `npm run build && npm start` | Compile and run the production server |
| frontend | `npm run build && npm run preview` | Build and preview the production bundle |

## Testing

### Automated

The backend has **20 integration tests** that call the real Express app and a real PostgreSQL test database (`taskflow_test`):

```bash
npm run db:local          # if you're using the local database
npm test
```

They cover: registration (password hashing and duplicate emails), login (identical errors for a wrong password or an unknown email), protected routes, tampered tokens, logout revocation, password change invalidating old tokens, the password reset flow, full task CRUD, validation of every field, 400 vs 404 handling, **User A being unable to read, update or delete User B's task**, search, combined filters, sorting, pagination and per-user statistics.

`backend/.env.test` (copied from `.env.test.example`) must point at a **separate** test database, because the tests wipe it. The local DB script creates `taskflow_test` automatically:

```
NODE_ENV=test
DATABASE_URL=postgresql://taskflow:taskflow@localhost:5433/taskflow_test
JWT_SECRET=test-secret-that-is-at-least-32-characters-long
CLIENT_URL=http://localhost:5173
```

### Manual checklist

The full flow below was also exercised end-to-end in a headless browser at desktop (1440px), tablet (820px) and mobile (390px) widths, with no horizontal overflow.

| Area | Check |
|---|---|
| **Auth** | ☑ Register ☑ Login ☑ Logout ☑ Invalid credentials ☑ Protected routes redirect to /login ☑ Expired/revoked token signs out ☑ Forgot/reset password |
| **Tasks** | ☑ Create ☑ Read ☑ Update ☑ Delete (with confirmation) ☑ Mark completed/reopen ☑ Change status ☑ Change priority ☑ Set due date |
| **Filters** | ☑ Search ☑ Status filter ☑ Priority filter ☑ Due date filter ☑ Combined filters ☑ Sorting ☑ Pagination |
| **Security** | ☑ User A cannot access User B's tasks ☑ Passwords hashed ☑ Protected API routes ☑ CORS rejects unknown origins ☑ No internal errors leaked |
| **UI** | ☑ Desktop ☑ Tablet ☑ Mobile ☑ Dark mode ☑ Loading states ☑ Error states ☑ Empty states ☑ Real-time sync across tabs |
| **Production** | ☑ Production builds ☑ Compiled server starts and connects ☑ Env validation |

## Deployment

The recommended free setup: **Neon** (database) → **Render** (API) → **Vercel** (frontend).

### 1. Create the PostgreSQL database (Neon)

1. Sign up at [neon.tech](https://neon.tech) and create a project (for example `taskflow`).
2. Copy the **connection string**, e.g. `postgresql://user:pass@ep-xxx.aws.neon.tech/neondb?sslmode=require`.

*(Supabase: Project Settings → Database → Connection string (URI). Railway: add a PostgreSQL service and copy `DATABASE_URL`.)*

### 2. Deploy the API (Render)

1. Push this repository to GitHub.
2. Render → **New → Web Service** → connect the repo, then set:
   - **Root Directory:** `backend`
   - **Build Command:** `npm ci --include=dev && npm run build`
   - **Start Command:** `npm run db:deploy && npm start` (this runs migrations on every deploy)
   - **Health Check Path:** `/api/health`
3. Environment variables:
   ```
   NODE_ENV=production
   DATABASE_URL=<Neon connection string>
   JWT_SECRET=<new random 48-byte hex. Don't reuse your local one>
   CLIENT_URL=https://<your-app>.vercel.app      (update after step 3)
   TRUST_PROXY=1
   ```
4. Deploy, then open `https://<your-api>.onrender.com/api/health`. You should see `"database":"connected"`.

*Alternatively, **New → Blueprint** uses [`render.yaml`](render.yaml) to create the API and a Render PostgreSQL database in one step.*
*Railway works the same way: root `backend`, the same build and start commands, and the same variables.*

### 3. Deploy the frontend (Vercel)

1. Vercel → **Add New → Project** → import the repo.
2. **Root Directory:** `frontend` (Vercel detects Vite: build `npm run build`, output `dist`).
3. Environment variable: `VITE_API_URL=https://<your-api>.onrender.com`
4. Deploy. [`frontend/vercel.json`](frontend/vercel.json) rewrites every path to `index.html`, so client-side routes like `/dashboard` work on refresh. For Netlify, `public/_redirects` does the same.

### 4. Connect the two and configure CORS

Set `CLIENT_URL` on Render to your exact Vercel URL (no trailing slash) and redeploy. To allow several origins (preview deployments, a custom domain), separate them with commas:

```
CLIENT_URL=https://taskflow.vercel.app,https://taskflow-git-main-you.vercel.app
```

Requests from any other origin are refused by the browser.

### 5. Test the production deployment

1. `GET https://<api>/api/health` returns `200` with `database: connected`.
2. Open the Vercel URL, register, and create, edit, complete and delete a task.
3. Refresh on `/tasks/completed`: the page loads (SPA rewrite works).
4. Log out, then visit `/dashboard`: you're redirected to `/login`.
5. Open two tabs and create a task in one: it appears in the other (WebSockets work).
6. In DevTools → Network, API calls go to your Render URL with no CORS errors.

> Render's free tier sleeps after inactivity, so the first request can take about 30–50 s. The app shows a friendly "can't reach TaskFlow, try again" screen during that time.

## Screenshots

| Dashboard (light) | Dashboard (dark) |
|---|---|
| ![](docs/screenshots/dashboard-light.png) | ![](docs/screenshots/dashboard-dark.png) |

| Login | Edit task modal |
|---|---|
| ![](docs/screenshots/login.png) | ![](docs/screenshots/edit-modal-dark.png) |

| Tablet: collapsible sidebar | Mobile: dashboard | Mobile: tasks (dark) | Mobile: create task |
|---|---|---|---|
| ![](docs/screenshots/tablet-tasks.png) | ![](docs/screenshots/mobile-dashboard.png) | ![](docs/screenshots/mobile-tasks-dark.png) | ![](docs/screenshots/mobile-create.png) |

## Future improvements

- Refresh-token rotation with short-lived access tokens held in memory
- Task tags/labels, subtasks and file attachments
- Drag-and-drop Kanban board view
- Email reminders for tasks due soon (a scheduled job)
- Shared projects and team collaboration with roles
- Undo for delete (soft delete with a restore window)
- Frontend component tests (Vitest + Testing Library) and E2E tests in CI (Playwright + GitHub Actions)
- PWA support for offline use and installability

## License

MIT
