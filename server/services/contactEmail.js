const nodemailer = require('nodemailer');
const AdminSettings = require('../models/AdminSettings');

const defaultRecipient = 'luigi_peluso26@proton.me';

function isContactEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST?.trim()
    && process.env.SMTP_USER?.trim()
    && process.env.SMTP_PASS
  );
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createEmailTransporter() {
  if (!isContactEmailConfigured()) {
    const error = new Error('Il servizio email non è configurato sul server.');
    error.code = 'EMAIL_NOT_CONFIGURED';
    throw error;
  }

  const host = process.env.SMTP_HOST.trim();
  const user = process.env.SMTP_USER.trim();
  const port = Number(process.env.SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    const error = new Error('La porta SMTP configurata non è valida.');
    error.code = 'EMAIL_CONFIG_INVALID';
    throw error;
  }

  const from = process.env.SMTP_FROM?.trim() || user;
  const secureSetting = process.env.SMTP_SECURE?.trim().toLowerCase();
  if (secureSetting && secureSetting !== 'true' && secureSetting !== 'false') {
    const error = new Error('SMTP_SECURE deve essere true o false.');
    error.code = 'EMAIL_CONFIG_INVALID';
    throw error;
  }
  const secure = secureSetting === undefined || secureSetting === ''
    ? port === 465
    : secureSetting === 'true';
  return {
    transporter: nodemailer.createTransport({
      host,
      port,
      secure,
      requireTLS: !secure,
      auth: { user, pass: process.env.SMTP_PASS },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    }),
    from,
  };
}

async function sendContactEmail({ name, email, message }) {
  const { transporter, from } = createEmailTransporter();
  const settings = await AdminSettings.findById('global').select('businessName contactEmail staffContacts');
  const businessName = settings?.businessName?.trim() || 'PelusoGroup';
  const safeBusinessName = businessName.replace(/[\r\n]+/g, ' ').trim();
  const configuredContact = settings?.staffContacts?.find((contact) => contact.id === 'luigi')?.email;
  const recipient = settings?.contactEmail?.trim()
    || process.env.CONTACT_EMAIL?.trim()
    || configuredContact
    || defaultRecipient;
  const safeName = name.replace(/[\r\n]+/g, ' ').trim();
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');

  const result = await transporter.sendMail({
    from: { name: `${safeBusinessName} - Richieste dal sito`, address: from },
    to: recipient,
    replyTo: { name: safeName, address: email },
    subject: `Nuova richiesta dal sito - ${safeName.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 70)}`,
    text: `Nuova richiesta ricevuta dal sito ${safeBusinessName}\n\nNome: ${safeName}\nEmail: ${email}\n\nMessaggio:\n${message}`,
    html: [
      `<h2>Nuova richiesta dal sito ${escapeHtml(safeBusinessName)}</h2>`,
      `<p><strong>Nome:</strong> ${escapeHtml(safeName)}</p>`,
      `<p><strong>Email:</strong> ${escapeHtml(email)}</p>`,
      `<p><strong>Messaggio:</strong><br>${safeMessage}</p>`,
    ].join(''),
  });

  if (!result.accepted.some((address) => address.toLowerCase() === recipient.toLowerCase())) {
    const error = new Error('Il server SMTP non ha accettato il destinatario.');
    error.code = 'EMAIL_RECIPIENT_REJECTED';
    throw error;
  }

  return result.messageId;
}

async function sendNotificationEmail({ recipient, subject, name, message }) {
  const { transporter, from } = createEmailTransporter();
  const settings = await AdminSettings.findById('global').select('businessName');
  const businessName = settings?.businessName?.trim() || 'PelusoGroup';
  const safeBusinessName = businessName.replace(/[\r\n]+/g, ' ').trim();
  const safeName = name.replace(/[\r\n]+/g, ' ').trim();
  const safeSubject = subject.replace(/[\r\n]+/g, ' ').trim().slice(0, 160);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');
  const result = await transporter.sendMail({
    from: { name: `${safeBusinessName} - Richieste dal sito`, address: from },
    to: recipient,
    subject: safeSubject,
    text: `Ciao ${safeName},\n\n${message}`,
    html: [
      `<p>Ciao ${escapeHtml(safeName)},</p>`,
      `<p>${safeMessage}</p>`,
    ].join(''),
  });

  if (!result.accepted.some((address) => address.toLowerCase() === recipient.toLowerCase())) {
    const error = new Error('Il server SMTP non ha accettato il destinatario.');
    error.code = 'EMAIL_RECIPIENT_REJECTED';
    throw error;
  }

  return result.messageId;
}

module.exports = { isContactEmailConfigured, sendContactEmail, sendNotificationEmail };
