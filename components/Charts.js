"use client";
import { useId } from "react";
import { Area, Bar, CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { tooltipEstilo, useTheme } from "@/lib/theme";

const col = (c, k) => c[k] || k;

export function TrendChart({ datos, series, banda, bandaTxt, linea, lineaTxt, unidad = "", dec = 0, alto = 220, dominio, xKey = "dia", ticks }) {
  const { c } = useTheme();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const vals = datos.flatMap((d) => series.map((s) => d[s.key])).filter((v) => v != null && !Number.isNaN(v));
  const lo = Math.min(...vals, banda?.[0] ?? Infinity, linea ?? Infinity);
  const hi = Math.max(...vals, banda?.[1] ?? -Infinity, linea ?? -Infinity);
  const pad = (hi - lo) * 0.15 || 1;
  const barras = series.some((s) => s.tipo === "bar");
  const dom = dominio || (Number.isFinite(lo) ? [barras ? 0 : Math.floor((lo - pad) * 10 ** dec) / 10 ** dec, Math.ceil((hi + pad) * 10 ** dec) / 10 ** dec] : [0, 1]);
  const fmt = (v) => (v == null ? "—" : `${Number(v).toFixed(dec)} ${unidad}`.trim());
  return (
    <div style={{ height: alto }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={datos} margin={{ top: 22, right: 10, left: -12, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`tc-${uid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={col(c, s.color)} stopOpacity={0.32} />
                <stop offset="100%" stopColor={col(c, s.color)} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke={c.grid} vertical={false} />
          <XAxis dataKey={xKey} stroke={c.muted} fontSize={12} tickLine={false} interval="preserveStartEnd" ticks={ticks} minTickGap={16} />
          <YAxis stroke={c.muted} fontSize={12} tickLine={false} domain={dom} allowDecimals={dec > 0} width={44} />
          <Tooltip {...tooltipEstilo(c)} formatter={(v, n) => [fmt(v), n]} />
          {banda && (
            <ReferenceArea y1={banda[0]} y2={banda[1]} fill={c.banda} fillOpacity={0.1} stroke={c.banda} strokeOpacity={0.35} strokeDasharray="4 4"
              label={bandaTxt ? { value: bandaTxt, position: "insideTopRight", fill: c.banda, fontSize: 11 } : undefined} />
          )}
          {linea != null && (
            <ReferenceLine y={linea} stroke={c.warn} strokeDasharray="5 5" label={lineaTxt ? { value: lineaTxt, position: "insideTopLeft", fill: c.warn, fontSize: 11 } : undefined} />
          )}
          {series.map((s) =>
            s.tipo === "bar" ? (
              <Bar key={s.key} dataKey={s.key} name={s.nombre} fill={col(c, s.color)} radius={[4, 4, 0, 0]} maxBarSize={18} isAnimationActive={false} />
            ) : s.tipo === "line" ? (
              <Line key={s.key} type="monotone" dataKey={s.key} name={s.nombre} stroke={col(c, s.color)} strokeWidth={2.2} dot={datos.length <= 31 ? { r: 2.5 } : false}
                connectNulls isAnimationActive={false} />
            ) : (
              <Area key={s.key} type="monotone" dataKey={s.key} name={s.nombre} stroke={col(c, s.color)} strokeWidth={2.4} fill={`url(#tc-${uid}-${s.key})`}
                dot={datos.length <= 31 ? { r: 3, fill: col(c, s.color) } : false} activeDot={{ r: 5 }} connectNulls isAnimationActive={false} />
            )
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
