import React, { useState, useEffect } from "react";
import API from "../services/api";
import { FaEdit, FaTrash, FaCommentDots, FaFileAlt } from "react-icons/fa";

const Reimbursement = ({ setSidebarOpen }) => {

  const [reimbursements, setReimbursements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // ================= ADD MODAL =================
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    companyName: "",
    from: "",
    to: "",
    description: "",
    amount: "",
  });

  const [billFile, setBillFile] = useState(null);

  // ================= DESCRIPTION POPUP =================
  // Reuses the same "remark popup" look used on the Customers page.
  const [descPopupItem, setDescPopupItem] = useState(null);

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

  const handleFileChange = (e) => {
    setBillFile(e.target.files[0] || null);
  };

  const resetForm = () => {
    setFormData({
      companyName: "",
      from: "",
      to: "",
      description: "",
      amount: "",
    });
    setBillFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.companyName || !formData.from || !formData.to) {
      alert("Company Name, From and To are required");
      return;
    }

    setSubmitting(true);

    try {

      const data = new FormData();
      data.append("companyName", formData.companyName);
      data.append("from", formData.from);
      data.append("to", formData.to);
      data.append("description", formData.description);
      data.append("amount", formData.amount || 0);

      if (billFile) {
        data.append("billAttachment", billFile);
      }

      await API.post("/reimbursements", data);

      alert("Reimbursement submitted successfully. Sent to admin for approval.");

      resetForm();
      setShowAddModal(false);
      setCurrentPage(1);
      fetchReimbursements();

    } catch (error) {
      console.log(error);
      alert(
        error.response?.data?.message || "Failed to submit reimbursement"
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
              <th className="col-from-to">From</th>
              <th className="col-from-to">To</th>
              <th className="col-remark">Description</th>
              <th className="col-amount">Amount</th>
              <th className="col-bill">Bill</th>
              <th className="col-status">Status</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>

          <tbody>

            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: 20 }}>
                  Loading...
                </td>
              </tr>
            ) : currentItems.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: 20 }}>
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

                return (
                <tr key={item._id}>

                  <td className="col-sno">
                    {indexOfFirst + index + 1}
                  </td>

                  <td className="col-company" title={item.companyName}>
                    {item.companyName}
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
                    {item.billUrl ? (
                      <a
                        href={item.billUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="icon-btn bill-icon"
                        title="View Bill"
                      >
                        <FaFileAlt />
                      </a>
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
                        <button
                          className="icon-btn delete-icon"
                          title="Delete"
                          onClick={() => handleDelete(item)}
                        >
                          <FaTrash />
                        </button>
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
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="modal-header">
              <h2>Add Reimbursement</h2>
              <span
                className="close-icon"
                onClick={() => setShowAddModal(false)}
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
                <label>Bill Attachment</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                />
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Reimbursement"}
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

    </div>
  );
};

export default Reimbursement;