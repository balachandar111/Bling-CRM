const express = require("express");
const router = express.Router();

const employeeAuth = require("../middlewares/employeeAuth");
const authMiddleware = require("../middlewares/authMiddleware");
const userEmployeeAuth = require("../middlewares/userEmployeeAuth");
const superAdmin = require("../middlewares/superAdmin");

const {
  checkIn,
  checkOut,
  applyLeave,
  getTodayStatus,
  getMyAttendance,
  getDateAttendance,
  getEmployeeAttendanceSummary,
  getEmployeeDateAttendance,
  getPendingLeaves,
  approveLeave,
  rejectLeave,
  getTodayWorkModeSummary,
  adminUpsertAttendance,
} = require("../controllers/attendanceController");

// =============== USER /me/* ROUTES (user JWT → linked employee) ===============
// These mirror the employee routes but authenticate via the user's JWT token.
// MyAttendance.jsx calls these paths.

router.get("/me/today", userEmployeeAuth, getTodayStatus);
router.get("/me/my", userEmployeeAuth, getMyAttendance);
router.get("/me/date/:date", userEmployeeAuth, getDateAttendance);
router.post("/me/checkin", userEmployeeAuth, checkIn);
router.post("/me/checkout", userEmployeeAuth, checkOut);
router.post("/me/leave", userEmployeeAuth, applyLeave);

// =============== EMPLOYEE ROUTES ===============

// Check In
router.post("/checkin", employeeAuth, checkIn);

// Check Out
router.post("/checkout", employeeAuth, checkOut);

// Apply Leave
router.post("/leave", employeeAuth, applyLeave);

// Get today's status
router.get("/today", employeeAuth, getTodayStatus);

// Get full attendance history
router.get("/my", employeeAuth, getMyAttendance);

// Get specific date attendance
router.get("/my/:date", employeeAuth, getDateAttendance);

// =============== SUPER ADMIN ROUTES ===============

// Today's Work From Office / Work From Home / Site Visit counts + names
router.get("/today-workmode-summary", authMiddleware, getTodayWorkModeSummary);

// Get employee attendance summary
router.get(
  "/employee/:employeeId",
  authMiddleware,
  getEmployeeAttendanceSummary
);

// Get specific date for an employee
router.get(
  "/employee/:employeeId/:date",
  authMiddleware,
  getEmployeeDateAttendance
);

// Manually add or edit an employee's attendance record for a date
// (e.g. forgot to check in, wrong times, mark a missed day present/leave,
// or set a Work From Home location).
router.put(
  "/employee/:employeeId/:date",
  authMiddleware,
  superAdmin,
  adminUpsertAttendance
);

// Get all pending leave requests (for approval inbox)
router.get("/leave/pending", authMiddleware, getPendingLeaves);

// Approve a leave request -> marks as "leave"
router.put("/leave/:id/approve", authMiddleware, approveLeave);

// Reject a leave request
router.put("/leave/:id/reject", authMiddleware, rejectLeave);

module.exports = router;