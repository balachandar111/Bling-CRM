// 📁 src/user/Opportunity.jsx
// USER PANEL — "Opportunity" section.
// Shows every customer of the logged-in user whose Lead Stage is
// "Desire". From here the user uploads the closing paperwork
// (Quotation / PO Received / SO / SOW / Invoice) and enters the deal
// value. Clicking "Deal Closed" submits everything and moves that
// customer's stage to "Closure".

import React, { useEffect, useState } from "react";
import API from "../services/api";
import { FaFileAlt, FaTimes, FaCheckCircle, FaEye, FaEdit } from "react-icons/fa";

const DOC_FIELDS = [
  { key: "quotation", label: "Quotation" },
  { key: "poReceived", label: "PO Received" },
  { key: "so", label: "SO" },
  { key: "sow", label: "SOW" },
  { key: "invoice", label: "Invoice" },
];

const Opportunity = ({ setSidebarOpen }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Which customer's "Documents" popup is currently open
  const [activeCustomer, setActiveCustomer] = useState(null);

  // { quotation: File, poReceived: File, ... }
  const [files, setFiles] = useState({});
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Extra customer details editable only when updating an
  // already-closed deal (name, company, contact info, etc.)
  const [extraDetails, setExtraDetails] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    priority: "",
    assignedTo: "",
    solution: "",
    product: "",
    followUpDate: "",
    remark: "",
  });

  // Closed customer currently open in the "view details" popup
  const [viewCustomer, setViewCustomer] = useState(null);

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/customers");
      setCustomers(data.customers || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // Only customers currently sitting in the "Desire" stage belong
  // in the Opportunity pipeline.
  const desireCustomers = customers.filter(
    (c) => c.leadStage === "Desire"
  );

  // Customers that have already been closed from this Opportunity flow.
  const closedCustomers = customers.filter(
    (c) => c.leadStage === "Closure"
  );

  const openDocumentsPopup = (customer) => {
    setActiveCustomer(customer);
    setFiles({});
    setValue(customer.value ? String(customer.value) : "");
    setExtraDetails({
      name: customer.name || "",
      company: customer.company || "",
      email: customer.email || "",
      phone: customer.phone || "",
      priority: customer.priority || "Medium",
      assignedTo: customer.assignedTo || "",
      solution: customer.solution || "",
      product: customer.product || "",
      followUpDate: customer.followUpDate
        ? String(customer.followUpDate).slice(0, 10)
        : "",
      remark: customer.remark || "",
    });
  };

  const closeDocumentsPopup = () => {
    setActiveCustomer(null);
    setFiles({});
    setValue("");
    setExtraDetails({
      name: "",
      company: "",
      email: "",
      phone: "",
      priority: "",
      assignedTo: "",
      solution: "",
      product: "",
      followUpDate: "",
      remark: "",
    });
  };

  const handleExtraDetailChange = (field, val) => {
    setExtraDetails((prev) => ({ ...prev, [field]: val }));
  };

  const handleFileChange = (fieldKey, fileList) => {
    const file = fileList && fileList[0];
    setFiles((prev) => ({
      ...prev,
      [fieldKey]: file,
    }));
  };

  const handleDealClosed = async (e) => {
    e.preventDefault();

    if (!activeCustomer) return;

    try {
      setSubmitting(true);

      const formData = new FormData();

      DOC_FIELDS.forEach(({ key }) => {
        if (files[key]) {
          formData.append(key, files[key]);
        }
      });

      formData.append("value", value || 0);

      const isUpdateMode = activeCustomer.leadStage === "Closure";

      await API.put(
        `/customers/${activeCustomer._id}/opportunity`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      // When updating an already-closed deal, also push the rest of
      // the customer's details (name, contact info, priority, etc.)
      // through the general customer update endpoint.
      if (isUpdateMode) {
        await API.put(`/customers/${activeCustomer._id}`, extraDetails);
      }

      alert(
        isUpdateMode
          ? "Deal details updated successfully!"
          : "Deal Closed Successfully! Customer moved to Closure."
      );
      closeDocumentsPopup();
      fetchCustomers();
    } catch (error) {
      console.log(error);
      alert(
        error.response?.data?.message ||
          "Something went wrong while closing the deal."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="customer-page">
      <div className="customer-topbar">
        <div className="header-left">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            ☰
          </button>

          <div>
            <h2 className="page-title">Opportunity</h2>
            <p className="page-subtitle">
              Customers in the Desire stage — upload closing documents and
              mark the deal as closed.
            </p>
          </div>
        </div>
      </div>

      <div className="customer-table-container">
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Company</th>
              <th>Name</th>
              <th>Contact Number</th>
              <th>Stage</th>
              <th>Documents</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                  Loading...
                </td>
              </tr>
            ) : desireCustomers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                  No customers in the Desire stage right now.
                </td>
              </tr>
            ) : (
              desireCustomers.map((customer, index) => (
                <tr key={customer._id}>
                  <td>{index + 1}</td>
                  <td>{customer.company || "-"}</td>
                  <td>{customer.name || "-"}</td>
                  <td>{customer.phone || "-"}</td>
                  <td>
                    <span className="stage-badge">{customer.leadStage}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      title="Upload closing documents"
                      onClick={() => openDocumentsPopup(customer)}
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: "18px",
                        color: "#2563EB",
                      }}
                    >
                      <FaFileAlt />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ================= CLOSED CUSTOMERS ================= */}
      <div className="customer-table-container" style={{ marginTop: "28px" }}>
        <h3 style={{ margin: "0 0 12px" }}>Closed Customers</h3>
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Company</th>
              <th>Name</th>
              <th>Contact Number</th>
              <th>Stage</th>
              <th>Value</th>
              <th>View</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "20px" }}>
                  Loading...
                </td>
              </tr>
            ) : closedCustomers.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "20px" }}>
                  No closed customers yet.
                </td>
              </tr>
            ) : (
              closedCustomers.map((customer, index) => (
                <tr
                  key={customer._id}
                  onClick={() => setViewCustomer(customer)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{index + 1}</td>
                  <td>{customer.company || "-"}</td>
                  <td>{customer.name || "-"}</td>
                  <td>{customer.phone || "-"}</td>
                  <td>
                    <span className="stage-badge">{customer.leadStage}</span>
                  </td>
                  <td>{customer.value || 0}</td>
                  <td>
                    <button
                      type="button"
                      title="View full details"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewCustomer(customer);
                      }}
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: "16px",
                        color: "#2563EB",
                      }}
                    >
                      <FaEye />
                    </button>
                  </td>
                  <td>
                    <button
                      type="button"
                      title="Update deal details"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDocumentsPopup(customer);
                      }}
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: "16px",
                        color: "#059669",
                      }}
                    >
                      <FaEdit />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ================= CLOSED CUSTOMER — FULL DETAILS POPUP ================= */}
      {viewCustomer && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Customer Details</h2>
              <span
                className="close-icon"
                onClick={() => setViewCustomer(null)}
              >
                <FaTimes />
              </span>
            </div>

            <div className="customer-detail-wrapper">
              <div className="detail-row">
                <span>Name</span>
                <h4>{viewCustomer.name || "-"}</h4>
              </div>
              <div className="detail-row">
                <span>Company</span>
                <h4>{viewCustomer.company || "-"}</h4>
              </div>
              <div className="detail-row">
                <span>Email</span>
                <h4>{viewCustomer.email || "-"}</h4>
              </div>
              <div className="detail-row">
                <span>Phone</span>
                <h4>{viewCustomer.phone || "-"}</h4>
              </div>
              <div className="detail-row">
                <span>Lead Stage</span>
                <h4>{viewCustomer.leadStage || "-"}</h4>
              </div>
              <div className="detail-row">
                <span>Priority</span>
                <h4>{viewCustomer.priority || "-"}</h4>
              </div>
              <div className="detail-row">
                <span>Assigned To</span>
                <h4>{viewCustomer.assignedTo || "-"}</h4>
              </div>
              <div className="detail-row">
                <span>Follow Up</span>
                <h4>{viewCustomer?.followUpDate?.slice(0, 10) || "-"}</h4>
              </div>
              <div className="view-box">
                <span>Solution</span>
                <h4>{viewCustomer.solution || "-"}</h4>
              </div>
              <div className="view-box">
                <span>Product</span>
                <h4>{viewCustomer.product || "-"}</h4>
              </div>
              <div className="view-box">
                <span>Deal Value</span>
                <h4>{viewCustomer.value || 0}</h4>
              </div>
              <div className="view-box">
                <span>Last Modified</span>
                <h4>
                  {viewCustomer.lastModified
                    ? new Date(viewCustomer.lastModified).toLocaleString()
                    : "N/A"}
                </h4>
              </div>
              <div className="detail-row full-row">
                <span>Remark</span>
                <h4>{viewCustomer.remark || "-"}</h4>
              </div>

              {/* CLOSING DOCUMENTS */}
              <div className="view-box full-width">
                <span>Closing Documents</span>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                    marginTop: "8px",
                  }}
                >
                  {DOC_FIELDS.map(({ key, label }) =>
                    viewCustomer.opportunityDocuments?.[key] ? (
                      <a
                        key={key}
                        href={viewCustomer.opportunityDocuments[key]}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          background: "#EFF6FF",
                          color: "#2563EB",
                          fontSize: "13px",
                          textDecoration: "none",
                        }}
                      >
                        <FaFileAlt /> {label}
                      </a>
                    ) : (
                      <span
                        key={key}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          background: "#F3F4F6",
                          color: "#9CA3AF",
                          fontSize: "13px",
                        }}
                      >
                        {label} — not uploaded
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeCustomer && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>
                {activeCustomer.leadStage === "Closure"
                  ? "Update Opportunity — "
                  : "Close Opportunity — "}
                {activeCustomer.name}
                {activeCustomer.company ? ` (${activeCustomer.company})` : ""}
              </h2>
              <span className="close-icon" onClick={closeDocumentsPopup}>
                <FaTimes />
              </span>
            </div>

            <form onSubmit={handleDealClosed}>
              <div className="form-grid">
                {DOC_FIELDS.map(({ key, label }) => (
                  <div className="input-group" key={key}>
                    <label>{label} (PDF)</label>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) =>
                        handleFileChange(key, e.target.files)
                      }
                    />
                    {activeCustomer.opportunityDocuments?.[key] && (
                      <a
                        href={activeCustomer.opportunityDocuments[key]}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: "12px", color: "#2563EB" }}
                      >
                        View previously uploaded file
                      </a>
                    )}
                  </div>
                ))}

                <div className="input-group">
                  <label>Value</label>
                  <input
                    type="number"
                    placeholder="Enter deal value"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    required
                  />
                </div>

                {activeCustomer.leadStage === "Closure" && (
                  <>
                    <div className="input-group">
                      <label>Name</label>
                      <input
                        type="text"
                        value={extraDetails.name}
                        onChange={(e) =>
                          handleExtraDetailChange("name", e.target.value)
                        }
                      />
                    </div>
                    <div className="input-group">
                      <label>Company</label>
                      <input
                        type="text"
                        value={extraDetails.company}
                        onChange={(e) =>
                          handleExtraDetailChange("company", e.target.value)
                        }
                      />
                    </div>
                    <div className="input-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={extraDetails.email}
                        onChange={(e) =>
                          handleExtraDetailChange("email", e.target.value)
                        }
                      />
                    </div>
                    <div className="input-group">
                      <label>Contact Number</label>
                      <input
                        type="text"
                        value={extraDetails.phone}
                        onChange={(e) =>
                          handleExtraDetailChange("phone", e.target.value)
                        }
                      />
                    </div>
                    <div className="input-group">
                      <label>Priority</label>
                      <select
                        value={extraDetails.priority}
                        onChange={(e) =>
                          handleExtraDetailChange("priority", e.target.value)
                        }
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label>Assigned To</label>
                      <input
                        type="text"
                        value={extraDetails.assignedTo}
                        onChange={(e) =>
                          handleExtraDetailChange("assignedTo", e.target.value)
                        }
                      />
                    </div>
                    <div className="input-group">
                      <label>Solution</label>
                      <input
                        type="text"
                        value={extraDetails.solution}
                        onChange={(e) =>
                          handleExtraDetailChange("solution", e.target.value)
                        }
                      />
                    </div>
                    <div className="input-group">
                      <label>Product</label>
                      <input
                        type="text"
                        value={extraDetails.product}
                        onChange={(e) =>
                          handleExtraDetailChange("product", e.target.value)
                        }
                      />
                    </div>
                    <div className="input-group">
                      <label>Follow Up Date</label>
                      <input
                        type="date"
                        value={extraDetails.followUpDate}
                        onChange={(e) =>
                          handleExtraDetailChange(
                            "followUpDate",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="input-group full-row">
                      <label>Remark</label>
                      <textarea
                        rows={3}
                        value={extraDetails.remark}
                        onChange={(e) =>
                          handleExtraDetailChange("remark", e.target.value)
                        }
                      />
                    </div>
                  </>
                )}
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={submitting}
              >
                <FaCheckCircle style={{ marginRight: "6px" }} />
                {submitting
                  ? "Submitting..."
                  : activeCustomer.leadStage === "Closure"
                  ? "Update Details"
                  : "Deal Closed"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Opportunity;