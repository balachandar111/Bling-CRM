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
  updateReimbursement,
  deleteReimbursement,

} = require(
  "../controllers/reimbursementController"
);


// Max number of bills/receipts an employee can attach to one claim
const MAX_BILL_ATTACHMENTS = 10;


// ================= CREATE (with multiple bill attachments) =================

router.post(
  "/",
  protect,
  upload.array("billAttachments", MAX_BILL_ATTACHMENTS),
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


// ================= UPDATE (with optional new bill attachments) =================

router.put(
  "/:id",
  protect,
  upload.array("billAttachments", MAX_BILL_ATTACHMENTS),
  updateReimbursement
);


// ================= DELETE =================

router.delete(
  "/:id",
  protect,
  deleteReimbursement
);


module.exports = router;