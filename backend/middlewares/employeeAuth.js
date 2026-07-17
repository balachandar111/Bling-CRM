const jwt =
require("jsonwebtoken");

const Employee =
require("../models/employeeModel");


// ================= EMPLOYEE AUTH =================

const employeeAuth =
async (req, res, next) => {

  try {

    const authHeader =
      req.headers.authorization;

    if (!authHeader) {

      return res.status(401).json({

        success: false,

        message:
        "No token provided",
      });
    }


    const token =
      authHeader.split(" ")[1];

    const decoded =
      jwt.verify(

        token,

        process.env.JWT_SECRET
      );


    // ================= DEACTIVATION CHECK =================
    // Blocks access immediately once a resignation has been approved,
    // even if the employee still has a valid (unexpired) token.
    const employee =
      await Employee.findById(
        decoded.id
      ).select("isActive");

    if (!employee) {

      return res.status(401).json({

        success: false,

        message:
        "Employee not found",
      });
    }

    if (employee.isActive === false) {

      return res.status(403).json({

        success: false,

        message:
        "Your access has been deactivated as your resignation was approved.",
      });
    }


    req.employee = {

      id: decoded.id,
    };

    next();

  } catch (error) {

    res.status(401).json({

      success: false,

      message:
      "Invalid token",
    });
  }
};

module.exports =
employeeAuth;