"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { estadoPersonaje } from "./Personaje";
import { Metrica } from "./PanelTripulante";
import { COLOR_GRAVEDAD, marcarFaltante, ORDEN_GRAVEDAD, POSES, poseFalta, PROPORCION, srcPose, ZONA_DE, ZONAS } from "@/lib/cuerpo";

const ALTO_T = 200;
const MARGEN_EXT = 32;
const ANCHO_MAX = 420;
const ALTO_OK = 34;
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

function colocar(items, H, alto) {
  const orden = [...items].sort((a, b) => a.py - b.py);
  const centros = [H * 0.27, H * 0.73];
  const limitar = (c) => Math.max(8, Math.min(H - 8 - alto, c - alto / 2));
  if (orden.length === 1) orden[0].y = limitar(orden[0].py < H / 2 ? centros[0] : centros[1]);
  else orden.forEach((it, i) => { it.y = limitar(centros[Math.min(i, 1)]); });
  return orden;
}

export default function Cuerpo({ analisis, lista, onTarjeta = null, extraDe = null, todas = null, onVer, debug = false, conTarjetas = true, brillo = null, resaltado = null, masHref = null }) {
  const completas = todas || lista;
  const caja = useRef(null);
  const { W, H } = useTam(caja);
  const estado = estadoPersonaje(analisis);
  const capas = usePose(estado);
  const [saliendo, setSaliendo] = useState([]);
  const ultimas = useRef({});

  let fh = Math.max(0, H * 0.94);
  let fw = fh * PROPORCION;
  const anchoCentro = conTarjetas ? W * 0.4 : W * 0.9;
  if (fw > anchoCentro) {
    fw = anchoCentro;
    fh = fw / PROPORCION;
  }
  const fx = (W - fw) / 2;
  const fy = (H - fh) / 2;
  const punto = (z) => ({ px: fx + (ZONAS[z].x / 100) * fw, py: fy + (ZONAS[z].y / 100) * fh });
  const columna = W * 0.3;
  const cw = Math.round(Math.max(200, Math.min(ANCHO_MAX, columna - MARGEN_EXT - 16)));
  const xIzq = MARGEN_EXT;
  const xDer = W - MARGEN_EXT - cw;

  const visibles = lista.slice(0, MAX_TARJETAS);
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

  const enFiltro = new Set(lista.map((v) => v.k));
  const zonasActivas = {};
  for (const v of completas) {
    const z = ZONA_DE[v.k];
    const actual = zonasActivas[z];
    const mejor = !actual || (enFiltro.has(v.k) && !enFiltro.has(actual.k)) || (enFiltro.has(v.k) === enFiltro.has(actual.k) && ORDEN_GRAVEDAD[v.nivel] < ORDEN_GRAVEDAD[actual.nivel]);
    if (mejor) zonasActivas[z] = v;
  }
  const zonaResaltada = resaltado ? ZONA_DE[resaltado] : null;
  const todoBien = completas.length === 0 && poseFalta(POSES.estable);
  const mano = punto("manoDer");
  const colorDe = (nivel) => COLOR_GRAVEDAD[nivel] || COLOR_GRAVEDAD.ok;
  const xDe = (b) => (b.lado === "izq" ? xIzq : xDer);
  const finLinea = (b) => (b.lado === "izq" ? xIzq + cw : xDer);
  const fantasmas = saliendo.filter((s) => !actuales.has(`${s.k}-${s.nivel}`));
  const auraRad = completas.some((v) => v.k === "radiacion");

  return (
    <div ref={caja} className="cuerpo relative h-full w-full" data-estado={estado} data-aura={auraRad ? "radiacion" : undefined}
      data-brillo={brillo ? "" : undefined} data-brillo-pulsa={brillo?.pulsa ? "" : undefined} style={brillo ? { "--brillo": brillo.color } : undefined}>
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
            const visible = enFiltro.has(v.k);
            const grande = zonaResaltada === z;
            return (
              <button key={z} onClick={() => onVer(v.k)} aria-label={`${v.t.nombre}: ver análisis`} className="cuerpo-punto absolute" tabIndex={visible ? 0 : -1} aria-hidden={!visible}
                style={{ left: p.px - 7, top: p.py - 7, color: colorDe(v.nivel), opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none", transform: `scale(${grande ? 1.7 : 1})`, transition: "opacity .35s ease, transform .25s ease, color .4s ease" }}
                data-zona={z} data-gravedad={v.nivel} data-visible={visible ? "si" : "no"} data-resaltado={grande ? "si" : undefined}>
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
              style={{ left: xDe(b), top: b.y, width: cw, height: ALTO_T, transition: "top .35s ease, left .35s ease, outline-color .2s ease", borderRadius: 23, outline: resaltado === b.k ? `3px solid ${colorDe(b.nivel)}` : "3px solid transparent", outlineOffset: 3 }}
              data-tarjeta={b.k} data-nivel={b.nivel} data-resaltado={resaltado === b.k ? "si" : undefined}>
              <Metrica t={b.t} analisis={analisis} onClick={() => (onTarjeta || onVer)(b.k)} extra={b.sale ? null : extraDe?.(b.k)} className="h-full w-full" acento={colorDe(b.nivel)} grande cyber />
            </div>
          ))}
          {masHref && conTarjetas && lista.length > MAX_TARJETAS && (
            <Link href={masHref} className="glass burbuja-entra absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full px-3 py-1.5 text-xs font-semibold text-soft hover:text-fg" data-burbuja="mas">
              +{lista.length - MAX_TARJETAS}
            </Link>
          )}
          {todoBien && (
            <div role="status" data-burbuja="ok" className={`burbuja glass burbuja-entra absolute z-10 flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-xs font-semibold text-ok`}
              style={{ left: Math.min(W - 160, mano.px + 46), top: mano.py - 34, height: ALTO_OK, borderColor: "color-mix(in oklab, var(--color-ok) 45%, transparent)" }}>
              <span aria-hidden>👍</span> Todo en orden
            </div>
          )}
        </>
      )}
    </div>
  );
}
