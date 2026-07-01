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