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
        const users = await User.find({}, 'name email role');
        const fs = require('fs');
        let output = '--- USERS ---\\n';
        users.forEach(u => {
            output += `${u.email}: ${u.role} (${u.name})\\n`;
        });
        output += '--- END ---\\n';
        fs.writeFileSync('users_list.txt', output);
        console.log('Written to users_list.txt');

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
}).catch(err => console.error(err));
