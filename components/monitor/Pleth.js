"use client";
import { useCallback, useRef } from "react";
import { Marco, MON, OndaCanvas } from "./Marco";

export function amplitudSpo2(spo2) {
  return Math.max(0.12, Math.min(1, ((Number(spo2) || 97) - 84) / 13));
}

function forma(x) {
  if (x < 0.15) return (x / 0.15) ** 2;
  return Math.exp(-(x - 0.15) * 3.4) + 0.2 * Math.exp(-(((x - 0.43) / 0.05) ** 2));
}

export default function MonitorPleth({ spo2, fc }) {
  const ref = useRef({ spo2, fc });
  ref.current = { spo2, fc };
  const st = useRef({ tb: 0.3, periodo: 60 / (fc || 70), amp: amplitudSpo2(spo2) });
  const generar = useCallback((dt) => {
    const s = st.current;
    s.tb += dt;
    if (s.tb >= s.periodo) {
      s.tb -= s.periodo;
      s.periodo = 60 / Math.max(30, ref.current.fc || 70);
    }
    s.amp += (amplitudSpo2(ref.current.spo2) - s.amp) * 0.02;
    return s.amp * forma(s.tb / s.periodo);
  }, []);
  return (
    <Marco titulo="Plethysmography · SpO₂" color={MON.cian} valor={spo2 ?? "—"} unidad="%" sub={fc != null ? `Pulse ${fc} bpm` : null}>
      <OndaCanvas generar={generar} color={MON.cian} pxPorSeg={110} rango={[-0.1, 1.15]} />
    </Marco>
  );
}
