const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Donation = require('./models/Donation');

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(async () => {
    console.log('MongoDB Connected');

    // Find "Veg Biriyani"
    const donations = await Donation.find({ foodType: /Veg Biriyani/i });

    console.log(`Found ${donations.length} 'Veg Biriyani' donations.`);

    donations.forEach(d => {
        console.log('ID:', d._id);
        console.log('Status:', d.status);
        console.log('Expiry:', d.expiryDate);
        console.log('Recipient:', d.recipient);
        console.log('Location:', JSON.stringify(d.location));
        console.log('-------------------');
    });

    process.exit();
}).catch(err => {
    console.error(err);
    process.exit(1);
});
