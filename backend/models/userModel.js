const mongoose = require("mongoose");

const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },
      role: {
      type: String,
      enum: ["super_admin", "user"],
      default: "user",
    },
  },
  {
    timestamps: true,
  }
);


// 🔐 HASH PASSWORD BEFORE SAVE
userSchema.pre(
  "save",
  async function () {

    // Skip if password not modified
    if (!this.isModified("password")) {
      return;
    }

    const salt = await bcrypt.genSalt(10);

    this.password = await bcrypt.hash(
      this.password,
      salt
    );
  }
);


// 🔐 COMPARE PASSWORD
userSchema.methods.comparePassword =
  async function (enteredPassword) {

    return await bcrypt.compare(
      enteredPassword,
      this.password
    );
  };


// ✅ MODEL
module.exports = mongoose.model(
  "UserDetails",
  userSchema
);