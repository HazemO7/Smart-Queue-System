# Smart Queue System — Project Documentation

> **Version:** 1.0.0 · **Stack:** Node.js · Express · MongoDB · Socket.IO · React · Vite

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Database Models](#5-database-models)
6. [Backend — REST API Reference](#6-backend--rest-api-reference)
7. [Backend — Socket.IO Events](#7-backend--socketio-events)
8. [Backend — Services](#8-backend--services)
9. [Frontend — Pages](#9-frontend--pages)
10. [Frontend — Context Providers](#10-frontend--context-providers)
11. [Frontend — Components](#11-frontend--components)
12. [Real-Time Data Flow](#12-real-time-data-flow)
13. [Queue Position Algorithm](#13-queue-position-algorithm)
14. [Notification System](#14-notification-system)
15. [Authentication & Authorization](#15-authentication--authorization)
16. [Environment Configuration](#16-environment-configuration)
17. [Local Development Setup](#17-local-development-setup)
18. [Known Constraints](#18-known-constraints)

---

## 1. Project Overview

**Smart Queue System** is a full-stack web application designed for healthcare clinics. It digitizes the physical waiting-room queue, allowing patients to pre-book appointment slots online and track their real-time position in the queue from anywhere — without waiting in person.

### Core Goals

| Goal | Implementation |
|------|----------------|
| Eliminate physical waiting lines | Patients book tickets online and monitor their turn remotely |
| Real-time queue visibility | Socket.IO pushes instant updates to every connected patient |
| Admin shift management | Admin opens, pauses, resumes, and closes daily shifts |
| Intelligent wait time estimation | Dynamic average calculated from actual service timestamps |
| Accessibility | Bilingual UI (Arabic / English), large fonts, high-contrast design |
| Automated notifications | Email and in-app alerts for booking, turn, and proximity events |

### User Roles

| Role | Capabilities |
|------|-------------|
| **Patient** | Register, browse clinics, book tickets, view real-time queue position |
| **Admin** | Start/pause/resume/close shifts, call next patient, manage appointments, view dashboard |

---

## 2. System Architecture

\`\`\`
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
│                                                                   │
│  React SPA (Vite)                                                 │
│  ┌──────────────┐  ┌───────────────────┐  ┌──────────────────┐  │
│  │  AuthContext  │  │   QueueContext     │  │NotificationCtx   │  │
│  └──────────────┘  └───────────────────┘  └──────────────────┘  │
│         │                   │ ↕ Socket.IO                  │     │
│         └───────────────────┴──────────────────────────────┘     │
└──────────────────────────────┬──────────────────────────────────┘
                                │ HTTP / WebSocket
┌──────────────────────────────▼──────────────────────────────────┐
│                      BACKEND (Node.js / Express)                  │
│                                                                   │
│  ┌───────────┐  ┌──────────────┐  ┌───────────────────────────┐ │
│  │  REST API  │  │  Socket.IO   │  │    Services               │ │
│  │  Routes    │  │  Server      │  │  waitTimeService.js       │ │
│  │  Controllers│  │  JWT Auth    │  │  emailService.js          │ │
│  └─────┬─────┘  └──────┬───────┘  └───────────────────────────┘ │
│        │                │                                         │
└────────┼────────────────┼─────────────────────────────────────────┘
         │                │
┌────────▼────────────────▼────────┐
│         MongoDB                   │
│  Users · Clinics · Queues         │
│  Tickets · Notifications          │
│  Appointments                     │
└───────────────────────────────────┘
\`\`\`

### Request Flow

\`\`\`
Patient books ticket
       │
       ▼
POST /api/ticket/book
       │
       ├─→ Validate clinic & appointment
       ├─→ Create Ticket document
       ├─→ If queue open: status = Live
       ├─→ Emit ticket:new  (clinic room)
       ├─→ Emit queue:update (each user room, with individual position)
       └─→ HTTP 201 response
\`\`\`

---

## 3. Technology Stack

### Backend

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | ^5.2.1 | HTTP server & routing |
| `mongoose` | ^9.6.2 | MongoDB ODM |
| `socket.io` | ^4.8.3 | Real-time bidirectional communication |
| `jsonwebtoken` | ^9.0.3 | JWT authentication |
| `bcryptjs` | ^3.0.3 | Password hashing |
| `nodemailer` | ^9.0.3 | Email notifications |
| `joi` | ^18.2.1 | Input validation |
| `dotenv` | ^17.4.2 | Environment variable management |
| `nodemon` | ^3.1.14 | Dev-mode auto-restart |

### Frontend

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^19.2.5 | UI framework |
| `react-router-dom` | ^7.18.0 | Client-side routing |
| `socket.io-client` | ^4.8.3 | WebSocket client |
| `axios` | ^1.18.0 | HTTP client |
| `bootstrap` | ^5.3.8 | CSS utility framework |
| `react-bootstrap` | ^2.10.10 | React Bootstrap components |
| `react-icons` | ^5.6.0 | Icon library |
| `vite` | ^8.0.10 | Dev server & bundler |

---

## 4. Project Structure

\`\`\`
Smart Queue System/
├── backend/
│   ├── .env                          # Environment variables
│   ├── app.js                        # Express app entry point
│   ├── package.json
│   └── src/
│       ├── controllers/
│       │   ├── adminController.js    # Dashboard stats
│       │   ├── appointmentController.js
│       │   ├── authController.js     # Login / Register
│       │   ├── clinicController.js   # Clinic CRUD
│       │   ├── notificationController.js
│       │   ├── queueController.js    # Shift & queue management
│       │   └── ticketController.js   # Ticket booking & lookup
│       ├── middlewares/
│       │   ├── authMiddleware.js     # JWT verifyToken + isAdmin
│       │   └── errorMiddleware.js    # Global error handler
│       ├── models/
│       │   ├── Appointment.js
│       │   ├── Clinic.js
│       │   ├── Notification.js       # TTL: 7 days
│       │   ├── Queue.js
│       │   ├── Ticket.js
│       │   └── User.js
│       ├── routes/
│       │   ├── adminRoutes.js
│       │   ├── authRoutes.js
│       │   ├── clinicRoutes.js
│       │   ├── notificationRoutes.js
│       │   ├── queueRoutes.js
│       │   └── ticketRoutes.js
│       ├── services/
│       │   ├── emailService.js       # Nodemailer templates
│       │   └── waitTimeService.js    # Position & ETA calculation
│       ├── sockets/
│       │   └── index.js              # Socket.IO server setup
│       └── seedAdmin.js              # One-time admin seeder
│
└── frontend/
    ├── vite.config.js                # Dev proxy → localhost:3000
    ├── package.json
    └── src/
        ├── App.jsx                   # Route definitions
        ├── main.jsx                  # React root + providers
        ├── index.css                 # Design system tokens
        ├── api/
        │   └── axios.js              # Pre-configured Axios instance
        ├── services/
        │   └── socket.js             # Socket.IO client singleton
        ├── context/
        │   ├── AuthContext.jsx       # JWT + user state
        │   ├── QueueContext.jsx      # Master queue state
        │   ├── SocketContext.jsx     # Socket connection lifecycle
        │   ├── NotificationContext.jsx
        │   └── LanguageContext.jsx   # i18n (Arabic / English)
        ├── components/
        │   ├── Layout.jsx
        │   ├── Navbar.jsx
        │   ├── Footer.jsx
        │   ├── ProtectedRoute.jsx
        │   ├── NotificationBell.jsx
        │   ├── NotificationDropdown.jsx
        │   └── NotificationToast.jsx
        └── pages/
            ├── LandingPage.jsx
            ├── LoginPage.jsx
            ├── RegisterPage.jsx
            ├── patient/
            │   ├── ClinicsPage.jsx
            │   ├── BookingPage.jsx
            │   └── TicketPage.jsx
            └── admin/
                ├── DashboardPage.jsx
                └── QueueManagementPage.jsx
\`\`\`

---

## 5. Database Models

### User

\`\`\`js
{
  name:     String  (required)
  phone:    String  (required, unique)
  email:    String  (optional)
  password: String  (hashed, required)
  role:     'user' | 'admin'  (default: 'user')
}
\`\`\`

### Clinic

\`\`\`js
{
  name:        String  (required)
  description: String
}
\`\`\`

### Appointment

\`\`\`js
{
  clinicId:  ObjectId → Clinic  (required)
  date:      String (YYYY-MM-DD, required, unique per clinic)
  status:    'Open' | 'Closed'  (default: 'Open')
  capacity:  Number (optional)
  booked:    Number (default: 0)
}
// Unique index: { clinicId, date }
\`\`\`

### Queue

\`\`\`js
{
  clinicId:             ObjectId → Clinic
  date:                 Date  (default: now)
  status:               'Open' | 'Paused' | 'Closed'
  currentServingNumber: Number  (default: 0)
}
// Index: { clinicId, date, status }
\`\`\`

### Ticket

\`\`\`js
{
  clinicId:     ObjectId → Clinic  (required)
  userId:       ObjectId → User    (required)
  bookingDate:  Date  (required)
  ticketNumber: Number  (required)
  queueId:      ObjectId → Queue   (null until shift starts)
  status:       'Pending' | 'Live' | 'Served' | 'No-Show'
}
// Unique index: { clinicId, bookingDate, ticketNumber }
\`\`\`

> **Decoupled Design:** A ticket is created as `Pending` (no queueId) when booked before the shift. When the admin starts the shift, all pending tickets for that day are bulk-updated to `Live` and linked to the new Queue document.

### Notification

\`\`\`js
{
  userId:  ObjectId → User
  type:    'your-turn' | 'booking-confirmed' | 'queue-started' |
           'queue-closed' | 'queue-paused' | 'queue-resumed' | 'approaching-turn'
  title:   String
  message: String
  data:    Mixed  (arbitrary metadata)
  isRead:  Boolean  (default: false)
}
// TTL index: auto-deleted after 7 days (expireAfterSeconds: 604800)
\`\`\`

---

## 6. Backend — REST API Reference

**Base URL:** `http://localhost:3000/api`

All protected routes require `Authorization: Bearer <JWT>` header.

---

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | Public | Register a new patient |
| `POST` | `/auth/login` | Public | Login and receive JWT |

**POST /auth/register**
\`\`\`json
// Request Body
{ "name": "Ahmed Ali", "phone": "01012345678", "password": "Secret123" }

// Response 201
{ "status": "success", "token": "<JWT>", "data": { "user": { ... } } }
\`\`\`

**POST /auth/login**
\`\`\`json
// Request Body
{ "phone": "01012345678", "password": "Secret123" }

// Response 200
{ "status": "success", "token": "<JWT>", "data": { "user": { ... } } }
\`\`\`

---

### Clinics

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/clinic` | Patient | List all clinics |
| `POST` | `/clinic` | Admin | Create a clinic |
| `GET` | `/clinic/:clinicId/appointments` | Patient/Admin | Get appointments for a clinic |
| `POST` | `/clinic/:clinicId/appointments` | Admin | Create an appointment slot |
| `PATCH` | `/clinic/:clinicId/appointments/:id` | Admin | Update appointment status/capacity |
| `DELETE` | `/clinic/:clinicId/appointments/:id` | Admin | Delete an appointment |

---

### Tickets

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/ticket/book` | Patient | Book a ticket for a clinic |
| `GET` | `/ticket/my-tickets` | Patient | Get today's active tickets with live position data |

**POST /ticket/book**
\`\`\`json
// Request Body
{ "clinicId": "<id>", "appointmentDate": "2026-08-04" }

// Response 201
{
  "status": "success",
  "message": "Ticket booked and activated (queue is open)",
  "data": { "ticket": { "ticketNumber": 3, "status": "Live", ... } }
}
\`\`\`

**GET /ticket/my-tickets**
\`\`\`json
// Response 200
{
  "status": "success",
  "data": {
    "tickets": [{
      "ticketNumber": 3,
      "status": "Live",
      "position": 0,
      "estimatedWaitMinutes": 0,
      "queueState": "your-turn",
      "clinicName": "Dental Clinic",
      "currentServingNumber": 2
    }]
  }
}
\`\`\`

---

### Queue Management (Admin only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/queue/start-shift` | Open today's shift; activates all pending tickets |
| `GET` | `/queue/active/:clinicId` | Get open queues for a clinic |
| `PATCH` | `/queue/next/:queueId` | Mark current patient as Served, advance queue |
| `PATCH` | `/queue/pause/:queueId` | Pause an open queue |
| `PATCH` | `/queue/resume/:queueId` | Resume a paused queue |
| `PATCH` | `/queue/close/:queueId` | Close shift; remaining tickets → No-Show |

**POST /queue/start-shift**
\`\`\`json
// Request Body
{ "clinicId": "<id>" }

// Response 201
{
  "status": "success",
  "message": "Shift started. 5 ticket(s) activated.",
  "data": { "queue": { ... }, "activatedTickets": 5 }
}
\`\`\`

---

### Admin Dashboard

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/admin/stats` | Admin | Global dashboard statistics |

**GET /admin/stats — Response**
\`\`\`json
{
  "data": {
    "totalClinics": 4,
    "totalPatients": 120,
    "todayStats": {
      "totalTickets": 18,
      "pending": 3,
      "live": 8,
      "served": 6,
      "noShow": 1
    },
    "upcomingAppointments": 12
  }
}
\`\`\`

---

### Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/notifications` | Patient | Get user's notifications |
| `PATCH` | `/notifications/:id/read` | Patient | Mark notification as read |
| `PATCH` | `/notifications/read-all` | Patient | Mark all as read |

---

## 7. Backend — Socket.IO Events

The Socket.IO server authenticates every connection using the same JWT secret as the REST API.

### Rooms

| Room Name | Who joins | Purpose |
|-----------|-----------|---------|
| `user:<userId>` | Auto-joined on connect | Personal notifications & position updates |
| `clinic:<clinicId>` | Client calls `join:clinic` | Clinic-wide broadcasts |

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join:clinic` | `clinicId: string` | Join a clinic broadcast room |
| `leave:clinic` | `clinicId: string` | Leave a clinic broadcast room |

### Server → Client

| Event | Room | Payload |
|-------|------|---------|
| `queue:started` | `clinic:<id>` | Shift opened; tickets activated |
| `queue:closed` | `clinic:<id>` | Shift closed |
| `queue:paused` | `clinic:<id>` | Queue paused |
| `queue:resumed` | `clinic:<id>` | Queue resumed |
| `queue:next` | `clinic:<id>` | Next patient called |
| `queue:update` | `user:<id>` | **Per-user** position, ETA, queueState |
| `ticket:new` | `clinic:<id>` | New ticket booked |
| `notification:new` | `user:<id>` | New persistent notification |
| `notification:yourTurn` | `user:<id>` | "It's your turn" alert |

> **Key Design:** `queue:update` is always emitted to each user's personal room with values calculated exclusively for their ticket. It is never broadcast with shared values.

**`queue:update` Payload**
\`\`\`json
{
  "clinicId": "<string>",
  "ticketNumber": 3,
  "position": 1,
  "estimatedWaitMinutes": 7,
  "queueState": "open",
  "currentServingNumber": 2
}
\`\`\`

---

## 8. Backend — Services

### `waitTimeService.js`

#### `getAvgServiceDuration(clinicId, dayStart, dayEnd)`

Calculates average minutes-per-patient from real service timestamps.

**Algorithm:**
1. Fetch all `Served` tickets for today, sorted by `updatedAt`
2. Compute consecutive `updatedAt` deltas between served tickets
3. Discard outliers: only accept deltas between `0.5` and `30` minutes
4. Return the mean; fall back to **7 minutes** if insufficient data

#### `getTicketWaitInfo(ticket, queue)`

Calculates position and ETA for one specific ticket.

\`\`\`
position = COUNT of Live tickets with ticketNumber < this ticket's ticketNumber
ETA      = ceil(position × avgServiceDuration)
\`\`\`

| Condition | Returns |
|-----------|---------|
| No queue | `queueState: 'not-started'` |
| Queue closed | `queueState: 'closed'` |
| position = 0 | `queueState: 'your-turn', estimatedWaitMinutes: 0` |
| Queue paused | `queueState: 'paused', estimatedWaitMinutes: null` |

#### `getAllTicketWaitInfo(queueId, clinicId, queue)`

Calculates position and ETA for all Live tickets in a clinic today. Used for batch socket broadcasting after any queue state change.

---

### `emailService.js`

| Function | Trigger | Content |
|----------|---------|---------|
| `sendBookingConfirmation()` | After `bookTicket` | Ticket number, date, clinic, estimated wait |
| `sendTurnNotificationEmail()` | After `callNext` | "It's your turn" alert |

Emails are fire-and-forget — errors are logged without blocking the API response.

---

## 9. Frontend — Pages

### Patient Pages

| Page | Route | Description |
|------|-------|-------------|
| `ClinicsPage` | `/clinics` | Browse clinics with real-time queue status |
| `BookingPage` | `/book/:clinicId` | Select date, confirm booking, view personal position |
| `TicketPage` | `/ticket` | Live ticket: position, countdown, queue state |

#### TicketPage Key Behaviors

- Displays `patientTicket.position` (people ahead) and `patientTicket.estimatedWaitMinutes`
- Runs a local 1-second countdown that resets when `queue:update` arrives
- Shows "Your Turn!" when `queueState === 'your-turn'` or `position === 0`
- Handles: not-started, open, paused, closed, future booking states

### Admin Pages

| Page | Route | Description |
|------|-------|-------------|
| `DashboardPage` | `/admin` | Global stats, per-clinic metrics |
| `QueueManagementPage` | `/admin/queue/:clinicId` | Queue table, controls, Appointments tab |

---

## 10. Frontend — Context Providers

Provider wrapping order in `main.jsx`:

\`\`\`
AuthProvider → SocketProvider → QueueProvider → NotificationProvider → LanguageProvider
\`\`\`

### QueueContext (Master Context)

**State:**

| State | Description |
|-------|-------------|
| `clinics` | Enriched clinic objects with real-time queue data |
| `patientTicket` | Patient's active ticket with `position` and `estimatedWaitMinutes` |
| `availableAppointments` | Fetched slots for the currently-viewed clinic |

**Key Functions:**

| Function | Description |
|----------|-------------|
| `getPosition(clinicId, ticketNumber)` | Returns people-ahead count |
| `getEstimatedWait(clinicId, ticketNumber)` | Returns minutes until turn |
| `getQueueState(clinicId)` | Returns current queue state string |
| `bookTicket(clinicId, date)` | Books ticket → calls `fetchMyTicket()` for enriched data |
| `fetchMyTicket()` | Fetches `/ticket/my-tickets` and hydrates `patientTicket` |

**Socket Architecture — Two Separate `useEffect` Hooks:**

1. **Room joining** — depends on `[socket, isConnected, clinics]`
2. **Event listeners** — depends only on `[socket, isConnected]`

> This prevents listeners from being torn down on every clinic state update, which was causing `queue:update` events to be dropped during the re-registration window.

---

## 11. Frontend — Components

| Component | Description |
|-----------|-------------|
| `Layout` | Wraps pages with Navbar + Footer |
| `Navbar` | Responsive navigation, role-aware links |
| `ProtectedRoute` | Redirects unauthenticated / wrong-role users |
| `NotificationBell` | Unread badge icon |
| `NotificationDropdown` | Scrollable notification list |
| `NotificationToast` | Animated real-time alert toast |

---

## 12. Real-Time Data Flow

### Admin Calls Next Patient

\`\`\`
Admin → PATCH /queue/next/:queueId
  ├─ Ticket #N → Served
  ├─ Queue.currentServingNumber = N
  ├─ Create "your-turn" Notification
  ├─ Emit notification:yourTurn → user:patientN
  ├─ getAllTicketWaitInfo() → recalculate ALL remaining
  ├─ For each remaining: emit queue:update → user:<id>  (individual values)
  ├─ Emit queue:next → clinic:<id>  (admin panel update)
  └─ HTTP 200
\`\`\`

### New Patient Books Into Active Queue

\`\`\`
Patient → POST /ticket/book
  ├─ Create Ticket (Live)
  ├─ Emit ticket:new → clinic:<id>
  ├─ getAllTicketWaitInfo() → recalculate ALL (including new patient)
  ├─ For each patient: emit queue:update → user:<id>
  │    existing patients: position +1
  │    new patient: initial position
  └─ HTTP 201
     Frontend: setPatientTicket(raw) → fetchMyTicket() (enriched)
\`\`\`

---

## 13. Queue Position Algorithm

**Definition:** `position` = number of Live tickets with a lower `ticketNumber` on the same `clinicId` and `bookingDate`.

\`\`\`
position = 0  →  You are next (your turn)
position = 1  →  1 person ahead of you
position = N  →  N people ahead of you
\`\`\`

**Estimated Wait Time:**
\`\`\`
ETA = ceil(position × avgServiceDuration)
\`\`\`

Default `avgServiceDuration` = **7 minutes** until real data is available.

---

## 14. Notification System

### Trigger Matrix

| Event | Type | Channel |
|-------|------|---------|
| Ticket booked | `booking-confirmed` | Email |
| Shift started | `queue-started` | In-app + Socket |
| 5 patients ahead | `approaching-turn` | In-app + Socket |
| 2 patients ahead | `approaching-turn` | In-app + Socket |
| It's your turn | `your-turn` | Email + In-app + Socket |
| Queue paused | `queue-paused` | In-app + Socket |
| Queue resumed | `queue-resumed` | In-app + Socket |
| Queue closed | `queue-closed` | In-app + Socket |

Proximity notifications (5-ahead, 2-ahead) include deduplication — only one per position per day per user.

Notifications are stored in MongoDB with a **7-day TTL index** and auto-deleted after expiry.

---

## 15. Authentication & Authorization

### JWT Payload
\`\`\`json
{ "userId": "<ObjectId>", "role": "user | admin", "iat": 0, "exp": 0 }
\`\`\`

### REST Guards
- `verifyToken` — validates Bearer token, attaches decoded payload to `req.user`
- `isAdmin` — checks `req.user.role === 'admin'`, returns 403 otherwise

### Socket Authentication
Every connection passes the JWT in `handshake.auth.token`. Unauthenticated connections are rejected before any room joins.

### Frontend
`<ProtectedRoute requiredRole="patient|admin">` redirects to `/login` if unauthenticated, or home if wrong role.

---

## 16. Environment Configuration

**File:** `backend/.env`

\`\`\`env
DB_URL=mongodb://localhost:27017/queue_system
PORT=3000
JWT_SECRET=your-secret-key

ADMIN_PHONE=01000000000
ADMIN_NAME=System Admin
ADMIN_PASSWORD=Admin1234

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Smart Queue System <your-email@gmail.com>
\`\`\`

> Email is fully optional. If not configured, emails fail silently without affecting core functionality.

---

## 17. Local Development Setup

### Prerequisites
- Node.js ≥ 18 · MongoDB (local) · npm ≥ 9

### Steps

\`\`\`bash
# 1. Install backend dependencies
cd backend && npm install

# 2. Install frontend dependencies
cd ../frontend && npm install

# 3. Configure backend/.env (see Section 16)

# 4. Seed the admin user
cd ../backend && node src/seedAdmin.js

# 5. Start backend (Terminal 1)
npm run dev          # nodemon on :3000

# 6. Start frontend (Terminal 2)
cd ../frontend && npm run dev   # Vite on :5173
\`\`\`

The Vite dev server proxies `/api` and `/socket.io` to `http://localhost:3000` — no CORS setup needed.

### Default Credentials (after seed)

| Role | Phone | Password |
|------|-------|----------|
| Admin | `ADMIN_PHONE` from `.env` | `ADMIN_PASSWORD` from `.env` |
| Patient | Register via `/register` | Your chosen password |

---

## 18. Known Constraints

| Constraint | Details |
|------------|---------|
| One shift per day | Only one Queue per clinic per day. Starting a second returns HTTP 400. |
| One ticket per patient | One active ticket per patient per clinic per day. |
| Day-scoped queries | All queue calculations are scoped to the current calendar day (`00:00–23:59`). |
| Email optional | Core functionality works without email configuration. |
| Default wait time | Defaults to 7 min/patient until 2+ patients are served in the session. |
| No-Show on close | Closing a shift auto-marks all remaining Live tickets as No-Show. |
| Single admin | One admin manages all clinics; no per-clinic admin assignment. |
