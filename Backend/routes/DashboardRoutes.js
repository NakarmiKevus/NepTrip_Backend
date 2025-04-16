const express = require('express');
const router = express.Router();
const { isAuth, isAdmin } = require('../middlewares/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const {
  addTrekkingPlace,
  getAllTrekkingPlaces,
  getTrekkingPlaceById,
  updateTrekkingPlace,
  deleteTrekkingPlace
} = require('../controllers/DashboardController');

// ✅ Admin adds a new trekking place
router.post('/', isAuth, isAdmin, upload.array('images', 10), addTrekkingPlace);

// ✅ Get all trekking places
router.get('/', getAllTrekkingPlaces);

// ✅ Get a single trekking place by ID
router.get('/:id', getTrekkingPlaceById);

// ✅ Admin updates trekking place by ID
router.put('/:id', isAuth, isAdmin, updateTrekkingPlace);

// ✅ Admin deletes a trekking place by ID
router.delete('/:id', isAuth, isAdmin, deleteTrekkingPlace);

module.exports = router;
