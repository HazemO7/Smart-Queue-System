<div align="center">

<img src="https://img.shields.io/badge/Smart%20Queue%20System-1.0.0-4A90D9?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0wIDE4Yy00LjQxIDAtOC0zLjU5LTgtOHMzLjU5LTggOC04IDggMy41OSA4IDgtMy41OSA4LTggOHptLjUtMTNINXYyaDV2NWgyVjdoMC41eiIvPjwvc3ZnPg==" alt="Smart Queue System"/>

# 🏥 Smart Queue System

### *Digitizing Healthcare Queues — Real-Time, Patient-Centric, Clinic-Ready*

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)

<br/>

> **Smart Queue System** eliminates physical waiting lines in healthcare clinics.
> Patients book tickets online and track their real-time position from anywhere.
> Admins manage shifts, call patients, and monitor clinic activity — all in one dashboard.

<br/>

[🚀 Quick Start](#-quick-start) · [📐 Architecture](#-architecture) · [📡 API Reference](#-api-reference) · [🔌 Socket Events](#-socket-events) · [📸 Screenshots](#-screenshots)

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 👤 Patient Experience
- 📅 **Online pre-booking** for specific clinic dates
- 🎫 **Digital ticket** with a unique number
- 📍 **Live queue position** — updates in real-time
- ⏱️ **Dynamic ETA** based on actual service speeds
- 🔔 **Smart notifications** — 5 ahead, 2 ahead, your turn
- 📧 **Email alerts** for booking & turn notifications
- 🌐 **Bilingual UI** — Arabic & English

</td>
<td width="50%">

### 🛡️ Admin Control
- ▶️ **Start / Pause / Resume / Close** daily shifts
- 👆 **One-tap Next Patient** — auto-calculates all positions
- 📊 **Live dashboard** — tickets, patients, clinic stats
- 📆 **Appointment management** with slot capacity control
- 🏥 **Multi-clinic support** from one admin account
- 📋 **Real-time waiting list** with patient names & status

</td>
</tr>
</table>

---

## 📐 Architecture

```
┌────────────────────────────────────────────────────────┐
│                  React SPA  (Vite :5173)                │
│                                                          │
│   AuthContext ─ QueueContext ─ NotificationContext       │
│         │             │  ↕ WebSocket               │    │
└─────────┼─────────────┴────────────────────────────┘    │
          │                                                │
          │   HTTP REST  /api/*   +   ws /socket.io        │
          ▼                                                │
┌────────────────────────────────────────────────────────┐│
│              Node.js / Express  (:3000)                 ││
│                                                          ││
│   Routes → Controllers → Services                        ││
│              ↕                                           ││
│        Socket.IO Server  (JWT auth)                      ││
│              ↕                                           ││
│          MongoDB  (Mongoose)                             ││
│   Users · Clinics · Queues · Tickets · Notifications    ││
└────────────────────────────────────────────────────────┘│
```

### Ticket Lifecycle

```
Patient Books
     │
     ▼
  Pending ──── Admin Starts Shift ────► Live ──── Called ────► Served
     │                                                │
     │                                          Shift Closes
     │                                               │
     └───────────────────────────────────────► No-Show
```

---

## 🗂️ Project Structure

```
Smart Queue System/
├── 📁 backend/
│   ├── .env                       # Environment config
│   ├── app.js                     # Express + Socket.IO entry
│   └── src/
│       ├── controllers/           # Request handlers
│       │   ├── authController.js
│       │   ├── queueController.js  ← shift management + socket events
│       │   ├── ticketController.js ← booking + position calculation
│       │   ├── clinicController.js
│       │   ├── adminController.js
│       │   ├── notificationController.js
│       │   └── appointmentController.js
│       ├── services/
│       │   ├── waitTimeService.js  ← position & ETA algorithm
│       │   └── emailService.js     ← Nodemailer templates
│       ├── models/                # Mongoose schemas
│       │   ├── User.js  · Clinic.js  · Queue.js
│       │   ├── Ticket.js  · Notification.js  · Appointment.js
│       ├── routes/                # Express routers
│       ├── middlewares/           # JWT auth + error handler
│       ├── sockets/index.js       # Socket.IO server setup
│       └── seedAdmin.js           # One-time admin seeder
│
└── 📁 frontend/
    ├── vite.config.js             # Proxy → localhost:3000
    └── src/
        ├── App.jsx                # Route tree
        ├── index.css              # Design system tokens
        ├── context/
        │   ├── AuthContext.jsx
        │   ├── QueueContext.jsx    ← master state + socket listeners
        │   ├── SocketContext.jsx
        │   ├── NotificationContext.jsx
        │   └── LanguageContext.jsx ← i18n (AR / EN)
        ├── pages/
        │   ├── patient/
        │   │   ├── ClinicsPage.jsx
        │   │   ├── BookingPage.jsx
        │   │   └── TicketPage.jsx  ← live position + countdown
        │   └── admin/
        │       ├── DashboardPage.jsx
        │       └── QueueManagementPage.jsx
        └── components/
            ├── Navbar.jsx  · Footer.jsx  · Layout.jsx
            ├── ProtectedRoute.jsx
            └── NotificationBell/Dropdown/Toast.jsx
```

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Runtime** | Node.js | ≥ 18 |
| **Framework** | Express | 5.x |
| **Database** | MongoDB + Mongoose | 9.x |
| **Real-Time** | Socket.IO | 4.x |
| **Auth** | JSON Web Tokens (JWT) | 9.x |
| **Email** | Nodemailer | 9.x |
| **Frontend** | React | 19.x |
| **Bundler** | Vite | 8.x |
| **UI** | Bootstrap 5 + React-Bootstrap | 5.x |
| **HTTP Client** | Axios | 1.x |
| **Routing** | React Router DOM | 7.x |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **MongoDB** running locally on port `27017`
- **npm** ≥ 9

### 1 — Clone & Install

```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2 — Configure Environment

Create `backend/.env`:

```env
DB_URL=mongodb://localhost:27017/queue_system
PORT=3000
JWT_SECRET=your-strong-secret-key-here

# Admin account (seeded on first run)
ADMIN_PHONE=01000000000
ADMIN_NAME=System Admin
ADMIN_PASSWORD=Admin1234

# Email (optional — app works without it)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Smart Queue System <your-email@gmail.com>
```

### 3 — Seed Admin User

```bash
cd backend && node src/seedAdmin.js
# Output: Admin ready: 01000000000 (ObjectId...)
```

### 4 — Run

```bash
# Terminal 1 — Backend (hot-reload)
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open **http://localhost:5173**

| Role | Login |
|------|-------|
| **Admin** | Phone from `.env` + `ADMIN_PASSWORD` |
| **Patient** | Register at `/register` |

---

## 📡 API Reference

All protected routes require: `Authorization: Bearer <JWT>`

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | Public | Register patient |
| `POST` | `/api/auth/login` | Public | Login → receive JWT |

### Tickets (Patient)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/ticket/book` | Patient | Book a ticket |
| `GET` | `/api/ticket/my-tickets` | Patient | Active tickets with live position |

### Queue Management (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/queue/start-shift` | Open shift · activate pending tickets |
| `PATCH` | `/api/queue/next/:queueId` | Serve next patient |
| `PATCH` | `/api/queue/pause/:queueId` | Pause queue |
| `PATCH` | `/api/queue/resume/:queueId` | Resume queue |
| `PATCH` | `/api/queue/close/:queueId` | Close shift |
| `GET` | `/api/queue/active/:clinicId` | Get open queues |

### Clinics & Appointments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/clinic` | Patient | List clinics |
| `POST` | `/api/clinic` | Admin | Create clinic |
| `GET` | `/api/clinic/:id/appointments` | Any | Get available dates |
| `POST` | `/api/clinic/:id/appointments` | Admin | Add appointment slot |
| `PATCH` | `/api/clinic/:id/appointments/:apptId` | Admin | Update slot |
| `DELETE` | `/api/clinic/:id/appointments/:apptId` | Admin | Remove slot |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/stats` | Dashboard stats |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/notifications` | Get user's notifications |
| `PATCH` | `/api/notifications/:id/read` | Mark one as read |
| `PATCH` | `/api/notifications/read-all` | Mark all as read |

---

## 🔌 Socket Events

### Rooms

```
user:<userId>      ← auto-joined on connect (personal updates)
clinic:<clinicId>  ← joined by client after page load (clinic broadcasts)
```

### Events Reference

| Direction | Event | Room | Description |
|-----------|-------|------|-------------|
| Client → Server | `join:clinic` | — | Subscribe to clinic updates |
| Server → Client | `queue:started` | clinic | Shift opened |
| Server → Client | `queue:paused` | clinic | Queue paused |
| Server → Client | `queue:resumed` | clinic | Queue resumed |
| Server → Client | `queue:closed` | clinic | Shift ended |
| Server → Client | `queue:next` | clinic | Next patient called |
| Server → Client | `ticket:new` | clinic | New booking |
| Server → Client | **`queue:update`** | **user** | **Per-user position + ETA** |
| Server → Client | `notification:new` | user | Persistent notification |
| Server → Client | `notification:yourTurn` | user | "It's your turn" alert |

### `queue:update` Payload

```json
{
  "clinicId": "64abc...",
  "ticketNumber": 3,
  "position": 1,
  "estimatedWaitMinutes": 7,
  "queueState": "open",
  "currentServingNumber": 2
}
```

> `queue:update` is always sent to the **personal user room** with values calculated exclusively for that ticket — never broadcast with shared data.

---

## 🧮 Queue Position Algorithm

```
position = COUNT of Live tickets where ticketNumber < your ticketNumber
                    (same clinic · same booking date)

ETA = ceil(position × avgServiceDuration)

avgServiceDuration = mean of consecutive served-ticket time deltas today
                     (filtered: 0.5 – 30 min to discard outliers)
                     fallback: 7 minutes per patient
```

| position | Meaning | queueState |
|----------|---------|-----------|
| 0 | You are next | `your-turn` |
| 1 | 1 person ahead | `open` |
| N | N people ahead | `open` |

---

## 🔔 Notification Triggers

| Trigger | Type | Channel |
|---------|------|---------|
| Ticket booked | `booking-confirmed` | ✉️ Email |
| Shift started | `queue-started` | 🔔 In-app |
| 5 patients ahead | `approaching-turn` | 🔔 In-app |
| 2 patients ahead | `approaching-turn` | 🔔 In-app |
| **Your turn** | `your-turn` | ✉️ Email + 🔔 In-app |
| Queue paused | `queue-paused` | 🔔 In-app |
| Queue resumed | `queue-resumed` | 🔔 In-app |
| Queue closed | `queue-closed` | 🔔 In-app |

> Proximity alerts (5-ahead, 2-ahead) are deduplicated — each fires at most once per patient per day.
> All notifications auto-delete after **7 days** via MongoDB TTL index.

---

## 🗺️ Frontend Routes

| Route | Role | Page |
|-------|------|------|
| `/` | Public | Landing page |
| `/login` | Public | Login |
| `/register` | Public | Register |
| `/clinics` | Patient | Browse clinics |
| `/book/:clinicId` | Patient | Book a ticket |
| `/ticket` | Patient | Live ticket tracker |
| `/admin` | Admin | Dashboard |
| `/admin/queue/:clinicId` | Admin | Queue management |

---

## ⚠️ Known Constraints

| Constraint | Detail |
|------------|--------|
| One shift per day | One active queue per clinic per calendar day |
| One ticket per patient | One active ticket per patient per clinic per day |
| Day-scoped | All queue calculations are scoped to `00:00–23:59` today |
| No-Show on close | Closing a shift marks all remaining Live tickets as No-Show |
| Single admin | One global admin manages all clinics |
| Email optional | App works fully without email configuration |

---

## 👥 Author

**Hazem Abdelaziz Abdelrahman**
Capstone Project · Second Semester · 2026

---

<div align="center">

*Making healthcare visits easier for everyone.*

**© 2026 Smart Queue System. All rights reserved.**

</div>
