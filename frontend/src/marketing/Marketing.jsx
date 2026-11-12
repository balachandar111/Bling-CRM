// 📁 frontend/src/marketing/Marketing.jsx
//
// Marketing section (admin + users). One component, two channels:
//   <Marketing channel="email" />     -> Email Marketing
//   <Marketing channel="whatsapp" />  -> WhatsApp Marketing
//
// Flow:  1) pick customers (with filters)  ->  Next
//        2) compose (email: subject/body/signature | whatsapp: template name)
//        3) bulk send  ->  result summary
//
// Customers come from GET /customers (admin sees all, a user sees own).

import React, { useState, useEffect, useMemo, useCallback } from "react";
import API from "../services/api";
import {
  FaEnvelope,
  FaWhatsapp,
  FaPaperPlane,
  FaArrowLeft,
  FaArrowRight,
  FaSyncAlt,
} from "react-icons/fa";
import EmailCompose, { DEFAULT_MAIL } from "./EmailCompose";
import "./Marketing.css";

const PAGE_SIZE = 25;

/* Same rule as the backend: 10 digits (+ country code) .. 15 digits */
const hasValidPhone = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "").replace(/^0+/, "");
  return digits.length >= 10 && digits.length <= 15;
};
const hasValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());

/* distinct values (case-insensitive) for dropdown filters */
const distinct = (list, getter) => {
  const map = new Map();
  list.forEach((item) => {
    const raw = String(getter(item) || "").trim();
    if (raw && !map.has(raw.toLowerCase())) map.set(raw.toLowerCase(), raw);
  });
  return [...map.values()].sort((a, b) => a.localeCompare(b));
};

const EMPTY_FILTERS = {
  search: "",
  sector: "",
  service: "",
  leadStage: "",
  status: "",
  priority: "",
  source: "",
  aidaStage: "",
  assignedTo: "",
  location: "",
  product: "",
};

const Marketing = ({ channel = "email", role, setSidebarOpen }) => {
  const isEmail = channel === "email";
  const title = isEmail ? "Email Marketing" : "WhatsApp Marketing";

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [step, setStep] = useState(1); // 1 = select, 2 = compose
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(() => new Set());

  // email form (theme + content, see EmailCompose.jsx)
  const [mail, setMail] = useState(DEFAULT_MAIL);

  // whatsapp form
  const [templateName, setTemplateName] = useState("");
  const [category, setCategory] = useState("MARKETING");
  const [templateVars, setTemplateVars] = useState([]);

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  /* ── load customers ── */
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");
      const { data } = await API.get("/customers");
      setCustomers(data.customers || []);
    } catch (error) {
      console.error("Marketing fetch error:", error);
      setLoadError(
        error?.response?.data?.message || "Failed to load customers."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  /* ── filter options built from the data ── */
  const options = useMemo(
    () => ({
      sector: distinct(customers, (c) => c.sector),
      service: distinct(customers, (c) => c.service),
      source: distinct(customers, (c) => c.source),
      assignedTo: distinct(customers, (c) => c.assignedTo),
      location: distinct(customers, (c) => c.location),
      product: distinct(customers, (c) => c.product),
    }),
    [customers]
  );

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const eq = (a, b) =>
    String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return customers.filter((c) => {
      if (
        q &&
        ![c.name, c.company, c.phone, c.email, c.sector]
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
        return false;
      if (filters.sector && !eq(c.sector, filters.sector)) return false;
      if (filters.service && !eq(c.service, filters.service)) return false;
      if (filters.leadStage && c.leadStage !== filters.leadStage) return false;
      if (filters.status && c.status !== filters.status) return false;
      if (filters.priority && c.priority !== filters.priority) return false;
      if (filters.source && !eq(c.source, filters.source)) return false;
      if (filters.aidaStage && c.aidaStage !== filters.aidaStage) return false;
      if (filters.assignedTo && !eq(c.assignedTo, filters.assignedTo))
        return false;
      if (filters.location && !eq(c.location, filters.location)) return false;
      if (filters.product && !eq(c.product, filters.product)) return false;
      return true;
    });
  }, [customers, filters]);

  const canReach = (c) => (isEmail ? hasValidEmail(c.email) : hasValidPhone(c.phone));

  const reachableFiltered = useMemo(
    () => filtered.filter(canReach),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtered, isEmail]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ── selection ── */
  const toggleOne = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allFilteredSelected =
    reachableFiltered.length > 0 &&
    reachableFiltered.every((c) => selected.has(c._id));

  const toggleAllFiltered = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        reachableFiltered.forEach((c) => next.delete(c._id));
      } else {
        reachableFiltered.forEach((c) => next.add(c._id));
      }
      return next;
    });

  const selectedCustomers = useMemo(
    () => customers.filter((c) => selected.has(c._id)),
    [customers, selected]
  );

  /* ── send ── */
  const toggleVar = (v) =>
    setTemplateVars((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );

  const canSend = isEmail
    ? mail.subject.trim() && mail.body.trim()
    : templateName.trim();

  const handleSend = async () => {
    if (!canSend || sending) return;

    const label = isEmail ? "email(s)" : "WhatsApp message(s)";
    if (
      !window.confirm(
        `Send ${selectedCustomers.length} ${label} now? This cannot be undone.`
      )
    )
      return;

    try {
      setSending(true);
      setResult(null);

      const payload = isEmail
        ? {
            customerIds: [...selected],
            ...mail,
          }
        : {
            customerIds: [...selected],
            templateName: templateName.trim(),
            templateVars,
            category,
          };

      const { data } = await API.post(
        isEmail ? "/marketing/email" : "/marketing/whatsapp",
        payload
      );
      setResult(data);
    } catch (error) {
      console.error("Marketing send error:", error);
      alert(
        error?.response?.data?.message ||
          "Failed to send. Check the backend terminal for details."
      );
    } finally {
      setSending(false);
    }
  };

  const startOver = () => {
    setResult(null);
    setSelected(new Set());
    setStep(1);
    setMail(DEFAULT_MAIL);
    setTemplateName("");
    setTemplateVars([]);
  };

  /* ── small renderers ── */
  const filterSelect = (label, k, values) => (
    <div className="mk-filter" key={k}>
      <label>{label}</label>
      <select value={filters[k]} onChange={(e) => setFilter(k, e.target.value)}>
        <option value="">All</option>
        {values.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
    </div>
  );

  const header = (
    <div className="mk-header">
      <div className="mk-header-left">
        {setSidebarOpen && (
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            ☰
          </button>
        )}
        <div>
          <h1>
            {isEmail ? (
              <FaEnvelope style={{ marginRight: 8, color: "#2563eb" }} />
            ) : (
              <FaWhatsapp style={{ marginRight: 8, color: "#16a34a" }} />
            )}
            {title}
          </h1>
          <p>
            {isEmail
              ? "Select customers, write your email, and send it in bulk."
              : "Select customers, enter your Botify template name, and send in bulk."}
          </p>
        </div>
      </div>

      <div className="mk-steps">
        <span className={step === 1 ? "mk-step active" : "mk-step done"}>
          1. Select customers
        </span>
        <span className={step === 2 ? "mk-step active" : "mk-step"}>
          2. {isEmail ? "Compose & send" : "Template & send"}
        </span>
      </div>
    </div>
  );

  /* ================= RESULT ================= */
  if (result) {
    const problems = (result.results || []).filter((r) => r.status !== "sent");
    return (
      <div className="mk-section">
        {header}
        <div className="mk-card">
          <h2 className="mk-result-title">Bulk send finished</h2>
          <div className="mk-result-grid">
            <div className="mk-stat">
              <b>{result.total}</b>
              <span>Selected</span>
            </div>
            <div className="mk-stat mk-ok">
              <b>{result.sent}</b>
              <span>Sent</span>
            </div>
            <div className="mk-stat mk-bad">
              <b>{result.failed}</b>
              <span>Failed</span>
            </div>
            <div className="mk-stat mk-warn">
              <b>{result.skipped}</b>
              <span>Skipped</span>
            </div>
          </div>

          {problems.length > 0 && (
            <div className="mk-table-wrap" style={{ marginTop: 16 }}>
              <table className="mk-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>{isEmail ? "Email" : "Phone"}</th>
                    <th>Status</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {problems.map((r, i) => (
                    <tr key={`${r.id}-${i}`}>
                      <td>{r.name || "-"}</td>
                      <td>{(isEmail ? r.email : r.phone) || "-"}</td>
                      <td>
                        <span className={`mk-pill mk-pill-${r.status}`}>
                          {r.status}
                        </span>
                      </td>
                      <td>{r.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mk-actions">
            <button className="mk-btn mk-btn-primary" onClick={startOver}>
              Start new campaign
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ================= STEP 2 : COMPOSE ================= */
  if (step === 2) {
    if (isEmail) {
      return (
        <div className="mk-section">
          {header}
          <EmailCompose
            mail={mail}
            setMail={setMail}
            recipientCount={selectedCustomers.length}
            previewCustomerId={selectedCustomers[0] && selectedCustomers[0]._id}
            sending={sending}
            onBack={() => setStep(1)}
            onSend={handleSend}
          />
        </div>
      );
    }

    return (
      <div className="mk-section">
        {header}

        <div className="mk-card">
          <p className="mk-summary">
            Sending to <b>{selectedCustomers.length}</b> customer(s)
          </p>

          {(

            <>
              <div className="mk-field">
                <label>Template name *</label>
                <input
                  type="text"
                  placeholder="Exact template name from Botify, e.g. diwali_offer"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>

              <div className="mk-field">
                <label>Template category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="MARKETING">MARKETING</option>
                  <option value="UTILITY">UTILITY</option>
                </select>
              </div>

              <div className="mk-field">
                <label>Template variables (only if your template has {"{{1}}"}, {"{{2}}"}…)</label>
                <div className="mk-var-row">
                  {["name", "company"].map((v) => (
                    <label key={v} className="mk-check">
                      <input
                        type="checkbox"
                        checked={templateVars.includes(v)}
                        onChange={() => toggleVar(v)}
                      />
                      Customer {v}
                    </label>
                  ))}
                </div>
                <p className="mk-hint">
                  Values are sent in the order you tick them. Leave both
                  unticked if the template has no variables. The number must
                  match the template exactly or Botify rejects the message.
                </p>
              </div>
            </>
          )}

          <div className="mk-actions">
            <button
              className="mk-btn mk-btn-ghost"
              onClick={() => setStep(1)}
              disabled={sending}
            >
              <FaArrowLeft /> Back
            </button>

            <button
              className="mk-btn mk-btn-send"
              onClick={handleSend}
              disabled={!canSend || sending}
            >
              <FaPaperPlane />{" "}
              {sending
                ? "Sending… please wait"
                : isEmail
                ? "Send Bulk Email"
                : "Send Bulk Message"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ================= STEP 1 : SELECT ================= */
  return (
    <div className="mk-section">
      {header}

      <div className="mk-card">
        <div className="mk-filters">
          <div className="mk-filter mk-filter-wide">
            <label>Search</label>
            <input
              type="text"
              placeholder="Name, company, phone, email, sector…"
              value={filters.search}
              onChange={(e) => setFilter("search", e.target.value)}
            />
          </div>

          {filterSelect("Sector", "sector", options.sector)}
          {filterSelect("Service", "service", options.service)}

          <div className="mk-filter">
            <label>Stage</label>
            <select
              value={filters.leadStage}
              onChange={(e) => setFilter("leadStage", e.target.value)}
            >
              <option value="">All</option>
              {["Awareness", "Interest", "Desire", "Closure"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>

          <div className="mk-filter">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilter("status", e.target.value)}
            >
              <option value="">All</option>
              <option value="lead">Lead</option>
              <option value="customer">Customer</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          <div className="mk-filter">
            <label>Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilter("priority", e.target.value)}
            >
              <option value="">All</option>
              {["High", "Medium", "Low"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>

          {filterSelect("Lead Source", "source", options.source)}

          <div className="mk-filter">
            <label>AIDA Stage</label>
            <select
              value={filters.aidaStage}
              onChange={(e) => setFilter("aidaStage", e.target.value)}
            >
              <option value="">All</option>
              {["High", "Medium", "Low"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>

          {filterSelect("Assigned To", "assignedTo", options.assignedTo)}
          {filterSelect("Location", "location", options.location)}
          {filterSelect("Product", "product", options.product)}

          <button
            className="mk-btn mk-btn-ghost mk-clear"
            onClick={() => {
              setFilters(EMPTY_FILTERS);
              setPage(1);
            }}
          >
            Clear Filters
          </button>

          <button
            className="mk-btn mk-btn-ghost mk-clear"
            onClick={fetchCustomers}
            title="Reload customers"
          >
            <FaSyncAlt />
          </button>
        </div>

        <div className="mk-toolbar">
          <label className="mk-check">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={toggleAllFiltered}
              disabled={reachableFiltered.length === 0}
            />
            Select all filtered ({reachableFiltered.length})
          </label>

          <span className="mk-count">
            Showing {filtered.length} of {customers.length} ·{" "}
            <b>{selected.size} selected</b>
          </span>

          {selected.size > 0 && (
            <button
              className="mk-link"
              onClick={() => setSelected(new Set())}
            >
              Clear selection
            </button>
          )}
        </div>

        <div className="mk-table-wrap">
          <table className="mk-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>Name</th>
                <th>Company</th>
                <th>Sector</th>
                <th>{isEmail ? "Email" : "Phone"}</th>
                <th>Stage</th>
                <th>Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr className="mk-empty">
                  <td colSpan={7}>Loading customers…</td>
                </tr>
              )}

              {!loading && loadError && (
                <tr className="mk-empty">
                  <td colSpan={7}>{loadError}</td>
                </tr>
              )}

              {!loading && !loadError && pageRows.length === 0 && (
                <tr className="mk-empty">
                  <td colSpan={7}>No customers match these filters.</td>
                </tr>
              )}

              {!loading &&
                pageRows.map((c) => {
                  const ok = canReach(c);
                  return (
                    <tr
                      key={c._id}
                      className={!ok ? "mk-row-disabled" : ""}
                      onClick={() => ok && toggleOne(c._id)}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.has(c._id)}
                          disabled={!ok}
                          onChange={() => toggleOne(c._id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td>{c.name || "-"}</td>
                      <td>{c.company || "-"}</td>
                      <td>{c.sector || "-"}</td>
                      <td>
                        {ok ? (
                          isEmail ? c.email : c.phone
                        ) : (
                          <span className="mk-missing">
                            {isEmail ? "No valid email" : "No valid phone"}
                          </span>
                        )}
                      </td>
                      <td>{c.leadStage || "-"}</td>
                      <td>{c.assignedTo || "-"}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mk-pager">
            <button
              className="mk-btn mk-btn-ghost"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              className="mk-btn mk-btn-ghost"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        )}

        <div className="mk-actions">
          <button
            className="mk-btn mk-btn-primary"
            disabled={selected.size === 0}
            onClick={() => setStep(2)}
          >
            Next ({selected.size}) <FaArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Marketing;