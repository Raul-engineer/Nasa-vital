"use client";
import "./cyber-medic.css";
import "./cyber-estilo.css";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BotonDatos({ href, texto = "View all my data", detalle, tecla = "d" }) {
  const router = useRouter();

  useEffect(() => {
    const alPresionar = (e) => {
      if (e.key.toLowerCase() !== tecla || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.repeat) return;
      if (e.target?.closest?.("input,textarea,select,[contenteditable='true']")) return;
      if (document.querySelector(".cm-modal:popover-open, [data-ficha]")) return;
      e.preventDefault();
      router.push(href);
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [href, tecla, router]);

  return (
    <Link href={href} className="boton-datos" aria-keyshortcuts={tecla.toUpperCase()} data-boton="datos">
      <span className="cm-backdrop" aria-hidden><span className="cm-corner" /></span>
      <kbd aria-hidden>{tecla.toUpperCase()}</kbd>
      <span className="bd-texto">
        <span className="bd-titulo">{texto}</span>
        {detalle && <span className="bd-detalle">{detalle}</span>}
      </span>
      <svg className="bd-flecha" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
      <span className="bd-glitch" aria-hidden>{texto}</span>
    </Link>
  );
}
