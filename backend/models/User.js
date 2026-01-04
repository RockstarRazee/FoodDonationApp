const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    phone: {
        type: String,
        unique: true,
        sparse: true,
    },
    avatar: {
        type: String,
        default: ''
    },
    socialLinks: {
        whatsapp: { type: String, default: '' },
        instagram: { type: String, default: '' },
        facebook: { type: String, default: '' },
        twitter: { type: String, default: '' },
    },
    role: {
        type: String,
        enum: ['donor', 'volunteer', 'recipient', 'admin'],
        default: 'donor',
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            default: [0, 0],
        },
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    isProfileComplete: {
        type: Boolean,
        default: false,
    },
    otp: {
        code: String,
        expiresAt: Date,
    },
    lastLogin: {
        type: Date,
    },
}, { timestamps: true });

UserSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', UserSchema);
