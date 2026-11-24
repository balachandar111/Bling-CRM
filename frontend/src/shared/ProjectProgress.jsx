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
  FaFire,
  FaExclamationCircle,
  FaCheckCircle,
  FaThLarge,
  FaList,
  FaArrowRight,
  FaUser,
  FaCommentDots,
  FaSearch,
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

  /* ── filters & views ── */
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [viewMode, setViewMode] = useState("cards"); // "cards" | "table"
  const [historySearchTerm, setHistorySearchTerm] = useState("");

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

  /* ── Priority Counts ── */
  const highCount = useMemo(
    () => projects.filter((p) => (p.priority || "medium").toLowerCase() === "high").length,
    [projects]
  );
  const medCount = useMemo(
    () => projects.filter((p) => (p.priority || "medium").toLowerCase() === "medium").length,
    [projects]
  );
  const lowCount = useMemo(
    () => projects.filter((p) => (p.priority || "medium").toLowerCase() === "low").length,
    [projects]
  );
  const totalCount = projects.length;

  /* ── All Employees options for the filter dropdown ── */
  const allEmployeesList = useMemo(() => {
    const map = new Map();
    (groups.all || []).forEach((u) => {
      if (u._id && u.name) map.set(String(u._id), u);
    });
    projects.forEach((p) => {
      (p.responsiblePersons || []).forEach((u) => {
        if (u && u._id && u.name) map.set(String(u._id), u);
      });
      (p.poc || []).forEach((u) => {
        if (u && u._id && u.name) map.set(String(u._id), u);
      });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [groups, projects]);

  /* ── Filtered Projects ── */
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // 1. Employee filter
      if (selectedEmployee !== "all") {
        const hasResponsible = (p.responsiblePersons || []).some(
          (u) =>
            String(u._id) === selectedEmployee ||
            (u.name && u.name.toLowerCase() === selectedEmployee.toLowerCase())
        );
        const hasPoc = (p.poc || []).some(
          (u) =>
            String(u._id) === selectedEmployee ||
            (u.name && u.name.toLowerCase() === selectedEmployee.toLowerCase())
        );
        const isCreatedBy =
          p.createdBy &&
          (String(p.createdBy._id || p.createdBy) === selectedEmployee ||
            (p.createdByName &&
              p.createdByName.toLowerCase() === selectedEmployee.toLowerCase()));

        if (!hasResponsible && !hasPoc && !isCreatedBy) return false;
      }

      // 2. Priority filter
      if (priorityFilter !== "all") {
        if ((p.priority || "medium").toLowerCase() !== priorityFilter.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [projects, selectedEmployee, priorityFilter]);

  const sortedProjects = filteredProjects;

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

      {/* ── PRIORITY KPI CARDS AT TOP ── */}
      <div className="pp-kpi-grid">
        <div
          className={`pp-kpi-card high ${priorityFilter === "high" ? "active-filter" : ""}`}
          onClick={() => setPriorityFilter(priorityFilter === "high" ? "all" : "high")}
          title="Click to filter High Priority projects"
        >
          <div className="pp-kpi-info">
            <h3>{highCount}</h3>
            <span>High Priority</span>
          </div>
          <div className="pp-kpi-icon">
            <FaFire />
          </div>
        </div>

        <div
          className={`pp-kpi-card medium ${priorityFilter === "medium" ? "active-filter" : ""}`}
          onClick={() => setPriorityFilter(priorityFilter === "medium" ? "all" : "medium")}
          title="Click to filter Medium Priority projects"
        >
          <div className="pp-kpi-info">
            <h3>{medCount}</h3>
            <span>Medium Priority</span>
          </div>
          <div className="pp-kpi-icon">
            <FaExclamationCircle />
          </div>
        </div>

        <div
          className={`pp-kpi-card low ${priorityFilter === "low" ? "active-filter" : ""}`}
          onClick={() => setPriorityFilter(priorityFilter === "low" ? "all" : "low")}
          title="Click to filter Low Priority projects"
        >
          <div className="pp-kpi-info">
            <h3>{lowCount}</h3>
            <span>Low Priority</span>
          </div>
          <div className="pp-kpi-icon">
            <FaCheckCircle />
          </div>
        </div>

        <div
          className={`pp-kpi-card total ${priorityFilter === "all" ? "active-filter" : ""}`}
          onClick={() => setPriorityFilter("all")}
          title="Click to view all projects"
        >
          <div className="pp-kpi-info">
            <h3>{totalCount}</h3>
            <span>Total Projects</span>
          </div>
          <div className="pp-kpi-icon">
            <FaProjectDiagram />
          </div>
        </div>
      </div>

      {/* ── EMPLOYEE & PRIORITY FILTER TOOLBAR ── */}
      <div className="pp-filter-toolbar">
        <div className="pp-filter-left">
          <div className="pp-filter-group">
            <span className="pp-filter-label">👤 Filter by Employee:</span>
            <select
              className="pp-filter-select"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="all">👥 All Employees (All Projects)</option>
              {allEmployeesList.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} {emp.designation ? `(${emp.designation})` : ""}
                </option>
              ))}
            </select>
          </div>

          {(selectedEmployee !== "all" || priorityFilter !== "all") && (
            <button
              type="button"
              className="pp-filter-reset-btn"
              onClick={() => {
                setSelectedEmployee("all");
                setPriorityFilter("all");
              }}
            >
              <FaTimes style={{ marginRight: 4 }} /> Clear Filter
            </button>
          )}

          <span style={{ fontSize: 13, color: "#6b7280", marginLeft: 4 }}>
            Showing <strong>{sortedProjects.length}</strong> project{sortedProjects.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="pp-view-toggle">
          <button
            type="button"
            className={`pp-view-toggle-btn ${viewMode === "cards" ? "active" : ""}`}
            onClick={() => setViewMode("cards")}
          >
            <FaThLarge /> Cards View
          </button>
          <button
            type="button"
            className={`pp-view-toggle-btn ${viewMode === "table" ? "active" : ""}`}
            onClick={() => setViewMode("table")}
          >
            <FaList /> Table View
          </button>
        </div>
      </div>

      {/* ── VIEW 1: CARDS VIEW ── */}
      {viewMode === "cards" && (
        <>
          {loading && (
            <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
              Loading projects…
            </div>
          )}

          {!loading && sortedProjects.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                background: "#ffffff",
                borderRadius: "14px",
                border: "1px dashed #d1d5db",
              }}
            >
              <FaProjectDiagram size={40} style={{ color: "#9ca3af", marginBottom: 12 }} />
              <h3 style={{ margin: "0 0 6px 0", color: "#374151" }}>No Projects Found</h3>
              <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>
                {selectedEmployee !== "all"
                  ? "No projects currently assigned to this employee."
                  : "No projects match the selected filters."}
              </p>
            </div>
          )}

          {!loading && sortedProjects.length > 0 && (
            <div className="pp-cards-grid">
              {sortedProjects.map((p) => {
                const updatesCount = p.history?.length || 0;

                return (
                  <div
                    key={p._id}
                    className="pp-card"
                    onClick={() => openDetails(p._id)}
                  >
                    <div>
                      {/* CARD HEADER */}
                      <div className="pp-card-header">
                        <div className="pp-card-title-box">
                          <span className="pp-card-sno">#{p.sno || "-"}</span>
                          <h4 className="pp-card-name">{p.projectName}</h4>
                        </div>
                        <PriorityBadge priority={p.priority} />
                      </div>

                      {/* CURRENT STATUS */}
                      <span className="pp-card-section-label">Current Status</span>
                      <div className="pp-card-status-box" title={p.currentStatusDescription}>
                        {p.currentStatusDescription ? (
                          p.currentStatusDescription
                        ) : (
                          <span className="pp-empty-status">No progress update posted yet</span>
                        )}
                      </div>

                      {/* RESPONSIBLE PERSONS */}
                      <div className="pp-card-section">
                        <span className="pp-card-section-label">Responsible Person(s)</span>
                        <PeopleChips people={p.responsiblePersons || []} />
                      </div>

                      {/* POC */}
                      {p.poc && p.poc.length > 0 && (
                        <div className="pp-card-section">
                          <span className="pp-card-section-label">POC</span>
                          <PeopleChips people={p.poc} />
                        </div>
                      )}
                    </div>

                    {/* CARD FOOTER */}
                    <div className="pp-card-footer">
                      <span className="pp-card-updates-badge">
                        <FaCommentDots size={11} /> {updatesCount} update{updatesCount !== 1 ? "s" : ""}
                      </span>

                      <div className="pp-card-action-link">
                        Details &amp; Notes <FaArrowRight size={11} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── VIEW 2: TABLE VIEW ── */}
      {viewMode === "table" && (
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
                    No projects found. Try clearing filters or click "Add Project".
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
      )}

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

                    {/* ── UPDATE PROGRESS FORM (Admin & User both) ── */}
                    <div className="pp-detail-block" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 18px" }}>
                      <label
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#1e293b",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginBottom: 8,
                        }}
                      >
                        <FaEdit style={{ color: "#2563eb" }} /> Post a Progress Update / Note
                      </label>
                      <textarea
                        placeholder="Type the latest status update, meeting note, or deliverable milestone here…"
                        value={progressText}
                        onChange={(e) => setProgressText(e.target.value)}
                        style={{
                          width: "100%",
                          border: "1px solid #cbd5e1",
                          borderRadius: 8,
                          padding: "10px 14px",
                          fontSize: 13.5,
                          fontFamily: "inherit",
                          minHeight: 70,
                          resize: "vertical",
                          background: "#ffffff",
                        }}
                      />
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                        <button
                          className="pp-submit-btn"
                          style={{ marginTop: 0, padding: "9px 20px" }}
                          onClick={submitProgressUpdate}
                          disabled={postingProgress || !progressText.trim()}
                        >
                          {postingProgress ? "Posting…" : "Post Progress Update"}
                        </button>
                      </div>
                    </div>

                    {/* ── CURRENT ACTIVE STATUS ── */}
                    {activeProject.currentStatusDescription && (
                      <div className="pp-detail-block">
                        <h4 style={{ margin: "0 0 8px 0", fontSize: 13, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          Latest Status Summary
                        </h4>
                        <div className="pp-card-status-box" style={{ margin: 0, minHeight: "auto", background: "#f0fdf4", borderColor: "#bbf7d0", color: "#166534", fontWeight: 500 }}>
                          {activeProject.currentStatusDescription}
                        </div>
                      </div>
                    )}

                    {/* ── PROFESSIONAL ORGANIZED NOTE HISTORY TIMELINE ── */}
                    <div className="pp-history-container">
                      <div className="pp-history-title-row">
                        <h4>
                          <FaHistory style={{ color: "#2563eb" }} /> Complete Note &amp; Progress History ({(activeProject.history || []).length})
                        </h4>

                        {(activeProject.history || []).length > 2 && (
                          <div style={{ position: "relative", width: 220 }}>
                            <input
                              type="text"
                              placeholder="Search notes…"
                              value={historySearchTerm}
                              onChange={(e) => setHistorySearchTerm(e.target.value)}
                              style={{
                                width: "100%",
                                padding: "6px 10px 6px 28px",
                                fontSize: 12,
                                borderRadius: 6,
                                border: "1px solid #cbd5e1",
                                outline: "none",
                              }}
                            />
                            <FaSearch
                              size={11}
                              style={{
                                position: "absolute",
                                left: 9,
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: "#94a3b8",
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {(!activeProject.history || activeProject.history.length === 0) ? (
                        <div style={{ padding: "30px", textAlign: "center", color: "#94a3b8", background: "#f8fafc", borderRadius: 10, border: "1px dashed #cbd5e1" }}>
                          No progress notes or updates posted yet. Use the box above to post the first update.
                        </div>
                      ) : (
                        <div className="pp-timeline">
                          {(activeProject.history || [])
                            .filter((h) => {
                              if (!historySearchTerm.trim()) return true;
                              const term = historySearchTerm.toLowerCase();
                              return (
                                h.description?.toLowerCase().includes(term) ||
                                h.updatedByName?.toLowerCase().includes(term) ||
                                (h.updatedBy?.name && h.updatedBy.name.toLowerCase().includes(term))
                              );
                            })
                            .map((h, hIdx) => {
                              const authorName = h.updatedByName || h.updatedBy?.name || "Team Member";
                              const initials = authorName
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase();

                              return (
                                <div className="pp-timeline-item" key={h._id || hIdx}>
                                  <div className="pp-timeline-dot" />
                                  <div className="pp-timeline-card">
                                    <div className="pp-timeline-header">
                                      <div className="pp-timeline-author-box">
                                        <div className="pp-timeline-avatar">{initials || "U"}</div>
                                        <div>
                                          <div className="pp-timeline-author">{authorName}</div>
                                          {h.updatedBy?.designation && (
                                            <div style={{ fontSize: 11, color: "#94a3b8" }}>
                                              {h.updatedBy.designation}
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      <span className="pp-timeline-date">
                                        📅 {formatDateTime(h.updatedAt)}
                                      </span>
                                    </div>

                                    <div className="pp-timeline-body">{h.description}</div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
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