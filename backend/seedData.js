const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Donation = require('./models/Donation');
const User = require('./models/User');

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('MongoDB Connected');

        // Find the specific donor or the first one
        const donor = await User.findOne({ email: 'razeecurd@gmail.com' }) || await User.findOne({ role: 'donor' });

        if (!donor) {
            console.log('No donor found');
            process.exit(1);
        }

        console.log(`Seeding data for donor: ${donor.name} (${donor._id})`);

        // Generate 50 dummy donations over the last 6 months
        const donations = [];
        const foodTypes = ['Rice & Curry', 'Bread Loaves', 'Vegetable Stew', 'Chicken Biryani', 'Fruit Basket', 'Canned Goods', 'Pasta', 'Sandwiches'];
        const statuses = ['completed', 'completed', 'completed', 'delivered', 'delivered', 'expired', 'posted'];

        for (let i = 0; i < 50; i++) {
            const isCompleted = Math.random() > 0.2; // 80% completed
            const status = statuses[Math.floor(Math.random() * statuses.length)];

            // Random date in last 180 days
            const daysAgo = Math.floor(Math.random() * 180);
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);

            const donation = {
                donor: donor._id,
                foodType: foodTypes[Math.floor(Math.random() * foodTypes.length)],
                quantity: `${Math.floor(Math.random() * 20) + 5} servings`,
                expiryDate: new Date(date.getTime() + 24 * 60 * 60 * 1000), // Expiry 1 day after creation
                location: {
                    type: 'Point',
                    coordinates: [79.8612 + (Math.random() * 0.1), 6.9271 + (Math.random() * 0.1)], // Colombo approx
                    address: 'Sample Address'
                },
                status: status,
                createdAt: date,
                updatedAt: date,
            };

            if (status === 'completed' || status === 'delivered') {
                const assignedDate = new Date(date.getTime() + Math.random() * 60 * 60 * 1000); // 1 hour later
                const pickedDate = new Date(assignedDate.getTime() + Math.random() * 60 * 60 * 2000); // 2 hours later
                const deliveredDate = new Date(pickedDate.getTime() + Math.random() * 60 * 60 * 1000); // 1 hour later

                donation.assignedAt = assignedDate;
                donation.pickedAt = pickedDate;
                donation.deliveredAt = deliveredDate;

                if (status === 'completed') {
                    donation.completedAt = new Date(deliveredDate.getTime() + Math.random() * 60 * 1000); // Mins later
                }

                // Ideally assign a volunteer too, but for analytics charts (timeline/status), user's own data is key
                // Use the FIRST volunteer found if any, or null
                const volunteer = await User.findOne({ role: 'volunteer' });
                if (volunteer) {
                    donation.volunteer = volunteer._id;
                }
            }

            donations.push(donation);
        }

        await Donation.insertMany(donations);

        console.log('Seeding completed!');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedData();
