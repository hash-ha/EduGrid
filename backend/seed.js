const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');
const AcademicClass = require('./src/models/AcademicClass');
const AdmissionApplication = require('./src/models/AdmissionApplication');
const Attendance = require('./src/models/Attendance');
const ContactMessage = require('./src/models/ContactMessage');
const Exam = require('./src/models/Exam');
const FeeStructure = require('./src/models/FeeStructure');
const FeeVoucher = require('./src/models/FeeVoucher');
const Notice = require('./src/models/Notice');
const ParentRegistration = require('./src/models/ParentRegistration');
const Staff = require('./src/models/Staff');
const Student = require('./src/models/Student');
const StudentMovement = require('./src/models/StudentMovement');

const accounts = [
  { name: 'Super Admin', email: 'superadmin@school.com', role: 'super_admin', password: '123456' },
  { name: 'School Admin', email: 'admin@school.com', role: 'school_admin', password: '123456' },
  { name: 'Ayesha Malik', email: 'accountant@school.com', role: 'accountant', password: '123456', phone: '0300-1112233' }
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  for (const model of [AcademicClass, AdmissionApplication, Attendance, ContactMessage, Exam, FeeStructure, FeeVoucher, Notice, ParentRegistration, Staff, Student, StudentMovement]) await model.deleteMany({});
  await User.deleteMany({ role: { $nin: ['super_admin', 'school_admin'] } });
  const users = {};
  for (const account of accounts) {
    let user = await User.findOne({ email: account.email });

    if (!user) user = new User(account);
    else {
      user.name = account.name;
      user.role = account.role;
      user.password = account.password;
    }

    users[account.role] = await user.save();
  }

  users.accountant = await User.findOne({ email: 'accountant@school.com' }) || await User.create({ name: 'Ayesha Malik', email: 'accountant@school.com', password: '123456', role: 'accountant', phone: '0300-1112233' });
  const teacherSeed = [
    { name: 'Hassan Raza', email: 'hassan.teacher@school.com', employeeId: 'TCH-001', phone: '0301-2223344', subject: 'Mathematics', qualification: 'M.Ed', assignedClasses: ['Class 5', 'Class 6'] },
    { name: 'Sana Ahmed', email: 'sana.teacher@school.com', employeeId: 'TCH-002', phone: '0302-3334455', subject: 'English', qualification: 'B.Ed', assignedClasses: ['Class 3', 'Class 4'] },
    { name: 'Bilal Javed', email: 'bilal.teacher@school.com', employeeId: 'TCH-003', phone: '0303-4445566', subject: 'Science', qualification: 'M.Sc', assignedClasses: ['Class 1', 'Class 7'] },
    { name: 'Maria Sadiq', email: 'maria.teacher@school.com', employeeId: 'TCH-004', phone: '0304-5556677', subject: 'Urdu', qualification: 'M.A', assignedClasses: ['Class 5', 'Class 7'] },
    { name: 'Usman Farooq', email: 'usman.teacher@school.com', employeeId: 'TCH-005', phone: '0305-6667788', subject: 'Computer Science', qualification: 'BCS', assignedClasses: ['Class 3', 'Class 6'] },
    { name: 'Zoya Khan', email: 'zoya.teacher@school.com', employeeId: 'TCH-006', phone: '0306-7778899', subject: 'Social Studies', qualification: 'M.A', assignedClasses: ['Class 1', 'Class 4'] }
  ];

  for (const teacher of teacherSeed) {
    const createdTeacher = await User.create({
      name: teacher.name,
      email: teacher.email,
      employeeId: teacher.employeeId,
      password: '123456',
      role: 'teacher',
      phone: teacher.phone,
      mustChangePassword: true
    });
    users[teacher.employeeId.toLowerCase()] = createdTeacher;
  }

  const firstTeacher = users['tch-001'] || Object.values(users).find((user) => user && user.role === 'teacher' && user.employeeId === 'TCH-001');
  const schoolAdminUser = users.school_admin || Object.values(users).find((user) => user && user.role === 'school_admin');

  const staff = await Staff.insertMany([
    { employeeId: 'TCH-001', name: 'Hassan Raza', category: 'Teacher', qualification: 'M.Ed', subject: 'Mathematics', phone: '0301-2223344', email: 'hassan.teacher@school.com', joiningDate: new Date('2024-08-01'), salary: 85000, assignedClasses: ['Class 5', 'Class 6'] },
    { employeeId: 'TCH-002', name: 'Sana Ahmed', category: 'Teacher', qualification: 'B.Ed', subject: 'English', phone: '0302-3334455', email: 'sana.teacher@school.com', joiningDate: new Date('2025-01-10'), salary: 78000, assignedClasses: ['Class 3', 'Class 4'] },
    { employeeId: 'TCH-003', name: 'Bilal Javed', category: 'Teacher', qualification: 'M.Sc', subject: 'Science', phone: '0303-4445566', email: 'bilal.teacher@school.com', joiningDate: new Date('2024-11-15'), salary: 82000, assignedClasses: ['Class 1', 'Class 7'] },
    { employeeId: 'TCH-004', name: 'Maria Sadiq', category: 'Teacher', qualification: 'M.A', subject: 'Urdu', phone: '0304-5556677', email: 'maria.teacher@school.com', joiningDate: new Date('2025-02-20'), salary: 77000, assignedClasses: ['Class 5', 'Class 7'] },
    { employeeId: 'TCH-005', name: 'Usman Farooq', category: 'Teacher', qualification: 'BCS', subject: 'Computer Science', phone: '0305-6667788', email: 'usman.teacher@school.com', joiningDate: new Date('2024-09-10'), salary: 86000, assignedClasses: ['Class 3', 'Class 6'] },
    { employeeId: 'TCH-006', name: 'Zoya Khan', category: 'Teacher', qualification: 'M.A', subject: 'Social Studies', phone: '0306-7778899', email: 'zoya.teacher@school.com', joiningDate: new Date('2025-03-05'), salary: 79000, assignedClasses: ['Class 1', 'Class 4'] },
    { employeeId: 'ACC-001', name: 'Ayesha Malik', category: 'Accountant', qualification: 'M.Com', subject: 'Accounts', phone: '0300-1112233', email: 'accountant@school.com', joiningDate: new Date('2023-07-01'), salary: 90000 }
  ]);

  const studentData = [
    ['2026-001', 'Ali Hassan', 'Muhammad Hassan', 'Class 5', 'A', '0305-1000001', 'ali.hassan@student.com'],
    ['2026-002', 'Fatima Noor', 'Farhan Noor', 'Class 5', 'A', '0305-1000002', 'fatima.noor@student.com'],
    ['2026-003', 'Hamza Khan', 'Imran Khan', 'Class 3', 'B', '0305-1000003', 'hamza.khan@student.com'],
    ['2026-004', 'Ayesha Ali', 'Nadeem Ali', 'Class 3', 'B', '0305-1000004', 'ayesha.ali@student.com'],
    ['2026-005', 'Usman Tariq', 'Tariq Mehmood', 'Class 1', 'A', '0305-1000005', 'usman.tariq@student.com'],
    ['2026-006', 'Maham Zain', 'Zain Ahmed', 'Class 1', 'A', '0305-1000006', 'maham.zain@student.com'],
    ['2026-007', 'Bilal Shah', 'Kashif Shah', 'Class 7', 'A', '0305-1000007', 'bilal.shah@student.com'],
    ['2026-008', 'Hiba Iqbal', 'Iqbal Hussain', 'Class 7', 'A', '0305-1000008', 'hiba.iqbal@student.com']
  ];
  const students = await Student.insertMany(studentData.map(([admissionNo, name, fatherName, className, section, phone, email], index) => ({ admissionNo, name, fatherName, motherName: 'Parent Guardian', dateOfBirth: new Date(2014 - index, 3, 12), gender: index % 2 ? 'Female' : 'Male', email, phone, address: 'Greenfield Academy Housing Colony', class: className, section, rollNo: index + 1, admissionDate: new Date('2026-04-01'), status: 'Active' })));
  for (const student of students) {
    await User.findOneAndUpdate(
      { $or: [{ email: student.email }, { admissionNo: student.admissionNo }] },
      { $set: { name: student.name, email: student.email, admissionNo: student.admissionNo, password: '123456', role: 'student', phone: student.phone, linkedStudents: [student._id], mustChangePassword: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  users.parent = await User.findOneAndUpdate(
    { phone: '0300-1234567', role: 'parent' },
    { $set: { name: 'Muhammad Hassan', phone: '0300-1234567', password: '123456', role: 'parent', linkedStudents: [students[0]._id, students[1]._id], mustChangePassword: true }, $setOnInsert: { email: 'parent-demo@school.local' } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const classNames = ['Class 1', 'Class 3', 'Class 5', 'Class 7'];
  const classAssignments = [
    { name: 'Class 1', classTeacherStaff: staff[5]._id, subjectTeachers: [{ subject: 'Mathematics', teacher: staff[0]._id }, { subject: 'English', teacher: staff[1]._id }, { subject: 'Science', teacher: staff[2]._id }, { subject: 'Computer', teacher: staff[4]._id }] },
    { name: 'Class 3', classTeacherStaff: staff[1]._id, subjectTeachers: [{ subject: 'Mathematics', teacher: staff[0]._id }, { subject: 'English', teacher: staff[1]._id }, { subject: 'Science', teacher: staff[2]._id }, { subject: 'Computer', teacher: staff[4]._id }] },
    { name: 'Class 5', classTeacherStaff: staff[0]._id, subjectTeachers: [{ subject: 'Mathematics', teacher: staff[0]._id }, { subject: 'English', teacher: staff[1]._id }, { subject: 'Science', teacher: staff[2]._id }, { subject: 'Computer', teacher: staff[4]._id }] },
    { name: 'Class 7', classTeacherStaff: staff[3]._id, subjectTeachers: [{ subject: 'Mathematics', teacher: staff[0]._id }, { subject: 'English', teacher: staff[1]._id }, { subject: 'Science', teacher: staff[2]._id }, { subject: 'Computer', teacher: staff[4]._id }] }
  ];

  for (const assignment of classAssignments) {
    await AcademicClass.create({
      name: assignment.name,
      session: '2026-2027',
      subjects: ['English', 'Mathematics', 'Science', 'Computer'],
      sections: [{
        name: 'A',
        capacity: 35,
        classTeacherStaff: assignment.classTeacherStaff,
        subjectTeachers: assignment.subjectTeachers
      }]
    });
  }

  const policyItems = [{ type: 'Monthly Tuition Fee', amount: 5000, frequency: 'monthly' }, { type: 'Computer Fee', amount: 500, frequency: 'monthly' }, { type: 'Annual Fee', amount: 3000, frequency: 'annual' }, { type: 'Examination Fee', amount: 1000, frequency: 'examination' }];
  for (const name of classNames) await FeeStructure.create({ className: name, session: '2026-2027', items: policyItems });
  for (const student of students) await FeeVoucher.create({ student: student._id, feeMonth: 'September 2026', dueDate: new Date('2026-09-15'), items: policyItems.slice(0, 2), paidAmount: student === students[0] ? 5500 : 0, payments: student === students[0] ? [{ amount: 5500, paidAt: new Date(), receiptNo: 'R-DEMO-001' }] : [] });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  await Attendance.insertMany(students.map((student, index) => ({ student: student._id, date: today, status: index % 5 === 0 ? 'Absent' : index % 4 === 0 ? 'Late' : 'Present', markedBy: firstTeacher._id })));
  const gradingScale = [{ minPercentage: 90, grade: 'A+' }, { minPercentage: 80, grade: 'A' }, { minPercentage: 70, grade: 'B' }, { minPercentage: 60, grade: 'C' }, { minPercentage: 0, grade: 'Fail' }];
  await Exam.create({ name: 'Mid-Term Examination', className: 'Class 5', section: 'A', session: '2026-2027', examDate: new Date('2026-12-15'), passingMarks: 40, published: true, gradingScale, marks: students.slice(0, 2).flatMap((student, index) => [{ student: student._id, subject: 'English', totalMarks: 100, obtainedMarks: 82 + index * 5, remarks: 'Good progress' }, { student: student._id, subject: 'Mathematics', totalMarks: 100, obtainedMarks: 88 - index * 3, remarks: 'Strong concepts' }]) });
  await Exam.create({ name: 'Monthly Test', className: 'Class 3', section: 'B', session: '2026-2027', examDate: new Date('2026-09-20'), passingMarks: 40, published: false, gradingScale, marks: students.slice(2, 4).flatMap((student) => [{ student: student._id, subject: 'English', totalMarks: 100, obtainedMarks: 78 }, { student: student._id, subject: 'Mathematics', totalMarks: 100, obtainedMarks: 84 }]) });
  for (const [title, body, category] of [['Welcome Back', 'The new academic session has started. Please review the school calendar.', 'Notice'], ['Mathematics Homework', 'Complete exercises 4 to 8 from the fractions chapter.', 'Homework'], ['Annual Sports Day', 'Annual Sports Day will be held on 15 October 2026.', 'Event']]) await Notice.create({ title, body, category, audience: ['all'], published: true, createdBy: schoolAdminUser?._id || users.school_admin?._id || null });
  await AdmissionApplication.create({ studentName: 'Demo Applicant', fatherName: 'Demo Guardian', dateOfBirth: new Date('2015-05-15'), gender: 'Female', classApplying: 'Class 5', phone: '0305-9999999', email: 'demo.applicant@example.com', address: 'Demo Address', status: 'Received' });
  await ContactMessage.create({ name: 'Demo Parent', email: 'demoparent@example.com', phone: '0305-8888888', subject: 'School inquiry', message: 'Please share the upcoming school calendar.' });
  console.log(`Demo data seeded: ${students.length} students, ${staff.length} staff, ${classNames.length} classes`);
  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
