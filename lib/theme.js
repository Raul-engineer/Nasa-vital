"use client";
import { useCallback, useEffect, useState } from "react";

import { TEMA_KEY } from "./temaScript";

export { TEMA_KEY };

export const PALETA = {
  dark: {
    fg: "#e6edff", muted: "#8ea0c4", soft: "#c9d4f0", panel: "#111a33", grid: "rgba(148,163,184,0.12)",
    line: "rgba(160,156,196,0.35)", accent: "#f0435a", violet: "#a78bfa", pink: "#f472b6",
    ok: "#34d399", warn: "#fbbf24", crit: "#f87171", banda: "#34d399",
  },
  light: {
    fg: "#1e1b3a", muted: "#6b6889", soft: "#3f3c5e", panel: "#ffffff", grid: "rgba(109,40,217,0.10)",
    line: "rgba(30,27,75,0.18)", accent: "#c8102e", violet: "#7c3aed", pink: "#db2777",
    ok: "#059669", warn: "#d97706", crit: "#dc2626", banda: "#059669",
  },
};

const oyentes = new Set();

function leer() {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
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
    contentStyle: { background: c.panel, border: `1px solid ${c.line}`, borderRadius: 10, color: c.fg },
    labelStyle: { color: c.muted },
    itemStyle: { color: c.fg },
  };
}
