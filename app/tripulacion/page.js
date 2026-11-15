"use client";
import { ChipGeneral, EncabezadoPagina, ESTADO_GENERAL, iniciales, Shell } from "@/components/Shell";
import PanelTripulante, { motivoGeneral } from "@/components/PanelTripulante";
import { useAstronautId, useQuickFix } from "@/lib/useQuickFix";

function TarjetaTripulante({ id, activo, onElegir }) {
  const { data, analisis } = useQuickFix(id);
  if (!analisis) return <div className="glass min-h-[150px] p-5 text-muted">Loading…</div>;
  const a = data.astronaut;
  const porK = Object.fromEntries(analisis.tarjetas.map((t) => [t.k, t]));
  const eg = analisis.general;
  const motivo = motivoGeneral(analisis, porK);
  const alertas = analisis.activas.filter((x) => x.estado !== "info").length;
  return (
    <button onClick={() => onElegir(id)} aria-pressed={activo} aria-label={`${a.nombre}, ${a.rol}. ${ESTADO_GENERAL[eg]}. ${alertas} alerts`}
      className={`glass glass-hover flex min-h-[150px] flex-col gap-3 p-5 text-left ${activo ? "border-accent/80" : ""}`}
      style={activo ? { boxShadow: "inset 0 1px 0 rgba(255,255,255,0.26), 0 0 0 1px rgba(143,134,255,0.7), 0 0 28px rgba(143,134,255,0.25)" } : undefined}>
      <span className="flex w-full items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#22d3ee,#8b7bff)] text-sm font-bold text-[#0b0820]">{iniciales(a.nombre)}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-lg font-semibold">{a.nombre}</span>
          <span className="block truncate text-xs text-muted">{a.rol}</span>
        </span>
        <span className="text-right">
          <span className={`block font-display text-2xl font-semibold leading-none ${alertas ? "text-warn" : "text-ok"}`}>{alertas}</span>
          <span className="text-[10px] uppercase tracking-wider text-muted">alerts</span>
        </span>
      </span>
      <span className="flex flex-wrap gap-2">
        <ChipGeneral estado={eg}>{ESTADO_GENERAL[eg]}{motivo && ` · ${motivo}`}</ChipGeneral>
        <ChipGeneral estado={analisis.urgencia.nivel.estado}>Urgency {analisis.urgencia.nivel.txt.toLowerCase()}</ChipGeneral>
      </span>
    </button>
  );
}

export default function Tripulacion() {
  const [aid, setAid] = useAstronautId();
  const { data, analisis, loading, error } = useQuickFix(aid);
  if (error) return <div className="p-10 text-crit">Could not load the data: {error}</div>;
  if (loading || !analisis) return <div className="flex min-h-screen items-center justify-center text-muted">Loading crew…</div>;
  const { astronaut, astronauts } = data;
  return (
    <Shell active="/tripulacion" astronaut={astronaut} astronauts={astronauts} onAstronaut={setAid} astronautId={aid} analisis={analisis}>
      <EncabezadoPagina titulo="Crew" sub={`${astronauts.length} astronauts · crew physician view`} />
      <section aria-label="Astronauts" className="grid gap-[14px] min-[900px]:grid-cols-3">
        {astronauts.map((a) => <TarjetaTripulante key={a.id} id={a.id} activo={a.id === aid} onElegir={setAid} />)}
      </section>
      <h2 className="mb-[13px] mt-[26px] px-0.5 text-lg font-semibold">{astronaut.nombre} · {astronaut.rol}</h2>
      <PanelTripulante key={aid} astronautId={aid} />
    </Shell>
  );
}
