// 📁 src/components/EmployeeAttendanceModal.jsx
// Super Admin: View employee attendance with calendar & stats

import React, { useState, useEffect, useCallback } from "react";
import API from "../services/api";

// ===================== HELPERS =====================
const formatTime = (dateStr) => {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatHours = (hours) => {
  if (!hours) return "0h 0m";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
};

const hasCoords = (loc) =>
  loc && typeof loc.latitude === "number" && typeof loc.longitude === "number";

const mapsLink = (loc) =>
  `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`;

// Small icon for each work mode, used on the calendar and in tables.
const workModeIcon = (mode) => {
  if (mode === "Work From Office") return "🏢";
  if (mode === "Work From Home") return "🏠";
  if (mode === "Site Visit") return "📍";
  return "";
};

// ===================== MINI CALENDAR =====================
const AdminAttCalendar = ({ records, onDateClick }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];
  const today = new Date().toISOString().slice(0, 10);

  const recordMap = {};
  (records || []).forEach((r) => { recordMap[r.date] = r; });

  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`e${i}`} className="adm-att-cell empty" />);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const rec = recordMap[dateStr];
    let cls = "";
    if (rec) {
      cls = rec.status === "present" ? "adm-present" : rec.status === "leave" ? "adm-leave" : "adm-absent";
    } else if (dateStr < today) {
      cls = "adm-absent";
    }
    cells.push(
      <div
        key={dateStr}
        className={`adm-att-cell ${cls} ${dateStr === today ? "adm-today" : ""}`}
        onClick={() => onDateClick(dateStr)}
        title={rec && rec.workMode ? `${dateStr} — ${rec.workMode}` : dateStr}
      >
        <span className="adm-day-num">{d}</span>
        {rec && <span className={`adm-dot ${rec.status}-dot`} />}
        {!rec && dateStr < today && <span className="adm-dot absent-dot" />}
        {rec && rec.workMode && (
          <span className="adm-workmode-icon">{workModeIcon(rec.workMode)}</span>
        )}
      </div>
    );
  }

  return (
    <div className="adm-calendar">
      <div className="adm-cal-header">
        <button className="adm-cal-nav" onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}>‹</button>
        <h4>{monthNames[month]} {year}</h4>
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
      <div className="adm-cal-days">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
          <div key={d} className="adm-cal-day-name">{d}</div>
        ))}
      </div>
      <div className="adm-cal-grid">{cells}</div>
    </div>
  );
};

// ===================== MAIN MODAL =====================
const EmployeeAttendanceModal = ({ employee, onClose }) => {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({
    totalWorkedDays: 0,
    totalAbsentDays: 0,
    totalLeaveDays: 0,
    totalWorkedHours: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDateDetail, setShowDateDetail] = useState(false);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/attendance/employee/${employee._id}`);
      setRecords(data.records || []);
      setStats({
        totalWorkedDays: data.totalWorkedDays || 0,
        totalAbsentDays: data.totalAbsentDays || 0,
        totalLeaveDays: data.totalLeaveDays || 0,
        totalWorkedHours: data.totalWorkedHours || 0,
      });
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  }, [employee._id]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleDateClick = async (dateStr) => {
    setSelectedDate(dateStr);
    try {
      const { data } = await API.get(`/attendance/employee/${employee._id}/${dateStr}`);
      setSelectedRecord(data.record);
    } catch {
      setSelectedRecord(null);
    }
    setShowDateDetail(true);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="adm-att-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="adm-att-modal-header">
          <div className="adm-att-emp-info">
            <img
              src={(employee.profileImage && employee.profileImage.trim() !== "") ? employee.profileImage : "https://ui-avatars.com/api/?name=" + encodeURIComponent(employee.name || "User") + "&background=2563eb&color=fff&size=128"}
              alt={employee.name}
              className="adm-att-avatar"
            />
            <div>
              <h2>{employee.name}</h2>
              <p>{employee.designation} · {employee.department}</p>
            </div>
          </div>
          <button className="adm-close-btn" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className="adm-loading">Loading attendance data...</div>
        ) : (
          <div className="adm-att-modal-body">

            {/* STATS */}
            <div className="adm-stats-grid">
              <div className="adm-stat green">
                <h3>{stats.totalWorkedDays}</h3>
                <p>Worked Days</p>
              </div>
              <div className="adm-stat red">
                <h3>{stats.totalAbsentDays}</h3>
                <p>Absent Days</p>
              </div>
              <div className="adm-stat orange">
                <h3>{stats.totalLeaveDays}</h3>
                <p>Leave Days</p>
              </div>
              <div className="adm-stat blue">
                <h3>{formatHours(stats.totalWorkedHours)}</h3>
                <p>Total Hours</p>
              </div>
            </div>

            {/* CALENDAR */}
            <div className="adm-cal-section">
              <h3>📅 Attendance Calendar</h3>
              <p className="adm-cal-hint">Click any date to view check-in/out details</p>
              <AdminAttCalendar records={records} onDateClick={handleDateClick} />
            </div>

            {/* RECENT RECORDS TABLE */}
            <div className="adm-records-table-section">
              <h3>Recent Records</h3>
              <div className="adm-records-table-wrapper">
                <table className="adm-records-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Work Mode</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.slice(0, 15).map((r, i) => (
                      <tr
                        key={i}
                        onClick={() => handleDateClick(r.date)}
                        className="adm-record-row"
                      >
                        <td>{r.date}</td>
                        <td>
                          <span className={`adm-status-badge ${r.status}`}>
                            {r.status === "present" ? "✅ Present"
                              : r.status === "leave" ? "📅 Leave"
                              : "❌ Absent"}
                          </span>
                        </td>
                        <td>{r.workMode ? `${workModeIcon(r.workMode)} ${r.workMode}` : "—"}</td>
                        <td>{formatTime(r.checkIn)}</td>
                        <td>{formatTime(r.checkOut)}</td>
                        <td>{r.totalHours ? formatHours(r.totalHours) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* DATE DETAIL SUB-MODAL */}
        {showDateDetail && (
          <div className="adm-date-overlay" onClick={() => setShowDateDetail(false)}>
            <div className="adm-date-modal" onClick={(e) => e.stopPropagation()}>
              <div className="adm-date-header">
                <h3>📋 {selectedDate}</h3>
                <button className="adm-close-btn" onClick={() => setShowDateDetail(false)}>✕</button>
              </div>
              {selectedRecord ? (
                <div className="adm-date-body">
                  <div className={`adm-status-badge-big ${selectedRecord.status}`}>
                    {selectedRecord.status === "present" ? "✅ Present"
                      : selectedRecord.status === "leave" ? "📅 On Leave"
                      : "❌ Absent"}
                  </div>
                  {selectedRecord.status === "present" && (
                    <>
                      <div className="adm-date-row">
                        <span>Work Mode</span>
                        <strong>
                          {selectedRecord.workMode
                            ? `${workModeIcon(selectedRecord.workMode)} ${selectedRecord.workMode}`
                            : "—"}
                        </strong>
                      </div>
                      {selectedRecord.workMode === "Work From Office" && (
                        <div className="adm-date-row">
                          <span>Check-In Location</span>
                          <strong>
                            {hasCoords(selectedRecord.location) ? (
                              <a
                                href={mapsLink(selectedRecord.location)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="adm-location-link"
                              >
                                📍 View on Map
                              </a>
                            ) : (
                              "Not captured"
                            )}
                          </strong>
                        </div>
                      )}
                      <div className="adm-date-row">
                        <span>First Check-In</span>
                        <strong>{formatTime(selectedRecord.checkIn)}</strong>
                      </div>
                      <div className="adm-date-row">
                        <span>Last Check-Out</span>
                        <strong>{formatTime(selectedRecord.checkOut)}</strong>
                      </div>
                      <div className="adm-date-row">
                        <span>Total Hours</span>
                        <strong>{formatHours(selectedRecord.totalHours)}</strong>
                      </div>
                      {selectedRecord.totalHours >= 8 ? (
                        <div className="adm-hours-ok">✅ Minimum 8 hours completed</div>
                      ) : (
                        <div className="adm-hours-warn">⚠️ Less than 8 hours — {formatHours(selectedRecord.totalHours)} worked</div>
                      )}
                      {selectedRecord.sessions?.length > 0 && (
                        <div className="adm-sessions">
                          <h4>All Sessions</h4>
                          {selectedRecord.sessions.map((s, i) => (
                            <div key={i} className="adm-session-row">
                              <span>Session {i + 1}</span>
                              <span>In: {formatTime(s.checkIn)}</span>
                              <span>Out: {s.checkOut ? formatTime(s.checkOut) : "Active"}</span>
                              <span>{s.hours ? formatHours(s.hours) : "—"}</span>
                              {s.workMode === "Work From Office" && hasCoords(s.location) && (
                                <a
                                  href={mapsLink(s.location)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="adm-location-link"
                                >
                                  📍 Map
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  {selectedRecord.status === "leave" && (
                    <div className="adm-date-row">
                      <span>Reason</span>
                      <strong>{selectedRecord.leaveReason}</strong>
                    </div>
                  )}
                </div>
              ) : (
                <div className="adm-date-body">
                  <div className="adm-status-badge-big absent">❌ No Record / Absent</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeAttendanceModal;