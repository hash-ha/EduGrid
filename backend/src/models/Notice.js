const mongoose = require('mongoose');

const NoticeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  body: { type: String, required: true, trim: true },
  audience: { type: [String], enum: ['all', 'parent', 'student', 'teacher'], default: ['all'] },
  category: { type: String, enum: ['Notice', 'Homework', 'Event'], default: 'Notice' },
  published: { type: Boolean, default: true },
  publishedAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Notice', NoticeSchema);
