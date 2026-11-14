"use client";
import { useCallback, useEffect, useId, useRef, useState } from "react";

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const f = () => setReduced(m.matches);
    f();
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return reduced;
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const glowSubs = new Set();
let glowPointer = null;
let glowFrame = 0;
let glowIdle = 0;

function glowTick() {
  glowFrame = 0;
  const subs = [...glowSubs];
  const medidas = subs.map((s) => s.measure());
  subs.forEach((s, i) => s.apply(glowPointer, medidas[i]));
}
function glowSchedule() {
  if (!glowFrame) glowFrame = requestAnimationFrame(glowTick);
}
function glowOnPointer(e) {
  glowPointer = { x: e.clientX, y: e.clientY };
  glowSchedule();
  clearTimeout(glowIdle);
  if (e.pointerType !== "mouse") {
    glowIdle = setTimeout(() => {
      glowPointer = null;
      glowSchedule();
    }, 1200);
  }
}
function glowOnLeave() {
  glowPointer = null;
  glowSchedule();
}
function glowOnScroll() {
  if (glowPointer) glowSchedule();
}
function subscribeGlow(sub) {
  if (!glowSubs.size) {
    window.addEventListener("pointermove", glowOnPointer, { passive: true });
    window.addEventListener("pointerdown", glowOnPointer, { passive: true });
    window.addEventListener("scroll", glowOnScroll, { passive: true, capture: true });
    window.addEventListener("blur", glowOnLeave);
    document.documentElement.addEventListener("mouseleave", glowOnLeave);
  }
  glowSubs.add(sub);
  return () => {
    glowSubs.delete(sub);
    if (!glowSubs.size) {
      window.removeEventListener("pointermove", glowOnPointer);
      window.removeEventListener("pointerdown", glowOnPointer);
      window.removeEventListener("scroll", glowOnScroll, { capture: true });
      window.removeEventListener("blur", glowOnLeave);
      document.documentElement.removeEventListener("mouseleave", glowOnLeave);
    }
  };
}

export function GlowingEffect({ proximity = 64, spread = 48, width = 1.5 }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    const host = el?.parentElement;
    if (!el || !host || reduced) return;
    let on = false;
    return subscribeGlow({
      measure: () => host.getBoundingClientRect(),
      apply: (p, r) => {
        const near =
          !!p && p.x > r.left - proximity && p.x < r.right + proximity && p.y > r.top - proximity && p.y < r.bottom + proximity;
        if (near !== on) {
          el.style.setProperty("--glow-on", near ? "1" : "0");
          on = near;
        }
        if (!near) return;
        const ang = (Math.atan2(p.x - (r.left + r.width / 2), -(p.y - (r.top + r.height / 2))) * 180) / Math.PI;
        el.style.setProperty("--glow-angle", `${ang.toFixed(1)}deg`);
      },
    });
  }, [proximity, reduced]);
  return (
    <div
      ref={ref}
      aria-hidden
      className="glow-effect"
      style={{ "--glow-spread": `${spread}deg`, "--glow-width": `${width}px` }}
    />
  );
}

export function CardSpotlight({ className = "", radius = 340, children, ...rest }) {
  const ref = useRef(null);
  const spot = useRef(null);
  const frame = useRef(0);
  const reduced = useReducedMotion();

  const move = (e) => {
    if (reduced || !ref.current || !spot.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const s = spot.current;
      if (!s) return;
      s.style.setProperty("--sx", `${x}px`);
      s.style.setProperty("--sy", `${y}px`);
      s.style.opacity = "1";
    });
  };
  const leave = () => {
    cancelAnimationFrame(frame.current);
    if (spot.current) spot.current.style.opacity = "0";
  };
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  return (
    <div ref={ref} onPointerMove={move} onPointerDown={move} onPointerLeave={leave} className={`relative isolate ${className}`} {...rest}>
      <div ref={spot} aria-hidden className="card-spotlight" style={{ "--spot-r": `${radius}px` }} />
      {children}
    </div>
  );
}

function anguloPantalla() {
  const a = window.screen?.orientation?.angle ?? window.orientation ?? 0;
  return ((a % 360) + 360) % 360;
}

export function Card3D({ className = "", children, max = 15 }) {
  const outer = useRef(null);
  const inner = useRef(null);
  const reduced = useReducedMotion();
  const [modo, setModo] = useState("quieto");
  const st = useRef({ tx: 0, ty: 0, x: 0, y: 0, raf: 0, base: null, visible: true });

  const kick = useCallback(() => {
    const s = st.current;
    if (s.raf) return;
    const step = () => {
      s.x += (s.tx - s.x) * 0.12;
      s.y += (s.ty - s.y) * 0.12;
      if (Math.abs(s.tx - s.x) < 0.02 && Math.abs(s.ty - s.y) < 0.02) {
        s.x = s.tx;
        s.y = s.ty;
        s.raf = 0;
      } else {
        s.raf = requestAnimationFrame(step);
      }
      if (inner.current) inner.current.style.transform = `rotateX(${s.x.toFixed(2)}deg) rotateY(${s.y.toFixed(2)}deg)`;
    };
    s.raf = requestAnimationFrame(step);
  }, []);

  const apuntar = useCallback(
    (rx, ry) => {
      const s = st.current;
      s.tx = clamp(rx, -max, max);
      s.ty = clamp(ry, -max, max);
      kick();
    },
    [kick, max]
  );

  const onOrientacion = useCallback(
    (e) => {
      if (e.beta == null || e.gamma == null) return;
      const s = st.current;
      if (!s.visible) return;
      const ang = anguloPantalla();
      let dx = e.gamma;
      let dy = e.beta;
      if (ang === 90) {
        dx = e.beta;
        dy = -e.gamma;
      } else if (ang === 270) {
        dx = -e.beta;
        dy = e.gamma;
      } else if (ang === 180) {
        dx = -e.gamma;
        dy = -e.beta;
      }
      if (!s.base || s.base.ang !== ang) s.base = { dx, dy, ang };
      s.base.dx += (dx - s.base.dx) * 0.003;
      s.base.dy += (dy - s.base.dy) * 0.003;
      apuntar(dy - s.base.dy, dx - s.base.dx);
      setModo((m) => (m === "giroscopio" ? m : "giroscopio"));
    },
    [apuntar]
  );

  const escucharGiroscopio = useCallback(() => {
    window.addEventListener("deviceorientation", onOrientacion);
  }, [onOrientacion]);

  useEffect(() => {
    const s = st.current;
    if (reduced) {
      s.tx = s.ty = s.x = s.y = 0;
      if (inner.current) inner.current.style.transform = "";
      setModo("quieto");
      return;
    }
    const raton = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (raton) {
      setModo("raton");
      return;
    }
    if (typeof window.DeviceOrientationEvent === "undefined") return;
    if (typeof window.DeviceOrientationEvent.requestPermission === "function") setModo("permiso");
    escucharGiroscopio();
    return () => window.removeEventListener("deviceorientation", onOrientacion);
  }, [reduced, onOrientacion, escucharGiroscopio]);

  useEffect(() => {
    const el = outer.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([en]) => {
      st.current.visible = en.isIntersecting;
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => () => cancelAnimationFrame(st.current.raf), []);

  async function pedirPermiso() {
    try {
      const r = await window.DeviceOrientationEvent.requestPermission();
      if (r === "granted") {
        escucharGiroscopio();
        setModo("esperando");
      } else setModo("sin-permiso");
    } catch {
      setModo("sin-permiso");
    }
  }

  const onMove = (e) => {
    if (modo !== "raton" || e.pointerType !== "mouse") return;
    const r = outer.current.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
    apuntar(-ny * max, nx * max);
  };
  const onLeave = () => {
    if (modo === "raton") apuntar(0, 0);
  };

  return (
    <div ref={outer} onPointerMove={onMove} onPointerLeave={onLeave} className={`card3d ${className}`}>
      <div ref={inner} className="card3d-inner">
        {children}
      </div>
      {modo === "permiso" && (
        <button
          onClick={pedirPermiso}
          className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/50 bg-space/80 px-3 py-1 text-[11px] text-accent"
        >
          Activar movimiento
        </button>
      )}
    </div>
  );
}

export function Layer({ z = 0, className = "", style, children }) {
  return (
    <div className={className} style={{ ...style, transform: `translateZ(${z}px)` }}>
      {children}
    </div>
  );
}

function beamPath(i) {
  const x = -320 + i * 48;
  return `M${x} -60C${x + 150} 140 ${x + 250} 260 ${x + 430} 300C${x + 610} 340 ${x + 700} 520 ${x + 820} 680`;
}

export function BackgroundBeams({ count = 14, className = "" }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const paths = Array.from({ length: count }, (_, i) => beamPath(i * (14 / count)));
  return (
    <svg
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <defs>
        <linearGradient id={`bb-${uid}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="800" y2="600">
          <stop offset="0%" stopColor="#c8102e" />
          <stop offset="55%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#c8102e" />
        </linearGradient>
      </defs>
      <g stroke="#a09cc4" strokeOpacity="0.1" strokeWidth="0.8">
        {paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <g stroke={`url(#bb-${uid})`} strokeWidth="1.6" strokeLinecap="round">
        {paths.map((d, i) => (
          <path
            key={i}
            d={d}
            pathLength="1"
            className="beam"
            style={{ animationDuration: `${7 + ((i * 7) % 6)}s`, animationDelay: `${-((i * 1.7) % 9)}s` }}
          />
        ))}
      </g>
    </svg>
  );
}
