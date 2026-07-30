const express =
require("express");

const router =
express.Router();

const protect =
require("../middlewares/authMiddleware");

const superAdmin =
require("../middlewares/superAdmin");

const upload =
require("../config/multer");

const {

  createReimbursement,
  getMyReimbursements,
  getAllReimbursements,
  approveReimbursement,
  rejectReimbursement,
  deleteReimbursement,

} = require(
  "../controllers/reimbursementController"
);


// ================= CREATE (with bill attachment) =================

router.post(
  "/",
  protect,
  upload.single("billAttachment"),
  createReimbursement
);


// ================= LIST MINE =================

router.get(
  "/my",
  protect,
  getMyReimbursements
);


// ================= LIST ALL (ADMIN) =================

router.get(
  "/all",
  protect,
  superAdmin,
  getAllReimbursements
);


// ================= APPROVE (ADMIN) =================

router.put(
  "/:id/approve",
  protect,
  superAdmin,
  approveReimbursement
);


// ================= REJECT (ADMIN) =================

router.put(
  "/:id/reject",
  protect,
  superAdmin,
  rejectReimbursement
);


// ================= DELETE =================

router.delete(
  "/:id",
  protect,
  deleteReimbursement
);


module.exports = router;