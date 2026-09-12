const mongoose = require('mongoose');

const StudentMovementSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  type: { type: String, enum: ['Promotion', 'Transfer'], required: true },
  fromClass: String,
  fromSection: String,
  toClass: String,
  toSection: String,
  destinationSchool: String,
  note: String,
  movedAt: { type: Date, default: Date.now },
  movedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });
module.exports = mongoose.model('StudentMovement', StudentMovementSchema);
