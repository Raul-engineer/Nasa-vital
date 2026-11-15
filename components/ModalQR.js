"use client";
import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import CyberButton from "./CyberButton";

export function origenSitio() {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/+$/, "");
  return typeof window !== "undefined" ? window.location.origin : "";
}

export default function ModalQR({ abierto, onCerrar, astronautId }) {
  const [copiado, setCopiado] = useState(false);
  const [origen, setOrigen] = useState("");
  const cerrarRef = useRef(null);
  useEffect(() => {
    if (!abierto) return;
    setOrigen(origenSitio());
    setCopiado(false);
    cerrarRef.current?.focus();
    const f = (e) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [abierto, onCerrar]);
  if (!abierto) return null;
  const link = `${origen}/control?a=${astronautId || 1}`;
  let local = false;
  try {
    local = /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(new URL(origen).hostname);
  } catch {}
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {}
  };
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#09090cc7] p-4" onClick={(e) => e.target === e.currentTarget && onCerrar()} role="dialog" aria-modal="true" aria-labelledby="titulo-qr">
      <div className="glass w-full max-w-[420px] p-6 text-center">
        <button ref={cerrarRef} onClick={onCerrar} aria-label="Cerrar" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-xl text-muted hover:bg-white/10 hover:text-fg">×</button>
        <h2 id="titulo-qr" className="px-6 text-[22px] font-semibold leading-tight">Controla los datos desde tu celular</h2>
        <div className="mx-auto mt-5 w-fit rounded-2xl bg-white p-4 shadow-[0_0_40px_rgba(255,151,93,0.25)]" data-qr={link}>
          <QRCodeSVG value={link} size={232} level="M" marginSize={0} bgColor="#ffffff" fgColor="#100f13" title={`QR para ${link}`} />
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] p-1.5 pl-3">
          <span className="min-w-0 flex-1 truncate text-left text-sm text-soft" title={link}>{link}</span>
          <CyberButton onClick={copiar} tam="sm" texto={copiado ? "Copiado" : "Copiar"}>{copiado ? "✓ Copiado" : "Copiar"}</CyberButton>
        </div>
        <div className="mt-3 text-xs text-muted">Ábrelo con la cámara del celular</div>
        {local && (
          <div role="note" className="mt-3 rounded-xl border border-warn/50 bg-warn/10 px-3 py-2 text-xs text-warn">
            Este QR solo funciona en esta computadora. Usa el link de Vercel para el celular.
          </div>
        )}
      </div>
    </div>
  );
}
