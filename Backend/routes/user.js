const express = require('express');
const router = express.Router();
const multer = require('multer');

const { 
    createUser, 
    userSignIn, 
    uploadProfile, 
    getUserProfile, 
    updateUserProfile 
} = require('../controllers/user');
const { validateUserSignUp, userValidation, validateUserSignIn } = require('../middlewares/validation/user');
const { isAuth, isAdmin, isGuide, hasRole } = require('../middlewares/auth');

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

// Public routes
router.post('/create-user', validateUserSignUp, userValidation, createUser);
router.post('/sign-in', validateUserSignIn, userValidation, userSignIn);

// Protected routes - all authenticated users
router.post('/upload-profile', isAuth, upload.single('profile'), uploadProfile);
router.get('/profile', isAuth, getUserProfile);
router.put('/update-profile', isAuth, upload.single('profile'), updateUserProfile);

// Admin-only routes
router.post('/create-admin', isAuth, isAdmin, validateUserSignUp, userValidation, createUser);
router.post('/create-guide', isAuth, isAdmin, validateUserSignUp, userValidation, createUser);

// Guide routes
router.get('/guide-data', isAuth, isGuide, (req, res) => {
    res.json({ success: true, message: 'Guide data accessed successfully' });
});

// Admin routes
router.get('/all-users', isAuth, isAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;