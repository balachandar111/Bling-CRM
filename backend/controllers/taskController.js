const Task = require("../models/taskModel");
const User = require("../models/userModel");
const Employee = require("../models/employeeModel");

// Helper: today in IST
const getTodayIST = () => {
  const now = new Date();
  const istDate = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return istDate.toISOString().slice(0, 10);
};

// ============================================================
// DEPARTMENT → TASK CHECKLIST PRESETS
// Each department gets its own fixed checklist. "general" is the
// fallback used when an employee has no department set yet.
// ============================================================
const DEPARTMENT_TASK_PRESETS = {
  sales: ["Daily Followup", "New Leads", "Payment Followup", "Requirement"],
  // Operation and Business Development Executive are the same role —
  // both use this one shared checklist.
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

// Normalize a free-text department value (e.g. "Sales", "sales team",
// "Operations", "Business Development Executive", "N/A") into one of
// the known preset buckets. Operation and Business Development
// Executive are treated as the same role, so both resolve to the
// same "business_development" bucket and share one checklist.
const resolveDepartmentKey = (department) => {
  const d = String(department || "").trim().toLowerCase();
  if (d.includes("business development")) return "business_development";
  if (d.startsWith("oper")) return "business_development";
  if (d.startsWith("sale")) return "sales";
  if (d === "it" || d.startsWith("it ") || d.startsWith("tech") || d.includes("information technology")) return "it";
  return "general";
};

// The "Payment" checklist item is NOT a default preset — it only
// appears for Sales employees and for Operation / Business
// Development Executive employees (same role).
const canShowPaymentOption = (department) => {
  const d = String(department || "").trim().toLowerCase();
  return d.startsWith("sale") || d.includes("business development") || d.startsWith("oper");
};

// Sub-checklist shown only after the employee picks "Payment".
const PAYMENT_STATUSES = ["Advance Payment", "Payment Pending", "Collected"];
const PAYMENT_PREFIX = "Payment: ";

// Helper: get { departmentKey, presets, showPayment } for the logged-in
// user, based on their linked Employee's department.
const getChecklistForUser = (reqUser) => {
  const rawDepartment = reqUser?.linkedEmployeeId?.department || "";
  const departmentKey = resolveDepartmentKey(rawDepartment);
  return {
    department: rawDepartment,
    departmentKey,
    presets: DEPARTMENT_TASK_PRESETS[departmentKey],
    showPayment: canShowPaymentOption(rawDepartment),
    paymentStatuses: PAYMENT_STATUSES,
  };
};

// ============================================================
// SUBMIT / UPDATE TODAY'S TASK LIST
// Body: { items: [{ text, completed }, ...] }
// ============================================================
const submitReport = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Not authorized." });
    }

    const userId = req.user._id;
    const userName = req.user.name;
    const today = getTodayIST();
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please add at least one task to today's list before submitting.",
      });
    }

    // Sanitize: trim text, force completed to boolean, drop empty rows.
    const cleanItems = items
      .map((it) => ({
        text: String(it?.text || "").trim(),
        completed: !!it?.completed,
      }))
      .filter((it) => it.text !== "");

    if (cleanItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please add at least one valid task before submitting.",
      });
    }

    // Keep a plain-text mirror of the checklist so any existing
    // reporting/search that relies on `report` keeps working.
    const report = cleanItems
      .map((it) => `${it.completed ? "[x]" : "[ ]"} ${it.text}`)
      .join("\n");

    const task = await Task.findOneAndUpdate(
      { user: userId, date: today },
      {
        user: userId,
        userName,
        date: today,
        items: cleanItems,
        report,
      },
      { upsert: true, new: true, runValidators: true }
    );

    return res.json({
      success: true,
      message: "Task list saved successfully.",
      task,
    });
  } catch (error) {
    // Full stack trace so the real cause is visible in the backend
    // terminal instead of just a bare 500 in the browser console.
    console.error("submitReport error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// GET TODAY'S REPORT (for current user)
// ============================================================
const getTodayReport = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Not authorized." });
    }

    const userId = req.user._id;
    const today = getTodayIST();

    const task = await Task.findOne({ user: userId, date: today });
    const checklist = getChecklistForUser(req.user);

    return res.json({
      success: true,
      today,
      task: task || null,
      department: checklist.department,
      departmentKey: checklist.departmentKey,
      presets: checklist.presets,
      showPayment: checklist.showPayment,
      paymentStatuses: checklist.paymentStatuses,
    });
  } catch (error) {
    console.error("getTodayReport error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// GET CHECKLIST OPTIONS (for current user, based on their department)
// ============================================================
const getChecklistOptions = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Not authorized." });
    }

    const checklist = getChecklistForUser(req.user);

    return res.json({
      success: true,
      department: checklist.department,
      departmentKey: checklist.departmentKey,
      presets: checklist.presets,
      showPayment: checklist.showPayment,
      paymentStatuses: checklist.paymentStatuses,
    });
  } catch (error) {
    console.error("getChecklistOptions error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// GET WEEKLY REPORTS (for current user, filter by week)
// query: ?from=YYYY-MM-DD&to=YYYY-MM-DD
// ============================================================
const getMyReports = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Not authorized." });
    }

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
    console.error("getMyReports error:", error);
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
    console.error("getAllReports error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// SUPER ADMIN: GET TASK SUMMARY TABLE (grouped by date x department)
// Columns: S.No, Date, Operation Task, Sales Task, IT Task, Others, Payment
// Each cell lists every employee's submitted task items for that
// date within that department bucket. "Payment: ..." items (only
// ever added by Sales / Business Development employees) are pulled
// into their own Payment column instead of the Sales/Others column.
// query: ?from=YYYY-MM-DD&to=YYYY-MM-DD (optional)
// ============================================================
const getAdminTaskSummary = async (req, res) => {
  try {
    const { from, to } = req.query;

    // Supports a full range (from + to), a specific single date
    // (from === to, or just one of them set), or no filter at all.
    const filter = {};
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }

    // NOTE: we deliberately do NOT populate `user` here (as the old code
    // did with `ref: "UserDetails"`). Employees who log in directly via
    // the "Employee Profile" login (no linked User account) have their
    // Task.user set to their EmployeeDetails _id, not a UserDetails _id —
    // populating against UserDetails silently fails to find that
    // document, `department` comes back empty, and the employee's tasks
    // get mis-bucketed into "Others" regardless of their real department.
    // Instead we fetch the raw tasks, then resolve each `user` id against
    // *both* collections below.
    const tasks = await Task.find(filter).sort({ date: -1 }).lean();

    const userIds = [...new Set(tasks.map((t) => String(t.user)))];

    // Accounts that ARE real Users — pull department off their linked
    // Employee record.
    const users = await User.find({ _id: { $in: userIds } })
      .select("name email linkedEmployeeId")
      .populate("linkedEmployeeId", "department")
      .lean();
    const infoById = {};
    users.forEach((u) => {
      infoById[String(u._id)] = {
        name: u.name,
        department: u.linkedEmployeeId?.department || "",
      };
    });

    // Any id NOT found above belongs to an employee-only account (direct
    // Employee Profile login) — look those up straight from the Employee
    // collection instead, where `department` lives directly on the doc.
    const remainingIds = userIds.filter((id) => !infoById[id]);
    if (remainingIds.length) {
      const employees = await Employee.find({ _id: { $in: remainingIds } })
        .select("name department")
        .lean();
      employees.forEach((e) => {
        infoById[String(e._id)] = {
          name: e.name,
          department: e.department || "",
        };
      });
    }

    // Group by date, then bucket each employee's task list under
    // operation / sales / it / others based on their department, with
    // "Payment: ..." items pulled out into their own column.
    const byDate = {};
    for (const task of tasks) {
      const date = task.date;
      if (!byDate[date]) {
        byDate[date] = { operation: [], sales: [], it: [], others: [], payment: [] };
      }

      const items = (task.items || []).filter((it) => it.text);
      const paymentItems = items.filter((it) => it.text.startsWith(PAYMENT_PREFIX));
      const regularItems = items.filter((it) => !it.text.startsWith(PAYMENT_PREFIX));

      const info = infoById[String(task.user)] || {};
      const employeeName = info.name || task.userName || "Unknown";
      const department = info.department || "";
      const key = resolveDepartmentKey(department);
      // Table only has fixed Operation/Sales/IT columns. Operation and
      // Business Development Executive are the same role, so the
      // "business_development" key is displayed under the Operation
      // column; any other department (unset/general) falls into Others.
      const bucket = key === "business_development" ? "operation" : ["operation", "sales", "it"].includes(key) ? key : "others";

      if (regularItems.length) {
        const itemTexts = regularItems.map((it) => it.text).join(", ");
        byDate[date][bucket].push(`${employeeName}: ${itemTexts}`);
      }

      if (paymentItems.length) {
        const paymentTexts = paymentItems.map((it) => it.text.replace(PAYMENT_PREFIX, "")).join(", ");
        byDate[date].payment.push(`${employeeName}: ${paymentTexts}`);
      }
    }

    const rows = Object.keys(byDate)
      .sort((a, b) => (a < b ? 1 : -1)) // newest date first
      .map((date, idx) => ({
        sno: idx + 1,
        date,
        operationTask: byDate[date].operation.join(" | "),
        salesTask: byDate[date].sales.join(" | "),
        itTask: byDate[date].it.join(" | "),
        others: byDate[date].others.join(" | "),
        payment: byDate[date].payment.join(" | "),
      }));

    return res.json({ success: true, rows });
  } catch (error) {
    console.error("getAdminTaskSummary error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  submitReport,
  getTodayReport,
  getChecklistOptions,
  getMyReports,
  getAllReports,
  getAdminTaskSummary,
};