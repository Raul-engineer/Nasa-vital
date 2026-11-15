"use client";
import { useCallback, useEffect, useState } from "react";
import { alternarEjercicio, alternarFiebre, loadData, subscribe } from "./data";
import { analizar } from "./analysis";

export function useAstronautId() {
  const [id, setId] = useState(1);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("a");
    if (p) setId(Number(p));
  }, []);
  const change = useCallback((n) => {
    setId(n);
    const url = new URL(window.location.href);
    url.searchParams.set("a", n);
    window.history.replaceState(null, "", url);
  }, []);
  return [id, change];
}

export function useQuickFix(astronautId) {
  const [state, setState] = useState({ loading: true, error: null, data: null, analisis: null });

  const refresh = useCallback(async () => {
    try {
      const data = await loadData(astronautId);
      setState({ loading: false, error: null, data, analisis: analizar(data) });
    } catch (e) {
      console.error(e);
      setState((s) => ({ ...s, loading: false, error: e.message || String(e) }));
    }
  }, [astronautId]);

  useEffect(() => {
    refresh();
    return subscribe(() => refresh());
  }, [refresh]);

  const estadoAct = state.data?.actividad?.estado;
  const desdeAct = state.data?.actividad?.desde;
  useEffect(() => {
    if (!estadoAct || estadoAct === "reposo") return;
    const t = setInterval(() => setState((s) => (s.data ? { ...s, analisis: analizar(s.data) } : s)), 3000);
    return () => clearInterval(t);
  }, [estadoAct, desdeAct]);

  return { ...state, refresh };
}

export function useAtajosDemo(astronautId) {
  useEffect(() => {
    if (!astronautId) return;
    const f = (e) => {
      if (!e.shiftKey || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      const el = e.target;
      if (el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) return;
      const k = e.key.toLowerCase();
      if (k === "e") {
        e.preventDefault();
        alternarEjercicio(astronautId).catch(() => {});
      } else if (k === "f") {
        e.preventDefault();
        alternarFiebre(astronautId).catch(() => {});
      }
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [astronautId]);
}
