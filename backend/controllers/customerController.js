const Customer =
require("../models/customerModel");


// ================= CREATE CUSTOMER =================

const createCustomer =
async (req, res) => {

  try {

  const {

  name,
  email,
  phone,
  company,
  status,
  leadStage,
  investment,
  remark,
  followUpDate,
  priority,
  source,
  assignedTo,

  solution,
  product,

} = req.body;


    const customer =
await Customer.create({

  name,
  email,
  phone,
  company,
  status,
  leadStage,
  investment,
  remark,
  followUpDate,
  priority,
  source,
  assignedTo,
  solution,
  product,

  createdBy:
  req.user._id,
});
let customers;

const getCustomers =
async (req, res) => {

  try {

    let customers;

    // ================= SUPER ADMIN =================

    if (
      req.user.role ===
      "super_admin"
    ) {

      customers =
        await Customer.find()
        .sort({
          createdAt: -1,
        });

    } else {

      // ================= NORMAL USER =================

      customers =
        await Customer.find({

          createdBy:
          req.user._id,

        }).sort({
          createdAt: -1,
        });
    }

    res.json({

      success: true,

      customers,
    });

  } catch (error) {

    res.status(500).json({

      message:
      error.message,
    });
  }
};

    res.status(201).json({

      success: true,

      customer,
    });

  } catch (error) {

    res.status(500).json({

      message:
        error.message,
    });
  }
};



// ================= GET USER CUSTOMERS =================

const getCustomers =
async (req, res) => {

  try {

    let customers;

    // ================= SUPER ADMIN =================

    if (
      req.user.role ===
      "super_admin"
    ) {

      // FILTER BY USER
      if (req.query.userId) {

        customers =
          await Customer.find({

            createdBy:
            req.query.userId,

          })
          .populate(
            "createdBy",
            "name email role"
          )
          .sort({
            createdAt: -1,
          });

      } else {

        // ALL CUSTOMERS

        customers =
          await Customer.find()

          .populate(
            "createdBy",
            "name email role"
          )

          .sort({
            createdAt: -1,
          });
      }

    } else {

      // ================= NORMAL USER =================

      customers =
        await Customer.find({

          createdBy:
          req.user._id,

        }).sort({
          createdAt: -1,
        });
    }

    res.json({

      success: true,

      count:
        customers.length,

      customers,
    });

  } catch (error) {

    res.status(500).json({

      message:
      error.message,
    });
  }
};



// ================= GET SINGLE CUSTOMER =================

const getCustomer =
async (req, res) => {

  try {

    const customer =
      await Customer.findOne({

        _id:
          req.params.id,

        createdBy:
          req.user._id,

      });


    if (!customer) {

      return res.status(404).json({

        message:
          "Customer not found",
      });
    }


    res.json({

      success: true,

      customer,
    });

  } catch (error) {

    res.status(500).json({

      message:
        error.message,
    });
  }
};

// ================= BULK UPLOAD =================


// ================= BULK UPLOAD =================


const bulkUploadCustomers =
async (req, res) => {

  try {

    console.log(req.body);

    const customers =
      req.body.customers;

    if (
      !customers ||
      customers.length === 0
    ) {

      return res.status(400)
      .json({

        success: false,

        message:
        "No customers found",
      });
    }


    const formattedCustomers =
      customers.map(
        (customer) => ({

          name:
            customer.name || "",

          email:
            customer.email || "",

          phone:
            customer.phone || "",

          company:
            customer.company || "",

          status:
            customer.status || "lead",

          leadStage:
            customer.leadStage ||
            "Awareness",

          investment:
            customer.investment || "",

          remark:
            customer.remark || "",

          followUpDate:
            customer.followUpDate
            ? new Date(
                customer.followUpDate
              )
            : null,

          priority:
            customer.priority ||
            "Medium",

          source:
            customer.source || "",

          assignedTo:
            customer.assignedTo || "",

          solution:
            customer.solution || "",

          product:
            customer.product || "",

          createdBy:
            req.user._id,
       
        })
      );


    await Customer.insertMany(
      formattedCustomers
    );

    res.status(200).json({

      success: true,

      message:
      "Customers uploaded successfully",
    });

  } catch (error) {

    console.log(
      "BULK UPLOAD ERROR =>",
      error
    );

    res.status(500).json({

      success: false,

      message:
      error.message,
    });
  }
};

// ================= UPDATE CUSTOMER =================





// ================= DELETE CUSTOMER =================

const deleteCustomer =
async (req, res) => {

  try {

    const customer =
    await Customer.findById(
      req.params.id
    );

    if (!customer) {

      return res.status(404)
      .json({
        message:
        "Customer not found",
      });
    }

    await customer.deleteOne();

    res.json({
      success: true,
      message:
      "Customer deleted",
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message:
      "Server Error",
    });
  }
};
const updateCustomer =
async (req, res) => {

  try {

    const customer =
    await Customer.findById(
      req.params.id
    );

    if (!customer) {

      return res.status(404)
      .json({

        success: false,

        message:
        "Customer not found",
      });
    }


    // ================= SAVE OLD REMARK =================

    if (

      req.body.remark &&

      req.body.remark !==
      customer.remark
    ) {

      customer.lastRemarks.unshift({

        remark:
        customer.remark,

        updatedAt:
        new Date(),
      });
    }


    // ================= KEEP ONLY LAST 2 =================

    customer.lastRemarks =
    customer.lastRemarks.slice(0, 2);


    // ================= UPDATE FIELDS =================

    Object.keys(req.body)
    .forEach((key) => {

      customer[key] =
      req.body[key];
    });


    // ================= LAST MODIFIED =================

    customer.lastModified =
    new Date();


    await customer.save();

    res.status(200).json({

      success: true,

      customer,
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

module.exports = {

  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  bulkUploadCustomers,
};