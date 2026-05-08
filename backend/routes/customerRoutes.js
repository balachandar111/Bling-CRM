const express = require("express");

const router = express.Router();

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

const protect =
require("../middlewares/authMiddleware");

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