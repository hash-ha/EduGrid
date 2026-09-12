const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ParentRegistrationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  passwordHash: { type: String, required: true },
  admissionNo: { type: String, required: true, trim: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' }
}, { timestamps: true });

ParentRegistrationSchema.pre('save', async function() {
  if (this.isModified('passwordHash')) this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
});

module.exports = mongoose.model('ParentRegistration', ParentRegistrationSchema);
