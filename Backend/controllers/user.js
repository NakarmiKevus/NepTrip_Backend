const jwt = require('jsonwebtoken');
const User = require('../Models/User');
const { cloudinary } = require('../Helper/imageUpload');
const { check, validationResult } = require('express-validator');
const Booking = require('../Models/Booking'); // Ensure this is imported

// ✅ Create default admin and guide
exports.createDefaultUsers = async () => {
    try {
        const adminExists = await User.findOne({ role: 'admin' });
        if (!adminExists) {
            await User.create({ fullname: 'Admin User', email: 'admin@neptrip.com', password: 'admin123', role: 'admin' });
            console.log('✅ Default admin user created');
        }

        const guideExists = await User.findOne({ role: 'guide' });
        if (!guideExists) {
            await User.create({ fullname: 'Guide User', email: 'guide@neptrip.com', password: 'guide123', role: 'guide' });
            console.log('✅ Default guide user created');
        }
    } catch (error) {
        console.error('❌ Error creating default users:', error);
    }
};

// ✅ Register user
exports.createUser = async (req, res) => {
    try {
        const { fullname, email, password, role } = req.body;
        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ success: false, message: 'Email already exists' });

        if (['admin', 'guide'].includes(role)) {
            const requestingUser = req.user;
            if (!requestingUser || requestingUser.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Only admins can create admin or guide accounts' });
            }
        }

        const user = await User.create({ fullname, email, password, role });
        res.status(201).json({
            success: true,
            user: { id: user._id, fullname, email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ✅ Login
exports.userSignIn = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid credentials' });

        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

        const userInfo = {
            fullname: user.fullname,
            email: user.email,
            avatar: user.avatar || '',
            qrCode: user.qrCode || '',
            phoneNumber: user.phoneNumber || '',
            address: user.address || '',
            role: user.role
        };

        const redirectUrl = user.role === 'admin' ? 'AdminDashboard' :
                            user.role === 'guide' ? 'GuideDashboard' : 'Dashboard';

        res.json({ success: true, token, user: userInfo, redirectUrl });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ✅ Upload profile picture
exports.uploadProfile = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

        const userId = req.user._id;
        const result = await cloudinary.uploader.upload(req.file.path, {
            public_id: `${userId}_profile`,
            width: 500,
            height: 500,
            crop: 'fill'
        });

        const updatedUser = await User.findByIdAndUpdate(userId, { avatar: result.secure_url }, { new: true });
        res.json({
            success: true,
            message: updatedUser.avatar ? 'Profile picture updated successfully' : 'Uploaded successfully',
            imageUrl: result.secure_url,
            user: updatedUser
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ✅ Upload guide QR code
exports.uploadGuideQrCode = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!req.file) return res.status(400).json({ success: false, message: 'No QR image uploaded' });

        const guide = await User.findOne({ _id: userId, role: 'guide' });
        if (!guide) return res.status(404).json({ success: false, message: 'Guide not found' });

        const result = await cloudinary.uploader.upload(req.file.path, {
            public_id: `${userId}_qr`,
            width: 400,
            height: 400,
            crop: 'fit'
        });

        const updatedGuide = await User.findByIdAndUpdate(
            userId,
            { qrCode: result.secure_url },
            { new: true }
        ).select('-password');

        res.json({
            success: true,
            message: 'QR code uploaded successfully',
            qrCodeUrl: result.secure_url,
            guide: updatedGuide
        });
    } catch (error) {
        console.error('❌ Error uploading guide QR code:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// ✅ Get current user profile
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        res.json({
            success: true,
            user: {
                fullname: user.fullname,
                email: user.email,
                avatar: user.avatar || '',
                qrCode: user.qrCode || '',
                phoneNumber: user.phoneNumber || '',
                address: user.address || '',
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ✅ Update user profile
exports.updateUserProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { fullname, email, phoneNumber, address } = req.body;

        if (email) {
            const existingUser = await User.findOne({ email, _id: { $ne: userId } });
            if (existingUser) return res.status(400).json({ success: false, message: 'Email already in use' });
        }

        const updateData = { fullname, email, phoneNumber, address };

        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                public_id: `${userId}_profile`,
                width: 500,
                height: 500,
                crop: 'fill'
            });
            updateData.avatar = result.secure_url;
        }

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');
        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                fullname: updatedUser.fullname,
                email: updatedUser.email,
                avatar: updatedUser.avatar || '',
                qrCode: updatedUser.qrCode || '',
                phoneNumber: updatedUser.phoneNumber || '',
                address: updatedUser.address || '',
                role: updatedUser.role
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ✅ Update guide details (admin only)
exports.updateGuideDetails = async (req, res) => {
    try {
        const { userId } = req.params;
        const { experience, language, trekCount } = req.body;

        const guide = await User.findOne({ _id: userId, role: 'guide' });
        if (!guide) return res.status(404).json({ success: false, message: 'Guide not found' });

        const updatedGuide = await User.findByIdAndUpdate(
            userId,
            { experience, language, trekCount: trekCount ? parseInt(trekCount) : 0 },
            { new: true }
        ).select('-password');

        res.json({ success: true, message: 'Guide details updated', guide: updatedGuide });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ✅ Fetch all guides
exports.getAllGuides = async (req, res) => {
    try {
        const guides = await User.find({ role: 'guide' })
            .select('fullname email phoneNumber address avatar qrCode experience trekCount language');

        const enrichedGuides = await Promise.all(
            guides.map(async (guide) => {
                const reviews = await Booking.find({
                    guide: guide._id,
                    rating: { $exists: true, $ne: null }
                }).select('rating');

                const totalReviews = reviews.length;
                const averageRating = totalReviews > 0
                    ? Number((reviews.reduce((sum, b) => sum + b.rating, 0) / totalReviews).toFixed(1))
                    : 0;

                return {
                    ...guide.toObject(),
                    averageRating,
                    totalReviews
                };
            })
        );

        res.json({ success: true, guides: enrichedGuides });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ✅ Delete guide and handle affected bookings
exports.deleteGuide = async (req, res) => {
  try {
    const { userId } = req.params;

    // Step 1: Check if guide exists
    const guide = await User.findOne({ _id: userId, role: 'guide' });
    if (!guide) {
      return res.status(404).json({ success: false, message: 'Guide not found' });
    }

    // Step 2: Delete the guide
    await User.findByIdAndDelete(userId);

    // Step 3: Update related bookings (decline them)
    const Booking = require('../Models/Booking'); // Import if not already
    await Booking.updateMany(
      { guide: userId, status: { $in: ['pending', 'accepted'] } },
      { $set: { status: 'declined', updatedAt: new Date() } }
    );

    res.json({ success: true, message: 'Guide and associated bookings updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Validation middleware
exports.validateUserSignUp = [
    check('fullname').trim().notEmpty().withMessage('Name is required').isLength({ min: 3, max: 20 }),
    check('email').normalizeEmail().isEmail(),
    check('password').trim().notEmpty().isLength({ min: 5, max: 20 }),
    check('confirmPassword').trim().custom((val, { req }) => val === req.body.password)
];

exports.validateUserSignIn = [
    check('email').trim().isEmail(),
    check('password').trim().notEmpty()
];

exports.userValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();
    res.status(400).json({ success: false, message: errors.array()[0].msg });
};
