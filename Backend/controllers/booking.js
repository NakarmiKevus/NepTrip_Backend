const Booking = require('../Models/Booking');
const User = require('../Models/User');
const mongoose = require('mongoose');

const sendNotification = (userId, message) => {
    console.log(`📢 Notification sent to ${userId}: ${message}`);
};

// ✅ Request a new booking (Updated with payment handling)
exports.requestBooking = async (req, res) => {
    try {
        const { 
            fullname, 
            email, 
            address, 
            phone, 
            peopleCount, 
            destination, 
            date,
            paymentMethod,
            paymentStatus,
            paymentAmount,
            advancePayment,
            guide: guideId // Get the guide ID from the request
        } = req.body;
        
        const userId = req.user._id;

        // For new bookings, require payment method
        if (!fullname || !email || !address || !phone || !peopleCount || !destination || !date || !paymentMethod || !guideId) {
            return res.status(400).json({ success: false, message: 'All fields are required including payment method and guide' });
        }

        // Validate payment method
        if (!['cash', 'online'].includes(paymentMethod)) {
            return res.status(400).json({ success: false, message: 'Invalid payment method. Choose "cash" or "online"' });
        }

        // Check if the guide exists
        const guide = await User.findOne({ _id: guideId, role: 'guide' });
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

        // ✅ Check if the selected guide is already booked for this date
        const guideAlreadyBooked = await Booking.findOne({
            guide: guideId,
            date: date,
            status: { $in: ['pending', 'accepted'] }
        });

        if (guideAlreadyBooked) {
            return res.status(400).json({
                success: false,
                message: 'This guide is already booked for the selected date. Please choose a different date or guide.'
            });
        }

        // Create booking object with payment information
        const bookingData = {
            user: userId,
            guide: guideId,
            fullname,
            email,
            address,
            phone,
            peopleCount,
            destination,
            date,
            status: 'pending',
            paymentMethod,
            paymentStatus: paymentStatus || 'unpaid',
            paymentAmount: paymentAmount || 0
        };

        const booking = await Booking.create(bookingData);

        // Format payment info for notification
        let paymentInfo = '';
        if (advancePayment && paymentAmount > 0) {
            paymentInfo = ` with an advance payment of Rs.${paymentAmount}`;
        }

        sendNotification(
            guide._id, 
            `📩 New booking request from ${fullname}${paymentInfo}. Payment method: ${paymentMethod}`
        );
        
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
        await booking.save({ validateBeforeSave: false }); // Skip validation to handle old bookings

        sendNotification(booking.user, `✅ Your booking request has been ${status}`);
        res.json({ success: true, message: `Booking ${status}!`, booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ✅ Mark booking as completed - UPDATED with proper notification message
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

        // Update status and completion date
        booking.status = 'completed';
        booking.completedAt = new Date();
        
        // Skip validation to allow completing old bookings that don't have payment methods
        await booking.save({ validateBeforeSave: false });

        await User.findByIdAndUpdate(guide._id, { $inc: { trekCount: 1 } });

        // Updated notification message to clearly indicate completion
        sendNotification(
            booking.user, 
            '✅ Your trek has been marked as completed by the guide! Thank you for choosing our service.'
        );
        
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

exports.getLatestBooking = async (req, res) => {
    try {
        const booking = await Booking.findOne({ user: req.user._id }).sort({ createdAt: -1 });
        if (!booking) {
            return res.status(404).json({ 
                success: false, 
                message: 'No bookings found for this user'
            });
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

// ✅ Get all booked dates FOR A SPECIFIC GUIDE (Updated to filter by guide)
exports.getBookedDates = async (req, res) => {
    try {
        // Get the guide ID from the query params or use the current user's ID if it's a guide
        const guideId = req.query.guideId || (req.user.role === 'guide' ? req.user._id : null);

        // If no guide ID is provided and the current user is not a guide, return an error
        if (!guideId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Guide ID is required',
                dates: [] 
            });
        }

        // Find all bookings for the specified guide that are pending or accepted
        const bookings = await Booking.find({
            guide: guideId,
            status: { $in: ['pending', 'accepted'] }
        }).select('date -_id');

        const dates = bookings.map(b => b.date);
        res.json({ success: true, dates });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message, dates: [] });
    }
};

// ✅ Get available guides for a specific date
exports.getAvailableGuides = async (req, res) => {
    try {
        const { date } = req.query;
        
        if (!date) {
            return res.status(400).json({ 
                success: false, 
                message: 'Date is required' 
            });
        }
        
        // Find all guides who are already booked on this date
        const bookedGuides = await Booking.find({
            date: date,
            status: { $in: ['pending', 'accepted'] }
        }).select('guide -_id');
        
        // Extract the guide IDs
        const bookedGuideIds = bookedGuides.map(booking => booking.guide.toString());
        
        // Find all guides who are not in the booked list
        const availableGuides = await User.find({
            role: 'guide',
            _id: { $nin: bookedGuideIds }
        }).select('_id fullname avatar trekCount experience language');
        
        res.json({ 
            success: true, 
            guides: availableGuides,
            totalAvailable: availableGuides.length
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ✅ Update payment status
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { paymentStatus, paymentAmount } = req.body;

        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ success: false, message: 'Invalid booking ID format' });
        }

        if (!['paid', 'partially_paid', 'unpaid'].includes(paymentStatus)) {
            return res.status(400).json({ success: false, message: 'Invalid payment status' });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        const guide = await User.findById(req.user._id);
        if (!guide || guide.role !== 'guide') {
            return res.status(403).json({ success: false, message: 'Only guides can update payment status' });
        }

        // Update payment information
        booking.paymentStatus = paymentStatus;
        
        // If payment amount is provided, update it
        if (paymentAmount !== undefined) {
            // For fully paid, calculate the total based on people count (e.g., ₹1500 per person)
            if (paymentStatus === 'paid') {
                booking.paymentAmount = booking.peopleCount * 1500; // Assuming ₹1500 per person
            } else {
                booking.paymentAmount = paymentAmount;
            }
        }

        booking.updatedAt = new Date();
        await booking.save({ validateBeforeSave: false }); // Skip validation to handle old bookings

        // Send notification to the user
        const paymentMessage = paymentStatus === 'paid' 
            ? 'Your payment has been marked as fully paid' 
            : `Your payment has been updated. Amount received: ₹${paymentAmount}`;
            
        sendNotification(booking.user, `💰 ${paymentMessage}`);
        
        res.json({ 
            success: true, 
            message: 'Payment status updated successfully', 
            booking 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ✅ Update payment method (for legacy bookings)
exports.updatePaymentMethod = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { paymentMethod, paymentStatus } = req.body;

        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ success: false, message: 'Invalid booking ID format' });
        }

        if (!['cash', 'online'].includes(paymentMethod)) {
            return res.status(400).json({ success: false, message: 'Invalid payment method' });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        const guide = await User.findById(req.user._id);
        if (!guide || guide.role !== 'guide') {
            return res.status(403).json({ success: false, message: 'Only guides can update booking details' });
        }

        // Update payment method and status
        booking.paymentMethod = paymentMethod;
        if (paymentStatus) {
            booking.paymentStatus = paymentStatus;
        }

        booking.updatedAt = new Date();
        await booking.save({ validateBeforeSave: false }); // Skip validation
        
        res.json({ 
            success: true, 
            message: 'Payment method updated successfully', 
            booking 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};