const express = require('express');
const router = express.Router();
const { isAuth, isAdmin } = require('../middlewares/auth');
const { addTrekkingPlace, getAllTrekkingPlaces, getTrekkingPlaceById } = require('../controllers/DashboardController');

// Admin can add a new trekking place  
router.post('/', isAuth, isAdmin, addTrekkingPlace);

// Get all trekking places  
router.get('/', getAllTrekkingPlaces);

// Get details of a specific trekking place  
router.get('/:id', getTrekkingPlaceById);

module.exports = router;
