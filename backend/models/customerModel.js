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