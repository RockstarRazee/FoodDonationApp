const express = require('express');
const router = express.Router();
const { getDashboardData } = require('../controllers/volunteerController');
const { protect } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, getDashboardData);

module.exports = router;
