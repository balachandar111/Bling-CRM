// 📁 src/App.jsx

import React from "react";

import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import EmployeeProfile from "./user/EmployeeProfile";

import ProtectedRoute from "./components/ProtectedRoute";

import "./index.css";
import "./styles/flexible.css";

// Must stay LAST: the responsive layer overrides the older layout rules.
import "./styles/responsive.css";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employee-profile"
          element={
            <ProtectedRoute>
              <EmployeeProfile />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;