const express =
require("express");

const router =
express.Router();

const upload =
require("../config/multer");

const employeeAuth =
require("../middlewares/employeeAuth");

const {

  registerEmployee,

  loginEmployee,

  getEmployeeProfile,
  updateEmployee,

  getEmployees,

  deleteEmployee,

  updateEmployeeEmail,

  updateProfileImage,

  updateEmployeeDocument,

} = require(
  "../controllers/employeeController"
);


// ================= REGISTER =================

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

  employeeAuth,

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


module.exports =
router;