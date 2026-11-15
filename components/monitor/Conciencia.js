"use client";
import { Marco, MON } from "./Marco";

const DIA = ["S", "M", "T", "W", "T", "F", "S"];

export default function MonitorConciencia({ data, analisis }) {
  const porFecha = new Map(data.checkins.map((c) => [c.fecha, c]));
  const dias = data.vitals.slice(-7).map((v) => {
    const c = v.fecha === analisis.fecha ? analisis.checkinHoy : porFecha.get(v.fecha) || {};
    return { fecha: v.fecha, confuso: !!c.confusion, mareo: !!c.mareo_de_pie, dia: DIA[new Date(v.fecha + "T12:00:00").getDay()] };
  });
  const hoy = dias.at(-1);
  return (
    <Marco titulo="Consciousness · 7 days" color={MON.blanco} etiquetaVivo="CHECK-IN" valor={hoy?.confuso ? "Confused" : "Alert"} sub={hoy?.mareo ? "Dizzy today" : "No dizziness today"}>
      <div className="grid h-full grid-cols-7 gap-1.5 sm:gap-2">
        {dias.map((d, i) => (
          <div key={d.fecha} className="relative flex flex-col items-center justify-center rounded-xl border"
            style={{ borderColor: d.confuso ? MON.rojo : d.mareo ? MON.ambar : "rgba(241,245,249,0.25)", background: d.confuso ? `${MON.rojo}22` : i === dias.length - 1 ? "rgba(241,245,249,0.08)" : "transparent" }}>
            <span className="num text-2xl font-semibold" style={{ color: d.confuso ? MON.rojo : MON.blanco }}>{d.confuso ? "C" : "A"}</span>
            <span className="text-[10px]" style={{ color: MON.tenue }}>{d.confuso ? "Confused" : "Alert"}</span>
            {d.mareo && <span className="absolute right-1 top-1 rounded-full px-1 text-[9px] font-bold" style={{ background: MON.ambar, color: "#1f1300" }}>D</span>}
            <span className="absolute bottom-1 text-[10px] font-semibold" style={{ color: MON.tenue }}>{d.dia}</span>
          </div>
        ))}
      </div>
    </Marco>
  );
}
