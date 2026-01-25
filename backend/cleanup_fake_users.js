const mongoose = require('mongoose');
const User = require('./models/User');
const Donation = require('./models/Donation');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');
require('dotenv').config();

const cleanup = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const idsToDelete = [
            '69569255cfb4f79fe0472e59', // Test User
            '69569344fe5a6ad7faa9d876', // Donor
            '6956934bfe5a6ad7faa9d879'  // Volunteer
        ];

        // 1. Delete Users
        const userResult = await User.deleteMany({ _id: { $in: idsToDelete } });
        console.log(`Deleted ${userResult.deletedCount} users.`);

        // 2. Delete Donations related to these users
        const donResult = await Donation.deleteMany({
            $or: [
                { donor: { $in: idsToDelete } },
                { volunteer: { $in: idsToDelete } },
                { recipient: { $in: idsToDelete } }
            ]
        });
        console.log(`Deleted ${donResult.deletedCount} donations.`);

        // 3. Delete Conversations
        const convResult = await Conversation.deleteMany({
            participants: { $in: idsToDelete }
        });
        console.log(`Deleted ${convResult.deletedCount} conversations.`);

        // 4. Delete Messages (from or to these users)
        const msgResult = await Message.deleteMany({
            sender: { $in: idsToDelete }
        });
        console.log(`Deleted ${msgResult.deletedCount} messages.`);

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

cleanup();
