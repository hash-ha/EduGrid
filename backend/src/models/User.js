const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  employeeId: { type: String, unique: true, sparse: true, uppercase: true, trim: true },
  admissionNo: { type: String, unique: true, sparse: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['super_admin', 'school_admin', 'accountant', 'teacher', 'student', 'parent'], default: 'teacher' },
  phone: { type: String },
  address: { type: String },
  isApproved: { type: Boolean, default: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  mustChangePassword: { type: Boolean, default: false },
  lastLoginAt: { type: Date, default: null },
  loginCount: { type: Number, default: 0 },
  linkedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }]
}, { timestamps: true });

const hashPassword = async (password) => {
  if (!password || typeof password !== 'string') return password;
  if (password.startsWith('$2') && password.length > 20) return password;
  return bcrypt.hash(password, 10);
};

// Password hash
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await hashPassword(this.password);
  next();
});

UserSchema.pre(['updateOne', 'findOneAndUpdate'], async function(next) {
  const update = this.getUpdate ? this.getUpdate() : this._update;
  const rawPassword = update?.$set?.password ?? update?.password;

  if (!rawPassword || typeof rawPassword !== 'string') return next();
  if (rawPassword.startsWith('$2') && rawPassword.length > 20) return next();

  if (update?.$set) {
    update.$set.password = await hashPassword(rawPassword);
  } else {
    update.password = await hashPassword(rawPassword);
  }

  next();
});

// Password compare
UserSchema.methods.comparePassword = async function(password) {
  if (!password || !this.password) return false;
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);