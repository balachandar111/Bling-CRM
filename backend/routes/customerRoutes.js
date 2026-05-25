const express =
require("express");

const router =
express.Router();

const protect =
require("../middlewares/authMiddleware");

const {

  createCustomer,

  getCustomers,

  getCustomer,

  updateCustomer,

  deleteCustomer,

  bulkUploadCustomers,

} = require(
  "../controllers/customerController"
);


// BULK UPLOAD

router.post(

  "/bulk-upload",

  protect,

  bulkUploadCustomers
);


// CREATE

router.post(
  "/",
  protect,
  createCustomer
);


// GET ALL

router.get(
  "/",
  protect,
  getCustomers
);


// GET SINGLE

router.get(
  "/:id",
  protect,
  getCustomer
);


// UPDATE

router.put(
  "/:id",
  protect,
  updateCustomer
);


// DELETE

router.delete(
  "/:id",
  protect,
  deleteCustomer
);

module.exports = router;