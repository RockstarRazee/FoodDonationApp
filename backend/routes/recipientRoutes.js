const express = require('express');
const router = express.Router();
const { getDashboardData } = require('../controllers/recipientController');
const { protect } = require('../middleware/authMiddleware');

// Middleware to check if user is recipient (optional if protect implicitly allows all authenticated, but better to be explicit)
const isRecipient = (req, res, next) => {
    if (req.user && req.user.role === 'recipient') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as a recipient' });
    }
};

router.get('/dashboard', protect, isRecipient, getDashboardData);

module.exports = router;
