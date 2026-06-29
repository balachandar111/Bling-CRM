const Attendance = require("../models/attendanceModel");

// ============================================================
// HELPER: get today's date string in IST (YYYY-MM-DD)
// ============================================================
const getTodayIST = () => {
  const now = new Date();
  // IST = UTC+5:30
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  return istDate.toISOString().slice(0, 10);
};

// ============================================================
// HELPER: compute hours between two Date objects
// ============================================================
const computeHours = (start, end) => {
  if (!start || !end) return 0;
  return Math.max(0, (new Date(end) - new Date(start)) / (1000 * 60 * 60));
};

// ============================================================
// CHECK IN
// ============================================================
const checkIn = async (req, res) => {
  try {
    const employeeId = req.employee.id;
    const today = getTodayIST();
    const now = new Date();

    let record = await Attendance.findOne({
      employee: employeeId,
      date: today,
    });

    if (!record) {
      // First check-in of the day
      record = await Attendance.create({
        employee: employeeId,
        date: today,
        status: "present",
        checkIn: now,
        sessions: [{ checkIn: now, checkOut: null, hours: 0 }],
      });
    } else if (record.status === "leave") {
      return res.status(400).json({
        success: false,
        message: "You have applied leave for today. Cannot check in.",
      });
    } else {
      // Already has a record — check if last session is open
      const lastSession = record.sessions[record.sessions.length - 1];
      if (lastSession && !lastSession.checkOut) {
        return res.status(400).json({
          success: false,
          message: "Already checked in. Please check out first.",
        });
      }
      // Allow extra login after checkout
      record.sessions.push({ checkIn: now, checkOut: null, hours: 0 });
      record.status = "present";
      await record.save();
    }

    return res.json({
      success: true,
      message: "Checked in successfully",
      record,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// CHECK OUT
// ============================================================
const checkOut = async (req, res) => {
  try {
    const employeeId = req.employee.id;
    const today = getTodayIST();
    const now = new Date();

    const record = await Attendance.findOne({
      employee: employeeId,
      date: today,
    });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "No check-in record found for today.",
      });
    }

    const lastSession = record.sessions[record.sessions.length - 1];
    if (!lastSession || lastSession.checkOut) {
      return res.status(400).json({
        success: false,
        message: "You are not currently checked in.",
      });
    }

    // Close the current session
    lastSession.checkOut = now;
    lastSession.hours = computeHours(lastSession.checkIn, now);

    // Recompute total hours across all sessions
    record.totalHours = record.sessions.reduce(
      (sum, s) => sum + (s.hours || 0),
      0
    );

    // Set the overall checkOut to the latest session's checkOut
    record.checkOut = now;

    // Set the first checkIn as the overall checkIn (for display)
    record.checkIn = record.sessions[0].checkIn;

    await record.save();

    return res.json({
      success: true,
      message: "Checked out successfully",
      record,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// APPLY LEAVE
// ============================================================
const applyLeave = async (req, res) => {
  try {
    const employeeId = req.employee.id;
    const { leaveDate, reason } = req.body;

    if (!leaveDate || !reason) {
      return res.status(400).json({
        success: false,
        message: "Leave date and reason are required.",
      });
    }

    // Check if already present/checked-in on that date
    const existing = await Attendance.findOne({
      employee: employeeId,
      date: leaveDate,
    });

    if (existing && existing.status === "present") {
      return res.status(400).json({
        success: false,
        message: "You already have attendance for this date.",
      });
    }

    const record = await Attendance.findOneAndUpdate(
      { employee: employeeId, date: leaveDate },
      {
        employee: employeeId,
        date: leaveDate,
        status: "leave",
        leaveReason: reason,
        leaveDate: leaveDate,
      },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      message: "Leave applied successfully",
      record,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// GET TODAY'S STATUS (for employee dashboard buttons)
// ============================================================
const getTodayStatus = async (req, res) => {
  try {
    const employeeId = req.employee.id;
    const today = getTodayIST();

    const record = await Attendance.findOne({
      employee: employeeId,
      date: today,
    });

    return res.json({
      success: true,
      today,
      record: record || null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// GET MY ATTENDANCE (for employee - full history)
// ============================================================
const getMyAttendance = async (req, res) => {
  try {
    const employeeId = req.employee.id;

    const records = await Attendance.find({ employee: employeeId }).sort({
      date: -1,
    });

    const totalWorkedDays = records.filter(
      (r) => r.status === "present"
    ).length;

    const totalWorkedHours = records.reduce(
      (sum, r) => sum + (r.totalHours || 0),
      0
    );

    const totalLeaveDays = records.filter(
      (r) => r.status === "leave"
    ).length;

    return res.json({
      success: true,
      records,
      totalWorkedDays,
      totalWorkedHours: Math.round(totalWorkedHours * 100) / 100,
      totalLeaveDays,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// GET SPECIFIC DATE ATTENDANCE (for employee calendar click)
// ============================================================
const getDateAttendance = async (req, res) => {
  try {
    const employeeId = req.employee.id;
    const { date } = req.params; // "YYYY-MM-DD"

    const record = await Attendance.findOne({
      employee: employeeId,
      date,
    });

    return res.json({
      success: true,
      record: record || null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// SUPER ADMIN: GET EMPLOYEE ATTENDANCE SUMMARY
// ============================================================
const getEmployeeAttendanceSummary = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const records = await Attendance.find({ employee: employeeId }).sort({
      date: -1,
    });

    const totalWorkedDays = records.filter(
      (r) => r.status === "present"
    ).length;

    const totalAbsentDays = records.filter(
      (r) => r.status === "absent"
    ).length;

    const totalLeaveDays = records.filter(
      (r) => r.status === "leave"
    ).length;

    const totalWorkedHours = records.reduce(
      (sum, r) => sum + (r.totalHours || 0),
      0
    );

    return res.json({
      success: true,
      records,
      totalWorkedDays,
      totalAbsentDays,
      totalLeaveDays,
      totalWorkedHours: Math.round(totalWorkedHours * 100) / 100,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// SUPER ADMIN: GET SPECIFIC DATE FOR EMPLOYEE
// ============================================================
const getEmployeeDateAttendance = async (req, res) => {
  try {
    const { employeeId, date } = req.params;

    const record = await Attendance.findOne({
      employee: employeeId,
      date,
    });

    return res.json({
      success: true,
      record: record || null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  checkIn,
  checkOut,
  applyLeave,
  getTodayStatus,
  getMyAttendance,
  getDateAttendance,
  getEmployeeAttendanceSummary,
  getEmployeeDateAttendance,
};