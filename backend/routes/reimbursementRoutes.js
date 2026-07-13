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


// ================= DELETE =================

router.delete(
  "/:id",
  protect,
  deleteReimbursement
);


module.exports = router;