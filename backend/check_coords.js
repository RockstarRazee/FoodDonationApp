const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Donation = require('./models/Donation');

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(async () => {
    // Find recent 5
    const donations = await Donation.find().sort({ createdAt: -1 }).limit(5);

    donations.forEach(d => {
        const coords = d.location && d.location.coordinates ? d.location.coordinates : 'NO_COORDS';
        console.log(`[${d.status}] ${d.foodType} | Coords: ${coords}`);
    });

    process.exit();
}).catch(err => {
    console.error(err);
    process.exit(1);
});
