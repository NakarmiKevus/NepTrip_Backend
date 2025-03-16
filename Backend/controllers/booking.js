const Booking = require('../Models/Booking');
const User = require('../Models/User');
const mongoose = require('mongoose');

const sendNotification = (userId, message) => {
    console.log(`📢 Notification sent to ${userId}: ${message}`);
};

exports.requestBooking = async (req, res) => {
    try {
        const { fullname, email, address, phone, peopleCount, destination, date } = req.body;
        const userId = req.user._id;

        if (!fullname || !email || !address || !phone || !peopleCount || !destination || !date) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const guide = await User.findOne({ role: 'guide' });
        if (!guide) {
            return res.status(404).json({ success: false, message: 'Guide not found' });
        }

        const existingBooking = await Booking.findOne({ user: userId, status: 'pending' });
        if (existingBooking) {
            return res.status(400).json({ success: false, message: 'You already have a pending booking request' });
        }

        const booking = await Booking.create({
            user: userId,
            guide: guide._id,
            fullname,
            email,
            address,
            phone,
            peopleCount,
            destination,
            date,
            status: 'pending'
        });

        sendNotification(guide._id, `📩 New booking request from ${fullname}`);

        res.status(201).json({ success: true, message: 'Booking request sent!', booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getBookingRequests = async (req, res) => {
    try {
        const guide = await User.findOne({ role: 'guide' });
        if (!guide) return res.status(404).json({ success: false, message: 'Guide not found' });

        const requests = await Booking.find({ guide: guide._id, status: 'pending' })
            .populate('user', 'fullname email');

        res.json({ success: true, requests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.respondToBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ success: false, message: 'Invalid booking ID format' });
        }

        if (!['accepted', 'declined'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status. Allowed: accepted, declined' });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        const guide = await User.findById(req.user._id);
        if (!guide || guide.role !== 'guide') {
            return res.status(403).json({ success: false, message: 'Unauthorized: Only the guide can accept or decline requests' });
        }

        booking.status = status;
        booking.updatedAt = new Date();
        await booking.save();

        sendNotification(booking.user, `✅ Your booking request has been ${status}`);

        res.json({ success: true, message: `Booking ${status}!`, booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

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

exports.getBookingStatus = async (req, res) => {
    try {
        const { bookingId } = req.params;

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

exports.getLatestBooking = async (req, res) => {
    try {
        const userId = req.user._id;
        const booking = await Booking.findOne({ user: userId }).sort({ createdAt: -1 });

        if (!booking) {
            return res.status(404).json({ success: false, message: 'No bookings found' });
        }

        res.json({ success: true, booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
