const Trekking = require('../Models/TrekkingModel');
const uploadDashboardImages = require('../Helper/dashboardImages');

// ✅ Add a new trekking place
exports.addTrekkingPlace = async (req, res) => {
  try {
    const {
      name,
      location,
      altitude,
      rating,
      review,
      distance_from_user,
      time_to_complete,
      difficulty_level,
      eco_cultural_info
    } = req.body;

    const gearChecklist = req.body['gear_checklist[]'];
    const gearArray = Array.isArray(gearChecklist) ? gearChecklist : gearChecklist ? [gearChecklist] : [];

    if (
      !name || !location || !altitude || !rating || !review ||
      !distance_from_user || !time_to_complete || !difficulty_level ||
      !eco_cultural_info || gearArray.length === 0
    ) {
      return res.status(400).json({ success: false, message: "All fields are required!" });
    }

    const ratingValue = parseFloat(rating);
    if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
    }

    if (!req.files || req.files.length < 3) {
      return res.status(400).json({ success: false, message: "Please upload at least 3 images." });
    }

    const imageUrls = await uploadDashboardImages(req.files);

    const newTrekking = new Trekking({
      name,
      location,
      altitude,
      rating: ratingValue,
      review,
      distance_from_user,
      time_to_complete,
      difficulty_level,
      eco_cultural_info,
      gear_checklist: gearArray,
      images: imageUrls,
    });

    await newTrekking.save();
    return res.status(201).json({ success: true, message: "Trekking details added successfully!", trekking: newTrekking });
  } catch (error) {
    console.error('Error in addTrekkingPlace:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get all trekking places
exports.getAllTrekkingPlaces = async (req, res) => {
  try {
    const trekkingSpots = await Trekking.find().sort({ createdAt: -1 });
    res.json({ success: true, trekkingSpots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get trekking place by ID
exports.getTrekkingPlaceById = async (req, res) => {
  try {
    const { id } = req.params;
    const trekking = await Trekking.findById(id);
    if (!trekking) {
      return res.status(404).json({ success: false, message: "Trekking spot not found!" });
    }
    res.json({ success: true, trekking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update trekking place (no image update in this version)
exports.updateTrekkingPlace = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      location,
      altitude,
      rating,
      review,
      distance_from_user,
      time_to_complete,
      difficulty_level,
      eco_cultural_info,
      gear_checklist
    } = req.body;

    const trek = await Trekking.findById(id);
    if (!trek) {
      return res.status(404).json({ success: false, message: "Trekking place not found!" });
    }

    trek.name = name || trek.name;
    trek.location = location || trek.location;
    trek.altitude = altitude || trek.altitude;
    trek.rating = rating || trek.rating;
    trek.review = review || trek.review;
    trek.distance_from_user = distance_from_user || trek.distance_from_user;
    trek.time_to_complete = time_to_complete || trek.time_to_complete;
    trek.difficulty_level = difficulty_level || trek.difficulty_level;
    trek.eco_cultural_info = eco_cultural_info || trek.eco_cultural_info;
    trek.gear_checklist = Array.isArray(gear_checklist)
      ? gear_checklist
      : gear_checklist ? [gear_checklist] : trek.gear_checklist;

    await trek.save();
    res.json({ success: true, message: "Trekking place updated!", trekking: trek });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Delete trekking place
exports.deleteTrekkingPlace = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Trekking.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Trekking place not found!" });
    }
    res.json({ success: true, message: "Trekking place deleted successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
