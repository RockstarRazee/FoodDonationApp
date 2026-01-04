const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Donation = require('./models/Donation');

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(async () => {
    console.log('MongoDB Connected');

    // Delete donations that are expired
    // (These are cluttering the dashboard as per user request)
    const result = await Donation.deleteMany({
        status: 'expired'
    });

    console.log(`Deleted ${result.deletedCount} expired donations.`);

    process.exit();
}).catch(err => {
    console.error(err);
    process.exit(1);
});
