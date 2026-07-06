const express =
require("express");

const router =
express.Router();
const authMiddleware =
require("../middlewares/authMiddleware");
const protect =
require("../middlewares/authMiddleware");

const {

  createCustomer,

  getCustomers,

  getCustomer,

  updateCustomer,

  deleteCustomer,

  bulkDeleteCustomers,

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
router.put(
  "/:id",
  authMiddleware,
  async (req, res) => {

    try {

      const customer =
        await CustomerDetails.findByIdAndUpdate(

          req.params.id,

          {

            ...req.body,

            lastModified:
              new Date(),

          },

          {
            new: true,
          }

        );

      res.json(customer);

    } catch (err) {

      res.status(500).json({

        message:
          err.message,
      });
    }
  }
);

// BULK DELETE
// NOTE: this must be registered BEFORE the "/:id" delete route below,
// otherwise Express will treat "bulk-delete" as an :id value.

router.delete(
  "/bulk-delete",
  protect,
  bulkDeleteCustomers
);


// DELETE

router.delete(
  "/:id",
  protect,
  deleteCustomer
);

module.exports = router;