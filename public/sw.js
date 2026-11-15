const CACHE = "quickfix-v3";
const PAGINAS = ["/", "/analisis", "/pruebas", "/historial", "/perfil", "/reloj", "/bienvenida", "/tripulacion"];
const ASSETS = [
  "/favicon.png",
  "/esqueleto.webp",
  "/manifest.webmanifest",
  "/logo-quickfix.png",
  "/logo-quickfix-oscuro.png",
  "/logo-quickfix-icono.png",
  "/logo-quickfix-icono-oscuro.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => Promise.all([...PAGINAS, ...ASSETS].map((u) => c.add(new Request(u, { cache: "reload" })).catch(() => null))))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

async function redPrimero(req) {
  const c = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res.ok) c.put(req, res.clone());
    return res;
  } catch {
    const guardada = await c.match(req, { ignoreSearch: req.mode === "navigate" });
    if (guardada) return guardada;
    if (req.mode === "navigate") return (await c.match("/")) || Response.error();
    return Response.error();
  }
}

async function cachePrimero(req) {
  const c = await caches.open(CACHE);
  const guardada = await c.match(req);
  if (guardada) return guardada;
  const res = await fetch(req);
  if (res.ok) c.put(req, res.clone());
  return res;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/_next/static/") || ASSETS.includes(url.pathname) || url.pathname.startsWith("/icons/")) {
    e.respondWith(cachePrimero(req));
    return;
  }
  e.respondWith(redPrimero(req));
});
