const mongoose = require('mongoose');

const FeeStructureSchema = new mongoose.Schema({
  className: { type: String, required: true, trim: true },
  session: { type: String, required: true, trim: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
  items: [{ type: { type: String, required: true }, amount: { type: Number, required: true, min: 0 }, frequency: { type: String, enum: ['monthly', 'annual', 'admission', 'examination', 'one_time'], default: 'monthly' } }],
  scholarship: { type: Number, default: 0, min: 0 },
  concession: { type: Number, default: 0, min: 0 },
  siblingDiscount: { type: Number, default: 0, min: 0 },
  active: { type: Boolean, default: true }
}, { timestamps: true });
FeeStructureSchema.index({ className: 1, session: 1 }, { unique: true, partialFilterExpression: { student: null } });
FeeStructureSchema.index({ student: 1, session: 1 }, { unique: true, partialFilterExpression: { student: { $type: 'objectId' } } });
module.exports = mongoose.model('FeeStructure', FeeStructureSchema);
