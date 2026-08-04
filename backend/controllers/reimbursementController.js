const Reimbursement =
require("../models/reimbursementModel");

const cloudinary =
require("../config/cloudinary");


// ================= CREATE REIMBURSEMENT =================

const createReimbursement =
async (req, res) => {

  try {

    const {
      companyName,
      date,
      from,
      to,
      description,
      amount,
    } = req.body;

    if (
      !companyName ||
      !date ||
      !from ||
      !to
    ) {

      return res.status(400).json({

        success: false,

        message:
        "Company Name, Date, From and To are required",
      });
    }

    const reimbursement =
    await Reimbursement.create({

      companyName,
      date,
      from,
      to,
      description: description || "",
      amount: Number(amount) || 0,

      // Every new claim starts pending, waiting on admin approval
      status: "Pending",

      // multer-storage-cloudinary attaches these when a file
      // is uploaded via upload.single("billAttachment")
      billUrl:
      req.file?.path || "",

      billPublicId:
      req.file?.filename || "",

      createdBy:
      req.user._id,
    });

    res.status(201).json({

      success: true,

      message:
      "Reimbursement submitted successfully",

      reimbursement,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      message:
      "Server Error",
    });
  }
};


// ================= GET MY REIMBURSEMENTS =================

const getMyReimbursements =
async (req, res) => {

  try {

    const reimbursements =
    await Reimbursement.find({

      createdBy:
      req.user._id,

    }).sort({ createdAt: -1 });

    res.json({

      success: true,

      reimbursements,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      message:
      "Server Error",
    });
  }
};


// ================= GET ALL REIMBURSEMENTS (ADMIN) =================
// Used by the "Closed Leads & Reimbursements" admin section so admins
// can see every employee's reimbursement claims in one place.

const getAllReimbursements =
async (req, res) => {

  try {

    const reimbursements =
    await Reimbursement.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json({

      success: true,

      reimbursements,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      message:
      "Server Error",
    });
  }
};


// ================= APPROVE REIMBURSEMENT (ADMIN) =================
// Marks a pending claim as "Approved" so it is added to the employee's
// approved reimbursements (visible on payouts / payslip calculations).

const approveReimbursement =
async (req, res) => {

  try {

    const reimbursement =
    await Reimbursement.findById(req.params.id);

    if (!reimbursement) {

      return res.status(404).json({

        success: false,

        message:
        "Reimbursement not found",
      });
    }

    if (reimbursement.status === "Approved") {

      return res.status(400).json({

        success: false,

        message:
        "This reimbursement is already approved",
      });
    }

    reimbursement.status = "Approved";
    reimbursement.reviewedBy = req.user._id;
    reimbursement.reviewedAt = new Date();
    reimbursement.adminRemark = req.body?.adminRemark || "";

    await reimbursement.save();

    res.json({

      success: true,

      message:
      "Reimbursement approved and added successfully",

      reimbursement,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      message:
      "Server Error",
    });
  }
};


// ================= REJECT REIMBURSEMENT (ADMIN) =================

const rejectReimbursement =
async (req, res) => {

  try {

    const reimbursement =
    await Reimbursement.findById(req.params.id);

    if (!reimbursement) {

      return res.status(404).json({

        success: false,

        message:
        "Reimbursement not found",
      });
    }

    if (reimbursement.status === "Approved") {

      return res.status(400).json({

        success: false,

        message:
        "An already approved reimbursement cannot be rejected",
      });
    }

    reimbursement.status = "Rejected";
    reimbursement.reviewedBy = req.user._id;
    reimbursement.reviewedAt = new Date();
    reimbursement.adminRemark = req.body?.adminRemark || "";

    await reimbursement.save();

    res.json({

      success: true,

      message:
      "Reimbursement rejected",

      reimbursement,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      message:
      "Server Error",
    });
  }
};


// ================= UPDATE REIMBURSEMENT =================
// Lets an employee edit their own claim (only while it is not yet
// Approved — an approved claim is locked, same rule as delete).
// A new bill file is optional; if provided it replaces the old one
// on Cloudinary, otherwise the existing bill stays untouched.

const updateReimbursement =
async (req, res) => {

  try {

    const reimbursement =
    await Reimbursement.findOne({

      _id: req.params.id,

      // A user can only edit their own reimbursement claims
      createdBy:
      req.user._id,
    });

    if (!reimbursement) {

      return res.status(404).json({

        success: false,

        message:
        "Reimbursement not found",
      });
    }

    if (reimbursement.status === "Approved") {

      return res.status(400).json({

        success: false,

        message:
        "Approved reimbursements cannot be edited",
      });
    }

    const {
      companyName,
      date,
      from,
      to,
      description,
      amount,
    } = req.body;

    if (
      !companyName ||
      !date ||
      !from ||
      !to
    ) {

      return res.status(400).json({

        success: false,

        message:
        "Company Name, Date, From and To are required",
      });
    }

    reimbursement.companyName = companyName;
    reimbursement.date = date;
    reimbursement.from = from;
    reimbursement.to = to;
    reimbursement.description = description || "";
    reimbursement.amount = Number(amount) || 0;

    // A previously rejected claim goes back to Pending once the
    // employee edits and resubmits it, so the admin sees it again.
    if (reimbursement.status === "Rejected") {
      reimbursement.status = "Pending";
      reimbursement.reviewedBy = null;
      reimbursement.reviewedAt = null;
      reimbursement.adminRemark = "";
    }

    // Only touch the bill if a new file was uploaded
    if (req.file) {

      if (reimbursement.billPublicId) {

        try {

          await cloudinary.uploader.destroy(
            reimbursement.billPublicId,
            { resource_type: "auto" }
          );

        } catch (cloudErr) {

          console.log(cloudErr);
        }
      }

      reimbursement.billUrl = req.file.path || "";
      reimbursement.billPublicId = req.file.filename || "";
    }

    await reimbursement.save();

    res.json({

      success: true,

      message:
      "Reimbursement updated successfully",

      reimbursement,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      message:
      "Server Error",
    });
  }
};


// ================= DELETE REIMBURSEMENT =================

const deleteReimbursement =
async (req, res) => {

  try {

    const reimbursement =
    await Reimbursement.findOne({

      _id: req.params.id,

      // A user can only delete their own reimbursement claims
      createdBy:
      req.user._id,
    });

    if (!reimbursement) {

      return res.status(404).json({

        success: false,

        message:
        "Reimbursement not found",
      });
    }

    if (reimbursement.status === "Approved") {

      return res.status(400).json({

        success: false,

        message:
        "Approved reimbursements cannot be deleted",
      });
    }

    // Best-effort cleanup of the uploaded bill on Cloudinary.
    // If this fails (e.g. already removed), we still delete the
    // record so the user isn't stuck with a broken row.
    if (reimbursement.billPublicId) {

      try {

        await cloudinary.uploader.destroy(
          reimbursement.billPublicId,
          { resource_type: "auto" }
        );

      } catch (cloudErr) {

        console.log(cloudErr);
      }
    }

    await reimbursement.deleteOne();

    res.json({

      success: true,

      message:
      "Reimbursement deleted successfully",
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      message:
      "Server Error",
    });
  }
};


module.exports = {

  createReimbursement,
  getMyReimbursements,
  getAllReimbursements,
  approveReimbursement,
  rejectReimbursement,
  updateReimbursement,
  deleteReimbursement,
};