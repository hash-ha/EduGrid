const express = require('express');
const Notice = require('../models/Notice');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
const staffRoles = ['super_admin', 'school_admin', 'teacher'];

router.get('/', protect, async (req, res) => {
  try {
    const audience = req.user.role === 'parent' || req.user.role === 'student' ? { $in: ['all', req.user.role] } : { $in: ['all', 'teacher'] };
    const data = await Notice.find({ published: true, audience }).sort({ publishedAt: -1 });
    res.json({ success: true, count: data.length, data });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.post('/', protect, authorize(...staffRoles), async (req, res) => {
  try {
    const data = await Notice.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, message: 'Notice published successfully', data });
  } catch (error) { res.status(400).json({ message: error.message }); }
});

router.patch('/:id', protect, authorize('super_admin', 'school_admin'), async (req, res) => {
  try {
    const data = await Notice.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true });
    if (!data) return res.status(404).json({ message: 'Notice not found' });
    res.json({ success: true, data });
  } catch (error) { res.status(400).json({ message: error.message }); }
});

router.delete('/:id', protect, authorize('super_admin', 'school_admin', 'teacher'), async (req, res) => {
  try {
    const data = await Notice.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ message: 'Notice not found' });
    res.json({ success: true, message: 'Notice deleted successfully' });
  } catch (error) { res.status(400).json({ message: error.message }); }
});

module.exports = router;
