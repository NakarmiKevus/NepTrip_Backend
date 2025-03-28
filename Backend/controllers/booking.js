const Booking = require('../Models/Booking');
const User = require('../Models/User');
const mongoose = require('mongoose');

const sendNotification = (userId, message) => {
    console.log(`📢 Notification sent to ${userId}: ${message}`);
};

// ✅ Request a new booking
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

        // ✅ Check if user has any ongoing (non-completed) booking
        const hasOngoing = await Booking.findOne({
            user: userId,
            status: { $in: ['pending', 'accepted'] }
        });

        if (hasOngoing) {
            return res.status(400).json({
                success: false,
                message: 'You already have an ongoing trek. You can only book a new one once your current trek is completed.'
            });
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

// ✅ Get pending requests for guide
exports.getBookingRequests = async (req, res) => {
    try {
        const guideId = req.user._id;
        const requests = await Booking.find({ guide: guideId, status: 'pending' })
            .populate('user', 'fullname email');
        res.json({ success: true, requests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ✅ Get all booking requests for guide
exports.getAllBookingRequests = async (req, res) => {
    try {
        const guideId = req.user._id;
        const requests = await Booking.find({ guide: guideId })
            .populate('user', 'fullname email')
            .sort({ createdAt: -1 });
        res.json({ success: true, requests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ✅ Guide responds to booking (accept/decline)
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
            return res.status(403).json({ success: false, message: 'Only guides can respond to bookings' });
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

// ✅ Mark booking as completed
exports.completeTour = async (req, res) => {
    try {
        const { bookingId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ success: false, message: 'Invalid booking ID format' });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        const guide = await User.findById(req.user._id);
        if (!guide || guide.role !== 'guide') {
            return res.status(403).json({ success: false, message: 'Only guides can complete tours' });
        }

        if (booking.status !== 'accepted') {
            return res.status(400).json({ success: false, message: 'Only accepted bookings can be completed' });
        }

        booking.status = 'completed';
        booking.completedAt = new Date();
        await booking.save();

        await User.findByIdAndUpdate(guide._id, { $inc: { trekCount: 1 } });

        sendNotification(booking.user, '✅ Your tour has been marked as completed!');
        res.json({ success: true, message: 'Tour completed successfully', booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ✅ Get all bookings for a user
exports.getUserBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id }).populate('guide', 'fullname email');
        res.json({ success: true, bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ✅ Get status of a specific booking
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

// ✅ Get latest booking for a user
exports.getLatestBooking = async (req, res) => {
    try {
        const booking = await Booking.findOne({ user: req.user._id }).sort({ createdAt: -1 });
        if (!booking) {
            return res.status(404).json({ success: false, message: 'No bookings found' });
        }
        res.json({ success: true, booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ✅ Search bookings by status and text
exports.searchBookings = async (req, res) => {
    try {
        const { status, search, sort } = req.query;
        const guideId = req.user._id;
        const query = { guide: guideId };

        if (status && status !== 'all') query.status = status;

        if (search) {
            const regex = new RegExp(search, 'i');
            query.$or = [
                { fullname: regex },
                { email: regex },
                { destination: regex },
                { date: regex }
            ];
        }

        let sortOptions = { createdAt: -1 };
        if (sort === 'oldest') sortOptions = { createdAt: 1 };
        else if (sort === 'name') sortOptions = { fullname: 1 };

        const bookings = await Booking.find(query).sort(sortOptions).populate('user', 'fullname email');
        res.json({ success: true, bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
