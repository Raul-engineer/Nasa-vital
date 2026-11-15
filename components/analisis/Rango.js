"use client";
import { ESTADO } from "@/components/Shell";
import { fmtNum } from "@/components/Widgets";
import { UMBRALES } from "@/lib/analysis";
import { DEC } from "./comun";

const T = UMBRALES.tarjetas;
const C = UMBRALES.cabina;

export const ZONAS = {
  fc: { dominio: [30, 130], zonas: [[30, T.fc.rojoMin + 0.5, "critico"], [T.fc.rojoMin + 0.5, T.fc.atencionMin + 0.5, "atencion"], [T.fc.atencionMin + 0.5, T.fc.atencionMax - 0.5, "normal"], [T.fc.atencionMax - 0.5, T.fc.rojoMax + 0.5, "atencion"], [T.fc.rojoMax + 0.5, 130, "critico"]] },
  pa: { dominio: [70, 170], zonas: [[70, T.pa.bajaRojo + 0.5, "critico"], [T.pa.bajaRojo + 0.5, T.pa.bajaAtencion + 0.5, "atencion"], [T.pa.bajaAtencion + 0.5, T.pa.atencionSis - 0.5, "normal"], [T.pa.atencionSis - 0.5, T.pa.rojoSis - 0.5, "atencion"], [T.pa.rojoSis - 0.5, 170, "critico"]], nota: "systolic" },
  fr: { dominio: [4, 30], zonas: [[4, T.fr.rojoMin + 0.5, "critico"], [T.fr.rojoMin + 0.5, 11.5, "atencion"], [11.5, 20.5, "normal"], [20.5, T.fr.rojoMax - 0.5, "atencion"], [T.fr.rojoMax - 0.5, 30, "critico"]] },
  temp: { dominio: [34, 40.5], zonas: [[34, T.temp.rojoBaja + 0.05, "critico"], [T.temp.rojoBaja + 0.05, T.temp.atencionBaja + 0.05, "atencion"], [T.temp.atencionBaja + 0.05, T.temp.fiebre - 0.05, "normal"], [T.temp.fiebre - 0.05, T.temp.rojoAlta - 0.05, "atencion"], [T.temp.rojoAlta - 0.05, 40.5, "critico"]] },
  spo2: { dominio: [84, 100], zonas: [[84, T.spo2.rojo - 0.05, "critico"], [T.spo2.rojo - 0.05, T.spo2.atencion - 0.05, "atencion"], [T.spo2.atencion - 0.05, 100, "normal"]] },
  radiacion: { dominio: [0, 100], zonas: [[0, UMBRALES.radiacion.atencionPct * 100, "normal"], [UMBRALES.radiacion.atencionPct * 100, UMBRALES.radiacion.criticoPct * 100, "atencion"], [UMBRALES.radiacion.criticoPct * 100, 100, "critico"]], unidad: "%", nota: "career" },
  sueno: { dominio: [3, 10], zonas: [[3, UMBRALES.suenoCriticoHoras + 0.05, "critico"], [UMBRALES.suenoCriticoHoras + 0.05, UMBRALES.suenoMetaHoras - 0.05, "atencion"], [UMBRALES.suenoMetaHoras - 0.05, 10, "normal"]] },
  animo: { dominio: [0, 100], zonas: [[0, T.animo.who5Rojo + 0.5, "critico"], [T.animo.who5Rojo + 0.5, T.animo.who5Atencion + 0.5, "atencion"], [T.animo.who5Atencion + 0.5, 100, "normal"]] },
  huesos: { dominio: [0, 150], zonas: [[0, T.huesos.atencionPct - 0.5, "atencion"], [T.huesos.atencionPct - 0.5, 150, "normal"]], unidad: "%" },
  cabina: { dominio: [1500, 6000], zonas: [[1500, C.co2AtencionPpm, "normal"], [C.co2AtencionPpm, C.co2RojoPpm, "atencion"], [C.co2RojoPpm, 6000, "critico"]] },
};

const PALABRA = { critico: "Poor", atencion: "Attention", normal: "Good" };

export function BarraRango({ t, analisis }) {
  const Z = ZONAS[t.k];
  if (!Z) return null;
  const dec = DEC[t.k] || 0;
  const [lo, hi] = Z.dominio;
  const P = (v) => Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100));
  const valor = t.k === "radiacion" ? analisis.radiacion.pct * 100 : t.valor;
  const rango = t.k === "radiacion" ? null : t.rangoPersonal;
  const E = ESTADO[t.estado] || ESTADO.normal;
  const txtValor = t.k === "radiacion" ? `${Math.round(valor)} %` : t.k === "pa" ? t.texto : fmtNum(valor, dec);
  return (
    <section className="card px-5 pb-4 pt-3" aria-label="Range bar">
      <div className="mb-1 etiqueta">Range{Z.nota ? ` · ${Z.nota}` : ""}</div>
      <div className="relative pb-9 pt-8">
        {valor != null && (
          <div className="absolute top-0 -translate-x-1/2 transition-all duration-700" style={{ left: `${P(valor)}%` }}>
            <div className={`num whitespace-nowrap rounded-md border bg-panel px-2 py-0.5 text-xs font-semibold ${E.border} ${E.color}`}>Now {txtValor}</div>
            <div className="mx-auto h-0 w-0 border-x-[6px] border-t-[7px] border-x-transparent" style={{ borderTopColor: E.hex }} />
          </div>
        )}
        <div className="flex h-5 overflow-hidden rounded-full">
          {Z.zonas.map(([a, b, e], i) => (
            <div key={i} className={`flex items-center justify-center overflow-hidden text-[10px] font-semibold uppercase tracking-wider text-[#04111f] ${ESTADO[e].bg}`}
              style={{ width: `${P(b) - P(a)}%`, opacity: e === "normal" ? 0.9 : 0.75 }}>
              {P(b) - P(a) >= 9 ? PALABRA[e] : ""}
            </div>
          ))}
        </div>
        {rango && (
          <div className="absolute top-[52px] transition-all duration-700" style={{ left: `${P(rango[0])}%`, width: `${Math.max(1, P(rango[1]) - P(rango[0]))}%` }}>
            <div className="h-2 rounded-b-md border-x-2 border-b-2 border-cyan" />
            <div className="num absolute left-1/2 top-2.5 -translate-x-1/2 whitespace-nowrap text-[11px] text-cyan">Your range {fmtNum(rango[0], dec)}–{fmtNum(rango[1], dec)}</div>
          </div>
        )}
        <div className="num absolute bottom-0 left-0 text-[10px] text-muted">{fmtNum(lo, dec)}{Z.unidad || ""}</div>
        <div className="num absolute bottom-0 right-0 text-[10px] text-muted">{fmtNum(hi, dec)}{Z.unidad || ""}</div>
      </div>
    </section>
  );
}
