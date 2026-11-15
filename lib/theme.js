"use client";
import { useCallback, useEffect, useState } from "react";

import { TEMA_KEY } from "./temaScript";

export { TEMA_KEY };

export const PALETA = {
  dark: {
    fg: "#f9f5f2", muted: "#a9a0a4", soft: "#d6c9c9", panel: "#231d20", grid: "rgba(255,255,255,0.06)",
    line: "rgba(255,235,220,0.20)", cyan: "#ff975d", info: "#7cc4ff", accent: "#ff975d", violet: "#ffb888", pink: "#ff9fb6",
    ok: "#83e0b7", warn: "#ffbe72", crit: "#ff7278", banda: "#83e0b7",
  },
};
PALETA.light = PALETA.dark;

const oyentes = new Set();

function leer() {
  return "dark";
}

export function useTheme() {
  const [tema, setTema] = useState("dark");
  useEffect(() => {
    setTema(leer());
    const f = (t) => setTema(t);
    oyentes.add(f);
    return () => oyentes.delete(f);
  }, []);
  const alternar = useCallback(() => {
    const nuevo = leer() === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", nuevo);
    try {
      localStorage.setItem(TEMA_KEY, nuevo);
    } catch {}
    oyentes.forEach((f) => f(nuevo));
  }, []);
  return { tema, alternar, c: PALETA[tema] };
}

export function tooltipEstilo(c) {
  return {
    contentStyle: { background: "rgba(35,29,32,0.82)", border: `1px solid ${c.line}`, borderRadius: 14, color: c.fg, backdropFilter: "blur(18px) saturate(145%)", WebkitBackdropFilter: "blur(18px) saturate(145%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 12px 30px rgba(0,0,0,0.3)" },
    labelStyle: { color: c.muted },
    itemStyle: { color: c.fg },
  };
}
