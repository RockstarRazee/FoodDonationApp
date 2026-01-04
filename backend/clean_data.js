const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Donation = require('./models/Donation');

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(async () => {
    console.log('MongoDB Connected');

    // Delete donations that are delivered/completed but have no recipient
    // (These are likely from bad seeding or testing)
    const result = await Donation.deleteMany({
        status: { $in: ['delivered', 'completed'] },
        recipient: null
    });

    console.log(`Deleted ${result.deletedCount} invalid donations.`);

    // Also delete any other obviously bad data if needed, but start with this conservative cleanup

    process.exit();
}).catch(err => {
    console.error(err);
    process.exit(1);
});
