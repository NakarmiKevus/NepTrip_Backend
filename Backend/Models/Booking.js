const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    guide: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fullname: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    peopleCount: { type: Number, required: true },
    destination: { type: String, required: true },
    date: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['pending', 'accepted', 'declined', 'completed'], 
        default: 'pending' 
    },
    completedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
