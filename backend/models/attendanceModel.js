const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmployeeDetails",
      required: true,
    },

    date: {
      type: String, // "YYYY-MM-DD"
      required: true,
    },

    status: {
      type: String,
      enum: ["present", "absent", "leave"],
      default: "absent",
    },

    checkIn: {
      type: Date,
      default: null,
    },

    checkOut: {
      type: Date,
      default: null,
    },

    totalHours: {
      type: Number,
      default: 0,
    },

    // For leave requests
    leaveReason: {
      type: String,
      default: "",
    },

    leaveDate: {
      type: String, // "YYYY-MM-DD"
      default: "",
    },

    // Track sessions for extra logins after checkout
    sessions: [
      {
        checkIn: Date,
        checkOut: Date,
        hours: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound unique index: one record per employee per date
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);