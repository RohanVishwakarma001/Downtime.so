# Downtime.so — Server

Express.js + TypeScript REST API for Downtime.so. Handles authentication, incident management, real-time SSE updates, webhook ingestion, and email/SMS notifications via a background worker.

## Tech Stack

- **Framework:** Express.js 4.18
- **Language:** TypeScript 5.0
- **ORM:** Prisma 5.0 (PostgreSQL)
- **Queue:** BullMQ 4.0 + Redis (ioredis 5.0)
- **Auth:** JWT (access tokens: 15m, refresh tokens: 7d)
- **Email:** Resend 2.0
- **SMS:** Twilio 4.0
- **Validation:** Zod 3.0
- **Rate Limiting:** express-rate-limit 7.0

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (local via Docker or [Neon](https://neon.tech))
- Redis (local via Docker or [Upstash](https://upstash.com))

### Installation

```bash
npm install
cp .env.example .env   # fill in all values
npx prisma migrate dev
npm run dev
```

### Running the notification worker

The worker is a separate process that processes email/SMS jobs from the queue. Run it alongside the main server:

```bash
npm run worker
```

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Secret for signing access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens (min 32 chars) |
| `RESEND_API_KEY` | API key from [resend.com](https://resend.com) |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Your Twilio number in E.164 format (e.g. `+16516776570`) |
| `PORT` | Port to listen on (default: `4000`) |
| `CLIENT_URL` | Frontend URL for CORS (e.g. `https://app.downtime.so`) |
| `NODE_ENV` | `development` or `production` |

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with auto-reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run compiled production server |
| `npm run worker` | Run notification worker (dev mode) |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:push` | Push schema changes without migrations |

## API Reference

All authenticated endpoints require `Authorization: Bearer <accessToken>`.

---

### Auth — `/api/auth`

Rate limited: 20 requests / 15 minutes per IP.

#### `POST /api/auth/register`

Create a new user and organization.

**Body**
```json
{
  "name": "Jane Doe",
  "orgName": "Acme Corp",
  "email": "jane@acme.com",
  "password": "min8chars"
}
```

**Response**
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": { "id": "...", "name": "...", "email": "...", "orgId": "..." }
}
```

---

#### `POST /api/auth/login`

**Body**
```json
{ "email": "jane@acme.com", "password": "..." }
```

**Response** — same shape as `/register`

---

#### `POST /api/auth/refresh`

Rotate tokens. Invalidates the old refresh token.

**Body**
```json
{ "refreshToken": "..." }
```

**Response**
```json
{ "accessToken": "...", "refreshToken": "..." }
```

---

#### `POST /api/auth/logout`

**Body**
```json
{ "refreshToken": "..." }
```

---

### Services — `/api/v1/services`

Requires JWT auth.

#### `GET /api/v1/services`

List all services for the authenticated organization.

**Response**
```json
{
  "services": [
    {
      "id": "...",
      "name": "API",
      "status": "OPERATIONAL",
      "activeIncidents": [],
      "_count": { "subscribers": 12 }
    }
  ]
}
```

---

#### `POST /api/v1/services`

**Body**
```json
{ "name": "API Gateway", "description": "Optional description" }
```

---

#### `GET /api/v1/services/:id`

Returns service with last 10 incidents and full update timelines.

---

#### `PATCH /api/v1/services/:id`

Update name, description, or status. Status changes are broadcast via SSE.

**Body**
```json
{ "name": "...", "description": "...", "status": "DEGRADED" }
```

**Status values:** `OPERATIONAL` | `DEGRADED` | `PARTIAL_OUTAGE` | `MAJOR_OUTAGE` | `MAINTENANCE`

---

#### `DELETE /api/v1/services/:id`

---

### Incidents — `/api/v1/incidents`

Requires JWT auth (except `/api` variant).

#### `GET /api/v1/incidents`

**Query params:** `status`, `page` (default: 1), `limit` (default: 20, max: 100)

**Response**
```json
{
  "incidents": [...],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

---

#### `POST /api/v1/incidents`

Creates an incident, updates the service status, enqueues notifications, and publishes an SSE event.

**Body**
```json
{
  "title": "API latency spike",
  "impact": "MAJOR",
  "serviceId": "...",
  "initialMessage": "We are investigating elevated response times."
}
```

**Impact values:** `MINOR` | `MAJOR` | `CRITICAL`

---

#### `POST /api/v1/incidents/api`

Same as above but authenticated with `x-api-key` header instead of JWT.

---

#### `GET /api/v1/incidents/:id`

Returns incident with full update timeline.

---

#### `PATCH /api/v1/incidents/:id`

**Body**
```json
{ "status": "RESOLVED", "title": "...", "impact": "..." }
```

When status is set to `RESOLVED`, the service status is automatically reset to `OPERATIONAL` if no other active incidents exist.

**Status values:** `INVESTIGATING` | `IDENTIFIED` | `MONITORING` | `RESOLVED`

---

#### `POST /api/v1/incidents/:id/updates`

Add a timeline update. Enqueues notifications and publishes SSE event.

**Body**
```json
{
  "message": "We have identified the root cause and are applying a fix.",
  "status": "IDENTIFIED"
}
```

---

### Subscribers — `/api/v1/subscribers`

#### `POST /api/v1/subscribers` — Public

Subscribe to a service. At least one of `email` or `phone` is required.

**Body**
```json
{
  "email": "subscriber@example.com",
  "phone": "+16515551234",
  "serviceId": "..."
}
```

---

#### `GET /api/v1/subscribers` — JWT auth

**Query params:** `serviceId?`, `page` (default: 1), `limit` (default: 50, max: 200)

---

#### `DELETE /api/v1/subscribers/:id`

Unsubscribe. Pass either `?token=<base64(subscriberId)>` (from unsubscribe links in emails) or a JWT `Authorization` header.

---

#### `GET /api/v1/subscribers/unsubscribe-token/:id` — JWT auth

Returns a token for generating unsubscribe links.

---

### Webhooks — `/api/webhooks`

All webhook endpoints return `200` regardless of outcome to prevent monitoring tools from retrying.

#### `POST /api/webhooks/uptimerobot`

Accepts UptimeRobot alert payloads (form-encoded or JSON). Automatically creates incidents on "Down" alerts and resolves them on "Up" alerts.

Required fields: `serviceId` in the payload.

---

#### `POST /api/webhooks/datadog`

Accepts Datadog webhook payloads. Maps alert statuses:

| Datadog status | Service status |
|---|---|
| `Alert` | `MAJOR_OUTAGE` |
| `Warn` | `DEGRADED` |
| `Resolved` / `Recovery` | `OPERATIONAL` |

---

#### `POST /api/webhooks/generic`

Generic webhook with API key authentication (`x-api-key` header).

**Body**
```json
{
  "serviceId": "...",
  "status": "MAJOR_OUTAGE",
  "message": "Database is unreachable.",
  "incidentTitle": "Database outage"
}
```

---

### SSE — `/api/sse`

#### `GET /api/sse/:orgSlug`

Public SSE stream for a status page. Clients receive:

- **Initial event** — full org and services snapshot
- **Heartbeat** — every 30 seconds
- **`service_status_changed`** — when a service status is updated
- **`incident_created`** — when a new incident is opened
- **`incident_updated`** — when an incident status changes
- **`incident_update_posted`** — when a timeline update is added

---

### Public — `/api/v1/public`

#### `GET /api/v1/public/:orgSlug/services`

Public status page data. No authentication required.

**Response**
```json
{
  "org": { "name": "Acme Corp", "slug": "acme-corp" },
  "services": [...],
  "overallStatus": "OPERATIONAL"
}
```

`overallStatus` reflects the worst service status: `MAJOR_OUTAGE` > `PARTIAL_OUTAGE` > `DEGRADED` > `MAINTENANCE` > `OPERATIONAL`.

---

### Health — `/health`

#### `GET /health`

```json
{ "status": "ok", "timestamp": "2026-06-12T10:00:00.000Z" }
```

---

## Database Schema

```
User          → belongs to Organization, has many RefreshTokens
Organization  → has many Users, Services; has unique API key and slug
Service       → belongs to Organization; has many Incidents, Subscribers
Incident      → belongs to Service; has many IncidentUpdates
IncidentUpdate → belongs to Incident
Subscriber    → belongs to Service (email and/or phone); has many NotificationLogs
NotificationLog → belongs to Subscriber; records sent/failed status per channel
RefreshToken  → belongs to User; expires after 7 days
```

## Rate Limiting

| Endpoint | Limit |
|---|---|
| All `/api/*` routes | 100 req / 15 min per IP |
| `/api/auth/*` routes | 20 req / 15 min per IP |
| API key endpoints | 50 req / min per key (sliding window via Redis) |

## Notification Worker

The worker (`src/worker.ts`) runs as a separate process and consumes jobs from the `notifications` BullMQ queue.

- **Email batch size:** 50 per job
- **SMS batch size:** 10 per job
- **Retries:** 3 attempts with exponential backoff (base 2000ms)
- **Job retention:** 100 completed, 200 failed
- Sends using `Promise.allSettled()` — partial failures are logged, not thrown
- Writes results to `NotificationLog` table

## Deployment (Render)

1. Connect your GitHub repo to Render
2. Create a new **Web Service**
3. Set **Root Directory** to `server`
4. Set **Language** to `Node`
5. Set **Build Command:**
   ```
   npm install && npx prisma generate && npx prisma migrate deploy && npm run build
   ```
6. Set **Start Command:**
   ```
   npm run start
   ```
7. Add all environment variables from the table above
8. Deploy

> **Keep-alive:** The free Render tier spins down after 15 minutes of inactivity. Use [UptimeRobot](https://uptimerobot.com) (free) to ping `/health` every 5 minutes.
