// ==================================
// 📁 backend/controllers/authController.js
// ==================================

let User =
require("../models/userModel");

const Employee =
require("../models/employeeModel");

const bcrypt =
require("bcrypt");

const generateToken =
require("../utils/jwt");


// OPTIONAL MODEL INJECTION
const setUserModel = (model) => {
  User = model;
};


// ================= REGISTER =================

const register =
async (req, res) => {

  try {

    const {
  name,
  email,
  password,
  role,
} = req.body;

    const userExists =
      await User.findOne({ email });

    if (userExists) {

      return res.status(400).json({
        message:
        "User already exists",
      });
    }

   const user =
  await User.create({
    name,
    email,
    password,
    role,
  });

  // ── Auto-create a linked Employee record so the user appears in the
  //    employee list and can use all attendance features. ──────────────
  try {
    // Check if an employee with this email already exists
    let emp = await Employee.findOne({ email });
    if (!emp) {
      emp = await Employee.create({
        name,
        email,
        password, // raw — Employee pre-save hook will hash it
        department: "N/A",
        designation: "User",
        isUserLinked: true,
      });
    }
    user.linkedEmployeeId = emp._id;
    await user.save();
  } catch (empErr) {
    // Non-fatal: user is still created; log for debugging
    console.error("Auto-create employee failed:", empErr.message);
  }

    res.status(201).json({

      success: true,

      token:
        generateToken(user),

      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        linkedEmployeeId: user.linkedEmployeeId,
      },
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });
  }
};


// ================= LOGIN =================
const login = async (req, res) => {

  try {

    const { email, password } = req.body;


    // ================= CHECK USER =================

    const user =
      await User.findOne({ email });


    if (user) {

      const isMatch =
        await user.comparePassword(
          password
        );


      if (!isMatch) {

        return res.status(400).json({
          message: "Invalid password",
        });
      }


      // ================= DEACTIVATION CHECK =================
      // If this User's linked Employee record has been deactivated
      // (resignation approved), block login here as well.
      if (user.linkedEmployeeId) {

        const linkedEmployee =
          await Employee.findById(
            user.linkedEmployeeId
          ).select("isActive");

        if (linkedEmployee && linkedEmployee.isActive === false) {

          return res.status(403).json({
            message:
            "Your access has been deactivated as your resignation was approved.",
          });
        }
      }


      const token =
        generateToken(user);


      return res.json({

        success: true,

        token,

        role: user.role,

        user: {
          ...user.toObject(),
          linkedEmployeeId: user.linkedEmployeeId || null,
        },
      });
    }

    // ================= CHECK EMPLOYEE =================

    const employee =
      await Employee.findOne({ email });


    if (!employee) {

      return res.status(400).json({
        message: "Account not found",
      });
    }


    const isMatch =
      await employee.comparePassword(
        password
      );


    if (!isMatch) {

      return res.status(400).json({
        message: "Invalid password",
      });
    }


    // ================= DEACTIVATION CHECK =================
    if (employee.isActive === false) {

      return res.status(403).json({
        message:
        "Your access has been deactivated as your resignation was approved.",
      });
    }


    const token =
      generateToken(employee);


    res.json({

      success: true,

      token,

      role: "employee",

      user: employee,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });
  }
};

// ================= GET PROFILE =================

const getMe =
async (req, res) => {

  try {

    const user =
      await User.findById(req.user.id)
      .select("-password");

    if (!user) {

      return res.status(404).json({
        message:
        "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });
  }
};


// ================= UPDATE USER =================

const updateUser =
async (req, res) => {

  try {

    const userId =
      req.user.id;

    const {
      name,
      email,
      password,
    } = req.body;

    const updateData = {};

    if (name)
      updateData.name = name;

    if (email)
      updateData.email = email;

    // HASH NEW PASSWORD
    if (password) {

      const salt =
        await bcrypt.genSalt(10);

      updateData.password =
        await bcrypt.hash(
          password,
          salt
        );
    }

    const updatedUser =
      await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true }
      ).select("-password");

    res.json({
      success: true,
      user: updatedUser,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });
  }
};


// ================= LOGOUT =================

const logout =
async (req, res) => {

  try {

    res.json({
      success: true,
      message:
      "Logged out successfully",
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateUser,
  logout,
  setUserModel,
};