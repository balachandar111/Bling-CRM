const mongoose =
require("mongoose");

const reimbursementSchema =
new mongoose.Schema(

  {

    companyName: {
      type: String,
      required: true,
    },

    // Travel details for this reimbursement (e.g. From City -> To City)
    from: {
      type: String,
      required: true,
    },

    to: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    // Cloudinary-hosted bill/receipt
    billUrl: {
      type: String,
      default: "",
    },

    billPublicId: {
      type: String,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

  },

  {
    timestamps: true,
  }
);

module.exports =
mongoose.model(
  "Reimbursement",
  reimbursementSchema
);