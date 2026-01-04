const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Donation = require('./models/Donation');

dotenv.config();

const verifyStats = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const totalUsers = await User.countDocuments();
        const totalDonations = await Donation.countDocuments();

        const statusCounts = await Donation.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        let deliveredCount = 0;
        let pendingCount = 0;

        statusCounts.forEach(stat => {
            if (['delivered', 'completed'].includes(stat._id)) {
                deliveredCount += stat.count;
            } else {
                pendingCount += stat.count;
            }
        });

        const fs = require('fs');
        const output = `
Total Users: ${totalUsers}
Total Donations: ${totalDonations}
------------------------------------------------
Donation Counts by Status:
${statusCounts.map(s => `${s._id}: ${s.count}`).join('\n')}
------------------------------------------------
Calculated Delivered (delivered + completed): ${deliveredCount}
Calculated Pending (others): ${pendingCount}
        `;
        fs.writeFileSync('stats_output.txt', output);
        console.log('Stats written to stats_output.txt');

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

verifyStats();
