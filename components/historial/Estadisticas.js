"use client";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, Pie, PieChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import CyberButton from "@/components/CyberButton";
import BotonPestana from "@/components/BotonPestana";
import { Sparkline } from "@/components/Shell";
import DetalleRespuestas from "@/components/DetalleRespuestas";
import { analizarDia, fechaLocal, percentil } from "@/lib/analysis";
import { COLOR_NIVEL, ETIQUETA_NIVEL } from "@/lib/fichas";
import { CATEGORIAS_PRUEBA, PRUEBAS_POR_ID } from "@/lib/pruebas";
import { combinacionesSemana, enRango, formaSemana, itemsForma, peorPorDia, porDiaSemana, pruebasDeCategoria, registrosDeDias, registrosDeResultados, repartoDia, semanaContraSemana, serieDePrueba, statsPrueba } from "@/lib/historial";
import { loadData } from "@/lib/data";
import { useFichas, useHistorialPruebas } from "@/lib/useFichas";
import { tooltipEstilo, useTheme } from "@/lib/theme";

const RANGOS = [[7, "7 días"], [30, "30 días"], [null, "Toda la misión"]];
const PESTANAS = [["corazon", "Corazón y respiración"], ["mente", "Mente y defensas"], ["espacio", "Efectos del espacio"], ["diario", "Diario"], ["completo", "Completo"], ["historia", "Historia clínica"]];
const DIAS_SEM = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const fFecha = (f) => new Date(f + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" });
const hace = (iso) => {
  const d = Math.floor((Date.now() - Date.parse(iso)) / 864e5);
  return d <= 0 ? "hoy" : d === 1 ? "ayer" : `hace ${d} días`;
};

function Calendario({ mapa, dias, onDia, sel, marcados = null }) {
  const ult = dias.at(-1);
  const [mes, setMes] = useState(null);
  const [uy, um] = (ult || fechaLocal(new Date().toISOString())).split("-").map(Number);
  const actual = mes || { y: uy, m: um - 1 };
  const primero = new Date(actual.y, actual.m, 1);
  const enMes = new Date(actual.y, actual.m + 1, 0).getDate();
  const off = (primero.getDay() + 6) % 7;
  const pre = `${actual.y}-${String(actual.m + 1).padStart(2, "0")}`;
  const celdas = [...Array(off).fill(null), ...Array.from({ length: enMes }, (_, i) => `${pre}-${String(i + 1).padStart(2, "0")}`)];
  const mover = (d) => {
    const n = new Date(actual.y, actual.m + d, 1);
    setMes({ y: n.getFullYear(), m: n.getMonth() });
  };
  return (
    <div data-calendario-categoria>
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => mover(-1)} className="h-10 w-10 rounded-lg border border-line hover:bg-white/5" aria-label="Mes anterior">‹</button>
        <div className="font-semibold capitalize">{primero.toLocaleDateString("es-MX", { month: "long", year: "numeric" })}</div>
        <button type="button" onClick={() => mover(1)} className="h-10 w-10 rounded-lg border border-line hover:bg-white/5" aria-label="Mes siguiente">›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted">{DIAS_SEM.map((d) => <div key={d}>{d}</div>)}</div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {celdas.map((f, i) => {
          if (!f) return <div key={`v${i}`} />;
          const n = mapa.get(f);
          const hay = dias.includes(f);
          return (
            <button key={f} type="button" disabled={!hay} onClick={() => onDia?.(f)} aria-pressed={sel === f} data-dia={f} data-nivel-dia={n || "ok"}
              className={`relative aspect-square rounded-lg border text-xs font-semibold ${sel === f ? "border-accent ring-2 ring-accent/60" : "border-line"} ${hay ? "hover:brightness-110" : "opacity-30"}`}
              style={hay ? { background: `color-mix(in oklab, ${COLOR_NIVEL[n || "ok"]} ${n && n !== "ok" ? 38 : 10}%, transparent)` } : undefined} aria-label={`${fFecha(f)}: ${ETIQUETA_NIVEL[n || "ok"]}`}>
              {Number(f.slice(-2))}
              {marcados?.has(f) && <span className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-cyan" />}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted">
        {["ok", "critico", "urgente", "moderado", "info"].map((n) => <span key={n} className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLOR_NIVEL[n] }} />{ETIQUETA_NIVEL[n]}</span>)}
        {marcados && <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-cyan" />Prueba hecha</span>}
      </div>
    </div>
  );
}

function RadarSemana({ datos }) {
  const { c } = useTheme();
  return (
    <div className="h-56" data-radar-semana>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={datos} outerRadius="70%">
          <PolarGrid stroke={c.grid} />
          <PolarAngleAxis dataKey="metrica" tick={{ fill: c.muted, fontSize: 11 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar name="Semana anterior" dataKey="anterior" stroke={c.muted} fill={c.muted} fillOpacity={0.12} isAnimationActive={false} />
          <Radar name="Esta semana" dataKey="actual" stroke={c.accent} fill={c.accent} fillOpacity={0.28} isAnimationActive={false} />
          <Legend wrapperStyle={{ fontSize: 11, color: c.muted }} />
          <Tooltip {...tooltipEstilo(c)} formatter={(v, n) => [`${v} % de días en rango`, n]} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Dona({ datos }) {
  const { c } = useTheme();
  const colores = { ok: c.ok, info: c.info, muted: "rgba(255,255,255,0.14)" };
  return (
    <div className="flex items-center gap-4" data-dona>
      <div className="h-40 w-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={datos} dataKey="valor" nameKey="nombre" innerRadius="62%" outerRadius="95%" stroke="none" isAnimationActive={false}>
              {datos.map((d) => <Cell key={d.nombre} fill={colores[d.color] || c.accent} />)}
            </Pie>
            <Tooltip {...tooltipEstilo(c)} formatter={(v, n, x) => [`${v} ${x?.payload?.unidad || ""}`.trim(), n]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-2 text-sm">
        {datos.map((d) => <li key={d.nombre} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: colores[d.color] || c.accent }} /><span className="text-soft">{d.nombre}</span> <b className="tabular-nums">{d.valor}</b> <span className="text-muted">{d.unidad}</span></li>)}
      </ul>
    </div>
  );
}

function Semana({ filas }) {
  const max = Math.max(1, ...filas.map((f) => Math.abs(f.cambio || 0)));
  return (
    <ul className="space-y-2.5" data-semana-contra-semana>
      {filas.map((f) => {
        const color = f.mejora == null ? "var(--color-muted)" : f.mejora ? "var(--color-ok)" : "var(--color-crit)";
        return (
          <li key={f.clave} className="text-sm">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-soft">{f.nombre}</span>
              <span className="tabular-nums"><b>{f.actual ?? "—"}</b> <span className="text-xs text-muted">{f.unidad}</span> <span className="text-xs font-semibold" style={{ color }}>{f.cambio == null ? "—" : `${f.cambio > 0 ? "+" : ""}${f.cambio} %`}</span></span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${f.cambio == null ? 0 : Math.max(4, (Math.abs(f.cambio) / max) * 100)}%`, background: color }} /></div>
          </li>
        );
      })}
    </ul>
  );
}

function Linea({ serie, banda, unidad }) {
  const { c } = useTheme();
  const datos = serie.map((x) => ({ ...x, etiqueta: fFecha(x.fecha) }));
  const Punto = ({ cx, cy, payload }) => (cx == null || cy == null ? null : <circle cx={cx} cy={cy} r={4} fill={COLOR_NIVEL[payload.nivel] || COLOR_NIVEL.ok} stroke="#100f13" strokeWidth={1} />);
  return (
    <div className="h-64" data-linea-historial>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={datos} margin={{ top: 18, right: 10, left: -12, bottom: 0 }}>
          <CartesianGrid stroke={c.grid} vertical={false} />
          <XAxis dataKey="etiqueta" stroke={c.muted} fontSize={11} tickLine={false} minTickGap={18} />
          <YAxis stroke={c.muted} fontSize={11} tickLine={false} domain={["auto", "auto"]} width={44} />
          <Tooltip {...tooltipEstilo(c)} formatter={(v) => [`${v} ${unidad || ""}`.trim(), "Resultado"]} />
          {banda && <ReferenceArea y1={banda[0]} y2={banda[1]} fill={c.banda} fillOpacity={0.1} stroke={c.banda} strokeOpacity={0.35} strokeDasharray="4 4" label={{ value: "Tu base", position: "insideTopRight", fill: c.banda, fontSize: 11 }} />}
          <Line type="monotone" dataKey="valor" stroke={c.accent} strokeWidth={2} dot={<Punto />} isAnimationActive={false} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function BarrasSemana({ datos, unidad }) {
  const { c } = useTheme();
  return (
    <div className="h-52" data-barras-dia-semana>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid stroke={c.grid} vertical={false} />
          <XAxis dataKey="dia" stroke={c.muted} fontSize={11} tickLine={false} />
          <YAxis stroke={c.muted} fontSize={11} tickLine={false} />
          <Tooltip {...tooltipEstilo(c)} formatter={(v) => [`${v ?? "—"} ${unidad || ""}`.trim(), "Promedio"]} />
          <Bar dataKey="promedio" fill={c.accent} radius={[4, 4, 0, 0]} maxBarSize={26} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function VistaCategoria({ cat, data, porDia, historial, eventos, dias, registros, onPrueba }) {
  const fechas = useMemo(() => [...porDia.keys()], [porDia]);
  const forma = useMemo(() => formaSemana(itemsForma(cat, { porDia, data }), fechas), [cat, porDia, data, fechas]);
  const reparto = useMemo(() => repartoDia(cat, data, fechas), [cat, data, fechas]);
  const semana = useMemo(() => semanaContraSemana(cat, { data, porDia, fechas }), [cat, data, porDia, fechas]);
  const combos = useMemo(() => combinacionesSemana(cat, { data, porDia, fechas, eventosFicha: eventos }), [cat, data, porDia, fechas, eventos]);
  const [dia, setDia] = useState(null);
  const mapa = peorPorDia(registros, cat);
  const delDia = dia ? registros.filter((r) => r.fecha === dia && r.categoria === cat) : [];
  return (
    <div className="space-y-5" data-vista-categoria={cat}>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="card p-5"><h3 className="etiqueta mb-2">Forma de la semana</h3><RadarSemana datos={forma} /></div>
        <div className="card p-5"><h3 className="etiqueta mb-3">Reparto del día</h3><Dona datos={reparto} /><p className="mt-2 text-xs text-muted">Promedio de los últimos 7 días</p></div>
        <div className="card p-5"><h3 className="etiqueta mb-3">Semana contra semana</h3><Semana filas={semana} /></div>
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="card p-5">
          <h3 className="etiqueta mb-3">Calendario · peor nivel del día</h3>
          <Calendario mapa={mapa} dias={dias} onDia={setDia} sel={dia} />
          {dia && (
            <div className="mt-3 rounded-xl border border-line p-3 text-sm" data-detalle-dia>
              <div className="mb-1 font-semibold">{fFecha(dia)}</div>
              {delDia.length ? <ul className="space-y-1">{delDia.map((r, i) => <li key={i} className="flex items-start gap-2"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: COLOR_NIVEL[r.nivel] }} />{r.fuente === "metrica" ? `${r.clave}: ${ETIQUETA_NIVEL[r.nivel]}` : `${PRUEBAS_POR_ID[r.prueba_id]?.nombre}: ${r.resultado?.valor?.resultado?.texto || ETIQUETA_NIVEL[r.nivel]}`}</li>)}</ul> : <p className="text-muted">Sin alertas ni pruebas en esta categoría.</p>}
            </div>
          )}
        </div>
        <div className="card p-5">
          <h3 className="etiqueta mb-3">Combinaciones de la semana</h3>
          {combos.length ? (
            <ul className="space-y-2" data-combinaciones-semana>
              {combos.map((x) => (
                <li key={x.id} className="flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2 text-sm" data-combinacion-semana={x.id}>
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COLOR_NIVEL[x.nivel] }} />
                  <span className="min-w-0 flex-1">{x.titulo}</span>
                  <span className="shrink-0 text-xs text-muted"><b className="text-fg">{x.veces}</b> {x.veces === 1 ? "vez" : "veces"}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted">Ninguna combinación esta semana.</p>}
        </div>
      </div>
      <div>
        <h3 className="etiqueta mb-3 px-0.5">Pruebas de {CATEGORIAS_PRUEBA[cat].nombre}</h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {pruebasDeCategoria(cat).map((p) => {
            const serie = serieDePrueba(p.id, historial);
            const ult = historial.filter((r) => r.prueba_id === p.id).at(-1);
            return (
              <button key={p.id} type="button" onClick={() => onPrueba(p.id)} className="card glass-hover flex flex-col gap-2 p-4 text-left" data-tarjeta-prueba={p.id}>
                <span className="font-semibold">{p.nombre}</span>
                <span className="text-xs text-muted">{ult ? <>Última: {hace(ult.hecho_en)} · <span style={{ color: COLOR_NIVEL[ult.nivel] }}>{ETIQUETA_NIVEL[ult.nivel]}</span></> : "Sin resultados"}</span>
                <span className="flex items-end justify-between gap-2">
                  <span className="text-xs text-soft">{serie.length} {serie.length === 1 ? "vez" : "veces"}</span>
                  {serie.length > 1 && <Sparkline data={serie.slice(-12).map((x) => x.valor)} w={90} h={28} />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function VistaPrueba({ id, historial, data, rango, dias, onVolver }) {
  const prueba = PRUEBAS_POR_ID[id];
  const [sel, setSel] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const serie = serieDePrueba(id, historial).filter((x) => !rango || x.fecha >= dias[0]);
  const vals = serie.map((x) => x.valor);
  const banda = vals.length >= 4 ? [percentil(vals, 0.1), percentil(vals, 0.9)] : null;
  const unidad = prueba?.compara?.unidad || "";
  const st = statsPrueba(id, historial, { dias: rango, diaMision: data.astronaut.dia_mision, diaRegreso: Number(data.astronaut.dia_regreso) || 180 });
  const mapa = new Map(serie.map((x) => [x.fecha, x.nivel]));
  const marcados = new Set(serie.map((x) => x.fecha));
  const fila = sel ? serie.find((x) => x.id === sel)?.fila : null;
  const copiar = async () => {
    const txt = [`${prueba.nombre} · ${data.astronaut.nombre}`, ...serie.map((x) => `${x.fecha} · ${x.valor} ${unidad} · ${ETIQUETA_NIVEL[x.nivel] || x.nivel} · ${x.origen === "control" ? "celular" : "laptop"}`)].join("\n");
    try {
      await navigator.clipboard.writeText(txt);
    } catch {}
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };
  return (
    <div className="space-y-5" data-vista-prueba={id}>
      <div className="flex flex-wrap items-center gap-3">
        <CyberButton onClick={onVolver} tam="sm" texto={`Volver a ${CATEGORIAS_PRUEBA[prueba.categoria].nombre}`} data-accion="volver-categoria">‹ {CATEGORIAS_PRUEBA[prueba.categoria].nombre}</CyberButton>
        <h2 className="font-display text-2xl font-semibold">{prueba.nombre}</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-stats-prueba>
        <div className="rounded-xl border border-line p-3"><div className="text-xs text-muted">Veces hecha</div><div className="text-2xl font-semibold">{st.veces}</div></div>
        <div className="rounded-xl border border-line p-3"><div className="text-xs text-muted">Cumplimiento</div><div className="text-2xl font-semibold">{st.cumplimiento != null ? `${st.cumplimiento} %` : "—"} <span className="text-sm font-normal text-muted">{st.debidas != null ? `${st.hechas} de ${st.debidas}` : "sin intervalo"}</span></div></div>
        <div className="rounded-xl border border-line p-3"><div className="text-xs text-muted">Mejor · peor</div><div className="text-2xl font-semibold">{st.mejor ?? "—"} <span className="text-muted">·</span> {st.peor ?? "—"} <span className="text-sm font-normal text-muted">{unidad}</span></div></div>
        <div className="rounded-xl border border-line p-3"><div className="text-xs text-muted">Últimos 7 días contra los 7 anteriores</div><div className="text-2xl font-semibold">{st.prom7 ?? "—"} <span className="text-sm font-normal text-muted">vs {st.promPrev7 ?? "—"}{st.cambio != null ? ` (${st.cambio > 0 ? "+" : ""}${st.cambio} %)` : ""}</span></div></div>
      </div>
      <div className="card p-5">
        <h3 className="etiqueta mb-1">Resultados</h3>
        <p className="mb-3 text-xs text-muted">{serie.length} resultados · banda = tu base (percentiles 10–90)</p>
        {serie.length ? <Linea serie={serie} banda={banda} unidad={unidad} /> : <p className="py-8 text-center text-sm text-muted">Sin resultados en este rango.</p>}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="card p-5"><h3 className="etiqueta mb-3">Promedio por día de la semana</h3><BarrasSemana datos={porDiaSemana(serie)} unidad={unidad} /></div>
        <div className="card p-5"><h3 className="etiqueta mb-3">Días en que se hizo</h3><Calendario mapa={mapa} dias={dias} marcados={marcados} /></div>
      </div>
      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="etiqueta">Tabla de resultados</h3>
          {serie.length > 0 && <CyberButton onClick={copiar} tam="sm" texto={copiado ? "Copiado" : "Copiar reporte"}>{copiado ? "✓ Copiado" : "Copiar reporte"}</CyberButton>}
        </div>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm" data-tabla-historial>
              <thead className="text-left text-xs text-muted"><tr><th className="py-1.5">Fecha</th><th>Valor</th><th>Nivel</th><th>Origen</th></tr></thead>
              <tbody>
                {[...serie].reverse().map((x) => (
                  <tr key={x.id} onClick={() => setSel(x.id)} className={`cursor-pointer border-t border-white/[0.06] hover:bg-white/[0.04] ${sel === x.id ? "bg-white/[0.06]" : ""}`} data-fila-resultado={x.id}>
                    <td className="py-1.5 tabular-nums">{fFecha(x.fecha)}</td>
                    <td className="tabular-nums">{x.valor} {unidad}</td>
                    <td><span style={{ color: COLOR_NIVEL[x.nivel] }}>{ETIQUETA_NIVEL[x.nivel] || x.nivel}</span></td>
                    <td className="text-xs text-muted">{x.origen === "control" ? "Celular" : "Laptop"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>{fila ? <DetalleRespuestas fila={fila} /> : <p className="text-sm text-muted">Toca un resultado para ver todas sus respuestas.</p>}</div>
        </div>
      </div>
    </div>
  );
}

function useTripulacionDias(astronauts, activo, dias) {
  const [filas, setFilas] = useState(null);
  const clave = (astronauts || []).map((a) => a.id).join(",");
  useEffect(() => {
    if (!activo || !clave) return;
    let vivo = true;
    (async () => {
      const out = [];
      for (const a of astronauts) {
        const d = await loadData(a.id).catch(() => null);
        if (!d) continue;
        const fechas = d.vitals.map((v) => v.fecha).slice(-dias);
        const por = new Map(fechas.map((f) => [f, analizarDia(d, f)]));
        out.push({ a, fechas, registros: registrosDeDias(por) });
      }
      if (vivo) setFilas(out);
    })();
    return () => {
      vivo = false;
    };
  }, [clave, activo, dias]);
  return filas;
}

export default function Estadisticas({ data, porDia, aid, astronauts, onAstronaut, children }) {
  const { historial } = useHistorialPruebas(data?.astronaut?.id, data);
  const fichas = useFichas(data?.astronaut?.id);
  const [rango, setRango] = useState(30);
  const [tab, setTab] = useState("corazon");
  const [prueba, setPrueba] = useState(null);
  const [tripulacion, setTripulacion] = useState(false);
  const filasTrip = useTripulacionDias(astronauts, tripulacion, rango || 30);

  useEffect(() => {
    setPrueba(null);
  }, [aid]);

  const registros = useMemo(() => enRango([...registrosDeDias(porDia), ...registrosDeResultados(historial)], rango), [porDia, historial, rango]);
  const dias = useMemo(() => {
    const todas = [...porDia.keys()];
    return rango ? todas.slice(-rango) : todas;
  }, [porDia, rango]);
  const comunes = { data, porDia, historial, eventos: fichas.eventos, dias, registros };
  const abrirPrueba = (id) => {
    setPrueba(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section className="space-y-5" data-estadisticas>
      <div className="card flex flex-wrap items-end gap-3 p-4">
        <label className="flex flex-col gap-1 text-xs text-muted">Astronauta
          <select value={tripulacion ? "trip" : String(aid)} onChange={(e) => { if (e.target.value === "trip") setTripulacion(true); else { setTripulacion(false); onAstronaut(Number(e.target.value)); } }} className="campo h-10" data-filtro-astronauta>
            {astronauts.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            <option value="trip">Tripulación</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">Rango
          <select value={String(rango)} onChange={(e) => setRango(e.target.value === "null" ? null : Number(e.target.value))} className="campo h-10" data-filtro-rango>
            {RANGOS.map(([v, t]) => <option key={t} value={String(v)}>{t}</option>)}
          </select>
        </label>
      </div>

      <nav className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 min-[900px]:flex-wrap" role="tablist" aria-label="Categorías del historial">
        {PESTANAS.map(([k, t]) => (
          <BotonPestana key={k} onClick={() => { setTab(k); setPrueba(null); setTripulacion(false); }} activo={!tripulacion && tab === k} role="tab" aria-selected={tab === k} data-tab-historial={k} className="shrink-0">{t}</BotonPestana>
        ))}
      </nav>

      {tripulacion ? (
        <div className="card p-5" data-vista-tripulacion>
          <h2 className="mb-3 font-semibold">Tripulación · peor nivel por día</h2>
          {!filasTrip ? <p className="text-sm text-muted">Cargando tripulación…</p> : (
            <div className="space-y-4">
              {filasTrip.map(({ a, fechas, registros: rg }) => (
                <div key={a.id}>
                  <div className="mb-1.5 text-sm font-semibold">{a.nombre}</div>
                  <div className="space-y-1">
                    {["corazon", "mente", "espacio"].map((c) => {
                      const m = peorPorDia(rg, c);
                      return (
                        <div key={c} className="flex items-center gap-2">
                          <span className="w-20 shrink-0 text-[11px] text-muted">{CATEGORIAS_PRUEBA[c].corto}</span>
                          <div className="flex flex-1 gap-[2px]">
                            {fechas.map((f) => <span key={f} title={`${fFecha(f)}: ${ETIQUETA_NIVEL[m.get(f) || "ok"]}`} className="h-4 flex-1 rounded-[3px]" style={{ background: `color-mix(in oklab, ${COLOR_NIVEL[m.get(f) || "ok"]} ${m.get(f) ? 70 : 18}%, transparent)` }} />)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : tab === "historia" ? (
        children
      ) : prueba ? (
        <VistaPrueba key={prueba} id={prueba} historial={historial} data={data} rango={rango} dias={dias} onVolver={() => setPrueba(null)} />
      ) : tab === "completo" ? (
        <div className="space-y-10" data-completo>
          {["corazon", "mente", "espacio", "diario"].map((c) => (
            <div key={c}>
              <h2 className="titulo-pagina mb-4 !text-2xl">{CATEGORIAS_PRUEBA[c].nombre}</h2>
              <VistaCategoria cat={c} {...comunes} onPrueba={(id) => { setTab(PRUEBAS_POR_ID[id].categoria); abrirPrueba(id); }} />
            </div>
          ))}
        </div>
      ) : (
        <VistaCategoria key={tab} cat={tab} {...comunes} onPrueba={abrirPrueba} />
      )}
    </section>
  );
}
