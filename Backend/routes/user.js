const express = require('express');
const router = express.Router();
const multer = require('multer');
const User = require('../Models/User');  // ✅ FIXED: Import User Model

const { 
    createUser, 
    userSignIn, 
    uploadProfile, 
    getUserProfile, 
    updateUserProfile 
} = require('../controllers/user');

const { isAuth, isAdmin, isGuide } = require('../middlewares/auth');

// Multer setup for file uploads
const storage = multer.diskStorage({});
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    }
});

// Public Routes
router.post('/create-user', createUser);
router.post('/sign-in', userSignIn);

// Protected Routes
router.post('/upload-profile', isAuth, upload.single('profile'), uploadProfile);
router.get('/profile', isAuth, getUserProfile);
router.put('/update-profile', isAuth, upload.single('profile'), updateUserProfile);

// Admin-only Routes
router.post('/create-admin', isAuth, isAdmin, createUser);
router.post('/create-guide', isAuth, isAdmin, createUser);

// ✅ FIXED: Fetch All Users (Admin Only)
router.get('/all-users', isAuth, isAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password');  // Exclude passwords
        res.json({ success: true, users });
    } catch (error) {
        console.error('❌ Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

module.exports = router;
