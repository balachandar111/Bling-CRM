// 📁 src/user/MyProfile.jsx
// Shows the logged-in user's own employee record (read-only)

import React, { useState, useEffect } from "react";
import API from "../services/api";
import "./EmployeeProfile.css";

const MyProfile = () => {
  const [employee, setEmployee] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const { data } = await API.get("/employees/me");
        setEmployee(data.employee);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load your employee profile.");
      }
      setLoading(false);
    };
    fetchMe();
  }, []);

  if (loading) return <div style={{ padding:"40px", textAlign:"center", color:"#888" }}>Loading your profile...</div>;
  if (error)   return <div style={{ padding:"40px", background:"#fff3f3", border:"1px solid #ffccc7", color:"#cf1322", borderRadius:"8px", margin:"20px" }}>{error}</div>;
  if (!employee) return <div style={{ padding:"40px", textAlign:"center", color:"#888" }}>No employee record found linked to your account. Ask your admin to link your user account to an employee record.</div>;

  return (
    <div className="employee-page">
      <div className="employee-page-header">
        <h2>👤 My Profile</h2>
      </div>

      {/* ── PROFILE CARD ── */}
      <div style={{ background:"#fff", borderRadius:"12px", padding:"30px", marginBottom:"20px", boxShadow:"0 1px 4px rgba(0,0,0,0.08)", display:"flex", gap:"28px", flexWrap:"wrap", alignItems:"flex-start" }}>
        <img
          src={employee.profileImage || "https://ui-avatars.com/api/?name=" + encodeURIComponent(employee.name || "User") + "&background=2563eb&color=fff&size=128"}
          alt="profile"
          style={{ width:"110px", height:"110px", borderRadius:"50%", objectFit:"cover", border:"3px solid #e8f0fe", flexShrink:0 }}
        />
        <div style={{ flex:1 }}>
          <h2 style={{ margin:"0 0 4px" }}>{employee.name}</h2>
          <p style={{ margin:"0 0 12px", color:"#2563eb", fontWeight:500 }}>{employee.designation} {employee.department ? "· " + employee.department : ""}</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px,1fr))", gap:"12px" }}>
            {[
              { label:"Email",        value: employee.email },
              { label:"Phone",        value: employee.phone      || "—" },
              { label:"Department",   value: employee.department || "—" },
              { label:"Designation",  value: employee.designation|| "—" },
              { label:"Joining Date", value: employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString("en-IN") : "—" },
              { label:"Salary",       value: employee.salary ? "₹" + Number(employee.salary).toLocaleString("en-IN") : "—" },
            ].map(f => (
              <div key={f.label}>
                <p style={{ margin:0, fontSize:"12px", color:"#888", textTransform:"uppercase", letterSpacing:"0.5px" }}>{f.label}</p>
                <p style={{ margin:"2px 0 0", fontWeight:500, color:"#222" }}>{f.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── DOCUMENTS ── */}
      {employee.documents?.length > 0 && (
        <div style={{ background:"#fff", borderRadius:"10px", padding:"20px", marginBottom:"20px", boxShadow:"0 1px 4px rgba(0,0,0,0.08)" }}>
          <h3 style={{ marginTop:0 }}>📄 My Documents</h3>
          <div style={{ display:"flex", gap:"12px", flexWrap:"wrap" }}>
            {employee.documents.map((doc, i) => (
              <a key={i} href={doc} target="_blank" rel="noreferrer" className="view-doc-btn">
                Document {i + 1}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── NOTE ── */}
      <div style={{ background:"#f0f7ff", border:"1px solid #bfdbfe", borderRadius:"10px", padding:"16px", color:"#1e40af", fontSize:"14px" }}>
        ℹ️ To update your profile details (name, phone, department etc.), please contact your admin.
      </div>
    </div>
  );
};

export default MyProfile;
