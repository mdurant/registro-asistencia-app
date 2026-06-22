const nodemailer = require('nodemailer');

function getSmtpConfig() {
  return {
    host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
    port: Number(process.env.SMTP_PORT || 2525),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };
}

let transporter = null;

function getTransporter() {
  if (!transporter) {
    const config = getSmtpConfig();
    if (!config.auth.user || !config.auth.pass) {
      return null;
    }
    transporter = nodemailer.createTransport(config);
  }
  return transporter;
}

async function sendEmail({ to, subject, html }) {
  const transport = getTransporter();
  const from = process.env.SMTP_FROM || 'Mi Asistencia <noreply@mi-asistencia.cl>';

  if (!transport) {
    console.warn('[EMAIL] SMTP no configurado — simulando envío');
    console.log(`[EMAIL] To: ${to}`);
    console.log(`        Subject: ${subject}`);
    return { sent: false, simulated: true };
  }

  const info = await transport.sendMail({ from, to, subject, html });
  console.log(`[EMAIL] Enviado a ${to} — ${subject} (${info.messageId})`);
  return { sent: true, messageId: info.messageId };
}

module.exports = { sendEmail, getSmtpConfig };
