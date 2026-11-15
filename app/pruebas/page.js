"use client";
import { useCallback, useEffect, useState } from "react";
import { EncabezadoPagina, Shell, Toast } from "@/components/Shell";
import CyberButton from "@/components/CyberButton";
import { Icon } from "@/components/Icons";
import { GlowingEffect } from "@/components/Effects";
import { EstadoPill, Fuente } from "@/components/Widgets";
import { INFO_PRUEBAS, PruebaRunner } from "@/components/Pruebas";
import { useAstronautId, useQuickFix } from "@/lib/useQuickFix";
import { PRUEBAS } from "@/lib/analysis";
import { MEDIC } from "@/lib/medic";

const DESENLACE = { mejoro: ["normal", "Mejoró"], igual: ["atencion", "Sin cambio"], empeoro: ["critico", "Empeoró"] };
const ORDEN = ["checkin", "remedicion", "ortostatica", "reaccion", "who5", "phq9", "gad7", "amsler"];

export default function Pruebas() {
  const [aid, setAid] = useAstronautId();
  const { data, analisis, loading, error } = useQuickFix(aid);
  const [abierta, setAbierta] = useState(null);
  const [toast, setToast] = useState(null);
  const closeToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("t");
    if (t && PRUEBAS[t]) setAbierta(t);
  }, []);

  if (error) return <div className="p-10 text-crit">No se pudieron cargar los datos: {error}</div>;
  if (loading || !analisis) return <div className="flex min-h-screen items-center justify-center text-muted">Cargando pruebas…</div>;

  const { astronaut, astronauts, pruebas } = data;
  const recientes = [...pruebas].sort((a, b) => String(b.creada_en || b.fecha).localeCompare(String(a.creada_en || a.fecha))).slice(0, 12);
  const abrir = (t) => {
    setAbierta(t);
    setTimeout(() => document.getElementById("prueba-activa")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  return (
    <Shell active="/pruebas" astronaut={astronaut} astronauts={astronauts} onAstronaut={setAid} astronautId={aid} analisis={analisis}>
      <EncabezadoPagina titulo="Pruebas" sub={`${ORDEN.length} pruebas · check-in diario primero`} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ORDEN.map((t) => (
          <article key={t} className={`card relative flex flex-col p-5 ${abierta === t ? "glow-accent" : ""}`}>
            <GlowingEffect />
            <div className="flex items-center justify-between gap-2">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent"><Icon name={PRUEBAS[t].icono} size={24} /></span>
              <span className="flex items-center gap-1 rounded-full border border-line px-2.5 py-0.5 text-xs text-muted"><Icon name="clock" size={14} /> {PRUEBAS[t].duracion}</span>
            </div>
            <h2 className="mt-3 text-lg font-semibold">{PRUEBAS[t].nombre}</h2>
            <p className="mt-1 text-sm text-soft">{INFO_PRUEBAS[t].descripcion}</p>
            <div className="mt-3 rounded-xl border border-line bg-ink/[0.03] p-3 text-sm">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted">Para qué sirve</div>
              <div className="mt-0.5">{INFO_PRUEBAS[t].para}</div>
            </div>
            <Fuente className="mt-2" ids={PRUEBAS[t].fuente} />
            <div className="mt-auto pt-4">
              <CyberButton onClick={() => abrir(t)} activo={abierta === t} atajo="↵" className="w-full" texto={abierta === t ? "Prueba abierta" : "Hacer la prueba"}>
                {abierta === t ? "Prueba abierta" : "Hacer la prueba"}
              </CyberButton>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section id="prueba-activa" className="card scroll-mt-4 p-5">
          {abierta ? (
            <>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Icon name={PRUEBAS[abierta].icono} className="text-accent" size={26} />
                  <div>
                    <h2 className="text-lg font-semibold">{PRUEBAS[abierta].nombre}</h2>
                    <div className="text-xs text-muted">{MEDIC.aviso}</div>
                  </div>
                </div>
                <button onClick={() => setAbierta(null)} aria-label="Cerrar prueba" className="rounded-lg p-1 text-muted hover:bg-ink/10"><Icon name="x" /></button>
              </div>
              <div className="mx-auto max-w-xl">
                <PruebaRunner key={`${aid}-${abierta}`} tipo={abierta} astronautId={aid} analisis={analisis} onToast={setToast} />
              </div>
            </>
          ) : (
            <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 text-center text-muted">
              <Icon name="flask" size={36} />
              Elige una prueba del catálogo para empezar.
            </div>
          )}
        </section>

        <section className="card p-5">
          <h2 className="mb-3 font-semibold">Historial reciente</h2>
          {recientes.length === 0 ? (
            <p className="text-sm text-muted">Aún no hay pruebas registradas para {astronaut.nombre}.</p>
          ) : (
            <ul className="space-y-2">
              {recientes.map((p, i) => {
                const d = !p.resultado?.alerta && p.desenlace === "mejoro" ? ["normal", "En rango"] : DESENLACE[p.desenlace];
                const fecha = p.creada_en ? new Date(p.creada_en) : new Date(p.fecha + "T12:00:00");
                return (
                  <li key={p.id || i} className="rounded-xl border border-line p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <Icon name={PRUEBAS[p.tipo]?.icono || "flask"} size={16} className="text-accent" /> {PRUEBAS[p.tipo]?.nombre || p.tipo}
                      </span>
                      {d ? <EstadoPill estado={d[0]}>{d[1]}</EstadoPill> : <EstadoPill estado="normal">Registrada</EstadoPill>}
                    </div>
                    <div className="mt-1 text-xs text-soft">{p.interpretacion}</div>
                    <div className="mt-1 text-[11px] text-muted">
                      {fecha.toLocaleDateString("es-MX", { day: "numeric", month: "short" })} · {fecha.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false })}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
      <Toast msg={toast} onClose={closeToast} />
    </Shell>
  );
}
