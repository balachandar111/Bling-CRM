// 📁 src/pages/EmployeeProfile.jsx
// COMPLETE FILE - includes Attendance Section

import React, { useEffect, useState, useCallback } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

import {
  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaBriefcase,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaFilePdf,
  FaUserTie,
  FaSignOutAlt,
  FaEdit,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaClipboardList,
} from "react-icons/fa";

import "./EmployeeProfile.css";

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

const getTodayString = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  return istDate.toISOString().slice(0, 10);
};

// ===================== CALENDAR COMPONENT =====================
const AttendanceCalendar = ({ records, onDateClick }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  const recordMap = {};
  records.forEach((r) => {
    recordMap[r.date] = r;
  });

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} className="att-cal-cell empty" />);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const rec = recordMap[dateStr];
    const today = getTodayString();
    let statusClass = "";
    if (rec) {
      statusClass =
        rec.status === "present"
          ? "att-present"
          : rec.status === "leave"
          ? "att-leave"
          : rec.status === "leave-pending"
          ? "att-leave-pending"
          : rec.status === "leave-rejected"
          ? "att-absent"
          : "att-absent";
    } else if (dateStr < today) {
      statusClass = "att-absent";
    }
    cells.push(
      <div
        key={dateStr}
        className={`att-cal-cell ${statusClass} ${dateStr === today ? "att-today" : ""}`}
        onClick={() => onDateClick(dateStr)}
        title={dateStr}
      >
        <span className="att-day-num">{d}</span>
        {rec && rec.status === "present" && (
          <span className="att-dot present-dot" />
        )}
        {rec && rec.status === "leave" && (
          <span className="att-dot leave-dot" />
        )}
        {rec && rec.status === "leave-pending" && (
          <span className="att-dot leave-dot" title="Pending approval" />
        )}
        {((!rec && dateStr < today) || (rec && (rec.status === "absent" || rec.status === "leave-rejected"))) && (
          <span className="att-dot absent-dot" />
        )}
      </div>
    );
  }

  return (
    <div className="att-calendar">
      <div className="att-cal-header">
        <button className="att-cal-nav" onClick={prevMonth}>‹</button>
        <h3>{monthNames[month]} {year}</h3>
        <button className="att-cal-nav" onClick={nextMonth}>›</button>
      </div>
      <div className="att-cal-legend">
        <span><span className="att-dot present-dot" /> Present</span>
        <span><span className="att-dot absent-dot" /> Absent</span>
        <span><span className="att-dot leave-dot" /> Leave</span>
      </div>
      <div className="att-cal-days-header">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
          <div key={d} className="att-cal-day-name">{d}</div>
        ))}
      </div>
      <div className="att-cal-grid">{cells}</div>
    </div>
  );
};

// ===================== MAIN COMPONENT =====================
const EmployeeProfile = () => {
  const navigate = useNavigate();

  // -------- Profile States --------
  const [employee, setEmployee] = useState(null);
  const [showUpdate, setShowUpdate] = useState(false);
  const [updateData, setUpdateData] = useState({
    email: "",
    profileImage: null,
    documents: null,
  });
  const [payslips, setPayslips] = useState([]);

  // -------- Attendance States --------
  const [activeTab, setActiveTab] = useState("profile"); // "profile" | "attendance"
  const [todayRecord, setTodayRecord] = useState(null);
  const [todayDate, setTodayDate] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({
    totalWorkedDays: 0,
    totalWorkedHours: 0,
    totalLeaveDays: 0,
  });
  const [selectedDateRecord, setSelectedDateRecord] = useState(null);
  const [selectedDateStr, setSelectedDateStr] = useState("");
  const [showDateModal, setShowDateModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ date: "", reason: "" });
  const [attLoading, setAttLoading] = useState(false);

  // -------- Fetch Profile --------
  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await API.get("/employees/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployee(data.employee);
    } catch (error) {
      console.log(error);
    }
  }, []);

  const fetchPayslips = useCallback(async () => {
    try {
      const { data } = await API.get("/employees/my-payslips");
      setPayslips(data.payslips);
    } catch (error) {
      console.log(error);
    }
  }, []);

  // -------- Fetch Attendance --------
  const fetchTodayStatus = useCallback(async () => {
    try {
      const { data } = await API.get("/attendance/today");
      setTodayRecord(data.record);
      setTodayDate(data.today);
    } catch (error) {
      console.log(error);
    }
  }, []);

  const fetchMyAttendance = useCallback(async () => {
    try {
      const { data } = await API.get("/attendance/my");
      setAttendanceRecords(data.records || []);
      setAttendanceStats({
        totalWorkedDays: data.totalWorkedDays || 0,
        totalWorkedHours: data.totalWorkedHours || 0,
        totalLeaveDays: data.totalLeaveDays || 0,
      });
    } catch (error) {
      console.log(error);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchPayslips();
    fetchTodayStatus();
    fetchMyAttendance();
  }, [fetchProfile, fetchPayslips, fetchTodayStatus, fetchMyAttendance]);

  // -------- Attendance Actions --------
  const handleCheckIn = async () => {
    setAttLoading(true);
    try {
      await API.post("/attendance/checkin");
      await fetchTodayStatus();
      await fetchMyAttendance();
    } catch (error) {
      alert(error.response?.data?.message || "Check-in failed");
    }
    setAttLoading(false);
  };

  const handleCheckOut = async () => {
    setAttLoading(true);
    try {
      await API.post("/attendance/checkout");
      await fetchTodayStatus();
      await fetchMyAttendance();
    } catch (error) {
      alert(error.response?.data?.message || "Check-out failed");
    }
    setAttLoading(false);
  };

  const handleLeaveSubmit = async () => {
    if (!leaveForm.date || !leaveForm.reason.trim()) {
      alert("Please select a date and enter a reason.");
      return;
    }
    try {
      await API.post("/attendance/leave", {
        leaveDate: leaveForm.date,
        reason: leaveForm.reason,
      });
      alert("Leave request submitted! Waiting for super admin approval.");
      setShowLeaveModal(false);
      setLeaveForm({ date: "", reason: "" });
      await fetchTodayStatus();
      await fetchMyAttendance();
    } catch (error) {
      alert(error.response?.data?.message || "Leave application failed");
    }
  };

  const handleCalendarDateClick = async (dateStr) => {
    setSelectedDateStr(dateStr);
    try {
      const { data } = await API.get(`/attendance/my/${dateStr}`);
      setSelectedDateRecord(data.record);
    } catch {
      setSelectedDateRecord(null);
    }
    setShowDateModal(true);
  };

  // -------- Determine button states --------
  const isCheckedIn =
    todayRecord &&
    todayRecord.status === "present" &&
    todayRecord.sessions?.length > 0 &&
    !todayRecord.sessions[todayRecord.sessions.length - 1]?.checkOut;

  const isCheckedOut =
    todayRecord &&
    todayRecord.status === "present" &&
    todayRecord.sessions?.length > 0 &&
    !!todayRecord.sessions[todayRecord.sessions.length - 1]?.checkOut;

  const isOnLeave = todayRecord && todayRecord.status === "leave";
  const isLeavePending = todayRecord && todayRecord.status === "leave-pending";

  // -------- Profile handlers --------
  const handleChange = (e) => {
    setUpdateData({ ...updateData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setUpdateData({ ...updateData, [e.target.name]: e.target.files[0] });
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (updateData.email) {
        await API.put(
          "/employees/update-email",
          { email: updateData.email },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      if (updateData.profileImage) {
        const imageData = new FormData();
        imageData.append("profileImage", updateData.profileImage);
        await API.put("/employees/update-image", imageData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      if (updateData.document) {
        const docData = new FormData();
        docData.append("document", updateData.document);
        await API.put("/employees/update-document", docData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      alert("Profile Updated Successfully");
      fetchProfile();
      setShowUpdate(false);
    } catch (error) {
      alert(error.response?.data?.message || "Update failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="employee-page">
      {employee && (
        <div className="profile-container">

          {/* ================= SIDEBAR ================= */}
          <div className="profile-sidebar">
            <div className="profile-image-box">
              <img
                src={employee.profileImage}
                alt="profile"
                className="profile-image"
              />
            </div>
            <h1>{employee.name}</h1>
            <p>{employee.designation}</p>
            <div className="profile-badge">
              <FaUserTie /> Employee Portal
            </div>

            {/* TAB SWITCHER */}
            <div className="profile-tab-switcher">
              <button
                className={`tab-btn ${activeTab === "profile" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("profile")}
              >
                <FaUserTie /> Profile
              </button>
              <button
                className={`tab-btn ${activeTab === "attendance" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("attendance")}
              >
                <FaClipboardList /> Attendance
              </button>
            </div>

            <div className="profile-actions">
              <button
                className="edit-profile-btn"
                onClick={() => {
                  setUpdateData({
                    email: employee.email || "",
                    profileImage: null,
                    documents: null,
                  });
                  setShowUpdate(true);
                }}
              >
                <FaEdit /> Update Profile
              </button>
              <button className="logout-profile-btn" onClick={handleLogout}>
                <FaSignOutAlt /> Logout
              </button>
            </div>
          </div>

          {/* ================= CONTENT ================= */}
          <div className="profile-content">

            {/* ===== PROFILE TAB ===== */}
            {activeTab === "profile" && (
              <>
                <div className="profile-header">
                  <div>
                    <h2>Employee Information</h2>
                    <span>Professional Employee Profile</span>
                  </div>
                </div>

                <div className="details-grid">
                  <div className="detail-card">
                    <FaEnvelope className="detail-icon" />
                    <div><span>Email</span><h3>{employee.email}</h3></div>
                  </div>
                  <div className="detail-card">
                    <FaPhone className="detail-icon" />
                    <div><span>Phone</span><h3>{employee.phone}</h3></div>
                  </div>
                  <div className="detail-card">
                    <FaBuilding className="detail-icon" />
                    <div><span>Department</span><h3>{employee.department}</h3></div>
                  </div>
                  <div className="detail-card">
                    <FaBriefcase className="detail-icon" />
                    <div><span>Designation</span><h3>{employee.designation}</h3></div>
                  </div>
                  <div className="detail-card">
                    <FaMoneyBillWave className="detail-icon" />
                    <div><span>Salary</span><h3>₹{employee.salary}</h3></div>
                  </div>
                  <div className="detail-card">
                    <FaCalendarAlt className="detail-icon" />
                    <div>
                      <span>Joining Date</span>
                      <h3>{employee.joiningDate?.slice(0, 10)}</h3>
                    </div>
                  </div>
                </div>

                {/* PAYSLIPS */}
                <div className="payslip-section">
                  <h2 className="payslip-title">Monthly Payslips</h2>
                  {payslips.length > 0 ? (
                    <div className="payslip-grid">
                      {payslips.map((item, index) => (
                        <a
                          key={index}
                          href={item.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="payslip-card"
                        >
                          <div className="payslip-icon"><FaFilePdf /></div>
                          <div className="payslip-info">
                            <h4>Payslip</h4>
                            <p>{item.month}/{item.year}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="no-payslip">No Payslips Uploaded</div>
                  )}
                </div>

                {/* DOCUMENTS */}
                <div className="document-section">
                  <div className="section-title"><h2>Uploaded Documents</h2></div>
                  <div className="document-grid">
                    {employee.documents?.length > 0 ? (
                      employee.documents.map((doc, index) => (
                        <a
                          key={index}
                          href={doc}
                          target="_blank"
                          rel="noreferrer"
                          className="document-card"
                        >
                          <FaFilePdf className="pdf-icon" />
                          <span>Document {index + 1}</span>
                        </a>
                      ))
                    ) : (
                      <p>No documents uploaded</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ===== ATTENDANCE TAB ===== */}
            {activeTab === "attendance" && (
              <div className="attendance-section">

                {/* TODAY'S ACTION PANEL */}
                <div className="att-today-panel">
                  <div className="att-today-header">
                    <h2><FaClock /> Today's Attendance</h2>
                    <span className="att-date-badge">{todayDate}</span>
                  </div>

                  {isOnLeave ? (
                    <div className="att-status-banner leave-banner">
                      📅 You are on approved leave today
                    </div>
                  ) : isLeavePending ? (
                    <div className="att-status-banner leave-banner">
                      ⏳ Your leave request for today is pending super admin approval
                    </div>
                  ) : todayRecord?.status === "present" ? (
                    <div className="att-status-banner present-banner">
                      ✅ Present — Total time today:{" "}
                      <strong>{formatHours(todayRecord.totalHours)}</strong>
                      {isCheckedIn && " (Currently logged in)"}
                    </div>
                  ) : (
                    <div className="att-status-banner notcheckin-banner">
                      ⏳ Not checked in yet
                    </div>
                  )}

                  <div className="att-action-buttons">
                    {/* CHECK IN */}
                    <button
                      className="att-btn checkin-btn"
                      onClick={handleCheckIn}
                      disabled={
                        attLoading ||
                        isCheckedIn ||
                        isOnLeave ||
                        isLeavePending
                      }
                    >
                      <FaCheckCircle />
                      {isCheckedIn ? "Checked In ✓" : "Check In"}
                    </button>

                    {/* CHECK OUT */}
                    <button
                      className="att-btn checkout-btn"
                      onClick={handleCheckOut}
                      disabled={
                        attLoading ||
                        !isCheckedIn
                      }
                    >
                      <FaTimesCircle />
                      Check Out
                    </button>

                    {/* LEAVE */}
                    <button
                      className="att-btn leave-btn"
                      onClick={() => setShowLeaveModal(true)}
                      disabled={attLoading || isLeavePending || isOnLeave}
                    >
                      <FaCalendarAlt />
                      {isLeavePending ? "Leave Pending..." : "Apply Leave"}
                    </button>

                  </div>

                  {/* Session details for today */}
                  {todayRecord?.sessions?.length > 0 && (
                    <div className="att-sessions">
                      <h4>Today's Sessions</h4>
                      {todayRecord.sessions.map((s, i) => (
                        <div key={i} className="att-session-row">
                          <span>Session {i + 1}</span>
                          <span>In: {formatTime(s.checkIn)}</span>
                          <span>Out: {s.checkOut ? formatTime(s.checkOut) : "Active"}</span>
                          <span>{s.hours ? formatHours(s.hours) : "—"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* STATS */}
                <div className="att-stats-row">
                  <div className="att-stat-card green">
                    <h3>{attendanceStats.totalWorkedDays}</h3>
                    <p>Total Worked Days</p>
                  </div>
                  <div className="att-stat-card blue">
                    <h3>{formatHours(attendanceStats.totalWorkedHours)}</h3>
                    <p>Total Worked Hours</p>
                  </div>
                  <div className="att-stat-card orange">
                    <h3>{attendanceStats.totalLeaveDays}</h3>
                    <p>Leave Days</p>
                  </div>
                </div>

                {/* CALENDAR */}
                <div className="att-calendar-wrapper">
                  <h3>📅 Attendance Calendar</h3>
                  <p className="att-cal-hint">Click any date to view details</p>
                  <AttendanceCalendar
                    records={attendanceRecords}
                    onDateClick={handleCalendarDateClick}
                  />
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= UPDATE MODAL ================= */}
      {showUpdate && (
        <div className="modal-overlay">
          <div className="update-modal">
            <div className="modal-header">
              <h2>Update Profile</h2>
              <span className="close-icon" onClick={() => setShowUpdate(false)}>✕</span>
            </div>
            <form onSubmit={updateProfile}>
              <div className="input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={updateData.email}
                  onChange={handleChange}
                />
              </div>
              <div className="input-group">
                <label>Update Profile Image</label>
                <input type="file" name="profileImage" accept="image/*" onChange={handleFileChange} />
              </div>
              <div className="input-group">
                <label>Update Document</label>
                <input type="file" name="document" accept=".pdf" onChange={handleFileChange} />
              </div>
              <button type="submit" className="submit-btn">Save Changes</button>
            </form>
          </div>
        </div>
      )}

      {/* ================= LEAVE MODAL ================= */}
      {showLeaveModal && (
        <div className="modal-overlay">
          <div className="update-modal leave-modal">
            <div className="modal-header">
              <h2>📅 Apply Leave</h2>
              <span className="close-icon" onClick={() => setShowLeaveModal(false)}>✕</span>
            </div>
            <div className="input-group">
              <label>Select Date</label>
              <input
                type="date"
                value={leaveForm.date}
                onChange={(e) => setLeaveForm({ ...leaveForm, date: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label>Reason for Leave</label>
              <textarea
                rows={4}
                placeholder="Enter your reason..."
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  fontSize: "14px",
                  resize: "vertical",
                }}
              />
            </div>
            <button className="submit-btn" onClick={handleLeaveSubmit}>
              Submit Leave
            </button>
          </div>
        </div>
      )}

      {/* ================= DATE DETAIL MODAL ================= */}
      {showDateModal && (
        <div className="modal-overlay">
          <div className="update-modal date-detail-modal">
            <div className="modal-header">
              <h2>📋 {selectedDateStr}</h2>
              <span className="close-icon" onClick={() => setShowDateModal(false)}>✕</span>
            </div>
            {selectedDateRecord ? (
              <div className="date-detail-body">
                <div className={`status-badge-big ${selectedDateRecord.status}`}>
                  {selectedDateRecord.status === "present"
                    ? "✅ Present"
                    : selectedDateRecord.status === "leave"
                    ? "📅 On Leave (Approved)"
                    : selectedDateRecord.status === "leave-pending"
                    ? "⏳ Leave Pending Approval"
                    : selectedDateRecord.status === "leave-rejected"
                    ? "🚫 Leave Rejected"
                    : "❌ Absent"}
                </div>
                {selectedDateRecord.status === "present" && (
                  <>
                    <div className="date-detail-row">
                      <span>First Check-In</span>
                      <strong>{formatTime(selectedDateRecord.checkIn)}</strong>
                    </div>
                    <div className="date-detail-row">
                      <span>Last Check-Out</span>
                      <strong>{formatTime(selectedDateRecord.checkOut)}</strong>
                    </div>
                    <div className="date-detail-row">
                      <span>Total Hours</span>
                      <strong>{formatHours(selectedDateRecord.totalHours)}</strong>
                    </div>
                    {selectedDateRecord.totalHours >= 8 ? (
                      <div className="min-hours-ok">✅ Minimum 8 hours completed</div>
                    ) : (
                      <div className="min-hours-warn">⚠️ Less than 8 hours worked</div>
                    )}
                    {selectedDateRecord.sessions?.length > 1 && (
                      <div className="sessions-detail">
                        <h4>All Sessions</h4>
                        {selectedDateRecord.sessions.map((s, i) => (
                          <div key={i} className="att-session-row">
                            <span>Session {i + 1}</span>
                            <span>In: {formatTime(s.checkIn)}</span>
                            <span>Out: {s.checkOut ? formatTime(s.checkOut) : "—"}</span>
                            <span>{s.hours ? formatHours(s.hours) : "—"}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
                {(selectedDateRecord.status === "leave" ||
                  selectedDateRecord.status === "leave-pending" ||
                  selectedDateRecord.status === "leave-rejected") && (
                  <div className="date-detail-row">
                    <span>Reason</span>
                    <strong>{selectedDateRecord.leaveReason}</strong>
                  </div>
                )}
              </div>
            ) : (
              <div className="date-detail-body">
                <div className="status-badge-big absent">❌ No Record / Absent</div>
                <p style={{ textAlign: "center", color: "#94a3b8", marginTop: 12 }}>
                  No attendance record found for this date.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeProfile;