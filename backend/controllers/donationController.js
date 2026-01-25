const Donation = require('../models/Donation');
const User = require('../models/User');
const { getIO } = require('../socket');

// ... existing GET methods (getMyDonations, createDonation, getNearbyDonations, getDonationById) ...

// @desc    Get user's donations
exports.getMyDonations = async (req, res) => {
    try {
        let query;
        if (req.user.role === 'volunteer') {
            query = { volunteer: req.user._id };
        } else if (req.user.role === 'recipient') {
            query = { recipient: req.user._id };
        } else {
            query = { donor: req.user._id };
        }

        const donations = await Donation.find(query)
            .sort({ createdAt: -1 })
            .populate('volunteer', 'name phone')
            .populate('donor', 'name phone')
            .populate('recipient', 'name phone');

        res.json(donations);
    } catch (error) {
        console.error('Error fetching my donations:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new donation
exports.createDonation = async (req, res) => {
    const { foodType, quantity, expiryDate, location, address } = req.body;

    if (req.user.role !== 'donor') {
        return res.status(403).json({ message: 'Only donors can post donations' });
    }

    try {
        const donation = await Donation.create({
            donor: req.user._id,
            foodType,
            quantity,
            expiryDate,
            location: {
                type: 'Point',
                coordinates: location,
                address,
            },
            status: 'posted',
        });

        getIO().emit('donationCreated', donation);
        res.status(201).json(donation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get nearby donations
exports.getNearbyDonations = async (req, res) => {
    const { lat, lon, distance } = req.query;

    if (!lat || !lon) {
        return res.status(400).json({ message: 'Please provide latitude and longitude' });
    }

    const maxDistance = distance ? parseInt(distance) : 5000000; // Default large for testing

    try {
        const query = {
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lon), parseFloat(lat)],
                    },
                    $maxDistance: maxDistance,
                },
            },
            // Logic: 
            // - If status is 'posted', Recipient sees it. 
            // - If logic requires Recipient to request first, Volunteer only sees 'requested' ones (Step 3: Volunteer Accepts Order - implied from 'Requested' list? Or can they take 'posted' ones directly?)
            // Master Plan Step 2 says: Recipient Requests -> status=requested. 
            // Master Plan Step 3 says: Volunteer accepts.
            // So Volunteer checks for 'requested' items? Or 'posted' items too?
            // "Visibility -> Volunteer -> Available Orders". 
            // Ideally Volunteer sees items to deliver. A 'posted' item might need delivery too if no specific recipient requested it? 
            // BUT Plan says "Recipient decides demand". So let's stick to the flow: Posted -> Requested -> Assigned.
            // So Volunteer should look for status 'requested'.
            // However, legacy code looked for 'posted'. I'll support both for flexibility or strictly follow plan? 
            // Plan says "Recipient Requests Food... Status=Requested... Visibility Volunteer: Available Orders".
            // So Volunteer sees 'requested'.
            // What if Recipient isn't involved? (e.g. food bank)? The plan title is "Donor -> Recipient -> Volunteer". 
            // I will assume strictly this flow.

            // For now, I will let Volunteers see 'requested' items. 
            // If I change this, old 'posted' items won't be visible to volunteers. 
            // I'll make Volunteer see 'posted' OR 'requested' but prioritize requested?
            // Let's stick to the plan: Recipient requests first.
            status: { $in: ['posted', 'requested'] },
            expiryDate: { $gt: new Date() },
        };

        if (req.user.role === 'recipient') {
            // Recipient sees 'posted' to request it
            query.status = 'posted';
            query.recipient = null; // Fix: explicitly check for null as per schema default
        } else if (req.user.role === 'volunteer') {
            // Volunteer sees 'requested' items to accept
            query.status = 'requested';
            query.volunteer = null; // Fix: explicitly check for null as per schema default
        }

        const donations = await Donation.find(query).populate('donor', 'name phone');
        res.json(donations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get donation by ID
exports.getDonationById = async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.id)
            .populate('donor', 'name phone')
            .populate('volunteer', 'name phone')
            .populate('recipient', 'name phone');

        if (!donation) {
            return res.status(404).json({ message: 'Donation not found' });
        }
        res.json(donation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// STEP 2: Recipient Requests Food
exports.requestDonation = async (req, res) => {
    const { location, address } = req.body; // Expecting location: [lng, lat]

    if (req.user.role !== 'recipient') {
        return res.status(403).json({ message: 'Only recipients can request donations' });
    }

    try {
        const donation = await Donation.findById(req.params.id);
        if (!donation) return res.status(404).json({ message: 'Donation not found' });

        if (donation.status !== 'posted') {
            return res.status(400).json({ message: 'Donation is not available' });
        }
        if (new Date(donation.expiryDate) < new Date()) {
            return res.status(400).json({ message: 'Donation has expired' });
        }

        if (location) {
            donation.recipientLocation = {
                type: 'Point',
                coordinates: location,
                address: address || 'Recipient Location'
            };
        }

        donation.recipient = req.user._id;
        donation.status = 'requested';
        await donation.save();

        getIO().emit('donationUpdated', { donationId: donation._id, status: 'requested' });
        res.json({ message: 'Donation requested successfully', donation });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// STEP 3: Volunteer Accepts + Sets Deadlines
exports.assignDonation = async (req, res) => {
    if (req.user.role !== 'volunteer') {
        return res.status(403).json({ message: 'Only volunteers can accept donations' });
    }

    const { pickupDeadline, deliveryDeadline } = req.body;
    // Validate existence of deadlines
    if (!pickupDeadline || !deliveryDeadline) {
        return res.status(400).json({ message: 'Pickup and Delivery deadlines are required' });
    }

    try {
        const donation = await Donation.findById(req.params.id);
        if (!donation) return res.status(404).json({ message: 'Donation not found' });

        // Idempotency check: If already assigned to this volunteer, return success
        if (donation.status === 'assigned' && donation.volunteer?.toString() === req.user._id.toString()) {
            return res.json({ message: 'Donation already assigned to you', donation });
        }

        if (donation.status !== 'requested' && donation.status !== 'posted') {
            return res.status(400).json({
                message: `Donation status is '${donation.status}', expected 'posted' or 'requested'. It may have been taken.`
            });
        }

        // Validate Deadlines
        const pickup = new Date(pickupDeadline);
        const delivery = new Date(deliveryDeadline);
        const expiry = new Date(donation.expiryDate);

        if (pickup >= delivery) {
            return res.status(400).json({ message: 'Pickup time must be before delivery time' });
        }
        if (delivery > expiry) {
            return res.status(400).json({ message: 'Delivery time cannot exceed expiry date' });
        }

        // REMOVED: Auto-OTP generation
        // OTPs are now generated on-demand via generateOtp endpoint

        donation.volunteer = req.user._id;
        donation.status = 'assigned';
        donation.assignedAt = new Date();
        donation.volunteerCommitment = { pickupDeadline: pickup, deliveryDeadline: delivery };

        // Initialize OTP objects (empty)
        donation.pickupOtp = { verified: false };
        donation.deliveryOtp = { verified: false };

        await donation.save();

        getIO().emit('donationUpdated', {
            donationId: donation._id,
            status: 'assigned',
            foodType: donation.foodType
        });

        res.json({
            message: 'Donation assigned successfully',
            donation
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// STEP 4: Generate OTP (Triggered by Volunteer Arrival)
exports.generateOtp = async (req, res) => {
    const { type } = req.body; // 'pickup' | 'delivery'

    if (req.user.role !== 'volunteer') {
        return res.status(403).json({ message: 'Only assigned volunteer can trigger OTP' });
    }

    try {
        const donation = await Donation.findById(req.params.id)
            .populate('donor', 'email name')
            .populate('recipient', 'email name');

        if (!donation) return res.status(404).json({ message: 'Donation not found' });

        if (donation.volunteer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You are not assigned to this donation' });
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const { sendOtpEmail } = require('../services/emailService');

        if (type === 'pickup') {
            // Check pre-conditions
            if (donation.status !== 'assigned') {
                return res.status(400).json({ message: 'Donation must be in assigned state for pickup OTP' });
            }
            if (donation.pickupOtp && donation.pickupOtp.code && !donation.pickupOtp.verified) {
                // If already generated and not verified, maybe resend?
                // For security, let's allow regenerating or just sending existing. 
                // Let's regenerate to be safe/fresh.
            }

            donation.pickupOtp = {
                code: otpCode,
                generatedAt: new Date(),
                expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes validity
                verified: false
            };
            await donation.save();

            // Send to Donor
            if (donation.donor && donation.donor.email) {
                await sendOtpEmail(donation.donor.email, otpCode, 'pickup');
            }

            // Emit Socket for Donor Dashboard
            getIO().emit('pickupOtpGenerated', {
                donationId: donation._id,
                donorId: donation.donor._id,
                otp: otpCode // Send securely? Usually minimal data, but for dashboard display we need it.
            });

        } else if (type === 'delivery') {
            // Check pre-conditions
            if (donation.status !== 'picked') {
                return res.status(400).json({ message: 'Donation must be picked up before delivery OTP' });
            }

            donation.deliveryOtp = {
                code: otpCode,
                generatedAt: new Date(),
                expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes validity
                verified: false
            };
            await donation.save();

            // Send to Recipient
            if (donation.recipient && donation.recipient.email) {
                await sendOtpEmail(donation.recipient.email, otpCode, 'delivery');
            }

            // Emit Socket for Recipient Dashboard
            getIO().emit('deliveryOtpGenerated', {
                donationId: donation._id,
                recipientId: donation.recipient._id,
                otp: otpCode
            });

        } else {
            return res.status(400).json({ message: 'Invalid OTP type' });
        }

        res.json({ message: `${type} OTP generated and sent`, type });

    } catch (error) {
        console.error('Generate OTP Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// STEP 5 & 6: Update Status (Picked / Delivered)
exports.updateStatus = async (req, res) => {
    const { status, otp } = req.body;
    // status: 'picked' | 'delivered'

    if (req.user.role !== 'volunteer') {
        return res.status(403).json({ message: 'Not authorized' });
    }

    try {
        const donation = await Donation.findById(req.params.id);
        if (!donation) return res.status(404).json({ message: 'Donation not found' });

        if (donation.volunteer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You are not assigned to this donation' });
        }

        if (status === 'picked') {
            // Volunteer reaching Donor. Input Donor OTP.
            if (donation.status !== 'assigned') {
                return res.status(400).json({ message: 'Invalid status transition. Expecting: assigned' });
            }

            if (!donation.pickupOtp || !donation.pickupOtp.code) {
                return res.status(400).json({ message: 'OTP not generated yet. Please ask donor to check email/dashboard.' });
            }

            if (donation.pickupOtp.code !== otp) {
                return res.status(400).json({ message: 'Invalid Donor OTP' });
            }

            if (donation.pickupOtp.expiresAt && new Date() > new Date(donation.pickupOtp.expiresAt)) {
                return res.status(400).json({ message: 'OTP has expired. Please regenerate.' });
            }

            donation.status = 'picked';
            donation.pickedAt = new Date();
            donation.pickupOtp.verified = true;

        } else if (status === 'delivered') {
            // Volunteer reaching Recipient. Input Recipient OTP.
            if (donation.status !== 'picked') {
                return res.status(400).json({ message: 'Invalid status transition. Expecting: picked' });
            }

            if (!donation.deliveryOtp || !donation.deliveryOtp.code) {
                return res.status(400).json({ message: 'OTP not generated yet. Please ask recipient to check email/dashboard.' });
            }

            if (donation.deliveryOtp.code !== otp) {
                return res.status(400).json({ message: 'Invalid Recipient OTP' });
            }

            if (donation.deliveryOtp.expiresAt && new Date() > new Date(donation.deliveryOtp.expiresAt)) {
                return res.status(400).json({ message: 'OTP has expired. Please regenerate.' });
            }

            donation.status = 'delivered';
            donation.deliveredAt = new Date();
            donation.deliveryOtp.verified = true;

        } else {
            return res.status(400).json({ message: 'Invalid status provided' });
        }

        await donation.save();
        getIO().emit('donationUpdated', {
            donationId: donation._id,
            status: donation.status,
            foodType: donation.foodType
        });

        // Also emit specific verified events if needed by frontend, but donationUpdated covers most state changes

        res.json({ message: `Status updated to ${status}`, donation });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// STEP 7: Recipient Confirms Delivery
exports.completeDonation = async (req, res) => {
    if (req.user.role !== 'recipient') {
        return res.status(403).json({ message: 'Only recipient can confirm completion' });
    }

    try {
        const donation = await Donation.findById(req.params.id);
        if (!donation) return res.status(404).json({ message: 'Donation not found' });

        if (donation.recipient.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (donation.status !== 'delivered') {
            return res.status(400).json({ message: 'Donation must be delivered first' });
        }

        donation.status = 'completed';
        donation.completedAt = new Date();
        await donation.save();

        getIO().emit('donationUpdated', {
            donationId: donation._id,
            status: 'completed',
            foodType: donation.foodType
        });
        res.json({ message: 'Donation completed', donation });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get donor analytics
exports.getDonorAnalytics = async (req, res) => {
    try {
        const userId = req.user._id;
        const donations = await Donation.find({ donor: userId });

        // Summary Stats
        const totalDonations = donations.length;
        const completed = donations.filter(d => d.status === 'completed' || d.status === 'delivered').length;
        const active = donations.filter(d => ['posted', 'requested', 'assigned', 'picked'].includes(d.status)).length;
        const expired = donations.filter(d => d.status === 'expired').length; // Assuming 'expired' status exists or logical check

        // People Helped: Simplify to 1 donation = 1 help for now, or sum quantity if user input is numeric string "5 meals"
        // Let's assume sum of completed donations
        const peopleHelped = completed;

        // Time Calculations (in minutes)
        let totalPickupMinutes = 0;
        let pickupCount = 0;
        let totalDeliveryMinutes = 0;
        let deliveryCount = 0;

        const volunteerStats = {};

        donations.forEach(d => {
            // Volunteer Performance Data
            if (d.volunteer) {
                const volId = d.volunteer.toString();
                if (!volunteerStats[volId]) {
                    volunteerStats[volId] = { count: 0, totalTime: 0, name: 'Unknown' }; // will populate names later
                }
                volunteerStats[volId].count++;
            }

            // Timings
            if (d.assignedAt && d.pickedAt) {
                const diff = (new Date(d.pickedAt) - new Date(d.assignedAt)) / (1000 * 60);
                totalPickupMinutes += diff;
                pickupCount++;
            }
            if (d.pickedAt && d.deliveredAt) {
                const diff = (new Date(d.deliveredAt) - new Date(d.pickedAt)) / (1000 * 60);
                totalDeliveryMinutes += diff;
                deliveryCount++;
            }
        });

        // Populate volunteer names
        // Ideally we do an aggregation for this but this is JS logic
        const volunteerIds = Object.keys(volunteerStats);
        if (volunteerIds.length > 0) {
            const volunteers = await User.find({ _id: { $in: volunteerIds } }).select('name');
            volunteers.forEach(v => {
                if (volunteerStats[v._id.toString()]) {
                    volunteerStats[v._id.toString()].name = v.name;
                }
            });
        }

        const avgPickupTime = pickupCount > 0 ? Math.round(totalPickupMinutes / pickupCount) : 0;
        const avgDeliveryTime = deliveryCount > 0 ? Math.round(totalDeliveryMinutes / deliveryCount) : 0;

        // Status Breakdown
        const statusBreakdown = {
            posted: donations.filter(d => d.status === 'posted').length,
            assigned: donations.filter(d => d.status === 'assigned').length,
            picked: donations.filter(d => d.status === 'picked').length,
            delivered: donations.filter(d => d.status === 'delivered').length,
            completed: donations.filter(d => d.status === 'completed').length,
            expired: donations.filter(d => d.status === 'expired').length
        };

        // Timeline (Last 7 days?)
        // Group by Date
        const timelineMap = {};
        donations.forEach(d => {
            const date = new Date(d.createdAt).toISOString().split('T')[0];
            if (!timelineMap[date]) timelineMap[date] = { date, donations: 0, completed: 0 };
            timelineMap[date].donations++;
            if (d.status === 'completed' || d.status === 'delivered') timelineMap[date].completed++;
        });

        // Sort timeline
        const timeline = Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date));

        const volunteerPerformance = Object.values(volunteerStats).map(v => ({
            name: v.name,
            deliveries: v.count,
            avgTime: 0 // TODO: Calculate per-volunteer avg time if needed
        }));

        res.json({
            summary: {
                totalDonations,
                completed,
                active,
                expired,
                peopleHelped,
                avgPickupTime,
                avgDeliveryTime
            },
            statusBreakdown,
            timeline,
            volunteerPerformance
        });

    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ message: error.message });
    }
};
