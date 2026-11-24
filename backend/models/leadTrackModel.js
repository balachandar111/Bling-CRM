const mongoose = require("mongoose");

const noteEntrySchema = new mongoose.Schema({
  note: { type: String, required: true },
  stage: { type: String, default: "" },
  authorName: { type: String, default: "" },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "UserDetails" },
  createdAt: { type: Date, default: Date.now },
});

const onboardedLeadSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CustomerDetails",
  },
  name: { type: String, default: "" },
  company: { type: String, default: "" },
  phone: { type: String, default: "" },
  email: { type: String, default: "" },
  location: { type: String, default: "" },
  sparkName: { type: String, default: "" },
  sparkNumber: { type: String, default: "" },
  stage: {
    type: String,
    enum: ["Call", "WhatsappMessage", "Demo", "Quote"],
    default: "Call",
  },
  stageHistory: [
    {
      stage: { type: String },
      updatedAt: { type: Date, default: Date.now },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "UserDetails" },
      updatedByName: { type: String, default: "" },
    },
  ],
  quotedAt: { type: Date },
  notes: { type: String, default: "" },
  notesHistory: [noteEntrySchema],
  onboardedAt: { type: Date, default: Date.now },
});

const productTrackSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
    enum: [
      "Genunitys",
      "Rewards",
      "CRM",
      "Custom-Website",
      "WhatsappAtuomation",
      "Projects",
      "QuickCommerce",
    ],
  },
  target: {
    type: Number,
    min: 0,
    default: 0,
  },
  noTarget: {
    type: Boolean,
    default: false,
  },
  onboardedLeads: [onboardedLeadSchema],
});

const leadTrackSchema = new mongoose.Schema(
  {
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserDetails",
      required: true,
    },
    assignedToName: {
      type: String,
      default: "",
    },
    startMonth: {
      type: String, // e.g. "2026-01" or "Jan 2026"
      required: true,
    },
    endMonth: {
      type: String, // e.g. "2026-03" or "Mar 2026"
      required: true,
    },
    title: {
      type: String,
      default: "",
    },
    products: [productTrackSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserDetails",
    },
    createdByName: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "completed", "archived"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Virtual helper methods or computed properties
leadTrackSchema.methods.calculateStats = function () {
  return this.products.map((p) => {
    const quotedCount = p.onboardedLeads.filter((l) => l.stage === "Quote").length;
    const remainingTarget = p.noTarget ? "No Target" : Math.max(0, (p.target || 0) - quotedCount);
    return {
      _id: p._id,
      productName: p.productName,
      target: p.target || 0,
      noTarget: !!p.noTarget,
      onboardedCount: p.onboardedLeads.length,
      quotedCount,
      remainingTarget,
      callCount: p.onboardedLeads.filter((l) => l.stage === "Call").length,
      whatsappCount: p.onboardedLeads.filter((l) => l.stage === "WhatsappMessage").length,
      demoCount: p.onboardedLeads.filter((l) => l.stage === "Demo").length,
    };
  });
};

module.exports = mongoose.model("LeadTrack", leadTrackSchema);

