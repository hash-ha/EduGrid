const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const ParentRegistration = require('../models/ParentRegistration');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  employeeId: user.employeeId,
  admissionNo: user.admissionNo,
  role: user.role,
  phone: user.phone,
  address: user.address,
  mustChangePassword: user.mustChangePassword,
  isApproved: user.isApproved,
  lastLoginAt: user.lastLoginAt,
  loginCount: user.loginCount
});

const createToken = (user) => jwt.sign(
  { userId: user._id, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// Register
router.post('/register', protect, authorize('super_admin', 'school_admin'), async (req, res) => {
  try {
    const { name, email, role = 'teacher', phone, address, employeeId, admissionNo } = req.body;
    const password = String(req.body.password ?? '123456');

    if (!name || (!email && !employeeId && !admissionNo && !phone)) {
      return res.status(400).json({ message: 'Name and a login identifier are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const normalizedEmail = email?.trim().toLowerCase();
    const existingUser = await User.findOne({ $or: [
      ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
      ...(employeeId ? [{ employeeId: String(employeeId).trim().toUpperCase() }] : []),
      ...(admissionNo ? [{ admissionNo: String(admissionNo).trim() }] : []),
      ...(phone ? [{ phone: String(phone).trim() }] : [])
    ] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = new User({ name: name.trim(), email: normalizedEmail, employeeId, admissionNo, password, role, phone, address, mustChangePassword: password === '123456' });
    await user.save();

    const token = createToken(user);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      token,
      user: publicUser(user)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, identifier, password, role } = req.body;
    const loginIdentifier = String(identifier || email || '').trim();

    if (!loginIdentifier || !password) {
      return res.status(400).json({ message: 'Login identifier and password are required' });
    }

    const normalized = loginIdentifier.toLowerCase();
    const roleFilter = ['super_admin', 'school_admin', 'accountant', 'teacher', 'student', 'parent'].includes(role)
      ? { role }
      : {};
    const user = await User.findOne({ ...roleFilter, $or: [
      { email: normalized },
      { employeeId: loginIdentifier.toUpperCase() },
      { admissionNo: loginIdentifier },
      { phone: loginIdentifier }
    ] });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (user.isApproved === false) return res.status(403).json({ message: 'This account is awaiting admin approval' });

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const loginTime = new Date();
    user.lastLoginAt = loginTime;
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    const token = createToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: publicUser(user)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/parent-register', async (req, res) => {
  const { name, phone, password = '123456', admissionNo } = req.body;
  if (!name || !phone || !admissionNo || String(password).length < 6) return res.status(400).json({ message: 'Name, phone, admission number and a valid password are required' });
  const student = await Student.findOne({ admissionNo: String(admissionNo).trim(), status: 'Active' });
  if (!student) return res.status(404).json({ message: 'Active student admission number was not found' });
  if (await User.findOne({ phone: String(phone).trim(), role: 'parent' })) return res.status(409).json({ message: 'A parent account already uses this phone number' });
  const registration = await ParentRegistration.create({ name, phone, passwordHash: password, admissionNo, student: student._id });
  res.status(201).json({ success: true, message: 'Parent registration submitted for admin approval', data: { id: registration._id, status: registration.status } });
});

router.get('/parent-registrations', protect, authorize('super_admin', 'school_admin'), async (req, res) => {
  const data = await ParentRegistration.find().populate('student', 'name admissionNo class section').sort({ createdAt: -1 });
  res.json({ success: true, data });
});

router.patch('/parent-registrations/:id', protect, authorize('super_admin', 'school_admin'), async (req, res) => {
  const registration = await ParentRegistration.findById(req.params.id).populate('student');
  if (!registration) return res.status(404).json({ message: 'Parent registration not found' });
  const status = req.body.status;
  if (!['Approved', 'Rejected'].includes(status)) return res.status(400).json({ message: 'Invalid approval status' });
  registration.status = status;
  if (status === 'Approved') {
    const existingUser = await User.findOne({ phone: String(registration.phone).trim(), role: 'parent' });
    const user = existingUser || new User({
      name: registration.name,
      phone: String(registration.phone).trim(),
      password: registration.passwordHash,
      role: 'parent',
      linkedStudents: [],
      mustChangePassword: false,
    });
    user.name = registration.name;
    user.password = registration.passwordHash;
    user.role = 'parent';
    user.mustChangePassword = false;
    if (!(user.linkedStudents || []).some((id) => String(id) === String(registration.student._id))) {
      user.linkedStudents.push(registration.student._id);
    }
    await user.save();
    registration.user = user._id;
  }
  await registration.save();
  res.json({ success: true, message: `Parent registration ${status.toLowerCase()}`, data: registration });
});

router.patch('/password', protect, async (req, res) => {
  const currentPassword = String(req.body.currentPassword ?? '');
  const newPassword = String(req.body.newPassword ?? '');
  if (!currentPassword || !newPassword || newPassword.length < 6) return res.status(400).json({ message: 'Current password and a new password of at least 6 characters are required' });
  const user = await User.findById(req.user._id);
  if (!user || !(await user.comparePassword(currentPassword))) return res.status(401).json({ message: 'Current password is incorrect' });
  user.password = newPassword;
  user.mustChangePassword = false;
  await user.save();
  res.json({ success: true, message: 'Password changed successfully' });
});

router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: publicUser(req.user) });
});

module.exports = router;