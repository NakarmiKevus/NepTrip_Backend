const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());





// Import routes
const userRoutes = require('./Backend/routes/user');
const userController = require('./Backend/controllers/user');
const bookingRoutes = require('./Backend/routes/booking');


// Use routes
app.use('/api/user', userRoutes);
app.use('/api/booking', bookingRoutes);


// Database connection
require('./Backend/Models/db');

// Create default users after DB connection
// Call this after the database is connected
setTimeout(() => {
    userController.createDefaultUsers();
}, 2000);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});

module.exports = app;