const express = require("express");
const router = express.Router();

const protect = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const {
  migrateEmployees,
  getUsers,
  updateUser,
  updateUserRole,
  deleteUser,
} = require("../controllers/userController");

// ================= MIGRATE: LINK EXISTING USERS -> EMPLOYEES =================
// MUST be declared BEFORE /:id routes to avoid wildcard conflict.
router.post(
  "/migrate-employees",
  protect,
  roleMiddleware("super_admin"),
  migrateEmployees
);

// ================= GET USERS =================
router.get(
  "/",
  protect,
  roleMiddleware("super_admin"),
  getUsers
);

// ================= UPDATE USER =================
router.put(
  "/:id",
  protect,
  roleMiddleware("super_admin"),
  updateUser
);

// ================= UPDATE ROLE =================
router.put(
  "/:id/role",
  protect,
  roleMiddleware("super_admin"),
  updateUserRole
);

// ================= DELETE USER =================
router.delete(
  "/:id",
  protect,
  roleMiddleware("super_admin"),
  deleteUser
);

module.exports = router;