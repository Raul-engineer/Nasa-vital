"use client";
import { useId } from "react";
import { Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, LabelList, Pie, PieChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ESTADO } from "@/components/Shell";
import { fmtNum, Ring } from "@/components/Widgets";
import { medicionesPresion } from "@/components/monitor/Presion";
import { ejercicioDia } from "@/components/monitor/Huesos";
import { diaMision, fechaLocal, UMBRALES } from "@/lib/analysis";
import { FASES, hipnograma, horasSobreLimite } from "@/lib/simulado";
import { tooltipEstilo, useTheme } from "@/lib/theme";
import { DEC, IconoEstado, hhmm, promedio, validos } from "./comun";

const DIAS_SEM = ["L", "M", "M", "J", "V", "S", "D"];
const CARAS = ["😣", "🙁", "😐", "🙂", "😄"];

export function Tarjeta({ titulo, children, derecha, className = "" }) {
  return (
    <section className={`card p-5 ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="etiqueta">{titulo}</h2>
        {derecha}
      </div>
      {children}
    </section>
  );
}

function PorDiaSemana({ t, data, dias, color, titulo = "Promedio por día de la semana", serie, unidad }) {
  const { c } = useTheme();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const s = serie || t.serie;
  const fechas = data.vitals.map((v) => v.fecha);
  const n = Math.min(dias, fechas.length);
  const grupos = Array.from({ length: 7 }, () => []);
  fechas.slice(-n).forEach((f, i) => {
    const v = s[s.length - n + i];
    if (v != null && Number.isFinite(Number(v))) grupos[(new Date(f + "T12:00:00").getDay() + 6) % 7].push(Number(v));
  });
  const dec = DEC[t.k] || 0;
  const datos = grupos.map((g, i) => ({ dia: DIAS_SEM[i], v: g.length ? Math.round(promedio(g) * 10 ** dec) / 10 ** dec : null }));
  const vs = validos(datos.map((d) => d.v));
  const lo = Math.min(...vs), hi = Math.max(...vs);
  const pad = Math.max((hi - lo) * 1.2, dec ? 0.3 : 3);
  const col = c[color] || color;
  return (
    <Tarjeta titulo={titulo}>
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} margin={{ top: 20, right: 6, left: -14, bottom: 0 }}>
            <defs>
              <linearGradient id={`g-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={col} stopOpacity={0.95} />
                <stop offset="100%" stopColor={col} stopOpacity={0.15} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={c.grid} vertical={false} />
            <XAxis dataKey="dia" stroke={c.muted} fontSize={12} tickLine={false} />
            <YAxis stroke={c.muted} fontSize={11} tickLine={false} domain={[Math.floor((lo - pad) * 10 ** dec) / 10 ** dec, Math.ceil((hi + pad / 2) * 10 ** dec) / 10 ** dec]} allowDecimals={dec > 0} width={44} />
            <Tooltip {...tooltipEstilo(c)} cursor={{ fill: c.grid }} formatter={(v) => [`${fmtNum(v, dec)} ${unidad ?? t.unidad}`, "Promedio"]} />
            <Bar dataKey="v" fill={`url(#g-${uid})`} radius={[6, 6, 0, 0]} maxBarSize={44} isAnimationActive={false}>
              <LabelList dataKey="v" position="top" fill={c.soft} fontSize={11} formatter={(v) => fmtNum(v, dec)} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Tarjeta>
  );
}

function TablaPresion({ data }) {
  const T = UMBRALES.tarjetas.pa;
  const filas = medicionesPresion(data).slice(-10).reverse();
  return (
    <Tarjeta titulo="Últimas 10 mediciones">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            <th className="etiqueta py-2 font-semibold">Fecha y hora</th>
            <th className="etiqueta py-2 font-semibold">Resultado</th>
            <th className="etiqueta py-2 text-right font-semibold">Estado</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((m, i) => {
            const alta = m.sis >= T.atencionSis || m.dia >= T.atencionDia;
            const baja = m.sis <= T.bajaAtencion;
            const roja = m.sis >= T.rojoSis || m.dia >= T.rojoDia || m.sis <= T.bajaRojo;
            const e = roja ? "critico" : alta || baja ? "atencion" : "normal";
            return (
              <tr key={i} className="border-b border-line/60 last:border-0">
                <td className="num py-2 text-soft">{m.fecha.toLocaleDateString("es-MX", { day: "numeric", month: "short" })} · {hhmm(m.fecha)}</td>
                <td className="py-2"><span className="num text-lg font-semibold">{m.sis}/{m.dia}</span> <span className="text-xs text-muted">mmHg</span></td>
                <td className="py-2"><span className="flex justify-end"><IconoEstado estado={e} icono={alta ? "↑" : baja ? "↓" : "✓"} size={24} /></span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Tarjeta>
  );
}

function Sueno({ data, aid, dias }) {
  const { c } = useTheme();
  const v = data.vitals;
  const anoche = hipnograma(v.at(-1).fecha, aid, v.at(-1).horas_sueno);
  const pie = FASES.map((f) => ({ k: f.k, nombre: f.nombre, v: anoche.totales[f.k], color: f.color })).filter((x) => x.v > 0);
  const total = pie.reduce((s, x) => s + x.v, 0) || 1;
  const n = Math.min(30, dias, v.length);
  const noches = v.slice(-n).map((x) => {
    const h = hipnograma(x.fecha, aid, x.horas_sueno);
    return { dia: `D${diaMision(data.astronaut, x.fecha)}`, ...h.totales };
  });
  return (
    <div className="grid gap-5 lg:grid-cols-[400px_minmax(0,1fr)]">
      <Tarjeta titulo="Fases de anoche">
        <div className="flex items-center gap-4">
          <div className="relative h-36 w-36 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pie} dataKey="v" nameKey="nombre" innerRadius="64%" outerRadius="100%" stroke="none" paddingAngle={2} isAnimationActive={false}>
                  {pie.map((x) => <Cell key={x.k} fill={x.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="num text-2xl font-semibold">{fmtNum(anoche.horas, 1)}</span>
              <span className="text-[10px] text-muted">horas</span>
            </div>
          </div>
          <ul className="flex-1 space-y-1.5 whitespace-nowrap text-sm">
            {FASES.map((f) => (
              <li key={f.k} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: f.color }} />
                <span className="flex-1">{f.nombre}</span>
                <span className="num text-soft">{fmtNum(anoche.totales[f.k], 1)} h</span>
                <span className="num w-10 text-right text-muted">{Math.round((anoche.totales[f.k] / total) * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>
      </Tarjeta>
      <Tarjeta titulo={`Fases por noche · ${n} noches`}>
        <div style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={noches} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={c.grid} vertical={false} />
              <XAxis dataKey="dia" stroke={c.muted} fontSize={11} tickLine={false} minTickGap={14} />
              <YAxis stroke={c.muted} fontSize={11} tickLine={false} width={40} domain={[0, 10]} />
              <Tooltip {...tooltipEstilo(c)} cursor={{ fill: c.grid }} formatter={(x, nom) => [`${fmtNum(x, 2)} h`, nom]} />
              <ReferenceLine y={UMBRALES.suenoMetaHoras} stroke={c.warn} strokeDasharray="5 5" />
              {[...FASES].reverse().map((f) => <Bar key={f.k} dataKey={f.k} name={f.nombre} stackId="s" fill={f.color} maxBarSize={16} isAnimationActive={false} />)}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Tarjeta>
    </div>
  );
}

function DosisMision({ data, analisis }) {
  const { c } = useTheme();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const r = analisis.radiacion;
  const L = UMBRALES.radiacion.limiteCarrera;
  const diasPrevios = Math.max(0, (data.astronaut?.dia_mision || 142) - data.vitals.length);
  let acum = r.previa + diasPrevios * r.baseDia;
  const datos = data.vitals.map((v) => {
    acum += Number(v.dosis_dia_msv) || 0;
    return { dia: `D${diaMision(data.astronaut, v.fecha)}`, fecha: v.fecha, acum: Math.round(acum * 10) / 10 };
  });
  const tormentas = (data.eventos || []).map((e) => {
    const ini = fechaLocal(e.inicio);
    const fin = fechaLocal(e.fin) || datos.at(-1)?.fecha;
    const a = datos.find((d) => d.fecha >= ini);
    const b = [...datos].reverse().find((d) => d.fecha <= fin);
    return a && b ? { x1: a.dia, x2: b.dia, nivel: e.nivel } : null;
  }).filter(Boolean);
  const col = r.activo ? c.crit : "#a78bfa";
  return (
    <Tarjeta titulo="Dosis acumulada de carrera">
      <div style={{ height: 230 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={datos} margin={{ top: 20, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id={`r-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={col} stopOpacity={0.55} />
                <stop offset="100%" stopColor={col} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={c.grid} vertical={false} />
            <XAxis dataKey="dia" stroke={c.muted} fontSize={11} tickLine={false} minTickGap={24} />
            <YAxis stroke={c.muted} fontSize={11} tickLine={false} width={44} domain={[0, L + 50]} />
            <Tooltip {...tooltipEstilo(c)} formatter={(v) => [`${fmtNum(v, 1)} mSv`, "Acumulado"]} />
            {tormentas.map((x, i) => (
              <ReferenceArea key={i} x1={x.x1} x2={x.x2} fill={c.crit} fillOpacity={0.18} stroke={c.crit} strokeOpacity={0.5}
                label={{ value: `Tormenta ${x.nivel}`, position: "insideTopLeft", fill: c.crit, fontSize: 11 }} />
            ))}
            <ReferenceLine y={L} stroke={c.crit} strokeDasharray="6 4" label={{ value: `Límite ${L} mSv`, position: "insideTopRight", fill: c.crit, fontSize: 11 }} />
            <Area type="monotone" dataKey="acum" stroke={col} strokeWidth={2.4} fill={`url(#r-${uid})`} dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Tarjeta>
  );
}

function Animo({ data, analisis }) {
  const { c } = useTheme();
  const T = UMBRALES.tarjetas.animo;
  const who5 = (data.pruebas || []).filter((p) => p.tipo === "who5").sort((a, b) => String(a.creada_en || a.fecha).localeCompare(String(b.creada_en || b.fecha))).slice(-12)
    .map((p) => ({ sem: new Date(p.fecha + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" }), v: Number(p.resultado?.puntaje) }));
  const porFecha = new Map(data.checkins.map((x) => [x.fecha, x]));
  const semana = data.vitals.slice(-7).map((v) => {
    const ci = v.fecha === analisis.fecha ? analisis.checkinHoy : porFecha.get(v.fecha) || {};
    return { fecha: v.fecha, dia: DIAS_SEM[(new Date(v.fecha + "T12:00:00").getDay() + 6) % 7], animo: ci.animo != null ? Number(ci.animo) : null };
  });
  const colDe = (v) => (v <= T.who5Rojo ? c.crit : v <= T.who5Atencion ? c.warn : "#c4b5fd");
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Tarjeta titulo="WHO-5 por semana">
        <div style={{ height: 190 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={who5} margin={{ top: 18, right: 6, left: -16, bottom: 0 }}>
              <CartesianGrid stroke={c.grid} vertical={false} />
              <XAxis dataKey="sem" stroke={c.muted} fontSize={11} tickLine={false} minTickGap={10} />
              <YAxis stroke={c.muted} fontSize={11} tickLine={false} width={40} domain={[0, 100]} />
              <Tooltip {...tooltipEstilo(c)} cursor={{ fill: c.grid }} formatter={(v) => [`${v}/100`, "WHO-5"]} />
              <ReferenceLine y={T.who5Atencion} stroke={c.warn} strokeDasharray="5 5" label={{ value: "50", position: "insideTopLeft", fill: c.warn, fontSize: 11 }} />
              <Bar dataKey="v" radius={[6, 6, 0, 0]} maxBarSize={30} isAnimationActive={false}>
                {who5.map((x, i) => <Cell key={i} fill={colDe(x.v)} />)}
                <LabelList dataKey="v" position="top" fill={c.soft} fontSize={11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Tarjeta>
      <Tarjeta titulo="Ánimo de la semana">
        <div className="grid grid-cols-7 gap-1 text-center">
          {semana.map((d) => (
            <div key={d.fecha} className="flex flex-col items-center gap-1">
              <span className="text-3xl leading-none" aria-label={d.animo ? `Ánimo ${d.animo} de 5` : "Sin registro"}>{d.animo ? CARAS[d.animo - 1] : "·"}</span>
              <span className="num text-xs text-soft">{d.animo ?? "—"}</span>
              <span className="text-[11px] font-semibold text-muted">{d.dia}</span>
            </div>
          ))}
        </div>
      </Tarjeta>
    </div>
  );
}

function Calendario({ data, analisis, colorDe, leyenda, titulo }) {
  const porFecha = new Map(data.checkins.map((x) => [x.fecha, x]));
  const fechas = data.vitals.map((v) => v.fecha);
  const primero = (new Date(fechas[0] + "T12:00:00").getDay() + 6) % 7;
  const celdas = [...Array(primero).fill(null), ...fechas];
  const semanas = [];
  for (let i = 0; i < celdas.length; i += 7) semanas.push(celdas.slice(i, i + 7));
  return (
    <Tarjeta titulo={titulo} derecha={<span className="flex flex-wrap gap-3 text-xs text-muted">{leyenda.map(([col, txt]) => <span key={txt} className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: col }} />{txt}</span>)}</span>}>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <div className="grid grid-rows-7 gap-1 pr-1 text-[10px] text-muted">{DIAS_SEM.map((d, i) => <span key={i} className="flex h-4 items-center">{d}</span>)}</div>
        {semanas.map((s, i) => (
          <div key={i} className="grid grid-rows-7 gap-1">
            {Array.from({ length: 7 }, (_, j) => {
              const f = s[j];
              if (!f) return <span key={j} className="h-4 w-4" />;
              const ci = f === analisis.fecha ? analisis.checkinHoy : porFecha.get(f) || {};
              const [col, txt] = colorDe(ci);
              return <span key={j} title={`${new Date(f + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" })}: ${txt}`} className={`h-4 w-4 rounded-[4px] ${f === analisis.fecha ? "ring-2 ring-cyan" : ""}`} style={{ background: col }} />;
            })}
          </div>
        ))}
      </div>
    </Tarjeta>
  );
}

function Huesos({ t, data, dias }) {
  const presc = t.prescrito || 120;
  const ult7 = data.vitals.slice(-7).map(ejercicioDia);
  const fza = promedio(ult7.map((d) => d.fuerza)) || 0;
  const car = promedio(ult7.map((d) => d.cardio)) || 0;
  const cumplidos = ult7.filter((d) => d.total >= presc).length;
  const anillos = [["Fuerza", fza / (presc * 0.55), "#86efac"], ["Cardio", car / (presc * 0.45), "#22d3ee"], ["Días cumplidos", cumplidos / 7, "#fbbf24"]];
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <Tarjeta titulo="Metas de la semana">
        <div className="flex flex-wrap items-center justify-around gap-4">
          {anillos.map(([nom, p, col]) => (
            <div key={nom} className="flex flex-col items-center gap-1">
              <Ring value={Math.min(1, p)} max={1} size={104} stroke={11} color={col}>
                <span className="num text-xl font-semibold">{Math.round(p * 100)}%</span>
              </Ring>
              <span className="text-xs font-semibold text-soft">{nom}</span>
            </div>
          ))}
        </div>
      </Tarjeta>
      <PorDiaSemana t={t} data={data} dias={dias} color="#86efac" titulo="% de lo prescrito por día de la semana" unidad="%" />
    </div>
  );
}

function CabinaHoras({ data, aid, dias }) {
  const { c } = useTheme();
  const lim = UMBRALES.cabina.co2AtencionPpm;
  const porFecha = new Map((data.cabina || []).map((x) => [x.fecha, x]));
  const n = Math.min(dias, data.vitals.length);
  const datos = data.vitals.slice(-n).map((v) => ({ dia: `D${diaMision(data.astronaut, v.fecha)}`, h: horasSobreLimite(v.fecha, aid, porFecha.get(v.fecha)?.co2_ppm, lim) }));
  return (
    <Tarjeta titulo="Horas por día sobre 3,500 ppm">
      <div style={{ height: 190 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} margin={{ top: 14, right: 6, left: -18, bottom: 0 }}>
            <CartesianGrid stroke={c.grid} vertical={false} />
            <XAxis dataKey="dia" stroke={c.muted} fontSize={11} tickLine={false} minTickGap={14} />
            <YAxis stroke={c.muted} fontSize={11} tickLine={false} width={40} domain={[0, 24]} ticks={[0, 6, 12, 18, 24]} />
            <Tooltip {...tooltipEstilo(c)} cursor={{ fill: c.grid }} formatter={(v) => [`${v} h`, "Sobre el límite"]} />
            <Bar dataKey="h" radius={[4, 4, 0, 0]} maxBarSize={18} isAnimationActive={false}>
              {datos.map((x, i) => <Cell key={i} fill={x.h > 12 ? c.crit : x.h > 0 ? c.warn : "#94a3b8"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Tarjeta>
  );
}

export function GraficaExtra({ k, t, analisis, data, aid, dias }) {
  if (k === "fc") return <PorDiaSemana t={t} data={data} dias={dias} color="#4ade80" />;
  if (k === "spo2") return <PorDiaSemana t={t} data={data} dias={dias} color="#22d3ee" />;
  if (k === "fr") return <PorDiaSemana t={t} data={data} dias={dias} color="#facc15" />;
  if (k === "temp") return <PorDiaSemana t={t} data={data} dias={dias} color="#fb923c" />;
  if (k === "pa") return <TablaPresion data={data} />;
  if (k === "sueno") return <Sueno data={data} aid={aid} dias={dias} />;
  if (k === "radiacion") return <DosisMision data={data} analisis={analisis} />;
  if (k === "animo") return <Animo data={data} analisis={analisis} />;
  if (k === "huesos") return <Huesos t={t} data={data} dias={dias} />;
  if (k === "cabina") return <CabinaHoras data={data} aid={aid} dias={dias} />;
  if (k === "vision")
    return <Calendario data={data} analisis={analisis} titulo="Síntomas de visión en la misión"
      leyenda={[["rgba(148,163,184,0.28)", "Sin síntomas"], ["var(--color-warn)", "Con síntomas"]]}
      colorDe={(ci) => (ci.vision_borrosa || ci.dolor_cabeza || ci.vision_cefalea ? ["var(--color-warn)", "con síntomas"] : ["rgba(148,163,184,0.28)", "sin síntomas"])} />;
  if (k === "conciencia")
    return <Calendario data={data} analisis={analisis} titulo="Conciencia en la misión"
      leyenda={[[ESTADO.normal.hex, "Alerta"], [ESTADO.atencion.hex, "Mareo"], [ESTADO.critico.hex, "Confusión"]]}
      colorDe={(ci) => (ci.confusion ? [ESTADO.critico.hex, "confusión"] : ci.mareo_de_pie ? [ESTADO.atencion.hex, "mareo"] : [`color-mix(in oklab, ${ESTADO.normal.hex} 70%, transparent)`, "alerta"])} />;
  return null;
}
