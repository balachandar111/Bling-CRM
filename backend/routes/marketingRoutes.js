const express = require("express");

const router = express.Router();

const protect = require("../middlewares/authMiddleware");

const {
  sendBulkEmail,
  sendBulkWhatsApp,
  testWhatsApp,
  previewEmail,
  sendTestEmail,
} = require("../controllers/marketingController");

// Available to every logged-in user (admin + users).
// Users can only message their own customers (enforced in the controller).

// live preview of the themed email (same HTML that gets sent)
router.post("/email/preview", protect, previewEmail);

// send a test copy to the logged-in user's own email
router.post("/email/test", protect, sendTestEmail);

router.post("/email", protect, sendBulkEmail);

router.post("/whatsapp", protect, sendBulkWhatsApp);

// one-message diagnostic: shows the exact Botify request + response
router.post("/whatsapp/test", protect, testWhatsApp);

module.exports = router;