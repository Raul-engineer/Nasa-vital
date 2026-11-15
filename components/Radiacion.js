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
      onToast?.("Shelter confirmed. Your dose rate drops by half thanks to the shielding.");
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
            <div className="text-lg font-bold">Radiation alarm – Solar storm {a.nivel}. Go to the shelter.</div>
            <div className="text-sm text-[#fecaca]">
              Your dosimeter: <strong className="text-white">{fmtNum(radiacion.tasa)} µSv/h</strong>{" "}
              {radiacion.refugio ? "· reduced 50 % by the shelter shielding" : `· ${radiacion.mult} times normal`} · dose in this event: {fmtDosis(a.dosis)}
              {a.origen === "noaa" && " · started with real NOAA data"}
            </div>
            <ol className="mt-2 grid gap-x-4 gap-y-0.5 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {PASOS_REFUGIO.map((p, i) => <li key={i}><span className="font-semibold">{i + 1}.</span> {p}</li>)}
            </ol>
          </div>
          {radiacion.refugio ? (
            <span className="rounded-xl border border-white/40 bg-white/10 px-4 py-2.5 font-semibold">✓ In shelter</span>
          ) : (
            <button onClick={refugio} disabled={enviando} className="rounded-xl bg-white px-5 py-2.5 font-bold text-[#7f1d1d] hover:bg-[#fee2e2] disabled:opacity-60">
              I am in the shelter
            </button>
          )}
        </div>
        <div className="mt-2 text-[10.5px] text-[#fecaca]">Ship alarm (HERA type) · personal dosimeter (Crew Active Dosimeter) via Bluetooth · NASA and NOAA watch the Sun</div>
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
          <div className="font-semibold">Event over. Dose received during the event: {fmtDosis(u.dosis)}</div>
          <div className="text-xs text-muted">Solar storm {u.nivel} · lasted {min >= 60 ? `${Math.round(min / 60)} h` : `${min} min`} · saved to your history</div>
        </div>
        <button onClick={() => { try { sessionStorage.setItem(CERRADO_KEY, String(u.id)); } catch {} setVisto(String(u.id)); }}
          className="rounded-xl border border-line px-4 py-2 text-sm hover:bg-ink/5">Got it</button>
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
        <div className="flex items-center gap-2 text-sm font-semibold"><span className="text-accent"><Icon name="rad" size={18} /></span> Radiation</div>
        <EstadoPill estado={estado}>{r.activo ? `Storm ${r.activo.nivel}` : estado === "normal" ? "Normal" : estado === "atencion" ? "Attention" : "Critical"}</EstadoPill>
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <span className="text-3xl font-semibold tabular-nums">{fmtNum(r.tasa)}</span> <span className="text-sm text-muted">µSv/h</span>
          <div className="text-[11px] text-muted">personal dosimeter{r.refugio ? " · in shelter" : ""}</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold">{fmtNum(r.hoy, 2)} mSv</div>
          <div className="text-[11px] text-muted">today's dose</div>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <div>
          <div className="flex justify-between text-[11px]"><span>Career</span><span className="tabular-nums">{fmtNum(r.carrera)} / {R.limiteCarrera} mSv · {Math.round(r.pct * 100)} %</span></div>
          <Barra pct={r.pct} color={colorPct(r.pct)} marca={R.atencionPct} />
        </div>
        <div>
          <div className="flex justify-between text-[11px]"><span>30 days</span><span className="tabular-nums">{fmtNum(r.ventana30)} / {R.limite30d} mSv · {Math.round(r.pct30 * 100)} %</span></div>
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
        <div className="flex items-center gap-2 text-sm font-semibold"><Icon name="sun" size={18} className="text-warn" /> Real space weather · NOAA GOES</div>
        {d && !d.error && <EstadoPill estado={d.nivel === "Normal" ? "normal" : ["S1", "S2"].includes(d.nivel) ? "atencion" : "critico"}>{d.nivel}</EstadoPill>}
      </div>
      {cargando ? (
        <div className="mt-2 text-sm text-muted">Checking NOAA…</div>
      ) : d?.error ? (
        <div className="mt-2 text-sm text-muted">Could not reach NOAA right now. The demo keeps working with the simulated alarm.</div>
      ) : (
        <div className="mt-2">
          <span className="text-2xl font-semibold tabular-nums">{Number(d.flujo).toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>{" "}
          <span className="text-sm text-muted">pfu (protons ≥ 10 MeV)</span>
          <div className="text-[11px] text-muted">Reading from {new Date(d.hora).toLocaleString("en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })}</div>
        </div>
      )}
      <div className="mt-2 text-[11px] text-muted">Real data from the GOES satellite. The demo alarm is simulated.</div>
      {real && (
        <button onClick={async () => { await iniciarTormenta(d.nivel, "noaa"); onToast?.(`Alarm started with real NOAA data (${d.nivel}).`); }}
          className="mt-2 rounded-xl border border-crit/60 px-3 py-1.5 text-sm font-semibold text-crit hover:bg-crit/10">
          Start alarm with real data
        </button>
      )}
      <div className="mt-2 text-[10.5px] text-muted">NOAA scale (pfu): S1 ≥ 10 · S2 ≥ 100 · S3 ≥ 1,000 · S4 ≥ 10,000 · S5 ≥ 100,000</div>
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
          <Tooltip {...tooltipEstilo(c)} formatter={(v, n) => [`${Number(v).toFixed(n === "Career cumulative" ? 0 : 2)} mSv`, n]} />
          {tormentas.map((t, i) => (
            <ReferenceArea key={i} yAxisId="d" x1={t.x1} x2={t.x2} fill={c.crit} fillOpacity={0.12} stroke={c.crit} strokeOpacity={0.4}
              label={{ value: `Storm ${t.nivel}`, position: "insideTop", fill: c.crit, fontSize: 11 }} />
          ))}
          <ReferenceLine yAxisId="a" y={R.limiteCarrera * R.atencionPct} stroke={c.warn} strokeDasharray="5 5" label={{ value: "50 % of career", position: "insideTopRight", fill: c.warn, fontSize: 11 }} />
          <Bar yAxisId="d" dataKey="dosis" name="Daily dose" fill={c.violet} maxBarSize={10} isAnimationActive={false} />
          <Line yAxisId="a" type="monotone" dataKey="acum" name="Career cumulative" stroke={c.accent} strokeWidth={2.2} dot={false} isAnimationActive={false} />
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
          <h2 className="text-lg font-semibold">Radiation</h2>
          <p className="text-xs text-muted">Daily dosimeter dose (bars) and career cumulative (line) · 90 days</p>
        </div>
        <EstadoPill estado={est}>{r.activo ? `Storm ${r.activo.nivel}` : est === "normal" ? "Normal" : est === "atencion" ? "Attention" : "Critical"}</EstadoPill>
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <RadiacionChart data={data} analisis={analisis} astronaut={astronaut} />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold">What do the limits mean?</h3>
              <ul className="mt-1 space-y-1.5 text-sm text-soft">
                <li><strong className="text-fg">600 mSv over your whole career.</strong> It is the maximum NASA allows across all your missions, to keep long-term cancer risk low. You are at {fmtNum(r.carrera)} mSv ({Math.round(r.pct * 100)} %): {fmtNum(r.previa)} from previous missions and {fmtNum(r.mision)} from this one.</li>
                <li><strong className="text-fg">250 mSv in 30 days.</strong> Protects against immediate effects, such as nausea or blood damage. In the last 30 days you are at {fmtNum(r.ventana30)} mSv ({Math.round(r.pct30 * 100)} %).</li>
                <li><strong className="text-fg">Dosimeter rate.</strong> Today it reads {fmtNum(r.tasa)} µSv/h; your baseline is {fmtNum(r.tasaBase)} µSv/h. In a storm it rises 3 to 50 times depending on the level, and the shelter cuts it by about 50 %.</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Suggestions</h3>
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
