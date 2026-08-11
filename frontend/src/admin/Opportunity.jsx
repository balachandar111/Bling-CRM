// 📁 src/admin/Opportunity.jsx
// ADMIN PANEL — "Opportunity" section.
// Shows every lead currently sitting in the "Desire" stage, along with
// the opportunity-tracking details entered by the assigned user
// (Type/Offering, Proposal Value, Bottom Line, Achievement Level,
// Expected Deal Closure, Immediate Step to Action, Status).
//
// Admin can edit EVERYTHING from this page — both the customer's core
// details (name, company, email, phone, account owner, product/service
// offering) and every Opportunity Info field (Proposal Value, Bottom
// Line, Achievement Level, Expected Deal Closure, Immediate Step to
// Action, Status) — via the single "Edit" modal below. Saving pushes
// the core fields to `PUT /customers/:id` and the opportunity fields to
// `PUT /customers/:id/opportunity-info`.

import React, { useState } from "react";
import { FaBullseye, FaSearch, FaEye, FaEdit, FaTimes, FaCheckCircle } from "react-icons/fa";
import API from "../services/api";
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

// Derives the "Offering" / Type for a customer from the existing
// `product` and `service` fields entered on the customer record.
// Returns one of: "Product", "Service", "Product & Service", or null
// when neither has been filled in yet.
const getOfferingType = (customer) => {
  const hasProduct = !!(customer.product && String(customer.product).trim());
  const hasService = !!(customer.service && String(customer.service).trim());

  if (hasProduct && hasService) return "Product & Service";
  if (hasProduct) return "Product";
  if (hasService) return "Service";
  return null;
};

const PRODUCT_OPTIONS = [
  "Bling Rewards",
  "Digital Warranty",
  "Track and Trace",
  "Dealer Module",
  "Custom Application Development",
];

const SERVICE_OPTIONS = [
  "CRM",
  "WhatsApp Bot Service Sales",
  "Customized Application Sales",
  "Genuinity",
  "Quick Commerce Marketing Business",
];

const ACHIEVEMENT_LEVEL_OPTIONS = ["High", "Medium", "Low"];

const OPPORTUNITY_STATUS_OPTIONS = [
  "PO",
  "Hold",
  "Quote",
  "Followup",
  "Meeting",
  "Negotiation",
];

const EMPTY_EDIT_FORM = {
  // Core customer details
  name: "",
  company: "",
  email: "",
  phone: "",
  assignedTo: "",
  hasProduct: false,
  hasService: false,
  product: "",
  service: "",

  // Opportunity Info (Desire stage tracking)
  proposalValue: "",
  bottomLine: "",
  achievementLevel: "",
  expectedDealClosure: "",
  immediateStepToAction: "",
  status: "",
};

const AdminOpportunity = ({
  opportunityCustomers = [],
  setSidebarOpen,
  setSelectedCustomer,
  setShowCustomerDetails,
  onCustomerUpdated,
}) => {
  const [search, setSearch] = useState("");

  // ================= EDIT MODAL STATE =================
  const [editCustomer, setEditCustomer] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [saving, setSaving] = useState(false);

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

  // ================= EDIT MODAL HANDLERS =================

  const openEditModal = (customer) => {
    const info = customer.opportunityInfo || {};

    setEditCustomer(customer);
    setEditForm({
      name: customer.name || "",
      company: customer.company || "",
      email: customer.email || "",
      phone: customer.phone || "",
      assignedTo: customer.assignedTo || "",
      hasProduct: !!customer.product,
      hasService: !!customer.service,
      product: customer.product || "",
      service: customer.service || "",

      proposalValue:
        info.proposalValue != null ? String(info.proposalValue) : "",
      bottomLine: info.bottomLine != null ? String(info.bottomLine) : "",
      achievementLevel: info.achievementLevel || "",
      expectedDealClosure: info.expectedDealClosure || "",
      immediateStepToAction: info.immediateStepToAction || "",
      status: info.status || "",
    });
  };

  const closeEditModal = () => {
    setEditCustomer(null);
    setEditForm(EMPTY_EDIT_FORM);
  };

  const handleEditChange = (field, val) => {
    setEditForm((prev) => ({ ...prev, [field]: val }));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();

    if (!editCustomer) return;

    try {
      setSaving(true);

      // Core customer details
      await API.put(`/customers/${editCustomer._id}`, {
        name: editForm.name,
        company: editForm.company,
        email: editForm.email,
        phone: editForm.phone,
        assignedTo: editForm.assignedTo,
        product: editForm.hasProduct ? editForm.product : "",
        service: editForm.hasService ? editForm.service : "",
      });

      // Opportunity Info details
      await API.put(`/customers/${editCustomer._id}/opportunity-info`, {
        proposalValue: editForm.proposalValue,
        bottomLine: editForm.bottomLine,
        achievementLevel: editForm.achievementLevel,
        expectedDealClosure: editForm.expectedDealClosure,
        immediateStepToAction: editForm.immediateStepToAction,
        status: editForm.status,
      });

      alert("Opportunity updated successfully!");
      closeEditModal();
      if (onCustomerUpdated) onCustomerUpdated();
    } catch (error) {
      console.log(error);
      alert(
        error.response?.data?.message ||
          "Something went wrong while saving changes."
      );
    } finally {
      setSaving(false);
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
            <h2 className="page-title">
              <FaBullseye className="opp-title-icon" />
              Opportunity
            </h2>
            <p className="page-subtitle">
              All leads currently in the Desire stage. Admin can view and
              edit every customer and opportunity detail here.
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
              <th className="col-type">Type</th>
              <th className="col-value">Proposal Value</th>
              <th className="col-value">Bottom Line</th>
              <th className="col-level">Achievement Level</th>
              <th className="col-closure">Expected Deal Closure</th>
              <th className="col-step">Immediate Step to Action</th>
              <th className="col-status">Status</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr className="opp-empty-row">
                <td colSpan="11">
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

                const offeringType = getOfferingType(customer);
                const typeClass = offeringType
                  ? `opp-badge opp-badge-type-${toClassSuffix(
                      offeringType.replace(/&/g, "")
                    )}`
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
                    <td className="col-type">
                      <span className={typeClass}>
                        {offeringType || "-"}
                      </span>
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
                      <div className="opp-action-icons">
                        <button
                          type="button"
                          title="View full customer details"
                          onClick={() => handleView(customer)}
                          className="opp-icon-btn"
                        >
                          <FaEye />
                        </button>
                        <button
                          type="button"
                          title="Edit customer & opportunity details"
                          onClick={() => openEditModal(customer)}
                          className="opp-icon-btn opp-icon-btn-edit"
                        >
                          <FaEdit />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ================= EDIT MODAL (CUSTOMER + OPPORTUNITY INFO) ================= */}
      {editCustomer && (
        <div className="modal-overlay">
          <div className="modal opp-edit-modal">
            <div className="modal-header">
              <h2>
                Edit Opportunity — {editCustomer.name}
                {editCustomer.company ? ` (${editCustomer.company})` : ""}
              </h2>
              <span className="close-icon" onClick={closeEditModal}>
                <FaTimes />
              </span>
            </div>

            <form onSubmit={handleSaveEdit}>
              <h3 className="opp-modal-section-title">Customer Details</h3>
              <div className="form-grid">
                <div className="input-group">
                  <label>Customer Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => handleEditChange("name", e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label>Company</label>
                  <input
                    type="text"
                    value={editForm.company}
                    onChange={(e) =>
                      handleEditChange("company", e.target.value)
                    }
                  />
                </div>

                <div className="input-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      handleEditChange("email", e.target.value)
                    }
                  />
                </div>

                <div className="input-group">
                  <label>Contact Number</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) =>
                      handleEditChange("phone", e.target.value)
                    }
                  />
                </div>

                <div className="input-group">
                  <label>Account Owner (Assigned To)</label>
                  <input
                    type="text"
                    value={editForm.assignedTo}
                    onChange={(e) =>
                      handleEditChange("assignedTo", e.target.value)
                    }
                  />
                </div>

                <div className="input-group">
                  <label>Type / Offering</label>
                  <div className="opp-offering-checks">
                    <label className="opp-checkbox-label">
                      <input
                        type="checkbox"
                        checked={editForm.hasProduct}
                        onChange={(e) =>
                          handleEditChange("hasProduct", e.target.checked)
                        }
                      />
                      Product
                    </label>

                    <label className="opp-checkbox-label">
                      <input
                        type="checkbox"
                        checked={editForm.hasService}
                        onChange={(e) =>
                          handleEditChange("hasService", e.target.checked)
                        }
                      />
                      Service
                    </label>
                  </div>
                </div>

                {editForm.hasProduct && (
                  <div className="input-group">
                    <label>Product</label>
                    <select
                      value={editForm.product}
                      onChange={(e) =>
                        handleEditChange("product", e.target.value)
                      }
                    >
                      <option value="">Select Product</option>
                      {PRODUCT_OPTIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {editForm.hasService && (
                  <div className="input-group">
                    <label>Service</label>
                    <select
                      value={editForm.service}
                      onChange={(e) =>
                        handleEditChange("service", e.target.value)
                      }
                    >
                      <option value="">Select Service</option>
                      {SERVICE_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <h3 className="opp-modal-section-title">Opportunity Info</h3>
              <div className="form-grid">
                <div className="input-group">
                  <label>Proposal Value</label>
                  <input
                    type="number"
                    placeholder="Enter proposal value"
                    value={editForm.proposalValue}
                    onChange={(e) =>
                      handleEditChange("proposalValue", e.target.value)
                    }
                  />
                </div>

                <div className="input-group">
                  <label>Bottom Line</label>
                  <input
                    type="number"
                    placeholder="Enter bottom line value"
                    value={editForm.bottomLine}
                    onChange={(e) =>
                      handleEditChange("bottomLine", e.target.value)
                    }
                  />
                </div>

                <div className="input-group">
                  <label>Achievement Level</label>
                  <select
                    value={editForm.achievementLevel}
                    onChange={(e) =>
                      handleEditChange("achievementLevel", e.target.value)
                    }
                  >
                    <option value="">Select level</option>
                    {ACHIEVEMENT_LEVEL_OPTIONS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label>Expected Deal Closure</label>
                  <input
                    type="month"
                    value={editForm.expectedDealClosure}
                    onChange={(e) =>
                      handleEditChange("expectedDealClosure", e.target.value)
                    }
                  />
                </div>

                <div className="input-group">
                  <label>Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      handleEditChange("status", e.target.value)
                    }
                  >
                    <option value="">Select status</option>
                    {OPPORTUNITY_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group full-row">
                  <label>Immediate Step to Action</label>
                  <textarea
                    rows={3}
                    placeholder="What's the next step to move this deal forward?"
                    value={editForm.immediateStepToAction}
                    onChange={(e) =>
                      handleEditChange(
                        "immediateStepToAction",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={saving}>
                <FaCheckCircle style={{ marginRight: "6px" }} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOpportunity;