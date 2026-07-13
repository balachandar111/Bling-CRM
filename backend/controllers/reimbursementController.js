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
      from,
      to,
      description,
    } = req.body;

    if (
      !companyName ||
      !from ||
      !to
    ) {

      return res.status(400).json({

        success: false,

        message:
        "Company Name, From and To are required",
      });
    }

    const reimbursement =
    await Reimbursement.create({

      companyName,
      from,
      to,
      description: description || "",

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
  deleteReimbursement,
};