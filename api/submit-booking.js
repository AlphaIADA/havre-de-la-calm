const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    return res.end('Method Not Allowed');
  }

  let body = '';
  await new Promise((resolve, reject) => {
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', resolve);
    req.on('error', reject);
  });

  const params = new URLSearchParams(body);
  const name = params.get('name') || '';
  const email = params.get('email') || '';
  const phone = params.get('phone') || '';
  const service = params.get('service') || '';
  const date = params.get('date') || '';
  const message = params.get('message') || '';

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'ashathdavid@gmail.com',
      pass: 'ASHATHdavid1998.'
    }
  });

  const mailOptions = {
    from: email,
    to: 'ashathdavid@gmail.com',
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
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.statusCode = 200;
    res.end('Thank you for your booking. We will get back to you shortly.');
  } catch (err) {
    console.error('Error sending email:', err);
    res.statusCode = 500;
    res.end('There was an error sending your booking.');
  }
};
