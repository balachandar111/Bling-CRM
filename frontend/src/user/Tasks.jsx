// 📁 frontend/src/user/Tasks.jsx
// User: submit today's report + update it separately + browse own reports.
// Admin (super_admin): read-only — browse ALL users' reports by calendar date.

import React, { useState, useEffect, useCallback } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import API from "../services/api";

/* ─── helpers ─── */
const toDateStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const todayStr = toDateStr(new Date());

/* ─── to-do list options, by department ───
   Each department gets its own fixed checklist, plus a final "Other"
   option where the employee types their own task text dynamically.
   "general" is the fallback used when the employee has no department
   set yet. Kept in sync with backend/controllers/taskController.js. */
const DEPARTMENT_TASK_PRESETS = {
  sales: ["Daily Followup", "New Leads", "Payment Followup", "Requirement"],
  // Operation and Business Development Executive are the same role —
  // both share this one checklist (kept in sync with the backend key).
  business_development: [
    "Application testing",
    "New module testing",
    "Quick commerce",
    "Warehouse inventory checking",
    "Calling",
    "Follow up",
  ],
   it: ["Website", "CRM", "Rewards", "Modules", "Testing","Deployment","Custom Application"],
  general: [
    "Follow-up with leads",
    "Client / Site visit",
    "Documentation & Reports",
    "Team meeting / Coordination",
  ],
};
const CUSTOM_OPTION = "__custom__";

/* Display labels for the department badge on the Tasks page. */
const DEPARTMENT_LABELS = {
  sales: "Sales",
  business_development: "Operation / Business Development",
  it: "IT",
};

/* "Payment" is not a default preset — it's appended to the dropdown
   only for employees whose department qualifies (Sales / Business
   Development Executive), per the backend's `showPayment` flag.
   Selecting it reveals a payment-status sub-checklist. */
const PAYMENT_OPTION = "Payment";
const PAYMENT_PREFIX = "Payment: ";
const DEFAULT_PAYMENT_STATUSES = ["Advance Payment", "Payment Pending", "Collected"];

/* Buttons for the admin's "Today" quick filter — clicking one opens a
   popup with every employee's task updates for today in that category. */
const TODAY_CATEGORIES = [
  { key: "operation", label: "Operation" },
  { key: "sales", label: "Sales" },
  { key: "it", label: "IT" },
  { key: "others", label: "Others" },
  { key: "payment", label: "Payment" },
];

const Tasks = ({ role, setSidebarOpen }) => {
  const isAdmin = role === "super_admin";

  /* ── today's to-do list state (user only) ── */
  const [items, setItems]             = useState([]); // [{ text, completed }]
  const [departmentKey, setDepartmentKey] = useState("general"); // sales | operation | it | general
  const [showPayment, setShowPayment] = useState(false); // Sales / Business Development Executive only
  const [paymentStatuses, setPaymentStatuses] = useState(DEFAULT_PAYMENT_STATUSES);
  const basePresets = DEPARTMENT_TASK_PRESETS[departmentKey] || DEPARTMENT_TASK_PRESETS.general;
  const presets = showPayment ? [...basePresets, PAYMENT_OPTION] : basePresets;
  const [selectedPreset, setSelectedPreset] = useState(presets[0]);
  const [customText, setCustomText]   = useState("");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("");
  const [noteText, setNoteText]       = useState(""); // optional note for whichever item is about to be added
  const [todayTask, setTodayTask]     = useState(null);
  const [submitting, setSubmitting]   = useState(false);
  const [updating, setUpdating]       = useState(false);
  const [savedMsg, setSavedMsg]       = useState("");   // "submitted" | "updated" | ""

  /* ── calendar viewer state (both roles) ── */
  const [selectedDate, setSelectedDate]           = useState(new Date());
  const [dateReports, setDateReports]             = useState([]);
  const [loadingDateReports, setLoadingDateReports] = useState(false);
  const [markedDates, setMarkedDates]             = useState([]);

  /* ── admin: date x department task summary table ── */
  const [summaryRows, setSummaryRows]         = useState([]);
  const [loadingSummary, setLoadingSummary]   = useState(false);
  const [summaryFrom, setSummaryFrom]         = useState(""); // "" = no filter
  const [summaryTo, setSummaryTo]             = useState(""); // "" = no filter

  /* ── admin: "Today" quick filter → category popup ── */
  const [todayCategoryOpen, setTodayCategoryOpen] = useState(null); // "operation" | "sales" | "it" | "others" | "payment" | null
  const [todayCategoryData, setTodayCategoryData] = useState([]);   // [{ employeeName, items: [{text, note, completed}] }]
  const [loadingTodayCategory, setLoadingTodayCategory] = useState(false);

  /* ── user: edit a PREVIOUS day's task list from the calendar viewer
     below (not just today's, which has its own editor above). ── */
  const [isEditingDateReport, setIsEditingDateReport] = useState(false);
  const [editDateItems, setEditDateItems] = useState([]); // [{ text, note, completed }]
  const [editDatePreset, setEditDatePreset] = useState("");
  const [editDateCustomText, setEditDateCustomText] = useState("");
  const [editDatePaymentStatus, setEditDatePaymentStatus] = useState("");
  const [editDateNote, setEditDateNote] = useState("");
  const [savingDateEdit, setSavingDateEdit] = useState(false);

  /* ── fetch today's saved task list ── */
  const fetchToday = useCallback(async () => {
    try {
      const { data } = await API.get("/tasks/report/today");
      const deptKey = data.departmentKey || "general";
      const paymentAllowed = !!data.showPayment;
      setDepartmentKey(deptKey);
      setShowPayment(paymentAllowed);
      if (Array.isArray(data.paymentStatuses) && data.paymentStatuses.length) {
        setPaymentStatuses(data.paymentStatuses);
      }
      const deptPresets = DEPARTMENT_TASK_PRESETS[deptKey] || DEPARTMENT_TASK_PRESETS.general;
      const fullPresets = paymentAllowed ? [...deptPresets, PAYMENT_OPTION] : deptPresets;
      setSelectedPreset(fullPresets[0]);
      setSelectedPaymentStatus("");
      if (data.task) {
        setTodayTask(data.task);
        setItems(data.task.items && data.task.items.length ? data.task.items : []);
      } else {
        setTodayTask(null);
        setItems([]);
      }
    } catch {}
  }, []);

  /* ── fetch reports for a specific date ── */
  const fetchForDate = useCallback(
    async (dateStr) => {
      setLoadingDateReports(true);
      try {
        const endpoint = isAdmin ? "/tasks/report/all" : "/tasks/report/my";
        const { data } = await API.get(`${endpoint}?from=${dateStr}&to=${dateStr}`);
        setDateReports(data.tasks || []);
      } catch {
        setDateReports([]);
      }
      setLoadingDateReports(false);
    },
    [isAdmin]
  );

  /* ── mark days that have a report ── */
  const fetchMonthMarks = useCallback(
    async (dateInMonth) => {
      const year  = dateInMonth.getFullYear();
      const month = dateInMonth.getMonth();
      const first = toDateStr(new Date(year, month, 1));
      const last  = toDateStr(new Date(year, month + 1, 0));
      try {
        const endpoint = isAdmin ? "/tasks/report/all" : "/tasks/report/my";
        const { data } = await API.get(`${endpoint}?from=${first}&to=${last}`);
        setMarkedDates(Array.from(new Set((data.tasks || []).map((t) => t.date))));
      } catch {
        setMarkedDates([]);
      }
    },
    [isAdmin]
  );

  useEffect(() => { if (!isAdmin) fetchToday(); }, [isAdmin, fetchToday]);
  useEffect(() => { fetchForDate(toDateStr(selectedDate)); }, [selectedDate, fetchForDate]);
  useEffect(() => { fetchMonthMarks(selectedDate); }, []); // eslint-disable-line

  /* ── admin: fetch the date x department task summary table ──
     `from`/`to` (both "YYYY-MM-DD") narrow the table down to a date
     range; passing the same value for both filters to a single day. */
  const fetchSummary = useCallback(async (from = "", to = "") => {
    if (!isAdmin) return;
    setLoadingSummary(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const qs = params.toString();
      const { data } = await API.get(`/tasks/report/summary${qs ? `?${qs}` : ""}`);
      setSummaryRows(data.rows || []);
    } catch {
      setSummaryRows([]);
    }
    setLoadingSummary(false);
  }, [isAdmin]);

  useEffect(() => { if (isAdmin) fetchSummary(); }, [isAdmin, fetchSummary]);

  /* ── admin: apply / clear the date filter above the summary table ── */
  const handleApplySummaryFilter = () => {
    fetchSummary(summaryFrom, summaryTo);
  };
  const handleClearSummaryFilter = () => {
    setSummaryFrom("");
    setSummaryTo("");
    fetchSummary();
  };

  /* ── admin: "Today" quick filter — click a category (Operation /
     Sales / IT / Others / Payment) to open a popup with every
     employee's task updates for today in that category. Fetched
     fresh on each click so the popup always reflects the latest
     submissions. ── */
  const handleOpenTodayCategory = async (categoryKey) => {
    setTodayCategoryOpen(categoryKey);
    setLoadingTodayCategory(true);
    try {
      const { data } = await API.get("/tasks/report/today-summary");
      setTodayCategoryData((data.buckets && data.buckets[categoryKey]) || []);
    } catch {
      setTodayCategoryData([]);
    }
    setLoadingTodayCategory(false);
  };
  const handleCloseTodayCategory = () => {
    setTodayCategoryOpen(null);
    setTodayCategoryData([]);
  };

  /* ── admin: download the summary table as an Excel file ── */
  const handleDownloadSummaryExcel = () => {
    const excelData = summaryRows.map((r) => ({
      "S.No": r.sno,
      Date: r.date,
      "Operation Task": r.operationTask,
      "Sales Task": r.salesTask,
      "IT Task": r.itTask,
      Others: r.others,
      Payment: r.payment,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Task Summary");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const fileData = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    // File name reflects whichever date filter is currently applied,
    // so a download for a specific date is clearly labelled.
    let suffix = todayStr;
    if (summaryFrom && summaryTo && summaryFrom === summaryTo) {
      suffix = summaryFrom;
    } else if (summaryFrom || summaryTo) {
      suffix = `${summaryFrom || "start"}_to_${summaryTo || "end"}`;
    }
    saveAs(fileData, `Employee_Task_Summary_${suffix}.xlsx`);
  };

  /* ─── ADD an item to today's to-do list ───
     Uses whichever preset is selected, the typed custom text for
     "Other", or — for "Payment" (Sales / Business Development only)
     — the chosen payment status (Advance / Payment Pending / Collected).
     An optional note (attached via the note box shown once a checklist
     option is picked) is saved alongside every item type. */
  const handleAddItem = () => {
    let text = "";
    if (selectedPreset === PAYMENT_OPTION) {
      if (!selectedPaymentStatus) {
        alert("Please select a payment status.");
        return;
      }
      text = `${PAYMENT_PREFIX}${selectedPaymentStatus}`;
    } else if (selectedPreset === CUSTOM_OPTION) {
      text = customText.trim();
      if (!text) {
        alert("Please type your task for the custom option.");
        return;
      }
    } else {
      text = selectedPreset;
    }
    setItems((prev) => [...prev, { text, note: noteText.trim(), completed: false }]);
    setCustomText("");
    setSelectedPaymentStatus("");
    setNoteText("");
  };

  /* ─── TOGGLE an item's completed state (end of day) ─── */
  const toggleItemCompleted = (index) => {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, completed: !it.completed } : it))
    );
  };

  /* ─── REMOVE an item before submitting ─── */
  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  /* ─── SUBMIT (create new task list for today) ─── */
  const handleSubmit = async () => {
    if (items.length === 0) {
      alert("Please add at least one task to your list before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      await API.post("/tasks/report", { items });
      setSavedMsg("submitted");
      await fetchToday();
      if (toDateStr(selectedDate) === todayStr) fetchForDate(todayStr);
      fetchMonthMarks(selectedDate);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit task list.");
    }
    setSubmitting(false);
    setTimeout(() => setSavedMsg(""), 3000);
  };

  /* ─── UPDATE (overwrite today's existing task list, e.g. after
     checking items off as "completed" at the end of the day) ─── */
  const handleUpdate = async () => {
    if (items.length === 0) {
      alert("Your task list can't be empty.");
      return;
    }
    setUpdating(true);
    try {
      await API.post("/tasks/report", { items }); // backend upserts
      setSavedMsg("updated");
      await fetchToday();
      if (toDateStr(selectedDate) === todayStr) fetchForDate(todayStr);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update task list.");
    }
    setUpdating(false);
    setTimeout(() => setSavedMsg(""), 3000);
  };

  const selectedDateStr = toDateStr(selectedDate);

  /* ─── EDIT a previous day's task list (calendar viewer, user only) ───
     Opens an inline editor pre-filled with whatever the employee already
     submitted for the selected date (or empty, if nothing was submitted
     that day) so they can add/remove/tick items for any past date, not
     just today. ─── */
  const startEditingDateReport = () => {
    const existing = dateReports[0];
    setEditDateItems(existing?.items ? existing.items.map((it) => ({ ...it })) : []);
    setEditDatePreset(presets[0]);
    setEditDateCustomText("");
    setEditDatePaymentStatus("");
    setEditDateNote("");
    setIsEditingDateReport(true);
  };

  const cancelEditingDateReport = () => {
    setIsEditingDateReport(false);
    setEditDateItems([]);
  };

  const addEditDateItem = () => {
    let text = "";
    if (editDatePreset === PAYMENT_OPTION) {
      if (!editDatePaymentStatus) {
        alert("Please select a payment status.");
        return;
      }
      text = `${PAYMENT_PREFIX}${editDatePaymentStatus}`;
    } else if (editDatePreset === CUSTOM_OPTION) {
      text = editDateCustomText.trim();
      if (!text) {
        alert("Please type your task for the custom option.");
        return;
      }
    } else {
      text = editDatePreset;
    }
    setEditDateItems((prev) => [...prev, { text, note: editDateNote.trim(), completed: false }]);
    setEditDateCustomText("");
    setEditDatePaymentStatus("");
    setEditDateNote("");
  };

  const toggleEditDateItemCompleted = (index) => {
    setEditDateItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, completed: !it.completed } : it))
    );
  };

  const removeEditDateItem = (index) => {
    setEditDateItems((prev) => prev.filter((_, i) => i !== index));
  };

  const saveEditedDateReport = async () => {
    if (editDateItems.length === 0) {
      alert("Please add at least one task before saving.");
      return;
    }
    setSavingDateEdit(true);
    try {
      await API.post("/tasks/report", { items: editDateItems, date: selectedDateStr });
      setIsEditingDateReport(false);
      await fetchForDate(selectedDateStr);
      fetchMonthMarks(selectedDate);
      if (selectedDateStr === todayStr) await fetchToday();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save the task list for this date.");
    }
    setSavingDateEdit(false);
  };

  // Reset any open date-editor whenever the selected date changes.
  useEffect(() => { setIsEditingDateReport(false); }, [selectedDateStr]);

  return (
    <div className="employee-page">

      {/* ── PAGE HEADER ── */}
      <div className="employee-topbar">
        <div className="header-left">
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            ☰
          </button>
          <div className="emp">
            <h1>📝 {isAdmin ? "Employee Task Lists" : "Tasks & Daily To-Do List"}</h1>
            <p>
              {isAdmin
                ? "View every employee's daily task list and completion status"
                : "Build your to-do list each morning, tick off completed tasks, and submit"}
            </p>
          </div>
        </div>
      </div>

      {/* ── TODAY'S REPORT CARD — USER ONLY ── */}
      {!isAdmin && (
        <div className="task-report-card">
          {/* Header row */}
          <div className="task-report-header">
            <div>
              <h3 style={{ margin: 0 }}>📅 Today's Task List</h3>
              <p style={{ marginTop: 4 }}>
                {todayStr}
                {departmentKey !== "general" && (
                  <span style={{ marginLeft: 8, color: "#4f46e5", fontWeight: 600 }}>
                    · {DEPARTMENT_LABELS[departmentKey] || departmentKey} checklist
                  </span>
                )}
              </p>
            </div>
            {todayTask && (
              <span className="task-submitted-badge">✅ Submitted</span>
            )}
          </div>

          {/* To-do list builder */}
          <div className="task-add-row">
            <select
              className="task-preset-select"
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
            >
              {presets.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
              <option value={CUSTOM_OPTION}>Other (type your own)…</option>
            </select>

            {selectedPreset === CUSTOM_OPTION && (
              <input
                type="text"
                className="task-custom-input"
                placeholder="Type your task…"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
              />
            )}

            {selectedPreset === PAYMENT_OPTION && (
              <select
                className="task-preset-select"
                value={selectedPaymentStatus}
                onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              >
                <option value="" disabled>Select payment status…</option>
                {paymentStatuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            )}

            <button type="button" className="task-add-btn" onClick={handleAddItem}>
              ➕ Add Task
            </button>
          </div>

          {/* Note box — shown once a checklist option is selected, so the
              employee can attach a short note to whichever item (preset,
              custom, or payment status) they're about to add. */}
          {selectedPreset && (
            <div className="task-add-row" style={{ marginTop: 8 }}>
              <input
                type="text"
                className="task-custom-input"
                placeholder={`Add a note about "${selectedPreset === PAYMENT_OPTION ? (selectedPaymentStatus || "Payment") : selectedPreset === CUSTOM_OPTION ? "this task" : selectedPreset}" (optional)…`}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                style={{ flex: 1 }}
              />
            </div>
          )}

          {/* Today's checklist */}
          {items.length === 0 ? (
            <p className="task-empty-hint">
              No tasks added yet — pick an option above and click "Add Task" to build today's list.
            </p>
          ) : (
            <ul className="task-item-checklist">
              {items.map((it, idx) => (
                <li key={idx} className={`task-item-row ${it.completed ? "is-done" : ""}`}>
                  <label className="task-item-checkbox-label">
                    <input
                      type="checkbox"
                      checked={it.completed}
                      onChange={() => toggleItemCompleted(idx)}
                    />
                    <span>
                      {it.text}
                      {it.note && (
                        <span style={{ display: "block", fontSize: 12, color: "#64748b", fontWeight: 400 }}>
                          📝 {it.note}
                        </span>
                      )}
                    </span>
                  </label>
                  <button
                    type="button"
                    className="task-item-remove"
                    onClick={() => removeItem(idx)}
                    title="Remove task"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Button row */}
          <div className="task-btn-row">
            {savedMsg && (
              <span className="task-saved-msg">
                {savedMsg === "updated" ? "✅ Task list updated!" : "✅ Task list submitted!"}
              </span>
            )}

            {/* SUBMIT — shown only when no task list exists yet today */}
            {!todayTask && (
              <button
                className="task-submit-btn"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Saving…" : "Submit Task List"}
              </button>
            )}

            {/* UPDATE — shown after a list exists; used to check items off
                as "completed" through the day and re-save at the end of the day */}
            {todayTask && (
              <button
                className="task-update-btn"
                onClick={handleUpdate}
                disabled={updating}
              >
                {updating ? "Updating…" : "✏️ Update Task List"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── DEPARTMENT TASK SUMMARY TABLE — ADMIN ONLY ── */}
      {isAdmin && (
        <div className="task-calendar-card" style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div>
              <h3 style={{ margin: "0 0 2px" }}>📋 Task Summary by Department</h3>
              <p style={{ margin: 0 }}>
                Every day's tasks, grouped into Operation / Sales / IT / Others / Payment as employees submit them.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <label style={{ fontSize: 12, color: "#64748b", display: "flex", flexDirection: "column", gap: 2 }}>
                From
                <input
                  type="date"
                  value={summaryFrom}
                  onChange={(e) => setSummaryFrom(e.target.value)}
                  max={summaryTo || undefined}
                  style={{ padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13 }}
                />
              </label>
              <label style={{ fontSize: 12, color: "#64748b", display: "flex", flexDirection: "column", gap: 2 }}>
                To
                <input
                  type="date"
                  value={summaryTo}
                  onChange={(e) => setSummaryTo(e.target.value)}
                  min={summaryFrom || undefined}
                  style={{ padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13 }}
                />
              </label>
              <button
                type="button"
                className="task-submit-btn"
                onClick={handleApplySummaryFilter}
                style={{ alignSelf: "flex-end" }}
              >
                🔍 Filter
              </button>
              {(summaryFrom || summaryTo) && (
                <button
                  type="button"
                  className="task-submit-btn"
                  onClick={handleClearSummaryFilter}
                  style={{ alignSelf: "flex-end", background: "#e2e8f0", color: "#334155" }}
                >
                  ✕ Clear
                </button>
              )}
              <button
                type="button"
                className="task-submit-btn"
                onClick={handleDownloadSummaryExcel}
                disabled={summaryRows.length === 0}
                style={{ alignSelf: "flex-end" }}
              >
                ⬇️ Download Excel
              </button>
            </div>
          </div>

          {/* ── "Today" quick filter — click a category to pop up
              today's task updates for that department ── */}
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>📌 Today's Filter:</span>
            {TODAY_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => handleOpenTodayCategory(cat.key)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: "1px solid #c7d2fe",
                  background: "#eef2ff",
                  color: "#4f46e5",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {(summaryFrom || summaryTo) && (
            <p style={{ margin: "10px 0 0", fontSize: 12, color: "#64748b" }}>
              Showing {summaryFrom && summaryTo && summaryFrom === summaryTo
                ? `records for ${formatDate(summaryFrom)}`
                : `records from ${summaryFrom ? formatDate(summaryFrom) : "the beginning"} to ${summaryTo ? formatDate(summaryTo) : "now"}`}
            </p>
          )}

          {loadingSummary ? (
            <p style={{ color: "#94a3b8", textAlign: "center", padding: "24px 0" }}>Loading…</p>
          ) : summaryRows.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px",
                color: "#94a3b8",
                background: "#f8fafc",
                borderRadius: 10,
                marginTop: 14,
              }}
            >
              <p style={{ margin: 0, fontSize: 14 }}>No employee task lists submitted yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto", marginTop: 14 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                    <th style={{ padding: "8px 10px", border: "1px solid #e2e8f0" }}>S.No</th>
                    <th style={{ padding: "8px 10px", border: "1px solid #e2e8f0" }}>Date</th>
                    <th style={{ padding: "8px 10px", border: "1px solid #e2e8f0" }}>Operation Task</th>
                    <th style={{ padding: "8px 10px", border: "1px solid #e2e8f0" }}>Sales Task</th>
                    <th style={{ padding: "8px 10px", border: "1px solid #e2e8f0" }}>IT Task</th>
                    <th style={{ padding: "8px 10px", border: "1px solid #e2e8f0" }}>Others</th>
                    <th style={{ padding: "8px 10px", border: "1px solid #e2e8f0" }}>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryRows.map((r) => (
                    <tr key={r.sno}>
                      <td style={{ padding: "8px 10px", border: "1px solid #e2e8f0" }}>{r.sno}</td>
                      <td style={{ padding: "8px 10px", border: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>{r.date}</td>
                      <td style={{ padding: "8px 10px", border: "1px solid #e2e8f0" }}>{r.operationTask || "—"}</td>
                      <td style={{ padding: "8px 10px", border: "1px solid #e2e8f0" }}>{r.salesTask || "—"}</td>
                      <td style={{ padding: "8px 10px", border: "1px solid #e2e8f0" }}>{r.itTask || "—"}</td>
                      <td style={{ padding: "8px 10px", border: "1px solid #e2e8f0" }}>{r.others || "—"}</td>
                      <td style={{ padding: "8px 10px", border: "1px solid #e2e8f0" }}>{r.payment || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── CALENDAR REPORT VIEWER — BOTH ROLES ── */}
      <div className="task-calendar-card">
        <h3 style={{ margin: "0 0 2px" }}>
          {isAdmin ? "👥 Employee Task Calendar" : "📊 My Task Calendar"}
        </h3>
        <p style={{ margin: "0 0 0" }}>
          {isAdmin
            ? "Pick a date to view every employee's task list for that day."
            : "Pick a date to view your task list for that day — use Edit to add or change any day's tasks, including previous days."}
        </p>

        <div className="task-calendar-inner">
          {/* Calendar widget */}
          <div style={{ flex: "0 0 auto" }}>
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              maxDate={new Date()}
              onActiveStartDateChange={({ activeStartDate }) =>
                activeStartDate && fetchMonthMarks(activeStartDate)
              }
              tileContent={({ date, view }) => {
                if (view !== "month") return null;
                if (!markedDates.includes(toDateStr(date))) return null;
                return (
                  <div
                    style={{
                      width: 6, height: 6,
                      borderRadius: "50%",
                      background: "#4f46e5",
                      margin: "3px auto 0",
                    }}
                  />
                );
              }}
            />
          </div>

          {/* Report list for selected date */}
          <div style={{ flex: "1 1 300px", minWidth: 0 }}>
            {/* Date label */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
                flexWrap: "wrap",
                gap: 6,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: "#4f46e5" }}>
                📅 {formatDate(selectedDateStr)}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {selectedDateStr === todayStr && (
                  <span style={{ color: "#94a3b8", fontSize: 11 }}>Today</span>
                )}
                {/* EDIT — user only. Lets an employee correct/build out their
                    own task list for the selected day, whether that's today
                    or a previous day, not just the "Today's Task List" card
                    above. Admins keep the read-only view. */}
                {!isAdmin && !loadingDateReports && !isEditingDateReport && (
                  <button
                    type="button"
                    className="task-update-btn"
                    style={{ padding: "4px 12px", fontSize: 12 }}
                    onClick={startEditingDateReport}
                  >
                    ✏️ Edit
                  </button>
                )}
              </div>
            </div>

            {loadingDateReports ? (
              <p style={{ color: "#94a3b8", textAlign: "center", padding: "24px 0" }}>
                Loading…
              </p>
            ) : !isAdmin && isEditingDateReport ? (
              <div className="task-report-card" style={{ padding: 0, border: "none", boxShadow: "none" }}>
                {/* To-do list builder for the selected date */}
                <div className="task-add-row">
                  <select
                    className="task-preset-select"
                    value={editDatePreset}
                    onChange={(e) => setEditDatePreset(e.target.value)}
                  >
                    {presets.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                    <option value={CUSTOM_OPTION}>Other (type your own)…</option>
                  </select>

                  {editDatePreset === CUSTOM_OPTION && (
                    <input
                      type="text"
                      className="task-custom-input"
                      placeholder="Type your task…"
                      value={editDateCustomText}
                      onChange={(e) => setEditDateCustomText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addEditDateItem()}
                    />
                  )}

                  {editDatePreset === PAYMENT_OPTION && (
                    <select
                      className="task-preset-select"
                      value={editDatePaymentStatus}
                      onChange={(e) => setEditDatePaymentStatus(e.target.value)}
                    >
                      <option value="" disabled>Select payment status…</option>
                      {paymentStatuses.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  )}

                  <button type="button" className="task-add-btn" onClick={addEditDateItem}>
                    ➕ Add Task
                  </button>
                </div>

                {editDatePreset && (
                  <div className="task-add-row" style={{ marginTop: 8 }}>
                    <input
                      type="text"
                      className="task-custom-input"
                      placeholder={`Add a note about "${editDatePreset === PAYMENT_OPTION ? (editDatePaymentStatus || "Payment") : editDatePreset === CUSTOM_OPTION ? "this task" : editDatePreset}" (optional)…`}
                      value={editDateNote}
                      onChange={(e) => setEditDateNote(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addEditDateItem()}
                      style={{ flex: 1 }}
                    />
                  </div>
                )}

                {editDateItems.length === 0 ? (
                  <p className="task-empty-hint">
                    No tasks yet for {formatDate(selectedDateStr)} — pick an option above and click "Add Task".
                  </p>
                ) : (
                  <ul className="task-item-checklist">
                    {editDateItems.map((it, idx) => (
                      <li key={idx} className={`task-item-row ${it.completed ? "is-done" : ""}`}>
                        <label className="task-item-checkbox-label">
                          <input
                            type="checkbox"
                            checked={it.completed}
                            onChange={() => toggleEditDateItemCompleted(idx)}
                          />
                          <span>
                            {it.text}
                            {it.note && (
                              <span style={{ display: "block", fontSize: 12, color: "#64748b", fontWeight: 400 }}>
                                📝 {it.note}
                              </span>
                            )}
                          </span>
                        </label>
                        <button
                          type="button"
                          className="task-item-remove"
                          onClick={() => removeEditDateItem(idx)}
                          title="Remove task"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="task-btn-row">
                  <button
                    type="button"
                    className="task-update-btn"
                    onClick={saveEditedDateReport}
                    disabled={savingDateEdit}
                  >
                    {savingDateEdit ? "Saving…" : "💾 Save Changes"}
                  </button>
                  <button
                    type="button"
                    className="task-submit-btn"
                    style={{ background: "#e2e8f0", color: "#334155" }}
                    onClick={cancelEditingDateReport}
                    disabled={savingDateEdit}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : dateReports.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "32px",
                  color: "#94a3b8",
                  background: "#f8fafc",
                  borderRadius: 10,
                }}
              >
                <p style={{ margin: 0, fontSize: 14 }}>
                  {isAdmin ? "No employee task lists for this date." : "No task list for this date."}
                </p>
              </div>
            ) : (
              <div className="task-report-list">
                {dateReports.map((t) => {
                  const hasItems = Array.isArray(t.items) && t.items.length > 0;
                  const doneCount = hasItems ? t.items.filter((it) => it.completed).length : 0;
                  return (
                    <div key={t._id} className="task-report-item">
                      {isAdmin && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 10,
                            flexWrap: "wrap",
                            gap: 6,
                          }}
                        >
                          <span className="task-user-badge">
                            👤 {t.user?.name || t.userName || "Unknown"}
                          </span>
                          <span style={{ color: "#94a3b8", fontSize: 11 }}>
                            {t.user?.email || ""}
                          </span>
                        </div>
                      )}

                      {hasItems ? (
                        <>
                          <div className="task-progress-label">
                            ✅ {doneCount} / {t.items.length} completed
                          </div>
                          <ul className="task-item-checklist task-item-checklist-readonly">
                            {t.items.map((it, idx) => (
                              <li
                                key={idx}
                                className={`task-item-row ${it.completed ? "is-done" : ""}`}
                              >
                                <span className="task-item-check-icon">
                                  {it.completed ? "✅" : "⬜"}
                                </span>
                                <span>
                                  {it.text}
                                  {it.note && (
                                    <span style={{ display: "block", fontSize: 12, color: "#64748b" }}>
                                      📝 {it.note}
                                    </span>
                                  )}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <p className="task-report-text">{t.report}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── "TODAY" CATEGORY POPUP — ADMIN ONLY ── */}
      {isAdmin && todayCategoryOpen && (
        <div className="modal-overlay" onClick={handleCloseTodayCategory}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 12,
              width: "min(560px, 92vw)",
              maxHeight: "80vh",
              overflowY: "auto",
              padding: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <h3 style={{ margin: 0 }}>
                {TODAY_CATEGORIES.find((c) => c.key === todayCategoryOpen)?.label} — Today's Task Updates
              </h3>
              <button
                type="button"
                onClick={handleCloseTodayCategory}
                style={{
                  border: "none",
                  background: "#f1f5f9",
                  borderRadius: 8,
                  width: 28,
                  height: 28,
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                ✕
              </button>
            </div>
            <p style={{ margin: "0 0 14px", fontSize: 12, color: "#64748b" }}>
              📅 {formatDate(todayStr)}
            </p>

            {loadingTodayCategory ? (
              <p style={{ color: "#94a3b8", textAlign: "center", padding: "24px 0" }}>Loading…</p>
            ) : todayCategoryData.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "28px",
                  color: "#94a3b8",
                  background: "#f8fafc",
                  borderRadius: 10,
                }}
              >
                <p style={{ margin: 0, fontSize: 14 }}>No task updates in this category yet today.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {todayCategoryData.map((entry, i) => (
                  <div key={i} style={{ borderTop: i === 0 ? "none" : "1px solid #e2e8f0", paddingTop: i === 0 ? 0 : 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", marginBottom: 6 }}>
                      👤 {entry.employeeName}
                    </div>
                    <ul className="task-item-checklist task-item-checklist-readonly">
                      {entry.items.map((it, idx) => (
                        <li key={idx} className={`task-item-row ${it.completed ? "is-done" : ""}`}>
                          <span className="task-item-check-icon">{it.completed ? "✅" : "⬜"}</span>
                          <span>
                            {it.text}
                            {it.note && (
                              <span style={{ display: "block", fontSize: 12, color: "#64748b" }}>
                                📝 {it.note}
                              </span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;