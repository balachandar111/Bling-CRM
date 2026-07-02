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
  sector,
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

  // ================= ASSIGNED TO =================
  // If no user is explicitly assigned, fall back to the
  // creating user's own name so the lead is still attributable
  // and filterable by that user in the admin panel.
  assignedTo:
  assignedTo && assignedTo.trim() !== ""
  ? assignedTo
  : req.user?.name || "",

  solution,
  product,
  sector,
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
            customer.source || "Website",

          assignedTo:
            customer.assignedTo || "",

      

          product:
            customer.product || "",

          sector: 
            customer.sector || "",

          createdBy:
            req.user._id,
       
        })
      );


    // ================= DUPLICATE PHONE CHECK =================
    // Reject any customer whose phone number is already used by
    // another customer already in the DB, or repeats earlier in
    // this same upload batch. Every other (non-duplicate) customer
    // still gets uploaded.

    const rejectedCustomers = [];
    const acceptedCustomers = [];
    const seenPhonesInBatch = new Set();

    // Phone numbers present in this batch (ignore blank phones,
    // since there's nothing to de-duplicate against for those).
    const phonesToCheck = [
      ...new Set(
        formattedCustomers
          .map((c) => c.phone)
          .filter((phone) => phone && phone.trim() !== "")
      ),
    ];

    const existingCustomers = phonesToCheck.length
      ? await Customer.find({
          phone: { $in: phonesToCheck },
        }).select("phone")
      : [];

    const existingPhones = new Set(
      existingCustomers.map((c) => c.phone)
    );

    for (const customer of formattedCustomers) {
      const phone = customer.phone
        ? customer.phone.trim()
        : "";

      const isDuplicate =
        phone !== "" &&
        (existingPhones.has(phone) ||
          seenPhonesInBatch.has(phone));

      if (isDuplicate) {
        rejectedCustomers.push({
          name: customer.name,
          phone: customer.phone,
          reason: "Duplicate phone number",
        });
        continue;
      }

      if (phone !== "") {
        seenPhonesInBatch.add(phone);
      }

      acceptedCustomers.push(customer);
    }

    if (acceptedCustomers.length) {
      await Customer.insertMany(
        acceptedCustomers
      );
    }

    res.status(200).json({

      success: true,

      message:
        rejectedCustomers.length
          ? `${acceptedCustomers.length} customer(s) uploaded successfully, ${rejectedCustomers.length} duplicate customer(s) rejected`
          : "Customers uploaded successfully",

      insertedCount: acceptedCustomers.length,

      rejectedCount: rejectedCustomers.length,

      rejectedCustomers,
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


    // ================= KEEP FULL REMARK HISTORY =================
    // (No slice/limit — every edited remark is preserved permanently)


    // ================= ASSIGNED TO FALLBACK =================
    // If the field is present in the request but left blank,
    // fall back to the current user's name so the customer
    // stays attributable/filterable by a user in the admin panel.
    if (
      Object.prototype.hasOwnProperty.call(req.body, "assignedTo") &&
      (!req.body.assignedTo || req.body.assignedTo.trim() === "")
    ) {
      req.body.assignedTo = req.user?.name || customer.assignedTo || "";
    }


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