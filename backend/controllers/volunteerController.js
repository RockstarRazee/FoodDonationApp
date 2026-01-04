const Donation = require('../models/Donation');
const User = require('../models/User');

// @desc    Get aggregated dashboard data for volunteer
// @route   GET /api/volunteer/dashboard
// @access  Private (Volunteer only)
exports.getDashboardData = async (req, res) => {
    try {
        const volunteerId = req.user.id;

        // 1. FETCH RELEVANT DONATIONS
        // Active: assigned to me, not completed
        const activeDeliveries = await Donation.find({
            volunteer: volunteerId,
            status: { $in: ['assigned', 'picked'] }
        }).populate('donor', 'name phone location')
            .populate('recipient', 'name phone recipientLocation')
            .sort({ 'volunteerCommitment.deliveryDeadline': 1 }); // Urgent first

        // Completed: assigned to me, completed/delivered
        const completedDeliveries = await Donation.find({
            volunteer: volunteerId,
            status: { $in: ['delivered', 'completed'] }
        });

        // Available: Not assigned, status is requested (as per strictly "Recipient Request -> Volunteer Accept" flow)
        // OR 'posted' if we allow direct donor->volunteer pickup (assuming manual assignment).
        // Let's stick to showing BOTH 'posted' and 'requested' where volunteer is null.
        // But prioritize 'requested' as they have a designated recipient waiting.
        const availableOrders = await Donation.find({
            status: { $in: ['posted', 'requested'] },
            volunteer: null,
            expiryDate: { $gt: new Date() }
        }).populate('donor', 'name location')
            .populate('recipient', 'name recipientLocation')
            .sort({ createdAt: -1 })
            .limit(20); // Limit to 20 for now to avoid overload

        // 2. ANALYTICS & SCORING
        // Impact Score: Simple count of completed deliveries
        const impactScore = completedDeliveries.length;

        // Reliability Score: 
        // Start with 100. Deduct for missed deadlines (if we had history of that). 
        // For now, let's make it static or simple calc: (completed / (assigned + completed)) * 100
        const totalAssignedHistory = completedDeliveries.length + activeDeliveries.length; // Approximate
        const reliabilityScore = totalAssignedHistory > 0 ? 100 : 100; // Placeholder until we track failures

        // Stats for Charts (Last 7 Days)
        const today = new Date();
        const last7Days = new Array(7).fill(0).map((_, i) => {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const deliveriesByDay = last7Days.map(date => ({
            date,
            count: completedDeliveries.filter(d =>
                (d.deliveredAt || d.completedAt || d.updatedAt).toISOString().startsWith(date)
            ).length
        }));

        // Avg Delivery Time (mins)
        let totalMinutes = 0;
        let counted = 0;
        completedDeliveries.forEach(d => {
            if (d.pickedAt && d.deliveredAt) {
                const diff = (new Date(d.deliveredAt) - new Date(d.pickedAt)) / 60000;
                totalMinutes += diff;
                counted++;
            }
        });
        const avgDeliveryTime = counted > 0 ? Math.round(totalMinutes / counted) : 0;

        // 3. CONSTRUCT RESPONSE

        // Active Mission (The single most urgent task)
        const currentMission = activeDeliveries.length > 0 ? activeDeliveries[0] : null;

        // Sort completed deliveries by most recent first
        completedDeliveries.sort((a, b) => {
            const dateA = new Date(a.completedAt || a.deliveredAt || a.updatedAt);
            const dateB = new Date(b.completedAt || b.deliveredAt || b.updatedAt);
            return dateB - dateA;
        });

        res.json({
            overview: {
                impactScore,
                reliabilityScore,
                avgDeliveryTime,
                activeCount: activeDeliveries.length,
                completedToday: deliveriesByDay[6].count // Last element is today
            },
            currentMission,
            activeDeliveries, // Full list if they have multiple
            pastDeliveries: completedDeliveries, // EXPOSED FOR FRONTEND
            availableOrders,
            analytics: {
                deliveriesByDay
            }
        });

    } catch (error) {
        console.error("Volunteer Dashboard Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};
