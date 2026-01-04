const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Donation = require('./models/Donation');

dotenv.config();

const debug = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const donations = await Donation.find({ foodType: /White Rice/i });
        console.log(`Found ${donations.length} donations matching "White Rice"`);

        donations.forEach(d => {
            console.log('--------------------------------------------------');
            console.log(`ID: ${d._id}`);
            console.log(`Status: '${d.status}'`); // Quotes to check for whitespace
            console.log(`Donor: ${d.donor}`);
            console.log(`Recipient: ${d.recipient}`);
            console.log(`Volunteer: ${d.volunteer}`);
            console.log(`Expiry: ${d.expiryDate}`);
            console.log('--------------------------------------------------');
        });

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

debug();
