// 📁 src/user/MyAttendance.jsx
// User self-service: check-in/out, leave, calendar, sessions, calculator, payslips

import React, { useState, useEffect, useCallback } from "react";
import API from "../services/api";


const formatTime = (dateStr) => {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
};

const formatHours = (hours) => {
  if (!hours) return "0h 0m";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return h + "h " + m + "m";
};

// Small icon for each work mode, used on the calendar and in tables.
const workModeIcon = (mode) => {
  if (mode === "Work From Office") return "🏢";
  if (mode === "Work From Home") return "🏠";
  if (mode === "Site Visit") return "📍";
  return "";
};

const AttCalendar = ({ records, onDateClick, currentMonth, setCurrentMonth }) => {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const today = new Date().toISOString().slice(0, 10);
  const recordMap = {};
  (records || []).forEach(r => { recordMap[r.date] = r; });
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(<div key={"e"+i} className="adm-att-cell empty" />);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = year + "-" + String(month+1).padStart(2,"0") + "-" + String(d).padStart(2,"0");
    const rec = recordMap[dateStr];
    let cls = "";
    if (rec) cls = rec.status === "present" ? "adm-present" : (rec.status === "leave" || rec.status === "leave-pending") ? "adm-leave" : "adm-absent";
    else if (dateStr < today) cls = "adm-absent";
    const title = rec && rec.workMode ? dateStr + " — " + rec.workMode : dateStr;
    cells.push(<div key={dateStr} className={"adm-att-cell " + cls + (dateStr === today ? " adm-today" : "")} onClick={() => onDateClick(dateStr)} title={title}><span className="adm-day-num">{d}</span>{rec && <span className={"adm-dot " + rec.status + "-dot"} />}{!rec && dateStr < today && <span className="adm-dot absent-dot" />}{rec && rec.workMode && <span className="adm-workmode-icon">{workModeIcon(rec.workMode)}</span>}</div>);
  }
  return (
    <div className="adm-calendar">
      <div className="adm-cal-header">
        <button className="adm-cal-nav" onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}>‹</button>
        <h4>{monthNames[month] + " " + year}</h4>
        <button className="adm-cal-nav" onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}>›</button>
      </div>
      <div className="adm-cal-legend">
        <span><span className="adm-dot present-dot" /> Present</span>
        <span><span className="adm-dot absent-dot" /> Absent</span>
        <span><span className="adm-dot leave-dot" /> Leave</span>
        <span>🏢 Office</span>
        <span>🏠 Home</span>
        <span>📍 Site Visit</span>
      </div>
      <div className="adm-cal-days">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} className="adm-cal-day-name">{d}</div>)}</div>
      <div className="adm-cal-grid">{cells}</div>
    </div>
  );
};

const AttCalculator = ({ records }) => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [result, setResult] = useState(null);
  const calculate = () => {
    if (!fromDate || !toDate || fromDate > toDate) { alert("Please select a valid date range."); return; }
    const filtered = records.filter(r => r.date >= fromDate && r.date <= toDate);
    const worked = filtered.filter(r => r.status === "present").length;
    const leave = filtered.filter(r => r.status === "leave" || r.status === "leave-pending").length;
    const absent = filtered.filter(r => r.status !== "present" && r.status !== "leave" && r.status !== "leave-pending").length;
    const totalHrs = filtered.reduce((sum, r) => sum + (r.totalHours || 0), 0);
    setResult({ worked, leave, absent, totalHrs });
  };
  return (
    <div style={{ background:"#fff", borderRadius:"10px", padding:"20px", marginBottom:"20px", boxShadow:"0 1px 4px rgba(0,0,0,0.08)" }}>
      <h3 style={{ marginTop:0 }}>📊 Attendance Calculator</h3>
      <div style={{ display:"flex", gap:"12px", flexWrap:"wrap", alignItems:"flex-end" }}>
        <div className="input-group" style={{ flex:1, minWidth:"150px" }}><label>From Date</label><input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} /></div>
        <div className="input-group" style={{ flex:1, minWidth:"150px" }}><label>To Date</label><input type="date" value={toDate} onChange={e => setToDate(e.target.value)} /></div>
        <button className="add-btn" onClick={calculate}>Calculate</button>
      </div>
      {result && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(130px,1fr))", gap:"12px", marginTop:"16px" }}>
          <div className="adm-stat green" style={{ borderRadius:"8px", padding:"14px", textAlign:"center" }}><h3 style={{ margin:0 }}>{result.worked}</h3><p style={{ margin:"4px 0 0" }}>Present Days</p></div>
          <div className="adm-stat orange" style={{ borderRadius:"8px", padding:"14px", textAlign:"center" }}><h3 style={{ margin:0 }}>{result.leave}</h3><p style={{ margin:"4px 0 0" }}>Leave Days</p></div>
          <div className="adm-stat red" style={{ borderRadius:"8px", padding:"14px", textAlign:"center" }}><h3 style={{ margin:0 }}>{result.absent}</h3><p style={{ margin:"4px 0 0" }}>Absent Days</p></div>
          <div className="adm-stat blue" style={{ borderRadius:"8px", padding:"14px", textAlign:"center" }}><h3 style={{ margin:0 }}>{formatHours(result.totalHrs)}</h3><p style={{ margin:"4px 0 0" }}>Total Hours</p></div>
        </div>
      )}
    </div>
  );
};

const MyAttendance = ({ setSidebarOpen }) => {
  const [myToday, setMyToday] = useState(null);
  const [myTodayDate, setMyTodayDate] = useState("");
  const [myAttLoading, setMyAttLoading] = useState(false);
  const [myAttError, setMyAttError] = useState("");
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({ totalWorkedDays:0, totalWorkedHours:0, totalLeaveDays:0, totalAbsentDays:0 });
  const [myPayslips, setMyPayslips] = useState([]);
  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ date:"", reason:"" });
  const [showWorkModeModal, setShowWorkModeModal] = useState(false);
  const [selectedWorkMode, setSelectedWorkMode] = useState("");

  const myIsCheckedIn = myToday && myToday.status === "present" && myToday.sessions?.length > 0 && !myToday.sessions[myToday.sessions.length - 1]?.checkOut;
  const myIsOnLeave = myToday && myToday.status === "leave";
  const myIsLeavePending = myToday && myToday.status === "leave-pending";

  const fetchTodayStatus = useCallback(async () => {
    try {
      const { data } = await API.get("/attendance/me/today");
      setMyToday(data.record); setMyTodayDate(data.today); setMyAttError("");
    } catch (err) { setMyAttError(err.response?.data?.message || "Could not load today attendance."); }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await API.get("/attendance/me/my");
      setRecords(data.records || []);
      setStats({ totalWorkedDays: data.totalWorkedDays||0, totalWorkedHours: data.totalWorkedHours||0, totalLeaveDays: data.totalLeaveDays||0, totalAbsentDays: data.totalAbsentDays||0 });
    } catch {}
  }, []);

  const fetchPayslips = useCallback(async () => {
    try { const { data } = await API.get("/employees/me/payslips"); setMyPayslips(data.payslips || []); } catch {}
  }, []);

  useEffect(() => { fetchTodayStatus(); fetchHistory(); fetchPayslips(); }, [fetchTodayStatus, fetchHistory, fetchPayslips]);

  const handleCheckIn = async (workMode) => {
    setMyAttLoading(true);
    try { await API.post("/attendance/me/checkin", { workMode }); await fetchTodayStatus(); await fetchHistory(); }
    catch (err) { alert(err.response?.data?.message || "Check-in failed"); }
    setMyAttLoading(false);
  };

  // Opens the work-mode selection popup instead of checking in directly.
  const openWorkModeModal = () => {
    setSelectedWorkMode("");
    setShowWorkModeModal(true);
  };

  const confirmWorkModeCheckIn = async () => {
    if (!selectedWorkMode) { alert("Please select a work mode."); return; }
    await handleCheckIn(selectedWorkMode);
    setShowWorkModeModal(false);
  };

  const handleCheckOut = async () => {
    setMyAttLoading(true);
    try { await API.post("/attendance/me/checkout"); await fetchTodayStatus(); await fetchHistory(); }
    catch (err) { alert(err.response?.data?.message || "Check-out failed"); }
    setMyAttLoading(false);
  };

  const handleLeaveSubmit = async () => {
    if (!leaveForm.date || !leaveForm.reason.trim()) { alert("Please select a date and enter a reason."); return; }
    try {
      await API.post("/attendance/me/leave", { leaveDate: leaveForm.date, reason: leaveForm.reason });
      alert("Leave request submitted! Waiting for admin approval.");
      setShowLeaveModal(false); setLeaveForm({ date:"", reason:"" });
      await fetchTodayStatus(); await fetchHistory();
    } catch (err) { alert(err.response?.data?.message || "Leave application failed"); }
  };

  const handleDateClick = async (dateStr) => {
    setSelectedDate(dateStr); setShowDetail(true);
    const local = records.find(r => r.date === dateStr);
    if (local) { setSelectedRecord(local); return; }
    try { const { data } = await API.get("/attendance/me/date/" + dateStr); setSelectedRecord(data.record || null); }
    catch { setSelectedRecord(null); }
  };

  return (
    <div className="employee-page">
      <div className="employee-page-header">
        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => setSidebarOpen((prev) => !prev)}
        >
          ☰
        </button>
        <h2>📅 My Attendance</h2>
      </div>
      {myAttError ? (
        <div style={{ background:"#fff3f3", border:"1px solid #ffccc7", color:"#cf1322", padding:"16px", borderRadius:"8px", margin:"16px 0" }}>{myAttError}</div>
      ) : (
        <>
          <div style={{ background:"#fff", borderRadius:"10px", padding:"20px", marginBottom:"20px", boxShadow:"0 1px 4px rgba(0,0,0,0.08)", display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"space-between", gap:"16px" }}>
            <div>
              <h3 style={{ margin:0 }}>Today — {myTodayDate || "—"}</h3>
              <p style={{ margin:"6px 0 0", color:"#666" }}>Status: <strong>{myIsOnLeave ? "📅 On Approved Leave" : myIsLeavePending ? "⏳ Leave Pending Approval" : myIsCheckedIn ? "✅ Checked In" : myToday?.status === "present" ? "✅ Present (Checked Out)" : "❌ Not Checked In"}</strong></p>
              {myToday?.checkIn && <p style={{ margin:"4px 0 0", color:"#666" }}>First Check-In: {formatTime(myToday.checkIn)}{myToday.checkOut && " · Last Check-Out: " + formatTime(myToday.checkOut)}</p>}
              {myToday?.workMode && <p style={{ margin:"4px 0 0", color:"#666" }}>Work Mode: <strong>{workModeIcon(myToday.workMode)} {myToday.workMode}</strong></p>}
              {myToday?.status === "present" && myToday?.totalHours != null && (
                <p style={{ margin:"4px 0 0", color: myToday.totalHours >= 8 ? "#389e0d" : "#d46b08" }}>
                  {myToday.totalHours >= 8 ? "✅" : "⚠️"} {formatHours(myToday.totalHours)} worked today{myToday.totalHours < 8 && " (" + formatHours(8 - myToday.totalHours) + " remaining for 8h)"}
                </p>
              )}
            </div>
            <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
              <button className="add-btn" disabled={myAttLoading || myIsCheckedIn || myIsOnLeave || myIsLeavePending} onClick={openWorkModeModal}>Check In</button>
              <button className="add-btn" disabled={myAttLoading || !myIsCheckedIn} onClick={handleCheckOut}>Check Out</button>
              <button className="add-btn" disabled={myIsOnLeave || myIsLeavePending} onClick={() => setShowLeaveModal(true)}>Apply Leave</button>
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(150px,1fr))", gap:"16px", marginBottom:"20px" }}>
            {[{ label:"Worked Days", value:stats.totalWorkedDays, cls:"green" },{ label:"Leave Days", value:stats.totalLeaveDays, cls:"orange" },{ label:"Absent Days", value:stats.totalAbsentDays, cls:"red" },{ label:"Total Hours", value:formatHours(stats.totalWorkedHours), cls:"blue" }].map(s => (
              <div key={s.label} className={"adm-stat " + s.cls} style={{ background:"#fff", borderRadius:"10px", padding:"16px", textAlign:"center", boxShadow:"0 1px 4px rgba(0,0,0,0.08)" }}><h3 style={{ margin:0 }}>{s.value}</h3><p style={{ margin:"4px 0 0" }}>{s.label}</p></div>
            ))}
          </div>

          <div style={{ background:"#fff", borderRadius:"10px", padding:"20px", marginBottom:"20px", boxShadow:"0 1px 4px rgba(0,0,0,0.08)" }}>
            <h3 style={{ marginTop:0 }}>📅 Attendance Calendar</h3>
            <p style={{ color:"#888", margin:"0 0 12px" }}>Click any date to view your check-in/out session details</p>
            <AttCalendar records={records} onDateClick={handleDateClick} currentMonth={calMonth} setCurrentMonth={setCalMonth} />
          </div>

          <AttCalculator records={records} />

          <div style={{ background:"#fff", borderRadius:"10px", padding:"20px", marginBottom:"20px", boxShadow:"0 1px 4px rgba(0,0,0,0.08)" }}>
            <h3 style={{ marginTop:0 }}>Attendance History</h3>
            <div style={{ overflowX:"auto" }}>
              <table className="minimal-employee-table">
                <thead><tr><th>Date</th><th>Status</th><th>Work Mode</th><th>Check In</th><th>Check Out</th><th>Hours</th></tr></thead>
                <tbody>
                  {records.length === 0 ? <tr><td colSpan={6} style={{ textAlign:"center", padding:"20px" }}>No attendance records yet.</td></tr> : records.slice(0,30).map((r,i) => (
                    <tr key={i} onClick={() => handleDateClick(r.date)} className="adm-record-row" style={{ cursor:"pointer" }}>
                      <td>{r.date}</td>
                      <td><span className={"adm-status-badge " + r.status}>{r.status === "present" ? "✅ Present" : r.status === "leave" ? "📅 Leave" : r.status === "leave-pending" ? "⏳ Leave Pending" : r.status === "leave-rejected" ? "🚫 Leave Rejected" : "❌ Absent"}</span></td>
                      <td>{r.workMode ? workModeIcon(r.workMode) + " " + r.workMode : "—"}</td>
                      <td>{formatTime(r.checkIn)}</td><td>{formatTime(r.checkOut)}</td><td>{r.totalHours ? formatHours(r.totalHours) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background:"#fff", borderRadius:"10px", padding:"20px", boxShadow:"0 1px 4px rgba(0,0,0,0.08)" }}>
            <h3 style={{ marginTop:0 }}>My Payslips</h3>
            <div style={{ overflowX:"auto" }}>
              <table className="minimal-employee-table">
                <thead><tr><th>Month</th><th>Year</th><th>Uploaded On</th><th>Payslip</th></tr></thead>
                <tbody>
                  {myPayslips.length === 0 ? <tr><td colSpan={4} style={{ textAlign:"center", padding:"20px" }}>No payslips uploaded yet.</td></tr> : [...myPayslips].sort((a,b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)).map((p,i) => (
                    <tr key={i}><td>{p.month}</td><td>{p.year}</td><td>{p.uploadedAt ? new Date(p.uploadedAt).toLocaleDateString("en-IN") : "—"}</td><td><a href={p.pdfUrl} target="_blank" rel="noreferrer" className="view-doc-btn">View / Download</a></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showWorkModeModal && (
        <div className="modal-overlay" onClick={() => setShowWorkModeModal(false)}>
          <div className="modal workmode-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Select Work Mode</h2><span className="close-icon" onClick={() => setShowWorkModeModal(false)}>✕</span></div>
            <p style={{ margin:"0 0 16px", color:"#666" }}>How are you working today?</p>
            <div className="workmode-options">
              {["Work From Office", "Work From Home", "Site Visit"].map((mode) => (
                <button
                  type="button"
                  key={mode}
                  className={"workmode-option" + (selectedWorkMode === mode ? " workmode-option-selected" : "")}
                  onClick={() => setSelectedWorkMode(mode)}
                >
                  <span className="workmode-option-icon">{workModeIcon(mode)}</span>
                  <span>{mode}</span>
                </button>
              ))}
            </div>
            <button type="button" className="submit-btn" disabled={!selectedWorkMode || myAttLoading} onClick={confirmWorkModeCheckIn}>Confirm Check In</button>
          </div>
        </div>
      )}

      {showLeaveModal && (
        <div className="modal-overlay" onClick={() => setShowLeaveModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Apply for Leave</h2><span className="close-icon" onClick={() => setShowLeaveModal(false)}>✕</span></div>
            <div className="form-grid">
              <div className="input-group"><label>Date</label><input type="date" value={leaveForm.date} onChange={e => setLeaveForm({...leaveForm, date:e.target.value})} required /></div>
              <div className="input-group" style={{ gridColumn:"1 / -1" }}><label>Reason</label><textarea rows={3} value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason:e.target.value})} placeholder="Reason for leave" required /></div>
            </div>
            <button type="button" className="submit-btn" onClick={handleLeaveSubmit}>Submit Leave Request</button>
          </div>
        </div>
      )}

      {showDetail && (
        <div className="adm-date-overlay" onClick={() => setShowDetail(false)}>
          <div className="adm-date-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-date-header"><h3>📋 {selectedDate}</h3><button className="adm-close-btn" onClick={() => setShowDetail(false)}>✕</button></div>
            {selectedRecord ? (
              <div className="adm-date-body">
                <div className={"adm-status-badge-big " + selectedRecord.status}>{selectedRecord.status === "present" ? "✅ Present" : selectedRecord.status === "leave" ? "📅 On Leave" : "❌ Absent"}</div>
                {selectedRecord.status === "present" && (<>
                  <div className="adm-date-row"><span>Work Mode</span><strong>{selectedRecord.workMode ? workModeIcon(selectedRecord.workMode) + " " + selectedRecord.workMode : "—"}</strong></div>
                  <div className="adm-date-row"><span>First Check-In</span><strong>{formatTime(selectedRecord.checkIn)}</strong></div>
                  <div className="adm-date-row"><span>Last Check-Out</span><strong>{formatTime(selectedRecord.checkOut)}</strong></div>
                  <div className="adm-date-row"><span>Total Hours</span><strong>{formatHours(selectedRecord.totalHours)}</strong></div>
                  {selectedRecord.totalHours >= 8 ? <div className="adm-hours-ok">✅ Minimum 8 hours completed</div> : <div className="adm-hours-warn">⚠️ Less than 8h — {formatHours(selectedRecord.totalHours)} worked</div>}
                  {selectedRecord.sessions?.length > 0 && (
                    <div className="adm-sessions"><h4>All Sessions</h4>
                      {selectedRecord.sessions.map((s,i) => (<div key={i} className="adm-session-row"><span>Session {i+1}</span><span>In: {formatTime(s.checkIn)}</span><span>Out: {s.checkOut ? formatTime(s.checkOut) : "Active"}</span><span>{s.hours ? formatHours(s.hours) : "—"}</span></div>))}
                    </div>
                  )}
                </>)}
                {selectedRecord.status === "leave" && <div className="adm-date-row"><span>Reason</span><strong>{selectedRecord.leaveReason}</strong></div>}
              </div>
            ) : (
              <div className="adm-date-body"><div className="adm-status-badge-big absent">❌ No Record / Absent</div></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAttendance;