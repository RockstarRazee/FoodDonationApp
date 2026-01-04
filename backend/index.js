const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const socket = require('./socket');
const io = socket.init(server);

app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const donationRoutes = require('./routes/donationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const recipientRoutes = require('./routes/recipientRoutes');
const volunteerRoutes = require('./routes/volunteerRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/recipient', recipientRoutes);
app.use('/api/volunteer', volunteerRoutes);

// Serve static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.send('Food Donation Backend is Running');
});

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected'))
    .catch(err => console.error(err));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = { app };
