// 📁 src/main.jsx

import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import UpdateToast from "./pwa/UpdateToast";
import { initResponsiveTables } from "./utils/responsiveTables";

// Wraps every table in a horizontal scroller and labels cells for the
// mobile card view. Runs app-wide, including tables rendered later.
initResponsiveTables();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
    {/* Registers the PWA service worker and shows a small "update ready" /
       "offline ready" toast. Renders nothing on its own otherwise. */}
    <UpdateToast />
  </React.StrictMode>
);