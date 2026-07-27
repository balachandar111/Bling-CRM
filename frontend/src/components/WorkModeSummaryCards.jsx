// 📁 src/components/WorkModeSummaryCards.jsx
// Super Admin dashboard widget: shows how many employees checked in
// today as Work From Office / Work From Home / Site Visit. Clicking
// a card opens a popup listing the employee names for that mode.

import React, { useState, useEffect, useCallback } from "react";
import { FaBuilding, FaHome, FaMapMarkerAlt } from "react-icons/fa";
import API from "../services/api";
import "./WorkModeSummaryCards.css";

// Formats a Date/ISO-string into "hh:mm AM/PM". Falls back to "—" when
// the employee hasn't checked in/out yet.
const formatTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const MODES = [
  { key: "office", label: "Work From Office", icon: FaBuilding, colorClass: "wm-blue" },
  { key: "home", label: "Work From Home", icon: FaHome, colorClass: "wm-green" },
  { key: "siteVisit", label: "Client Visit", icon: FaMapMarkerAlt, colorClass: "wm-orange" },
];

const WorkModeSummaryCards = () => {
  const [summary, setSummary] = useState({
    officeCount: 0,
    homeCount: 0,
    siteVisitCount: 0,
    office: [],
    home: [],
    siteVisit: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeMode, setActiveMode] = useState(null); // "office" | "home" | "siteVisit" | null

  const fetchSummary = useCallback(async () => {
    try {
      const { data } = await API.get("/attendance/today-workmode-summary");
      if (data.summary) setSummary(data.summary);
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const countFor = (key) =>
    key === "office" ? summary.officeCount
    : key === "home" ? summary.homeCount
    : summary.siteVisitCount;

  const listFor = (key) =>
    key === "office" ? summary.office
    : key === "home" ? summary.home
    : summary.siteVisit;

  const activeConfig = MODES.find((m) => m.key === activeMode);

  return (
    <>
      <div className="wm-cards-grid">
        {MODES.map(({ key, label, icon: Icon, colorClass }) => (
          <div
            key={key}
            className="wm-stat-card"
            onClick={() => setActiveMode(key)}
          >
            <div>
              <h4>{label} (Today)</h4>
              <h2>{loading ? "…" : countFor(key)}</h2>
            </div>
            <Icon className={`wm-icon ${colorClass}`} />
          </div>
        ))}
      </div>

      {activeMode && (
        <div className="wm-popup-overlay" onClick={() => setActiveMode(null)}>
          <div className="wm-popup" onClick={(e) => e.stopPropagation()}>
            <div className="wm-popup-header">
              <h3>
                {activeConfig?.label} — {countFor(activeMode)} today
              </h3>
              <span className="wm-popup-close" onClick={() => setActiveMode(null)}>✕</span>
            </div>
            <div className="wm-popup-body">
              {listFor(activeMode).length === 0 ? (
                <p className="wm-empty">No employees checked in as {activeConfig?.label.toLowerCase()} today.</p>
              ) : (
                <ul className="wm-name-list">
                  {listFor(activeMode).map((emp) => (
                    <li key={emp._id} className="wm-name-item">
                      <img
                        src={
                          emp.profileImage && emp.profileImage.trim() !== ""
                            ? emp.profileImage
                            : "https://ui-avatars.com/api/?name=" +
                              encodeURIComponent(emp.name || "User") +
                              "&background=2563eb&color=fff&size=64"
                        }
                        alt={emp.name}
                        className="wm-name-avatar"
                      />
                      <div className="wm-name-details">
                        <div className="wm-name-primary">{emp.name}</div>
                        <div className="wm-name-secondary">
                          {[emp.designation, emp.department].filter(Boolean).join(" · ")}
                        </div>

                        <div className="wm-time-row">
                          <span className="wm-time-pill wm-time-in">
                            In: {formatTime(emp.checkIn)}
                          </span>
                          <span className="wm-time-pill wm-time-out">
                            Out: {formatTime(emp.checkOut)}
                          </span>
                        </div>

                        {activeMode === "office" && (
                          <div className="wm-location-row">
                            {emp.location && emp.location.latitude != null ? (
                              <a
                                href={`https://www.google.com/maps?q=${emp.location.latitude},${emp.location.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="wm-location-link"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <FaMapMarkerAlt className="wm-location-icon" />
                                View location
                              </a>
                            ) : (
                              <span className="wm-location-missing">
                                <FaMapMarkerAlt className="wm-location-icon wm-location-icon-muted" />
                                Location not captured
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WorkModeSummaryCards;