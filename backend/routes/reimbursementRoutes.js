const express =
require("express");

const router =
express.Router();

const protect =
require("../middlewares/authMiddleware");

const upload =
require("../config/multer");

const {

  createReimbursement,
  getMyReimbursements,
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


// ================= DELETE =================

router.delete(
  "/:id",
  protect,
  deleteReimbursement
);


module.exports = router;