const express = require('express');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
const markingRoles = ['super_admin', 'school_admin', 'teacher'];

function dayRange(value) {
  const date = new Date(value || new Date());
  if (Number.isNaN(date.getTime())) return null;
  const start = new Date(date); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + 1);
  return { start, end };
}

function handleError(error, res) {
  if (error.code === 11000) return res.status(409).json({ message: 'Attendance already marked for this student and date' });
  if (error.name === 'ValidationError' || error.name === 'CastError') return res.status(400).json({ message: error.message });
  return res.status(500).json({ message: error.message });
}

router.get('/', protect, async (req, res) => {
  try {
    const range = dayRange(req.query.date);
    if (!range) return res.status(400).json({ message: 'Invalid date' });
    const filter = { date: { $gte: range.start, $lt: range.end } };
    if (req.query.class) {
      const students = await Student.find({ class: req.query.class }).select('_id');
      filter.student = { $in: students.map(student => student._id) };
    }
    if (['parent', 'student'].includes(req.user.role)) filter.student = { $in: req.user.linkedStudents || [] };
    const records = await Attendance.find(filter).populate('student', 'name admissionNo class section rollNo').sort({ 'student.rollNo': 1 });
    res.json({ success: true, count: records.length, data: records });
  } catch (error) { handleError(error, res); }
});

router.post('/bulk', protect, authorize(...markingRoles), async (req, res) => {
  try {
    const { date, records } = req.body;
    const range = dayRange(date);
    if (!range || !Array.isArray(records) || records.length === 0) return res.status(400).json({ message: 'Date and attendance records are required' });
    const operations = records.map(record => ({
      updateOne: {
        filter: { student: record.studentId, date: range.start },
        update: { $set: { student: record.studentId, date: range.start, status: record.status, remarks: record.remarks, markedBy: req.user._id } },
        upsert: true
      }
    }));
    await Attendance.bulkWrite(operations);
    const saved = await Attendance.find({ date: { $gte: range.start, $lt: range.end } }).populate('student', 'name admissionNo class section rollNo');
    res.json({ success: true, message: 'Attendance saved successfully', count: saved.length, data: saved });
  } catch (error) { handleError(error, res); }
});

router.get('/summary', protect, async (req, res) => {
  try {
    const range = dayRange(req.query.date);
    if (!range) return res.status(400).json({ message: 'Invalid date' });
    const data = await Attendance.aggregate([{ $match: { date: { $gte: range.start, $lt: range.end } } }, { $group: { _id: '$status', count: { $sum: 1 } } }]);
    res.json({ success: true, data });
  } catch (error) { handleError(error, res); }
});

module.exports = router;
