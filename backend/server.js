const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Import Routes
const authRoutes = require('./src/routes/authRoutes');
const feeRoutes = require('./src/routes/feeRoutes');
const attendanceRoutes = require('./src/routes/attendanceRoutes');
const academicRoutes = require('./src/routes/academicRoutes');
const staffRoutes = require('./src/routes/staffRoutes');
const examRoutes = require('./src/routes/examRoutes');
const portalRoutes = require('./src/routes/portalRoutes');
const studentRoutes = require('./src/routes/studentRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const admissionRoutes = require('./src/routes/admissionRoutes');
const noticeRoutes = require('./src/routes/noticeRoutes');
const feeStructureRoutes = require('./src/routes/feeStructureRoutes');
const movementRoutes = require('./src/routes/movementRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const publicRoutes = require('./src/routes/publicRoutes');
const contactRoutes = require('./src/routes/contactRoutes');
const systemRoutes = require('./src/routes/systemRoutes');
const User = require('./src/models/User');
const Student = require('./src/models/Student');
const FeeVoucher = require('./src/models/FeeVoucher');

async function ensureSeedAccounts() {
  const accounts = [
    { name: 'Super Admin', email: 'superadmin@school.com', role: 'super_admin', password: '123456' },
    { name: 'School Admin', email: 'admin@school.com', role: 'school_admin', password: '123456' },
    { name: 'Ayesha Malik', email: 'accountant@school.com', role: 'accountant', password: '123456', phone: '0300-1112233' }
  ];

  for (const account of accounts) {
    const user = await User.findOneAndUpdate(
      { email: account.email },
      {
        $set: {
          name: account.name,
          role: account.role,
          password: account.password,
          phone: account.phone || undefined,
          isApproved: true,
          mustChangePassword: false
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    if (!user.email && account.email) user.email = account.email;
    await user.save();
  }

  const teacherSeed = [
    { name: 'Hassan Raza', email: 'hassan.teacher@school.com', employeeId: 'TCH-001', password: '123456', role: 'teacher', phone: '0301-2223344' },
    { name: 'Sana Ahmed', email: 'sana.teacher@school.com', employeeId: 'TCH-002', password: '123456', role: 'teacher', phone: '0302-3334455' },
    { name: 'Bilal Javed', email: 'bilal.teacher@school.com', employeeId: 'TCH-003', password: '123456', role: 'teacher', phone: '0303-4445566' },
    { name: 'Maria Sadiq', email: 'maria.teacher@school.com', employeeId: 'TCH-004', password: '123456', role: 'teacher', phone: '0304-5556677' },
    { name: 'Usman Farooq', email: 'usman.teacher@school.com', employeeId: 'TCH-005', password: '123456', role: 'teacher', phone: '0305-6667788' },
    { name: 'Zoya Khan', email: 'zoya.teacher@school.com', employeeId: 'TCH-006', password: '123456', role: 'teacher', phone: '0306-7778899' }
  ];

  for (const teacher of teacherSeed) {
    await User.findOneAndUpdate(
      { $or: [{ email: teacher.email }, { employeeId: teacher.employeeId }] },
      {
        $set: {
          name: teacher.name,
          email: teacher.email,
          employeeId: teacher.employeeId,
          password: teacher.password,
          role: teacher.role,
          phone: teacher.phone,
          isApproved: true,
          mustChangePassword: true
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const studentSeed = [
    { name: 'Ali Hassan', email: 'ali.hassan@student.com', admissionNo: '2026-001', password: '123456', role: 'student', phone: '0305-1000001' },
    { name: 'Fatima Noor', email: 'fatima.noor@student.com', admissionNo: '2026-002', password: '123456', role: 'student', phone: '0305-1000002' },
    { name: 'Hamza Khan', email: 'hamza.khan@student.com', admissionNo: '2026-003', password: '123456', role: 'student', phone: '0305-1000003' },
    { name: 'Ayesha Ali', email: 'ayesha.ali@student.com', admissionNo: '2026-004', password: '123456', role: 'student', phone: '0305-1000004' },
    { name: 'Usman Tariq', email: 'usman.tariq@student.com', admissionNo: '2026-005', password: '123456', role: 'student', phone: '0305-1000005' },
    { name: 'Maham Zain', email: 'maham.zain@student.com', admissionNo: '2026-006', password: '123456', role: 'student', phone: '0305-1000006' },
    { name: 'Bilal Shah', email: 'bilal.shah@student.com', admissionNo: '2026-007', password: '123456', role: 'student', phone: '0305-1000007' },
    { name: 'Hiba Iqbal', email: 'hiba.iqbal@student.com', admissionNo: '2026-008', password: '123456', role: 'student', phone: '0305-1000008' }
  ];

  const linkedStudentIds = [];
  for (const student of studentSeed) {
    const createdStudent = await User.findOneAndUpdate(
      { $or: [{ email: student.email }, { admissionNo: student.admissionNo }] },
      {
        $set: {
          name: student.name,
          email: student.email,
          admissionNo: student.admissionNo,
          password: student.password,
          role: student.role,
          phone: student.phone,
          isApproved: true,
          mustChangePassword: true
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const dbStudent = await Student.findOne({ admissionNo: student.admissionNo });
    if (dbStudent && !(createdStudent.linkedStudents || []).some((id) => String(id) === String(dbStudent._id))) {
      createdStudent.linkedStudents = [...(createdStudent.linkedStudents || []), dbStudent._id];
      await createdStudent.save();
    }

    linkedStudentIds.push(dbStudent?._id).filter(Boolean);
  }

  const parentStudentIds = (await Student.find({ admissionNo: { $in: ['2026-001', '2026-002'] } }).select('_id')).map((s) => s._id);
  await User.findOneAndUpdate(
    { phone: '0300-1234567', role: 'parent' },
    {
      $set: {
        name: 'Muhammad Hassan',
        phone: '0300-1234567',
        password: '123456',
        role: 'parent',
        linkedStudents: parentStudentIds,
        isApproved: true,
        mustChangePassword: true
      },
      $setOnInsert: {
        email: 'parent-demo@school.local'
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function ensurePaidPortalAccounts() {
  const paidVouchers = await FeeVoucher.find({ status: 'Paid', paidAmount: { $gte: 0 } }).populate('student');
  for (const voucher of paidVouchers) {
    const student = voucher.student;
    if (!student?.admissionNo) continue;

    let studentUser = await User.findOne({ admissionNo: student.admissionNo });
    if (!studentUser) {
      studentUser = new User({
        name: student.name,
        email: `${String(student.admissionNo).toLowerCase()}@school.local`,
        admissionNo: student.admissionNo,
        password: '123456',
        role: 'student',
        linkedStudents: [student._id],
        mustChangePassword: false,
      });
    } else {
      studentUser.name = student.name;
      studentUser.password = '123456';
      studentUser.role = 'student';
      studentUser.mustChangePassword = false;
      if (!(studentUser.linkedStudents || []).some((id) => String(id) === String(student._id))) studentUser.linkedStudents.push(student._id);
    }
    await studentUser.save();

    if (student.phone) {
      let parentUser = await User.findOne({ phone: String(student.phone).trim(), role: 'parent' });
      if (!parentUser) {
        parentUser = new User({
          name: student.fatherName || `${student.name} Parent`,
          email: `parent-${String(student.admissionNo).toLowerCase()}@school.local`,
          phone: String(student.phone).trim(),
          password: '123456',
          role: 'parent',
          linkedStudents: [student._id],
          mustChangePassword: false,
        });
      } else {
        parentUser.password = '123456';
        parentUser.role = 'parent';
        parentUser.mustChangePassword = false;
        if (!(parentUser.linkedStudents || []).some((id) => String(id) === String(student._id))) parentUser.linkedStudents.push(student._id);
      }
      await parentUser.save();
    }
  }
  console.log(`✅ Paid portal accounts verified for ${paidVouchers.length} voucher(s)`);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => { console.log('✅ MongoDB Connected Successfully!'); await ensureSeedAccounts(); await ensurePaidPortalAccounts(); console.log('✅ Seed accounts verified'); })
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admissions', admissionRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/fee-structures', feeStructureRoutes);
app.use('/api/students', movementRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/contact-messages', contactRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/system', systemRoutes);

// API index route for the base /api path
app.get('/api', (req, res) => {
  res.json({
    message: '🏫 School Management System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      admissions: '/api/admissions',
      students: '/api/students',
      fees: '/api/fees',
      contactMessages: '/api/contact-messages',
      public: '/api/public',
      test: '/api/test'
    }
  });
});

// Root Route
app.get('/', (req, res) => {
  res.json({ 
    message: '🏫 School Management System API',
    version: '1.0.0'
  });
});

// Test Route
app.get('/api/test', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  res.json({ 
    message: '✅ Backend is running!',
    dbStatus: dbStatus
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});