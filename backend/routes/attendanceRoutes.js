const express = require("express");
const router = express.Router();

const employeeAuth = require("../middlewares/employeeAuth");
const authMiddleware = require("../middlewares/authMiddleware");

const {
  checkIn,
  checkOut,
  applyLeave,
  getTodayStatus,
  getMyAttendance,
  getDateAttendance,
  getEmployeeAttendanceSummary,
  getEmployeeDateAttendance,
} = require("../controllers/attendanceController");

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

module.exports = router;