"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Shell, Toast, ESTADO, Dot, Sparkline, useMissionClock } from "@/components/Shell";
import { Icon } from "@/components/Icons";
import { CardSpotlight } from "@/components/Effects";
import { Cambio, EstadoPill, Fuente, fmtNum } from "@/components/Widgets";
import { TrendChart } from "@/components/Charts";
import { INFO_PRUEBAS, PruebaRunner, ResultadoMedic } from "@/components/Pruebas";
import { useAstronautId, useQuickFix } from "@/lib/useQuickFix";
import { diaMision, explicar, FUENTES, PRUEBAS, SISTEMAS, UMBRALES } from "@/lib/analysis";
import { MEDIC, planDeAlerta } from "@/lib/medic";
import { SeccionRadiacion } from "@/components/Radiacion";
import { textoFuentes } from "@/lib/fuentes";

const CAPA = { aguda: "Signos agudos", tendencia: "Tendencia vs. tu línea base", radiacion: "Radiación", checkin: "Check-in", reportada: "Escalada" };
const BLOQUES = [["ahora", "Ahora"], ["hoy", "Hoy"], ["prevenir", "Para prevenir"], ["escalar", "Cuándo escalar"]];
const METRICAS_SIS = {
  todos: ["fc", "pa", "spo2", "fr", "temperatura", "estres"],
  cardiovascular: ["fc", "vfc", "pa"],
  respiratorio: ["spo2", "fr", "temperatura"],
  sueno: ["sueno", "vfc", "reaccion"],
  radiacion: ["radiacion"],
  hueso_musculo: ["ejercicio", "peso"],
  vision: ["pa", "temperatura"],
  salud_mental: ["estres", "estres_auto", "reaccion"],
};
const NOMBRE_M = {
  fc: "FC", vfc: "VFC", pa: "PA", spo2: "SpO₂", fr: "FR", temperatura: "Temp", estres: "Estrés VFC", sueno: "Sueño",
  ejercicio: "Ejercicio", peso: "Peso", radiacion: "Radiación", reaccion: "Reacción", estres_auto: "Estrés reportado", fc_reposo: "FC reposo", imc: "IMC",
};
const FILAS_TABLA = ["fc_reposo", "vfc", "pa", "spo2", "fr", "temperatura", "sueno", "ejercicio", "peso"];

function serieMetrica(k, analisis, data) {
  const sg = analisis.signos[k];
  const mt = analisis.metricas.find((m) => m.k === k);
  const porFecha = (campo) => {
    const mapa = new Map(data.checkins.map((c) => [c.fecha, c[campo]]));
    return data.vitals.map((v) => (mapa.get(v.fecha) != null ? Number(mapa.get(v.fecha)) : null));
  };
  const banda = (b) => (b && b.n >= 7 ? [Math.round(b.min * 10) / 10, Math.round(b.max * 10) / 10] : null);
  if (k === "pa") return { nombre: "Presión arterial", unidad: "mmHg", dec: 0, s: sg.serie, s2: sg.serie2, banda: banda(sg.base), bandaTxt: "Tu línea base (sistólica)", fuente: sg.fuente };
  if (sg) return { nombre: sg.nombre, unidad: sg.unidad, dec: sg.dec, s: sg.serie, banda: banda(sg.base), bandaTxt: "Tu línea base", fuente: sg.fuente };
  if (k === "sueno") return { nombre: "Sueño", unidad: "h", dec: 1, s: mt.serie, banda: [7, 9], bandaTxt: "7 h o más (AASM)", linea: UMBRALES.suenoCriticoHoras, lineaTxt: "6 h", fuente: FUENTES.sueno };
  if (k === "ejercicio") return { nombre: "Ejercicio de resistencia", unidad: "min", dec: 0, s: mt.serie, linea: UMBRALES.ejercicioMinMin, lineaTxt: "Meta 90 min", tipo: "bar", fuente: FUENTES.equipo };
  if (k === "radiacion") return { nombre: "Dosis diaria de radiación", unidad: "mSv", dec: 2, s: mt.serie, tipo: "bar", fuente: FUENTES.dosimetro };
  if (k === "reaccion") return { nombre: "Tiempo de reacción", unidad: "ms", dec: 0, s: porFecha("tiempo_reaccion_ms"), banda: banda(analisis.baselines.reaccion), bandaTxt: "Tu línea base", fuente: FUENTES.reaccion };
  if (k === "estres_auto") return { nombre: "Estrés reportado", unidad: "/5", dec: 0, s: porFecha("estres"), linea: UMBRALES.estresAlto, lineaTxt: "Alto ≥ 4", fuente: FUENTES.checkin };
  if (mt) return { nombre: mt.nombre, unidad: mt.unidad, dec: mt.dec, s: mt.serie, banda: banda(mt.base), bandaTxt: "Tu línea base", fuente: FUENTES.lineaBase };
  return null;
}

function estadoFila(m, analisis) {
  if (m.estado) return m.estado;
  if (m.k === "sueno") return m.valor < UMBRALES.suenoMetaHoras ? "atencion" : "normal";
  if (m.k === "ejercicio") return m.valor < UMBRALES.ejercicioMinMin ? "atencion" : "normal";
  if (m.k === "vfc") return analisis.sistemas.cardiovascular.rachaDias >= UMBRALES.rachaVfc ? "atencion" : "normal";
  const b = m.base;
  if (!b || b.n < 7 || m.valor == null) return "normal";
  if (m.k === "peso") return Math.abs(m.valor - b.media) / b.media > 0.03 ? "atencion" : "normal";
  return m.valor < b.media - 2 * b.sd || m.valor > b.media + 2 * b.sd ? "atencion" : "normal";
}

export default function Analisis() {
  const [aid, setAid] = useAstronautId();
  const { data, analisis, loading, error } = useQuickFix(aid);
  const { ventana } = useMissionClock();
  const [filtro, setFiltro] = useState("todos");
  const [alSel, setAlSel] = useState(null);
  const [metrica, setMetrica] = useState(null);
  const [dias, setDias] = useState(30);
  const [hechos, setHechos] = useState({});
  const [resultado, setResultado] = useState(null);
  const [toast, setToast] = useState(null);
  const closeToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const s = p.get("s");
    if (s && SISTEMAS[s]) setFiltro(s);
    if (p.get("al")) setAlSel(p.get("al"));
    if (p.get("m")) setMetrica(p.get("m"));
  }, []);

  if (error) return <div className="p-10 text-crit">No se pudieron cargar los datos: {error}</div>;
  if (loading || !analisis) return <div className="flex min-h-screen items-center justify-center text-muted">Cargando análisis…</div>;

  const { astronaut, astronauts, protocols, profile } = data;
  const filtradas = filtro === "todos" ? analisis.activas : analisis.activas.filter((a) => (a.sistemas || [a.sistema]).includes(filtro));
  const alerta = filtradas.find((a) => a.id === alSel) || filtradas[0] || null;
  const plan = alerta ? planDeAlerta(protocols, alerta, profile?.alergias) : null;
  const sisM = alerta ? (alerta.clave === "vfc_sueno" ? "sueno" : alerta.sistema) : filtro;
  const opciones = [...new Set([...(metrica && !METRICAS_SIS[sisM]?.includes(metrica) ? [metrica] : []), ...(METRICAS_SIS[sisM] || METRICAS_SIS.todos)])];
  const mSel = metrica && opciones.includes(metrica) ? metrica : opciones[0];
  const serie = serieMetrica(mSel, analisis, data);
  const n = Math.min(dias, data.vitals.length);
  const vis = data.vitals.slice(-n);
  const off = serie.s.length - n;
  const datos = vis.map((v, i) => ({ dia: `D${diaMision(astronaut, v.fecha)}`, v: serie.s[off + i], v2: serie.s2 ? serie.s2[off + i] : undefined }));
  const series = serie.s2
    ? [{ key: "v", nombre: "Sistólica", color: "violet" }, { key: "v2", nombre: "Diastólica", color: "pink", tipo: "line" }]
    : [{ key: "v", nombre: serie.nombre, color: "violet", tipo: serie.tipo }];

  const clave = `${aid}-${alerta?.id}`;
  const marcados = hechos[clave] || [];
  const pasos = plan ? BLOQUES.flatMap(([b]) => plan.bloques[b].map((t, i) => `${b}-${i}`)) : [];
  const progreso = pasos.length ? marcados.length / pasos.length : 0;
  const toggle = (id) => setHechos((h) => {
    const cur = h[clave] || [];
    return { ...h, [clave]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] };
  });
  const elegirFiltro = (k) => {
    setFiltro(k);
    setAlSel(null);
    setMetrica(null);
    const url = new URL(window.location.href);
    if (k === "todos") url.searchParams.delete("s");
    else url.searchParams.set("s", k);
    url.searchParams.delete("al");
    url.searchParams.delete("m");
    window.history.replaceState(null, "", url);
  };
  const n2 = analisis.news2;
  const fechaTxt = new Date(analisis.fecha + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  const grupos = [...new Set(analisis.metricas.map((m) => m.grupo))];
  const verMetrica = (k) => {
    setMetrica(k);
    document.getElementById("tendencia")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <Shell active="/analisis" astronaut={astronaut} astronauts={astronauts} onAstronaut={setAid} astronautId={aid} analisis={analisis}>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <h1 className="mr-2 text-2xl font-semibold">Análisis</h1>
        <div className="no-scrollbar flex max-w-full gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filtrar por sistema">
          {[["todos", "Todos", analisis.general], ...Object.entries(SISTEMAS).map(([k, s]) => [k, s.nombre, analisis.sistemas[k].estado])].map(([k, t, e]) => (
            <button key={k} role="tab" aria-selected={filtro === k} onClick={() => elegirFiltro(k)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${filtro === k ? `bg-ink/10 font-semibold ${ESTADO[e].border}` : "border-line hover:bg-ink/5"}`}>
              <Dot estado={e} /> {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            <section className="card p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold">Nivel de urgencia (NEWS2)</h2>
                <EstadoPill estado={n2.nivel.estado}>{n2.nivel.txt}</EstadoPill>
              </div>
              <div className="mt-3 flex items-end gap-3">
                <span className={`text-5xl font-bold leading-none ${ESTADO[n2.nivel.estado].color}`}>{n2.total}</span>
                <span className="pb-1 text-sm text-muted">puntos · 0–4 bajo · 5–6 medio · ≥ 7 alto</span>
              </div>
              <ul className="mt-4 space-y-2">
                {n2.desglose.map((d) => (
                  <li key={d.k} className="flex items-center gap-3 text-sm">
                    <span className="w-40 shrink-0 truncate">{d.nombre}</span>
                    <span className="w-20 shrink-0 text-right tabular-nums text-muted">{d.valor ?? "—"} {d.unidad}</span>
                    <span className="flex flex-1 gap-1" aria-label={`${d.puntos ?? 0} puntos`}>
                      {[1, 2, 3].map((i) => (
                        <span key={i} className={`h-2 flex-1 rounded-full ${i <= (d.puntos || 0) ? (d.puntos >= 3 ? "bg-crit" : "bg-warn") : "bg-ink/10"}`} />
                      ))}
                    </span>
                    <span className="w-6 text-right font-semibold tabular-nums">{d.puntos ?? 0}</span>
                  </li>
                ))}
              </ul>
              <Fuente className="mt-3" ids={FUENTES.news2} extra="umbrales provisionales" />
            </section>

            <section className="card flex flex-col p-5">
              <h2 className="font-semibold">Alertas activas {filtro !== "todos" && <span className="text-sm font-normal text-muted">· {SISTEMAS[filtro].nombre}</span>}</h2>
              <div className="mt-3 flex-1 space-y-2">
                {filtradas.length === 0 && (
                  <div className="flex items-center gap-3 rounded-xl border border-ok/40 bg-ok/5 p-3 text-sm">
                    <span className="text-ok"><Icon name="check" /></span> Sin alertas. Tus valores están dentro de tu rango.
                  </div>
                )}
                {filtradas.map((a) => (
                  <button key={a.id} onClick={() => setAlSel(a.id)} aria-pressed={alerta?.id === a.id}
                    className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${alerta?.id === a.id ? `bg-ink/[0.06] ${ESTADO[a.estado].border}` : "border-line hover:bg-ink/5"}`}>
                    <span className={`mt-0.5 ${ESTADO[a.estado].color}`}><Icon name={a.estado === "critico" ? "alert" : SISTEMAS[a.sistema]?.icono || "info"} size={20} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{a.motivo}</span>
                      <span className="block text-[11px] text-muted">{(a.sistemas || [a.sistema]).map((s) => SISTEMAS[s]?.nombre).join(" + ")} · {CAPA[a.capa]}</span>
                      <span className="block text-[10.5px] text-muted">Basado en: {textoFuentes(a.fuente)}</span>
                    </span>
                    <EstadoPill estado={a.estado} />
                  </button>
                ))}
                {analisis.sugerencias.length > 0 && (
                  <div className="pt-1">
                    {analisis.sugerencias.map((s, i) => (
                      <Link key={i} href={`${s.href}${s.href.includes("?") ? "&" : "?"}a=${aid}`} className="block text-sm text-accent hover:underline">{s.texto}</Link>
                    ))}
                  </div>
                )}
                {analisis.cerradas.length > 0 && (
                  <div className="pt-1 text-[11px] text-muted">Cerradas hoy tras una prueba: {analisis.cerradas.map((a) => a.motivo).join(" · ")}</div>
                )}
              </div>
            </section>
          </div>

          <section id="tendencia" className="card p-5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">Tendencia · {serie.nombre}</h2>
                <p className="text-xs text-muted">{alerta ? `Relacionada con: ${alerta.motivo}` : filtro === "todos" ? "Signos vitales principales" : SISTEMAS[filtro].nombre}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-xl border border-line p-1" role="tablist" aria-label="Métrica">
                  {opciones.map((k) => (
                    <button key={k} role="tab" aria-selected={mSel === k} onClick={() => setMetrica(k)}
                      className={`shrink-0 rounded-lg px-2.5 py-1 text-sm ${mSel === k ? "bg-accent/15 font-semibold text-accent" : "text-soft hover:bg-ink/5"}`}>
                      {NOMBRE_M[k] || k}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1 rounded-xl border border-line p-1" role="tablist" aria-label="Periodo">
                  {[7, 30, 90].map((d) => (
                    <button key={d} role="tab" aria-selected={dias === d} onClick={() => setDias(d)}
                      className={`rounded-lg px-2.5 py-1 text-sm ${dias === d ? "bg-accent/15 font-semibold text-accent" : "text-soft hover:bg-ink/5"}`}>
                      {d} d
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <TrendChart datos={datos} series={series} banda={serie.banda} bandaTxt={serie.bandaTxt} linea={serie.linea} lineaTxt={serie.lineaTxt} unidad={serie.unidad} dec={serie.dec} alto={240} />
            <Fuente className="mt-1" ids={serie.fuente} />
          </section>

          <section className="card grid gap-4 p-5 md:grid-cols-[1fr_200px]">
            <div className="flex gap-3">
              <span className="text-accent"><Icon name="medic" size={28} /></span>
              <div>
                <h2 className="mb-1 font-semibold">¿Por qué?</h2>
                <p className="text-[15px] leading-relaxed text-soft">
                  {alerta ? explicar(alerta, analisis) : "No hay alertas en esta vista. Tus signos y tendencias están dentro de tu rango personal; sigue con tu rutina de prevención."}
                </p>
                <div className="mt-2 text-[11px] text-muted">{MEDIC.aviso}</div>
              </div>
            </div>
            <div className="border-line md:border-l md:pl-4">
              <div className="text-sm text-muted">Capa de urgencia</div>
              <ul className="mt-1 space-y-1 text-sm">
                {[["aguda", "Signos agudos"], ["tendencia", "Tendencias"], ["radiacion", "Radiación"], ["checkin", "Check-in"]].map(([k, t]) => (
                  <li key={k} className="flex items-center justify-between gap-2"><span>{t}</span><Dot estado={analisis.urgencia.capas[k]} /></li>
                ))}
              </ul>
              {alerta && <Fuente className="mt-2" ids={alerta.fuente} />}
            </div>
          </section>

          <section className="card overflow-hidden p-5">
            <h2 className="mb-3 font-semibold">Hoy vs. tu normalidad</h2>
            <div className="-mx-5 overflow-x-auto px-5">
              <table className="w-full min-w-[620px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs text-muted">
                    <th className="py-2 pr-3 font-medium">Signo</th>
                    <th className="py-2 pr-3 font-medium">Hoy</th>
                    <th className="py-2 pr-3 font-medium">Tu promedio 30 días</th>
                    <th className="py-2 pr-3 font-medium">Tu rango</th>
                    <th className="py-2 pr-3 font-medium">Estado</th>
                    <th className="py-2 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {FILAS_TABLA.map((k) => {
                    const m = analisis.metricas.find((x) => x.k === k);
                    if (!m) return null;
                    const e = estadoFila(m, analisis);
                    const pa = k === "pa" ? analisis.signos.pa : null;
                    const prom30 = pa ? `${fmtNum(m.prom30)}/${fmtNum(pa.serie2.slice(-30).reduce((s, x) => s + (x || 0), 0) / Math.min(30, pa.serie2.length))}` : fmtNum(m.prom30, m.dec);
                    const rango = m.base?.n >= 7 ? (pa ? `${fmtNum(pa.base.min)}–${fmtNum(pa.base.max)} / ${fmtNum(pa.base2.min)}–${fmtNum(pa.base2.max)}` : `${fmtNum(m.base.min, m.dec)}–${fmtNum(m.base.max, m.dec)}`) : "—";
                    return (
                      <tr key={k} className="border-b border-line/60 last:border-0">
                        <td className="py-2 pr-3 font-medium">{m.nombre}</td>
                        <td className="py-2 pr-3 tabular-nums">{m.texto || fmtNum(m.valor, m.dec)} <span className="text-xs text-muted">{m.unidad}</span></td>
                        <td className="py-2 pr-3 tabular-nums">{prom30}</td>
                        <td className="py-2 pr-3 tabular-nums text-soft">{rango}</td>
                        <td className="py-2 pr-3"><EstadoPill estado={e} /></td>
                        <td className="py-2 text-muted">{fechaTxt}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Fuente className="mt-2" ids={FUENTES.lineaBase} extra="tu rango = promedio ± 1 desviación estándar" />
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <CardSpotlight className="card flex flex-col p-5">
            <div className="flex items-center gap-3">
              <Icon name="clipboard" className="text-accent" size={30} />
              <div className="min-w-0">
                <h2 className="text-lg font-semibold">Plan de acción</h2>
                <div className="truncate text-sm text-muted">{plan?.protocolo.condicion || "Prevención"}</div>
              </div>
            </div>
            {plan ? (
              <>
                <div className="mt-4 rounded-xl border border-line p-3">
                  <div className="flex justify-between text-sm">
                    <span>Progreso</span>
                    <span className="text-accent">{Math.round(progreso * 100)} % ({marcados.length} de {pasos.length})</span>
                  </div>
                  <div className="mt-2 h-2.5 rounded-full bg-ink/10">
                    <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progreso * 100}%` }} />
                  </div>
                </div>
                <div className="mt-3 space-y-3">
                  {BLOQUES.map(([b, t]) => plan.bloques[b].length > 0 && (
                    <div key={b}>
                      <div className={`mb-1 text-xs font-semibold uppercase tracking-widest ${b === "escalar" ? "text-crit" : b === "ahora" ? "text-warn" : "text-muted"}`}>{t}</div>
                      {plan.bloques[b].map((p, i) => {
                        const id = `${b}-${i}`;
                        const ok = marcados.includes(id);
                        return (
                          <button key={id} onClick={() => toggle(id)} role="checkbox" aria-checked={ok}
                            className="flex w-full items-start gap-3 rounded-xl p-2 text-left hover:bg-ink/5">
                            <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${ok ? "border-ok bg-ok/20 text-ok" : "border-muted"}`}>
                              {ok && <Icon name="check" size={16} />}
                            </span>
                            <span className={`text-sm ${ok ? "text-muted line-through" : ""}`}>{p}</span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
                {plan.omitidas.length > 0 && (
                  <div className="mt-2 rounded-xl border border-warn/50 bg-warn/10 p-2.5 text-xs text-warn">
                    Medic omitió {plan.omitidas.length} recomendación(es) por tu alergia a {[...new Set(plan.omitidas.map((o) => o.sustancia))].join(", ")}.
                  </div>
                )}
                <Fuente className="mt-2" ids={plan.fuente} />
              </>
            ) : (
              <p className="mt-3 text-sm text-soft">Sin alertas activas en esta vista. Mantén hidratación ≥ 2.5 L, 90+ min de ejercicio de resistencia y 7–8 h de sueño.</p>
            )}
            <button
              onClick={() => setToast(`Aviso en cola para el médico de tripulación. Se envía en la próxima ventana con la Tierra (en ${ventana} h).`)}
              className="mt-4 flex w-full items-center justify-between rounded-xl border border-line px-4 py-3 hover:bg-ink/5">
              <span className="flex items-center gap-3"><Icon name="doctor" /> Notificar al médico de tripulación</span>
              <Icon name="chev" size={18} />
            </button>
          </CardSpotlight>

          <section className="card p-5">
            <div className="flex items-center gap-3">
              <Icon name="flask" className="text-accent" size={26} />
              <div>
                <h2 className="font-semibold">Prueba recomendada ahora</h2>
                <div className="text-sm text-muted">{plan?.prueba ? PRUEBAS[plan.prueba].nombre : "Sin prueba asociada"}</div>
              </div>
            </div>
            {resultado && (
              <div className="mt-3">
                <ResultadoMedic res={resultado} onCerrar={() => setResultado(null)} />
                {resultado.alerta && <div className="mt-1 text-[11px] text-muted">Prueba hecha para: {resultado.alerta}</div>}
              </div>
            )}
            {plan?.prueba ? (
              <>
                <p className="mt-2 text-sm text-soft">{INFO_PRUEBAS[plan.prueba].para}</p>
                <div className="mt-3">
                  <PruebaRunner key={`${aid}-${alerta.id}-${plan.prueba}`} tipo={plan.prueba} astronautId={aid} analisis={analisis} alerta={alerta} onToast={setToast} onCompletada={setResultado} resultadoExterno />
                </div>
                <Fuente className="mt-2" ids={PRUEBAS[plan.prueba].fuente} />
              </>
            ) : (
              <p className="mt-2 text-sm text-soft">
                {alerta ? "Esta alerta se atiende con el plan de acción." : "No hay alertas que requieran una prueba."}{" "}
                <Link href={`/pruebas?a=${aid}`} className="text-accent hover:underline">Ver todas las pruebas</Link>
              </p>
            )}
          </section>
        </div>
      </div>

      {(filtro === "todos" || filtro === "radiacion") && (
        <SeccionRadiacion data={data} analisis={analisis} astronaut={astronaut} onToast={setToast}
          sugerencias={(() => {
            const ra = analisis.activas.find((a) => a.sistema === "radiacion");
            const pr = ra ? planDeAlerta(protocols, ra, profile?.alergias) : null;
            return pr ? [...pr.bloques.hoy, ...pr.bloques.prevenir].slice(0, 4) : ["Mantén el dosímetro puesto todo el día", "Duerme en la zona con más blindaje de la nave", "Revisa el clima espacial (NOAA) en cada ventana con la Tierra", "Planea las EVA lejos de pronósticos de tormenta"];
          })()} />
      )}

      <section className="mt-5">
        <h2 className="mb-3 text-lg font-semibold">Todas las métricas</h2>
        <div className="space-y-4">
          {grupos.map((g) => (
            <div key={g}>
              <div className="mb-2 text-xs uppercase tracking-widest text-muted">{g}</div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {analisis.metricas.filter((m) => m.grupo === g).map((m) => (
                  <button key={m.k} onClick={() => verMetrica(m.k)} className="card flex flex-col gap-1 p-4 text-left transition hover:bg-ink/[0.03]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{m.nombre}</span>
                      {m.estado && m.estado !== "normal" && <Dot estado={m.estado} />}
                    </div>
                    {m.sub && <span className="text-[11px] text-muted">{m.sub}</span>}
                    <div className="flex items-end justify-between gap-2">
                      <div>
                        <span className="text-2xl font-semibold tabular-nums">{m.texto || fmtNum(m.valor, m.dec)}</span> <span className="text-xs text-muted">{m.unidad}</span>
                      </div>
                      <Sparkline data={m.serie} color={ESTADO[m.estado || "normal"].hex} w={110} h={28} />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <Cambio valor={m.cambio7} />
                      <span className="text-[11px] text-muted">promedio {fmtNum(m.prom, m.dec)} · {m.n} registros</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Toast msg={toast} onClose={closeToast} />
    </Shell>
  );
}
