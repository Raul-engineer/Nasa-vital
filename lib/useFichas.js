"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadFichas, loadResultados, loadTripulacion, subscribe, subscribeFichas } from "./data";
import { historialDe } from "./pruebas";

const VACIO = { eventos: [], pasos: [], medicamentos: [], medicamentosTripulacion: [] };

export function useFichas(astronautId) {
  const [st, setSt] = useState({ ...VACIO, listo: false });
  const vivo = useRef(true);
  const refresh = useCallback(async () => {
    if (!astronautId) return;
    try {
      const r = await loadFichas(astronautId);
      if (vivo.current) setSt({ ...r, listo: true });
    } catch (e) {
      console.warn("QuickFix: cards", e?.message || e);
      if (vivo.current) setSt((s) => ({ ...s, listo: true }));
    }
  }, [astronautId]);
  useEffect(() => {
    if (!astronautId) return;
    vivo.current = true;
    setSt({ ...VACIO, listo: false });
    refresh();
    const off = subscribeFichas(astronautId, () => refresh());
    return () => {
      vivo.current = false;
      off();
    };
  }, [astronautId, refresh]);
  return { ...st, refresh };
}

export function useResultados(astronautId) {
  const [st, setSt] = useState({ lista: [], listo: false });
  useEffect(() => {
    if (!astronautId) return;
    let vivo = true;
    setSt({ lista: [], listo: false });
    const cargar = () => loadResultados(astronautId).then((lista) => vivo && setSt({ lista, listo: true })).catch(() => vivo && setSt((s) => ({ ...s, listo: true })));
    cargar();
    const off = subscribeFichas(astronautId, cargar);
    return () => {
      vivo = false;
      off();
    };
  }, [astronautId]);
  return st;
}

export function useHistorialPruebas(astronautId, data) {
  const r = useResultados(astronautId);
  const historial = useMemo(() => (data ? historialDe(r.lista, data.pruebas || [], data.checkins || []) : []), [r.lista, data]);
  return { historial, resultados: r.lista, listo: r.listo };
}

export function useTripulacion(ids, activo = true) {
  const [lista, setLista] = useState([]);
  const clave = (ids || []).join(",");
  useEffect(() => {
    if (!activo || !clave) return;
    let vivo = true;
    let t = null;
    const cargar = () => {
      clearTimeout(t);
      t = setTimeout(async () => {
        const r = await loadTripulacion(clave.split(",").map(Number)).catch(() => []);
        if (vivo) setLista(r);
      }, 400);
    };
    cargar();
    const off = subscribe(cargar);
    return () => {
      vivo = false;
      clearTimeout(t);
      off();
    };
  }, [clave, activo]);
  return lista;
}

export function usePestanaVisible() {
  const [v, setV] = useState(true);
  useEffect(() => {
    const f = () => setV(document.visibilityState !== "hidden");
    f();
    document.addEventListener("visibilitychange", f);
    return () => document.removeEventListener("visibilitychange", f);
  }, []);
  return v;
}

export function sonarAviso(fuerte = false) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const tonos = fuerte ? [880, 660, 880, 660] : [880, 660];
    tonos.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.22);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + i * 0.22 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.22 + 0.2);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.22);
      o.stop(ctx.currentTime + i * 0.22 + 0.21);
    });
    setTimeout(() => ctx.close().catch(() => {}), 1500);
  } catch {}
}
