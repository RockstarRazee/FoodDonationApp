const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Donation = require('./models/Donation');

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(async () => {
    console.log('MongoDB Connected');

    // Find assigned donations without proper otps
    const donations = await Donation.find({ status: 'assigned' });

    console.log(`Checking ${donations.length} assigned donations for missing OTPs...`);

    let fixedCount = 0;
    for (const d of donations) {
        if (!d.otps || !d.otps.donorOtp || !d.otps.recipientOtp) {
            console.log(`Fixing Donation ${d._id} (${d.foodType})`);
            d.otps = {
                donorOtp: Math.floor(100000 + Math.random() * 900000).toString(),
                recipientOtp: Math.floor(100000 + Math.random() * 900000).toString()
            };
            await d.save();
            fixedCount++;
        }
    }

    console.log(`Fixed ${fixedCount} donations.`);
    process.exit();
}).catch(err => {
    console.error(err);
    process.exit(1);
});
