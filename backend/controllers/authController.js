const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Donation = require('../models/Donation');
const socket = require('../socket'); // Import socket instance
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// Google Login & Send OTP
exports.googleLogin = async (req, res) => {
    const { token } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const { email, name, picture } = ticket.getPayload();

        let user = await User.findOne({ email });

        // Check if this is the admin email
        const isAdmin = email === process.env.ADMIN_EMAIL;

        if (!user) {
            user = await User.create({
                name,
                email,
                role: isAdmin ? 'admin' : 'donor', // Default to donor if not admin
                isProfileComplete: isAdmin, // Admin skips role selection
                isVerified: false,
            });
        }

        // If existing user is admin email but doesn't have admin role, upgrade them
        if (isAdmin && user.role !== 'admin') {
            user.role = 'admin';
            user.isProfileComplete = true;
            await user.save();
        }

        // Generate OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = {
            code: otpCode,
            expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
        };
        await user.save();

        // Send OTP via Email
        await transporter.sendMail({
            from: '"Food Donation App" <no-reply@fooddonation.com>',
            to: email,
            subject: 'Your Login OTP',
            html: `<h2>Your OTP is ${otpCode}</h2><p>Valid for 5 minutes</p>`,
        });

        res.status(200).json({ message: 'OTP sent to email', email });
    } catch (error) {
        console.error('Google Login Error:', error);
        res.status(500).json({ message: 'Google authentication failed' });
    }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.otp && user.otp.code === otp && user.otp.expiresAt > Date.now()) {
            user.otp = undefined;
            user.isVerified = true;
            user.lastLogin = new Date();

            // Strict Admin Enforcement
            if (user.email === process.env.ADMIN_EMAIL && user.role !== 'admin') {
                user.role = 'admin';
                user.isProfileComplete = true;
            }

            await user.save();

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                avatar: user.avatar,
                role: user.role,
                isProfileComplete: user.isProfileComplete,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid or expired OTP' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update User Role
exports.updateRole = async (req, res) => {
    const { role } = req.body;
    const userId = req.user.id; // Assuming auth middleware adds user to req

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.email === process.env.ADMIN_EMAIL) {
            return res.status(403).json({ message: 'Admin role cannot be changed.' });
        }

        if (user.isProfileComplete) {
            return res.status(403).json({ message: 'Profile already completed. Contact admin to change role.' });
        }

        user.role = role;
        user.isProfileComplete = true;
        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isProfileComplete: user.isProfileComplete,
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-otp -otpExpires');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { name, phone, socialLinks, avatar } = req.body;

        if (name) user.name = name;
        if (phone !== undefined) {
            user.phone = phone === '' ? undefined : phone;
        }
        if (avatar !== undefined) user.avatar = avatar;
        if (socialLinks) {
            user.socialLinks = { ...user.socialLinks, ...socialLinks };
        }

        const updatedUser = await user.save();

        // REAL-TIME UPDATE: Find active donations where this user is involved
        const activeDonations = await Donation.find({
            $or: [{ donor: user._id }, { volunteer: user._id }, { recipient: user._id }],
            status: { $in: ['posted', 'requested', 'assigned', 'picked'] }
        });

        const io = socket.getIO();
        activeDonations.forEach(donation => {
            io.emit('donationUpdated', { donationId: donation._id, status: donation.status });
        });

        // Emit general user update for profile pictures/info real-time
        io.emit('userUpdated', {
            _id: updatedUser._id,
            name: updatedUser.name,
            avatar: updatedUser.avatar,
            phone: updatedUser.phone
        });

        // Return full user object expected by frontend
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            avatar: updatedUser.avatar,
            role: updatedUser.role,
            isProfileComplete: updatedUser.isProfileComplete,
            socialLinks: updatedUser.socialLinks
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
