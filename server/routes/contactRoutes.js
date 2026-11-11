const express = require('express');
const mongoose = require('mongoose');
const { sendContactEmail } = require('../services/contactEmail');

const router = express.Router();
const emailPattern = /^(?!\.)(?!.*\.\.)[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;

function isValidEmail(email) {
  const [localPart, ...domainParts] = email.split('@');
  const domain = domainParts.join('@');
  return email.length <= 254
    && localPart.length <= 64
    && domain.length <= 253
    && emailPattern.test(email);
}

router.post('/', async (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (name.length < 2 || name.length > 80) {
    return res.status(400).json({ error: 'Il nome deve contenere da 2 a 80 caratteri.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Inserisci un indirizzo email valido.' });
  }
  if (message.length < 10 || message.length > 3000) {
    return res.status(400).json({ error: 'Il messaggio deve contenere da 10 a 3000 caratteri.' });
  }

  const inquiries = mongoose.connection.collection('contact_inquiries');
  let inquiryId;
  try {
    const result = await inquiries.insertOne({
      name,
      email,
      message,
      createdAt: new Date(),
      emailStatus: 'pending',
    });
    inquiryId = result.insertedId;
  } catch (error) {
    console.error('Contact form submission failed:', error);
    return res.status(500).json({ error: 'Non è stato possibile inviare il messaggio. Riprova.' });
  }

  let messageId;
  try {
    messageId = await sendContactEmail({ name, email, message });
  } catch (error) {
    try {
      await inquiries.updateOne(
        { _id: inquiryId },
        { $set: { emailStatus: 'failed', emailErrorCode: error.code || 'SMTP_ERROR' } },
      );
    } catch (updateError) {
      console.error('Could not update contact email delivery status:', updateError.message);
    }

    console.error('Contact email delivery failed:', {
      code: error.code || 'SMTP_ERROR',
      responseCode: error.responseCode,
      command: error.command,
    });
    const notConfigured = error.code === 'EMAIL_NOT_CONFIGURED' || error.code === 'EMAIL_CONFIG_INVALID';
    return res.status(notConfigured ? 503 : 502).json({
      error: notConfigured
        ? 'Messaggio salvato, ma l’email non è configurata sul server. Contatta il concessionario o configura SMTP.'
        : 'Messaggio salvato, ma non è stato possibile recapitarlo via email. Riprova più tardi o contatta il concessionario.',
    });
  }

  try {
    await inquiries.updateOne(
      { _id: inquiryId },
      { $set: { emailStatus: 'sent', emailMessageId: messageId, emailSentAt: new Date() } },
    );
  } catch (error) {
    console.error('Email sent but contact email status could not be updated:', error.message);
  }

  return res.status(201).json({ message: 'Grazie, il tuo messaggio è stato inviato al nostro team.' });
});

module.exports = router;
