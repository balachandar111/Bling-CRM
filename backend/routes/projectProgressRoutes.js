const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const superAdmin = require("../middlewares/superAdmin");

const {
  getEligibleUsers,
  createProject,
  getAllProjects,
  getProjectById,
  updateProjectDetails,
  addProgressUpdate,
  deleteProject,
} = require("../controllers/projectProgressController");

// ── Both admin (super_admin) & user, any logged-in account ──────
// Users for the POC / Responsible Person pickers, grouped by
// All Users / IT Department / Super Admin / Admin Users.
router.get("/users/eligible", authMiddleware, getEligibleUsers);

// List all projects (sorted by priority: High -> Medium -> Low)
router.get("/", authMiddleware, getAllProjects);

// Add a new project
router.post("/", authMiddleware, createProject);

// Full details of one project (for "view overall details")
router.get("/:id", authMiddleware, getProjectById);

// Update project details: name, POC, responsible person(s), priority
router.put("/:id", authMiddleware, updateProjectDetails);

// Add a progress/status update (kept in history + shown as current status)
router.post("/:id/progress", authMiddleware, addProgressUpdate);

// ── Super admin only ─────────────────────────────────────────────
router.delete("/:id", authMiddleware, superAdmin, deleteProject);

module.exports = router;