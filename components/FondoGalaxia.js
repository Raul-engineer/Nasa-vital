"use client";
import { useEffect, useRef, useState } from "react";

const PARADAS = [[255, 236, 200], [205, 212, 255], [140, 130, 255], [95, 75, 205]];

function colorBrazo(t) {
  const p = t * (PARADAS.length - 1);
  const i = Math.min(Math.floor(p), PARADAS.length - 2);
  const f = p - i;
  return PARADAS[i].map((v, k) => Math.round(v + (PARADAS[i + 1][k] - v) * f));
}

const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

function mancha(rgb, tam = 128) {
  const c = document.createElement("canvas");
  c.width = c.height = tam;
  const g = c.getContext("2d");
  const k = rgb.join(",");
  const gr = g.createRadialGradient(tam / 2, tam / 2, 0, tam / 2, tam / 2, tam / 2);
  gr.addColorStop(0, `rgba(${k},1)`);
  gr.addColorStop(0.45, `rgba(${k},.35)`);
  gr.addColorStop(1, `rgba(${k},0)`);
  g.fillStyle = gr;
  g.fillRect(0, 0, tam, tam);
  return c;
}

function destello() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 10);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  for (const [w, h] of [[64, 1.4], [1.4, 64]]) {
    const l = w > h ? g.createLinearGradient(0, 0, 64, 0) : g.createLinearGradient(0, 0, 0, 64);
    l.addColorStop(0, "rgba(200,215,255,0)");
    l.addColorStop(0.5, "rgba(230,238,255,.9)");
    l.addColorStop(1, "rgba(200,215,255,0)");
    g.fillStyle = l;
    g.fillRect(32 - w / 2, 32 - h / 2, w, h);
  }
  return c;
}

function pintarGalaxia(R, dpr) {
  const lado = Math.ceil(R * 2.5 * dpr);
  const c = document.createElement("canvas");
  c.width = c.height = lado;
  const g = c.getContext("2d");
  g.translate(lado / 2, lado / 2);
  g.scale(dpr, dpr);

  const neb = g.createRadialGradient(0, 0, 0, 0, 0, R * 1.2);
  neb.addColorStop(0, "rgba(120,90,255,.22)");
  neb.addColorStop(0.6, "rgba(80,60,200,.09)");
  neb.addColorStop(1, "rgba(60,40,160,0)");
  g.fillStyle = neb;
  g.fillRect(-R * 1.25, -R * 1.25, R * 2.5, R * 2.5);

  g.globalCompositeOperation = "lighter";
  const tonos = {};
  for (let q = 0; q < 420; q++) {
    const r = Math.pow(Math.random(), 0.95) * 0.95;
    const t = (q % 2) * Math.PI + r * 5.4 + gauss() * 0.22;
    let tono = r < 0.25 ? [255, 215, 170] : r < 0.6 ? [110, 130, 255] : [140, 90, 255];
    if (Math.random() < 0.1) tono = [255, 130, 210];
    const k = tono.join(",");
    const img = (tonos[k] = tonos[k] || mancha(tono));
    const d = (0.07 + Math.random() * 0.15) * R * 2;
    g.globalAlpha = (r < 0.25 ? 0.015 : 0.05) + Math.random() * (r < 0.25 ? 0.025 : 0.1);
    g.drawImage(img, Math.cos(t) * r * R - d / 2, Math.sin(t) * r * R - d / 2, d, d);
  }

  g.globalCompositeOperation = "source-over";
  for (let n = 0; n < 1800; n++) {
    const r = 0.12 + Math.random() * 0.75;
    const t = (n % 2) * Math.PI + r * 5.4 - 0.16 + gauss() * 0.1;
    const d = (0.012 + Math.random() * 0.03) * R;
    g.globalAlpha = 0.05 + Math.random() * 0.08;
    g.fillStyle = "#05030d";
    g.beginPath();
    g.arc(Math.cos(t) * r * R, Math.sin(t) * r * R, d, 0, Math.PI * 2);
    g.fill();
  }

  g.globalCompositeOperation = "lighter";
  for (let n = 0; n < 14000; n++) {
    let r = Math.random();
    let t;
    if (Math.random() < 0.14) t = Math.random() * Math.PI * 2;
    else t = (n % 2) * Math.PI + r * 5.4 + gauss() * (0.26 + (1 - r) * 0.2);
    r = Math.max(0, r + gauss() * 0.03);
    const rgb = Math.random() < 0.06 && r > 0.3 ? [255, 150, 215] : colorBrazo(Math.min(r * 1.05, 1));
    g.globalAlpha = r < 0.2 ? 0.3 : [0.3, 0.55, 0.9][Math.floor(Math.random() * 3)];
    g.fillStyle = `rgb(${rgb.join(",")})`;
    const s = (0.6 + Math.random() * 1.3 + (1 - r) * 0.6) / Math.max(1, dpr * 0.75);
    g.fillRect(Math.cos(t) * r * R - s / 2, Math.sin(t) * r * R - s / 2, s, s);
  }

  g.globalAlpha = 1;
  const nucleo = g.createRadialGradient(0, 0, 0, 0, 0, R * 0.42);
  nucleo.addColorStop(0, "rgba(255,240,215,.75)");
  nucleo.addColorStop(0.18, "rgba(255,210,160,.35)");
  nucleo.addColorStop(0.5, "rgba(255,190,140,.1)");
  nucleo.addColorStop(1, "rgba(255,190,140,0)");
  g.fillStyle = nucleo;
  g.fillRect(-R, -R, R * 2, R * 2);
  return { lienzo: c, lado: lado / dpr };
}

function hash(x, y) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function ruido(x, y, P) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = ((xi % P) + P) % P, b = (a + 1) % P;
  const n00 = hash(a, yi), n10 = hash(b, yi), n01 = hash(a, yi + 1), n11 = hash(b, yi + 1);
  return n00 + (n10 - n00) * u + (n01 - n00) * v + (n00 - n10 - n01 + n11) * u * v;
}

function fbm(x, y, P, oct = 5) {
  let s = 0, amp = 0.5, f = 1;
  for (let o = 0; o < oct; o++) {
    s += ruido(x * f, y * f, P * f) * amp;
    amp *= 0.5;
    f *= 2;
  }
  return s;
}

const mezcla = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

function texturaMarte() {
  const W = 512, H = 256, P = 8;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  const img = g.createImageData(W, H);
  const oscuro = [92, 34, 18], medio = [182, 82, 40], claro = [228, 140, 88], polo = [246, 236, 228];
  for (let j = 0; j < H; j++) {
    const lat = Math.abs(j / H - 0.5) * 2;
    for (let i = 0; i < W; i++) {
      const x = (i / W) * P, y = (j / H) * 4;
      const n = fbm(x, y, P);
      const m = fbm(x * 0.5 + 3.1, y * 0.5 + 7.7, P / 2, 4);
      let col = n < 0.5 ? mezcla(oscuro, medio, Math.min(1, Math.max(0, (n - 0.25) / 0.25))) : mezcla(medio, claro, Math.min(1, (n - 0.5) / 0.22));
      if (m < 0.42) col = mezcla(col, oscuro, Math.min(0.75, (0.42 - m) * 6));
      const borde = 0.84 + (fbm(x * 2, y, P * 2, 3) - 0.5) * 0.14;
      if (lat > borde) col = mezcla(col, polo, Math.min(1, (lat - borde) * 18));
      const k = (j * W + i) * 4;
      img.data[k] = col[0];
      img.data[k + 1] = col[1];
      img.data[k + 2] = col[2];
      img.data[k + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  g.globalCompositeOperation = "multiply";
  const valle = g.createLinearGradient(0, H * 0.52, 0, H * 0.56);
  valle.addColorStop(0, "rgba(255,255,255,1)");
  valle.addColorStop(0.5, "rgba(120,60,40,1)");
  valle.addColorStop(1, "rgba(255,255,255,1)");
  g.fillStyle = valle;
  g.fillRect(W * 0.18, H * 0.52, W * 0.26, H * 0.04);
  g.globalCompositeOperation = "source-over";
  for (let q = 0; q < 90; q++) {
    const r = 1.5 + Math.random() ** 2 * 9;
    const x = Math.random() * W, y = H * 0.12 + Math.random() * H * 0.76;
    for (const dx of [-W, 0, W]) {
      const gr = g.createRadialGradient(x + dx - r * 0.2, y - r * 0.2, 0, x + dx, y, r);
      gr.addColorStop(0, "rgba(60,20,10,.45)");
      gr.addColorStop(0.75, "rgba(60,20,10,.15)");
      gr.addColorStop(0.9, "rgba(255,190,150,.28)");
      gr.addColorStop(1, "rgba(255,190,150,0)");
      g.fillStyle = gr;
      g.beginPath();
      g.arc(x + dx, y, r, 0, Math.PI * 2);
      g.fill();
    }
  }
  return c.toDataURL("image/jpeg", 0.9);
}

const VIDEO = "/video/galaxia.mp4";
const VIDEO_MOVIL = "/video/galaxia-movil.mp4";

export default function FondoGalaxia() {
  const lienzo = useRef(null);
  const raiz = useRef(null);
  const video = useRef(null);
  const videoListo = useRef(false);
  const [textura, setTextura] = useState(null);
  const [conVideo, setConVideo] = useState(false);

  useEffect(() => {
    const v = video.current;
    if (!v || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    v.src = window.innerWidth < 900 ? VIDEO_MOVIL : VIDEO;
    v.play().catch(() => {});
  }, []);

  const alReproducir = () => {
    videoListo.current = true;
    setConVideo(true);
  };

  useEffect(() => {
    setTextura(texturaMarte());
  }, []);

  useEffect(() => {
    const cv = lienzo.current;
    const ctx = cv.getContext("2d");
    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W, H, DPR, cx, cy, R, galaxia, raf = 0;
    let mx = 0, my = 0, px = 0, py = 0;
    const brillo = destello();
    const capas = [0.25, 0.55, 1].map((prof, i) =>
      Array.from({ length: [260, 140, 40][i] }, () => ({ x: Math.random(), y: Math.random(), t: 0.4 + Math.random() * (0.6 + prof), f: Math.random() * 6.28, v: 0.0008 + Math.random() * 0.002, prof }))
    );
    const grandes = Array.from({ length: 9 }, () => ({ x: Math.random(), y: Math.random(), s: 14 + Math.random() * 18, f: Math.random() * 6.28 }));
    const nubesFondo = [
      { x: 0.82, y: 0.2, r: 0.42, c: [56, 70, 190], a: 0.16 },
      { x: 0.12, y: 0.15, r: 0.35, c: [150, 70, 200], a: 0.1 },
      { x: 0.7, y: 0.9, r: 0.45, c: [200, 80, 60], a: 0.08 },
    ].map((n) => ({ ...n, img: mancha(n.c, 256) }));
    let fugaz = null, proxima = 3000;

    const medir = () => {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      cv.width = W * DPR;
      cv.height = H * DPR;
      const ancho = W > 900;
      cx = ancho ? W * 0.33 : W * 0.5;
      cy = ancho ? H * 0.68 : H * 0.42;
      R = Math.min(W * (ancho ? 0.31 : 0.85), H * (ancho ? 0.95 : 0.6));
      galaxia = pintarGalaxia(R, DPR);
    };

    const dibujar = (t) => {
      px += (mx - px) * 0.04;
      py += (my - py) * 0.04;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      const fondo = ctx.createLinearGradient(0, 0, 0, H);
      fondo.addColorStop(0, "#0a0618");
      fondo.addColorStop(1, "#05030d");
      ctx.fillStyle = fondo;
      ctx.fillRect(0, 0, W, H);

      ctx.globalCompositeOperation = "lighter";
      const deriva = reducir ? 0 : t * 0.000004;
      for (const n of nubesFondo) {
        const d = n.r * Math.max(W, H) * 2;
        ctx.globalAlpha = n.a;
        ctx.drawImage(n.img, (n.x + Math.sin(deriva * 40 + n.x * 9) * 0.02) * W - d / 2 - px * 6, n.y * H - d / 2 - py * 6, d, d);
      }

      ctx.fillStyle = "#fff";
      for (const capa of capas) {
        for (const e of capa) {
          ctx.globalAlpha = reducir ? 0.7 : 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * e.v + e.f));
          const x = (((e.x * W - px * 18 * e.prof - t * 0.004 * e.prof) % W) + W) % W;
          ctx.fillRect(x, e.y * H - py * 18 * e.prof, e.t, e.t);
        }
      }
      for (const b of grandes) {
        ctx.globalAlpha = reducir ? 0.6 : 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * 0.0012 + b.f));
        ctx.drawImage(brillo, b.x * W - b.s / 2 - px * 22, b.y * H - b.s / 2 - py * 22, b.s, b.s);
      }

      ctx.globalAlpha = 1;
      ctx.save();
      ctx.translate(cx - px * 12, cy - py * 12);
      ctx.rotate(-0.38);
      ctx.scale(1, 0.5);
      ctx.rotate(reducir ? 0 : t * 0.00004);
      ctx.drawImage(galaxia.lienzo, -galaxia.lado / 2, -galaxia.lado / 2, galaxia.lado, galaxia.lado);
      ctx.restore();

      if (!reducir) {
        if (!fugaz && t > proxima) fugaz = { x: W * (0.45 + Math.random() * 0.5), y: H * Math.random() * 0.35, t0: t };
        if (fugaz) {
          const d = (t - fugaz.t0) / 900;
          if (d > 1) {
            fugaz = null;
            proxima = t + 4000 + Math.random() * 7000;
          } else {
            const x = fugaz.x - d * 380, y = fugaz.y + d * 170;
            const g = ctx.createLinearGradient(x, y, x + 110, y - 48);
            g.addColorStop(0, `rgba(255,255,255,${1 - d})`);
            g.addColorStop(1, "rgba(160,190,255,0)");
            ctx.strokeStyle = g;
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + 110, y - 48);
            ctx.stroke();
          }
        }
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    };

    const bucle = (t) => {
      if (videoListo.current) {
        raf = 0;
        return;
      }
      dibujar(t);
      raf = requestAnimationFrame(bucle);
    };
    const redimensionar = () => {
      medir();
      if (reducir) dibujar(0);
    };
    const mover = (e) => {
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
      raiz.current?.style.setProperty("--px", mx.toFixed(3));
      raiz.current?.style.setProperty("--py", my.toFixed(3));
    };

    medir();
    window.addEventListener("resize", redimensionar);
    if (reducir) dibujar(0);
    else {
      window.addEventListener("mousemove", mover);
      raf = requestAnimationFrame(bucle);
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", redimensionar);
      window.removeEventListener("mousemove", mover);
    };
  }, []);

  return (
    <div ref={raiz} className="galaxia" aria-hidden>
      <canvas ref={lienzo} className="galaxia-lienzo" />
      <video ref={video} className={`galaxia-video ${conVideo ? "lista" : ""}`} muted loop playsInline preload="auto" onPlaying={alReproducir} />
      <div className="marte">
        <div className="marte-flota">
          <div className="luna-x">
            <div className="luna-y"><span className="luna" /></div>
          </div>
          <div className="marte-halo" />
          <div className="marte-globo">
            <div className="marte-tira" style={textura ? { backgroundImage: `url(${textura})` } : undefined} />
            <div className="marte-sombra" />
          </div>
        </div>
      </div>
      <div className="galaxia-velo" />
    </div>
  );
}
