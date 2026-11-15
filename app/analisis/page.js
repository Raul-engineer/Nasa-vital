"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EncabezadoPagina, ESTADO, Shell } from "@/components/Shell";
import CyberButton from "@/components/CyberButton";
import BotonPestana from "@/components/BotonPestana";
import { TablaResumen } from "@/components/analisis/Resumen";
import { VistaVariable } from "@/components/analisis/Variable";
import { ChipEstado } from "@/components/analisis/comun";
import { ChipMetrica, Contador } from "@/components/analisis/Pestanas";
import { Registro } from "@/components/analisis/Registro";
import Ficha from "@/components/Ficha";
import { CLAVES_FICHA } from "@/lib/fichas";
import { useAstronautId, useQuickFix } from "@/lib/useQuickFix";
import { VARIABLES } from "@/lib/analysis";
import { ESTADO_DE_NIVEL, nivelAlerta, PRIORIDAD_NIVEL } from "@/lib/cuerpo";

const ESTADO_TXT = { normal: "Bien", atencion: "Precaución", critico: "Actúa ahora" };
const CATEGORIAS = {
  vitales: { nombre: "Signos vitales", claves: ["fc", "pa", "fr", "temp", "spo2", "conciencia"] },
  espacio: { nombre: "Salud en el espacio", claves: ["radiacion", "vision", "huesos", "cabina"] },
  mente: { nombre: "Mente y bienestar", claves: ["sueno", "animo"] },
};
const PESTANAS = ["alertas", "vitales", "espacio", "mente", "completo", "registro"];
const ORDEN = [...CATEGORIAS.vitales.claves, ...CATEGORIAS.espacio.claves, ...CATEGORIAS.mente.claves];
const CORTO = { fc: "FC", pa: "Presión", fr: "FR", temp: "Temperatura", spo2: "SpO₂", conciencia: "Conciencia", radiacion: "Radiación", vision: "Visión", huesos: "Huesos", cabina: "Cabina", sueno: "Sueño", animo: "Ánimo" };
const UNIDAD = { fc: "lpm", pa: "", fr: "rpm", temp: "°C", spo2: "%", conciencia: "", radiacion: "µSv/h", vision: "", huesos: "%", cabina: "ppm", sueno: "h", animo: "/100" };

const categoriaDe = (k) => Object.keys(CATEGORIAS).find((c) => CATEGORIAS[c].claves.includes(k)) || "vitales";

function alertasDe(analisis) {
  const porK = Object.fromEntries(analisis.tarjetas.map((t) => [t.k, t]));
  const niveles = Object.fromEntries(ORDEN.map((k) => [k, porK[k] ? nivelAlerta(porK[k], analisis) : "ok"]));
  const lista = ORDEN.filter((k) => niveles[k] in PRIORIDAD_NIVEL).sort((a, b) => PRIORIDAD_NIVEL[niveles[a]] - PRIORIDAD_NIVEL[niveles[b]] || ORDEN.indexOf(a) - ORDEN.indexOf(b));
  return { porK, niveles, lista };
}

const peorNivel = (ks, niveles) => ks.map((k) => niveles[k]).filter((n) => n in PRIORIDAD_NIVEL).sort((a, b) => PRIORIDAD_NIVEL[a] - PRIORIDAD_NIVEL[b])[0] || null;

function Chip({ t, nivel, activo, onClick }) {
  const E = ESTADO[ESTADO_DE_NIVEL[nivel] || "normal"];
  return <ChipMetrica id={t.k} nivel={nivel} etiqueta={CORTO[t.k]} valor={t.texto} unidad={UNIDAD[t.k]} colorPunto={E.hex} colorBorde={nivel !== "ok" ? E.hex : null} activo={activo} onClick={onClick} />;
}

export default function Analisis() {
  const router = useRouter();
  const [aid, setAid] = useAstronautId();
  const { data, analisis, loading, error } = useQuickFix(aid);
  const [tab, setTab] = useState(null);
  const [vari, setVari] = useState(null);
  const [ficha, setFicha] = useState(null);
  const inicial = useRef(null);
  const prevAlertas = useRef(null);
  const [pulso, setPulso] = useState(0);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    inicial.current = { tab: p.get("tab"), var: p.get("var"), a: p.get("a") };
    if (CLAVES_FICHA.includes(p.get("ficha"))) setFicha(p.get("ficha"));
  }, []);

  const info = analisis ? alertasDe(analisis) : null;
  const firmaAlertas = info ? info.lista.join(",") : "";

  useEffect(() => {
    if (!info || tab || !inicial.current) return;
    const i = inicial.current;
    if (i.a && Number(i.a) !== data?.astronaut?.id) return;
    const v = i.var && VARIABLES[i.var] ? i.var : null;
    let t = PESTANAS.includes(i.tab) ? i.tab : null;
    if (!t) t = v ? (info.lista.includes(v) ? "alertas" : categoriaDe(v)) : info.lista.length ? "alertas" : "vitales";
    setTab(t);
    setVari(v);
  }, [info, tab]);

  useEffect(() => {
    if (!info) return;
    const n = info.lista.length;
    if (prevAlertas.current !== null && n > prevAlertas.current) setPulso((p) => p + 1);
    prevAlertas.current = n;
  }, [firmaAlertas]);

  const visibles = !info || !tab || tab === "completo" || tab === "registro" ? [] : tab === "alertas" ? info.lista : CATEGORIAS[tab].claves;
  const seleccion = visibles.includes(vari) ? vari : visibles[0] || null;

  useEffect(() => {
    if (!tab) return;
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    if (seleccion) url.searchParams.set("var", seleccion);
    else url.searchParams.delete("var");
    ["s", "al", "m"].forEach((x) => url.searchParams.delete(x));
    if (ficha) url.searchParams.set("ficha", ficha);
    else url.searchParams.delete("ficha");
    const nueva = `${url.pathname}?${url.searchParams.toString()}`;
    if (nueva !== `${window.location.pathname}${window.location.search}`) router.replace(nueva, { scroll: false });
  }, [tab, seleccion, ficha, router]);

  if (error) return <div className="p-10 text-crit">No se pudieron cargar los datos: {error}</div>;
  if (loading || !analisis || !tab) return <div className="flex min-h-screen items-center justify-center text-muted">Cargando análisis…</div>;

  const { astronaut, astronauts } = data;
  const { porK, niveles, lista } = info;
  const fuera = analisis.tarjetas.filter((t) => t.estado === "atencion" || t.estado === "critico").length;
  const cambiarTab = (t) => {
    setTab(t);
    setVari(null);
  };
  const elegir = (k) => {
    setVari(k);
    if (tab === "alertas") setFicha(k);
  };
  const abrirDesdeTabla = (k) => {
    setTab(categoriaDe(k));
    setVari(k);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const nivelAlertas = peorNivel(lista, niveles);

  return (
    <Shell active="/analisis" astronaut={astronaut} astronauts={astronauts} onAstronaut={(id) => { setAid(id); setVari(null); }} astronautId={aid} analisis={analisis} onAbrirFicha={setFicha}>
      <EncabezadoPagina titulo="Análisis" sub={`${12 - fuera} de 12 signos en rango`} derecha={<ChipEstado estado={analisis.general}>{ESTADO_TXT[analisis.general]}</ChipEstado>} />

      <nav aria-label="Pestañas de análisis" className="no-scrollbar -mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1 pb-1 min-[900px]:flex-wrap" role="tablist">
        {PESTANAS.map((p) => {
          const nombre = p === "alertas" ? "⚠ Alertas" : p === "completo" ? "Completo" : p === "registro" ? "Registro" : CATEGORIAS[p].nombre;
          const nCat = p in CATEGORIAS ? CATEGORIAS[p].claves.filter((k) => lista.includes(k)) : [];
          return (
            <BotonPestana key={p} onClick={() => cambiarTab(p)} activo={tab === p} role="tab" aria-selected={tab === p} data-tab={p} className="shrink-0">
              {nombre}
              {p === "alertas" && <> · <Contador n={lista.length || "0"} nivel={nivelAlertas || "ok"} pulso={pulso} grande /></>}
              {p === "completo" && " · 12"}
              {p in CATEGORIAS && <Contador n={nCat.length} nivel={peorNivel(nCat, niveles)} />}
            </BotonPestana>
          );
        })}
      </nav>

      {tab === "registro" ? (
        <Registro aid={astronaut.id} nombre={astronaut.nombre} />
      ) : tab === "completo" ? (
        <TablaResumen analisis={analisis} onVer={abrirDesdeTabla} />
      ) : tab === "alertas" && lista.length === 0 ? (
        <section className="glass flex flex-col items-center gap-4 px-6 py-10 text-center" data-todo-estable style={{ borderColor: "color-mix(in oklab, var(--color-ok) 45%, transparent)" }}>
          <span className="grid h-14 w-14 place-items-center rounded-full border-2 border-ok/60 bg-ok/10 text-2xl text-ok">✓</span>
          <div className="font-display text-xl font-semibold text-ok">Todo estable · tus 12 signos están en rango</div>
          <CyberButton onClick={() => cambiarTab("completo")} texto="Ver análisis completo">Ver análisis completo</CyberButton>
        </section>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Signos">
            {visibles.map((k) => porK[k] && <Chip key={k} t={porK[k]} nivel={niveles[k]} activo={k === seleccion} onClick={() => elegir(k)} />)}
          </div>
          {seleccion && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <span className="text-sm text-soft">¿Por qué pasó y qué hago?</span>
              <CyberButton onClick={() => setFicha(seleccion)} tam="sm" texto="Abrir ficha" data-abrir-ficha={seleccion}>Abrir ficha</CyberButton>
            </div>
          )}
          {seleccion && <VistaVariable key={`${aid}-${seleccion}`} k={seleccion} analisis={analisis} data={data} aid={aid} />}
        </>
      )}
      {ficha && <Ficha clave={ficha} astronautId={aid} data={data} analisis={analisis} onClose={() => setFicha(null)} onAbrir={setFicha} />}
    </Shell>
  );
}
