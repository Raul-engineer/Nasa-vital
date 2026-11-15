"use client";
import { useCallback, useRef } from "react";
import { Marco, MON, OndaCanvas } from "./Marco";

export default function MonitorRespiracion({ fr }) {
  const ref = useRef(fr);
  ref.current = fr;
  const st = useRef({ x: 0 });
  const generar = useCallback((dt) => {
    const s = st.current;
    s.x = (s.x + (dt * Math.max(4, ref.current || 14)) / 60) % 1;
    const x = s.x < 0.4 ? (s.x / 0.4) * 0.5 : 0.5 + ((s.x - 0.4) / 0.6) * 0.5;
    return 0.5 - 0.5 * Math.cos(2 * Math.PI * x);
  }, []);
  return (
    <Marco titulo="Respiración · impedancia" color={MON.amarillo} valor={fr ?? "—"} unidad="rpm" sub="Un ciclo por respiración">
      <OndaCanvas generar={generar} color={MON.amarillo} pxPorSeg={45} rango={[-0.1, 1.1]} />
    </Marco>
  );
}
