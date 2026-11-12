// 📁 frontend/src/marketing/EmailCompose.jsx
//
// Compose screen for Email Marketing: theme picker + design options on the
// left, LIVE PREVIEW on the right. The preview is rendered by the backend
// with the same template builder used for the real send, so what you see
// is exactly what customers receive.

import React, { useEffect, useRef, useState } from "react";
import API from "../services/api";
import {
  FaArrowLeft,
  FaPaperPlane,
  FaDesktop,
  FaMobileAlt,
  FaVial,
} from "react-icons/fa";

export const THEMES = [
  { id: "modern", name: "Modern", accent: "#2563eb", hint: "Gradient header, rounded" },
  { id: "classic", name: "Classic", accent: "#1d4ed8", hint: "Clean, business style" },
  { id: "elegant", name: "Elegant", accent: "#b8860b", hint: "Dark header, serif" },
  { id: "festive", name: "Festive", accent: "#ea580c", hint: "Warm, pill button" },
  { id: "fresh", name: "Fresh", accent: "#059669", hint: "Green, friendly" },
  { id: "minimal", name: "Minimal", accent: "#111827", hint: "Simple, no banner" },
];

export const DEFAULT_MAIL = {
  theme: "modern",
  accent: "#2563eb",
  brandName: "BlingTechConnect",
  headline: "",
  subject: "",
  body: "",
  ctaText: "",
  ctaUrl: "",
  signature: "",
  footerNote: "",
  logoUrl: "",
  heroUrl: "",
};

const EmailCompose = ({
  mail,
  setMail,
  recipientCount,
  previewCustomerId,
  sending,
  onBack,
  onSend,
}) => {
  const [html, setHtml] = useState("");
  const [previewSubject, setPreviewSubject] = useState("");
  const [previewError, setPreviewError] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [device, setDevice] = useState("desktop");
  const [testing, setTesting] = useState(false);
  const seq = useRef(0);

  const set = (key, value) => setMail((prev) => ({ ...prev, [key]: value }));

  const pickTheme = (t) =>
    setMail((prev) => ({ ...prev, theme: t.id, accent: t.accent }));

  /* ── debounced live preview ── */
  useEffect(() => {
    const id = ++seq.current;
    setLoadingPreview(true);

    const timer = setTimeout(async () => {
      try {
        const { data } = await API.post("/marketing/email/preview", {
          ...mail,
          subject: mail.subject || "Your subject",
          body: mail.body || "Your message will appear here…",
          customerId: previewCustomerId,
        });
        if (id === seq.current) {
          setHtml(data.html);
          setPreviewSubject(data.subject || "");
          setPreviewError("");
        }
      } catch (error) {
        if (id === seq.current) {
          setPreviewError(
            error?.response?.data?.message || "Could not load preview."
          );
        }
      } finally {
        if (id === seq.current) setLoadingPreview(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [mail, previewCustomerId]);

  const canSend = mail.subject.trim() && mail.body.trim();

  const sendTest = async () => {
    if (!canSend || testing) return;
    try {
      setTesting(true);
      const { data } = await API.post("/marketing/email/test", mail);
      alert(data.message || "Test email sent.");
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to send test email.");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="mk-compose">
      {/* ================= LEFT : FORM ================= */}
      <div className="mk-card mk-compose-form">
        <p className="mk-summary">
          Sending to <b>{recipientCount}</b> customer(s)
        </p>

        <h3 className="mk-h3">1. Choose a theme</h3>
        <div className="mk-themes">
          {THEMES.map((t) => (
            <button
              type="button"
              key={t.id}
              className={`mk-theme${mail.theme === t.id ? " active" : ""}`}
              onClick={() => pickTheme(t)}
              title={t.hint}
            >
              <span className="mk-theme-swatch" style={{ background: t.accent }} />
              <b>{t.name}</b>
              <small>{t.hint}</small>
            </button>
          ))}
        </div>

        <div className="mk-row">
          <div className="mk-field">
            <label>Accent colour</label>
            <div className="mk-color">
              <input
                type="color"
                value={mail.accent}
                onChange={(e) => set("accent", e.target.value)}
              />
              <input
                type="text"
                value={mail.accent}
                maxLength={7}
                onChange={(e) => set("accent", e.target.value)}
              />
              <button
                type="button"
                className="mk-link"
                onClick={() =>
                  set(
                    "accent",
                    (THEMES.find((t) => t.id === mail.theme) || THEMES[0]).accent
                  )
                }
              >
                Reset
              </button>
            </div>
          </div>

          <div className="mk-field">
            <label>Brand / company name</label>
            <input
              type="text"
              value={mail.brandName}
              onChange={(e) => set("brandName", e.target.value)}
            />
          </div>
        </div>

        <div className="mk-row">
          <div className="mk-field">
            <label>Logo image URL (optional)</label>
            <input
              type="text"
              placeholder="https://… (public image link)"
              value={mail.logoUrl}
              onChange={(e) => set("logoUrl", e.target.value)}
            />
          </div>
          <div className="mk-field">
            <label>Banner image URL (optional)</label>
            <input
              type="text"
              placeholder="https://… (600px wide works best)"
              value={mail.heroUrl}
              onChange={(e) => set("heroUrl", e.target.value)}
            />
          </div>
        </div>

        <h3 className="mk-h3">2. Write your email</h3>

        <div className="mk-field">
          <label>Subject *</label>
          <input
            type="text"
            placeholder="e.g. Special offer for {{name}}"
            value={mail.subject}
            onChange={(e) => set("subject", e.target.value)}
          />
        </div>

        <div className="mk-field">
          <label>Headline (big title inside the email)</label>
          <input
            type="text"
            placeholder="e.g. Hello {{name}}, big savings are here"
            value={mail.headline}
            onChange={(e) => set("headline", e.target.value)}
          />
        </div>

        <div className="mk-field">
          <label>Body *</label>
          <textarea
            rows={9}
            placeholder={
              "Hi {{name}},\n\nWrite your message here...\n\n- Point one\n- Point two"
            }
            value={mail.body}
            onChange={(e) => set("body", e.target.value)}
          />
          <p className="mk-hint">
            Leave a blank line for a new paragraph. Start lines with{" "}
            <code>- </code> for bullets. Use <code>**bold**</code> for bold.
            Placeholders: <code>{"{{name}}"}</code>, <code>{"{{company}}"}</code>.
          </p>
        </div>

        <div className="mk-row">
          <div className="mk-field">
            <label>Button text (optional)</label>
            <input
              type="text"
              placeholder="e.g. Claim my offer"
              value={mail.ctaText}
              onChange={(e) => set("ctaText", e.target.value)}
            />
          </div>
          <div className="mk-field">
            <label>Button link</label>
            <input
              type="text"
              placeholder="https://…"
              value={mail.ctaUrl}
              onChange={(e) => set("ctaUrl", e.target.value)}
            />
          </div>
        </div>

        <div className="mk-field">
          <label>Signature (optional)</label>
          <textarea
            rows={3}
            placeholder={"Regards,\nBling Tech Team"}
            value={mail.signature}
            onChange={(e) => set("signature", e.target.value)}
          />
        </div>

        <div className="mk-field">
          <label>Footer note (optional)</label>
          <input
            type="text"
            placeholder="e.g. Chennai, Tamil Nadu · Reply STOP to unsubscribe"
            value={mail.footerNote}
            onChange={(e) => set("footerNote", e.target.value)}
          />
        </div>

        <div className="mk-actions" style={{ justifyContent: "space-between" }}>
          <button className="mk-btn mk-btn-ghost" onClick={onBack} disabled={sending}>
            <FaArrowLeft /> Back
          </button>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              className="mk-btn mk-btn-ghost"
              onClick={sendTest}
              disabled={!canSend || testing || sending}
              title="Send a test copy to your own email"
            >
              <FaVial /> {testing ? "Sending test…" : "Send test to me"}
            </button>

            <button
              className="mk-btn mk-btn-send"
              onClick={onSend}
              disabled={!canSend || sending}
            >
              <FaPaperPlane />{" "}
              {sending ? "Sending… please wait" : "Send Bulk Email"}
            </button>
          </div>
        </div>
      </div>

      {/* ================= RIGHT : LIVE PREVIEW ================= */}
      <div className="mk-card mk-preview">
        <div className="mk-preview-bar">
          <b>Live preview</b>

          <div className="mk-device">
            <button
              type="button"
              className={device === "desktop" ? "active" : ""}
              onClick={() => setDevice("desktop")}
              title="Desktop"
            >
              <FaDesktop />
            </button>
            <button
              type="button"
              className={device === "mobile" ? "active" : ""}
              onClick={() => setDevice("mobile")}
              title="Mobile"
            >
              <FaMobileAlt />
            </button>
          </div>
        </div>

        <div className="mk-preview-subject">
          <span>Subject:</span>{" "}
          {previewSubject || mail.subject || "Your subject"}
          {loadingPreview && <em className="mk-updating"> updating…</em>}
        </div>

        {previewError && <div className="mk-preview-error">{previewError}</div>}

        <div className="mk-preview-stage">
          <iframe
            title="Email preview"
            sandbox=""
            srcDoc={html}
            className={`mk-preview-frame ${device}`}
          />
        </div>

        <p className="mk-hint" style={{ marginTop: 8 }}>
          Shown with a real selected customer's name. Each recipient gets their
          own details.
        </p>
      </div>
    </div>
  );
};

export default EmailCompose;