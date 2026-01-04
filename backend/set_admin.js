const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(async () => {
    console.log('MongoDB Connected');

    try {
        const email = 'razeerockstar@gmail.com';
        const user = await User.findOne({ email });

        if (user) {
            console.log(`Found user: ${user.name} (${user.role})`);
            user.role = 'admin';
            user.isProfileComplete = true;
            await user.save();
            console.log(`Updated ${email} to admin successfully.`);
        } else {
            console.log(`User ${email} not found.`);
        }
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
}).catch(err => console.error(err));
