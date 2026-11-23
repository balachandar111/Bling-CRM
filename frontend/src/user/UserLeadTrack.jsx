// 📁 src/user/UserLeadTrack.jsx
import React, { useState, useEffect } from "react";
import {
  FaBullseye,
  FaArrowLeft,
  FaPlus,
  FaPhoneAlt,
  FaWhatsapp,
  FaLaptopCode,
  FaFileInvoice,
  FaCheckCircle,
  FaTrash,
  FaSearch,
  FaTimes,
  FaUserCheck,
  FaExternalLinkAlt,
} from "react-icons/fa";
import API from "../services/api";
import "./UserLeadTrack.css";

const PRODUCT_ICONS = {
  Genunitys: "🛡️",
  Rewards: "🎁",
  CRM: "💼",
  "Custom-Website": "🌐",
  WhatsappAtuomation: "🤖",
};

const UserLeadTrack = () => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeProductTrack, setActiveProductTrack] = useState(null); // When inside a product card
  const [parentTrackId, setParentTrackId] = useState(null);

  // Onboard modal state
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);
  const [onboarding, setOnboarding] = useState(false);

  // Manual new lead form inside modal
  const [manualMode, setManualMode] = useState(false);
  const [manualLead, setManualLead] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    location: "",
    notes: "",
  });

  useEffect(() => {
    fetchMyLeadTracks();
  }, []);

  const fetchMyLeadTracks = async () => {
    try {
      setLoading(true);
      const res = await API.get("/lead-tracks");
      const trackList = res.data.leadTracks || [];
      setTracks(trackList);

      // If already viewing a product, refresh its live state
      if (activeProductTrack && parentTrackId) {
        const parent = trackList.find((t) => t._id === parentTrackId);
        if (parent) {
          const updatedProd = parent.products.find(
            (p) => String(p._id) === String(activeProductTrack._id)
          );
          if (updatedProd) {
            setActiveProductTrack(updatedProd);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch lead tracks:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const res = await API.get("/customers");
      setCustomers(res.data.customers || res.data || []);
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const openProductWorkspace = (track, product) => {
    setParentTrackId(track._id);
    setActiveProductTrack(product);
  };

  const closeProductWorkspace = () => {
    setActiveProductTrack(null);
    setParentTrackId(null);
  };

  const openOnboardModal = () => {
    setSelectedCustomerIds([]);
    setCustomerSearch("");
    setManualMode(false);
    setShowOnboardModal(true);
    if (customers.length === 0) {
      fetchAllCustomers();
    }
  };

  const toggleSelectCustomer = (id) => {
    const availableSlots =
      (activeProductTrack?.target || 0) - (activeProductTrack?.onboardedLeads?.length || 0);

    setSelectedCustomerIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((cId) => cId !== id);
      } else {
        if (prev.length >= availableSlots) {
          alert(`You can only onboard up to ${availableSlots} more lead(s) for this target.`);
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  const handleOnboardCustomers = async () => {
    if (manualMode) {
      if (!manualLead.name && !manualLead.phone) {
        alert("Please enter at least a Name or Phone number.");
        return;
      }

      try {
        setOnboarding(true);
        const res = await API.post(
          `/lead-tracks/${parentTrackId}/products/${activeProductTrack._id}/onboard`,
          { leads: [manualLead] }
        );
        alert(res.data.message || "Lead onboarded successfully!");
        setShowOnboardModal(false);
        setManualLead({ name: "", company: "", phone: "", email: "", location: "", notes: "" });
        fetchMyLeadTracks();
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.message || "Failed to onboard lead");
      } finally {
        setOnboarding(false);
      }
      return;
    }

    if (selectedCustomerIds.length === 0) {
      alert("Please select at least one customer to onboard.");
      return;
    }

    try {
      setOnboarding(true);
      const res = await API.post(
        `/lead-tracks/${parentTrackId}/products/${activeProductTrack._id}/onboard`,
        { customerIds: selectedCustomerIds }
      );
      alert(res.data.message || "Leads onboarded successfully!");
      setShowOnboardModal(false);
      fetchMyLeadTracks();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to onboard leads");
    } finally {
      setOnboarding(false);
    }
  };

  // Pipeline Stage Action: call -> WhatsappMessage -> demo -> Quote
  const handleStageChange = async (leadId, newStage, phone) => {
    try {
      const res = await API.patch(
        `/lead-tracks/${parentTrackId}/products/${activeProductTrack._id}/leads/${leadId}/stage`,
        { stage: newStage }
      );

      // Optimistically or server-sync update
      fetchMyLeadTracks();

      // If user clicked WhatsApp, optionally open WhatsApp chat
      if (newStage === "WhatsappMessage" && phone) {
        const cleanPhone = String(phone).replace(/\D/g, "");
        if (cleanPhone) {
          window.open(`https://wa.me/${cleanPhone}`, "_blank");
        }
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update lead stage");
    }
  };

  const handleRemoveLead = async (leadId) => {
    if (!window.confirm("Remove this lead from this product card?")) return;

    try {
      await API.delete(
        `/lead-tracks/${parentTrackId}/products/${activeProductTrack._id}/leads/${leadId}`
      );
      fetchMyLeadTracks();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to remove lead");
    }
  };

  // Filter customers for modal
  const existingCustomerIds = new Set(
    activeProductTrack?.onboardedLeads?.map((l) => (l.customerId ? String(l.customerId) : null)).filter(Boolean) || []
  );

  const filteredCustomers = customers.filter((c) => {
    if (existingCustomerIds.has(String(c._id))) return false;
    const term = customerSearch.toLowerCase();
    return (
      c.name?.toLowerCase().includes(term) ||
      c.company?.toLowerCase().includes(term) ||
      c.phone?.includes(term) ||
      c.location?.toLowerCase().includes(term)
    );
  });

  const availableSlots =
    (activeProductTrack?.target || 0) - (activeProductTrack?.onboardedLeads?.length || 0);

  return (
    <div className="ult-container">
      {/* ================= VIEW 1: PRODUCT CARDS OVERVIEW ================= */}
      {!activeProductTrack && (
        <>
          {/* HEADER */}
          <div className="ult-header">
            <div className="ult-header-text">
              <h1>
                <FaBullseye style={{ color: "#2563eb" }} /> Track-Lead Workspace
              </h1>
              <p>
                View your assigned product targets, onboard customer leads, and progress them to Quote stage.
              </p>
            </div>
          </div>

          {/* OVERVIEW STATS BANNER */}
          {tracks.length > 0 && (
            <div className="ult-overview-banner">
              <div className="ult-ob-left">
                <h2>🎯 Your Active Lead Tracking</h2>
                <p>
                  Duration: {tracks[0]?.startMonth} to {tracks[0]?.endMonth} | Total Products:{" "}
                  {tracks.reduce((acc, t) => acc + t.products.length, 0)} cards
                </p>
              </div>

              <div className="ult-ob-stats">
                <div className="ult-ob-stat-item">
                  <span className="val">
                    {tracks.reduce((acc, t) => acc + (t.totalTarget || 0), 0)}
                  </span>
                  <span className="lbl">Total Target</span>
                </div>
                <div className="ult-ob-stat-item">
                  <span className="val">
                    {tracks.reduce((acc, t) => acc + (t.totalOnboarded || 0), 0)}
                  </span>
                  <span className="lbl">Onboarded</span>
                </div>
                <div className="ult-ob-stat-item">
                  <span className="val" style={{ color: "#86efac" }}>
                    {tracks.reduce((acc, t) => acc + (t.totalQuoted || 0), 0)}
                  </span>
                  <span className="lbl">Quoted Achieved</span>
                </div>
                <div className="ult-ob-stat-item">
                  <span className="val" style={{ color: "#fde047" }}>
                    {tracks.reduce((acc, t) => acc + (t.totalRemainingTarget || 0), 0)}
                  </span>
                  <span className="lbl">Remaining Target</span>
                </div>
              </div>
            </div>
          )}

          {/* PRODUCT CARDS LIST */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "50px", color: "#64748b" }}>
              Loading your lead tracks...
            </div>
          ) : tracks.length === 0 ? (
            <div
              style={{
                background: "#ffffff",
                padding: "50px",
                borderRadius: "14px",
                textAlign: "center",
                border: "1px dashed #cbd5e1",
              }}
            >
              <h3 style={{ margin: "0 0 10px 0", color: "#334155" }}>No Assigned Lead Tracks</h3>
              <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
                You do not have any active lead tracking cards assigned yet. When your administrator creates a Lead Track for you, your product cards will appear here.
              </p>
            </div>
          ) : (
            tracks.map((track) => (
              <div key={track._id} style={{ marginBottom: "32px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a", fontWeight: 700 }}>
                    📋 {track.title || "Sales Lead Track"} ({track.startMonth} to {track.endMonth})
                  </h3>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>
                    {track.products.length} Product Cards Assigned
                  </span>
                </div>

                <div className="ult-cards-grid">
                  {track.products.map((product) => {
                    const isCompleted = product.remainingTarget === 0 && product.target > 0;
                    const progressPercent = product.target > 0 ? Math.min(100, Math.round((product.quotedCount / product.target) * 100)) : 0;

                    return (
                      <div
                        key={product._id}
                        className="ult-card"
                        onClick={() => openProductWorkspace(track, product)}
                      >
                        <div>
                          {/* CARD HEADER */}
                          <div className="ult-card-header">
                            <span className="ult-prod-badge">
                              <span>{PRODUCT_ICONS[product.productName] || "📦"}</span>
                              <span>{product.productName}</span>
                            </span>

                            <span
                              className={`ult-status-pill ${isCompleted ? "completed" : "active"}`}
                            >
                              {isCompleted ? "Target Met 🎉" : "Active"}
                            </span>
                          </div>

                          {/* METRICS ROW */}
                          <div className="ult-metrics-row">
                            <div className="ult-metric-box">
                              <span className="label">Target Lead</span>
                              <span className="val">{product.target}</span>
                            </div>

                            <div className="ult-metric-box remaining-box">
                              <span className="label">Remaining Target</span>
                              <span className="val">{product.remainingTarget}</span>
                            </div>

                            <div className="ult-metric-box">
                              <span className="label">Onboarded</span>
                              <span className="val">{product.onboardedCount} / {product.target}</span>
                            </div>

                            <div className="ult-metric-box quoted-box">
                              <span className="label">Quote Achieved</span>
                              <span className="val">{product.quotedCount}</span>
                            </div>
                          </div>

                          {/* PROGRESS BAR */}
                          <div className="ult-progress-wrapper">
                            <div className="ult-progress-labels">
                              <span>Quote Progress</span>
                              <span><strong>{progressPercent}%</strong> ({product.quotedCount}/{product.target})</span>
                            </div>
                            <div className="ult-progress-bar-bg">
                              <div
                                className="ult-progress-bar-fill"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <button className="ult-open-card-btn">
                          Open Card &amp; Leads ({product.onboardedCount})
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* ================= VIEW 2: PRODUCT LEADS WORKSPACE ================= */}
      {activeProductTrack && (
        <div>
          {/* WORKSPACE HEADER */}
          <div className="ult-workspace-header">
            <div className="ult-ws-title-box">
              <button className="ult-back-btn" onClick={closeProductWorkspace}>
                <FaArrowLeft /> Back to Cards
              </button>
              <div>
                <h2>
                  {PRODUCT_ICONS[activeProductTrack.productName]} {activeProductTrack.productName} Leads
                </h2>
                <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
                  Assigned Target: <strong>{activeProductTrack.target}</strong> | Quoted:{" "}
                  <strong style={{ color: "#16a34a" }}>{activeProductTrack.quotedCount}</strong> | Remaining:{" "}
                  <strong style={{ color: "#d97706" }}>{activeProductTrack.remainingTarget}</strong>
                </div>
              </div>
            </div>

            <div className="ult-ws-actions">
              <div
                style={{
                  background: activeProductTrack.remainingTarget === 0 ? "#ecfdf5" : "#fffbeb",
                  border: `1px solid ${activeProductTrack.remainingTarget === 0 ? "#a7f3d0" : "#fde68a"}`,
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: activeProductTrack.remainingTarget === 0 ? "#047857" : "#b45309",
                }}
              >
                {activeProductTrack.remainingTarget === 0
                  ? "🎉 Target Complete (0 Remaining)"
                  : `Remaining Target: ${activeProductTrack.remainingTarget} leads`}
              </div>

              <button
                className="ult-onboard-btn"
                onClick={openOnboardModal}
                disabled={activeProductTrack.onboardedLeads?.length >= activeProductTrack.target}
              >
                <FaPlus /> Onboard Leads (
                {activeProductTrack.onboardedLeads?.length || 0}/{activeProductTrack.target})
              </button>
            </div>
          </div>

          {/* LEADS LIST TABLE */}
          <div className="ult-leads-card">
            {(!activeProductTrack.onboardedLeads || activeProductTrack.onboardedLeads.length === 0) ? (
              <div style={{ textAlign: "center", padding: "50px", color: "#64748b" }}>
                <h3 style={{ margin: "0 0 10px 0", color: "#334155" }}>No Leads Onboarded Yet</h3>
                <p style={{ margin: "0 0 20px 0", fontSize: "14px" }}>
                  Click &ldquo;Onboard Leads&rdquo; above to select up to {activeProductTrack.target} customer leads from the CRM pool into this product card.
                </p>
                <button className="ult-onboard-btn" style={{ margin: "0 auto" }} onClick={openOnboardModal}>
                  <FaPlus /> Onboard First Leads
                </button>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="ult-table">
                  <thead>
                    <tr>
                      <th style={{ width: "40px" }}>#</th>
                      <th>Lead / Company</th>
                      <th>Contact &amp; Links</th>
                      <th>Location</th>
                      <th style={{ minWidth: "360px" }}>Pipeline Actions (Call → WhatsApp → Demo → Quote)</th>
                      <th>Notes</th>
                      <th style={{ width: "50px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeProductTrack.onboardedLeads.map((lead, idx) => {
                      const isQuoted = lead.stage === "Quote";

                      return (
                        <tr key={lead._id || idx}>
                          <td><strong>{idx + 1}</strong></td>
                          <td>
                            <strong>{lead.name || "Customer Lead"}</strong>
                            {lead.company && (
                              <div style={{ fontSize: "12px", color: "#64748b" }}>
                                {lead.company}
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span>{lead.phone || "-"}</span>
                              {lead.phone && (
                                <>
                                  <a
                                    href={`tel:${lead.phone}`}
                                    title="Call Lead"
                                    style={{ color: "#2563eb", fontSize: "14px" }}
                                  >
                                    <FaPhoneAlt />
                                  </a>
                                  <a
                                    href={`https://wa.me/${String(lead.phone).replace(/\D/g, "")}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="Open WhatsApp"
                                    style={{ color: "#10b981", fontSize: "15px" }}
                                  >
                                    <FaWhatsapp />
                                  </a>
                                </>
                              )}
                            </div>
                            {lead.email && (
                              <div style={{ fontSize: "12px", color: "#64748b" }}>
                                {lead.email}
                              </div>
                            )}
                          </td>
                          <td>{lead.location || "-"}</td>

                          {/* ACTION BUTTONS (call -> WhastappMessage -> demo -> Quote) */}
                          <td>
                            <div className="ult-pipeline-buttons">
                              <button
                                className={`ult-stage-btn ${lead.stage === "Call" ? "active Call" : ""}`}
                                onClick={() => handleStageChange(lead._id, "Call", lead.phone)}
                                title="Set stage to Call"
                              >
                                <FaPhoneAlt size={11} /> Call
                              </button>

                              <button
                                className={`ult-stage-btn ${lead.stage === "WhatsappMessage" ? "active WhatsappMessage" : ""}`}
                                onClick={() => handleStageChange(lead._id, "WhatsappMessage", lead.phone)}
                                title="Set stage to WhatsApp Message"
                              >
                                <FaWhatsapp size={13} /> WhatsApp
                              </button>

                              <button
                                className={`ult-stage-btn ${lead.stage === "Demo" ? "active Demo" : ""}`}
                                onClick={() => handleStageChange(lead._id, "Demo", lead.phone)}
                                title="Set stage to Demo"
                              >
                                <FaLaptopCode size={13} /> Demo
                              </button>

                              <button
                                className={`ult-stage-btn ${lead.stage === "Quote" ? "active Quote" : ""}`}
                                onClick={() => handleStageChange(lead._id, "Quote", lead.phone)}
                                title="Move to Quote stage (Decreases remaining target by 1)"
                              >
                                <FaFileInvoice size={12} /> Quote {isQuoted && "✓"}
                              </button>
                            </div>

                            {isQuoted && (
                              <div style={{ fontSize: "11px", color: "#16a34a", marginTop: "4px", fontWeight: 600 }}>
                                ✓ Quoted (Target reduced by 1)
                              </div>
                            )}
                          </td>

                          {/* NOTES */}
                          <td>
                            <span style={{ fontSize: "12px", color: "#475569" }}>
                              {lead.notes || "No notes"}
                            </span>
                          </td>

                          {/* REMOVE ACTION */}
                          <td>
                            <button
                              className="ult-remove-lead-btn"
                              onClick={() => handleRemoveLead(lead._id)}
                              title="Remove lead"
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= ONBOARD MODAL ================= */}
      {showOnboardModal && (
        <div className="ult-modal-overlay" onClick={() => setShowOnboardModal(false)}>
          <div className="ult-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="ult-modal-header">
              <div>
                <h3>
                  ➕ Onboard Leads to {activeProductTrack?.productName}
                </h3>
                <span style={{ fontSize: "13px", color: "#64748b" }}>
                  Available slots: <strong>{availableSlots}</strong> (Target: {activeProductTrack?.target})
                </span>
              </div>
              <button className="ult-close-btn" onClick={() => setShowOnboardModal(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="ult-modal-body">
              {/* Toggle Manual vs CRM customer pool */}
              <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                <button
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: !manualMode ? "#2563eb" : "#f1f5f9",
                    color: !manualMode ? "#ffffff" : "#334155",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                  onClick={() => setManualMode(false)}
                >
                  <FaUserCheck style={{ marginRight: "6px" }} /> Select from CRM Customers
                </button>
                <button
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: manualMode ? "#2563eb" : "#f1f5f9",
                    color: manualMode ? "#ffffff" : "#334155",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                  onClick={() => setManualMode(true)}
                >
                  <FaPlus style={{ marginRight: "6px" }} /> Enter Lead Details Manually
                </button>
              </div>

              {!manualMode ? (
                <>
                  <input
                    type="text"
                    className="ult-search-input"
                    placeholder="🔍 Search customers by name, company, phone, location..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />

                  {loadingCustomers ? (
                    <div style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                      Loading customer list...
                    </div>
                  ) : filteredCustomers.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                      No available customers found matching search.
                    </div>
                  ) : (
                    <div className="ult-customer-select-list">
                      {filteredCustomers.map((cust) => {
                        const isChecked = selectedCustomerIds.includes(cust._id);

                        return (
                          <div
                            key={cust._id}
                            className="ult-customer-row"
                            onClick={() => toggleSelectCustomer(cust._id)}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // handled by row click
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, color: "#0f172a" }}>
                                {cust.name || "Unnamed"}
                                {cust.company && (
                                  <span style={{ fontWeight: 400, color: "#64748b", marginLeft: "8px" }}>
                                    ({cust.company})
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: "12px", color: "#64748b" }}>
                                📞 {cust.phone || "No phone"} | 📍 {cust.location || "N/A"} | 🏷️ {cust.status || "lead"}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 600 }}>Lead Name *</label>
                    <input
                      type="text"
                      className="ult-search-input"
                      placeholder="e.g. Rahul Sharma"
                      value={manualLead.name}
                      onChange={(e) => setManualLead({ ...manualLead, name: e.target.value })}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 600 }}>Company Name</label>
                    <input
                      type="text"
                      className="ult-search-input"
                      placeholder="e.g. Acme Corp"
                      value={manualLead.company}
                      onChange={(e) => setManualLead({ ...manualLead, company: e.target.value })}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 600 }}>Phone Number *</label>
                    <input
                      type="text"
                      className="ult-search-input"
                      placeholder="e.g. 9876543210"
                      value={manualLead.phone}
                      onChange={(e) => setManualLead({ ...manualLead, phone: e.target.value })}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 600 }}>Email Address</label>
                    <input
                      type="email"
                      className="ult-search-input"
                      placeholder="e.g. rahul@example.com"
                      value={manualLead.email}
                      onChange={(e) => setManualLead({ ...manualLead, email: e.target.value })}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", gridColumn: "span 2" }}>
                    <label style={{ fontSize: "12px", fontWeight: 600 }}>Location</label>
                    <input
                      type="text"
                      className="ult-search-input"
                      placeholder="e.g. Mumbai, Maharashtra"
                      value={manualLead.location}
                      onChange={(e) => setManualLead({ ...manualLead, location: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="ult-modal-footer">
              <button
                style={{
                  background: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={() => setShowOnboardModal(false)}
              >
                Cancel
              </button>

              <button
                className="ult-onboard-btn"
                onClick={handleOnboardCustomers}
                disabled={onboarding || (!manualMode && selectedCustomerIds.length === 0)}
              >
                {onboarding
                  ? "Onboarding..."
                  : manualMode
                  ? "Onboard Lead"
                  : `Onboard Selected Leads (${selectedCustomerIds.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserLeadTrack;
