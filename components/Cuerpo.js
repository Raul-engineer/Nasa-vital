"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { ESTADO } from "./Shell";
import { estadoPersonaje } from "./Personaje";
import { ESTADO_DE_NIVEL, marcarFaltante, POSES, poseFalta, PRIORIDAD_NIVEL, PROPORCION, srcPose, textoBurbuja, ZONA_DE, ZONAS } from "@/lib/cuerpo";

const ORDEN_K = ["fc", "pa", "fr", "spo2", "temp", "conciencia", "radiacion", "vision", "huesos", "cabina", "sueno", "animo"];
const ALTO_B = 34;
const SEP = 8;
const RECIENTE_MS = 20000;

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

function useAlertas(analisis) {
  const prev = useRef({});
  const cambio = useRef({});
  const niveles = {};
  for (const t of analisis.tarjetas) niveles[t.k] = analisis.interpretaciones?.[t.k]?.nivel || "ok";
  const ahora = Date.now();
  for (const k of Object.keys(niveles)) if (prev.current[k] !== niveles[k]) cambio.current[k] = prev.current[k] === undefined ? 0 : ahora;
  useEffect(() => {
    prev.current = niveles;
  });
  const porK = Object.fromEntries(analisis.tarjetas.map((t) => [t.k, t]));
  const reciente = (k) => (cambio.current[k] && ahora - cambio.current[k] < RECIENTE_MS ? 1 : 0);
  const lista = Object.keys(niveles)
    .filter((k) => niveles[k] in PRIORIDAD_NIVEL)
    .sort((a, b) => PRIORIDAD_NIVEL[niveles[a]] - PRIORIDAD_NIVEL[niveles[b]] || reciente(b) - reciente(a) || ORDEN_K.indexOf(a) - ORDEN_K.indexOf(b))
    .map((k) => ({ k, nivel: niveles[k], t: porK[k] }));
  return { lista, niveles, porK };
}

function colocar(items, H) {
  const orden = [...items].sort((a, b) => a.py - b.py);
  let y = 8;
  for (const it of orden) {
    it.y = Math.max(it.py - ALTO_B / 2, y);
    y = it.y + ALTO_B + SEP;
  }
  const exceso = y - SEP - (H - 8);
  if (exceso > 0) {
    let lim = H - 8;
    for (let i = orden.length - 1; i >= 0; i--) {
      orden[i].y = Math.min(orden[i].y, lim - ALTO_B);
      lim = orden[i].y - SEP;
    }
  }
  return orden;
}

export default function Cuerpo({ analisis, onVer, maxBurbujas = 3, debug = false, hrefMas = "/analisis" }) {
  const caja = useRef(null);
  const { W, H } = useTam(caja);
  const estado = estadoPersonaje(analisis);
  const capas = usePose(estado);
  const { lista } = useAlertas(analisis);
  const [saliendo, setSaliendo] = useState([]);
  const ultimas = useRef({});

  const pad = 10;
  let fh = Math.max(0, H - pad * 2);
  let fw = fh * PROPORCION;
  if (fw > W * 0.9) {
    fw = W * 0.9;
    fh = fw / PROPORCION;
  }
  const fx = (W - fw) / 2;
  const fy = (H - fh) / 2;
  const punto = (z) => ({ px: fx + (ZONAS[z].x / 100) * fw, py: fy + (ZONAS[z].y / 100) * fh });
  const bw = Math.round(Math.max(128, Math.min(196, W * 0.36)));

  const visibles = lista.slice(0, maxBurbujas);
  const resto = lista.length - visibles.length;
  const izq = [];
  const der = [];
  for (const v of visibles) {
    const z = ZONA_DE[v.k];
    const p = punto(z);
    const x = ZONAS[z].x;
    const lado = x < 50 ? "izq" : x > 50 ? "der" : izq.length <= der.length ? "izq" : "der";
    (lado === "izq" ? izq : der).push({ ...v, ...p, lado, ...textoBurbuja(v.t, analisis, v.nivel) });
  }
  const todoBien = lista.length === 0 && poseFalta(POSES.estable);
  if (todoBien) der.push({ k: "ok", nivel: "ok", ...punto("manoDer"), lado: "der", icono: "👍", texto: "Todo en orden" });
  const colocadas = W ? [...colocar(izq, H), ...colocar(der, H)] : [];
  const actuales = new Set(colocadas.map((b) => `${b.k}-${b.nivel}`));

  useEffect(() => {
    const nuevas = {};
    for (const b of colocadas) nuevas[`${b.k}-${b.nivel}`] = b;
    const fuera = Object.keys(ultimas.current).filter((id) => !(id in nuevas)).map((id) => ultimas.current[id]);
    ultimas.current = nuevas;
    if (!fuera.length) return;
    setSaliendo((s) => [...s.filter((x) => !nuevas[`${x.k}-${x.nivel}`]), ...fuera]);
    const t = setTimeout(() => setSaliendo((s) => s.filter((x) => !fuera.includes(x))), 320);
    return () => clearTimeout(t);
  }, [colocadas.map((b) => `${b.k}-${b.nivel}`).join("|")]);

  const zonasActivas = {};
  for (const v of lista) {
    const z = ZONA_DE[v.k];
    if (!zonasActivas[z] || PRIORIDAD_NIVEL[v.nivel] < PRIORIDAD_NIVEL[zonasActivas[z].nivel]) zonasActivas[z] = v;
  }

  const bx = (b) => (b.lado === "izq" ? 8 : W - 8 - bw);
  const finLinea = (b) => (b.lado === "izq" ? 8 + bw : W - 8 - bw);
  const colorDe = (nivel) => ESTADO[ESTADO_DE_NIVEL[nivel]]?.hex || ESTADO.normal.hex;
  const claseDe = (nivel) => ESTADO[ESTADO_DE_NIVEL[nivel]]?.color || ESTADO.normal.color;
  const lineas = [...colocadas, ...saliendo.filter((s) => !actuales.has(`${s.k}-${s.nivel}`))];

  return (
    <div ref={caja} className="cuerpo relative h-full w-full" data-estado={estado}>
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
          <svg className="pointer-events-none absolute inset-0" width={W} height={H} aria-hidden>
            {lineas.map((b) => (
              <line key={`l-${b.k}-${b.nivel}`} x1={b.px} y1={b.py} x2={finLinea(b)} y2={b.y + ALTO_B / 2} stroke={colorDe(b.nivel)} strokeOpacity={actuales.has(`${b.k}-${b.nivel}`) ? 0.55 : 0} strokeWidth="1" className="transition-[stroke-opacity] duration-300" />
            ))}
          </svg>
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
          {debug && Object.entries(ZONAS).map(([z]) => {
            const p = punto(z);
            return (
              <span key={`d-${z}`} className="pointer-events-none absolute z-20 flex items-center gap-1 text-[10px] font-semibold text-cyan" style={{ left: p.px - 4, top: p.py - 4 }} data-debug-zona={z}>
                <span className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_6px_var(--color-cyan)]" />
                <span className="rounded bg-black/70 px-1">{z}</span>
              </span>
            );
          })}
          {[...colocadas.map((b) => ({ ...b, sale: false })), ...saliendo.filter((s) => !actuales.has(`${s.k}-${s.nivel}`)).map((b) => ({ ...b, sale: true }))].map((b) => {
            const contenido = (
              <>
                <span aria-hidden className="shrink-0">{b.icono}</span>
                <span className="truncate">{b.texto}</span>
              </>
            );
            const clase = `burbuja glass absolute z-10 flex items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-full px-3 text-xs font-semibold ${claseDe(b.nivel)} ${b.sale ? "burbuja-sale pointer-events-none" : "burbuja-entra"}`;
            const estilo = { left: bx(b), top: b.y, width: bw, height: ALTO_B, borderColor: `color-mix(in oklab, ${colorDe(b.nivel)} 45%, transparent)` };
            return b.k === "ok" ? (
              <div key={`b-ok`} className={clase} style={estilo} role="status" data-burbuja="ok">{contenido}</div>
            ) : (
              <button key={`b-${b.k}-${b.nivel}`} onClick={() => onVer(b.k)} className={clase} style={estilo} data-burbuja={b.k} data-nivel={b.nivel} aria-label={`${b.texto}. Ver análisis`}>{contenido}</button>
            );
          })}
          {resto > 0 && (
            <Link href={hrefMas} className="glass burbuja-entra absolute bottom-2 right-2 z-10 rounded-full px-2.5 py-1 text-xs font-semibold text-soft hover:text-fg" data-burbuja="mas">
              +{resto}
            </Link>
          )}
        </>
      )}
    </div>
  );
}
