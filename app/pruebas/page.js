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
import { CATEGORIAS_PRUEBA, contextoDisponibilidad, disponibilidad, LEGADO_A_PRUEBA, ORDEN_CATEGORIAS, PRUEBAS_CATALOGO, PRUEBAS_POR_ID } from "@/lib/pruebas";
import { COLOR_NIVEL, ETIQUETA_NIVEL } from "@/lib/fichas";

const PIE = "Medic no diagnostica; lo grave se escala al médico de tripulación.";
const DIA = 864e5;

function hace(iso) {
  const d = Math.floor((Date.now() - Date.parse(iso)) / DIA);
  return d <= 0 ? "hoy" : d === 1 ? "ayer" : `hace ${d} días`;
}

function Tarjeta({ p, ultima, disp, aid }) {
  const color = ultima ? COLOR_NIVEL[ultima.nivel] : null;
  return (
    <article className="card relative flex flex-col p-5" data-prueba={p.id} data-permitida={disp.permitido ? "si" : "no"}>
      <GlowingEffect />
      <div className="flex items-center justify-between gap-2">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent"><Icon name={p.icono} size={24} /></span>
        <span className="flex items-center gap-1.5">
          {p.companero && <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs text-muted">Con compañero</span>}
          <span className="flex items-center gap-1 rounded-full border border-line px-2.5 py-0.5 text-xs text-muted"><Icon name="clock" size={14} /> {p.duracion}</span>
        </span>
      </div>
      <h2 className="mt-3 text-lg font-semibold">{p.nombre}</h2>
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
        {disp.permitido ? (
          <>
            {disp.motivo && <p className="mb-2 text-xs font-semibold text-cyan" data-motivo-disponible>{disp.motivo}</p>}
            <CyberButton href={`/pruebas/${p.id}?a=${aid}`} atajo="↵" className="w-full" texto={disp.editar ? "Editar el de hoy" : "Hacer la prueba"}>{disp.editar ? "Editar el de hoy" : "Hacer la prueba"}</CyberButton>
          </>
        ) : (
          <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-muted" data-bloqueada>{disp.texto}</p>
        )}
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
  const ctx = contextoDisponibilidad({ data, analisis, eventosFicha: fichas.eventos, historial });
  const lista = PRUEBAS_CATALOGO.filter((p) => p.categoria === cat);

  return (
    <Shell active="/pruebas" astronaut={astronaut} astronauts={astronauts} onAstronaut={setAid} astronautId={aid} analisis={analisis} pie={PIE}>
      <EncabezadoPagina titulo="Pruebas" />

      <nav className="no-scrollbar -mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Categorías de pruebas">
        {ORDEN_CATEGORIAS.map((c) => (
          <CyberButton key={c} onClick={() => setCat(c)} activo={cat === c} tam="sm" texto={CATEGORIAS_PRUEBA[c].nombre} role="tab" aria-selected={cat === c} data-categoria={c} className="shrink-0">
            {CATEGORIAS_PRUEBA[c].nombre}
          </CyberButton>
        ))}
      </nav>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {lista.map((p) => <Tarjeta key={p.id} p={p} ultima={ultimas[p.id]} disp={disponibilidad(p, ctx)} aid={aid} />)}
      </div>
    </Shell>
  );
}
