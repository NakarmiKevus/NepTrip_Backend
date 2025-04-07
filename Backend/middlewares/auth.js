const jwt = require('jsonwebtoken');
const User = require('../Models/User');

exports.isAuth = async (req, res, next) => {
    try {
        // Check if authorization header exists
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Unauthorized access' });
        }

        // Extract token
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }

        // Find user by ID
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        // Add user to request object
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Authentication failed' });
    }
};

exports.isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }
    next();
};

exports.isGuide = (req, res, next) => {
    if (req.user.role !== 'guide') {
        return res.status(403).json({ success: false, message: 'Access denied. Guide only.' });
    }
    next();
};

exports.isUser = (req, res, next) => {
    if (req.user.role !== 'user') {
        return res.status(403).json({ success: false, message: 'Access denied. User only.' });
    }
    next();
};