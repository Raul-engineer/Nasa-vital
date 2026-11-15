"use client";
import { Marco, MON } from "./Marco";

export function semanasVision(data, analisis, n = 8) {
  const porFecha = new Map(data.checkins.map((c) => [c.fecha, c]));
  const fechas = data.vitals.map((v) => v.fecha);
  const amsler = (data.pruebas || []).filter((p) => p.tipo === "amsler");
  const out = [];
  for (let s = n - 1; s >= 0; s--) {
    const fin = fechas.length - 1 - s * 7;
    if (fin < 0) continue;
    const dias = fechas.slice(Math.max(0, fin - 6), fin + 1);
    const sintomas = dias.filter((f) => {
      const c = f === analisis.fecha ? analisis.checkinHoy : porFecha.get(f) || {};
      return c.vision_borrosa || c.dolor_cabeza || c.vision_cefalea;
    }).length;
    const am = amsler.filter((p) => p.fecha >= dias[0] && p.fecha <= dias.at(-1)).sort((a, b) => String(b.creada_en || b.fecha).localeCompare(String(a.creada_en || a.fecha)))[0];
    out.push({ desde: dias[0], hasta: dias.at(-1), sintomas, amsler: am ? (am.resultado?.od || am.resultado?.oi ? "distorsion" : "ok") : null });
  }
  return out;
}

export default function MonitorVision({ data, analisis, t }) {
  const semanas = semanasVision(data, analisis);
  return (
    <Marco titulo="Visión · 8 semanas" color={MON.blanco} etiquetaVivo="CHECK-IN" valor={t.texto} sub={t.estado === "normal" ? "Sin síntomas hoy" : t.etiqueta}>
      <div className="grid h-full grid-cols-4 gap-1.5 sm:grid-cols-8 sm:gap-2">
        {semanas.map((s, i) => (
          <div key={s.desde} className="flex flex-col items-center justify-center gap-0.5 rounded-xl border"
            style={{ borderColor: s.amsler === "distorsion" ? MON.rojo : s.sintomas ? MON.ambar : "rgba(241,245,249,0.25)", background: i === semanas.length - 1 ? "rgba(241,245,249,0.08)" : "transparent" }}>
            <span className="text-lg leading-none" style={{ color: s.amsler === "distorsion" ? MON.rojo : s.amsler ? MON.verde : MON.tenue }}>{s.amsler === "distorsion" ? "✕" : s.amsler ? "✓" : "—"}</span>
            <span className="text-[9px] tracking-wider" style={{ color: MON.tenue }}>AMSLER</span>
            <span className="num text-sm font-semibold" style={{ color: s.sintomas ? MON.ambar : MON.blanco }}>{s.sintomas} d</span>
            <span className="text-[9px]" style={{ color: MON.tenue }}>{i === semanas.length - 1 ? "Esta sem." : `−${semanas.length - 1 - i} sem.`}</span>
          </div>
        ))}
      </div>
    </Marco>
  );
}
