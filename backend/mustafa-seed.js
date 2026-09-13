const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./src/models/User");
(async () => {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/school_management");
  const result = await User.findOneAndUpdate(
    { $or: [{ email: "mustafa.teacher@school.com" }, { employeeId: "TCH-007" }] },
    { $set: { name: "Mustafa Ali", email: "mustafa.teacher@school.com", employeeId: "TCH-007", password: "123456", role: "teacher", phone: "0307-8889900", isApproved: true, status: "Active", mustChangePassword: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log(JSON.stringify({ email: result.email, status: result.status, role: result.role, employeeId: result.employeeId }));
  await mongoose.disconnect();
})();
