const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Donation = require('./models/Donation');
const fs = require('fs');

dotenv.config();

const debug = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const donations = await Donation.find({ foodType: /White Rice/i });
        const output = donations.map(d => ({
            id: d._id,
            status: d.status,
            donor: d.donor,
            recipient: d.recipient,
            volunteer: d.volunteer
        }));

        fs.writeFileSync('donation_debug.json', JSON.stringify(output, null, 2));
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

debug();
