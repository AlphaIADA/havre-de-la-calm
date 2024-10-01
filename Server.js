// Import required modules
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');

// Initialize Express app
const app = express();

// Use bodyParser to parse form data
app.use(bodyParser.urlencoded({ extended: true }));

// POST route to handle booking form submission
app.post('/submit-booking', (req, res) => {
    // Collect form data from request body
    const { name, email, phone, service, date, message } = req.body;

    // Create a transporter for sending the email via Gmail SMTP
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'ashathdavid@gmail.com', // Your Gmail address
            pass: 'ASHATHdavid1998.', // Your Gmail password or app-specific password
        },
    });

    // Define email options
    const mailOptions = {
        from: email, // Sender's email
        to: 'ashathdavid@gmail.com', // Your email address to receive the booking info
        replyTo: email,
        subject: 'New Booking from Havre De La Calme Website',
        html: `
            <h2>New Client Booking</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Service:</strong> ${service}</p>
            <p><strong>Preferred Date:</strong> ${date}</p>
            <p><strong>Message:</strong> ${message}</p>
        `,
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            res.status(500).send('There was an error sending your booking.');
        } else {
            console.log('Email sent: ' + info.response);
            res.send('Thank you for your booking. We will get back to you shortly.');
        }
    });
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
