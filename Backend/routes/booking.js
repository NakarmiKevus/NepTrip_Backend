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
    markGuidePaymentConfirmed      // ✅ GUIDE confirms payment
} = require('../controllers/booking');

// ✅ User can request a booking
router.post('/request', isAuth, isUser, requestBooking);

// ✅ User can get their bookings
router.get('/user-bookings', isAuth, getUserBookings);

// ✅ User can get their latest booking
router.get('/latest-booking', isAuth, getLatestBooking);

// ✅ Guide can get pending booking requests
router.get('/requests', isAuth, isGuide, getBookingRequests);

// ✅ Guide can get all booking requests
router.get('/all-requests', isAuth, isGuide, getAllBookingRequests);

// ✅ Guide can respond to a booking request
router.put('/respond/:bookingId', isAuth, isGuide, respondToBooking);

// ✅ Guide can mark a tour as complete
router.put('/complete/:bookingId', isAuth, isGuide, completeTour);

// ✅ Guide can search bookings
router.get('/search', isAuth, isGuide, searchBookings);

// ✅ Guide can update payment status
router.put('/payment/:bookingId', isAuth, isGuide, updatePaymentStatus);

// ✅ Guide can update payment method
router.put('/payment-method/:bookingId', isAuth, isGuide, updatePaymentMethod);

// ✅ User can confirm they have paid (for online payments)
router.put('/mark-user-payment/:bookingId', isAuth, isUser, markUserPaymentConfirmed);

// ✅ Guide can confirm they received payment
router.put('/mark-guide-payment/:bookingId', isAuth, isGuide, markGuidePaymentConfirmed);

// ✅ Anyone can get the status of a booking
router.get('/status/:bookingId', isAuth, getBookingStatus);

// ✅ Anyone can get booked dates
router.get('/booked-dates', isAuth, getBookedDates);

// ✅ User can get available guides for a specific date
router.get('/available-guides', isAuth, isUser, getAvailableGuides);

module.exports = router;
