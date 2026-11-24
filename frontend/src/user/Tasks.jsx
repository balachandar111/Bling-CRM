// 📁 frontend/src/user/Tasks.jsx
// User: submit today's report + manage pending rollover tasks + browse own reports.
// Admin (super_admin): Department Cards, Employee To-Do review & pending rollover, 6:30 PM reminders, and Table View.

import React, { useState, useEffect, useCallback } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import API from "../services/api";
import "./Tasks.css";

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

/* ─── to-do list options, by department ─── */
const DEPARTMENT_TASK_PRESETS = {
  sales: ["Daily Followup", "New Leads", "Payment Followup", "Requirement"],
  business_development: [
    "Application testing",
    "New module testing",
    "Quick commerce",
    "Warehouse inventory checking",
    "Calling",
    "Follow up",
  ],
  it: ["Website", "CRM", "Rewards", "Modules", "Testing", "Deployment", "Custom Application"],
  general: [
    "Follow-up with leads",
    "Client / Site visit",
    "Documentation & Reports",
    "Team meeting / Coordination",
  ],
};
const CUSTOM_OPTION = "__custom__";

const DEPARTMENT_LABELS = {
  sales: "Sales",
  business_development: "Operation / Business Development",
  it: "IT",
};

const PAYMENT_OPTION = "Payment";
const PAYMENT_PREFIX = "Payment: ";
const DEFAULT_PAYMENT_STATUSES = ["Advance Payment", "Payment Pending", "Collected"];

const TODAY_CATEGORIES = [
  { key: "operation", label: "Operation" },
  { key: "sales", label: "Sales" },
  { key: "it", label: "IT" },
  { key: "others", label: "Others" },
  { key: "payment", label: "Payment" },
];

const Tasks = ({ role, setSidebarOpen }) => {
  const isAdmin = role === "super_admin";

  /* ── view mode (admin only): "cards" | "table" ── */
  const [viewMode, setViewMode] = useState("cards");

  /* ── department overview state (admin cards view) ── */
  const [departmentOverview, setDepartmentOverview] = useState([]);
  const [loadingDeptOverview, setLoadingDeptOverview] = useState(false);
  const [selectedDeptModal, setSelectedDeptModal] = useState(null);
  const [adminSelections, setAdminSelections] = useState({}); // { [taskId]: [itemId, ...] }
  const [adminRemarks, setAdminRemarks] = useState({});       // { [taskId]: string }
  const [adminReviewing, setAdminReviewing] = useState({});   // { [taskId]: boolean }
  const [reviewMsg, setReviewMsg] = useState({});             // { [taskId]: string }
  const [triggeringReminders, setTriggeringReminders] = useState(false);

  /* ── today's to-do list state (user only) ── */
  const [items, setItems] = useState([]); // [{ text, note, completed, pendingReason }]
  const [departmentKey, setDepartmentKey] = useState("general");
  const [showPayment, setShowPayment] = useState(false);
  const [paymentStatuses, setPaymentStatuses] = useState(DEFAULT_PAYMENT_STATUSES);
  const basePresets = DEPARTMENT_TASK_PRESETS[departmentKey] || DEPARTMENT_TASK_PRESETS.general;
  const presets = showPayment ? [...basePresets, PAYMENT_OPTION] : basePresets;
  const [selectedPreset, setSelectedPreset] = useState(presets[0]);
  const [customText, setCustomText] = useState("");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("");
  const [noteText, setNoteText] = useState("");
  const [pendingReasonText, setPendingReasonText] = useState("");
  const [todayTask, setTodayTask] = useState(null);
  const [pendingFromPast, setPendingFromPast] = useState([]); // [{ originalDate, text, note, adminRemark }]
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  /* ── calendar viewer state (both roles) ── */
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateReports, setDateReports] = useState([]);
  const [loadingDateReports, setLoadingDateReports] = useState(false);
  const [markedDates, setMarkedDates] = useState([]);

  /* ── admin: date x department task summary table ── */
  const [summaryRows, setSummaryRows] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryFrom, setSummaryFrom] = useState("");
  const [summaryTo, setSummaryTo] = useState("");

  /* ── admin: "Today" quick filter popup ── */
  const [todayCategoryOpen, setTodayCategoryOpen] = useState(null);
  const [todayCategoryData, setTodayCategoryData] = useState([]);
  const [loadingTodayCategory, setLoadingTodayCategory] = useState(false);

  /* ── user: edit a PREVIOUS day's task list ── */
  const [isEditingDateReport, setIsEditingDateReport] = useState(false);
  const [editDateItems, setEditDateItems] = useState([]);
  const [editDatePreset, setEditDatePreset] = useState("");
  const [editDateCustomText, setEditDateCustomText] = useState("");
  const [editDatePaymentStatus, setEditDatePaymentStatus] = useState("");
  const [editDateNote, setEditDateNote] = useState("");
  const [savingDateEdit, setSavingDateEdit] = useState(false);

  /* ── fetch today's saved task list (user) ── */
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
      if (Array.isArray(data.pendingFromPast)) {
        setPendingFromPast(data.pendingFromPast);
      }
    } catch {}
  }, []);

  /* ── fetch department overview (admin cards view) ── */
  const fetchDeptOverview = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingDeptOverview(true);
    try {
      const { data } = await API.get("/tasks/department-overview");
      const depts = data.departments || [];
      setDepartmentOverview(depts);

      // Pre-select items that are already marked completed or adminCompleted
      const initialSelections = {};
      depts.forEach((dept) => {
        (dept.employees || []).forEach((emp) => {
          if (emp.taskId && Array.isArray(emp.items)) {
            const completedIds = emp.items
              .filter((it) => it.completed || it.adminCompleted)
              .map((it) => it._id);
            initialSelections[emp.taskId] = completedIds;
          }
        });
      });
      setAdminSelections((prev) => ({ ...initialSelections, ...prev }));
    } catch (err) {
      console.error("fetchDeptOverview error:", err);
    }
    setLoadingDeptOverview(false);
  }, [isAdmin]);

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
      const year = dateInMonth.getFullYear();
      const month = dateInMonth.getMonth();
      const first = toDateStr(new Date(year, month, 1));
      const last = toDateStr(new Date(year, month + 1, 0));
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

  /* ── initial loads ── */
  useEffect(() => {
    if (!isAdmin) {
      fetchToday();
    } else {
      fetchDeptOverview();
    }
  }, [isAdmin, fetchToday, fetchDeptOverview]);

  useEffect(() => {
    fetchForDate(toDateStr(selectedDate));
  }, [selectedDate, fetchForDate]);

  useEffect(() => {
    fetchMonthMarks(selectedDate);
  }, [selectedDate, fetchMonthMarks]);

  /* ── admin summary table ── */
  const fetchSummary = useCallback(
    async (from = "", to = "") => {
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
    },
    [isAdmin]
  );

  useEffect(() => {
    if (isAdmin && viewMode === "table") {
      fetchSummary();
    }
  }, [isAdmin, viewMode, fetchSummary]);

  const handleApplySummaryFilter = () => {
    fetchSummary(summaryFrom, summaryTo);
  };
  const handleClearSummaryFilter = () => {
    setSummaryFrom("");
    setSummaryTo("");
    fetchSummary();
  };

  /* ── admin today filter category popup ── */
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

  /* ── download summary Excel ── */
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

    let suffix = todayStr;
    if (summaryFrom && summaryTo && summaryFrom === summaryTo) {
      suffix = summaryFrom;
    } else if (summaryFrom || summaryTo) {
      suffix = `${summaryFrom || "start"}_to_${summaryTo || "end"}`;
    }
    saveAs(fileData, `Employee_Task_Summary_${suffix}.xlsx`);
  };

  /* ── admin review & selection handlers ── */
  const toggleAdminItemCheck = (taskId, itemId) => {
    setAdminSelections((prev) => {
      const current = prev[taskId] || [];
      const exists = current.includes(itemId);
      const next = exists ? current.filter((id) => id !== itemId) : [...current, itemId];
      return { ...prev, [taskId]: next };
    });
  };

  const handleAdminReview = async (emp, forceAllPending = false) => {
    if (!emp.taskId) return;
    const taskId = emp.taskId;
    const allIds = (emp.items || []).map((it) => it._id);
    const selectedIds = forceAllPending ? [] : (adminSelections[taskId] || []);
    const pendingIds = allIds.filter((id) => !selectedIds.includes(id));
    const remark =
      adminRemarks[taskId] ||
      (pendingIds.length > 0
        ? "Task marked incomplete by Admin; moved to pending for tomorrow."
        : "");

    setAdminReviewing((prev) => ({ ...prev, [taskId]: true }));
    try {
      const { data } = await API.post("/tasks/admin-review", {
        taskId,
        completedItemIds: selectedIds,
        pendingItemIds: pendingIds,
        pendingRemark: remark,
      });

      setReviewMsg((prev) => ({
        ...prev,
        [taskId]: data.message || "Tasks reviewed and updated successfully!",
      }));

      // Refresh overview & calendar reports
      await fetchDeptOverview();
      fetchForDate(toDateStr(selectedDate));

      setTimeout(() => {
        setReviewMsg((prev) => ({ ...prev, [taskId]: "" }));
      }, 4000);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update review.");
    }
    setAdminReviewing((prev) => ({ ...prev, [taskId]: false }));
  };

  /* ── admin trigger 6:30 PM daily emails ── */
  const handleTriggerDailyReminders = async () => {
    if (
      !window.confirm(
        "Send today's daily 6:30 PM task report to director@blingreward.com and reminders to employees with incomplete tasks now?"
      )
    ) {
      return;
    }
    setTriggeringReminders(true);
    try {
      const { data } = await API.post("/tasks/send-daily-reminders");
      alert(data.message || "Daily reminders and reports dispatched successfully!");
      fetchDeptOverview();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to dispatch reminders.");
    }
    setTriggeringReminders(false);
  };

  /* ── user: copy pending task from previous day into today's list ── */
  const handleCopyPendingToToday = (pastItem) => {
    const rolledOverItem = {
      text: pastItem.text,
      note: pastItem.note
        ? `${pastItem.note} (Pending from ${pastItem.originalDate})`
        : `Pending from ${pastItem.originalDate}`,
      completed: false,
      pendingReason: pastItem.adminRemark ? `Admin remark: ${pastItem.adminRemark}` : "",
      isRolledOver: true,
      rolledOverFromDate: pastItem.originalDate,
    };
    setItems((prev) => [...prev, rolledOverItem]);
  };

  /* ── user: add task item to today's list ── */
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

    setItems((prev) => [
      ...prev,
      {
        text,
        note: noteText.trim(),
        completed: false,
        pendingReason: pendingReasonText.trim(),
      },
    ]);
    setCustomText("");
    setSelectedPaymentStatus("");
    setNoteText("");
    setPendingReasonText("");
  };

  const toggleItemCompleted = (index) => {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, completed: !it.completed } : it))
    );
  };

  const updateItemPendingReason = (index, val) => {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, pendingReason: val } : it))
    );
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

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

  const handleUpdate = async () => {
    if (items.length === 0) {
      alert("Your task list can't be empty.");
      return;
    }
    setUpdating(true);
    try {
      await API.post("/tasks/report", { items });
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

  /* ── user: edit previous day's report ── */
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
    setEditDateItems((prev) => [
      ...prev,
      { text, note: editDateNote.trim(), completed: false, pendingReason: "" },
    ]);
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

  useEffect(() => {
    setIsEditingDateReport(false);
  }, [selectedDateStr]);

  // Keep modal in sync with refreshed department overview
  const activeModalDept = selectedDeptModal
    ? departmentOverview.find((d) => d.key === selectedDeptModal.key) || selectedDeptModal
    : null;

  return (
    <div className="employee-page">
      {/* ── TOP BAR HEADER ── */}
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
            <h1>📝 {isAdmin ? "Employee Tasks & Department Review" : "Tasks & Daily To-Do List"}</h1>
            <p>
              {isAdmin
                ? "Track department tasks, review employee completions, and roll over pending items."
                : "Build your to-do list each morning, tick off completed tasks, and submit updates."}
            </p>
          </div>
        </div>

        {/* Admin Header Controls */}
        {isAdmin && (
          <div className="task-header-controls">
            {/* View Mode Toggle: Department Cards vs Table View */}
            <div className="task-view-toggle">
              <button
                type="button"
                className={`task-toggle-btn ${viewMode === "cards" ? "is-active" : ""}`}
                onClick={() => setViewMode("cards")}
              >
                🗂️ Department Cards
              </button>
              <button
                type="button"
                className={`task-toggle-btn ${viewMode === "table" ? "is-active" : ""}`}
                onClick={() => setViewMode("table")}
              >
                📋 Table View
              </button>
            </div>

            {/* Quick 6:30 PM Email Trigger */}
            <button
              type="button"
              className="task-trigger-reminders-btn"
              onClick={handleTriggerDailyReminders}
              disabled={triggeringReminders}
              title="Send summary to director@blingreward.com and reminders to employees with incomplete tasks"
            >
              {triggeringReminders ? "⏳ Sending Emails…" : "📧 Trigger 6:30 PM Reminders"}
            </button>
          </div>
        )}
      </div>

      {/* ── ADMIN: CARDS VIEW — DEPARTMENT CARDS GRID ── */}
      {isAdmin && viewMode === "cards" && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>
                🏢 Department Daily Task Overview
              </h3>
              <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#64748b" }}>
                Click any department card to review employee to-do items and approve completions
              </p>
            </div>
            <button
              type="button"
              onClick={fetchDeptOverview}
              disabled={loadingDeptOverview}
              style={{
                background: "#f1f5f9",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 12,
                cursor: "pointer",
                fontWeight: 600,
                color: "#475569",
              }}
            >
              {loadingDeptOverview ? "Refreshing…" : "🔄 Refresh"}
            </button>
          </div>

          <div className="task-dept-grid">
            {departmentOverview.map((dept) => {
              const totalItems = dept.totalTasksCount || 0;
              const completedItems = dept.completedCount || 0;
              const pct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

              return (
                <div
                  key={dept.key}
                  className="task-dept-card"
                  style={{ "--dept-color": dept.color, "--dept-bg": dept.bg }}
                  onClick={() => setSelectedDeptModal(dept)}
                >
                  <div>
                    <div className="task-dept-card-header">
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div className="task-dept-icon-wrapper">{dept.icon}</div>
                        <div className="task-dept-title-group">
                          <h4>{dept.name}</h4>
                          <span className="task-dept-emp-badge">
                            👥 {dept.employeeCount} {dept.employeeCount === 1 ? "Employee" : "Employees"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 3-Column Metrics */}
                    <div className="task-dept-metrics-row">
                      <div className="task-dept-metric">
                        <span className="task-dept-metric-value updated">
                          {dept.updatedTodayCount}
                        </span>
                        <span className="task-dept-metric-label">Updated Today</span>
                      </div>
                      <div className="task-dept-metric">
                        <span className="task-dept-metric-value completed">
                          {dept.completedCount}
                        </span>
                        <span className="task-dept-metric-label">Completed</span>
                      </div>
                      <div className="task-dept-metric">
                        <span className="task-dept-metric-value incomplete">
                          {dept.notCompletedCount}
                        </span>
                        <span className="task-dept-metric-label">Pending</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="task-dept-progress-wrap">
                      <div className="task-dept-progress-text">
                        <span>Task Completion</span>
                        <span style={{ fontWeight: 700, color: dept.color }}>{pct}%</span>
                      </div>
                      <div className="task-dept-progress-bar-bg">
                        <div
                          className="task-dept-progress-fill"
                          style={{ width: `${pct}%`, background: dept.color }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="task-dept-card-footer">
                    <span>View Employee Tasks ({dept.employees?.length || 0})</span>
                    <span>→</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ADMIN: TABLE VIEW — TASK SUMMARY BY DEPARTMENT ── */}
      {isAdmin && viewMode === "table" && (
        <div className="task-calendar-card" style={{ marginBottom: 20 }}>
          <div
            className="task-summary-header-row"
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

            <div className="task-summary-filters" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
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

          {/* "Today" quick filter */}
          <div className="task-today-filter-row" style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>📌 Today's Filter:</span>
            {TODAY_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                className="task-today-filter-btn"
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
              <table className="task-summary-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
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
                      <td data-label="S.No" style={{ padding: "8px 10px", border: "1px solid #e2e8f0" }}>{r.sno}</td>
                      <td data-label="Date" style={{ padding: "8px 10px", border: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>{r.date}</td>
                      <td data-label="Operation Task" style={{ padding: "8px 10px", border: "1px solid #e2e8f0" }}>{r.operationTask || "—"}</td>
                      <td data-label="Sales Task" style={{ padding: "8px 10px", border: "1px solid #e2e8f0" }}>{r.salesTask || "—"}</td>
                      <td data-label="IT Task" style={{ padding: "8px 10px", border: "1px solid #e2e8f0" }}>{r.itTask || "—"}</td>
                      <td data-label="Others" style={{ padding: "8px 10px", border: "1px solid #e2e8f0" }}>{r.others || "—"}</td>
                      <td data-label="Payment" style={{ padding: "8px 10px", border: "1px solid #e2e8f0" }}>{r.payment || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── USER MODE: PENDING TASKS FROM PREVIOUS DAYS BANNER ── */}
      {!isAdmin && pendingFromPast.length > 0 && (
        <div className="task-past-pending-card">
          <div className="task-past-pending-header">
            <div className="task-past-pending-title">
              <span>⏳</span>
              <span>Pending Tasks from Previous Days ({pendingFromPast.length})</span>
            </div>
            <span style={{ fontSize: 12, color: "#9a3412" }}>
              Carried over by Admin review or not completed
            </span>
          </div>
          <div className="task-past-pending-list">
            {pendingFromPast.map((pTask, pIdx) => (
              <div key={pIdx} className="task-past-pending-item">
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>
                      {pTask.text}
                    </span>
                    <span style={{ fontSize: 11, background: "#ffedd5", color: "#c2410c", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>
                      📅 {pTask.originalDate}
                    </span>
                  </div>
                  {pTask.note && (
                    <p style={{ margin: "0 0 4px 0", fontSize: 12, color: "#64748b" }}>
                      📝 {pTask.note}
                    </p>
                  )}
                  {pTask.adminRemark && (
                    <div className="task-remark-box" style={{ marginTop: 4 }}>
                      💬 <strong>Admin:</strong> {pTask.adminRemark}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="task-past-copy-btn"
                  onClick={() => handleCopyPendingToToday(pTask)}
                  title="Copy this task into today's list"
                >
                  ➕ Carry Over to Today
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── USER MODE: TODAY'S REPORT CARD ── */}
      {!isAdmin && (
        <div className="task-report-card">
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
          <div className="task-add-row task-add-row-mobile">
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

          {/* Optional Note and Problem Note Inputs */}
          {selectedPreset && (
            <div className="task-add-row task-add-row-mobile" style={{ marginTop: 8 }}>
              <input
                type="text"
                className="task-custom-input"
                placeholder={`Add note about "${selectedPreset === PAYMENT_OPTION ? (selectedPaymentStatus || "Payment") : selectedPreset === CUSTOM_OPTION ? "this task" : selectedPreset}" (optional)…`}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                style={{ flex: 1 }}
              />
              <input
                type="text"
                className="task-custom-input"
                placeholder="If blocked/problematic, note why (e.g. Due to waiting on API credentials)…"
                value={pendingReasonText}
                onChange={(e) => setPendingReasonText(e.target.value)}
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
                <li key={idx} className={`task-item-row ${it.completed ? "is-done" : ""}`} style={{ flexDirection: "column", alignItems: "stretch" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <label className="task-item-checkbox-label">
                      <input
                        type="checkbox"
                        checked={it.completed}
                        onChange={() => toggleItemCompleted(idx)}
                      />
                      <span>
                        {it.text}
                        {it.isRolledOver && (
                          <span style={{ marginLeft: 6, fontSize: 11, color: "#ea580c", fontWeight: 600 }}>
                            [Rolled Over]
                          </span>
                        )}
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
                  </div>

                  {/* Problem Reason Input (Visible when item is pending or user has notes) */}
                  <div className="task-user-reason-row">
                    <input
                      type="text"
                      className="task-user-reason-input"
                      placeholder="Problem / Pending reason (e.g., due to this this task is pending)…"
                      value={it.pendingReason || ""}
                      onChange={(e) => updateItemPendingReason(idx, e.target.value)}
                    />
                  </div>
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

            {!todayTask && (
              <button
                className="task-submit-btn"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Saving…" : "Submit Task List"}
              </button>
            )}

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

      {/* ── CALENDAR REPORT VIEWER (PLACED DIRECTLY BELOW DEPARTMENT CARDS) ── */}
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
          <div className="task-calendar-widget-col" style={{ flex: "0 0 auto" }}>
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
                      width: 6,
                      height: 6,
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
                <div className="task-add-row task-add-row-mobile">
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
                  <div className="task-add-row task-add-row-mobile" style={{ marginTop: 8 }}>
                    <input
                      type="text"
                      className="task-custom-input"
                      placeholder={`Add note about "${editDatePreset === PAYMENT_OPTION ? (editDatePaymentStatus || "Payment") : editDatePreset === CUSTOM_OPTION ? "this task" : editDatePreset}" (optional)…`}
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
                  const doneCount = hasItems
                    ? t.items.filter((it) => it.completed || it.adminCompleted).length
                    : 0;
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
                            {t.adminReviewed && (
                              <span style={{ marginLeft: 8, color: "#16a34a", fontWeight: 700 }}>
                                (Admin Reviewed)
                              </span>
                            )}
                          </div>
                          <ul className="task-item-checklist task-item-checklist-readonly">
                            {t.items.map((it, idx) => (
                              <li
                                key={idx}
                                className={`task-item-row ${it.completed || it.adminCompleted ? "is-done" : ""}`}
                              >
                                <span className="task-item-check-icon">
                                  {it.completed || it.adminCompleted ? "✅" : "⬜"}
                                </span>
                                <span style={{ flex: 1 }}>
                                  {it.text}
                                  {it.note && (
                                    <span style={{ display: "block", fontSize: 12, color: "#64748b" }}>
                                      📝 {it.note}
                                    </span>
                                  )}
                                  {it.pendingReason && (
                                    <span style={{ display: "block", fontSize: 12, color: "#b45309", marginTop: 2 }}>
                                      ⚠️ <strong>Problem:</strong> {it.pendingReason}
                                    </span>
                                  )}
                                  {it.adminRemark && (
                                    <span style={{ display: "block", fontSize: 12, color: "#e11d48", marginTop: 2 }}>
                                      💬 <strong>Admin remark:</strong> {it.adminRemark}
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

      {/* ── ADMIN: DEPARTMENT EMPLOYEE REVIEW MODAL ── */}
      {isAdmin && activeModalDept && (
        <div className="task-modal-backdrop" onClick={() => setSelectedDeptModal(null)}>
          <div className="task-dept-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="task-dept-modal-header">
              <div className="task-dept-modal-title-wrap">
                <span style={{ fontSize: 26 }}>{activeModalDept.icon}</span>
                <div>
                  <h3>{activeModalDept.name} — Employee To-Do Review</h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#64748b" }}>
                    📅 Today: {formatDate(todayStr)} • {activeModalDept.employeeCount} Members
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="task-dept-modal-close"
                onClick={() => setSelectedDeptModal(null)}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="task-dept-modal-body">
              {activeModalDept.employees.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                  <p>No employees registered in this department yet.</p>
                </div>
              ) : (
                activeModalDept.employees.map((emp) => {
                  const hasTasks = emp.submitted && Array.isArray(emp.items) && emp.items.length > 0;
                  const currentSelections = (emp.taskId && adminSelections[emp.taskId]) || [];
                  const isReviewing = emp.taskId && adminReviewing[emp.taskId];
                  const feedback = emp.taskId && reviewMsg[emp.taskId];

                  return (
                    <div
                      key={emp.employeeId || emp.name}
                      className={`task-emp-review-card ${emp.submitted ? "has-submitted" : ""}`}
                    >
                      {/* Employee Header */}
                      <div className="task-emp-review-header">
                        <div className="task-emp-identity">
                          <div className="task-emp-avatar">
                            {emp.name ? emp.name.charAt(0).toUpperCase() : "👤"}
                          </div>
                          <div>
                            <div className="task-emp-name-text">{emp.name}</div>
                            <div className="task-emp-meta-text">
                              {emp.designation} {emp.email ? `• ${emp.email}` : ""}
                            </div>
                          </div>
                        </div>

                        <div>
                          {emp.submitted ? (
                            <div style={{ display: "flex", gap: 6 }}>
                              <span className="task-emp-status-badge submitted">
                                ✅ Submitted Today
                              </span>
                              {emp.adminReviewed && (
                                <span className="task-emp-status-badge reviewed">
                                  ⭐ Admin Reviewed
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="task-emp-status-badge unsubmitted">
                              ⚠️ Not Submitted Today
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Employee Tasks Checklist */}
                      {hasTasks ? (
                        <>
                          <ul className="task-review-item-list">
                            {emp.items.map((it) => {
                              const isChecked = currentSelections.includes(it._id);
                              return (
                                <li
                                  key={it._id}
                                  className={`task-review-item-row ${isChecked ? "is-selected" : ""} ${it.adminPending ? "is-pending" : ""}`}
                                >
                                  <div className="task-review-item-main">
                                    <label className="task-review-checkbox-label">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => toggleAdminItemCheck(emp.taskId, it._id)}
                                      />
                                      <span style={{ fontWeight: 600 }}>{it.text}</span>
                                    </label>

                                    <div className="task-review-tags-wrap">
                                      {it.completed ? (
                                        <span className="task-tag user-done">User Done</span>
                                      ) : (
                                        <span className="task-tag user-undone">User Incomplete</span>
                                      )}

                                      {it.adminCompleted && (
                                        <span className="task-tag admin-done">Admin Approved</span>
                                      )}

                                      {it.adminPending && (
                                        <span className="task-tag admin-pending">Pending Rollover</span>
                                      )}
                                    </div>
                                  </div>

                                  {/* User problem / pending note */}
                                  {it.pendingReason && (
                                    <div className="task-problem-box">
                                      <span>⚠️</span>
                                      <div>
                                        <strong>Employee Problem Note:</strong> "{it.pendingReason}"
                                      </div>
                                    </div>
                                  )}

                                  {/* User general note */}
                                  {it.note && (
                                    <div style={{ fontSize: 12, color: "#64748b", paddingLeft: 27 }}>
                                      📝 {it.note}
                                    </div>
                                  )}

                                  {/* Admin remark if rolled over */}
                                  {it.adminRemark && (
                                    <div className="task-remark-box" style={{ marginLeft: 27 }}>
                                      💬 <strong>Admin remark:</strong> {it.adminRemark}
                                    </div>
                                  )}
                                </li>
                              );
                            })}
                          </ul>

                          {/* Admin Review Action Toolbar */}
                          <div className="task-admin-actions-bar">
                            <input
                              type="text"
                              className="task-remark-input"
                              placeholder="Admin pending remark (e.g. This task is incomplete, carrying over)…"
                              value={adminRemarks[emp.taskId] || ""}
                              onChange={(e) =>
                                setAdminRemarks((prev) => ({
                                  ...prev,
                                  [emp.taskId]: e.target.value,
                                }))
                              }
                            />

                            <div className="task-btn-group-review">
                              <button
                                type="button"
                                className="task-btn-approve"
                                onClick={() => handleAdminReview(emp, false)}
                                disabled={isReviewing}
                              >
                                {isReviewing ? "Saving…" : "✅ Mark Selected as Completed"}
                              </button>

                              <button
                                type="button"
                                className="task-btn-pending"
                                onClick={() => handleAdminReview(emp, true)}
                                disabled={isReviewing}
                                title="Move all uncompleted tasks to pending and send email to employee"
                              >
                                ⏳ Put Incomplete in Pending & Email
                              </button>
                            </div>
                          </div>

                          {feedback && (
                            <div style={{ marginTop: 8, fontSize: 12, color: "#16a34a", fontWeight: 600 }}>
                              {feedback}
                            </div>
                          )}
                        </>
                      ) : (
                        <p style={{ margin: "6px 0 0 0", fontSize: 13, color: "#94a3b8" }}>
                          No tasks submitted by this employee for today yet.
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── ADMIN: "TODAY" CATEGORY POPUP ── */}
      {isAdmin && todayCategoryOpen && (
        <div className="modal-overlay" onClick={handleCloseTodayCategory}>
          <div
            className="task-today-category-modal"
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
