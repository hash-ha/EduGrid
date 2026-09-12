import { useEffect, useState } from "react";
import "./App.css";
import FeeManagement from "./FeeManagement";
import ReportCard from "./ReportCard";
import ParentPortal from "./ParentPortal";
import TeacherPortal from "./TeacherPortal";
import AdminDashboard from "./AdminDashboard";
import ReportsModule from "./ReportsModule";

const API = import.meta.env.VITE_API_URL || "${API}";
const roles = {
  super_admin: "Super Admin",
  school_admin: "School Admin",
  accountant: "Accountant",
  teacher: "Teacher",
  student: "Student",
  parent: "Parent",
};
const demoAccounts = {
  super_admin: "",
  school_admin: "",
  accountant: "",
  teacher: "",
  student: "",
  parent: "",
};
const classes = [
  "Play Group",
  "Nursery",
  "Prep/KG",
  ...Array.from({ length: 10 }, (_, index) => `Class ${index + 1}`),
];
const feeTypes = [
  "Admission Fee",
  "Monthly Tuition Fee",
  "Annual Fee",
  "Computer Fee",
  "Examination Fee",
  "Transport Fee",
  "Fine",
  "Other Charges",
];
const blankStudent = {
  name: "",
  fatherName: "",
  motherName: "",
  dateOfBirth: "",
  phone: "",
  address: "",
  class: "Class 1",
  section: "A",
  rollNo: "",
  gender: "Male",
  cnic: "",
  bForm: "",
  previousSchool: "",
  guardianName: "",
  guardianRelation: "Father",
  guardianPhone: "",
  guardianCnic: "",
  photoFile: null,
};

function navigationFor(role) {
  const overview = { id: "overview", label: "Overview", icon: "▦" };
  const students = { id: "students", label: "Students", icon: "♧" };
  const attendance = { id: "attendance", label: "Attendance", icon: "◷" };
  const fees = { id: "fees", label: "Fees & payments", icon: "◈" };
  const exams = { id: "results", label: "Examinations", icon: "⌁" };
  const report = { id: "report", label: "Report cards", icon: "▤" };
  const notices = { id: "notices", label: "Notices & homework", icon: "!" };
  if (role === "accountant")
    return [overview, { id: "admissions", label: "Admission applications", icon: "▣" }, fees];
  if (role === "teacher")
    return [overview, students, attendance, exams, report, notices];
  if (role === "student" || role === "parent")
    return [overview, { id: "portal-results", label: "Online results", icon: "★" }, notices];
  return [
    overview,
    students,
    { id: "admission", label: "New admission", icon: "+" },
    { id: "academics", label: "Classes & subjects", icon: "⌘" },
    { id: "staff", label: "Staff & teachers", icon: "♙" },
    { id: "reports", label: "Reports", icon: "▥" },
    attendance,
    fees,
    exams,
    report,
    notices,
  ];
}

function App() {
  const [session, setSession] = useState(() =>
    JSON.parse(localStorage.getItem("schoolSession") || "null"),
  );
  const [view, setView] = useState("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [attendance, setAttendance] = useState({});
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [vouchers, setVouchers] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [academicClasses, setAcademicClasses] = useState([]);
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [staff, setStaff] = useState([]);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [staffForm, setStaffForm] = useState({
    employeeId: "",
    name: "",
    category: "Teacher",
    qualification: "",
    subject: "",
    phone: "",
    email: "",
    joiningDate: "",
    salary: "",
    assignedClasses: "",
    status: "Active",
    photoFile: null,
  });
  const [exams, setExams] = useState([]);
  const [showExamForm, setShowExamForm] = useState(false);
  const [examForm, setExamForm] = useState({
    name: "Monthly Test",
    className: "Class 1",
    section: "A",
    session: "2026-2027",
    examDate: "",
    passingMarks: "40",
    gradingScale: '[{"minPercentage":90,"grade":"A+"},{"minPercentage":80,"grade":"A"},{"minPercentage":70,"grade":"B"},{"minPercentage":60,"grade":"C"},{"minPercentage":50,"grade":"D"},{"minPercentage":0,"grade":"Fail"}]',
  });
  const [selectedExam, setSelectedExam] = useState(null);
  const [editingExam, setEditingExam] = useState(null);
  const [markForm, setMarkForm] = useState({
    student: "",
    subject: "",
    totalMarks: "100",
    obtainedMarks: "",
    remarks: "",
    entries: {},
  });
  const [marksSaveState, setMarksSaveState] = useState("idle");
  const [examResults, setExamResults] = useState([]);
  const [portalData, setPortalData] = useState(null);
  const [notices, setNotices] = useState([]);
  const [showClassForm, setShowClassForm] = useState(false);
  const [classForm, setClassForm] = useState({
    name: "Class 1",
    session: "2026-2027",
    subjects: "",
    sections: "A",
  });
  const [showVoucherForm, setShowVoucherForm] = useState(false);
  const [voucherForm, setVoucherForm] = useState({
    studentId: "",
    feeMonth: "September 2026",
    dueDate: "2026-09-15",
    tuition: "5000",
    computer: "500",
    admission: "0",
    annual: "0",
    examination: "0",
    transport: "0",
    fine: "0",
    other: "0",
    previousBalance: "0",
    discount: "0",
    scholarship: "0",
    concession: "0",
    siblingDiscount: "0",
    advanceAmount: "0",
  });
  const [feeStructureForm, setFeeStructureForm] = useState({
    className: "Class 1",
    student: "",
    session: "2026-2027",
    items: Object.fromEntries(feeTypes.map((type) => [type, ""])),
    scholarship: "0",
    concession: "0",
    siblingDiscount: "0",
  });
  const [form, setForm] = useState(blankStudent);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [publicSite, setPublicSite] = useState(false);
  const [selectedLoginRole, setSelectedLoginRole] = useState(null);
  useEffect(() => {
    if (session) {
      loadStudents();
      loadVouchers();
      loadFeeStructures();
      loadAttendance();
      loadAcademicClasses();
      if (session.user.role === "teacher") loadTeacherClasses();
      loadStaff();
      if (session.user.role !== "accountant") loadExams();
      loadNotices();
      if (["parent", "student"].includes(session.user.role)) loadPortal();
    }
  }, [session]);
  async function call(path, options = {}) {
    const headers = {
      Authorization: `Bearer ${session.token}`,
      ...(options.headers || {}),
    };
    if (options.body || options.method && options.method.toUpperCase() !== "GET") {
      headers["Content-Type"] = "application/json";
    }
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers,
    });
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error(`API returned ${response.status} ${response.statusText} instead of JSON. Check that the backend is running at ${API}.`);
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
  }
  async function login(identifier, password) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, role: selectedLoginRole }),
      });
      if (!(response.headers.get("content-type") || "").includes("application/json")) {
        throw new Error(`Login API returned ${response.status} ${response.statusText}. Check that the backend is running at ${API}.`);
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      const next = { token: data.token, user: data.user };
      localStorage.setItem("schoolSession", JSON.stringify(next));
      setSession(next);
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function changePassword(currentPassword, newPassword) {
    try {
      await call('/auth/password', { method: 'PATCH', body: JSON.stringify({ currentPassword, newPassword }) });
      const next = { ...session, user: { ...session.user, mustChangePassword: false } };
      localStorage.setItem('schoolSession', JSON.stringify(next));
      setSession(next);
      setError('Password changed successfully.');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function changePasswordFromLogin(identifier, currentPassword, newPassword, role) {
    setBusy(true);
    setError('');
    try {
      const loginResponse = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password: currentPassword, role }),
      });
      const loginData = await loginResponse.json().catch(() => ({}));
      if (!loginResponse.ok) {
        throw new Error(loginData.message || 'Current password is incorrect');
      }

      const nextSession = { token: loginData.token, user: loginData.user };
      localStorage.setItem('schoolSession', JSON.stringify(nextSession));
      setSession(nextSession);

      const passwordResponse = await fetch(`${API}/auth/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${loginData.token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const passwordData = await passwordResponse.json().catch(() => ({}));
      if (!passwordResponse.ok) {
        throw new Error(passwordData.message || 'Password change failed');
      }

      const updatedSession = { ...nextSession, user: { ...nextSession.user, mustChangePassword: false } };
      localStorage.setItem('schoolSession', JSON.stringify(updatedSession));
      setSession(updatedSession);
      setError('Password changed successfully.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }
  async function loadStudents(search = "") {
    setBusy(true);
    try {
      const data = await call(
        search
          ? `/students/search?q=${encodeURIComponent(search)}`
          : "/students",
      );
      setStudents(data.data);
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function uploadStudentPhoto(id, file) {
    const body = new FormData();
    body.append("photo", file);
    const response = await fetch(`${API}/students/${id}/photo`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.token}` },
      body,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Photo upload failed");
    setStudents((current) =>
      current.map((student) =>
        student._id === id ? { ...student, photo: data.data.photo } : student,
      ),
    );
    setSelectedStudent((current) =>
      current?._id === id ? { ...current, photo: data.data.photo } : current,
    );
  }
  async function moveStudent(id, type, payload) {
    setBusy(true);
    try {
      const data = await call(`/students/${id}/${type}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSelectedStudent(data.data.student);
      await loadStudents();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function loadVouchers(query = "") {
    try {
      const data = await call(query ? `/fees/vouchers?q=${encodeURIComponent(query)}` : "/fees/vouchers");
      setVouchers(data.data);
    } catch (error) {
      setError(error.message);
    }
  }
  async function loadFeeStructures() {
    try {
      const data = await call("/fee-structures");
      setFeeStructures(data.data);
    } catch (error) {
      setError(error.message);
    }
  }
  function selectFeePolicy(className, session) {
    const policy = feeStructures.find((item) => !item.student && item.className === className && item.session === session);
    if (!policy) return;
    setFeeStructureForm((current) => ({
      ...current,
      editingId: policy._id,
      student: "",
      items: Object.fromEntries(feeTypes.map((type) => [type, policy.items.find((item) => item.type === type)?.amount || ""])),
      frequencies: Object.fromEntries(feeTypes.map((type) => [type, policy.items.find((item) => item.type === type)?.frequency || (type === "Admission Fee" ? "admission" : type === "Annual Fee" ? "annual" : type === "Examination Fee" ? "examination" : "monthly")])),
      scholarship: String(policy.scholarship || 0),
      concession: String(policy.concession || 0),
      siblingDiscount: String(policy.siblingDiscount || 0),
    }));
  }
  function copyFeePolicy() {
    setFeeStructureForm((current) => ({ ...current, editingId: "copy", student: "" }));
    setError("Policy copied into the form. Choose another class and save it.");
  }
  async function archiveFeePolicy(id) {
    try { await call(`/fee-structures/${id}`, { method: "DELETE" }); await loadFeeStructures(); setError("Fee policy archived."); }
    catch (error) { setError(error.message); }
  }
  async function createFeeStructure(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const items = feeTypes
        .map((type) => ({
          type,
          amount: Number(feeStructureForm.items[type] || 0),
          frequency: feeStructureForm.frequencies?.[type] || (type === "Admission Fee" ? "admission" : type === "Annual Fee" ? "annual" : type === "Examination Fee" ? "examination" : "monthly"),
        }))
        .filter((item) => item.amount > 0);
      const editingExistingPolicy = feeStructureForm.editingId && feeStructureForm.editingId !== "copy";
      await call(editingExistingPolicy ? `/fee-structures/${feeStructureForm.editingId}` : "/fee-structures", {
        method: editingExistingPolicy ? "PUT" : "POST",
        body: JSON.stringify({
          className: feeStructureForm.className,
          session: feeStructureForm.session,
          student: feeStructureForm.student || null,
          items,
          scholarship: Number(feeStructureForm.scholarship),
          concession: Number(feeStructureForm.concession),
          siblingDiscount: Number(feeStructureForm.siblingDiscount),
        }),
      });
      setFeeStructureForm({
        ...feeStructureForm,
        editingId: "",
        student: "",
        items: Object.fromEntries(feeTypes.map((type) => [type, ""])),
      });
      await loadFeeStructures();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function generateVouchers(payload) {
    setBusy(true);
    try {
      const policy = feeStructures.find((item) => !item.student && item.className === payload.className && item.session === feeStructureForm.session);
      if (!policy) throw new Error("Save a fee policy for this class and session before generating vouchers.");
      const items = policy.items.filter((item) => item.frequency === "monthly" || !item.frequency).map(({ type, amount }) => ({ type, amount }));
      if (!items.length) throw new Error("This policy has no recurring monthly fees.");
      const result = await call("/fees/vouchers/generate", { method: "POST", body: JSON.stringify({ ...payload, items, previousBalance: 0, discount: 0, scholarship: policy.scholarship, concession: policy.concession, siblingDiscount: policy.siblingDiscount, fine: 0, advanceAmount: 0 }) });
      setError(`${result.message}. Created: ${result.createdCount}, already existed: ${result.skippedCount}.`);
      await loadVouchers();
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  async function loadAcademicClasses() {
    try {
      const data = await call("/academic/classes?session=2026-2027");
      setAcademicClasses(data.data);
    } catch (error) {
      setError(error.message);
    }
  }
  async function loadTeacherClasses() {
    try {
      const data = await call("/academic/teacher/classes");
      setTeacherClasses(data.data);
    } catch (error) {
      setError(error.message);
    }
  }
  async function loadStaff() {
    try {
      const data = await call("/staff");
      setStaff(data.data);
    } catch (error) {
      setError(error.message);
    }
  }
  async function deleteStaff(id) {
    if (!window.confirm("Delete this staff profile? This cannot be undone.")) return;
    try {
      await call(`/staff/${id}`, { method: "DELETE" });
      setError("Staff profile deleted successfully.");
      await loadStaff();
    } catch (error) {
      setError(error.message);
    }
  }
  async function createStaff(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const { photoFile, ...staffData } = staffForm;
      const data = await call("/staff", {
        method: "POST",
        body: JSON.stringify({
          ...staffData,
          salary: staffForm.salary ? Number(staffForm.salary) : undefined,
          assignedClasses: staffForm.assignedClasses
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });
      if (photoFile) {
        const body = new FormData();
        body.append("photo", photoFile);
        const response = await fetch(`${API}/staff/${data.data._id}/photo`, {
          method: "POST",
          headers: { Authorization: `Bearer ${session.token}` },
          body,
        });
        const result = await response.json();
        if (!response.ok)
          throw new Error(result.message || "Photo upload failed");
      }
      setShowStaffForm(false);
      setStaffForm({
        employeeId: "",
        name: "",
        category: "Teacher",
        qualification: "",
        subject: "",
        phone: "",
        email: "",
        joiningDate: "",
        salary: "",
        assignedClasses: "",
        status: "Active",
        photoFile: null,
      });
      await loadStaff();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function loadExams() {
    try {
      const data = await call("/exams");
      setExams(data.data);
    } catch (error) {
      setError(error.message);
    }
  }
  async function createExam(event) {
    event.preventDefault();
    setBusy(true);
    try {
      let gradingScale;
      try { gradingScale = JSON.parse(examForm.gradingScale); } catch { throw new Error("Grading scale must be valid JSON"); }
      await call(editingExam ? `/exams/${editingExam._id}` : "/exams", { method: editingExam ? "PATCH" : "POST", body: JSON.stringify({ ...examForm, passingMarks: Number(examForm.passingMarks), gradingScale }) });
      setShowExamForm(false);
      setEditingExam(null);
      await loadExams();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function publishExam(id, published) {
    try {
      await call(`/exams/${id}/publish`, { method: "PATCH", body: JSON.stringify({ published }) });
      await loadExams();
    } catch (error) { setError(error.message); }
  }
  async function saveMarks(event) {
    if (event) event.preventDefault();
    if (!selectedExam) return;
    setBusy(true);
    setMarksSaveState("saving");
    try {
      const subjectText = String(markForm.subject || "").trim();
      const totalMarks = Number(markForm.totalMarks || 0);
      const subjectList = [...new Set(subjectText.split(",").map((item) => item.trim()).filter(Boolean))];

      const multiSubjectEntries = subjectList.length
        ? Object.entries(markForm.entries || {}).reduce((records, [studentId, studentEntries]) => {
            const generalRemark = typeof studentEntries?.generalRemark === "string" ? studentEntries.generalRemark.trim() : "";
            subjectList.forEach((subject) => {
              const subjectEntry = studentEntries?.[subject] || {};
              const obtainedMarks = Number(subjectEntry.obtainedMarks ?? "");
              if (!studentId || !Number.isFinite(obtainedMarks) || obtainedMarks < 0 || subjectEntry.obtainedMarks === "") return;
              records.push({
                student: studentId,
                subject,
                totalMarks,
                obtainedMarks,
                remarks: subjectEntry.remarks ?? generalRemark,
              });
            });
            return records;
          }, [])
        : [];

      const directEntry = markForm.student && markForm.obtainedMarks !== "" && markForm.obtainedMarks !== null
        ? [{
            student: markForm.student,
            subject: subjectText || "",
            totalMarks,
            obtainedMarks: Number(markForm.obtainedMarks),
            remarks: markForm.remarks || "",
          }]
        : [];

      const records = multiSubjectEntries.length ? multiSubjectEntries : directEntry;
      if (!records.length) throw new Error("Add at least one student mark before saving.");
      if (!subjectText) throw new Error("Subject is required to save marks.");
      if (!Number.isFinite(totalMarks) || totalMarks <= 0) throw new Error("Total marks must be greater than zero.");

      await call(`/exams/${selectedExam._id}/marks`, {
        method: "POST",
        body: JSON.stringify({
          subject: subjectList[0] || subjectText,
          totalMarks,
          records,
        }),
      });

      setMarksSaveState("success");
      setMarkForm({
        student: "",
        subject: subjectText,
        totalMarks: String(totalMarks),
        obtainedMarks: "",
        remarks: "",
        entries: {},
      });
      await loadExams();
      await loadResults(selectedExam._id);
      window.setTimeout(() => setMarksSaveState("idle"), 1200);
    } catch (error) {
      setMarksSaveState("error");
      setError(error.message);
      window.setTimeout(() => setMarksSaveState("idle"), 1400);
    } finally {
      setBusy(false);
    }
  }
  async function loadResults(id) {
    try {
      const data = await call(`/exams/${id}/results`);
      setExamResults(data.data);
    } catch (error) {
      setError(error.message);
    }
  }
  async function deleteExam(examId) {
    if (!window.confirm("Delete this examination and all saved marks/results?")) return;
    try {
      await call(`/exams/${examId}`, { method: "DELETE" });
      setError("Examination deleted.");
      setSelectedExam((current) => (current?._id === examId ? null : current));
      setExamResults([]);
      await loadExams();
    } catch (error) {
      setError(error.message);
    }
  }
  async function deleteExamStudentResult(examId, studentId) {
    if (!window.confirm("Delete this student's exam result?")) return;
    try {
      await call(`/exams/${examId}/results/${studentId}`, { method: "DELETE" });
      setError("Student result deleted.");
      await loadResults(examId);
      await loadExams();
    } catch (error) {
      setError(error.message);
    }
  }
  async function loadPortal() {
    try {
      const data = await call("/portal/me");
      setPortalData(data.data);
    } catch (error) {
      setError(error.message);
    }
  }
  async function loadNotices() {
    try {
      const data = await call("/notices");
      setNotices(data.data);
    } catch (error) {
      setError(error.message);
    }
  }
  async function createAcademicClass(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await call("/academic/classes", {
        method: "POST",
        body: JSON.stringify({
          name: classForm.name,
          session: classForm.session,
          subjects: classForm.subjects
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          sections: classForm.sections
            .split(",")
            .map((name) => ({ name: name.trim() }))
            .filter((item) => item.name),
        }),
      });
      setShowClassForm(false);
      setClassForm({ ...classForm, subjects: "", sections: "A" });
      await loadAcademicClasses();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function loadAttendance(date = attendanceDate) {
    try {
      const data = await call(`/attendance?date=${date}`);
      setAttendance(
        Object.fromEntries(
          data.data.map((item) => [item.student?._id, item.status]),
        ),
      );
    } catch (error) {
      setError(error.message);
    }
  }
  async function saveAttendance() {
    setBusy(true);
    try {
      await call("/attendance/bulk", {
        method: "POST",
        body: JSON.stringify({
          date: attendanceDate,
          records: students.map((student) => ({
            studentId: student._id,
            status: attendance[student._id] || "Present",
          })),
        }),
      });
      setError("Attendance saved successfully");
      await loadAttendance();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function recordPayment(id) {
    const amount = window.prompt("Payment amount (Rs)");
    if (!amount) return;
    const paidAt = window.prompt("Payment date (YYYY-MM-DD)", new Date().toISOString().slice(0, 10));
    if (!paidAt) return;
    setBusy(true);
    try {
      const result = await call(`/fees/vouchers/${id}/payments`, {
        method: "POST",
        body: JSON.stringify({ amount: Number(amount), paidAt }),
      });
      setError(`Payment recorded. Receipt ${result.receiptNo}`);
      await loadVouchers();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function downloadVoucherPdf(id) {
    try {
      const response = await fetch(`${API}/fees/vouchers/${id}/pdf`, { headers: { Authorization: `Bearer ${session.token}` } });
      if (!response.ok) throw new Error('Unable to generate voucher PDF');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = `fee-voucher-${id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) { setError(error.message); }
  }
  async function printVoucherPdf(id) {
    try {
      const response = await fetch(`${API}/fees/vouchers/${id}/pdf`, { headers: { Authorization: `Bearer ${session.token}` } });
      if (!response.ok) throw new Error("Unable to generate voucher PDF");
      const popup = window.open(URL.createObjectURL(await response.blob()), "fee-voucher-print");
      if (popup) popup.addEventListener("load", () => popup.print());
    } catch (error) { setError(error.message); }
  }
  async function downloadReceiptPdf(id, receiptNo) {
    try {
      const response = await fetch(`${API}/fees/vouchers/${id}/receipt/${receiptNo}/pdf`, { headers: { Authorization: `Bearer ${session.token}` } });
      if (!response.ok) throw new Error("Unable to generate payment receipt");
      const link = document.createElement("a");
      link.href = URL.createObjectURL(await response.blob());
      link.download = `${receiptNo}.pdf`;
      link.click();
    } catch (error) { setError(error.message); }
  }
  async function createVoucher(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const items = [
        { type: "Monthly Tuition Fee", amount: Number(voucherForm.tuition) },
        { type: "Computer Fee", amount: Number(voucherForm.computer) },
        { type: "Admission Fee", amount: Number(voucherForm.admission) },
        { type: "Annual Fee", amount: Number(voucherForm.annual) },
        { type: "Examination Fee", amount: Number(voucherForm.examination) },
        { type: "Transport Fee", amount: Number(voucherForm.transport) },
        { type: "Fine", amount: Number(voucherForm.fine) },
        { type: "Other Charges", amount: Number(voucherForm.other) },
      ].filter((item) => item.amount > 0);
      await call("/fees/vouchers", {
        method: "POST",
        body: JSON.stringify({
          studentId: voucherForm.studentId,
          feeMonth: voucherForm.feeMonth,
          dueDate: voucherForm.dueDate,
          items,
          previousBalance: Number(voucherForm.previousBalance),
          discount: Number(voucherForm.discount),
          scholarship: Number(voucherForm.scholarship),
          concession: Number(voucherForm.concession),
          siblingDiscount: Number(voucherForm.siblingDiscount),
          advanceAmount: Number(voucherForm.advanceAmount),
        }),
      });
      setShowVoucherForm(false);
      await loadVouchers();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function addStudent(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const {
        photoFile,
        guardianName,
        guardianRelation,
        guardianPhone,
        guardianCnic,
        ...studentForm
      } = form;
      const data = await call("/students", {
        method: "POST",
        body: JSON.stringify({
          ...studentForm,
          rollNo: form.rollNo ? Number(form.rollNo) : undefined,
          guardianInfo:
            guardianName || guardianPhone || guardianCnic
              ? {
                  name: guardianName,
                  relation: guardianRelation,
                  phone: guardianPhone,
                  cnic: guardianCnic,
                }
              : undefined,
        }),
      });
      if (photoFile) await uploadStudentPhoto(data.data._id, photoFile);
      setError(data.message || "Applicant created. Accountant voucher and full payment are required for registration.");
      setForm(blankStudent);
      setView("students");
      await loadStudents();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  function logout() {
    localStorage.removeItem("schoolSession");
    setSession(null);
    setSelectedLoginRole(null);
    setMobileSidebarOpen(false);
  }
  if (!session && !selectedLoginRole)
    return <RoleSelection onSelect={setSelectedLoginRole} />;
  if (!session)
    return (
      <Login
        onLogin={login}
        onPasswordChange={changePasswordFromLogin}
        busy={busy}
        error={error}
        role={selectedLoginRole}
        back={() => { setSelectedLoginRole(null); setError(""); }}
      />
    );
  const admin = ["super_admin", "school_admin"].includes(session.user.role);
  const accountant = session.user.role === "accountant";
  const nav = navigationFor(session.user.role);
  if (view === "student-profile" && selectedStudent)
    return (
      <StudentProfile
        student={selectedStudent}
        admin={admin}
        busy={busy}
        uploadPhoto={uploadStudentPhoto}
        move={moveStudent}
        back={() => setView("students")}
      />
    );
  return (
    <div className="app-shell">
      <div
        className={`sidebar-backdrop ${mobileSidebarOpen ? "visible" : ""}`}
        onClick={() => setMobileSidebarOpen(false)}
      />
      <aside className={`sidebar ${mobileSidebarOpen ? "mobile-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">E</span>
          <span className="brand-name">EduGrid</span>
        </div>
        <div className="school-label">
          SMART LEARNING<span>2026 / 27</span>
        </div>
        <nav>
          {nav.map((item) => (
            <button
              className={view === item.id ? "nav-item active" : "nav-item"}
              onClick={() => {
                setView(item.id);
                setMobileSidebarOpen(false);
              }}
              key={item.id}
            >
              <i>{item.icon}</i>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={logout}>
            <i>↪</i>Sign out
          </button>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <button
            type="button"
            className="mobile-menu-button"
            aria-label="Toggle sidebar menu"
            onClick={() => setMobileSidebarOpen((open) => !open)}
          >
            ☰
          </button>
          <div className="topbar-context">
            <span className="topbar-kicker">EDUGRID / 2026-27</span>
            <strong>{nav.find((item) => item.id === view)?.label || "Overview"}</strong>
          </div>
          <div className="topbar-actions">
            <span className="workspace-status"><i /> Live workspace</span>
            <button className="topbar-icon-button" type="button" title="Notifications">◌</button>
          </div>
          <div className="profile">
            <div className="avatar">{session.user.name?.[0]}</div>
            <div>
              <strong>{session.user.name}</strong>
              <small>{roles[session.user.role]}</small>
              <small className="login-status">
                Last login: {session.user.lastLoginAt ? new Date(session.user.lastLoginAt).toLocaleString() : 'Not available'}
              </small>
            </div>
          </div>
        </header>
        <section className="page-content">
          {error && (
            <div className="notice">
              {error}
              <button onClick={() => setError("")}>Dismiss</button>
            </div>
          )}
          {view === "overview" && (portalData && ["parent", "student"].includes(session.user.role) ? <ParentPortal user={session.user} data={portalData} notices={notices} token={session.token} /> : session.user.role === "teacher" ? <TeacherPortal data={teacherClasses} notices={notices} go={setView} /> : admin || accountant ? <AdminDashboard call={call} go={setView} isAccountant={accountant} canReset={session.user.role === "super_admin"} /> : <Overview user={session.user} count={students.length} go={setView} />)}
          {view === "admissions" && accountant && <AdminDashboard call={call} go={setView} isAccountant compactMode="applications" />}
          {view === "portal-results" && <OnlineResults call={call} />}
          {view === "reports" && <ReportsModule call={call} token={session.token} role={session.user.role} />}
          {view === "notices" && <NoticesPage call={call} admin={admin || session.user.role === "teacher"} canDelete={admin || session.user.role === "teacher"} />}
          {view === "students" && (
            <Students
              data={students}
              query={query}
              setQuery={setQuery}
              search={() => loadStudents(query)}
              go={setView}
              busy={busy}
              canDelete={admin}
            />
          )}
          {view === "admission" && admin && (
            <Admission
              form={form}
              setForm={setForm}
              submit={addStudent}
              busy={busy}
            />
          )}
          {view === "academics" && admin && (
            <Academics
              data={academicClasses}
              showForm={showClassForm}
              setShowForm={setShowClassForm}
              form={classForm}
              setForm={setClassForm}
              submit={createAcademicClass}
              deleteClass={async (id) => {
                if (!window.confirm("Delete this class and all its sections?")) return;
                try {
                  await call(`/academic/classes/${id}`, { method: "DELETE" });
                  await loadAcademicClasses();
                  setError("Class deleted successfully.");
                } catch (requestError) {
                  setError(requestError.message);
                }
              }}
              busy={busy}
            />
          )}
          {view === "staff" && admin && (
            <StaffPage
              data={staff}
              showForm={showStaffForm}
              setShowForm={setShowStaffForm}
              form={staffForm}
              setForm={setStaffForm}
              submit={createStaff}
              busy={busy}
              deleteStaff={deleteStaff}
            />
          )}
          {view === "attendance" && (
            <Attendance
              data={students}
              records={attendance}
              setRecords={setAttendance}
              date={attendanceDate}
              setDate={setAttendanceDate}
              reload={loadAttendance}
              save={saveAttendance}
              busy={busy}
            />
          )}
          {view === "fees" && (
            <>
              <FeeManagement
                structures={feeStructures}
                students={students}
                form={feeStructureForm}
                setForm={setFeeStructureForm}
                submit={createFeeStructure}
                generate={generateVouchers}
                selectPolicy={selectFeePolicy}
                copyPolicy={copyFeePolicy}
                archivePolicy={archiveFeePolicy}
                busy={busy}
              />
              <FeeLedgerLegacy
                data={vouchers}
                students={students}
                refresh={loadVouchers}
                search={loadVouchers}
                pay={recordPayment}
                create={createVoucher}
                form={voucherForm}
                setForm={setVoucherForm}
                showForm={showVoucherForm}
                setShowForm={setShowVoucherForm}
                busy={busy}
                downloadPdf={downloadVoucherPdf}
                              printPdf={printVoucherPdf}
                              downloadReceipt={downloadReceiptPdf}
              />
            </>
          )}
          {view === "results" && (
            <Exams
              data={exams}
              students={students}
              selected={selectedExam}
              setSelected={setSelectedExam}
              marks={markForm}
              setMarks={setMarkForm}
              results={examResults}
              loadResults={loadResults}
              showForm={showExamForm}
              setShowForm={setShowExamForm}
              form={examForm}
              setForm={setExamForm}
              submit={createExam}
              saveMarks={saveMarks}
              busy={busy}
              role={session.user.role}
              editing={editingExam}
              setEditing={setEditingExam}
              publish={publishExam}
              deleteExam={deleteExam}
              deleteResult={deleteExamStudentResult}
              marksSaveState={marksSaveState}
              setMarksSaveState={setMarksSaveState}
            />
          )}
          {view === "report" && (
            <ReportCard exams={exams} students={students} call={call} token={session.token} go={setView} />
          )}
        </section>
      </main>
    </div>
  );
}

function ReportsPage({ call, token }) {
  const [type, setType] = useState("students");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const feeReports = ["daily-collection", "monthly-collection", "class-collection", "student-history", "pending-fees", "defaulters", "discounts", "fine-collection"];
  const reportPath = feeReports.includes(type) ? `/reports/fee/${type}` : `/reports/${type}`;
  async function load() {
    setLoading(true);
    try {
      const data = await call(reportPath);
      setRows(data.data);
    } finally {
      setLoading(false);
    }
  }
  async function download(format) {
const response = await fetch(`${API}${reportPath}?format=${format}`, {...
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(await response.blob());
    anchor.download = `${type}-report.${format}`;
    anchor.click();
  }
  return (
    <div className="standalone-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">REPORTS / EXPORTS</span>
          <h1>Reports</h1>
          <p>
            Download operational data for Excel or review it before printing.
          </p>
        </div>
        <div className="heading-actions">
          <button className="secondary-button" onClick={load}>
            {loading ? "Loading..." : "Preview"}
          </button>
          <button className="secondary-button" onClick={() => download("csv")}>
            CSV
          </button>
          <button className="primary-button" onClick={() => download("xlsx")}>
            Excel .xlsx
          </button>
        </div>
      </div>
      <div className="report-tabs">
        {["students", "fees", "attendance", "results", ...feeReports].map((item) => (
          <button
            className={type === item ? "active" : ""}
            onClick={() => setType(item)}
            key={item}
          >
            {item}
          </button>
        ))}
      </div>
      <section className="panel table-panel">
        {rows.length === 0 ? (
          <div className="empty-state">
            <h3>No preview loaded</h3>
            <p>Select a report and click Preview.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {Object.keys(rows[0]).map((key) => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index}>
                    {Object.keys(rows[0]).map((key) => (
                      <td key={key}>{String(row[key] ?? "—")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
function NoticesPage({ call, admin, canDelete = false }) {
  const [data, setData] = useState([]);
  const [form, setForm] = useState({ title: "", body: "", category: "Notice" });
  const [message, setMessage] = useState("");
  async function load() {
    const response = await call("/notices");
    setData(response.data);
  }
  useEffect(() => {
    load();
  }, []);
  async function publish(event) {
    event.preventDefault();
    await call("/notices", {
      method: "POST",
      body: JSON.stringify({ ...form, audience: ["all"] }),
    });
    setForm({ title: "", body: "", category: "Notice" });
    setMessage("Published successfully");
    await load();
  }
  async function removeNotice(id) {
    if (!window.confirm("Delete this notice or homework permanently?")) return;
    try {
      await call(`/notices/${id}`, { method: "DELETE" });
      setData((current) => current.filter((item) => item._id !== id));
    } catch (error) {
      setMessage(error.message);
    }
  }
  return (
    <div className="standalone-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">SCHOOL COMMUNICATION</span>
          <h1>Notices & homework</h1>
          <p>Keep families, students and teachers informed.</p>
        </div>
      </div>
      {admin && (
        <form className="panel notice-form" onSubmit={publish}>
          <div className="form-grid">
            <label>
              Title
              <input
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
                required
              />
            </label>
            <label>
              Category
              <select
                value={form.category}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value })
                }
              >
                <option>Notice</option>
                <option>Homework</option>
                <option>Event</option>
              </select>
            </label>
            <label className="full-field">
              Message
              <textarea
                value={form.body}
                onChange={(event) =>
                  setForm({ ...form, body: event.target.value })
                }
                required
                rows="3"
              />
            </label>
          </div>
          <div className="form-actions">
            <button className="primary-button">Publish notice →</button>
          </div>
          {message && <div className="notice">{message}</div>}
        </form>
      )}
      <section className="notice-list">
        {data.length === 0 ? (
          <div className="panel empty-state">
            <h3>No published notices</h3>
            <p>New school notices will appear here.</p>
          </div>
        ) : (
          data.map((item) => (
            <article className="panel notice-card" key={item._id}>
              <span className="eyebrow">{item.category}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <small>{new Date(item.publishedAt).toLocaleDateString()}</small>
              {canDelete && <button type="button" className="danger-button small-button" onClick={() => removeNotice(item._id)}>Delete</button>}
            </article>
          ))
        )}
      </section>
    </div>
  );
}

function RoleSelection({ onSelect }) {
  const accountDescriptions = {
    super_admin: "Full system control",
    school_admin: "School operations and approvals",
    accountant: "Fees, vouchers and payments",
    teacher: "Attendance, exams and marks",
    student: "Personal portal and results",
    parent: "Linked children portal",
  };
  return (
    <main className="role-selection-page">
      <div className="role-selection-shell">
        <div className="role-selection-intro">
          <div className="brand dark"><span className="brand-mark">E</span><span className="brand-name">EduGrid</span></div>
          <span className="eyebrow">EDUGRID · SECURE PORTAL</span>
          <h1>Welcome to EduGrid</h1>
          <p>Choose your portal to continue to the school management system.</p>
        </div>
        <div className="role-selection-divider"><span>SELECT YOUR PORTAL</span></div>
        <div className="role-selection-grid">
          {Object.entries(roles).map(([role, label]) => (
            <button type="button" className="role-selection-card" onClick={() => onSelect(role)} key={role}>
              <span className="role-selection-icon">{label.charAt(0)}</span>
              <strong>{label}</strong>
              <small>{accountDescriptions[role]}</small>
              <span className="role-selection-arrow">Enter portal <b>→</b></span>
            </button>
          ))}
        </div>
        <small className="role-selection-footer">Your account permissions are applied automatically after login.</small>
      </div>
    </main>
  );
}


function PasswordChangePrompt({ user, onChange, onSkip, error }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const passwordStrength = newPassword.length >= 12 ? 'Strong password' : newPassword.length >= 8 ? 'Good password' : newPassword.length >= 6 ? 'Basic password' : 'Minimum 6 characters';

  function submit(event) {
    event.preventDefault();
    if (!currentPassword.trim() || !newPassword.trim()) {
      setLocalError('Current and new password are required.');
      return;
    }
    if (newPassword.length < 6) {
      setLocalError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setLocalError('New password and confirm password do not match.');
      return;
    }
    setLocalError('');
    onChange(currentPassword, newPassword);
  }

  return (
    <main className="password-change-page">
      <form className="password-change-card" onSubmit={submit}>
        <div className="brand dark"><span className="brand-mark">E</span><span className="brand-name">EduGrid</span></div>
        <span className="eyebrow">ACCOUNT SECURITY</span>
        <h1>Protect your account</h1>
        <p>Welcome, {user.name}. Use letters, numbers, symbols, hyphens, or any combination. Only the six-character minimum is required.</p>
        <label className="auth-field">
          Current password
            <input autoComplete="current-password" type={showPasswords ? 'text' : 'password'} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Enter current password" required />
        </label>
        <label className="auth-field">
          New password
            <input autoComplete="new-password" type={showPasswords ? 'text' : 'password'} minLength="6" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="At least 6 characters" required />
        </label>
        <label className="auth-field">
          Confirm new password
          <input autoComplete="new-password" type={showPasswords ? 'text' : 'password'} minLength="6" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Re-enter new password" required />
        </label>
        <small className="password-hint">{newPassword ? passwordStrength : 'Letters-only passwords are allowed.'}</small>
        <button type="button" className="text-button" onClick={() => setShowPasswords((current) => !current)}>
          {showPasswords ? 'Hide passwords' : 'Show passwords'}
        </button>
        {(localError || error) && <div className="form-error">{localError || error}</div>}
        <div className="form-actions">
          <button type="button" className="secondary-button" onClick={onSkip}>Skip for now</button>
          <button className="primary-button">Update password →</button>
        </div>
      </form>
    </main>
  );
}
 
function Login({ onLogin, busy, error, role, back, onPasswordChange }) {
  const [email, setEmail] = useState(demoAccounts[role] || "");
  const [password, setPassword] = useState("");
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inlineError, setInlineError] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showChangePasswords, setShowChangePasswords] = useState(false);
  const identifierLabel = {
    super_admin: 'Email',
    school_admin: 'Email',
    accountant: 'Email',
    teacher: 'Name',
    student: 'Admission Number',
    parent: 'Parent Phone Number',
  }[role] || 'Login identifier';
  const identifierPlaceholder = {
    super_admin: '',
    school_admin: '',
    accountant: '',
    teacher: '',
    student: '',
    parent: '',
  }[role] || 'Enter credential';
  return (
    <main className="login-page">
      <div className="login-art">
        <span className="eyebrow">EDUGRID</span>
        <h1>Make every school day count.</h1>
        <p>
          A calm command center for the people, progress and possibilities that
          make your school move.
        </p>
        <span className="art-stamp">EST. 2012</span>
      </div>
      <div className="login-panel">
        <div className="brand dark">
          <span className="brand-mark">E</span><span className="brand-name">EduGrid</span>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onLogin(email, password);
          }}
        >
          <button type="button" className="login-back" onClick={back}>← Choose another user</button>
          <span className="eyebrow">{roles[role]} LOGIN</span>
          <h2>Login as {roles[role]}</h2>
          <p>Enter the password for this school account to continue.</p>
          <label className="auth-field">
            {identifierLabel}
            <input
              autoComplete="username"
              type="text"
              value={email}
              placeholder={identifierPlaceholder}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="auth-field">
            Password
            <input autoComplete="current-password" type={showLoginPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          <button type="button" className="text-button" onClick={() => setShowLoginPassword((current) => !current)}>
            {showLoginPassword ? "Hide password" : "Show password"}
          </button>
          <div className="login-password-change-wrap">
            <button type="button" className="text-button" onClick={() => setShowPasswordChange((current) => !current)}>
              {showPasswordChange ? 'Hide password change' : 'Change password'}
            </button>
            {showPasswordChange && (
              <div className="password-change-inline">
                <input autoComplete="current-password" type={showChangePasswords ? "text" : "password"} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Current password" required />
                <input autoComplete="new-password" type={showChangePasswords ? "text" : "password"} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="New password" minLength="6" required />
                <input autoComplete="new-password" type={showChangePasswords ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm password" minLength="6" required />
                <small className="password-hint">Use letters, numbers, symbols, or hyphens. No special combination is required.</small>
                <button type="button" className="text-button" onClick={() => setShowChangePasswords((current) => !current)}>
                  {showChangePasswords ? "Hide passwords" : "Show passwords"}
                </button>
                <button type="button" className="secondary-button" disabled={busy} onClick={() => {
                  if (!currentPassword.trim() || !newPassword.trim()) {
                    setInlineError('Current and new password are required.');
                    return;
                  }
                  if (newPassword.length < 6) {
                    setInlineError('New password must be at least 6 characters.');
                    return;
                  }
                  if (newPassword !== confirmPassword) {
                    setInlineError('New password and confirm password do not match.');
                    return;
                  }
                  setInlineError('');
                  onPasswordChange(email, currentPassword, newPassword, role);
                }}>Update password</button>
              </div>
            )}
          </div>
          {(error || inlineError) && <div className="form-error">{error || inlineError}</div>}
          <button className="primary-button" disabled={busy}>
            {busy ? "Logging in..." : "Login"} <b>→</b>
          </button>
        </form>
      </div>
    </main>
  );
}
function AdmissionApplicationForm({ close }) {
  const [form, setForm] = useState({
    studentName: "",
    fatherName: "",
    dateOfBirth: "",
    gender: "Male",
    classApplying: "Class 1",
    phone: "",
    email: "",
    address: "",
    previousSchool: "",
    bForm: "",
  });
  const [message, setMessage] = useState("");
  const update = (key, value) => setForm({ ...form, [key]: value });
  async function submit(event) {
    event.preventDefault();
    const response = await fetch("${API}/admissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    setMessage(
      response.ok
        ? data.message
        : data.message || "Unable to submit application",
    );
  }
  return (
    <div className="admission-modal">
      <form className="panel admission-form" onSubmit={submit}>
        <button type="button" className="modal-close" onClick={close}>
          ×
        </button>
        <span className="eyebrow">ADMISSIONS / 2026-27</span>
        <h2>Start an application</h2>
        <div className="form-grid">
          <Field
            label="Student name"
            value={form.studentName}
            set={(value) => update("studentName", value)}
            required
          />
          <Field
            label="Father / guardian name"
            value={form.fatherName}
            set={(value) => update("fatherName", value)}
            required
          />
          <Field
            label="Date of birth"
            type="date"
            value={form.dateOfBirth}
            set={(value) => update("dateOfBirth", value)}
            required
          />
          <Field
            label="Class applying"
            type="select"
            value={form.classApplying}
            set={(value) => update("classApplying", value)}
            options={classes}
          />
          <Field
            label="Phone"
            value={form.phone}
            set={(value) => update("phone", value)}
            required
          />
          <Field
            label="Email"
            type="email"
            value={form.email}
            set={(value) => update("email", value)}
          />
          <label>
            Gender
            <select
              value={form.gender}
              onChange={(event) => update("gender", event.target.value)}
            >
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </label>
          <Field
            label="B-Form / CNIC"
            value={form.bForm}
            set={(value) => update("bForm", value)}
          />
          <label className="full-field">
            Address
            <textarea
              value={form.address}
              onChange={(event) => update("address", event.target.value)}
              required
              rows="3"
            />
          </label>
        </div>
        {message && <div className="notice">{message}</div>}
        <div className="form-actions">
          <button type="button" className="secondary-button" onClick={close}>
            Close
          </button>
          <button className="primary-button">Submit application →</button>
        </div>
      </form>
    </div>
  );
}
function Overview({ user, count, go }) {
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">MONDAY, 05 SEPTEMBER 2026</span>
          <h1>Good morning, {user.name?.split(" ")[0]}.</h1>
          <p>Here is the pulse of your school today.</p>
        </div>
        <button className="primary-button" onClick={() => go("admission")}>
          + Add student
        </button>
      </div>
      <div className="stat-grid">
        <Stat label="Total students" value={count} tone="blue" />
        <Stat label="Today's attendance" value="94.2%" tone="mint" />
        <Stat label="Pending fees" value="Rs 84,500" tone="gold" />
        <Stat label="Monthly collection" value="Rs 1.28m" tone="rose" />
      </div>
      <div className="dashboard-grid">
        <section className="panel welcome">
          <span className="eyebrow">SCHOOL NOTE</span>
          <h2>Build a brighter day.</h2>
          <p>
            Keep your student records current and your whole team stays a step
            ahead.
          </p>
          <button className="text-button" onClick={() => go("students")}>
            Open student register →
          </button>
        </section>
        <section className="panel activity">
          <span className="eyebrow">RECENT ACTIVITY</span>
          <h2>What is happening</h2>
          <Activity
            title="Student register synced"
            detail="Your records are up to date"
          />
          <Activity
            title="Fee collection recorded"
            detail="12 payments received today"
          />
          <Activity
            title="Results workspace ready"
            detail="Final term setup is pending"
          />
        </section>
      </div>
    </>
  );
}
function OnlineResults({ call }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  async function search(event) {
    event.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setMessage("");
    try { const data = await call(`/portal/results/search?q=${encodeURIComponent(query.trim())}`); setResults(data.data); if (!data.data.length) setMessage("No published results found"); }
    catch (error) { setMessage(error.message); }
    finally { setLoading(false); }
  }
  return <div className="standalone-page"><div className="page-heading"><div><span className="eyebrow">STUDENT / PARENT PORTAL</span><h1>Online results</h1><p>Search by roll number, admission number, or student name.</p></div></div><form className="panel result-search-form" onSubmit={search}><div className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Roll no., admission no., or student name" /><button className="primary-button">{loading ? "Searching..." : "Search"}</button></div></form>{message && <div className="notice">{message}</div>}<section className="portal-result-list">{results.map((result) => <article className="panel portal-result-card" key={`${result.exam.id}-${result.student._id}`}><div className="result-heading"><div><span className="eyebrow">{result.exam.name} · {result.exam.session}</span><h2>{result.student.name}</h2><p>Father: {result.student.fatherName || "—"} · Admission: {result.student.admissionNo} · Class: {result.student.class} · Section: {result.student.section || "—"} · Roll: {result.student.rollNo || "—"}</p></div><span className="status-pill">Position {result.position}</span></div><div className="result-summary"><strong>{result.obtainedMarks} / {result.totalMarks}</strong><span>{result.percentage}%</span><span>{result.grade}</span><span>{result.passed ? "Passed" : "Failed"}</span></div><div className="table-wrap"><table><thead><tr><th>Subject</th><th>Total marks</th><th>Obtained</th><th>Remarks</th></tr></thead><tbody>{result.subjects.map((mark) => <tr key={mark._id}><td>{mark.subject}</td><td>{mark.totalMarks}</td><td>{mark.obtainedMarks}</td><td>{mark.remarks || "—"}</td></tr>)}</tbody></table></div>{result.remarks.length > 0 && <p className="result-remarks"><strong>Remarks:</strong> {result.remarks.join(" · ")}</p>}</article>)}</section></div>
}
function PortalHome({ user, data }) {
  const childCount = data.students.length;
  const pending = data.fees.filter((fee) => fee.status !== "Paid").length;
  const attendanceCount = data.attendance.filter(
    (item) => item.status === "Present",
  ).length;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {user.role === "parent" ? "PARENT PORTAL" : "STUDENT PORTAL"}
          </span>
          <h1>Welcome, {user.name?.split(" ")[0]}.</h1>
          <p>
            Your school information, attendance, fees and results in one place.
          </p>
        </div>
      </div>
      <div className="stat-grid">
        <Stat label="Linked students" value={childCount} tone="blue" />
        <Stat label="Present records" value={attendanceCount} tone="mint" />
        <Stat label="Pending vouchers" value={pending} tone="gold" />
        <Stat
          label="Results available"
          value={data.results.length}
          tone="rose"
        />
      </div>
      <section className="panel table-panel">
        <div className="table-toolbar">
          <strong>
            {user.role === "parent" ? "My children" : "My profile"}
          </strong>
          <span>{childCount} linked records</span>
        </div>
        {childCount === 0 ? (
          <div className="empty-state">
            <h3>No student linked yet</h3>
            <p>
              Please ask the school administrator to link your portal account to
              a student record.
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Admission no.</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.students.map((student) => (
                  <tr key={student._id}>
                    <td>
                      <div className="student-cell">
                        <div className="table-avatar">{student.name[0]}</div>
                        <strong>{student.name}</strong>
                      </div>
                    </td>
                    <td>{student.admissionNo}</td>
                    <td>{student.class}</td>
                    <td>{student.section || "—"}</td>
                    <td>
                      <span className="status-pill">{student.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
function Stat({ label, value, tone }) {
  return (
    <div className={`stat-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>Live from records</small>
    </div>
  );
}
function Activity({ title, detail }) {
  return (
    <div className="activity">
      <b>●</b>
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
      <small>Today</small>
    </div>
  );
}
function Students({ data, query, setQuery, search, go, busy, canDelete = false }) {
  const [profile, setProfile] = useState(null);
  const [action, setAction] = useState("");
  const [form, setForm] = useState({
    status: "Active",
    toClass: "Class 2",
    toSection: "A",
    destinationSchool: "",
    note: "",
  });
  const token = JSON.parse(
    localStorage.getItem("schoolSession") || "null",
  )?.token;
  async function updateStudent(payload) {
    const response = await fetch(
      `${API}/students/${profile._id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      },
    );
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.message || "Unable to update student");
    setProfile(result.data);
    setAction("");
    search();
  }
  async function move(type) {
    const response = await fetch(
      `${API}/students/${profile._id}/${type}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(
          type === "promote"
            ? {
                toClass: form.toClass,
                toSection: form.toSection,
                note: form.note,
              }
            : { destinationSchool: form.destinationSchool, note: form.note },
        ),
      },
    );
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.message || "Unable to move student");
    setProfile(result.data.student);
    setAction("");
    search();
  }
  async function uploadPhoto(event) {
    const body = new FormData();
    body.append("photo", event.target.files[0]);
    const response = await fetch(
      `${API}/students/${profile._id}/photo`,
      { method: "POST", headers: { Authorization: `Bearer ${token}` }, body },
    );
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.message || "Unable to upload photo");
    setProfile({ ...profile, photo: result.data.photo });
    search();
  }
  async function deleteCurrentStudent() {
    if (!window.confirm("Delete this student and their profile permanently?")) return;
    const response = await fetch(`${API}/students/${profile._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Unable to delete student");
    setProfile(null);
    search();
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">PEOPLE / REGISTER</span>
          <h1>Student register</h1>
          <p>Search and manage every enrolled learner.</p>
        </div>
        <button className="primary-button" onClick={() => go("admission")}>
          + Add student
        </button>
      </div>
      <section className="panel table-panel">
        <div className="table-toolbar">
          <div className="search-box">
            ⌕
            <input
              placeholder="Search by name, admission no. or phone"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && search()}
            />
            <button onClick={search}>Search</button>
          </div>
          <span>{data.length} records</span>
        </div>
        {busy ? (
          <div className="empty-state">Loading students...</div>
        ) : data.length === 0 ? (
          <div className="empty-state">
            <h3>No students found</h3>
            <p>Try another search or add the first student record.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Admission no.</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Status</th>
                  <th>Profile</th>
                </tr>
              </thead>
              <tbody>
                {data.map((student) => (
                  <tr key={student._id}>
                    <td>
                      <div className="student-cell">
                        {student.photo ? (
                          <img
                            className="table-avatar"
                            src={student.photo}
                            alt=""
                          />
                        ) : (
                          <div className="table-avatar">{student.name[0]}</div>
                        )}
                        <div>
                          <strong>{student.name}</strong>
                          <small>{student.fatherName}</small>
                        </div>
                      </div>
                    </td>
                    <td>{student.admissionNo}</td>
                    <td>{student.class}</td>
                    <td>{student.section || "—"}</td>
                    <td>
                      <span className="status-pill">{student.status}</span>
                    </td>
                    <td>
                      <button
                        className="table-action"
                        onClick={() => setProfile(student)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {profile && (
        <section className="panel student-profile">
          <div className="profile-heading">
            <div>
              {profile.photo ? (
                <img className="profile-photo" src={profile.photo} alt="" />
              ) : (
                <div className="profile-photo placeholder">
                  {profile.name[0]}
                </div>
              )}
              <div>
                <span className="eyebrow">STUDENT PROFILE</span>
                <h2>{profile.name}</h2>
                <p>
                  {profile.admissionNo} · {profile.class} · Section{" "}
                  {profile.section || "—"}
                </p>
              </div>
            </div>
            <button
              className="secondary-button"
              onClick={() => setProfile(null)}
            >
              Close
            </button>
          </div>
          <div className="profile-grid">
            <div>
              <strong>Father / guardian</strong>
              <span>{profile.fatherName}</span>
            </div>
            <div>
              <strong>Phone</strong>
              <span>{profile.phone}</span>
            </div>
            <div>
              <strong>Date of birth</strong>
              <span>
                {profile.dateOfBirth
                  ? new Date(profile.dateOfBirth).toLocaleDateString()
                  : "—"}
              </span>
            </div>
            <div>
              <strong>CNIC / B-Form</strong>
              <span>{profile.cnic || profile.bForm || "—"}</span>
            </div>
            <div>
              <strong>Previous school</strong>
              <span>{profile.previousSchool || "—"}</span>
            </div>
            <div>
              <strong>Status</strong>
              <select
                value={form.status}
                onChange={(event) =>
                  setForm({ ...form, status: event.target.value })
                }
              >
                <option>Active</option>
                <option>Left</option>
                <option>Passed Out</option>
              </select>
            </div>
          </div>
          <div className="profile-actions">
            <label className="secondary-button">
              Replace photo
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={uploadPhoto}
                hidden
              />
            </label>
            <button
              className="secondary-button"
              onClick={() => updateStudent({ status: form.status })}
            >
              Save status
            </button>
            <button
              className="secondary-button"
              onClick={() => setAction("promote")}
            >
              Promote
            </button>
            <button
              className="secondary-button"
              onClick={() => setAction("transfer")}
            >
              Transfer
            </button>
            {canDelete && <button className="danger-button" onClick={deleteCurrentStudent}>Delete student</button>}
          </div>
          {action === "promote" && (
            <div className="movement-form">
              <h3>Promote student</h3>
              <div className="form-grid">
                <label>
                  Next class
                  <select
                    value={form.toClass}
                    onChange={(event) =>
                      setForm({ ...form, toClass: event.target.value })
                    }
                  >
                    {classes.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Section
                  <input
                    value={form.toSection}
                    onChange={(event) =>
                      setForm({ ...form, toSection: event.target.value })
                    }
                  />
                </label>
                <label className="full-field">
                  Note
                  <textarea
                    value={form.note}
                    onChange={(event) =>
                      setForm({ ...form, note: event.target.value })
                    }
                  />
                </label>
              </div>
              <button
                className="primary-button"
                onClick={() => move("promote")}
              >
                Confirm promotion
              </button>
            </div>
          )}
          {action === "transfer" && (
            <div className="movement-form">
              <h3>Transfer student</h3>
              <div className="form-grid">
                <label>
                  Destination school
                  <input
                    value={form.destinationSchool}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        destinationSchool: event.target.value,
                      })
                    }
                    required
                  />
                </label>
                <label className="full-field">
                  Note
                  <textarea
                    value={form.note}
                    onChange={(event) =>
                      setForm({ ...form, note: event.target.value })
                    }
                  />
                </label>
              </div>
              <button
                className="primary-button"
                onClick={() => move("transfer")}
              >
                Confirm transfer
              </button>
            </div>
          )}
        </section>
      )}
    </>
  );
}
function Admission({ form, setForm, submit, busy }) {
  const update = (key, value) => setForm({ ...form, [key]: value });
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">PEOPLE / ADMISSION</span>
          <h1>New admission</h1>
          <p>
            Create an applicant. Registration starts after accountant voucher payment.
          </p>
        </div>
      </div>
      <form className="panel admission-form" onSubmit={submit}>
        <div className="form-section">
          <div>
            <h3>Student details</h3>
            <p>Basic information for the new learner.</p>
          </div>
          <div className="form-grid">
            <Field
              label="Student name"
              value={form.name}
              set={(value) => update("name", value)}
              required
            />
            <Field
              label="Father / guardian name"
              value={form.fatherName}
              set={(value) => update("fatherName", value)}
              required
            />
            <Field
              label="Mother name"
              value={form.motherName}
              set={(value) => update("motherName", value)}
            />
            <Field
              label="Date of birth"
              type="date"
              value={form.dateOfBirth}
              set={(value) => update("dateOfBirth", value)}
              required
            />
            <Field
              label="Phone number"
              value={form.phone}
              set={(value) => update("phone", value)}
              required
            />
            <Field
              label="Gender"
              type="select"
              value={form.gender}
              set={(value) => update("gender", value)}
              options={["Male", "Female", "Other"]}
            />
            <Field
              label="Class"
              type="select"
              value={form.class}
              set={(value) => update("class", value)}
              options={classes}
            />
            <Field
              label="Section"
              value={form.section}
              set={(value) => update("section", value)}
            />
            <Field
              label="Roll number"
              type="number"
              value={form.rollNo}
              set={(value) => update("rollNo", value)}
            />
            <Field
              label="CNIC"
              value={form.cnic}
              set={(value) => update("cnic", value)}
            />
            <Field
              label="B-Form"
              value={form.bForm}
              set={(value) => update("bForm", value)}
            />
            <Field
              label="Previous school"
              value={form.previousSchool}
              set={(value) => update("previousSchool", value)}
            />
            <label>
              Student photo <small>Optional, JPG/PNG/WebP up to 5 MB</small>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) =>
                  update("photoFile", event.target.files[0] || null)
                }
              />
            </label>
          </div>
        </div>
        <div className="form-section">
          <div>
            <h3>Guardian details</h3>
            <p>Use these details when the guardian is not the father.</p>
          </div>
          <div className="form-grid">
            <Field
              label="Guardian name"
              value={form.guardianName}
              set={(value) => update("guardianName", value)}
            />
            <Field
              label="Relationship"
              value={form.guardianRelation}
              set={(value) => update("guardianRelation", value)}
            />
            <Field
              label="Guardian phone"
              value={form.guardianPhone}
              set={(value) => update("guardianPhone", value)}
            />
            <Field
              label="Guardian CNIC"
              value={form.guardianCnic}
              set={(value) => update("guardianCnic", value)}
            />
          </div>
        </div>
        <div className="form-section">
          <div>
            <h3>Contact details</h3>
            <p>Where the school can reach the family.</p>
          </div>
          <label className="full-field">
            Home address
            <textarea
              value={form.address}
              onChange={(event) => update("address", event.target.value)}
              required
              rows="3"
            />
          </label>
        </div>
        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setForm(blankStudent)}
          >
            Clear
          </button>
          <button className="primary-button" disabled={busy}>
            {busy ? "Saving..." : "Create applicant"} →
          </button>
        </div>
      </form>
    </>
  );
}
function FeeLedgerLegacy({
  data,
  students,
  refresh,
  search,
  pay,
  create,
  form,
  setForm,
  showForm,
  setShowForm,
  busy,
  downloadPdf,
  printPdf,
  downloadReceipt,
}) {
  const update = (key, value) => setForm({ ...form, [key]: value });
  const [query, setQuery] = useState("");
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">ACCOUNTS / COLLECTION</span>
          <h1>Fees & payments</h1>
          <p>Track vouchers, balances and daily collections.</p>
        </div>
        <div className="heading-actions">
          <div className="search-box"><span>⌕</span><input placeholder="Search voucher or student" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && search(query)} /><button onClick={() => search(query)}>Search</button></div>
          <button className="secondary-button" onClick={refresh}>
            Refresh
          </button>
          <button
            className="primary-button"
            onClick={() => setShowForm(!showForm)}
          >
            + Create voucher
          </button>
        </div>
      </div>
      {showForm && (
        <form className="panel voucher-form" onSubmit={create}>
          <h3>New fee voucher</h3>
          <div className="form-grid">
            <label>
              Student
              <select
                value={form.studentId}
                onChange={(event) => update("studentId", event.target.value)}
                required
              >
                <option value="">Select student</option>
                {students.map((student) => (
                  <option value={student._id} key={student._id}>
                    {student.name} · {student.admissionNo}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Fee month
              <input
                value={form.feeMonth}
                onChange={(event) => update("feeMonth", event.target.value)}
                required
              />
            </label>
            <label>
              Due date
              <input
                type="date"
                value={form.dueDate}
                onChange={(event) => update("dueDate", event.target.value)}
                required
              />
            </label>
            <label>
              Tuition fee
              <input
                type="number"
                min="0"
                value={form.tuition}
                onChange={(event) => update("tuition", event.target.value)}
                required
              />
            </label>
            <label>
              Computer fee
              <input
                type="number"
                min="0"
                value={form.computer}
                onChange={(event) => update("computer", event.target.value)}
                required
              />
            </label>
            <label>
              Discount
              <input
                type="number"
                min="0"
                value={form.discount}
                onChange={(event) => update("discount", event.target.value)}
              />
            </label>
            <label>Admission fee<input type="number" min="0" value={form.admission} onChange={(event) => update("admission", event.target.value)} /></label>
            <label>Annual fee<input type="number" min="0" value={form.annual} onChange={(event) => update("annual", event.target.value)} /></label>
            <label>Examination fee<input type="number" min="0" value={form.examination} onChange={(event) => update("examination", event.target.value)} /></label>
            <label>Transport fee<input type="number" min="0" value={form.transport} onChange={(event) => update("transport", event.target.value)} /></label>
            <label>Fine / late fee<input type="number" min="0" value={form.fine} onChange={(event) => update("fine", event.target.value)} /></label>
            <label>Other charges<input type="number" min="0" value={form.other} onChange={(event) => update("other", event.target.value)} /></label>
            <label>Previous outstanding<input type="number" min="0" value={form.previousBalance} onChange={(event) => update("previousBalance", event.target.value)} /></label>
            <label>Scholarship<input type="number" min="0" value={form.scholarship} onChange={(event) => update("scholarship", event.target.value)} /></label>
            <label>Concession<input type="number" min="0" value={form.concession} onChange={(event) => update("concession", event.target.value)} /></label>
            <label>Sibling discount<input type="number" min="0" value={form.siblingDiscount} onChange={(event) => update("siblingDiscount", event.target.value)} /></label>
            <label>Advance applied<input type="number" min="0" value={form.advanceAmount} onChange={(event) => update("advanceAmount", event.target.value)} /></label>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
            <button className="primary-button" disabled={busy}>
              {busy ? "Creating..." : "Create voucher"} →
            </button>
          </div>
        </form>
      )}
      <div className="stat-grid">
        <Stat label="Total vouchers" value={data.length} tone="blue" />
        <Stat
          label="Unpaid"
          value={
            data.filter((item) => ["Unpaid", "Overdue"].includes(item.status))
              .length
          }
          tone="gold"
        />
        <Stat
          label="Collected"
          value={`Rs ${data.reduce((sum, item) => sum + item.paidAmount, 0)}`}
          tone="mint"
        />
        <Stat
          label="Outstanding"
          value={`Rs ${data.reduce((sum, item) => sum + item.totalPayable - item.paidAmount, 0)}`}
          tone="rose"
        />
      </div>
      <section className="panel table-panel">
        <div className="table-toolbar">
          <strong>Fee vouchers</strong>
          <span>{data.length} records</span>
        </div>
        {busy ? (
          <div className="empty-state">Loading payments...</div>
        ) : data.length === 0 ? (
          <div className="empty-state">
            <h3>No fee vouchers yet</h3>
            <p>Add a student first, then create their fee voucher above.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Voucher</th>
                  <th>Student</th>
                  <th>Month</th>
                  <th>Total</th>
                  <th>Paid / balance</th>
                  <th>Status</th>
                  <th>History / action</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div className="voucher-no-cell">{item.voucherNo}</div>
                      <div className="voucher-action-row">
                        <button className="table-action" onClick={() => downloadPdf(item._id)}>PDF / print</button>
                        <button className="table-action" onClick={() => printPdf(item._id)}>Print voucher</button>
                      </div>
                    </td>
                    <td>
                      <strong>{item.student?.name || "Unknown"}</strong>
                      <small>{item.student?.admissionNo}</small>
                    </td>
                    <td>{item.feeMonth}</td>
                    <td>Rs {item.totalPayable}</td>
                    <td>Rs {item.paidAmount} / Rs {Math.max(0, item.totalPayable - item.paidAmount)}{item.advanceBalance ? <small>Advance Rs {item.advanceBalance}</small> : null}</td>
                    <td>
                      {item.payments?.map((payment) => <span key={payment.receiptNo}><small className="table-subtext">{payment.receiptNo}: Rs {payment.amount} · {new Date(payment.paidAt).toLocaleDateString()}</small><button className="table-action" onClick={() => downloadReceipt(item._id, payment.receiptNo)}>Receipt PDF</button></span>)}
                      <span className="status-pill">{item.status}</span>
                    </td>
                    <td>
                      {item.status !== "Paid" && (
                        <button
                          className="table-action"
                          onClick={() => pay(item._id)}
                        >
                          Receive payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
function Attendance({
  data,
  records,
  setRecords,
  date,
  setDate,
  reload,
  save,
  busy,
}) {
  const classNames = [...new Set(data.map((student) => student.class))];
  const [selectedClass, setSelectedClass] = useState(classNames[0] || "");
  const visibleStudents = data.filter((student) => student.class === selectedClass);
  useEffect(() => {
    if (!classNames.includes(selectedClass)) setSelectedClass(classNames[0] || "");
  }, [data, selectedClass, classNames.join("|")]);
  const counts = visibleStudents.reduce((result, student) => {
    const status = records[student._id] || "Present";
    result[status] = (result[status] || 0) + 1;
    return result;
  }, {});
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">PEOPLE / DAILY RECORD</span>
          <h1>Attendance</h1>
          <p>Mark daily attendance for every active student.</p>
        </div>
        <div className="heading-actions">
          <input
            className="date-control"
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              reload(event.target.value);
            }}
          />
          <button className="primary-button" onClick={save} disabled={busy}>
            {busy ? "Saving..." : "Save attendance"} →
          </button>
        </div>
      </div>
      <div className="attendance-summary">
        <span>
          Class <b>{selectedClass || "—"}</b>
        </span>
        <span>
          Present <b>{counts.Present || 0}</b>
        </span>
        <span>
          Absent <b>{counts.Absent || 0}</b>
        </span>
        <span>
          Leave <b>{counts.Leave || 0}</b>
        </span>
        <span>
          Late <b>{counts.Late || 0}</b>
        </span>
      </div>
      {classNames.length > 0 && (
        <section className="attendance-class-tabs" aria-label="Attendance classes">
          {classNames.map((className) => {
            const classStudents = data.filter((student) => student.class === className);
            const classPresent = classStudents.filter((student) => (records[student._id] || "Present") === "Present").length;
            return (
              <button
                type="button"
                key={className}
                className={selectedClass === className ? "attendance-class-tab active" : "attendance-class-tab"}
                onClick={() => setSelectedClass(className)}
              >
                <strong>{className}</strong>
                <span>{classPresent}/{classStudents.length} present</span>
              </button>
            );
          })}
        </section>
      )}
      <section className="panel table-panel">
        <div className="table-toolbar">
          <strong>{selectedClass || "Daily register"} register</strong>
          <span>{visibleStudents.length} students</span>
        </div>
        {visibleStudents.length === 0 ? (
          <div className="empty-state">
            <h3>No students found</h3>
            <p>Add students before marking attendance.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Attendance status</th>
                </tr>
              </thead>
              <tbody>
                {visibleStudents.map((student) => (
                  <tr key={student._id}>
                    <td>
                      <div className="student-cell">
                        <div className="table-avatar">{student.name[0]}</div>
                        <strong>{student.name}</strong>
                      </div>
                    </td>
                    <td>{student.class}</td>
                    <td>{student.section || "—"}</td>
                    <td>
                      <div className="attendance-options">
                        {["Present", "Absent", "Leave", "Late"].map(
                          (status) => (
                            <button
                              type="button"
                              className={
                                (records[student._id] || "Present") === status
                                  ? `attendance-button selected ${status.toLowerCase()}`
                                  : "attendance-button"
                              }
                              onClick={() =>
                                setRecords({
                                  ...records,
                                  [student._id]: status,
                                })
                              }
                              key={status}
                            >
                              {status}
                            </button>
                          ),
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
function Academics({
  data,
  showForm,
  setShowForm,
  form,
  setForm,
  submit,
  deleteClass,
  busy,
}) {
  const update = (key, value) => setForm({ ...form, [key]: value });
  const [staff, setStaff] = useState([]);
  const [editing, setEditing] = useState({});
  const [message, setMessage] = useState("");
  useEffect(() => {
    const session = JSON.parse(localStorage.getItem("schoolSession") || "null");
    fetch("${API}/staff", {
      headers: { Authorization: `Bearer ${session?.token}` },
    })
      .then((response) => response.json())
      .then((result) => setStaff(result.data || []))
      .catch(() => setStaff([]));
  }, []);
  function sectionForm(item, section) {
    return (
      editing[section._id] || {
        capacity: section.capacity || "",
        classTeacherStaff: section.classTeacherStaff?._id || "",
        subjectTeachers: section.subjectTeachers || [],
      }
    );
  }
  function setSectionForm(sectionId, value) {
    setEditing((current) => ({ ...current, [sectionId]: value }));
  }
  async function saveSection(item, section) {
    const values = sectionForm(item, section);
    const session = JSON.parse(localStorage.getItem("schoolSession") || "null");
    const response = await fetch(
      `${API}/academic/classes/${item._id}/sections/${section._id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.token}`,
        },
        body: JSON.stringify(values),
      },
    );
    const result = await response.json();
    setMessage(
      response.ok
        ? "Section assignments saved"
        : result.message || "Unable to save section",
    );
    if (response.ok)
      setEditing((current) => ({ ...current, [section._id]: values }));
  }
  function normalizeSubjectName(value = "") {
    return String(value).toLowerCase().replace(/[^a-z]/g, "");
  }
  function matchesSubjectTeacher(subjectName, teacherSubject) {
    if (!teacherSubject) return false;
    const target = normalizeSubjectName(subjectName);
    const personSubject = normalizeSubjectName(teacherSubject);
    return target === personSubject || personSubject.includes(target) || target.includes(personSubject);
  }
  function teacherFor(values, subject) {
    return (
      values.subjectTeachers.find((item) => item.subject === subject)
        ?.teacher || ""
    );
  }
  function updateSubjectTeacher(item, section, subject, teacher) {
    const values = sectionForm(item, section);
    const subjectTeachers = values.subjectTeachers.filter(
      (item) => item.subject !== subject,
    );
    if (teacher) subjectTeachers.push({ subject, teacher });
    setSectionForm(section._id, { ...values, subjectTeachers });
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">ACADEMICS / STRUCTURE</span>
          <h1>Classes & subjects</h1>
          <p>Manage sessions, sections, teachers and class strength.</p>
        </div>
        <button
          className="primary-button"
          onClick={() => setShowForm(!showForm)}
        >
          + Add class
        </button>
      </div>
      {showForm && (
        <form className="panel voucher-form" onSubmit={submit}>
          <h3>New academic class</h3>
          <div className="form-grid">
            <label>
              Class
              <select
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
              >
                {classes.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              Academic session
              <input
                value={form.session}
                onChange={(event) => update("session", event.target.value)}
                required
              />
            </label>
            <label>
              Subjects <small>comma separated</small>
              <input
                placeholder="English, Mathematics, Science"
                value={form.subjects}
                onChange={(event) => update("subjects", event.target.value)}
              />
            </label>
            <label>
              Sections <small>comma separated</small>
              <input
                placeholder="A, B"
                value={form.sections}
                onChange={(event) => update("sections", event.target.value)}
              />
            </label>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
            <button className="primary-button" disabled={busy}>
              {busy ? "Saving..." : "Create class"} →
            </button>
          </div>
        </form>
      )}
      {message && (
        <div className="notice">
          {message}
          <button onClick={() => setMessage("")}>Dismiss</button>
        </div>
      )}
      <section className="class-grid">
        {data.length === 0 ? (
          <div className="panel empty-state">
            <h3>No classes configured</h3>
            <p>Create your first academic class above.</p>
          </div>
        ) : (
          data.map((item) => (
            <article className="panel class-card" key={item._id}>
              <div>
                <span className="eyebrow">{item.session}</span>
                <h3>{item.name}</h3>
              </div>
              <div className="class-card-row">
                <strong>{item.sections.length}</strong>
                <span>sections</span>
                <strong>{item.subjects.length}</strong>
                <span>subjects</span>
              </div>
              <div className="form-actions class-card-actions">
                <button type="button" className="danger-button small-button" onClick={() => deleteClass?.(item._id)}>Delete class</button>
              </div>
              <div className="tag-list">
                {item.subjects.map((subject) => (
                  <span key={subject}>{subject}</span>
                ))}
              </div>
              {item.sections.map((section) => {
                const values = sectionForm(item, section);
                return (
                  <div className="section-manager" key={section._id}>
                    <div className="section-title">
                      <strong>Section {section.name}</strong>
                      <span>
                        {section.studentCount || 0}
                        {values.capacity ? ` / ${values.capacity}` : ""}{" "}
                        students
                      </span>
                    </div>
                    <div className="section-fields">
                      <label>
                        Capacity
                        <input
                          type="number"
                          min="1"
                          value={values.capacity}
                          onChange={(event) =>
                            setSectionForm(section._id, {
                              ...values,
                              capacity: event.target.value,
                            })
                          }
                        />
                      </label>
                      <label>
                        Class teacher
                        <select
                          value={values.classTeacherStaff}
                          onChange={(event) =>
                            setSectionForm(section._id, {
                              ...values,
                              classTeacherStaff: event.target.value,
                            })
                          }
                        >
                          <option value="">Unassigned</option>
                          {staff
                            .filter((person) => person.category === "Teacher")
                            .map((person) => (
                              <option value={person._id} key={person._id}>
                                {person.name} · {person.employeeId}
                              </option>
                            ))}
                        </select>
                      </label>
                    </div>
                    <div className="subject-teacher-list">
                      {item.subjects.map((subject) => (
                        <label key={subject}>
                          {subject}
                          <select
                            value={teacherFor(values, subject)}
                            onChange={(event) =>
                              updateSubjectTeacher(
                                item,
                                section,
                                subject,
                                event.target.value,
                              )
                            }
                          >
                            <option value="">Subject teacher</option>
                            {staff
                              .filter(
                                (person) =>
                                  person.category === "Teacher" &&
                                  (!person.subject ||
                                    matchesSubjectTeacher(subject, person.subject)),
                              )
                              .map((person) => (
                                <option value={person._id} key={person._id}>
                                  {person.name}
                                </option>
                              ))}
                          </select>
                        </label>
                      ))}
                    </div>
                    <button
                      className="secondary-button"
                      onClick={() => saveSection(item, section)}
                    >
                      Save section
                    </button>
                  </div>
                );
              })}
            </article>
          ))
        )}
      </section>
    </>
  );
}
function StaffPage({
  data,
  showForm,
  setShowForm,
  form,
  setForm,
  submit,
  busy,
  deleteStaff,
}) {
  const update = (key, value) => setForm({ ...form, [key]: value });
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">PEOPLE / EMPLOYEES</span>
          <h1>Staff & teachers</h1>
          <p>
            Manage employee profiles, categories, payroll details and class
            assignments.
          </p>
        </div>
        <button
          className="primary-button"
          onClick={() => setShowForm(!showForm)}
        >
          + Add staff
        </button>
      </div>
      {showForm && (
        <form className="panel voucher-form" onSubmit={submit}>
          <h3>New staff profile</h3>
          <div className="form-grid">
            <label>
              Employee ID
              <input
                value={form.employeeId}
                onChange={(event) => update("employeeId", event.target.value)}
                required
              />
            </label>
            <label>
              Name
              <input
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                required
              />
            </label>
            <label>
              Category
              <select
                value={form.category}
                onChange={(event) => update("category", event.target.value)}
              >
                {[
                  "Teacher",
                  "Principal",
                  "Accountant",
                  "Receptionist",
                  "Admin Staff",
                  "Other",
                ].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              Qualification
              <input
                value={form.qualification}
                onChange={(event) =>
                  update("qualification", event.target.value)
                }
              />
            </label>
            <label>
              Subject
              <input
                value={form.subject}
                onChange={(event) => update("subject", event.target.value)}
              />
            </label>
            <label>
              Phone
              <input
                value={form.phone}
                onChange={(event) => update("phone", event.target.value)}
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
              />
            </label>
            <label>
              Joining date
              <input
                type="date"
                value={form.joiningDate}
                onChange={(event) => update("joiningDate", event.target.value)}
              />
            </label>
            <label>
              Salary
              <input
                type="number"
                min="0"
                value={form.salary}
                onChange={(event) => update("salary", event.target.value)}
              />
            </label>
            <label>
              Status
              <select
                value={form.status}
                onChange={(event) => update("status", event.target.value)}
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </label>
            <label>
              Assigned classes <small>comma separated</small>
              <input
                placeholder="Class 5, Class 6"
                value={form.assignedClasses}
                onChange={(event) =>
                  update("assignedClasses", event.target.value)
                }
              />
            </label>
            <label>
              Photo <small>Optional, JPG/PNG/WebP up to 5 MB</small>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) =>
                  update("photoFile", event.target.files[0] || null)
                }
              />
            </label>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
            <button className="primary-button" disabled={busy}>
              {busy ? "Saving..." : "Create profile"} →
            </button>
          </div>
        </form>
      )}
      <section className="panel table-panel">
        <div className="table-toolbar">
          <strong>Employee directory</strong>
          <span>{data.length} records</span>
        </div>
        {data.length === 0 ? (
          <div className="empty-state">
            <h3>No staff profiles yet</h3>
            <p>Add teachers and employees above.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Category</th>
                  <th>Contact</th>
                  <th>Qualification / subject</th>
                  <th>Salary</th>
                  <th>Assigned classes</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div className="student-cell">
                        {item.photo ? (
                          <img
                            className="table-avatar"
                            src={item.photo}
                            alt=""
                          />
                        ) : (
                          <div className="table-avatar">{item.name[0]}</div>
                        )}
                        <div>
                          <strong>{item.name}</strong>
                          <small>
                            {item.employeeId} ·{" "}
                            {item.joiningDate
                              ? new Date(item.joiningDate).toLocaleDateString()
                              : "No joining date"}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>{item.category}</td>
                    <td>
                      {item.phone}
                      <small className="table-subtext">
                        {item.email || "—"}
                      </small>
                    </td>
                    <td>
                      {item.qualification || "—"}
                      <small className="table-subtext">
                        {item.subject || "No subject"}
                      </small>
                    </td>
                    <td>
                      {item.salary == null
                        ? "—"
                        : `Rs ${item.salary.toLocaleString()}`}
                    </td>
                    <td>{item.assignedClasses?.join(", ") || "—"}</td>
                    <td>
                      <span
                        className={
                          item.status === "Active"
                            ? "status-pill"
                            : "status-pill inactive"
                        }
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="danger-button small-button"
                        onClick={() => deleteStaff?.(item._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
function Exams({ data, showForm, setShowForm, form, setForm, submit, busy, deleteExam }) {
  const update = (key, value) => setForm({ ...form, [key]: value });
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">ACADEMICS / ASSESSMENT</span>
          <h1>Examinations & results</h1>
          <p>
            Create exams now; marks and report cards follow from the same
            records.
          </p>
        </div>
        <button
          className="primary-button"
          onClick={() => setShowForm(!showForm)}
        >
          + Create exam
        </button>
      </div>
      {showForm && (
        <form className="panel voucher-form" onSubmit={submit}>
          <h3>New examination</h3>
          <div className="form-grid">
            <label>
              Exam name
              <select
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
              >
                {[
                  "Monthly Test",
                  "Unit Test",
                  "Mid-Term Examination",
                  "Final Examination",
                  "Annual Examination",
                  "Board Preparation Test",
                  "Board Preparation Test",
                ].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              Class
              <select
                value={form.className}
                onChange={(event) => update("className", event.target.value)}
              >
                {classes.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              Section
              <input
                value={form.section}
                onChange={(event) => update("section", event.target.value)}
              />
            </label>
            <label>
              Academic session
              <input
                value={form.session}
                onChange={(event) => update("session", event.target.value)}
                required
              />
            </label>
            <label>
              Exam date
              <input
                type="date"
                value={form.examDate}
                onChange={(event) => update("examDate", event.target.value)}
              />
            </label>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
            <button className="primary-button" disabled={busy}>
              {busy ? "Creating..." : "Create examination"} →
            </button>
          </div>
        </form>
      )}
      <section className="class-grid">
        {data.length === 0 ? (
          <div className="panel empty-state">
            <h3>No examinations yet</h3>
            <p>Create an examination to begin entering marks.</p>
          </div>
        ) : (
          data.map((item) => (
            <article className="panel class-card" key={item._id}>
              <span className="eyebrow">{item.session}</span>
              <h3>{item.name}</h3>
              <p>
                {item.className}
                {item.section ? ` · Section ${item.section}` : ""}
              </p>
              <div className="class-card-row">
                <strong>{item.marks.length}</strong>
                <span>mark entries</span>
              </div>
              <div className="form-actions" style={{ marginTop: 12 }}>
                <button type="button" className="danger-button small-button" onClick={() => deleteExam?.(item._id)}>
                  Delete exam
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </>
  );
}
function MarksEntry({
  data,
  students,
  selected,
  setSelected,
  marks,
  setMarks,
  results,
  loadResults,
  showForm,
  setShowForm,
  form,
  setForm,
  submit,
  saveMarks,
  busy,
}) {
  const update = (key, value) => setMarks({ ...marks, [key]: value });
  const exam = selected || data[0];
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">ACADEMICS / ASSESSMENT</span>
          <h1>Marks & report cards</h1>
          <p>Select an examination and enter marks for enrolled students.</p>
        </div>
      </div>
      {data.length === 0 ? (
        <div className="panel empty-state">
          <h3>No examinations yet</h3>
          <p>Create an examination first from the Examinations section.</p>
        </div>
      ) : (
        <>
          <section className="panel marks-panel">
            <div className="form-grid">
              <label>
                Examination
                <select
                  value={exam?._id || ""}
                  onChange={(event) => {
                    const next = data.find(
                      (item) => item._id === event.target.value,
                    );
                    setSelected(next);
                    loadResults(next._id);
                  }}
                >
                  {data.map((item) => (
                    <option value={item._id} key={item._id}>
                      {item.name} · {item.className} · {item.session}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Student
                <select
                  value={marks.student}
                  onChange={(event) => update("student", event.target.value)}
                >
                  <option value="">Select student</option>
                  {students
                    .filter(
                      (student) => !exam || student.class === exam.className,
                    )
                    .map((student) => (
                      <option value={student._id} key={student._id}>
                        {student.name} · {student.admissionNo}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Subject
                <input
                  value={marks.subject}
                  onChange={(event) => update("subject", event.target.value)}
                  placeholder="Mathematics"
                  required
                />
              </label>
              <label>
                Total marks
                <input
                  type="number"
                  min="1"
                  value={marks.totalMarks}
                  onChange={(event) => update("totalMarks", event.target.value)}
                  required
                />
              </label>
              <label>
                Obtained marks
                <input
                  type="number"
                  min="0"
                  max={marks.totalMarks}
                  value={marks.obtainedMarks}
                  onChange={(event) =>
                    update("obtainedMarks", event.target.value)
                  }
                  required
                />
              </label>
            </div>
            <div className="form-actions">
              <button
                className="primary-button"
                onClick={saveMarks}
                disabled={busy || !exam}
              >
                {busy ? "Saving..." : "Save marks"} →
              </button>
            </div>
          </section>
          <section className="panel table-panel">
            <div className="table-toolbar">
              <strong>Calculated results</strong>
              <span>{results.length} students</span>
            </div>
            {results.length === 0 ? (
              <div className="empty-state">
                <p>No marks entered for this examination yet.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Obtained</th>
                      <th>Percentage</th>
                      <th>Grade</th>
                      <th>Result</th>
                      <th>Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result) => (
                      <tr key={result.student._id}>
                        <td>
                          <strong>{result.student.name}</strong>
                          <small>{result.student.admissionNo}</small>
                        </td>
                        <td>
                          {result.obtainedMarks} / {result.totalMarks}
                        </td>
                        <td>{result.percentage}%</td>
                        <td>
                          <span className="status-pill">{result.grade}</span>
                        </td>
                        <td><span className="status-pill">{result.passed ? "Passed" : "Failed"}</span></td>
                        <td>{result.position}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
Exams = FullExamWorkspace;
function FullExamWorkspace({
  data,
  students,
  selected,
  setSelected,
  marks,
  setMarks,
  results,
  loadResults,
  showForm,
  setShowForm,
  form,
  setForm,
  submit,
  saveMarks,
  busy,
  role,
  editing,
  setEditing,
  publish,
  deleteExam,
  deleteResult,
  marksSaveState,
  setMarksSaveState,
}) {
  const exam = selected || data[0];
  const classStudents = students.filter(
    (student) => !exam || (student.class === exam.className && (!exam.section || student.section === exam.section)),
  );
  const subjectList = [...new Set(String(marks.subject || "").split(",").map((item) => item.trim()).filter(Boolean))];
  const updateEntry = (studentId, subjectName, field, value) => {
    const current = marks.entries?.[studentId] || {};
    if (subjectName === "generalRemark") {
      setMarks({
        ...marks,
        entries: {
          ...(marks.entries || {}),
          [studentId]: {
            ...current,
            generalRemark: value,
          },
        },
      });
      return;
    }
    const currentSubject = current[subjectName] || {};
    setMarks({
      ...marks,
      entries: {
        ...(marks.entries || {}),
        [studentId]: {
          ...current,
          [subjectName]: {
            ...currentSubject,
            [field]: value,
          },
        },
      },
    });
  };
  const moveToNextMarksField = (event) => {
    if (event.key !== "Enter") return;
    const inputs = Array.from(
      event.target.closest("table")?.querySelectorAll("input") || [],
    );
    const index = inputs.indexOf(event.target);
    event.preventDefault();
    const nextInput = inputs[index + 1];
    if (nextInput) {
      nextInput.focus();
      nextInput.select?.();
      return;
    }
    if (inputs.length > 0) {
      const firstInput = inputs[0];
      firstInput.focus();
      firstInput.select?.();
    }
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">ACADEMICS / ASSESSMENT</span>
          <h1>Examinations & report cards</h1>
          <p>Create exams, enter marks and print calculated report cards.</p>
        </div>
        {(role === "teacher" || role === "school_admin" || role === "super_admin") && (
          <button className="primary-button" onClick={() => { setEditing(null); setShowForm(!showForm); }}>
            + Create exam
          </button>
        )}
      </div>
      {showForm && (
        <form className="panel voucher-form" onSubmit={submit}>
          <h3>New examination</h3>
          <div className="form-grid">
            <label>
              Exam name
              <select
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
              >
                {[
                  "Monthly Test",
                  "Unit Test",
                  "Mid-Term Examination",
                  "Final Examination",
                  "Annual Examination",
                ].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              Class
              <select
                value={form.className}
                onChange={(event) =>
                  setForm({ ...form, className: event.target.value })
                }
              >
                {classes.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              Section
              <input
                value={form.section}
                onChange={(event) =>
                  setForm({ ...form, section: event.target.value })
                }
              />
            </label>
            <label>
              Academic session
              <input
                value={form.session}
                onChange={(event) =>
                  setForm({ ...form, session: event.target.value })
                }
                required
              />
            </label>
            <label>
              Passing marks
              <input type="number" min="0" value={form.passingMarks} onChange={(event) => setForm({ ...form, passingMarks: event.target.value })} required />
            </label>
            <label className="full-field">
              Grading scale <small>JSON rules ordered by minimum percentage</small>
              <textarea rows="3" value={form.gradingScale} onChange={(event) => setForm({ ...form, gradingScale: event.target.value })} required />
            </label>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
            <button className="primary-button" disabled={busy}>
              {busy ? "Creating..." : "Create examination"} →
            </button>
          </div>
        </form>
      )}
      {data.length === 0 ? (
        <div className="panel empty-state">
          <h3>No examinations yet</h3>
          <p>Create an examination above to start entering marks.</p>
        </div>
      ) : (
        <>
          <section className="panel marks-panel">
            <div className="form-grid">
              <label>
                Examination
                <select
                  value={exam?._id || ""}
                  onChange={(event) => {
                    const next = data.find(
                      (item) => item._id === event.target.value,
                    );
                    setSelected(next);
                    setMarks({
                      student: "",
                      subject: "",
                      totalMarks: "100",
                      obtainedMarks: "",
                      remarks: "",
                      entries: {},
                    });
                    loadResults(next._id);
                  }}
                >
                  {data.map((item) => (
                    <option value={item._id} key={item._id}>
                      {item.name} · {item.className} · {item.session}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Subjects (comma separated)
                <input
                  value={marks.subject}
                  onChange={(event) => {
                    const nextSubject = event.target.value;
                    setMarks({ ...marks, subject: nextSubject, entries: {} });
                  }}
                  placeholder="Mathematics, Science, English"
                  required
                />
              </label>
              <label>
                Total marks
                <input
                  type="number"
                  min="1"
                  value={marks.totalMarks}
                  onChange={(event) => {
                    setMarks({ ...marks, totalMarks: event.target.value, entries: {} });
                  }}
                  required
                />
              </label>
            </div>

            <div className="table-toolbar" style={{ marginTop: 16 }}>
              <strong>{exam?.name} · {exam?.className} · {exam?.section || 'All sections'}</strong>
              <span>{classStudents.length} students</span>
            </div>

            <div className="table-wrap" style={{ marginTop: 12 }}>
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Admission no.</th>
                    {subjectList.length === 0 ? <th>Marks</th> : subjectList.map((subjectName) => <th key={subjectName}>{subjectName}</th>)}
                    <th>Teacher remark</th>
                  </tr>
                </thead>
                <tbody>
                  {classStudents.map((student) => {
                    const current = marks.entries?.[student._id] || {};
                    return (
                      <tr key={student._id}>
                        <td><strong>{student.name}</strong></td>
                        <td>{student.admissionNo}</td>
                        {subjectList.length === 0 ? (
                          <td>
                            <input
                              type="number"
                              min="0"
                              max={marks.totalMarks || 100}
                              value={current.obtainedMarks ?? ""}
                              onChange={(event) => updateEntry(student._id, "obtainedMarks", "obtainedMarks", event.target.value)}
                              onKeyDown={moveToNextMarksField}
                              placeholder="0"
                            />
                          </td>
                        ) : subjectList.map((subjectName) => (
                          <td key={`${student._id}-${subjectName}`}>
                            <input
                              type="number"
                              min="0"
                              max={marks.totalMarks || 100}
                              value={current[subjectName]?.obtainedMarks ?? ""}
                              onChange={(event) => updateEntry(student._id, subjectName, "obtainedMarks", event.target.value)}
                              onKeyDown={moveToNextMarksField}
                              placeholder="0"
                            />
                          </td>
                        ))}
                        <td>
                          <input
                            value={current.generalRemark ?? ""}
                            onChange={(event) => updateEntry(student._id, "generalRemark", "generalRemark", event.target.value)}
                            onKeyDown={moveToNextMarksField}
                            placeholder="Remark"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="form-actions" style={{ marginTop: 16 }}>
              <button
                className={`primary-button save-button ${marksSaveState}`}
                onClick={saveMarks}
                disabled={busy || !marks.subject.trim() || !Number(marks.totalMarks) || !classStudents.length}
              >
                {busy || marksSaveState === "saving" ? "Saving..." : marksSaveState === "success" ? "Saved!" : "Save subject marks"} →
              </button>
            </div>
          </section>
          <section className="panel table-panel report-card-print">
            <div className="table-toolbar">
              <div>
                <strong>Calculated results</strong>
                <span className="status-pill">{exam?.published ? "Published" : "Draft"}</span>
              </div>
              {(role === "school_admin" || role === "super_admin") && exam && (
                <div className="form-actions">
                  <button className="secondary-button" onClick={() => { setEditing(exam); setForm({ ...form, name: exam.name, className: exam.className, section: exam.section || "", session: exam.session, passingMarks: String(exam.passingMarks || 40), gradingScale: JSON.stringify(exam.gradingScale || []) }); setShowForm(true); }}>
                    Edit exam
                  </button>
                  <button className="primary-button" onClick={() => publish(exam._id, !exam.published)}>
                    {exam.published ? "Unpublish results" : "Publish results"}
                  </button>
                  <button className="danger-button" onClick={() => deleteExam?.(exam._id)}>
                    Delete exam
                  </button>
                </div>
              )}
              <button
                className="secondary-button"
                onClick={() => window.print()}
              >
                Print report card
              </button>
            </div>
            {results.length === 0 ? (
              <div className="empty-state">
                <p>No marks entered for this examination yet.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Obtained</th>
                      <th>Percentage</th>
                      <th>Grade</th>
                      <th>Result</th>
                      <th>Position</th>
                      {(role === "school_admin" || role === "super_admin") && <th>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result) => (
                      <tr key={result.student._id}>
                        <td>
                          <strong>{result.student.name}</strong>
                          <small>{result.student.admissionNo}</small>
                        </td>
                        <td>
                          {result.obtainedMarks} / {result.totalMarks}
                        </td>
                        <td>{result.percentage}%</td>
                        <td>
                          <span className="status-pill">{result.grade}</span>
                        </td>
                        <td><span className="status-pill">{result.passed ? "Passed" : "Failed"}</span></td>
                        <td>{result.position}</td>
                        {(role === "school_admin" || role === "super_admin") && (
                          <td>
                            <button
                              type="button"
                              className="danger-button small-button"
                              onClick={() => deleteResult?.(exam._id, result.student._id)}
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
function Field({ label, type = "text", value, set, required, options }) {
  return (
    <label>
      {label}
      {type === "select" ? (
        <select value={value} onChange={(event) => set(event.target.value)}>
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => set(event.target.value)}
          required={required}
        />
      )}
    </label>
  );
}
function ComingSoon({ title }) {
  return (
    <div className="empty-page">
      <div>✦</div>
      <span className="eyebrow">WORKSPACE READY</span>
      <h1>{title}</h1>
      <p>
        This module is next in the school operations roadmap. Authentication and
        student records are already connected.
      </p>
    </div>
  );
}
export default App;
