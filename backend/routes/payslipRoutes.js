const express = require("express");
const router = express.Router();

const protect = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const {
  generatePayslip,
  sendPayslip,
  getGeneratedPayslips,
} = require("../controllers/payslipController");

// ================= GENERATE PAYSLIP =================
router.post(
  "/employee/:employeeId/generate",
  protect,
  roleMiddleware("super_admin"),
  generatePayslip
);

// ================= LIST GENERATED PAYSLIPS (admin) =================
router.get(
  "/employee/:employeeId",
  protect,
  roleMiddleware("super_admin"),
  getGeneratedPayslips
);

// ================= SEND PAYSLIP TO EMPLOYEE =================
router.put(
  "/employee/:employeeId/:payslipId/send",
  protect,
  roleMiddleware("super_admin"),
  sendPayslip
);

module.exports = router;