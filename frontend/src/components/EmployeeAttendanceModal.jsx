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

// Converts an ISO datetime string into the "YYYY-MM-DDTHH:mm" shape that
// <input type="datetime-local"> needs, in the browser's local time.
const toDatetimeLocalValue = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

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

  // -------- Admin: manually add/edit this date's record --------
  const [showEditForm, setShowEditForm] = useState(false);
  const [editForm, setEditForm] = useState({
    status: "present",
    workMode: "Work From Office",
    checkIn: "",
    checkOut: "",
    leaveReason: "",
    latitude: "",
    longitude: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [locatingEdit, setLocatingEdit] = useState(false);

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

  // Opens the edit form, pre-filled from the existing record if there is
  // one, otherwise sensible defaults for a fresh manual entry.
  const openEditForm = () => {
    if (selectedRecord) {
      setEditForm({
        status: selectedRecord.status || "present",
        workMode: selectedRecord.workMode || "Work From Office",
        checkIn: toDatetimeLocalValue(selectedRecord.checkIn) || `${selectedDate}T09:30`,
        checkOut: toDatetimeLocalValue(selectedRecord.checkOut) || `${selectedDate}T18:30`,
        leaveReason: selectedRecord.leaveReason || "",
        latitude: hasCoords(selectedRecord.location) ? String(selectedRecord.location.latitude) : "",
        longitude: hasCoords(selectedRecord.location) ? String(selectedRecord.location.longitude) : "",
      });
    } else {
      setEditForm({
        status: "present",
        workMode: "Work From Office",
        checkIn: `${selectedDate}T09:30`,
        checkOut: `${selectedDate}T18:30`,
        leaveReason: "",
        latitude: "",
        longitude: "",
      });
    }
    setEditError("");
    setShowEditForm(true);
  };

  // Lets the admin drop in their own current browser location as a quick
  // way to fill the lat/lng fields (e.g. verifying on-site presence).
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setEditError("Geolocation isn't available in this browser.");
      return;
    }
    setLocatingEdit(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setEditForm((f) => ({
          ...f,
          latitude: String(pos.coords.latitude),
          longitude: String(pos.coords.longitude),
        }));
        setLocatingEdit(false);
      },
      () => {
        setEditError("Couldn't get your current location.");
        setLocatingEdit(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSaveEdit = async () => {
    setEditError("");

    const payload = { status: editForm.status };
    if (editForm.status === "present") {
      if (!editForm.checkIn || !editForm.checkOut) {
        setEditError("Please set both check-in and check-out times.");
        return;
      }
      payload.workMode = editForm.workMode;
      payload.checkIn = new Date(editForm.checkIn).toISOString();
      payload.checkOut = new Date(editForm.checkOut).toISOString();

      const lat = parseFloat(editForm.latitude);
      const lng = parseFloat(editForm.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        payload.location = { latitude: lat, longitude: lng };
      }
    } else if (editForm.status === "leave") {
      payload.leaveReason = editForm.leaveReason;
    }

    setSavingEdit(true);
    try {
      await API.put(`/attendance/employee/${employee._id}/${selectedDate}`, payload);
      setShowEditForm(false);
      // Refresh both the open date's detail and the calendar/table/stats.
      await handleDateClick(selectedDate);
      await fetchAttendance();
    } catch (error) {
      setEditError(error.response?.data?.message || "Failed to save attendance record.");
    }
    setSavingEdit(false);
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
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    className="adm-close-btn"
                    style={{ fontSize: 13, width: "auto", padding: "4px 10px", borderRadius: 8 }}
                    onClick={openEditForm}
                    title="Manually add or correct this day's attendance"
                  >
                    ✏️ {selectedRecord ? "Edit" : "Add"} Record
                  </button>
                  <button className="adm-close-btn" onClick={() => setShowDateDetail(false)}>✕</button>
                </div>
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

        {/* ADMIN: ADD / EDIT ATTENDANCE FORM */}
        {showEditForm && (
          <div className="adm-date-overlay" onClick={() => setShowEditForm(false)}>
            <div className="adm-date-modal" onClick={(e) => e.stopPropagation()}>
              <div className="adm-date-header">
                <h3>✏️ {selectedRecord ? "Edit" : "Add"} Attendance — {selectedDate}</h3>
                <button className="adm-close-btn" onClick={() => setShowEditForm(false)}>✕</button>
              </div>

              <div className="adm-date-body">
                <div className="input-group" style={{ marginBottom: 12 }}>
                  <label>Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #e2e8f0" }}
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="leave">Leave</option>
                  </select>
                </div>

                {editForm.status === "present" && (
                  <>
                    <div className="input-group" style={{ marginBottom: 12 }}>
                      <label>Work Mode</label>
                      <select
                        value={editForm.workMode}
                        onChange={(e) => setEditForm({ ...editForm, workMode: e.target.value })}
                        style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #e2e8f0" }}
                      >
                        <option value="Work From Office">🏢 Work From Office</option>
                        <option value="Work From Home">🏠 Work From Home</option>
                        <option value="Site Visit">📍 Site Visit</option>
                      </select>
                    </div>
                    <div className="input-group" style={{ marginBottom: 12 }}>
                      <label>Check In</label>
                      <input
                        type="datetime-local"
                        value={editForm.checkIn}
                        onChange={(e) => setEditForm({ ...editForm, checkIn: e.target.value })}
                        style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #e2e8f0" }}
                      />
                    </div>
                    <div className="input-group" style={{ marginBottom: 12 }}>
                      <label>Check Out</label>
                      <input
                        type="datetime-local"
                        value={editForm.checkOut}
                        onChange={(e) => setEditForm({ ...editForm, checkOut: e.target.value })}
                        style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #e2e8f0" }}
                      />
                    </div>
                    <div className="input-group" style={{ marginBottom: 12 }}>
                      <label>Location (optional — mainly for Work From Office)</label>
                      <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                        <input
                          type="number"
                          step="any"
                          placeholder="Latitude"
                          value={editForm.latitude}
                          onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })}
                          style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid #e2e8f0" }}
                        />
                        <input
                          type="number"
                          step="any"
                          placeholder="Longitude"
                          value={editForm.longitude}
                          onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })}
                          style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid #e2e8f0" }}
                        />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <button
                          type="button"
                          className="adm-close-btn"
                          style={{ fontSize: 12, width: "auto", padding: "5px 10px", borderRadius: 8 }}
                          onClick={handleUseCurrentLocation}
                          disabled={locatingEdit}
                        >
                          📍 {locatingEdit ? "Locating…" : "Use My Current Location"}
                        </button>
                        {(editForm.latitude || editForm.longitude) && (
                          <button
                            type="button"
                            className="adm-close-btn"
                            style={{ fontSize: 12, width: "auto", padding: "5px 10px", borderRadius: 8 }}
                            onClick={() => setEditForm({ ...editForm, latitude: "", longitude: "" })}
                          >
                            ✕ Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {editForm.status === "leave" && (
                  <div className="input-group" style={{ marginBottom: 12 }}>
                    <label>Leave Reason</label>
                    <textarea
                      rows={3}
                      value={editForm.leaveReason}
                      onChange={(e) => setEditForm({ ...editForm, leaveReason: e.target.value })}
                      style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #e2e8f0", resize: "vertical" }}
                    />
                  </div>
                )}

                {editError && (
                  <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 10 }}>{editError}</p>
                )}

                <button
                  className="submit-btn"
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  style={{ width: "100%" }}
                >
                  {savingEdit ? "Saving…" : "💾 Save Record"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeAttendanceModal;