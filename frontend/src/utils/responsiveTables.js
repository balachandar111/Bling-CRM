// 📁 src/utils/responsiveTables.js
//
// Mobile support for every table in the CRM, app-wide, without editing each page.
//
// Horizontal scrolling is handled purely in CSS (responsive.css uses :has(> table)),
// so this file never moves or wraps DOM nodes — React stays in full control of the
// tree and cannot hit a "removeChild on a node it does not own" error.
//
// All this does is copy each column heading onto its cells as data-label. That
// attribute powers the optional stacked card layout: add the class
// "cards-on-mobile" to any <table> and it turns into labelled cards under 600px.
//
// It runs once at startup and then watches for tables React renders later
// (tab switches, modals, async data).

function labelCells(table) {
  const headerRow = table.tHead?.rows?.[0] || table.rows?.[0];
  if (!headerRow) return;

  const headers = Array.from(headerRow.cells).map((cell) =>
    (cell.innerText || cell.textContent || "").trim()
  );
  if (!headers.some(Boolean)) return;

  const bodies = table.tBodies.length ? Array.from(table.tBodies) : [table];

  bodies.forEach((body) => {
    Array.from(body.rows).forEach((row) => {
      Array.from(row.cells).forEach((cell, i) => {
        if (cell.tagName === "TH") return;
        const label = headers[i];
        if (label && cell.getAttribute("data-label") !== label) {
          // Attribute-only change: safe for React, and ignored by our observer.
          cell.setAttribute("data-label", label);
        }
      });
    });
  });
}

function processAll() {
  document.querySelectorAll("table").forEach(labelCells);
}

let observer = null;
let scheduled = false;

function schedule() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(() => {
    scheduled = false;
    processAll();
  });
}

export function initResponsiveTables() {
  if (typeof window === "undefined" || observer) return;

  schedule();

  observer = new MutationObserver((mutations) => {
    if (mutations.some((m) => m.addedNodes.length)) schedule();
  });

  // childList only — attribute changes never re-trigger this.
  observer.observe(document.body, { childList: true, subtree: true });
}

export function stopResponsiveTables() {
  observer?.disconnect();
  observer = null;
}

export default initResponsiveTables;
