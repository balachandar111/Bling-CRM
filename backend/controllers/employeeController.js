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
};