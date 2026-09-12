const express = require('express');
const nodemailer = require('nodemailer');
const ContactMessage = require('../models/ContactMessage');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

const makeTransport = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: { user, pass }
  });
};

router.get('/', protect, authorize('super_admin', 'school_admin', 'accountant'), async (req, res) => {
  try {
    const messages = await ContactMessage.find({ status: { $ne: 'Accepted' } }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/:id/status', protect, authorize('super_admin', 'school_admin', 'accountant'), async (req, res) => {
  try {
    const { status, replyMessage } = req.body;
    if (!['New', 'Read', 'Replied', 'Accepted'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid contact message status' });
    }

    const existing = await ContactMessage.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Contact message not found' });
    }

    const update = { status };
    const finalReply = replyMessage ? String(replyMessage).trim() : '';

    if (status === 'Accepted') {
      update.replyMessage = existing.replyMessage || 'Request accepted by the school.';
      update.repliedAt = existing.repliedAt || new Date();
      update.repliedBy = existing.repliedBy || (req.user?.name || 'School Admin');
    } else if (status === 'Replied') {
      update.replyMessage = finalReply || 'Thanks for contacting the school. We have replied.';
      update.repliedAt = new Date();
      update.repliedBy = req.user && req.user.name ? req.user.name : 'School Admin';

      const transporter = makeTransport();
      if (transporter) {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: existing.email,
          subject: `Reply for your message: ${existing.subject || 'General Inquiry'}`,
          text: update.replyMessage,
          html: `<p>${update.replyMessage}</p>`
        });
      } else {
        console.log(`[contact reply] No SMTP configured. Stored reply email for ${existing.email}: ${update.replyMessage}`);
      }
    } else {
      update.replyMessage = '';
      update.repliedAt = null;
      update.repliedBy = '';
    }

    const item = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    res.json({ success: true, message: 'Contact message status updated', data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
