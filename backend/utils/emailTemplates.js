// ================= EMAIL THEMES / TEMPLATE BUILDER =================
// One builder used by BOTH the live preview and the real bulk send, so what
// you see in the preview is exactly what the customer receives.
// Layout is table based with inline styles (works in Gmail, Outlook, mobile).

const THEMES = {
  modern: {
    name: "Modern", accent: "#2563eb", pageBg: "#eef2ff", header: "gradient",
    font: "sans", radius: 16, btnRadius: 10, text: "#1f2937",
  },
  classic: {
    name: "Classic", accent: "#1d4ed8", pageBg: "#f4f4f5", header: "line",
    font: "sans", radius: 4, btnRadius: 4, text: "#1f2937",
  },
  elegant: {
    name: "Elegant", accent: "#b8860b", pageBg: "#f5f1e8", header: "dark",
    font: "serif", radius: 2, btnRadius: 2, text: "#292524",
  },
  festive: {
    name: "Festive", accent: "#ea580c", pageBg: "#fff7ed", header: "gradient",
    font: "sans", radius: 22, btnRadius: 999, text: "#431407",
  },
  fresh: {
    name: "Fresh", accent: "#059669", pageBg: "#ecfdf5", header: "solid",
    font: "sans", radius: 14, btnRadius: 8, text: "#1f2937",
  },
  minimal: {
    name: "Minimal", accent: "#111827", pageBg: "#ffffff", header: "none",
    font: "sans", radius: 0, btnRadius: 6, text: "#111827",
  },
};

const FONTS = {
  sans: "Arial, Helvetica, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
};

// ---------- small helpers ----------

const escapeHtml = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const isHex = (c) => typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c.trim());

// only http(s) links/images are allowed (blocks javascript: etc.)
const safeUrl = (u) => {
  const v = String(u || "").trim();
  return /^https?:\/\/[^\s"'<>]+$/i.test(v) ? v : "";
};

const hexToRgb = (hex) => {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};

const darken = (hex, pct) => {
  const [r, g, b] = hexToRgb(hex).map((v) =>
    Math.max(0, Math.round(v * (1 - pct)))
  );
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
};

// white or near-black text, whichever is readable on this colour
const readableOn = (hex) => {
  const [r, g, b] = hexToRgb(hex);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? "#111827" : "#ffffff";
};

// {{name}} / {{company}} ... -> customer values
const fill = (text, customer = {}) =>
  String(text || "").replace(/{{\s*(\w+)\s*}}/g, (_, key) => {
    const v = customer[key];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v);
    return key === "name" ? "Customer" : "";
  });

// inline formatting on already-escaped text
const inline = (escaped, accent) =>
  escaped
    .replace(
      /(https?:\/\/[^\s<]+)/g,
      `<a href="$1" style="color:${accent};text-decoration:underline">$1</a>`
    )
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

// plain text -> paragraphs, bullet lists (lines starting "- "), bold (**x**)
const formatBody = (text, accent, textColor) => {
  const blocks = String(text || "").replace(/\r/g, "").trim().split(/\n{2,}/);

  return blocks
    .filter((b) => b.trim())
    .map((block) => {
      const lines = block.split("\n");
      const isList = lines.every((l) => /^\s*[-•*]\s+/.test(l));

      if (isList) {
        const items = lines
          .map(
            (l) =>
              `<li style="margin:0 0 6px 0">${inline(
                escapeHtml(l.replace(/^\s*[-•*]\s+/, "")),
                accent
              )}</li>`
          )
          .join("");
        return `<ul style="margin:0 0 16px 0;padding-left:22px;color:${textColor}">${items}</ul>`;
      }

      return `<p style="margin:0 0 16px 0;color:${textColor}">${inline(
        escapeHtml(lines.join("\n")),
        accent
      ).replace(/\n/g, "<br>")}</p>`;
    })
    .join("");
};

// ---------- main builder ----------
// opts: { subject, body, signature, theme, accent, brandName, headline,
//         logoUrl, heroUrl, ctaText, ctaUrl, footerNote }

const buildEmail = (opts = {}, customer = {}) => {
  const theme = THEMES[opts.theme] || THEMES.modern;
  const accent = isHex(opts.accent) ? opts.accent.trim() : theme.accent;
  const font = FONTS[theme.font];
  const text = theme.text;
  const onAccent = readableOn(accent);

  const subject = fill(opts.subject, customer);
  const brandName = fill(opts.brandName, customer) || "BlingTechConnect";
  const headline = fill(opts.headline, customer);
  const bodyText = fill(opts.body, customer);
  const signature = fill(opts.signature, customer);
  const footerNote = fill(opts.footerNote, customer);
  const ctaText = fill(opts.ctaText, customer);
  const ctaUrl = safeUrl(opts.ctaUrl);
  const logoUrl = safeUrl(opts.logoUrl);
  const heroUrl = safeUrl(opts.heroUrl);

  // ----- header -----
  const brandInner = logoUrl
    ? `<img src="${logoUrl}" alt="${escapeHtml(brandName)}" style="display:block;max-height:46px;max-width:220px;border:0">`
    : `<span style="font-size:22px;font-weight:700;letter-spacing:.3px">${escapeHtml(brandName)}</span>`;

  let header = "";
  if (theme.header === "gradient") {
    header = `<tr><td bgcolor="${accent}" style="padding:26px 32px;background-color:${accent};background-image:linear-gradient(135deg,${accent},${darken(accent, 0.32)});color:${onAccent};font-family:${font}">${brandInner}</td></tr>`;
  } else if (theme.header === "solid") {
    header = `<tr><td bgcolor="${accent}" style="padding:24px 32px;background-color:${accent};color:${onAccent};font-family:${font}">${brandInner}</td></tr>`;
  } else if (theme.header === "dark") {
    header = `<tr><td bgcolor="#1c1917" align="center" style="padding:28px 32px;background-color:#1c1917;color:#ffffff;font-family:${font};border-bottom:3px solid ${accent}">${
      logoUrl
        ? `<img src="${logoUrl}" alt="${escapeHtml(brandName)}" style="display:inline-block;max-height:46px;max-width:220px;border:0">`
        : `<span style="font-size:22px;letter-spacing:3px;text-transform:uppercase">${escapeHtml(brandName)}</span>`
    }</td></tr>`;
  } else if (theme.header === "line") {
    header = `<tr><td style="padding:22px 32px;border-bottom:4px solid ${accent};color:${accent};font-family:${font}">${brandInner}</td></tr>`;
  } else {
    // minimal
    header = `<tr><td style="padding:28px 32px 0 32px;color:${text};font-family:${font}">${brandInner}</td></tr>`;
  }

  // ----- hero image -----
  const hero = heroUrl
    ? `<tr><td style="padding:0;line-height:0"><img src="${heroUrl}" alt="" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0"></td></tr>`
    : "";

  // ----- headline -----
  const headlineRow = headline
    ? `<tr><td style="padding:30px 32px 0 32px;font-family:${font}">
        <h1 style="margin:0;font-size:26px;line-height:1.3;color:${text}">${escapeHtml(headline)}</h1>
        ${
          theme.header === "none"
            ? ""
            : `<div style="width:54px;height:4px;background:${accent};margin-top:12px;border-radius:2px;font-size:0;line-height:0">&nbsp;</div>`
        }
      </td></tr>`
    : "";

  // ----- body -----
  const bodyRow = `<tr><td style="padding:${headline ? "20px" : "30px"} 32px 8px 32px;font-family:${font};font-size:15px;line-height:1.7;color:${text}">${formatBody(
    bodyText,
    accent,
    text
  )}</td></tr>`;

  // ----- call to action button -----
  const cta =
    ctaText && ctaUrl
      ? `<tr><td align="left" style="padding:8px 32px 24px 32px;font-family:${font}">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td align="center" bgcolor="${accent}" style="background-color:${accent};border-radius:${theme.btnRadius}px">
              <a href="${ctaUrl}" target="_blank" style="display:inline-block;padding:14px 30px;font-size:15px;font-weight:700;color:${onAccent};text-decoration:none;border-radius:${theme.btnRadius}px;font-family:${font}">${escapeHtml(ctaText)}</a>
            </td></tr></table>
        </td></tr>`
      : "";

  // ----- signature -----
  const sig = signature
    ? `<tr><td style="padding:8px 32px 28px 32px;font-family:${font};font-size:14px;line-height:1.6;color:${text}">
        <div style="border-top:1px solid #e5e7eb;padding-top:16px;color:#4b5563">${inline(
          escapeHtml(signature),
          accent
        ).replace(/\n/g, "<br>")}</div></td></tr>`
    : `<tr><td style="padding:0 0 12px 0;font-size:0;line-height:0">&nbsp;</td></tr>`;

  // ----- footer -----
  const footer = `<tr><td align="center" bgcolor="#f9fafb" style="padding:18px 32px;background-color:#f9fafb;border-top:1px solid #e5e7eb;font-family:${FONTS.sans};font-size:12px;line-height:1.6;color:#6b7280">${
    footerNote
      ? escapeHtml(footerNote).replace(/\n/g, "<br>") + "<br>"
      : ""
  }&copy; ${new Date().getFullYear()} ${escapeHtml(brandName)}</td></tr>`;

  const preheader = escapeHtml(bodyText.replace(/\s+/g, " ").slice(0, 110));

  const cardBorder =
    theme.header === "none" ? `border:1px solid #e5e7eb;` : "";

  const html = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${theme.pageBg}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${theme.pageBg}" style="background:${theme.pageBg}">
<tr><td align="center" style="padding:28px 12px">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:${theme.radius}px;overflow:hidden;${cardBorder}box-shadow:0 4px 18px rgba(0,0,0,.08)">
    ${header}
    ${hero}
    ${headlineRow}
    ${bodyRow}
    ${cta}
    ${sig}
    ${footer}
  </table>
</td></tr></table>
</body></html>`;

  // plain-text alternative (improves deliverability)
  const plain = [
    headline,
    bodyText,
    ctaText && ctaUrl ? `${ctaText}: ${ctaUrl}` : "",
    signature,
  ]
    .filter(Boolean)
    .join("\n\n");

  return { subject, html, text: plain };
};

const THEME_LIST = Object.entries(THEMES).map(([id, t]) => ({
  id,
  name: t.name,
  accent: t.accent,
}));

module.exports = { buildEmail, THEMES, THEME_LIST, fill };