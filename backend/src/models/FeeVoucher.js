const mongoose = require('mongoose');

const FeeItemSchema = new mongoose.Schema({
  type: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 }
}, { _id: false });

const PaymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0 },
  paidAt: { type: Date, default: Date.now },
  receiptNo: { type: String, required: true }
}, { _id: false });

const FeeVoucherSchema = new mongoose.Schema({
  voucherNo: { type: String, unique: true, index: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  feeMonth: { type: String, required: true, trim: true },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  items: { type: [FeeItemSchema], required: true, validate: value => value.length > 0 },
  previousBalance: { type: Number, default: 0, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  scholarship: { type: Number, default: 0, min: 0 },
  concession: { type: Number, default: 0, min: 0 },
  siblingDiscount: { type: Number, default: 0, min: 0 },
  fine: { type: Number, default: 0, min: 0 },
  advanceAmount: { type: Number, default: 0, min: 0 },
  advanceBalance: { type: Number, default: 0, min: 0 },
  totalPayable: { type: Number, required: true, min: 0 },
  paidAmount: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['Unpaid', 'Partial', 'Paid', 'Overdue'], default: 'Unpaid' },
  payments: { type: [PaymentSchema], default: [] }
}, { timestamps: true });

function calculateVoucherTotals(doc) {
  const items = Array.isArray(doc.items) ? doc.items : [];
  const itemTotal = items.reduce((sum, item) => sum + (Number(item?.amount) || 0), 0);
  const previousBalance = Number(doc.previousBalance || 0);
  const fine = Number(doc.fine || 0);
  const discount = Number(doc.discount || 0);
  const scholarship = Number(doc.scholarship || 0);
  const concession = Number(doc.concession || 0);
  const siblingDiscount = Number(doc.siblingDiscount || 0);
  const advanceAmount = Number(doc.advanceAmount || 0);
  const totalDiscount = discount + scholarship + concession + siblingDiscount;
  const totalPayable = Math.max(0, itemTotal + previousBalance + fine - totalDiscount - advanceAmount);
  doc.totalPayable = Number(totalPayable.toFixed(2));

  if (doc.paidAmount >= doc.totalPayable) doc.status = 'Paid';
  else if (doc.paidAmount > 0) doc.status = 'Partial';
  else if (doc.dueDate && new Date(doc.dueDate) < new Date()) doc.status = 'Overdue';
  else doc.status = 'Unpaid';
}

FeeVoucherSchema.pre('validate', async function(next) {
  if (!this.voucherNo) {
    const count = await mongoose.model('FeeVoucher').countDocuments();
    this.voucherNo = `V-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
  }

  calculateVoucherTotals(this);
  next();
});

FeeVoucherSchema.pre('save', function(next) {
  calculateVoucherTotals(this);
  next();
});

module.exports = mongoose.model('FeeVoucher', FeeVoucherSchema);
