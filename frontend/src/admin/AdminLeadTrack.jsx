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
  FaEdit,
  FaSave,
} from "react-icons/fa";
import API from "../services/api";
import "./AdminLeadTrack.css";

const STANDARD_PRODUCTS = [
  "Genunitys",
  "Rewards",
  "CRM",
  "Custom-Website",
  "WhatsappAtuomation",
  "Projects",
  "QuickCommerce",
];

const PRODUCT_ICONS = {
  Genunitys: "🛡️",
  Rewards: "🎁",
  CRM: "💼",
  "Custom-Website": "🌐",
  WhatsappAtuomation: "🤖",
  Projects: "📁",
  QuickCommerce: "⚡",
};

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
    Genunitys: { selected: true, target: 25, noTarget: false },
    Rewards: { selected: true, target: 25, noTarget: false },
    CRM: { selected: true, target: 25, noTarget: false },
    "Custom-Website": { selected: true, target: 25, noTarget: false },
    WhatsappAtuomation: { selected: true, target: 25, noTarget: false },
    Projects: { selected: true, target: 25, noTarget: false },
    QuickCommerce: { selected: true, target: 25, noTarget: false },
  });
  const [creating, setCreating] = useState(false);

  // Modal State for inspecting leads of a specific card
  const [selectedCardForModal, setSelectedCardForModal] = useState(null);
  const [selectedLeadForAdminDetails, setSelectedLeadForAdminDetails] = useState(null);

  // Closure & Payment Modals
  const [showAdminClosureSummaryModal, setShowAdminClosureSummaryModal] = useState(false);
  const [selectedPaymentLeadForAdmin, setSelectedPaymentLeadForAdmin] = useState(null);
  const [adminPaymentInstallmentForm, setAdminPaymentInstallmentForm] = useState({
    amount: "",
    mode: "Cash",
    reference: "",
    notes: "",
    totalValue: "",
  });
  const [savingAdminPayment, setSavingAdminPayment] = useState(false);

  // Edit Track Modal State
  const [editingTrack, setEditingTrack] = useState(null);
  const [editTrackForm, setEditTrackForm] = useState({
    title: "",
    startMonth: "",
    endMonth: "",
    status: "active",
    products: [],
  });
  const [newProductToAdd, setNewProductToAdd] = useState("");
  const [savingEditTrack, setSavingEditTrack] = useState(false);

  // Fetch Users and Report on mount
  useEffect(() => {
    fetchUsers();
    fetchReport();
    fetchAllTracks();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await API.get("/lead-tracks/assignable-users");
      setUsers(res.data.users || []);
    } catch (err) {
      try {
        const fallbackRes = await API.get("/users");
        setUsers(fallbackRes.data.users || fallbackRes.data || []);
      } catch (e) {
        console.error("Failed to fetch users:", e);
      }
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

  const handleNoTargetToggle = (prod) => {
    setProductSelections((prev) => ({
      ...prev,
      [prod]: {
        ...prev[prod],
        noTarget: !prev[prod]?.noTarget,
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
          noTarget: false,
        };
      });
      return updated;
    });
  };

  const setAllNoTarget = () => {
    setProductSelections((prev) => {
      const updated = {};
      STANDARD_PRODUCTS.forEach((p) => {
        updated[p] = {
          selected: true,
          target: 0,
          noTarget: true,
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
      (p) => productSelections[p]?.selected
    ).map((p) => ({
      productName: p,
      target: productSelections[p]?.noTarget ? 0 : productSelections[p]?.target,
      noTarget: !!productSelections[p]?.noTarget,
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

  const handleClearAllTracks = async () => {
    if (
      !window.confirm(
        "Are you sure you want to CLEAR ALL lead tracks? This will delete all tracks and all onboarded lead tracking data so you can start completely fresh."
      )
    ) {
      return;
    }

    try {
      const res = await API.delete("/lead-tracks/clear-all");
      alert(res.data.message || "All lead tracks cleared successfully");
      fetchReport();
      fetchAllTracks();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to clear all tracks");
    }
  };

  // ================= EDIT TRACK HANDLERS =================
  const handleOpenEditTrack = (track) => {
    setEditingTrack(track);
    setEditTrackForm({
      title: track.title || "",
      startMonth: track.startMonth || "",
      endMonth: track.endMonth || "",
      status: track.status || "active",
      products: (track.products || []).map((p) => ({
        _id: p._id,
        productName: p.productName,
        target: p.target !== undefined ? p.target : 25,
        noTarget: !!p.noTarget,
        onboardedCount: p.onboardedLeads?.length || p.onboardedCount || 0,
      })),
    });
    setNewProductToAdd("");
  };

  const handleOpenEditTrackById = (trackId) => {
    const track = allTracks.find((t) => String(t._id) === String(trackId));
    if (track) {
      handleOpenEditTrack(track);
    }
  };

  const handleEditProductTargetChange = (index, value) => {
    setEditTrackForm((prev) => {
      const nextProds = [...prev.products];
      nextProds[index] = {
        ...nextProds[index],
        target: Math.max(0, parseInt(value, 10) || 0),
      };
      return { ...prev, products: nextProds };
    });
  };

  const handleEditProductNoTargetToggle = (index) => {
    setEditTrackForm((prev) => {
      const nextProds = [...prev.products];
      const currentNoTarget = !nextProds[index].noTarget;
      nextProds[index] = {
        ...nextProds[index],
        noTarget: currentNoTarget,
        target: currentNoTarget ? 0 : nextProds[index].target || 25,
      };
      return { ...prev, products: nextProds };
    });
  };

  const handleEditRemoveProduct = (index) => {
    const prod = editTrackForm.products[index];
    if (prod && prod.onboardedCount > 0) {
      if (
        !window.confirm(
          `Product "${prod.productName}" currently has ${prod.onboardedCount} onboarded lead(s). Are you sure you want to remove this product from this track?`
        )
      ) {
        return;
      }
    }
    setEditTrackForm((prev) => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index),
    }));
  };

  const handleEditAddProduct = () => {
    if (!newProductToAdd) return;
    if (editTrackForm.products.some((p) => p.productName === newProductToAdd)) {
      alert("This product is already in this lead track.");
      return;
    }
    setEditTrackForm((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        {
          productName: newProductToAdd,
          target: 25,
          noTarget: false,
          onboardedCount: 0,
        },
      ],
    }));
    setNewProductToAdd("");
  };

  const handleSaveEditTrack = async (e) => {
    if (e) e.preventDefault();
    if (!editTrackForm.products || editTrackForm.products.length === 0) {
      alert("Please keep at least one product in this lead track.");
      return;
    }
    try {
      setSavingEditTrack(true);
      await API.put(`/lead-tracks/${editingTrack._id}`, {
        title: editTrackForm.title,
        startMonth: editTrackForm.startMonth,
        endMonth: editTrackForm.endMonth,
        status: editTrackForm.status,
        products: editTrackForm.products.map((p) => ({
          _id: p._id,
          productName: p.productName,
          target: p.noTarget ? 0 : Math.max(0, parseInt(p.target, 10) || 0),
          noTarget: !!p.noTarget,
        })),
      });

      alert("Lead Track updated successfully!");
      setEditingTrack(null);
      fetchReport();
      fetchAllTracks();
    } catch (err) {
      console.error("Failed to update track:", err);
      alert(err.response?.data?.message || "Failed to update track");
    } finally {
      setSavingEditTrack(false);
    }
  };

  const openAdminPaymentModal = (lead, trackId, productId, productName, userName) => {
    setSelectedPaymentLeadForAdmin({
      lead,
      trackId,
      productId,
      productName,
      userName,
    });
    setAdminPaymentInstallmentForm({
      amount: "",
      mode: "Cash",
      reference: "",
      notes: "",
      totalValue: lead.totalValue || "",
    });
  };

  const handleSaveAdminPayment = async (e) => {
    if (e) e.preventDefault();
    if (!selectedPaymentLeadForAdmin) return;
    const { lead, trackId, productId } = selectedPaymentLeadForAdmin;
    const amt = parseFloat(adminPaymentInstallmentForm.amount) || 0;
    const newTotal = adminPaymentInstallmentForm.totalValue !== "" ? parseFloat(adminPaymentInstallmentForm.totalValue) : undefined;

    if (amt <= 0 && newTotal === undefined) {
      alert("Please enter a payment amount or update total deal value.");
      return;
    }

    try {
      setSavingAdminPayment(true);
      const res = await API.post(
        `/lead-tracks/${trackId}/products/${productId}/leads/${lead._id}/payment`,
        {
          amount: amt > 0 ? amt : undefined,
          mode: adminPaymentInstallmentForm.mode,
          reference: adminPaymentInstallmentForm.reference,
          notes: adminPaymentInstallmentForm.notes,
          totalValue: newTotal,
        }
      );
      alert("Payment details updated successfully!");
      setAdminPaymentInstallmentForm({
        amount: "",
        mode: "Cash",
        reference: "",
        notes: "",
        totalValue: res.data.lead?.totalValue || "",
      });
      if (res.data.lead) {
        setSelectedPaymentLeadForAdmin((prev) => ({
          ...prev,
          lead: res.data.lead,
        }));
      }
      fetchReport();
      fetchAllTracks();
    } catch (err) {
      console.error("Failed to save payment:", err);
      alert(err.response?.data?.message || "Failed to update payment");
    } finally {
      setSavingAdminPayment(false);
    }
  };

  // Filtered users for the report view
  const usersToDisplay =
    reportData?.usersReport?.filter((u) => {
      if (selectedUserFilter === "all") return true;
      return (
        String(u.userId) === String(selectedUserFilter) ||
        (u.userName && u.userName.toLowerCase() === selectedUserFilter.toLowerCase())
      );
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

              {/* 🏆 TOTAL CLOSURE CARD */}
              <div
                className="alt-kpi-card"
                style={{ borderLeft: "4px solid #16a34a", cursor: "pointer", background: "#f0fdf4" }}
                onClick={() => setShowAdminClosureSummaryModal(true)}
                title="Click to view all closed leads product-wise"
              >
                <span className="alt-kpi-label" style={{ color: "#166534" }}>🏆 Total Closure ↗</span>
                <span className="alt-kpi-value" style={{ color: "#16a34a" }}>
                  {reportData.summary.totalClosure || 0}
                </span>
                <span className="alt-kpi-sub" style={{ color: "#15803d" }}>Deals successfully closed</span>
              </div>

              {/* 💰 TOTAL PAYMENT CARD */}
              <div
                className="alt-kpi-card"
                style={{ borderLeft: "4px solid #4f46e5", cursor: "pointer", background: "#eef2ff" }}
                onClick={() => setShowAdminClosureSummaryModal(true)}
                title="Click to view payment breakdown product-wise"
              >
                <span className="alt-kpi-label" style={{ color: "#3730a3" }}>💰 Total Payment ↗</span>
                <span className="alt-kpi-value" style={{ color: "#4f46e5" }}>
                  ₹{(reportData.summary.totalPayment || 0).toLocaleString("en-IN")}
                </span>
                <span className="alt-kpi-sub" style={{ color: "#4338ca" }}>Cumulative closure deal value</span>
              </div>

              {/* 💵 ADVANCE PAYMENT CARD */}
              <div
                className="alt-kpi-card"
                style={{ borderLeft: "4px solid #059669", cursor: "pointer", background: "#ecfdf5" }}
                onClick={() => setShowAdminClosureSummaryModal(true)}
                title="Click to view advance payment details product-wise"
              >
                <span className="alt-kpi-label" style={{ color: "#065f46" }}>💵 Advance Payment ↗</span>
                <span className="alt-kpi-value" style={{ color: "#059669" }}>
                  ₹{(reportData.summary.totalAdvancePayment || 0).toLocaleString("en-IN")}
                </span>
                <span className="alt-kpi-sub" style={{ color: "#047857" }}>Collected advances</span>
              </div>

              {/* ⏳ REMAINING PAYMENT CARD */}
              <div
                className="alt-kpi-card"
                style={{ borderLeft: "4px solid #d97706", cursor: "pointer", background: "#fffbeb" }}
                onClick={() => setShowAdminClosureSummaryModal(true)}
                title="Click to view remaining payments product-wise"
              >
                <span className="alt-kpi-label" style={{ color: "#92400e" }}>⏳ Remaining Payment ↗</span>
                <span className="alt-kpi-value" style={{ color: "#d97706" }}>
                  ₹{(reportData.summary.totalRemainingPayment || 0).toLocaleString("en-IN")}
                </span>
                <span className="alt-kpi-sub" style={{ color: "#b45309" }}>Pending collections</span>
              </div>

              <div className="alt-kpi-card alt-kpi-highlight-amber">
                <span className="alt-kpi-label">Remaining Target</span>
                <span className="alt-kpi-value">{reportData.summary.totalRemainingTarget}</span>
                <span className="alt-kpi-sub">Leads left to Close</span>
              </div>

              <div className="alt-kpi-card alt-kpi-highlight-green">
                <span className="alt-kpi-label">Total Quoted Leads</span>
                <span className="alt-kpi-value">{reportData.summary.totalQuoted}</span>
                <span className="alt-kpi-sub">Reached Quote stage</span>
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
                              background: card.noTarget ? "#fef3c7" : card.remainingTarget === 0 ? "#dcfce7" : "#eff6ff",
                              color: card.noTarget ? "#b45309" : card.remainingTarget === 0 ? "#15803d" : "#2563eb",
                            }}
                          >
                            {card.noTarget ? "♾️ No Target" : card.remainingTarget === 0 ? "Target Met 🎉" : "Active"}
                          </span>
                        </div>

                        <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "12px" }}>
                          📅 {card.startMonth} to {card.endMonth}
                        </div>

                        {/* COUNTS GRID */}
                        <div className="alt-card-counts">
                          <div className="alt-count-box">
                            <span className="label">Target Lead</span>
                            <span className="val">{card.noTarget ? "No Target" : card.target}</span>
                          </div>
                          <div className="alt-count-box highlight" style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}>
                            <span className="label" style={{ color: "#166534" }}>🏆 Closures</span>
                            <span className="val" style={{ color: "#16a34a" }}>
                              {card.closureCount !== undefined ? card.closureCount : card.leads.filter((l) => l.stage === "Closure").length}
                            </span>
                          </div>
                          <div className="alt-count-box">
                            <span className="label">Onboarded Leads</span>
                            <span className="val">{card.onboardedCount}</span>
                          </div>
                          <div className="alt-count-box rem-highlight">
                            <span className="label">Remaining Target</span>
                            <span className="val">{card.noTarget ? "No Target" : card.remainingTarget}</span>
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
                          <span className="alt-stage-chip" style={{ background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0", fontWeight: 700 }}>
                            🏆 Closure: {card.closureCount !== undefined ? card.closureCount : card.leads.filter((l) => l.stage === "Closure").length}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                        <button
                          className="alt-card-btn"
                          style={{ flex: 1 }}
                          onClick={() => setSelectedCardForModal({ ...card, userName: user.userName })}
                        >
                          <FaEye /> Leads ({card.onboardedCount})
                        </button>
                        {card.trackId && (
                          <button
                            type="button"
                            onClick={() => handleOpenEditTrackById(card.trackId)}
                            title="Edit this Lead Track & Products"
                            style={{
                              padding: "9px 12px",
                              background: "#eff6ff",
                              color: "#2563eb",
                              border: "1px solid #bfdbfe",
                              borderRadius: "8px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "13px",
                              fontWeight: 600,
                            }}
                          >
                            <FaEdit /> Edit
                          </button>
                        )}
                      </div>
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
                <h4>🎯 Products &amp; Target Setup</h4>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
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
                  <button
                    type="button"
                    className="alt-quick-btn"
                    style={{ background: "#fef3c7", color: "#b45309", borderColor: "#fde68a" }}
                    onClick={setAllNoTarget}
                  >
                    ♾️ Set All to No Target
                  </button>
                </div>
              </div>

              {STANDARD_PRODUCTS.map((prod) => {
                const current = productSelections[prod] || { selected: false, target: 25, noTarget: false };
                return (
                  <div key={prod} className="alt-product-row">
                    <label className="alt-product-check-label">
                      <input
                        type="checkbox"
                        checked={current.selected}
                        onChange={() => handleProductToggle(prod)}
                      />
                      <span>{prod}</span>
                    </label>

                    <div className="alt-target-input-box" style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer", color: "#475569" }}>
                        <input
                          type="checkbox"
                          checked={!!current.noTarget}
                          disabled={!current.selected}
                          onChange={() => handleNoTargetToggle(prod)}
                        />
                        <span>No Target (Unlimited Leads)</span>
                      </label>

                      {!current.noTarget ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>Target:</span>
                          <input
                            type="number"
                            min="1"
                            className="alt-target-input"
                            disabled={!current.selected}
                            value={current.target}
                            onChange={(e) => handleTargetChange(prod, e.target.value)}
                            style={{
                              opacity: current.selected ? 1 : 0.5,
                            }}
                          />
                        </div>
                      ) : (
                        <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 700, padding: "3px 8px", background: "#dcfce7", borderRadius: "6px" }}>
                          ♾️ Unlimited Leads
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>
              All Active &amp; Historical Lead Tracks
            </h3>
            {allTracks.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllTracks}
                style={{
                  background: "#fee2e2",
                  color: "#ef4444",
                  border: "1px solid #fecaca",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <FaTrash /> Clear All Tracks
              </button>
            )}
          </div>

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
                              {p.productName}: <strong>{p.noTarget ? "No Target" : p.target}</strong>
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
                      <td style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <button
                          style={{
                            background: "#eff6ff",
                            border: "1px solid #bfdbfe",
                            color: "#2563eb",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                          onClick={() => handleOpenEditTrack(t)}
                          title="Edit Track & Products"
                        >
                          <FaEdit /> Edit
                        </button>
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
                  Assigned User: <strong>{selectedCardForModal.userName}</strong> | Target: {selectedCardForModal.target} | Closures: {selectedCardForModal.closureCount !== undefined ? selectedCardForModal.closureCount : selectedCardForModal.leads.filter((l) => l.stage === "Closure").length} | Quoted: {selectedCardForModal.quotedCount} | Remaining: {selectedCardForModal.remainingTarget}
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
                        <th>Deal / Payment</th>
                        <th>Latest Note</th>
                        <th>Stage History</th>
                        <th>Quoted / Closed</th>
                        <th style={{ textAlign: "center" }}>Actions</th>
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
                            {(lead.sparkName || lead.sparkNumber) && (
                              <div style={{ fontSize: "11px", color: "#d97706", marginTop: "2px" }}>
                                ⚡ Spark: {lead.sparkName || "-"} {lead.sparkNumber ? `(${lead.sparkNumber})` : ""}
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
                            {lead.stage === "Closure" ? (
                              <div style={{ fontSize: "11px" }}>
                                <div style={{ color: "#0f172a" }}>
                                  Total: <strong>₹{(lead.totalValue || 0).toLocaleString("en-IN")}</strong>
                                </div>
                                <div style={{ color: "#16a34a" }}>
                                  Adv: ₹{(lead.advancePayment || 0).toLocaleString("en-IN")}
                                </div>
                                <div style={{ color: (lead.remainingPayment !== undefined ? lead.remainingPayment : Math.max(0, (lead.totalValue || 0) - (lead.advancePayment || 0))) > 0 ? "#d97706" : "#16a34a", fontWeight: 600 }}>
                                  Rem: ₹{(lead.remainingPayment !== undefined ? lead.remainingPayment : Math.max(0, (lead.totalValue || 0) - (lead.advancePayment || 0))).toLocaleString("en-IN")}
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: "#94a3b8", fontSize: "12px" }}>—</span>
                            )}
                          </td>
                          <td>
                            <div style={{ fontSize: "12px", color: "#334155", maxWidth: "160px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                              {lead.notes || <span style={{ color: "#94a3b8" }}>No notes</span>}
                            </div>
                            <span style={{ fontSize: "11px", color: "#2563eb", background: "#dbeafe", padding: "1px 6px", borderRadius: "10px", display: "inline-block", marginTop: "3px" }}>
                              {lead.notesHistory?.length || (lead.notes ? 1 : 0)} note(s)
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
                            {lead.stage === "Closure" && lead.closedAt ? (
                              <span style={{ color: "#16a34a", fontWeight: 700, fontSize: "12px" }}>
                                🏆 {new Date(lead.closedAt).toLocaleDateString()}
                              </span>
                            ) : lead.quotedAt ? (
                              <span style={{ color: "#2563eb", fontWeight: 600, fontSize: "12px" }}>
                                📝 {new Date(lead.quotedAt).toLocaleDateString()}
                              </span>
                            ) : (
                              <span style={{ color: "#94a3b8", fontSize: "12px" }}>In Progress</span>
                            )}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                              <button
                                type="button"
                                className="alt-card-btn"
                                style={{ padding: "6px 10px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                                onClick={() => setSelectedLeadForAdminDetails({ ...lead, parentTrackId: selectedCardForModal.trackId, productId: selectedCardForModal.productId || selectedCardForModal._id, productName: selectedCardForModal.productName, userName: selectedCardForModal.userName })}
                              >
                                <FaEye /> Details
                              </button>
                              {lead.stage === "Closure" && (
                                <button
                                  type="button"
                                  style={{
                                    padding: "6px 10px",
                                    fontSize: "12px",
                                    background: "#2563eb",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: "6px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                  onClick={() =>
                                    openAdminPaymentModal(
                                      lead,
                                      selectedCardForModal.trackId,
                                      selectedCardForModal.productId || selectedCardForModal._id,
                                      selectedCardForModal.productName,
                                      selectedCardForModal.userName
                                    )
                                  }
                                >
                                  💳 Payment
                                </button>
                              )}
                            </div>
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

      {/* ================= MODAL: ADMIN OVERALL LEAD DETAILS & NOTES HISTORY ================= */}
      {selectedLeadForAdminDetails && (
        <div className="alt-modal-overlay" onClick={() => setSelectedLeadForAdminDetails(null)}>
          <div className="alt-modal-card" style={{ maxWidth: "750px" }} onClick={(e) => e.stopPropagation()}>
            <div className="alt-modal-header">
              <div>
                <h3>🔍 Lead Details &amp; Notes History</h3>
                <span style={{ fontSize: "13px", color: "#64748b" }}>
                  {selectedLeadForAdminDetails.name || "Customer Lead"} • Stage:{" "}
                  <strong style={{ color: "#2563eb" }}>{selectedLeadForAdminDetails.stage}</strong>
                </span>
              </div>
              <button className="alt-close-btn" onClick={() => setSelectedLeadForAdminDetails(null)}>
                <FaTimes />
              </button>
            </div>

            <div className="alt-modal-body" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Customer Info */}
              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#0f172a" }}>👤 Customer Details</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px" }}>
                  <div><strong>Name:</strong> {selectedLeadForAdminDetails.name || "-"}</div>
                  <div><strong>Company:</strong> {selectedLeadForAdminDetails.company || "-"}</div>
                  <div><strong>Phone:</strong> {selectedLeadForAdminDetails.phone || "-"}</div>
                  <div><strong>Email:</strong> {selectedLeadForAdminDetails.email || "-"}</div>
                  <div><strong>Location:</strong> {selectedLeadForAdminDetails.location || "-"}</div>
                  {selectedLeadForAdminDetails.sparkName && (
                    <div><strong>⚡ Spark Name:</strong> {selectedLeadForAdminDetails.sparkName}</div>
                  )}
                  {selectedLeadForAdminDetails.sparkNumber && (
                    <div><strong>⚡ Spark Number:</strong> {selectedLeadForAdminDetails.sparkNumber}</div>
                  )}
                  <div>
                    <strong>Onboarded:</strong>{" "}
                    {selectedLeadForAdminDetails.onboardedAt
                      ? new Date(selectedLeadForAdminDetails.onboardedAt).toLocaleString()
                      : "-"}
                  </div>
                  {selectedLeadForAdminDetails.quotedAt && (
                    <div style={{ color: "#2563eb" }}>
                      <strong>Quoted Date:</strong>{" "}
                      {new Date(selectedLeadForAdminDetails.quotedAt).toLocaleString()}
                    </div>
                  )}
                  {selectedLeadForAdminDetails.closedAt && (
                    <div style={{ color: "#16a34a" }}>
                      <strong>Closure Date:</strong>{" "}
                      {new Date(selectedLeadForAdminDetails.closedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Closure & Payment Financial Details */}
              {selectedLeadForAdminDetails.stage === "Closure" && (
                <div style={{ background: "#f0fdf4", padding: "16px", borderRadius: "10px", border: "1px solid #bbf7d0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h4 style={{ margin: 0, fontSize: "14px", color: "#166534" }}>🏆 Closure &amp; Payment Status</h4>
                    <button
                      type="button"
                      style={{
                        padding: "5px 12px",
                        background: "#2563eb",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        openAdminPaymentModal(
                          selectedLeadForAdminDetails,
                          selectedLeadForAdminDetails.parentTrackId,
                          selectedLeadForAdminDetails.productId,
                          selectedLeadForAdminDetails.productName,
                          selectedLeadForAdminDetails.userName
                        )
                      }
                    >
                      💳 Manage Payments
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", fontSize: "13px" }}>
                    <div style={{ background: "#ffffff", padding: "10px", borderRadius: "8px", border: "1px solid #dcfce7" }}>
                      <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>Total Value</span>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
                        ₹{(selectedLeadForAdminDetails.totalValue || 0).toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div style={{ background: "#ffffff", padding: "10px", borderRadius: "8px", border: "1px solid #dcfce7" }}>
                      <span style={{ fontSize: "11px", color: "#166534", fontWeight: 600 }}>Advance Received</span>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: "#16a34a", marginTop: "2px" }}>
                        ₹{(selectedLeadForAdminDetails.advancePayment || 0).toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div style={{ background: "#ffffff", padding: "10px", borderRadius: "8px", border: "1px solid #dcfce7" }}>
                      <span style={{ fontSize: "11px", color: "#92400e", fontWeight: 600 }}>Remaining Due</span>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: "#d97706", marginTop: "2px" }}>
                        ₹{(
                          selectedLeadForAdminDetails.remainingPayment !== undefined
                            ? selectedLeadForAdminDetails.remainingPayment
                            : Math.max(0, (selectedLeadForAdminDetails.totalValue || 0) - (selectedLeadForAdminDetails.advancePayment || 0))
                        ).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>

                  {selectedLeadForAdminDetails.payments && selectedLeadForAdminDetails.payments.length > 0 && (
                    <div style={{ marginTop: "14px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#166534" }}>
                        Transaction History ({selectedLeadForAdminDetails.payments.length})
                      </span>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px" }}>
                        {selectedLeadForAdminDetails.payments.map((p, pIdx) => (
                          <div
                            key={pIdx}
                            style={{
                              background: "#ffffff",
                              padding: "8px 12px",
                              borderRadius: "6px",
                              border: "1px solid #dcfce7",
                              fontSize: "12px",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div>
                              <strong>₹{(p.amount || 0).toLocaleString("en-IN")}</strong> via{" "}
                              <span style={{ color: "#2563eb" }}>{p.mode || "Cash"}</span>
                              {p.reference && <span style={{ color: "#64748b" }}> ({p.reference})</span>}
                              {p.notes && <div style={{ fontSize: "11px", color: "#475569" }}>Note: {p.notes}</div>}
                            </div>
                            <span style={{ color: "#94a3b8", fontSize: "11px" }}>
                              {p.recordedAt ? new Date(p.recordedAt).toLocaleString() : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Stage History */}
              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#0f172a" }}>📊 Stage Progression Timeline</h4>
                {selectedLeadForAdminDetails.stageHistory && selectedLeadForAdminDetails.stageHistory.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {selectedLeadForAdminDetails.stageHistory.map((sh, sIdx) => (
                      <div key={sIdx} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                        <span className={`alt-stage-pill ${sh.stage}`}>{sh.stage}</span>
                        <span style={{ color: "#64748b" }}>
                          {sh.updatedAt ? new Date(sh.updatedAt).toLocaleString() : "-"}
                        </span>
                        {sh.updatedByName && (
                          <span style={{ color: "#0f172a", fontWeight: 600 }}>by {sh.updatedByName}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: "#94a3b8", fontSize: "13px" }}>No stage changes recorded.</div>
                )}
              </div>

              {/* Notes History */}
              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#0f172a" }}>📝 Complete Notes History</h4>
                {selectedLeadForAdminDetails.notesHistory && selectedLeadForAdminDetails.notesHistory.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {[...selectedLeadForAdminDetails.notesHistory].reverse().map((nh, nIdx) => (
                      <div key={nIdx} style={{ background: "#ffffff", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12px" }}>
                          <span className={`alt-stage-pill ${nh.stage || "Call"}`}>{nh.stage || "Note"}</span>
                          <span style={{ color: "#64748b" }}>
                            👤 {nh.authorName || "User"} • {nh.createdAt ? new Date(nh.createdAt).toLocaleString() : "-"}
                          </span>
                        </div>
                        <div style={{ fontSize: "13px", color: "#1e293b", lineHeight: 1.5 }}>
                          {nh.note}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : selectedLeadForAdminDetails.notes ? (
                  <div style={{ background: "#ffffff", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px" }}>
                    {selectedLeadForAdminDetails.notes}
                  </div>
                ) : (
                  <div style={{ color: "#94a3b8", fontSize: "13px" }}>No notes recorded for this lead.</div>
                )}
              </div>
            </div>

            <div style={{ padding: "14px 20px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="alt-card-btn"
                style={{ width: "auto" }}
                onClick={() => setSelectedLeadForAdminDetails(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT LEAD TRACK ================= */}
      {editingTrack && (
        <div className="alt-modal-overlay" onClick={() => setEditingTrack(null)}>
          <div
            className="alt-modal-card"
            style={{ maxWidth: "750px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="alt-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: "18px" }}>
                  ✏️ Edit Lead Track: {editingTrack.title || "Sales Target"}
                </h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Assigned to: <strong>{editingTrack.assignedToName || editingTrack.assignedTo?.name || "User"}</strong>
                </span>
              </div>
              <button
                className="alt-close-btn"
                onClick={() => setEditingTrack(null)}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSaveEditTrack}>
              <div className="alt-modal-body" style={{ maxHeight: "75vh", overflowY: "auto" }}>
                {/* TRACK BASIC INFO */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                  <div className="alt-form-group" style={{ gridColumn: "span 2" }}>
                    <label>Track Title</label>
                    <input
                      type="text"
                      className="alt-input"
                      value={editTrackForm.title}
                      placeholder="e.g. Q1 Sales Targets 2026"
                      onChange={(e) =>
                        setEditTrackForm({ ...editTrackForm, title: e.target.value })
                      }
                    />
                  </div>

                  <div className="alt-form-group">
                    <label>Start Month</label>
                    <input
                      type="month"
                      className="alt-input"
                      value={editTrackForm.startMonth}
                      onChange={(e) =>
                        setEditTrackForm({ ...editTrackForm, startMonth: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="alt-form-group">
                    <label>End Month</label>
                    <input
                      type="month"
                      className="alt-input"
                      value={editTrackForm.endMonth}
                      onChange={(e) =>
                        setEditTrackForm({ ...editTrackForm, endMonth: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                {/* ASSIGNED PRODUCTS LIST */}
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <h4 style={{ margin: 0, fontSize: "14px", color: "#0f172a" }}>
                      🎯 Assigned Products ({editTrackForm.products.length})
                    </h4>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      Admin can update target, toggle No Target, or remove products.
                    </span>
                  </div>

                  {editTrackForm.products.length === 0 ? (
                    <div style={{ padding: "16px", textAlign: "center", background: "#fef2f2", color: "#ef4444", borderRadius: "8px", fontSize: "13px" }}>
                      No products assigned! Please add at least one product below.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {editTrackForm.products.map((p, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 14px",
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            flexWrap: "wrap",
                            gap: "10px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "160px" }}>
                            <strong style={{ color: "#0f172a", fontSize: "14px" }}>{p.productName}</strong>
                            {p.onboardedCount > 0 && (
                              <span style={{ fontSize: "11px", padding: "2px 6px", background: "#dbeafe", color: "#1d4ed8", borderRadius: "4px" }}>
                                👥 {p.onboardedCount} leads
                              </span>
                            )}
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer", color: "#475569" }}>
                              <input
                                type="checkbox"
                                checked={!!p.noTarget}
                                onChange={() => handleEditProductNoTargetToggle(idx)}
                              />
                              <span>No Target</span>
                            </label>

                            {!p.noTarget ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "12px", color: "#64748b" }}>Target:</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={p.target}
                                  onChange={(e) => handleEditProductTargetChange(idx, e.target.value)}
                                  className="alt-target-input"
                                  style={{ width: "80px" }}
                                />
                              </div>
                            ) : (
                              <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 700, padding: "2px 8px", background: "#dcfce7", borderRadius: "6px" }}>
                                ♾️ Unlimited Leads
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => handleEditRemoveProduct(idx)}
                              title={`Remove ${p.productName} from track`}
                              style={{
                                background: "#fee2e2",
                                color: "#ef4444",
                                border: "1px solid #fecaca",
                                padding: "6px 8px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "12px",
                              }}
                            >
                              <FaTrash size={12} /> Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ADD NEW PRODUCT TO TRACK */}
                <div style={{ background: "#f1f5f9", padding: "14px", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
                  <h4 style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#334155" }}>
                    ➕ Add Product to this Track
                  </h4>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <select
                      className="alt-input"
                      style={{ flex: 1, minWidth: "200px" }}
                      value={newProductToAdd}
                      onChange={(e) => setNewProductToAdd(e.target.value)}
                    >
                      <option value="">-- Select Product to Add --</option>
                      {STANDARD_PRODUCTS.filter(
                        (sp) => !editTrackForm.products.some((ep) => ep.productName === sp)
                      ).map((sp) => (
                        <option key={sp} value={sp}>
                          {sp}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={!newProductToAdd}
                      onClick={handleEditAddProduct}
                      style={{
                        padding: "10px 16px",
                        background: newProductToAdd ? "#2563eb" : "#94a3b8",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: 600,
                        fontSize: "13px",
                        cursor: newProductToAdd ? "pointer" : "not-allowed",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <FaPlus /> Add Product
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ padding: "14px 24px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  style={{
                    padding: "9px 16px",
                    background: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#475569",
                  }}
                  onClick={() => setEditingTrack(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEditTrack || editTrackForm.products.length === 0}
                  className="alt-submit-btn"
                  style={{ width: "auto", padding: "9px 20px" }}
                >
                  <FaSave style={{ marginRight: "6px" }} />
                  {savingEditTrack ? "Saving Changes..." : "Save Track Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: PRODUCT-WISE CLOSURE LEADS & PAYMENTS (ADMIN) ================= */}
      {showAdminClosureSummaryModal && (
        <div className="alt-modal-overlay" onClick={() => setShowAdminClosureSummaryModal(false)}>
          <div className="alt-modal-card" style={{ maxWidth: "1050px" }} onClick={(e) => e.stopPropagation()}>
            <div
              className="alt-modal-header"
              style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#ffffff" }}
            >
              <div>
                <h3 style={{ color: "#ffffff", margin: 0, fontSize: "18px" }}>
                  🏆 Closed Deals &amp; Payment Breakdown (Product-Wise)
                </h3>
                <span style={{ fontSize: "12px", opacity: 0.85 }}>
                  Review all customer leads shifted to Closure stage across team members with contract values &amp; payment status
                </span>
              </div>
              <button
                className="alt-close-btn"
                style={{ color: "#ffffff" }}
                onClick={() => setShowAdminClosureSummaryModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            <div
              className="alt-modal-body"
              style={{ maxHeight: "78vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px" }}
            >
              {/* TOP SUMMARY CARDS */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px", borderRadius: "10px", textAlign: "center" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>Total Closures</span>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "#16a34a", marginTop: "4px" }}>
                    {reportData?.summary?.totalClosure || 0}
                  </div>
                </div>
                <div style={{ background: "#eef2ff", border: "1px solid #c7d2fe", padding: "12px", borderRadius: "10px", textAlign: "center" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#3730a3", textTransform: "uppercase" }}>Total Deal Value</span>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "#4f46e5", marginTop: "4px" }}>
                    ₹{(reportData?.summary?.totalPayment || 0).toLocaleString("en-IN")}
                  </div>
                </div>
                <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "12px", borderRadius: "10px", textAlign: "center" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#065f46", textTransform: "uppercase" }}>Advance Collected</span>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "#059669", marginTop: "4px" }}>
                    ₹{(reportData?.summary?.totalAdvancePayment || 0).toLocaleString("en-IN")}
                  </div>
                </div>
                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "12px", borderRadius: "10px", textAlign: "center" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#92400e", textTransform: "uppercase" }}>Remaining Due</span>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "#d97706", marginTop: "4px" }}>
                    ₹{(reportData?.summary?.totalRemainingPayment || 0).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              {/* PRODUCT-WISE GROUPED LIST */}
              {(() => {
                const closedByProduct = {};
                const tracksToUse =
                  selectedUserFilter && selectedUserFilter !== "all"
                    ? allTracks.filter(
                        (t) =>
                          String(t.assignedTo?._id || t.assignedTo) === String(selectedUserFilter) ||
                          (t.assignedToName && t.assignedToName.toLowerCase() === selectedUserFilter.toLowerCase())
                      )
                    : allTracks;

                tracksToUse.forEach((t) => {
                  const userName = t.assignedToName || t.assignedTo?.name || "Assigned User";
                  (t.products || []).forEach((p) => {
                    const closedLeads = (p.onboardedLeads || []).filter((l) => l.stage === "Closure");
                    if (closedLeads.length > 0) {
                      if (!closedByProduct[p.productName]) {
                        closedByProduct[p.productName] = {
                          productName: p.productName,
                          leads: [],
                        };
                      }
                      closedLeads.forEach((l) => {
                        closedByProduct[p.productName].leads.push({
                          ...l,
                          parentTrackId: t._id,
                          productId: p._id,
                          productName: p.productName,
                          userName: userName,
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
                        When team members move leads to the <strong>Closure</strong> stage, they will appear here grouped by product.
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
                      <div
                        style={{
                          background: "#f8fafc",
                          padding: "12px 18px",
                          borderBottom: "1px solid #e2e8f0",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "10px",
                        }}
                      >
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
                        <table className="alt-leads-table" style={{ margin: 0 }}>
                          <thead>
                            <tr>
                              <th style={{ width: "35px" }}>#</th>
                              <th>Customer &amp; Company</th>
                              <th>Assigned Employee</th>
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
                                  <td>
                                    <span style={{ background: "#e2e8f0", padding: "2px 8px", borderRadius: "10px", fontSize: "12px", fontWeight: 600, color: "#334155" }}>
                                      {lead.userName}
                                    </span>
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
                                      onClick={() => openAdminPaymentModal(lead, lead.parentTrackId, lead.productId, pName, lead.userName)}
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

            <div style={{ padding: "14px 20px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="alt-card-btn"
                style={{ width: "auto" }}
                onClick={() => setShowAdminClosureSummaryModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADMIN CUSTOMER PAYMENT DETAILS & RECORDING ================= */}
      {selectedPaymentLeadForAdmin && (
        <div className="alt-modal-overlay" onClick={() => setSelectedPaymentLeadForAdmin(null)}>
          <div className="alt-modal-card" style={{ maxWidth: "680px" }} onClick={(e) => e.stopPropagation()}>
            <div
              className="alt-modal-header"
              style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)", color: "#ffffff" }}
            >
              <div>
                <h3 style={{ color: "#ffffff", margin: 0, fontSize: "18px" }}>
                  💳 Customer Payment Details &amp; History
                </h3>
                <span style={{ fontSize: "12px", opacity: 0.9 }}>
                  {selectedPaymentLeadForAdmin.lead?.name || "Customer Lead"} • Product: <strong>{selectedPaymentLeadForAdmin.productName}</strong> • Employee: <strong>{selectedPaymentLeadForAdmin.userName}</strong>
                </span>
              </div>
              <button
                className="alt-close-btn"
                style={{ color: "#ffffff" }}
                onClick={() => setSelectedPaymentLeadForAdmin(null)}
              >
                <FaTimes />
              </button>
            </div>

            <div
              className="alt-modal-body"
              style={{ maxHeight: "75vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "18px" }}
            >
              {/* PAYMENT SUMMARY CHIPS */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Total Deal Value</span>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
                    ₹{(selectedPaymentLeadForAdmin.lead?.totalValue || 0).toLocaleString("en-IN")}
                  </div>
                </div>

                <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                  <span style={{ fontSize: "11px", color: "#065f46", fontWeight: 700, textTransform: "uppercase" }}>Advance / Paid</span>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#059669", marginTop: "2px" }}>
                    ₹{(selectedPaymentLeadForAdmin.lead?.advancePayment || 0).toLocaleString("en-IN")}
                  </div>
                </div>

                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                  <span style={{ fontSize: "11px", color: "#92400e", fontWeight: 700, textTransform: "uppercase" }}>Remaining Due</span>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#d97706", marginTop: "2px" }}>
                    ₹
                    {(
                      selectedPaymentLeadForAdmin.lead?.remainingPayment !== undefined
                        ? selectedPaymentLeadForAdmin.lead?.remainingPayment
                        : Math.max(0, (selectedPaymentLeadForAdmin.lead?.totalValue || 0) - (selectedPaymentLeadForAdmin.lead?.advancePayment || 0))
                    ).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              {/* RECORD NEW INSTALLMENT / UPDATE PAYMENT FORM */}
              <form onSubmit={handleSaveAdminPayment} style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#0f172a" }}>
                  ➕ Record Payment Installment
                </h4>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>
                      Amount Received (₹) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="alt-input"
                      placeholder="e.g. 10000"
                      value={adminPaymentInstallmentForm.amount}
                      onChange={(e) => setAdminPaymentInstallmentForm({ ...adminPaymentInstallmentForm, amount: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>Payment Mode</label>
                    <select
                      className="alt-input"
                      value={adminPaymentInstallmentForm.mode}
                      onChange={(e) => setAdminPaymentInstallmentForm({ ...adminPaymentInstallmentForm, mode: e.target.value })}
                    >
                      <option value="UPI / GPay / PhonePe">UPI / GPay / PhonePe</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer (NEFT / IMPS)">Bank Transfer (NEFT / IMPS)</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Online Gateway">Online Gateway</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "#475569" }}>Reference / Transaction ID</label>
                    <input
                      type="text"
                      className="alt-input"
                      placeholder="e.g. UPI-123456 / Chq #8877"
                      value={adminPaymentInstallmentForm.reference}
                      onChange={(e) => setAdminPaymentInstallmentForm({ ...adminPaymentInstallmentForm, reference: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", color: "#475569" }}>Update Total Deal Value (₹) (Optional)</label>
                    <input
                      type="number"
                      className="alt-input"
                      placeholder={`Current: ${selectedPaymentLeadForAdmin.lead?.totalValue || 0}`}
                      value={adminPaymentInstallmentForm.totalValue}
                      onChange={(e) => setAdminPaymentInstallmentForm({ ...adminPaymentInstallmentForm, totalValue: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <label style={{ fontSize: "12px", color: "#475569" }}>Payment Notes / Installment Remarks</label>
                  <input
                    type="text"
                    className="alt-input"
                    placeholder="e.g. 2nd installment received via UPI"
                    value={adminPaymentInstallmentForm.notes}
                    onChange={(e) => setAdminPaymentInstallmentForm({ ...adminPaymentInstallmentForm, notes: e.target.value })}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="submit"
                    disabled={savingAdminPayment || (!adminPaymentInstallmentForm.amount && !adminPaymentInstallmentForm.totalValue)}
                    className="alt-submit-btn"
                    style={{ width: "auto", padding: "8px 20px" }}
                  >
                    {savingAdminPayment ? "Saving..." : "✓ Save Payment"}
                  </button>
                </div>
              </form>

              {/* PAYMENT TRANSACTIONS HISTORY */}
              <div>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#0f172a" }}>
                  📜 Payment Transactions History ({selectedPaymentLeadForAdmin.lead?.payments?.length || 0})
                </h4>

                {(!selectedPaymentLeadForAdmin.lead?.payments || selectedPaymentLeadForAdmin.lead.payments.length === 0) ? (
                  <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px dashed #cbd5e1", fontSize: "13px", color: "#64748b", textAlign: "center" }}>
                    No recorded transaction records yet. (Initial advance: ₹{(selectedPaymentLeadForAdmin.lead?.advancePayment || 0).toLocaleString("en-IN")})
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="alt-leads-table" style={{ margin: 0, fontSize: "12px" }}>
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
                        {[...selectedPaymentLeadForAdmin.lead.payments].reverse().map((pay, pIdx) => (
                          <tr key={pIdx}>
                            <td>{pay.recordedAt ? new Date(pay.recordedAt).toLocaleString() : "-"}</td>
                            <td>
                              <strong style={{ color: "#16a34a" }}>
                                ₹{(pay.amount || 0).toLocaleString("en-IN")}
                              </strong>
                            </td>
                            <td>
                              <span style={{ background: "#e2e8f0", padding: "2px 6px", borderRadius: "4px" }}>
                                {pay.mode || "Cash"}
                              </span>
                            </td>
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

            <div style={{ padding: "14px 20px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="alt-card-btn"
                style={{ width: "auto" }}
                onClick={() => setSelectedPaymentLeadForAdmin(null)}
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

export default AdminLeadTrack;

