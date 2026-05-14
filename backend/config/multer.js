const multer =
require("multer");

const {
  CloudinaryStorage,
} = require(
  "multer-storage-cloudinary"
);

const cloudinary =
require("./cloudinary");


// ================= STORAGE =================

const storage =
new CloudinaryStorage({

  cloudinary,

  params: async (
    req,
    file
  ) => {

    // IMAGE

    if (
      file.fieldname ===
      "profileImage"
    ) {

      return {

        folder:
          "crm_profiles",

        resource_type:
          "image",

        allowed_formats: [

          "jpg",

          "png",

          "jpeg",
        ],
      };
    }

    // DOCUMENTS

    return {

      folder:
        "crm_documents",

      resource_type:
        "auto",
    };
  },
});


// ================= MULTER =================

const upload =
multer({

  storage,
});

module.exports =
upload;