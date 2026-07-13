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
  "5th Floor, Olympia Teknos, Plot No. 28, South Phase, Sidco Industrial Estate, Guindy, Chennai, Tamil Nadu 600032";

const LOGO_URL =
  "https://res.cloudinary.com/ds4i8pujs/image/upload/v1779687977/bling_tech_logo_h7rc1m.png";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const money = (n) => (Number(n) || 0).toLocaleString("en-IN");

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
      const padRowH = 20; // extra breathing room for Name & Joining Date
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
        ["PAN Number:", panNumber || "-"],
        ["PF No:", pfNo || "-"],
        ["PF UAN:", pfUan || "-"],
      ];

      // Name & Joining Date (indices 0 & 1) get extra padding below them;
      // every other row keeps the compact default height.
      const leftRowHeights = leftRows.map((_, i) => (i < 2 ? padRowH : rowH));
      const rightRowHeights = rightRows.map(() => rowH);
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
          doc.fontSize(9).font("Helvetica-Bold").text(leftRows[i][0], left + 4, rowY, { width: 110 });
          doc.font("Helvetica").text(leftRows[i][1], left + 119, rowY, { width: midX - left - 129 });
        }
        if (rightRows[i]) {
          const rowY = detailsTop + rightCum.offsets[i];
          doc.font("Helvetica-Bold").text(rightRows[i][0], midX + 14, rowY, { width: 110 });
          doc.font("Helvetica").text(rightRows[i][1], midX + 129, rowY, { width: right - (midX + 129) - 4 });
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
      const colEarnLabel = left + 4;
      const colEarnAmt = midX - 70;
      const colDeductLabel = midX + 14;
      const colDeductAmt = right - 60 - 4;

      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("Earnings", colEarnLabel, tableTop, { width: midX - left - 80 })
        .text("Amount", colEarnAmt, tableTop, { width: 70, align: "right" })
        .text("Deductions", colDeductLabel, tableTop, { width: right - colDeductLabel - 70 })
        .text("Amount", colDeductAmt, tableTop, { width: 60, align: "right" });

      let tableY = tableTop + 20;
      doc.moveTo(left, tableY - 5).lineTo(right, tableY - 5).lineWidth(0.5).strokeColor("#999").stroke();

      const tableRowH = 19;
      const maxTableRows = Math.max(earningRows.length, deductionRows.length);
      doc.font("Helvetica").fontSize(9);
      for (let i = 0; i < maxTableRows; i++) {
        const rowY = tableY + i * tableRowH;
        if (earningRows[i]) {
          doc.text(earningRows[i][0], colEarnLabel, rowY, { width: midX - left - 80 });
          doc.text(money(earningRows[i][1]), colEarnAmt, rowY, { width: 70, align: "right" });
        }
        if (deductionRows[i]) {
          doc.text(deductionRows[i][0], colDeductLabel, rowY, { width: right - colDeductLabel - 70 });
          doc.text(money(deductionRows[i][1]), colDeductAmt, rowY, { width: 60, align: "right" });
        }
      }

      doc.moveTo(midX, tableTop - 3).lineTo(midX, tableY + maxTableRows * tableRowH).lineWidth(0.5).strokeColor("#999").stroke();

      y = tableY + maxTableRows * tableRowH + 4;
      doc.moveTo(left, y).lineTo(right, y).lineWidth(1).strokeColor("#000").stroke();

      // ================= TOTALS =================
      y += 8;
      doc.font("Helvetica-Bold").fontSize(9);
      doc.text("Total Earnings", colEarnLabel, y, { width: midX - left - 80 });
      doc.text(money(totalEarnings), colEarnAmt, y, { width: 70, align: "right" });
      doc.text("Total Deductions", colDeductLabel, y, { width: right - colDeductLabel - 70 });
      doc.text(money(totalDeductions), colDeductAmt, y, { width: 60, align: "right" });

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