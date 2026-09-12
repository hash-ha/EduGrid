import { useEffect, useState } from "react";

export default function AdminDashboard({ call, go, isAccountant = false, canReset = false, compactMode = false }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [voucherApplication, setVoucherApplication] = useState(null);
  const [issuedVoucher, setIssuedVoucher] = useState(null);
  const [showVoucherPreview, setShowVoucherPreview] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState('');
  const [resetting, setResetting] = useState(false);
  const [voucherDraft, setVoucherDraft] = useState({
    feeMonth: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    tuition: '',
    admission: '',
    annual: '',
    computer: '',
    examination: '',
    transport: '',
    other: '',
    previousBalance: '0',
    discount: '0',
    scholarship: '0',
    concession: '0',
    siblingDiscount: '0',
    fine: '0',
    advanceAmount: '0'
  });
  const canGenerateVoucher = Boolean(isAccountant);

  async function resetSchoolData(event) {
    event.preventDefault();
    setResetting(true);
    try {
      const result = await call('/system/reset-school-data', {
        method: 'POST',
        body: JSON.stringify({ confirmation: resetConfirmation })
      });
      setShowResetDialog(false);
      setResetConfirmation('');
      setError(result.message);
      await Promise.all([loadStats(), loadApplications()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setResetting(false);
    }
  }

  useEffect(() => {
    loadStats();
    loadMessages();
    loadApplications();
  }, [isAccountant]);

  async function loadStats() {
    try {
      setLoading(true);
      const data = await call('/dashboard/stats');
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages() {
    try {
      setLoadingMessages(true);
      const data = await call('/contact-messages');
      setMessages(data.data || []);
    } catch (err) {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }

  async function loadApplications() {
    try {
      setLoadingApplications(true);
      const data = await call('/admissions');
      setApplications((data.data || []).filter((application) => !['Accepted', 'Rejected'].includes(application.status)));
    } catch (err) {
      setApplications([]);
    } finally {
      setLoadingApplications(false);
    }
  }

  async function updateMessageStatus(id, status, replyMessage = '') {
    try {
      const payload = { status };
      if (replyMessage && String(replyMessage).trim()) {
        payload.replyMessage = String(replyMessage).trim();
      }

      await call(`/contact-messages/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      await loadMessages();
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateAdmissionStatus(id, status) {
    try {
      await call(`/admissions/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      if (['Accepted', 'Rejected'].includes(status)) {
        setApplications((current) => current.filter((application) => application._id !== id));
      } else {
        await loadApplications();
      }
    } catch (err) {
      setError(err.message);
    }
  }

  function openVoucherForm(application) {
    if (!canGenerateVoucher) {
      setError('Only the accountant can issue fee vouchers.');
      return;
    }
    setIssuedVoucher(null);
    setShowVoucherPreview(false);
    setVoucherApplication(application);
  }

  async function generateVoucherForApplication(event) {
    event.preventDefault();
    if (!canGenerateVoucher) {
      setError('Only the accountant can issue fee vouchers.');
      return;
    }
    try {
      const items = [
        ['Monthly Tuition Fee', voucherDraft.tuition],
        ['Admission Fee', voucherDraft.admission],
        ['Annual Fee', voucherDraft.annual],
        ['Computer Fee', voucherDraft.computer],
        ['Examination Fee', voucherDraft.examination],
        ['Transport Fee', voucherDraft.transport],
        ['Other Charges', voucherDraft.other]
      ].map(([type, amount]) => ({ type, amount: Number(amount || 0) })).filter((item) => item.amount > 0);
      if (!items.length) throw new Error('Enter at least one fee amount before issuing the voucher.');

      const data = await call(`/admissions/${voucherApplication._id}/generate-voucher`, {
        method: 'POST',
        body: JSON.stringify({
          ...voucherDraft,
          items,
          previousBalance: Number(voucherDraft.previousBalance || 0),
          discount: Number(voucherDraft.discount || 0),
          scholarship: Number(voucherDraft.scholarship || 0),
          concession: Number(voucherDraft.concession || 0),
          siblingDiscount: Number(voucherDraft.siblingDiscount || 0),
          fine: Number(voucherDraft.fine || 0),
          advanceAmount: Number(voucherDraft.advanceAmount || 0)
        })
      });
      setError(null);
      setIssuedVoucher(data.data.voucher);
      setShowVoucherPreview(false);
      await loadApplications();
    } catch (err) {
      setError(err.message);
    }
  }

  if (compactMode === 'applications') {
    return (
      <div className="page-content">
        <section className="panel review-panel application-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">ADMISSIONS</span>
              <h3 className="section-title">Admission applications</h3>
            </div>
            <span className="badge badge-new">{applications.length}</span>
          </div>

          {loadingApplications ? (
            <div className="loading-spinner">Loading applications...</div>
          ) : applications.length === 0 ? (
            <div className="empty-state"><p>No admission applications yet.</p></div>
          ) : (
            <div className="contact-message-list">
              {applications.map((a) => (
                <article className="contact-message-card application-card" key={a._id}>
                  <div className="contact-message-head">
                    <div>
                      <strong>{a.studentName}</strong>
                      <small>{a.fatherName} · {a.phone} · {a.email || 'No email'}</small>
                    </div>
                    {isAccountant ? (
                      <span className="badge badge-new">{a.status || 'Received'}</span>
                    ) : (
                      <select value={a.status || 'Pending'} onChange={(e) => updateAdmissionStatus(a._id, e.target.value)}>
                        <option>Pending</option>
                        <option>Reviewed</option>
                        <option>Received</option>
                        <option>Accepted</option>
                        <option>Rejected</option>
                      </select>
                    )}
                  </div>
                  <div className="contact-message-meta">
                    <span>{a.classApplying}</span>
                    <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p>{a.address}</p>
                  {canGenerateVoucher && (
                    <div className="application-actions">
                      <button className="primary-button small-button" onClick={() => openVoucherForm(a)}>
                        Generate Voucher
                      </button>
                    </div>
                  )}
                  {!canGenerateVoucher && (
                    <div className="application-actions">
                      <span className="badge badge-muted">Accountant only</span>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  if (loading) {
    return <div className="dashboard-state"><div className="loading-spinner">Loading dashboard...</div></div>;
  }

  if (error) {
    return <div className="dashboard-state"><div className="error-banner">Error: {error}</div></div>;
  }

  if (!stats) {
    return <div className="dashboard-state"><div className="empty-state"><p>No dashboard data available</p></div></div>;
  }

  const getDate = () => {
    const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
    const d = new Date();
    return `${days[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const formatCurrency = (amount) => {
    if (!amount) return "Rs 0";
    if (amount >= 1000000) return `Rs ${(amount / 1000000).toFixed(2)}m`;
    if (amount >= 1000) return `Rs ${(amount / 1000).toFixed(2)}k`;
    return `Rs ${amount.toLocaleString()}`;
  };

  return (
    <>
      {showResetDialog && (
        <div className="admission-modal">
          <form className="admission-form panel reset-dialog" onSubmit={resetSchoolData}>
            <button type="button" className="modal-close" onClick={() => setShowResetDialog(false)}>×</button>
            <span className="eyebrow reset-eyebrow">SUPER ADMIN CONTROL</span>
            <h2>Reset school data</h2>
            <p>This permanently deletes students, staff, fees, classes, exams, reports, notices, admissions, contacts and dependent user accounts. Super Admin and School Admin accounts will remain.</p>
            <label>Type <strong>RESET SCHOOL DATA</strong> to confirm<input value={resetConfirmation} onChange={(event) => setResetConfirmation(event.target.value)} placeholder="RESET SCHOOL DATA" autoComplete="off" required /></label>
            <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setShowResetDialog(false)}>Cancel</button><button className="danger-button" disabled={resetting || resetConfirmation !== 'RESET SCHOOL DATA'}>{resetting ? 'Resetting...' : 'Reset everything'}</button></div>
          </form>
        </div>
      )}
      {voucherApplication && (
        <div className="admission-modal">
          <form className="admission-form panel" onSubmit={issuedVoucher ? (event) => event.preventDefault() : generateVoucherForApplication}>
            <button type="button" className="modal-close" onClick={() => { setVoucherApplication(null); setIssuedVoucher(null); }}>×</button>
            {!issuedVoucher ? (
              <>
                <span className="eyebrow">ACCOUNTANT VOUCHER</span>
                <h2>Issue fee voucher</h2>
                <div className="contact-message-meta">
                  <span>{voucherApplication.studentName}</span>
                  <span>{voucherApplication.fatherName} · {voucherApplication.classApplying}</span>
                </div>
                <div className="form-grid">
                  <label>Fee month<input value={voucherDraft.feeMonth} onChange={(event) => setVoucherDraft({ ...voucherDraft, feeMonth: event.target.value })} required /></label>
                  <label>Due date<input type="date" value={voucherDraft.dueDate} onChange={(event) => setVoucherDraft({ ...voucherDraft, dueDate: event.target.value })} required /></label>
                  {[
                    ['tuition', 'Monthly Tuition Fee'], ['admission', 'Admission Fee'], ['annual', 'Annual Fee'],
                    ['computer', 'Computer Fee'], ['examination', 'Examination Fee'], ['transport', 'Transport Fee'],
                    ['other', 'Other Charges'], ['previousBalance', 'Previous Balance'], ['fine', 'Fine'],
                    ['discount', 'Discount'], ['scholarship', 'Scholarship'], ['concession', 'Concession'],
                    ['siblingDiscount', 'Sibling Discount'], ['advanceAmount', 'Advance Amount']
                  ].map(([key, label]) => (
                    <label key={key}>{label}<input type="number" min="0" value={voucherDraft[key]} onChange={(event) => setVoucherDraft({ ...voucherDraft, [key]: event.target.value })} /></label>
                  ))}
                </div>
                <div className="form-actions">
                  <button type="submit" className="primary-button">Issue Voucher</button>
                  <button type="button" className="secondary-button" onClick={() => setVoucherApplication(null)}>Cancel</button>
                </div>
              </>
            ) : showVoucherPreview ? (
              <>
                <span className="eyebrow">EDUGRID</span>
                <h2>Voucher Preview</h2>
                <div className="contact-message-meta">
                  <span><strong>{issuedVoucher.voucherNo}</strong></span>
                  <span>Issued: {new Date(issuedVoucher.issueDate).toLocaleDateString()}</span>
                </div>
                <div className="contact-message-meta">
                  <span>Student: <strong>{issuedVoucher.student?.name || voucherApplication.studentName}</strong></span>
                  <span>Father: {issuedVoucher.student?.fatherName || voucherApplication.fatherName}</span>
                </div>
                <div className="contact-message-meta">
                  <span>Fee month: {issuedVoucher.feeMonth}</span>
                  <span>Due: {new Date(issuedVoucher.dueDate).toLocaleDateString()}</span>
                </div>
                <div className="voucher-preview-lines">
                  {(issuedVoucher.items || []).map((item) => (
                    <div className="contact-message-meta" key={item.type}>
                      <span>{item.type}</span>
                      <strong>Rs {Number(item.amount || 0).toLocaleString()}</strong>
                    </div>
                  ))}
                  <div className="contact-message-meta voucher-preview-total">
                    <strong>Total payable</strong>
                    <strong>Rs {Number(issuedVoucher.totalPayable || 0).toLocaleString()}</strong>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="secondary-button" onClick={() => setShowVoucherPreview(false)}>Back</button>
                  <button type="button" className="primary-button" onClick={() => window.print()}>Print Preview</button>
                </div>
              </>
            ) : (
              <>
                <span className="eyebrow">VOUCHER ISSUED</span>
                <h2>{issuedVoucher.voucherNo}</h2>
                <p><strong>{issuedVoucher.student?.name || voucherApplication.studentName}</strong> · {issuedVoucher.feeMonth}</p>
                <p>Total payable: <strong>Rs {Number(issuedVoucher.totalPayable || 0).toLocaleString()}</strong></p>
                <p>Registration remains pending until this voucher is fully paid.</p>
                <div className="form-actions">
                  <button type="button" className="secondary-button" onClick={() => setShowVoucherPreview(true)}>Preview Voucher</button>
                  <button type="button" className="primary-button" onClick={() => setVoucherApplication(null)}>Done</button>
                </div>
              </>
            )}
          </form>
        </div>
      )}
      <div className={`page-heading ${canReset ? "super-admin-heading" : ""}`}>
        <div>
          <span className="eyebrow">{canReset ? "SUPER ADMIN CONTROL CENTER" : getDate()}</span>
          <h1>{canReset ? "Command the whole school system" : "School Dashboard"}</h1>
          <p>{canReset ? "A strategic view of people, money, learning, and system health." : "Real-time overview of your school's operations and key metrics"}</p>
        </div>
        {!isAccountant && (
          <div className="heading-actions">
            {!isAccountant && <button className="primary-button" onClick={() => go("admission")}>➕ Add student</button>}
            {canReset && <button className="danger-button" onClick={() => setShowResetDialog(true)}>Reset school data</button>}
          </div>
        )}
      </div>

      <div className={`admin-dashboard ${canReset ? "super-admin-command-center" : ""}`}>
        {canReset && (
          <section className="system-health-strip">
            <div><span className="health-dot" /><strong>All systems operational</strong><small>Live data sync is active</small></div>
            <div><span>Academic session</span><b>2026 / 27</b></div>
            <div><span>Workspace mode</span><b>Strategic oversight</b></div>
            <div className="health-actions"><button className="secondary-button" onClick={() => go("reports")}>Open reports</button><button className="danger-button" onClick={() => setShowResetDialog(true)}>System reset</button></div>
          </section>
        )}
        <div className="stats-section dashboard-priority-metrics">
          <div className="section-heading">
            <div>
              <span className="eyebrow">LIVE OPERATIONS</span>
              <h3 className="section-title">Key metrics</h3>
            </div>
            <span className="metric-refresh">Updated from live records</span>
          </div>
          <div className="stat-grid">
            <Stat icon="👥" label="Active students" value={stats.totalStudents} tone="blue" />
            <Stat icon="👨‍🏫" label="Active teachers" value={stats.totalTeachers} tone="mint" />
            <Stat icon="🏫" label="Classes" value={stats.totalClasses} tone="indigo" />
            <Stat icon="💰" label="Today collected" value={formatCurrency(stats.todayCollection)} tone="rose" />
          </div>
          <div className="metric-insights">
            <section className="metric-chart panel">
              <div className="panel-header"><span className="eyebrow">LAST 7 DAYS</span><h2>Collection pulse</h2></div>
              <div className="sparkline-bars">
                {(stats.collectionTrend || []).map((point) => {
                  const max = Math.max(...(stats.collectionTrend || []).map((item) => item.total), 1);
                  return <div className="sparkline-column" key={point._id} title={`${point._id}: Rs ${point.total.toLocaleString()}`}><span style={{ height: `${Math.max(8, (point.total / max) * 100)}%` }} /><small>{point._id.slice(5)}</small></div>;
                })}
                {!stats.collectionTrend?.length && <div className="chart-empty">No payments recorded in the last seven days.</div>}
              </div>
            </section>
            <section className="pipeline-card panel">
              <div className="panel-header"><span className="eyebrow">STUDENT PIPELINE</span><h2>Registration stages</h2></div>
              <div className="pipeline-list">{(stats.admissionPipeline || []).map((item) => <div className="pipeline-row" key={item._id}><span>{item._id}</span><b>{item.count}</b><i><em style={{ width: `${Math.min(100, (item.count / Math.max(stats.totalStudents, 1)) * 100)}%` }} /></i></div>)}</div>
            </section>
          </div>
          <div className="stat-grid compact-metrics">
            <Stat icon="💵" label="Monthly collection" value={formatCurrency(stats.monthlyCollection)} tone="gold" />
            <Stat icon="🏦" label="All-time collections" value={formatCurrency(stats.lifetimeCollection)} tone="teal" />
            <Stat icon="⚠️" label="Pending fees" value={formatCurrency(stats.pendingFees)} tone="amber" />
            <Stat icon="😔" label="Absent today" value={stats.absentStudents} tone="coral" />
            <Stat icon="📈" label="Recent results" value={stats.recentResults.length} tone="teal" />
          </div>
        </div>

        <div className="review-grid">
          <section className="contact-review-panel review-panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">CONTACT CENTER</span>
                <h3 className="section-title">Latest Contact Messages</h3>
              </div>
              <span className="badge">{messages.length}</span>
            </div>

            {loadingMessages ? (
              <div className="loading-spinner">Loading contact messages...</div>
            ) : messages.length === 0 ? (
              <div className="empty-state"><p>No contact messages yet.</p></div>
            ) : (
              <div className="contact-message-list">
                {messages.map((m) => (
                  <article className="contact-message-card" key={m._id}>
                    <div className="contact-message-head">
                      <div>
                        <strong>{m.name}</strong>
                        <small>{m.email} · {m.phone || 'No phone'}</small>
                      </div>
                      <select value={m.status || 'New'} onChange={(e) => updateMessageStatus(m._id, e.target.value, replyDrafts[m._id] ?? '')}>
                        <option>New</option>
                        <option>Read</option>
                        <option>Replied</option>
                        <option>Accepted</option>
                      </select>
                    </div>
                    <div className="contact-message-meta">
                      <span>{m.subject || 'General Inquiry'}</span>
                      <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p>{m.message}</p>
                    {m.status === 'Replied' && m.replyMessage && (
                      <div className="reply-note">
                        <span className="reply-label">Reply:</span>
                        <span>{m.replyMessage}</span>
                      </div>
                    )}
                    <div className="reply-box">
                      <textarea
                        className="reply-textarea"
                        rows="2"
                        value={replyDrafts[m._id] ?? (m.replyMessage || '')}
                        onChange={(e) => setReplyDrafts({ ...replyDrafts, [m._id]: e.target.value })}
                        placeholder="Write a reply..."
                      />
                      <button className="reply-button" onClick={() => updateMessageStatus(m._id, 'Replied', replyDrafts[m._id] ?? '')}>
                        Reply
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="contact-review-panel review-panel application-panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">ADMISSIONS</span>
                <h3 className="section-title">Latest Admission Applications</h3>
              </div>
              <span className="badge badge-new">{applications.length}</span>
            </div>

            {loadingApplications ? (
              <div className="loading-spinner">Loading applications...</div>
            ) : applications.length === 0 ? (
              <div className="empty-state"><p>No admission applications yet.</p></div>
            ) : (
              <div className="contact-message-list">
                {applications.map((a) => (
                  <article className="contact-message-card application-card" key={a._id}>
                    <div className="contact-message-head">
                      <div>
                        <strong>{a.studentName}</strong>
                        <small>{a.fatherName} · {a.phone} · {a.email || 'No email'}</small>
                      </div>
                      {isAccountant ? (
                        <span className="badge badge-new">{a.status || 'Received'}</span>
                      ) : (
                        <select value={a.status || 'Pending'} onChange={(e) => updateAdmissionStatus(a._id, e.target.value)}>
                          <option>Pending</option>
                          <option>Reviewed</option>
                          <option>Received</option>
                          <option>Accepted</option>
                          <option>Rejected</option>
                        </select>
                      )}
                    </div>
                    <div className="contact-message-meta">
                      <span>{a.classApplying}</span>
                      <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p>{a.address}</p>
                    {canGenerateVoucher && (
                      <div className="application-actions">
                        <button className="primary-button small-button" onClick={() => openVoucherForm(a)}>
                          Generate Voucher
                        </button>
                      </div>
                    )}
                    {!canGenerateVoucher && (
                      <div className="application-actions">
                        <span className="badge badge-muted">Accountant only</span>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="dashboard-content">
          <section className="panel action-panel">
            <div className="panel-header">
              <span className="eyebrow">⚡ QUICK ACCESS</span>
              <h2>{canReset ? "Control room shortcuts" : "Navigate to modules"}</h2>
            </div>
            <div className="quick-actions">
              {canReset && <ActionButton icon="◈" label="Review reports" onClick={() => go("reports")} />}
              <ActionButton icon="👥" label="Manage Students" onClick={() => go("students")} />
              <ActionButton icon="👨‍🏫" label="Manage Teachers" onClick={() => go("staff")} />
              <ActionButton icon="💳" label="Fee Management" onClick={() => go("fees")} />
              <ActionButton icon="✓" label="Mark Attendance" onClick={() => go("attendance")} />
              <ActionButton icon="📝" label="Manage Exams" onClick={() => go("results")} />
              <ActionButton icon="📢" label="Publish Notices" onClick={() => go("notices")} />
            </div>
          </section>

          <section className="panel results-panel">
            <div className="panel-header">
              <span className="eyebrow">📚 RECENT EXAMS</span>
              <h2>Latest assessments</h2>
            </div>
            {stats.recentResults.length === 0 ? (
              <div className="empty-state-small">No recent exam results</div>
            ) : (
              <div className="results-table">
                <div className="table-header">
                  <div className="col-exam">Exam</div>
                  <div className="col-class">Class</div>
                  <div className="col-date">Date</div>
                  <div className="col-result">Passed</div>
                </div>
                <div className="table-body">
                  {stats.recentResults.map((exam) => (
                    <div className="table-row" key={exam._id}>
                      <div className="col-exam">{exam.name}</div>
                      <div className="col-class">{exam.className}</div>
                      <div className="col-date">{new Date(exam.examDate).toLocaleDateString()}</div>
                      <div className="col-result"><span className="badge-success">{exam.passed}/{exam.totalMarks}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        <section className="panel info-panel">
          <div className="panel-header">
            <span className="eyebrow">💡 TIPS</span>
            <h2>Keep operations running smoothly</h2>
          </div>
          <div className="info-content">
            <p>
              ✅ Monitor key metrics regularly to ensure school operations are running efficiently<br/>
              ✅ Keep attendance records updated for accurate reporting<br/>
              ✅ Track fee collections to manage cash flow effectively<br/>
              ✅ Review exam results to identify performance trends
            </p>
            <button className="text-button" onClick={() => go("students")}>
              View student register →
            </button>
          </div>
        </section>
      </div>
    </>
  );
}

function Stat({ icon, label, value, tone }) {
  return (
    <div className={`stat-card ${tone}`}>
      <span className="stat-icon">{icon}</span>
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <strong className="stat-value">{value}</strong>
      </div>
    </div>
  );
}

function ActionButton({ icon, label, onClick }) {
  return (
    <button className="action-btn" onClick={onClick}>
      <span className="action-icon">{icon}</span>
      <span className="action-label">{label}</span>
    </button>
  );
}
