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

    // 1. Delete donations with the specific demo names
    const resultDonations = await Donation.deleteMany({
        $or: [
            { foodType: /Fresh Demo Pizza/i },
            { foodType: 'Fresh Demo Pizza 🍕' }
        ]
    });
    console.log(`Deleted ${resultDonations.deletedCount} 'Fresh Demo Pizza' donations.`);

    // 2. Find "Demo Donor" and "Demo Volunteer" if they exist and clean up their data
    // The user mentioned "Demo Donor", so let's check for users with 'Demo' in name
    const demoUsers = await User.find({ name: /Demo/i });
    if (demoUsers.length > 0) {
        console.log(`Found ${demoUsers.length} test users (Demo Donor/Volunteers). Deleting them and their associated data...`);
        const userIds = demoUsers.map(u => u._id);

        // Delete donations by these users
        const userDonations = await Donation.deleteMany({
            $or: [
                { donor: { $in: userIds } },
                { volunteer: { $in: userIds } },
                { recipient: { $in: userIds } }
            ]
        });
        console.log(`Deleted ${userDonations.deletedCount} additional donations linked to test users.`);

        // Delete the users themselves
        await User.deleteMany({ _id: { $in: userIds } });
        console.log('Deleted test users.');
    }

    process.exit();
}).catch(err => {
    console.error(err);
    process.exit(1);
});
