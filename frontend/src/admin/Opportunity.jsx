// 📁 src/admin/Opportunity.jsx
// ADMIN PANEL — "Opportunity" section.
// Shows every lead currently sitting in the "Desire" stage, along with
// the opportunity-tracking details entered by the assigned user
// (Proposal Value, Bottom Line, Achievement Level, Expected Deal
// Closure, Immediate Step to Action, Status). Read-only for admin —
// data is entered by the user from the user-panel "Opportunity" page.

import React, { useState } from "react";
import { FaBullseye, FaSearch, FaEye } from "react-icons/fa";
import "./Opportunity.css";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// "2026-08" -> "August 2026"
const formatMonth = (value) => {
  if (!value) return "-";
  const [year, month] = value.split("-");
  const monthIndex = parseInt(month, 10) - 1;
  if (Number.isNaN(monthIndex) || !MONTH_NAMES[monthIndex]) return value;
  return `${MONTH_NAMES[monthIndex]} ${year}`;
};

// "Payment Followup" -> "payment-followup" (for the badge class suffix)
const toClassSuffix = (value = "") =>
  value.trim().toLowerCase().replace(/\s+/g, "-");

const AdminOpportunity = ({
  opportunityCustomers = [],
  setSidebarOpen,
  setSelectedCustomer,
  setShowCustomerDetails,
}) => {
  const [search, setSearch] = useState("");

  const filteredCustomers = opportunityCustomers.filter((c) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      (c.company || "").toLowerCase().includes(term) ||
      (c.name || "").toLowerCase().includes(term) ||
      (c.assignedTo || "").toLowerCase().includes(term) ||
      (c.createdBy?.name || "").toLowerCase().includes(term)
    );
  });

  const handleView = (customer) => {
    if (setSelectedCustomer) setSelectedCustomer(customer);
    if (setShowCustomerDetails) setShowCustomerDetails(true);
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
            <h2 className="page-title">
              <FaBullseye className="opp-title-icon" />
              Opportunity
            </h2>
            <p className="page-subtitle">
              All leads currently in the Desire stage, with the
              opportunity details entered by the assigned user.
            </p>
          </div>
        </div>
      </div>

      <div className="customer-table-container opp-table-wrap">
        <div className="opp-toolbar">
          <div className="opp-toolbar-title">
            <FaBullseye /> {filteredCustomers.length} opportunit
            {filteredCustomers.length === 1 ? "y" : "ies"} in Desire stage
          </div>

          <div className="opp-search-wrap">
            <FaSearch className="opp-search-icon" />
            <input
              type="text"
              placeholder="Search by opp. name or account owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <table className="minimal-table">
          <thead>
            <tr>
              <th className="col-sno">S.No</th>
              <th className="col-opp-name">Opp. Name</th>
              <th className="col-owner">Account Owner</th>
              <th className="col-value">Proposal Value</th>
              <th className="col-value">Bottom Line</th>
              <th className="col-level">Achievement Level</th>
              <th className="col-closure">Expected Deal Closure</th>
              <th className="col-step">Immediate Step to Action</th>
              <th className="col-status">Status</th>
              <th className="col-actions">View</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr className="opp-empty-row">
                <td colSpan="10">
                  No opportunities in the Desire stage right now.
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer, index) => {
                const info = customer.opportunityInfo || {};
                const levelClass = info.achievementLevel
                  ? `opp-badge opp-badge-level-${toClassSuffix(
                      info.achievementLevel
                    )}`
                  : "opp-badge opp-badge-muted";
                const statusClass = info.status
                  ? `opp-badge opp-badge-status-${toClassSuffix(info.status)}`
                  : "opp-badge opp-badge-muted";

                return (
                  <tr key={customer._id}>
                    <td className="col-sno">{index + 1}</td>
                    <td className="col-opp-name">{customer.company || "-"}</td>
                    <td className="col-owner">
                      {customer.assignedTo ||
                        customer.createdBy?.name ||
                        "-"}
                    </td>
                    <td className="col-value">
                      {info.proposalValue ? (
                        `₹${Number(info.proposalValue).toLocaleString("en-IN")}`
                      ) : (
                        <span className="opp-empty-value">-</span>
                      )}
                    </td>
                    <td className="col-value">
                      {info.bottomLine ? (
                        `₹${Number(info.bottomLine).toLocaleString("en-IN")}`
                      ) : (
                        <span className="opp-empty-value">-</span>
                      )}
                    </td>
                    <td className="col-level">
                      <span className={levelClass}>
                        {info.achievementLevel || "-"}
                      </span>
                    </td>
                    <td className="col-closure">
                      {formatMonth(info.expectedDealClosure)}
                    </td>
                    <td className="col-step">
                      {info.immediateStepToAction || (
                        <span className="opp-empty-value">-</span>
                      )}
                    </td>
                    <td className="col-status">
                      <span className={statusClass}>
                        {info.status || "-"}
                      </span>
                    </td>
                    <td className="col-actions">
                      <button
                        type="button"
                        title="View full customer details"
                        onClick={() => handleView(customer)}
                        className="opp-icon-btn"
                      >
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOpportunity;