// 📁 src/components/MobileHeader.jsx
//
// Fixed app bar shown at tablet width and below. It is the only way to open
// the sidebar drawer on touch devices, so it is rendered for every section —
// not just the dashboard. Hidden on desktop by responsive.css.

import React from "react";
import { FaBars } from "react-icons/fa";

export const MENU_TITLES = {
  dashboard: "Dashboard",
  customers: "Customers",
  employees: "Employees",
  MyAttendance: "Attendance",
  Reimbursement: "Reimbursement",
  opportunity: "Opportunity",
  adminOpportunity: "Opportunity",
  invoices: "Quotation & Invoice",
  tasks: "Tasks",
  projectProgress: "Project Progress",
  users: "User Management",
  leaveRequests: "Leave Requests",
  closedLeadsReimbursements: "Closed Deals & Reimbursements",
  reminders: "Reminders",
};

const MobileHeader = ({ activeMenu, onToggleSidebar, isOpen }) => (
  <header className="mobile-header">
    <button
      type="button"
      className="mobile-header__burger"
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-expanded={isOpen}
      aria-controls="crm-sidebar"
      onClick={onToggleSidebar}
    >
      <FaBars />
    </button>

    <h1 className="mobile-header__title">
      {MENU_TITLES[activeMenu] || "Bling CRM"}
    </h1>

    <img
      className="mobile-header__logo"
      src="https://res.cloudinary.com/ds4i8pujs/image/upload/v1779687977/bling_tech_logo_h7rc1m.png"
      alt="Bling Tech"
    />
  </header>
);

export default MobileHeader;
