const jwt = require('jsonwebtoken');
const User = require('../Models/User');
const { cloudinary } = require('../Helper/imageUpload');

// Create default admin and guide users on server startup
exports.createDefaultUsers = async () => {
    try {
        // Check if admin already exists
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

        // Check if guide already exists
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

        // Only allow admin to create guide or admin accounts
        const requestingUser = req.user;
        if (role && (role === 'admin' || role === 'guide')) {
            if (!requestingUser || requestingUser.role !== 'admin') {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Unauthorized: Only admins can create admin or guide accounts' 
                });
            }
        }

        // Default role is 'user' as defined in schema
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

        // Determine redirect URL based on role
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

// Rest of your code (uploadProfile, getUserProfile, updateUserProfile) remains the same
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
        const user = await User.findById(req.user._id).select('-password'); // Exclude password from the response
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
        
        // Check if email is already in use by another user
        if (email) {
            const existingUser = await User.findOne({ email, _id: { $ne: user_id } });
            if (existingUser) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Email is already in use by another account' 
                });
            }
        }
        
        // Prepare update object
        const updateData = {
            fullname,
            email,
            phoneNumber,
            address
        };
        
        // Handle image upload if provided
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                public_id: `${user_id}_profile`,
                width: 500,
                height: 500,
                crop: 'fill'
            });
            
            updateData.avatar = result.secure_url;
        }
        
        // Update user data
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