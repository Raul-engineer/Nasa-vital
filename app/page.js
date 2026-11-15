"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/Shell";
import Link from "next/link";
import Cuerpo, { MAX_TARJETAS } from "@/components/Cuerpo";
import { Metrica } from "@/components/PanelTripulante";
import CyberButton from "@/components/CyberButton";
import { BarraVida, BotonesGravedad, FILTROS, useAlertasActivas, valorCorto } from "@/components/ListaAlertas";
import { COLOR_GRAVEDAD } from "@/lib/analysis";
import { useAstronautId, useQuickFix } from "@/lib/useQuickFix";

const AVISO_CRITICO_MS = 3000;

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

function Aviso({ items, aid, onVer }) {
  const [cerrado, setCerrado] = useState(false);
  const [critica, setCritica] = useState(null);
  const previas = useRef(null);
  const criticas = items.filter((a) => a.nivel === "critico").map((a) => a.k);
  const firma = `${aid}|${criticas.join(",")}`;
  useEffect(() => {
    const [id] = firma.split("|");
    if (!previas.current || previas.current.aid !== id) {
      previas.current = { aid: id, set: new Set(criticas) };
      return;
    }
    const nueva = criticas.find((k) => !previas.current.set.has(k));
    previas.current.set = new Set(criticas);
    if (!nueva) return;
    setCritica(nueva);
    const t = setTimeout(() => setCritica(null), AVISO_CRITICO_MS);
    return () => clearTimeout(t);
  }, [firma]);
  useEffect(() => {
    if (items.length) setCerrado(false);
  }, [items.length]);

  const base = "aviso-entra glass fixed bottom-4 right-4 z-40 flex max-w-[min(360px,calc(100vw-2rem))] items-center gap-1 rounded-full py-1 pl-1 pr-1 text-xs font-semibold";
  if (critica) {
    const a = items.find((x) => x.k === critica);
    if (!a) return null;
    return (
      <div key={`c-${critica}`} role="alert" data-aviso="critico" className={base} style={{ color: COLOR_GRAVEDAD.critico, borderColor: `color-mix(in oklab, ${COLOR_GRAVEDAD.critico} 55%, transparent)` }}>
        <button onClick={() => onVer(critica)} className="flex min-w-0 items-center gap-2 rounded-full px-3 py-1.5 hover:bg-white/[0.06]">
          <span className="dot-estado" />
          <span className="truncate">Nueva alerta crítica · {valorCorto(a.t)}</span>
        </button>
      </div>
    );
  }
  if (items.length || cerrado) return null;
  return (
    <div key="estable" role="status" aria-live="polite" data-aviso="normal" className={`${base} text-ok`} style={{ borderColor: "color-mix(in oklab, var(--color-ok) 50%, transparent)" }}>
      <span className="flex min-w-0 items-center gap-2 px-3 py-1.5"><span aria-hidden>✓</span><span className="truncate">Todo estable</span></span>
      <button onClick={() => setCerrado(true)} aria-label="Cerrar aviso" className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-base text-muted hover:bg-white/10 hover:text-fg">×</button>
    </div>
  );
}

export default function Inicio() {
  const router = useRouter();
  const [aid, setAid] = useAstronautId();
  const { data, analisis, loading, error } = useQuickFix(aid);
  const ancho = useMedia("(min-width: 1100px)");
  const [debug, setDebug] = useState(false);
  const idDatos = data?.astronaut?.id;
  const items = useAlertasActivas(analisis, idDatos);
  const [filtro, setFiltro] = useState(null);
  const urlLista = useRef(false);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setDebug(p.get("debug") === "cuerpo");
    const f = p.get("filtro");
    if (FILTROS.includes(f)) setFiltro(f);
    urlLista.current = true;
  }, []);
  const hayFiltro = !filtro || items.some((a) => a.nivel === filtro);
  useEffect(() => {
    if (analisis && idDatos != null && !hayFiltro) setFiltro(null);
  }, [analisis, idDatos, hayFiltro]);
  useEffect(() => {
    if (!urlLista.current) return;
    const url = new URL(window.location.href);
    if (filtro) url.searchParams.set("filtro", filtro);
    else url.searchParams.delete("filtro");
    const nueva = `${url.pathname}${url.search}`;
    if (nueva !== `${window.location.pathname}${window.location.search}`) router.replace(nueva, { scroll: false });
  }, [filtro, router]);

  if (error)
    return <div className="p-10 text-crit">No se pudieron cargar los datos: {error}. Revisa tus variables de Supabase en .env.local (o bórralas para usar datos locales).</div>;
  if (loading || !analisis) return <div className="flex min-h-screen items-center justify-center text-muted">Cargando QuickFix…</div>;

  const { astronaut, astronauts } = data;
  const salud = analisis.salud;
  const ir = (k) => router.push(`/analisis?a=${aid}&tab=alertas&var=${k}`);
  const filtrados = filtro ? items.filter((a) => a.nivel === filtro) : items;

  return (
    <Shell active="/" astronaut={astronaut} astronauts={astronauts} onAstronaut={setAid} astronautId={aid} analisis={analisis} pie={false}>
      <h1 className="sr-only">Inicio · {astronaut.nombre}</h1>

      <BotonesGravedad items={items} filtro={filtro} onFiltro={setFiltro} />

      <section aria-label="Cuerpo del astronauta" className="glass relative mt-[14px] flex h-[480px] flex-col overflow-hidden min-[1100px]:h-[clamp(600px,calc(100vh-288px),980px)] min-[1100px]:py-5"
        style={{ background: "radial-gradient(ellipse at 50% 40%, #3a2a2a66, transparent 70%), linear-gradient(160deg, #2b232499, #1b202a99), var(--glass)" }}>
        <div className="relative z-20 px-4 pt-4 min-[1100px]:pt-0">
          <BarraVida salud={salud} />
        </div>
        <div className="relative min-h-0 flex-1">
          <Cuerpo analisis={analisis} lista={filtrados} todas={items} onVer={ir} debug={debug} conTarjetas={ancho} masHref={filtro ? `/analisis?a=${aid}&tab=alertas` : null}
            brillo={{ color: salud.color, pulsa: salud.clave === "critico" }} />
        </div>
      </section>

      {!ancho && filtrados.length > 0 && (
        <section aria-label="Alertas" className="mt-[14px] grid grid-cols-2 gap-[9px] min-[640px]:gap-[14px]">
          {filtrados.slice(0, MAX_TARJETAS).map((a) => (
            <div key={`${a.k}-${a.nivel}`} className="burbuja-entra" data-tarjeta-movil={a.k} data-nivel={a.nivel}>
              <Metrica t={a.t} analisis={analisis} onClick={() => ir(a.k)} className="h-full w-full" acento={COLOR_GRAVEDAD[a.nivel]} />
            </div>
          ))}
          {filtro && filtrados.length > MAX_TARJETAS && (
            <Link href={`/analisis?a=${aid}&tab=alertas`} className="glass col-span-2 rounded-full px-3 py-2 text-center text-xs font-semibold text-soft" data-burbuja="mas">
              +{filtrados.length - MAX_TARJETAS}
            </Link>
          )}
        </section>
      )}

      <div className="mb-4 mt-5 flex justify-center">
        <CyberButton href={`/analisis?a=${aid}&tab=completo`} tam="sm" texto="Ver todos mis datos">Ver todos mis datos</CyberButton>
      </div>

      <Aviso items={items} aid={idDatos} onVer={ir} />
    </Shell>
  );
}
