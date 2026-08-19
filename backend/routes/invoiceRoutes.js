const express = require("express");
const router = express.Router();

const protect = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const {
  createDocument,
  getDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  convertToInvoice,
  downloadPdf,
} = require("../controllers/invoiceController");

// ================= CREATE (Quotation or Invoice) =================
// Quotation/Invoice generation lives on the USER panel only — admins
// (super_admin) do not generate these, matching the sidebar which only
// shows this section to regular users.
router.post("/", protect, roleMiddleware("user"), createDocument);

// ================= LIST (?docType=quotation|invoice) =================
router.get("/", protect, roleMiddleware("user"), getDocuments);

// ================= CONVERT QUOTATION -> INVOICE =================
// Registered before "/:id" so "convert" segment below never collides.
router.post("/:id/convert", protect, roleMiddleware("user"), convertToInvoice);

// ================= DOWNLOAD / VIEW PDF =================
router.get("/:id/pdf", protect, roleMiddleware("user"), downloadPdf);

// ================= GET SINGLE =================
router.get("/:id", protect, roleMiddleware("user"), getDocument);

// ================= UPDATE =================
router.put("/:id", protect, roleMiddleware("user"), updateDocument);

// ================= DELETE =================
router.delete("/:id", protect, roleMiddleware("user"), deleteDocument);

module.exports = router;
