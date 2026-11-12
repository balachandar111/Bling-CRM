// ================= BOTIFY WHATSAPP HELPER =================
// Single place that talks to the Botify external API.
//   - sendBotifyTemplate()  -> generic sender (used by lead messages AND bulk marketing)
//   - sendWhatsAppResponse()-> sends the fixed "response" template for a lead
//
// Required .env (set these in Vercel -> Project -> Settings -> Environment Variables):
//   BOTIFY_API_KEY=your_api_key
//   BOTIFY_TEMPLATE_NAME=response
// Optional:
//   BOTIFY_API_URL=https://login.botify.in/api/whatsapp/external
//   BOTIFY_CATEGORY=MARKETING          (or UTILITY - must match the approved template)
//   BOTIFY_TEMPLATE_VARS=name          (comma list: name,company,phone -> must match the
//                                       number of {{1}} {{2}} ... in the template.
//                                       Leave EMPTY only if the template has no variables)
//   BOTIFY_LANGUAGE=en                 (only sent when set, e.g. en / en_US)
//   BOTIFY_PHONE_PLUS=true             (set false if Botify wants 9198... without "+")
//   BOTIFY_DEFAULT_COUNTRY_CODE=91
//   BOTIFY_TIMEOUT_MS=15000
//   WHATSAPP_ENABLED=true              (set false to switch the feature off)

const API_URL = () =>
  clean(process.env.BOTIFY_API_URL) ||
  "https://login.botify.in/api/whatsapp/external";

// remove stray spaces / CR / LF / quotes that often sneak into env values
function clean(v) {
  return String(v === undefined || v === null ? "" : v)
    .replace(/[\r\n]/g, "")
    .replace(/^["']|["']$/g, "")
    .trim();
}

// Turn "98765 43210", "+91 98765-43210", "09876543210" etc.
// into "919876543210". Returns null if the number is unusable.
const formatPhone = (phone) => {
  if (phone === undefined || phone === null) return null;

  let digits = String(phone).replace(/\D/g, "");
  if (!digits) return null;

  const cc = clean(process.env.BOTIFY_DEFAULT_COUNTRY_CODE) || "91";

  // strip leading zeros (e.g. 09876543210)
  digits = digits.replace(/^0+/, "");

  // 10 digit local number -> add country code
  if (digits.length === 10) digits = cc + digits;

  // valid international length is 11-15 digits
  if (digits.length < 11 || digits.length > 15) return null;

  return digits;
};

// WhatsApp rejects template parameters that contain new lines / tabs /
// 4+ consecutive spaces, or that are empty. Clean every value.
const cleanParam = (value, fallback = "-") => {
  const s = String(value === undefined || value === null ? "" : value)
    .replace(/[\r\n\t]+/g, " ")
    .replace(/ {2,}/g, " ")
    .trim()
    .slice(0, 1000);
  return s || fallback;
};

// Build templateData array from the customer, based on BOTIFY_TEMPLATE_VARS
const buildTemplateData = (customer) => {
  const vars = clean(process.env.BOTIFY_TEMPLATE_VARS)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  return vars.map((key) =>
    cleanParam(customer && customer[key], key === "name" ? "Customer" : "-")
  );
};

// Botify can answer HTTP 200 and still report a failure in the body.
const bodyLooksFailed = (data) => {
  if (!data || typeof data !== "object") return false;
  if (data.success === false || data.ok === false) return true;
  const st = String(data.status === undefined ? "" : data.status).toLowerCase();
  if (["failed", "fail", "error", "false"].includes(st)) return true;
  if (data.error) return true;
  return false;
};

const errorText = (data, status) => {
  if (data && typeof data === "object") {
    const m =
      data.error || data.message || data.msg || data.detail || data.reason;
    if (m) return typeof m === "string" ? m : JSON.stringify(m);
    return JSON.stringify(data);
  }
  if (typeof data === "string" && data.trim()) return data.slice(0, 300);
  return `Botify error ${status}`;
};

// ---------- generic sender ----------
// returns { ok, error?, status?, data?, to? }  -- NEVER throws
const sendBotifyTemplate = async ({
  phone,
  templateName,
  templateData = [],
  category,
}) => {
  try {
    const apiKey = clean(process.env.BOTIFY_API_KEY);
    if (!apiKey) {
      return { ok: false, error: "BOTIFY_API_KEY missing in environment" };
    }

    const to = formatPhone(phone);
    if (!to) return { ok: false, error: "Invalid or missing phone number" };

    // Meta template names are always lowercase with no spaces
    const name = clean(templateName).toLowerCase().replace(/\s+/g, "_");
    if (!name) return { ok: false, error: "Template name is missing" };

    const usePlus = clean(process.env.BOTIFY_PHONE_PLUS) !== "false";

    const payload = {
      to: usePlus ? "+" + to : to,
      type: "template",
      templateName: name,
      templateData: (Array.isArray(templateData) ? templateData : []).map((v) =>
        cleanParam(v)
      ),
      category:
        clean(category) || clean(process.env.BOTIFY_CATEGORY) || "MARKETING",
    };

    const lang = clean(process.env.BOTIFY_LANGUAGE);
    if (lang) payload.language = lang;

    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      Number(process.env.BOTIFY_TIMEOUT_MS) || 15000
    );

    let response;
    try {
      response = await fetch(API_URL(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    const raw = await response.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }

    if (!response.ok || bodyLooksFailed(data)) {
      const error = errorText(data, response.status);
      // full detail in the server log so the real reason is visible
      console.log("BOTIFY FAILED =>", {
        httpStatus: response.status,
        sentPayload: payload,
        botifyResponse: data,
      });
      return { ok: false, error, status: response.status, data, to, sentPayload: payload };
    }

    console.log("BOTIFY OK =>", to, payload.templateName, data);
    return { ok: true, status: response.status, data, to, sentPayload: payload };
  } catch (error) {
    const msg =
      error && error.name === "AbortError"
        ? "Botify request timed out"
        : error.message;
    console.log("BOTIFY ERROR =>", msg);
    return { ok: false, error: msg };
  }
};

// ---------- lead create / update message ----------
// IMPORTANT: callers must `await` this. On Vercel (serverless) the function
// is frozen as soon as the HTTP response is sent, so a "fire and forget"
// call never finishes and the message is never sent.
// Never throws, so it can't break the CRM request.
const sendWhatsAppResponse = async (customer) => {
  try {
    if (clean(process.env.WHATSAPP_ENABLED) === "false") {
      return { ok: false, skipped: true, error: "WhatsApp disabled" };
    }

    const result = await sendBotifyTemplate({
      phone: customer && customer.phone,
      templateName: clean(process.env.BOTIFY_TEMPLATE_NAME) || "thankyou",
      templateData: buildTemplateData(customer),
      category: clean(process.env.BOTIFY_CATEGORY) || "MARKETING",
    });

    if (!result.ok) {
      console.log(
        "WHATSAPP (lead) NOT SENT =>",
        customer && customer.phone,
        result.error
      );
    }

    return result;
  } catch (error) {
    console.log("WHATSAPP ERROR =>", error.message);
    return { ok: false, error: error.message };
  }
};

module.exports = {
  sendWhatsAppResponse,
  sendBotifyTemplate,
  formatPhone,
  cleanParam,
};