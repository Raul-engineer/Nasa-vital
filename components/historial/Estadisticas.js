"use client";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import CyberButton from "@/components/CyberButton";
import { analizarDia, fechaLocal, percentil } from "@/lib/analysis";
import { COLOR_NIVEL, ETIQUETA_NIVEL, TITULOS } from "@/lib/fichas";
import { CATEGORIAS_PRUEBA, ORDEN_CATEGORIAS, PRUEBAS_CATALOGO, PRUEBAS_POR_ID } from "@/lib/pruebas";
import { alertasPorSemana, conteoPorNivel, cumplimiento, enRango, METRICAS_CATEGORIA, NIVELES_ALERTA, peorPorDia, registrosDeDias, registrosDeResultados, resumenFichas, serieDeMetrica, serieDePrueba } from "@/lib/historial";
import { loadData } from "@/lib/data";
import { useFichas, useHistorialPruebas } from "@/lib/useFichas";
import { tooltipEstilo, useTheme } from "@/lib/theme";

const RANGOS = [[7, "7 días"], [30, "30 días"], [null, "Toda la misión"]];
const DIAS_SEM = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const UNIDAD_METRICA = { fc: "lpm", pa: "mmHg", fr: "rpm", spo2: "%", temp: "°C", sueno: "h", huesos: "min" };
const METRICAS_GRAFICA = ["fc", "pa", "fr", "spo2", "temp", "sueno", "huesos"];
const fFecha = (f) => new Date(f + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" });

function Resumen({ titulo, children }) {
  return (
    <div className="rounded-xl border border-line p-3">
      <div className="text-xs text-muted">{titulo}</div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

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
          const marca = marcados?.has(f);
          return (
            <button key={f} type="button" disabled={!hay} onClick={() => onDia?.(f)} aria-pressed={sel === f} data-dia={f} data-nivel-dia={n || "ok"}
              className={`relative aspect-square rounded-lg border text-xs font-semibold ${sel === f ? "border-accent ring-2 ring-accent/60" : "border-line"} ${hay ? "hover:brightness-110" : "opacity-30"}`}
              style={hay ? { background: `color-mix(in oklab, ${COLOR_NIVEL[n || "ok"]} ${n && n !== "ok" ? 38 : 10}%, transparent)` } : undefined}
              aria-label={`${fFecha(f)}: ${ETIQUETA_NIVEL[n || "ok"]}`}>
              {Number(f.slice(-2))}
              {marca && <span className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-cyan" />}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted">
        {["ok", ...NIVELES_ALERTA].map((n) => <span key={n} className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLOR_NIVEL[n] }} />{ETIQUETA_NIVEL[n]}</span>)}
        {marcados && <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-cyan" />Prueba hecha</span>}
      </div>
    </div>
  );
}

function Barras({ datos }) {
  const { c } = useTheme();
  return (
    <div className="h-56" data-barras-semana>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid stroke={c.grid} vertical={false} />
          <XAxis dataKey="etiqueta" stroke={c.muted} fontSize={11} tickLine={false} />
          <YAxis stroke={c.muted} fontSize={11} tickLine={false} allowDecimals={false} />
          <Tooltip {...tooltipEstilo(c)} formatter={(v, n) => [v, ETIQUETA_NIVEL[n]]} />
          {NIVELES_ALERTA.map((n) => <Bar key={n} dataKey={n} stackId="a" fill={COLOR_NIVEL[n]} isAnimationActive={false} maxBarSize={28} />)}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Linea({ serie, banda, unidad, eventos }) {
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
          <Tooltip {...tooltipEstilo(c)} formatter={(v) => [`${v} ${unidad || ""}`.trim(), "Valor"]} />
          {banda && <ReferenceArea y1={banda[0]} y2={banda[1]} fill={c.banda} fillOpacity={0.1} stroke={c.banda} strokeOpacity={0.35} strokeDasharray="4 4" label={{ value: "Tu rango", position: "insideTopRight", fill: c.banda, fontSize: 11 }} />}
          {eventos.map((e, i) => <ReferenceLine key={i} x={fFecha(e.fecha)} stroke={e.color} strokeDasharray="3 3" label={{ value: e.texto, position: "insideTop", fill: e.color, fontSize: 10 }} />)}
          <Line type="monotone" dataKey="valor" stroke={c.accent} strokeWidth={2} dot={<Punto />} isAnimationActive={false} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
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

export default function Estadisticas({ data, porDia, aid, astronauts, onAstronaut }) {
  const { historial } = useHistorialPruebas(data?.astronaut?.id, data);
  const fichas = useFichas(data?.astronaut?.id);
  const [rango, setRango] = useState(30);
  const [cat, setCat] = useState("corazon");
  const [item, setItem] = useState("");
  const [tripulacion, setTripulacion] = useState(false);
  const [dia, setDia] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const filasTrip = useTripulacionDias(astronauts, tripulacion, rango || 30);

  const registros = useMemo(() => enRango([...registrosDeDias(porDia), ...registrosDeResultados(historial)], rango), [porDia, historial, rango]);
  const dias = useMemo(() => {
    const todas = [...porDia.keys()];
    return rango ? todas.slice(-rango) : todas;
  }, [porDia, rango]);

  const mapa = peorPorDia(registros, cat);
  const conteo = conteoPorNivel(registros, cat);
  const cumple = cumplimiento(historial, { categoria: cat, dias: rango || dias.length, diaMision: data.astronaut.dia_mision });
  const fichasRes = resumenFichas(fichas.eventos.filter((e) => !METRICAS_CATEGORIA[cat].length || METRICAS_CATEGORIA[cat].includes(e.clave)), { dias: rango });
  const semanas = alertasPorSemana(registros, cat);
  const delDia = dia ? registros.filter((r) => r.fecha === dia && r.categoria === cat) : [];

  const [tipoItem, claveItem] = item.split(":");
  let serie = [], banda = null, unidad = "";
  if (tipoItem === "m") {
    serie = serieDeMetrica(claveItem, data, porDia).filter((x) => !rango || dias.includes(x.fecha));
    const vals = serie.map((x) => x.valor);
    banda = vals.length >= 5 ? [percentil(vals, 0.1), percentil(vals, 0.9)] : null;
    unidad = UNIDAD_METRICA[claveItem] || "";
  } else if (tipoItem === "p") {
    serie = serieDePrueba(claveItem, historial).filter((x) => !rango || x.fecha >= dias[0]);
    const vals = serie.map((x) => x.valor);
    banda = vals.length >= 4 ? [percentil(vals, 0.1), percentil(vals, 0.9)] : null;
    unidad = PRUEBAS_POR_ID[claveItem]?.compara?.unidad || "";
  }
  const eventos = [
    ...(data.eventos || []).map((e) => ({ fecha: fechaLocal(e.inicio), texto: `Tormenta ${e.nivel}`, color: COLOR_NIVEL.critico })),
    ...historial.filter((r) => r.prueba_id === "diario_sueno" && r.valor?.respuestas?.somnifero === "si").map((r) => ({ fecha: fechaLocal(r.hecho_en), texto: "Somnífero", color: COLOR_NIVEL.info })),
    ...fichas.medicamentos.filter((m) => /zolpidem|zaleplon|melatonina/i.test(m.nombre)).map((m) => ({ fecha: fechaLocal(m.tomado_en), texto: "Somnífero", color: COLOR_NIVEL.info })),
    ...fichas.eventos.filter((e) => e.nivel === "critico").map((e) => ({ fecha: fechaLocal(e.abierto_en), texto: "Emergencia", color: COLOR_NIVEL.critico })),
    ...historial.filter((r) => r.prueba_id === "ejercicio_registro" && (r.valor?.resultado?.valor || 0) >= 100).slice(-3).map((r) => ({ fecha: fechaLocal(r.hecho_en), texto: "Ejercicio", color: COLOR_NIVEL.ok })),
  ].filter((e) => serie.some((x) => x.fecha === e.fecha));
  const marcados = tipoItem === "p" ? new Set(serie.map((x) => x.fecha)) : null;
  const mapaItem = tipoItem ? new Map(serie.map((x) => [x.fecha, x.nivel])) : null;

  const copiar = async () => {
    const nombre = tipoItem === "m" ? TITULOS[claveItem] : PRUEBAS_POR_ID[claveItem]?.nombre;
    const txt = [`${nombre} · ${data.astronaut.nombre}`, ...serie.map((x) => `${x.fecha} · ${x.valor} ${unidad} · ${ETIQUETA_NIVEL[x.nivel] || x.nivel}${x.texto ? ` · ${x.texto}` : ""}`)].join("\n");
    try {
      await navigator.clipboard.writeText(txt);
    } catch {}
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
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
        <label className="flex flex-col gap-1 text-xs text-muted">Categoría
          <select value={cat} onChange={(e) => { setCat(e.target.value); setItem(""); setDia(null); }} className="campo h-10" data-filtro-categoria>
            {ORDEN_CATEGORIAS.map((c) => <option key={c} value={c}>{CATEGORIAS_PRUEBA[c].nombre}</option>)}
          </select>
        </label>
        <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-xs text-muted">Prueba o métrica
          <select value={item} onChange={(e) => setItem(e.target.value)} className="campo h-10" data-filtro-item>
            <option value="">Toda la categoría</option>
            <optgroup label="Métricas">{METRICAS_CATEGORIA[cat].filter((k) => METRICAS_GRAFICA.includes(k)).map((k) => <option key={k} value={`m:${k}`}>{TITULOS[k]}</option>)}</optgroup>
            <optgroup label="Pruebas">{PRUEBAS_CATALOGO.filter((p) => p.categoria === cat).map((p) => <option key={p.id} value={`p:${p.id}`}>{p.nombre}</option>)}</optgroup>
          </select>
        </label>
      </div>

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
      ) : !item ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-resumen-categoria>
            <Resumen titulo="Alertas por nivel">
              <div className="flex flex-wrap gap-2 text-sm">{NIVELES_ALERTA.map((n) => <span key={n} className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ background: COLOR_NIVEL[n] }} /><b>{conteo[n]}</b> <span className="text-muted">{ETIQUETA_NIVEL[n]}</span></span>)}</div>
            </Resumen>
            <Resumen titulo="Cumplimiento de pruebas">
              <div className="text-2xl font-semibold">{cumple.pct != null ? `${cumple.pct} %` : "—"} <span className="text-sm font-normal text-muted">{cumple.hechas} de {cumple.debidas}</span></div>
            </Resumen>
            <Resumen titulo="Fichas resueltas · escaladas">
              <div className="text-2xl font-semibold"><span className="text-ok">{fichasRes.resueltas}</span> <span className="text-muted">·</span> <span className="text-warn">{fichasRes.escaladas}</span> <span className="text-sm font-normal text-muted">de {fichasRes.total}</span></div>
            </Resumen>
            <Resumen titulo="Tiempo promedio hasta resolver">
              <div className="text-2xl font-semibold">{fichasRes.promedioMin != null ? `${fichasRes.promedioMin} min` : "—"}</div>
            </Resumen>
          </div>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="card p-5">
              <h2 className="mb-3 font-semibold">{CATEGORIAS_PRUEBA[cat].nombre} · peor nivel por día</h2>
              <Calendario mapa={mapa} dias={dias} onDia={setDia} sel={dia} />
              {dia && (
                <div className="mt-3 rounded-xl border border-line p-3 text-sm" data-detalle-dia>
                  <div className="mb-1 font-semibold">{fFecha(dia)}</div>
                  {delDia.length ? (
                    <ul className="space-y-1">{delDia.map((r, i) => <li key={i} className="flex items-start gap-2"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: COLOR_NIVEL[r.nivel] }} />{r.fuente === "metrica" ? `${TITULOS[r.clave]}: ${ETIQUETA_NIVEL[r.nivel]}` : `${PRUEBAS_POR_ID[r.prueba_id]?.nombre}: ${r.resultado?.valor?.resultado?.texto || ETIQUETA_NIVEL[r.nivel]}`}</li>)}</ul>
                  ) : <p className="text-muted">Sin alertas ni pruebas en esta categoría.</p>}
                </div>
              )}
            </div>
            <div className="card p-5">
              <h2 className="mb-3 font-semibold">Alertas por semana</h2>
              {semanas.length ? <Barras datos={semanas} /> : <p className="text-sm text-muted">Sin alertas en este rango.</p>}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="card p-5">
            <h2 className="mb-1 font-semibold">{tipoItem === "m" ? TITULOS[claveItem] : PRUEBAS_POR_ID[claveItem]?.nombre}</h2>
            <p className="mb-3 text-xs text-muted">{serie.length} registros · banda = tu rango personal (percentiles 10–90)</p>
            {serie.length ? <Linea serie={serie} banda={banda} unidad={unidad} eventos={eventos} /> : <p className="py-8 text-center text-sm text-muted">Sin registros en este rango.</p>}
          </div>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
            <div className="card p-5">
              <h2 className="mb-3 font-semibold">{tipoItem === "p" ? "Días en que hiciste la prueba" : "Días por nivel"}</h2>
              <Calendario mapa={mapaItem} dias={dias} marcados={marcados} />
            </div>
            <div className="card p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="font-semibold">Resultados</h2>
                {serie.length > 0 && <CyberButton onClick={copiar} tam="sm" texto={copiado ? "Copiado" : "Copiar reporte"} data-accion="copiar-historial">{copiado ? "✓ Copiado" : "Copiar reporte"}</CyberButton>}
              </div>
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-sm" data-tabla-historial>
                  <thead className="text-left text-xs text-muted"><tr><th className="py-1.5">Fecha</th><th>Valor</th><th>Nivel</th><th>Nota</th></tr></thead>
                  <tbody>
                    {[...serie].reverse().map((x, i) => (
                      <tr key={i} className="border-t border-white/[0.06]">
                        <td className="py-1.5 tabular-nums">{fFecha(x.fecha)}</td>
                        <td className="tabular-nums">{x.valor} {unidad}</td>
                        <td><span style={{ color: COLOR_NIVEL[x.nivel] }}>{ETIQUETA_NIVEL[x.nivel] || x.nivel}</span></td>
                        <td className="text-xs text-muted">{x.texto || ""}{x.desde_ficha ? ` · desde la ficha de ${TITULOS[x.desde_ficha]}` : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
