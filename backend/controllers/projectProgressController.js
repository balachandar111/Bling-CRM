const ProjectProgress = require("../models/projectProgressModel");
const User = require("../models/userModel");
const Employee = require("../models/employeeModel");

// ============================================================
// HELPERS
// ============================================================

// Sort weight so the project list can always be shown
// High -> Medium -> Low.
const PRIORITY_WEIGHT = { high: 1, medium: 2, low: 3 };

// Same "is this department IT" resolution used by taskController, so
// the IT-department filter stays consistent across the app.
const isItDepartment = (department) => {
  const d = String(department || "").trim().toLowerCase();
  return (
    d === "it" ||
    d.startsWith("it ") ||
    d.startsWith("tech") ||
    d.includes("information technology")
  );
};

// The system only has two real roles ("super_admin" / "user"), so
// there is no separate "admin" role to filter on. "Admin Users" is
// therefore resolved from the linked employee's *designation* text
// (e.g. "Admin", "Administrator", "HR Admin") instead of role, giving
// a distinct, meaningful group from "Super Admin" (role-based).
const isAdminDesignation = (designation) => {
  const d = String(designation || "").trim().toLowerCase();
  return d.includes("admin");
};

const userSummary = (e) => ({
  _id: e._id,
  name: e.name,
  email: e.email,
  department: e.department || "",
  designation: e.designation || "",
});

const populateProject = (query) =>
  query
    .populate("poc", "name email department designation")
    .populate("responsiblePersons", "name email department designation")
    .populate("history.updatedBy", "name email")
    .populate("createdBy", "name email");

// ============================================================
// GET EMPLOYEES GROUPED FOR THE POC / RESPONSIBLE-PERSON PICKERS
// Source is the full Employees list (every employee — whether or not
// they also have a User login account), NOT just User accounts, so
// nobody is missing from the picker.
// Groups: all, it (IT department), superAdmin, adminUsers
// ============================================================
const getEligibleUsers = async (req, res) => {
  try {
    const employees = await Employee.find({ isActive: { $ne: false } })
      .select("name email department designation")
      .sort({ name: 1 })
      .lean();

    // Cross-reference against Users with role "super_admin" (via
    // their linkedEmployeeId) so the Employee-sourced list can still
    // be split into a "Super Admin" group.
    const superAdminUsers = await User.find({ role: "super_admin" })
      .select("linkedEmployeeId")
      .lean();
    const superAdminEmployeeIds = new Set(
      superAdminUsers
        .map((u) => u.linkedEmployeeId && String(u.linkedEmployeeId))
        .filter(Boolean)
    );

    const all = employees.map(userSummary);
    const it = all.filter((e) => isItDepartment(e.department));
    const superAdmin = all.filter((e) => superAdminEmployeeIds.has(String(e._id)));
    const adminUsers = all.filter(
      (e) =>
        !superAdminEmployeeIds.has(String(e._id)) &&
        isAdminDesignation(e.designation)
    );

    return res.json({
      success: true,
      groups: { all, it, superAdmin, adminUsers },
    });
  } catch (error) {
    console.error("getEligibleUsers error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// CREATE PROJECT (admin & user)
// Body: { projectName, priority, poc: [ids], responsiblePersons: [ids],
//         initialStatus? }
// ============================================================
const createProject = async (req, res) => {
  try {
    const { projectName, priority, poc, responsiblePersons, initialStatus } =
      req.body;

    if (!projectName || !String(projectName).trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Project name is required." });
    }

    const history = [];
    const status = String(initialStatus || "").trim();
    if (status) {
      history.push({
        description: status,
        updatedBy: req.user._id,
        updatedByName: req.user.name,
        updatedAt: new Date(),
      });
    }

    const project = await ProjectProgress.create({
      projectName: String(projectName).trim(),
      priority: ["high", "medium", "low"].includes(priority)
        ? priority
        : "medium",
      poc: Array.isArray(poc) ? poc : [],
      responsiblePersons: Array.isArray(responsiblePersons)
        ? responsiblePersons
        : [],
      currentStatusDescription: status,
      history,
      createdBy: req.user._id,
      createdByName: req.user.name,
    });

    const populated = await populateProject(
      ProjectProgress.findById(project._id)
    );

    return res.status(201).json({ success: true, project: populated });
  } catch (error) {
    console.error("createProject error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// GET ALL PROJECTS (list view) — sorted by priority (High -> Low),
// then by most recently updated within the same priority.
// ============================================================
const getAllProjects = async (req, res) => {
  try {
    const projects = await populateProject(
      ProjectProgress.find()
    ).lean();

    projects.sort((a, b) => {
      const pw = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
      if (pw !== 0) return pw;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

    const rows = projects.map((p, idx) => ({
      sno: idx + 1,
      _id: p._id,
      projectName: p.projectName,
      priority: p.priority,
      currentStatusDescription: p.currentStatusDescription,
      poc: p.poc,
      responsiblePersons: p.responsiblePersons,
      updatedAt: p.updatedAt,
      historyCount: (p.history || []).length,
    }));

    return res.json({ success: true, projects: rows });
  } catch (error) {
    console.error("getAllProjects error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// GET SINGLE PROJECT — full details incl. entire history, for the
// "view overall details" modal + "Manage History" modal.
// ============================================================
const getProjectById = async (req, res) => {
  try {
    const project = await populateProject(
      ProjectProgress.findById(req.params.id)
    );

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found." });
    }

    // Newest-first for display convenience.
    const sortedHistory = [...project.history].sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    );

    return res.json({
      success: true,
      project: {
        ...project.toObject(),
        history: sortedHistory,
      },
    });
  } catch (error) {
    console.error("getProjectById error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// UPDATE PROJECT DETAILS (admin & user)
// Body: { projectName?, priority?, poc?: [ids], responsiblePersons?: [ids] }
// ============================================================
const updateProjectDetails = async (req, res) => {
  try {
    const project = await ProjectProgress.findById(req.params.id);

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found." });
    }

    const { projectName, priority, poc, responsiblePersons } = req.body;

    if (projectName && String(projectName).trim()) {
      project.projectName = String(projectName).trim();
    }

    if (["high", "medium", "low"].includes(priority)) {
      project.priority = priority;
    }

    if (Array.isArray(poc)) {
      project.poc = poc;
    }

    if (Array.isArray(responsiblePersons)) {
      project.responsiblePersons = responsiblePersons;
    }

    await project.save();

    const populated = await populateProject(
      ProjectProgress.findById(project._id)
    );

    return res.json({ success: true, project: populated });
  } catch (error) {
    console.error("updateProjectDetails error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ADD A PROGRESS / STATUS UPDATE (admin & user)
// Body: { description }
// Appends to `history` and refreshes `currentStatusDescription`.
// ============================================================
const addProgressUpdate = async (req, res) => {
  try {
    const { description } = req.body;

    if (!description || !String(description).trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Status description is required." });
    }

    const project = await ProjectProgress.findById(req.params.id);

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found." });
    }

    const entry = {
      description: String(description).trim(),
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      updatedAt: new Date(),
    };

    project.history.push(entry);
    project.currentStatusDescription = entry.description;

    await project.save();

    const populated = await populateProject(
      ProjectProgress.findById(project._id)
    );

    return res.json({ success: true, project: populated });
  } catch (error) {
    console.error("addProgressUpdate error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// DELETE PROJECT (super admin only)
// ============================================================
const deleteProject = async (req, res) => {
  try {
    await ProjectProgress.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: "Project deleted." });
  } catch (error) {
    console.error("deleteProject error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getEligibleUsers,
  createProject,
  getAllProjects,
  getProjectById,
  updateProjectDetails,
  addProgressUpdate,
  deleteProject,
};