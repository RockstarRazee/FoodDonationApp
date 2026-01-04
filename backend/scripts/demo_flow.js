const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const User = require('../models/User'); // Adjust path as needed

dotenv.config();

const API_URL = 'http://localhost:5000/api';

// Utils
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const log = (msg) => console.log(`[DEMO BOT]: ${msg}`);

async function getAuthToken(name, email, role) {
    const user = await User.findOneAndUpdate(
        { email },
        {
            name,
            email,
            role,
            isProfileComplete: true,
            $setOnInsert: { phone: Math.floor(1000000000 + Math.random() * 9000000000).toString() }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    log(`Auth ready for: ${name} (${role})`);

    return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
}

async function main() {
    try {
        log("Starting Real-Time Verification Flow...");

        // Connect to DB for User Management
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        log("Connected to DB for Auth Setup");

        // 1. Setup Tokens
        const donorToken = await getAuthToken('Demo Donor', 'demodonor@test.com', 'donor');
        const volToken = await getAuthToken('Demo Volunteer', 'demovolunteer@test.com', 'volunteer');

        // 2. Post Donation
        log("Posting 'Fresh Demo Pizza'...");
        const donationData = {
            foodType: 'Fresh Demo Pizza 🍕',
            quantity: '3 Boxes',
            expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
            location: [77.5946, 12.9716],
            address: 'Central Park, Bangalore'
        };

        const createRes = await axios.post(`${API_URL}/donations`, donationData, {
            headers: { Authorization: `Bearer ${donorToken}` }
        });
        const donationId = createRes.data._id;
        log(`Donation Created! ID: ${donationId}`);
        log(">> ACTION REQUIRED: Please go to 'Browse Food' and REQUEST this donation now! <<");

        // 3. Poll for Request
        log("Waiting for Recipient to Request...");
        let isRequested = false;
        while (!isRequested) {
            await sleep(2000);
            try {
                // Check status via public or donor API.
                // Using donor API to check my donations
                const checkRes = await axios.get(`${API_URL}/donations/my`, {
                    headers: { Authorization: `Bearer ${donorToken}` }
                });
                const myDonations = checkRes.data;
                const target = myDonations.find(d => d._id === donationId);

                if (target && target.status === 'requested') {
                    isRequested = true;
                    log("User has REQUESTED the donation! 🚀");
                    log("Initiating Volunteer response sequence...");
                }
            } catch (e) {
                // ignore
            }
        }

        await sleep(2000);

        // 4. Assign Volunteer
        log("Volunteer Accepting Request...");
        await axios.put(`${API_URL}/donations/${donationId}/assign`,
            { deliveryDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000) },
            { headers: { Authorization: `Bearer ${volToken}` } }
        );
        log("Status: ASSIGNED. (Check your Dashboard!)");

        await sleep(5000);

        // 5. Picked Up
        log("Volunteer Picked Up Food...");
        await axios.put(`${API_URL}/donations/${donationId}/status`,
            { status: 'picked', otp: null },
            { headers: { Authorization: `Bearer ${volToken}` } }
        );
        log("Status: PICKED. (On the way!)");

        await sleep(5000);

        // 6. Delivered
        log("Volunteer Arrived at Location...");
        await axios.put(`${API_URL}/donations/${donationId}/status`,
            { status: 'delivered', otp: null },
            { headers: { Authorization: `Bearer ${volToken}` } }
        );
        log("Status: DELIVERED. (Please Confirm Receipt!)");
        log("Interactive Demo Complete. ✨");

    } catch (error) {
        console.error("Demo Failed:", error.response ? error.response.data : error.message);
    } finally {
        await mongoose.disconnect();
    }
}

main();
