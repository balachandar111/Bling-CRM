import React from "react";

import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";

import Login from "./pages/Login";

import ProtectedRoute from "./components/ProtectedRoute";

import "./index.css";

const App = () => {

  return (

    <BrowserRouter>

      <Routes>

        <Route
          path="/login"
          element={<Login />}
        />


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
  element={<EmployeeProfile />}
/>

      </Routes>

    </BrowserRouter>
  );
};
import EmployeeProfile
from "./pages/EmployeeProfile";

export default App;