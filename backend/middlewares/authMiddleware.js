const jwt = require("jsonwebtoken");

const User =
require("../models/userModel");


const protect =
async (req, res, next) => {

  let token;

  // CHECK TOKEN
  if (

    req.headers.authorization &&

    req.headers.authorization.startsWith(
      "Bearer"
    )

  ) {

    try {

      token =
        req.headers.authorization
        .split(" ")[1];

      // VERIFY TOKEN
      const decoded =
        jwt.verify(
          token,
          process.env.JWT_SECRET
        );

      // GET USER
      req.user =
        await User.findById(
          decoded.id
        ).select("-password");

      next();

    } catch (error) {

      return res.status(401).json({

        message:
        "Not authorized, token failed",

      });
    }
  }

  // NO TOKEN
  if (!token) {

    return res.status(401).json({

      message:
      "No token provided",

    });
  }
};

module.exports = protect;