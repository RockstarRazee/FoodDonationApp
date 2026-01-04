const express = require('express');
const router = express.Router();
const { googleLogin, verifyOtp, updateRole, getProfile, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware'); // Assuming you have this

router.post('/google', googleLogin);
router.post('/google/verify-otp', verifyOtp);
router.post('/verify', verifyOtp);
router.put('/update-role', protect, updateRole);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
module.exports = router;
