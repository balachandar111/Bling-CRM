// 📁 src/main.jsx

import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import { initResponsiveTables } from "./utils/responsiveTables";

// Wraps every table in a horizontal scroller and labels cells for the
// mobile card view. Runs app-wide, including tables rendered later.
initResponsiveTables();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);