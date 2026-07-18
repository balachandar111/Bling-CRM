// ================= PAYSLIP PDF GENERATOR =================
// Renders a payslip PDF that matches the official
// "BLING TECH CONNECT (OPC) PRIVATE LIMITED" payslip layout:
// company letterhead, month/year title, employee + bank details
// grid, earnings/deductions table, net pay and amount in words.
//
// Returns a Buffer (in-memory), so the caller can stream it
// straight to Cloudinary / disk without touching the filesystem.

const PDFDocument = require("pdfkit");
const { amountInWords } = require("./numberToWords");

const COMPANY_NAME = "BLING TECH CONNECT (OPC) PRIVATE LIMITED";
const COMPANY_ADDRESS =
  "11-14, Thiru Vi Ka Industrial Estate, Saidapet, Chennai, Greater Chennai, Tamil Nadu 600032";

const LOGO_URL =
  "https://res.cloudinary.com/ds4i8pujs/image/upload/v1779687977/bling_tech_logo_h7rc1m.png";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const money = (n) => (Number(n) || 0).toLocaleString("en-IN");

// measures text width in a given font/size using the doc's own metrics
function measureWidth(doc, text, font, size) {
  doc.font(font).fontSize(size);
  return doc.widthOfString(String(text ?? ""));
}

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
        console.error("Payslip logo could not be loaded:", err.message);
        logoFetchPromise = null; // allow a retry on the next call
        return null;
      });
  }
  return logoFetchPromise;
}

function generatePayslipPdf(payslip) {
  return new Promise((resolve, reject) => {
    (async () => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const {
        employee = {},
        month,
        year,
        effectiveWorkDays,
        lop,
        location,
        bankName,
        bankAccountNo,
        ifscCode,
        panNumber,
        pfNo,
        pfUan,
        designation,
        department,
        employeeCode,
        earnings = {},
        deductions = {},
        totalEarnings = 0,
        totalDeductions = 0,
        netPay = 0,
      } = payslip;

      const monthLabel = MONTH_NAMES[(Number(month) || 1) - 1] || "";
      const left = 40;
      const right = 555; // page width (595) - margin (40)
      const boxWidth = right - left;

      // ================= PRINT DATE =================
      doc
        .fontSize(8)
        .fillColor("#333")
        .text(`Print Date: ${new Date().toLocaleString("en-IN", { hour12: true })}`, left, 30);

      let y = 50;
      const boxTop = y;

      // ================= COMPANY HEADER (logo + name/address) =================
      const logoWidth = 95;
      const logoHeight = 55;
      const logoX = left + 8;
      const logoY = boxTop + 4;

      const logoBuffer = await getLogoBuffer();
      if (logoBuffer) {
        try {
          doc.image(logoBuffer, logoX, logoY, {
            fit: [logoWidth, logoHeight],
            align: "center",
            valign: "center",
          });
        } catch (imgErr) {
          console.error("Failed to draw payslip logo:", imgErr.message);
        }
      }

      const headerX = logoX + logoWidth + 12;
      const headerWidth = right - headerX;

      doc
        .fontSize(14)
        .fillColor("#000")
        .font("Helvetica-Bold")
        .text(COMPANY_NAME, headerX, y + 12, { width: headerWidth, align: "center" });

      doc
        .fontSize(8)
        .font("Helvetica")
        .text(COMPANY_ADDRESS, headerX, y + 30, { width: headerWidth, align: "center" });

      y += 55;
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(`Payslip for the month of ${monthLabel} ${year}`, left, y, {
          width: boxWidth,
          align: "center",
        });

      y += 22;
      doc.moveTo(left, y).lineTo(right, y).lineWidth(1).strokeColor("#000").stroke();

      // ================= EMPLOYEE / BANK DETAILS =================
      const midX = left + boxWidth / 2;
      const rowH = 14;
      const leftRows = [
        ["Name:", employee.name || "-"],
        ["Joining Date:", formatDate(employee.joiningDate)],
        ["Designation:", designation || employee.designation || "-"],
        ["Department:", department || employee.department || "-"],
        ["Location:", location || "-"],
        ["Effective Work Days:", String(effectiveWorkDays ?? "-")],
        ["LOP:", String(lop ?? 0)],
      ];
      const rightRows = [
        ["Employee No:", employeeCode || defaultEmployeeCode(employee)],
        ["Bank Name:", bankName || "-"],
        ["Bank Account No:", bankAccountNo || "-"],
        ["IFSC Code:", ifscCode || "-"],
        ["PAN Number:", panNumber || "-"],
        ["PF No:", pfNo || "-"],
        ["PF UAN:", pfUan || "-"],
      ];

      // Label column width adapts to the longest label actually used
      // (e.g. "Effective Work Days:" / "Bank Account No:"), with a small
      // buffer so bold text never touches the value column.
      const allLabels = [...leftRows, ...rightRows].map(([label]) => label);
      const LABEL_W =
        Math.max(...allLabels.map((label) => measureWidth(doc, label, "Helvetica-Bold", 9))) + 6;
      const VALUE_GAP = 8; // gap between label and value, shared by both sides
      const leftLabelX = left + 4;
      const leftValueX = leftLabelX + LABEL_W + VALUE_GAP;
      const rightLabelX = midX + 14;
      const rightValueX = rightLabelX + LABEL_W + VALUE_GAP;

      // Row height adapts to the value's actual wrapped height, so a long
      // value (e.g. a long designation) pushes the rows below it down
      // instead of overlapping them. rowH is the floor for single-line rows.
      const leftValueWidth = midX - leftValueX - 10;
      const rightValueWidth = right - rightValueX - 4;
      const rowHeightFor = (text, valueWidth) =>
        Math.max(rowH, doc.font("Helvetica").fontSize(9).heightOfString(String(text ?? ""), { width: valueWidth }) + 4);
      const leftRowHeights = leftRows.map(([, value]) => rowHeightFor(value, leftValueWidth));
      const rightRowHeights = rightRows.map(([, value]) => rowHeightFor(value, rightValueWidth));
      const cumulative = (heights) => {
        const offsets = [];
        let acc = 0;
        for (const h of heights) {
          offsets.push(acc);
          acc += h;
        }
        return { offsets, total: acc };
      };
      const leftCum = cumulative(leftRowHeights);
      const rightCum = cumulative(rightRowHeights);

      const detailsTop = y + 10;
      const maxRows = Math.max(leftRows.length, rightRows.length);
      for (let i = 0; i < maxRows; i++) {
        if (leftRows[i]) {
          const rowY = detailsTop + leftCum.offsets[i];
          doc.fontSize(9).font("Helvetica-Bold").text(leftRows[i][0], leftLabelX, rowY, { width: LABEL_W });
          doc.font("Helvetica").text(leftRows[i][1], leftValueX, rowY, { width: midX - leftValueX - 10 });
        }
        if (rightRows[i]) {
          const rowY = detailsTop + rightCum.offsets[i];
          doc.font("Helvetica-Bold").text(rightRows[i][0], rightLabelX, rowY, { width: LABEL_W });
          doc.font("Helvetica").text(rightRows[i][1], rightValueX, rowY, { width: right - rightValueX - 4 });
        }
      }

      // vertical divider between the two detail columns
      const detailsBottom = detailsTop + Math.max(leftCum.total, rightCum.total);
      doc.moveTo(midX, y).lineTo(midX, detailsBottom).lineWidth(0.5).strokeColor("#999").stroke();

      y = detailsBottom + 8;
      doc.moveTo(left, y).lineTo(right, y).lineWidth(1).strokeColor("#000").stroke();

      // ================= EARNINGS / DEDUCTIONS TABLE =================
      const earningRows = [
        ["BASIC", earnings.basic],
        ["HRA", earnings.hra],
        ["CONVEYANCE", earnings.conveyance],
        ["SPECIAL ALLOWANCE", earnings.specialAllowance],
        ["COMMUNICATION ALLOWANCE", earnings.communicationAllowance],
       
      ].filter(([, v]) => v !== undefined && v !== null);

      const deductionRows = [
        ["PROF TAX", deductions.profTax],
        ["INCOME TAX", deductions.incomeTax],
      ].filter(([, v]) => v !== undefined && v !== null);

      const tableTop = y + 10;
      // Amount column width adapts to the widest figure actually printed
      // (header "Amount", every earning/deduction, and both totals), with
      // a small buffer so digits never crowd the column edge.
      const allAmounts = [
        "Amount",
        ...earningRows.map(([, v]) => money(v)),
        ...deductionRows.map(([, v]) => money(v)),
        money(totalEarnings),
        money(totalDeductions),
      ];
      const AMT_W =
        Math.max(...allAmounts.map((text) => measureWidth(doc, text, "Helvetica-Bold", 9))) + 6;
      const colEarnLabel = leftLabelX;
      const colEarnAmt = midX - 4 - AMT_W;
      const colDeductLabel = rightLabelX;
      const colDeductAmt = right - 4 - AMT_W;

      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("Earnings", colEarnLabel, tableTop, { width: colEarnAmt - colEarnLabel })
        .text("Amount", colEarnAmt, tableTop, { width: AMT_W, align: "right" })
        .text("Deductions", colDeductLabel, tableTop, { width: colDeductAmt - colDeductLabel })
        .text("Amount", colDeductAmt, tableTop, { width: AMT_W, align: "right" });

      let tableY = tableTop + 20;
      doc.moveTo(left, tableY - 5).lineTo(right, tableY - 5).lineWidth(0.5).strokeColor("#999").stroke();

      const tableRowH = 19;
      const maxTableRows = Math.max(earningRows.length, deductionRows.length);
      doc.font("Helvetica").fontSize(9);
      for (let i = 0; i < maxTableRows; i++) {
        const rowY = tableY + i * tableRowH;
        if (earningRows[i]) {
          doc.font("Helvetica-Bold").text(earningRows[i][0], colEarnLabel, rowY, { width: colEarnAmt - colEarnLabel });
          doc.font("Helvetica").text(money(earningRows[i][1]), colEarnAmt, rowY, { width: AMT_W, align: "right" });
        }
        if (deductionRows[i]) {
          doc.font("Helvetica-Bold").text(deductionRows[i][0], colDeductLabel, rowY, { width: colDeductAmt - colDeductLabel });
          doc.font("Helvetica").text(money(deductionRows[i][1]), colDeductAmt, rowY, { width: AMT_W, align: "right" });
        }
      }

      doc.moveTo(midX, tableTop - 3).lineTo(midX, tableY + maxTableRows * tableRowH).lineWidth(0.5).strokeColor("#999").stroke();

      y = tableY + maxTableRows * tableRowH + 4;
      doc.moveTo(left, y).lineTo(right, y).lineWidth(1).strokeColor("#000").stroke();

      // ================= TOTALS =================
      y += 8;
      doc.font("Helvetica-Bold").fontSize(9);
      doc.text("Total Earnings", colEarnLabel, y, { width: colEarnAmt - colEarnLabel });
      doc.text(money(totalEarnings), colEarnAmt, y, { width: AMT_W, align: "right" });
      doc.text("Total Deductions", colDeductLabel, y, { width: colDeductAmt - colDeductLabel });
      doc.text(money(totalDeductions), colDeductAmt, y, { width: AMT_W, align: "right" });

      y += 18;
      doc.moveTo(left, y).lineTo(right, y).lineWidth(1).strokeColor("#000").stroke();

      // ================= NET PAY =================
      y += 10;
      doc.fontSize(11).font("Helvetica-Bold").text("Net Pay for the Month", left + 4, y);
      doc.fontSize(12).text(money(netPay), right - 150 - 4, y, { width: 150, align: "right" });

      y += 20;
      doc
        .fontSize(9)
        .font("Helvetica-Oblique")
        .text(`(${amountInWords(netPay)})`, left + 4, y, { width: boxWidth - 8 });

      y += 20;
      const boxBottom = y;
      doc
        .lineWidth(1)
        .strokeColor("#000")
        .rect(left, boxTop, boxWidth, boxBottom - boxTop)
        .stroke();

      // ================= FOOTER =================
      doc
        .fontSize(8)
        .font("Helvetica-Oblique")
        .fillColor("#333")
        .text("This is a system generated payslip and does not require signature.", left, boxBottom + 12, {
          width: boxWidth,
          align: "center",
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
    })();
  });
}

function formatDate(d) {
  if (!d) return "-";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function defaultEmployeeCode(employee) {
  if (!employee || !employee._id) return "-";
  return `BL${employee._id.toString().slice(-4).toUpperCase()}`;
}

module.exports = generatePayslipPdf;