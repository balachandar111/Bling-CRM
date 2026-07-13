const mongoose = require("mongoose");

const bcrypt = require("bcrypt");

const employeeSchema =
new mongoose.Schema(

{
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  phone: String,

  department: String,

  designation: String,

  salary: Number,

  joiningDate: Date,

  // true when this employee record was auto-created from a User account
  isUserLinked: {
    type: Boolean,
    default: false,
  },

profileImage: {
  type: String,
},

documents: [
  {
    type: String,
  },
],
payslips: [

 {
  month:String,

  year:Number,

  pdfUrl:String,

  uploadedBy:{
   type:
   mongoose.Schema.Types.ObjectId,
   ref:"UserDetails"
  },

  uploadedAt:{
   type:Date,
   default:Date.now
  }
 }

],

// ================= GENERATED PAYSLIPS (admin "Generate Payslip") =================
// Created from a fixed earnings/deductions breakup entered by the admin,
// rendered into a PDF that matches the company payslip letterhead.
// Stays "draft" (hidden from the employee) until an admin sends it.
generatedPayslips: [

 {
  month: Number,
  year: Number,

  effectiveWorkDays: Number,
  lop: { type: Number, default: 0 },

  location: String,
  designation: String,
  department: String,

  bankName: String,
  bankAccountNo: String,
  panNumber: String,
  pfNo: String,
  pfUan: String,
  employeeCode: String,

  earnings: {
   basic: { type: Number, default: 0 },
   hra: { type: Number, default: 0 },
   conveyance: { type: Number, default: 0 },
   specialAllowance: { type: Number, default: 0 },
   communicationAllowance: { type: Number, default: 0 },
   reimbursement: { type: Number, default: 0 },
  },

  deductions: {
   profTax: { type: Number, default: 0 },
   incomeTax: { type: Number, default: 0 },
  },

  totalEarnings: { type: Number, default: 0 },
  totalDeductions: { type: Number, default: 0 },
  netPay: { type: Number, default: 0 },

  pdfUrl: String,

  status: {
   type: String,
   enum: ["draft", "sent"],
   default: "draft",
  },

  generatedBy: {
   type: mongoose.Schema.Types.ObjectId,
   ref: "UserDetails",
  },

  generatedAt: { type: Date, default: Date.now },
  sentAt: Date,
 }

],

},
{
  timestamps: true,
}
);


// HASH PASSWORD

employeeSchema.pre(
  "save",
  async function () {

    if (!this.isModified("password")) {
      return;
    }

    const salt =
      await bcrypt.genSalt(10);

    this.password =
      await bcrypt.hash(
        this.password,
        salt
      );
  }
);


// COMPARE PASSWORD

employeeSchema.methods.comparePassword =
async function (enteredPassword) {

  return await bcrypt.compare(
    enteredPassword,
    this.password
  );
};


module.exports = mongoose.model(
  "EmployeeDetails",
  employeeSchema
);