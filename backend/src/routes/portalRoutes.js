const express = require('express');
const User = require('../models/User');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const FeeVoucher = require('../models/FeeVoucher');
const Exam = require('../models/Exam');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

function calculateGrade(percentage, scale) {
  const rules = scale?.length ? [...scale].sort((a, b) => b.minPercentage - a.minPercentage) : [{ minPercentage: 90, grade: 'A+' }, { minPercentage: 80, grade: 'A' }, { minPercentage: 70, grade: 'B' }, { minPercentage: 60, grade: 'C' }, { minPercentage: 50, grade: 'D' }, { minPercentage: 0, grade: 'Fail' }];
  return rules.find((rule) => percentage >= rule.minPercentage)?.grade || 'Fail';
}

router.get('/results/search', protect, async (req, res) => {
  try {
    if (!['parent', 'student'].includes(req.user.role)) return res.status(403).json({ message: 'Online results are available to students and parents only' });
    const query = String(req.query.q || '').trim();
    if (!query) return res.status(400).json({ message: 'Roll number, admission number, or student name is required' });
    const linked = req.user.linkedStudents || [];
    const conditions = [{ name: { $regex: query, $options: 'i' } }, { admissionNo: { $regex: query, $options: 'i' } }];
    if (/^\d+$/.test(query)) conditions.push({ rollNo: Number(query) });
    const students = await Student.find({ _id: { $in: linked }, $or: conditions }).select('name fatherName admissionNo class section rollNo');
    const exams = await Exam.find({ 'marks.student': { $in: students.map((student) => student._id) } }).sort({ examDate: -1, createdAt: -1 });
    const results = [];
    for (const exam of exams) {
      const selected = exam.marks.filter((mark) => students.some((student) => student._id.equals(mark.student)));
      for (const student of students) {
        const marks = selected.filter((mark) => mark.student.equals(student._id));
        if (!marks.length) continue;
        const totalMarks = marks.reduce((sum, mark) => sum + mark.totalMarks, 0);
        const obtainedMarks = marks.reduce((sum, mark) => sum + mark.obtainedMarks, 0);
        const percentage = totalMarks ? Number(((obtainedMarks / totalMarks) * 100).toFixed(2)) : 0;
        const peers = {};
        selected.forEach((mark) => { const key = mark.student.toString(); peers[key] ||= { total: 0, obtained: 0 }; peers[key].total += mark.totalMarks; peers[key].obtained += mark.obtainedMarks; });
        const position = Object.values(peers).filter((peer) => peer.obtained > obtainedMarks).length + 1;
        results.push({ exam: { id: exam._id, name: exam.name, session: exam.session, className: exam.className, section: exam.section }, student, subjects: marks, totalMarks, obtainedMarks, percentage, grade: calculateGrade(percentage, exam.gradingScale), position, passed: obtainedMarks >= (exam.passingMarks || 0), remarks: marks.map((mark) => mark.remarks).filter(Boolean) });
      }
    }
    res.json({ success: true, count: results.length, data: results });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.get('/me', protect, async (req, res) => {
  try {
    if (!['parent', 'student'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Portal access is available to students and parents only' });
    }
    const students = await Student.find({ _id: { $in: req.user.linkedStudents || [] } }).select('-__v');
    const ids = students.map(student => student._id);
    const [attendance, fees, exams] = await Promise.all([
      Attendance.find({ student: { $in: ids } }).sort({ date: -1 }).limit(30).select('student date status remarks'),
      FeeVoucher.find({ student: { $in: ids } }).populate('student', 'name admissionNo').sort({ dueDate: -1 }),
      Exam.find({ 'marks.student': { $in: ids } }).select('name className section session marks')
    ]);
    const results = exams.map(exam => ({
      exam: { id: exam._id, name: exam.name, className: exam.className, section: exam.section, session: exam.session },
      marks: exam.marks.filter(mark => ids.some(id => id.toString() === mark.student.toString()))
    }));
    res.json({ success: true, data: { students, attendance, fees, results } });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.put('/users/:userId/students', protect, authorize('super_admin', 'school_admin'), async (req, res) => {
  try {
    const { studentIds } = req.body;
    if (!Array.isArray(studentIds)) return res.status(400).json({ message: 'studentIds must be an array' });
    const user = await User.findByIdAndUpdate(req.params.userId, { linkedStudents: studentIds }, { returnDocument: 'after', runValidators: true }).populate('linkedStudents', 'name admissionNo class section');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, message: 'Portal students linked successfully', data: { userId: user._id, linkedStudents: user.linkedStudents } });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;
