const mongoose = require("mongoose");

// ============================================================
// PROJECT PROGRESS
// One document per project. `history` keeps every status update
// ever made (newest pushed at the end) so "Manage History" can show
// the full trail, while `currentStatusDescription` is a denormalized
// copy of the latest update so the list/table + "last two updates"
// view don't need to reach into `history` every time.
// ============================================================

// A single status update entry. Both admin and user accounts can add
// one of these (see projectProgressController.addProgressUpdate).
const progressHistoryItemSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserDetails",
      default: null,
    },

    // Denormalized so the history list still shows a name even if the
    // user account is later deleted.
    updatedByName: {
      type: String,
      default: "",
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const projectProgressSchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
      required: true,
      trim: true,
    },

    // Multiple POCs are supported — picked from the full Employees
    // list (every employee, whether or not they have a User login
    // account), grouped into All / IT Department / Super Admin /
    // Admin Users by the controller's getEligibleUsers.
    poc: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "EmployeeDetails",
      },
    ],

    // Multiple responsible persons, same picker/source as POC.
    responsiblePersons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "EmployeeDetails",
      },
    ],

    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },

    // Latest status text (mirrors the last entry in `history`).
    currentStatusDescription: {
      type: String,
      default: "",
      trim: true,
    },

    history: {
      type: [progressHistoryItemSchema],
      default: [],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserDetails",
      default: null,
    },

    createdByName: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ProjectProgress", projectProgressSchema);