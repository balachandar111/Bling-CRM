const mongoose =
require("mongoose");

// ================= BILL ATTACHMENT SUB-SCHEMA =================
// A reimbursement claim can now have MULTIPLE bills/receipts attached
// (images and/or PDFs), each hosted on Cloudinary. This replaces the
// old single billUrl/billPublicId pair.

const billAttachmentSchema =
new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },

    publicId: {
      type: String,
      required: true,
    },

    // Original file name, used for display purposes on the frontend
    originalName: {
      type: String,
      default: "",
    },

    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  }
);

const reimbursementSchema =
new mongoose.Schema(

  {

    companyName: {
      type: String,
      required: true,
    },

    // Date of the expense/travel (entered by the employee) — separate
    // from createdAt, which just tracks when the claim was submitted.
    date: {
      type: Date,
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

    // Cloudinary-hosted bills/receipts — an employee can attach
    // multiple documents/images to a single reimbursement claim, and
    // the admin can view every one of them.
    bills: {
      type: [billAttachmentSchema],
      default: [],
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