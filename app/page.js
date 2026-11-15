"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChipGeneral, ESTADO, ESTADO_GENERAL, Shell } from "@/components/Shell";
import Link from "next/link";
import Cuerpo, { MAX_TARJETAS, useAlertasCuerpo } from "@/components/Cuerpo";
import CyberButton from "@/components/CyberButton";
import { Metrica, motivoGeneral, ORDEN_VISUAL, Urgencia } from "@/components/PanelTripulante";
import { nivelAlerta, PRIORIDAD_NIVEL } from "@/lib/cuerpo";
import { useAstronautId, useQuickFix } from "@/lib/useQuickFix";

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
  const niv = (k) => (porK[k] ? nivelAlerta(porK[k], analisis) : "ok");
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
  const ancho = useMedia("(min-width: 1100px)");
  const [debug, setDebug] = useState(false);
  const lista = useAlertasCuerpo(analisis);
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

      <section aria-label="Cuerpo del astronauta" className="glass relative h-[min(calc(100vh-292px),760px)] min-h-[420px] overflow-hidden max-[1099px]:h-[460px]"
        style={{ background: "radial-gradient(ellipse at 50% 40%, #3a2a2a66, transparent 70%), linear-gradient(160deg, #2b232499, #1b202a99), var(--glass)" }}>
        <Cuerpo analisis={analisis} lista={lista} onVer={ir} debug={debug} hrefMas={`/analisis?a=${aid}`} conTarjetas={ancho} />
      </section>

      {!ancho && lista.length > 0 && (
        <section aria-label="Alertas" className="mt-[14px] grid grid-cols-2 gap-[9px] min-[640px]:gap-[14px]">
          {lista.slice(0, MAX_TARJETAS).map((v) => (
            <div key={`${v.k}-${v.nivel}`} className="burbuja-entra" data-tarjeta={v.k} data-nivel={v.nivel}>
              <Metrica t={v.t} analisis={analisis} onClick={() => ir(v.k)} className="h-full w-full" />
            </div>
          ))}
          {lista.length > MAX_TARJETAS && (
            <Link href={`/analisis?a=${aid}`} className="glass col-span-2 rounded-full px-3 py-2 text-center text-xs font-semibold text-soft" data-burbuja="mas">
              +{lista.length - MAX_TARJETAS} {lista.length - MAX_TARJETAS === 1 ? "alerta" : "alertas"}
            </Link>
          )}
        </section>
      )}

      <div className="mb-16 mt-5 flex justify-center">
        <CyberButton href={`/analisis?a=${aid}`} tam="sm" atajo="2" texto="Ver todos mis datos">Ver todos mis datos</CyberButton>
      </div>

      <Aviso analisis={analisis} onVer={ir} />
    </Shell>
  );
}
