"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { ESTADO } from "./Shell";
import { estadoPersonaje } from "./Personaje";
import { Metrica } from "./PanelTripulante";
import { ESTADO_DE_NIVEL, marcarFaltante, nivelAlerta, POSES, poseFalta, PRIORIDAD_NIVEL, PROPORCION, srcPose, ZONA_DE, ZONAS } from "@/lib/cuerpo";

const ORDEN_K = ["fc", "pa", "fr", "spo2", "temp", "conciencia", "radiacion", "vision", "huesos", "cabina", "sueno", "animo"];
const ALTO_T = 154;
const SEP = 14;
const ALTO_OK = 34;
const RECIENTE_MS = 20000;
export const MAX_TARJETAS = 4;
const POR_LADO = 2;

const usarLayout = typeof window === "undefined" ? useEffect : useLayoutEffect;

function useTam(ref) {
  const [t, setT] = useState({ W: 0, H: 0 });
  usarLayout(() => {
    const el = ref.current;
    if (!el) return;
    const f = () => setT({ W: el.clientWidth, H: el.clientHeight });
    f();
    const ro = new ResizeObserver(f);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return t;
}

function usePose(estado) {
  const [capas, setCapas] = useState({ actual: POSES.base, anterior: null });
  const [, setRev] = useState(0);
  const actualRef = useRef(capas.actual);
  actualRef.current = capas.actual;
  useEffect(() => {
    let vivo = true;
    let t = 0;
    const cambiar = (src) => {
      if (src === actualRef.current) return;
      setCapas({ actual: src, anterior: actualRef.current });
      t = setTimeout(() => vivo && setCapas((c) => ({ ...c, anterior: null })), 420);
    };
    const objetivo = srcPose(estado);
    if (objetivo === POSES.base) {
      cambiar(POSES.base);
      return () => { vivo = false; clearTimeout(t); };
    }
    const img = new Image();
    img.onload = () => vivo && cambiar(objetivo);
    img.onerror = () => {
      marcarFaltante(objetivo);
      if (!vivo) return;
      setRev((r) => r + 1);
      cambiar(POSES.base);
    };
    img.src = objetivo;
    return () => { vivo = false; clearTimeout(t); };
  }, [estado]);
  return capas;
}

export function useAlertasCuerpo(analisis) {
  const prev = useRef({});
  const cambio = useRef({});
  const niveles = {};
  const lista = analisis?.tarjetas || [];
  for (const t of lista) niveles[t.k] = nivelAlerta(t, analisis);
  const ahora = Date.now();
  for (const k of Object.keys(niveles)) if (prev.current[k] !== niveles[k]) cambio.current[k] = prev.current[k] === undefined ? 0 : ahora;
  useEffect(() => {
    prev.current = niveles;
  });
  const porK = Object.fromEntries(lista.map((t) => [t.k, t]));
  const reciente = (k) => (cambio.current[k] && ahora - cambio.current[k] < RECIENTE_MS ? 1 : 0);
  return Object.keys(niveles)
    .filter((k) => niveles[k] in PRIORIDAD_NIVEL)
    .sort((a, b) => PRIORIDAD_NIVEL[niveles[a]] - PRIORIDAD_NIVEL[niveles[b]] || reciente(b) - reciente(a) || ORDEN_K.indexOf(a) - ORDEN_K.indexOf(b))
    .map((k) => ({ k, nivel: niveles[k], t: porK[k] }));
}

function colocar(items, H, alto) {
  const orden = [...items].sort((a, b) => a.py - b.py);
  let y = 8;
  for (const it of orden) {
    it.y = Math.max(it.py - alto / 2, y);
    y = it.y + alto + SEP;
  }
  if (y - SEP > H - 8) {
    let lim = H - 8;
    for (let i = orden.length - 1; i >= 0; i--) {
      orden[i].y = Math.max(8, Math.min(orden[i].y, lim - alto));
      lim = orden[i].y - SEP;
    }
  }
  return orden;
}

export default function Cuerpo({ analisis, lista, onVer, debug = false, hrefMas = "/analisis", conTarjetas = true }) {
  const caja = useRef(null);
  const { W, H } = useTam(caja);
  const estado = estadoPersonaje(analisis);
  const capas = usePose(estado);
  const [saliendo, setSaliendo] = useState([]);
  const ultimas = useRef({});

  const pad = 12;
  let fh = Math.max(0, H - pad * 2);
  let fw = fh * PROPORCION;
  if (fw > W * 0.5) {
    fw = W * 0.5;
    fh = fw / PROPORCION;
  }
  const fx = (W - fw) / 2;
  const fy = (H - fh) / 2;
  const punto = (z) => ({ px: fx + (ZONAS[z].x / 100) * fw, py: fy + (ZONAS[z].y / 100) * fh });
  const separacion = 56;
  const cw = Math.round(Math.max(220, Math.min(290, fx - separacion - 8)));
  const xIzq = Math.max(8, fx - separacion - cw);
  const xDer = Math.min(W - 8 - cw, fx + fw + separacion);

  const visibles = lista.slice(0, MAX_TARJETAS);
  const resto = lista.length - visibles.length;
  const izq = [];
  const der = [];
  if (conTarjetas)
    for (const v of visibles) {
      const z = ZONA_DE[v.k];
      const p = punto(z);
      const x = ZONAS[z].x;
      let lado = x < 50 ? "izq" : x > 50 ? "der" : izq.length <= der.length ? "izq" : "der";
      if (lado === "izq" && izq.length >= POR_LADO) lado = "der";
      else if (lado === "der" && der.length >= POR_LADO) lado = "izq";
      (lado === "izq" ? izq : der).push({ ...v, ...p, lado });
    }
  const tarjetas = W && conTarjetas ? [...colocar(izq, H, ALTO_T), ...colocar(der, H, ALTO_T)] : [];
  const actuales = new Set(tarjetas.map((b) => `${b.k}-${b.nivel}`));
  const firma = tarjetas.map((b) => `${b.k}-${b.nivel}`).join("|");

  useEffect(() => {
    const nuevas = {};
    for (const b of tarjetas) nuevas[`${b.k}-${b.nivel}`] = b;
    const fuera = Object.keys(ultimas.current).filter((id) => !(id in nuevas)).map((id) => ultimas.current[id]);
    ultimas.current = nuevas;
    if (!fuera.length) return;
    setSaliendo((s) => [...s.filter((x) => !nuevas[`${x.k}-${x.nivel}`]), ...fuera]);
    const t = setTimeout(() => setSaliendo((s) => s.filter((x) => !fuera.includes(x))), 340);
    return () => clearTimeout(t);
  }, [firma]);

  const zonasActivas = {};
  for (const v of lista) {
    const z = ZONA_DE[v.k];
    if (!zonasActivas[z] || PRIORIDAD_NIVEL[v.nivel] < PRIORIDAD_NIVEL[zonasActivas[z].nivel]) zonasActivas[z] = v;
  }
  const todoBien = lista.length === 0 && poseFalta(POSES.estable);
  const mano = punto("manoDer");
  const colorDe = (nivel) => ESTADO[ESTADO_DE_NIVEL[nivel]]?.hex || ESTADO.normal.hex;
  const claseDe = (nivel) => ESTADO[ESTADO_DE_NIVEL[nivel]]?.color || ESTADO.normal.color;
  const xDe = (b) => (b.lado === "izq" ? xIzq : xDer);
  const finLinea = (b) => (b.lado === "izq" ? xIzq + cw : xDer);
  const fantasmas = saliendo.filter((s) => !actuales.has(`${s.k}-${s.nivel}`));
  const auraRad = lista.some((v) => v.k === "radiacion");

  return (
    <div ref={caja} className="cuerpo relative h-full w-full" data-estado={estado} data-aura={auraRad ? "radiacion" : undefined}>
      {W > 0 && (
        <>
          <div className="cuerpo-aura pointer-events-none absolute rounded-full" aria-hidden
            style={{ left: fx - fw * 0.25, top: fy - fh * 0.04, width: fw * 1.5, height: fh * 1.08 }} />
          <div className="cuerpo-fig absolute" style={{ left: fx, top: fy, width: fw, height: fh }}>
            <div className="cuerpo-poses relative h-full w-full">
              {capas.anterior && <img key={`a-${capas.anterior}`} src={capas.anterior} alt="" className="pose-sale absolute inset-0 h-full w-full object-contain" draggable={false} />}
              <img key={`b-${capas.actual}`} src={capas.actual} alt="Cuerpo del astronauta" className={`absolute inset-0 h-full w-full object-contain ${capas.anterior ? "pose-entra" : ""}`} draggable={false} data-pose={capas.actual} />
            </div>
          </div>
          {conTarjetas && (
            <svg className="pointer-events-none absolute inset-0" width={W} height={H} aria-hidden>
              {[...tarjetas, ...fantasmas].map((b) => (
                <line key={`l-${b.k}-${b.nivel}`} x1={b.px} y1={b.py} x2={finLinea(b)} y2={b.y + ALTO_T / 2} stroke={colorDe(b.nivel)}
                  strokeOpacity={actuales.has(`${b.k}-${b.nivel}`) ? 0.6 : 0} strokeWidth="1.2" className="transition-[stroke-opacity] duration-300" data-linea={b.k} />
              ))}
              {todoBien && <line x1={mano.px} y1={mano.py} x2={Math.min(W - 8, mano.px + 46)} y2={mano.py - 34 + ALTO_OK / 2} stroke={colorDe("ok")} strokeOpacity="0.6" />}
            </svg>
          )}
          {Object.entries(zonasActivas).map(([z, v]) => {
            const p = punto(z);
            return (
              <button key={z} onClick={() => onVer(v.k)} aria-label={`${v.t.nombre}: ver análisis`} className={`cuerpo-punto absolute ${claseDe(v.nivel)}`}
                style={{ left: p.px - 7, top: p.py - 7 }} data-zona={z}>
                <span className="cuerpo-punto-anillo" />
                <span className="cuerpo-punto-centro" />
              </button>
            );
          })}
          {debug && Object.keys(ZONAS).map((z) => {
            const p = punto(z);
            return (
              <span key={`d-${z}`} className="pointer-events-none absolute z-20 flex items-center gap-1 text-[10px] font-semibold text-cyan" style={{ left: p.px - 4, top: p.py - 4 }} data-debug-zona={z}>
                <span className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_6px_var(--color-cyan)]" />
                <span className="rounded bg-black/70 px-1">{z}</span>
              </span>
            );
          })}
          {[...tarjetas.map((b) => ({ ...b, sale: false })), ...fantasmas.map((b) => ({ ...b, sale: true }))].map((b) => (
            <div key={`t-${b.k}-${b.nivel}`} className={`absolute z-10 ${b.sale ? "burbuja-sale pointer-events-none" : "burbuja-entra"}`}
              style={{ left: xDe(b), top: b.y, width: cw, height: ALTO_T, transition: "top .35s ease, left .35s ease" }} data-tarjeta={b.k} data-nivel={b.nivel}>
              <Metrica t={b.t} analisis={analisis} onClick={() => onVer(b.k)} className="h-full w-full" />
            </div>
          ))}
          {todoBien && (
            <div role="status" data-burbuja="ok" className={`burbuja glass burbuja-entra absolute z-10 flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-xs font-semibold ${claseDe("ok")}`}
              style={{ left: Math.min(W - 160, mano.px + 46), top: mano.py - 34, height: ALTO_OK, borderColor: "color-mix(in oklab, var(--color-ok) 45%, transparent)" }}>
              <span aria-hidden>👍</span> Todo en orden
            </div>
          )}
          {resto > 0 && conTarjetas && (
            <Link href={hrefMas} className="glass burbuja-entra absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full px-3 py-1.5 text-xs font-semibold text-soft hover:text-fg" data-burbuja="mas">
              +{resto} {resto === 1 ? "alerta" : "alertas"}
            </Link>
          )}
        </>
      )}
    </div>
  );
}
