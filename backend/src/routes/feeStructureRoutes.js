const express = require('express');
const FeeStructure = require('../models/FeeStructure');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();
const adminRoles = ['super_admin', 'school_admin', 'accountant'];

router.get('/', protect, async (req, res) => {
  try { const data = await FeeStructure.find({ active: true }).populate('student', 'name admissionNo class section').sort({ className: 1 }); res.json({ success: true, count: data.length, data }); }
  catch (error) { res.status(500).json({ message: error.message }); }
});
router.post('/', protect, authorize(...adminRoles), async (req, res) => {
  try { const data = await FeeStructure.create(req.body); res.status(201).json({ success: true, data }); }
  catch (error) { res.status(error.code === 11000 ? 409 : 400).json({ message: error.message }); }
});
router.put('/:id', protect, authorize(...adminRoles), async (req, res) => {
  try { const data = await FeeStructure.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true }); if (!data) return res.status(404).json({ message: 'Fee structure not found' }); res.json({ success: true, data }); }
  catch (error) { res.status(400).json({ message: error.message }); }
});
router.delete('/:id', protect, authorize(...adminRoles), async (req, res) => {
  try { const data = await FeeStructure.findByIdAndUpdate(req.params.id, { active: false }, { returnDocument: 'after' }); if (!data) return res.status(404).json({ message: 'Fee structure not found' }); res.json({ success: true, message: 'Fee structure archived' }); }
  catch (error) { res.status(400).json({ message: error.message }); }
});
module.exports = router;
