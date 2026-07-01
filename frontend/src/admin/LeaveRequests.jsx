// 📁 src/admin/LeaveRequests.jsx
import React from "react";
import { FaSyncAlt } from "react-icons/fa";

const LeaveRequests = ({
  pendingLeaves,
  leaveActionLoading,
  fetchPendingLeaves,
  approveLeaveRequest,
  rejectLeaveRequest,
  setSidebarOpen,
}) => {
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
              Approve or reject employee leave applications
            </p>
          </div>
        </div>
        <button
          type="button"
          className="add-employee-btn"
          onClick={fetchPendingLeaves}
        >
          <FaSyncAlt /> Refresh
        </button>
      </div>

      {/* Empty state */}
      {pendingLeaves.length === 0 ? (
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

      )}
    </div>
  );
};

export default LeaveRequests;