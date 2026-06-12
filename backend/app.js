const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());
require('dotenv').config();

const PORT = process.env.PORT || 3000;

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

// Using Routes

app.use('/api/auth', authRoutes);
app.use('/api/clinic', clinicRoutes);
app.use('/api/queue', queueRoutes);



// listing to the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
