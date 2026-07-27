const jwt = require("jsonwebtoken");

const User = require("../models/userModel");
const Employee = require("../models/employeeModel");

const protect = async (req, res, next) => {
  let token;

  // CHECK TOKEN
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      if (!token) {
        console.error("[auth] Authorization header present but empty after 'Bearer'.");
        return res.status(401).json({ message: "No token provided" });
      }

      // VERIFY TOKEN
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (verifyErr) {
        // Distinguish *why* verification failed so it's obvious from the
        // server terminal instead of a bare 401 in the browser console.
        if (verifyErr.name === "TokenExpiredError") {
          console.error(
            `[auth] Token expired at ${verifyErr.expiredAt}. The user needs to log in again.`
          );
          return res.status(401).json({
            message: "Session expired, please log in again.",
            code: "TOKEN_EXPIRED",
          });
        }
        if (verifyErr.name === "JsonWebTokenError") {
          // Covers "invalid signature" (JWT_SECRET mismatch/rotated),
          // "jwt malformed" (garbage/corrupted token), etc.
          console.error(`[auth] Token verification failed: ${verifyErr.message}`);
          return res.status(401).json({
            message: "Invalid session, please log in again.",
            code: "TOKEN_INVALID",
          });
        }
        console.error(`[auth] Unexpected token verification error: ${verifyErr.message}`);
        return res.status(401).json({
          message: "Not authorized, token failed",
          code: "TOKEN_ERROR",
        });
      }

      if (!decoded || !decoded.id) {
        console.error("[auth] Token verified but has no 'id' claim:", decoded);
        return res.status(401).json({
          message: "Not authorized, malformed token.",
          code: "TOKEN_MALFORMED",
        });
      }

      // GET USER
      // Also populate the linked Employee's department so downstream
      // controllers (e.g. task checklist by department) can read
      // req.user.linkedEmployeeId.department without an extra query.
      try {
        req.user = await User.findById(decoded.id)
          .select("-password")
          .populate("linkedEmployeeId", "department name designation");
      } catch (lookupErr) {
        // Most commonly a CastError: decoded.id isn't a valid ObjectId
        // at all (token from a different app/version, or corrupted).
        console.error(`[auth] Error looking up User by token id '${decoded.id}': ${lookupErr.message}`);
        req.user = null;
      }

      // The token's id doesn't match a User document. This happens for
      // employee-only accounts that have no linked User record — the
      // login flow (authController's `login`) signs their token against
      // the Employee collection instead. Fall back to looking it up
      // there, and shape the result the same way (`linkedEmployeeId`
      // populated with department info) so every controller downstream
      // keeps working regardless of which collection the account lives in.
      if (!req.user) {
        let employee = null;
        try {
          employee = await Employee.findById(decoded.id).select("-password");
        } catch (lookupErr) {
          console.error(`[auth] Error looking up Employee by token id '${decoded.id}': ${lookupErr.message}`);
        }

        if (employee) {
          req.user = {
            _id: employee._id,
            name: employee.name,
            email: employee.email,
            role: "user",
            linkedEmployeeId: employee,
          };
        }
      }

      if (!req.user) {
        console.error(
          `[auth] Token id '${decoded.id}' does not match any User or Employee document (account may have been deleted).`
        );
        return res.status(401).json({
          message: "Not authorized, user not found",
          code: "USER_NOT_FOUND",
        });
      }

      next();
    } catch (error) {
      console.error("[auth] Unexpected error in auth middleware:", error);
      return res.status(401).json({
        message: "Not authorized, token failed",
        code: "AUTH_ERROR",
      });
    }
  } else {
    // NO TOKEN
    console.error(
      `[auth] No/invalid Authorization header on ${req.method} ${req.originalUrl}.`
    );
    return res.status(401).json({
      message: "No token provided",
      code: "NO_TOKEN",
    });
  }
};

module.exports = protect;