const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Use middleware  
app.use(cors()); // Allow API access from other websites  
app.use(express.json()); // Read JSON data  

// Import routes  
const userRoutes = require('./Backend/routes/user');
const userController = require('./Backend/controllers/user');
const bookingRoutes = require('./Backend/routes/booking');
const dashboardRoutes = require('./Backend/routes/DashboardRoutes');

// Set up routes  
app.use('/api/user', userRoutes); // User routes  
app.use('/api/booking', bookingRoutes); // Booking routes  
app.use('/api/dashboard', dashboardRoutes); // Dashboard routes  

// Connect to the database  
require('./Backend/Models/db');

// Create default users after a short delay  
setTimeout(() => {
    userController.createDefaultUsers();
}, 2000);

// Handle wrong API paths  
app.use('*', (req, res) => {
    res.status(404).json({ success: false, message: 'API not found' });
});

// Handle errors  
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Something went wrong!' });
});

// Start the server  
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});

module.exports = app;
