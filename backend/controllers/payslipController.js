const Employee = require("../models/employeeModel");
const cloudinary = require("../config/cloudinary");
const generatePayslipPdf = require("../utils/generatePayslipPdf");

const toNum = (v) => Number(v) || 0;

// Uploads a PDF buffer to Cloudinary as a raw file and returns its URL.
const uploadPdfBuffer = (buffer, publicId) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "crm_payslips",
        resource_type: "raw",
        public_id: publicId,
        format: "pdf",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });

// ================= GENERATE PAYSLIP =================
// Builds a payslip from the admin-entered breakup, renders it into a PDF
// matching the company letterhead, uploads it, and saves it as a "draft"
// entry on the employee (not yet visible to the employee).
const generatePayslip = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const {
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
      earnings = {},
      deductions = {},
    } = req.body;

    const normalizedEarnings = {
      basic: toNum(earnings.basic),
      hra: toNum(earnings.hra),
      conveyance: toNum(earnings.conveyance),
      specialAllowance: toNum(earnings.specialAllowance),
      communicationAllowance: toNum(earnings.communicationAllowance),
      reimbursement: toNum(earnings.reimbursement),
    };

    const normalizedDeductions = {
      profTax: toNum(deductions.profTax),
      incomeTax: toNum(deductions.incomeTax),
    };

    const totalEarnings = Object.values(normalizedEarnings).reduce((s, v) => s + v, 0);
    const totalDeductions = Object.values(normalizedDeductions).reduce((s, v) => s + v, 0);
    const netPay = totalEarnings - totalDeductions;

    const payslipData = {
      month: toNum(month),
      year: toNum(year),
      effectiveWorkDays: toNum(effectiveWorkDays),
      lop: toNum(lop),
      location,
      bankName,
      bankAccountNo,
      panNumber,
      pfNo,
      pfUan,
      designation: designation || employee.designation,
      department: department || employee.department,
      earnings: normalizedEarnings,
      deductions: normalizedDeductions,
      totalEarnings,
      totalDeductions,
      netPay,
      status: "draft",
      generatedBy: req.user?.id,
      generatedAt: new Date(),
    };

    // Push first so the subdocument gets its own _id, then generate the
    // PDF using that id (used to build the employee code fallback / file name).
    employee.generatedPayslips.push(payslipData);
    const savedPayslip = employee.generatedPayslips[employee.generatedPayslips.length - 1];

    const pdfBuffer = await generatePayslipPdf({
      ...payslipData,
      employee,
      employeeCode: employee.employeeCode,
    });

    const uploadResult = await uploadPdfBuffer(
      pdfBuffer,
      `payslip_${employee._id}_${savedPayslip._id}`
    );

    savedPayslip.pdfUrl = uploadResult.secure_url;

    await employee.save();

    res.json({
      success: true,
      message: "Payslip generated successfully",
      payslip: savedPayslip,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= SEND PAYSLIP =================
// Marks a draft payslip as "sent", making it visible to the employee
// under My Payslips.
const sendPayslip = async (req, res) => {
  try {
    const { employeeId, payslipId } = req.params;

    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const payslip = employee.generatedPayslips.id(payslipId);

    if (!payslip) {
      return res.status(404).json({
        success: false,
        message: "Payslip not found",
      });
    }

    payslip.status = "sent";
    payslip.sentAt = new Date();

    await employee.save();

    res.json({
      success: true,
      message: "Payslip sent to employee",
      payslip,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= LIST GENERATED PAYSLIPS (admin) =================
const getGeneratedPayslips = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.json({
      success: true,
      payslips: employee.generatedPayslips || [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  generatePayslip,
  sendPayslip,
  getGeneratedPayslips,
};