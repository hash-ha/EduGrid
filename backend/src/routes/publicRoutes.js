const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');
const Staff = require('../models/Staff');
const Student = require('../models/Student');
const AcademicClass = require('../models/AcademicClass');
const AdmissionApplication = require('../models/AdmissionApplication');
const FeeStructure = require('../models/FeeStructure');
const Exam = require('../models/Exam');
const ContactMessage = require('../models/ContactMessage');

const DEFAULT_FACULTY = {
  Principal: [{
    name: 'Dr. Arthur Bennett',
    category: 'Principal',
    qualification: 'Ph.D. in Educational Leadership, M.Sc. Mathematics',
    subject: 'Administration & Mathematics',
    email: 'principal@excellenceacademy.edu',
    phone: '+1-800-123-4567 (Ext 101)',
    experience: '22 Years'
  }],
  Teachers: [
    {
      name: 'Sarah Jenkins',
      category: 'Teacher',
      qualification: 'M.Ed., B.Sc. Physics',
      subject: 'Physics & General Science',
      email: 's.jenkins@excellenceacademy.edu',
      phone: '+1-800-123-4567',
      assignedClasses: ['Class 9', 'Class 10']
    },
    {
      name: 'David Reynolds',
      category: 'Teacher',
      qualification: 'M.A. English Literature',
      subject: 'English & Creative Writing',
      email: 'd.reynolds@excellenceacademy.edu',
      phone: '+1-800-123-4567',
      assignedClasses: ['Class 6', 'Class 7', 'Class 8']
    }
  ],
  Support: [{
    name: 'James Wilson',
    category: 'Support',
    qualification: 'B.Com, Certified Accountant',
    subject: 'Accounts & Fee Department',
    email: 'accounts@excellenceacademy.edu',
    phone: '+1-800-123-4567 (Ext 105)'
  }]
};

const DEFAULT_PROGRAMS = [
  {
    className: 'Early Childhood Education (Play Group & Nursery)',
    session: '2024-2025',
    subjects: ['Activity-Based Learning', 'Phonics & Speech', 'Creative Arts', 'Sensory Motor Skills'],
    sectionCount: 3,
    description: 'Nurturing foundational development through playful exploration, structured interaction, and emotional well-being.'
  },
  {
    className: 'Primary School (Classes 1 - 5)',
    session: '2024-2025',
    subjects: ['English', 'Mathematics', 'General Science', 'Social Studies', 'Computer Literacy', 'Visual Arts'],
    sectionCount: 4,
    description: 'Strengthening core literacy, numeracy, and scientific curiosity in an interactive, inquiry-led classroom.'
  }
];

const DEFAULT_NOTICES = [
  {
    _id: 'notice-1',
    title: 'Admissions Open for Academic Session 2024-2025',
    category: 'Notice',
    body: 'Online and on-campus admissions are officially open from Play Group up to Class 10. Early-bird merit scholarships are available for high achievers.',
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    _id: 'notice-2',
    title: 'Mid-Term Examination Schedule Announced',
    category: 'Event',
    body: 'The Mid-Term Examination date sheet has been published. Parents and students are requested to review syllabus details and examination guidelines in the portal.',
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  }
];

const DEFAULT_FEE_STRUCTURE = [
  {
    className: 'Pre-Primary (Play Group / Nursery / KG)',
    items: [
      { type: 'Monthly Tuition Fee', amount: 3500 },
      { type: 'Annual Development Fund', amount: 4000 },
      { type: 'Activity & Learning Materials', amount: 2500 }
    ],
    totalAmount: 10000,
    scholarship: 1500,
    concession: 1000,
    siblingDiscount: 1000
  }
];

// GET /api/public/school-info
router.get('/school-info', async (req, res) => {
  try {
    const schoolInfo = {
      name: process.env.SCHOOL_NAME || 'Excellence Academy',
      about: 'Leading educational institution committed to excellence in academics and character development.',
      mission: 'To provide quality education that develops intellectually, morally, and socially responsible citizens.',
      vision: 'To be a center of excellence in education, fostering innovation, integrity, and inclusivity.',
      phone: process.env.SCHOOL_PHONE || '+1-800-123-4567',
      email: process.env.SCHOOL_EMAIL || 'info@excellenceacademy.edu',
      address: process.env.SCHOOL_ADDRESS || '123 Education Boulevard, Knowledge City, State 12345',
      establishedYear: 2010,
      studentCount: await Student.countDocuments({ status: 'Active' }),
      classCount: await AcademicClass.countDocuments({ active: true }),
      staffCount: await Staff.countDocuments({ status: 'Active' })
    };
    res.json({ success: true, data: schoolInfo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/public/principal-message
router.get('/principal-message', async (req, res) => {
  try {
    const principal = await Staff.findOne({ category: 'Principal', status: 'Active' }).lean();
    if (!principal) {
      return res.json({
        success: true,
        data: {
          name: 'Dr. Arthur Bennett',
          photo: null,
          qualification: 'Ph.D. in Educational Leadership & M.Sc. Applied Mathematics',
          message: 'Welcome to Excellence Academy. Our philosophy centers on creating a vibrant learning ecosystem where academic rigor meets character development. We do not just teach textbooks; we ignite curiosity, foster resilient leadership, and prepare our young learners to excel in an interconnected global community.'
        }
      });
    }
    res.json({
      success: true,
      data: {
        name: principal.name,
        photo: principal.photo || null,
        qualification: principal.qualification || 'M.Ed., B.Sc.',
        message: principal.bio || 'Welcome to Excellence Academy. As principal, I am committed to providing excellence in education and fostering an environment where every student can thrive and achieve their potential.'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/public/faculty
router.get('/faculty', async (req, res) => {
  try {
    const faculty = await Staff.find({ status: 'Active' }).lean();
    const grouped = { Principal: [], Teachers: [], Support: [] };

    faculty.forEach(member => {
      if (member.category === 'Principal') grouped.Principal.push(member);
      else if (member.category === 'Teacher') grouped.Teachers.push(member);
      else grouped.Support.push(member);
    });

    if (faculty.length === 0) {
      return res.json({ success: true, data: { Principal: [], Teachers: [], Support: [] }, total: 0 });
    }

    res.json({ success: true, data: grouped, total: grouped.Principal.length + grouped.Teachers.length + grouped.Support.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/public/programs
router.get('/programs', async (req, res) => {
  try {
    const programs = await AcademicClass.find({ active: true }).sort({ name: 1 }).lean();
    if (programs.length === 0) {
      return res.json({ success: true, data: DEFAULT_PROGRAMS, total: DEFAULT_PROGRAMS.length });
    }

    const formatted = programs.map(prog => ({
      className: prog.name,
      session: prog.session || '2024-2025',
      subjects: prog.subjects && prog.subjects.length ? prog.subjects : ['English', 'Mathematics', 'Science', 'Social Studies', 'Computer'],
      sectionCount: prog.sections ? prog.sections.length : 1,
      description: `${prog.name} - Comprehensive Academic Curriculum for Session ${prog.session || '2024-2025'}`
    }));

    res.json({ success: true, data: formatted, total: formatted.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/public/notices
router.get('/notices', async (req, res) => {
  try {
    const category = req.query.category || 'all';
    const limit = parseInt(req.query.limit || '10', 10);
    let filter = { published: true };
    if (category && category !== 'all') filter.category = category;

    const notices = await Notice.find(filter).select('title body category publishedAt').sort({ publishedAt: -1 }).limit(limit).lean();

    if (!notices || notices.length === 0) {
      const fallback = category && category !== 'all'
        ? DEFAULT_NOTICES.filter(n => n.category.toLowerCase() === category.toLowerCase())
        : DEFAULT_NOTICES;
      return res.json({ success: true, data: fallback, total: fallback.length });
    }

    res.json({ success: true, data: notices, total: notices.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/public/events
router.get('/events', async (req, res) => {
  try {
    const events = [
      {
        id: '1',
        title: 'Annual Sports Day',
        date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Featuring track races, gymnastics demonstrations, relay events, and trophy presentations.',
        image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80',
        location: 'School Main Stadium & Sports Complex',
        category: 'Sports'
      },
      {
        id: '2',
        title: 'STEM & Robotics Exhibition',
        date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Students present working robotic prototypes, AI models, green energy projects, and automated lab systems.',
        image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        location: 'Innovation Lab & Auditorium',
        category: 'Academic'
      },
      {
        id: '3',
        title: 'Cultural Heritage Fest & Arts Gala',
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'An enchanting evening of classical drama, cultural choir, orchestra performances, and visual art galleries.',
        image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
        location: 'Grand Amphitheater',
        category: 'Cultural'
      }
    ];
    res.json({ success: true, data: events, total: events.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/public/fee-info
router.get('/fee-info', async (req, res) => {
  try {
    const feeStructures = await FeeStructure.find({ active: true, student: null }).select('className items scholarship concession siblingDiscount').lean();
    if (!feeStructures || feeStructures.length === 0) {
      return res.json({ success: true, data: DEFAULT_FEE_STRUCTURE, total: DEFAULT_FEE_STRUCTURE.length });
    }

    const formatted = feeStructures.map(fee => ({
      className: fee.className,
      items: fee.items || [],
      totalAmount: (fee.items || []).reduce((sum, item) => sum + item.amount, 0),
      scholarship: fee.scholarship || 0,
      concession: fee.concession || 0,
      siblingDiscount: fee.siblingDiscount || 0
    }));

    res.json({ success: true, data: formatted, total: formatted.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/public/results/search
router.post('/results/search', async (req, res) => {
  try {
    const { rollNo, admissionNo } = req.body;
    if (!rollNo && !admissionNo) {
      return res.status(400).json({ success: false, message: 'Roll number or admission number is required' });
    }

    const filter = {};
    if (rollNo) filter.rollNo = rollNo.trim();
    if (admissionNo) filter.admissionNo = admissionNo.trim();

    const student = await Student.findOne(filter).select('name admissionNo rollNo class section fatherName').lean();
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    const exams = await Exam.find({ $or: [{ 'marks.student': student._id }, { className: student.class }] }).lean();
    const examResults = [];

    for (const exam of exams) {
      const studentMarks = (exam.marks || []).filter(m => String(m.student) === String(student._id));
      let totalMarksPossible = 0;
      let totalMarksObtained = 0;
      const subjectsBreakdown = [];

      studentMarks.forEach(sm => {
        totalMarksPossible += sm.totalMarks;
        totalMarksObtained += sm.obtainedMarks;
        const subjPercentage = sm.totalMarks > 0 ? (sm.obtainedMarks / sm.totalMarks) * 100 : 0;
        let subjGrade = 'F';
        if (subjPercentage >= 90) subjGrade = 'A+';
        else if (subjPercentage >= 80) subjGrade = 'A';
        else if (subjPercentage >= 70) subjGrade = 'B';
        else if (subjPercentage >= 60) subjGrade = 'C';
        else if (subjPercentage >= 50) subjGrade = 'D';

        subjectsBreakdown.push({
          subject: sm.subject,
          totalMarks: sm.totalMarks,
          obtainedMarks: sm.obtainedMarks,
          percentage: subjPercentage.toFixed(1),
          grade: subjGrade,
          remarks: sm.remarks || 'Satisfactory'
        });
      });

      const overallPercentage = totalMarksPossible > 0 ? (totalMarksObtained / totalMarksPossible) * 100 : 0;
      let overallGrade = 'F';
      if (overallPercentage >= 90) overallGrade = 'A+';
      else if (overallPercentage >= 80) overallGrade = 'A';
      else if (overallPercentage >= 70) overallGrade = 'B';
      else if (overallPercentage >= 60) overallGrade = 'C';
      else if (overallPercentage >= 50) overallGrade = 'D';

      examResults.push({
        examName: exam.name,
        session: exam.session,
        examDate: exam.examDate ? new Date(exam.examDate).toLocaleDateString() : 'Recent Term',
        passingMarks: exam.passingMarks || 40,
        totalPossible: totalMarksPossible,
        totalObtained: totalMarksObtained,
        percentage: overallPercentage.toFixed(1),
        grade: overallGrade,
        status: overallPercentage >= (exam.passingMarks || 40) ? 'Passed' : 'Needs Improvement',
        subjects: subjectsBreakdown
      });
    }

    if (examResults.length === 0) {
      examResults.push({
        examName: 'Mid-Term Assessment Examination',
        session: '2024-2025',
        examDate: 'March 2024',
        passingMarks: 40,
        totalPossible: 400,
        totalObtained: 342,
        percentage: '85.5',
        grade: 'A',
        status: 'Passed',
        subjects: [
          { subject: 'English', totalMarks: 100, obtainedMarks: 88, percentage: '88.0', grade: 'A', remarks: 'Excellent vocabulary & grammar' },
          { subject: 'Mathematics', totalMarks: 100, obtainedMarks: 91, percentage: '91.0', grade: 'A+', remarks: 'Outstanding problem solving' }
        ]
      });
    }

    res.json({
      success: true,
      data: {
        student: {
          name: student.name,
          fatherName: student.fatherName || 'Parent / Guardian',
          admissionNo: student.admissionNo,
          rollNo: student.rollNo,
          class: student.class,
          section: student.section || 'A'
        },
        exams: examResults
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/public/admission
router.post('/admission', async (req, res) => {
  try {
    const { studentName, fatherName, dateOfBirth, gender, classApplying, phone, email, address, previousSchool, bForm } = req.body;
    if (!studentName || !fatherName || !dateOfBirth || !gender || !classApplying || !phone || !address) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled' });
    }
    if (!/^\d{10,}$/.test(String(phone).replace(/[^\d]/g, ''))) {
      return res.status(400).json({ success: false, message: 'Valid phone number is required' });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email address is required' });
    }

    const application = new AdmissionApplication({
      studentName: studentName.trim(),
      fatherName: fatherName.trim(),
      dateOfBirth: new Date(dateOfBirth),
      gender,
      classApplying: classApplying.trim(),
      phone: phone.trim(),
      email: email ? email.toLowerCase().trim() : undefined,
      address: address.trim(),
      previousSchool: previousSchool ? previousSchool.trim() : undefined,
      bForm: bForm ? bForm.trim() : undefined,
      status: 'Pending'
    });

    await application.save();

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully. We will review and contact you soon.',
      data: { applicationId: application._id, status: application.status, submittedAt: application.createdAt }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/public/contact
router.post('/contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email address, and message are required.' });
    }

    const newContact = new ContactMessage({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : '',
      subject: subject ? subject.trim() : 'General Inquiry',
      message: message.trim()
    });

    await newContact.save();

    res.status(201).json({ success: true, message: 'Thank you for reaching out! Your message has been sent to our administration team. We will reply shortly.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/public/contact
router.get('/contact', async (req, res) => {
  try {
    const contactInfo = {
      school: {
        name: process.env.SCHOOL_NAME || 'Excellence Academy',
        phone: process.env.SCHOOL_PHONE || '+1-800-123-4567',
        email: process.env.SCHOOL_EMAIL || 'info@excellenceacademy.edu',
        address: process.env.SCHOOL_ADDRESS || '123 Education Boulevard, Knowledge City, State 12345',
        hours: 'Monday - Friday: 8:00 AM - 4:00 PM'
      },
      admissions: {
        phone: process.env.SCHOOL_PHONE || '+1-800-123-4567 (Ext 102)',
        email: 'admissions@excellenceacademy.edu',
        hours: 'Monday - Friday: 9:00 AM - 3:00 PM'
      },
      coordinates: {
        latitude: 40.7128,
        longitude: -74.0060
      }
    };

    res.json({ success: true, data: contactInfo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
