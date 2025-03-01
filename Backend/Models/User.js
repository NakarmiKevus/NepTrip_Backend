const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: String,
    phoneNumber: String,
    address: String,
    role: { 
        type: String, 
        enum: ['user', 'guide', 'admin'],
        default: 'user'
    },
}, {
    timestamps: true
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        this.password = await bcrypt.hash(this.password, 8);
        next();
    } catch (err) {
        next(err);
    }
});

userSchema.methods.comparePassword = async function(password) {
    if (!password) throw new Error('Password missing');
    return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);