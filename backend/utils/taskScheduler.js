// 📁 backend/utils/taskScheduler.js
const cron = require("node-cron");
const Task = require("../models/taskModel");
const Employee = require("../models/employeeModel");
const User = require("../models/userModel");
const { sendMail } = require("./mailer");

// Helper: today in IST (YYYY-MM-DD)
const getTodayIST = () => {
  const now = new Date();
  const istDate = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return istDate.toISOString().slice(0, 10);
};

// Department resolver helper
const resolveDepartmentKey = (department) => {
  const d = String(department || "").trim().toLowerCase();
  if (d.includes("business development")) return "business_development";
  if (d.startsWith("oper")) return "business_development";
  if (d.startsWith("sale")) return "sales";
  if (
    d === "it" ||
    d.startsWith("it ") ||
    d.startsWith("tech") ||
    d.includes("information technology") ||
    d.includes("testing")
  ) {
    return "it";
  }
  return "general";
};

// Resolve user / employee info
const resolveEmployeeInfoByUserIds = async (userIds) => {
  const users = await User.find({ _id: { $in: userIds } })
    .select("name email linkedEmployeeId")
    .populate("linkedEmployeeId", "department email name designation")
    .lean();
  const infoById = {};
  users.forEach((u) => {
    infoById[String(u._id)] = {
      name: u.name,
      email: u.email || u.linkedEmployeeId?.email || "",
      department: u.linkedEmployeeId?.department || "",
      designation: u.linkedEmployeeId?.designation || "User",
    };
  });

  const remainingIds = userIds.filter((id) => !infoById[id]);
  if (remainingIds.length) {
    const employees = await Employee.find({ _id: { $in: remainingIds } })
      .select("name email department designation")
      .lean();
    employees.forEach((e) => {
      infoById[String(e._id)] = {
        name: e.name,
        email: e.email || "",
        department: e.department || "",
        designation: e.designation || "Employee",
      };
    });
  }

  return infoById;
};

// ============================================================
// MAIN FUNCTION: SEND DAILY 6:30 PM TASK EMAILS
// 1. Sends summary mail to director@blingreward.com
// 2. Sends status update reminder to users with incomplete tasks
// ============================================================
const sendDailyTaskRemindersAndReports = async (forcedDate = null) => {
  const today = forcedDate || getTodayIST();
  const crmLoginUrl =
    process.env.CRM_URL || "https://crm.blingtechconnect.com/login";

  console.log(`[TaskScheduler] Running 6:30 PM Daily Task Reminders for ${today}...`);

  try {
    // 1. Fetch all active employees
    const employees = await Employee.find({ isActive: { $ne: false } }).lean();

    // 2. Fetch today's tasks
    const tasks = await Task.find({ date: today }).lean();
    const userIds = [...new Set(tasks.map((t) => String(t.user)))];
    const infoById = await resolveEmployeeInfoByUserIds(userIds);

    // Group department stats
    const DEPARTMENTS = [
      { key: "it", name: "IT & Technology", icon: "💻", color: "#2563eb" },
      { key: "sales", name: "Sales & Marketing", icon: "📈", color: "#10b981" },
      {
        key: "business_development",
        name: "Operation & Business Development",
        icon: "⚙️",
        color: "#9333ea",
      },
      { key: "general", name: "General / Administration", icon: "🏢", color: "#64748b" },
    ];

    const deptMap = {};
    DEPARTMENTS.forEach((d) => {
      deptMap[d.key] = {
        key: d.key,
        name: d.name,
        icon: d.icon,
        color: d.color,
        employeeCount: 0,
        updatedTodayCount: 0,
        totalTasksCount: 0,
        completedCount: 0,
        notCompletedCount: 0,
        tasksList: [],
      };
    });

    // Count employees in departments
    employees.forEach((emp) => {
      const dKey = resolveDepartmentKey(emp.department);
      if (deptMap[dKey]) {
        deptMap[dKey].employeeCount += 1;
      } else {
        deptMap.general.employeeCount += 1;
      }
    });

    // Aggregate today's tasks
    const employeeIncompleteList = [];

    for (const task of tasks) {
      const info = infoById[String(task.user)] || {};
      const empName = info.name || task.userName || "Team Member";
      const empEmail = info.email || "";
      const empDept = info.department || task.department || "";
      const dKey = resolveDepartmentKey(empDept);

      const items = task.items || [];
      const completedItems = items.filter((it) => it.completed || it.adminCompleted);
      const incompleteItems = items.filter((it) => !it.completed && !it.adminCompleted);

      const deptTarget = deptMap[dKey] || deptMap.general;
      deptTarget.updatedTodayCount += 1;
      deptTarget.totalTasksCount += items.length;
      deptTarget.completedCount += completedItems.length;
      deptTarget.notCompletedCount += incompleteItems.length;

      deptTarget.tasksList.push({
        userName: empName,
        email: empEmail,
        department: empDept,
        total: items.length,
        completed: completedItems.length,
        incomplete: incompleteItems.length,
        items,
      });

      // If user has incomplete items, add to notification queue
      if (incompleteItems.length > 0 && empEmail) {
        employeeIncompleteList.push({
          userName: empName,
          email: empEmail,
          total: items.length,
          completed: completedItems.length,
          incompleteItems,
        });
      }
    }

    // ────────────────────────────────────────────────────────────
    // 3. SEND MAIL 1: TO DIRECTOR (director@blingreward.com)
    // ────────────────────────────────────────────────────────────
    const directorEmail =
      process.env.DIRECTOR_EMAIL || "director@blingreward.com";

    const totalAllTasks = Object.values(deptMap).reduce(
      (acc, d) => acc + d.totalTasksCount,
      0
    );
    const totalAllCompleted = Object.values(deptMap).reduce(
      (acc, d) => acc + d.completedCount,
      0
    );
    const totalAllPending = Object.values(deptMap).reduce(
      (acc, d) => acc + d.notCompletedCount,
      0
    );

    const directorHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 24px 30px; color: #ffffff;">
          <h1 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; letter-spacing: -0.3px;">
            📋 Today's Updated Tasks Review
          </h1>
          <p style="margin: 0; font-size: 14px; opacity: 0.9;">
            Date: <strong>${today}</strong> | Summary of Daily Employee Operations
          </p>
        </div>

        <div style="padding: 24px 30px;">
          <!-- Overall Metrics -->
          <div style="display: flex; gap: 12px; margin-bottom: 24px;">
            <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center;">
              <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Submitted Today</span>
              <div style="font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 4px;">${tasks.length}</div>
            </div>
            <div style="flex: 1; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: 12px; text-align: center;">
              <span style="font-size: 11px; font-weight: 700; color: #047857; text-transform: uppercase;">Completed Todos</span>
              <div style="font-size: 22px; font-weight: 800; color: #16a34a; margin-top: 4px;">${totalAllCompleted}</div>
            </div>
            <div style="flex: 1; background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 12px; text-align: center;">
              <span style="font-size: 11px; font-weight: 700; color: #b45309; text-transform: uppercase;">Incomplete / Pending</span>
              <div style="font-size: 22px; font-weight: 800; color: #d97706; margin-top: 4px;">${totalAllPending}</div>
            </div>
          </div>

          <!-- Department Breakdown Cards -->
          <h3 style="margin: 0 0 14px 0; font-size: 16px; color: #0f172a;">📊 Department Task Summary</h3>
          <div style="margin-bottom: 24px;">
            ${Object.values(deptMap)
              .map(
                (d) => `
                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-bottom: 10px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div style="font-weight: 700; color: #0f172a; font-size: 14px;">
                      ${d.icon} ${d.name} (${d.employeeCount} Employees)
                    </div>
                    <span style="font-size: 12px; background: #f1f5f9; padding: 2px 8px; border-radius: 6px; font-weight: 600; color: #475569;">
                      ${d.updatedTodayCount} Submitted Today
                    </span>
                  </div>
                  <div style="font-size: 13px; color: #475569;">
                    Completed: <strong style="color: #16a34a;">${d.completedCount}</strong> | 
                    Incomplete: <strong style="color: #d97706;">${d.notCompletedCount}</strong> | 
                    Total Tasks: <strong>${d.totalTasksCount}</strong>
                  </div>
                </div>
              `
              )
              .join("")}
          </div>

          <!-- Detailed Employee Tasks Table -->
          <h3 style="margin: 0 0 14px 0; font-size: 16px; color: #0f172a;">👥 Employee Task Details</h3>
          <div style="overflow-x: auto; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;">
              <thead>
                <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                  <th style="padding: 10px; color: #475569;">Employee</th>
                  <th style="padding: 10px; color: #475569;">Department</th>
                  <th style="padding: 10px; color: #475569;">Progress</th>
                  <th style="padding: 10px; color: #475569;">Today's Todo Items</th>
                </tr>
              </thead>
              <tbody>
                ${tasks
                  .map((task) => {
                    const info = infoById[String(task.user)] || {};
                    const empName = info.name || task.userName || "Team Member";
                    const empDept = info.department || task.department || "-";
                    const items = task.items || [];
                    const completed = items.filter(
                      (it) => it.completed || it.adminCompleted
                    ).length;

                    return `
                      <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 10px; font-weight: 600; color: #0f172a; vertical-align: top;">
                          ${empName}
                        </td>
                        <td style="padding: 10px; color: #64748b; vertical-align: top;">
                          ${empDept}
                        </td>
                        <td style="padding: 10px; vertical-align: top; white-space: nowrap;">
                          <span style="color: ${
                            completed === items.length && items.length > 0
                              ? "#16a34a"
                              : "#d97706"
                          }; font-weight: 700;">
                            ${completed} / ${items.length} Done
                          </span>
                        </td>
                        <td style="padding: 10px; vertical-align: top;">
                          <ul style="margin: 0; padding-left: 18px; color: #334155;">
                            ${items
                              .map(
                                (it) => `
                              <li style="margin-bottom: 4px; color: ${
                                it.completed || it.adminCompleted
                                  ? "#16a34a"
                                  : "#b45309"
                              }">
                                <strong>${it.text}</strong>
                                ${
                                  it.completed || it.adminCompleted
                                    ? "✓"
                                    : "(Incomplete)"
                                }
                                ${
                                  it.note
                                    ? `<div style="font-size: 11px; color: #64748b;">📝 ${it.note}</div>`
                                    : ""
                                }
                              </li>
                            `
                              )
                              .join("")}
                          </ul>
                        </td>
                      </tr>
                    `;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>

          <!-- Review CTA -->
          <div style="text-align: center; padding: 18px 0; border-top: 1px solid #e2e8f0;">
            <p style="font-size: 13px; color: #64748b; margin-bottom: 14px;">
              Please review, approve completed tasks, or manage pending rollovers in the Bling CRM portal:
            </p>
            <a href="${crmLoginUrl}" style="background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 10px rgba(37,99,235,0.3);">
              🚀 Review Tasks in Bling CRM
            </a>
          </div>
        </div>
      </div>
    `;

    try {
      await sendMail({
        to: directorEmail,
        subject: `Today's Updated Tasks - Please Review (${today}) - Bling CRM`,
        html: directorHtml,
      });
      console.log(`[TaskScheduler] Email sent successfully to director: ${directorEmail}`);
    } catch (dErr) {
      console.error(`[TaskScheduler] Failed to send email to director:`, dErr.message);
    }

    // ────────────────────────────────────────────────────────────
    // 4. SEND MAIL 2: TO USERS WITH INCOMPLETE TASKS
    // ────────────────────────────────────────────────────────────
    let userNotifiedCount = 0;

    for (const emp of employeeIncompleteList) {
      const userHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: #1e293b; padding: 20px 24px; color: #ffffff;">
            <h2 style="margin: 0 0 4px 0; font-size: 18px;">⚠️ Please Update Your Task Status</h2>
            <p style="margin: 0; font-size: 13px; opacity: 0.85;">Daily Task Completion Reminder • ${today}</p>
          </div>

          <div style="padding: 24px;">
            <p style="font-size: 14px; color: #1e293b; margin: 0 0 16px 0;">
              Hi <strong>${emp.userName}</strong>,
            </p>
            <p style="font-size: 14px; color: #475569; margin: 0 0 16px 0; line-height: 1.5;">
              You have <strong>${emp.incompleteItems.length}</strong> task(s) marked as not completed for today (${today}). Please update the task status or add a note/reason explaining the pending status before the day ends:
            </p>

            <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
              <ul style="margin: 0; padding-left: 20px; color: #b45309; font-size: 13px;">
                ${emp.incompleteItems
                  .map(
                    (it) => `
                  <li style="margin-bottom: 6px;">
                    <strong>${it.text}</strong>
                    ${
                      it.note
                        ? `<span style="color: #64748b;"> — Note: ${it.note}</span>`
                        : ""
                    }
                  </li>
                `
                  )
                  .join("")}
              </ul>
            </div>

            <div style="text-align: center; margin-top: 24px;">
              <a href="${crmLoginUrl}" style="background: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-weight: 700; font-size: 13px; display: inline-block;">
                Update Task Status in CRM →
              </a>
            </div>
          </div>
        </div>
      `;

      try {
        await sendMail({
          to: emp.email,
          subject: `Action Required: Please update your task status (${today}) - Bling CRM`,
          html: userHtml,
        });
        userNotifiedCount++;
        console.log(`[TaskScheduler] Reminder email sent to employee: ${emp.email}`);
      } catch (uErr) {
        console.error(
          `[TaskScheduler] Failed to send reminder email to ${emp.email}:`,
          uErr.message
        );
      }
    }

    return {
      success: true,
      today,
      directorEmailSent: true,
      directorEmail,
      userNotifiedCount,
      employeeIncompleteListCount: employeeIncompleteList.length,
      deptSummary: deptMap,
    };
  } catch (error) {
    console.error("[TaskScheduler] Error executing daily reminders:", error);
    throw error;
  }
};

// ============================================================
// INITIALIZE CRON SCHEDULER (Runs every day at 18:30 IST)
// ============================================================
const initTaskScheduler = () => {
  console.log("[TaskScheduler] Initializing 6:30 PM IST Daily Cron Scheduler...");

  // "30 18 * * *" runs at 18:30 (6:30 PM) every day
  cron.schedule(
    "30 18 * * *",
    async () => {
      console.log("[TaskScheduler] Triggering scheduled 6:30 PM IST task reminders...");
      try {
        await sendDailyTaskRemindersAndReports();
      } catch (err) {
        console.error("[TaskScheduler] Scheduled execution error:", err.message);
      }
    },
    {
      scheduled: true,
      timezone: "Asia/Kolkata",
    }
  );
};

module.exports = {
  sendDailyTaskRemindersAndReports,
  initTaskScheduler,
  getTodayIST,
  resolveDepartmentKey,
  resolveEmployeeInfoByUserIds,
};

