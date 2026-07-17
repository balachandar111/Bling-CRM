// 📁 src/admin/LeaveRequests.jsx
import React, { useState } from "react";
import { FaSyncAlt } from "react-icons/fa";

const LeaveRequests = ({
  pendingLeaves,
  leaveActionLoading,
  fetchPendingLeaves,
  approveLeaveRequest,
  rejectLeaveRequest,
  setSidebarOpen,

  // Resignation approval requests (shown as a second tab in this same section)
  pendingResignations = [],
  resignationActionLoading = false,
  fetchPendingResignations = () => {},
  approveResignationRequest = () => {},
  rejectResignationRequest = () => {},
}) => {
  const [activeTab, setActiveTab] = useState("leave"); // "leave" | "resignation"

  const refreshCurrentTab = () => {
    if (activeTab === "leave") fetchPendingLeaves();
    else fetchPendingResignations();
  };

  return (
    <div className="leave-requests-section">

      {/* Header */}
      <div className="leave-requests-header">
        <div className="header-left">
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            ☰
          </button>
          <div className="leave-header-text">
            <h2>📅 Leave Requests</h2>
            <p style={{ marginTop: 4, fontSize: 12, color: "#6b7280" }}>
              Approve or reject employee leave and resignation requests
            </p>
          </div>
        </div>
        <button
          type="button"
          className="add-employee-btn"
          onClick={refreshCurrentTab}
        >
          <FaSyncAlt /> Refresh
        </button>
      </div>

      {/* Tab switcher */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 20,
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("leave")}
          style={{
            padding: "10px 18px",
            border: "none",
            background: "none",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
            color: activeTab === "leave" ? "#4f46e5" : "#6b7280",
            borderBottom:
              activeTab === "leave"
                ? "3px solid #4f46e5"
                : "3px solid transparent",
          }}
        >
          📅 Leave Requests
          {pendingLeaves.length > 0 && (
            <span
              style={{
                marginLeft: 8,
                background: "#ff4d4f",
                color: "#fff",
                borderRadius: 10,
                padding: "1px 8px",
                fontSize: 12,
              }}
            >
              {pendingLeaves.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("resignation")}
          style={{
            padding: "10px 18px",
            border: "none",
            background: "none",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
            color: activeTab === "resignation" ? "#4f46e5" : "#6b7280",
            borderBottom:
              activeTab === "resignation"
                ? "3px solid #4f46e5"
                : "3px solid transparent",
          }}
        >
          🚪 Resignation Requests
          {pendingResignations.length > 0 && (
            <span
              style={{
                marginLeft: 8,
                background: "#ff4d4f",
                color: "#fff",
                borderRadius: 10,
                padding: "1px 8px",
                fontSize: 12,
              }}
            >
              {pendingResignations.length}
            </span>
          )}
        </button>
      </div>

      {/* ================= LEAVE TAB ================= */}
      {activeTab === "leave" && (

        pendingLeaves.length === 0 ? (
          <div className="leave-empty-state">
            <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
            <p>No pending leave requests right now.</p>
            <small>All employee leave requests will appear here.</small>
          </div>
        ) : (

          <div className="adm-records-table-wrapper">
            <table className="adm-records-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Date</th>
                  <th>Reason</th>
                  <th>Requested On</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingLeaves.map((req) => (
                  <tr key={req._id}>

                    {/* Employee info */}
                    <td>
                      <div className="leave-emp-info">
                        <span className="leave-emp-name">
                          {req.employee?.name || "—"}
                        </span>
                        <span className="leave-emp-dept">
                          {req.employee?.department}
                          {req.employee?.designation
                            ? ` · ${req.employee.designation}`
                            : ""}
                        </span>
                      </div>
                    </td>

                    {/* Leave date */}
                    <td>
                      <span style={{ fontWeight: 600 }}>{req.date}</span>
                    </td>

                    {/* Reason */}
                    <td style={{ maxWidth: 220 }}>
                      <span style={{ color: "#374151" }}>
                        {req.leaveReason || "—"}
                      </span>
                    </td>

                    {/* Requested on */}
                    <td style={{ color: "#6b7280", fontSize: 11 }}>
                      {new Date(req.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                      <br />
                      <span style={{ fontSize: 10 }}>
                        {new Date(req.createdAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>

                    {/* Status badge */}
                    <td>
                      <span className="leave-pending-badge">⏳ Pending</span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          className="leave-approve-btn"
                          disabled={leaveActionLoading}
                          onClick={() => approveLeaveRequest(req._id)}
                        >
                          ✓ Approve
                        </button>
                        <button
                          type="button"
                          className="leave-reject-btn"
                          disabled={leaveActionLoading}
                          onClick={() => rejectLeaveRequest(req._id)}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ================= RESIGNATION TAB ================= */}
      {activeTab === "resignation" && (

        pendingResignations.length === 0 ? (
          <div className="leave-empty-state">
            <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
            <p>No pending resignation requests right now.</p>
            <small>Employee resignation requests will appear here.</small>
          </div>
        ) : (

          <div className="adm-records-table-wrapper">
            <table className="adm-records-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Requested Name</th>
                  <th>Last Working Date</th>
                  <th>Reason</th>
                  <th>Requested On</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingResignations.map((emp) => (
                  <tr key={emp._id}>

                    {/* Employee info */}
                    <td>
                      <div className="leave-emp-info">
                        <span className="leave-emp-name">
                          {emp.name || "—"}
                        </span>
                        <span className="leave-emp-dept">
                          {emp.department}
                          {emp.designation ? ` · ${emp.designation}` : ""}
                        </span>
                      </div>
                    </td>

                    {/* Name given on the resignation form */}
                    <td>
                      <span style={{ fontWeight: 600 }}>
                        {emp.resignation?.name || "—"}
                      </span>
                    </td>

                    {/* Last working date */}
                    <td>
                      <span style={{ fontWeight: 600 }}>
                        {emp.resignation?.date || "—"}
                      </span>
                    </td>

                    {/* Reason */}
                    <td style={{ maxWidth: 220 }}>
                      <span style={{ color: "#374151" }}>
                        {emp.resignation?.reason || "—"}
                      </span>
                    </td>

                    {/* Requested on */}
                    <td style={{ color: "#6b7280", fontSize: 11 }}>
                      {emp.resignation?.requestedAt
                        ? new Date(
                            emp.resignation.requestedAt
                          ).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                      <br />
                      {emp.resignation?.requestedAt && (
                        <span style={{ fontSize: 10 }}>
                          {new Date(
                            emp.resignation.requestedAt
                          ).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </td>

                    {/* Status badge */}
                    <td>
                      <span className="leave-pending-badge">⏳ Pending</span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          className="leave-approve-btn"
                          disabled={resignationActionLoading}
                          onClick={() => approveResignationRequest(emp._id)}
                        >
                          ✓ Approve
                        </button>
                        <button
                          type="button"
                          className="leave-reject-btn"
                          disabled={resignationActionLoading}
                          onClick={() => rejectResignationRequest(emp._id)}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

    </div>
  );
};

export default LeaveRequests;