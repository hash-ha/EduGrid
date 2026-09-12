import React, { useState } from 'react';

const ResultsPortal = ({ API }) => {
  const [searchType, setSearchType] = useState('rollNo');
  const [searchValue, setSearchValue] = useState('');
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchValue.trim()) {
      setError('Please enter a Roll Number or Admission Number.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResultData(null);

      const payload = searchType === 'rollNo'
        ? { rollNo: searchValue.trim() }
        : { admissionNo: searchValue.trim() };

      const res = await fetch(`${API}/public/results/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setSearched(true);

      if (!res.ok || !data.success) {
        setError(data.message || 'Student record not found');
        return;
      }

      setResultData(data.data);
    } catch (err) {
      setError('Connection error occurred while retrieving examination records.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const student = resultData?.student;
  const exams = resultData?.exams || [];

  return (
    <div className="public-page results-page">
      <div className="page-header">
        <h1>Results Portal</h1>
        <p>Official Online Academic Performance &amp; Marksheet Verification</p>
      </div>

      <div className="page-container">
        <section className="results-intro">
          <p>Verify student academic performance, term examinations, and subject-wise grades. Select your preferred identification method below and enter the number.</p>
        </section>

        <section className="search-section">
          <form className="results-search-form" onSubmit={handleSearch}>
            <div className="search-options">
              <label>
                <input type="radio" name="searchType" value="rollNo" checked={searchType === 'rollNo'} onChange={(e) => { setSearchType(e.target.value); setResultData(null); setError(null); }} /> Search by Roll Number
              </label>
              <label>
                <input type="radio" name="searchType" value="admissionNo" checked={searchType === 'admissionNo'} onChange={(e) => { setSearchType(e.target.value); setResultData(null); setError(null); }} /> Search by Admission Number
              </label>
            </div>

            <div className="search-input-group">
              <input
                type="text"
                placeholder={searchType === 'rollNo' ? 'Enter Roll Number (e.g., 001)' : 'Enter Admission Number (e.g., ADM-2024-001)'}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="search-input"
                autoFocus
              />
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Searching...' : 'Check Result 🔍'}</button>
            </div>
          </form>
        </section>

        {error && (
          <section className="error-section">
            <div className="error-box"><p>⚠️ {error}</p></div>
          </section>
        )}

        {resultData && student && (
          <section className="results-section">
            <div className="result-card">
              <div className="result-card-header">
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏫</div>
                <h2>Excellence Academy</h2>
                <p>Official Academic Progress Transcript &amp; Result Sheet</p>
              </div>

              <div className="student-meta-grid">
                <div className="meta-item"><span className="meta-label">Student Name:</span><span className="meta-val">{student.name}</span></div>
                <div className="meta-item"><span className="meta-label">Father's Name:</span><span className="meta-val">{student.fatherName || 'Guardian'}</span></div>
                <div className="meta-item"><span className="meta-label">Roll Number:</span><span className="meta-val">{student.rollNo}</span></div>
                <div className="meta-item"><span className="meta-label">Admission No:</span><span className="meta-val">{student.admissionNo}</span></div>
                <div className="meta-item"><span className="meta-label">Class & Section:</span><span className="meta-val">{student.class} - Section {student.section || 'A'}</span></div>
              </div>

              {exams.length > 0 ? exams.map((exam, idx) => (
                <div key={idx} style={{ marginBottom: '2.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, color: 'var(--primary)' }}>📑 {exam.examName} ({exam.session})</h3>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Date: {exam.examDate}</span>
                  </div>

                  <table className="marksheet-table">
                    <thead>
                      <tr><th>Subject</th><th>Total Marks</th><th>Obtained Marks</th><th>Percentage</th><th>Grade</th><th>Remarks</th></tr>
                    </thead>
                    <tbody>
                      {exam.subjects && exam.subjects.length > 0 ? exam.subjects.map((subj, sIdx) => (
                        <tr key={sIdx}><td><strong>{subj.subject}</strong></td><td>{subj.totalMarks}</td><td>{subj.obtainedMarks}</td><td>{subj.percentage}%</td><td><span className="grade-badge">{subj.grade}</span></td><td>{subj.remarks}</td></tr>
                      )) : <tr><td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem' }}>Subject marks currently being processed by the examination board.</td></tr>}
                    </tbody>
                  </table>

                  <div className="result-summary-box">
                    <div><div className="summary-stat-val">{exam.totalObtained} / {exam.totalPossible}</div><div className="summary-stat-lbl">Total Score</div></div>
                    <div><div className="summary-stat-val">{exam.percentage}%</div><div className="summary-stat-lbl">Percentage</div></div>
                    <div><div className="summary-stat-val" style={{ color: 'var(--accent)' }}>{exam.grade}</div><div className="summary-stat-lbl">Overall Grade</div></div>
                    <div><div className="summary-stat-val status-badge pass">✓ {exam.status}</div><div className="summary-stat-lbl">Outcome</div></div>
                  </div>
                </div>
              )) : <div className="empty-box"><p>Examination marks for this session are currently pending publication.</p></div>}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
                <button className="btn btn-primary" onClick={() => window.print()}>🖨️ Print Marksheet</button>
                <button className="btn btn-secondary" onClick={() => { setResultData(null); setSearched(false); setSearchValue(''); setError(null); }}>New Search</button>
              </div>
            </div>
          </section>
        )}

        {!searched && (
          <section className="info-section">
            <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>How to Check Results</h2>
            <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
              <div className="step-card"><div className="step-icon">1️⃣</div><h3>Select Identifier</h3><p>Choose whether you are searching by Roll Number or Admission Number.</p></div>
              <div className="step-card"><div className="step-icon">2️⃣</div><h3>Enter Details</h3><p>Type your exact student Roll Number or Admission Number in the search box.</p></div>
              <div className="step-card"><div className="step-icon">3️⃣</div><h3>View Marksheet</h3><p>Instantly view subject marks, percentage, grade, and academic result overview.</p></div>
            </div>
          </section>
        )}

        <section className="portal-access">
          <h2>Access to Full Results Portal</h2>
          <p>For comprehensive results, detailed analysis, and performance tracking, students and parents can access the Student/Parent Portal using their login credentials.</p>
          <div className="portal-buttons">
            <button className="btn btn-secondary" onClick={() => window.location.href = '/admin'}>Go to Student &amp; Parent Portal →</button>
          </div>
        </section>

        <section className="help-section">
          <h2>Need Help?</h2>
          <div className="help-box">
            <p>If you face any issues accessing results or have questions, please contact us:</p>
            <p>📞 <strong>Phone:</strong> +1-800-123-4567</p>
            <p>✉️ <strong>Email:</strong> support@excellenceacademy.edu</p>
            <p>🕐 <strong>Office Hours:</strong> Monday - Friday: 9:00 AM - 4:00 PM</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ResultsPortal;
