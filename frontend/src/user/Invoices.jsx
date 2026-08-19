// 📁 src/user/Invoices.jsx
// USER PANEL — "Quotation & Invoice" section.
// Only regular users (sales reps) see and use this section — it does
// NOT appear on the admin (super_admin) side of the app.
//
// Lets each user:
//  1. Create a Quotation (matching the Bling Tech Connect invoice
//     letterhead format) for a customer.
//  2. Convert an accepted Quotation into an Invoice with one click, or
//     create an Invoice directly.
//  3. See every generated Quotation/Invoice in a single table, filter
//     by type, and download/view the generated PDF (pixel-matched to
//     the company's official tax invoice layout).

import React, { useEffect, useMemo, useState } from "react";
import {
  FaFileInvoiceDollar,
  FaSearch,
  FaPlus,
  FaTimes,
  FaDownload,
  FaEye,
  FaExchangeAlt,
  FaTrash,
  FaPlusCircle,
  FaMinusCircle,
} from "react-icons/fa";
import API from "../services/api";
import "./Invoices.css";

const EMPTY_ITEM = () => ({
  description: "",
  hsnSac: "",
  qty: 1,
  unit: "",
  rate: 0,
  cgstPercent: 9,
  sgstPercent: 9,
});

const EMPTY_FORM = {
  docType: "quotation",
  customer: "",
  billTo: { name: "", address: "", gstin: "" },
  shipTo: { name: "", address: "", gstin: "" },
  sameAsBillTo: true,
  date: new Date().toISOString().slice(0, 10),
  dueDate: "",
  terms: "Due on Receipt",
  placeOfSupply: "Tamil Nadu (33)",
  notes: "Thanks for your business.",
  items: [EMPTY_ITEM()],
};

const money = (n) =>
  `₹${(Number(n) || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (d) => {
  if (!d) return "-";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const Invoices = ({ setSidebarOpen }) => {
  const [documents, setDocuments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all"); // all | quotation | invoice

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null); // row currently downloading/converting/deleting

  // ================= FETCH =================
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await API.get("/invoices");
      setDocuments(res.data.documents || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await API.get("/customers");
      setCustomers(res.data.customers || res.data || []);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchCustomers();
  }, []);

  // ================= FILTER / SEARCH =================
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (typeFilter !== "all" && doc.docType !== typeFilter) return false;
      if (!search) return true;
      const term = search.toLowerCase();
      return (
        (doc.docNumber || "").toLowerCase().includes(term) ||
        (doc.billTo?.name || "").toLowerCase().includes(term) ||
        (doc.customer?.company || "").toLowerCase().includes(term)
      );
    });
  }, [documents, typeFilter, search]);

  // ================= FORM HELPERS =================
  const openCreateModal = (docType) => {
    setForm({ ...EMPTY_FORM, docType, items: [EMPTY_ITEM()] });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(EMPTY_FORM);
  };

  const handleCustomerSelect = (customerId) => {
    const customer = customers.find((c) => c._id === customerId);
    setForm((prev) => ({
      ...prev,
      customer: customerId,
      billTo: customer
        ? {
            name: customer.company || customer.name || "",
            address: customer.location || "",
            gstin: prev.billTo.gstin,
          }
        : prev.billTo,
    }));
  };

  const handleBillToChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      billTo: { ...prev.billTo, [field]: value },
    }));
  };

  const handleShipToChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      shipTo: { ...prev.shipTo, [field]: value },
    }));
  };

  const handleItemChange = (index, field, value) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const addItemRow = () => {
    setForm((prev) => ({ ...prev, items: [...prev.items, EMPTY_ITEM()] }));
  };

  const removeItemRow = (index) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // Live totals preview shown at the bottom of the item table
  const totalsPreview = useMemo(() => {
    let subTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;

    form.items.forEach((item) => {
      const amount = (Number(item.qty) || 0) * (Number(item.rate) || 0);
      const cgst = (amount * (Number(item.cgstPercent) || 0)) / 100;
      const sgst = (amount * (Number(item.sgstPercent) || 0)) / 100;
      subTotal += amount;
      cgstTotal += cgst;
      sgstTotal += sgst;
    });

    return {
      subTotal,
      cgstTotal,
      sgstTotal,
      grandTotal: subTotal + cgstTotal + sgstTotal,
    };
  }, [form.items]);

  // ================= SAVE (CREATE) =================
  const handleSave = async (e) => {
    e.preventDefault();

    if (!form.billTo.name.trim()) {
      alert("Please enter a Bill To name.");
      return;
    }
    if (!form.items.length || form.items.every((i) => !i.description.trim())) {
      alert("Please add at least one line item.");
      return;
    }

    try {
      setSaving(true);

      await API.post("/invoices", {
        docType: form.docType,
        customer: form.customer || undefined,
        billTo: form.billTo,
        shipTo: form.sameAsBillTo ? {} : form.shipTo,
        date: form.date,
        dueDate: form.dueDate || form.date,
        terms: form.terms,
        placeOfSupply: form.placeOfSupply,
        notes: form.notes,
        items: form.items,
      });

      alert(
        `${form.docType === "quotation" ? "Quotation" : "Invoice"} created successfully!`
      );
      closeModal();
      fetchDocuments();
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  };

  // ================= DOWNLOAD / VIEW PDF =================
  const openPdf = async (doc, mode) => {
    try {
      setBusyId(doc._id + mode);
      const res = await API.get(`/invoices/${doc._id}/pdf`, {
        params: mode === "view" ? { inline: 1 } : {},
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      if (mode === "view") {
        window.open(url, "_blank");
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.download = `${doc.docNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      setTimeout(() => window.URL.revokeObjectURL(url), 30000);
    } catch (error) {
      console.log(error);
      alert("Could not load the PDF. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  // ================= CONVERT QUOTATION -> INVOICE =================
  const handleConvert = async (doc) => {
    if (!window.confirm(`Generate an Invoice from ${doc.docNumber}?`)) return;

    try {
      setBusyId(doc._id + "convert");
      await API.post(`/invoices/${doc._id}/convert`, {});
      alert("Invoice generated from quotation successfully!");
      fetchDocuments();
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Could not convert to invoice.");
    } finally {
      setBusyId(null);
    }
  };

  // ================= DELETE =================
  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete ${doc.docNumber}? This cannot be undone.`)) return;

    try {
      setBusyId(doc._id + "delete");
      await API.delete(`/invoices/${doc._id}`);
      fetchDocuments();
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Could not delete document.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="customer-page">
      <div className="customer-topbar">
        <div className="header-left">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen && setSidebarOpen((prev) => !prev)}
          >
            ☰
          </button>

          <div>
            <h2 className="page-title">
              <FaFileInvoiceDollar className="inv-title-icon" />
              Quotation &amp; Invoice
            </h2>
            <p className="page-subtitle">
              Create quotations, convert them into invoices, and download
              PDFs matching the official Bling Tech Connect format.
            </p>
          </div>
        </div>

        <div className="inv-header-actions">
          <button
            type="button"
            className="inv-btn inv-btn-outline"
            onClick={() => openCreateModal("quotation")}
          >
            <FaPlus /> New Quotation
          </button>
          <button
            type="button"
            className="inv-btn inv-btn-primary"
            onClick={() => openCreateModal("invoice")}
          >
            <FaPlus /> New Invoice
          </button>
        </div>
      </div>

      <div className="customer-table-container inv-table-wrap">
        <div className="opp-toolbar">
          <div className="inv-filter-tabs">
            {[
              { key: "all", label: "All" },
              { key: "quotation", label: "Quotations" },
              { key: "invoice", label: "Invoices" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`inv-filter-tab ${
                  typeFilter === tab.key ? "active" : ""
                }`}
                onClick={() => setTypeFilter(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="opp-search-wrap">
            <FaSearch className="opp-search-icon" />
            <input
              type="text"
              placeholder="Search by doc no. or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <table className="minimal-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Type</th>
              <th>Doc No.</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="opp-empty-row">
                <td colSpan="8">Loading...</td>
              </tr>
            ) : filteredDocuments.length === 0 ? (
              <tr className="opp-empty-row">
                <td colSpan="8">No quotations or invoices yet.</td>
              </tr>
            ) : (
              filteredDocuments.map((doc, index) => (
                <tr key={doc._id}>
                  <td>{index + 1}</td>
                  <td>
                    <span
                      className={`inv-badge inv-badge-${doc.docType}`}
                    >
                      {doc.docType === "quotation" ? "Quotation" : "Invoice"}
                    </span>
                  </td>
                  <td>{doc.docNumber}</td>
                  <td>{doc.billTo?.name || doc.customer?.company || "-"}</td>
                  <td>{formatDate(doc.date)}</td>
                  <td>{money(doc.grandTotal)}</td>
                  <td>
                    <span className={`inv-status inv-status-${doc.status}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="col-actions">
                    <div className="opp-action-icons">
                      <button
                        type="button"
                        title="View PDF"
                        className="opp-icon-btn"
                        disabled={busyId === doc._id + "view"}
                        onClick={() => openPdf(doc, "view")}
                      >
                        <FaEye />
                      </button>
                      <button
                        type="button"
                        title="Download PDF"
                        className="opp-icon-btn opp-icon-btn-edit"
                        disabled={busyId === doc._id + "download"}
                        onClick={() => openPdf(doc, "download")}
                      >
                        <FaDownload />
                      </button>
                      {doc.docType === "quotation" && !doc.convertedToInvoice && (
                        <button
                          type="button"
                          title="Convert to Invoice"
                          className="opp-icon-btn inv-icon-btn-convert"
                          disabled={busyId === doc._id + "convert"}
                          onClick={() => handleConvert(doc)}
                        >
                          <FaExchangeAlt />
                        </button>
                      )}
                      <button
                        type="button"
                        title="Delete"
                        className="opp-icon-btn inv-icon-btn-delete"
                        disabled={busyId === doc._id + "delete"}
                        onClick={() => handleDelete(doc)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ================= CREATE MODAL ================= */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal inv-modal">
            <div className="modal-header">
              <h2>
                New {form.docType === "quotation" ? "Quotation" : "Invoice"}
              </h2>
              <span className="close-icon" onClick={closeModal}>
                <FaTimes />
              </span>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-grid">
                <div className="input-group">
                  <label>Document Type</label>
                  <select
                    value={form.docType}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, docType: e.target.value }))
                    }
                  >
                    <option value="quotation">Quotation</option>
                    <option value="invoice">Invoice</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Link to Customer (optional)</label>
                  <select
                    value={form.customer}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                  >
                    <option value="">— None / manual entry —</option>
                    {customers.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.company || c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label>{form.docType === "quotation" ? "Quotation" : "Invoice"} Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, date: e.target.value }))
                    }
                  />
                </div>

                <div className="input-group">
                  <label>{form.docType === "quotation" ? "Valid Until" : "Due Date"}</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, dueDate: e.target.value }))
                    }
                  />
                </div>

                <div className="input-group">
                  <label>Terms</label>
                  <input
                    type="text"
                    value={form.terms}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, terms: e.target.value }))
                    }
                  />
                </div>

                <div className="input-group">
                  <label>Place Of Supply</label>
                  <input
                    type="text"
                    value={form.placeOfSupply}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        placeOfSupply: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <h3 className="opp-modal-section-title">Bill To</h3>
              <div className="form-grid">
                <div className="input-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={form.billTo.name}
                    onChange={(e) => handleBillToChange("name", e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label>GSTIN</label>
                  <input
                    type="text"
                    value={form.billTo.gstin}
                    onChange={(e) => handleBillToChange("gstin", e.target.value)}
                  />
                </div>
                <div className="input-group full-row">
                  <label>Address</label>
                  <textarea
                    rows={2}
                    value={form.billTo.address}
                    onChange={(e) =>
                      handleBillToChange("address", e.target.value)
                    }
                  />
                </div>
              </div>

              <h3 className="opp-modal-section-title">
                Ship To
                <label className="inv-inline-checkbox">
                  <input
                    type="checkbox"
                    checked={form.sameAsBillTo}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        sameAsBillTo: e.target.checked,
                      }))
                    }
                  />
                  Same as Bill To
                </label>
              </h3>

              {!form.sameAsBillTo && (
                <div className="form-grid">
                  <div className="input-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={form.shipTo.name}
                      onChange={(e) =>
                        handleShipToChange("name", e.target.value)
                      }
                    />
                  </div>
                  <div className="input-group">
                    <label>GSTIN</label>
                    <input
                      type="text"
                      value={form.shipTo.gstin}
                      onChange={(e) =>
                        handleShipToChange("gstin", e.target.value)
                      }
                    />
                  </div>
                  <div className="input-group full-row">
                    <label>Address</label>
                    <textarea
                      rows={2}
                      value={form.shipTo.address}
                      onChange={(e) =>
                        handleShipToChange("address", e.target.value)
                      }
                    />
                  </div>
                </div>
              )}

              <h3 className="opp-modal-section-title">Items</h3>
              <div className="inv-items-table-wrap">
                <table className="inv-items-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>HSN/SAC</th>
                      <th>Qty</th>
                      <th>Unit</th>
                      <th>Rate</th>
                      <th>CGST %</th>
                      <th>SGST %</th>
                      <th>Amount</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.items.map((item, index) => {
                      const amount =
                        (Number(item.qty) || 0) * (Number(item.rate) || 0);
                      return (
                        <tr key={index}>
                          <td>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "description",
                                  e.target.value
                                )
                              }
                              placeholder="Item / service description"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="inv-col-narrow"
                              value={item.hsnSac}
                              onChange={(e) =>
                                handleItemChange(index, "hsnSac", e.target.value)
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="inv-col-narrow"
                              value={item.qty}
                              min="0"
                              onChange={(e) =>
                                handleItemChange(index, "qty", e.target.value)
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="inv-col-narrow"
                              value={item.unit}
                              placeholder="pcs"
                              onChange={(e) =>
                                handleItemChange(index, "unit", e.target.value)
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="inv-col-narrow"
                              value={item.rate}
                              min="0"
                              onChange={(e) =>
                                handleItemChange(index, "rate", e.target.value)
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="inv-col-narrow"
                              value={item.cgstPercent}
                              min="0"
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "cgstPercent",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="inv-col-narrow"
                              value={item.sgstPercent}
                              min="0"
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "sgstPercent",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td className="inv-amount-cell">{money(amount)}</td>
                          <td>
                            <button
                              type="button"
                              className="inv-row-remove"
                              title="Remove row"
                              onClick={() => removeItemRow(index)}
                              disabled={form.items.length === 1}
                            >
                              <FaMinusCircle />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <button
                  type="button"
                  className="inv-add-row-btn"
                  onClick={addItemRow}
                >
                  <FaPlusCircle /> Add Item
                </button>
              </div>

              <div className="inv-totals-preview">
                <div>
                  <span>Sub Total</span>
                  <span>{money(totalsPreview.subTotal)}</span>
                </div>
                <div>
                  <span>CGST</span>
                  <span>{money(totalsPreview.cgstTotal)}</span>
                </div>
                <div>
                  <span>SGST</span>
                  <span>{money(totalsPreview.sgstTotal)}</span>
                </div>
                <div className="inv-totals-grand">
                  <span>Total</span>
                  <span>{money(totalsPreview.grandTotal)}</span>
                </div>
              </div>

              <div className="form-grid">
                <div className="input-group full-row">
                  <label>Notes</label>
                  <textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, notes: e.target.value }))
                    }
                  />
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={saving}>
                {saving
                  ? "Saving..."
                  : `Save ${form.docType === "quotation" ? "Quotation" : "Invoice"}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
