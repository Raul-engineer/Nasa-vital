export default function manifest() {
  return {
    name: "QuickFix",
    short_name: "QuickFix",
    description: "Health monitoring for astronauts",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#05040e",
    theme_color: "#05040e",
    lang: "en-US",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
