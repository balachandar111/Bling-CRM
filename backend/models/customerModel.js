const mongoose = require("mongoose");

const customerSchema =
new mongoose.Schema(

{
  // BASIC DETAILS
  name: {
    type: String,
  },

  email: {
    type: String,
  },

  phone: {
    type: String,
  },

  company: {
    type: String,
  },

  // LOCATION (free-text, entered by the user)
  location: {
    type: String,
    default: "",
  },

  // SERVICE OFFERED
  service: {
    type: String,

    enum: [
      "",
      "CRM",
      "WhatsApp Bot Service Sales",
      "Customized Application Sales",
      "Genuinity",
      "Quick Commerce Marketing Business",
    ],

    default: "",
  },

  // AIDA STAGE (marketing funnel weight, separate from leadStage)
  aidaStage: {
    type: String,

    enum: [
      "",
      "High",
      "Medium",
      "Low",
    ],

    default: "",
  },


  // CUSTOMER STATUS
status: {

  type: String,

  enum: [

    "lead",

    "customer",

    "lost"
  ],

  default: "lead",
},


  // SALES PIPELINE
  leadStage: {

    type: String,

    enum: [

      "Awareness",

      "Interest",

      "Desire",

      "Closure",

    ],

    default: "Awareness",
  },


  // INVESTMENT
 


  // REMARKS
  remark: {

    type: String,

    default: "",
  },
  lastRemarks: [

  {

    remark: String,

    updatedAt: {

      type: Date,

      default: Date.now,
    },
  }
],


  // FOLLOWUP DATE
  followUpDate: {

    type: Date,
  },


  // PRIORITY
  priority: {

    type: String,

    enum: [
      "Low",
      "Medium",
      "High"
    ],

    default: "Medium",
  },


  // LEAD SOURCE
  source: {

    type: String,

    enum: [
      "Website",
      "Social media",
      "Expo",
      "Referral"
    ],

    default: "Website",
  },


  // ASSIGNED SALES PERSON
  assignedTo: {

    type: String,
  },
solution: {
  type: String,
},

product: {
  type: String,
},

// ================= OPPORTUNITY (DESIRE -> CLOSURE) =================
// Deal value entered by the user while closing the opportunity.
value: {
  type: Number,
  default: 0,
},

// PDF documents uploaded while closing an opportunity.
opportunityDocuments: {
  quotation: {
    type: String,
    default: "",
  },
  poReceived: {
    type: String,
    default: "",
  },
  so: {
    type: String,
    default: "",
  },
  sow: {
    type: String,
    default: "",
  },
  invoice: {
    type: String,
    default: "",
  },
},
sector: {
  type: String,
  default: ""
},

// ================= OPPORTUNITY INFO (DESIRE STAGE TRACKING) =================
// Filled in by the assigned user once a lead reaches the "Desire" stage.
// Shown to admins in the Admin "Opportunity" section.
opportunityInfo: {
  // Proposal value quoted to the customer
  proposalValue: {
    type: Number,
    default: 0,
  },

  // Bottom line / minimum acceptable value for the deal
  bottomLine: {
    type: Number,
    default: 0,
  },

  // How likely the deal is to be achieved
  achievementLevel: {
    type: String,
    enum: ["", "High", "Medium", "Low"],
    default: "",
  },

  // Month the deal is expected to close, stored as "YYYY-MM"
  expectedDealClosure: {
    type: String,
    default: "",
  },

  // Free text entered by the user, visible to admin
  immediateStepToAction: {
    type: String,
    default: "",
  },

  // Current pipeline status of the opportunity
  status: {
    type: String,
    enum: ["", "PO", "Hold", "Quote", "Followup", "Meeting", "Negotiation"],
    default: "",
  },
},
lastModified: {

  type: Date,
},
  // CREATED USER
  createdBy: {

    type:
      mongoose.Schema.Types.ObjectId,

    ref: "UserDetails",
  },

},
{
  timestamps: true,
}
);


// COLLECTION NAME
module.exports = mongoose.model(
  "CustomerDetails",
  customerSchema
);