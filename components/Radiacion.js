"use client";
import { useEffect, useState } from "react";
import { Bar, CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Icon } from "./Icons";
import { Barra, EstadoPill, Fuente, fmtNum } from "./Widgets";
import { confirmarRefugio, iniciarTormenta } from "@/lib/data";
import { PASOS_REFUGIO } from "@/lib/mockData";
import { diaMision, fechaLocal, FUENTES, UMBRALES } from "@/lib/analysis";
import { tooltipEstilo, useTheme } from "@/lib/theme";

const R = UMBRALES.radiacion;
const CERRADO_KEY = "quickfix_evento_visto";

export function fmtDosis(msv) {
  const v = Number(msv) || 0;
  if (v < 1) return `${v.toFixed(3)} mSv (${Math.round(v * 1000)} µSv)`;
  return `${v.toFixed(1)} mSv`;
}

const colorPct = (p) => (p >= R.criticoPct ? "var(--color-crit)" : p >= R.atencionPct ? "var(--color-warn)" : "var(--color-ok)");
const fechaDe = fechaLocal;

export function AlarmaRadiacion({ radiacion, astronautId, onToast }) {
  const [visto, setVisto] = useState(null);
  const [enviando, setEnviando] = useState(false);
  useEffect(() => {
    try {
      setVisto(sessionStorage.getItem(CERRADO_KEY));
    } catch {}
  }, []);
  if (!radiacion) return null;
  const a = radiacion.activo;
  async function refugio() {
    setEnviando(true);
    try {
      await confirmarRefugio(astronautId);
      onToast?.("Refugio confirmado. Tu tasa de dosis baja a la mitad por el blindaje.");
    } finally {
      setEnviando(false);
    }
  }
  if (a) {
    return (
      <div role="alert" className="sticky top-2 z-40 mb-5 rounded-2xl border-2 border-[#fca5a5] bg-[linear-gradient(135deg,#991b1b,#7f1d1d)] p-4 text-white shadow-[0_10px_40px_rgba(127,29,29,0.45)]">
        <div className="flex flex-wrap items-start gap-4">
          <span className="pulse-ring relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 text-[#fecaca]"><Icon name="rad" size={30} /></span>
          <div className="min-w-0 flex-1">
            <div className="text-lg font-bold">Alarma de radiación – Tormenta solar {a.nivel}. Ve al refugio.</div>
            <div className="text-sm text-[#fecaca]">
              Tu dosímetro: <strong className="text-white">{fmtNum(radiacion.tasa)} µSv/h</strong>{" "}
              {radiacion.refugio ? "· reducida 50 % por el blindaje del refugio" : `· ${radiacion.mult} veces lo normal`} · dosis en este evento: {fmtDosis(a.dosis)}
              {a.origen === "noaa" && " · iniciada con dato real de NOAA"}
            </div>
            <ol className="mt-2 grid gap-x-4 gap-y-0.5 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {PASOS_REFUGIO.map((p, i) => <li key={i}><span className="font-semibold">{i + 1}.</span> {p}</li>)}
            </ol>
          </div>
          {radiacion.refugio ? (
            <span className="rounded-xl border border-white/40 bg-white/10 px-4 py-2.5 font-semibold">✓ En refugio</span>
          ) : (
            <button onClick={refugio} disabled={enviando} className="rounded-xl bg-white px-5 py-2.5 font-bold text-[#7f1d1d] hover:bg-[#fee2e2] disabled:opacity-60">
              Ya estoy en refugio
            </button>
          )}
        </div>
        <div className="mt-2 text-[10.5px] text-[#fecaca]">Alarma de la nave (tipo HERA) · dosímetro personal (Crew Active Dosimeter) por Bluetooth · NASA y NOAA vigilan el Sol</div>
      </div>
    );
  }
  const u = radiacion.ultimoEvento;
  const reciente = u && Date.now() - new Date(u.fin).getTime() < 12 * 36e5;
  if (u && reciente && String(visto) !== String(u.id)) {
    const min = Math.max(1, Math.round((new Date(u.fin) - new Date(u.inicio)) / 6e4));
    return (
      <div role="status" className="card mb-5 flex flex-wrap items-center gap-4 border-ok/60 p-4">
        <span className="text-ok"><Icon name="check" size={28} /></span>
        <div className="min-w-0 flex-1">
          <div className="font-semibold">Evento terminado. Dosis recibida durante el evento: {fmtDosis(u.dosis)}</div>
          <div className="text-xs text-muted">Tormenta solar {u.nivel} · duró {min >= 60 ? `${Math.round(min / 60)} h` : `${min} min`} · quedó guardado en tu historial</div>
        </div>
        <button onClick={() => { try { sessionStorage.setItem(CERRADO_KEY, String(u.id)); } catch {} setVisto(String(u.id)); }}
          className="rounded-xl border border-line px-4 py-2 text-sm hover:bg-ink/5">Entendido</button>
      </div>
    );
  }
  return null;
}

export function RadiacionCard({ radiacion, estado }) {
  const r = radiacion;
  return (
    <div className="card relative flex flex-col p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold"><span className="text-accent"><Icon name="rad" size={18} /></span> Radiación</div>
        <EstadoPill estado={estado}>{r.activo ? `Tormenta ${r.activo.nivel}` : estado === "normal" ? "Normal" : estado === "atencion" ? "Atención" : "Crítico"}</EstadoPill>
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <span className="text-3xl font-semibold tabular-nums">{fmtNum(r.tasa)}</span> <span className="text-sm text-muted">µSv/h</span>
          <div className="text-[11px] text-muted">dosímetro personal{r.refugio ? " · en refugio" : ""}</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold">{fmtNum(r.hoy, 2)} mSv</div>
          <div className="text-[11px] text-muted">dosis de hoy</div>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <div>
          <div className="flex justify-between text-[11px]"><span>Carrera</span><span className="tabular-nums">{fmtNum(r.carrera)} / {R.limiteCarrera} mSv · {Math.round(r.pct * 100)} %</span></div>
          <Barra pct={r.pct} color={colorPct(r.pct)} marca={R.atencionPct} />
        </div>
        <div>
          <div className="flex justify-between text-[11px]"><span>30 días</span><span className="tabular-nums">{fmtNum(r.ventana30)} / {R.limite30d} mSv · {Math.round(r.pct30 * 100)} %</span></div>
          <Barra pct={r.pct30} color={colorPct(r.pct30)} marca={R.atencionPct} />
        </div>
      </div>
      <Fuente className="mt-2" ids="nasa3001,ochmo,hera" />
    </div>
  );
}

export function ClimaEspacial({ onToast }) {
  const [d, setD] = useState(null);
  const [cargando, setCargando] = useState(true);
  useEffect(() => {
    let vivo = true;
    fetch("/api/clima-espacial")
      .then((r) => r.json())
      .then((j) => vivo && setD(j))
      .catch(() => vivo && setD({ error: true }))
      .finally(() => vivo && setCargando(false));
    return () => {
      vivo = false;
    };
  }, []);
  const real = d && !d.error && d.nivel && d.nivel !== "Normal";
  return (
    <div className="rounded-2xl border border-line p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold"><Icon name="sun" size={18} className="text-warn" /> Clima espacial real · NOAA GOES</div>
        {d && !d.error && <EstadoPill estado={d.nivel === "Normal" ? "normal" : ["S1", "S2"].includes(d.nivel) ? "atencion" : "critico"}>{d.nivel}</EstadoPill>}
      </div>
      {cargando ? (
        <div className="mt-2 text-sm text-muted">Consultando NOAA…</div>
      ) : d?.error ? (
        <div className="mt-2 text-sm text-muted">No se pudo consultar NOAA en este momento. La demo sigue funcionando con la alarma simulada.</div>
      ) : (
        <div className="mt-2">
          <span className="text-2xl font-semibold tabular-nums">{Number(d.flujo).toLocaleString("es-MX", { maximumFractionDigits: 2 })}</span>{" "}
          <span className="text-sm text-muted">pfu (protones ≥ 10 MeV)</span>
          <div className="text-[11px] text-muted">Lectura de {new Date(d.hora).toLocaleString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })}</div>
        </div>
      )}
      <div className="mt-2 text-[11px] text-muted">Dato real del satélite GOES. La alarma de la demo es simulada.</div>
      {real && (
        <button onClick={async () => { await iniciarTormenta(d.nivel, "noaa"); onToast?.(`Alarma iniciada con dato real de NOAA (${d.nivel}).`); }}
          className="mt-2 rounded-xl border border-crit/60 px-3 py-1.5 text-sm font-semibold text-crit hover:bg-crit/10">
          Iniciar alarma con dato real
        </button>
      )}
      <div className="mt-2 text-[10.5px] text-muted">Escala NOAA (pfu): S1 ≥ 10 · S2 ≥ 100 · S3 ≥ 1,000 · S4 ≥ 10,000 · S5 ≥ 100,000</div>
      <Fuente className="mt-1" ids={FUENTES.noaa} />
    </div>
  );
}

function RadiacionChart({ data, analisis, astronaut }) {
  const { c } = useTheme();
  const r = analisis.radiacion;
  const diasPrevios = Math.max(0, (astronaut?.dia_mision || 142) - data.vitals.length);
  let acum = r.previa + diasPrevios * r.baseDia;
  const datos = data.vitals.map((v) => {
    acum += Number(v.dosis_dia_msv) || 0;
    return { dia: `D${diaMision(astronaut, v.fecha)}`, fecha: v.fecha, dosis: Number(v.dosis_dia_msv) || 0, acum: Math.round(acum * 10) / 10 };
  });
  const tormentas = (data.eventos || []).map((e) => {
    const ini = fechaDe(e.inicio);
    const fin = fechaDe(e.fin) || datos.at(-1)?.fecha;
    const a = datos.find((d) => d.fecha >= ini);
    const b = [...datos].reverse().find((d) => d.fecha <= fin);
    return a && b ? { x1: a.dia, x2: b.dia, nivel: e.nivel } : null;
  }).filter(Boolean);
  return (
    <div style={{ height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={datos} margin={{ top: 22, right: 4, left: -12, bottom: 0 }}>
          <CartesianGrid stroke={c.grid} vertical={false} />
          <XAxis dataKey="dia" stroke={c.muted} fontSize={12} tickLine={false} minTickGap={20} />
          <YAxis yAxisId="d" stroke={c.muted} fontSize={12} tickLine={false} width={44} />
          <YAxis yAxisId="a" orientation="right" stroke={c.muted} fontSize={12} tickLine={false} width={44} domain={[0, R.limiteCarrera]} />
          <Tooltip {...tooltipEstilo(c)} formatter={(v, n) => [`${Number(v).toFixed(n === "Acumulado de carrera" ? 0 : 2)} mSv`, n]} />
          {tormentas.map((t, i) => (
            <ReferenceArea key={i} yAxisId="d" x1={t.x1} x2={t.x2} fill={c.crit} fillOpacity={0.12} stroke={c.crit} strokeOpacity={0.4}
              label={{ value: `Tormenta ${t.nivel}`, position: "insideTop", fill: c.crit, fontSize: 11 }} />
          ))}
          <ReferenceLine yAxisId="a" y={R.limiteCarrera * R.atencionPct} stroke={c.warn} strokeDasharray="5 5" label={{ value: "50 % de carrera", position: "insideTopRight", fill: c.warn, fontSize: 11 }} />
          <Bar yAxisId="d" dataKey="dosis" name="Dosis diaria" fill={c.violet} maxBarSize={10} isAnimationActive={false} />
          <Line yAxisId="a" type="monotone" dataKey="acum" name="Acumulado de carrera" stroke={c.accent} strokeWidth={2.2} dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SeccionRadiacion({ data, analisis, astronaut, sugerencias = [], onToast }) {
  const r = analisis.radiacion;
  const est = analisis.sistemas.radiacion.estado;
  return (
    <section className="card mt-5 p-5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Radiación</h2>
          <p className="text-xs text-muted">Dosis diaria del dosímetro (barras) y acumulado de carrera (línea) · 90 días</p>
        </div>
        <EstadoPill estado={est}>{r.activo ? `Tormenta ${r.activo.nivel}` : est === "normal" ? "Normal" : est === "atencion" ? "Atención" : "Crítico"}</EstadoPill>
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <RadiacionChart data={data} analisis={analisis} astronaut={astronaut} />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold">¿Qué significan los límites?</h3>
              <ul className="mt-1 space-y-1.5 text-sm text-soft">
                <li><strong className="text-fg">600 mSv en toda tu carrera.</strong> Es el máximo que NASA permite sumando todas tus misiones, para mantener bajo el riesgo de cáncer a largo plazo. Llevas {fmtNum(r.carrera)} mSv ({Math.round(r.pct * 100)} %): {fmtNum(r.previa)} de misiones anteriores y {fmtNum(r.mision)} de esta.</li>
                <li><strong className="text-fg">250 mSv en 30 días.</strong> Protege contra efectos inmediatos, como náusea o daño en la sangre. En los últimos 30 días llevas {fmtNum(r.ventana30)} mSv ({Math.round(r.pct30 * 100)} %).</li>
                <li><strong className="text-fg">Tasa del dosímetro.</strong> Hoy marca {fmtNum(r.tasa)} µSv/h; tu línea base es {fmtNum(r.tasaBase)} µSv/h. En una tormenta sube de 3 a 50 veces según el nivel, y el refugio la reduce cerca de 50 %.</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Sugerencias</h3>
              <ul className="mt-1 space-y-1.5 text-sm text-soft">
                {sugerencias.map((s, i) => <li key={i} className="flex gap-2"><Icon name="sparkle" size={16} className="mt-0.5 shrink-0 text-accent" />{s}</li>)}
              </ul>
            </div>
          </div>
          <Fuente className="mt-3" ids="nasa3001,ochmo,hera" />
        </div>
        <ClimaEspacial onToast={onToast} />
      </div>
    </section>
  );
}
