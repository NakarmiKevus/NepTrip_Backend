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