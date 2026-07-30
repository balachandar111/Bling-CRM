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

    // Claim amount entered by the employee
    amount: {
      type: Number,
      default: 0,
    },

    // Approval workflow — every claim starts "Pending" and waits for a
    // super_admin to Approve/Reject it from the "Closed Leads &
    // Reimbursements" admin section.
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    // Who actioned it and when (set on approve/reject)
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserDetails",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    // Optional note from the admin (e.g. reason for rejection)
    adminRemark: {
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
      ref: "UserDetails",
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