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

        // LOGIN USER
        createdBy:
          req.user._id,
      });


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

    const customers =
      await Customer.find({

        createdBy:
          req.user._id,

      }).sort({
        createdAt: -1,
      });


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

const bulkUploadCustomers =
async (req, res) => {

  try {

    const { customers } = req.body;

    if (!customers ||
        customers.length === 0) {

      return res.status(400).json({
        message:
        "No customer data found",
      });
    }


    const formattedCustomers =
      customers.map((item) => ({

        name: item.name || "",

        email: item.email || "",

        phone: item.phone || "",

        company: item.company || "",

        status:
          item.status || "lead",

        leadStage:
          item.leadStage ||
          "Awareness",

        investment:
          item.investment || 0,

        remark:
          item.remark || "",

        followUpDate:
          item.followUpDate || null,

        priority:
          item.priority || "Medium",

        source:
          item.source || "Website",

        assignedTo:
          item.assignedTo || "",

        createdBy:
          req.user._id,
       }));


    await Customer.insertMany(
      formattedCustomers
    );


    res.status(201).json({

      success: true,

      message:
        "Bulk customers uploaded",
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });
  }
};

// ================= UPDATE CUSTOMER =================

const updateCustomer =
async (req, res) => {

  try {

    const customer =
      await Customer.findOneAndUpdate(

        {

          _id:
            req.params.id,

          createdBy:
            req.user._id,

        },

        req.body,

        {
          new: true,
        }
      );


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



// ================= DELETE CUSTOMER =================

const deleteCustomer =
async (req, res) => {

  try {

    const customer =
      await Customer.findOneAndDelete({

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

      message:
        "Customer deleted",
    });

  } catch (error) {

    res.status(500).json({

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