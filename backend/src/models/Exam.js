const mongoose = require('mongoose');

const MarkSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subject: { type: String, required: true, trim: true },
  totalMarks: { type: Number, required: true, min: 1 },
  obtainedMarks: { type: Number, required: true, min: 0 },
  remarks: { type: String, trim: true }
}, { _id: true });

const GradeRuleSchema = new mongoose.Schema({
  minPercentage: { type: Number, min: 0, max: 100, required: true },
  grade: { type: String, required: true, trim: true }
}, { _id: false });

const ExamSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  className: { type: String, required: true, trim: true },
  section: { type: String, trim: true },
  session: { type: String, required: true, trim: true },
  examDate: { type: Date },
  passingMarks: { type: Number, min: 0, default: 40 },
  gradingScale: { type: [GradeRuleSchema], default: [
    { minPercentage: 90, grade: 'A+' },
    { minPercentage: 80, grade: 'A' },
    { minPercentage: 70, grade: 'B' },
    { minPercentage: 60, grade: 'C' },
    { minPercentage: 50, grade: 'D' },
    { minPercentage: 0, grade: 'Fail' }
  ] },
  published: { type: Boolean, default: false },
  marks: { type: [MarkSchema], default: [] }
}, { timestamps: true });

ExamSchema.index({ name: 1, className: 1, session: 1 }, { unique: true });

module.exports = mongoose.model('Exam', ExamSchema);
