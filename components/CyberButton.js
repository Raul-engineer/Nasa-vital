"use client";
import Link from "next/link";

export default function CyberButton({ href, onClick, children, texto, atajo, activo = false, tam, className = "", type = "button", disabled, target, ...resto }) {
  const etiqueta = texto ?? (typeof children === "string" ? children : "");
  const clases = `cyber-btn ${tam === "sm" ? "cyber-btn-sm" : tam === "lg" ? "cyber-btn-lg" : ""} ${activo ? "active" : ""} ${className}`;
  const contenido = (
    <>
      <span className="cyber-backdrop" aria-hidden><span className="cyber-corner" /></span>
      {atajo != null && <span className="cyber-key" aria-hidden>{atajo}</span>}
      <span className="cyber-label">{children}</span>
      {etiqueta && <span className="cyber-glitch" aria-hidden>{etiqueta}</span>}
    </>
  );
  if (href)
    return (
      <Link href={href} onClick={onClick} className={clases} aria-current={activo ? "page" : undefined} aria-keyshortcuts={atajo != null ? String(atajo) : undefined} target={target} {...resto}>
        {contenido}
      </Link>
    );
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={clases} aria-pressed={resto["aria-pressed"]} {...resto}>
      {contenido}
    </button>
  );
}
