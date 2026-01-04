const nodemailer = require('nodemailer');

const sendOtpEmail = async (email, otp, type) => {
    try {
        // Create transporter
        // NOTE: In production, use environment variables for these credentials
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, // e.g., 'your-email@gmail.com'
                pass: process.env.EMAIL_PASS  // e.g., 'your-app-password'
            }
        });

        const subject = type === 'pickup' ? 'Food Pickup OTP' : 'Food Delivery OTP';
        const action = type === 'pickup' ? 'pickup your food' : 'deliver your food';

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #333; text-align: center;">${subject}</h2>
                    <p style="color: #555; text-align: center;">A volunteer has arrived to ${action}.</p>
                    <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #2c3e50; margin: 0; letter-spacing: 5px;">${otp}</h1>
                    </div>
                    <p style="color: #777; text-align: center; font-size: 12px;">This OTP is valid for 10 minutes. Please share this code with the volunteer only when you are ready.</p>
                </div>
            `
        };

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            await transporter.sendMail(mailOptions);
            console.log(`📧 OTP Email sent to ${email}`);
        } else {
            console.log(`⚠️ Email credentials not found. Logging OTP for dev:`);
            console.log(`📧 To: ${email} | Subject: ${subject} | OTP: ${otp}`);
        }

    } catch (error) {
        console.error('Email sending failed:', error);
        // Don't block the flow if email fails, but log it
    }
};

module.exports = { sendOtpEmail };
