const express = require('express');
const Staff = require('../models/Staff');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');

const router = express.Router();
const adminRoles = ['super_admin', 'school_admin'];
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, callback) => callback(null, /^image\/(jpeg|png|webp)$/.test(file.mimetype)) });

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
    const data = await Staff.create(req.body);
    const role = data.category === 'Accountant' ? 'accountant' : data.category === 'Teacher' ? 'teacher' : null;
    if (role) {
      const existing = await User.findOne({ $or: [{ employeeId: data.employeeId }, ...(data.email ? [{ email: data.email }] : [])] });
      if (!existing) {
        await User.create({ name: data.name, email: data.email || undefined, employeeId: data.employeeId, password: '123456', role, phone: data.phone, mustChangePassword: true });
      } else {
        existing.name = data.name;
        existing.email = data.email || existing.email;
        existing.employeeId = data.employeeId;
        existing.role = role;
        existing.phone = data.phone;
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
