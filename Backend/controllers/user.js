const jwt = require('jsonwebtoken');
const User = require('../Models/User');
const { cloudinary } = require('../Helper/imageUpload');

exports.createDefaultUsers = async () => {
    try {
        const adminExists = await User.findOne({ role: 'admin' });
        if (!adminExists) {
            await User.create({
                fullname: 'Admin User',
                email: 'admin@neptrip.com',
                password: 'admin123',
                role: 'admin'
            });
            console.log('✅ Default admin user created');
        }

        const guideExists = await User.findOne({ role: 'guide' });
        if (!guideExists) {
            await User.create({
                fullname: 'Guide User',
                email: 'guide@neptrip.com',
                password: 'guide123',
                role: 'guide'
            });
            console.log('✅ Default guide user created');
        }
    } catch (error) {
        console.error('❌ Error creating default users:', error);
    }
};

exports.createUser = async (req, res) => {
    try {
        const { fullname, email, password, role } = req.body;
        console.log('Received signup request:', { fullname, email });

        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        const requestingUser = req.user;
        if (role && (role === 'admin' || role === 'guide')) {
            if (!requestingUser || requestingUser.role !== 'admin') {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Unauthorized: Only admins can create admin or guide accounts' 
                });
            }
        }

        const user = await User.create({ fullname, email, password, role });
        console.log('User created successfully:', user._id);

        res.status(201).json({
            success: true,
            user: { id: user._id, fullname, email, role: user.role }
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.userSignIn = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );

        const userInfo = {
            fullname: user.fullname,
            email: user.email,
            avatar: user.avatar || '',
            phoneNumber: user.phoneNumber || '',
            address: user.address || '',
            role: user.role
        };

        let redirectUrl;
        switch (user.role) {
            case 'admin':
                redirectUrl = 'AdminDashboard';
                break;
            case 'guide':
                redirectUrl = 'GuideDashboard';
                break;
            default:
                redirectUrl = 'Dashboard';
        }

        res.json({
            success: true,
            token,
            user: userInfo,
            redirectUrl
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.uploadProfile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const user_id = req.user._id;

        const result = await cloudinary.uploader.upload(req.file.path, {
            public_id: `${user_id}_profile`,
            width: 500,
            height: 500,
            crop: 'fill'
        });

        const user = await User.findById(user_id);
        const message = user.avatar ? 'Profile picture updated successfully' : 'Profile picture uploaded successfully';

        const updatedUser = await User.findByIdAndUpdate(
            user_id,
            { avatar: result.secure_url },
            { new: true }
        );

        res.json({
            success: true,
            message,
            imageUrl: result.secure_url,
            user: updatedUser
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({
            success: true,
            user: {
                fullname: user.fullname,
                email: user.email,
                avatar: user.avatar || '',
                phoneNumber: user.phoneNumber || '',
                address: user.address || '',
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateUserProfile = async (req, res) => {
    try {
        const user_id = req.user._id;
        const { fullname, email, phoneNumber, address } = req.body;
        
        if (email) {
            const existingUser = await User.findOne({ email, _id: { $ne: user_id } });
            if (existingUser) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Email is already in use by another account' 
                });
            }
        }
        
        const updateData = {
            fullname,
            email,
            phoneNumber,
            address
        };
        
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                public_id: `${user_id}_profile`,
                width: 500,
                height: 500,
                crop: 'fill'
            });
            
            updateData.avatar = result.secure_url;
        }
        
        const updatedUser = await User.findByIdAndUpdate(
            user_id,
            updateData,
            { new: true }
        ).select('-password');
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                fullname: updatedUser.fullname,
                email: updatedUser.email,
                avatar: updatedUser.avatar || '',
                phoneNumber: updatedUser.phoneNumber || '',
                address: updatedUser.address || '',
                role: updatedUser.role
            }
        });
        
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ✅ New function for admin to update guide-specific details
exports.updateGuideDetails = async (req, res) => {
    try {
        const { userId } = req.params;
        const { experience, language, trekCount } = req.body;
        
        // Check if the guide exists
        const guide = await User.findOne({ _id: userId, role: 'guide' });
        if (!guide) {
            return res.status(404).json({ success: false, message: 'Guide not found' });
        }
        
        // Only update guide-specific fields
        const updatedGuide = await User.findByIdAndUpdate(
            userId,
            { 
                experience,
                language,
                trekCount: trekCount ? parseInt(trekCount) : 0
            },
            { new: true }
        ).select('-password');
        
        res.json({
            success: true,
            message: 'Guide details updated successfully',
            guide: updatedGuide
        });
    } catch (error) {
        console.error('❌ Error updating guide details:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Fetch all guides dynamically
exports.getAllGuides = async (req, res) => {
    try {
        const guides = await User.find({ role: 'guide' }).select('fullname email phoneNumber address avatar experience trekCount language');

        if (!guides || guides.length === 0) {
            return res.status(404).json({ success: false, message: 'No guides found' });
        }

        res.json({ success: true, guides });
    } catch (error) {
        console.error('Error fetching guides:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const { check, validationResult } = require('express-validator');

exports.validateUserSignUp = [
    check('fullname')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 3, max: 20 }).withMessage('Name must be 3-20 characters'),
    check('email')
        .normalizeEmail()
        .isEmail().withMessage('Invalid email address'),
    check('password')
        .trim()
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 5, max: 20 }).withMessage('Password must be 5-20 characters'),
    check('confirmPassword')
        .trim()
        .notEmpty()
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords must match');
            }
            return true;
        })
];

exports.validateUserSignIn = [
    check('email').trim().isEmail().withMessage('Invalid email address'),
    check('password').trim().notEmpty().withMessage('Password is required')
];

exports.userValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();
    res.status(400).json({ success: false, message: errors.array()[0].msg });
};