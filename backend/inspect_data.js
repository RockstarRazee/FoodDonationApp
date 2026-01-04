const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Donation = require('./models/Donation');
const User = require('./models/User');

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(async () => {
    console.log('MongoDB Connected');

    // Find donations that are delivered/completed but have no recipient
    const invalidDonations = await Donation.find({
        status: { $in: ['delivered', 'completed'] },
        recipient: null
    });

    console.log(`Found ${invalidDonations.length} invalid donations (delivered/completed but no recipient).`);

    // Also check for donations where recipient exists but is not found in Users (orphaned)
    const allDonations = await Donation.find({ recipient: { $ne: null } }).populate('recipient');
    const orphanedDonations = allDonations.filter(d => !d.recipient);
    console.log(`Found ${orphanedDonations.length} donations with orphaned recipient references.`);

    // Check for "Test" data (generic names or specific flags if any)
    const testDonations = await Donation.find({
        $or: [
            { foodType: /test/i },
            { foodType: /dummy/i }
        ]
    });
    console.log(`Found ${testDonations.length} obvious test donations.`);

    process.exit();
}).catch(err => {
    console.error(err);
    process.exit(1);
});
