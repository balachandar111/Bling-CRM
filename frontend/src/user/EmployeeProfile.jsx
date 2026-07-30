// 📁 src/pages/EmployeeProfile.jsx
// COMPLETE FILE - includes Attendance Section

import React, { useEffect, useState, useCallback } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

// Wraps the browser Geolocation API in a Promise. Resolves null if the
// browser doesn't support it, or the user denies/it times out — callers
// decide how to handle a null result.
const getCurrentLocation = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });

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
  FaDoorOpen,
  FaTasks,
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

// ── helpers for the Task Calendar (mirrors Dashboard's user/Tasks.jsx) ──
const toDateStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatTaskDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

// Department-based to-do list presets, plus a final "Other" option
// where the employee types their own task text dynamically. "general"
// is the fallback used when the employee has no department set yet.
// Kept in sync with backend/controllers/taskController.js and with
// Dashboard's user/Tasks.jsx so both places show the same checklist.
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
const CUSTOM_TASK_OPTION = "__custom__";

/* Display labels for the department badge on the Tasks tab. */
const DEPARTMENT_LABELS = {
  sales: "Sales",
  business_development: "Operation / Business Development",
  it: "IT",
  general: "General",
};

/* "Payment" is not a default preset — it's appended to the dropdown
   only for employees whose department qualifies (Sales / Business
   Development Executive), per the backend's `showPayment` flag.
   Selecting it reveals a payment-status sub-checklist. */
const PAYMENT_OPTION = "Payment";
const PAYMENT_PREFIX = "Payment: ";
const DEFAULT_PAYMENT_STATUSES = ["Advance Payment", "Payment Pending", "Collected"];

// Small icon for each work mode, used on the calendar and in tables.
const workModeIcon = (mode) => {
  if (mode === "Work From Office") return "🏢";
  if (mode === "Work From Home") return "🏠";
  if (mode === "Site Visit") return "📍";
  return "";
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
        title={rec && rec.workMode ? `${dateStr} — ${rec.workMode}` : dateStr}
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
        {rec && rec.workMode && (
          <span className="att-workmode-icon">{workModeIcon(rec.workMode)}</span>
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
        <span>🏢 Office</span>
        <span>🏠 Home</span>
        <span>📍 Site Visit</span>
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
  const [activeTab, setActiveTab] = useState("profile"); // "profile" | "attendance" | "tasks"
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
  const [showWorkModeModal, setShowWorkModeModal] = useState(false);
  const [selectedWorkMode, setSelectedWorkMode] = useState("");

  // -------- Resignation States --------
  const [showResignModal, setShowResignModal] = useState(false);
  const [resignForm, setResignForm] = useState({ name: "", date: "", reason: "" });
  const [resignation, setResignation] = useState({ status: "none" });
  const [resignLoading, setResignLoading] = useState(false);

  // -------- Tasks (to-do list) States --------
  const [taskItems, setTaskItems] = useState([]); // [{ text, note, completed }]
  // Department-based checklist — resolved from the employee's own linked
  // department (same source of truth the backend and admin summary use),
  // so an IT employee logging in here sees the IT checklist, a Sales
  // employee sees the Sales checklist, etc.
  const [taskDepartmentKey, setTaskDepartmentKey] = useState("general");
  const [taskShowPayment, setTaskShowPayment] = useState(false);
  const [taskPaymentStatuses, setTaskPaymentStatuses] = useState(DEFAULT_PAYMENT_STATUSES);
  const taskBasePresets = DEPARTMENT_TASK_PRESETS[taskDepartmentKey] || DEPARTMENT_TASK_PRESETS.general;
  const taskPresets = taskShowPayment ? [...taskBasePresets, PAYMENT_OPTION] : taskBasePresets;
  const [selectedTaskPreset, setSelectedTaskPreset] = useState(taskBasePresets[0]);
  const [selectedTaskPaymentStatus, setSelectedTaskPaymentStatus] = useState("");
  const [customTaskText, setCustomTaskText] = useState("");
  const [taskNoteText, setTaskNoteText] = useState(""); // optional note for whichever item is about to be added
  const [todayTaskDoc, setTodayTaskDoc] = useState(null);
  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const [taskUpdating, setTaskUpdating] = useState(false);
  const [taskSavedMsg, setTaskSavedMsg] = useState(""); // "submitted" | "updated" | ""

  // -------- Task Calendar States (view / edit PREVIOUS day's tasks) --------
  const [selectedTaskDate, setSelectedTaskDate] = useState(new Date());
  const [taskDateReports, setTaskDateReports] = useState([]);
  const [loadingTaskDateReports, setLoadingTaskDateReports] = useState(false);
  const [taskMarkedDates, setTaskMarkedDates] = useState([]);
  const [isEditingTaskDate, setIsEditingTaskDate] = useState(false);
  const [editTaskDateItems, setEditTaskDateItems] = useState([]); // [{ text, note, completed }]
  const [editTaskDatePreset, setEditTaskDatePreset] = useState("");
  const [editTaskDateCustomText, setEditTaskDateCustomText] = useState("");
  const [editTaskDatePaymentStatus, setEditTaskDatePaymentStatus] = useState("");
  const [editTaskDateNote, setEditTaskDateNote] = useState("");
  const [savingTaskDateEdit, setSavingTaskDateEdit] = useState(false);

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

  // -------- Fetch Resignation Status --------
  const fetchResignationStatus = useCallback(async () => {
    try {
      const { data } = await API.get("/employees/resignation/status");
      setResignation(data.resignation || { status: "none" });
    } catch (error) {
      console.log(error);
    }
  }, []);

  // -------- Fetch Today's Task List --------
  const fetchTodayTask = useCallback(async () => {
    try {
      const { data } = await API.get("/tasks/report/today");

      // The backend already resolves the logged-in employee's department
      // into a checklist bucket — use it here the same way Dashboard's
      // Tasks.jsx does, instead of a hardcoded generic list.
      const deptKey = data.departmentKey || "general";
      const paymentAllowed = !!data.showPayment;
      setTaskDepartmentKey(deptKey);
      setTaskShowPayment(paymentAllowed);
      if (Array.isArray(data.paymentStatuses) && data.paymentStatuses.length) {
        setTaskPaymentStatuses(data.paymentStatuses);
      }
      const deptPresets = DEPARTMENT_TASK_PRESETS[deptKey] || DEPARTMENT_TASK_PRESETS.general;
      const fullPresets = paymentAllowed ? [...deptPresets, PAYMENT_OPTION] : deptPresets;
      setSelectedTaskPreset(fullPresets[0]);
      setSelectedTaskPaymentStatus("");

      if (data.task) {
        setTodayTaskDoc(data.task);
        setTaskItems(data.task.items && data.task.items.length ? data.task.items : []);
      } else {
        setTodayTaskDoc(null);
        setTaskItems([]);
      }
    } catch (error) {
      console.log(error);
    }
  }, []);

  // -------- Task Calendar: fetch this employee's own task list for a
  // specific date, so previous days can be previewed / edited -------
  const fetchTaskForDate = useCallback(async (dateStr) => {
    setLoadingTaskDateReports(true);
    try {
      const { data } = await API.get(`/tasks/report/my?from=${dateStr}&to=${dateStr}`);
      setTaskDateReports(data.tasks || []);
    } catch (error) {
      console.log(error);
      setTaskDateReports([]);
    }
    setLoadingTaskDateReports(false);
  }, []);

  // Marks which days in the visible month already have a submitted task
  // list, shown as a small dot on the calendar (same as Dashboard's
  // user/Tasks.jsx).
  const fetchTaskMonthMarks = useCallback(async (dateInMonth) => {
    const year = dateInMonth.getFullYear();
    const month = dateInMonth.getMonth();
    const first = toDateStr(new Date(year, month, 1));
    const last = toDateStr(new Date(year, month + 1, 0));
    try {
      const { data } = await API.get(`/tasks/report/my?from=${first}&to=${last}`);
      setTaskMarkedDates(Array.from(new Set((data.tasks || []).map((t) => t.date))));
    } catch (error) {
      console.log(error);
      setTaskMarkedDates([]);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchPayslips();
    fetchTodayStatus();
    fetchMyAttendance();
    fetchResignationStatus();
    fetchTodayTask();
  }, [
    fetchProfile,
    fetchPayslips,
    fetchTodayStatus,
    fetchMyAttendance,
    fetchResignationStatus,
    fetchTodayTask,
  ]);

  useEffect(() => {
    fetchTaskForDate(toDateStr(selectedTaskDate));
  }, [selectedTaskDate, fetchTaskForDate]);

  useEffect(() => {
    fetchTaskMonthMarks(selectedTaskDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close any open date-editor whenever a different day is picked.
  useEffect(() => {
    setIsEditingTaskDate(false);
  }, [selectedTaskDate]);

  // -------- Resignation Actions --------
  const openResignModal = () => {
    setResignForm({
      name: employee?.name || "",
      date: "",
      reason: "",
    });
    setShowResignModal(true);
  };

  const handleResignSubmit = async () => {
    if (!resignForm.name.trim() || !resignForm.date || !resignForm.reason.trim()) {
      alert("Please fill in your name, last working date, and reason.");
      return;
    }
    setResignLoading(true);
    try {
      await API.post("/employees/resign", resignForm);
      alert("Resignation request submitted. Waiting for admin approval.");
      setShowResignModal(false);
      await fetchResignationStatus();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to submit resignation");
    }
    setResignLoading(false);
  };

  // -------- Attendance Actions --------
  const handleCheckIn = async (workMode) => {
    setAttLoading(true);
    try {
      let location = null;
      if (workMode === "Work From Office") {
        location = await getCurrentLocation();
        if (!location) {
          alert("Location access is required to check in as Work From Office. Please allow location access in your browser and try again.");
          setAttLoading(false);
          return;
        }
      }
      await API.post("/attendance/checkin", { workMode, location });
      await fetchTodayStatus();
      await fetchMyAttendance();
    } catch (error) {
      alert(error.response?.data?.message || "Check-in failed");
    }
    setAttLoading(false);
  };

  // Opens the work-mode selection popup instead of checking in directly.
  const openWorkModeModal = () => {
    setSelectedWorkMode("");
    setShowWorkModeModal(true);
  };

  const confirmWorkModeCheckIn = async () => {
    if (!selectedWorkMode) {
      alert("Please select a work mode.");
      return;
    }
    await handleCheckIn(selectedWorkMode);
    setShowWorkModeModal(false);
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

  // -------- Task List Actions --------
  // Adds an item using whichever of the department presets is selected,
  // the typed custom text when "Other" is selected, or the chosen
  // payment status when "Payment" is selected. An optional note
  // (from the note box shown once an option is picked) is saved
  // alongside every item type, same as the Dashboard's Tasks.jsx.
  const handleAddTaskItem = () => {
    let text = "";
    if (selectedTaskPreset === CUSTOM_TASK_OPTION) {
      text = customTaskText.trim();
      if (!text) {
        alert("Please type your task for the custom option.");
        return;
      }
    } else if (selectedTaskPreset === PAYMENT_OPTION) {
      if (!selectedTaskPaymentStatus) {
        alert("Please select a payment status.");
        return;
      }
      text = `${PAYMENT_PREFIX}${selectedTaskPaymentStatus}`;
    } else {
      text = selectedTaskPreset;
    }
    setTaskItems((prev) => [...prev, { text, note: taskNoteText.trim(), completed: false }]);
    setCustomTaskText("");
    setSelectedTaskPaymentStatus("");
    setTaskNoteText("");
  };

  // Ticks an item as "completed" — meant to be done at the end of the day.
  const toggleTaskItemCompleted = (index) => {
    setTaskItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, completed: !it.completed } : it))
    );
  };

  const removeTaskItem = (index) => {
    setTaskItems((prev) => prev.filter((_, i) => i !== index));
  };

  // First-time submit — creates today's task list.
  const handleTaskSubmit = async () => {
    if (taskItems.length === 0) {
      alert("Please add at least one task to your list before submitting.");
      return;
    }
    setTaskSubmitting(true);
    try {
      await API.post("/tasks/report", { items: taskItems });
      setTaskSavedMsg("submitted");
      await fetchTodayTask();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to submit task list.");
    }
    setTaskSubmitting(false);
    setTimeout(() => setTaskSavedMsg(""), 3000);
  };

  // Re-saves the list — used to check items off as "completed" through
  // the day and persist the final state before end of day.
  const handleTaskUpdate = async () => {
    if (taskItems.length === 0) {
      alert("Your task list can't be empty.");
      return;
    }
    setTaskUpdating(true);
    try {
      await API.post("/tasks/report", { items: taskItems });
      setTaskSavedMsg("updated");
      await fetchTodayTask();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update task list.");
    }
    setTaskUpdating(false);
    setTimeout(() => setTaskSavedMsg(""), 3000);
  };

  // -------- Task Calendar: edit a PREVIOUS day's task list --------
  // Opens an inline editor pre-filled with whatever was already
  // submitted for the selected date (or empty, if nothing was), so the
  // employee can add / remove / tick items for any past date — not just
  // today's list above.
  const startEditingTaskDate = () => {
    const existing = taskDateReports[0];
    setEditTaskDateItems(existing?.items ? existing.items.map((it) => ({ ...it })) : []);
    setEditTaskDatePreset(taskPresets[0]);
    setEditTaskDateCustomText("");
    setEditTaskDatePaymentStatus("");
    setEditTaskDateNote("");
    setIsEditingTaskDate(true);
  };

  const cancelEditingTaskDate = () => {
    setIsEditingTaskDate(false);
    setEditTaskDateItems([]);
  };

  const addEditTaskDateItem = () => {
    let text = "";
    if (editTaskDatePreset === PAYMENT_OPTION) {
      if (!editTaskDatePaymentStatus) {
        alert("Please select a payment status.");
        return;
      }
      text = `${PAYMENT_PREFIX}${editTaskDatePaymentStatus}`;
    } else if (editTaskDatePreset === CUSTOM_TASK_OPTION) {
      text = editTaskDateCustomText.trim();
      if (!text) {
        alert("Please type your task for the custom option.");
        return;
      }
    } else {
      text = editTaskDatePreset;
    }
    setEditTaskDateItems((prev) => [...prev, { text, note: editTaskDateNote.trim(), completed: false }]);
    setEditTaskDateCustomText("");
    setEditTaskDatePaymentStatus("");
    setEditTaskDateNote("");
  };

  const toggleEditTaskDateItemCompleted = (index) => {
    setEditTaskDateItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, completed: !it.completed } : it))
    );
  };

  const removeEditTaskDateItem = (index) => {
    setEditTaskDateItems((prev) => prev.filter((_, i) => i !== index));
  };

  const saveEditedTaskDate = async () => {
    if (editTaskDateItems.length === 0) {
      alert("Please add at least one task before saving.");
      return;
    }
    const dateStr = toDateStr(selectedTaskDate);
    setSavingTaskDateEdit(true);
    try {
      await API.post("/tasks/report", { items: editTaskDateItems, date: dateStr });
      setIsEditingTaskDate(false);
      await fetchTaskForDate(dateStr);
      fetchTaskMonthMarks(selectedTaskDate);
      if (dateStr === getTodayString()) await fetchTodayTask();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save the task list for this date.");
    }
    setSavingTaskDateEdit(false);
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
                src={(employee.profileImage && employee.profileImage.trim() !== "") ? employee.profileImage : "https://ui-avatars.com/api/?name=" + encodeURIComponent(employee.name || "User") + "&background=2563eb&color=fff&size=128"}
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
              <button
                className={`tab-btn ${activeTab === "tasks" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("tasks")}
              >
                <FaTasks /> Tasks
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

              {/* RESIGN */}
              {resignation.status === "pending" ? (
                <button className="edit-profile-btn" disabled style={{ opacity: 0.7 }}>
                  <FaDoorOpen /> Resignation Pending...
                </button>
              ) : resignation.status === "approved" ? (
                <button className="edit-profile-btn" disabled style={{ opacity: 0.7 }}>
                  <FaDoorOpen /> Resignation Approved
                </button>
              ) : (
                <button className="edit-profile-btn" onClick={openResignModal}>
                  <FaDoorOpen /> Resign
                </button>
              )}

              <button className="logout-profile-btn" onClick={handleLogout}>
                <FaSignOutAlt /> Logout
              </button>
            </div>

            {resignation.status === "rejected" && (
              <p style={{ color: "#cf1322", fontSize: 12, marginTop: 8, textAlign: "center" }}>
                Your previous resignation request was rejected. You can submit a new one.
              </p>
            )}
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
                      {todayRecord?.workMode && (
                        <>
                          {" · "}
                          {workModeIcon(todayRecord.workMode)}{" "}
                          {todayRecord.workMode}
                        </>
                      )}
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
                      onClick={openWorkModeModal}
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

            {/* ===== TASKS TAB ===== */}
            {activeTab === "tasks" && (
              <div className="attendance-section">
                <div className="task-report-card">
                  {/* Header row */}
                  <div className="task-report-header">
                    <div>
                      <h3 style={{ margin: 0 }}>📅 Today's Task List</h3>
                      <p style={{ marginTop: 4 }}>{getTodayString()}</p>
                      <span
                        style={{
                          display: "inline-block",
                          marginTop: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#4f46e5",
                          background: "#eef2ff",
                          borderRadius: 999,
                          padding: "3px 10px",
                        }}
                      >
                        🏷️ {DEPARTMENT_LABELS[taskDepartmentKey] || "General"} checklist
                      </span>
                    </div>
                    {todayTaskDoc && (
                      <span className="task-submitted-badge">✅ Submitted</span>
                    )}
                  </div>

                  {/* To-do list builder */}
                  <div className="task-add-row">
                    <select
                      className="task-preset-select"
                      value={selectedTaskPreset}
                      onChange={(e) => {
                        setSelectedTaskPreset(e.target.value);
                        setSelectedTaskPaymentStatus("");
                      }}
                    >
                      {taskPresets.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                      <option value={CUSTOM_TASK_OPTION}>Other (type your own)…</option>
                    </select>

                    {selectedTaskPreset === CUSTOM_TASK_OPTION && (
                      <input
                        type="text"
                        className="task-custom-input"
                        placeholder="Type your task…"
                        value={customTaskText}
                        onChange={(e) => setCustomTaskText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddTaskItem()}
                      />
                    )}

                    {selectedTaskPreset === PAYMENT_OPTION && (
                      <select
                        className="task-preset-select"
                        value={selectedTaskPaymentStatus}
                        onChange={(e) => setSelectedTaskPaymentStatus(e.target.value)}
                      >
                        <option value="">Select payment status…</option>
                        {taskPaymentStatuses.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    )}

                    <button type="button" className="task-add-btn" onClick={handleAddTaskItem}>
                      ➕ Add Task
                    </button>
                  </div>

                  {/* Note box — shown once a checklist option is selected, so
                      the employee can attach a short note to whichever item
                      (preset, custom, or payment status) they're about to add. */}
                  {selectedTaskPreset && (
                    <div className="task-add-row" style={{ marginTop: 8 }}>
                      <input
                        type="text"
                        className="task-custom-input"
                        placeholder={`Add a note about "${selectedTaskPreset === PAYMENT_OPTION ? (selectedTaskPaymentStatus || "Payment") : selectedTaskPreset === CUSTOM_TASK_OPTION ? "this task" : selectedTaskPreset}" (optional)…`}
                        value={taskNoteText}
                        onChange={(e) => setTaskNoteText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddTaskItem()}
                        style={{ flex: 1 }}
                      />
                    </div>
                  )}

                  {/* Today's checklist */}
                  {taskItems.length === 0 ? (
                    <p className="task-empty-hint">
                      No tasks added yet — pick an option above and click "Add Task" to build today's list.
                    </p>
                  ) : (
                    <ul className="task-item-checklist">
                      {taskItems.map((it, idx) => (
                        <li key={idx} className={`task-item-row ${it.completed ? "is-done" : ""}`}>
                          <label className="task-item-checkbox-label">
                            <input
                              type="checkbox"
                              checked={it.completed}
                              onChange={() => toggleTaskItemCompleted(idx)}
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
                            onClick={() => removeTaskItem(idx)}
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
                    {taskSavedMsg && (
                      <span className="task-saved-msg">
                        {taskSavedMsg === "updated" ? "✅ Task list updated!" : "✅ Task list submitted!"}
                      </span>
                    )}

                    {!todayTaskDoc && (
                      <button
                        className="task-submit-btn"
                        onClick={handleTaskSubmit}
                        disabled={taskSubmitting}
                      >
                        {taskSubmitting ? "Saving…" : "Submit Task List"}
                      </button>
                    )}

                    {todayTaskDoc && (
                      <button
                        className="task-update-btn"
                        onClick={handleTaskUpdate}
                        disabled={taskUpdating}
                      >
                        {taskUpdating ? "Updating…" : "✏️ Update Task List"}
                      </button>
                    )}
                  </div>
                </div>

                {/* ── TASK CALENDAR — preview any previous day's task list,
                    and edit it (add/remove/tick items) right from here. ── */}
                <div className="task-calendar-card" style={{ marginTop: 20 }}>
                  <h3 style={{ margin: "0 0 2px" }}>📅 My Task Calendar</h3>
                  <p style={{ margin: 0 }}>
                    Pick a date to preview that day's task list changes — use Edit to add or change tasks for that day, including previous days.
                  </p>

                  <div className="task-calendar-inner">
                    {/* Calendar widget */}
                    <div style={{ flex: "0 0 auto" }}>
                      <Calendar
                        onChange={setSelectedTaskDate}
                        value={selectedTaskDate}
                        maxDate={new Date()}
                        onActiveStartDateChange={({ activeStartDate }) =>
                          activeStartDate && fetchTaskMonthMarks(activeStartDate)
                        }
                        tileContent={({ date, view }) => {
                          if (view !== "month") return null;
                          if (!taskMarkedDates.includes(toDateStr(date))) return null;
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

                    {/* Selected date's task list */}
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
                          📅 {formatTaskDate(toDateStr(selectedTaskDate))}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {toDateStr(selectedTaskDate) === getTodayString() && (
                            <span style={{ color: "#94a3b8", fontSize: 11 }}>Today</span>
                          )}
                          {!loadingTaskDateReports && !isEditingTaskDate && (
                            <button
                              type="button"
                              className="task-update-btn"
                              style={{ padding: "4px 12px", fontSize: 12 }}
                              onClick={startEditingTaskDate}
                            >
                              ✏️ Edit
                            </button>
                          )}
                        </div>
                      </div>

                      {loadingTaskDateReports ? (
                        <p style={{ color: "#94a3b8", textAlign: "center", padding: "24px 0" }}>
                          Loading…
                        </p>
                      ) : isEditingTaskDate ? (
                        <div>
                          <div className="task-add-row">
                            <select
                              className="task-preset-select"
                              value={editTaskDatePreset}
                              onChange={(e) => setEditTaskDatePreset(e.target.value)}
                            >
                              {taskPresets.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                              <option value={CUSTOM_TASK_OPTION}>Other (type your own)…</option>
                            </select>

                            {editTaskDatePreset === CUSTOM_TASK_OPTION && (
                              <input
                                type="text"
                                className="task-custom-input"
                                placeholder="Type your task…"
                                value={editTaskDateCustomText}
                                onChange={(e) => setEditTaskDateCustomText(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && addEditTaskDateItem()}
                              />
                            )}

                            {editTaskDatePreset === PAYMENT_OPTION && (
                              <select
                                className="task-preset-select"
                                value={editTaskDatePaymentStatus}
                                onChange={(e) => setEditTaskDatePaymentStatus(e.target.value)}
                              >
                                <option value="">Select payment status…</option>
                                {taskPaymentStatuses.map((status) => (
                                  <option key={status} value={status}>{status}</option>
                                ))}
                              </select>
                            )}

                            <button type="button" className="task-add-btn" onClick={addEditTaskDateItem}>
                              ➕ Add Task
                            </button>
                          </div>

                          {editTaskDatePreset && (
                            <div className="task-add-row" style={{ marginTop: 8 }}>
                              <input
                                type="text"
                                className="task-custom-input"
                                placeholder={`Add a note about "${editTaskDatePreset === PAYMENT_OPTION ? (editTaskDatePaymentStatus || "Payment") : editTaskDatePreset === CUSTOM_TASK_OPTION ? "this task" : editTaskDatePreset}" (optional)…`}
                                value={editTaskDateNote}
                                onChange={(e) => setEditTaskDateNote(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && addEditTaskDateItem()}
                                style={{ flex: 1 }}
                              />
                            </div>
                          )}

                          {editTaskDateItems.length === 0 ? (
                            <p className="task-empty-hint">
                              No tasks yet for {formatTaskDate(toDateStr(selectedTaskDate))} — pick an option above and click "Add Task".
                            </p>
                          ) : (
                            <ul className="task-item-checklist">
                              {editTaskDateItems.map((it, idx) => (
                                <li key={idx} className={`task-item-row ${it.completed ? "is-done" : ""}`}>
                                  <label className="task-item-checkbox-label">
                                    <input
                                      type="checkbox"
                                      checked={it.completed}
                                      onChange={() => toggleEditTaskDateItemCompleted(idx)}
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
                                    onClick={() => removeEditTaskDateItem(idx)}
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
                              onClick={saveEditedTaskDate}
                              disabled={savingTaskDateEdit}
                            >
                              {savingTaskDateEdit ? "Saving…" : "💾 Save Changes"}
                            </button>
                            <button
                              type="button"
                              className="task-submit-btn"
                              style={{ background: "#e2e8f0", color: "#334155" }}
                              onClick={cancelEditingTaskDate}
                              disabled={savingTaskDateEdit}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : taskDateReports.length === 0 ? (
                        <div
                          style={{
                            textAlign: "center",
                            padding: "32px",
                            color: "#94a3b8",
                            background: "#f8fafc",
                            borderRadius: 10,
                          }}
                        >
                          <p style={{ margin: 0, fontSize: 14 }}>No task list for this date.</p>
                        </div>
                      ) : (
                        <div className="task-report-list">
                          {taskDateReports.map((t) => {
                            const hasItems = Array.isArray(t.items) && t.items.length > 0;
                            const doneCount = hasItems ? t.items.filter((it) => it.completed).length : 0;
                            return (
                              <div key={t._id} className="task-report-item">
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

      {/* ================= WORK MODE MODAL ================= */}
      {showWorkModeModal && (
        <div className="modal-overlay" onClick={() => setShowWorkModeModal(false)}>
          <div className="update-modal workmode-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select Work Mode</h2>
              <span className="close-icon" onClick={() => setShowWorkModeModal(false)}>✕</span>
            </div>
            <p style={{ margin: "0 0 16px", color: "#666" }}>How are you working today?</p>
            <div className="workmode-options">
              {["Work From Office", "Work From Home", "Site Visit"].map((mode) => (
                <button
                  type="button"
                  key={mode}
                  className={
                    "workmode-option" +
                    (selectedWorkMode === mode ? " workmode-option-selected" : "")
                  }
                  onClick={() => setSelectedWorkMode(mode)}
                >
                  <span className="workmode-option-icon">{workModeIcon(mode)}</span>
                  <span>{mode}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="submit-btn"
              disabled={!selectedWorkMode || attLoading}
              onClick={confirmWorkModeCheckIn}
            >
              Confirm Check In
            </button>
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

      {/* ================= RESIGN MODAL ================= */}
      {showResignModal && (
        <div className="modal-overlay" onClick={() => setShowResignModal(false)}>
          <div className="update-modal leave-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🚪 Submit Resignation</h2>
              <span className="close-icon" onClick={() => setShowResignModal(false)}>✕</span>
            </div>
            <div className="input-group">
              <label>Your Name</label>
              <input
                type="text"
                value={resignForm.name}
                onChange={(e) => setResignForm({ ...resignForm, name: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label>Last Working Date</label>
              <input
                type="date"
                value={resignForm.date}
                onChange={(e) => setResignForm({ ...resignForm, date: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label>Reason for Resignation</label>
              <textarea
                rows={4}
                placeholder="Enter your reason..."
                value={resignForm.reason}
                onChange={(e) => setResignForm({ ...resignForm, reason: e.target.value })}
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
            <button className="submit-btn" disabled={resignLoading} onClick={handleResignSubmit}>
              Submit Resignation Request
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
                      <span>Work Mode</span>
                      <strong>
                        {selectedDateRecord.workMode
                          ? `${workModeIcon(selectedDateRecord.workMode)} ${selectedDateRecord.workMode}`
                          : "—"}
                      </strong>
                    </div>
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