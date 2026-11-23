const express = require("express");
const router = express.Router();

const protect = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const {
  createLeadTrack,
  getLeadTracks,
  getLeadTrackById,
  updateLeadTrack,
  deleteLeadTrack,
  onboardLeadsToProduct,
  updateLeadStage,
  removeLeadFromProduct,
  getAdminLeadTrackReport,
  getAssignableUsers,
  updateLeadNotes,
  clearAllLeadTracks,
} = require("../controllers/leadTrackController");

// ================= ANALYTICS REPORT (ADMIN ONLY) =================
// MUST be defined BEFORE /:id route to prevent route collision
router.get(
  "/report/analytics",
  protect,
  roleMiddleware("super_admin"),
  getAdminLeadTrackReport
);

// ================= ASSIGNABLE USERS & EMPLOYEES (ADMIN ONLY) =================
router.get(
  "/assignable-users",
  protect,
  roleMiddleware("super_admin"),
  getAssignableUsers
);

// ================= CLEAR ALL TRACKS (ADMIN ONLY) =================
router.delete(
  "/clear-all",
  protect,
  roleMiddleware("super_admin"),
  clearAllLeadTracks
);

// ================= TRACKS CRUD =================
router.post(
  "/",
  protect,
  roleMiddleware("super_admin"),
  createLeadTrack
);

router.get(
  "/",
  protect,
  getLeadTracks
);

router.get(
  "/:id",
  protect,
  getLeadTrackById
);

router.put(
  "/:id",
  protect,
  roleMiddleware("super_admin"),
  updateLeadTrack
);

router.delete(
  "/:id",
  protect,
  roleMiddleware("super_admin"),
  deleteLeadTrack
);

// ================= LEAD ONBOARDING & PIPELINE ACTIONS =================
router.post(
  "/:id/products/:productId/onboard",
  protect,
  onboardLeadsToProduct
);

router.patch(
  "/:id/products/:productId/leads/:leadId/stage",
  protect,
  updateLeadStage
);

router.patch(
  "/:id/products/:productId/leads/:leadId/notes",
  protect,
  updateLeadNotes
);

router.delete(
  "/:id/products/:productId/leads/:leadId",
  protect,
  removeLeadFromProduct
);

module.exports = router;

