"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "./Icons";
import { Marca } from "./Marca";
import { AlarmaRadiacion } from "./Radiacion";
import { MODO } from "@/lib/data";
import { useTheme } from "@/lib/theme";

export const ESTADO = {
  normal: { txt: "Normal", color: "text-ok", bg: "bg-ok", border: "border-ok/50", hex: "var(--color-ok)" },
  atencion: { txt: "Atención", color: "text-warn", bg: "bg-warn", border: "border-warn/60", hex: "var(--color-warn)" },
  critico: { txt: "Crítico", color: "text-crit", bg: "bg-crit", border: "border-crit/70", hex: "var(--color-crit)" },
  sin: { txt: "Sin datos", color: "text-muted", bg: "bg-muted", border: "border-line", hex: "var(--color-muted)" },
};

export const ESTADO_GENERAL = { normal: "En equilibrio", atencion: "Atención", critico: "Precaución" };

export function Dot({ estado, className = "" }) {
  return <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${ESTADO[estado]?.bg} ${className}`} />;
}

const NAV = [
  { href: "/", label: "Inicio", icon: "home" },
  { href: "/analisis", label: "Análisis", icon: "chart" },
  { href: "/pruebas", label: "Pruebas", icon: "flask" },
  { href: "/historial", label: "Historial", icon: "calendar" },
  { href: "/perfil", label: "Perfil", icon: "user" },
];

export function useMissionClock() {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!now) return { hora: "--:--", ventana: "--:--" };
  const h = now.getHours();
  const m = now.getMinutes();
  const mins = (6 * 60 - ((h * 60 + m) % (6 * 60))) % (6 * 60);
  const pad = (n) => String(n).padStart(2, "0");
  return { hora: `${pad(h)}:${pad(m)}`, ventana: `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}` };
}

export function ThemeToggle({ className = "" }) {
  const { tema, alternar } = useTheme();
  return (
    <button
      onClick={alternar}
      aria-label={tema === "light" ? "Cambiar a tema oscuro" : "Cambiar a tema claro"}
      title={tema === "light" ? "Tema oscuro" : "Tema claro"}
      className={`card flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg hover:bg-ink/5 ${className}`}
    >
      <span aria-hidden>{tema === "light" ? "🌙" : "☀"}</span>
    </button>
  );
}

export function Shell({ children, active, astronaut, astronauts = [], onAstronaut, astronautId, estadoGeneral, analisis }) {
  const { hora, ventana } = useMissionClock();
  const q = astronautId ? `?a=${astronautId}` : "";
  const egv = analisis?.general ?? estadoGeneral;
  const eg = egv && ESTADO[egv] ? egv : null;
  return (
    <div className="min-h-screen">
      <header className="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-6">
        <Link href={"/" + q} aria-label="QuickFix, ir a Inicio">
          <Marca size={42} />
        </Link>

        <nav className="card no-scrollbar order-last flex w-full items-center gap-1 overflow-x-auto rounded-2xl p-1.5 lg:order-none lg:mx-auto lg:w-auto">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href + q}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm transition ${
                active === n.href ? "bg-accent/15 text-accent glow-accent" : "text-soft hover:bg-ink/5"
              }`}
            >
              <Icon name={n.icon} size={18} />
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex flex-wrap items-center justify-end gap-2 lg:ml-0">
          {eg && (
            <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${ESTADO[eg].border} ${ESTADO[eg].color}`}
              style={{ background: `color-mix(in oklab, ${ESTADO[eg].hex} 10%, transparent)` }}>
              <Dot estado={eg} /> {ESTADO_GENERAL[eg]}
            </div>
          )}
          <div className="hidden items-center gap-2 rounded-full border border-ok/40 bg-ok/5 px-3 py-1.5 md:flex">
            <span className="relative h-2 w-2 rounded-full bg-ok text-ok pulse-ring" />
            <span className="text-xs text-soft">
              <span className="font-semibold text-ok">Modo autónomo</span> · ventana con Tierra en <span className="font-semibold text-fg">{ventana}</span>
            </span>
          </div>
          <div className="card flex items-center gap-2.5 rounded-2xl px-3 py-1.5">
            <div className="h-8 w-8 shrink-0 rounded-full bg-[radial-gradient(circle_at_35%_35%,#f59e6b,#b4472b_55%,#5b1d12)]" />
            <div className="leading-tight">
              {astronauts.length > 1 && onAstronaut ? (
                <select
                  value={astronaut?.id ?? 1}
                  onChange={(e) => onAstronaut(Number(e.target.value))}
                  aria-label="Astronauta"
                  className="cursor-pointer bg-transparent text-sm font-semibold outline-none"
                >
                  {astronauts.map((a) => (
                    <option key={a.id} value={a.id} className="bg-panel text-fg">
                      {a.nombre}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-sm font-semibold">{astronaut?.nombre ?? "…"}</div>
              )}
              <div className="text-[11px] text-muted">
                Día {astronaut?.dia_mision ?? "…"} / 500 · {hora}
              </div>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <main className="px-4 pb-8 sm:px-6">
        <AlarmaRadiacion radiacion={analisis?.radiacion} astronautId={astronautId} />
        {children}
      </main>
      <footer className="flex flex-wrap items-center justify-center gap-2 px-4 pb-4 text-center text-xs text-muted">
        <span className={`h-2 w-2 rounded-full ${MODO === "supabase" ? "bg-ok" : "bg-warn"}`} />
        {MODO === "supabase" ? "Conectado a Supabase (tiempo real)" : "Datos simulados locales"} · QuickFix · NASA Space Apps 2026 ·
        Medic no diagnostica; lo grave se escala al médico de tripulación. El índice de preparación es orientativo.
      </footer>
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
    <div role="status" className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-xl border border-accent/40 bg-panel px-5 py-3 text-sm shadow-2xl glow-accent">
      {msg}
    </div>
  );
}

export function Sparkline({ data, color = "var(--color-violet)", w = 90, h = 28 }) {
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
