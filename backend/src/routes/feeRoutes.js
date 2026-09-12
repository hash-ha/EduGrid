const express = require('express');
const FeeVoucher = require('../models/FeeVoucher');
const Student = require('../models/Student');
const User = require('../models/User');
const PDFDocument = require('pdfkit');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
const staffRoles = ['super_admin', 'school_admin', 'accountant'];
const schoolName = 'GREENFIELD ACADEMY';

function handleError(error, res) {
  if (error.code === 11000) return res.status(409).json({ message: 'Voucher number already exists' });
  if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
  if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid student or voucher ID' });
  return res.status(500).json({ message: error.message });
}

async function createVoucherForStudent(student, body) {
  const existing = await FeeVoucher.findOne({ student: student._id, feeMonth: body.feeMonth });
  if (existing) return existing;

  const items = Array.isArray(body.items) ? body.items : [];
  const itemTotal = items.reduce((sum, item) => sum + (Number(item?.amount) || 0), 0);
  const previousBalance = Number(body.previousBalance || 0);
  const fine = Number(body.fine || 0);
  const discount = Number(body.discount || 0);
  const scholarship = Number(body.scholarship || 0);
  const concession = Number(body.concession || 0);
  const siblingDiscount = Number(body.siblingDiscount || 0);
  const advanceAmount = Number(body.advanceAmount || 0);
  const totalPayable = Math.max(0, itemTotal + previousBalance + fine - (discount + scholarship + concession + siblingDiscount) - advanceAmount);

  return FeeVoucher.create({
    student: student._id,
    feeMonth: body.feeMonth,
    dueDate: body.dueDate,
    items,
    previousBalance,
    discount,
    scholarship,
    concession,
    siblingDiscount,
    fine,
    advanceAmount,
    totalPayable,
    paidAmount: 0,
    status: 'Unpaid'
  });
}

router.post('/vouchers', protect, authorize(...staffRoles), async (req, res) => {
  try {
    const { studentId, feeMonth, dueDate, items, previousBalance, discount, scholarship, concession, siblingDiscount, fine, advanceAmount } = req.body;
    if (!studentId || !feeMonth || !dueDate || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Student, fee month, due date and fee items are required' });
    }
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const existing = await FeeVoucher.findOne({ student: student._id, feeMonth });
    if (existing) return res.status(409).json({ message: 'A voucher already exists for this student and fee month', data: existing });
    const voucher = await createVoucherForStudent(student, { feeMonth, dueDate, items, previousBalance, discount, scholarship, concession, siblingDiscount, fine, advanceAmount });
    await voucher.populate('student', 'name fatherName admissionNo class section rollNo');
    res.status(201).json({ success: true, message: 'Fee voucher created successfully', data: voucher });
  } catch (error) { handleError(error, res); }
});

router.post('/vouchers/generate', protect, authorize(...staffRoles), async (req, res) => {
  try {
    const { studentId, className, feeMonth, dueDate, items = [], previousBalance = 0, discount = 0, scholarship = 0, concession = 0, siblingDiscount = 0, fine = 0, advanceAmount = 0 } = req.body;
    if (!feeMonth || !dueDate || !Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'Fee month, due date and fee items are required' });
    if (!studentId && !className && req.body.scope !== 'all') return res.status(400).json({ message: 'Provide a student, class, or scope=all' });
    const filter = studentId ? { _id: studentId } : className ? { class: className, status: 'Active' } : { status: 'Active' };
    const students = await Student.find(filter).sort({ class: 1, section: 1, rollNo: 1 });
    const created = [];
    const skipped = [];
    for (const student of students) {
      const existing = await FeeVoucher.findOne({ student: student._id, feeMonth });
      if (existing) skipped.push(existing._id);
      else created.push(await createVoucherForStudent(student, { feeMonth, dueDate, items, previousBalance, discount, scholarship, concession, siblingDiscount, fine, advanceAmount }));
    }
    res.status(201).json({ success: true, message: `${created.length} voucher(s) generated`, createdCount: created.length, skippedCount: skipped.length, data: created });
  } catch (error) { handleError(error, res); }
});

router.get('/vouchers/:id/pdf', protect, async (req, res) => {
  try {
    const voucher = await FeeVoucher.findById(req.params.id).populate('student', 'name fatherName admissionNo class section rollNo');
    if (!voucher) return res.status(404).json({ message: 'Fee voucher not found' });
    const document = new PDFDocument({ margin: 48 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${voucher.voucherNo}.pdf"`);
    document.pipe(res);
    document.circle(306, 58, 18).fill('#f3c969');
    document.fillColor('#173247').fontSize(16).text('S', 300, 49);
    document.fillColor('#172c3d').fontSize(18).text(schoolName, 48, 88, { align: 'center', width: 504 });
    document.fontSize(10).text('School Fee Voucher', { align: 'center' }).moveDown(1.5);
    document.fontSize(11).text(`Voucher No: ${voucher.voucherNo}`).text(`Fee Month: ${voucher.feeMonth}`).text(`Issue Date: ${new Date(voucher.issueDate).toLocaleDateString()}`).text(`Due Date: ${new Date(voucher.dueDate).toLocaleDateString()}`).moveDown();
    document.text(`Student: ${voucher.student.name}`).text(`Father: ${voucher.student.fatherName || '—'}`).text(`Admission No: ${voucher.student.admissionNo}`).text(`Class: ${voucher.student.class}  Section: ${voucher.student.section || '—'}  Roll No: ${voucher.student.rollNo || '—'}`).moveDown();
    document.fontSize(11).text('Fee Details', { underline: true }).moveDown(.5);
    voucher.items.forEach(item => document.text(`${item.type}: Rs ${item.amount.toLocaleString()}`));
    document.text(`Previous Balance: Rs ${voucher.previousBalance.toLocaleString()}`).text(`Discount: -Rs ${(voucher.discount + voucher.scholarship + voucher.concession + voucher.siblingDiscount).toLocaleString()}`).text(`Fine: Rs ${voucher.fine.toLocaleString()}`).moveDown();
    document.fontSize(13).text(`Total Payable: Rs ${voucher.totalPayable.toLocaleString()}`).text(`Paid: Rs ${voucher.paidAmount.toLocaleString()}`).text(`Status: ${voucher.status}`);
    document.end();
  } catch (error) { handleError(error, res); }
});

router.get('/vouchers', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.studentId) filter.student = req.query.studentId;
    if (req.query.q) {
      const students = await Student.find({ $or: [{ name: { $regex: req.query.q, $options: 'i' } }, { admissionNo: { $regex: req.query.q, $options: 'i' } }] }).select('_id');
      filter.$or = [{ voucherNo: { $regex: req.query.q, $options: 'i' } }, { student: { $in: students.map((student) => student._id) } }];
    }
    if (['parent', 'student'].includes(req.user.role)) filter.student = { $in: req.user.linkedStudents || [] };
    const vouchers = await FeeVoucher.find(filter).populate('student', 'name fatherName admissionNo class section').sort({ createdAt: -1 });
    res.json({ success: true, count: vouchers.length, data: vouchers });
  } catch (error) { handleError(error, res); }
});

router.get('/vouchers/:id', protect, async (req, res) => {
  try {
    const voucher = await FeeVoucher.findById(req.params.id).populate('student', 'name fatherName admissionNo class section rollNo');
    if (!voucher) return res.status(404).json({ message: 'Fee voucher not found' });
    res.json({ success: true, data: voucher });
  } catch (error) { handleError(error, res); }
});

async function ensureStudentPortalAccount(student) {
  if (!student?.admissionNo) return null;

  const email = student.email && String(student.email).trim()
    ? String(student.email).trim().toLowerCase()
    : `${String(student.admissionNo).toLowerCase()}@school.local`;
  let user = await User.findOne({ admissionNo: student.admissionNo }) || await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name: student.name,
      email,
      admissionNo: student.admissionNo,
      password: '123456',
      role: 'student',
      address: student.address,
      linkedStudents: [student._id]
    });
  } else {
    user.admissionNo = student.admissionNo;
    user.password = '123456';
    user.mustChangePassword = false;
    user.phone = undefined;
    if (!(user.linkedStudents || []).some((id) => String(id) === String(student._id))) {
      user.linkedStudents.push(student._id);
    }
    user.role = 'student';
    user.phone = user.phone || student.phone;
    user.address = user.address || student.address;
    await user.save();
  }

  return user;
}

async function ensureParentPortalAccount(student) {
  if (!student?.phone || !student?.admissionNo) return null;

  const phone = String(student.phone).trim();
  const email = `parent-${String(student.admissionNo).toLowerCase()}@school.local`;
  let user = await User.findOne({ phone, role: 'parent' });
  if (!user) user = await User.findOne({ email, role: 'parent' });

  if (!user) {
    user = await User.create({
      name: student.fatherName || `${student.name} Parent`,
      email,
      phone,
      password: '123456',
      role: 'parent',
      linkedStudents: [student._id],
      mustChangePassword: false,
    });
  } else {
    user.name = user.name || student.fatherName || `${student.name} Parent`;
    user.phone = phone;
    user.password = '123456';
    user.role = 'parent';
    user.mustChangePassword = false;
    if (!(user.linkedStudents || []).some((id) => String(id) === String(student._id))) {
      user.linkedStudents.push(student._id);
    }
    await user.save();
  }

  return user;
}

router.delete('/vouchers/:id', protect, authorize(...staffRoles), async (req, res) => {
  try {
    const voucher = await FeeVoucher.findByIdAndDelete(req.params.id);
    if (!voucher) return res.status(404).json({ message: 'Fee voucher not found' });
    res.json({ success: true, message: 'Fee voucher deleted successfully' });
  } catch (error) { handleError(error, res); }
});

router.post('/vouchers/:id/payments', protect, authorize(...staffRoles), async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ message: 'Payment amount must be greater than zero' });

    const voucher = await FeeVoucher.findById(req.params.id);
    if (!voucher) return res.status(404).json({ message: 'Fee voucher not found' });

    const remaining = Math.max(0, voucher.totalPayable - voucher.paidAmount);
    const paymentAmount = Math.min(amount, remaining);
    voucher.paidAmount += paymentAmount;
    voucher.advanceBalance += Math.max(0, amount - remaining);
    voucher.payments.push({ amount: paymentAmount, paidAt: req.body.paidAt || new Date(), receiptNo: `R-${Date.now()}` });
    await voucher.save();

    if (voucher.paidAmount >= voucher.totalPayable) {
      const student = await Student.findById(voucher.student);
      if (student) {
        if (student.status !== 'Active') {
          student.status = 'Active';
          await student.save();
        }
        await ensureStudentPortalAccount(student);
        await ensureParentPortalAccount(student);
      }
    }

    res.json({ success: true, message: 'Fee payment recorded successfully', receiptNo: voucher.payments.at(-1).receiptNo, data: voucher });
  } catch (error) { handleError(error, res); }
});

router.get('/summary', protect, async (req, res) => {
  try {
    const rows = await FeeVoucher.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$totalPayable' }, paid: { $sum: '$paidAmount' } } }]);
    res.json({ success: true, data: rows });
  } catch (error) { handleError(error, res); }
});

router.get('/vouchers/:id/receipt/:receiptNo/pdf', protect, async (req, res) => {
  try {
    const voucher = await FeeVoucher.findById(req.params.id).populate('student', 'name fatherName admissionNo class section');
    const payment = voucher?.payments.find((item) => item.receiptNo === req.params.receiptNo);
    if (!voucher || !payment) return res.status(404).json({ message: 'Payment receipt not found' });
    const document = new PDFDocument({ margin: 48 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${payment.receiptNo}.pdf"`);
    document.pipe(res);
    document.fontSize(18).text(schoolName, { align: 'center' }).fontSize(11).text('FEE PAYMENT RECEIPT', { align: 'center' }).moveDown(1.5);
    document.text(`Receipt No: ${payment.receiptNo}`).text(`Payment Date: ${new Date(payment.paidAt).toLocaleDateString()}`).text(`Voucher No: ${voucher.voucherNo}`).moveDown();
    document.text(`Student: ${voucher.student.name}`).text(`Father: ${voucher.student.fatherName || '—'}`).text(`Admission No: ${voucher.student.admissionNo}`).text(`Class: ${voucher.student.class}  Section: ${voucher.student.section || '—'}`).moveDown();
    document.fontSize(14).text(`Amount Received: Rs ${payment.amount.toLocaleString()}`).fontSize(11).text(`Voucher Status: ${voucher.status}`).text(`Remaining Balance: Rs ${Math.max(0, voucher.totalPayable - voucher.paidAmount).toLocaleString()}`);
    document.end();
  } catch (error) { handleError(error, res); }
});

module.exports = router;
