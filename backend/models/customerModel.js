const mongoose = require("mongoose");

const customerSchema =
new mongoose.Schema(

{
  // BASIC DETAILS
  name: {
    type: String,
    required: true,
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
  investment: {

    type: Number,

    default: 0,
  },


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
      "Instagram",
      "Facebook",
      "LinkedIn",
      "Referral",
      "Cold Call",
      "Walk-in",
      "Other"
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
