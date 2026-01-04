const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Donation = require('./models/Donation');
const User = require('./models/User');

dotenv.config();

const reseed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected');

        const email = 'razeecurd@gmail.com';
        const user = await User.findOne({ email });

        if (!user) {
            console.error(`User with email ${email} NOT FOUND!`);
            // List all donors to see who exists
            const donors = await User.find({ role: 'donor' }).select('name email');
            console.log('Available donors:', donors);
            process.exit(1);
        }

        console.log(`Found User: ${user.name} (${user._id})`);

        const initialCount = await Donation.countDocuments({ donor: user._id });
        console.log(`Initial Donation Count: ${initialCount}`);

        if (initialCount > 10) {
            console.log('User already has data. Skipping seed to avoid duplicates.');
            // Optionally clear data if we want to "reset"
            // await Donation.deleteMany({ donor: user._id });
            // console.log('Cleared existing data.');
        } else {
            console.log('Seeding data...');
            // Generate 50 dummy donations
            const donations = [];
            const foodTypes = ['Rice & Curry', 'Bread Loaves', 'Vegetable Stew', 'Chicken Biryani', 'Fruit Basket', 'Canned Goods', 'Pasta', 'Sandwiches'];
            const statuses = ['completed', 'completed', 'completed', 'delivered', 'delivered', 'expired', 'posted'];

            for (let i = 0; i < 50; i++) {
                const status = statuses[Math.floor(Math.random() * statuses.length)];

                // Random date in last 180 days
                const daysAgo = Math.floor(Math.random() * 180);
                const date = new Date();
                date.setDate(date.getDate() - daysAgo);

                const donation = {
                    donor: user._id,
                    foodType: foodTypes[Math.floor(Math.random() * foodTypes.length)],
                    quantity: `${Math.floor(Math.random() * 20) + 5} servings`,
                    expiryDate: new Date(date.getTime() + 24 * 60 * 60 * 1000),
                    location: {
                        type: 'Point',
                        coordinates: [79.8612 + (Math.random() * 0.1), 6.9271 + (Math.random() * 0.1)],
                        address: 'Sample Address'
                    },
                    status: status,
                    createdAt: date,
                    updatedAt: date,
                };

                if (['completed', 'delivered', 'picked', 'assigned'].includes(status)) {
                    donation.assignedAt = new Date(date.getTime() + 1000 * 60 * 60);
                }
                if (['completed', 'delivered', 'picked'].includes(status)) {
                    donation.pickedAt = new Date(date.getTime() + 1000 * 60 * 60 * 2);
                }
                if (['completed', 'delivered'].includes(status)) {
                    donation.deliveredAt = new Date(date.getTime() + 1000 * 60 * 60 * 3);
                }
                if (status === 'completed') {
                    donation.completedAt = new Date(date.getTime() + 1000 * 60 * 60 * 4);
                }

                // Assign a volunteer if needed
                if (status !== 'posted') {
                    const volunteer = await User.findOne({ role: 'volunteer' });
                    if (volunteer) donation.volunteer = volunteer._id;
                }

                donations.push(donation);
            }

            await Donation.insertMany(donations);
            console.log('Seeding inserted 50 records.');
        }

        const finalCount = await Donation.countDocuments({ donor: user._id });
        console.log(`Final Donation Count: ${finalCount}`);

        process.exit();

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

reseed();
