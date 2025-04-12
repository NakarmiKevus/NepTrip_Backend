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
    updatePaymentMethod
} = require('../controllers/booking');

// user can request a booking
router.post('/request', isAuth, isUser, requestBooking);

// user can get their bookings
router.get('/user-bookings', isAuth, getUserBookings);

// user can get their latest booking
router.get('/latest-booking', isAuth, getLatestBooking);

// guide can get pending booking requests
router.get('/requests', isAuth, isGuide, getBookingRequests);

// guide can get all booking requests
router.get('/all-requests', isAuth, isGuide, getAllBookingRequests);

// guide can respond to a booking request
router.put('/respond/:bookingId', isAuth, isGuide, respondToBooking);

// guide can mark a tour as complete
router.put('/complete/:bookingId', isAuth, isGuide, completeTour);

// guide can search bookings
router.get('/search', isAuth, isGuide, searchBookings);

// guide can update payment status
router.put('/payment/:bookingId', isAuth, isGuide, updatePaymentStatus);

// guide can update payment method
router.put('/payment-method/:bookingId', isAuth, isGuide, updatePaymentMethod);

// anyone can get the status of a booking
router.get('/status/:bookingId', isAuth, getBookingStatus);

// anyone can get booked dates
router.get('/booked-dates', isAuth, getBookedDates);

// user can get available guides for a specific date
router.get('/available-guides', isAuth, isUser, getAvailableGuides);


module.exports = router;
module.exports = router;