const mongoose = require('mongoose');

const trekkingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  altitude: { type: Number, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 }, // Added star rating field
  review: { type: String, required: true },  // Keep the review text field
  distance_from_user: { type: Number, required: true },
  time_to_complete: { type: String, required: true },
  difficulty_level: {
    type: String,
    enum: ['Easy', 'Moderate', 'Hard'],
    required: true
  },
  eco_cultural_info: { type: String, required: true },
  gear_checklist: [{ type: String, required: true }],
  images: [{ type: String, required: true }] 
}, { timestamps: true });

module.exports = mongoose.model('Trekking', trekkingSchema);