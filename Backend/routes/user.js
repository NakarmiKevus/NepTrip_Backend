const express = require('express');
const router = express.Router();
const multer = require('multer');
const User = require('../Models/User');  
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

// ✅ Fetch All Users (Admin Only)
router.get('/all-users', isAuth, isAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password');  // Exclude passwords
        res.json({ success: true, users });
    } catch (error) {
        console.error('❌ Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// ✅ Delete User (Admin Only)
router.delete('/delete-user/:userId', isAuth, isAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // Prevent deleting the last admin
        if (user.role === 'admin') {
            const adminCount = await User.countDocuments({ role: 'admin' });
            if (adminCount <= 1) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Cannot delete the last admin user' 
                });
            }
        }
        
        // Delete the user
        await User.findByIdAndDelete(userId);
        
        res.json({ 
            success: true, 
            message: 'User deleted successfully',
            deletedId: userId 
        });
    } catch (error) {
        console.error('❌ Error deleting user:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// ✅ Fetch All Guides (Dynamically Updated)
router.get('/guides', async (req, res) => {
    try {
        const guides = await User.find({ role: 'guide' }).select(
            'fullname email phoneNumber address avatar experience trekCount'
        );

        if (!guides || guides.length === 0) {
            return res.status(404).json({ success: false, message: 'No guides found' });
        }

        res.json({ success: true, guides });
    } catch (error) {
        console.error('❌ Error fetching guides:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// ✅ Fetch Specific Guide Profile
router.get('/guide/:guideId', async (req, res) => {
    try {
        const { guideId } = req.params;
        const guide = await User.findOne({ _id: guideId, role: 'guide' }).select(
            'fullname email phoneNumber address avatar experience trekCount'
        );

        if (!guide) {
            return res.status(404).json({ success: false, message: 'Guide not found' });
        }

        res.json({ success: true, guide });
    } catch (error) {
        console.error('❌ Error fetching guide profile:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

module.exports = router;
