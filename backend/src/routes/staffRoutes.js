const express = require('express');
const Staff = require('../models/Staff');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');

const router = express.Router();
const adminRoles = ['super_admin', 'school_admin'];
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, callback) => callback(null, /^image\/(jpeg|png|webp)$/.test(file.mimetype)) });

function createTeacherEmail(name) {
  const cleanName = String(name || '').trim();
  if (!cleanName) return undefined;
  const firstName = cleanName.split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, '');
  return firstName ? `${firstName}.teacher@school.com` : undefined;
}

function handleError(error, res) {
  if (error.code === 11000) return res.status(409).json({ message: 'Employee ID already exists' });
  if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
  if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid staff ID' });
  return res.status(500).json({ message: error.message });
}

router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.q) filter.$or = [
      { name: { $regex: req.query.q, $options: 'i' } },
      { employeeId: { $regex: req.query.q, $options: 'i' } },
      { subject: { $regex: req.query.q, $options: 'i' } }
    ];
    const data = await Staff.find(filter).sort({ name: 1 });
    res.json({ success: true, count: data.length, data });
  } catch (error) { handleError(error, res); }
});

router.post('/', protect, authorize(...adminRoles), async (req, res) => {
  try {
    const normalizedBody = {
      ...req.body,
      email: req.body.email || (req.body.category === 'Teacher' ? createTeacherEmail(req.body.name) : req.body.email),
    };
    const data = await Staff.create(normalizedBody);
    const role = data.category === 'Accountant' ? 'accountant' : data.category === 'Teacher' ? 'teacher' : null;
    if (role) {
      const teacherEmail = data.email || createTeacherEmail(data.name);
      const existing = await User.findOne({ $or: [{ employeeId: data.employeeId }, ...(teacherEmail ? [{ email: teacherEmail }] : [])] });
      if (!existing) {
        await User.create({ name: data.name, email: teacherEmail, employeeId: data.employeeId, password: '123456', role, phone: data.phone, status: 'Active', mustChangePassword: true });
      } else {
        existing.name = data.name;
        existing.email = teacherEmail || existing.email;
        existing.employeeId = data.employeeId;
        existing.role = role;
        existing.phone = data.phone;
        existing.status = existing.status || 'Active';
        await existing.save();
      }
    }
    res.status(201).json({ success: true, message: 'Staff member created successfully', data });
  } catch (error) { handleError(error, res); }
});

router.post('/:id/photo', protect, authorize(...adminRoles), upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'A JPG, PNG, or WebP photo is required' });
    const data = await Staff.findByIdAndUpdate(req.params.id, { photo: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` }, { returnDocument: 'after' });
    if (!data) return res.status(404).json({ message: 'Staff member not found' });
    res.json({ success: true, message: 'Staff photo uploaded successfully', data: { id: data._id, photo: data.photo } });
  } catch (error) { handleError(error, res); }
});

router.put('/:id', protect, authorize(...adminRoles), async (req, res) => {
  try {
    const data = await Staff.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true });
    if (!data) return res.status(404).json({ message: 'Staff member not found' });
    res.json({ success: true, message: 'Staff member updated successfully', data });
  } catch (error) { handleError(error, res); }
});

router.delete('/:id', protect, authorize(...adminRoles), async (req, res) => {
  try {
    const data = await Staff.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ message: 'Staff member not found' });
    res.json({ success: true, message: 'Staff member deleted successfully' });
  } catch (error) { handleError(error, res); }
});

module.exports = router;
