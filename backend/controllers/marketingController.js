// ================= MARKETING (BULK EMAIL + BULK WHATSAPP) =================

const Customer = require("../models/customerModel");
const { sendMail, verifySmtp } = require("../utils/mailer");
const { sendTemplate } = require("../utils/botifyMarketing");
const { formatPhone } = require("../utils/botifyWhatsapp");
const { buildEmail } = require("../utils/emailTemplates");

const MAX_BULK = Number(process.env.MARKETING_MAX_BULK) || 200;
const CONCURRENCY = Number(process.env.MARKETING_CONCURRENCY) || 5;

// ---------- helpers ----------

const isValidEmail = (e) =>
  typeof e === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

// run async jobs with limited concurrency
const runPool = async (items, worker, limit = CONCURRENCY) => {
  const results = new Array(items.length);
  let index = 0;

  const runners = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (true) {
        const i = index++;
        if (i >= items.length) break;
        results[i] = await worker(items[i], i);
      }
    }
  );

  await Promise.all(runners);
  return results;
};

// Load the selected customers from the DB (never trust emails/phones sent
// by the browser). Normal users can only reach their own customers.
const loadCustomers = async (req, ids) => {
  const query = { _id: { $in: ids } };

  if (req.user.role !== "super_admin") {
    query.createdBy = req.user._id;
  }

  return Customer.find(query).select("name email phone company sector");
};

const validateIds = (ids) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    return "Please select at least one customer";
  }
  if (ids.length > MAX_BULK) {
    return `You can send to at most ${MAX_BULK} customers at a time. Please select fewer.`;
  }
  return null;
};

const summarize = (results) => ({
  total: results.length,
  sent: results.filter((r) => r.status === "sent").length,
  failed: results.filter((r) => r.status === "failed").length,
  skipped: results.filter((r) => r.status === "skipped").length,
});

// pick + length-limit the email design/content fields from the request
const cut = (v, n) => String(v === undefined || v === null ? "" : v).slice(0, n);

const readEmailOptions = (b = {}) => ({
  subject: cut(b.subject, 200),
  body: cut(b.body, 20000),
  signature: cut(b.signature, 2000),
  theme: cut(b.theme, 30),
  accent: cut(b.accent, 7),
  brandName: cut(b.brandName, 80),
  headline: cut(b.headline, 200),
  logoUrl: cut(b.logoUrl, 1000),
  heroUrl: cut(b.heroUrl, 1000),
  ctaText: cut(b.ctaText, 60),
  ctaUrl: cut(b.ctaUrl, 1000),
  footerNote: cut(b.footerNote, 500),
});

// ================= EMAIL: LIVE PREVIEW =================
// Renders the same HTML that will be sent, using one real selected customer
// (or sample data) so {{name}} / {{company}} show up filled in.

const previewEmail = async (req, res) => {
  try {
    const opts = readEmailOptions(req.body);
    let customer = { name: "Rahul", company: "Acme Corp" };

    if (req.body.customerId) {
      const found = await loadCustomers(req, [req.body.customerId]);
      if (found[0]) customer = found[0];
    }

    const { html, subject } = buildEmail(opts, customer);
    res.json({ success: true, html, subject });
  } catch (error) {
    console.log("EMAIL PREVIEW ERROR =>", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= EMAIL: SEND TEST TO MYSELF =================

const sendTestEmail = async (req, res) => {
  try {
    const opts = readEmailOptions(req.body);
    const to = req.user && req.user.email;

    if (!isValidEmail(to)) {
      return res.status(400).json({
        success: false,
        message: "Your account has no valid email address to send a test to.",
      });
    }

    if (!opts.subject.trim() || !opts.body.trim()) {
      return res.status(400).json({
        success: false,
        message: "Subject and body are required",
      });
    }

    let customer = { name: req.user.name || "Customer", company: "Your Company" };

    const { html, text, subject } = buildEmail(opts, customer);

    await sendMail({ to, subject: `[TEST] ${subject}`, html, text });

    res.json({ success: true, message: `Test email sent to ${to}` });
  } catch (error) {
    console.log("TEST EMAIL ERROR =>", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= BULK EMAIL =================

const sendBulkEmail = async (req, res) => {
  try {
    const { customerIds } = req.body;
    const opts = readEmailOptions(req.body);

    const idError = validateIds(customerIds);
    if (idError) {
      return res.status(400).json({ success: false, message: idError });
    }

    if (!opts.subject.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Subject is required" });
    }

    if (!opts.body.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Email body is required" });
    }

    // fail fast if SMTP login is wrong
    try {
      await verifySmtp();
    } catch (smtpError) {
      console.log("SMTP VERIFY ERROR =>", smtpError.message);
      return res.status(500).json({
        success: false,
        message: `SMTP connection failed: ${smtpError.message}`,
      });
    }

    const customers = await loadCustomers(req, customerIds);

    const results = await runPool(customers, async (customer) => {
      const base = {
        id: customer._id,
        name: customer.name || "",
        email: customer.email || "",
      };

      if (!isValidEmail(customer.email)) {
        return { ...base, status: "skipped", error: "No valid email" };
      }

      try {
        const { html, text, subject } = buildEmail(opts, customer);

        await sendMail({
          to: customer.email.trim(),
          subject,
          text,
          html,
        });

        return { ...base, status: "sent" };
      } catch (error) {
        console.log("EMAIL FAILED =>", customer.email, error.message);
        return { ...base, status: "failed", error: error.message };
      }
    });

    // ids that were selected but not found / not allowed
    const foundIds = new Set(customers.map((c) => String(c._id)));
    customerIds
      .filter((id) => !foundIds.has(String(id)))
      .forEach((id) =>
        results.push({
          id,
          name: "",
          email: "",
          status: "skipped",
          error: "Customer not found or not allowed",
        })
      );

    res.json({ success: true, ...summarize(results), results });
  } catch (error) {
    console.log("BULK EMAIL ERROR =>", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= BULK WHATSAPP =================

const sendBulkWhatsApp = async (req, res) => {
  try {
    const { customerIds, templateName, templateVars, category } = req.body;

    const idError = validateIds(customerIds);
    if (idError) {
      return res.status(400).json({ success: false, message: idError });
    }

    if (!templateName || typeof templateName !== "string" || !templateName.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Template name is required" });
    }

    // customer fields allowed as template variables, in the order entered
    const ALLOWED_VARS = ["name", "company", "phone", "email", "sector"];
    const vars = (Array.isArray(templateVars) ? templateVars : [])
      .map((v) => String(v).trim())
      .filter((v) => ALLOWED_VARS.includes(v));

    const customers = await loadCustomers(req, customerIds);

    const results = await runPool(customers, async (customer) => {
      const base = {
        id: customer._id,
        name: customer.name || "",
        phone: customer.phone || "",
      };

      if (!formatPhone(customer.phone)) {
        return { ...base, status: "skipped", error: "No valid phone number" };
      }

      // values are cleaned again inside the Botify sender (no new lines,
      // never empty) because WhatsApp rejects those parameters.
      const templateData = vars.map((key) =>
        String(customer[key] || (key === "name" ? "Customer" : "-"))
      );

      const result = await sendTemplate({
        phone: customer.phone,
        templateName: templateName.trim(),
        templateData,
        category:
          category === "UTILITY" || category === "MARKETING"
            ? category
            : undefined,
      });

      if (result.ok) return { ...base, status: "sent" };

      console.log("WHATSAPP BULK FAILED =>", customer.phone, result.error);
      return { ...base, status: "failed", error: result.error };
    });

    const foundIds = new Set(customers.map((c) => String(c._id)));
    customerIds
      .filter((id) => !foundIds.has(String(id)))
      .forEach((id) =>
        results.push({
          id,
          name: "",
          phone: "",
          status: "skipped",
          error: "Customer not found or not allowed",
        })
      );

    const summary = summarize(results);
    const firstFailure = results.find((r) => r.status === "failed");

    res.json({
      success: true,
      ...summary,
      // first Botify error, so the screen can show WHY messages failed
      firstError: firstFailure ? firstFailure.error : undefined,
      results,
    });
  } catch (error) {
    console.log("BULK WHATSAPP ERROR =>", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= WHATSAPP DIAGNOSTIC =================
// POST /api/marketing/whatsapp/test
// body: { phone, templateName, templateData: [], category }
// Sends ONE message and returns exactly what was sent to Botify and exactly
// what Botify answered, so the real failure reason is visible.
const testWhatsApp = async (req, res) => {
  try {
    const { sendBotifyTemplate } = require("../utils/botifyWhatsapp");
    const { phone, templateName, templateData, category } = req.body || {};

    const result = await sendBotifyTemplate({
      phone,
      templateName: templateName || process.env.BOTIFY_TEMPLATE_NAME || "thankyou",
      templateData: Array.isArray(templateData) ? templateData : [],
      category,
    });

    res.status(result.ok ? 200 : 502).json({
      success: result.ok,
      error: result.error,
      botifyHttpStatus: result.status,
      sentToBotify: result.sentPayload,
      botifyResponse: result.data,
      envCheck: {
        BOTIFY_API_KEY: !!process.env.BOTIFY_API_KEY,
        BOTIFY_API_URL: process.env.BOTIFY_API_URL || "(default)",
        BOTIFY_TEMPLATE_NAME: process.env.BOTIFY_TEMPLATE_NAME || "(default: thankyou)",
        BOTIFY_TEMPLATE_VARS: process.env.BOTIFY_TEMPLATE_VARS || "(empty)",
        BOTIFY_CATEGORY: process.env.BOTIFY_CATEGORY || "(default: MARKETING)",
        WHATSAPP_ENABLED: process.env.WHATSAPP_ENABLED || "(default: on)",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  testWhatsApp,
  sendBulkEmail,
  sendBulkWhatsApp,
  previewEmail,
  sendTestEmail,
};