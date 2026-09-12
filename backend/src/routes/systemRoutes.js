const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const AcademicClass = require('../models/AcademicClass');
const AdmissionApplication = require('../models/AdmissionApplication');
const Attendance = require('../models/Attendance');
const ContactMessage = require('../models/ContactMessage');
const Exam = require('../models/Exam');
const FeeStructure = require('../models/FeeStructure');
const FeeVoucher = require('../models/FeeVoucher');
const Notice = require('../models/Notice');
const ParentRegistration = require('../models/ParentRegistration');
const Staff = require('../models/Staff');
const Student = require('../models/Student');
const StudentMovement = require('../models/StudentMovement');
const User = require('../models/User');

const router = express.Router();

router.post('/reset-school-data', protect, authorize('super_admin'), async (req, res) => {
  if (String(req.body.confirmation || '').trim() !== 'RESET SCHOOL DATA') {
    return res.status(400).json({ message: 'Type RESET SCHOOL DATA to confirm this destructive action.' });
  }

  const results = await Promise.all([
    AcademicClass.deleteMany({}),
    AdmissionApplication.deleteMany({}),
    Attendance.deleteMany({}),
    ContactMessage.deleteMany({}),
    Exam.deleteMany({}),
    FeeStructure.deleteMany({}),
    FeeVoucher.deleteMany({}),
    Notice.deleteMany({}),
    ParentRegistration.deleteMany({}),
    Staff.deleteMany({}),
    Student.deleteMany({}),
    StudentMovement.deleteMany({}),
    User.deleteMany({ role: { $nin: ['super_admin', 'school_admin'] } })
  ]);

  const deleted = results.reduce((total, result) => total + (result.deletedCount || 0), 0);
  res.json({ success: true, message: 'School data reset completed. System administrator accounts were preserved.', deleted });
});

module.exports = router;
