const Booking = require('../Models/Booking');
const User = require('../Models/User');
const mongoose = require('mongoose');

// User Requests a Guide
exports.requestBooking = async (req, res) => {
    try {
        const { date } = req.body;
        const userId = req.user._id;

        // Validate date
        if (!date) {
            return res.status(400).json({ success: false, message: 'Booking date is required' });
        }

        // Find the single guide in the system
        const guide = await User.findOne({ role: 'guide' });
        if (!guide) {
            return res.status(404).json({ success: false, message: 'Guide not found' });
        }

        // Check if the user already has a pending booking
        const existingBooking = await Booking.findOne({ user: userId, status: 'pending' });
        if (existingBooking) {
            return res.status(400).json({ success: false, message: 'You already have a pending booking' });
        }

        // Create a booking request
        const booking = await Booking.create({ user: userId, guide: guide._id, date, status: 'pending' });

        res.status(201).json({ success: true, message: 'Booking request sent!', booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Guide Views Booking Requests
exports.getBookingRequests = async (req, res) => {
    try {
        const guide = await User.findOne({ role: 'guide' });
        if (!guide) return res.status(404).json({ success: false, message: 'Guide not found' });

        const requests = await Booking.find({ guide: guide._id, status: 'pending' })
            .populate('user', 'fullname email avatar');

        res.json({ success: true, requests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Guide Accepts/Declines Request
exports.respondToBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { status } = req.body;

        // Validate booking ID format
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ success: false, message: 'Invalid booking ID format' });
        }

        // Validate status input
        if (!['accepted', 'declined'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status. Allowed: accepted, declined' });
        }

        // Find the booking request
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // Ensure that only the guide can respond to the request
        const guide = await User.findById(req.user._id);
        if (!guide || guide.role !== 'guide') {
            return res.status(403).json({ success: false, message: 'Unauthorized: Only the guide can accept or decline requests' });
        }

        // Update booking status
        booking.status = status;
        booking.updatedAt = new Date();
        await booking.save();

        res.json({ success: true, message: `Booking ${status}!`, booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// User Fetches Their Bookings
exports.getUserBookings = async (req, res) => {
    try {
        const userId = req.user._id;

        const bookings = await Booking.find({ user: userId })
            .populate('guide', 'fullname email');

        res.json({ success: true, bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// User Fetches a Specific Booking Status
exports.getBookingStatus = async (req, res) => {
    try {
        const { bookingId } = req.params;

        // Validate booking ID format
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ success: false, message: 'Invalid booking ID format' });
        }

        const booking = await Booking.findById(bookingId).populate('guide', 'fullname email');
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        res.json({ success: true, booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
