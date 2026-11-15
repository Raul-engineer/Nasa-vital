"use client";
import { useEffect, useState } from "react";
import { aplicarIdioma, guardarIdioma, idiomaGuardado } from "@/lib/i18n/traductor";

export function useIdioma() {
  const [l, setL] = useState(null);
  useEffect(() => {
    setL(idiomaGuardado());
    const f = (e) => setL(e.detail);
    window.addEventListener("quickfix-idioma", f);
    return () => window.removeEventListener("quickfix-idioma", f);
  }, []);
  return l;
}

export function Traductor() {
  useEffect(() => {
    aplicarIdioma(idiomaGuardado());
    const f = (e) => e.key === "quickfix_idioma" && aplicarIdioma(e.newValue || "en");
    window.addEventListener("storage", f);
    return () => window.removeEventListener("storage", f);
  }, []);
  return null;
}

export function BotonIdioma({ flotante = false, className = "" }) {
  const l = useIdioma();
  const opcion = (v, txt, nombre) => (
    <button type="button" role="radio" aria-checked={l === v} onClick={() => l !== v && guardarIdioma(v)} title={nombre} lang={v}
      className={`h-8 min-w-[38px] rounded-full px-2.5 text-[12px] font-bold tracking-[0.08em] transition ${l === v ? "bg-[linear-gradient(135deg,#22d3ee,#8b7bff)] text-[#0b0820] shadow-[0_0_14px_#8b7bff66]" : "text-soft hover:text-fg"}`}>
      {txt}
    </button>
  );
  return (
    <div role="radiogroup" aria-label={l === "en" ? "Language" : "Idioma"} data-no-traducir data-boton-idioma={flotante ? "flotante" : "header"}
      className={`flex shrink-0 items-center gap-0.5 rounded-full border border-white/10 bg-white/[0.06] p-1 backdrop-blur-md ${flotante ? "idioma-flotante fixed bottom-4 left-4 z-[80] shadow-[0_6px_24px_rgba(0,0,0,0.45)]" : ""} ${className}`}>
      {opcion("es", "ES", "Español")}
      {opcion("en", "EN", "English")}
    </div>
  );
}
