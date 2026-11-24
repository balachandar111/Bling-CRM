const mongoose = require("mongoose");

// A single to-do item on an employee's daily task list.
// `text` is the task title / preset or custom text.
// `note` is user-provided explanation, problem remarks, or sub-task details.
// `completed` is checked by employee.
// `adminCompleted` is verified and marked by admin.
// `adminPending` is set when admin marks uncompleted task as pending for next day.
// `adminRemark` is feedback from admin when moving to pending.
const taskItemSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    adminCompleted: {
      type: Boolean,
      default: false,
    },
    adminPending: {
      type: Boolean,
      default: false,
    },
    adminRemark: {
      type: String,
      default: "",
      trim: true,
    },
    pendingReason: {
      type: String,
      default: "",
      trim: true,
    },
    isRolledOver: {
      type: Boolean,
      default: false,
    },
    rolledOverFromDate: {
      type: String,
      default: "",
    },
  },
  { _id: true }
);

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserDetails",
      required: true,
    },

    userName: {
      type: String,
      default: "",
    },

    department: {
      type: String,
      default: "",
    },

    departmentKey: {
      type: String,
      default: "",
    },

    date: {
      type: String, // "YYYY-MM-DD"
      required: true,
    },

    // Daily to-do list items
    items: {
      type: [taskItemSchema],
      default: [],
    },

    // Plain-text summary of `items`
    report: {
      type: String,
      default: "",
    },

    // Admin review fields
    adminReviewed: {
      type: Boolean,
      default: false,
    },
    adminReviewedAt: {
      type: Date,
    },
    adminReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserDetails",
    },
  },
  {
    timestamps: true,
  }
);

// One report per user per day
taskSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Task", taskSchema);
