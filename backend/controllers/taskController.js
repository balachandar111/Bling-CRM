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
    const { items, date: requestedDate } = req.body;

    // Optional `date` (YYYY-MM-DD) lets an employee edit a PREVIOUS day's
    // task list (not just today's), e.g. from the task calendar's "Edit"
    // button. Defaults to today when not provided, keeping old callers
    // working unchanged. Future dates are rejected.
    let date = today;
    if (requestedDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format. Expected YYYY-MM-DD.",
        });
      }
      if (requestedDate > today) {
        return res.status(400).json({
          success: false,
          message: "Cannot submit a task list for a future date.",
        });
      }
      date = requestedDate;
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please add at least one task before submitting.",
      });
    }

    const checklist = getChecklistForUser(req.user);
    const department = checklist.department || "";
    const departmentKey = checklist.departmentKey || "general";

    // Sanitize: trim text/note, force completed to boolean, preserve admin fields if present
    const cleanItems = items
      .map((it) => ({
        text: String(it?.text || "").trim(),
        note: String(it?.note || "").trim(),
        completed: !!it?.completed,
        adminCompleted: !!it?.adminCompleted,
        adminPending: !!it?.adminPending,
        adminRemark: String(it?.adminRemark || "").trim(),
        pendingReason: String(it?.pendingReason || "").trim(),
        isRolledOver: !!it?.isRolledOver,
        rolledOverFromDate: String(it?.rolledOverFromDate || "").trim(),
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
      .map((it) => `${it.completed || it.adminCompleted ? "[x]" : "[ ]"} ${it.text}${it.note ? ` — ${it.note}` : ""}`)
      .join("\n");

    const task = await Task.findOneAndUpdate(
      { user: userId, date },
      {
        user: userId,
        userName,
        department,
        departmentKey,
        date,
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

    // Fetch unresolved pending tasks from previous days
    const pastTasks = await Task.find({
      user: userId,
      date: { $lt: today },
    })
      .sort({ date: -1 })
      .limit(5)
      .lean();

    const pendingFromPast = [];
    pastTasks.forEach((pt) => {
      (pt.items || []).forEach((it) => {
        if (!it.completed && !it.adminCompleted) {
          pendingFromPast.push({
            originalDate: pt.date,
            text: it.text,
            note: it.note || "",
            adminRemark: it.adminRemark || "",
            adminPending: !!it.adminPending,
          });
        }
      });
    });

    return res.json({
      success: true,
      today,
      task: task || null,
      department: checklist.department,
      departmentKey: checklist.departmentKey,
      presets: checklist.presets,
      showPayment: checklist.showPayment,
      paymentStatuses: checklist.paymentStatuses,
      pendingFromPast,
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

// Resolve a bucket of Task.user ids into { name, department } info,
// covering BOTH login paths:
//  - normal Users (linked to an Employee via linkedEmployeeId)
//  - direct "Employee Profile" logins, where Task.user IS the
//    Employee _id (no linked User record involved at all)
// Populating against UserDetails alone silently misses the second
// case and leaves `department` empty, so we resolve against both
// collections and merge the results.
const resolveEmployeeInfoByUserIds = async (userIds) => {
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

  return infoById;
};

// Table only has fixed Operation/Sales/IT columns. Operation and
// Business Development Executive are the same role, so the
// "business_development" key is displayed under the Operation
// column; any other department (unset/general) falls into Others.
const bucketForDepartmentKey = (key) =>
  key === "business_development" ? "operation" : ["operation", "sales", "it"].includes(key) ? key : "others";

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
    const infoById = await resolveEmployeeInfoByUserIds(userIds);

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
      // Table only has fixed Operation/Sales/IT columns; Operation and
      // Business Development share the Operation column (see helper above).
      const bucket = bucketForDepartmentKey(key);

      if (regularItems.length) {
        const itemTexts = regularItems
          .map((it) => (it.note ? `${it.text} (${it.note})` : it.text))
          .join(", ");
        byDate[date][bucket].push(`${employeeName}: ${itemTexts}`);
      }

      if (paymentItems.length) {
        const paymentTexts = paymentItems
          .map((it) => {
            const status = it.text.replace(PAYMENT_PREFIX, "");
            return it.note ? `${status} (${it.note})` : status;
          })
          .join(", ");
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

// ============================================================
// SUPER ADMIN: GET TODAY'S TASKS, STRUCTURED BY CATEGORY
// Powers the "Today" quick filter — Operation / Sales / IT / Others /
// Payment — where picking a category opens a popup with every
// employee's task updates for today in that category, item by item
// (including completed status and notes), rather than the flattened
// joined-text cells used by the date-range summary table above.
// ============================================================
const getTodayCategorySummary = async (req, res) => {
  try {
    const today = getTodayIST();

    const tasks = await Task.find({ date: today }).lean();
    const userIds = [...new Set(tasks.map((t) => String(t.user)))];
    const infoById = await resolveEmployeeInfoByUserIds(userIds);

    const buckets = { operation: [], sales: [], it: [], others: [], payment: [] };

    for (const task of tasks) {
      const items = (task.items || []).filter((it) => it.text);
      const paymentItems = items.filter((it) => it.text.startsWith(PAYMENT_PREFIX));
      const regularItems = items.filter((it) => !it.text.startsWith(PAYMENT_PREFIX));

      const info = infoById[String(task.user)] || {};
      const employeeName = info.name || task.userName || "Unknown";
      const department = info.department || "";
      const bucket = bucketForDepartmentKey(resolveDepartmentKey(department));

      if (regularItems.length) {
        buckets[bucket].push({
          employeeName,
          items: regularItems.map((it) => ({
            text: it.text,
            note: it.note || "",
            completed: !!it.completed,
          })),
        });
      }

      if (paymentItems.length) {
        buckets.payment.push({
          employeeName,
          items: paymentItems.map((it) => ({
            text: it.text.replace(PAYMENT_PREFIX, ""),
            note: it.note || "",
            completed: !!it.completed,
          })),
        });
      }
    }

    return res.json({ success: true, date: today, buckets });
  } catch (error) {
    console.error("getTodayCategorySummary error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// SUPER ADMIN: GET DEPARTMENT CARDS OVERVIEW (for Today / Selected Date)
// Returns cards: IT, Sales, Operation & Business Development, General
// Metrics per department:
//  - employeeCount
//  - updatedTodayCount (how many submitted tasks)
//  - totalTasksCount
//  - completedCount
//  - notCompletedCount
//  - employees: list of employees with their todo items & status
// ============================================================
const getDepartmentOverview = async (req, res) => {
  try {
    const { date: requestedDate } = req.query;
    const date = requestedDate || getTodayIST();

    // 1. Fetch all active employees
    const employees = await Employee.find({ isActive: { $ne: false } })
      .select("name email department designation isUserLinked")
      .lean();

    // 2. Fetch tasks for this date
    const tasks = await Task.find({ date }).lean();
    const userIds = [...new Set(tasks.map((t) => String(t.user)))];
    const infoById = await resolveEmployeeInfoByUserIds(userIds);

    // Map tasks by user string
    const taskByUser = new Map();
    tasks.forEach((t) => {
      taskByUser.set(String(t.user), t);
    });

    const DEPARTMENTS = [
      { key: "it", name: "IT & Technology", icon: "💻", color: "#2563eb", bg: "#eff6ff" },
      { key: "sales", name: "Sales & Marketing", icon: "📈", color: "#10b981", bg: "#ecfdf5" },
      {
        key: "business_development",
        name: "Operation & Business Development",
        icon: "⚙️",
        color: "#9333ea",
        bg: "#faf5ff",
      },
      { key: "general", name: "General / Administration", icon: "🏢", color: "#64748b", bg: "#f8fafc" },
    ];

    const deptMap = {};
    DEPARTMENTS.forEach((d) => {
      deptMap[d.key] = {
        key: d.key,
        name: d.name,
        icon: d.icon,
        color: d.color,
        bg: d.bg,
        employeeCount: 0,
        updatedTodayCount: 0,
        totalTasksCount: 0,
        completedCount: 0,
        notCompletedCount: 0,
        employees: [],
      };
    });

    // Match each active employee to a department
    for (const emp of employees) {
      const dKey = resolveDepartmentKey(emp.department);
      const dept = deptMap[dKey] || deptMap.general;
      dept.employeeCount += 1;

      // Find if this employee submitted a task (either matching employee _id or via linked User)
      let empTask = taskByUser.get(String(emp._id));
      if (!empTask) {
        for (const t of tasks) {
          const uInfo = infoById[String(t.user)];
          if (
            (t.userName && t.userName.toLowerCase() === emp.name.toLowerCase()) ||
            (uInfo && uInfo.email && emp.email && uInfo.email.toLowerCase() === emp.email.toLowerCase())
          ) {
            empTask = t;
            break;
          }
        }
      }

      const items = (empTask?.items || []).filter((it) => it.text);
      const completedItems = items.filter((it) => it.completed || it.adminCompleted);
      const incompleteItems = items.filter((it) => !it.completed && !it.adminCompleted);

      if (empTask) {
        dept.updatedTodayCount += 1;
        dept.totalTasksCount += items.length;
        dept.completedCount += completedItems.length;
        dept.notCompletedCount += incompleteItems.length;
      }

      dept.employees.push({
        employeeId: emp._id,
        name: emp.name,
        email: emp.email,
        designation: emp.designation || "Employee",
        department: emp.department || dept.name,
        submitted: !!empTask,
        taskId: empTask?._id || null,
        adminReviewed: !!empTask?.adminReviewed,
        adminReviewedAt: empTask?.adminReviewedAt || null,
        items: items.map((it, idx) => ({
          _id: it._id ? String(it._id) : `idx_${idx}`,
          index: idx,
          text: it.text,
          note: it.note || "",
          completed: !!it.completed,
          adminCompleted: !!it.adminCompleted,
          adminPending: !!it.adminPending,
          adminRemark: it.adminRemark || "",
          pendingReason: it.pendingReason || "",
        })),
        completedCount: completedItems.length,
        incompleteCount: incompleteItems.length,
        updatedAt: empTask?.updatedAt || null,
      });
    }

    // Also include any tasks whose user wasn't in the Employee list
    const handledTaskIds = new Set(
      Object.values(deptMap).flatMap((d) =>
        d.employees.map((e) => (e.taskId ? String(e.taskId) : null)).filter(Boolean)
      )
    );

    for (const t of tasks) {
      if (!handledTaskIds.has(String(t._id))) {
        const uInfo = infoById[String(t.user)] || {};
        const dKey = resolveDepartmentKey(uInfo.department || t.department);
        const dept = deptMap[dKey] || deptMap.general;

        const items = (t.items || []).filter((it) => it.text);
        const completedItems = items.filter((it) => it.completed || it.adminCompleted);
        const incompleteItems = items.filter((it) => !it.completed && !it.adminCompleted);

        dept.updatedTodayCount += 1;
        dept.totalTasksCount += items.length;
        dept.completedCount += completedItems.length;
        dept.notCompletedCount += incompleteItems.length;

        dept.employees.push({
          employeeId: t.user,
          name: uInfo.name || t.userName || "User",
          email: uInfo.email || "",
          designation: uInfo.designation || "User",
          department: uInfo.department || t.department || dept.name,
          submitted: true,
          taskId: t._id,
          adminReviewed: !!t.adminReviewed,
          adminReviewedAt: t.adminReviewedAt || null,
          items: items.map((it, idx) => ({
            _id: it._id ? String(it._id) : `idx_${idx}`,
            index: idx,
            text: it.text,
            note: it.note || "",
            completed: !!it.completed,
            adminCompleted: !!it.adminCompleted,
            adminPending: !!it.adminPending,
            adminRemark: it.adminRemark || "",
            pendingReason: it.pendingReason || "",
          })),
          completedCount: completedItems.length,
          incompleteCount: incompleteItems.length,
          updatedAt: t.updatedAt,
        });
      }
    }

    return res.json({
      success: true,
      date,
      departments: Object.values(deptMap),
    });
  } catch (error) {
    console.error("getDepartmentOverview error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// SUPER ADMIN: REVIEW & MARK TASK ITEMS AS COMPLETED / PENDING
// ============================================================
const adminReviewTask = async (req, res) => {
  try {
    const { taskId, completedItemIds, pendingItemIds, pendingRemark } = req.body;

    if (!taskId) {
      return res.status(400).json({ success: false, message: "taskId is required" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const infoById = await resolveEmployeeInfoByUserIds([String(task.user)]);
    const empInfo = infoById[String(task.user)] || {};
    const empName = empInfo.name || task.userName || "Team Member";
    const empEmail = empInfo.email || "";

    const completedSet = new Set((completedItemIds || []).map(String));
    const pendingSet = new Set((pendingItemIds || []).map(String));

    const movedToPendingItems = [];

    task.items.forEach((it, idx) => {
      const itId = it._id ? String(it._id) : `idx_${idx}`;
      const isCompleted =
        completedSet.has(itId) ||
        completedSet.has(String(idx)) ||
        (it._id && completedSet.has(String(it._id)));
      const isExplicitPending =
        pendingSet.has(itId) ||
        pendingSet.has(String(idx)) ||
        (it._id && pendingSet.has(String(it._id)));

      if (isCompleted) {
        it.completed = true;
        it.adminCompleted = true;
        it.adminPending = false;
      } else if (isExplicitPending || (!isCompleted && pendingItemIds !== undefined)) {
        it.completed = false;
        it.adminCompleted = false;
        it.adminPending = true;
        it.adminRemark = pendingRemark || "Task marked incomplete by Admin; moved to pending for tomorrow.";
        it.isRolledOver = true;
        it.rolledOverFromDate = task.date;
        movedToPendingItems.push(it);
      }
    });

    task.report = task.items
      .map((it) => `${it.completed || it.adminCompleted ? "[x]" : "[ ]"} ${it.text}${it.note ? ` — ${it.note}` : ""}`)
      .join("\n");

    task.adminReviewed = true;
    task.adminReviewedAt = new Date();
    task.adminReviewedBy = req.user._id;

    await task.save();

    // Send email notification to user if any items moved to pending
    if (movedToPendingItems.length > 0 && empEmail) {
      const { sendMail } = require("../utils/mailer");
      const crmLoginUrl = process.env.CRM_URL || "https://crm.blingtechconnect.com/login";

      const mailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: #e11d48; padding: 20px 24px; color: #ffffff;">
            <h2 style="margin: 0 0 4px 0; font-size: 18px;">⚠️ Task Review Notice - Moved to Pending</h2>
            <p style="margin: 0; font-size: 13px; opacity: 0.9;">Bling CRM Daily Task Review • ${task.date}</p>
          </div>
          <div style="padding: 24px;">
            <p style="font-size: 14px; color: #1e293b; margin: 0 0 16px 0;">
              Hi <strong>${empName}</strong>,
            </p>
            <p style="font-size: 14px; color: #475569; margin: 0 0 16px 0; line-height: 1.5;">
              During review, <strong>${movedToPendingItems.length}</strong> of your tasks were marked as not completed and moved to your <strong>Pending Tasks for tomorrow</strong>:
            </p>
            <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
              <ul style="margin: 0; padding-left: 20px; color: #9f1239; font-size: 13px;">
                ${movedToPendingItems
                  .map(
                    (it) => `
                  <li style="margin-bottom: 8px;">
                    <strong>${it.text}</strong>
                    ${it.note ? `<div style="color: #64748b; font-size: 12px;">Your note: ${it.note}</div>` : ""}
                    ${it.adminRemark ? `<div style="color: #b91c1c; font-size: 12px; font-weight: 600;">Admin Note: ${it.adminRemark}</div>` : ""}
                  </li>
                `
                  )
                  .join("")}
              </ul>
            </div>
            <p style="font-size: 13px; color: #64748b; margin: 0 0 20px 0;">
              Please view this pending task in tomorrow's task section. If you encounter any problems, please add a note explaining why this task is pending.
            </p>
            <div style="text-align: center;">
              <a href="${crmLoginUrl}" style="background: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-weight: 700; font-size: 13px; display: inline-block;">
                Open Bling CRM →
              </a>
            </div>
          </div>
        </div>
      `;

      try {
        await sendMail({
          to: empEmail,
          subject: `Task Review Notice: Incomplete tasks moved to pending (${task.date}) - Bling CRM`,
          html: mailHtml,
        });
      } catch (err) {
        console.error(`[adminReviewTask] Failed to send email to ${empEmail}:`, err.message);
      }
    }

    return res.json({
      success: true,
      message: "Tasks reviewed and updated successfully",
      task,
    });
  } catch (error) {
    console.error("adminReviewTask error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// SUPER ADMIN: MANUALLY TRIGGER 6:30 PM DAILY TASK EMAILS
// ============================================================
const triggerDailyReminders = async (req, res) => {
  try {
    const { sendDailyTaskRemindersAndReports } = require("../utils/taskScheduler");
    const result = await sendDailyTaskRemindersAndReports(req.body?.date || null);
    return res.json({
      success: true,
      message: `Daily 6:30 PM task emails processed successfully. Sent report to director (${result.directorEmail}) and reminders to ${result.userNotifiedCount} employees with incomplete tasks.`,
      result,
    });
  } catch (error) {
    console.error("triggerDailyReminders error:", error);
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
  getTodayCategorySummary,
  getDepartmentOverview,
  adminReviewTask,
  triggerDailyReminders,
};
