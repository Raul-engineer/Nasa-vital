"use client";
import "./cyber-medic.css";
import { useEffect, useId, useImperativeHandle, useRef } from "react";
import { Fuente } from "@/components/Widgets";
import { leerPrefs } from "@/lib/cuentas";

const SONIDOS = {
  slide: "https://cdn.freesound.org/previews/367/367997_6512973-lq.mp3",
  accept: "https://cdn.freesound.org/previews/220/220166_4100837-lq.mp3",
  reject: "https://cdn.freesound.org/previews/657/657950_6142149-lq.mp3",
};

const audios = {};
let ctxAudio = null;

function sintetizar(n) {
  try {
    ctxAudio = ctxAudio || new (window.AudioContext || window.webkitAudioContext)();
    const ahora = ctxAudio.currentTime;
    const notas = n === "slide" ? [[420, 900, 0, 0.12]] : n === "accept" ? [[660, 660, 0, 0.08], [990, 990, 0.09, 0.12]] : [[380, 190, 0, 0.18]];
    for (const [f0, f1, ini, dur] of notas) {
      const o = ctxAudio.createOscillator();
      const g = ctxAudio.createGain();
      o.type = n === "reject" ? "sawtooth" : "square";
      o.frequency.setValueAtTime(f0, ahora + ini);
      o.frequency.exponentialRampToValueAtTime(f1, ahora + ini + dur);
      g.gain.setValueAtTime(0.0001, ahora + ini);
      g.gain.exponentialRampToValueAtTime(0.06, ahora + ini + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ahora + ini + dur);
      o.connect(g).connect(ctxAudio.destination);
      o.start(ahora + ini);
      o.stop(ahora + ini + dur + 0.02);
    }
  } catch {}
}

function sonar(n) {
  if (!leerPrefs().sonido) return;
  try {
    const a = (audios[n] = audios[n] || new Audio(SONIDOS[n]));
    a.currentTime = 0;
    const p = a.play();
    if (p) p.catch(() => sintetizar(n));
  } catch {
    sintetizar(n);
  }
}

const finitas = (el, sub) => el.getAnimations({ subtree: sub }).filter((a) => a.effect?.getComputedTiming?.().iterations !== Infinity);
const terminar = (el, sub) => Promise.allSettled(finitas(el, sub).map((a) => a.finished));

function Esquina() {
  return (
    <span className="cm-backdrop">
      <span className="cm-corner" />
    </span>
  );
}

function Texto({ titulo, parrafos, detalle, copia = false }) {
  return (
    <>
      <h2><span>{titulo}</span></h2>
      {detalle && <div className="cm-text" style={copia ? { visibility: "hidden" } : undefined}>{detalle}</div>}
      <div className="cm-text">
        {parrafos.map((p, i) => <p key={i}>{p}</p>)}
      </div>
    </>
  );
}

export default function CyberMedic({ ref, t, it, dia, onProceder, detalle, textoProceder = "View analysis", pregunta = "Do you want to see the full analysis?" }) {
  const id = `medic-${useId().replace(/:/g, "")}`;
  const modal = useRef(null);
  const glitch = useRef(null);
  const proceder = useRef(null);
  const accion = useRef(null);
  const reloj = useRef(null);
  const origen = useRef(null);
  const alProceder = useRef(onProceder);
  alProceder.current = onProceder;

  const abrir = () => {
    const m = modal.current;
    const tarjeta = m?.closest("[data-tarjeta]");
    if (!m || m.matches(":popover-open") || tarjeta?.dataset.cargando === "true") return;
    origen.current = document.activeElement;
    const mostrar = () => {
      try {
        m.showPopover();
      } catch {}
    };
    if (!tarjeta || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return mostrar();
    tarjeta.dataset.cargando = "true";
    requestAnimationFrame(async () => {
      await terminar(tarjeta, true);
      delete tarjeta.dataset.cargando;
      mostrar();
    });
  };

  useImperativeHandle(ref, () => ({ abrir }), []);

  useEffect(() => {
    const tecla = (e) => {
      if (e.key.toLowerCase() !== "m" || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.repeat) return;
      if (e.target?.closest?.("input,textarea,select,[contenteditable='true']")) return;
      if (document.querySelector(".cm-modal:popover-open")) return;
      const tarjeta = modal.current?.closest("[data-tarjeta]");
      if (!tarjeta?.matches(":hover, :focus-within")) return;
      e.preventDefault();
      abrir();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);

  useEffect(() => {
    const m = modal.current;
    if (!m) return;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let glitcheado = false;
    const arrancar = () => {
      if (quieto) return;
      reloj.current = setTimeout(() => {
        const g = glitch.current;
        if (!g) return;
        g.style.setProperty("animation-name", "cm-glitch");
        requestAnimationFrame(async () => {
          await terminar(g, false);
          glitcheado = true;
          g.style.removeProperty("animation-name");
          arrancar();
        });
      }, !glitcheado ? 1500 : Math.random() * 10000 + 2000);
    };
    const teclas = (e) => {
      if (e.key === "Escape") {
        accion.current = "Cancel";
        m.dataset.action = "Cancel";
      } else if (e.key === "Enter" && !m.querySelector(".cm-actions")?.matches(":focus-within")) {
        accion.current = "Proceed";
        m.dataset.action = "Proceed";
        m.hidePopover();
      }
    };
    const alternar = async (e) => {
      if (e.newState === "open") {
        setTimeout(() => sonar("slide"), 200);
        proceder.current?.focus();
        window.addEventListener("keydown", teclas);
        arrancar();
      } else {
        clearTimeout(reloj.current);
        const fue = accion.current;
        sonar(fue === "Proceed" ? "accept" : "reject");
        glitcheado = false;
        await terminar(m, true);
        window.removeEventListener("keydown", teclas);
        delete m.dataset.action;
        accion.current = null;
        if (fue === "Proceed") alProceder.current?.();
        else origen.current?.focus?.({ preventScroll: true });
      }
    };
    m.addEventListener("toggle", alternar);
    return () => {
      clearTimeout(reloj.current);
      m.removeEventListener("toggle", alternar);
      window.removeEventListener("keydown", teclas);
    };
  }, []);

  const cerrarCon = (a) => (e) => {
    e.stopPropagation();
    accion.current = a;
    modal.current.dataset.action = a;
    modal.current.hidePopover();
  };

  const titulo = t.nombre;
  const parrafos = [
    it?.conclusion ? `Medic: ${it.conclusion}` : null,
    it?.acciones?.length ? `What to do: ${it.acciones.slice(0, 2).join(" · ")}.` : null,
    pregunta,
  ].filter(Boolean);

  return (
    <div ref={modal} id={id} popover="auto" className="cm-modal" role="dialog" aria-label={titulo}>
      <section className="cm-body">
        <div className="cm-body-backdrop">
          <div className="cm-backdrop">
            <div className="cm-version">v{dia ?? "000"}.{t.k}</div>
            <div className="cm-corner" />
          </div>
        </div>
        <div className="cm-content">
          <Texto titulo={titulo} parrafos={parrafos} detalle={detalle} />
          {t.fuente && <Fuente corto ids={t.fuente} extra={t.k === "cabina" ? "demo thresholds" : null} className="cm-fuente" />}
          <div ref={glitch} className="cm-modal-glitch" aria-hidden>
            <Texto titulo={titulo} parrafos={parrafos} detalle={detalle} copia />
          </div>
        </div>
      </section>
      <div className="cm-actions">
        <button type="button" className="cm-btn" data-action="Cancel" onClick={cerrarCon("Cancel")}>
          <Esquina />
          <kbd>esc</kbd>
          <span>Close</span>
        </button>
        <button ref={proceder} type="button" className="cm-btn" data-action="Proceed" onClick={cerrarCon("Proceed")}>
          <Esquina />
          <kbd>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 4v7a4 4 0 0 1-4 4H4" />
              <path d="m9 10-5 5 5 5" />
            </svg>
          </kbd>
          <span>{textoProceder}</span>
        </button>
      </div>
    </div>
  );
}
