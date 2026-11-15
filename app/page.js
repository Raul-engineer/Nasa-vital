"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/Shell";
import Cuerpo from "@/components/Cuerpo";
import CyberButton from "@/components/CyberButton";
import { BarraVida, ListaAlertas, useAlertasActivas, valorCorto } from "@/components/ListaAlertas";
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
  useEffect(() => {
    setDebug(new URLSearchParams(window.location.search).get("debug") === "cuerpo");
  }, []);

  if (error)
    return <div className="p-10 text-crit">No se pudieron cargar los datos: {error}. Revisa tus variables de Supabase en .env.local (o bórralas para usar datos locales).</div>;
  if (loading || !analisis) return <div className="flex min-h-screen items-center justify-center text-muted">Cargando QuickFix…</div>;

  const { astronaut, astronauts } = data;
  const salud = analisis.salud;
  const ir = (k) => router.push(`/analisis?a=${aid}&tab=alertas&var=${k}`);

  return (
    <Shell active="/" astronaut={astronaut} astronauts={astronauts} onAstronaut={setAid} astronautId={aid} analisis={analisis} pie={false}>
      <div className="mb-5 mt-2 px-0.5">
        <h1 className="titulo-pagina">Bienvenido a bordo, {astronaut.nombre} <span className="text-accent">✦</span></h1>
      </div>

      <div className="grid gap-[14px] min-[1100px]:h-[min(calc(100vh-250px),780px)] min-[1100px]:min-h-[480px] min-[1100px]:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-label="Cuerpo del astronauta" className="glass relative flex h-[480px] flex-col overflow-hidden min-[1100px]:h-full"
          style={{ background: "radial-gradient(ellipse at 50% 40%, #3a2a2a66, transparent 70%), linear-gradient(160deg, #2b232499, #1b202a99), var(--glass)" }}>
          <div className="relative z-20 px-4 pt-4">
            <BarraVida salud={salud} />
          </div>
          <div className="relative min-h-0 flex-1">
            <Cuerpo analisis={analisis} lista={items} onVer={ir} debug={debug} conTarjetas={ancho} brillo={{ color: salud.color, pulsa: salud.clave === "critico" }} />
          </div>
        </section>
        <ListaAlertas items={items} onVer={ir} max={ancho ? 8 : 5} hrefMas={`/analisis?a=${aid}&tab=alertas`} className="min-h-[220px] min-[1100px]:h-full" />
      </div>

      <div className="mb-10 mt-5 flex justify-center min-[1100px]:pr-[354px]">
        <CyberButton href={`/analisis?a=${aid}&tab=completo`} tam="sm" texto="Ver todos mis datos">Ver todos mis datos</CyberButton>
      </div>

      <Aviso items={items} aid={idDatos} onVer={ir} />
    </Shell>
  );
}
