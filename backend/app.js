const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { initializeSocket } = require('./src/sockets');

const app = express();
app.use(cors());
app.use(express.json());
require('dotenv').config();

const PORT = process.env.PORT || 3000;

// Create HTTP server for Socket.io
const server = http.createServer(app);

// Initialize Socket.io and make it accessible in controllers via req.app.get('io')
const io = initializeSocket(server);
app.set('io', io);

// Connect to MongoDB   
async function connectDB() {
    try {
        await mongoose.connect(process.env.DB_URL);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.log('Error connecting to MongoDB');
    }
}

connectDB();

// Importing Routes
const authRoutes = require('./src/routes/authRoutes');
const clinicRoutes = require('./src/routes/clinicRoutes');
const queueRoutes = require('./src/routes/queueRoutes');
const ticketRoutes = require('./src/routes/ticketRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');

// Using Routes
app.use('/api/auth', authRoutes);
app.use('/api/clinic', clinicRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/ticket', ticketRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Use server.listen instead of app.listen so Socket.io shares the same HTTP server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
