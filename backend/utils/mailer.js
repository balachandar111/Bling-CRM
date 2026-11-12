// ================= SMTP MAILER (Nodemailer) =================
// Uses the SMTP_* values from .env
//   SMTP_HOST=smtp.gmail.com
//   SMTP_PORT=465
//   SMTP_SECURE=true
//   SMTP_USER=support@blingreward.com
//   SMTP_PASS=<gmail / google workspace APP PASSWORD>
//   EMAIL_FROM="BlingTechConnect Desk" <noreply@blingtechconnect.com>

const nodemailer = require("nodemailer");

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS in backend/.env"
    );
  }

  const port = Number(process.env.SMTP_PORT) || 465;

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure:
      process.env.SMTP_SECURE !== undefined
        ? process.env.SMTP_SECURE === "true"
        : port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    pool: true,          // reuse connections for bulk sending
    maxConnections: 3,
    maxMessages: 100,
  });

  return transporter;
};

const sendMail = async ({ to, subject, html, text }) => {
  const from =
    process.env.EMAIL_FROM || process.env.SMTP_USER;

  return getTransporter().sendMail({
    from,
    to,
    subject,
    html,
    text,
  });
};

// Quick check used before a bulk send so we fail fast with a clear error
const verifySmtp = async () => {
  await getTransporter().verify();
};

module.exports = { sendMail, verifySmtp };