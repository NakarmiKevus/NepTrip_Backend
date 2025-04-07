const express = require('express');
const router = express.Router();
const { isAuth, isUser, isGuide } = require('../middlewares/auth');
const { 
    requestBooking, 
    getBookingRequests,
    getAllBookingRequests, 
    respondToBooking, 
    getUserBookings, 
    getBookingStatus,
    getLatestBooking,
    completeTour,
    searchBookings,
    getBookedDates,
    updatePaymentStatus,
    updatePaymentMethod // New controller for updating payment method
} = require('../controllers/booking');

// ✅ User routes
router.post('/request', isAuth, isUser, requestBooking);
router.get('/user-bookings', isAuth, getUserBookings);
router.get('/latest-booking', isAuth, getLatestBooking);

// ✅ Guide routes
router.get('/requests', isAuth, isGuide, getBookingRequests); // Get only pending requests
router.get('/all-requests', isAuth, isGuide, getAllBookingRequests); // Get all requests
router.put('/respond/:bookingId', isAuth, isGuide, respondToBooking);
router.put('/complete/:bookingId', isAuth, isGuide, completeTour);
router.get('/search', isAuth, isGuide, searchBookings);

// ✅ Payment routes
router.put('/payment/:bookingId', isAuth, isGuide, updatePaymentStatus);
router.put('/payment-method/:bookingId', isAuth, isGuide, updatePaymentMethod); // New route for updating payment method

// ✅ Common routes
router.get('/status/:bookingId', isAuth, getBookingStatus);

// ✅ Get booked dates (for disabling in calendar)
router.get('/booked-dates', isAuth, isUser, getBookedDates);

module.exports = router;