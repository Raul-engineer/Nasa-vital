export const LEMA = "Another successful procedure";

export function LogoIcono({ size = 40, className = "" }) {
  return (
    <span className={`relative inline-block shrink-0 ${className}`} style={{ width: size, height: size }}>
      <img src="/logo-quickfix-icono.png" alt="" width={size} height={size} className="logo-claro h-full w-full object-contain" />
      <img src="/logo-quickfix-icono-oscuro.png" alt="" width={size} height={size} className="logo-oscuro h-full w-full object-contain" />
    </span>
  );
}

export function LogoCompleto({ alto = 72, className = "" }) {
  const ancho = Math.round((alto * 1053) / 298);
  return (
    <span className={`inline-block ${className}`} style={{ width: ancho, maxWidth: "100%" }} role="img" aria-label={`QuickFix · ${LEMA}`}>
      <img src="/logo-quickfix.png" alt="" width={ancho} height={alto} className="logo-claro h-auto w-full" />
      <img src="/logo-quickfix-oscuro.png" alt="" width={ancho} height={alto} className="logo-oscuro h-auto w-full" />
    </span>
  );
}

export function Marca({ size = 40, lema = true }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoIcono size={size} />
      <span className="leading-tight">
        <span className="block text-xl font-extrabold italic tracking-tight">
          QUICK<span className="text-accent">FIX</span>
        </span>
        {lema && <span className="block text-[10px] uppercase tracking-[0.14em] text-muted">{LEMA}</span>}
      </span>
    </span>
  );
}
