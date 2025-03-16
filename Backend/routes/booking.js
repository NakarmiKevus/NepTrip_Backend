const express = require('express');
const router = express.Router();
const { isAuth, isUser, isGuide } = require('../middlewares/auth');
const { 
    requestBooking, 
    getBookingRequests, 
    respondToBooking, 
    getUserBookings, 
    getBookingStatus,
    getLatestBooking 
} = require('../controllers/booking');

router.post('/request', isAuth, isUser, requestBooking);
router.get('/requests', isAuth, isGuide, getBookingRequests);
router.put('/respond/:bookingId', isAuth, isGuide, respondToBooking);
router.get('/user-bookings', isAuth, getUserBookings);
router.get('/status/:bookingId', isAuth, getBookingStatus);
router.get('/latest-booking', isAuth, getLatestBooking);

module.exports = router;
