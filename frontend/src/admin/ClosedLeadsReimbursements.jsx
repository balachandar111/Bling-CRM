// 📁 src/admin/ClosedLeadsReimbursements.jsx
import React, { useState } from "react";
import {
  FaHandshake,
  FaMoneyBillWave,
  FaFileAlt,
  FaSyncAlt,
  FaCommentDots,
  FaEye,
  FaSearch,
} from "react-icons/fa";

// ================= CLOSED LEADS & REIMBURSEMENTS (ADMIN) =================
// Single admin section that lets an admin review, in one place:
//   1) Every customer whose lead has reached the "Closure" stage
//   2) Every reimbursement claim submitted by every employee
//
// All data is fetched/derived in Dashboard.jsx and simply handed down
// here as props, matching the pattern used by LeaveRequests.jsx.

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

const ClosedLeadsReimbursements = ({
  closedLeadCustomers = [],
  totalClosedValue = 0,
  reimbursements = [],
  loadingReimbursements = false,
  fetchAllReimbursements,
  setSidebarOpen,
  setSelectedCustomer,
  setShowCustomerDetails,
}) => {

  const [tab, setTab] = useState("leads"); // "leads" | "reimbursements"
  const [leadSearch, setLeadSearch] = useState("");
  const [reimbSearch, setReimbSearch] = useState("");
  const [descPopupItem, setDescPopupItem] = useState(null);

  const filteredLeads = closedLeadCustomers.filter((c) =>
    !leadSearch ||
    (c.name || "").toLowerCase().includes(leadSearch.toLowerCase()) ||
    (c.company || "").toLowerCase().includes(leadSearch.toLowerCase())
  );

  const filteredReimbursements = reimbursements.filter((r) =>
    !reimbSearch ||
    (r.companyName || "").toLowerCase().includes(reimbSearch.toLowerCase()) ||
    (r.createdBy?.name || "").toLowerCase().includes(reimbSearch.toLowerCase())
  );

  const totalReimbursementCount = reimbursements.length;

  const handleViewLead = (customer) => {
    if (setSelectedCustomer) setSelectedCustomer(customer);
    if (setShowCustomerDetails) setShowCustomerDetails(true);
  };

  return (
    <div className="customer-page clr-page">

      {/* HEADER */}
      <div className="customer-topbar">
        <div className="header-left">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            ☰
          </button>

          <div>
            <h2 className="page-title">Closed Leads &amp; Reimbursements</h2>
            <p className="page-subtitle">
              Review closed deals and employee reimbursement claims
            </p>
          </div>
        </div>

        <div className="top-actions">
          {tab === "reimbursements" && (
            <button
              type="button"
              className="add-employee-btn clr-refresh-btn"
              onClick={fetchAllReimbursements}
              disabled={loadingReimbursements}
            >
              <FaSyncAlt />
              {loadingReimbursements ? "Refreshing..." : "Refresh"}
            </button>
          )}
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="clr-stats-grid">
        <div className="stat-card">
          <div>
            <h4>Closed Leads</h4>
            <h2>{closedLeadCustomers.length}</h2>
          </div>
          <FaHandshake className="icon green" />
        </div>

        <div className="stat-card">
          <div>
            <h4>Closed Value</h4>
            <h2>₹{totalClosedValue.toLocaleString("en-IN")}</h2>
          </div>
          <FaMoneyBillWave className="icon purple" />
        </div>

        <div className="stat-card">
          <div>
            <h4>Reimbursement Claims</h4>
            <h2>{totalReimbursementCount}</h2>
          </div>
          <FaFileAlt className="icon orange" />
        </div>
      </div>

      {/* TABS */}
      <div className="clr-tabs">
        <button
          type="button"
          className={tab === "leads" ? "clr-tab active" : "clr-tab"}
          onClick={() => setTab("leads")}
        >
          <FaHandshake /> Closed Leads
          <span className="clr-tab-count">{closedLeadCustomers.length}</span>
        </button>
        <button
          type="button"
          className={tab === "reimbursements" ? "clr-tab active" : "clr-tab"}
          onClick={() => setTab("reimbursements")}
        >
          <FaMoneyBillWave /> Reimbursements
          <span className="clr-tab-count">{totalReimbursementCount}</span>
        </button>
      </div>

      {/* ================= CLOSED LEADS TAB ================= */}
      {tab === "leads" && (
        <div className="customer-table-container clr-table-wrap">

          <div className="clr-toolbar">
            <div className="clr-toolbar-title">
              <FaHandshake /> {filteredLeads.length} closed lead
              {filteredLeads.length === 1 ? "" : "s"}
            </div>

            <div className="clr-search-wrap">
              <FaSearch className="clr-search-icon" />
              <input
                type="text"
                placeholder="Search by name or company..."
                value={leadSearch}
                onChange={(e) => setLeadSearch(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <table className="minimal-table">
            <thead>
              <tr>
                <th className="col-sno">S.No</th>
                <th className="col-lead-company">Company</th>
                <th className="col-lead-contact">Contact</th>
                <th className="col-lead-assigned">Assigned To</th>
                <th className="col-lead-service">Service</th>
                <th className="col-lead-value">Value</th>
                <th className="col-lead-date">Closed On</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="clr-empty-cell">
                    No closed leads found.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((c, index) => (
                  <tr key={c._id}>
                    <td className="col-sno">{index + 1}</td>
                    <td className="col-lead-company" title={c.company}>{c.company || "-"}</td>
                    <td className="col-lead-contact" title={c.name}>{c.name || "-"}</td>
                    <td className="col-lead-assigned">{c.assignedTo || "-"}</td>
                    <td className="col-lead-service">{c.service || "-"}</td>
                    <td className="col-lead-value">
                      <span className="clr-value-pill">
                        ₹{(Number(c.value) || 0).toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="col-lead-date">
                      {c.lastModified || c.createdAt
                        ? new Date(
                            c.lastModified || c.createdAt
                          ).toLocaleDateString("en-IN")
                        : "-"}
                    </td>
                    <td className="col-actions">
                      <div className="action-icons">
                        <button
                          className="icon-btn view-icon"
                          title="View Details"
                          onClick={() => handleViewLead(c)}
                        >
                          <FaEye />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= REIMBURSEMENTS TAB ================= */}
      {tab === "reimbursements" && (
        <div className="customer-table-container clr-table-wrap">

          <div className="clr-toolbar">
            <div className="clr-toolbar-title">
              <FaMoneyBillWave /> {filteredReimbursements.length} claim
              {filteredReimbursements.length === 1 ? "" : "s"}
            </div>

            <div className="clr-search-wrap">
              <FaSearch className="clr-search-icon" />
              <input
                type="text"
                placeholder="Search by employee or company..."
                value={reimbSearch}
                onChange={(e) => setReimbSearch(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <table className="minimal-table">
            <thead>
              <tr>
                <th className="col-sno">S.No</th>
                <th className="col-employee">Employee</th>
                <th className="col-company">Company Name</th>
                <th className="col-from-to">From</th>
                <th className="col-from-to">To</th>
                <th className="col-remark">Description</th>
                <th className="col-bill">Bill</th>
                <th className="col-date">Submitted On</th>
              </tr>
            </thead>

            <tbody>
              {loadingReimbursements ? (
                <tr>
                  <td colSpan={8} className="clr-empty-cell">
                    Loading...
                  </td>
                </tr>
              ) : filteredReimbursements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="clr-empty-cell">
                    No reimbursements submitted yet.
                  </td>
                </tr>
              ) : (
                filteredReimbursements.map((item, index) => (
                  <tr key={item._id}>
                    <td className="col-sno">{index + 1}</td>
                    <td className="col-employee">
                      <div className="clr-employee-cell">
                        <span className="clr-avatar">
                          {getInitials(item.createdBy?.name)}
                        </span>
                        {item.createdBy?.name || "-"}
                      </div>
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
                    <td className="col-date">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString("en-IN")
                        : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
                <p className="remark-current">{descPopupItem.description}</p>
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

export default ClosedLeadsReimbursements;