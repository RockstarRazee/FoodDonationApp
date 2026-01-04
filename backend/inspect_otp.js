const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Donation = require('./models/Donation');

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(async () => {
    console.log('MongoDB Connected');

    // Find donations with 'biriyani' (case insensitive)
    const donations = await Donation.find({ foodType: /biriyani/i });

    console.log(`Found ${donations.length} 'biriyani' donations.`);

    donations.forEach(d => {
        console.log('ID:', d._id);
        console.log('Status:', d.status);
        console.log('OTPs:', d.otps);
        console.log('-------------------');
    });

    process.exit();
}).catch(err => {
    console.error(err);
    process.exit(1);
});
