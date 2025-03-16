const jwt = require('jsonwebtoken');
const User = require('../Models/User');

// Check if user is logged in
exports.isAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Authentication failed' });
    }
};

// Allow only admins
exports.isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied: Admin role required' });
    }
    next();
};

// Allow only users (people who book guides)
exports.isUser = (req, res, next) => {
    if (req.user.role !== 'user') {
        return res.status(403).json({ success: false, message: 'Access denied: Only users can book a guide' });
    }
    next();
};

// Allow only guides (people who accept bookings)
exports.isGuide = (req, res, next) => {
    if (req.user.role !== 'guide') {
        return res.status(403).json({ success: false, message: 'Access denied: Only guides can manage bookings' });
    }
    next();
};
