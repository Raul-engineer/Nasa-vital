"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "./Icons";
import { LogoQuickFix } from "./Marca";
import MenuCuenta from "./MenuCuenta";
import { sesionActual } from "@/lib/cuentas";
import { AlarmaRadiacion } from "./Radiacion";
import { useAtajosDemo, useConexion } from "@/lib/useQuickFix";
import ModalQR from "./ModalQR";
import VigiaFichas from "./VigiaFichas";
import AlarmaCritica from "./AlarmaCritica";

export const ESTADO = {
  normal: { txt: "Normal", color: "text-ok", bg: "bg-ok", border: "border-ok/50", hex: "var(--color-ok)" },
  atencion: { txt: "Atención", color: "text-warn", bg: "bg-warn", border: "border-warn/60", hex: "var(--color-warn)" },
  critico: { txt: "Crítico", color: "text-crit", bg: "bg-crit", border: "border-crit/70", hex: "var(--color-crit)" },
  info: { txt: "Esfuerzo", color: "text-info", bg: "bg-info", border: "border-info/60", hex: "var(--color-info)" },
  sin: { txt: "Sin datos", color: "text-muted", bg: "bg-muted", border: "border-line", hex: "var(--color-muted)" },
};

export const ESTADO_GENERAL = { normal: "Bien", atencion: "Precaución", critico: "Actúa ahora" };

export function Dot({ estado, className = "" }) {
  return <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${ESTADO[estado]?.bg} ${className}`} />;
}

export function ChipGeneral({ estado, children, className = "" }) {
  const E = ESTADO[estado] || ESTADO.normal;
  return (
    <span className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3.5 py-2 text-xs font-semibold ${E.border} ${E.color} ${className}`}
      style={{ background: `color-mix(in oklab, ${E.hex} 9%, transparent)` }}>
      <span className="dot-estado" />
      {children}
    </span>
  );
}

const NAV = [
  { href: "/", label: "Inicio", glifo: "⌂" },
  { href: "/analisis", label: "Análisis", glifo: "◫" },
  { href: "/pruebas", label: "Pruebas", glifo: "✚" },
  { href: "/historial", label: "Historial", glifo: "◷" },
  { href: "/perfil", label: "Perfil", glifo: "♙" },
  { href: "/tripulacion", label: "Tripulación", glifo: "⚕" },
];

export function useMissionClock() {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!now) return { hora: "--:--" };
  const pad = (n) => String(n).padStart(2, "0");
  return { hora: `${pad(now.getHours())}:${pad(now.getMinutes())}` };
}

export function iniciales(nombre = "") {
  const partes = nombre.split(/\s+/).filter((p) => p && !/^(cmdr|dra?|ing|sr|sra|lic)\.?$/i.test(p));
  return partes.map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "QF";
}

export function FullscreenToggle({ className = "" }) {
  const [activo, setActivo] = useState(false);
  const [soportado, setSoportado] = useState(false);
  useEffect(() => {
    setSoportado(!!document.fullscreenEnabled);
    const f = () => setActivo(!!document.fullscreenElement);
    f();
    document.addEventListener("fullscreenchange", f);
    return () => document.removeEventListener("fullscreenchange", f);
  }, []);
  if (!soportado) return null;
  const alternar = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {}
  };
  const txt = activo ? "Salir de pantalla completa" : "Pantalla completa";
  return (
    <button onClick={alternar} aria-label={txt} title={txt} aria-pressed={activo}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-soft transition hover:border-[#8f86ff80] hover:bg-white/[0.12] hover:text-fg ${className}`}>
      {activo ? <Icon name="compress" size={18} /> : <span aria-hidden className="text-lg leading-none">⛶</span>}
    </button>
  );
}


function useAtajosNav(q) {
  const router = useRouter();
  useEffect(() => {
    const f = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.repeat) return;
      const el = e.target;
      if (el?.closest?.("input,textarea,select,[contenteditable='true']")) return;
      const i = Number(e.key) - 1;
      if (Number.isInteger(i) && NAV[i]) {
        e.preventDefault();
        router.push(NAV[i].href + q);
      }
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [q, router]);
}

export function AvisoSinConexion() {
  return (
    <div role="status" className="mb-4 flex items-center justify-center gap-2 rounded-full border border-warn/45 bg-warn/10 px-4 py-1.5 text-xs font-medium text-warn" data-sin-conexion>
      <span className="dot-estado" /> Sin conexión a la base de datos · usando datos locales
    </div>
  );
}

export function EncabezadoPagina({ titulo, sub, derecha }) {
  return (
    <div className="mb-5 mt-2 flex flex-wrap items-end justify-between gap-4 px-0.5">
      <div className="min-w-0">
        <h1 className="titulo-pagina">{titulo}</h1>
        {sub && <div className="mt-1.5 text-[13px] text-muted">{sub}</div>}
      </div>
      {derecha && <div className="flex flex-wrap items-center gap-2.5">{derecha}</div>}
    </div>
  );
}

export function Shell({ children, active, astronaut, astronauts = [], onAstronaut, astronautId, estadoGeneral, analisis, pie = true, onAbrirFicha }) {
  const router = useRouter();
  const { hora } = useMissionClock();
  const [conSesion, setConSesion] = useState(false);
  useEffect(() => {
    if (sesionActual()) setConSesion(true);
    else router.replace("/acceso");
  }, [router]);
  useAtajosDemo(astronautId);
  const q = astronautId ? `?a=${astronautId}` : "";
  useAtajosNav(q);
  const egv = analisis?.general ?? estadoGeneral;
  const eg = egv && ESTADO[egv] ? egv : null;
  const [qr, setQr] = useState(false);
  const cerrarQr = useCallback(() => setQr(false), []);
  const con = useConexion();
  if (!conSesion) return <div className="flex min-h-screen items-center justify-center text-muted">Verificando sesión…</div>;
  return (
    <div className="mx-auto min-h-screen max-w-[1540px] px-3 pb-6 pt-3 sm:px-7 sm:pt-[22px]">
      <header className="barra flex min-h-[72px] flex-wrap items-center gap-3 px-2 py-3 sm:gap-[18px] sm:px-1">
        <button type="button" onClick={() => setQr(true)} aria-label="QuickFix: controlar los datos desde el celular" title="Controla los datos desde tu celular" className="flex min-w-0 items-center gap-2.5 rounded-xl text-left drop-shadow-[0_0_14px_rgba(80,100,255,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan sm:min-w-[180px]">
          <LogoQuickFix alto={52} titulo="" />
        </button>

        <nav aria-label="Secciones" className="nav-pills order-last flex w-full flex-wrap justify-start gap-1 min-[1100px]:order-none min-[1100px]:w-auto min-[1100px]:flex-1 min-[1100px]:justify-center">
          {NAV.map((n, i) => (
            <Link key={n.href} href={n.href + q} aria-current={active === n.href ? "page" : undefined} aria-keyshortcuts={String(i + 1)} title={`${n.label} · atajo ${i + 1}`} className={`nav-pill ${active === n.href ? "activo" : ""}`}>
              <span className="nav-pill-texto">{n.label}</span>
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 min-[1100px]:ml-0">
          {eg && <ChipGeneral estado={eg} className="hidden sm:inline-flex">{ESTADO_GENERAL[eg]}</ChipGeneral>}
          <FullscreenToggle />
          <MenuCuenta astronaut={astronaut} astronauts={astronauts} onAstronaut={onAstronaut} hora={hora} q={q} />
        </div>
      </header>
      <main className="pt-5">
        {con.caido && <AvisoSinConexion />}
        <AlarmaRadiacion radiacion={analisis?.radiacion} astronautId={astronautId} />
        {children}
      </main>
      {pie && (
        <footer className="mt-8 flex flex-wrap items-center justify-center gap-2 px-1 text-center text-[11px] text-[#8a8fae]">
          <span className={`h-1.5 w-1.5 rounded-full ${con.modo === "supabase" ? "bg-ok" : "bg-warn"}`} />
          {typeof pie === "string" ? pie : "Datos simulados · Medic no diagnostica"}
        </footer>
      )}
      <ModalQR abierto={qr} onCerrar={cerrarQr} astronautId={astronautId} />
      <AlarmaCritica astronautId={astronaut?.id ?? astronautId} quien={astronaut?.nombre || "Tripulante"} esOficial={/médic/i.test(astronaut?.rol || "") || active === "/tripulacion"} />
      <VigiaFichas astronautId={astronaut?.id ?? astronautId} onAbrir={(k) => (onAbrirFicha ? onAbrirFicha(k) : router.push(`/?a=${astronaut?.id ?? astronautId}&ficha=${k}`))} />
    </div>
  );
}

export function Toast({ msg, onClose }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [msg, onClose]);
  if (!msg) return null;
  return (
    <div role="status" className="glass fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 px-5 py-3 text-sm">
      {msg}
    </div>
  );
}

export function Sparkline({ data, color = "var(--color-accent)", w = 90, h = 28 }) {
  const d = data.filter((x) => x != null && !Number.isNaN(Number(x))).map(Number);
  if (d.length < 2) return null;
  const min = Math.min(...d);
  const max = Math.max(...d);
  const pts = d.map((v, i) => `${((i / (d.length - 1)) * w).toFixed(1)},${(h - 2 - ((v - min) / (max - min || 1)) * (h - 4)).toFixed(1)}`);
  return (
    <svg width={w} height={h} className="overflow-visible" aria-hidden>
      <polyline points={pts.join(" ")} fill="none" style={{ stroke: color }} strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
