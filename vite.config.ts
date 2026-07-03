import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "icon.svg",
        "apple-touch-icon.svg",
        "icons/icon-180x180.png",
        "icons/icon-192x192.png",
        "icons/icon-512x512.png"
      ],
      manifest: {
        name: "轻日历",
        short_name: "日历",
        description: "一款本地优先的 PWA H5 日历应用",
        theme_color: "#f04444",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        start_url: ".",
        scope: ".",
        icons: [
          {
            src: "icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,ico,png}"],
        navigateFallback: "index.html"
      }
    })
  ]
});
