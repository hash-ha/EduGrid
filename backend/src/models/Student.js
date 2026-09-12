const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  admissionNo: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  fatherName: {
    type: String,
    required: true
  },
  motherName: {
    type: String
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  email: {
    type: String,
    unique: true,
    sparse: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  cnic: {
    type: String
  },
  bForm: {
    type: String
  },
  class: {
    type: String,
    required: true,
    enum: ['Play Group', 'Nursery', 'Prep/KG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10']
  },
  section: {
    type: String
  },
  rollNo: {
    type: Number
  },
  previousSchool: {
    type: String
  },
  admissionDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Applicant', 'Active', 'Left', 'Passed Out'],
    default: 'Applicant'
  },
  photo: {
    type: String
  },
  guardianInfo: {
    name: String,
    relation: String,
    phone: String,
    cnic: String
  }
}, {
  timestamps: true
});

// Generate an admission number before required-field validation runs.
StudentSchema.pre('validate', async function() {
  if (!this.admissionNo) {
    const count = await mongoose.model('Student').countDocuments();
    const year = new Date().getFullYear();
    this.admissionNo = `S-${year}-${String(count + 1).padStart(4, '0')}`;
  }
});

module.exports = mongoose.model('Student', StudentSchema);