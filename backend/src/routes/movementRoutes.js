const express = require('express');
const Student = require('../models/Student');
const StudentMovement = require('../models/StudentMovement');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();
const adminRoles = ['super_admin', 'school_admin'];

router.post('/:id/promote', protect, authorize(...adminRoles), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const { toClass, toSection, note } = req.body;
    if (!toClass) return res.status(400).json({ message: 'Target class is required' });
    const movement = await StudentMovement.create({ student: student._id, type: 'Promotion', fromClass: student.class, fromSection: student.section, toClass, toSection, note, movedBy: req.user._id });
    student.class = toClass; student.section = toSection || student.section; await student.save();
    res.json({ success: true, message: 'Student promoted successfully', data: { student, movement } });
  } catch (error) { res.status(400).json({ message: error.message }); }
});

router.post('/:id/transfer', protect, authorize(...adminRoles), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const { destinationSchool, note } = req.body;
    if (!destinationSchool) return res.status(400).json({ message: 'Destination school is required' });
    const movement = await StudentMovement.create({ student: student._id, type: 'Transfer', fromClass: student.class, fromSection: student.section, destinationSchool, note, movedBy: req.user._id });
    student.status = 'Left'; await student.save();
    res.json({ success: true, message: 'Student transferred successfully', data: { student, movement } });
  } catch (error) { res.status(400).json({ message: error.message }); }
});

router.get('/:id/history', protect, async (req, res) => {
  try { const data = await StudentMovement.find({ student: req.params.id }).sort({ movedAt: -1 }).populate('movedBy', 'name role'); res.json({ success: true, count: data.length, data }); }
  catch (error) { res.status(400).json({ message: error.message }); }
});
module.exports = router;
