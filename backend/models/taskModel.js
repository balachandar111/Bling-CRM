const mongoose = require("mongoose");

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

    report: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// One report per user per day
taskSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Task", taskSchema);