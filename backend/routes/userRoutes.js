const bcrypt =
require("bcrypt");
const express =
require("express");

const router =
express.Router();

const User =
require("../models/userModel");

const protect =
require("../middlewares/authMiddleware");

const roleMiddleware =
require("../middlewares/roleMiddleware");


// ================= GET USERS =================

router.get(

  "/",

  protect,

  roleMiddleware(
    "super_admin"
  ),

  async (req, res) => {

    const users =
      await User.find()
      .select("-password");

    res.json({

      success: true,

      users,
    });
  }
);
router.put(

  "/:id",

  protect,

  roleMiddleware(
    "super_admin"
  ),

  async (req, res) => {

    try {

      const user =
        await User.findById(
          req.params.id
        );

      if (!user) {

        return res.status(404).json({

          message:
          "User not found",
        });
      }

      user.name =
        req.body.name ||
        user.name;

      user.email =
        req.body.email ||
        user.email;

      user.role =
        req.body.role ||
        user.role;


      // PASSWORD UPDATE

      if (req.body.password) {

        const salt =
          await bcrypt.genSalt(10);

        user.password =
          await bcrypt.hash(

            req.body.password,

            salt
          );
      }

      await user.save();

      res.json({

        success: true,

        message:
        "User updated",

        user,
      });

    } catch (error) {

      res.status(500).json({

        message:
        error.message,
      });
    }
  }
);


// ================= UPDATE ROLE =================

router.put(

  "/:id/role",

  protect,

  roleMiddleware(
    "super_admin"
  ),

  async (req, res) => {

    const user =
      await User.findById(
        req.params.id
      );

    if (!user) {

      return res.status(404).json({

        message:
        "User not found",
      });
    }

    user.role =
      req.body.role;

    await user.save();

    res.json({

      success: true,

      user,
    });
  }
);


// ================= DELETE USER =================

router.delete(

  "/:id",

  protect,

  roleMiddleware(
    "super_admin"
  ),

  async (req, res) => {

    await User.findByIdAndDelete(
      req.params.id
    );

    res.json({

      success: true,

      message:
      "User deleted",
    });
  }
);

module.exports = router;