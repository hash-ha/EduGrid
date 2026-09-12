const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Student = require('../models/Student');
const Staff = require('../models/Staff');
const AcademicClass = require('../models/AcademicClass');
const FeeVoucher = require('../models/FeeVoucher');
const Attendance = require('../models/Attendance');
const Exam = require('../models/Exam');
const Notice = require('../models/Notice');

// Dashboard statistics are available to staff who can use the dashboard.
router.get('/stats', protect, authorize('super_admin', 'school_admin', 'accountant'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Total Students
    const totalStudents = await Student.countDocuments({ status: 'Active' });

    // Total Teachers
    const totalTeachers = await Staff.countDocuments({ category: 'Teacher', status: 'Active' });

    // Total Classes
    const totalClasses = await AcademicClass.countDocuments();

    // Today's Fee Collection
    const todayCollections = await FeeVoucher.aggregate([
      { $unwind: '$payments' },
      {
        $match: {
          'payments.paidAt': { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$payments.amount' }
        }
      }
    ]);
    const todayCollection = todayCollections[0]?.total || 0;

    // Monthly Collection
    const monthlyCollections = await FeeVoucher.aggregate([
      { $unwind: '$payments' },
      {
        $match: {
          'payments.paidAt': { $gte: monthStart, $lte: monthEnd }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$payments.amount' }
        }
      }
    ]);
    const monthlyCollection = monthlyCollections[0]?.total || 0;

    const lifetimeCollections = await FeeVoucher.aggregate([
      { $unwind: '$payments' },
      { $group: { _id: null, total: { $sum: '$payments.amount' } } }
    ]);
    const lifetimeCollection = lifetimeCollections[0]?.total || 0;

    // Pending Fees
    const pendingFees = await FeeVoucher.aggregate([
      {
        $match: {
          status: { $ne: 'Paid' }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $subtract: ['$totalPayable', '$paidAmount'] } }
        }
      }
    ]);
    const pendingFeesAmount = pendingFees[0]?.total || 0;

    // Absent Students Today
    const absentToday = await Attendance.countDocuments({
      date: today,
      status: 'Absent'
    });

    // Recent Results (last 5 exams with their results)
    const recentExams = await Exam.find()
      .select('name className session examDate marks')
      .sort({ examDate: -1 })
      .limit(5)
      .populate('marks.student', 'name admissionNo rollNo');

    // Count passed and failed students in recent exams
    const recentResults = recentExams.map(exam => ({
      _id: exam._id,
      name: exam.name,
      className: exam.className,
      session: exam.session,
      examDate: exam.examDate,
      totalMarks: exam.marks.length,
      passed: exam.marks.filter(m => {
        const percentage = (m.obtainedMarks / m.totalMarks) * 100;
        return percentage >= (exam.passingMarks || 40);
      }).length
    }));

    const collectionTrend = await FeeVoucher.aggregate([
      { $unwind: '$payments' },
      { $match: { 'payments.paidAt': { $gte: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000), $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$payments.paidAt' } }, total: { $sum: '$payments.amount' } } },
      { $sort: { _id: 1 } }
    ]);
    const admissionPipeline = await Student.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]);

    res.json({
      totalStudents,
      totalTeachers,
      totalClasses,
      todayCollection,
      monthlyCollection,
      lifetimeCollection,
      pendingFees: pendingFeesAmount,
      absentStudents: absentToday,
      recentResults,
      collectionTrend,
      admissionPipeline
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
