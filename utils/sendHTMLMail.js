const nodemailer = require("nodemailer");

async function sendEmail(email, subject, message) {
  try {
    const smtpConfig = {
      host: process.env.HOST,
      service: process.env.SERVICE,
      port: process.env.EMAIL_PORT,
      secure: process.env.SECURE, // use SSL
      auth: {
        user: "ranjhaniharshal@icloud.com",
        pass: process.env.PASS,
      },
    };
    const transporter = nodemailer.createTransport(smtpConfig);

    await transporter.sendMail({
      from: process.env.FROM,
      to: email,
      subject: subject,
      html: message,
    });
    console.log("Email sent");
  } catch (e) {
    console.log("Email not sent.");
    console.log(e.message);
  }
}

module.exports = sendEmail;
