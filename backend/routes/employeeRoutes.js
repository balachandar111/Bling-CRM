const express =
require("express");

const router =
express.Router();

const upload =
require("../config/multer");

const employeeAuth =
require("../middlewares/employeeAuth");
const authMiddleware =
require("../middlewares/authMiddleware");

const superAdmin =
require("../middlewares/superAdmin");


const Employee =
require("../models/employeeModel");


const {

  registerEmployee,

  loginEmployee,

  getEmployeeProfile,
  updateEmployee,

  getEmployees,

  deleteEmployee,

  updateEmployeeEmail,
  uploadPayslip,
  getEmployeePayslips,

  updateProfileImage,

  updateEmployeeDocument,
  getMyPayslipsAsUser,

  requestResignation,
  getMyResignationStatus,
  getPendingResignations,
  approveResignation,
  rejectResignation,

} = require(
  "../controllers/employeeController"
);


// ================= REGISTER =================
router.put(
  "/upload-payslip/:id",
  authMiddleware,
  employeeAuth,
  upload.single("payslip"),
  uploadPayslip
);
router.get(
 "/test-payslip",
 (req,res)=>{
  res.send("Payslip route working");
 }
);
router.get(

 "/my-payslips",

 employeeAuth,

 async (req,res) => {

  try{

   const employee =
   await Employee.findById(
    req.employee.id
   );

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

   res.json({

    success:true,

    payslips:
    [...uploaded, ...generated]

   });

  }

  catch(error){

   res.status(500).json({

    success:false,

    message:error.message

   });

  }

 }

);
router.post(

  "/register",

 upload.fields([

  {
    name: "profileImage",
    maxCount: 1,
  },

  {
    name: "documents",
    maxCount: 10,
  },
]),

  registerEmployee
);


// ================= LOGIN =================

router.post(
  "/login",
  loginEmployee
);


// ================= PROFILE =================

router.get(

  "/profile",

  employeeAuth,

  getEmployeeProfile
);


// ================= GET EMPLOYEES =================

router.get(

  "/all",

  authMiddleware,

  getEmployees
);


// ================= DELETE =================

router.delete(

  "/:id",

  employeeAuth,

  deleteEmployee
);


// ================= UPDATE EMAIL =================

router.put(

  "/update-email",

  employeeAuth,

  updateEmployeeEmail
);


// ================= UPDATE IMAGE =================

router.put(

  "/update-image",

  employeeAuth,

  upload.single(
    "profileImage"
  ),

  updateProfileImage
);

router.get(
  "/test",
  (req, res) => {

    res.json({
      success: true,
      message:
      "Employee routes working",
    });
  }
);
// ================= UPDATE DOCUMENT =================

router.delete(

  "/:id",

  employeeAuth,

  deleteEmployee
);
router.put(

  "/update-document",

  employeeAuth,

  upload.single(
    "document"
  ),

  updateEmployeeDocument
);
router.put(

  "/:id",

  upload.fields([

    {
      name: "profileImage",
      maxCount: 1,
    },

    {
      name: "documents",
      maxCount: 10,
    },
  ]),

  updateEmployee
);


// ================= USER PANEL: MY PAYSLIPS (self-service) =================
// Used by logged-in Users (role "user"/"super_admin") in the Dashboard
// "Attendance" section. Resolves the linked Employee record by email.
router.get(
  "/me/payslips",
  authMiddleware,
  getMyPayslipsAsUser
);

// ================= RESIGNATION: EMPLOYEE PROFILE (direct employee login) =================

router.post(
  "/resign",
  employeeAuth,
  requestResignation
);

router.get(
  "/resignation/status",
  employeeAuth,
  getMyResignationStatus
);

// ================= RESIGNATION: USER PANEL (Attendance section) =================
// userEmployeeAuth resolves the logged-in User's linked Employee record
// and injects req.employee.id, same as the /attendance/me/* routes.

const userEmployeeAuth =
require("../middlewares/userEmployeeAuth");

router.post(
  "/me/resign",
  userEmployeeAuth,
  requestResignation
);

router.get(
  "/me/resignation/status",
  userEmployeeAuth,
  getMyResignationStatus
);

// ================= RESIGNATION: SUPER ADMIN =================

router.get(
  "/resignations/pending",
  authMiddleware,
  superAdmin,
  getPendingResignations
);

router.put(
  "/resignations/:id/approve",
  authMiddleware,
  superAdmin,
  approveResignation
);

router.put(
  "/resignations/:id/reject",
  authMiddleware,
  superAdmin,
  rejectResignation
);

module.exports =
router;