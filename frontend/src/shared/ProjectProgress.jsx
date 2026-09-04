// 📁 frontend/src/shared/ProjectProgress.jsx
//
// "Project Progress" section — same component is used from the admin
// panel AND the user panel (both roles can add projects, edit POC /
// Responsible Person / priority, and post progress updates).
//
// Table:  S.No | Project | Current Status | Priority | Details (view icon)
// Sorted by priority: High -> Medium -> Low.
//
// "Details" opens the project's full info: name, POC, Responsible
// Person(s), current status (last two updates), an "Update Progress"
// box, and a "Manage History" button that lists every update ever made.

import React, { useState, useEffect, useCallback, useMemo } from "react";
import API from "../services/api";
import {
  FaPlus,
  FaEye,
  FaTimes,
  FaHistory,
  FaEdit,
  FaSave,
  FaTrash,
  FaProjectDiagram,
} from "react-icons/fa";
import "./ProjectProgress.css";

const PRIORITIES = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const PEOPLE_TABS = [
  { key: "all", label: "All Users" },
  { key: "it", label: "IT Department" },
  { key: "superAdmin", label: "Super Admin" },
  { key: "adminUsers", label: "Admin Users" },
];

const EMPTY_GROUPS = { all: [], it: [], superAdmin: [], adminUsers: [] };

const formatDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

const PriorityBadge = ({ priority }) => (
  <span className={`pp-priority pp-priority-${priority || "medium"}`}>
    {priority || "medium"}
  </span>
);

/* ── reusable multi-select "people picker" (POC / Responsible Person) ── */
const PeoplePicker = ({ groups, selectedIds, onToggle }) => {
  const [tab, setTab] = useState("all");
  const list = groups[tab] || [];

  return (
    <div className="pp-picker">
      <div className="pp-picker-tabs">
        {PEOPLE_TABS.map((t) => (
          <button
            type="button"
            key={t.key}
            className={`pp-picker-tab${tab === t.key ? " active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label} ({(groups[t.key] || []).length})
          </button>
        ))}
      </div>

      <div className="pp-picker-list">
        {list.length === 0 && (
          <div className="pp-picker-empty">No users in this group.</div>
        )}
        {list.map((u) => (
          <label className="pp-picker-option" key={u._id}>
            <input
              type="checkbox"
              checked={selectedIds.includes(u._id)}
              onChange={() => onToggle(u)}
            />
            {u.name}{" "}
            {(u.designation || u.department) && (
              <span style={{ color: "#9ca3af" }}>
                ({[u.designation, u.department].filter(Boolean).join(" · ")})
              </span>
            )}
          </label>
        ))}
      </div>
    </div>
  );
};

/* Selected-people chips shown under the picker (with quick remove). */
const PeopleChips = ({ people, onRemove }) => {
  if (!people.length) {
    return <p className="pp-people-empty">No one selected yet.</p>;
  }
  return (
    <div className="pp-chip-row">
      {people.map((p) => (
        <span className="pp-chip" key={p._id}>
          {p.name}
          {onRemove && (
            <button type="button" onClick={() => onRemove(p)}>
              <FaTimes />
            </button>
          )}
        </span>
      ))}
    </div>
  );
};

const ProjectProgress = ({ role, setSidebarOpen }) => {
  const isAdmin = role === "super_admin";

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState(EMPTY_GROUPS);

  /* ── add project modal ── */
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    projectName: "",
    priority: "medium",
    initialStatus: "",
  });
  const [addPoc, setAddPoc] = useState([]); // full user objects
  const [addResponsible, setAddResponsible] = useState([]);
  const [saving, setSaving] = useState(false);

  /* ── details / view modal ── */
  const [showViewModal, setShowViewModal] = useState(false);
  const [activeProject, setActiveProject] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [editingDetails, setEditingDetails] = useState(false);
  const [editForm, setEditForm] = useState({ projectName: "", priority: "medium" });
  const [editPoc, setEditPoc] = useState([]);
  const [editResponsible, setEditResponsible] = useState([]);
  const [savingEdit, setSavingEdit] = useState(false);

  const [progressText, setProgressText] = useState("");
  const [postingProgress, setPostingProgress] = useState(false);

  /* ── manage history modal ── */
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  /* ── data fetchers ── */
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/project-progress");
      setProjects(data.projects || []);
    } catch (error) {
      console.error("fetchProjects error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEligibleUsers = useCallback(async () => {
    try {
      const { data } = await API.get("/project-progress/users/eligible");
      setGroups(data.groups || EMPTY_GROUPS);
    } catch (error) {
      console.error("fetchEligibleUsers error:", error);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchEligibleUsers();
  }, [fetchProjects, fetchEligibleUsers]);

  const sortedProjects = useMemo(() => projects, [projects]);

  /* ── add project ── */
  const openAddModal = () => {
    setAddForm({ projectName: "", priority: "medium", initialStatus: "" });
    setAddPoc([]);
    setAddResponsible([]);
    setShowAddModal(true);
  };

  const toggleAddPoc = (user) => {
    setAddPoc((prev) =>
      prev.some((p) => p._id === user._id)
        ? prev.filter((p) => p._id !== user._id)
        : [...prev, user]
    );
  };

  const toggleAddResponsible = (user) => {
    setAddResponsible((prev) =>
      prev.some((p) => p._id === user._id)
        ? prev.filter((p) => p._id !== user._id)
        : [...prev, user]
    );
  };

  const submitAddProject = async (e) => {
    e.preventDefault();
    if (!addForm.projectName.trim()) {
      alert("Please enter a project name.");
      return;
    }
    try {
      setSaving(true);
      await API.post("/project-progress", {
        projectName: addForm.projectName.trim(),
        priority: addForm.priority,
        initialStatus: addForm.initialStatus.trim(),
        poc: addPoc.map((p) => p._id),
        responsiblePersons: addResponsible.map((p) => p._id),
      });
      setShowAddModal(false);
      fetchProjects();
    } catch (error) {
      console.error("submitAddProject error:", error);
      alert(error?.response?.data?.message || "Failed to add project.");
    } finally {
      setSaving(false);
    }
  };

  /* ── view / details ── */
  const openDetails = async (projectId) => {
    setShowViewModal(true);
    setEditingDetails(false);
    setProgressText("");
    setLoadingDetails(true);
    try {
      const { data } = await API.get(`/project-progress/${projectId}`);
      setActiveProject(data.project);
    } catch (error) {
      console.error("openDetails error:", error);
      alert("Failed to load project details.");
      setShowViewModal(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const refreshActiveProject = async (projectId) => {
    const { data } = await API.get(`/project-progress/${projectId}`);
    setActiveProject(data.project);
  };

  /* ── edit details (POC / responsible / priority / name) ── */
  const startEditDetails = () => {
    if (!activeProject) return;
    setEditForm({
      projectName: activeProject.projectName,
      priority: activeProject.priority,
    });
    setEditPoc(activeProject.poc || []);
    setEditResponsible(activeProject.responsiblePersons || []);
    setEditingDetails(true);
  };

  const toggleEditPoc = (user) => {
    setEditPoc((prev) =>
      prev.some((p) => p._id === user._id)
        ? prev.filter((p) => p._id !== user._id)
        : [...prev, user]
    );
  };

  const toggleEditResponsible = (user) => {
    setEditResponsible((prev) =>
      prev.some((p) => p._id === user._id)
        ? prev.filter((p) => p._id !== user._id)
        : [...prev, user]
    );
  };

  const saveEditDetails = async () => {
    if (!editForm.projectName.trim()) {
      alert("Project name can't be empty.");
      return;
    }
    try {
      setSavingEdit(true);
      await API.put(`/project-progress/${activeProject._id}`, {
        projectName: editForm.projectName.trim(),
        priority: editForm.priority,
        poc: editPoc.map((p) => p._id),
        responsiblePersons: editResponsible.map((p) => p._id),
      });
      await refreshActiveProject(activeProject._id);
      setEditingDetails(false);
      fetchProjects();
    } catch (error) {
      console.error("saveEditDetails error:", error);
      alert(error?.response?.data?.message || "Failed to update project.");
    } finally {
      setSavingEdit(false);
    }
  };

  /* ── post a progress / status update (admin & user) ── */
  const submitProgressUpdate = async () => {
    if (!progressText.trim()) {
      alert("Please enter a status update.");
      return;
    }
    try {
      setPostingProgress(true);
      await API.post(`/project-progress/${activeProject._id}/progress`, {
        description: progressText.trim(),
      });
      setProgressText("");
      await refreshActiveProject(activeProject._id);
      fetchProjects();
    } catch (error) {
      console.error("submitProgressUpdate error:", error);
      alert(error?.response?.data?.message || "Failed to update status.");
    } finally {
      setPostingProgress(false);
    }
  };

  /* ── delete (super admin only) ── */
  const deleteProject = async (projectId) => {
    if (!window.confirm("Delete this project? This cannot be undone.")) return;
    try {
      await API.delete(`/project-progress/${projectId}`);
      fetchProjects();
    } catch (error) {
      console.error("deleteProject error:", error);
      alert(error?.response?.data?.message || "Failed to delete project.");
    }
  };

  const lastTwoUpdates = (activeProject?.history || []).slice(0, 2);

  return (
    <div className="pp-section">
      <div className="pp-header">
        <div className="pp-header-left">
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
              <FaProjectDiagram style={{ marginRight: 8, color: "#2563eb" }} />
              Project Progress
            </h1>
            <p>Track project status, ownership, and update history.</p>
          </div>
        </div>

        <button className="pp-add-btn" onClick={openAddModal}>
          <FaPlus /> Add Project
        </button>
      </div>

      <div className="pp-table-wrapper">
        <table className="pp-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Project</th>
              <th>Current Status</th>
              <th>Priority</th>
              <th>Responsible Person</th>
              <th style={{ textAlign: "center" }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr className="pp-empty-row">
                <td colSpan={6}>Loading projects…</td>
              </tr>
            )}

            {!loading && sortedProjects.length === 0 && (
              <tr className="pp-empty-row">
                <td colSpan={6}>
                  No projects yet. Click "Add Project" to create the first one.
                </td>
              </tr>
            )}

            {!loading &&
              sortedProjects.map((p) => (
                <tr key={p._id}>
                  <td>{p.sno}</td>
                  <td className="pp-project-name">{p.projectName}</td>
                  <td className="pp-status-cell" title={p.currentStatusDescription}>
                    {p.currentStatusDescription ? (
                      p.currentStatusDescription
                    ) : (
                      <span className="pp-empty-status">No update yet</span>
                    )}
                  </td>
                  <td>
                    <PriorityBadge priority={p.priority} />
                  </td>
                  <td className="pp-responsible-cell">
                    {p.responsiblePersons && p.responsiblePersons.length > 0 ? (
                      <span
                        title={p.responsiblePersons.map((r) => r.name).join(", ")}
                      >
                        {p.responsiblePersons.map((r) => r.name).join(", ")}
                      </span>
                    ) : (
                      <span className="pp-empty-status">Unassigned</span>
                    )}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      className="pp-view-btn"
                      title="View overall details"
                      onClick={() => openDetails(p._id)}
                    >
                      <FaEye />
                    </button>
                    {isAdmin && (
                      <button
                        className="pp-delete-btn"
                        title="Delete project"
                        onClick={() => deleteProject(p._id)}
                      >
                        <FaTrash />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* ================= ADD PROJECT MODAL ================= */}
      {showAddModal && (
        <div className="pp-modal-overlay">
          <div className="pp-modal">
            <div className="pp-modal-header">
              <h2>Add Project</h2>
              <span className="pp-close-icon" onClick={() => setShowAddModal(false)}>
                <FaTimes />
              </span>
            </div>

            <form onSubmit={submitAddProject}>
              <div className="pp-field">
                <label>Project Name</label>
                <input
                  type="text"
                  placeholder="Enter project name"
                  value={addForm.projectName}
                  onChange={(e) =>
                    setAddForm({ ...addForm, projectName: e.target.value })
                  }
                  required
                />
              </div>

              <div className="pp-field">
                <label>Priority</label>
                <select
                  value={addForm.priority}
                  onChange={(e) =>
                    setAddForm({ ...addForm, priority: e.target.value })
                  }
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pp-field">
                <label>POC (Point of Contact)</label>
                <PeoplePicker
                  groups={groups}
                  selectedIds={addPoc.map((p) => p._id)}
                  onToggle={toggleAddPoc}
                />
                <PeopleChips people={addPoc} onRemove={toggleAddPoc} />
              </div>

              <div className="pp-field">
                <label>Responsible Person(s)</label>
                <PeoplePicker
                  groups={groups}
                  selectedIds={addResponsible.map((p) => p._id)}
                  onToggle={toggleAddResponsible}
                />
                <PeopleChips people={addResponsible} onRemove={toggleAddResponsible} />
              </div>

              <div className="pp-field">
                <label>Current Status Description (optional)</label>
                <textarea
                  placeholder="What's the current status of this project?"
                  value={addForm.initialStatus}
                  onChange={(e) =>
                    setAddForm({ ...addForm, initialStatus: e.target.value })
                  }
                />
              </div>

              <button type="submit" className="pp-submit-btn" disabled={saving}>
                {saving ? "Adding…" : "Add Project"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= VIEW / DETAILS MODAL ================= */}
      {showViewModal && (
        <div className="pp-modal-overlay">
          <div className="pp-modal pp-modal-wide">
            <div className="pp-modal-header">
              <h2>Project Details</h2>
              <span
                className="pp-close-icon"
                onClick={() => {
                  setShowViewModal(false);
                  setActiveProject(null);
                  setEditingDetails(false);
                }}
              >
                <FaTimes />
              </span>
            </div>

            {loadingDetails && <p>Loading…</p>}

            {!loadingDetails && activeProject && (
              <>
                {/* ── name / priority / edit toggle ── */}
                <div className="pp-detail-block">
                  {!editingDetails ? (
                    <>
                      <div className="pp-detail-title-row">
                        <h3 style={{ margin: 0 }}>{activeProject.projectName}</h3>
                        <div className="pp-inline-actions">
                          <PriorityBadge priority={activeProject.priority} />
                          <button className="pp-btn-outline" onClick={startEditDetails}>
                            <FaEdit /> Edit
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="pp-field">
                        <label>Project Name</label>
                        <input
                          type="text"
                          value={editForm.projectName}
                          onChange={(e) =>
                            setEditForm({ ...editForm, projectName: e.target.value })
                          }
                        />
                      </div>
                      <div className="pp-field">
                        <label>Priority</label>
                        <select
                          value={editForm.priority}
                          onChange={(e) =>
                            setEditForm({ ...editForm, priority: e.target.value })
                          }
                        >
                          {PRIORITIES.map((p) => (
                            <option key={p.value} value={p.value}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="pp-field">
                        <label>POC (Point of Contact)</label>
                        <PeoplePicker
                          groups={groups}
                          selectedIds={editPoc.map((p) => p._id)}
                          onToggle={toggleEditPoc}
                        />
                        <PeopleChips people={editPoc} onRemove={toggleEditPoc} />
                      </div>

                      <div className="pp-field">
                        <label>Responsible Person(s)</label>
                        <PeoplePicker
                          groups={groups}
                          selectedIds={editResponsible.map((p) => p._id)}
                          onToggle={toggleEditResponsible}
                        />
                        <PeopleChips
                          people={editResponsible}
                          onRemove={toggleEditResponsible}
                        />
                      </div>

                      <div className="pp-inline-actions">
                        <button
                          className="pp-submit-btn"
                          style={{ marginTop: 0 }}
                          onClick={saveEditDetails}
                          disabled={savingEdit}
                        >
                          <FaSave /> {savingEdit ? "Saving…" : "Save Changes"}
                        </button>
                        <button
                          className="pp-btn-outline"
                          type="button"
                          onClick={() => setEditingDetails(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {!editingDetails && (
                  <>
                    {/* ── POC / responsible read-only view ── */}
                    <div className="pp-detail-block">
                      <h4>POC (Point of Contact)</h4>
                      <PeopleChips people={activeProject.poc || []} />
                    </div>

                    <div className="pp-detail-block">
                      <h4>Responsible Person(s)</h4>
                      <PeopleChips people={activeProject.responsiblePersons || []} />
                    </div>

                    {/* ── current status: last two updates ── */}
                    <div className="pp-detail-block">
                      <div className="pp-detail-title-row">
                        <h4 style={{ margin: 0 }}>
                          Current Status Description
                        </h4>
                        <button
                          className="pp-btn-outline"
                          onClick={() => setShowHistoryModal(true)}
                        >
                          <FaHistory /> Manage History
                        </button>
                      </div>

                      {lastTwoUpdates.length === 0 && (
                        <p className="pp-people-empty">No updates posted yet.</p>
                      )}

                      {lastTwoUpdates.map((h) => (
                        <div className="pp-update-item" key={h._id}>
                          <p className="pp-update-text">{h.description}</p>
                          <p className="pp-update-meta">
                            {h.updatedByName || h.updatedBy?.name || "Unknown"} ·{" "}
                            {formatDateTime(h.updatedAt)}
                          </p>
                        </div>
                      ))}

                      {/* ── update progress (admin & user both) ── */}
                      <div style={{ marginTop: 12 }}>
                        <label
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#374151",
                            display: "block",
                            marginBottom: 7,
                          }}
                        >
                          Post a Progress Update
                        </label>
                        <textarea
                          placeholder="Type the latest status update…"
                          value={progressText}
                          onChange={(e) => setProgressText(e.target.value)}
                          style={{
                            width: "100%",
                            border: "1px solid #d1d5db",
                            borderRadius: 9,
                            padding: "9px 12px",
                            fontSize: 13,
                            fontFamily: "inherit",
                            minHeight: 64,
                            resize: "vertical",
                          }}
                        />
                        <button
                          className="pp-submit-btn"
                          onClick={submitProgressUpdate}
                          disabled={postingProgress}
                        >
                          {postingProgress ? "Posting…" : "Update Progress"}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= MANAGE HISTORY MODAL ================= */}
      {showHistoryModal && activeProject && (
        <div className="pp-modal-overlay">
          <div className="pp-modal">
            <div className="pp-modal-header">
              <h2>Update History — {activeProject.projectName}</h2>
              <span
                className="pp-close-icon"
                onClick={() => setShowHistoryModal(false)}
              >
                <FaTimes />
              </span>
            </div>

            <div className="pp-history-scroll">
              {(!activeProject.history || activeProject.history.length === 0) && (
                <p className="pp-no-history">No updates have been posted yet.</p>
              )}

              {(activeProject.history || []).map((h) => (
                <div className="pp-update-item" key={h._id}>
                  <p className="pp-update-text">{h.description}</p>
                  <p className="pp-update-meta">
                    {h.updatedByName || h.updatedBy?.name || "Unknown"} ·{" "}
                    {formatDateTime(h.updatedAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectProgress;