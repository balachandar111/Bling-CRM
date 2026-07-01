// 📁 frontend/src/user/Tasks.jsx
// User: submit today's report + update it separately + browse own reports.
// Admin (super_admin): read-only — browse ALL users' reports by calendar date.

import React, { useState, useEffect, useCallback } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
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

const Tasks = ({ role, setSidebarOpen }) => {
  const isAdmin = role === "super_admin";

  /* ── today's report state (user only) ── */
  const [report, setReport]           = useState("");
  const [todayTask, setTodayTask]     = useState(null);
  const [submitting, setSubmitting]   = useState(false);
  const [updating, setUpdating]       = useState(false);
  const [savedMsg, setSavedMsg]       = useState("");   // "submitted" | "updated" | ""

  /* ── calendar viewer state (both roles) ── */
  const [selectedDate, setSelectedDate]           = useState(new Date());
  const [dateReports, setDateReports]             = useState([]);
  const [loadingDateReports, setLoadingDateReports] = useState(false);
  const [markedDates, setMarkedDates]             = useState([]);

  /* ── fetch today's saved report ── */
  const fetchToday = useCallback(async () => {
    try {
      const { data } = await API.get("/tasks/report/today");
      if (data.task) {
        setTodayTask(data.task);
        setReport(data.task.report);
      } else {
        setTodayTask(null);
        setReport("");
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

  /* ─── SUBMIT (create new report for today) ─── */
  const handleSubmit = async () => {
    if (!report.trim()) { alert("Please write your daily report before submitting."); return; }
    setSubmitting(true);
    try {
      await API.post("/tasks/report", { report });
      setSavedMsg("submitted");
      await fetchToday();
      if (toDateStr(selectedDate) === todayStr) fetchForDate(todayStr);
      fetchMonthMarks(selectedDate);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit report.");
    }
    setSubmitting(false);
    setTimeout(() => setSavedMsg(""), 3000);
  };

  /* ─── UPDATE (overwrite today's existing report) ─── */
  const handleUpdate = async () => {
    if (!report.trim()) { alert("Report cannot be empty."); return; }
    setUpdating(true);
    try {
      await API.post("/tasks/report", { report }); // backend upserts
      setSavedMsg("updated");
      await fetchToday();
      if (toDateStr(selectedDate) === todayStr) fetchForDate(todayStr);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update report.");
    }
    setUpdating(false);
    setTimeout(() => setSavedMsg(""), 3000);
  };

  const selectedDateStr = toDateStr(selectedDate);

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
            <h1>📝 {isAdmin ? "User Reports" : "Tasks & Daily Reports"}</h1>
            <p>
              {isAdmin
                ? "View users' daily work reports"
                : "Submit your daily work report and browse past reports"}
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
              <h3 style={{ margin: 0 }}>📅 Today's Report</h3>
              <p style={{ marginTop: 4 }}>{todayStr}</p>
            </div>
            {todayTask && (
              <span className="task-submitted-badge">✅ Submitted</span>
            )}
          </div>

          {/* Textarea */}
          <textarea
            className="task-textarea"
            rows={6}
            value={report}
            onChange={(e) => setReport(e.target.value)}
            placeholder={
              "Write your daily report here…\n\n• What did you work on today?\n• What did you complete?\n• Any blockers or pending items?"
            }
          />

          {/* Button row */}
          <div className="task-btn-row">
            {savedMsg && (
              <span className="task-saved-msg">
                {savedMsg === "updated" ? "✅ Report updated!" : "✅ Report saved!"}
              </span>
            )}

            {/* SUBMIT — shown only when no report exists yet today */}
            {!todayTask && (
              <button
                className="task-submit-btn"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Saving…" : "Submit Report"}
              </button>
            )}

            {/* UPDATE — shown only after a report has been submitted today */}
            {todayTask && (
              <button
                className="task-update-btn"
                onClick={handleUpdate}
                disabled={updating}
              >
                {updating ? "Updating…" : "✏️ Update Report"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── CALENDAR REPORT VIEWER — BOTH ROLES ── */}
      <div className="task-calendar-card">
        <h3 style={{ margin: "0 0 2px" }}>
          {isAdmin ? "👥 User Reports Calendar" : "📊 My Reports Calendar"}
        </h3>
        <p style={{ margin: "0 0 0" }}>
          {isAdmin
            ? "Pick a date to view every user's report for that day."
            : "Pick a date to view your report for that day."}
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
              {selectedDateStr === todayStr && (
                <span style={{ color: "#94a3b8", fontSize: 11 }}>Today</span>
              )}
            </div>

            {loadingDateReports ? (
              <p style={{ color: "#94a3b8", textAlign: "center", padding: "24px 0" }}>
                Loading…
              </p>
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
                  {isAdmin ? "No user reports for this date." : "No report for this date."}
                </p>
              </div>
            ) : (
              <div className="task-report-list">
                {dateReports.map((t) => (
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
                    <p className="task-report-text">{t.report}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tasks;