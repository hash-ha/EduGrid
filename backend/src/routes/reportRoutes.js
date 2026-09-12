const express = require('express');
const Student = require('../models/Student');
const FeeVoucher = require('../models/FeeVoucher');
const Attendance = require('../models/Attendance');
const Exam = require('../models/Exam');
const AcademicClass = require('../models/AcademicClass');
const { protect, authorize } = require('../middleware/auth');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');

const router = express.Router();
const reportRoles = ['super_admin', 'school_admin'];

function csv(res, filename, rows) {
  const keys = rows.length ? Object.keys(rows[0]) : [];
  const escape = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const content = [keys.join(','), ...rows.map(row => keys.map(key => escape(row[key])).join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
  res.send(content);
}

function xlsx(res, filename, rows) {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, 'Report');
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
  return res.send(buffer);
}

function pdf(res, filename, title, rows) {
  const document = new PDFDocument({ margin: 40, size: 'A4' });
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
  document.pipe(res);

  // Header
  document.fontSize(16).font('Helvetica-Bold').text(title, { align: 'center' });
  document.fontSize(10).font('Helvetica').text(`Generated on ${new Date().toLocaleDateString()}`, { align: 'center' });
  document.moveDown(0.5);

  if (!rows.length) {
    document.fontSize(12).text('No data available', { align: 'center' });
    document.end();
    return;
  }

  // Table
  const keys = Object.keys(rows[0]);
  const colWidths = keys.map(k => Math.max(50, 540 / keys.length));
  const tableTop = document.y;
  
  // Header row
  let x = 40;
  document.fontSize(9).font('Helvetica-Bold').fillColor('#333');
  keys.forEach((key, i) => {
    document.text(key, x, tableTop, { width: colWidths[i], height: 20, align: 'left' });
    x += colWidths[i];
  });
  
  document.moveTo(40, tableTop + 20).lineTo(555, tableTop + 20).stroke();
  document.moveDown(1.5);

  // Data rows
  document.fontSize(8).font('Helvetica').fillColor('#000');
  rows.forEach(row => {
    x = 40;
    const rowTop = document.y;
    keys.forEach((key, i) => {
      const cellValue = String(row[key] ?? '-').substring(0, 50);
      document.text(cellValue, x, rowTop, { width: colWidths[i], height: 20, align: 'left' });
      x += colWidths[i];
    });
    document.moveDown(1.3);
  });

  document.end();
}

// General Reports
router.get('/general/:type', protect, authorize(...reportRoles), async (req, res) => {
  try {
    let rows = [];
    
    if (req.params.type === 'student-list') {
      // 1. Student List Report
      const data = await Student.find({ status: 'Active' }).sort({ class: 1, section: 1, name: 1 }).lean();
      rows = data.map(item => ({
        'Admission No': item.admissionNo,
        'Student Name': item.name,
        'Father Name': item.fatherName,
        'Mother Name': item.motherName,
        'Class': item.class,
        'Section': item.section,
        'Roll No': item.rollNo || '-',
        'Gender': item.gender,
        'Phone': item.phone || '-',
        'Status': item.status
      }));
    }
    else if (req.params.type === 'class-wise-student') {
      // 2. Class-wise Student List Report
      const data = await Student.find({ status: 'Active' }).sort({ class: 1, section: 1, name: 1 }).lean();
      const grouped = {};
      data.forEach(item => {
        const key = `${item.class}-${item.section}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(item);
      });
      
      Object.keys(grouped).sort().forEach(key => {
        const [cls, sec] = key.split('-');
        grouped[key].forEach((item, idx) => {
          rows.push({
            'Class': cls,
            'Section': sec,
            'S.No': idx + 1,
            'Admission No': item.admissionNo,
            'Student Name': item.name,
            'Father Name': item.fatherName,
            'Roll No': item.rollNo || '-',
            'Gender': item.gender
          });
        });
      });
    }
    else if (req.params.type === 'admission-report') {
      // 3. Admission Report
      const data = await Student.find().sort({ createdAt: -1 }).lean();
      rows = data.map(item => ({
        'Admission No': item.admissionNo,
        'Student Name': item.name,
        'Father Name': item.fatherName,
        'Date of Birth': item.dateOfBirth ? new Date(item.dateOfBirth).toLocaleDateString() : '-',
        'Class': item.class,
        'Section': item.section,
        'Phone': item.phone || '-',
        'Address': item.address || '-',
        'Status': item.status,
        'Admission Date': item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'
      }));
    }
    else return res.status(404).json({ message: 'Unknown report type' });
    
    if (req.query.format === 'csv') return csv(res, `${req.params.type}-report`, rows);
    if (req.query.format === 'xlsx') return xlsx(res, `${req.params.type}-report`, rows);
    if (req.query.format === 'pdf') return pdf(res, `${req.params.type}-report`, `${req.params.type.replace(/-/g, ' ').toUpperCase()} Report`, rows);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Attendance Reports
router.get('/attendance/:type', protect, authorize(...reportRoles), async (req, res) => {
  try {
    let rows = [];

    if (req.params.type === 'attendance-report') {
      // 6. Attendance Report
      const data = await Attendance.find().populate('student', 'name admissionNo class section').sort({ date: -1 }).lean();
      rows = data.map(item => ({
        'Date': item.date ? new Date(item.date).toLocaleDateString() : '-',
        'Student Name': item.student?.name,
        'Admission No': item.student?.admissionNo,
        'Class': item.student?.class,
        'Section': item.student?.section,
        'Status': item.status
      }));
    }

    if (req.query.format === 'csv') return csv(res, `${req.params.type}-report`, rows);
    if (req.query.format === 'xlsx') return xlsx(res, `${req.params.type}-report`, rows);
    if (req.query.format === 'pdf') return pdf(res, `${req.params.type}-report`, 'Attendance Report', rows);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Exam Reports
router.get('/exam/:type', protect, authorize(...reportRoles), async (req, res) => {
  try {
    let rows = [];

    if (req.params.type === 'result-report') {
      // 7. Examination Result Report
      const data = await Exam.find().populate('marks.student', 'name admissionNo rollNo').lean();
      rows = data.flatMap(exam =>
        exam.marks.map(mark => ({
          'Exam': exam.name,
          'Class': exam.className,
          'Session': exam.session,
          'Student Name': mark.student?.name,
          'Admission No': mark.student?.admissionNo,
          'Roll No': mark.student?.rollNo || '-',
          'Subject': mark.subject,
          'Total Marks': mark.totalMarks,
          'Obtained Marks': mark.obtainedMarks,
          'Percentage': Number(((mark.obtainedMarks / mark.totalMarks) * 100).toFixed(2)) + '%',
          'Grade': mark.grade || '-'
        }))
      );
    }
    else if (req.params.type === 'class-wise-result') {
      // 8. Class-wise Result Report
      const data = await Exam.find().populate('marks.student', 'name admissionNo class').lean();
      const grouped = {};
      
      data.forEach(exam => {
        exam.marks.forEach(mark => {
          const key = exam.className;
          if (!grouped[key]) grouped[key] = [];
          const percentage = (mark.obtainedMarks / mark.totalMarks) * 100;
          grouped[key].push({
            'Class': exam.className,
            'Exam': exam.name,
            'Student': mark.student?.name,
            'Admission No': mark.student?.admissionNo,
            'Subject': mark.subject,
            'Obtained': mark.obtainedMarks,
            'Total': mark.totalMarks,
            'Percentage': Number(percentage.toFixed(2)) + '%',
            'Status': percentage >= (exam.passingMarks || 40) ? 'Passed' : 'Failed'
          });
        });
      });

      Object.keys(grouped).sort().forEach(key => {
        rows.push(...grouped[key]);
      });
    }
    else if (req.params.type === 'top-position-holders') {
      // 9. Top Position Holders Report
      const exams = await Exam.find().populate('marks.student', 'name admissionNo class').lean();
      const studentScores = {};

      exams.forEach(exam => {
        exam.marks.forEach(mark => {
          const studentId = mark.student?._id?.toString();
          if (!studentScores[studentId]) {
            studentScores[studentId] = {
              'Student Name': mark.student?.name,
              'Admission No': mark.student?.admissionNo,
              'Class': mark.student?.class,
              'Total Marks': 0,
              'Obtained Marks': 0,
              'Subjects': 0
            };
          }
          studentScores[studentId]['Total Marks'] += mark.totalMarks;
          studentScores[studentId]['Obtained Marks'] += mark.obtainedMarks;
          studentScores[studentId]['Subjects'] += 1;
        });
      });

      rows = Object.values(studentScores)
        .map(item => ({
          ...item,
          'Percentage': item['Total Marks'] > 0 ? Number(((item['Obtained Marks'] / item['Total Marks']) * 100).toFixed(2)) + '%' : '0%'
        }))
        .sort((a, b) => parseFloat(b['Percentage']) - parseFloat(a['Percentage']))
        .slice(0, 20); // Top 20
    }

    if (req.query.format === 'csv') return csv(res, `${req.params.type}-report`, rows);
    if (req.query.format === 'xlsx') return xlsx(res, `${req.params.type}-report`, rows);
    if (req.query.format === 'pdf') return pdf(res, `${req.params.type}-report`, `${req.params.type.replace(/-/g, ' ').toUpperCase()} Report`, rows);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Fee Reports (existing endpoint structure maintained)
router.get('/fee/:reportType', protect, authorize(...reportRoles), async (req, res) => {
  try {
    const vouchers = await FeeVoucher.find().populate('student', 'name admissionNo class section').lean();
    const payments = vouchers.flatMap((voucher) => voucher.payments.map((payment) => ({ ...payment, voucher })));
    const reportType = req.params.reportType;
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    let rows;

    if (reportType === 'daily-collection') {
      // 4. Fee Collection Report (Daily)
      rows = payments
        .filter((item) => new Date(item.paidAt).toISOString().slice(0, 10) === date)
        .map((item) => ({
          'Receipt No': item.receiptNo,
          'Date': date,
          'Student': item.voucher.student?.name,
          'Admission No': item.voucher.student?.admissionNo,
          'Class': item.voucher.student?.class,
          'Voucher No': item.voucher.voucherNo,
          'Amount': item.amount
        }));
    }
    else if (reportType === 'monthly-collection') {
      // 4. Fee Collection Report (Monthly)
      rows = payments
        .filter((item) => new Date(item.paidAt).toISOString().slice(0, 7) === date.slice(0, 7))
        .map((item) => ({
          'Receipt No': item.receiptNo,
          'Date': new Date(item.paidAt).toLocaleDateString(),
          'Student': item.voucher.student?.name,
          'Admission No': item.voucher.student?.admissionNo,
          'Class': item.voucher.student?.class,
          'Voucher No': item.voucher.voucherNo,
          'Amount': item.amount
        }));
    }
    else if (reportType === 'fee-defaulter') {
      // 5. Fee Defaulter Report
      rows = vouchers
        .filter((item) => item.status !== 'Paid')
        .map((item) => ({
          'Voucher No': item.voucherNo,
          'Student': item.student?.name,
          'Admission No': item.student?.admissionNo,
          'Class': item.student?.class,
          'Fee Month': item.feeMonth,
          'Total Payable': item.totalPayable,
          'Paid Amount': item.paidAmount,
          'Outstanding': Math.max(0, item.totalPayable - item.paidAmount),
          'Status': item.status
        }));
    }
    else if (reportType === 'class-collection') {
      rows = Object.values(
        vouchers.reduce((result, item) => {
          const key = item.student?.class || 'Unknown';
          result[key] ||= {
            'Class': key,
            'Vouchers': 0,
            'Collected': 0,
            'Outstanding': 0
          };
          result[key]['Vouchers'] += 1;
          result[key]['Collected'] += item.paidAmount;
          result[key]['Outstanding'] += Math.max(0, item.totalPayable - item.paidAmount);
          return result;
        }, {})
      );
    }
    else return res.status(404).json({ message: 'Unknown fee report type' });

    if (req.query.format === 'csv') return csv(res, `${reportType}-report`, rows);
    if (req.query.format === 'xlsx') return xlsx(res, `${reportType}-report`, rows);
    if (req.query.format === 'pdf') return pdf(res, `${reportType}-report`, `${reportType.replace(/-/g, ' ').toUpperCase()} Report`, rows);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Student Promotion Report
router.get('/promotion/report', protect, authorize(...reportRoles), async (req, res) => {
  try {
    // 10. Student Promotion Report
    const students = await Student.find().sort({ class: 1, section: 1, name: 1 }).lean();
    const rows = students.map(item => ({
      'Admission No': item.admissionNo,
      'Student Name': item.name,
      'Current Class': item.class,
      'Section': item.section,
      'Promoted to Class': item.nextClass || '-',
      'Status': item.nextClass ? 'Promoted' : 'To be decided',
      'Remarks': item.promotionRemarks || '-'
    }));

    if (req.query.format === 'csv') return csv(res, 'student-promotion-report', rows);
    if (req.query.format === 'xlsx') return xlsx(res, 'student-promotion-report', rows);
    if (req.query.format === 'pdf') return pdf(res, 'student-promotion-report', 'Student Promotion Report', rows);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
