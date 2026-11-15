"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { loadData, loadFichas, loadResultados, setEnVivo, subscribe, subscribeFichas } from "@/lib/data";
import { analizar } from "@/lib/analysis";
import { aplicarAccion, estadoAlarma, evaluarAlarmas, MENSAJE_RECIBIDO, visibleParaQuien } from "@/lib/alarma";
import { sonarAviso, usePestanaVisible } from "@/lib/useFichas";

const hora = (iso) => (iso ? new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—");

export function useAlarmasTripulacion(astronautId) {
  const [st, setSt] = useState({ alarmas: [], acks: {}, listo: false });
  const vivo = useRef(true);
  const cargar = useCallback(async () => {
    if (!astronautId) return;
    try {
      const d0 = await loadData(astronautId);
      const filas = await Promise.all(d0.astronauts.map(async (a) => {
        const data = a.id === d0.astronaut.id ? d0 : await loadData(a.id);
        const [f, res] = await Promise.all([loadFichas(a.id).catch(() => ({ eventos: [] })), loadResultados(a.id).catch(() => [])]);
        return { a, data, analisis: analizar(data), eventos: f.eventos || [], resultados: res };
      }));
      const alarmas = filas.flatMap((x) => evaluarAlarmas({ astronauta: { id: x.a.id, nombre: x.a.nombre }, analisis: x.analisis, data: x.data, eventosFicha: x.eventos, resultados: x.resultados }));
      const acks = Object.fromEntries(filas.map((x) => [x.a.id, x.data.enVivo?.alarmas && typeof x.data.enVivo.alarmas === "object" ? x.data.enVivo.alarmas : {}]));
      if (vivo.current) setSt({ alarmas, acks, listo: true, ids: filas.map((x) => x.a.id) });
    } catch (e) {
      console.warn("QuickFix: alarms", e?.message || e);
    }
  }, [astronautId]);
  const idsKey = (st.ids || []).join(",");
  useEffect(() => {
    vivo.current = true;
    cargar();
    return () => {
      vivo.current = false;
    };
  }, [cargar]);
  useEffect(() => {
    let t = null;
    const pedir = () => {
      clearTimeout(t);
      t = setTimeout(cargar, 500);
    };
    const offs = [subscribe(pedir), ...(idsKey ? idsKey.split(",").map((id) => subscribeFichas(Number(id), pedir)) : [])];
    return () => {
      clearTimeout(t);
      offs.forEach((f) => f());
    };
  }, [cargar, idsKey]);
  return { ...st, refrescar: cargar };
}

export default function AlarmaCritica({ astronautId, quien = "Crew member", esOficial = false, control = false }) {
  const { alarmas, acks, listo, refrescar } = useAlarmasTripulacion(astronautId);
  const visible = usePestanaVisible();
  const [enviando, setEnviando] = useState(false);
  const podados = useRef(new Set());

  const propias = alarmas.filter((a) => visibleParaQuien(a, { esOficial }));
  const ackDe = (a) => acks[a.astronautId] || {};
  const pantalla = propias.filter((a) => estadoAlarma(a, ackDe(a)) === "pantalla");
  const banda = propias.filter((a) => estadoAlarma(a, ackDe(a)) === "banda");
  const actual = pantalla[0] || null;

  useEffect(() => {
    if (!actual || !visible) return;
    const sonar = () => {
      sonarAviso(true);
      if (control && typeof navigator !== "undefined" && navigator.vibrate && navigator.userActivation?.hasBeenActive !== false) navigator.vibrate([400, 150, 400]);
    };
    sonar();
    const t = setInterval(sonar, 5000);
    return () => clearInterval(t);
  }, [actual?.id, visible, control]);

  useEffect(() => {
    if (!listo) return;
    const activas = new Set(alarmas.map((a) => a.id));
    for (const [aid, mapa] of Object.entries(acks)) {
      const sobran = Object.keys(mapa).filter((id) => !activas.has(id));
      const llave = `${aid}:${sobran.join(",")}`;
      if (!sobran.length || podados.current.has(llave)) continue;
      podados.current.add(llave);
      const limpio = Object.fromEntries(Object.entries(mapa).filter(([id]) => activas.has(id)));
      setEnVivo(Number(aid), "alarmas", limpio).catch(() => {});
    }
  }, [listo, alarmas, acks]);

  const accion = async (a, tipo) => {
    setEnviando(true);
    try {
      await setEnVivo(a.astronautId, "alarmas", aplicarAccion(ackDe(a), a.id, tipo, quien));
      await refrescar();
    } catch {}
    setEnviando(false);
  };

  return (
    <>
      {banda.length > 0 && !actual && (
        <div className="fixed inset-x-0 top-0 z-[65] space-y-px" role="alert" data-banda-alarma>
          {banda.map((a) => {
            const r = ackDe(a)[a.id]?.recibido;
            return (
              <div key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-[#ff7278] px-4 py-2 text-sm font-semibold text-[#2a0b0d]">
                <span className="min-w-0 flex-1">{a.nombre}: {a.titulo} · {a.valor} · Received by {r?.por || "—"} at {hora(r?.t)}</span>
                <Link href={`/?a=${a.astronautId}&ficha=${a.clave}`} className="rounded-lg bg-black/15 px-3 py-1.5 hover:bg-black/25">Open card</Link>
                {esOficial && <button type="button" disabled={enviando} onClick={() => accion(a, "cerrar")} className="rounded-lg bg-black/15 px-3 py-1.5 hover:bg-black/25" data-accion="cerrar-alarma">Close (medical officer)</button>}
              </div>
            );
          })}
        </div>
      )}
      {actual && (
        <div className="alarma-pulso fixed inset-0 z-[70] flex flex-col items-center justify-center gap-6 overflow-y-auto bg-[#ff7278] px-6 py-10 text-center text-[#2a0b0d]" role="alertdialog" aria-modal="true" aria-label={`Critical alarm: ${actual.titulo}`} data-alarma-critica={actual.tipo}>
          <div className="text-base font-bold uppercase tracking-[0.2em]">Critical alarm{pantalla.length > 1 ? ` · 1 of ${pantalla.length}` : ""}</div>
          <div className="font-display text-3xl font-bold sm:text-4xl">{actual.nombre}</div>
          <div className="max-w-3xl font-display text-2xl font-semibold leading-tight sm:text-3xl">{actual.titulo}</div>
          <div className="font-display text-7xl font-bold leading-none sm:text-8xl" data-valor-alarma>{actual.valor}</div>
          <ol className="w-full max-w-xl space-y-2 text-left text-lg font-semibold">
            {actual.acciones.map((t, i) => (
              <li key={t} className="flex items-start gap-3 rounded-2xl bg-black/10 px-4 py-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#2a0b0d] text-base text-[#ff7278]">{i + 1}</span>{t}</li>
            ))}
          </ol>
          <button type="button" disabled={enviando} onClick={() => accion(actual, "recibido")} className="min-h-16 w-full max-w-xl rounded-2xl bg-[#2a0b0d] px-6 text-2xl font-bold text-white shadow-lg active:scale-[0.99] disabled:opacity-60" data-accion="recibido">
            {MENSAJE_RECIBIDO}
          </button>
          <div className="text-sm font-semibold opacity-80">Responding as: {quien}</div>
        </div>
      )}
    </>
  );
}
