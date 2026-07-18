const Employee =
require("../models/employeeModel");

// ================= MERGE PAYSLIPS =================
// "My Payslips" (user self-service) shows both manually-uploaded payslips
// and admin-"Generate Payslip" entries — but only once a generated one has
// been sent (status "sent"); drafts stay hidden from the employee.
const mergePayslips = (employee) => {
  const uploaded = (employee.payslips || []).map((p) => ({
    month: p.month,
    year: p.year,
    pdfUrl: p.pdfUrl,
    uploadedAt: p.uploadedAt,
  }));

  const generated = (employee.generatedPayslips || [])
    .filter((p) => p.status === "sent")
    .map((p) => ({
      month: String(p.month),
      year: p.year,
      pdfUrl: p.pdfUrl,
      uploadedAt: p.sentAt || p.generatedAt,
    }));

  return [...uploaded, ...generated];
};

const jwt =
require("jsonwebtoken");

const bcrypt =
require("bcrypt");


// ================= REGISTER EMPLOYEE =================

const registerEmployee =
async (req, res) => {

  try {

    const {

      name,
      email,
      password,
      phone,
      department,
      designation,
      salary,
      joiningDate,

      employeeCode,
      location,
      bankName,
      bankAccountNo,
      ifscCode,
      panNumber,
      pfNo,
      pfUan,

    } = req.body;


    // ================= CHECK EXIST =================

    const existingEmployee =
      await Employee.findOne({
        email,
      });

    if (existingEmployee) {

      return res.status(400).json({

        success: false,

        message:
        "Employee already exists",
      });
    }


    // ================= HASH PASSWORD =================

  


    // ================= PROFILE IMAGE =================

    let profileImage = "";

    if (
      req.files?.profileImage
    ) {

      profileImage =
      req.files.profileImage[0]
      .path;
    }


    // ================= DOCUMENTS =================

    let documents = [];

    if (
      req.files?.documents
    ) {

      documents =
      req.files.documents.map(

        (file) => file.path
      );
    }


    // ================= CREATE EMPLOYEE =================

    const employee =
      await Employee.create({

        name,

        email,

        password,

        phone,

        department,

        designation,

        salary,

        joiningDate,

        employeeCode,
        location,
        bankName,
        bankAccountNo,
        ifscCode,
        panNumber,
        pfNo,
        pfUan,

        profileImage,

        documents,
      });


    res.status(201).json({

      success: true,

      message:
      "Employee Registered Successfully",

      employee,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      message:
      error.message,
    });
  }
};
//-----payslip---
const uploadPayslip =
async (req, res) => {

  try {

    const employee =
      await Employee.findById(
        req.params.id
      );

    if (!employee) {

      return res.status(404).json({

        success: false,

        message:
        "Employee not found",
      });
    }

    employee.payslips.push({

      month:
        req.body.month,

      year:
        req.body.year,

      pdfUrl:
        req.file.path,

      uploadedBy:
        req.user.id,

    });

    await employee.save();

    res.json({

      success: true,

      message:
        "Payslip Uploaded",

      employee,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      message:
        error.message,
    });
  }
};
const getEmployeePayslips =
async (req,res)=>{

 try{

  const employee =
  await Employee.findById(
    req.employee.id
  );

  res.json({

    success:true,

    payslips:
    mergePayslips(employee)

  });

 }catch(error){

  res.status(500).json({

   success:false,

   message:error.message

  });

 }

};

// ================= LOGIN =================

const loginEmployee =
async (req, res) => {

  try {

    const {
      email,
      password,
    } = req.body;


    const employee =
      await Employee.findOne({
        email,
      });


    if (!employee) {

      return res.status(400).json({

        success: false,

        message:
        "Employee not found",
      });
    }


    const isMatch =
      await employee.comparePassword(
        password
      );


    if (!isMatch) {

      return res.status(400).json({

        success: false,

        message:
        "Invalid password",
      });
    }


    const token =
      jwt.sign(

        {
          id:
          employee._id,
        },

        process.env.JWT_SECRET,

        {
          expiresIn: "7d",
        }
      );


    res.json({

      success: true,

      token,

      employee,
    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message:
      error.message,
    });
  }
};


// ================= PROFILE =================

const getEmployeeProfile =
async (req, res) => {

  try {

    const employee =
      await Employee.findById(

        req.employee.id

      ).select("-password");


    res.json({

      success: true,

      employee,
    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message:
      error.message,
    });
  }
};


// ================= GET ALL EMPLOYEES =================

const getEmployees =
async (req, res) => {

  try {

    const employees =
      await Employee.find()

      .select("-password")

      .sort({
        createdAt: -1,
      });


    res.json({

      success: true,

      employees,
    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message:
      error.message,
    });
  }
};


// ================= DELETE EMPLOYEE =================

const deleteEmployee =
async (req, res) => {

  try {

    const employee =
      await Employee.findByIdAndDelete(

        req.params.id
      );

    if (!employee) {

      return res.status(404).json({

        success: false,

        message:
        "Employee not found",
      });
    }


    res.json({

      success: true,

      message:
      "Employee deleted successfully",
    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message:
      error.message,
    });
  }
};


// ================= UPDATE EMAIL =================

const updateEmployeeEmail =
async (req, res) => {

  try {

    const employee =
      await Employee.findById(

        req.employee.id
      );

    employee.email =
      req.body.email;

    await employee.save();


    res.json({

      success: true,

      message:
      "Email updated",
    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message:
      error.message,
    });
  }
};


// ================= UPDATE PROFILE IMAGE =================

const updateProfileImage =
async (req, res) => {

  try {

    const employee =
      await Employee.findById(

        req.employee.id
      );

    employee.profileImage =
      req.file.path;

    await employee.save();


    res.json({

      success: true,

      profileImage:
      employee.profileImage,
    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message:
      error.message,
    });
  }
};


// ================= UPDATE DOCUMENT =================

const updateEmployeeDocument =
async (req, res) => {

  try {

    const employee =
      await Employee.findById(

        req.employee.id
      );

    if (!employee) {

      return res.status(404).json({

        success: false,

        message:
        "Employee not found",
      });
    }


    employee.documents.push(
      req.file.path
    );

    await employee.save();


    res.json({

      success: true,

      message:
      "Document updated",

      employee,
    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message:
      error.message,
    });
  }
};
const updateEmployee =
async (req, res) => {

  try {

    const employee =
      await Employee.findById(

        req.params.id
      );

    if (!employee) {

      return res.status(404).json({

        success: false,

        message:
        "Employee not found",
      });
    }


    // ================= TEXT FIELDS =================

    employee.name =
      req.body.name ||
      employee.name;

    employee.email =
      req.body.email ||
      employee.email;

    employee.phone =
      req.body.phone ||
      employee.phone;

    employee.department =
      req.body.department ||
      employee.department;

    employee.designation =
      req.body.designation ||
      employee.designation;

    employee.salary =
      req.body.salary ||
      employee.salary;

    employee.joiningDate =
      req.body.joiningDate ||
      employee.joiningDate;


    // ================= PAYSLIP COMMON DETAILS =================

    employee.employeeCode =
      req.body.employeeCode ||
      employee.employeeCode;

    employee.location =
      req.body.location ||
      employee.location;

    employee.bankName =
      req.body.bankName ||
      employee.bankName;

    employee.bankAccountNo =
      req.body.bankAccountNo ||
      employee.bankAccountNo;

    employee.ifscCode =
      req.body.ifscCode ||
      employee.ifscCode;

    employee.panNumber =
      req.body.panNumber ||
      employee.panNumber;

    employee.pfNo =
      req.body.pfNo ||
      employee.pfNo;

    employee.pfUan =
      req.body.pfUan ||
      employee.pfUan;


    // ================= PASSWORD =================

    if (req.body.password) {

      employee.password =
        req.body.password;
    }


    // ================= PROFILE IMAGE =================

    if (
      req.files?.profileImage
    ) {

      employee.profileImage =
      req.files.profileImage[0]
      .path;
    }


    // ================= DOCUMENTS =================

    if (
      req.files?.documents
    ) {

      employee.documents =
      req.files.documents.map(

        (file) =>
          file.path
      );
    }


    await employee.save();


    res.json({

      success: true,

      message:
      "Employee updated",

      employee,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      message:
      error.message,
    });
  }
};

// ================= USER PANEL: GET MY PAYSLIPS (self-service) =================
// Used by logged-in Users (not employees) in the Dashboard "Attendance"
// section, resolving the Employee record linked to their account by email.
const getMyPayslipsAsUser = async (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    const employee = await Employee.findOne({ email: req.user.email });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message:
          "No employee profile is linked to your account yet. Ask a super admin to create an employee record using the same email.",
      });
    }

    res.json({
      success: true,
      payslips: mergePayslips(employee),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= RESIGNATION: REQUEST (employee / linked user) =================
// Used by both the standalone Employee Profile ("Resign" button) and the
// User panel's Attendance section ("Resign" button) — both routes inject
// req.employee.id (via employeeAuth or userEmployeeAuth) so this single
// handler works for either caller.
const requestResignation = async (req, res) => {
  try {
    const { name, date, reason } = req.body;

    if (!name || !date || !reason) {
      return res.status(400).json({
        success: false,
        message: "Name, date and reason are all required.",
      });
    }

    const employee = await Employee.findById(req.employee.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    if (employee.resignation?.status === "pending") {
      return res.status(400).json({
        success: false,
        message: "You already have a resignation request pending approval.",
      });
    }

    if (employee.resignation?.status === "approved" || !employee.isActive) {
      return res.status(400).json({
        success: false,
        message: "Your resignation has already been approved.",
      });
    }

    employee.resignation = {
      name,
      date,
      reason,
      status: "pending",
      requestedAt: new Date(),
      decisionBy: null,
      decisionAt: null,
    };

    await employee.save();

    res.json({
      success: true,
      message: "Resignation request submitted. Waiting for admin approval.",
      resignation: employee.resignation,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= RESIGNATION: MY STATUS (employee / linked user) =================
const getMyResignationStatus = async (req, res) => {
  try {
    const employee = await Employee.findById(req.employee.id).select(
      "resignation isActive name"
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.json({
      success: true,
      resignation: employee.resignation || { status: "none" },
      isActive: employee.isActive,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= RESIGNATION: PENDING LIST (SUPER ADMIN) =================
const getPendingResignations = async (req, res) => {
  try {
    const employees = await Employee.find({
      "resignation.status": "pending",
    })
      .select("-password")
      .sort({ "resignation.requestedAt": -1 });

    res.json({
      success: true,
      records: employees,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= RESIGNATION: APPROVE (SUPER ADMIN) =================
// Approving deactivates the employee's access immediately (isActive=false),
// which blocks both direct Employee login and the linked User's login/API
// access (see authController.login and the auth middlewares).
const approveResignation = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user?._id;

    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    if (employee.resignation?.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending resignation requests can be approved.",
      });
    }

    employee.resignation.status = "approved";
    employee.resignation.decisionBy = adminId || null;
    employee.resignation.decisionAt = new Date();

    // Deactivate access
    employee.isActive = false;

    await employee.save();

    res.json({
      success: true,
      message:
        "Resignation approved. The employee's access has been deactivated.",
      employee,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= RESIGNATION: REJECT (SUPER ADMIN) =================
const rejectResignation = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user?._id;

    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    if (employee.resignation?.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending resignation requests can be rejected.",
      });
    }

    employee.resignation.status = "rejected";
    employee.resignation.decisionBy = adminId || null;
    employee.resignation.decisionAt = new Date();

    await employee.save();

    res.json({
      success: true,
      message: "Resignation request rejected.",
      employee,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {

  registerEmployee,

  loginEmployee,

  getEmployeeProfile,
  updateEmployee,

  getEmployees,

  deleteEmployee,

  updateEmployeeEmail,

  updateProfileImage,
  uploadPayslip,
  getEmployeePayslips,

  updateEmployeeDocument,
  getMyPayslipsAsUser,

  requestResignation,
  getMyResignationStatus,
  getPendingResignations,
  approveResignation,
  rejectResignation,
};