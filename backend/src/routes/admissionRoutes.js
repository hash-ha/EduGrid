const express = require('express');
const AdmissionApplication = require('../models/AdmissionApplication');
const Student = require('../models/Student');
const User = require('../models/User');
const FeeVoucher = require('../models/FeeVoucher');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
const adminRoles = ['super_admin', 'school_admin'];
const staffRoles = ['super_admin', 'school_admin', 'accountant'];

function normalizeClassName(rawClass) {
  if (!rawClass) return 'Class 1';

  const text = String(rawClass).trim().toLowerCase();
  if (/play|playgroup|play group/.test(text)) return 'Play Group';
  if (/nursery|prep|kg|kindergarten/.test(text)) return 'Nursery';
  if (/prep|kg|kindergarten/.test(text)) return 'Prep/KG';

  const match = text.match(/class\s*([1-9]|10)|class\s*([0-9]+)/i) || text.match(/\b([1-9]|10)\b/);
  if (match) {
    const classNumber = Number(match[1] || match[0]);
    if (classNumber >= 1 && classNumber <= 10) return `Class ${classNumber}`;
  }

  if (/class 1/.test(text)) return 'Class 1';
  if (/class 2/.test(text)) return 'Class 2';
  if (/class 3/.test(text)) return 'Class 3';
  if (/class 4/.test(text)) return 'Class 4';
  if (/class 5/.test(text)) return 'Class 5';
  if (/class 6/.test(text)) return 'Class 6';
  if (/class 7/.test(text)) return 'Class 7';
  if (/class 8/.test(text)) return 'Class 8';
  if (/class 9/.test(text)) return 'Class 9';
  if (/class 10/.test(text)) return 'Class 10';

  return 'Class 1';
}

async function createStudentFromApplication(application) {
  const email = application.email ? String(application.email).trim().toLowerCase() : '';
  const phone = String(application.phone || '').trim();
  const bForm = String(application.bForm || '').trim();

  const existing = await Student.findOne({
    $or: [
      ...(email ? [{ email }] : []),
      ...(phone ? [{ phone }] : []),
      ...(bForm ? [{ bForm }] : [])
    ]
  });

  if (existing) return { student: existing, created: false };

  const applicationsCount = await Student.countDocuments();
  const admissionNo = `ADM-${new Date().getFullYear()}-${String(applicationsCount + 1).padStart(5, '0')}`;
  const studentClass = normalizeClassName(application.classApplying);

  const student = await Student.create({
    admissionNo,
    name: application.studentName,
    fatherName: application.fatherName,
    motherName: '',
    dateOfBirth: new Date(application.dateOfBirth),
    gender: application.gender,
    email: email || undefined,
    phone,
    address: application.address,
    cnic: '',
    bForm,
    class: studentClass,
    section: 'A',
    rollNo: null,
    previousSchool: application.previousSchool || '',
    admissionDate: new Date(),
    status: 'Applicant',
    photo: application.photo || ''
  });

  return { student, created: true };
}

async function createPortalUserFromApplication(application, student) {
  const email = application.email && application.email.trim()
    ? String(application.email).trim().toLowerCase()
    : `${String(student.admissionNo).toLowerCase()}@school.local`;
  let user = await User.findOne({ admissionNo: student.admissionNo }) || await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name: application.studentName,
      email,
      admissionNo: student.admissionNo,
      password: '123456',
      role: 'student',
      phone: application.phone,
      address: application.address,
      linkedStudents: [student._id]
    });
  } else {
    user.admissionNo = student.admissionNo;
    user.password = '123456';
    user.mustChangePassword = false;
    if (!(user.linkedStudents || []).some((id) => String(id) === String(student._id))) {
      user.linkedStudents.push(student._id);
    }
    user.role = 'student';
    user.phone = user.phone || application.phone;
    user.address = user.address || application.address;
    await user.save();
  }

  return user;
}

async function createFeeVoucherForStudent(student) {
  const feeMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 15);

  const existing = await FeeVoucher.findOne({ student: student._id, feeMonth });
  if (existing) return existing;

  const voucher = await FeeVoucher.create({
    student: student._id,
    feeMonth,
    dueDate,
    items: [
      { type: 'Tuition Fee', amount: 5000 },
      { type: 'Admission Fee', amount: 2500 }
    ],
    previousBalance: 0,
    discount: 0,
    scholarship: 0,
    concession: 0,
    siblingDiscount: 0,
    fine: 0,
    advanceAmount: 0,
    advanceBalance: 0,
    totalPayable: 7500,
    paidAmount: 0,
    status: 'Unpaid'
  });

  return voucher;
}

async function prepareVoucherFromApplication(application, voucherInput = {}) {
  if (!application) return { student: null, voucher: null, message: 'Application not found' };

  const { student, created } = await createStudentFromApplication(application);
  if (!application.student || String(application.student) !== String(student._id)) {
    application.student = student._id;
    await application.save();
  }
  if (!created && student.status === 'Active') {
    return { student, voucher: null, message: 'Student already registered and fee voucher cannot be re-prepared.' };
  }

  const feeMonth = String(voucherInput.feeMonth || new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })).trim();
  const dueDate = voucherInput.dueDate ? new Date(voucherInput.dueDate) : new Date();
  if (!voucherInput.dueDate) dueDate.setDate(dueDate.getDate() + 15);
  const items = Array.isArray(voucherInput.items)
    ? voucherInput.items
      .map((item) => ({ type: String(item.type || '').trim(), amount: Number(item.amount) }))
      .filter((item) => item.type && Number.isFinite(item.amount) && item.amount > 0)
    : [];

  if (!feeMonth || Number.isNaN(dueDate.getTime()) || items.length === 0) {
    return { student, voucher: null, message: 'Fee month, due date and at least one fee amount are required.' };
  }

  const existingVoucher = await FeeVoucher.findOne({ student: student._id, feeMonth });
  if (existingVoucher) {
    return { student, voucher: existingVoucher, message: 'An accountant voucher already exists for this applicant and month.' };
  }

  const previousBalance = Number(voucherInput.previousBalance || 0);
  const discount = Number(voucherInput.discount || 0);
  const scholarship = Number(voucherInput.scholarship || 0);
  const concession = Number(voucherInput.concession || 0);
  const siblingDiscount = Number(voucherInput.siblingDiscount || 0);
  const fine = Number(voucherInput.fine || 0);
  const advanceAmount = Number(voucherInput.advanceAmount || 0);
  const totalPayable = Math.max(0, items.reduce((sum, item) => sum + Number(item.amount || 0), 0) + previousBalance + fine - (discount + scholarship + concession + siblingDiscount) - advanceAmount);

  const voucher = await FeeVoucher.create({
    student: student._id,
    feeMonth,
    dueDate,
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

  await voucher.populate('student', 'name fatherName admissionNo class section');

  return { student, voucher, message: 'Accountant voucher prepared. Student registration remains pending until fee payment is completed.' };
}

router.post('/', async (req, res) => {
  try {
    const application = await AdmissionApplication.create(req.body);
    res.status(201).json({ success: true, message: 'Admission application submitted successfully', data: application });
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
    res.status(500).json({ message: error.message });
  }
});

router.get('/', protect, authorize(...staffRoles), async (req, res) => {
  try {
    const query = req.user.role === 'accountant'
      ? { status: 'Received' }
      : { status: { $in: ['Pending', 'Reviewed', 'Received'] } };
    let data = await AdmissionApplication.find(query).populate('student', 'status admissionNo').sort({ createdAt: -1 });
    data = data.filter((application) => !application.student || application.student.status !== 'Active');
    res.json({ success: true, count: data.length, data });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.patch('/:id/status', protect, authorize(...adminRoles), async (req, res) => {
  try {
    const validStatus = ['Pending', 'Reviewed', 'Received', 'Accepted', 'Rejected'];
    const { status } = req.body;
    if (!validStatus.includes(status)) {
      return res.status(400).json({ message: 'Invalid application status' });
    }

    const application = await AdmissionApplication.findById(req.params.id);
    if (!application) return res.status(404).json({ message: 'Application not found' });

    const data = await AdmissionApplication.findByIdAndUpdate(req.params.id, { status }, { returnDocument: 'after', runValidators: true });
    if (!data) return res.status(404).json({ message: 'Application not found' });

    res.json({ success: true, message: 'Application status updated', data });
  } catch (error) { res.status(400).json({ message: error.message }); }
});

router.post('/:id/prepare-voucher', protect, authorize('accountant'), async (req, res) => {
  try {
    const application = await AdmissionApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (![ 'Received', 'Accepted' ].includes(application.status)) {
      return res.status(400).json({ message: 'Only received or accepted applications can be prepared for a fee voucher.' });
    }

    const prepared = await prepareVoucherFromApplication(application, req.body);
    if (!prepared.student || !prepared.voucher) {
      return res.status(409).json({ message: prepared.message || 'Cannot prepare voucher from this application.' });
    }

    return res.status(201).json({
      success: true,
      message: prepared.message,
      data: { student: prepared.student, voucher: prepared.voucher }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/:id/generate-voucher', protect, authorize('accountant'), async (req, res) => {
  try {
    const application = await AdmissionApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (![ 'Received', 'Accepted' ].includes(application.status)) {
      return res.status(400).json({ message: 'Only received or accepted applications can generate a fee voucher.' });
    }

    const prepared = await prepareVoucherFromApplication(application, req.body);
    if (!prepared.student || !prepared.voucher) {
      return res.status(409).json({ message: prepared.message || 'Cannot generate voucher from this application.' });
    }

    return res.status(201).json({
      success: true,
      message: prepared.message,
      data: { student: prepared.student, voucher: prepared.voucher }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
