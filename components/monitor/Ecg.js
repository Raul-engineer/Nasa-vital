"use client";
import { useCallback, useRef } from "react";
import { Marco, MON, OndaCanvas } from "./Marco";

const g = (t, c, s, a) => a * Math.exp(-(((t - c) / s) ** 2));

export function formaEcg(tb, periodo) {
  const k = Math.min(1, Math.sqrt(periodo / 0.86));
  return g(tb, 0.08 * k, 0.025, 0.12) + g(tb, 0.17, 0.008, -0.12) + g(tb, 0.19, 0.012, 1) + g(tb, 0.212, 0.01, -0.24) + g(tb, 0.19 + 0.2 * k, 0.045 * k, 0.28);
}

export default function MonitorEcg({ fc, vfc }) {
  const fcRef = useRef(fc);
  fcRef.current = fc;
  const st = useRef({ tb: 0, periodo: 60 / (fc || 70) });
  const latido = useRef(null);
  const generar = useCallback((dt) => {
    const s = st.current;
    let mejor = 0;
    for (let i = 0; i < 3; i++) {
      s.tb += dt / 3;
      if (s.tb >= s.periodo) {
        s.tb -= s.periodo;
        s.periodo = (60 / Math.max(30, fcRef.current || 70)) * (1 + (Math.random() - 0.5) * 0.04);
        const el = latido.current;
        if (el) {
          el.style.transform = "scale(1.35)";
          el.style.opacity = "1";
          setTimeout(() => { el.style.transform = "scale(1)"; el.style.opacity = "0.55"; }, 140);
        }
      }
      const v = formaEcg(s.tb, s.periodo);
      if (Math.abs(v) > Math.abs(mejor)) mejor = v;
    }
    return mejor;
  }, []);
  return (
    <Marco titulo="ECG · lead II" color={MON.verde} valor={fc ?? "—"} unidad="bpm"
      sub={vfc != null ? `HRV ${vfc} ms` : null}
      extra={<span ref={latido} aria-hidden className="mt-1 text-xl transition-all duration-150" style={{ color: MON.verde, opacity: 0.55 }}>♥</span>}>
      <OndaCanvas generar={generar} color={MON.verde} pxPorSeg={120} rango={[-0.4, 1.15]} />
    </Marco>
  );
}
