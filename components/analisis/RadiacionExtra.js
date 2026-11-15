"use client";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icons";
import { ESTADO } from "@/components/Shell";
import { fmtNum } from "@/components/Widgets";
import { tasaAuSvh, UMBRALES } from "@/lib/analysis";
import { LIMITE_DIA_DEMO_MSV, modulosRadiacion } from "@/lib/simulado";
import nasaReal from "@/data/nasa-real.json";
import { ChipEstado, Progreso, tiempoRelativo } from "./comun";
import { Tarjeta } from "./Extras";

const R = UMBRALES.radiacion;
const SEV = { critico: "Critical", atencion: "Attention", normal: "Normal" };
const ORDEN = { critico: 0, atencion: 1, normal: 2 };

function useNoaa() {
  const [d, setD] = useState(null);
  useEffect(() => {
    let vivo = true;
    fetch("/api/clima-espacial").then((r) => r.json()).then((j) => vivo && setD(j)).catch(() => vivo && setD({ error: true }));
    return () => {
      vivo = false;
    };
  }, []);
  return d;
}

function Modulos({ analisis, data, aid }) {
  const r = analisis.radiacion;
  const mods = modulosRadiacion({ tasaBase: tasaAuSvh(r.hoyDia), mult: r.activo ? r.mult : 1, fecha: analisis.fecha, aid });
  return (
    <section>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="etiqueta">Readings by module · HERA sensors</h2>
        <span className="text-[11px] text-muted">Daily limit {LIMITE_DIA_DEMO_MSV} mSv: demo value</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {mods.map((m) => {
          const e = m.pct >= 1 ? "critico" : m.pct >= 0.5 ? "atencion" : "normal";
          return (
            <div key={m.k} className={`card flex flex-col gap-2 p-4 ${m.refugio ? "border-cyan/50" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <span className="etiqueta leading-snug">{m.nombre}</span>
                <Icon name={m.icono} size={18} className="shrink-0 text-cyan" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className={`num text-[30px] font-semibold leading-none ${ESTADO[e].color}`}>{fmtNum(m.tasa, m.tasa < 10 ? 1 : 0)}</span>
                <span className="text-sm text-muted">µSv/h</span>
              </div>
              <div className="num text-xs text-muted">{fmtNum(m.dia, 2)} mSv/day</div>
              <Progreso pct={m.pct} color={ESTADO[e].hex} />
              <ChipEstado estado={e} className="self-start">{m.refugio ? "Shelter" : SEV[e]}</ChipEstado>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Avisos({ analisis, data, aid }) {
  const r = analisis.radiacion;
  const noaa = useNoaa();
  const ahora = Date.now();
  const lista = [];
  if (r.activo) lista.push({ icono: "rad", estado: r.refugio ? "atencion" : "critico", titulo: `Solar storm ${r.activo.nivel} active`, detalle: `${Math.round(r.tasa)} µSv/h · ${r.refugio ? "in shelter" : "go to the shelter"}`, t: new Date(r.activo.inicio).getTime() });
  if (noaa && !noaa.error) {
    const alta = noaa.nivel && noaa.nivel !== "Normal";
    lista.push({ icono: "sun", estado: alta ? (["S1", "S2"].includes(noaa.nivel) ? "atencion" : "critico") : "normal", titulo: alta ? `NOAA detects storm ${noaa.nivel}` : "Space weather calm", detalle: `NOAA GOES · ${Number(noaa.flujo).toLocaleString("en-US", { maximumFractionDigits: 2 })} pfu (≥ 10 MeV)`, t: new Date(noaa.hora).getTime() });
  }
  const pmax = Math.max(r.pct, r.pct30);
  lista.push({ icono: "chart", estado: pmax >= R.criticoPct ? "critico" : pmax >= R.atencionPct ? "atencion" : "normal", titulo: pmax >= R.atencionPct ? "Cumulative dose near a limit" : "Cumulative dose under control", detalle: `Career ${Math.round(r.pct * 100)} % · 30 days ${Math.round(r.pct30 * 100)} %`, t: ahora });
  const conRefugio = r.activo?.refugio?.[aid] ? r.activo : [...(data.eventos || [])].reverse().find((e) => e.refugio?.[aid]);
  if (conRefugio) lista.push({ icono: "shield", estado: "normal", titulo: "Shelter verified", detalle: r.activo?.refugio?.[aid] ? "Rate reduced by the shielding" : `Last storm ${conRefugio.nivel}`, t: new Date(conRefugio.refugio[aid]).getTime() });
  const top = lista.sort((a, b) => ORDEN[a.estado] - ORDEN[b.estado]).slice(0, 3);
  return (
    <Tarjeta titulo="Radiation notices">
      <ul className="divide-y divide-line">
        {top.map((a, i) => (
          <li key={i} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ESTADO[a.estado].color}`} style={{ background: `color-mix(in oklab, ${ESTADO[a.estado].hex} 14%, transparent)` }}><Icon name={a.icono} size={20} /></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{a.titulo}</span>
              <span className="block truncate text-sm text-muted">{a.detalle}</span>
            </span>
            <ChipEstado estado={a.estado}>{SEV[a.estado]}</ChipEstado>
            <span className="num w-20 shrink-0 text-right text-xs text-muted">{a.t >= ahora - 6e4 && a.icono === "chart" ? "today" : tiempoRelativo(a.t, ahora)}</span>
          </li>
        ))}
      </ul>
    </Tarjeta>
  );
}

function DatoNasa() {
  const d = nasaReal || {};
  const ok = d.verificado === true;
  return (
    <section className={`card relative p-5 ${ok ? "border-cyan/70" : "opacity-70 grayscale"}`} style={ok ? { boxShadow: "0 0 0 1px color-mix(in oklab, var(--color-cyan) 40%, transparent)" } : undefined}>
      <div className="flex items-start justify-between gap-3">
        <span className="etiqueta">Real NASA data</span>
        <span className={`rounded-md border px-2 py-0.5 text-[11px] font-bold tracking-widest ${ok ? "border-cyan text-cyan" : "border-line text-muted"}`}>NASA</span>
      </div>
      {ok ? (
        <>
          <div className="mt-1 font-semibold">{d.titulo}</div>
          <div className="mt-1 flex items-baseline gap-1.5"><span className="num text-[32px] font-semibold leading-none text-cyan">{d.valor}</span><span className="text-sm text-muted">{d.unidad}</span></div>
          <div className="mt-1 truncate text-xs text-muted">{d.periodo} · {d.url ? <a href={d.url} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted hover:text-cyan">{d.fuente}</a> : d.fuente}</div>
        </>
      ) : (
        <div className="mt-2 flex items-center gap-2 text-sm text-muted"><Icon name="clock" size={18} /> Pending verification</div>
      )}
    </section>
  );
}

export function RadiacionExtra(props) {
  return (
    <div className="flex flex-col gap-5">
      <Modulos {...props} />
      <Avisos {...props} />
      <DatoNasa />
    </div>
  );
}
