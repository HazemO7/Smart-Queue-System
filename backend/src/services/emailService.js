const nodemailer = require('nodemailer');

// ─────────────────────────────────────────────────────────────
// Email Transporter — configured from environment variables.
// Supports Gmail, Outlook, SendGrid, or any SMTP provider.
// ─────────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send a booking confirmation email to the patient.
 * Non-blocking — callers should use .catch() for error handling.
 */
async function sendBookingConfirmation({ to, patientName, clinicName, ticketNumber, bookingDate, queuePosition, estimatedWait }) {
  const positionSection = queuePosition != null
    ? `<tr>
        <td style="padding: 8px 0; color: #6c757d; font-size: 14px;">Queue Position</td>
        <td style="padding: 8px 0; text-align: right; font-weight: 600; font-size: 14px;">#${queuePosition}</td>
       </tr>`
    : '';

  const waitSection = estimatedWait != null
    ? `<tr>
        <td style="padding: 8px 0; color: #6c757d; font-size: 14px;">Estimated Wait</td>
        <td style="padding: 8px 0; text-align: right; font-weight: 600; font-size: 14px;">~${estimatedWait} min</td>
       </tr>`
    : '';

  const html = `
    <div style="max-width: 500px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8f9fa; padding: 20px;">
      <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.08);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #4A90D9, #357ABD); padding: 30px 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px;">🏥 Booking Confirmed!</h1>
        </div>
        <!-- Body -->
        <div style="padding: 24px;">
          <p style="color: #333; font-size: 15px; margin-bottom: 20px;">
            Hello <strong>${patientName}</strong>, your ticket has been booked successfully.
          </p>
          <!-- Ticket Number -->
          <div style="text-align: center; margin: 20px 0;">
            <div style="display: inline-block; background: #e8f4fd; border: 2px solid #4A90D9; border-radius: 12px; padding: 16px 32px;">
              <div style="color: #6c757d; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Ticket Number</div>
              <div style="color: #4A90D9; font-size: 36px; font-weight: 700; line-height: 1.2;">${ticketNumber}</div>
            </div>
          </div>
          <!-- Details Table -->
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr>
              <td style="padding: 8px 0; color: #6c757d; font-size: 14px;">Clinic</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600; font-size: 14px;">${clinicName}</td>
            </tr>
            <tr style="border-top: 1px solid #f0f0f0;">
              <td style="padding: 8px 0; color: #6c757d; font-size: 14px;">Booking Date</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600; font-size: 14px;">${bookingDate}</td>
            </tr>
            ${positionSection ? `<tr style="border-top: 1px solid #f0f0f0;">${positionSection.replace(/<tr>|<\/tr>/g, '')}</tr>` : ''}
            ${waitSection ? `<tr style="border-top: 1px solid #f0f0f0;">${waitSection.replace(/<tr>|<\/tr>/g, '')}</tr>` : ''}
          </table>
        </div>
        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 16px 24px; text-align: center; border-top: 1px solid #eee;">
          <p style="color: #adb5bd; font-size: 12px; margin: 0;">Smart Queue System — Making healthcare visits easier.</p>
        </div>
      </div>
    </div>
  `;

  const result = await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Smart Queue System" <noreply@smartqueue.com>',
    to,
    subject: `Booking Confirmed — Ticket #${ticketNumber} at ${clinicName}`,
    html,
  });

  console.log(`[Email] Booking confirmation sent to ${to} (messageId: ${result.messageId})`);
  return result;
}

/**
 * Send a "your turn" notification email to the patient.
 * Non-blocking — callers should use .catch() for error handling.
 */
async function sendTurnNotificationEmail({ to, patientName, clinicName, ticketNumber }) {
  const html = `
    <div style="max-width: 500px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8f9fa; padding: 20px;">
      <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.08);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #28a745, #20c997); padding: 30px 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px;">🔔 It's Your Turn!</h1>
        </div>
        <!-- Body -->
        <div style="padding: 24px; text-align: center;">
          <p style="color: #333; font-size: 16px; margin-bottom: 8px;">
            Hello <strong>${patientName}</strong>,
          </p>
          <p style="color: #28a745; font-size: 20px; font-weight: 700; margin-bottom: 16px;">
            Your ticket #${ticketNumber} is now being called!
          </p>
          <p style="color: #333; font-size: 15px; margin-bottom: 24px;">
            Please proceed to <strong>${clinicName}</strong>.
          </p>
          <div style="display: inline-block; background: #d4edda; border-radius: 8px; padding: 12px 24px;">
            <span style="color: #155724; font-size: 14px; font-weight: 600;">Please arrive at the clinic immediately</span>
          </div>
        </div>
        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 16px 24px; text-align: center; border-top: 1px solid #eee;">
          <p style="color: #adb5bd; font-size: 12px; margin: 0;">Smart Queue System — Making healthcare visits easier.</p>
        </div>
      </div>
    </div>
  `;

  const result = await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Smart Queue System" <noreply@smartqueue.com>',
    to,
    subject: `It's Your Turn — ${clinicName}`,
    html,
  });

  console.log(`[Email] Turn notification sent to ${to} (messageId: ${result.messageId})`);
  return result;
}

module.exports = { sendBookingConfirmation, sendTurnNotificationEmail };
