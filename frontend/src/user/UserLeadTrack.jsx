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
  FaInfoCircle,
  FaRegCommentDots,
  FaHistory,
  FaSave,
  FaEdit,
  FaMapMarkerAlt,
  FaBuilding,
  FaCalendarAlt,
  FaUser,
  FaEnvelope,
} from "react-icons/fa";
import API from "../services/api";
import "./UserLeadTrack.css";

const PRODUCT_ICONS = {
  Genunitys: "🛡️",
  Rewards: "🎁",
  CRM: "💼",
  "Custom-Website": "🌐",
  WhatsappAtuomation: "🤖",
  Projects: "📁",
  QuickCommerce: "⚡",
};

const STAGE_CONFIG = [
  { key: "Call", label: "Call", icon: FaPhoneAlt, color: "#2563eb", bg: "#eff6ff" },
  { key: "WhatsappMessage", label: "WhatsApp", icon: FaWhatsapp, color: "#10b981", bg: "#ecfdf5" },
  { key: "Demo", label: "Demo", icon: FaLaptopCode, color: "#9333ea", bg: "#faf5ff" },
  { key: "Quote", label: "Quote", icon: FaFileInvoice, color: "#e11d48", bg: "#fff1f2" },
];

const UserLeadTrack = () => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeProductTrack, setActiveProductTrack] = useState(null);
  const [parentTrackId, setParentTrackId] = useState(null);

  // Onboard modal state
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);
  const [onboarding, setOnboarding] = useState(false);

  // Manual new lead form inside onboard modal
  const [manualMode, setManualMode] = useState(false);
  const [manualLead, setManualLead] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    location: "",
    sparkName: "",
    sparkNumber: "",
    notes: "",
  });

  // Overall Details Modal State
  const [selectedLeadForDetails, setSelectedLeadForDetails] = useState(null);
  const [detailNoteInput, setDetailNoteInput] = useState("");
  const [detailNoteStage, setDetailNoteStage] = useState("Call");
  const [savingNote, setSavingNote] = useState(false);
  const [noteSuccessMsg, setNoteSuccessMsg] = useState("");

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

            // Also refresh selected lead details if open
            if (selectedLeadForDetails) {
              const updatedLead = updatedProd.onboardedLeads.find(
                (l) => String(l._id) === String(selectedLeadForDetails._id)
              );
              if (updatedLead) {
                setSelectedLeadForDetails(updatedLead);
              }
            }
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
    setSelectedLeadForDetails(null);
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
    const isNoTarget = !!activeProductTrack?.noTarget;
    const availableSlots = isNoTarget
      ? Infinity
      : (activeProductTrack?.target || 0) - (activeProductTrack?.onboardedLeads?.length || 0);

    setSelectedCustomerIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((cId) => cId !== id);
      } else {
        if (!isNoTarget && prev.length >= availableSlots) {
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
        setManualLead({ name: "", company: "", phone: "", email: "", location: "", sparkName: "", sparkNumber: "", notes: "" });
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
      await API.patch(
        `/lead-tracks/${parentTrackId}/products/${activeProductTrack._id}/leads/${leadId}/stage`,
        { stage: newStage }
      );

      fetchMyLeadTracks();

      // If user clicked WhatsApp, open WhatsApp chat
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
      if (selectedLeadForDetails && selectedLeadForDetails._id === leadId) {
        setSelectedLeadForDetails(null);
      }
      fetchMyLeadTracks();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to remove lead");
    }
  };

  // Open Details Modal for a lead
  const openLeadDetailsModal = (lead) => {
    setSelectedLeadForDetails(lead);
    setDetailNoteInput("");
    setDetailNoteStage(lead.stage || "Call");
    setNoteSuccessMsg("");
  };

  // Add / Edit Note from Details Modal or inline
  const handleSaveDetailNote = async (e) => {
    if (e) e.preventDefault();
    if (!detailNoteInput.trim()) {
      alert("Please enter a note before saving.");
      return;
    }

    try {
      setSavingNote(true);
      const res = await API.patch(
        `/lead-tracks/${parentTrackId}/products/${activeProductTrack._id}/leads/${selectedLeadForDetails._id}/notes`,
        {
          note: detailNoteInput.trim(),
          stage: detailNoteStage,
        }
      );

      setNoteSuccessMsg("Note saved successfully!");
      setDetailNoteInput("");
      setTimeout(() => setNoteSuccessMsg(""), 3000);

      // Refresh lead details & workspace
      if (res.data.lead) {
        setSelectedLeadForDetails(res.data.lead);
      }
      fetchMyLeadTracks();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to save note");
    } finally {
      setSavingNote(false);
    }
  };

  // Filter customers for onboarding modal
  const existingCustomerIds = new Set(
    activeProductTrack?.onboardedLeads
      ?.map((l) => (l.customerId ? String(l.customerId) : null))
      .filter(Boolean) || []
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

  const isNoTarget = !!activeProductTrack?.noTarget;
  const availableSlots = isNoTarget
    ? "Unlimited"
    : Math.max(0, (activeProductTrack?.target || 0) - (activeProductTrack?.onboardedLeads?.length || 0));

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
                View your assigned product targets, onboard customer leads, log notes history, and progress leads to Quote stage.
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
                  <span className="val" style={{ color: "#0f172a" }}>
                    {tracks.reduce((acc, t) => acc + (t.totalTarget || 0), 0)}
                  </span>
                  <span className="lbl">Total Target</span>
                </div>
                <div className="ult-ob-stat-item">
                  <span className="val" style={{ color: "#2563eb" }}>
                    {tracks.reduce((acc, t) => acc + (t.totalOnboarded || 0), 0)}
                  </span>
                  <span className="lbl">Onboarded</span>
                </div>
                <div className="ult-ob-stat-item">
                  <span className="val" style={{ color: "#16a34a" }}>
                    {tracks.reduce((acc, t) => acc + (t.totalQuoted || 0), 0)}
                  </span>
                  <span className="lbl">Quoted Achieved</span>
                </div>
                <div className="ult-ob-stat-item">
                  <span className="val" style={{ color: "#d97706" }}>
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
            <div className="ult-empty-state">
              <div className="ult-empty-icon">🎯</div>
              <h3>No Assigned Lead Tracks</h3>
              <p>
                You do not have any active lead tracking cards assigned yet. When your administrator assigns a Lead Track to you, your product cards will appear here.
              </p>
            </div>
          ) : (
            tracks.map((track) => (
              <div key={track._id} style={{ marginBottom: "32px" }}>
                <div className="ult-track-title-row">
                  <h3>
                    📋 {track.title || "Sales Lead Track"} ({track.startMonth} to {track.endMonth})
                  </h3>
                  <span className="ult-track-badge">
                    {track.products.length} Products Assigned
                  </span>
                </div>

                <div className="ult-cards-grid">
                  {track.products.map((product) => {
                    const isNoTarget = !!product.noTarget;
                    const isCompleted = !isNoTarget && product.remainingTarget === 0 && product.target > 0;
                    const progressPercent = isNoTarget
                      ? 100
                      : product.target > 0
                      ? Math.min(100, Math.round((product.quotedCount / product.target) * 100))
                      : 0;

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
                              <span className="ult-prod-icon">{PRODUCT_ICONS[product.productName] || "📦"}</span>
                              <span className="ult-prod-name">{product.productName}</span>
                            </span>

                            <span
                              className={`ult-status-pill ${
                                isCompleted ? "completed" : isNoTarget ? "notarget" : "active"
                              }`}
                            >
                              {isCompleted ? "Target Met 🎉" : isNoTarget ? "♾️ No Target" : "In Progress"}
                            </span>
                          </div>

                          {/* METRICS ROW */}
                          <div className="ult-metrics-row">
                            <div className="ult-metric-box">
                              <span className="label">Target</span>
                              <span className="val">{isNoTarget ? "No Target" : product.target}</span>
                            </div>

                            <div className="ult-metric-box remaining-box">
                              <span className="label">Remaining</span>
                              <span className="val">{isNoTarget ? "No Target" : product.remainingTarget}</span>
                            </div>

                            <div className="ult-metric-box">
                              <span className="label">Onboarded</span>
                              <span className="val">{product.onboardedCount}</span>
                            </div>

                            <div className="ult-metric-box quoted-box">
                              <span className="label">Quoted</span>
                              <span className="val">{product.quotedCount}</span>
                            </div>
                          </div>

                          {/* PROGRESS BAR */}
                          <div className="ult-progress-wrapper">
                            <div className="ult-progress-labels">
                              <span>Quote Conversion</span>
                              <span>
                                {isNoTarget ? (
                                  <strong>{product.quotedCount} Quoted</strong>
                                ) : (
                                  <>
                                    <strong>{progressPercent}%</strong> ({product.quotedCount}/{product.target})
                                  </>
                                )}
                              </span>
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
                          Open Workspace &amp; Leads ({product.onboardedCount}) →
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
                <FaArrowLeft /> Back to Product Cards
              </button>
              <div>
                <h2>
                  {PRODUCT_ICONS[activeProductTrack.productName] || "📦"} {activeProductTrack.productName} Workspace
                </h2>
                <div className="ult-ws-sub">
                  Target: <strong>{activeProductTrack.noTarget ? "No Target (Unlimited)" : activeProductTrack.target}</strong> | Onboarded:{" "}
                  <strong>{activeProductTrack.onboardedCount}</strong> | Quoted:{" "}
                  <strong style={{ color: "#16a34a" }}>{activeProductTrack.quotedCount}</strong> | Remaining:{" "}
                  <strong style={{ color: "#d97706" }}>{activeProductTrack.noTarget ? "No Target" : activeProductTrack.remainingTarget}</strong>
                </div>
              </div>
            </div>

            <div className="ult-ws-actions">
              <div
                className={`ult-target-status-pill ${
                  activeProductTrack.noTarget
                    ? "notarget"
                    : activeProductTrack.remainingTarget === 0
                    ? "complete"
                    : "pending"
                }`}
              >
                {activeProductTrack.noTarget
                  ? "♾️ No Target (Unlimited Leads Allowed)"
                  : activeProductTrack.remainingTarget === 0
                  ? "🎉 Target Complete (0 Remaining)"
                  : `Target Remaining: ${activeProductTrack.remainingTarget}`}
              </div>

              <button
                className="ult-onboard-btn"
                onClick={openOnboardModal}
                disabled={!activeProductTrack.noTarget && (activeProductTrack.onboardedLeads?.length >= activeProductTrack.target)}
              >
                <FaPlus /> Onboard Leads (
                {activeProductTrack.onboardedLeads?.length || 0}
                {activeProductTrack.noTarget ? "" : `/${activeProductTrack.target}`})
              </button>
            </div>
          </div>

          {/* LEADS LIST TABLE */}
          <div className="ult-leads-card">
            {!activeProductTrack.onboardedLeads || activeProductTrack.onboardedLeads.length === 0 ? (
              <div className="ult-empty-state">
                <div className="ult-empty-icon">👥</div>
                <h3>No Leads Onboarded Yet</h3>
                <p>
                  Click &ldquo;Onboard Leads&rdquo; above to onboard customer leads {activeProductTrack.noTarget ? "without target limits" : `(up to ${activeProductTrack.target})`} into this product workspace.
                </p>
                <button
                  className="ult-onboard-btn"
                  style={{ margin: "16px auto 0" }}
                  onClick={openOnboardModal}
                >
                  <FaPlus /> Onboard First Leads
                </button>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="ult-table">
                  <thead>
                    <tr>
                      <th style={{ width: "35px" }}>#</th>
                      <th>Lead &amp; Company</th>
                      <th>Contact Info</th>
                      <th>Location</th>
                      <th style={{ minWidth: "340px" }}>Pipeline Progression (Call → WhatsApp → Demo → Quote)</th>
                      <th>Latest Notes &amp; History</th>
                      <th style={{ textAlign: "center", minWidth: "120px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeProductTrack.onboardedLeads.map((lead, idx) => {
                      const isQuoted = lead.stage === "Quote";
                      const notesCount = lead.notesHistory?.length || (lead.notes ? 1 : 0);

                      return (
                        <tr key={lead._id || idx}>
                          <td><strong>{idx + 1}</strong></td>
                          <td>
                            <div className="ult-lead-name">{lead.name || "Customer Lead"}</div>
                            {lead.company && (
                              <div className="ult-lead-company">
                                <FaBuilding size={11} style={{ marginRight: "4px" }} />
                                {lead.company}
                              </div>
                            )}
                            {(lead.sparkName || lead.sparkNumber) && (
                              <div style={{ fontSize: "11px", color: "#d97706", marginTop: "3px", fontWeight: 600 }}>
                                ⚡ Spark: {lead.sparkName || "-"} {lead.sparkNumber ? `(${lead.sparkNumber})` : ""}
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="ult-contact-row">
                              <span>{lead.phone || "-"}</span>
                              {lead.phone && (
                                <>
                                  <a
                                    href={`tel:${lead.phone}`}
                                    title="Call Lead"
                                    className="ult-phone-link"
                                  >
                                    <FaPhoneAlt />
                                  </a>
                                  <a
                                    href={`https://wa.me/${String(lead.phone).replace(/\D/g, "")}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="Chat on WhatsApp"
                                    className="ult-wa-link"
                                  >
                                    <FaWhatsapp />
                                  </a>
                                </>
                              )}
                            </div>
                            {lead.email && (
                              <div className="ult-lead-email">
                                <FaEnvelope size={10} style={{ marginRight: "4px" }} />
                                {lead.email}
                              </div>
                            )}
                          </td>
                          <td>
                            {lead.location ? (
                              <span className="ult-location-tag">
                                <FaMapMarkerAlt size={10} style={{ marginRight: "4px" }} />
                                {lead.location}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>

                          {/* ACTION BUTTONS (Call -> WhatsappMessage -> Demo -> Quote) */}
                          <td>
                            <div className="ult-pipeline-buttons">
                              {STAGE_CONFIG.map((stg) => {
                                const StgIcon = stg.icon;
                                const isActive = lead.stage === stg.key;
                                return (
                                  <button
                                    key={stg.key}
                                    className={`ult-stage-btn ${isActive ? `active ${stg.key}` : ""}`}
                                    onClick={() => handleStageChange(lead._id, stg.key, lead.phone)}
                                    title={`Move to ${stg.label}`}
                                  >
                                    <StgIcon size={12} /> {stg.label}
                                    {stg.key === "Quote" && isQuoted && " ✓"}
                                  </button>
                                );
                              })}
                            </div>

                            {isQuoted && (
                              <div className="ult-quoted-badge-text">
                                <FaCheckCircle size={11} /> Quote Sent (Remaining Target Reduced by 1)
                              </div>
                            )}
                          </td>

                          {/* NOTES COLUMN */}
                          <td>
                            <div className="ult-notes-cell" onClick={() => openLeadDetailsModal(lead)}>
                              <div className="ult-note-preview">
                                {lead.notes ? (
                                  lead.notes
                                ) : (
                                  <span style={{ color: "#94a3b8", fontStyle: "italic" }}>
                                    No notes yet. Click to add.
                                  </span>
                                )}
                              </div>
                              <div className="ult-notes-meta">
                                <span className="ult-notes-count-pill">
                                  <FaRegCommentDots size={10} /> {notesCount} note{notesCount !== 1 ? "s" : ""}
                                </span>
                                <span className="ult-edit-hint">✏️ Edit</span>
                              </div>
                            </div>
                          </td>

                          {/* DETAILS & REMOVE BUTTONS */}
                          <td>
                            <div className="ult-action-cell">
                              <button
                                className="ult-details-btn"
                                onClick={() => openLeadDetailsModal(lead)}
                                title="View Overall Lead Details & Notes History"
                              >
                                <FaInfoCircle /> Details
                              </button>

                              <button
                                className="ult-remove-lead-btn"
                                onClick={() => handleRemoveLead(lead._id)}
                                title="Remove lead from product"
                              >
                                <FaTrash />
                              </button>
                            </div>
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

      {/* ================= MODAL: OVERALL LEAD DETAILS & NOTES HISTORY ================= */}
      {selectedLeadForDetails && (
        <div className="ult-modal-overlay" onClick={() => setSelectedLeadForDetails(null)}>
          <div className="ult-details-modal" onClick={(e) => e.stopPropagation()}>
            {/* MODAL HEADER */}
            <div className="ult-details-header">
              <div className="ult-dh-title">
                <span className="ult-dh-icon">👤</span>
                <div>
                  <h3>{selectedLeadForDetails.name || "Customer Lead"}</h3>
                  <div className="ult-dh-sub">
                    {selectedLeadForDetails.company && (
                      <span>🏢 {selectedLeadForDetails.company} • </span>
                    )}
                    <span>Product: <strong>{activeProductTrack?.productName}</strong></span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className={`ult-stage-chip-large ${selectedLeadForDetails.stage}`}>
                  Stage: {selectedLeadForDetails.stage}
                </span>
                <button
                  className="ult-close-btn"
                  onClick={() => setSelectedLeadForDetails(null)}
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* MODAL BODY */}
            <div className="ult-details-body">
              {/* SECTION 1: CUSTOMER QUICK INFO */}
              <div className="ult-details-section">
                <h4 className="ult-section-title">
                  <FaUser style={{ color: "#2563eb" }} /> Customer Information
                </h4>
                <div className="ult-info-grid">
                  <div className="ult-info-item">
                    <span className="lbl">Contact Name</span>
                    <span className="val">{selectedLeadForDetails.name || "-"}</span>
                  </div>
                  <div className="ult-info-item">
                    <span className="lbl">Company</span>
                    <span className="val">{selectedLeadForDetails.company || "-"}</span>
                  </div>
                  <div className="ult-info-item">
                    <span className="lbl">Phone Number</span>
                    <span className="val" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {selectedLeadForDetails.phone || "-"}
                      {selectedLeadForDetails.phone && (
                        <>
                          <a
                            href={`tel:${selectedLeadForDetails.phone}`}
                            className="ult-phone-link"
                            title="Call"
                          >
                            <FaPhoneAlt size={12} />
                          </a>
                          <a
                            href={`https://wa.me/${String(selectedLeadForDetails.phone).replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="ult-wa-link"
                            title="WhatsApp"
                          >
                            <FaWhatsapp size={14} />
                          </a>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="ult-info-item">
                    <span className="lbl">Email Address</span>
                    <span className="val">{selectedLeadForDetails.email || "-"}</span>
                  </div>
                  <div className="ult-info-item">
                    <span className="lbl">Location</span>
                    <span className="val">{selectedLeadForDetails.location || "-"}</span>
                  </div>
                  {(selectedLeadForDetails.sparkName || selectedLeadForDetails.sparkNumber) && (
                    <>
                      <div className="ult-info-item">
                        <span className="lbl">⚡ Spark Name</span>
                        <span className="val">{selectedLeadForDetails.sparkName || "-"}</span>
                      </div>
                      <div className="ult-info-item">
                        <span className="lbl">⚡ Spark Number</span>
                        <span className="val">{selectedLeadForDetails.sparkNumber || "-"}</span>
                      </div>
                    </>
                  )}
                  <div className="ult-info-item">
                    <span className="lbl">Onboarded At</span>
                    <span className="val">
                      {selectedLeadForDetails.onboardedAt
                        ? new Date(selectedLeadForDetails.onboardedAt).toLocaleString()
                        : "-"}
                    </span>
                  </div>
                  {selectedLeadForDetails.quotedAt && (
                    <div className="ult-info-item" style={{ gridColumn: "span 2" }}>
                      <span className="lbl">Quoted Timestamp</span>
                      <span className="val" style={{ color: "#16a34a", fontWeight: 700 }}>
                        ✓ Quoted on {new Date(selectedLeadForDetails.quotedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 2: PIPELINE PROGRESSION STEPPER */}
              <div className="ult-details-section">
                <h4 className="ult-section-title">
                  <FaHistory style={{ color: "#9333ea" }} /> Pipeline Stage Actions
                </h4>
                <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#64748b" }}>
                  Click to transition this lead to any stage. Advancing to Quote stage decrements your remaining target.
                </p>

                <div className="ult-details-pipeline-bar">
                  {STAGE_CONFIG.map((stg) => {
                    const StgIcon = stg.icon;
                    const isActive = selectedLeadForDetails.stage === stg.key;
                    return (
                      <button
                        key={stg.key}
                        className={`ult-details-stg-btn ${isActive ? `active ${stg.key}` : ""}`}
                        onClick={() => {
                          handleStageChange(
                            selectedLeadForDetails._id,
                            stg.key,
                            selectedLeadForDetails.phone
                          );
                          setSelectedLeadForDetails((prev) => ({
                            ...prev,
                            stage: stg.key,
                          }));
                        }}
                      >
                        <StgIcon size={14} />
                        <span>{stg.label}</span>
                        {isActive && <span className="ult-active-check">✓ Active</span>}
                      </button>
                    );
                  })}
                </div>

                {/* STAGE HISTORY LOG */}
                {selectedLeadForDetails.stageHistory && selectedLeadForDetails.stageHistory.length > 0 && (
                  <div className="ult-stage-history-box">
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>
                      Stage Timeline History:
                    </span>
                    <div className="ult-stage-history-list">
                      {selectedLeadForDetails.stageHistory.map((sh, sIdx) => (
                        <div key={sIdx} className="ult-stage-history-item">
                          <span className={`ult-stage-mini-tag ${sh.stage}`}>{sh.stage}</span>
                          <span className="ult-sh-date">
                            {sh.updatedAt ? new Date(sh.updatedAt).toLocaleString() : "-"}
                          </span>
                          {sh.updatedByName && (
                            <span className="ult-sh-user">by {sh.updatedByName}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 3: NOTES & NOTES HISTORY */}
              <div className="ult-details-section">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h4 className="ult-section-title" style={{ margin: 0 }}>
                    <FaRegCommentDots style={{ color: "#10b981" }} /> Notes History &amp; Updates
                  </h4>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    Total: {selectedLeadForDetails.notesHistory?.length || (selectedLeadForDetails.notes ? 1 : 0)} note(s)
                  </span>
                </div>

                {/* ADD / EDIT NOTE FORM */}
                <form onSubmit={handleSaveDetailNote} className="ult-note-input-form">
                  <div style={{ display: "flex", gap: "10px", marginBottom: "8px" }}>
                    <select
                      className="ult-note-stage-select"
                      value={detailNoteStage}
                      onChange={(e) => setDetailNoteStage(e.target.value)}
                    >
                      <option value="Call">Stage: Call</option>
                      <option value="WhatsappMessage">Stage: WhatsApp</option>
                      <option value="Demo">Stage: Demo</option>
                      <option value="Quote">Stage: Quote</option>
                    </select>

                    <span style={{ fontSize: "12px", color: "#64748b", alignSelf: "center" }}>
                      Add a note for this stage or record client response:
                    </span>
                  </div>

                  <textarea
                    className="ult-note-textarea"
                    placeholder="Write note or follow-up update here (e.g. Discussed CRM pricing, requested demo next Tuesday)..."
                    value={detailNoteInput}
                    onChange={(e) => setDetailNoteInput(e.target.value)}
                    rows={3}
                  />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                    {noteSuccessMsg && (
                      <span style={{ color: "#16a34a", fontSize: "13px", fontWeight: 600 }}>
                        ✓ {noteSuccessMsg}
                      </span>
                    )}
                    {!noteSuccessMsg && <div />}

                    <button
                      type="submit"
                      className="ult-save-note-btn"
                      disabled={savingNote || !detailNoteInput.trim()}
                    >
                      <FaSave /> {savingNote ? "Saving..." : "Save Note"}
                    </button>
                  </div>
                </form>

                {/* NOTES TIMELINE LOG */}
                <div className="ult-notes-timeline">
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#334155", marginBottom: "10px" }}>
                    Notes History Log:
                  </div>

                  {(!selectedLeadForDetails.notesHistory || selectedLeadForDetails.notesHistory.length === 0) &&
                  !selectedLeadForDetails.notes ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8", background: "#f8fafc", borderRadius: "8px" }}>
                      No notes recorded yet. Add your first note above.
                    </div>
                  ) : (
                    <div className="ult-notes-history-cards">
                      {/* If notesHistory array has items, display in reverse chronological order */}
                      {selectedLeadForDetails.notesHistory && selectedLeadForDetails.notesHistory.length > 0 ? (
                        [...selectedLeadForDetails.notesHistory].reverse().map((nh, nIdx) => (
                          <div key={nh._id || nIdx} className="ult-note-card">
                            <div className="ult-nc-header">
                              <span className={`ult-nc-stage-badge ${nh.stage || "General"}`}>
                                {nh.stage || "General"}
                              </span>
                              <div className="ult-nc-meta">
                                <span>👤 {nh.authorName || "User"}</span>
                                <span>•</span>
                                <span>
                                  {nh.createdAt ? new Date(nh.createdAt).toLocaleString() : "-"}
                                </span>
                              </div>
                            </div>
                            <div className="ult-nc-body">{nh.note}</div>
                            <button
                              type="button"
                              className="ult-nc-edit-btn"
                              onClick={() => {
                                setDetailNoteInput(nh.note);
                                if (nh.stage) setDetailNoteStage(nh.stage);
                              }}
                            >
                              <FaEdit size={11} /> Copy to Edit
                            </button>
                          </div>
                        ))
                      ) : (
                        // Fallback if legacy single note string exists
                        <div className="ult-note-card">
                          <div className="ult-nc-header">
                            <span className="ult-nc-stage-badge General">General</span>
                            <div className="ult-nc-meta">
                              <span>Initial Note</span>
                            </div>
                          </div>
                          <div className="ult-nc-body">{selectedLeadForDetails.notes}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="ult-details-footer">
              <button
                className="ult-close-details-btn"
                onClick={() => setSelectedLeadForDetails(null)}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ONBOARD LEADS ================= */}
      {showOnboardModal && (
        <div className="ult-modal-overlay" onClick={() => setShowOnboardModal(false)}>
          <div className="ult-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="ult-modal-header">
              <div>
                <h3>
                  ➕ Onboard Leads to {activeProductTrack?.productName}
                </h3>
                <span style={{ fontSize: "13px", color: "#64748b" }}>
                  Available slots: <strong>{availableSlots}</strong> {activeProductTrack?.noTarget ? "(Unlimited Leads)" : `(Target: ${activeProductTrack?.target})`}
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
                    padding: "10px",
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
                    padding: "10px",
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

              {/* MODE 1: SELECT FROM CRM CUSTOMERS */}
              {!manualMode && (
                <>
                  <input
                    type="text"
                    className="ult-search-input"
                    placeholder="Search by customer name, company, phone, location..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />

                  {loadingCustomers ? (
                    <div style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                      Loading CRM customers...
                    </div>
                  ) : filteredCustomers.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                      No available customers found matching &ldquo;{customerSearch}&rdquo;.
                    </div>
                  ) : (
                    <div className="ult-customer-select-list">
                      {filteredCustomers.map((cust) => {
                        const isSelected = selectedCustomerIds.includes(cust._id);
                        return (
                          <div
                            key={cust._id}
                            className={`ult-customer-row ${isSelected ? "selected" : ""}`}
                            onClick={() => toggleSelectCustomer(cust._id)}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "14px" }}>
                                {cust.name || "Customer"}
                              </div>
                              <div style={{ fontSize: "12px", color: "#64748b" }}>
                                {cust.company && <span>{cust.company} • </span>}
                                {cust.phone && <span>{cust.phone} • </span>}
                                {cust.location && <span>{cust.location}</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div style={{ fontSize: "13px", color: "#64748b", marginTop: "8px" }}>
                    Selected: <strong>{selectedCustomerIds.length}</strong> / Max Available:{" "}
                    <strong>{availableSlots}</strong>
                  </div>
                </>
              )}

              {/* MODE 2: ENTER DETAILS MANUALLY */}
              {manualMode && (
                <div className="ult-manual-form">
                  <div className="ult-form-row">
                    <div className="ult-form-col">
                      <label>Contact Name *</label>
                      <input
                        type="text"
                        className="ult-input"
                        placeholder="e.g. John Doe"
                        value={manualLead.name}
                        onChange={(e) =>
                          setManualLead((prev) => ({ ...prev, name: e.target.value }))
                        }
                      />
                    </div>
                    <div className="ult-form-col">
                      <label>Company Name</label>
                      <input
                        type="text"
                        className="ult-input"
                        placeholder="e.g. Acme Corp"
                        value={manualLead.company}
                        onChange={(e) =>
                          setManualLead((prev) => ({ ...prev, company: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="ult-form-row">
                    <div className="ult-form-col">
                      <label>Phone Number *</label>
                      <input
                        type="tel"
                        className="ult-input"
                        placeholder="e.g. +91 9876543210"
                        value={manualLead.phone}
                        onChange={(e) =>
                          setManualLead((prev) => ({ ...prev, phone: e.target.value }))
                        }
                      />
                    </div>
                    <div className="ult-form-col">
                      <label>Email Address</label>
                      <input
                        type="email"
                        className="ult-input"
                        placeholder="e.g. client@example.com"
                        value={manualLead.email}
                        onChange={(e) =>
                          setManualLead((prev) => ({ ...prev, email: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="ult-form-row">
                    <div className="ult-form-col">
                      <label>Location / City</label>
                      <input
                        type="text"
                        className="ult-input"
                        placeholder="e.g. Chennai"
                        value={manualLead.location}
                        onChange={(e) =>
                          setManualLead((prev) => ({ ...prev, location: e.target.value }))
                        }
                      />
                    </div>
                    <div className="ult-form-col">
                      <label>Initial Notes / Stage Remark</label>
                      <input
                        type="text"
                        className="ult-input"
                        placeholder="e.g. Interested in Genunitys plan"
                        value={manualLead.notes}
                        onChange={(e) =>
                          setManualLead((prev) => ({ ...prev, notes: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="ult-form-row">
                    <div className="ult-form-col">
                      <label>⚡ Spark Name</label>
                      <input
                        type="text"
                        className="ult-input"
                        placeholder="e.g. Spark Agent / Ref Name"
                        value={manualLead.sparkName}
                        onChange={(e) =>
                          setManualLead((prev) => ({ ...prev, sparkName: e.target.value }))
                        }
                      />
                    </div>
                    <div className="ult-form-col">
                      <label>⚡ Spark Number</label>
                      <input
                        type="text"
                        className="ult-input"
                        placeholder="e.g. SPK-1029 or Phone"
                        value={manualLead.sparkNumber}
                        onChange={(e) =>
                          setManualLead((prev) => ({ ...prev, sparkNumber: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="ult-modal-footer">
              <button
                className="ult-cancel-btn"
                onClick={() => setShowOnboardModal(false)}
              >
                Cancel
              </button>
              <button
                className="ult-confirm-onboard-btn"
                onClick={handleOnboardCustomers}
                disabled={
                  onboarding ||
                  (!manualMode && selectedCustomerIds.length === 0) ||
                  (manualMode && !manualLead.name && !manualLead.phone)
                }
              >
                {onboarding
                  ? "Onboarding..."
                  : manualMode
                  ? "Onboard Manual Lead"
                  : `Onboard Selected (${selectedCustomerIds.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserLeadTrack;
