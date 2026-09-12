const express = require('express');
const Student = require('../models/Student');
const AdmissionApplication = require('../models/AdmissionApplication');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, callback) => callback(null, /^image\/(jpeg|png|webp)$/.test(file.mimetype)) });
const adminRoles = ['super_admin', 'school_admin'];

const allowedFields = [
  'name', 'fatherName', 'motherName', 'dateOfBirth', 'gender', 'email',
  'phone', 'address', 'cnic', 'bForm', 'class', 'section', 'rollNo',
  'previousSchool', 'admissionDate', 'status', 'photo', 'guardianInfo'
];

const pickStudentFields = (body) => Object.fromEntries(
  allowedFields
    .filter((field) => body[field] !== undefined)
    .map((field) => [field, body[field]])
);

const handleDatabaseError = (error, res) => {
  if (error.code === 11000) {
    return res.status(409).json({ message: 'Admission number or email already exists' });
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({ message: error.message });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid student ID' });
  }

  return res.status(500).json({ message: error.message });
};

// Create Student (Super Admin, School Admin)
router.post('/', protect, authorize(...adminRoles), async (req, res) => {
  try {
    const fields = pickStudentFields(req.body);
    fields.status = 'Applicant';
    const student = new Student(fields);
    await student.save();
    await AdmissionApplication.create({
      studentName: student.name,
      fatherName: student.fatherName,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      classApplying: student.class,
      phone: student.phone,
      email: student.email,
      address: student.address,
      previousSchool: student.previousSchool,
      bForm: student.bForm,
      photo: student.photo,
      student: student._id,
      status: 'Received'
    });
    res.status(201).json({
      success: true,
      message: 'Applicant created. Accountant must issue the voucher and record full payment before registration.',
      data: student
    });
  } catch (error) { handleDatabaseError(error, res); }
});

router.post('/:id/photo', protect, authorize(...adminRoles), upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'A JPG, PNG, or WebP photo is required' });
    const student = await Student.findByIdAndUpdate(req.params.id, { photo: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` }, { returnDocument: 'after' });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ success: true, message: 'Student photo uploaded successfully', data: { id: student._id, photo: student.photo } });
  } catch (error) { res.status(400).json({ message: error.message }); }
});

// Get All Students
router.get('/', protect, async (req, res) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
    const filter = {};

    if (req.query.class) filter.class = req.query.class;
    if (req.query.section) filter.section = req.query.section;
    if (req.query.status) filter.status = req.query.status;
    if (['parent', 'student'].includes(req.user.role)) {
      filter._id = { $in: req.user.linkedStudents || [] };
    }

    const [students, total] = await Promise.all([
      Student.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Student.countDocuments(filter)
    ]);

    res.json({
      success: true,
      count: students.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: students
    });
  } catch (error) { handleDatabaseError(error, res); }
});

// Search by name, admission number, father name, phone, or email
router.get('/search', protect, async (req, res) => {
  try {
    const query = String(req.query.q || '').trim();
    if (!query) return res.status(400).json({ message: 'Search query is required' });

    const pattern = { $regex: query, $options: 'i' };
    const students = await Student.find({
      $or: [
        { name: pattern },
        { admissionNo: pattern },
        { fatherName: pattern },
        { phone: pattern },
        { email: pattern },
        { cnic: pattern },
        { bForm: pattern },
        { previousSchool: pattern },
        { 'guardianInfo.name': pattern },
        { 'guardianInfo.phone': pattern }
      ]
    }).sort({ name: 1 });

    res.json({ success: true, count: students.length, data: students });
  } catch (error) { handleDatabaseError(error, res); }
});

// Get Single Student
router.get('/:id', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Student
router.put('/:id', protect, authorize(...adminRoles), async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      pickStudentFields(req.body),
      { returnDocument: 'after', runValidators: true, context: 'query' }
    );
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json({
      success: true,
      message: 'Student updated successfully',
      data: student
    });
  } catch (error) { handleDatabaseError(error, res); }
});

// Delete Student
router.delete('/:id', protect, authorize(...adminRoles), async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) { handleDatabaseError(error, res); }
});

// Search Students
router.get('/search/:query', protect, async (req, res) => {
  try {
    const query = req.params.query;
    const students = await Student.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { admissionNo: { $regex: query, $options: 'i' } },
        { fatherName: { $regex: query, $options: 'i' } }
      ]
    });
    res.json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) { handleDatabaseError(error, res); }
});

module.exports = router;