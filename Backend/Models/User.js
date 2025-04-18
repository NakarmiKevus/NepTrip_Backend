const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: String,
    qrCode: String, // ✅ NEW FIELD to store QR code image URL
    phoneNumber: String,
    address: String,
    language: String,
    experience: String,
    trekCount: { type: Number, default: 0 },
    role: { 
        type: String, 
        enum: ['user', 'guide', 'admin'],
        default: 'user'
    },
}, { timestamps: true });

// ✅ Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        this.password = await bcrypt.hash(this.password, 8);
        next();
    } catch (err) {
        next(err);
    }
});

// ✅ Compare password
userSchema.methods.comparePassword = async function(password) {
    if (!password) throw new Error('Password missing');
    return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
