const mongoose = require('mongoose');
const User = require('./models/User');
const Donation = require('./models/Donation');
require('dotenv').config();

const cleanup = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const namesToDelete = ['Test User', 'Donor', 'Volunteer'];

        // Find users first
        const users = await User.find({ name: { $in: namesToDelete } });
        const ids = users.map(u => u._id);

        console.log('Found users to delete:', ids);

        if (ids.length > 0) {
            const userDelete = await User.deleteMany({ _id: { $in: ids } });
            console.log(`Deleted ${userDelete.deletedCount} users.`);

            const donationDelete = await Donation.deleteMany({
                $or: [
                    { donor: { $in: ids } },
                    { volunteer: { $in: ids } },
                    { recipient: { $in: ids } }
                ]
            });
            console.log(`Deleted ${donationDelete.deletedCount} donations.`);
        } else {
            console.log('No fake users found.');
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

cleanup();
