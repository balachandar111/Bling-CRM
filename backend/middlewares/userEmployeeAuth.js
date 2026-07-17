// userEmployeeAuth.js
// Works like authMiddleware but additionally resolves the user's
// linkedEmployeeId and injects it as req.employee.id so that
// existing attendance controller functions (which read req.employee.id)
// work transparently for user accounts.

const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Employee = require("../models/employeeModel");

const userEmployeeAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found.",
        });
      }

      if (!user.linkedEmployeeId) {
        return res.status(403).json({
          success: false,
          message:
            "No employee record linked to this user account. Please contact admin.",
        });
      }

      // ================= DEACTIVATION CHECK =================
      // Blocks access immediately once the linked employee's resignation
      // has been approved, even if the user's token is still valid.
      const linkedEmployee = await Employee.findById(
        user.linkedEmployeeId
      ).select("isActive");

      if (linkedEmployee && linkedEmployee.isActive === false) {
        return res.status(403).json({
          success: false,
          message:
            "Your access has been deactivated as your resignation was approved.",
        });
      }

      req.user = user;

      // Mimic the shape that employeeAuth sets so existing controllers work
      req.employee = { id: user.linkedEmployeeId.toString() };

      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: "No token provided.",
    });
  }
};

module.exports = userEmployeeAuth;