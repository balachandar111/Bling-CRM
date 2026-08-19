const mongoose = require("mongoose");

// ================= LINE ITEM =================
const itemSchema = new mongoose.Schema(
  {
    description: { type: String, default: "" },
    hsnSac: { type: String, default: "" },
    qty: { type: Number, default: 1 },
    unit: { type: String, default: "" }, // e.g. "pcs" — printed after qty like the sample invoice
    rate: { type: Number, default: 0 },
    cgstPercent: { type: Number, default: 9 },
    sgstPercent: { type: Number, default: 9 },

    // ===== computed (stored so the PDF always matches what was saved) =====
    amount: { type: Number, default: 0 }, // qty * rate
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
  },
  { _id: false }
);

// ================= PARTY (Bill To / Ship To) =================
const partySchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    address: { type: String, default: "" },
    gstin: { type: String, default: "" },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    // "quotation" or "invoice"
    docType: {
      type: String,
      enum: ["quotation", "invoice"],
      required: true,
    },

    // e.g. "QUO-000001" / "INV-000014"
    docNumber: {
      type: String,
      required: true,
      unique: true,
    },

    // Optional link back to the CRM customer record
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerDetails",
    },

    billTo: partySchema,
    shipTo: partySchema,

    date: { type: Date, default: Date.now },
    dueDate: { type: Date },
    terms: { type: String, default: "Due on Receipt" },
    placeOfSupply: { type: String, default: "Tamil Nadu (33)" },

    items: [itemSchema],

    subTotal: { type: Number, default: 0 },
    cgstTotal: { type: Number, default: 0 },
    sgstTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },

    notes: { type: String, default: "Thanks for your business." },

    // quotation: draft/sent/accepted/rejected | invoice: unpaid/paid
    status: {
      type: String,
      enum: ["draft", "sent", "accepted", "rejected", "unpaid", "paid"],
      default: "draft",
    },

    // Links between a quotation and the invoice generated from it
    convertedFromQuotation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InvoiceDocument",
    },
    convertedToInvoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InvoiceDocument",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserDetails",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InvoiceDocument", invoiceSchema);
