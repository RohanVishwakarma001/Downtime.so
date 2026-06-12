# Downtime.so

A self-hosted, open-source status page platform. Create public status pages, manage incidents, send email/SMS notifications, and receive alerts from monitoring tools like UptimeRobot and Datadog.

## Architecture

```
Downtime.so/
├── client/              # Next.js 14 frontend (App Router)
├── server/              # Express.js + TypeScript API
└── docker-compose.yml   # Local dev: PostgreSQL + Redis
```

**Client** → Vercel  
**Server** → Render (or any Node.js host)  
**Database** → Neon (PostgreSQL)  
**Cache/Queue** → Upstash (Redis)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, TanStack Query, Framer Motion |
| Backend | Express.js, TypeScript, Prisma ORM |
| Database | PostgreSQL |
| Queue | BullMQ + Redis |
| Email | Resend |
| SMS | Twilio |
| Real-time | Server-Sent Events (SSE) + Redis Pub/Sub |

## Features

- **Public status pages** — shareable at `/status/:orgSlug`
- **Incident management** — create, update, and resolve incidents with timeline updates
- **Email & SMS notifications** — notify subscribers when incidents occur or update
- **Webhook ingestion** — UptimeRobot, Datadog, and generic webhooks
- **REST API** — manage services and incidents programmatically via API key
- **Real-time updates** — SSE-powered live status pages (no polling)
- **Multi-tenant** — each organization is fully isolated

## Quick Start (Local Dev)

### Prerequisites

- Node.js 18+
- Docker (for PostgreSQL and Redis)

### 1. Start infrastructure

```bash
docker-compose up -d
```

This starts PostgreSQL on port `5432` and Redis on port `6379`.

### 2. Set up the server

```bash
cd server
cp .env.example .env       # fill in your values
npm install
npx prisma migrate dev
npm run dev
```

### 3. Set up the client

```bash
cd client
cp .env.example .env.local  # fill in your values
npm install
npm run dev
```

The API runs on `http://localhost:4000` and the client on `http://localhost:3000`.

## Deployment

See the individual READMEs for deployment instructions:

- [Server README](./server/README.md) — deploy to Render
- [Client README](./client/README.md) — deploy to Vercel

## Project Structure

```
client/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Login, Register pages
│   │   ├── (dashboard)/     # Protected dashboard pages
│   │   ├── (status)/        # Public status pages
│   │   └── page.tsx         # Landing page
│   ├── components/
│   │   ├── ui/              # Reusable UI components
│   │   └── CreateIncidentModal.tsx
│   └── lib/
│       ├── api.ts           # Axios instances + interceptors
│       ├── auth.ts          # Token storage helpers
│       └── utils.ts         # Shared utilities

server/
├── src/
│   ├── lib/
│   │   ├── prisma.ts        # Prisma client singleton
│   │   ├── queue.ts         # BullMQ queue setup
│   │   └── redis.ts         # Redis client
│   ├── middleware/
│   │   ├── auth.ts          # JWT authentication
│   │   └── apiKey.ts        # API key auth + rate limiting
│   ├── routes/
│   │   ├── auth.ts          # /api/auth
│   │   ├── services.ts      # /api/v1/services
│   │   ├── incidents.ts     # /api/v1/incidents
│   │   ├── subscribers.ts   # /api/v1/subscribers
│   │   ├── webhooks.ts      # /api/webhooks
│   │   ├── sse.ts           # /api/sse
│   │   └── public.ts        # /api/v1/public
│   ├── services/
│   │   └── notifications.ts # Email + SMS sending
│   ├── index.ts             # Express app entry point
│   └── worker.ts            # BullMQ notification worker
└── prisma/
    └── schema.prisma        # Database schema
```

## License

MIT
