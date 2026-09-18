// 📁 src/pwa/UpdateToast.jsx
//
// Tiny, dependency-free "a new version is available" toast for the PWA.
// vite-plugin-pwa's registerType is "autoUpdate", so the new service worker
// activates on its own — this toast just offers the user an instant reload
// instead of waiting for their next natural page load.

import { useEffect, useState } from "react";
import { registerSW } from "virtual:pwa-register";

export default function UpdateToast() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateSW, setUpdateSW] = useState(null);

  useEffect(() => {
    const updateFn = registerSW({
      immediate: true,
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onOfflineReady() {
        setOfflineReady(true);
      },
      onRegisterError(error) {
        console.error("Service worker registration failed:", error);
      },
    });
    setUpdateSW(() => updateFn);
  }, []);

  useEffect(() => {
    if (!offlineReady) return;
    const timer = setTimeout(() => setOfflineReady(false), 4000);
    return () => clearTimeout(timer);
  }, [offlineReady]);

  if (!needRefresh && !offlineReady) return null;

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        bottom: "1rem",
        left: "50%",
        transform: "translateX(-50%)",
        background: "#1f2937",
        color: "#fff",
        padding: "0.75rem 1rem",
        borderRadius: "0.5rem",
        boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        zIndex: 9999,
        fontSize: "0.875rem",
        maxWidth: "calc(100vw - 2rem)",
      }}
    >
      {needRefresh ? (
        <>
          <span>A new version of BlingCRM is available.</span>
          <button
            onClick={() => updateSW && updateSW(true)}
            style={{
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "0.375rem",
              padding: "0.375rem 0.75rem",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Reload
          </button>
          <button
            onClick={() => setNeedRefresh(false)}
            style={{
              background: "transparent",
              color: "#d1d5db",
              border: "none",
              cursor: "pointer",
            }}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </>
      ) : (
        <span>BlingCRM is ready to work offline.</span>
      )}
    </div>
  );
}