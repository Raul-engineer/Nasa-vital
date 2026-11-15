export default function FondoCuerpo({ className = "" }) {
  return (
    <div className={`fondo-cuerpo pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] ${className}`} aria-hidden>
      <div className="fondo-cuerpo-tinte absolute inset-0" />
      <div className="fondo-cuerpo-vineta absolute inset-0" />
    </div>
  );
}
