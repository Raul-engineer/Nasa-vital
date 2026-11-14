"use client";
import { useCallback, useEffect, useState } from "react";
import { loadData, subscribe } from "./data";
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

  return { ...state, refresh };
}
