"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChipGeneral, ESTADO, ESTADO_GENERAL, Shell } from "@/components/Shell";
import Cuerpo from "@/components/Cuerpo";
import CyberMedic from "@/components/CyberMedic";
import BotonVital from "@/components/BotonVital";
import FondoCuerpo from "@/components/FondoCuerpo";
import { GRUPOS, ORDEN_ESPACIO, ORDEN_MENTAL } from "@/components/Personaje";
import { Compacta, Detalle, motivoGeneral, ORDEN_VISUAL, Seccion, Urgencia } from "@/components/PanelTripulante";
import { PRIORIDAD_NIVEL } from "@/lib/cuerpo";
import { useAstronautId, useQuickFix } from "@/lib/useQuickFix";

const IZQ = ["fc", "pa", "fr"];
const DER = ["spo2", "temp", "conciencia"];
const FILA = ["min-[1100px]:row-start-1", "min-[1100px]:row-start-2", "min-[1100px]:row-start-3"];

function useMedia(q) {
  const [ok, setOk] = useState(true);
  useEffect(() => {
    const m = window.matchMedia(q);
    const f = () => setOk(m.matches);
    f();
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, [q]);
  return ok;
}

function resumen(analisis) {
  const porK = Object.fromEntries(analisis.tarjetas.map((t) => [t.k, t]));
  const niv = (k) => analisis.interpretaciones?.[k]?.nivel || "ok";
  const alertas = ORDEN_VISUAL.filter((k) => niv(k) === "bad" || niv(k) === "warn").sort((a, b) => PRIORIDAD_NIVEL[niv(a)] - PRIORIDAD_NIVEL[niv(b)]);
  const infos = ORDEN_VISUAL.filter((k) => niv(k) === "info");
  if (alertas.length) {
    const mal = alertas.some((k) => niv(k) === "bad") || analisis.general === "critico";
    const principal = ORDEN_VISUAL.find((k) => porK[k]?.estado === analisis.general && analisis.general !== "normal") || alertas[0];
    return { estado: mal ? "critico" : "atencion", icono: "●", texto: `${alertas.length} ${alertas.length === 1 ? "alerta" : "alertas"} · ${porK[principal].nombre}`, k: principal };
  }
  if (infos.length) return { estado: "info", icono: "⚡", texto: "Esfuerzo físico detectado", k: infos[0] };
  return { estado: "normal", icono: "✓", texto: "Todo estable · sin alertas", k: null };
}

function Aviso({ analisis, onVer }) {
  const r = resumen(analisis);
  const clave = `${r.estado}|${r.texto}`;
  const [cerrado, setCerrado] = useState(null);
  if (cerrado === clave) return null;
  const E = ESTADO[r.estado];
  const cuerpo = (
    <>
      <span aria-hidden className={r.icono === "●" ? "dot-estado" : "text-sm leading-none"}>{r.icono === "●" ? "" : r.icono}</span>
      <span className="truncate">{r.texto}</span>
    </>
  );
  return (
    <div key={clave} role="status" aria-live="polite" data-aviso={r.estado}
      className={`aviso-entra glass fixed bottom-4 right-4 z-40 flex max-w-[min(340px,calc(100vw-2rem))] items-center gap-1 rounded-full py-1 pl-1 pr-1 text-xs font-semibold ${E.color}`}
      style={{ borderColor: `color-mix(in oklab, ${E.hex} 50%, transparent)` }}>
      {r.k ? (
        <button onClick={() => onVer(r.k)} className="flex min-w-0 items-center gap-2 rounded-full px-3 py-1.5 hover:bg-white/[0.06]">{cuerpo}</button>
      ) : (
        <span className="flex min-w-0 items-center gap-2 px-3 py-1.5">{cuerpo}</span>
      )}
      <button onClick={() => setCerrado(clave)} aria-label="Cerrar aviso" className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-base text-muted hover:bg-white/10 hover:text-fg">×</button>
    </div>
  );
}

export default function Inicio() {
  const router = useRouter();
  const [aid, setAid] = useAstronautId();
  const { data, analisis, loading, error } = useQuickFix(aid);
  const ancho = useMedia("(min-width: 640px)");
  const [debug, setDebug] = useState(false);
  const modales = useRef({});
  useEffect(() => {
    setDebug(new URLSearchParams(window.location.search).get("debug") === "cuerpo");
  }, []);

  if (error)
    return <div className="p-10 text-crit">No se pudieron cargar los datos: {error}. Revisa tus variables de Supabase en .env.local (o bórralas para usar datos locales).</div>;
  if (loading || !analisis) return <div className="flex min-h-screen items-center justify-center text-muted">Cargando QuickFix…</div>;

  const { astronaut, astronauts } = data;
  const porK = Object.fromEntries(analisis.tarjetas.map((t) => [t.k, t]));
  const eg = analisis.general;
  const motivo = motivoGeneral(analisis, porK);
  const ir = (k) => router.push(`/analisis?a=${aid}&var=${k}`);
  const medic = (k) => <CyberMedic ref={(r) => { modales.current[k] = r; }} t={porK[k]} it={analisis.interpretaciones?.[k]} dia={astronaut.dia_mision} onProceder={() => ir(k)} detalle={<Detalle t={porK[k]} analisis={analisis} />} />;
  const abrir = (k) => (modales.current[k] ? modales.current[k].abrir() : ir(k));

  return (
    <Shell active="/" astronaut={astronaut} astronauts={astronauts} onAstronaut={setAid} astronautId={aid} analisis={analisis} pie="Datos simulados · Medic no diagnostica">
      <div className="mb-5 mt-2 flex flex-wrap items-end justify-between gap-4 px-0.5">
        <div className="min-w-0">
          <h1 className="titulo-pagina">Bienvenido a bordo, {astronaut.nombre} <span className="text-accent">✦</span></h1>
          <div className="mt-1.5 text-[13px] text-muted">Día de misión {astronaut.dia_mision}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <ChipGeneral estado={eg}>{ESTADO_GENERAL[eg]}{motivo && ` · ${motivo}`}</ChipGeneral>
          <Urgencia nivel={analisis.urgencia.nivel} />
        </div>
      </div>

      <section aria-label={GRUPOS.vitales}
        className="grid grid-cols-2 gap-[9px] min-[640px]:grid-cols-3 min-[640px]:gap-[14px] min-[1100px]:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)] min-[1100px]:grid-rows-3">
        <article aria-label="Cuerpo del astronauta"
          className="glass relative col-span-2 h-[380px] overflow-hidden min-[640px]:col-span-3 min-[640px]:h-[440px] min-[1100px]:col-span-1 min-[1100px]:col-start-2 min-[1100px]:row-span-3 min-[1100px]:row-start-1 min-[1100px]:h-auto min-[1100px]:min-h-[490px]"
          style={{ background: "linear-gradient(180deg, rgba(8,10,28,.18), rgba(8,10,28,.42))", backdropFilter: "none", WebkitBackdropFilter: "none", "--tono": ESTADO[eg]?.hex }}>
          <FondoCuerpo />
          <Cuerpo analisis={analisis} onVer={ir} maxBurbujas={ancho ? 3 : 2} debug={debug} hrefMas={`/analisis?a=${aid}`} />
        </article>
        {IZQ.map((k, i) => <BotonVital key={k} t={porK[k]} onClick={() => abrir(k)} extra={medic(k)} className={`min-[1100px]:col-start-1 min-[1100px]:self-center ${FILA[i]}`} />)}
        {DER.map((k, i) => <BotonVital key={k} t={porK[k]} onClick={() => abrir(k)} extra={medic(k)} className={`min-[1100px]:col-start-3 min-[1100px]:self-center ${FILA[i]}`} />)}
      </section>

      <Seccion glifo="✦" titulo={GRUPOS.espacio} n={ORDEN_ESPACIO.length} />
      <section aria-label={GRUPOS.espacio} className="grid grid-cols-2 gap-[9px] min-[640px]:gap-[14px] min-[1100px]:grid-cols-4">
        {ORDEN_ESPACIO.map((k) => <Compacta key={k} t={porK[k]} onClick={() => abrir(k)} extra={medic(k)} accion="Ver detalle" />)}
      </section>

      <Seccion glifo="◈" titulo={GRUPOS.mental} n={ORDEN_MENTAL.length} />
      <section aria-label={GRUPOS.mental} className="grid grid-cols-2 gap-[9px] pb-16 min-[640px]:gap-[14px] min-[1100px]:grid-cols-4">
        {ORDEN_MENTAL.map((k) => <Compacta key={k} t={porK[k]} onClick={() => abrir(k)} extra={medic(k)} accion="Ver detalle" className="min-[1100px]:col-span-2" />)}
      </section>

      <Aviso analisis={analisis} onVer={ir} />
    </Shell>
  );
}
