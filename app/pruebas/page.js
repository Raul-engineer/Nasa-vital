"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EncabezadoPagina, Shell, Sparkline } from "@/components/Shell";
import CyberButton from "@/components/CyberButton";
import BotonPestana from "@/components/BotonPestana";
import { Icon } from "@/components/Icons";
import { GlowingEffect } from "@/components/Effects";
import { Fuente } from "@/components/Widgets";
import { ChipMetrica, Contador } from "@/components/analisis/Pestanas";
import { useAstronautId, useQuickFix } from "@/lib/useQuickFix";
import { useFichas, useHistorialPruebas } from "@/lib/useFichas";
import {
  baseDe, CATEGORIAS_PRUEBA, comparar, conteoPestanas, contextoDisponibilidad, CORTO_PRUEBA, cuandoToca, disponibilidad, idsDePestana, LEGADO_A_PRUEBA,
  ORDEN_CATEGORIAS, PESTANAS_PRUEBAS, pestanaInicial, PRUEBAS_CATALOGO, PRUEBAS_POR_ID, recomendadasPorFichas, resumenUltimo, seleccionInicial,
} from "@/lib/pruebas";
import { COLOR_NIVEL, ETIQUETA_NIVEL, TITULOS } from "@/lib/fichas";

const DIA = 864e5;
const NOMBRE_PESTANA = { alertas: "⚠ Alerts", completo: "Complete" };

function hace(iso) {
  const d = Math.floor((Date.now() - Date.parse(iso)) / DIA);
  return d <= 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`;
}

function Tarjeta({ p, ultima, disp, aid }) {
  const color = ultima ? COLOR_NIVEL[ultima.nivel] : null;
  return (
    <article className="card relative flex flex-col p-5" data-prueba={p.id} data-permitida={disp.permitido ? "si" : "no"}>
      <GlowingEffect />
      <div className="flex items-center justify-between gap-2">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent"><Icon name={p.icono} size={24} /></span>
        <span className="flex items-center gap-1.5">
          {p.companero && <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs text-muted">With a partner</span>}
          <span className="flex items-center gap-1 rounded-full border border-line px-2.5 py-0.5 text-xs text-muted"><Icon name="clock" size={14} /> {p.duracion}</span>
        </span>
      </div>
      <h2 className="mt-3 text-lg font-semibold">{p.nombre}</h2>
      <p className="mt-1 text-sm text-soft">{p.resumen}</p>
      <div className="mt-3 rounded-xl border border-line bg-ink/[0.03] p-3 text-sm">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted">What it is for</div>
        <div className="mt-0.5">{p.paraQue}</div>
      </div>
      <Fuente className="mt-2" ids={p.fuente} />
      <div className="mt-3 flex items-center gap-2 text-xs" data-ultima-vez>
        {ultima ? (
          <>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
            <span className="text-soft">Last time: {hace(ultima.hecho_en)} · <span style={{ color }}>{ETIQUETA_NIVEL[ultima.nivel]}</span></span>
          </>
        ) : <span className="text-muted">First time: it will be your baseline</span>}
      </div>
      <div className="mt-auto pt-4">
        {disp.permitido ? (
          <>
            {disp.motivo && <p className="mb-2 text-xs font-semibold text-cyan" data-motivo-disponible>{disp.motivo}</p>}
            <CyberButton href={`/pruebas/${p.id}?a=${aid}`} atajo="↵" className="w-full" texto={disp.editar ? "Edit today's" : "Take the test"} data-hacer-prueba={p.id}>{disp.editar ? "Edit today's" : "Take the test"}</CyberButton>
          </>
        ) : (
          <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-muted" data-bloqueada>{disp.texto}</p>
        )}
      </div>
    </article>
  );
}

function Detalle({ p, filas, disp, aid, fichas }) {
  const ult = filas.at(-1) || null;
  const v = ult ? Number(ult.valor?.resultado?.valor) : null;
  const comp = ult ? comparar(p.id, Number.isFinite(v) ? v : null, baseDe(p.id, filas.slice(0, -1))) : "First time: this will be your baseline.";
  const serie = filas.map((r) => Number(r.valor?.resultado?.valor)).filter(Number.isFinite).slice(-12);
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]" data-detalle-prueba={p.id}>
      <Tarjeta p={p} ultima={ult} disp={disp} aid={aid} />
      <section className="card flex flex-col gap-4 p-5">
        {fichas.length > 0 && <p className="text-sm font-semibold text-cyan" data-recomendada>Recommended by your {fichas.map((f) => TITULOS[f.clave]).join(" and ")} card</p>}
        <div>
          <h2 className="etiqueta mb-1.5">Last time</h2>
          {ult ? (
            <>
              <p className="text-sm"><span className="text-soft">{hace(ult.hecho_en)}</span> · <span style={{ color: COLOR_NIVEL[ult.nivel] }}>{ETIQUETA_NIVEL[ult.nivel]}</span></p>
              {ult.valor?.resultado?.texto && <p className="mt-1 text-sm text-soft">{ult.valor.resultado.texto}</p>}
            </>
          ) : <p className="text-sm text-muted">Never</p>}
          <p className="mt-1 text-sm text-muted" data-comparacion>{comp}</p>
        </div>
        <div>
          <h2 className="etiqueta mb-1.5">Latest results</h2>
          {serie.length > 1 ? <div className="max-w-full overflow-hidden" data-mini-grafica><Sparkline data={serie} w={320} h={80} /></div> : <p className="text-sm text-muted">First time: this will be your baseline.</p>}
        </div>
      </section>
    </div>
  );
}

export default function Pruebas() {
  const router = useRouter();
  const [aid, setAid] = useAstronautId();
  const { data, analisis, loading, error } = useQuickFix(aid);
  const fichas = useFichas(data?.astronaut?.id);
  const { historial } = useHistorialPruebas(data?.astronaut?.id, data);
  const [tab, setTab] = useState(null);
  const [sel, setSel] = useState(null);
  const [urlInicial, setUrlInicial] = useState(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const t = p.get("t");
    const id = LEGADO_A_PRUEBA[t] || (PRUEBAS_POR_ID[t] ? t : null);
    if (id) router.replace(`/pruebas/${id}?a=${p.get("a") || aid}`);
    setUrlInicial({ cat: p.get("cat"), p: p.get("p") });
  }, []);

  const recomendadas = useMemo(() => recomendadasPorFichas(fichas.eventos), [fichas.eventos]);

  useEffect(() => {
    if (tab || !urlInicial || !fichas.listo) return;
    const t = pestanaInicial(urlInicial.cat, recomendadas);
    setTab(t);
    setSel(seleccionInicial(idsDePestana(t, recomendadas), recomendadas, urlInicial.p));
  }, [urlInicial, fichas.listo, tab, recomendadas]);

  const ids = tab ? idsDePestana(tab, recomendadas) : [];
  const elegida = seleccionInicial(ids, recomendadas, sel);

  useEffect(() => {
    if (!tab) return;
    const url = new URL(window.location.href);
    url.searchParams.set("cat", tab);
    if (elegida) url.searchParams.set("p", elegida);
    else url.searchParams.delete("p");
    url.searchParams.delete("t");
    const nueva = `${url.pathname}?${url.searchParams.toString()}`;
    if (nueva !== `${window.location.pathname}${window.location.search}`) router.replace(nueva, { scroll: false });
  }, [tab, elegida, router]);

  const ultimas = useMemo(() => {
    const m = {};
    for (const r of historial) (m[r.prueba_id] ||= []).push(r);
    return m;
  }, [historial]);

  if (error) return <div className="p-10 text-crit">Could not load the data: {error}</div>;
  if (loading || !analisis || !tab) return <div className="flex min-h-screen items-center justify-center text-muted">Loading tests…</div>;

  const { astronaut, astronauts } = data;
  const ctx = contextoDisponibilidad({ data, analisis, eventosFicha: fichas.eventos, historial });
  const conteo = conteoPestanas(recomendadas);
  const cambiarTab = (t) => {
    setTab(t);
    setSel(seleccionInicial(idsDePestana(t, recomendadas), recomendadas));
  };
  const chip = (id) => {
    const p = PRUEBAS_POR_ID[id];
    const filas = ultimas[id] || [];
    const ult = filas.at(-1);
    const r = resumenUltimo(p, ult);
    const d = disponibilidad(p, ctx);
    const toca = cuandoToca(d);
    const fichasP = recomendadas.get(id) || [];
    return (
      <ChipMetrica key={id} id={id} nivel={ult?.nivel || "sin"} etiqueta={CORTO_PRUEBA[id]} valor={r.valor} unidad={r.unidad}
        colorPunto={ult ? COLOR_NIVEL[ult.nivel] : "var(--color-muted)"} colorBorde={fichasP.length ? COLOR_NIVEL.urgente : null}
        activo={id === elegida} atenuado={!!toca} nota={toca} onClick={() => setSel(id)} datos={{ "data-ligada": fichasP.length ? "si" : "no", "data-toca": toca || "" }} />
    );
  };
  const pElegida = elegida ? PRUEBAS_POR_ID[elegida] : null;

  return (
    <Shell active="/pruebas" astronaut={astronaut} astronauts={astronauts} onAstronaut={(id) => { setAid(id); setSel(null); }} astronautId={aid} analisis={analisis}>
      <EncabezadoPagina titulo="Tests" sub={`${PRUEBAS_CATALOGO.length} tests · ${recomendadas.size} recommended by your alerts`} />

      <nav aria-label="Test tabs" className="no-scrollbar -mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1 pb-1 min-[900px]:flex-wrap" role="tablist">
        {PESTANAS_PRUEBAS.map((t) => {
          const nombre = NOMBRE_PESTANA[t] || CATEGORIAS_PRUEBA[t].nombre;
          return (
            <BotonPestana key={t} onClick={() => cambiarTab(t)} activo={tab === t} role="tab" aria-selected={tab === t} data-tab={t} className="shrink-0">
              {nombre}
              {t === "alertas" && conteo.alertas.n > 0 && <> · <Contador n={conteo.alertas.n} color={COLOR_NIVEL[conteo.alertas.nivel] || COLOR_NIVEL.urgente} grande /></>}
              {t === "completo" && ` · ${PRUEBAS_CATALOGO.length}`}
              {ORDEN_CATEGORIAS.includes(t) && <Contador n={conteo[t].n} color={COLOR_NIVEL[conteo[t].nivel] || COLOR_NIVEL.urgente} />}
            </BotonPestana>
          );
        })}
      </nav>

      {tab === "alertas" && ids.length === 0 ? (
        <section className="glass flex flex-col items-center gap-4 px-6 py-10 text-center" data-sin-recomendadas style={{ borderColor: "color-mix(in oklab, var(--color-ok) 45%, transparent)" }}>
          <span className="grid h-14 w-14 place-items-center rounded-full border-2 border-ok/60 bg-ok/10 text-2xl text-ok">✓</span>
          <div className="font-display text-xl font-semibold text-ok">0 recommended by your alerts</div>
          <CyberButton onClick={() => cambiarTab("diario")} texto="Daily">Daily</CyberButton>
        </section>
      ) : (
        <>
          {tab === "completo" ? (
            <div className="mb-5 space-y-3" data-chips-completo>
              {ORDEN_CATEGORIAS.map((c) => (
                <div key={c}>
                  <div className="titulo-categoria mb-2">{CATEGORIAS_PRUEBA[c].nombre}</div>
                  <div className="flex flex-wrap gap-2" role="tablist" aria-label={CATEGORIAS_PRUEBA[c].nombre}>{idsDePestana(c, recomendadas).map(chip)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Tests" data-chips>{ids.map(chip)}</div>
          )}
          {pElegida && <Detalle key={`${aid}-${pElegida.id}`} p={pElegida} filas={ultimas[pElegida.id] || []} disp={disponibilidad(pElegida, ctx)} aid={aid} fichas={recomendadas.get(pElegida.id) || []} />}
        </>
      )}
    </Shell>
  );
}
