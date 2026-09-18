import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // "autoUpdate" silently fetches new app versions in the background and
      // activates them on next load — no manual "clear cache" needed by users.
      registerType: "autoUpdate",

      // Registration is done manually in src/main.jsx via the
      // "virtual:pwa-register" module so we can show a toast when an update
      // is ready, instead of silently auto-injecting a script tag here.
      injectRegister: false,

      includeAssets: [
        "favicon.svg",
        "apple-touch-icon.png",
        "icons.svg",
      ],

      manifest: {
        name: "BlingTechCRM",
        short_name: "BlingCRM",
        description: "BlingTechCRM — manage customers, projects, tasks and your team, from your phone or desktop.",
        theme_color: "#2563eb",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },

      workbox: {
        // Precache the built app shell (JS/CSS/HTML/icons) so the app opens
        // instantly and works offline for already-visited screens.
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff,woff2}"],

        // Client-side routing (React Router): any unknown navigation request
        // should fall back to index.html instead of a 404.
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],

        // The backend API lives on a different origin (VITE_API_URL) and is
        // never precached. Deliberately no runtime caching rule is added for
        // it here, so every API request goes straight to the network as
        // normal — the CRM's live data is never served stale from cache.
        runtimeCaching: [
          {
            // Cache Google Fonts (if used) at runtime, if any are pulled in.
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },

      devOptions: {
        // Lets you test the service worker with `npm run dev` too, not just
        // in a production build.
        enabled: true,
        type: "module",
      },
    }),
  ],
});