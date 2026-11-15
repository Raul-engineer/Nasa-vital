"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cerrarSesion, cuentaActual, PERFILES } from "@/lib/cuentas";

export function inicialesDe(nombre = "") {
  const partes = nombre.split(/\s+/).filter((p) => p && !/^(cmdr|dra?|ing|sr|sra|lic|mr|mrs|ms|eng)\.?$/i.test(p));
  return partes.map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "QF";
}

export function rolTexto(c) {
  if (!c) return "";
  if (c.rol === "medico") return c.especialidad ? `Physician · ${c.especialidad}` : "Crew physician";
  return `Astronaut · ${PERFILES.find((p) => p.id === Number(c.astronautId))?.puesto || "Crew"}`;
}

export function Iniciales({ nombre, tam = 38, className = "" }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#22d3ee,#8b7bff)] font-bold text-[#0b0820] shadow-[0_0_16px_#8b7bff55] ${className}`}
      style={{ width: tam, height: tam, fontSize: Math.round(tam * 0.32) }}>
      {inicialesDe(nombre)}
    </span>
  );
}

export default function MenuCuenta({ astronaut, astronauts = [], onAstronaut, hora, q = "" }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [cuenta, setCuenta] = useState(null);
  const caja = useRef(null);

  useEffect(() => {
    setCuenta(cuentaActual());
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e) => !caja.current?.contains(e.target) && setAbierto(false);
    const tecla = (e) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("pointerdown", fuera);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("pointerdown", fuera);
      document.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

  const salir = () => {
    cerrarSesion();
    router.replace("/acceso");
  };

  const nombre = cuenta?.nombre || astronaut?.nombre || "…";
  const puedeCambiar = astronauts.length > 1 && onAstronaut;

  return (
    <div ref={caja} className="relative">
      <button type="button" onClick={() => setAbierto((v) => !v)} aria-haspopup="menu" aria-expanded={abierto} aria-label={`${nombre}'s account`}
        className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-1 transition hover:bg-white/[0.06] xl:pr-3">
        <Iniciales nombre={nombre} />
        <span className="hidden text-left leading-tight xl:block">
          <span className="block text-[13px] font-semibold">{nombre}</span>
          <span className="block text-[11px] text-muted">Day {astronaut?.dia_mision ?? "…"} · {hora}</span>
        </span>
        <span aria-hidden className={`hidden text-xs text-muted transition xl:inline ${abierto ? "rotate-180" : ""}`}>▾</span>
      </button>

      {abierto && (
        <div role="menu" className="menu-cuenta glass absolute right-0 top-[calc(100%+10px)] z-50 w-[min(320px,calc(100vw-24px))] p-2">
          <div className="flex items-center gap-3 px-3 pb-3 pt-2">
            <Iniciales nombre={nombre} tam={46} />
            <div className="min-w-0">
              <div className="truncate font-display text-[15px] font-semibold">{nombre}</div>
              <div className="truncate text-xs text-muted">{cuenta?.correo || "Not signed in"}</div>
              <div className="mt-1 inline-flex rounded-full border border-[#8f86ff55] bg-[#8f86ff1a] px-2 py-0.5 text-[10.5px] text-[#c4b8ff]">{rolTexto(cuenta)}</div>
            </div>
          </div>

          {puedeCambiar && (
            <div className="border-t border-line px-1 py-2">
              <div className="px-2 pb-1.5 text-[10.5px] uppercase tracking-[0.14em] text-muted">Crew member on screen</div>
              {astronauts.map((a) => (
                <button key={a.id} type="button" role="menuitemradio" aria-checked={a.id === astronaut?.id}
                  onClick={() => { onAstronaut(a.id); setAbierto(false); }}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left text-[13px] transition hover:bg-white/[0.07] ${a.id === astronaut?.id ? "text-fg" : "text-soft"}`}>
                  <Iniciales nombre={a.nombre} tam={26} />
                  <span className="min-w-0 flex-1 truncate">{a.nombre}</span>
                  {a.id === astronaut?.id && <span className="text-[#7cc4ff]">✓</span>}
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-line px-1 py-2">
            <Link role="menuitem" href={`/cuenta${q}`} onClick={() => setAbierto(false)} className="menu-cuenta-item">
              <span aria-hidden>⚙</span> Account settings
            </Link>
            <Link role="menuitem" href={`/perfil${q}`} onClick={() => setAbierto(false)} className="menu-cuenta-item">
              <span aria-hidden>♙</span> Health profile
            </Link>
          </div>
          <div className="border-t border-line px-1 pt-2">
            <button type="button" role="menuitem" onClick={salir} className="menu-cuenta-item text-crit hover:!bg-[#ff727814]">
              <span aria-hidden>⏻</span> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
