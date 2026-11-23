// 📁 src/admin/AdminLeadTrack.jsx
import React, { useState, useEffect } from "react";
import {
  FaBullseye,
  FaPlus,
  FaChartLine,
  FaEye,
  FaTrash,
  FaCheckCircle,
  FaUser,
  FaCalendarAlt,
  FaTimes,
  FaPhoneAlt,
  FaWhatsapp,
  FaLaptopCode,
  FaFileInvoice,
} from "react-icons/fa";
import API from "../services/api";
import "./AdminLeadTrack.css";

const STANDARD_PRODUCTS = [
  "Genunitys",
  "Rewards",
  "CRM",
  "Custom-Website",
  "WhatsappAtuomation",
];

const AdminLeadTrack = () => {
  const [activeTab, setActiveTab] = useState("report"); // "report" | "create" | "allTracks"
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [selectedUserFilter, setSelectedUserFilter] = useState("all");
  const [allTracks, setAllTracks] = useState([]);

  // Create Form State
  const [assignedTo, setAssignedTo] = useState("");
  const [startMonth, setStartMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [endMonth, setEndMonth] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 2);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [trackTitle, setTrackTitle] = useState("");
  const [productSelections, setProductSelections] = useState({
    Genunitys: { selected: true, target: 25 },
    Rewards: { selected: true, target: 25 },
    CRM: { selected: true, target: 25 },
    "Custom-Website": { selected: true, target: 25 },
    WhatsappAtuomation: { selected: true, target: 25 },
  });
  const [creating, setCreating] = useState(false);

  // Modal State for inspecting leads of a specific card
  const [selectedCardForModal, setSelectedCardForModal] = useState(null);

  // Fetch Users and Report on mount
  useEffect(() => {
    fetchUsers();
    fetchReport();
    fetchAllTracks();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await API.get("/users");
      setUsers(res.data.users || res.data || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await API.get("/lead-tracks/report/analytics");
      setReportData(res.data);
    } catch (err) {
      console.error("Failed to fetch lead track report:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTracks = async () => {
    try {
      const res = await API.get("/lead-tracks");
      setAllTracks(res.data.leadTracks || []);
    } catch (err) {
      console.error("Failed to fetch all tracks:", err);
    }
  };

  const handleProductToggle = (prod) => {
    setProductSelections((prev) => ({
      ...prev,
      [prod]: {
        ...prev[prod],
        selected: !prev[prod].selected,
      },
    }));
  };

  const handleTargetChange = (prod, value) => {
    const num = Math.max(0, parseInt(value, 10) || 0);
    setProductSelections((prev) => ({
      ...prev,
      [prod]: {
        ...prev[prod],
        target: num,
      },
    }));
  };

  const setAllTargets = (targetValue) => {
    setProductSelections((prev) => {
      const updated = {};
      STANDARD_PRODUCTS.forEach((p) => {
        updated[p] = {
          selected: true,
          target: targetValue,
        };
      });
      return updated;
    });
  };

  const handleCreateTrack = async (e) => {
    e.preventDefault();
    if (!assignedTo) {
      alert("Please select a user to assign the track to.");
      return;
    }

    const selectedProducts = STANDARD_PRODUCTS.filter(
      (p) => productSelections[p].selected
    ).map((p) => ({
      productName: p,
      target: productSelections[p].target,
    }));

    if (selectedProducts.length === 0) {
      alert("Please select at least one product with a target lead count.");
      return;
    }

    try {
      setCreating(true);
      const payload = {
        assignedTo,
        startMonth,
        endMonth,
        title: trackTitle.trim() || undefined,
        products: selectedProducts,
      };

      const res = await API.post("/lead-tracks", payload);
      alert(res.data.message || "Lead Track created successfully!");

      // Reset form
      setTrackTitle("");
      setActiveTab("report");
      fetchReport();
      fetchAllTracks();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to create Lead Track");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTrack = async (trackId) => {
    if (!window.confirm("Are you sure you want to delete this Lead Track? All onboarded lead tracking data will be removed.")) {
      return;
    }

    try {
      await API.delete(`/lead-tracks/${trackId}`);
      alert("Lead Track deleted successfully");
      fetchReport();
      fetchAllTracks();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete Lead Track");
    }
  };

  // Filtered users for the report view
  const usersToDisplay =
    reportData?.usersReport?.filter((u) => {
      if (selectedUserFilter === "all") return true;
      return String(u.userId) === String(selectedUserFilter);
    }) || [];

  return (
    <div className="alt-container">
      {/* HEADER */}
      <div className="alt-header">
        <div className="alt-header-text">
          <h1>
            <FaBullseye style={{ color: "#2563eb" }} /> Lead Track Management
          </h1>
          <p>
            Assign product lead targets to team members, track pipeline progression, and monitor monthly quotes.
          </p>
        </div>

        {/* TABS */}
        <div className="alt-nav-tabs">
          <button
            className={`alt-tab-btn ${activeTab === "report" ? "active" : ""}`}
            onClick={() => setActiveTab("report")}
          >
            <FaChartLine /> Performance &amp; Reports
          </button>
          <button
            className={`alt-tab-btn ${activeTab === "create" ? "active" : ""}`}
            onClick={() => setActiveTab("create")}
          >
            <FaPlus /> Create Lead Track
          </button>
          <button
            className={`alt-tab-btn ${activeTab === "allTracks" ? "active" : ""}`}
            onClick={() => setActiveTab("allTracks")}
          >
            <FaBullseye /> All Tracks ({allTracks.length})
          </button>
        </div>
      </div>

      {/* ================= TAB 1: REPORT & ANALYTICS ================= */}
      {activeTab === "report" && (
        <>
          {/* OVERALL KPI CARDS */}
          {reportData?.summary && (
            <div className="alt-kpi-grid">
              <div className="alt-kpi-card alt-kpi-highlight-blue">
                <span className="alt-kpi-label">Total Assigned Targets</span>
                <span className="alt-kpi-value">{reportData.summary.totalTarget}</span>
                <span className="alt-kpi-sub">Across all active tracks</span>
              </div>

              <div className="alt-kpi-card alt-kpi-highlight-purple">
                <span className="alt-kpi-label">Leads Onboarded</span>
                <span className="alt-kpi-value">{reportData.summary.totalOnboarded}</span>
                <span className="alt-kpi-sub">In tracking workspace</span>
              </div>

              <div className="alt-kpi-card alt-kpi-highlight-green">
                <span className="alt-kpi-label">Total Quoted Leads</span>
                <span className="alt-kpi-value">{reportData.summary.totalQuoted}</span>
                <span className="alt-kpi-sub">Reached Quote stage</span>
              </div>

              <div className="alt-kpi-card alt-kpi-highlight-amber">
                <span className="alt-kpi-label">Remaining Target</span>
                <span className="alt-kpi-value">{reportData.summary.totalRemainingTarget}</span>
                <span className="alt-kpi-sub">Leads left to Quote</span>
              </div>

              <div className="alt-kpi-card" style={{ borderLeft: "4px solid #0284c7" }}>
                <span className="alt-kpi-label">{reportData.summary.currentMonthName || "This Month"} Quotes</span>
                <span className="alt-kpi-value" style={{ color: "#0284c7" }}>
                  {reportData.summary.currentMonthQuoted}
                </span>
                <span className="alt-kpi-sub">Converted this month</span>
              </div>

              <div className="alt-kpi-card" style={{ borderLeft: "4px solid #e11d48" }}>
                <span className="alt-kpi-label">{reportData.summary.lastMonthName || "Last Month"} Quotes</span>
                <span className="alt-kpi-value" style={{ color: "#e11d48" }}>
                  {reportData.summary.lastMonthQuoted}
                </span>
                <span className="alt-kpi-sub">Converted last month</span>
              </div>
            </div>
          )}

          {/* USER SELECTION FILTER */}
          <div className="alt-filter-bar">
            <div className="alt-filter-left">
              <label style={{ fontSize: "14px", fontWeight: 600, color: "#334155" }}>
                <FaUser style={{ marginRight: "6px" }} /> Filter by User:
              </label>
              <select
                className="alt-select"
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
              >
                <option value="all">All Tracked Users ({reportData?.usersReport?.length || 0})</option>
                {reportData?.usersReport?.map((u) => (
                  <option key={u.userId} value={u.userId}>
                    {u.userName} ({u.cardsCount} cards - {u.totalQuoted}/{u.totalTarget} Quoted)
                  </option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: "13px", color: "#64748b" }}>
              Showing {usersToDisplay.length} user report(s)
            </div>
          </div>

          {/* USER REPORT CARDS */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
              Loading lead track reports...
            </div>
          ) : usersToDisplay.length === 0 ? (
            <div
              style={{
                background: "#ffffff",
                padding: "40px",
                borderRadius: "12px",
                textAlign: "center",
                border: "1px dashed #cbd5e1",
              }}
            >
              <h3 style={{ margin: "0 0 8px 0", color: "#334155" }}>No Lead Tracks Found</h3>
              <p style={{ margin: "0 0 16px 0", color: "#64748b", fontSize: "14px" }}>
                There are no active lead tracks created yet for this selection.
              </p>
              <button
                className="alt-card-btn"
                style={{ width: "auto", margin: "0 auto", padding: "8px 20px" }}
                onClick={() => setActiveTab("create")}
              >
                <FaPlus /> Create First Lead Track
              </button>
            </div>
          ) : (
            usersToDisplay.map((user) => (
              <div key={user.userId} className="alt-user-report-card">
                {/* USER CARD HEADER */}
                <div className="alt-user-report-header">
                  <div className="alt-user-info">
                    <h3>👤 {user.userName}</h3>
                    <span>{user.userEmail || "Team Member"}</span>
                  </div>

                  <div className="alt-user-metrics">
                    <span className="alt-metric-pill primary">
                      Cards: {user.cardsCount}
                    </span>
                    <span className="alt-metric-pill">
                      Total Target: {user.totalTarget}
                    </span>
                    <span className="alt-metric-pill">
                      Onboarded: {user.totalOnboarded}
                    </span>
                    <span className="alt-metric-pill success">
                      Quoted: {user.totalQuoted}
                    </span>
                    <span className="alt-metric-pill warning">
                      Remaining Target: {user.remainingTarget}
                    </span>
                    <span className="alt-metric-pill" style={{ background: "#f0fdf4", color: "#166534" }}>
                      This Month Quoted: {user.currentMonthQuoted}
                    </span>
                    <span className="alt-metric-pill" style={{ background: "#fff1f2", color: "#9f1239" }}>
                      Last Month Quoted: {user.lastMonthQuoted}
                    </span>
                  </div>
                </div>

                {/* USER'S PRODUCT CARDS GRID */}
                <div className="alt-product-cards-grid">
                  {user.cards.map((card, idx) => (
                    <div key={idx} className="alt-product-card">
                      <div>
                        <div className="alt-card-top">
                          <span className="alt-prod-title">{card.productName}</span>
                          <span
                            className="alt-tag-badge"
                            style={{
                              background: card.remainingTarget === 0 ? "#dcfce7" : "#eff6ff",
                              color: card.remainingTarget === 0 ? "#15803d" : "#2563eb",
                            }}
                          >
                            {card.remainingTarget === 0 ? "Target Met 🎉" : "Active"}
                          </span>
                        </div>

                        <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "12px" }}>
                          📅 {card.startMonth} to {card.endMonth}
                        </div>

                        {/* COUNTS GRID */}
                        <div className="alt-card-counts">
                          <div className="alt-count-box">
                            <span className="label">Target Lead</span>
                            <span className="val">{card.target}</span>
                          </div>
                          <div className="alt-count-box highlight">
                            <span className="label">Quoted Achieved</span>
                            <span className="val">{card.quotedCount}</span>
                          </div>
                          <div className="alt-count-box">
                            <span className="label">Onboarded Leads</span>
                            <span className="val">{card.onboardedCount}</span>
                          </div>
                          <div className="alt-count-box rem-highlight">
                            <span className="label">Remaining Target</span>
                            <span className="val">{card.remainingTarget}</span>
                          </div>
                        </div>

                        {/* STAGE BREAKDOWN */}
                        <div className="alt-stage-badges">
                          <span className="alt-stage-chip">
                            📞 Call: {card.leads.filter((l) => l.stage === "Call").length}
                          </span>
                          <span className="alt-stage-chip">
                            💬 WhatsApp: {card.leads.filter((l) => l.stage === "WhatsappMessage").length}
                          </span>
                          <span className="alt-stage-chip">
                            🖥️ Demo: {card.leads.filter((l) => l.stage === "Demo").length}
                          </span>
                          <span className="alt-stage-chip quote">
                            📝 Quote: {card.quotedCount}
                          </span>
                        </div>
                      </div>

                      <button
                        className="alt-card-btn"
                        onClick={() => setSelectedCardForModal({ ...card, userName: user.userName })}
                      >
                        <FaEye /> View Onboarded Leads ({card.onboardedCount})
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* ================= TAB 2: CREATE LEAD TRACK ================= */}
      {activeTab === "create" && (
        <div className="alt-form-container">
          <h2 className="alt-form-title">➕ Create New Lead Track</h2>
          <p className="alt-form-desc">
            Assign lead targets for specific products to a user for a chosen duration.
          </p>

          <form onSubmit={handleCreateTrack}>
            <div className="alt-form-grid">
              {/* SELECT USER */}
              <div className="alt-form-group full">
                <label>👤 Select User / Employee *</label>
                <select
                  className="alt-input"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  required
                >
                  <option value="">-- Choose User --</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* DURATION START MONTH */}
              <div className="alt-form-group">
                <label>📅 Start Month *</label>
                <input
                  type="month"
                  className="alt-input"
                  value={startMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
                  required
                />
              </div>

              {/* DURATION END MONTH */}
              <div className="alt-form-group">
                <label>📅 End Month *</label>
                <input
                  type="month"
                  className="alt-input"
                  value={endMonth}
                  onChange={(e) => setEndMonth(e.target.value)}
                  required
                />
              </div>

              {/* OPTIONAL TITLE */}
              <div className="alt-form-group full">
                <label>Track Title (Optional)</label>
                <input
                  type="text"
                  className="alt-input"
                  placeholder="e.g. Q1 Sales Targets 2026"
                  value={trackTitle}
                  onChange={(e) => setTrackTitle(e.target.value)}
                />
              </div>
            </div>

            {/* PRODUCT SELECTION & TARGET SETUP */}
            <div className="alt-product-selection-box">
              <div className="alt-ps-header">
                <h4>🎯 Products &amp; Target Leads</h4>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    className="alt-quick-btn"
                    onClick={() => setAllTargets(25)}
                  >
                    Select All (Target: 25)
                  </button>
                  <button
                    type="button"
                    className="alt-quick-btn"
                    onClick={() => setAllTargets(50)}
                  >
                    Set All to 50
                  </button>
                </div>
              </div>

              {STANDARD_PRODUCTS.map((prod) => (
                <div key={prod} className="alt-product-row">
                  <label className="alt-product-check-label">
                    <input
                      type="checkbox"
                      checked={productSelections[prod].selected}
                      onChange={() => handleProductToggle(prod)}
                    />
                    <span>{prod}</span>
                  </label>

                  <div className="alt-target-input-box">
                    <span>Target Leads:</span>
                    <input
                      type="number"
                      min="1"
                      className="alt-target-input"
                      disabled={!productSelections[prod].selected}
                      value={productSelections[prod].target}
                      onChange={(e) => handleTargetChange(prod, e.target.value)}
                      style={{
                        opacity: productSelections[prod].selected ? 1 : 0.5,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button type="submit" className="alt-submit-btn" disabled={creating}>
              {creating ? "Creating Lead Track..." : "🚀 Create and Assign Lead Track"}
            </button>
          </form>
        </div>
      )}

      {/* ================= TAB 3: ALL TRACKS ================= */}
      {activeTab === "allTracks" && (
        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#0f172a" }}>
            All Active &amp; Historical Lead Tracks
          </h3>

          {allTracks.length === 0 ? (
            <p style={{ color: "#64748b" }}>No lead tracks found.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="alt-leads-table">
                <thead>
                  <tr>
                    <th>Title / User</th>
                    <th>Duration</th>
                    <th>Products &amp; Targets</th>
                    <th>Total Target</th>
                    <th>Onboarded</th>
                    <th>Quoted Achieved</th>
                    <th>Remaining</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allTracks.map((t) => (
                    <tr key={t._id}>
                      <td>
                        <strong>{t.title || "Lead Track"}</strong>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>
                          Assigned to: {t.assignedToName || t.assignedTo?.name || "User"}
                        </div>
                      </td>
                      <td>
                        {t.startMonth} to {t.endMonth}
                      </td>
                      <td>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                          {t.products.map((p, idx) => (
                            <span key={idx} className="alt-stage-chip">
                              {p.productName}: <strong>{p.target}</strong>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td><strong>{t.totalTarget}</strong></td>
                      <td>{t.totalOnboarded}</td>
                      <td><span style={{ color: "#16a34a", fontWeight: 700 }}>{t.totalQuoted}</span></td>
                      <td><span style={{ color: "#d97706", fontWeight: 700 }}>{t.totalRemainingTarget}</span></td>
                      <td>
                        <span className={`alt-tag-badge`} style={{ background: "#e2e8f0", color: "#334155" }}>
                          {t.status}
                        </span>
                      </td>
                      <td>
                        <button
                          style={{
                            background: "#fee2e2",
                            border: "none",
                            color: "#ef4444",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            cursor: "pointer",
                          }}
                          onClick={() => handleDeleteTrack(t._id)}
                          title="Delete Track"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: INSPECT LEADS OF A CARD ================= */}
      {selectedCardForModal && (
        <div className="alt-modal-overlay" onClick={() => setSelectedCardForModal(null)}>
          <div className="alt-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="alt-modal-header">
              <div>
                <h3>
                  {selectedCardForModal.productName} - Lead Tracking
                </h3>
                <span style={{ fontSize: "13px", color: "#64748b" }}>
                  Assigned User: <strong>{selectedCardForModal.userName}</strong> | Target: {selectedCardForModal.target} | Quoted: {selectedCardForModal.quotedCount} | Remaining: {selectedCardForModal.remainingTarget}
                </span>
              </div>
              <button className="alt-close-btn" onClick={() => setSelectedCardForModal(null)}>
                <FaTimes />
              </button>
            </div>

            <div className="alt-modal-body">
              {selectedCardForModal.leads.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                  No leads have been onboarded into this product card yet.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="alt-leads-table">
                    <thead>
                      <tr>
                        <th>Lead / Company</th>
                        <th>Contact</th>
                        <th>Location</th>
                        <th>Current Stage</th>
                        <th>Stage History</th>
                        <th>Quoted Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCardForModal.leads.map((lead, idx) => (
                        <tr key={idx}>
                          <td>
                            <strong>{lead.name || "Unnamed Lead"}</strong>
                            {lead.company && (
                              <div style={{ fontSize: "12px", color: "#64748b" }}>
                                {lead.company}
                              </div>
                            )}
                          </td>
                          <td>
                            <div>{lead.phone || "-"}</div>
                            {lead.email && (
                              <div style={{ fontSize: "12px", color: "#64748b" }}>{lead.email}</div>
                            )}
                          </td>
                          <td>{lead.location || "-"}</td>
                          <td>
                            <span className={`alt-stage-pill ${lead.stage}`}>
                              {lead.stage}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>
                              {lead.stageHistory && lead.stageHistory.length > 0 ? (
                                lead.stageHistory.map((h, hIdx) => (
                                  <div key={hIdx}>
                                    • {h.stage} ({new Date(h.updatedAt).toLocaleDateString()})
                                  </div>
                                ))
                              ) : (
                                "No history"
                              )}
                            </div>
                          </td>
                          <td>
                            {lead.quotedAt ? (
                              <span style={{ color: "#16a34a", fontWeight: 600 }}>
                                {new Date(lead.quotedAt).toLocaleDateString()}
                              </span>
                            ) : (
                              <span style={{ color: "#94a3b8" }}>Not Quoted</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLeadTrack;
