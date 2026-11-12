// ================= BOTIFY - DYNAMIC TEMPLATE SENDER =================
// Used by WhatsApp Marketing. Unlike utils/botifyWhatsapp.js (which is fixed
// to BOTIFY_TEMPLATE_NAME for lead create/update), this takes the template
// name entered by the user on the Marketing screen.
//
// Uses from .env:  BOTIFY_API_KEY, BOTIFY_API_URL (optional),
//                  BOTIFY_CATEGORY (default category), BOTIFY_DEFAULT_COUNTRY_CODE

const { formatPhone } = require("./botifyWhatsapp");

const API_URL =
  process.env.BOTIFY_API_URL ||
  "https://login.botify.in/api/whatsapp/external";

// returns { ok: boolean, error?: string, data?: any }
const sendTemplate = async ({
  phone,
  templateName,
  templateData = [],
  category,
}) => {
  try {
    if (!process.env.BOTIFY_API_KEY) {
      return { ok: false, error: "BOTIFY_API_KEY missing in .env" };
    }

    const to = formatPhone(phone);
    if (!to) return { ok: false, error: "Invalid or missing phone number" };

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.BOTIFY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: "+" + to,
        type: "template",
        templateName,
        templateData,
        category: category || process.env.BOTIFY_CATEGORY || "MARKETING",
      }),
    });

    const raw = await response.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }

    if (!response.ok) {
      const msg =
        (data && (data.error || data.message)) ||
        `Botify error ${response.status}`;
      return { ok: false, error: String(msg) };
    }

    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

module.exports = { sendTemplate };