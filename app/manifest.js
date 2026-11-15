export default function manifest() {
  return {
    name: "QuickFix",
    short_name: "QuickFix",
    description: "Monitoreo de salud para astronautas",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#100f13",
    theme_color: "#100f13",
    lang: "es-MX",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
