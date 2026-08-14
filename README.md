# Tickette — IT Help Desk Ticketing System

A full-stack, real-time-feel ticketing web application: users raise tickets, the IT desk
resolves them (with photo proof), and admins run the whole show. Inspired by the concept
of [hazzillrodriguez/Tickette](https://github.com/hazzillrodriguez/Tickette), rebuilt from
the ground up as a **React (Vite) + Express + SQL (PostgreSQL)** stack with a much richer
workflow and a modern, colorful UI.

```
tickette/
├── backend/                  Express API + PostgreSQL database
│   ├── src/
│   │   ├── db/
│   │   │   ├── connection.js  PostgreSQL connection (pg)
│   │   │   └── seed.js        Demo users, ticket types & tickets
│   │   ├── middleware/
│   │   │   ├── auth.js        JWT auth + role guard
│   │   │   └── upload.js      Multer image upload (resolution proof)
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── users.routes.js
│   │   │   ├── ticketTypes.routes.js
│   │   │   ├── tickets.routes.js
│   │   │   ├── comments.routes.js
│   │   │   └── dashboard.routes.js
│   │   └── index.js           App entry point
│   ├── uploads/                Uploaded proof-of-resolution images
│   ├── .env.example
│   └── package.json
├── frontend/                  React 18 + Vite + Tailwind CSS
│   └── src/
│       ├── api/axios.js
│       ├── context/AuthContext.jsx
│       ├── components/        Layout, badges, cards, modal
│       └── pages/             Login, Dashboard, Tickets, Admin screens…
└── package.json                Root convenience scripts
```

## ✨ Features

**Three roles, one app**
- **Admin** — full control: create/manage users (admin, IT desk, end user), manage ticket
  types, view every ticket, reassign tickets, force any status change, dashboards with
  charts, per-agent workload.
- **IT Desk** — a personal queue, claim unassigned tickets, move tickets through the
  workflow, comment with **photo attachments as proof of completion**, mark a comment as
  the official "resolution proof".
- **User** — raise a ticket (pick a type, priority, description), track it through its
  full status timeline, comment, and see exactly when it was raised and resolved.

**Ticket workflow (SQL-backed, enforced server-side)**

```
Open → In Progress → On Hold → In Progress → Resolved → Closed
                                          ↳ Reopened → In Progress …
```
Every transition is written to a `ticket_status_history` table, so each ticket has a full
audit trail of who changed what, when, and why.

**Other details**
- JWT authentication with bcrypt-hashed passwords.
- Ticket reference numbers (`TCK-1001`, `TCK-1002`, …).
- Priority levels (Low/Medium/High/Urgent) with visual badges.
- Comment threads support text + an optional image upload (stored on disk, served via
  `/uploads`), perfect for "here's the fixed screen" proof shots.
- Dashboard with status/priority/type breakdowns (pie + bar charts) and average resolution
  time, scoped to what each role is allowed to see.
- Seeded with realistic demo data so it works as a proof-of-concept the moment you run it.

## 🧱 Tech stack

| Layer     | Choice                                              |
|-----------|------------------------------------------------------|
| Frontend  | React 18, Vite, React Router, Tailwind CSS, Recharts, Lucide icons |
| Backend   | Node.js, Express                                     |
| Database  | PostgreSQL via `pg`                                   |
| Auth      | JSON Web Tokens + bcrypt                             |
| Uploads   | Multer (image proof-of-resolution attachments)       |

> The database is PostgreSQL, so you'll need a running PostgreSQL server (local install,
> Docker container, or a hosted instance) and a connection string configured in
> `backend/.env`. The schema (`backend/src/db/connection.js`) is plain SQL.

## 🚀 Getting started

### 1. Requirements
- Node.js 18+ and npm
- PostgreSQL 14+ (running locally, in Docker, or hosted — e.g. Postgres.app, `apt install
  postgresql`, or a managed service like Supabase/RDS/Neon)
- (No Python/virtualenv needed — this stack is Node end-to-end. If your workflow expects a
  "virtual env", the Node equivalent is simply each app's own `node_modules/`, which is what
  `npm install` creates — there's no extra activation step.)

### 2. Unzip and install

```bash
unzip tickette.zip
cd tickette

# install backend dependencies
cd backend
npm install
cp .env.example .env   # edit with your PostgreSQL connection details

# install frontend dependencies
cd ../frontend
npm install
```

Or, from the project root, install both at once:
```bash
npm run install:all
```

### 3. Create the database and seed it

Create an empty PostgreSQL database (name of your choosing, e.g. `tickette`), then point
`DATABASE_URL` in `backend/.env` at it, for example:

```
DATABASE_URL=postgresql://username:password@localhost:5432/tickette
```

Then run the seed script, which creates the schema and loads demo users, ticket types, and
sample tickets:

```bash
cd backend
npm run seed
```

### 4. Run it

Open **two terminals**:

```bash
# Terminal 1 — API on http://localhost:5000
cd backend
npm run dev
```

```bash
# Terminal 2 — Web app on http://localhost:5173
cd frontend
npm run dev
```

Or, from the project root (after `npm install` there too, for `concurrently`):
```bash
npm install
npm run dev
```

Then open **http://localhost:5173**.

### 5. Demo accounts

| Role     | Email                  | Password     |
|----------|-------------------------|--------------|
| Admin    | admin@tickette.com      | Admin@123    |
| IT Desk  | itdesk@tickette.com     | ItDesk@123   |
| IT Desk  | itdesk2@tickette.com    | ItDesk@123   |
| User     | user@tickette.com       | User@123     |
| User     | sofia@tickette.com      | User@123     |

Demo credentials are also one-tap fillable from the login screen.

## 🗄️ Database schema (SQL)

```sql
users(id, name, email, password_hash, role, department, avatar_color, is_active, created_at)
ticket_types(id, name, description, icon, color, created_at)
tickets(id, reference, title, description, ticket_type_id, priority, status,
        raised_by, assigned_to, raised_at, resolved_at, closed_at, updated_at)
ticket_comments(id, ticket_id, user_id, comment, attachment_path, is_resolution_proof, created_at)
ticket_status_history(id, ticket_id, from_status, to_status, changed_by, note, changed_at)
```

To reseed from scratch, stop the server, drop and recreate the PostgreSQL database (or
`TRUNCATE` all tables), then run `npm run seed` again.

## 🔌 API overview

All endpoints are under `/api` and (except `/api/auth/login`) require
`Authorization: Bearer <token>`.

| Method & path                          | Who            | What |
|-----------------------------------------|----------------|------|
| `POST /api/auth/login`                  | anyone         | Log in, get a JWT |
| `GET  /api/auth/me`                     | any logged in  | Current user |
| `POST /api/auth/change-password`        | any logged in  | Change own password |
| `GET  /api/tickets`                     | any logged in  | List tickets (scoped: users see only their own) |
| `POST /api/tickets`                     | any logged in  | Raise a ticket |
| `GET  /api/tickets/:id`                 | any logged in  | Ticket detail + comments + history |
| `PATCH /api/tickets/:id/status`         | admin, itdesk  | Move ticket through the workflow |
| `PATCH /api/tickets/:id/assign`         | admin, itdesk  | Assign/claim a ticket |
| `PUT  /api/tickets/:id`                 | admin          | Edit ticket title/type/priority |
| `POST /api/tickets/:id/comments`        | any logged in  | Add a comment (+ optional image) |
| `GET  /api/ticket-types`                | any logged in  | List ticket types |
| `POST/PUT/DELETE /api/ticket-types/:id` | admin          | Manage ticket types |
| `GET  /api/users`                       | admin (all) / any (filter by role) | List users |
| `POST/PUT/DELETE /api/users/:id`        | admin          | Manage users |
| `POST /api/users/:id/reset-password`    | admin          | Reset a user's password |
| `GET  /api/dashboard`                   | any logged in  | Stats, scoped by role |

## 🎨 UI notes

The interface uses a custom indigo/violet design system (Tailwind tokens in
`frontend/tailwind.config.js`), a paired display/body typeface (Sora + Inter), soft glow
shadows, animated transitions, and role-aware navigation — built to feel like a real
product rather than a bare-bones CRUD scaffold.

## 📦 Production build

```bash
cd frontend
npm run build      # outputs static assets to frontend/dist
```
Serve `frontend/dist` with any static host, and run `backend` as a normal Node service
(e.g. `npm start`, behind a process manager like pm2). Set `CLIENT_ORIGIN` in
`backend/.env` to your deployed frontend URL, point `DATABASE_URL` at your production
PostgreSQL instance, and update `frontend`'s API base URL / reverse-proxy config to point
`/api` and `/uploads` at the backend.

## 🔒 Security notes (for a real deployment)

This is a proof-of-concept. Before shipping to real users: rotate `JWT_SECRET` to a long
random value, put the app behind HTTPS, add rate limiting on `/api/auth/login`, secure your
PostgreSQL instance (strong credentials, restricted network access, SSL connections), and
move uploaded files to object storage (S3, etc.) instead of local disk.
