const mongoose = require('mongoose');

const AdmissionApplicationSchema = new mongoose.Schema({
  studentName: { type: String, required: true, trim: true },
  fatherName: { type: String, required: true, trim: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  classApplying: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  address: { type: String, required: true, trim: true },
  previousSchool: { type: String, trim: true },
  bForm: { type: String, trim: true },
  photo: { type: String },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  status: { type: String, enum: ['Pending', 'Reviewed', 'Received', 'Accepted', 'Rejected'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('AdmissionApplication', AdmissionApplicationSchema);
