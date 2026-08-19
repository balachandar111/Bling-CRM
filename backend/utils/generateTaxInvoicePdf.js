// ================= TAX INVOICE / QUOTATION PDF GENERATOR =================
// Renders a PDF that matches the official Bling Tech Connect invoice
// layout: company letterhead + logo, doc # / date / terms / due date /
// place of supply, Bill To / Ship To boxes, item table with HSN/SAC,
// Qty, Rate, CGST %/Amt, SGST %/Amt, Amount columns, totals box,
// amount in words, notes and signature line.
//
// Works for both docType "invoice" (renders "TAX INVOICE") and
// "quotation" (renders "QUOTATION"). Returns a Buffer.

const PDFDocument = require("pdfkit");
const path = require("path");
// ================= INVOICE-SPECIFIC "TOTAL IN WORDS" =================
// Kept local (rather than reusing the shared numberToWords helper used by
// payslips) so we can match the official template's exact wording:
// "Indian Rupee <amount in words> Only", with a hyphen joining tens/ones
// (e.g. "Forty-Nine Thousand"), instead of the payslip's "Rupees ... Only".
const INV_ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const INV_TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
];

function invTwoDigits(n) {
  if (n < 20) return INV_ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return `${INV_TENS[t]}${o ? "-" + INV_ONES[o] : ""}`;
}

function invThreeDigits(n) {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  let out = "";
  if (h) out += `${INV_ONES[h]} Hundred`;
  if (rest) out += `${out ? " " : ""}${invTwoDigits(rest)}`;
  return out;
}

function invNumberToWords(num) {
  num = Math.floor(Math.abs(Number(num) || 0));
  if (num === 0) return "Zero";

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = num;

  const parts = [];
  if (crore) parts.push(`${invThreeDigits(crore)} Crore`);
  if (lakh) parts.push(`${invThreeDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${invThreeDigits(thousand)} Thousand`);
  if (hundred) parts.push(invThreeDigits(hundred));

  return parts.join(" ").trim();
}

const invoiceAmountInWords = (num) =>
  `Indian Rupee ${invNumberToWords(Math.round(Number(num) || 0))} Only`;

const COMPANY_NAME = "Bling Tech Connect OPC PVT LTD";
const COMPANY_ADDRESS_LINES = [
  "SF 207/17B, SRI BALAJI NAGAR",
  "SECOND STREET, SREENIKETHAN E BLOCK, PUZHAL",
  "Chennai Tamil Nadu 600066",
  "India",
];
const COMPANY_GSTIN = "GSTIN 33AAMCB4169Q1Z1";
const COMPANY_PHONE = "9342180385";
const COMPANY_EMAIL = "blingrewards4@gmail.com";
const COMPANY_WEBSITE = "www.blingtechconnect.com";

const LOGO_URL =
  "https://res.cloudinary.com/ds4i8pujs/image/upload/v1779687977/bling_tech_logo_h7rc1m.png";

// PDFKit's built-in Helvetica font (WinAnsiEncoding) has no glyph for the
// Indian Rupee sign (₹, U+20B9) — it silently drops it. DejaVu Sans does
// include it, so it's bundled here and registered under these two names,
// used ONLY for the ₹-prefixed amount text on the Total / Balance Due rows.
// Every other piece of text keeps using Helvetica so the layout still
// matches the reference template exactly.
const RUPEE_FONT_REGULAR = "DejaVuSans";
const RUPEE_FONT_BOLD = "DejaVuSans-Bold";
const RUPEE_FONT_REGULAR_PATH = path.join(__dirname, "fonts", "DejaVuSans.ttf");
const RUPEE_FONT_BOLD_PATH = path.join(__dirname, "fonts", "DejaVuSans-Bold.ttf");

const money = (n) =>
  (Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const qtyFmt = (n) =>
  (Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (d) => {
  if (!d) return "-";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "-";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

// ================= LOGO (fetched once, cached in memory) =================
let cachedLogoBuffer = null;
let logoFetchPromise = null;

function getLogoBuffer() {
  if (cachedLogoBuffer) return Promise.resolve(cachedLogoBuffer);
  if (!logoFetchPromise) {
    logoFetchPromise = fetch(LOGO_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`Logo fetch failed with status ${res.status}`);
        return res.arrayBuffer();
      })
      .then((buf) => {
        cachedLogoBuffer = Buffer.from(buf);
        return cachedLogoBuffer;
      })
      .catch((err) => {
        console.error("Invoice logo could not be loaded:", err.message);
        logoFetchPromise = null;
        return null;
      });
  }
  return logoFetchPromise;
}

function generateTaxInvoicePdf(doc) {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const pdf = new PDFDocument({ size: "A4", margin: 0 });
        const chunks = [];

        // Register the Unicode-capable fonts so the ₹ symbol renders.
        try {
          pdf.registerFont(RUPEE_FONT_REGULAR, RUPEE_FONT_REGULAR_PATH);
          pdf.registerFont(RUPEE_FONT_BOLD, RUPEE_FONT_BOLD_PATH);
        } catch (fontErr) {
          console.error("Could not register ₹ font, falling back to Helvetica:", fontErr.message);
        }

        pdf.on("data", (chunk) => chunks.push(chunk));
        pdf.on("end", () => resolve(Buffer.concat(chunks)));
        pdf.on("error", reject);

        const {
          docType = "invoice",
          docNumber = "",
          date,
          dueDate,
          terms = "Due on Receipt",
          placeOfSupply = "",
          billTo = {},
          shipTo = {},
          items = [],
          subTotal = 0,
          cgstTotal = 0,
          sgstTotal = 0,
          grandTotal = 0,
          notes = "",
        } = doc;

        const isQuotation = docType === "quotation";
        const titleText = isQuotation ? "QUOTATION" : "TAX INVOICE";
        const numberLabel = isQuotation ? "#" : "#";

        // ================= PAGE / OUTER BOX GEOMETRY =================
        const pageWidth = 595.28;
        const pageHeight = 841.89;

        const left = 41;
        const right = 555; // outer box right edge
        const boxWidth = right - left;
        const boxTop = 41;
        // The outer box always spans nearly the full page (matches the
        // reference Zoho-style template, which keeps a fixed-height frame
        // regardless of how many line items are present) with the footer
        // sitting outside it near the very bottom of the page.
        const boxBottom = pageHeight - 95;

        const pad = 8; // inner padding from the box border to content
        const contentLeft = left + pad;
        const contentRight = right - pad;
        const contentWidth = contentRight - contentLeft;

        let y = boxTop + pad;

        // ================= HEADER: LOGO + COMPANY DETAILS + TITLE =================
        const logoWidth = 95;
        const logoHeight = 62;

        const logoBuffer = await getLogoBuffer();
        if (logoBuffer) {
          try {
            pdf.image(logoBuffer, contentLeft, y, {
              fit: [logoWidth, logoHeight],
              align: "left",
              valign: "top",
            });
          } catch (imgErr) {
            console.error("Failed to draw invoice logo:", imgErr.message);
          }
        }

        const infoX = contentLeft + logoWidth + 12;
        const infoWidth = contentRight - 150 - infoX;

        pdf.fontSize(12.5).font("Helvetica-Bold").fillColor("#000").text(COMPANY_NAME, infoX, y, {
          width: infoWidth,
        });

        let infoY = y + 16;
        pdf.fontSize(8).font("Helvetica").fillColor("#000");
        COMPANY_ADDRESS_LINES.forEach((line) => {
          pdf.text(line, infoX, infoY, { width: infoWidth });
          infoY += 9.5;
        });
        pdf.text(COMPANY_GSTIN, infoX, infoY, { width: infoWidth });
        infoY += 9.5;
        pdf.text(COMPANY_PHONE, infoX, infoY, { width: infoWidth });
        infoY += 9.5;
        pdf.text(COMPANY_EMAIL, infoX, infoY, { width: infoWidth });
        infoY += 9.5;
        pdf.text(COMPANY_WEBSITE, infoX, infoY, { width: infoWidth });
        infoY += 9.5;

        // Big title, right-aligned, top of header
        pdf
          .fontSize(23)
          .font("Helvetica")
          .fillColor("#000")
          .text(titleText, contentRight - 160, y + 6, { width: 160, align: "right" });

        y = Math.max(y + logoHeight, infoY) + 10;

        // ================= DOC INFO STRIP =================
        pdf.moveTo(left, y).lineTo(right, y).lineWidth(1).strokeColor("#000").stroke();
        y += 5;

        const metaLeftLabelW = 62;
        const metaLeftX = contentLeft;
        const metaLeftValX = metaLeftX + metaLeftLabelW;
        const metaRightLabelW = 78;
        const metaRightX = contentRight - 230;
        const metaRightValX = metaRightX + metaRightLabelW;

        const leftMeta = [
          [numberLabel, docNumber],
          [isQuotation ? "Quotation Date" : "Invoice Date", formatDate(date)],
          ["Terms", terms || "-"],
          [isQuotation ? "Valid Until" : "Due Date", formatDate(dueDate || date)],
        ];

        pdf.fontSize(8.5);
        let metaY = y;
        leftMeta.forEach(([label, value]) => {
          pdf.font("Helvetica-Bold").fillColor("#000").text(label, metaLeftX, metaY, { width: metaLeftLabelW });
          pdf.font("Helvetica").text(`: ${value}`, metaLeftValX, metaY, {
            width: metaRightX - metaLeftValX - 10,
          });
          metaY += 13;
        });

        pdf
          .font("Helvetica-Bold")
          .text("Place Of Supply", metaRightX, y, { width: metaRightLabelW });
        pdf.font("Helvetica").text(`: ${placeOfSupply || "-"}`, metaRightValX, y, {
          width: contentRight - metaRightValX,
        });

        y = metaY + 3;
        pdf.moveTo(left, y).lineTo(right, y).lineWidth(1).strokeColor("#000").stroke();

        // ================= BILL TO / SHIP TO =================
        const colW = contentWidth / 2;
        const billX = contentLeft;
        const shipX = contentLeft + colW;

        const billToBarTop = y;
        const billToBarH = 15;
        pdf.rect(left, billToBarTop, boxWidth, billToBarH).fillColor("#f2f2f2").fill();
        pdf.fillColor("#000").font("Helvetica-Bold").fontSize(8.5);
        pdf.text("Bill To", billX, billToBarTop + 4);
        pdf.text("Ship To", shipX, billToBarTop + 4);
        y = billToBarTop + billToBarH + 5;

        const partyBlock = (party) => {
          const lines = [];
          if (party.name) lines.push(party.name);
          if (party.address) lines.push(...String(party.address).split("\n"));
          return lines;
        };

        const billLines = partyBlock(billTo);
        const shipLines = partyBlock(shipTo.name || shipTo.address ? shipTo : billTo);

        pdf.font("Helvetica").fontSize(8.5).fillColor("#000");
        const billBodyHeight = pdf.heightOfString(billLines.join("\n") || "-", { width: colW - 10 });
        const shipBodyHeight = pdf.heightOfString(shipLines.join("\n") || "-", { width: colW - 10 });

        pdf.text(billLines.join("\n") || "-", billX, y, { width: colW - 10 });
        pdf.text(shipLines.join("\n") || "-", shipX, y, { width: colW - 10 });

        let gstY = y + Math.max(billBodyHeight, shipBodyHeight) + 2;
        if (billTo.gstin) {
          pdf.text(`GSTIN ${billTo.gstin}`, billX, gstY, { width: colW - 10 });
        }
        if (shipTo.gstin) {
          pdf.text(`GSTIN ${shipTo.gstin}`, shipX, gstY, { width: colW - 10 });
        }
        y = gstY + (billTo.gstin || shipTo.gstin ? 11 : 0) + 6;

        pdf.moveTo(left, y).lineTo(right, y).lineWidth(1).strokeColor("#000").stroke();

        // ================= ITEM TABLE =================
        // Two-tier header: row 1 has "#", "Item & Description", "HSN/SAC",
        // "Qty", "Rate" (row-spanning) plus "CGST" / "SGST" (col-spanning
        // over their %/Amt sub-columns) and "Amount" (row-spanning).
        const cols = [
          { key: "no", label: "#", width: 3, align: "left" },
          { key: "desc", label: "Item & Description", width: 28, align: "left" },
          { key: "hsn", label: "HSN\n/SAC", width: 9, align: "center" },
          { key: "qty", label: "Qty", width: 11, align: "center" },
          { key: "rate", label: "Rate", width: 10, align: "right" },
          { key: "cgstP", label: "%", width: 5, align: "center", group: "CGST" },
          { key: "cgstA", label: "Amt", width: 9, align: "right", group: "CGST" },
          { key: "sgstP", label: "%", width: 5, align: "center", group: "SGST" },
          { key: "sgstA", label: "Amt", width: 9, align: "right", group: "SGST" },
          { key: "amt", label: "Amount", width: 11, align: "right" },
        ];
        const naturalTotal = cols.reduce((s, c) => s + c.width, 0);
        const scale = boxWidth / naturalTotal;
        let xCursor = left;
        cols.forEach((c) => {
          c.x = xCursor;
          c.w = c.width * scale;
          xCursor += c.w;
        });

        const rowSpanCols = ["no", "desc", "hsn", "qty", "rate", "amt"];
        const tableHeaderTop = y;
        const headerRow1H = 14;
        const headerRow2H = 12;
        const headerH = headerRow1H + headerRow2H;

        pdf.rect(left, tableHeaderTop, boxWidth, headerH).fillColor("#f2f2f2").fill();
        pdf.fillColor("#000").font("Helvetica-Bold").fontSize(7.5);

        cols.forEach((c) => {
          if (rowSpanCols.includes(c.key)) {
            pdf.text(c.label, c.x + 2, tableHeaderTop + headerH / 2 - (c.label.includes("\n") ? 8 : 4), {
              width: c.w - 4,
              align: c.align,
            });
          }
        });
        // Grouped CGST / SGST headers (row 1) + %/Amt sub headers (row 2)
        const cgstCols = cols.filter((c) => c.group === "CGST");
        const sgstCols = cols.filter((c) => c.group === "SGST");
        const groupHeaderText = (groupCols, label) => {
          const gx = groupCols[0].x;
          const gw = groupCols.reduce((s, c) => s + c.w, 0);
          pdf.text(label, gx, tableHeaderTop + 3, { width: gw, align: "center" });
        };
        groupHeaderText(cgstCols, "CGST");
        groupHeaderText(sgstCols, "SGST");

        pdf.moveTo(cgstCols[0].x, tableHeaderTop + headerRow1H).lineTo(sgstCols[sgstCols.length - 1].x + sgstCols[sgstCols.length - 1].w, tableHeaderTop + headerRow1H).lineWidth(0.5).strokeColor("#999").stroke();

        pdf.font("Helvetica-Bold").fontSize(7.5);
        [...cgstCols, ...sgstCols].forEach((c) => {
          pdf.text(c.label, c.x + 2, tableHeaderTop + headerRow1H + 3, { width: c.w - 4, align: c.align });
        });

        y = tableHeaderTop + headerH;
        pdf.moveTo(left, y).lineTo(right, y).lineWidth(1).strokeColor("#000").stroke();

        pdf.font("Helvetica").fontSize(8);
        items.forEach((item, idx) => {
          const descText = item.description || "";
          const qtyDisplay = item.unit
            ? `${qtyFmt(item.qty)}\n${item.unit}`
            : qtyFmt(item.qty);
          const rowHeight = Math.max(
            18,
            pdf.heightOfString(descText, { width: cols[1].w - 4 }) + 8,
            pdf.heightOfString(qtyDisplay, { width: cols[3].w - 4 }) + 8
          );
          const rowTop = y;

          const values = {
            no: String(idx + 1),
            desc: descText,
            hsn: item.hsnSac || "-",
            qty: qtyDisplay,
            rate: money(item.rate),
            cgstP: `${item.cgstPercent || 0}%`,
            cgstA: money(item.cgstAmount),
            sgstP: `${item.sgstPercent || 0}%`,
            sgstA: money(item.sgstAmount),
            amt: money(item.amount),
          };

          cols.forEach((c) => {
            pdf.font("Helvetica").text(values[c.key], c.x + 2, rowTop + 4, {
              width: c.w - 4,
              align: c.align,
            });
          });

          y = rowTop + rowHeight;
          pdf.moveTo(left, y).lineTo(right, y).lineWidth(0.25).strokeColor("#ddd").stroke();
        });

        // Full column grid — vertical lines run continuously through both
        // header rows AND the item body, matching the reference template.
        const tableBodyBottom = y;
        pdf.lineWidth(0.4).strokeColor("#bbb");
        for (let i = 1; i < cols.length; i++) {
          pdf.moveTo(cols[i].x, tableHeaderTop).lineTo(cols[i].x, tableBodyBottom).stroke();
        }


        // outer table border
        pdf
          .lineWidth(1)
          .strokeColor("#000")
          .rect(left, tableHeaderTop, boxWidth, y - tableHeaderTop)
          .stroke();

        y += 12;

        // ================= TOTAL IN WORDS + TOTALS BOX =================
        const wordsWidth = contentWidth * 0.55;
        const totalsBoxRight = contentRight;
        const totalsLabelW = 95;
        const totalsBoxX = totalsBoxRight - 210;
        const totalsValueX = totalsBoxRight - 90;

        pdf.font("Helvetica-Bold").fontSize(8).fillColor("#000").text("Total In Words", contentLeft, y, { width: wordsWidth });
        y += 12;
        pdf
          .font("Helvetica-BoldOblique")
          .fontSize(9)
          .text(invoiceAmountInWords(grandTotal), contentLeft, y, { width: wordsWidth });
        const wordsBottomY = y + pdf.heightOfString(invoiceAmountInWords(grandTotal), { width: wordsWidth }) + 8;

        // Rate used for CGST/SGST rows, e.g. "CGST9 (9%)" as in the source template
        const firstCgstRate = items[0]?.cgstPercent ?? 9;
        const firstSgstRate = items[0]?.sgstPercent ?? 9;

        const totalsRows = [
          ["Sub Total", money(subTotal)],
          [`CGST${firstCgstRate} (${firstCgstRate}%)`, money(cgstTotal)],
          [`SGST${firstSgstRate} (${firstSgstRate}%)`, money(sgstTotal)],
        ];

        let totalsY = y - 12;
        pdf.font("Helvetica").fontSize(9).fillColor("#000");
        totalsRows.forEach(([label, value]) => {
          pdf.text(label, totalsBoxX, totalsY, { width: totalsValueX - totalsBoxX - 6 });
          pdf.text(value, totalsValueX, totalsY, { width: totalsBoxRight - totalsValueX, align: "right" });
          totalsY += 14;
        });

        pdf.moveTo(totalsBoxX, totalsY).lineTo(totalsBoxRight, totalsY).lineWidth(0.5).strokeColor("#999").stroke();
        totalsY += 5;

        // Notes label lines up with the "Total" row on the left column
        let notesY = totalsY - 2;
        if (notes) {
          pdf.font("Helvetica").fontSize(8).fillColor("#000").text("Notes", contentLeft, notesY);
        }

        pdf.font("Helvetica-Bold").fontSize(10);
        pdf.text("Total", totalsBoxX, totalsY, { width: totalsValueX - totalsBoxX - 6 });
        pdf.font(RUPEE_FONT_BOLD).fontSize(10);
        pdf.text(`\u20B9${money(grandTotal)}`, totalsValueX, totalsY, {
          width: totalsBoxRight - totalsValueX,
          align: "right",
        });
        totalsY += 17;
        notesY += 13;

        if (notes) {
          pdf.font("Helvetica").fontSize(8).fillColor("#000").text(notes, contentLeft, notesY, { width: wordsWidth });
        }

        if (!isQuotation) {
          pdf.font("Helvetica-Bold").fontSize(10);
          pdf.text("Balance Due", totalsBoxX, totalsY, { width: totalsValueX - totalsBoxX - 6 });
          pdf.font(RUPEE_FONT_BOLD).fontSize(10);
          pdf.text(`\u20B9${money(grandTotal)}`, totalsValueX, totalsY, {
            width: totalsBoxRight - totalsValueX,
            align: "right",
          });
          totalsY += 17;
        }


        y = Math.max(wordsBottomY, totalsY) + 30;

        // ================= SIGNATURE =================
        const sigLineY = y + 30;
        pdf
          .moveTo(totalsBoxX, sigLineY)
          .lineTo(totalsBoxRight, sigLineY)
          .lineWidth(0.5)
          .strokeColor("#999")
          .stroke();
        pdf
          .font("Helvetica")
          .fontSize(8.5)
          .fillColor("#000")
          .text("Authorized Signature", totalsBoxX, sigLineY + 4, {
            width: totalsBoxRight - totalsBoxX,
            align: "center",
          });

        // ================= OUTER BORDER (fixed-height frame) =================
        pdf
          .lineWidth(1)
          .strokeColor("#000")
          .rect(left, boxTop, boxWidth, boxBottom - boxTop)
          .stroke();

        // ================= FOOTER (outside the frame) =================
        const footerY = pageHeight - 60;
        pdf
          .font("Helvetica")
          .fontSize(8)
          .fillColor("#555")
          .text("POWERED BY", left, footerY, { continued: true })
          .font("Helvetica-Bold")
          .fillColor("#333")
          .text("  BLING TECH CONNECT", { continued: false });

        pdf
          .font("Helvetica")
          .fontSize(8)
          .fillColor("#555")
          .text("1", right - 20, footerY, { width: 20, align: "right" });

        pdf.end();
      } catch (err) {
        reject(err);
      }
    })();
  });
}

module.exports = generateTaxInvoicePdf;