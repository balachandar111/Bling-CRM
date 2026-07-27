const mongoose = require("mongoose");

// A single to-do item on an employee's daily task list. `text` is either
// one of the 4 preset options or whatever the employee typed via the
// 5th "Other" option. `completed` is ticked by the employee at the end
// of the day, before submitting.
const taskItemSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
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

    date: {
      type: String, // "YYYY-MM-DD"
      required: true,
    },

    // The employee's daily to-do list. Built in the morning (items added
    // one at a time from 4 preset options or a custom 5th option), then
    // each item is checked off as "completed" through the day.
    items: {
      type: [taskItemSchema],
      default: [],
    },

    // Auto-generated plain-text summary of `items` (kept in sync on every
    // save) so any older code/reporting that reads `report` still works.
    report: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// One report per user per day
taskSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Task", taskSchema);