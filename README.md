# 🏥 Smart Queue System

A full-stack, real-time queue management application designed for clinics and service centers. This system allows patients to book tickets and track their turn in real-time, while providing administrators with a powerful dashboard to manage queue flow efficiently.

## 🚀 Features

*   **Real-Time Updates:** Live queue number tracking for patients using WebSockets (Socket.io) without needing page reloads.
*   **Role-Based Access Control:** Distinct interfaces and permissions for `Admins` (staff) and `Patients`.
*   **Advanced Authentication:** Secure login system using JWT (JSON Web Tokens) with HttpOnly cookies.
*   **Queue Management:** Admins can open new daily queues, call the next patient, and close shifts.
*   **Smart Ticketing:** Automated sequential ticket generation linked to specific clinics and patients.
*   **Mobile-First Design:** Fully responsive UI optimized for mobile devices used by waiting patients.

## 💻 Tech Stack

**Frontend:**
*   React.js (Vite)
*   Redux Toolkit (State Management)
*   React Router Dom (Protected & Dynamic Routing)
*   Axios (with Interceptors)
*   Socket.io-client
*   Bootstrap / Tailwind CSS

**Backend:**
*   Node.js & Express.js
*   MongoDB & Mongoose (Database & ODM)
*   Socket.io (Real-time WebSockets)
*   JSON Web Tokens (Auth)
*   Bcrypt.js (Password Hashing)
*   Joi / Zod (Data Validation)

## 📂 Project Architecture (MVC)

The project follows a strict Model-View-Controller architecture.
```text
smart-queue-system/
├── backend/                  # Node.js & Express Server
│   ├── src/
│   │   ├── config/           # DB and App configurations
│   │   ├── controllers/      # Business logic (Auth, Queue, Ticket)
│   │   ├── middlewares/      # Error handling, Auth protection
│   │   ├── models/           # Mongoose Schemas (User, Queue, Ticket)
│   │   ├── routes/           # API Endpoints
│   │   └── sockets/          # Socket.io event handlers
│   └── server.js             # Entry Point
│
└── frontend/                 # React UI
    ├── src/
    │   ├── api/              # Axios configurations
    │   ├── components/       # Reusable UI elements
    │   ├── pages/            # View components (Lazy loaded)
    │   ├── store/            # Redux slices
    │   └── App.jsx
    └── index.html
🛠️ Installation & Setup
Prerequisites
Node.js (v16 or higher)

MongoDB (Local instance or MongoDB Atlas URI)

1. Clone the repository
Bash
git clone [https://github.com/yourusername/smart-queue-system.git](https://github.com/yourusername/smart-queue-system.git)
cd smart-queue-system
2. Backend Setup
Bash
cd backend
npm install
Create a .env file in the backend directory and add the following variables:

Code snippet
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
NODE_ENV=development
Start the backend server:

Bash
npm run dev
3. Frontend Setup
Open a new terminal window/tab:

Bash
cd frontend
npm install
Create a .env file in the frontend directory:

Code snippet
VITE_API_BASE_URL=http://localhost:5000/api
Start the React development server:

Bash
npm run dev
📡 Core API Endpoints
Auth:

POST /api/auth/register - Register a new user

POST /api/auth/login - Login and receive cookie

Queues (Admins):

POST /api/queues - Open a new queue

GET /api/queues/active - List open queues

PATCH /api/queues/:id/close - Close a queue

Tickets:

POST /api/tickets - Book a turn (Patient)

PATCH /api/tickets/:id/next - Call next patient (Admin - Emits Socket Event)

📝 License
This project was built as a Capstone Engineering Project.
