"use client";
import { useCallback, useEffect, useState } from "react";

import { TEMA_KEY } from "./temaScript";

export { TEMA_KEY };

export const PALETA = {
  dark: {
    fg: "#eef0ff", muted: "#a3a8c6", soft: "#c9cde8", panel: "#12132a", grid: "rgba(255,255,255,0.06)",
    line: "rgba(190,205,255,0.18)", cyan: "#8f86ff", info: "#7cc4ff", accent: "#8f86ff", violet: "#c4b8ff", pink: "#f0abfc",
    ok: "#83e0b7", warn: "#f5d76e", crit: "#ff7278", banda: "#83e0b7",
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
