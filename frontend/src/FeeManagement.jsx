import { useEffect, useState } from "react";

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

export default function FeeManagement({
  structures,
  students,
  form,
  setForm,
  submit,
  generate,
  selectPolicy,
  copyPolicy,
  archivePolicy,
  busy,
}) {
  const [generation, setGeneration] = useState({ feeMonth: "September 2026", dueDate: "2026-09-15" });
  const updateItem = (type, value) =>
    setForm({ ...form, items: { ...form.items, [type]: value } });
  const updateFrequency = (type, value) =>
    setForm({ ...form, frequencies: { ...(form.frequencies || {}), [type]: value } });
  const currentPolicy = structures.find((item) => !item.student && item.className === form.className && item.session === form.session);
  useEffect(() => {
    if (currentPolicy && form.editingId !== currentPolicy._id && form.editingId !== "copy") selectPolicy(currentPolicy.className, currentPolicy.session);
  }, [currentPolicy?._id, form.className, form.session]);
  return (
    <section className="panel fee-structure-panel">
      <div className="table-toolbar">
        <div>
          <span className="eyebrow">FEE POLICY</span>
          <strong>Class and student fee structures</strong>
        </div>
        <span>{structures.length} active</span>
      </div>
      <form onSubmit={submit}>
        <div className="form-grid">
          <label>
            Class
            <select
              value={form.className}
              onChange={(event) =>
                setForm({ ...form, className: event.target.value, editingId: "" })
              }
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
              onChange={(event) =>
                setForm({ ...form, session: event.target.value, editingId: "" })
              }
              required
            />
          </label>
          {currentPolicy && <div className="policy-loaded"><strong>Saved policy loaded</strong><span>Editing the current {form.className} policy</span></div>}
          <label>
            Student override
            <select
              value={form.student}
              onChange={(event) =>
                setForm({ ...form, student: event.target.value })
              }
            >
              <option value="">Whole class</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.name} · {student.admissionNo}
                </option>
              ))}
            </select>
          </label>
          {feeTypes.map((type) => (
            <div className="fee-policy-field" key={type}>
              <label>{type}<input type="number" min="0" value={form.items[type]} onChange={(event) => updateItem(type, event.target.value)} /></label>
              <select value={form.frequencies?.[type] || (type === "Admission Fee" ? "admission" : type === "Annual Fee" ? "annual" : type === "Examination Fee" ? "examination" : "monthly")} onChange={(event) => updateFrequency(type, event.target.value)}>
                <option value="monthly">Monthly</option><option value="annual">Annual</option><option value="admission">Admission</option><option value="examination">Examination</option><option value="one_time">One time</option>
              </select>
            </div>
          ))}
          <label>
            Scholarship
            <input
              type="number"
              min="0"
              value={form.scholarship}
              onChange={(event) =>
                setForm({ ...form, scholarship: event.target.value })
              }
            />
          </label>
          <label>
            Concession
            <input
              type="number"
              min="0"
              value={form.concession}
              onChange={(event) =>
                setForm({ ...form, concession: event.target.value })
              }
            />
          </label>
          <label>
            Sibling discount
            <input
              type="number"
              min="0"
              value={form.siblingDiscount}
              onChange={(event) =>
                setForm({ ...form, siblingDiscount: event.target.value })
              }
            />
          </label>
        </div>
        <div className="form-actions">
          <button className="primary-button" disabled={busy}>{busy ? "Saving..." : form.editingId ? "Update fee structure" : "Save fee structure"} →</button>
          {currentPolicy && <button type="button" className="secondary-button" onClick={copyPolicy}>Copy to another class</button>}
        </div>
      </form>
        <div className="voucher-generation">
          <div className="eyebrow">MONTHLY VOUCHER GENERATION</div>
          <div className="form-grid">
            <label>Fee month<input value={generation.feeMonth} onChange={(event) => setGeneration({ ...generation, feeMonth: event.target.value })} /></label>
            <label>Due date<input type="date" value={generation.dueDate} onChange={(event) => setGeneration({ ...generation, dueDate: event.target.value })} /></label>
          </div>
          <div className="form-actions">
            <button type="button" className="secondary-button" disabled={busy || !currentPolicy} onClick={() => generate({ className: form.className, feeMonth: generation.feeMonth, dueDate: generation.dueDate })}>Generate for class</button>
            <button type="button" className="primary-button" disabled={busy} onClick={() => generate({ scope: "all", feeMonth: generation.feeMonth, dueDate: generation.dueDate })}>Generate for all active students</button>
          </div>
        </div>
      <div className="fee-structure-list">
        {structures.map((item) => (
          <article key={item._id}>
            <strong>{item.student?.name || item.className}</strong>
            <span>
              {item.session} ·{" "}
              {item.items
                .map((fee) => `${fee.type}: Rs ${fee.amount}`)
                .map((fee) => `${fee.type}: Rs ${fee.amount} (${fee.frequency || "monthly"})`)
                .join(" · ")}
            </span>
              {!item.student && <div className="form-actions"><button type="button" className="table-action" onClick={() => selectPolicy(item.className, item.session)}>Edit</button><button type="button" className="table-action" onClick={() => archivePolicy(item._id)}>Archive</button></div>}
          </article>
        ))}
      </div>
    </section>
  );
}
