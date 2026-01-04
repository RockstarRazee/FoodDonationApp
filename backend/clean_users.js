const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const cleanUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find users with empty phone string and unset it
        const result = await User.updateMany(
            { phone: '' },
            { $unset: { phone: "" } }
        );

        console.log(`Updated ${result.modifiedCount} users.`);

        // Also check for nulls just in case, though usually fine
        const result2 = await User.updateMany(
            { phone: null },
            { $unset: { phone: "" } }
        );
        console.log(`Unset null phones for ${result2.modifiedCount} users.`);

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

cleanUsers();
