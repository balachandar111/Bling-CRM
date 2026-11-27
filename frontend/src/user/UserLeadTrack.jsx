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
  { key: "Closure", label: "Closure", icon: FaCheckCircle, color: "#16a34a", bg: "#f0fdf4" },
];

const UserLeadTrack = () => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeProductTrack, setActiveProductTrack] = useState(null);
  const [parentTrackId, setParentTrackId] = useState(null);

  // Closure modal state (when shifting lead to Closure)
  const [closureLeadModal, setClosureLeadModal] = useState(null);
  const [closureForm, setClosureForm] = useState({
    totalValue: "",
    advancePayment: "",
    paymentMode: "Cash",
    paymentReference: "",
    paymentNotes: "",
    notes: "",
  });
  const [savingClosure, setSavingClosure] = useState(false);

  // Product-wise Closure List Modal (when clicking status cards)
  const [showClosureSummaryModal, setShowClosureSummaryModal] = useState(false);

  // Customer Payment Details Modal
  const [selectedLeadForPayment, setSelectedLeadForPayment] = useState(null);
  const [paymentInstallmentForm, setPaymentInstallmentForm] = useState({
    amount: "",
    mode: "Cash",
    reference: "",
    notes: "",
    totalValue: "",
  });
  const [savingPayment, setSavingPayment] = useState(false);

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

  // Pipeline Stage Action: call -> WhatsappMessage -> demo -> Quote -> Closure
  const handleStageChange = async (leadId, newStage, phone, currentLead = null) => {
    const lead = currentLead || activeProductTrack?.onboardedLeads?.find((l) => l._id === leadId);

    if (newStage === "Closure") {
      // Prompt modal to enter Total Value, Advance Payment, and Remaining Payment
      setClosureLeadModal({
        lead,
        leadId,
        parentTrackId,
        productId: activeProductTrack?._id,
      });
      setClosureForm({
        totalValue: lead?.totalValue || "",
        advancePayment: lead?.advancePayment || "",
        paymentMode: "Cash",
        paymentReference: "",
        paymentNotes: "",
        notes: lead?.notes || "",
      });
      return;
    }

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

  // Submit Closure modal
  const handleConfirmClosure = async (e) => {
    if (e) e.preventDefault();
    if (!closureLeadModal) return;
    const { leadId, parentTrackId: tId, productId: pId } = closureLeadModal;
    const totalValNum = parseFloat(closureForm.totalValue) || 0;
    const advValNum = parseFloat(closureForm.advancePayment) || 0;

    if (totalValNum <= 0) {
      alert("Please enter a valid Total Value for this deal closure.");
      return;
    }
    if (advValNum > totalValNum) {
      alert("Advance payment cannot exceed the Total Value.");
      return;
    }

    try {
      setSavingClosure(true);
      await API.patch(
        `/lead-tracks/${tId}/products/${pId}/leads/${leadId}/stage`,
        {
          stage: "Closure",
          totalValue: totalValNum,
          advancePayment: advValNum,
          paymentMode: closureForm.paymentMode,
          paymentReference: closureForm.paymentReference,
          paymentNotes: closureForm.paymentNotes,
          notes: closureForm.notes,
        }
      );

      alert("🎉 Deal shifted to Closure! Target lead count reduced by 1.");
      setClosureLeadModal(null);
      fetchMyLeadTracks();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update lead to Closure");
    } finally {
      setSavingClosure(false);
    }
  };

  // Open Payment Details Modal for any closed lead
  const openPaymentModalForLead = (lead, trackId = null, prodId = null, prodName = null) => {
    setSelectedLeadForPayment({
      lead,
      parentTrackId: trackId || parentTrackId,
      productId: prodId || activeProductTrack?._id,
      productName: prodName || activeProductTrack?.productName || "Product",
    });
    setPaymentInstallmentForm({
      amount: "",
      mode: "Cash",
      reference: "",
      notes: "",
      totalValue: lead.totalValue || "",
    });
  };

  // Record an installment or update payment for a closed lead
  const handleRecordPayment = async (e) => {
    if (e) e.preventDefault();
    if (!selectedLeadForPayment) return;
    const { lead, parentTrackId: tId, productId: pId } = selectedLeadForPayment;
    const amt = parseFloat(paymentInstallmentForm.amount) || 0;
    const newTotal = paymentInstallmentForm.totalValue !== "" ? parseFloat(paymentInstallmentForm.totalValue) : undefined;

    if (amt <= 0 && newTotal === undefined) {
      alert("Please enter a payment amount or update the total value.");
      return;
    }

    try {
      setSavingPayment(true);
      const res = await API.post(
        `/lead-tracks/${tId}/products/${pId}/leads/${lead._id}/payment`,
        {
          amount: amt > 0 ? amt : undefined,
          mode: paymentInstallmentForm.mode,
          reference: paymentInstallmentForm.reference,
          notes: paymentInstallmentForm.notes,
          totalValue: newTotal,
        }
      );

      alert("Payment recorded successfully!");
      setPaymentInstallmentForm({
        amount: "",
        mode: "Cash",
        reference: "",
        notes: "",
        totalValue: res.data.lead?.totalValue || "",
      });

      if (res.data.lead) {
        setSelectedLeadForPayment((prev) => ({
          ...prev,
          lead: res.data.lead,
        }));
      }

      fetchMyLeadTracks();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to record payment");
    } finally {
      setSavingPayment(false);
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
                <span style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", display: "inline-block" }}>
                  💡 Click any Closure or Payment card below to inspect closed customer leads &amp; payments product-wise
                </span>
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

                {/* 🏆 TOTAL CLOSURE CARD */}
                <div
                  className="ult-ob-stat-item clickable-card closure-highlight"
                  onClick={() => setShowClosureSummaryModal(true)}
                  title="Click to view all closed leads product-wise"
                >
                  <span className="val" style={{ color: "#16a34a" }}>
                    🏆 {tracks.reduce((acc, t) => acc + (t.totalClosure || 0), 0)}
                  </span>
                  <span className="lbl">Total Closure ↗</span>
                </div>

                {/* 💰 TOTAL PAYMENT CARD */}
                <div
                  className="ult-ob-stat-item clickable-card payment-highlight"
                  onClick={() => setShowClosureSummaryModal(true)}
                  title="Click to view payment breakdown product-wise"
                >
                  <span className="val" style={{ color: "#4f46e5" }}>
                    ₹{tracks.reduce((acc, t) => acc + (t.totalPayment || 0), 0).toLocaleString("en-IN")}
                  </span>
                  <span className="lbl">Total Payment ↗</span>
                </div>

                {/* 💵 ADVANCE PAYMENT CARD */}
                <div
                  className="ult-ob-stat-item clickable-card advance-highlight"
                  onClick={() => setShowClosureSummaryModal(true)}
                  title="Click to view advance payment details product-wise"
                >
                  <span className="val" style={{ color: "#059669" }}>
                    ₹{tracks.reduce((acc, t) => acc + (t.totalAdvancePayment || 0), 0).toLocaleString("en-IN")}
                  </span>
                  <span className="lbl">Advance Payment ↗</span>
                </div>

                {/* ⏳ REMAINING PAYMENT CARD */}
                <div
                  className="ult-ob-stat-item clickable-card remaining-highlight"
                  onClick={() => setShowClosureSummaryModal(true)}
                  title="Click to view pending remaining payments product-wise"
                >
                  <span className="val" style={{ color: "#d97706" }}>
                    ₹{tracks.reduce((acc, t) => acc + (t.totalRemainingPayment || 0), 0).toLocaleString("en-IN")}
                  </span>
                  <span className="lbl">Remaining Payment ↗</span>
                </div>

                <div className="ult-ob-stat-item">
                  <span className="val" style={{ color: "#dc2626" }}>
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
                    // Target is reduced only when lead reaches "Closure" stage
                    const progressPercent = isNoTarget
                      ? 100
                      : product.target > 0
                      ? Math.min(100, Math.round(((product.closureCount || 0) / product.target) * 100))
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
                              {isCompleted ? "Closure Met 🎉" : isNoTarget ? "♾️ No Target" : "In Progress"}
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

                            <div className="ult-metric-box" style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}>
                              <span className="label" style={{ color: "#16a34a" }}>Closure</span>
                              <span className="val" style={{ color: "#16a34a" }}>{product.closureCount || 0}</span>
                            </div>

                            <div className="ult-metric-box payment-mini-box" style={{ background: "#f5f3ff", borderColor: "#ddd6fe" }}>
                              <span className="label" style={{ color: "#7c3aed" }}>Payment</span>
                              <span className="val" style={{ color: "#7c3aed", fontSize: "14px" }}>
                                ₹{(product.totalPayment || 0).toLocaleString("en-IN")}
                              </span>
                            </div>
                          </div>

                          {/* PROGRESS BAR */}
                          <div className="ult-progress-wrapper">
                            <div className="ult-progress-labels">
                              <span>Closure Conversion</span>
                              <span>
                                {isNoTarget ? (
                                  <strong>{product.closureCount || 0} Closures</strong>
                                ) : (
                                  <>
                                    <strong>{progressPercent}%</strong> ({product.closureCount || 0}/{product.target})
                                  </>
                                )}
                              </span>
                            </div>
                            <div className="ult-progress-bar-bg">
                              <div
                                className="ult-progress-bar-fill"
                                style={{ width: `${progressPercent}%`, background: "#16a34a" }}
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
                  <strong>{activeProductTrack.onboardedCount}</strong> | Closures:{" "}
                  <strong style={{ color: "#16a34a" }}>{activeProductTrack.closureCount || 0}</strong> | Remaining:{" "}
                  <strong style={{ color: "#d97706" }}>{activeProductTrack.noTarget ? "No Target" : activeProductTrack.remainingTarget}</strong> | Total Value:{" "}
                  <strong style={{ color: "#4f46e5" }}>₹{(activeProductTrack.totalPayment || 0).toLocaleString("en-IN")}</strong>
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
                      const isClosed = lead.stage === "Closure";
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

                          {/* ACTION BUTTONS (Call -> WhatsappMessage -> Demo -> Quote -> Closure) */}
                          <td>
                            <div className="ult-pipeline-buttons">
                              {STAGE_CONFIG.map((stg) => {
                                const StgIcon = stg.icon;
                                const isActive = lead.stage === stg.key;
                                return (
                                  <button
                                    key={stg.key}
                                    className={`ult-stage-btn ${isActive ? `active ${stg.key}` : ""}`}
                                    onClick={() => handleStageChange(lead._id, stg.key, lead.phone, lead)}
                                    title={`Move to ${stg.label}`}
                                  >
                                    <StgIcon size={12} /> {stg.label}
                                    {stg.key === "Closure" && isClosed && " 🏆"}
                                    {stg.key === "Quote" && isQuoted && " ✓"}
                                  </button>
                                );
                              })}
                            </div>

                            {isClosed ? (
                              <div className="ult-closure-badge-text" style={{ marginTop: "6px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 700, color: "#16a34a" }}>
                                  <FaCheckCircle size={11} /> Deal Closed (Target Reduced by 1)
                                </div>
                                <div style={{ fontSize: "12px", color: "#334155", marginTop: "3px", display: "flex", gap: "10px", flexWrap: "wrap", background: "#f0fdf4", padding: "4px 8px", borderRadius: "6px", border: "1px solid #bbf7d0" }}>
                                  <span>Total: <strong>₹{(lead.totalValue || 0).toLocaleString("en-IN")}</strong></span>
                                  <span>Adv: <strong style={{ color: "#16a34a" }}>₹{(lead.advancePayment || 0).toLocaleString("en-IN")}</strong></span>
                                  <span>Rem: <strong style={{ color: "#d97706" }}>₹{(lead.remainingPayment !== undefined ? lead.remainingPayment : Math.max(0, (lead.totalValue || 0) - (lead.advancePayment || 0))).toLocaleString("en-IN")}</strong></span>
                                </div>
                              </div>
                            ) : isQuoted ? (
                              <div className="ult-quoted-badge-text">
                                <FaCheckCircle size={11} /> Quote Sent
                              </div>
                            ) : null}
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

                          {/* DETAILS, PAYMENT & REMOVE BUTTONS */}
                          <td>
                            <div className="ult-action-cell">
                              {isClosed && (
                                <button
                                  type="button"
                                  className="ult-payment-btn"
                                  onClick={() => openPaymentModalForLead(lead)}
                                  title="View and update payment details"
                                  style={{
                                    padding: "6px 12px",
                                    background: "#f5f3ff",
                                    color: "#7c3aed",
                                    border: "1px solid #ddd6fe",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  💳 Payment
                                </button>
                              )}

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
      {/* ================= MODAL: CLOSURE STAGE SETUP (TOTAL VALUE, ADVANCE, REMAINING) ================= */}
      {closureLeadModal && (
        <div className="ult-modal-overlay" onClick={() => setClosureLeadModal(null)}>
          <div className="ult-modal-card" style={{ maxWidth: "560px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ult-modal-header" style={{ background: "linear-gradient(135deg, #15803d 0%, #16a34a 100%)", color: "#ffffff" }}>
              <div>
                <h3 style={{ color: "#ffffff", margin: 0, fontSize: "18px" }}>
                  🏆 Shift Lead to Closure Stage
                </h3>
                <span style={{ fontSize: "12px", opacity: 0.9 }}>
                  {closureLeadModal.lead?.name || "Customer Lead"} {closureLeadModal.lead?.company ? `(${closureLeadModal.lead.company})` : ""}
                </span>
              </div>
              <button
                className="ult-close-btn"
                style={{ color: "#ffffff" }}
                onClick={() => setClosureLeadModal(null)}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleConfirmClosure}>
              <div className="ult-modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px 14px", borderRadius: "8px", fontSize: "13px", color: "#166534" }}>
                  ✅ Shifting this lead to <strong>Closure</strong> will reduce your remaining product target by <strong>1</strong>. Please provide the financial closure details below:
                </div>

                <div className="ult-form-row">
                  <div className="ult-form-col">
                    <label style={{ fontWeight: 700, color: "#0f172a", fontSize: "13px" }}>
                      Total Deal Value (₹) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="ult-input"
                      placeholder="e.g. 50000"
                      value={closureForm.totalValue}
                      onChange={(e) => setClosureForm({ ...closureForm, totalValue: e.target.value })}
                      required
                    />
                  </div>

                  <div className="ult-form-col">
                    <label style={{ fontWeight: 700, color: "#0f172a", fontSize: "13px" }}>
                      Advance Payment (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="ult-input"
                      placeholder="e.g. 15000"
                      value={closureForm.advancePayment}
                      onChange={(e) => setClosureForm({ ...closureForm, advancePayment: e.target.value })}
                    />
                  </div>
                </div>

                {/* CALCULATED REMAINING PAYMENT */}
                <div style={{ background: "#fffbeb", border: "1px solid #fef3c7", padding: "12px 14px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: "12px", color: "#b45309", fontWeight: 700, display: "block" }}>
                      Remaining Payment Balance (Total - Advance):
                    </span>
                    <span style={{ fontSize: "11px", color: "#78350f" }}>
                      Auto-calculated balance to be collected later
                    </span>
                  </div>
                  <span style={{ fontSize: "20px", fontWeight: 800, color: "#b45309" }}>
                    ₹
                    {Math.max(
                      0,
                      (parseFloat(closureForm.totalValue) || 0) - (parseFloat(closureForm.advancePayment) || 0)
                    ).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="ult-form-row">
                  <div className="ult-form-col">
                    <label style={{ fontSize: "13px", color: "#475569" }}>Payment Mode</label>
                    <select
                      className="ult-input"
                      value={closureForm.paymentMode}
                      onChange={(e) => setClosureForm({ ...closureForm, paymentMode: e.target.value })}
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI / GPay / PhonePe">UPI / GPay / PhonePe</option>
                      <option value="Bank Transfer (NEFT / IMPS)">Bank Transfer (NEFT / IMPS)</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Online Gateway">Online Gateway</option>
                    </select>
                  </div>

                  <div className="ult-form-col">
                    <label style={{ fontSize: "13px", color: "#475569" }}>Payment Reference / Txn ID</label>
                    <input
                      type="text"
                      className="ult-input"
                      placeholder="e.g. UPI-998822 / Cheque #1029"
                      value={closureForm.paymentReference}
                      onChange={(e) => setClosureForm({ ...closureForm, paymentReference: e.target.value })}
                    />
                  </div>
                </div>

                <div className="ult-form-col">
                  <label style={{ fontSize: "13px", color: "#475569" }}>Payment Notes / Installment Terms</label>
                  <input
                    type="text"
                    className="ult-input"
                    placeholder="e.g. 30% advance received, balance on delivery"
                    value={closureForm.paymentNotes}
                    onChange={(e) => setClosureForm({ ...closureForm, paymentNotes: e.target.value })}
                  />
                </div>

                <div className="ult-form-col">
                  <label style={{ fontSize: "13px", color: "#475569" }}>Closure Notes</label>
                  <textarea
                    className="ult-note-textarea"
                    placeholder="Add final closure note or client specifications..."
                    rows={2}
                    value={closureForm.notes}
                    onChange={(e) => setClosureForm({ ...closureForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="ult-modal-footer">
                <button
                  type="button"
                  className="ult-cancel-btn"
                  onClick={() => setClosureLeadModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingClosure || !closureForm.totalValue}
                  style={{
                    padding: "10px 24px",
                    background: "#16a34a",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  {savingClosure ? "Saving Closure..." : "✓ Confirm Closure & Reduce Target"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: PRODUCT-WISE CLOSURE LEADS & PAYMENTS ================= */}
      {showClosureSummaryModal && (
        <div className="ult-modal-overlay" onClick={() => setShowClosureSummaryModal(false)}>
          <div className="ult-modal-card" style={{ maxWidth: "980px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ult-modal-header" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#ffffff" }}>
              <div>
                <h3 style={{ color: "#ffffff", margin: 0, fontSize: "18px" }}>
                  🏆 Closed Leads &amp; Payment Summary (Product-Wise)
                </h3>
                <span style={{ fontSize: "12px", opacity: 0.85 }}>
                  Review all customer leads shifted to Closure stage with their payment breakdown
                </span>
              </div>
              <button
                className="ult-close-btn"
                style={{ color: "#ffffff" }}
                onClick={() => setShowClosureSummaryModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="ult-modal-body" style={{ maxHeight: "78vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* TOP SUMMARY CARDS */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px", borderRadius: "10px", textAlign: "center" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>Total Closures</span>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "#16a34a", marginTop: "4px" }}>
                    {tracks.reduce((acc, t) => acc + (t.totalClosure || 0), 0)}
                  </div>
                </div>
                <div style={{ background: "#eef2ff", border: "1px solid #c7d2fe", padding: "12px", borderRadius: "10px", textAlign: "center" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#3730a3", textTransform: "uppercase" }}>Total Value</span>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "#4f46e5", marginTop: "4px" }}>
                    ₹{tracks.reduce((acc, t) => acc + (t.totalPayment || 0), 0).toLocaleString("en-IN")}
                  </div>
                </div>
                <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "12px", borderRadius: "10px", textAlign: "center" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#065f46", textTransform: "uppercase" }}>Advance Received</span>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "#059669", marginTop: "4px" }}>
                    ₹{tracks.reduce((acc, t) => acc + (t.totalAdvancePayment || 0), 0).toLocaleString("en-IN")}
                  </div>
                </div>
                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "12px", borderRadius: "10px", textAlign: "center" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#92400e", textTransform: "uppercase" }}>Remaining Payment</span>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "#d97706", marginTop: "4px" }}>
                    ₹{tracks.reduce((acc, t) => acc + (t.totalRemainingPayment || 0), 0).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              {/* PRODUCT-WISE BREAKDOWN */}
              {(() => {
                const closedByProduct = {};
                tracks.forEach((t) => {
                  t.products.forEach((p) => {
                    const closedLeads = (p.onboardedLeads || []).filter((l) => l.stage === "Closure");
                    if (closedLeads.length > 0) {
                      if (!closedByProduct[p.productName]) {
                        closedByProduct[p.productName] = {
                          productName: p.productName,
                          target: p.target,
                          noTarget: !!p.noTarget,
                          leads: [],
                        };
                      }
                      closedLeads.forEach((l) => {
                        closedByProduct[p.productName].leads.push({
                          ...l,
                          parentTrackId: t._id,
                          productId: p._id,
                          productName: p.productName,
                        });
                      });
                    }
                  });
                });

                const productKeys = Object.keys(closedByProduct);

                if (productKeys.length === 0) {
                  return (
                    <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                      <div style={{ fontSize: "32px", marginBottom: "8px" }}>🏆</div>
                      <h4 style={{ margin: "0 0 4px 0", color: "#334155" }}>No Deals Shifted to Closure Yet</h4>
                      <p style={{ margin: 0, fontSize: "13px" }}>
                        Advance leads to the <strong>Closure</strong> stage in your workspace to view them and manage payments here.
                      </p>
                    </div>
                  );
                }

                return productKeys.map((pName) => {
                  const pData = closedByProduct[pName];
                  const pTotalVal = pData.leads.reduce((s, l) => s + (l.totalValue || 0), 0);
                  const pAdvVal = pData.leads.reduce((s, l) => s + (l.advancePayment || 0), 0);
                  const pRemVal = pData.leads.reduce(
                    (s, l) =>
                      s +
                      (l.remainingPayment !== undefined
                        ? l.remainingPayment
                        : Math.max(0, (l.totalValue || 0) - (l.advancePayment || 0))),
                    0
                  );

                  return (
                    <div key={pName} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden" }}>
                      <div style={{ background: "#f8fafc", padding: "12px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "18px" }}>{PRODUCT_ICONS[pName] || "📦"}</span>
                          <strong style={{ fontSize: "15px", color: "#0f172a" }}>{pName}</strong>
                          <span style={{ fontSize: "12px", background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: "12px", fontWeight: 700 }}>
                            {pData.leads.length} Closed
                          </span>
                        </div>
                        <div style={{ fontSize: "12px", color: "#475569", display: "flex", gap: "12px" }}>
                          <span>Total: <strong>₹{pTotalVal.toLocaleString("en-IN")}</strong></span>
                          <span>Adv: <strong style={{ color: "#16a34a" }}>₹{pAdvVal.toLocaleString("en-IN")}</strong></span>
                          <span>Rem: <strong style={{ color: "#d97706" }}>₹{pRemVal.toLocaleString("en-IN")}</strong></span>
                        </div>
                      </div>

                      <div style={{ overflowX: "auto" }}>
                        <table className="ult-table" style={{ margin: 0 }}>
                          <thead>
                            <tr>
                              <th style={{ width: "35px" }}>#</th>
                              <th>Customer &amp; Company</th>
                              <th>Contact</th>
                              <th>Closure Date</th>
                              <th>Total Value</th>
                              <th>Advance Paid</th>
                              <th>Remaining Balance</th>
                              <th style={{ textAlign: "center" }}>Payment Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pData.leads.map((lead, lIdx) => {
                              const remAmt =
                                lead.remainingPayment !== undefined
                                  ? lead.remainingPayment
                                  : Math.max(0, (lead.totalValue || 0) - (lead.advancePayment || 0));

                              return (
                                <tr key={lead._id || lIdx}>
                                  <td><strong>{lIdx + 1}</strong></td>
                                  <td>
                                    <strong>{lead.name || "Customer Lead"}</strong>
                                    {lead.company && (
                                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                                        {lead.company}
                                      </div>
                                    )}
                                  </td>
                                  <td>{lead.phone || lead.email || "-"}</td>
                                  <td>
                                    {lead.closedAt
                                      ? new Date(lead.closedAt).toLocaleDateString()
                                      : lead.quotedAt
                                      ? new Date(lead.quotedAt).toLocaleDateString()
                                      : "-"}
                                  </td>
                                  <td>
                                    <strong style={{ color: "#0f172a" }}>
                                      ₹{(lead.totalValue || 0).toLocaleString("en-IN")}
                                    </strong>
                                  </td>
                                  <td>
                                    <strong style={{ color: "#16a34a" }}>
                                      ₹{(lead.advancePayment || 0).toLocaleString("en-IN")}
                                    </strong>
                                  </td>
                                  <td>
                                    <strong style={{ color: remAmt > 0 ? "#d97706" : "#16a34a" }}>
                                      ₹{remAmt.toLocaleString("en-IN")}
                                    </strong>
                                    {remAmt === 0 && (
                                      <span style={{ marginLeft: "4px", fontSize: "10px", background: "#dcfce7", color: "#15803d", padding: "1px 5px", borderRadius: "4px" }}>
                                        Paid
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ textAlign: "center" }}>
                                    <button
                                      type="button"
                                      onClick={() => openPaymentModalForLead(lead, lead.parentTrackId, lead.productId, pName)}
                                      style={{
                                        padding: "6px 14px",
                                        background: "#2563eb",
                                        color: "#ffffff",
                                        border: "none",
                                        borderRadius: "6px",
                                        fontWeight: 700,
                                        fontSize: "12px",
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                      }}
                                    >
                                      💳 Payment
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="ult-modal-footer">
              <button
                type="button"
                className="ult-cancel-btn"
                onClick={() => setShowClosureSummaryModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CUSTOMER PAYMENT DETAILS & RECORDING ================= */}
      {selectedLeadForPayment && (
        <div className="ult-modal-overlay" onClick={() => setSelectedLeadForPayment(null)}>
          <div className="ult-modal-card" style={{ maxWidth: "680px" }} onClick={(e) => e.stopPropagation()}>
            <div className="ult-modal-header" style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)", color: "#ffffff" }}>
              <div>
                <h3 style={{ color: "#ffffff", margin: 0, fontSize: "18px" }}>
                  💳 Customer Payment Details
                </h3>
                <span style={{ fontSize: "12px", opacity: 0.9 }}>
                  {selectedLeadForPayment.lead?.name || "Customer Lead"} • Product: <strong>{selectedLeadForPayment.productName}</strong>
                </span>
              </div>
              <button
                className="ult-close-btn"
                style={{ color: "#ffffff" }}
                onClick={() => setSelectedLeadForPayment(null)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="ult-modal-body" style={{ maxHeight: "75vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* PAYMENT SUMMARY CHIPS */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Total Deal Value</span>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
                    ₹{(selectedLeadForPayment.lead?.totalValue || 0).toLocaleString("en-IN")}
                  </div>
                </div>

                <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                  <span style={{ fontSize: "11px", color: "#065f46", fontWeight: 700, textTransform: "uppercase" }}>Advance / Paid</span>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#059669", marginTop: "2px" }}>
                    ₹{(selectedLeadForPayment.lead?.advancePayment || 0).toLocaleString("en-IN")}
                  </div>
                </div>

                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                  <span style={{ fontSize: "11px", color: "#92400e", fontWeight: 700, textTransform: "uppercase" }}>Remaining Due</span>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#d97706", marginTop: "2px" }}>
                    ₹
                    {(
                      selectedLeadForPayment.lead?.remainingPayment !== undefined
                        ? selectedLeadForPayment.lead?.remainingPayment
                        : Math.max(0, (selectedLeadForPayment.lead?.totalValue || 0) - (selectedLeadForPayment.lead?.advancePayment || 0))
                    ).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              {/* RECORD NEW INSTALLMENT / UPDATE PAYMENT FORM */}
              <form onSubmit={handleRecordPayment} style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#0f172a" }}>
                  ➕ Record Payment Installment
                </h4>

                <div className="ult-form-row">
                  <div className="ult-form-col">
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>
                      Amount Received (₹) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="ult-input"
                      placeholder="e.g. 10000"
                      value={paymentInstallmentForm.amount}
                      onChange={(e) => setPaymentInstallmentForm({ ...paymentInstallmentForm, amount: e.target.value })}
                    />
                  </div>

                  <div className="ult-form-col">
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>Payment Mode</label>
                    <select
                      className="ult-input"
                      value={paymentInstallmentForm.mode}
                      onChange={(e) => setPaymentInstallmentForm({ ...paymentInstallmentForm, mode: e.target.value })}
                    >
                      <option value="UPI / GPay / PhonePe">UPI / GPay / PhonePe</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer (NEFT / IMPS)">Bank Transfer (NEFT / IMPS)</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Online Gateway">Online Gateway</option>
                    </select>
                  </div>
                </div>

                <div className="ult-form-row">
                  <div className="ult-form-col">
                    <label style={{ fontSize: "12px", color: "#475569" }}>Reference / Transaction ID</label>
                    <input
                      type="text"
                      className="ult-input"
                      placeholder="e.g. UPI-123456 / Chq #8877"
                      value={paymentInstallmentForm.reference}
                      onChange={(e) => setPaymentInstallmentForm({ ...paymentInstallmentForm, reference: e.target.value })}
                    />
                  </div>

                  <div className="ult-form-col">
                    <label style={{ fontSize: "12px", color: "#475569" }}>Update Total Deal Value (₹) (Optional)</label>
                    <input
                      type="number"
                      className="ult-input"
                      placeholder={`Current: ${selectedLeadForPayment.lead?.totalValue || 0}`}
                      value={paymentInstallmentForm.totalValue}
                      onChange={(e) => setPaymentInstallmentForm({ ...paymentInstallmentForm, totalValue: e.target.value })}
                    />
                  </div>
                </div>

                <div className="ult-form-col">
                  <label style={{ fontSize: "12px", color: "#475569" }}>Payment Notes / Installment Remarks</label>
                  <input
                    type="text"
                    className="ult-input"
                    placeholder="e.g. 2nd installment received via UPI"
                    value={paymentInstallmentForm.notes}
                    onChange={(e) => setPaymentInstallmentForm({ ...paymentInstallmentForm, notes: e.target.value })}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
                  <button
                    type="submit"
                    disabled={savingPayment || (!paymentInstallmentForm.amount && !paymentInstallmentForm.totalValue)}
                    style={{
                      padding: "8px 20px",
                      background: "#2563eb",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: 700,
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    {savingPayment ? "Saving..." : "✓ Save Payment"}
                  </button>
                </div>
              </form>

              {/* PAYMENT TRANSACTION HISTORY */}
              <div>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#0f172a" }}>
                  📜 Payment Transactions History ({selectedLeadForPayment.lead?.payments?.length || 0})
                </h4>

                {(!selectedLeadForPayment.lead?.payments || selectedLeadForPayment.lead.payments.length === 0) ? (
                  <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "8px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                    No recorded transaction records yet. (Initial advance: ₹{(selectedLeadForPayment.lead?.advancePayment || 0).toLocaleString("en-IN")})
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="ult-table" style={{ margin: 0, fontSize: "13px" }}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Amount</th>
                          <th>Mode</th>
                          <th>Reference</th>
                          <th>Notes</th>
                          <th>Recorded By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...selectedLeadForPayment.lead.payments].reverse().map((pay, pIdx) => (
                          <tr key={pIdx}>
                            <td>{pay.date ? new Date(pay.date).toLocaleString() : "-"}</td>
                            <td>
                              <strong style={{ color: "#16a34a" }}>
                                ₹{(pay.amount || 0).toLocaleString("en-IN")}
                              </strong>
                            </td>
                            <td>{pay.mode || "Cash"}</td>
                            <td>{pay.reference || "-"}</td>
                            <td>{pay.notes || "-"}</td>
                            <td>{pay.recordedByName || "User"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="ult-modal-footer">
              <button
                type="button"
                className="ult-cancel-btn"
                onClick={() => setSelectedLeadForPayment(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserLeadTrack;
