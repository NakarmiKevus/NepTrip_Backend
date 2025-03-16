const Trekking = require('../Models/TrekkingModel');

exports.addTrekkingPlace = async (req, res) => {
    try {
        const { name, location, altitude, review, distance_from_user, time_to_complete, difficulty_level, eco_cultural_info, gear_checklist } = req.body;

        if (!name || !location || !altitude || !review || !distance_from_user || !time_to_complete || !difficulty_level || !eco_cultural_info || !gear_checklist) {
            return res.status(400).json({ success: false, message: "All fields are required!" });
        }

        const newTrekking = new Trekking({
            name,
            location,
            altitude,
            review,
            distance_from_user,
            time_to_complete,
            difficulty_level,
            eco_cultural_info,
            gear_checklist
        });

        await newTrekking.save();
        res.status(201).json({ success: true, message: "Trekking details added successfully!", trekking: newTrekking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllTrekkingPlaces = async (req, res) => {
    try {
        const trekkingSpots = await Trekking.find().sort({ createdAt: -1 });
        res.json({ success: true, trekkingSpots });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

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
