# TaskFlow REST API

Base URL: `http://localhost:5000/api` (local) or `https://<your-api>.onrender.com/api` (production).

All request and response bodies are JSON. Every response uses the same envelope:

```jsonc
// Success
{ "success": true, "message": "Task created", "data": { ... } }

// Error
{ "success": false, "message": "Task not found" }

// Validation error (400): `errors` maps each field to its first problem
{ "success": false, "message": "Title is required", "errors": { "title": "Title is required" } }
```

## Authentication

Protected endpoints need the JWT from register/login in a header:

```
Authorization: Bearer <token>
```

| Status | Meaning |
|---|---|
| `401` | Missing, invalid, expired or revoked token (after logout or a password change) |
| `404` | The task doesn't exist **or belongs to another user** (ownership is never revealed) |

### `POST /auth/register`

```json
{ "name": "Jane Doe", "email": "jane@example.com", "password": "Password123", "confirmPassword": "Password123" }
```

`201` → `{ "user": { "id", "name", "email", "createdAt", "updatedAt" }, "token": "<jwt>" }`
`409` if the email is already registered. Passwords need at least 8 characters, including a letter and a number.

### `POST /auth/login`

```json
{ "email": "jane@example.com", "password": "Password123" }
```

`200` → `{ "user": {...}, "token": "<jwt>" }` · `401` "Incorrect email or password" (the same message for an unknown email)

### `POST /auth/logout` 🔒

Revokes the current token server-side. `200`

### `GET /auth/me` 🔒

`200` → `{ "user": {...} }`

### `POST /auth/forgot-password`

`{ "email": "jane@example.com" }` → always `200`, so the response never reveals whether an account exists.
The emailed link is valid for 30 minutes. Outside production the response also includes `devResetUrl`, so you can test without an email provider.

### `POST /auth/reset-password`

```json
{ "token": "<from the link>", "password": "NewPassword1", "confirmPassword": "NewPassword1" }
```

`200` on success (every existing session is signed out) · `400` if the link is invalid, expired or already used.

## Tasks 🔒

A task:

```json
{
  "id": "0b9e...",
  "title": "Complete internship project",
  "description": "Finish the Task Management Application and deploy it.",
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "dueDate": "2026-10-10",
  "completedAt": null,
  "createdAt": "2026-09-27T10:00:00.000Z",
  "updatedAt": "2026-09-27T10:00:00.000Z"
}
```

| Field | Rules |
|---|---|
| `title` | required, 1–200 chars |
| `description` | optional, ≤ 2000 chars, `null`/`""` clears it |
| `status` | `TODO` \| `IN_PROGRESS` \| `COMPLETED` (default `TODO`) |
| `priority` | `LOW` \| `MEDIUM` \| `HIGH` (default `MEDIUM`) |
| `dueDate` | `YYYY-MM-DD` or `null`, must be a real date between 2000 and 2100 |

Unknown fields (for example `userId`) are rejected with `400`. The owner always comes from the token.

### `GET /tasks`

Query parameters (all optional, and they combine):

| Param | Values | Example |
|---|---|---|
| `search` | text matched against title and description, case-insensitive | `search=project` |
| `status` | one value or a comma list | `status=TODO,IN_PROGRESS` |
| `priority` | one value or a comma list | `priority=HIGH` |
| `due` | `all` \| `today` \| `week` \| `overdue` \| `none` | `due=overdue` |
| `sort` | `newest` \| `oldest` \| `dueDate` \| `priority` \| `updated` | `sort=priority` |
| `page`, `limit` | pagination (`limit` ≤ 100, default 20) | `page=2&limit=20` |
| `tz` | IANA time zone, so "today" and "overdue" follow the user's calendar | `tz=Asia/Kolkata` |

`200` → `{ "tasks": [...], "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 } }`

*Overdue* means `dueDate` is before today and the status is not `COMPLETED`.

### `GET /tasks/stats`

`200` →

```json
{ "stats": { "total": 10, "todo": 5, "inProgress": 2, "completed": 3, "overdue": 1, "dueToday": 1,
             "completionRate": 30, "byPriority": { "LOW": 1, "MEDIUM": 3, "HIGH": 3 } } }
```

(`byPriority` counts open tasks only.)

| Method | Path | Body | Success |
|---|---|---|---|
| `GET` | `/tasks/:id` | — | `200 { task }` |
| `POST` | `/tasks` | task fields | `201 { task }` |
| `PUT` | `/tasks/:id` | full task (omitted optional fields reset to defaults) | `200 { task }` |
| `PATCH` | `/tasks/:id` | any subset of fields (at least one) | `200 { task }` |
| `PATCH` | `/tasks/:id/status` | `{ "status": "COMPLETED" }` | `200 { task }` |
| `DELETE` | `/tasks/:id` | — | `200 { id }` |

A malformed `:id` returns `400`; another user's task or a missing task returns `404`.

## Users 🔒

| Method | Path | Body | Notes |
|---|---|---|---|
| `PATCH` | `/users/me` | `{ "name" }` | Update profile |
| `PATCH` | `/users/me/password` | `{ "currentPassword", "newPassword", "confirmPassword" }` | Returns a new `{ token }` and signs out every other session |
| `DELETE` | `/users/me` | `{ "password" }` | Deletes the account and all of its tasks |

## Other

| Method | Path | Notes |
|---|---|---|
| `GET` | `/health` | `200` when the API and database are up, `503` otherwise |

## Real-time (Socket.IO, optional)

Connect to the API origin with `auth: { token }`. The server puts each socket in a private room for its user and emits:

| Event | Payload |
|---|---|
| `task:created` | `{ task }` |
| `task:updated` | `{ task }` |
| `task:deleted` | `{ id }` |

Send your socket id in an `X-Socket-Id` header on REST calls, and the server won't echo your own changes back to you.

## Rate limits

Auth endpoints: 20 requests / 15 min per IP. Whole API: 300 requests / min per IP. Over the limit you get `429`.

## Try it with curl

```bash
API=http://localhost:5000/api
TOKEN=$(curl -s -X POST $API/auth/login -H "Content-Type: application/json" \
  -d '{"email":"demo@taskflow.dev","password":"Demo1234"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.token')

curl -s -X POST $API/tasks -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Complete internship project","priority":"HIGH","dueDate":"2026-10-10"}'

curl -s "$API/tasks?status=IN_PROGRESS&priority=HIGH&sort=dueDate" -H "Authorization: Bearer $TOKEN"
```
