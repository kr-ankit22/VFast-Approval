import nodemailer from 'nodemailer';
import logger from './logger';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    logger.info({ to: options.to, subject: options.subject }, "Attempting to send email");
    const info = await transporter.sendMail({
      from: `"VFast Booker" <${process.env.EMAIL_FROM}>`,
      to: options.to,
      subject: options.subject,
      alternatives: [
        {
          contentType: 'text/plain',
          content: options.text,
        },
        {
          contentType: 'text/html; charset=UTF-8',
          content: options.html,
        },
      ],
    });
    logger.info({ messageId: info.messageId, response: info.response, to: options.to, subject: options.subject }, "Email sent successfully");
    return info;
  } catch (error: any) {
    logger.error({ err: error, to: options.to, subject: options.subject }, "Error sending email");
    // throw new Error('Failed to send email');
  }
}
