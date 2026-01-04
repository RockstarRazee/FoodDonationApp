const express = require('express');
const router = express.Router();
const {
    createDonation,
    getNearbyDonations,
    getDonationById,
    getMyDonations,
    assignDonation,
    updateStatus,
    generateOtp,
    requestDonation,
    completeDonation,
    getDonorAnalytics
} = require('../controllers/donationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createDonation);
router.get('/my/analytics', protect, getDonorAnalytics);
router.get('/my', protect, getMyDonations);
router.get('/nearby', protect, getNearbyDonations);
router.get('/:id', protect, getDonationById);
router.post('/:id/otp', protect, generateOtp);
router.put('/:id/assign', protect, assignDonation);
router.put('/:id/status', protect, updateStatus);
router.put('/:id/request', protect, requestDonation);
router.put('/:id/complete', protect, completeDonation);

module.exports = router;
