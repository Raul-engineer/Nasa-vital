"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EncabezadoPagina, Shell } from "@/components/Shell";
import CyberButton from "@/components/CyberButton";
import { Icon } from "@/components/Icons";
import { GlowingEffect } from "@/components/Effects";
import { Fuente } from "@/components/Widgets";
import { useAstronautId, useQuickFix } from "@/lib/useQuickFix";
import { useFichas, useHistorialPruebas } from "@/lib/useFichas";
import { CATEGORIAS_PRUEBA, LEGADO_A_PRUEBA, ORDEN_CATEGORIAS, paraTiHoy, PRUEBAS_CATALOGO, PRUEBAS_POR_ID, vencida } from "@/lib/pruebas";
import { COLOR_NIVEL, ETIQUETA_NIVEL } from "@/lib/fichas";

const PIE = "Medic no diagnostica; lo grave se escala al médico de tripulación.";
const DIA = 864e5;

function hace(iso) {
  const d = Math.floor((Date.now() - Date.parse(iso)) / DIA);
  return d <= 0 ? "hoy" : d === 1 ? "ayer" : `hace ${d} días`;
}

function Tarjeta({ p, ultima, venc, aid, motivo }) {
  const color = ultima ? COLOR_NIVEL[ultima.nivel] : null;
  return (
    <article className="card relative flex flex-col p-5" data-prueba={p.id}>
      <GlowingEffect />
      <div className="flex items-center justify-between gap-2">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent"><Icon name={p.icono} size={24} /></span>
        <span className="flex items-center gap-1.5">
          {venc && <span className="rounded-full border border-warn/60 px-2.5 py-0.5 text-xs font-semibold text-warn" data-vencida>Vencida</span>}
          {p.companero && <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs text-muted">Con compañero</span>}
          <span className="flex items-center gap-1 rounded-full border border-line px-2.5 py-0.5 text-xs text-muted"><Icon name="clock" size={14} /> {p.duracion}</span>
        </span>
      </div>
      <h2 className="mt-3 text-lg font-semibold">{p.nombre}</h2>
      {motivo && <p className="mt-1 text-sm font-semibold text-cyan" data-motivo-prueba>{motivo}</p>}
      <p className="mt-1 text-sm text-soft">{p.resumen}</p>
      <div className="mt-3 rounded-xl border border-line bg-ink/[0.03] p-3 text-sm">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted">Para qué sirve</div>
        <div className="mt-0.5">{p.paraQue}</div>
      </div>
      <Fuente className="mt-2" ids={p.fuente} />
      <div className="mt-3 flex items-center gap-2 text-xs" data-ultima-vez>
        {ultima ? (
          <>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
            <span className="text-soft">Última vez: {hace(ultima.hecho_en)} · <span style={{ color }}>{ETIQUETA_NIVEL[ultima.nivel]}</span></span>
          </>
        ) : <span className="text-muted">Primera vez: será tu base</span>}
      </div>
      <div className="mt-auto pt-4">
        <CyberButton href={`/pruebas/${p.id}?a=${aid}`} atajo="↵" className="w-full" texto="Hacer la prueba">Hacer la prueba</CyberButton>
      </div>
    </article>
  );
}

export default function Pruebas() {
  const router = useRouter();
  const [aid, setAid] = useAstronautId();
  const { data, analisis, loading, error } = useQuickFix(aid);
  const fichas = useFichas(data?.astronaut?.id);
  const { historial } = useHistorialPruebas(data?.astronaut?.id, data);
  const [cat, setCat] = useState("diario");
  const [buscar, setBuscar] = useState("");
  const [soloVencidas, setSoloVencidas] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const t = p.get("t");
    const id = LEGADO_A_PRUEBA[t] || (PRUEBAS_POR_ID[t] ? t : null);
    if (id) router.replace(`/pruebas/${id}?a=${p.get("a") || aid}`);
    const c = p.get("cat");
    if (ORDEN_CATEGORIAS.includes(c)) setCat(c);
  }, []);

  const ultimas = useMemo(() => {
    const m = {};
    for (const r of historial) m[r.prueba_id] = r;
    return m;
  }, [historial]);

  if (error) return <div className="p-10 text-crit">No se pudieron cargar los datos: {error}</div>;
  if (loading || !analisis) return <div className="flex min-h-screen items-center justify-center text-muted">Cargando pruebas…</div>;

  const { astronaut, astronauts } = data;
  const hoy = paraTiHoy({ analisis, data, historial, eventosFicha: fichas.eventos });
  const vencidas = Object.fromEntries(PRUEBAS_CATALOGO.map((p) => [p.id, vencida(p, historial, { diaMision: astronaut.dia_mision }).vencida]));
  const q = buscar.trim().toLowerCase();
  const filtro = (p) => (!q || `${p.nombre} ${p.resumen}`.toLowerCase().includes(q)) && (!soloVencidas || vencidas[p.id]);
  const lista = PRUEBAS_CATALOGO.filter((p) => (q || soloVencidas ? true : p.categoria === cat) && filtro(p));
  const nVencidas = Object.values(vencidas).filter(Boolean).length;

  return (
    <Shell active="/pruebas" astronaut={astronaut} astronauts={astronauts} onAstronaut={setAid} astronautId={aid} analisis={analisis} pie={PIE}>
      <EncabezadoPagina titulo="Pruebas" sub={`${PRUEBAS_CATALOGO.length} pruebas en 4 categorías · ${nVencidas} vencidas`} />

      {hoy.length > 0 && (
        <section aria-label="Para ti hoy" className="mb-6" data-para-ti>
          <h2 className="etiqueta mb-3 px-0.5">Para ti hoy</h2>
          <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
            {hoy.map((x) => {
              const p = PRUEBAS_POR_ID[x.id];
              return (
                <a key={x.id} href={`/pruebas/${x.id}?a=${aid}`} className="glass glass-hover flex w-[260px] shrink-0 flex-col gap-2 p-4" data-para-ti-item={x.id}>
                  <span className="flex items-center gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent/15 text-accent"><Icon name={p.icono} size={20} /></span>
                    <span className="min-w-0 flex-1 truncate font-semibold">{p.nombre}</span>
                  </span>
                  <span className="text-sm text-cyan">{x.motivo}</span>
                  <span className="mt-auto text-xs text-muted">{p.duracion} · {CATEGORIAS_PRUEBA[p.categoria].corto}</span>
                </a>
              );
            })}
          </div>
        </section>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <nav className="no-scrollbar -mx-1 flex flex-1 gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Categorías de pruebas">
          {ORDEN_CATEGORIAS.map((c) => (
            <CyberButton key={c} onClick={() => { setCat(c); setBuscar(""); setSoloVencidas(false); }} activo={!q && !soloVencidas && cat === c} tam="sm" texto={CATEGORIAS_PRUEBA[c].nombre} role="tab" aria-selected={cat === c} data-categoria={c} className="shrink-0">
              {CATEGORIAS_PRUEBA[c].nombre} · {PRUEBAS_CATALOGO.filter((p) => p.categoria === c).length}
            </CyberButton>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <input type="search" value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar prueba" aria-label="Buscar prueba" className="campo h-10 !w-52" />
          <button type="button" onClick={() => setSoloVencidas((x) => !x)} aria-pressed={soloVencidas} className={`h-10 shrink-0 rounded-xl border px-3 text-sm font-semibold ${soloVencidas ? "border-warn/70 bg-warn/15 text-warn" : "border-white/12 text-soft"}`} data-filtro-vencidas>Vencidas · {nVencidas}</button>
        </div>
      </div>

      {lista.length === 0 ? (
        <p className="py-10 text-center text-muted">No hay pruebas con ese filtro.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {lista.map((p) => <Tarjeta key={p.id} p={p} ultima={ultimas[p.id]} venc={vencidas[p.id]} aid={aid} motivo={hoy.find((x) => x.id === p.id)?.motivo} />)}
        </div>
      )}
    </Shell>
  );
}
