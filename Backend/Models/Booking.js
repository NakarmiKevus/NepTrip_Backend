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

  // Payment details
  paymentMethod: {
    type: String,
    enum: ['cash', 'online'],
    required: function () {
      return this.createdAt && this.createdAt > new Date('2025-03-29T00:00:00Z');
    }
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partially_paid', 'paid'],
    default: 'unpaid'
  },
  paymentAmount: {
    type: Number,
    default: 0
  },

  // ✅ New fields to track confirmation from both sides
  userPaymentConfirmed: {
    type: Boolean,
    default: false
  },
  guidePaymentConfirmed: {
    type: Boolean,
    default: false
  },

  completedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
