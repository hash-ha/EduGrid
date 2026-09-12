import { useState } from "react";

export default function ReportsModule({ call, token, role }) {
  const [loading, setLoading] = useState(null);
  const [message, setMessage] = useState("");
  const isAdmin = role === "super_admin" || role === "school_admin";

  if (!isAdmin) {
    return (
      <div className="panel empty-state">
        <h3>Report generation is restricted</h3>
        <p>Only the school admin can generate and export reports.</p>
      </div>
    );
  }

  const reports = [
    { id: "student-list", name: "📋 Student List", description: "Complete list of all active students", endpoint: "/reports/general/student-list" },
    { id: "class-wise-student", name: "🏫 Class-wise Student List", description: "Students grouped by class and section", endpoint: "/reports/general/class-wise-student" },
    { id: "admission-report", name: "✍️ Admission Report", description: "New admissions and student information", endpoint: "/reports/general/admission-report" },
    { id: "fee-collection-daily", name: "💰 Daily Fee Collection", description: "Fee collected on a specific date", endpoint: "/reports/fee/daily-collection" },
    { id: "fee-collection-monthly", name: "💵 Monthly Fee Collection", description: "Fee collected in a month", endpoint: "/reports/fee/monthly-collection" },
    { id: "fee-defaulter", name: "⚠️ Fee Defaulter Report", description: "Students with pending fee payments", endpoint: "/reports/fee/fee-defaulter" },
    { id: "attendance-report", name: "✓ Attendance Report", description: "Student attendance records", endpoint: "/reports/attendance/attendance-report" },
    { id: "result-report", name: "📊 Examination Result Report", description: "Exam results for all students", endpoint: "/reports/exam/result-report" },
    { id: "class-wise-result", name: "📈 Class-wise Result", description: "Results grouped by class", endpoint: "/reports/exam/class-wise-result" },
    { id: "top-holders", name: "🏆 Top Position Holders", description: "Top 20 performing students", endpoint: "/reports/exam/top-position-holders" },
    { id: "promotion-report", name: "🚀 Student Promotion Report", description: "Student promotion and movement", endpoint: "/reports/promotion/report" }
  ];

  const groups = [
    { label: "Students", ids: ["student-list", "class-wise-student", "admission-report"] },
    { label: "Finance", ids: ["fee-collection-daily", "fee-collection-monthly", "fee-defaulter"] },
    { label: "Academics", ids: ["attendance-report", "result-report", "class-wise-result", "top-holders"] },
    { label: "Administration", ids: ["promotion-report"] },
  ];

  async function downloadReport(report, format) {
    try {
      setLoading(report.id);
      setMessage("");
      const queryParams = new URLSearchParams({ format });
      const url = `http://localhost:5000/api${report.endpoint}?${queryParams}`;
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`Failed to download report: ${response.statusText}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${report.id}-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      setMessage(`✅ ${report.name} downloaded successfully as ${format.toUpperCase()}`);
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">REPORTS MODULE</span>
          <h1>📑 Generate Reports</h1>
          <p>Download comprehensive PDF and Excel reports for all school operations</p>
        </div>
      </div>

      {message && (
        <div className={`report-message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
          <button onClick={() => setMessage("")} className="message-close">×</button>
        </div>
      )}

      <div className="reports-container">
        {groups.map((group) => (
          <section className="reports-group" key={group.label}>
            <div className="reports-group-heading"><span className="eyebrow">REPORT LIBRARY</span><h2>{group.label}</h2></div>
            <div className="reports-grid">
          {reports.filter((report) => group.ids.includes(report.id)).map((report) => (
            <div key={report.id} className="report-card panel">
              <div className="report-header">
                <h3>{report.name}</h3>
                <p className="report-description">{report.description}</p>
              </div>
              <div className="report-actions">
                <button 
                  className="report-btn pdf-btn" 
                  onClick={() => downloadReport(report, 'pdf')}
                  disabled={loading === report.id}
                >
                  {loading === report.id ? '⏳ Generating...' : '📕 PDF'}
                </button>
                <button 
                  className="report-btn pdf-btn" 
                  onClick={() => downloadReport(report, 'xlsx')}
                  disabled={loading === report.id}
                >
                  {loading === report.id ? '⏳ Generating...' : '📊 Excel'}
                </button>
                <button 
                  className="report-btn csv-btn" 
                  onClick={() => downloadReport(report, 'csv')}
                  disabled={loading === report.id}
                >
                  {loading === report.id ? '⏳ Generating...' : '📄 CSV'}
                </button>
              </div>
            </div>
          ))}
            </div>
          </section>
        ))}
      </div>

      <section className="panel info-section">
        <span className="eyebrow">ℹ️ REPORT INFORMATION</span>
        <h2>About the reports</h2>
        <div className="info-grid">
          <div className="info-item">
            <strong>Student Reports</strong>
            <p>Get comprehensive student information including admission details, class-wise lists, and admission tracking.</p>
          </div>
          <div className="info-item">
            <strong>Fee Reports</strong>
            <p>Monitor daily and monthly fee collections, identify defaulters, and track outstanding balances by class.</p>
          </div>
          <div className="info-item">
            <strong>Academic Reports</strong>
            <p>Review attendance records, examination results, class-wise performance, and identify top performers.</p>
          </div>
          <div className="info-item">
            <strong>Administrative Reports</strong>
            <p>Track student promotions and movements between classes for better academic planning.</p>
          </div>
        </div>
      </section>

      <section className="panel tips-section">
        <span className="eyebrow">💡 TIPS</span>
        <h2>How to use reports effectively</h2>
        <ul>
          <li>✅ Use <strong>Excel format</strong> for detailed analysis and sorting in spreadsheets</li>
          <li>✅ Use <strong>CSV format</strong> for importing data into other systems</li>
          <li>✅ Generate <strong>daily fee collection</strong> reports to track daily income</li>
          <li>✅ Review <strong>defaulter reports</strong> regularly to follow up on pending payments</li>
          <li>✅ Analyze <strong>class-wise results</strong> to identify academic trends</li>
          <li>✅ Share <strong>top position holders</strong> report for motivation and recognition</li>
        </ul>
      </section>
    </>
  );
}
