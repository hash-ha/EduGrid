const mongoose = require('mongoose');

const SectionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  capacity: { type: Number, min: 1 },
  classTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  classTeacherStaff: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  subjectTeachers: [{
    subject: { type: String, required: true, trim: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true }
  }]
}, { _id: true });

const AcademicClassSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  session: { type: String, required: true, trim: true },
  subjects: [{ type: String, trim: true }],
  sections: { type: [SectionSchema], default: [] },
  active: { type: Boolean, default: true }
}, { timestamps: true });

AcademicClassSchema.index({ name: 1, session: 1 }, { unique: true });

module.exports = mongoose.model('AcademicClass', AcademicClassSchema);
