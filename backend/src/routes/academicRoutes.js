const express = require('express');
const AcademicClass = require('../models/AcademicClass');
const Student = require('../models/Student');
const Staff = require('../models/Staff');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
const adminRoles = ['super_admin', 'school_admin'];

function handleError(error, res) {
  if (error.code === 11000) return res.status(409).json({ message: 'This class already exists for the academic session' });
  if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
  if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid class ID' });
  return res.status(500).json({ message: error.message });
}

router.get('/classes', protect, async (req, res) => {
  try {
    const filter = req.query.session ? { session: req.query.session } : {};
    const classes = await AcademicClass.find(filter).populate('sections.classTeacher', 'name email role').populate('sections.classTeacherStaff', 'name employeeId subject').populate('sections.subjectTeachers.teacher', 'name employeeId subject').sort({ name: 1 });
    const data = await Promise.all(classes.map(async (academicClass) => {
      const result = academicClass.toObject();
      result.sections = await Promise.all(result.sections.map(async (section) => ({
        ...section,
        studentCount: await Student.countDocuments({ class: result.name, section: section.name, status: 'Active' })
      })));
      return result;
    }));
    res.json({ success: true, count: data.length, data });
  } catch (error) { handleError(error, res); }
});

router.get('/teacher/classes', protect, authorize('teacher'), async (req, res) => {
  try {
    const staff = await Staff.findOne({ email: req.user.email, category: 'Teacher' }).select('_id');
    const teacherIds = [req.user._id, staff?._id].filter(Boolean);
    const data = await AcademicClass.find({ $or: [{ 'sections.classTeacher': req.user._id }, ...(staff ? [{ 'sections.classTeacherStaff': staff._id }] : [])] }).populate('sections.classTeacher', 'name email').populate('sections.classTeacherStaff', 'name employeeId').sort({ session: -1, name: 1 });
    const result = await Promise.all(data.map(async (item) => {
      const value = item.toObject();
      value.sections = await Promise.all(value.sections.filter((section) => teacherIds.some((id) => String(section.classTeacher?._id || section.classTeacherStaff?._id) === String(id))).map(async (section) => ({ ...section, students: await Student.find({ class: value.name, section: section.name, status: 'Active' }).select('name admissionNo rollNo fatherName class section') })));
      return value;
    }));
    res.json({ success: true, data: result });
  } catch (error) { handleError(error, res); }
});

router.post('/classes', protect, authorize(...adminRoles), async (req, res) => {
  try {
    const { name, session, subjects = [], sections = [] } = req.body;
    if (!name || !session) return res.status(400).json({ message: 'Class name and academic session are required' });
    const data = await AcademicClass.create({ name, session, subjects, sections });
    res.status(201).json({ success: true, message: 'Class created successfully', data });
  } catch (error) { handleError(error, res); }
});

router.put('/classes/:id', protect, authorize(...adminRoles), async (req, res) => {
  try {
    const data = await AcademicClass.findByIdAndUpdate(req.params.id, {
      name: req.body.name,
      session: req.body.session,
      subjects: req.body.subjects,
      sections: req.body.sections,
      active: req.body.active
    }, { returnDocument: 'after', runValidators: true });
    if (!data) return res.status(404).json({ message: 'Class not found' });
    res.json({ success: true, message: 'Class updated successfully', data });
  } catch (error) { handleError(error, res); }
});

router.put('/classes/:id/sections/:sectionId', protect, authorize(...adminRoles), async (req, res) => {
  try {
    const data = await AcademicClass.findById(req.params.id);
    if (!data) return res.status(404).json({ message: 'Class not found' });
    const section = data.sections.id(req.params.sectionId);
    if (!section) return res.status(404).json({ message: 'Section not found' });

    if (req.body.classTeacherStaff !== undefined) {
      const nextTeacherId = req.body.classTeacherStaff || null;
      const sameClassConflict = data.sections.some((existingSection) =>
        String(existingSection._id) !== String(req.params.sectionId) &&
        String(existingSection.classTeacherStaff || '') === String(nextTeacherId || '')
      );
      if (sameClassConflict) {
        return res.status(409).json({ message: 'This class incharge is already assigned to another section in this class.' });
      }
      const crossClassConflict = await AcademicClass.findOne({
        _id: { $ne: req.params.id },
        'sections.classTeacherStaff': nextTeacherId,
      });
      if (nextTeacherId && crossClassConflict) {
        return res.status(409).json({ message: 'This teacher is already assigned as class incharge for another class or section.' });
      }
      section.classTeacherStaff = nextTeacherId;
    }

    if (req.body.name !== undefined) section.name = req.body.name;
    if (req.body.capacity !== undefined) section.capacity = req.body.capacity;
    if (req.body.subjectTeachers !== undefined) section.subjectTeachers = req.body.subjectTeachers;

    await data.save();
    await data.populate('sections.classTeacherStaff', 'name employeeId subject');
    await data.populate('sections.subjectTeachers.teacher', 'name employeeId subject');
    res.json({ success: true, message: 'Section updated successfully', data });
  } catch (error) { handleError(error, res); }
});

router.delete('/classes/:id', protect, authorize(...adminRoles), async (req, res) => {
  try {
    const data = await AcademicClass.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ message: 'Class not found' });
    res.json({ success: true, message: 'Class deleted successfully' });
  } catch (error) { handleError(error, res); }
});

module.exports = router;
