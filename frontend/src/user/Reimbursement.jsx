import React, { useState, useEffect } from "react";
import API from "../services/api";
import { FaEdit, FaTrash, FaCommentDots, FaFileAlt, FaTimes, FaPaperclip } from "react-icons/fa";

const Reimbursement = ({ setSidebarOpen }) => {

  const [reimbursements, setReimbursements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // ================= ADD / EDIT MODAL =================
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    companyName: "",
    date: "",
    from: "",
    to: "",
    description: "",
    amount: "",
  });

  // Newly selected files (not yet uploaded) for this claim. Multiple
  // documents/images can be attached — an employee is not limited to one.
  const [billFiles, setBillFiles] = useState([]);

  // Existing bill(s) (when editing) the employee has marked for removal.
  // Holds the bill sub-document _ids; actual deletion happens on submit.
  const [removeBillIds, setRemoveBillIds] = useState([]);

  // ================= DESCRIPTION POPUP =================
  // Reuses the same "remark popup" look used on the Customers page.
  const [descPopupItem, setDescPopupItem] = useState(null);

  // ================= BILLS POPUP =================
  // Shows every bill/receipt attached to a claim.
  const [billsPopupItem, setBillsPopupItem] = useState(null);

  // ================= PAGINATION =================
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchReimbursements();
  }, []);

  const fetchReimbursements = async () => {
    setLoading(true);
    try {
      const res = await API.get("/reimbursements/my");
      setReimbursements(res.data.reimbursements || []);
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Adds the newly picked files to whatever is already selected, so an
  // employee can attach files across multiple picks instead of the
  // selection being replaced each time.
  const handleFileChange = (e) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length > 0) {
      setBillFiles((prev) => [...prev, ...picked]);
    }
    // Reset so selecting the same file again still fires onChange
    e.target.value = "";
  };

  const removeSelectedFile = (index) => {
    setBillFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleRemoveExistingBill = (billId) => {
    setRemoveBillIds((prev) =>
      prev.includes(billId)
        ? prev.filter((id) => id !== billId)
        : [...prev, billId]
    );
  };

  const resetForm = () => {
    setFormData({
      companyName: "",
      date: "",
      from: "",
      to: "",
      description: "",
      amount: "",
    });
    setBillFiles([]);
    setRemoveBillIds([]);
  };

  // Formats an ISO date string into the yyyy-MM-dd shape the
  // <input type="date"> element expects.
  const toDateInputValue = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setFormData({
      companyName: item.companyName || "",
      date: toDateInputValue(item.date),
      from: item.from || "",
      to: item.to || "",
      description: item.description || "",
      amount: item.amount || "",
    });
    setBillFiles([]);
    setRemoveBillIds([]);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingItem(null);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.companyName || !formData.date || !formData.from || !formData.to) {
      alert("Company Name, Date, From and To are required");
      return;
    }

    setSubmitting(true);

    try {

      const data = new FormData();
      data.append("companyName", formData.companyName);
      data.append("date", formData.date);
      data.append("from", formData.from);
      data.append("to", formData.to);
      data.append("description", formData.description);
      data.append("amount", formData.amount || 0);

      // Multiple bills/receipts can be attached to a single claim
      billFiles.forEach((file) => {
        data.append("billAttachments", file);
      });

      if (editingItem && removeBillIds.length > 0) {
        data.append("removeBillIds", JSON.stringify(removeBillIds));
      }

      if (editingItem) {
        await API.put(`/reimbursements/${editingItem._id}`, data);
        alert("Reimbursement updated successfully.");
      } else {
        await API.post("/reimbursements", data);
        alert("Reimbursement submitted successfully. Sent to admin for approval.");
      }

      resetForm();
      setEditingItem(null);
      setShowAddModal(false);
      setCurrentPage(1);
      fetchReimbursements();

    } catch (error) {
      console.log(error);
      alert(
        error.response?.data?.message ||
        (editingItem ? "Failed to update reimbursement" : "Failed to submit reimbursement")
      );
    }

    setSubmitting(false);
  };

  const handleDelete = async (item) => {

    const confirmDelete = window.confirm(
      `Delete the reimbursement for "${item.companyName}"? This cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      await API.delete(`/reimbursements/${item._id}`);
      fetchReimbursements();
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Failed to delete");
    }
  };

  // ================= SEARCH + PAGINATION =================

  const filteredReimbursements = reimbursements.filter((item) =>
    !searchTerm ||
    item.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredReimbursements.length / itemsPerPage)
  );

  const indexOfFirst = (currentPage - 1) * itemsPerPage;

  const currentItems = filteredReimbursements.slice(
    indexOfFirst,
    indexOfFirst + itemsPerPage
  );

  return (
    <div className="customer-page reimbursement-page">

      {/* HEADER — matches the Customers page topbar */}

      <div className="customer-topbar">

        <div className="header-left">

          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            ☰
          </button>

          <div>
            <h2 className="page-title">Reimbursement</h2>
            <p className="page-subtitle">
              Submit and track your reimbursement claims
            </p>
          </div>

        </div>

        <div className="top-actions">

          <input
            type="text"
            placeholder="Search company..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="search-input"
          />

          <button
            className="add-btn"
            onClick={() => {
              setEditingItem(null);
              resetForm();
              setShowAddModal(true);
            }}
          >
            + Add Reimbursement
          </button>

        </div>

      </div>

      {/* TABLE */}

      <div className="customer-table-container">

        <table className="minimal-table">

          <thead>
            <tr>
              <th className="col-sno">S.No</th>
              <th className="col-company">Company Name</th>
              <th className="col-date">Date</th>
              <th className="col-from-to">From</th>
              <th className="col-from-to">To</th>
              <th className="col-remark">Description</th>
              <th className="col-amount">Amount</th>
              <th className="col-bill">Bills</th>
              <th className="col-status">Status</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>

          <tbody>

            {loading ? (
              <tr>
                <td colSpan={10} style={{ textAlign: "center", padding: 20 }}>
                  Loading...
                </td>
              </tr>
            ) : currentItems.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: "center", padding: 20 }}>
                  No reimbursements submitted yet.
                </td>
              </tr>
            ) : (
              currentItems.map((item, index) => {
                const status = item.status || "Pending";
                const statusColors = {
                  Pending: { bg: "#fff7e6", color: "#d46b08" },
                  Approved: { bg: "#f6ffed", color: "#389e0d" },
                  Rejected: { bg: "#fff1f0", color: "#cf1322" },
                };
                const sc = statusColors[status] || statusColors.Pending;
                const bills = item.bills || [];

                return (
                <tr key={item._id}>

                  <td className="col-sno">
                    {indexOfFirst + index + 1}
                  </td>

                  <td className="col-company" title={item.companyName}>
                    {item.companyName}
                  </td>

                  <td className="col-date">
                    {item.date
                      ? new Date(item.date).toLocaleDateString("en-IN")
                      : "-"}
                  </td>

                  <td className="col-from-to" title={item.from}>
                    {item.from}
                  </td>

                  <td className="col-from-to" title={item.to}>
                    {item.to}
                  </td>

                  <td className="col-remark">
                    <button
                      className="icon-btn remark-toggle-icon"
                      title="View Description"
                      onClick={() => setDescPopupItem(item)}
                    >
                      <FaCommentDots />
                    </button>
                  </td>

                  <td className="col-amount">
                    ₹{(Number(item.amount) || 0).toLocaleString("en-IN")}
                  </td>

                  <td className="col-bill">
                    {bills.length > 0 ? (
                      <button
                        type="button"
                        className="icon-btn bill-icon"
                        title={`View ${bills.length} bill${bills.length === 1 ? "" : "s"}`}
                        onClick={() => setBillsPopupItem(item)}
                        style={{ position: "relative" }}
                      >
                        <FaFileAlt />
                        <span
                          style={{
                            position: "absolute",
                            top: -6,
                            right: -8,
                            background: "#2f54eb",
                            color: "#fff",
                            borderRadius: "50%",
                            fontSize: 10,
                            fontWeight: 700,
                            lineHeight: "16px",
                            width: 16,
                            height: 16,
                            textAlign: "center",
                          }}
                        >
                          {bills.length}
                        </span>
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td className="col-status">
                    <span
                      style={{
                        background: sc.bg,
                        color: sc.color,
                        padding: "3px 10px",
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {status}
                    </span>
                  </td>

                  <td className="col-actions">
                    <div className="action-icons">
                      {status !== "Approved" && (
                        <>
                          <button
                            className="icon-btn"
                            title="Edit"
                            onClick={() => handleEditClick(item)}
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="icon-btn delete-icon"
                            title="Delete"
                            onClick={() => handleDelete(item)}
                          >
                            <FaTrash />
                          </button>
                        </>
                      )}
                    </div>
                  </td>

                </tr>
                );
              })
            )}

          </tbody>

        </table>

        {/* PAGINATION */}

        <div className="pagination">

          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </button>

          <span style={{ padding: "0 10px" }}>
            Page {currentPage} of {totalPages}
          </span>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </button>

        </div>

      </div>

      {/* ================= ADD REIMBURSEMENT MODAL ================= */}

      {showAddModal && (
        <div
          className="modal-overlay"
          onClick={closeModal}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="modal-header">
              <h2>{editingItem ? "Edit Reimbursement" : "Add Reimbursement"}</h2>
              <span
                className="close-icon"
                onClick={closeModal}
              >
                ✕
              </span>
            </div>

            <form onSubmit={handleSubmit}>

              <div className="input-group">
                <label>Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  placeholder="Enter company name"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label>Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label>From</label>
                <input
                  type="text"
                  name="from"
                  placeholder="e.g. Chennai"
                  value={formData.from}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label>To</label>
                <input
                  type="text"
                  name="to"
                  placeholder="e.g. Bangalore"
                  value={formData.to}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label>Amount (₹)</label>
                <input
                  type="number"
                  name="amount"
                  min="0"
                  step="0.01"
                  placeholder="Enter claim amount"
                  value={formData.amount}
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <label>Description</label>
                <textarea
                  name="description"
                  rows={4}
                  placeholder="Describe the expense..."
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <label>Bills / Receipts (documents or images)</label>

                {/* Existing bills, only shown while editing */}
                {editingItem && editingItem.bills && editingItem.bills.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <p style={{ margin: "0 0 6px", fontSize: 13, color: "#666" }}>
                      Current attachments:
                    </p>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {editingItem.bills.map((bill, i) => {
                        const marked = removeBillIds.includes(bill._id);
                        return (
                          <li
                            key={bill._id || i}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "4px 0",
                              opacity: marked ? 0.5 : 1,
                              textDecoration: marked ? "line-through" : "none",
                            }}
                          >
                            <FaPaperclip size={12} />
                            <a
                              href={bill.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontSize: 13 }}
                            >
                              {bill.originalName || `Attachment ${i + 1}`}
                            </a>
                            <button
                              type="button"
                              className="icon-btn delete-icon"
                              title={marked ? "Undo remove" : "Remove"}
                              style={{ marginLeft: "auto", padding: "2px 6px" }}
                              onClick={() => toggleRemoveExistingBill(bill._id)}
                            >
                              {marked ? "Undo" : <FaTimes size={12} />}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Newly selected files, not yet uploaded */}
                {billFiles.length > 0 && (
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 8px" }}>
                    {billFiles.map((file, i) => (
                      <li
                        key={`${file.name}-${i}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "4px 0",
                        }}
                      >
                        <FaPaperclip size={12} />
                        <span style={{ fontSize: 13 }}>{file.name}</span>
                        <button
                          type="button"
                          className="icon-btn delete-icon"
                          title="Remove"
                          style={{ marginLeft: "auto", padding: "2px 6px" }}
                          onClick={() => removeSelectedFile(i)}
                        >
                          <FaTimes size={12} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <input
                  type="file"
                  accept="image/*,.pdf"
                  multiple
                  onChange={handleFileChange}
                />
                <p style={{ margin: "6px 0 0", fontSize: 12, color: "#888" }}>
                  You can select multiple images or PDF documents. Pick files more
                  than once to keep adding to the list.
                </p>
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={submitting}
              >
                {submitting
                  ? (editingItem ? "Updating..." : "Submitting...")
                  : (editingItem ? "Update Reimbursement" : "Submit Reimbursement")}
              </button>

            </form>

          </div>
        </div>
      )}

      {/* ================= DESCRIPTION POPUP ================= */}

      {descPopupItem && (
        <div
          className="modal-overlay remark-popup-overlay"
          onClick={() => setDescPopupItem(null)}
        >
          <div
            className="remark-popup"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="remark-popup-header">
              <h3>Description — {descPopupItem.companyName}</h3>
              <span
                className="close-icon"
                onClick={() => setDescPopupItem(null)}
              >
                ✕
              </span>
            </div>

            <div className="remark-popup-body">
              {descPopupItem.description ? (
                <p className="remark-current">
                  {descPopupItem.description}
                </p>
              ) : (
                <p className="remark-empty">No description added.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= BILLS POPUP ================= */}

      {billsPopupItem && (
        <div
          className="modal-overlay remark-popup-overlay"
          onClick={() => setBillsPopupItem(null)}
        >
          <div
            className="remark-popup"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="remark-popup-header">
              <h3>Bills — {billsPopupItem.companyName}</h3>
              <span
                className="close-icon"
                onClick={() => setBillsPopupItem(null)}
              >
                ✕
              </span>
            </div>

            <div className="remark-popup-body">
              {billsPopupItem.bills && billsPopupItem.bills.length > 0 ? (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {billsPopupItem.bills.map((bill, i) => (
                    <li
                      key={bill._id || i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 0",
                        borderBottom: "1px solid #f0f0f0",
                      }}
                    >
                      <FaFileAlt />
                      <a
                        href={bill.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {bill.originalName || `Attachment ${i + 1}`}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="remark-empty">No bills attached.</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Reimbursement;