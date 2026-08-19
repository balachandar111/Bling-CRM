const InvoiceDocument = require("../models/invoiceModel");
const generateTaxInvoicePdf = require("../utils/generateTaxInvoicePdf");

const toNum = (v) => Number(v) || 0;

// ================= NUMBER GENERATION =================
// "QUO-000001", "INV-000014" style, matching the sample invoice format.
// Looks at the most recently created doc of the same type and increments.
const generateDocNumber = async (docType) => {
  const prefix = docType === "quotation" ? "QUO-" : "INV-";

  const last = await InvoiceDocument.findOne({ docType })
    .sort({ createdAt: -1 })
    .select("docNumber");

  let nextSeq = 1;
  if (last && last.docNumber) {
    const match = last.docNumber.match(/(\d+)$/);
    if (match) nextSeq = parseInt(match[1], 10) + 1;
  }

  return `${prefix}${String(nextSeq).padStart(6, "0")}`;
};

// ================= COMPUTE ITEM/TOTAL AMOUNTS =================
const computeTotals = (items = []) => {
  const normalizedItems = items.map((item) => {
    const qty = toNum(item.qty);
    const rate = toNum(item.rate);
    const cgstPercent = toNum(item.cgstPercent);
    const sgstPercent = toNum(item.sgstPercent);
    const amount = qty * rate;
    const cgstAmount = (amount * cgstPercent) / 100;
    const sgstAmount = (amount * sgstPercent) / 100;

    return {
      description: item.description || "",
      hsnSac: item.hsnSac || "",
      qty,
      unit: item.unit || "",
      rate,
      cgstPercent,
      sgstPercent,
      amount,
      cgstAmount,
      sgstAmount,
    };
  });

  const subTotal = normalizedItems.reduce((s, i) => s + i.amount, 0);
  const cgstTotal = normalizedItems.reduce((s, i) => s + i.cgstAmount, 0);
  const sgstTotal = normalizedItems.reduce((s, i) => s + i.sgstAmount, 0);
  const grandTotal = subTotal + cgstTotal + sgstTotal;

  return { normalizedItems, subTotal, cgstTotal, sgstTotal, grandTotal };
};

// ================= CREATE (Quotation or Invoice) =================
const createDocument = async (req, res) => {
  try {
    const {
      docType,
      customer,
      billTo = {},
      shipTo = {},
      date,
      dueDate,
      terms,
      placeOfSupply,
      items = [],
      notes,
      status,
    } = req.body;

    if (!["quotation", "invoice"].includes(docType)) {
      return res.status(400).json({
        success: false,
        message: "docType must be 'quotation' or 'invoice'",
      });
    }

    if (!items.length) {
      return res.status(400).json({
        success: false,
        message: "At least one line item is required",
      });
    }

    const { normalizedItems, subTotal, cgstTotal, sgstTotal, grandTotal } =
      computeTotals(items);

    const docNumber = await generateDocNumber(docType);

    const doc = await InvoiceDocument.create({
      docType,
      docNumber,
      customer: customer || undefined,
      billTo,
      shipTo,
      date: date || new Date(),
      dueDate,
      terms,
      placeOfSupply,
      items: normalizedItems,
      subTotal,
      cgstTotal,
      sgstTotal,
      grandTotal,
      notes,
      status: status || "draft",
      createdBy: req.user?._id,
    });

    res.status(201).json({
      success: true,
      message: `${docType === "quotation" ? "Quotation" : "Invoice"} created successfully`,
      document: doc,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= LIST (with optional ?docType=quotation|invoice) =================
const getDocuments = async (req, res) => {
  try {
    const filter = {};
    if (req.query.docType) filter.docType = req.query.docType;

    const documents = await InvoiceDocument.find(filter)
      .sort({ createdAt: -1 })
      .populate("customer", "name company email phone")
      .populate("createdBy", "name email");

    res.json({ success: true, documents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= GET SINGLE =================
const getDocument = async (req, res) => {
  try {
    const doc = await InvoiceDocument.findById(req.params.id).populate(
      "customer",
      "name company email phone"
    );

    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    res.json({ success: true, document: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= UPDATE =================
const updateDocument = async (req, res) => {
  try {
    const doc = await InvoiceDocument.findById(req.params.id);

    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const {
      customer,
      billTo,
      shipTo,
      date,
      dueDate,
      terms,
      placeOfSupply,
      items,
      notes,
      status,
    } = req.body;

    if (items && items.length) {
      const { normalizedItems, subTotal, cgstTotal, sgstTotal, grandTotal } =
        computeTotals(items);
      doc.items = normalizedItems;
      doc.subTotal = subTotal;
      doc.cgstTotal = cgstTotal;
      doc.sgstTotal = sgstTotal;
      doc.grandTotal = grandTotal;
    }

    if (customer !== undefined) doc.customer = customer || undefined;
    if (billTo) doc.billTo = billTo;
    if (shipTo) doc.shipTo = shipTo;
    if (date) doc.date = date;
    if (dueDate) doc.dueDate = dueDate;
    if (terms !== undefined) doc.terms = terms;
    if (placeOfSupply !== undefined) doc.placeOfSupply = placeOfSupply;
    if (notes !== undefined) doc.notes = notes;
    if (status) doc.status = status;

    await doc.save();

    res.json({ success: true, message: "Document updated successfully", document: doc });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= DELETE =================
const deleteDocument = async (req, res) => {
  try {
    const doc = await InvoiceDocument.findByIdAndDelete(req.params.id);

    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    res.json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= CONVERT QUOTATION -> INVOICE =================
const convertToInvoice = async (req, res) => {
  try {
    const quotation = await InvoiceDocument.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({ success: false, message: "Quotation not found" });
    }

    if (quotation.docType !== "quotation") {
      return res.status(400).json({
        success: false,
        message: "Only quotations can be converted to an invoice",
      });
    }

    if (quotation.convertedToInvoice) {
      return res.status(400).json({
        success: false,
        message: "This quotation has already been converted to an invoice",
      });
    }

    const docNumber = await generateDocNumber("invoice");

    const invoice = await InvoiceDocument.create({
      docType: "invoice",
      docNumber,
      customer: quotation.customer,
      billTo: quotation.billTo,
      shipTo: quotation.shipTo,
      date: new Date(),
      dueDate: req.body.dueDate,
      terms: req.body.terms || quotation.terms,
      placeOfSupply: quotation.placeOfSupply,
      items: quotation.items,
      subTotal: quotation.subTotal,
      cgstTotal: quotation.cgstTotal,
      sgstTotal: quotation.sgstTotal,
      grandTotal: quotation.grandTotal,
      notes: quotation.notes,
      status: "unpaid",
      convertedFromQuotation: quotation._id,
      createdBy: req.user?._id,
    });

    quotation.convertedToInvoice = invoice._id;
    quotation.status = "accepted";
    await quotation.save();

    res.status(201).json({
      success: true,
      message: "Invoice generated from quotation successfully",
      document: invoice,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= DOWNLOAD / VIEW PDF =================
const downloadPdf = async (req, res) => {
  try {
    const doc = await InvoiceDocument.findById(req.params.id);

    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const pdfBuffer = await generateTaxInvoicePdf(doc.toObject());

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `${req.query.inline ? "inline" : "attachment"}; filename="${doc.docNumber}.pdf"`,
      "Content-Length": pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createDocument,
  getDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  convertToInvoice,
  downloadPdf,
};
