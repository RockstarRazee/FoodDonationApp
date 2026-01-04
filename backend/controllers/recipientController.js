const Donation = require('../models/Donation');

// @desc    Get aggregated dashboard data for recipient
// @route   GET /api/recipient/dashboard
// @access  Private (Recipient only)
exports.getDashboardData = async (req, res) => {
    try {
        const recipientId = req.user.id;

        // Fetch all donations where this user is the recipient
        const donations = await Donation.find({ recipient: recipientId })
            .populate("donor", "name email phone avatar")
            .populate("volunteer", "name email phone avatar")
            .sort({ createdAt: -1 });

        // OVERVIEW METRICS
        const totalRequests = donations.length;
        const completedRequests = donations.filter(d => d.status === "completed").length;
        const activeRequests = donations.filter(d => d.status !== "completed" && d.status !== "expired").length;

        // ACTIVE REQUESTS LIST (all non-completed/non-expired)
        const activeRequestsList = donations.filter(d =>
            ['requested', 'assigned', 'picked', 'delivered'].includes(d.status)
        ).map(activeRequest => ({
            donationId: activeRequest._id,
            foodType: activeRequest.foodType,
            quantity: activeRequest.quantity,
            expiryDate: activeRequest.expiryDate,
            status: activeRequest.status,
            deliveryOtp: ['assigned', 'picked'].includes(activeRequest.status)
                ? activeRequest.deliveryOtp
                : null,
            volunteer: activeRequest.volunteer ? {
                name: activeRequest.volunteer.name,
                phone: activeRequest.volunteer.phone,
                avatar: activeRequest.volunteer.avatar
            } : null,
            eta: activeRequest.volunteerCommitment?.deliveryDeadline || null
        }));

        // Placeholder for other dashboard data (to be implemented)
        const overview = {
            totalRequests,
            completedRequests,
            activeRequests,
        };

        // TIMELINES & HISTORY
        const timelines = donations.map(d => ({
            donationId: d._id,
            foodType: d.foodType,
            status: d.status,
            timestamps: {
                posted: d.createdAt,
                assigned: d.assignedAt,
                picked: d.pickedAt,
                delivered: d.deliveredAt,
                completed: d.completedAt
            },
            recipientOtp: d.otps?.recipientOtp
        }));
        // ANALYTICS CALCULATIONS

        // 1. Food Type Breakdown
        {
            const foodTypeCounts = {};
            donations.forEach(d => {
                if (d.foodType) {
                    foodTypeCounts[d.foodType] = (foodTypeCounts[d.foodType] || 0) + 1;
                }
            });
            var foodTypeBreakdown = Object.keys(foodTypeCounts).map(type => ({
                name: type,
                value: foodTypeCounts[type]
            }));
        }

        // 2. Delivery Times (Completed donations: Duration in minutes from Created to Completed)
        const deliveryTimes = donations
            .filter(d => d.status === 'completed' && d.completedAt && d.createdAt)
            .map(d => ({
                date: new Date(d.completedAt).toLocaleDateString(),
                mins: Math.round((new Date(d.completedAt) - new Date(d.createdAt)) / 1000 / 60)
            }))
            .reverse() // Oldest to newest for chart usually, but dashboard sorts desc. Recharts handles order. 
            // Actually, Recharts plots in array order. Let's keep them chronological?
            // donations is sorted desc (newest first). So chart would be reverse chronological.
            // Let's reverse it for the chart so it goes left-to-right in time.
            .reverse();

        // 3. Volunteer Heroes
        const volunteerStats = {};
        const donorStats = {};

        donations.forEach(d => {
            // Volunteer Stats
            if (d.status === 'completed' && d.volunteer) {
                const vId = d.volunteer._id.toString();
                if (!volunteerStats[vId]) {
                    volunteerStats[vId] = {
                        name: d.volunteer.name,
                        avatar: d.volunteer.avatar,
                        count: 0
                    };
                }
                volunteerStats[vId].count++;
            }

            // Donor Stats (from all time? or just what this recipient received?)
            // "Top Performers" usually implies a global leaderboard or at least "Who helped ME the most".
            // Since this is Recipient Dashboard, let's show "Who helped ME".
            // If they want GLOBAL top performers, that's a different query. 
            // The prompt says "remove the page my impact and add the top performers".
            // Usually "My Impact" is personal. But "Top Performers" sounds like a community leaderboard.
            // Screenshot shows "Your Impact & Insights".
            // If I switch to Community Leaderboard, I need to fetch ALL donations, not just this recipient's.
            // But `recipientController` is scoped to `req.user.id`.
            // Let's assume for now it's "Top Donors WHO HELPED THIS RECIPIENT".
            // If the user meant "Global Leaderboard", I would need a new endpoint `getLeaderboard`.
            // Let's stick to local stats for now as it's safer and minimal changes.
            if (d.donor) {
                const dId = d.donor._id.toString();
                if (!donorStats[dId]) {
                    donorStats[dId] = {
                        name: d.donor.name,
                        avatar: d.donor.avatar || '', // Donors might not have avatar populated in query yet, check populate
                        count: 0
                    };
                }
                donorStats[dId].count++;
            }
        });

        const volunteerHeroes = Object.values(volunteerStats)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        const donorHeroes = Object.values(donorStats)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        res.status(200).json({
            success: true,
            overview,
            activeRequests: activeRequestsList,
            timelines,
            analytics: {
                deliveryTimes,
                foodTypeBreakdown,
                volunteerHeroes,
                donorHeroes
            },
            meta: {
                generatedAt: new Date(),
                recipientId
            }
        });

    } catch (error) {
        console.error("Dashboard Data Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};
