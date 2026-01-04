const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Donation = require('./models/Donation');

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(async () => {
    console.log('MongoDB Connected');

    // Find all 'posted' donations
    const donations = await Donation.find({ status: 'posted' }).sort({ createdAt: -1 }).limit(5);

    console.log(`Found ${donations.length} recently posted donations.`);

    donations.forEach(d => {
        console.log('Food:', d.foodType);
        console.log('ID:', d._id);
        console.log('Loc:', JSON.stringify(d.location));
        console.log('Date:', d.createdAt);
        console.log('-------------------');
    });

    process.exit();
}).catch(err => {
    console.error(err);
    process.exit(1);
});
