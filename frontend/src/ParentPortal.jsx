import { useState } from "react"

function resultSummary(marks) {
  const totalMarks = marks.reduce((sum, mark) => sum + mark.totalMarks, 0)
  const obtainedMarks = marks.reduce((sum, mark) => sum + mark.obtainedMarks, 0)
  return { totalMarks, obtainedMarks, percentage: totalMarks ? ((obtainedMarks / totalMarks) * 100).toFixed(2) : "0.00" }
}

export default function ParentPortal({ user, data, notices, token }) {
  const [childId, setChildId] = useState(data.students[0]?._id || "")
  const child = data.students.find((student) => student._id === childId) || data.students[0]
  const childFees = data.fees.filter((fee) => fee.student?._id === child?._id || fee.student === child?._id)
  const childAttendance = data.attendance.filter((item) => item.student?._id === child?._id || item.student === child?._id)
  const childResults = data.results.filter((item) => item.marks.some((mark) => mark.student === child?._id || mark.student?._id === child?._id))
  async function downloadReport(examId) {
    const response = await fetch(`http://localhost:5000/api/exams/${examId}/report-card/${child._id}/pdf`, { headers: { Authorization: `Bearer ${token}` } })
    if (!response.ok) return
    const link = document.createElement("a")
    link.href = URL.createObjectURL(await response.blob())
    link.download = `${child.admissionNo}-report-card.pdf`
    link.click()
  }
  const pending = childFees.filter((fee) => fee.status !== "Paid")
  return <div className="parent-portal">
    <div className="page-heading"><div><span className="eyebrow">PARENT PORTAL</span><h1>Welcome, {user.name?.split(" ")[0]}.</h1><p>Everything about your child's school journey in one place.</p></div></div>
    {data.students.length > 1 && <div className="panel child-switcher"><label>Viewing child<select value={child?._id || ""} onChange={(event) => setChildId(event.target.value)}>{data.students.map((student) => <option value={student._id} key={student._id}>{student.name} · {student.admissionNo}</option>)}</select></label></div>}
    {!child ? <div className="panel empty-state"><h3>No child linked</h3><p>Please contact the school administrator to link a student profile.</p></div> : <>
      <section className="panel child-profile-card"><div className="report-photo">{child.photo ? <img src={child.photo} alt="" /> : <span>{child.name[0]}</span>}</div><div><span className="eyebrow">CHILD PROFILE</span><h2>{child.name}</h2><p>Father/guardian: {child.fatherName} · Admission: {child.admissionNo}</p><p>{child.class} · Section {child.section || "—"} · Roll {child.rollNo || "—"} · Status {child.status}</p></div></section>
      <div className="stat-grid"><div className="stat-card blue"><span>Attendance</span><strong>{childAttendance.filter((item) => item.status === "Present").length} present</strong><small>{childAttendance.length} recorded days</small></div><div className="stat-card gold"><span>Pending fees</span><strong>Rs {pending.reduce((sum, fee) => sum + Math.max(0, fee.totalPayable - fee.paidAmount), 0).toLocaleString()}</strong><small>{pending.length} voucher(s)</small></div><div className="stat-card mint"><span>Results</span><strong>{childResults.length}</strong><small>published examinations</small></div><div className="stat-card rose"><span>Payment history</span><strong>{childFees.reduce((sum, fee) => sum + (fee.payments?.length || 0), 0)}</strong><small>receipt(s)</small></div></div>
      <section className="panel portal-section"><div className="table-toolbar"><strong>Attendance</strong><span>{childAttendance.length} records</span></div><div className="table-wrap"><table><thead><tr><th>Date</th><th>Status</th><th>Remarks</th></tr></thead><tbody>{childAttendance.slice(0, 20).map((item) => <tr key={item._id}><td>{new Date(item.date).toLocaleDateString()}</td><td><span className="status-pill">{item.status}</span></td><td>{item.remarks || "—"}</td></tr>)}</tbody></table></div></section>
      <section className="panel portal-section"><div className="table-toolbar"><strong>Fee vouchers & payment history</strong><span>{childFees.length} vouchers</span></div><div className="table-wrap"><table><thead><tr><th>Voucher</th><th>Month</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th>Receipts</th></tr></thead><tbody>{childFees.map((fee) => <tr key={fee._id}><td>{fee.voucherNo}</td><td>{fee.feeMonth}</td><td>Rs {fee.totalPayable}</td><td>Rs {fee.paidAmount}</td><td>Rs {Math.max(0, fee.totalPayable - fee.paidAmount)}</td><td><span className="status-pill">{fee.status}</span></td><td>{fee.payments?.map((payment) => <small className="table-subtext" key={payment.receiptNo}>{payment.receiptNo}: Rs {payment.amount} · {new Date(payment.paidAt).toLocaleDateString()}</small>)}</td></tr>)}</tbody></table></div></section>
      <section className="portal-section"><div className="table-toolbar"><strong>Examination results & report cards</strong><span>{childResults.length} exams</span></div><div className="portal-result-list">{childResults.map((item) => { const summary = resultSummary(item.marks.filter((mark) => mark.student === child._id || mark.student?._id === child._id)); return <article className="panel portal-result-card" key={item.exam.id}><div className="result-heading"><div><span className="eyebrow">{item.exam.name} · {item.exam.session}</span><h2>{child.name}</h2><p>{item.exam.className} · Section {item.exam.section || child.section || "—"}</p></div><button className="secondary-button" onClick={() => downloadReport(item.exam.id)}>Download report card</button></div><div className="result-summary"><strong>{summary.obtainedMarks} / {summary.totalMarks}</strong><span>{summary.percentage}%</span></div><div className="table-wrap"><table><thead><tr><th>Subject</th><th>Total</th><th>Obtained</th><th>Remarks</th></tr></thead><tbody>{item.marks.filter((mark) => mark.student === child._id || mark.student?._id === child._id).map((mark) => <tr key={mark._id}><td>{mark.subject}</td><td>{mark.totalMarks}</td><td>{mark.obtainedMarks}</td><td>{mark.remarks || "—"}</td></tr>)}</tbody></table></div></article> })}</div></section>
      <section className="portal-section"><div className="table-toolbar"><strong>School announcements</strong><span>{notices.length} notices</span></div><div className="notice-list">{notices.slice(0, 5).map((notice) => <article className="panel notice-card" key={notice._id}><span className="eyebrow">{notice.category}</span><h3>{notice.title}</h3><p>{notice.body}</p></article>)}</div></section>
    </>}
  </div>
}
