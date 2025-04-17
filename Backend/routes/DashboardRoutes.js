const express = require('express');
const router = express.Router();
const { isAuth, isAdmin } = require('../middlewares/auth');
const multer = require('multer');

// Use in-memory storage for multer (suitable for uploading to Cloudinary)
const upload = multer({ storage: multer.memoryStorage() });

const {
  addTrekkingPlace,
  getAllTrekkingPlaces,
  getTrekkingPlaceById,
  updateTrekkingPlace,
  deleteTrekkingPlace,
} = require('../controllers/DashboardController');

// ✅ Add new trekking place (Admin only, requires images)
router.post('/', isAuth, isAdmin, upload.array('images', 10), addTrekkingPlace);

// ✅ Get all trekking places (Public)
router.get('/', getAllTrekkingPlaces);

// ✅ Get a single trekking place by ID (Public)
router.get('/:id', getTrekkingPlaceById);

// ✅ Update trekking place by ID (Admin only, no image update here)
router.put('/:id', isAuth, isAdmin, updateTrekkingPlace);

// ✅ Delete trekking place by ID (Admin only)
router.delete('/:id', isAuth, isAdmin, deleteTrekkingPlace);

module.exports = router;
