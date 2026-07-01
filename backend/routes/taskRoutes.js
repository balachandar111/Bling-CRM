const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const superAdmin = require("../middlewares/superAdmin");

const {
  submitReport,
  getTodayReport,
  getMyReports,
  getAllReports,
} = require("../controllers/taskController");

// ── User routes (requires any logged-in user) ──────────────────
// Submit / update today's report
router.post("/report", authMiddleware, submitReport);

// Get today's report
router.get("/report/today", authMiddleware, getTodayReport);

// Get my reports (weekly filter via ?from=&to=)
router.get("/report/my", authMiddleware, getMyReports);

// ── Super admin routes ─────────────────────────────────────────
// Get all reports (optional ?from=&to=&userId=)
router.get("/report/all", authMiddleware, superAdmin, getAllReports);

module.exports = router;