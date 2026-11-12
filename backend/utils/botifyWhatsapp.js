// ================= BOTIFY WHATSAPP HELPER =================
// Sends the approved "response" template to a customer's WhatsApp
// number using the Botify external API.
//
// Required .env values:
//   BOTIFY_API_KEY=your_api_key
//   BOTIFY_TEMPLATE_NAME=response
// Optional:
//   BOTIFY_API_URL=https://login.botify.in/api/whatsapp/external
//   BOTIFY_CATEGORY=MARKETING          (or UTILITY - must match your template)
//   BOTIFY_TEMPLATE_VARS=name          (comma list: name,company,phone  -> leave empty if template has no {{1}} variables)
//   BOTIFY_DEFAULT_COUNTRY_CODE=91
//   WHATSAPP_ENABLED=true              (set false to switch the feature off)

const API_URL =
    process.env.BOTIFY_API_URL ||
    "https://login.botify.in/api/whatsapp/external";

// Turn "98765 43210", "+91 98765-43210", "09876543210" etc.
// into "919876543210". Returns null if the number is unusable.
const formatPhone = (phone) => {
    if (phone === undefined || phone === null) return null;

    let digits = String(phone).replace(/\D/g, "");
    if (!digits) return null;

    const cc = process.env.BOTIFY_DEFAULT_COUNTRY_CODE || "91";

    // strip leading zeros (e.g. 09876543210)
    digits = digits.replace(/^0+/, "");

    // 10 digit local number -> add country code
    if (digits.length === 10) digits = cc + digits;

    // valid international length is 11-15 digits
    if (digits.length < 11 || digits.length > 15) return null;

    return digits;
};

// Build templateData array from the customer, based on BOTIFY_TEMPLATE_VARS
const buildTemplateData = (customer) => {
    const vars = (process.env.BOTIFY_TEMPLATE_VARS || "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);

    return vars.map((key) => String(customer[key] || "Customer"));
};

const sendWhatsAppResponse = async (customer) => {
    try {
        if (process.env.WHATSAPP_ENABLED === "false") return;

        if (!process.env.BOTIFY_API_KEY) {
            console.log("WHATSAPP: BOTIFY_API_KEY missing in .env - skipped");
            return;
        }

        const to = formatPhone(customer && customer.phone);

        if (!to) {
            console.log(
                "WHATSAPP: invalid/missing phone, skipped ->",
                customer && customer.phone
            );
            return;
        }

        const payload = {
            // Botify expects the number with a leading "+"
            to: "+" + to,
            type: "template",
            templateName: process.env.BOTIFY_TEMPLATE_NAME || "response",
            templateData: buildTemplateData(customer),
            category: process.env.BOTIFY_CATEGORY || "MARKETING",
        };

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.BOTIFY_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }

        if (!response.ok) {
            console.log("WHATSAPP FAILED =>", response.status, data);
            return;
        }

        console.log("WHATSAPP SENT =>", to, data);
    } catch (error) {
        // never let a WhatsApp failure break the CRM request
        console.log("WHATSAPP ERROR =>", error.message);
    }
};

module.exports = { sendWhatsAppResponse, formatPhone };