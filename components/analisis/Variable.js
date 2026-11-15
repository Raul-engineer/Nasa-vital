"use client";
import { useState } from "react";
import { Icon } from "@/components/Icons";
import CyberButton from "@/components/CyberButton";
import { Dot, ESTADO } from "@/components/Shell";
import { Fuente, fmtNum } from "@/components/Widgets";
import { TrendChart } from "@/components/Charts";
import { Monitor } from "@/components/monitor";
import { semanasVision } from "@/components/monitor/Vision";
import { ejercicioDia } from "@/components/monitor/Huesos";
import { diaMision, PRUEBAS, UMBRALES } from "@/lib/analysis";
import { planDeAlerta } from "@/lib/medic";
import { BarraRango } from "./Rango";
import { GraficaExtra } from "./Extras";
import { RadiacionExtra } from "./RadiacionExtra";
import { ChipEstado, DEC, Indicador, NIVEL, Pildoras, fechaCorta, promedio, simboloEstado, validos } from "./comun";

const PERIODOS = [["7", "7D"], ["30", "30D"], ["90", "90D"], ["mision", "Misión"]];
const AGRUPAR = [["dia", "Diario"], ["semana", "Semanal"]];
const BLOQUES = [["ahora", "Ahora"], ["hoy", "Hoy"], ["prevenir", "Para prevenir"], ["escalar", "Cuándo escalar"]];
const PALABRA_AHORA = { fc: "en vivo", spo2: "en vivo", fr: "en vivo", temp: "en vivo", pa: "brazalete", radiacion: "dosímetro", sueno: "anoche", animo: "WHO-5", huesos: "hoy", cabina: "tu módulo", conciencia: "check-in", vision: "check-in" };
const SIN_RANGO = new Set(["conciencia", "vision"]);
const CATEGORICAS = new Set(["conciencia", "vision"]);

function Flecha({ actual, previo }) {
  if (actual == null || previo == null || !previo) return null;
  const p = ((actual - previo) / Math.abs(previo)) * 100;
  return <span className="num text-soft">{Math.abs(p) < 0.05 ? "=" : p > 0 ? "↑" : "↓"} {fmtNum(Math.abs(p), 1)} %</span>;
}

function racha(arr, cond) {
  let n = 0;
  for (let i = arr.length - 1; i >= 0; i--) {
    if (cond(arr[i])) n++;
    else break;
  }
  return n;
}

function Indicadores({ k, t, analisis, data, n, etiquetaP }) {
  const E = ESTADO[t.estado] || ESTADO.normal;
  const dec = DEC[k] || 0;
  const s = t.serie.slice(-n);
  const v = validos(s);
  let items;
  if (k === "radiacion") {
    const r = analisis.radiacion;
    const c = (p) => (p >= UMBRALES.radiacion.criticoPct ? ESTADO.critico.color : p >= UMBRALES.radiacion.atencionPct ? ESTADO.atencion.color : "");
    items = [
      { etiqueta: "Ahora", icono: "rad", valor: fmtNum(r.tasa), unidad: "µSv/h", palabra: "dosímetro", color: E.color },
      { etiqueta: "Hoy", icono: "clock", valor: fmtNum(r.hoy, 2), unidad: "mSv", palabra: "dosis del día" },
      { etiqueta: "Carrera", icono: "shield", valor: Math.round(r.pct * 100), unidad: "%", palabra: `${fmtNum(r.carrera)} de ${UMBRALES.radiacion.limiteCarrera} mSv`, color: c(r.pct) },
      { etiqueta: "30 días", icono: "calendar", valor: Math.round(r.pct30 * 100), unidad: "%", palabra: `${fmtNum(r.ventana30)} de ${UMBRALES.radiacion.limite30d} mSv`, color: c(r.pct30) },
    ];
  } else if (k === "conciencia") {
    const ult = [...data.checkins].reverse()[0];
    items = [
      { etiqueta: "Días alerta", icono: "check", valor: s.filter((x) => x === 0).length, unidad: `de ${v.length}`, palabra: etiquetaP },
      { etiqueta: "Días con mareo", icono: "standing", valor: s.filter((x) => x === 1).length, palabra: etiquetaP, color: s.some((x) => x === 1) ? ESTADO.atencion.color : "" },
      { etiqueta: "Días con confusión", icono: "brain", valor: s.filter((x) => x === 2).length, palabra: etiquetaP, color: s.some((x) => x === 2) ? ESTADO.critico.color : "" },
      { etiqueta: "Último registro", icono: "clipboard", valor: t.texto, palabra: ult ? fechaCorta(ult.fecha) : "—", color: E.color },
    ];
  } else if (k === "vision") {
    const sem = semanasVision(data, analisis, Math.max(1, Math.ceil(n / 7)));
    const am = (data.pruebas || []).filter((p) => p.tipo === "amsler").sort((a, b) => String(b.creada_en || b.fecha).localeCompare(String(a.creada_en || a.fecha)))[0];
    items = [
      { etiqueta: "Semanas sin distorsión", icono: "eye", valor: sem.filter((x) => x.amsler !== "distorsion").length, unidad: `de ${sem.length}`, palabra: etiquetaP },
      { etiqueta: "Días con síntomas", icono: "alert", valor: s.filter((x) => x > 0).length, palabra: etiquetaP, color: s.some((x) => x > 0) ? ESTADO.atencion.color : "" },
      { etiqueta: "Última Amsler", icono: "target", valor: am ? (am.resultado?.od || am.resultado?.oi ? "✕" : "✓") : "—", palabra: am ? fechaCorta(am.fecha) : "sin registro" },
      { etiqueta: "Estado", icono: "info", valor: t.texto, palabra: t.estado === "normal" ? "sin síntomas" : t.etiqueta, color: E.color },
    ];
  } else if (k === "sueno") {
    items = [
      { etiqueta: "Anoche", icono: "moon", valor: fmtNum(t.valor, 1), unidad: "h", palabra: "anoche", color: E.color },
      { etiqueta: "Promedio", icono: "chart", valor: fmtNum(promedio(v), 1), unidad: "h", palabra: etiquetaP },
      { etiqueta: "Noches < 7 h", icono: "alert", valor: v.filter((x) => x < UMBRALES.suenoMetaHoras).length, unidad: `de ${v.length}`, palabra: etiquetaP, color: v.some((x) => x < UMBRALES.suenoMetaHoras) ? ESTADO.atencion.color : "" },
      { etiqueta: "Última reacción", icono: "target", valor: t.reaccion ?? "—", unidad: "ms", palabra: t.reaccionBase ? `normal ${Math.round(t.reaccionBase)} ms` : "PVT-B", color: t.reaccionPct > UMBRALES.tarjetas.sueno.reaccionLentaPct ? ESTADO.atencion.color : "" },
    ];
  } else if (k === "huesos") {
    const presc = t.prescrito || 120;
    const tot = data.vitals.map((x) => ejercicioDia(x).total);
    const cumplidos = tot.slice(-7).filter((x) => x >= presc).length;
    const rOk = racha(tot, (x) => x >= presc);
    items = [
      { etiqueta: "Hoy", icono: "dumbbell", valor: t.valor, unidad: "%", palabra: "de lo prescrito", color: E.color },
      { etiqueta: "Promedio", icono: "chart", valor: Math.round(promedio(v) || 0), unidad: "%", palabra: etiquetaP },
      { etiqueta: "Días cumplidos", icono: "check", valor: cumplidos, unidad: "de 7", palabra: "última semana", color: cumplidos < 5 ? ESTADO.atencion.color : "" },
      rOk ? { etiqueta: "Racha", icono: "bolt", valor: rOk, unidad: "días", palabra: "cumpliendo" } : { etiqueta: "Racha", icono: "bolt", valor: t.racha, unidad: "días", palabra: "debajo de lo prescrito", color: ESTADO.critico.color },
    ];
  } else {
    const prev = t.serie.length >= 2 * n ? validos(t.serie.slice(-2 * n, -n)) : [];
    const prom = promedio(v);
    const fmtPar = (a, b) => (t.serie2 ? `${fmtNum(a)}/${fmtNum(b)}` : fmtNum(a, dec));
    const v2 = t.serie2 ? validos(t.serie2.slice(-n)) : [];
    items = [
      { etiqueta: "Ahora", icono: t.icono, valor: t.texto, unidad: t.unidad, palabra: PALABRA_AHORA[k], color: E.color },
      { etiqueta: "Promedio", icono: "chart", valor: fmtPar(prom, promedio(v2)), unidad: t.unidad, palabra: etiquetaP, extra: <Flecha actual={prom} previo={promedio(prev)} /> },
      { etiqueta: "Mínimo", icono: "trend", valor: v.length ? fmtPar(Math.min(...v), v2.length ? Math.min(...v2) : null) : "—", unidad: t.unidad, palabra: etiquetaP },
      { etiqueta: "Máximo", icono: "trend", valor: v.length ? fmtPar(Math.max(...v), v2.length ? Math.max(...v2) : null) : "—", unidad: t.unidad, palabra: etiquetaP },
    ];
  }
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((it) => <Indicador key={it.etiqueta} {...it} />)}
    </div>
  );
}

function Tendencia({ k, t, data, n, periodo, setPeriodo, agrupar, setAgrupar }) {
  const dec = DEC[k] || 0;
  const vit = data.vitals.slice(-n);
  const off = t.serie.length - n;
  let datos = vit.map((v, i) => ({ dia: `D${diaMision(data.astronaut, v.fecha)}`, v: t.serie[off + i], v2: t.serie2 ? t.serie2[off + i] : undefined }));
  if (agrupar === "semana") {
    const sem = [];
    for (let fin = datos.length; fin > 0; fin -= 7) sem.unshift(datos.slice(Math.max(0, fin - 7), fin));
    const r = (x) => (x == null ? null : Math.round(x * 10 ** dec) / 10 ** dec);
    datos = sem.map((g) => ({ dia: g[0].dia, v: CATEGORICAS.has(k) ? g.filter((x) => x.v > 0).length : r(promedio(validos(g.map((x) => x.v)))), v2: t.serie2 ? r(promedio(validos(g.map((x) => x.v2)))) : undefined }));
  }
  const banda = t.rangoPersonal ? [Math.round(t.rangoPersonal[0] * 10) / 10, Math.round(t.rangoPersonal[1] * 10) / 10] : null;
  const linea = { sueno: [UMBRALES.suenoMetaHoras, "7 h"], huesos: [UMBRALES.tarjetas.huesos.atencionPct, "80 %"], cabina: [UMBRALES.cabina.co2AtencionPpm, "3,500 ppm"], animo: [UMBRALES.tarjetas.animo.who5Atencion, "50"] }[k];
  const series = t.serie2
    ? [{ key: "v", nombre: "Sistólica", color: "accent" }, { key: "v2", nombre: "Diastólica", color: "violet", tipo: "line" }]
    : [{ key: "v", nombre: CATEGORICAS.has(k) ? (agrupar === "semana" ? "Días con eventos" : "Evento") : t.nombre, color: "accent", tipo: CATEGORICAS.has(k) ? "bar" : undefined }];
  return (
    <section className="card p-5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h2 className="etiqueta">Tendencia</h2>
        <div className="flex flex-wrap gap-2">
          <Pildoras opciones={PERIODOS} valor={periodo} onChange={setPeriodo} etiqueta="Periodo" />
          <Pildoras opciones={AGRUPAR} valor={agrupar} onChange={setAgrupar} etiqueta="Agrupar" />
        </div>
      </div>
      <TrendChart datos={datos} series={series} banda={CATEGORICAS.has(k) ? null : banda} bandaTxt={banda ? "Tu rango" : undefined}
        linea={linea?.[0]} lineaTxt={linea?.[1]} unidad={CATEGORICAS.has(k) ? "" : t.unidad} dec={dec} alto={250} />
    </section>
  );
}

function ChipRevisado({ r }) {
  const N = NIVEL[r.estado] || NIVEL.ok;
  const E = ESTADO[N.estado];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-sm ${E.border}`}
      style={{ background: `color-mix(in oklab, ${E.hex} 8%, transparent)` }}>
      <span className="text-muted">{r.variable}</span>
      <span className="num font-semibold">{r.valor}</span>
      <span className={`font-bold ${E.color}`} aria-label={r.estado}>{N.icono}</span>
    </span>
  );
}

function PorQue({ it }) {
  const N = NIVEL[it.nivel] || NIVEL.ok;
  const E = ESTADO[N.estado];
  return (
    <section className={`card flex h-full flex-col gap-3 p-5 ${it.nivel === "bad" ? "glow-crit" : it.nivel === "warn" ? "glow-warn" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="etiqueta">Por qué</h2>
        <Icon name="medic" size={18} className="text-cyan" />
      </div>
      <div className="flex items-center gap-2.5">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 font-bold ${E.border} ${E.color}`}>{N.icono}</span>
        <p className={`text-[18px] font-bold leading-snug ${E.color}`}>{it.conclusion}</p>
      </div>
      <div className="flex flex-wrap gap-2">{it.revisado.map((r, i) => <ChipRevisado key={i} r={r} />)}</div>
    </section>
  );
}

function Prueba({ t, aid }) {
  const p = t.prueba ? PRUEBAS[t.prueba] : null;
  return (
    <section className="card flex h-full flex-col gap-3 p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="etiqueta">Prueba recomendada</h2>
        <Icon name="flask" size={18} className="text-cyan" />
      </div>
      {p ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[18px] font-bold">{p.nombre}</span>
            <span className="num inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-0.5 text-xs text-soft"><Icon name="clock" size={13} />{p.duracion}</span>
          </div>
          <CyberButton href={`/pruebas?a=${aid}&t=${t.prueba}`} tam="lg" atajo="↵" className="mt-auto self-start" texto="Hacer la prueba">Hacer la prueba</CyberButton>
        </>
      ) : (
        <>
          <span className="text-[18px] font-bold text-soft">Sin prueba para este signo</span>
          <CyberButton href={`/pruebas?a=${aid}`} className="mt-auto self-start" texto="Ver todas las pruebas">Ver todas las pruebas</CyberButton>
        </>
      )}
    </section>
  );
}

function QueHacer({ plan, it, clave }) {
  const [hechos, setHechos] = useState({});
  const [todo, setTodo] = useState(false);
  if (!plan) return null;
  const listas = Object.fromEntries(BLOQUES.map(([b]) => [b, b === "ahora" ? [...new Set([...(it.acciones || []), ...plan.bloques.ahora])] : plan.bloques[b]]));
  const hayMas = BLOQUES.some(([b]) => listas[b].length > 2);
  return (
    <section className="card p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="etiqueta">Qué hacer</h2>
        {hayMas && <button onClick={() => setTodo((x) => !x)} className="text-sm font-medium text-cyan hover:underline">{todo ? "ver menos" : "ver más"}</button>}
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {BLOQUES.map(([b, nom]) => (
          <div key={b}>
            <div className={`mb-2 text-xs font-semibold uppercase tracking-[0.14em] ${b === "escalar" ? "text-crit" : b === "ahora" ? "text-warn" : "text-cyan"}`}>{nom}</div>
            <ul className="space-y-1">
              {(todo ? listas[b] : listas[b].slice(0, 2)).map((x, i) => {
                const id = `${clave}-${b}-${i}`;
                const ok = !!hechos[id];
                return (
                  <li key={id}>
                    <button role="checkbox" aria-checked={ok} onClick={() => setHechos((h) => ({ ...h, [id]: !ok }))}
                      className="flex w-full items-start gap-2.5 rounded-lg p-1.5 text-left hover:bg-ink/5">
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${ok ? "border-ok bg-ok/20 text-ok" : "border-muted"}`}>{ok && <Icon name="check" size={14} />}</span>
                      <span className={`text-[16px] leading-snug ${ok ? "text-muted line-through" : ""}`}>{x}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      {plan.omitidas.length > 0 && <div className="mt-3 text-xs text-warn">Se omitió {plan.omitidas.length} acción por tu alergia a {[...new Set(plan.omitidas.map((o) => o.sustancia))].join(", ")}.</div>}
    </section>
  );
}

export function VistaVariable({ k, analisis, data, aid, onCambiar, onTodas }) {
  const [periodo, setPeriodo] = useState("30");
  const [agrupar, setAgrupar] = useState("dia");
  const t = analisis.tarjetas.find((x) => x.k === k);
  const it = analisis.interpretaciones[k];
  const n = periodo === "mision" ? data.vitals.length : Math.min(Number(periodo), data.vitals.length);
  const etiquetaP = periodo === "mision" ? "misión" : `${periodo} días`;
  const rel = analisis.activas.filter((a) => (a.vars || [a.var]).includes(k));
  const principal = rel[0] || null;
  const plan = planDeAlerta(data.protocols, principal || { clave: `tarjeta_${k}`, sistema: t.sistema, estado: "atencion" }, data.profile?.alergias);
  const s = simboloEstado(t);
  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="mb-4 mt-2 flex flex-wrap items-end gap-3">
          <div className="min-w-0">
            <h1 className="titulo-pagina">{t.nombre}</h1>
            <div className="mt-1.5 text-[13px] text-muted">{it.conclusion}</div>
          </div>
          <ChipEstado estado={t.estado} className="mb-1">{s.palabra}</ChipEstado>
          <CyberButton onClick={onTodas} tam="sm" className="ml-auto" texto="Ver los 12 signos">Ver los 12 signos</CyberButton>
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Variables">
          {analisis.tarjetas.map((x) => (
            <button key={x.k} role="tab" aria-selected={x.k === k} onClick={() => onCambiar(x.k)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${x.k === k ? `bg-ink/10 font-semibold ${ESTADO[x.estado].border}` : "border-line hover:bg-ink/5"}`}>
              <Dot estado={x.estado} /> {x.nombre}
            </button>
          ))}
        </div>
      </div>

      <div className="glass p-2"><Monitor key={`${k}-${aid}`} k={k} t={t} analisis={analisis} data={data} aid={aid} /></div>
      <Indicadores k={k} t={t} analisis={analisis} data={data} n={n} etiquetaP={etiquetaP} />
      {!SIN_RANGO.has(k) && <BarraRango t={t} analisis={analisis} />}
      <Tendencia k={k} t={t} data={data} n={n} periodo={periodo} setPeriodo={setPeriodo} agrupar={agrupar} setAgrupar={setAgrupar} />
      <GraficaExtra k={k} t={t} analisis={analisis} data={data} aid={aid} dias={n} />
      {k === "radiacion" && <RadiacionExtra analisis={analisis} data={data} aid={aid} />}
      <div className="grid gap-5 md:grid-cols-2">
        <PorQue it={it} />
        <Prueba t={t} aid={aid} />
      </div>
      <QueHacer key={`${aid}-${k}`} plan={plan} it={it} clave={`${aid}-${k}`} />
      <Fuente corto className="px-1" ids={[t.fuente, principal?.fuente, plan?.fuente].filter(Boolean).join(",")} extra={k === "cabina" ? "umbrales de demo" : null} />
    </div>
  );
}
