const express = require('express');
const mongoose = require('mongoose');
const Exam = require('../models/Exam');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const { protect, authorize } = require('../middleware/auth');
const PDFDocument = require('pdfkit');

const router = express.Router();
const entryRoles = ['super_admin', 'school_admin', 'teacher'];
const manageRoles = ['super_admin', 'school_admin'];
const viewRoles = ['super_admin', 'school_admin', 'teacher', 'student', 'parent'];

function grade(percentage, gradingScale) {
  if (gradingScale?.length) return [...gradingScale].sort((a, b) => b.minPercentage - a.minPercentage).find((rule) => percentage >= rule.minPercentage)?.grade || 'Fail';
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'Fail';
}

function handleError(error, res) {
  if (error.code === 11000) return res.status(409).json({ message: 'This examination already exists' });
  if (error.name === 'ValidationError' || error.name === 'CastError') return res.status(400).json({ message: error.message });
  return res.status(500).json({ message: error.message });
}

router.get('/', protect, authorize(...viewRoles), async (req, res) => {
  try {
    const filter = ['parent', 'student'].includes(req.user.role)
      ? { published: true, 'marks.student': { $in: req.user.linkedStudents || [] } }
      : {};
    const data = await Exam.find(filter).populate('marks.student', 'name admissionNo fatherName class section').sort({ createdAt: -1 });
    res.json({ success: true, count: data.length, data });
  } catch (error) { handleError(error, res); }
});

router.patch('/:id', protect, authorize(...manageRoles), async (req, res) => {
  try {
    const allowed = ['name', 'className', 'section', 'session', 'examDate', 'passingMarks', 'gradingScale'];
    const changes = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    const data = await Exam.findByIdAndUpdate(req.params.id, changes, { returnDocument: 'after', runValidators: true });
    if (!data) return res.status(404).json({ message: 'Examination not found' });
    res.json({ success: true, message: 'Examination updated successfully', data });
  } catch (error) { handleError(error, res); }
});

router.patch('/:id/publish', protect, authorize(...manageRoles), async (req, res) => {
  try {
    const data = await Exam.findByIdAndUpdate(req.params.id, { published: Boolean(req.body.published) }, { returnDocument: 'after' });
    if (!data) return res.status(404).json({ message: 'Examination not found' });
    res.json({ success: true, message: data.published ? 'Results published successfully' : 'Results unpublished successfully', data });
  } catch (error) { handleError(error, res); }
});

router.post('/', protect, authorize(...entryRoles), async (req, res) => {
  try {
    const { name, className, section, session, examDate, passingMarks, gradingScale } = req.body;
    if (!name || !className || !session) return res.status(400).json({ message: 'Exam name, class and session are required' });
    const data = await Exam.create({ name, className, section, session, examDate, passingMarks, gradingScale });
    res.status(201).json({ success: true, message: 'Examination created successfully', data });
  } catch (error) { handleError(error, res); }
});

router.delete('/:id', protect, authorize(...manageRoles), async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Examination not found' });
    res.json({ success: true, message: 'Examination deleted successfully' });
  } catch (error) { handleError(error, res); }
});

router.post('/:id/marks', protect, authorize(...entryRoles), async (req, res) => {
  try {
    const incomingRecords = Array.isArray(req.body.records) && req.body.records.length
      ? req.body.records
      : [{
          student: req.body.student,
          subject: req.body.subject,
          totalMarks: req.body.totalMarks,
          obtainedMarks: req.body.obtainedMarks,
          remarks: req.body.remarks || ''
        }];

    if (!incomingRecords.length) {
      return res.status(400).json({ message: 'At least one student mark is required' });
    }

    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Examination not found' });

    for (const record of incomingRecords) {
      const student = record.student;
      const subject = String(record.subject ?? '').trim();
      const totalMarks = Number(record.totalMarks ?? 0);
      const obtainedMarks = Number(record.obtainedMarks ?? 0);
      const remarks = record.remarks || '';

      if (!student || !subject) {
        return res.status(400).json({ message: 'Student and subject are required for every mark entry' });
      }
      if (!Number.isFinite(totalMarks) || totalMarks <= 0) {
        return res.status(400).json({ message: 'Total marks must be a positive number' });
      }
      if (!Number.isFinite(obtainedMarks) || obtainedMarks < 0) {
        return res.status(400).json({ message: 'Obtained marks must be zero or greater' });
      }
      if (obtainedMarks > totalMarks) {
        return res.status(400).json({ message: 'Obtained marks cannot exceed total marks' });
      }

      const existingMark = exam.marks.find((mark) =>
        mark.student.toString() === String(student) &&
        mark.subject.toLowerCase() === subject.toLowerCase()
      );

      if (existingMark) {
        existingMark.totalMarks = totalMarks;
        existingMark.obtainedMarks = obtainedMarks;
        existingMark.remarks = remarks;
      } else {
        exam.marks.push({
          student,
          subject,
          totalMarks,
          obtainedMarks,
          remarks,
        });
      }
    }

    await exam.save();
    const data = await exam.populate('marks.student', 'name admissionNo class section');
    res.json({
      success: true,
      message: `${incomingRecords.length} mark entry(s) saved successfully`,
      data,
    });
  } catch (error) { handleError(error, res); }
});

router.delete('/:id/results/:studentId', protect, authorize(...manageRoles), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Examination not found' });
    const before = exam.marks.length;
    exam.marks = exam.marks.filter((mark) => String(mark.student) !== String(req.params.studentId));
    if (exam.marks.length === before) {
      return res.status(404).json({ message: 'No marks found for this student in this examination' });
    }
    await exam.save();
    res.json({ success: true, message: 'Student result deleted successfully' });
  } catch (error) { handleError(error, res); }
});

router.get('/:id/results', protect, authorize(...viewRoles), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate('marks.student', 'name admissionNo fatherName class section');
    if (!exam) return res.status(404).json({ message: 'Examination not found' });
    if (['parent', 'student'].includes(req.user.role) && !exam.published) return res.status(403).json({ message: 'Results are not published yet' });

    const studentIds = [...new Set(exam.marks.map((mark) => String(mark.student?._id || mark.student)).filter(Boolean))];
    const studentsById = Object.fromEntries(
      (await Student.find({ _id: { $in: studentIds } }).select('name admissionNo fatherName class section').lean()).map((student) => [String(student._id), student])
    );

    const byStudent = {};
    const eligibleMarks = exam.marks.filter((mark) => {
      const student = mark.student && typeof mark.student === 'object' ? mark.student : studentsById[String(mark.student)] || null;
      return student && student.class === exam.className && (!exam.section || student.section === exam.section);
    });
    eligibleMarks.forEach(mark => {
      const student = mark.student && typeof mark.student === 'object' ? mark.student : studentsById[String(mark.student)] || { _id: mark.student, name: 'Unknown' };
      const key = String(student._id || mark.student || '');
      if (!byStudent[key]) byStudent[key] = { student, subjects: [], totalMarks: 0, obtainedMarks: 0 };
      byStudent[key].subjects.push(mark);
      byStudent[key].totalMarks += mark.totalMarks;
      byStudent[key].obtainedMarks += mark.obtainedMarks;
    });
    const results = Object.values(byStudent).map(result => { const percentage = result.totalMarks ? (result.obtainedMarks / result.totalMarks) * 100 : 0; return { ...result, percentage: Number(percentage.toFixed(2)), grade: grade(percentage, exam.gradingScale), passed: result.obtainedMarks >= (exam.passingMarks || 0) }; }).sort((a, b) => b.percentage - a.percentage).map((result, index) => ({ ...result, position: index + 1 }));
    res.json({ success: true, exam: { id: exam._id, name: exam.name, className: exam.className, section: exam.section, session: exam.session, passingMarks: exam.passingMarks, gradingScale: exam.gradingScale }, data: results });
  } catch (error) { handleError(error, res); }
});

router.get('/:id/report-card/:studentId', protect, authorize(...viewRoles), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate('marks.student', 'name admissionNo fatherName class section rollNo photo');
    if (!exam) return res.status(404).json({ message: 'Examination not found' });
    if (['parent', 'student'].includes(req.user.role) && (!exam.published || !(req.user.linkedStudents || []).some((id) => String(id) === String(req.params.studentId)))) return res.status(403).json({ message: 'This report card is not available' });
    const marks = exam.marks.filter((mark) => String(mark.student?._id || mark.student) === String(req.params.studentId));
    if (!marks.length) return res.status(404).json({ message: 'No marks found for this student' });
    const totalMarks = marks.reduce((sum, mark) => sum + mark.totalMarks, 0);
    const obtainedMarks = marks.reduce((sum, mark) => sum + mark.obtainedMarks, 0);
    const percentage = totalMarks ? Number(((obtainedMarks / totalMarks) * 100).toFixed(2)) : 0;
    const attendance = await Attendance.find({ student: req.params.studentId }).select('status');
    const allResults = {};
    exam.marks.forEach(mark => {
      const key = String(mark.student?._id || mark.student);
      if (!allResults[key]) allResults[key] = { total: 0, obtained: 0 };
      allResults[key].total += mark.totalMarks;
      allResults[key].obtained += mark.obtainedMarks;
    });
    const position = Object.values(allResults).filter(result => result.obtained > obtainedMarks).length + 1;
    const student = marks[0].student && typeof marks[0].student === 'object'
      ? marks[0].student
      : await Student.findById(req.params.studentId).select('name admissionNo fatherName class section rollNo photo');
    res.json({
      success: true,
      data: { exam: { name: exam.name, className: exam.className, section: exam.section, session: exam.session }, student, subjects: marks, totalMarks, obtainedMarks, percentage, grade: grade(percentage, exam.gradingScale), position, attendance: { total: attendance.length, present: attendance.filter(item => item.status === 'Present').length, absent: attendance.filter(item => item.status === 'Absent').length, leave: attendance.filter(item => item.status === 'Leave').length, late: attendance.filter(item => item.status === 'Late').length }, remarks: marks.map(mark => mark.remarks).filter(Boolean) }
    });
  } catch (error) { handleError(error, res); }
});

router.get('/:id/report-card/:studentId/pdf', protect, authorize(...viewRoles), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate('marks.student', 'name admissionNo fatherName class section rollNo photo');
    if (!exam) return res.status(404).json({ message: 'Examination not found' });
    if (['parent', 'student'].includes(req.user.role) && (!exam.published || !(req.user.linkedStudents || []).some((id) => String(id) === String(req.params.studentId)))) return res.status(403).json({ message: 'This report card is not available' });
    const marks = exam.marks.filter((mark) => String(mark.student?._id || mark.student) === String(req.params.studentId));
    if (!marks.length) return res.status(404).json({ message: 'No marks found for this student' });
    const totalMarks = marks.reduce((sum, mark) => sum + mark.totalMarks, 0);
    const obtainedMarks = marks.reduce((sum, mark) => sum + mark.obtainedMarks, 0);
    const percentage = totalMarks ? ((obtainedMarks / totalMarks) * 100).toFixed(2) : '0.00';
    const attendance = await Attendance.find({ student: req.params.studentId }).select('status');
    const attendanceSummary = { total: attendance.length, present: attendance.filter(item => item.status === 'Present').length, absent: attendance.filter(item => item.status === 'Absent').length, leave: attendance.filter(item => item.status === 'Leave').length, late: attendance.filter(item => item.status === 'Late').length };
    const student = marks[0].student && typeof marks[0].student === 'object'
      ? marks[0].student
      : await Student.findById(req.params.studentId).select('name admissionNo fatherName class section rollNo photo');
    const remarks = marks.map(mark => mark.remarks).filter(Boolean);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${marks[0].student.admissionNo}-${exam.name}-report-card.pdf"`);
    const document = new PDFDocument({ margin: 50 });
    document.pipe(res);
    document.rect(48, 42, 504, 58).fill('#173247');
    document.fillColor('#f3c969').circle(78, 71, 18).fill();
    document.fillColor('#173247').fontSize(16).text('S', 72, 62);
    document.fillColor('#ffffff').fontSize(19).text('GREENFIELD ACADEMY', 108, 55);
    document.fontSize(10).text('PROFESSIONAL STUDENT REPORT CARD', 108, 80);
    document.fillColor('#172c3d').moveDown(3);
    if (student.photo?.startsWith('data:image/')) document.image(Buffer.from(student.photo.split(',')[1], 'base64'), 455, 118, { fit: [95, 95], align: 'center', valign: 'center' });
    document.fontSize(14).text(exam.name, { underline: true }).fontSize(10).text(`Academic Session: ${exam.session || '—'}`).moveDown();
    document.fontSize(11).text(`Student Name: ${student.name}`).text(`Father/Guardian: ${student.fatherName || '—'}`).text(`Admission No: ${student.admissionNo}`).text(`Class: ${student.class}   Section: ${student.section || '—'}   Roll No: ${student.rollNo || '—'}`).moveDown();
    document.fontSize(11).text('SUBJECT-WISE PERFORMANCE', { underline: true }).moveDown(.5);
    marks.forEach(mark => document.text(`${mark.subject.padEnd(24)} ${mark.obtainedMarks} / ${mark.totalMarks}   ${mark.remarks || ''}`));
    document.moveDown();
    document.text(`Total Marks: ${totalMarks}    Obtained Marks: ${obtainedMarks}`).text(`Percentage: ${percentage}%    Grade: ${grade(Number(percentage), exam.gradingScale)}    Position: ${Object.values(exam.marks.reduce((result, mark) => { const key = mark.student._id.toString(); result[key] ||= { total: 0, obtained: 0 }; result[key].total += mark.totalMarks; result[key].obtained += mark.obtainedMarks; return result; }, {})).filter(result => result.obtained > obtainedMarks).length + 1}`).moveDown();
    document.fontSize(11).text('ATTENDANCE', { underline: true }).moveDown(.5).text(`Total Days: ${attendanceSummary.total}    Present: ${attendanceSummary.present}    Absent: ${attendanceSummary.absent}    Leave: ${attendanceSummary.leave}    Late: ${attendanceSummary.late}`).moveDown();
    document.text(`Teacher Remarks: ${remarks.join(' | ') || '—'}`).moveDown(2);
    document.text('Teacher Signature: ____________________', 60).text('Principal Signature: ____________________', 330, document.y - 14).moveDown(2);
    document.text('Parent Signature: ____________________', 60);
    document.end();
  } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;
