const Task = require("../models/taskModel");

// Helper: today in IST
const getTodayIST = () => {
  const now = new Date();
  const istDate = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return istDate.toISOString().slice(0, 10);
};

// ============================================================
// SUBMIT / UPDATE TODAY'S REPORT
// ============================================================
const submitReport = async (req, res) => {
  try {
    const userId = req.user._id;
    const userName = req.user.name;
    const today = getTodayIST();
    const { report } = req.body;

    if (!report || !report.trim()) {
      return res.status(400).json({
        success: false,
        message: "Report content is required.",
      });
    }

    const task = await Task.findOneAndUpdate(
      { user: userId, date: today },
      {
        user: userId,
        userName,
        date: today,
        report: report.trim(),
      },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      message: "Report saved successfully.",
      task,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// GET TODAY'S REPORT (for current user)
// ============================================================
const getTodayReport = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = getTodayIST();

    const task = await Task.findOne({ user: userId, date: today });

    return res.json({
      success: true,
      today,
      task: task || null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// GET WEEKLY REPORTS (for current user, filter by week)
// query: ?from=YYYY-MM-DD&to=YYYY-MM-DD
// ============================================================
const getMyReports = async (req, res) => {
  try {
    const userId = req.user._id;
    const { from, to } = req.query;

    const filter = { user: userId };
    if (from && to) {
      filter.date = { $gte: from, $lte: to };
    }

    const tasks = await Task.find(filter).sort({ date: -1 });

    return res.json({
      success: true,
      tasks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// SUPER ADMIN: GET ALL REPORTS (with optional week filter)
// ============================================================
const getAllReports = async (req, res) => {
  try {
    const { from, to, userId } = req.query;

    const filter = {};
    if (from && to) filter.date = { $gte: from, $lte: to };
    if (userId) filter.user = userId;

    const tasks = await Task.find(filter)
      .populate("user", "name email")
      .sort({ date: -1, createdAt: -1 });

    return res.json({
      success: true,
      tasks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  submitReport,
  getTodayReport,
  getMyReports,
  getAllReports,
};