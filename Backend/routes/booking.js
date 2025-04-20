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
    getAvailableGuides,
    updatePaymentStatus,
    updatePaymentMethod,
    markUserPaymentConfirmed,      // ✅ USER confirms payment
    markGuidePaymentConfirmed,     // ✅ GUIDE confirms payment
    // Add new debug controller functions
    debugAllBookings,
    setTestRating,
    debugGetRatings
} = require('../controllers/booking');

// Existing routes
router.post('/request', isAuth, isUser, requestBooking);
router.get('/user-bookings', isAuth, getUserBookings);
router.get('/latest-booking', isAuth, getLatestBooking);
router.get('/requests', isAuth, isGuide, getBookingRequests);
router.get('/all-requests', isAuth, isGuide, getAllBookingRequests);
router.put('/respond/:bookingId', isAuth, isGuide, respondToBooking);
router.put('/complete/:bookingId', isAuth, isGuide, completeTour);
router.get('/search', isAuth, isGuide, searchBookings);
router.put('/payment/:bookingId', isAuth, isGuide, updatePaymentStatus);
router.put('/payment-method/:bookingId', isAuth, isGuide, updatePaymentMethod);
router.put('/mark-user-payment/:bookingId', isAuth, isUser, markUserPaymentConfirmed);
router.put('/mark-guide-payment/:bookingId', isAuth, isGuide, markGuidePaymentConfirmed);
router.get('/status/:bookingId', isAuth, getBookingStatus);
router.get('/booked-dates', isAuth, getBookedDates);
router.get('/available-guides', isAuth, isUser, getAvailableGuides);

// Add debug routes - no authentication for easier testing
router.get('/debug/all-bookings', debugAllBookings);
router.post('/debug/set-test-rating', setTestRating);
router.get('/debug/get-ratings', debugGetRatings);

module.exports = router;