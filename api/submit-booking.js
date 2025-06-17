const nodemailer = require('nodemailer');
const { URLSearchParams } = require('url');

async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      resolve(Object.fromEntries(new URLSearchParams(body)));
    });
    req.on('error', err => {
      reject(err);
    });
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end('Method Not Allowed');
  }

  const { name, email, phone, service, date, message } = await parseBody(req);

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
    res.end('Thank you for your booking. We will get back to you shortly.');
  } catch (err) {
    console.error('Error sending email:', err);
    res.statusCode = 500;
    res.end('There was an error sending your booking.');
  }
};
