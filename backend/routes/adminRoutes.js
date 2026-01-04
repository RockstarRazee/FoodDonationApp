const express = require('express');
const router = express.Router();
const { getStats, getUsers, getDonations, getAnalytics, getPerformance, getNotifications, getProfile, updateProfile } = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.use(protect); // All admin routes need login
router.use(authorizeRoles('admin')); // All admin routes need 'admin' role

router.get('/stats', getStats);
router.get('/analytics', getAnalytics);
router.get('/performance', getPerformance);
router.get('/notifications', getNotifications);
// Profile Routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

router.get('/users', getUsers);
router.get('/donations', getDonations);

module.exports = router;
