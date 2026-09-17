// 📁 src/hooks/useResponsive.js
//
// Single source of truth for breakpoints, shared by JS and CSS.
// Keep these numbers in sync with src/styles/responsive.css.

import { useEffect, useState } from "react";

export const BREAKPOINTS = {
  smallPhone: 380,
  phone: 600,
  largePhone: 768,
  tablet: 1024,
  laptop: 1280,
};

/**
 * Returns true while the viewport matches the given media query.
 * @param {string} query e.g. "(max-width: 1024px)"
 */
export function useMediaQuery(query) {
  const get = () =>
    typeof window !== "undefined" && window.matchMedia(query).matches;

  const [matches, setMatches] = useState(get);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);

    setMatches(mql.matches);

    // Safari < 14 support
    if (mql.addEventListener) {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, [query]);

  return matches;
}

/** True at tablet width and below — the point where the sidebar becomes a drawer. */
export function useIsMobile() {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.tablet}px)`);
}

/** True on phones. */
export function useIsPhone() {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.largePhone}px)`);
}

/** Locks background scrolling while a drawer or sheet is open. */
export function useBodyScrollLock(locked) {
  useEffect(() => {
    if (!locked) return undefined;
    document.body.classList.add("sidebar-locked");
    return () => document.body.classList.remove("sidebar-locked");
  }, [locked]);
}

export default useIsMobile;