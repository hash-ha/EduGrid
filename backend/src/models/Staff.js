const mongoose = require('mongoose');

const StaffSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, enum: ['Teacher', 'Principal', 'Accountant', 'Receptionist', 'Admin Staff', 'Other'], required: true },
  qualification: { type: String, trim: true },
  subject: { type: String, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  joiningDate: { type: Date },
  salary: { type: Number, min: 0 },
  assignedClasses: [{ type: String, trim: true }],
  photo: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('Staff', StaffSchema);
