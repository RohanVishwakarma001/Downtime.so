# Downtime.so — Client

Next.js 14 frontend for Downtime.so. Includes a dashboard for managing services and incidents, public status pages with real-time SSE updates, and a subscriber notification system.

## Tech Stack

- **Framework:** Next.js 14.1 (App Router)
- **Language:** TypeScript 5.0
- **Styling:** Tailwind CSS 3.4 with a custom dark theme
- **Data Fetching:** TanStack React Query 5.0
- **HTTP Client:** Axios 1.6 with automatic token refresh
- **Animation:** Framer Motion 11.0
- **Icons:** Lucide React
- **Toasts:** react-hot-toast

## Getting Started

### Prerequisites

- Node.js 18+
- Server running at `http://localhost:4000` (see [server README](../server/README.md))

### Installation

```bash
npm install
cp .env.example .env.local   # fill in your values
npm run dev
```

The app runs on `http://localhost:3000`.

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (e.g. `https://your-server.onrender.com`) |
| `NEXT_PUBLIC_APP_URL` | This app's public URL (e.g. `https://app.downtime.so`) |

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run start` | Serve production build |
| `npm run lint` | Run ESLint |

## Application Structure

```
src/
├── app/
│   ├── (auth)/               # Unauthenticated pages
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/          # Protected pages (JWT required)
│   │   ├── layout.tsx        # Sidebar, nav, auth guard
│   │   ├── dashboard/        # Overview with stats + recent activity
│   │   ├── dashboard/services/
│   │   ├── dashboard/incidents/
│   │   ├── dashboard/incidents/[id]/  # Incident detail + timeline
│   │   ├── dashboard/subscribers/
│   │   └── dashboard/settings/       # API key, org info
│   ├── (status)/             # Public pages
│   │   └── status/[orgSlug]/ # Public status page
│   ├── providers.tsx          # React Query + Toast providers
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx              # Landing page
├── components/
│   ├── ui/
│   │   ├── StatusBadge.tsx   # Service/incident status indicator
│   │   └── IncidentTimeline.tsx
│   └── CreateIncidentModal.tsx
└── lib/
    ├── api.ts                # Axios instances
    ├── auth.ts               # Token storage helpers
    └── utils.ts              # cn(), formatRelativeTime(), etc.
```

## Pages

### Landing Page (`/`)

Marketing page with features overview, pricing section, and API usage example. Links to `/register` and `/login`.

---

### Auth Pages

#### `/login`

Email + password login form. On success, stores tokens and redirects to `/dashboard`.

#### `/register`

Creates a new user and organization. Fields: name, organization name, email, password.

---

### Dashboard Pages

All dashboard pages are protected. Unauthenticated users are redirected to `/login`.

#### `/dashboard`

Overview page showing:
- Stat cards: active incidents, total services, total subscribers
- Services table (latest 6)
- Recent incidents table (latest 5)
- **Create Incident** button

#### `/dashboard/services`

Full services list with CRUD operations. Shows current status badge and subscriber count per service.

#### `/dashboard/incidents`

Paginated incidents list. Filterable by status (`INVESTIGATING`, `IDENTIFIED`, `MONITORING`, `RESOLVED`).

#### `/dashboard/incidents/:id`

Incident detail view with full update timeline. Allows adding timeline updates and changing incident status.

#### `/dashboard/subscribers`

Paginated list of all subscribers across all services. Shows email, phone, subscribed service, and notification history.

#### `/dashboard/settings`

Organization settings including:
- Org name and slug
- API key (copy to clipboard)
- Link to your public status page

---

### Public Status Page (`/status/:orgSlug`)

Publicly accessible. No authentication required.

**Features:**
- Shows all services and their current statuses
- Overall system status banner (derived from worst service status)
- Active incidents with full update timelines
- Live updates via SSE — no page refresh needed
- Subscribe form (email and/or phone)
- Live connection indicator

**Real-time events handled:**
| Event | Action |
|---|---|
| `service_status_changed` | Updates service status badge in place |
| `incident_created` | Adds incident to active list |
| `incident_updated` | Updates incident status |
| `incident_update_posted` | Appends update to timeline |
| Heartbeat | Keeps SSE connection alive |

---

## Key Libraries

### `src/lib/api.ts`

Two Axios instances:

**`api`** — authenticated, for dashboard use  
- Attaches `Authorization: Bearer <token>` to every request  
- On `401`: automatically refreshes the access token, retries the original request  
- If refresh fails: clears tokens, redirects to `/login`  
- Queues concurrent 401s so only one refresh request is made

**`publicApi`** — unauthenticated, for status pages and subscription forms

---

### `src/lib/auth.ts`

localStorage helpers for token and user management.

| Function | Description |
|---|---|
| `getToken()` | Read access token |
| `setToken(token)` | Store access token |
| `getRefreshToken()` | Read refresh token |
| `setRefreshToken(token)` | Store refresh token |
| `clearToken()` | Remove all auth data (logout) |
| `isAuthenticated()` | Check if user is logged in |
| `getUser()` | Read cached user object |
| `setUser(user)` | Cache user object |

All functions are SSR-safe and return `null` on the server.

---

### `src/lib/utils.ts`

| Function | Description |
|---|---|
| `cn(...classes)` | Merge Tailwind class strings |
| `formatRelativeTime(date)` | Returns `"5m ago"`, `"2h ago"`, etc. |
| `formatDateTime(date)` | Full locale date/time string |
| `copyToClipboard(text)` | Copies text to clipboard |

---

## Components

### `StatusBadge`

```tsx
<StatusBadge status="OPERATIONAL" size="md" />
```

**Statuses:** `OPERATIONAL` | `DEGRADED` | `PARTIAL_OUTAGE` | `MAJOR_OUTAGE` | `MAINTENANCE`  
**Sizes:** `sm` | `md` | `lg`

Non-operational statuses show a pulsing dot indicator.

---

### `IncidentTimeline`

```tsx
<IncidentTimeline updates={incident.updates} />
```

Renders a vertical timeline of incident updates with staggered Framer Motion animations. Each entry shows status, message, and relative timestamp.

---

### `CreateIncidentModal`

```tsx
<CreateIncidentModal isOpen={open} onClose={() => setOpen(false)} />
```

Full modal with fields: title, affected service (dropdown), impact level, and initial message. Invalidates React Query caches on success.

---

## Theme

Custom dark theme defined in `tailwind.config.ts`:

| Token | Value | Usage |
|---|---|---|
| `background` | `#09090b` | Page background |
| `surface` | `#111113` | Cards, panels |
| `border` | `#27272a` | Dividers, input borders |
| `muted` | `#71717a` | Secondary text |
| `foreground` | `#fafafa` | Primary text |
| `primary` | `#6366f1` | Buttons, links, accents |
| `operational` | `#22c55e` | Operational status |
| `degraded` | `#eab308` | Degraded status |
| `partial` | `#f97316` | Partial outage |
| `major` | `#ef4444` | Major outage |
| `maintenance` | `#3b82f6` | Maintenance |

Custom animations: `pulse-slow`, `fade-in`, `slide-up`.

---

## Authentication Flow

1. User logs in → API returns `accessToken` (15m) + `refreshToken` (7d)
2. Tokens stored in `localStorage`
3. Every request: Axios interceptor attaches `Authorization: Bearer <accessToken>`
4. On `401` response: interceptor calls `POST /api/auth/refresh`, retries original request
5. If refresh fails: `clearToken()` + redirect to `/login`
6. Logout: calls `POST /api/auth/logout` with refresh token, then `clearToken()`

---

## Deployment (Vercel)

1. Push your repo to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Set **Root Directory** to `client`
4. Add environment variables:
   - `NEXT_PUBLIC_API_URL` → your Render server URL
   - `NEXT_PUBLIC_APP_URL` → your Vercel deployment URL
5. Deploy

Vercel auto-deploys on every push to `main`.
