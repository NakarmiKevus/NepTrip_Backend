const express = require('express');
const router = express.Router();
const { isAuth } = require('../middlewares/auth');
const { 
    requestBooking, 
    getBookingRequests, 
    respondToBooking, 
    getUserBookings, 
    getBookingStatus 
} = require('../controllers/booking');

// User requests a guide
router.post('/request', isAuth, requestBooking);

// Guide fetches requests
router.get('/requests', isAuth, getBookingRequests);

// Guide accepts/declines a request
router.put('/respond/:bookingId', isAuth, respondToBooking);

// User fetches their bookings
router.get('/user-bookings', isAuth, getUserBookings);

// User fetches a specific booking status
router.get('/status/:bookingId', isAuth, getBookingStatus);

module.exports = router;
