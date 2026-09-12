import { useEffect, useState } from "react"

export default function ReportCard({ exams, students, call, token, go }) {
  const [examId, setExamId] = useState("")
  const [studentId, setStudentId] = useState("")
  const [report, setReport] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const exam = exams.find((item) => item._id === examId)
  const eligibleStudents = students.filter((student) => !exam || (student.class === exam.className && (!exam.section || student.section === exam.section)))

  useEffect(() => {
    if (!examId && exams[0]) setExamId(exams[0]._id)
  }, [exams, examId])

  useEffect(() => {
    if (!eligibleStudents.some((student) => student._id === studentId)) setStudentId(eligibleStudents[0]?._id || "")
  }, [examId, students, studentId])

  async function loadReport(event) {
    event?.preventDefault()
    if (!examId || !studentId) return
    setBusy(true)
    setError("")
    try {
      const response = await call(`/exams/${examId}/report-card/${studentId}`)
      setReport(response.data)
    } catch (requestError) {
      setReport(null)
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function downloadPdf() {
    if (!examId || !studentId) return
    const response = await fetch(`http://localhost:5000/api/exams/${examId}/report-card/${studentId}/pdf`, { headers: { Authorization: `Bearer ${token}` } })
    if (!response.ok) { setError("Unable to generate the report-card PDF"); return }
    const link = document.createElement("a")
    link.href = URL.createObjectURL(await response.blob())
    link.download = `${report?.student?.admissionNo || "student"}-report-card.pdf`
    link.click()
  }

  function printReport() {
    if (!report) return
    window.print()
  }

  return <div className="report-card-workspace">
    <div className="page-heading">
      <div><span className="eyebrow">ACADEMICS / REPORT CARD</span><h1>Report cards</h1><p>Generate a complete professional report card for any student.</p></div>
      <button className="secondary-button" type="button" onClick={() => go("overview")}>Back to dashboard</button>
    </div>
    <form className="panel report-card-selector" onSubmit={loadReport}>
      <div className="form-grid">
        <label>Examination<select value={examId} onChange={(event) => setExamId(event.target.value)}><option value="">Select examination</option>{exams.map((item) => <option value={item._id} key={item._id}>{item.name} · {item.className} · {item.session}</option>)}</select></label>
        <label>Student<select value={studentId} onChange={(event) => setStudentId(event.target.value)} disabled={!examId}><option value="">Select student</option>{eligibleStudents.map((student) => <option value={student._id} key={student._id}>{student.name} · {student.admissionNo}</option>)}</select></label>
      </div>
      <div className="form-actions"><button className="primary-button" disabled={busy || !examId || !studentId}>{busy ? "Loading..." : "Generate report card"}</button></div>
    </form>
    {error && <div className="notice">{error}</div>}
    {!report && !error && <div className="panel empty-state"><h3>Select an exam and student</h3><p>The complete report card will appear here.</p></div>}
    {report && <article className="panel report-card-preview report-card-print">
      <header className="report-card-header"><div className="report-logo">E</div><div><h2>EDUGRID</h2><p>STUDENT REPORT CARD</p></div><div className="report-photo">{report.student.photo ? <img src={report.student.photo} alt="Student" /> : <span>{report.student.name?.[0]}</span>}</div></header>
      <div className="report-card-title"><span>{report.exam.name}</span><small>{report.exam.session}</small></div>
      <div className="report-student-info"><div><strong>Student name</strong><span>{report.student.name}</span></div><div><strong>Father / guardian</strong><span>{report.student.fatherName || "—"}</span></div><div><strong>Admission number</strong><span>{report.student.admissionNo}</span></div><div><strong>Class & section</strong><span>{report.student.class} · {report.student.section || "—"}</span></div><div><strong>Roll number</strong><span>{report.student.rollNo || "—"}</span></div></div>
      <div className="report-card-actions"><button className="secondary-button" onClick={printReport}>Print report card</button><button className="primary-button" onClick={downloadPdf}>Download PDF</button></div>
      <div className="table-wrap"><table><thead><tr><th>Subject</th><th>Total marks</th><th>Obtained marks</th><th>Remarks</th></tr></thead><tbody>{report.subjects.map((mark) => <tr key={mark._id}><td>{mark.subject}</td><td>{mark.totalMarks}</td><td>{mark.obtainedMarks}</td><td>{mark.remarks || "—"}</td></tr>)}</tbody></table></div>
      <div className="report-result-summary"><div><strong>Total marks</strong><span>{report.totalMarks}</span></div><div><strong>Obtained marks</strong><span>{report.obtainedMarks}</span></div><div><strong>Percentage</strong><span>{report.percentage}%</span></div><div><strong>Grade</strong><span>{report.grade}</span></div><div><strong>Position</strong><span>{report.position}</span></div></div>
      <section className="report-attendance"><h3>Attendance</h3><p>Total days: {report.attendance.total} · Present: {report.attendance.present} · Absent: {report.attendance.absent} · Leave: {report.attendance.leave} · Late: {report.attendance.late}</p></section>
      <section className="report-remarks"><h3>Teacher remarks</h3><p>{report.remarks.length ? report.remarks.join(" · ") : "No remarks recorded."}</p></section>
      <footer className="report-signatures"><span>Teacher signature</span><span>Principal signature</span><span>Parent signature</span></footer>
    </article>}
  </div>
}
