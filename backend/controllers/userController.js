const User = require("../models/userModel");
const Employee = require("../models/employeeModel");

// ============================================================
// MIGRATE: LINK EXISTING USERS → EMPLOYEES
// Super admin triggers this (auto-called on login) to backfill
// existing users that don't yet have a linked employee record.
// ============================================================
const migrateEmployees = async (req, res) => {
  try {
    const users = await User.find({
      $or: [
        { linkedEmployeeId: null },
        { linkedEmployeeId: { $exists: false } },
      ],
    });

    let created = 0;

    for (const user of users) {
      try {
        let emp = await Employee.findOne({ email: user.email });

        if (!emp) {
          emp = await Employee.create({
            name: user.name,
            email: user.email,
            password: "TempPass@123",
            department: "N/A",
            designation: "User",
            isUserLinked: true,
          });
        }

        user.linkedEmployeeId = emp._id;
        await user.save();
        created++;
      } catch (e) {
        console.error("Migrate failed for", user.email, e.message);
      }
    }

    res.json({
      success: true,
      message: `Migration complete. ${created} user(s) linked.`,
      created,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// GET ALL USERS (super admin only)
// ============================================================
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// UPDATE USER (name / email / role / password)
// ============================================================
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;

    if (req.body.password) {
      // Assign the plain password and let the pre-save hook in
      // userModel.js hash it. Hashing it here too (and then calling
      // save()) hashed it TWICE, which is why logins afterwards
      // failed with "invalid password".
      user.password = req.body.password;
    }

    await user.save();

    res.json({ success: true, message: "User updated", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================================================
// UPDATE ROLE ONLY
// ============================================================
const updateUserRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = req.body.role;
    await user.save();

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================================================
// DELETE USER
// ============================================================
const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  migrateEmployees,
  getUsers,
  updateUser,
  updateUserRole,
  deleteUser,
};