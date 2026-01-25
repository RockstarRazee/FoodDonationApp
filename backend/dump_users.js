const mongoose = require('mongoose');
const User = require('./models/User');
const fs = require('fs');
require('dotenv').config();

const dumpUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({});
        let output = '--- USER LIST ---\n';
        users.forEach(u => {
            output += `ID: ${u._id} | Name: ${u.name} | Email: ${u.email} | Role: ${u.role}\n`;
        });
        fs.writeFileSync('users_dump.txt', output);
        console.log('Users dumped to users_dump.txt');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

dumpUsers();
