const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('MongoDB Connected');

        try {
            // Drop Collections
            await mongoose.connection.collection('users').drop();
            console.log('Users collection dropped');
        } catch (e) {
            console.log('Users collection not found or already empty');
        }

        try {
            await mongoose.connection.collection('donations').drop();
            console.log('Donations collection dropped');
        } catch (e) {
            console.log('Donations collection not found or already empty');
        }

        console.log('Database wiped successfully.');
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
