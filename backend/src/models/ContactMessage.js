const mongoose = require('mongoose');

const ContactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, default: '', trim: true },
  subject: { type: String, default: 'General Inquiry', trim: true },
  message: { type: String, required: true, trim: true },
  status: { type: String, enum: ['New', 'Read', 'Replied', 'Accepted'], default: 'New' },
  replyMessage: { type: String, default: '', trim: true },
  repliedBy: { type: String, default: '', trim: true },
  repliedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('ContactMessage', ContactMessageSchema);
