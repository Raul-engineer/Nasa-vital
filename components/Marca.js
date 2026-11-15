export const LEMA = "Another successful procedure";

export function LogoQuickFix({ alto = 48, className = "", titulo = "QuickFix" }) {
  const ancho = Math.round((alto * 300) / 190);
  return (
    <svg viewBox="0 0 300 190" width={ancho} height={alto} className={`logo-qf shrink-0 ${className}`} role="img" aria-label={titulo}>
      <defs>
        <radialGradient id="qf-planeta" cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#4d63ff" />
          <stop offset=".45" stopColor="#2034c4" />
          <stop offset="1" stopColor="#0b1470" />
        </radialGradient>
        <clipPath id="qf-atras"><rect x="0" y="0" width="300" height="128" /></clipPath>
        <clipPath id="qf-frente"><rect x="0" y="128" width="300" height="62" /></clipPath>
      </defs>
      <text x="150" y="74" textAnchor="middle" fill="#fff" fontFamily="var(--font-display), 'Space Grotesk', sans-serif" fontWeight="700" fontSize="70" letterSpacing="7">QUICK</text>
      <g transform="rotate(-14 118 128)">
        <ellipse cx="118" cy="128" rx="64" ry="15" fill="none" stroke="#f1d4f6" strokeWidth="6" clipPath="url(#qf-atras)" opacity=".85" />
      </g>
      <circle cx="118" cy="126" r="34" fill="url(#qf-planeta)" />
      <circle cx="108" cy="114" r="12" fill="#fff" opacity=".08" />
      <g transform="rotate(-14 118 128)">
        <ellipse cx="118" cy="128" rx="64" ry="15" fill="none" stroke="#f6e1fa" strokeWidth="6" clipPath="url(#qf-frente)" />
      </g>
      <text transform="translate(176 160) scale(0.8 1.22)" fill="#fff" fontFamily="var(--font-display), 'Space Grotesk', sans-serif" fontWeight="700" fontSize="62" letterSpacing="2">FIX</text>
    </svg>
  );
}

export function LogoIcono({ size = 40, className = "" }) {
  return (
    <svg viewBox="40 84 156 88" width={size} height={size} className={`shrink-0 ${className}`} aria-hidden>
      <defs>
        <radialGradient id="qf-icono" cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#4d63ff" />
          <stop offset=".45" stopColor="#2034c4" />
          <stop offset="1" stopColor="#0b1470" />
        </radialGradient>
        <clipPath id="qf-icono-atras"><rect x="0" y="0" width="300" height="128" /></clipPath>
        <clipPath id="qf-icono-frente"><rect x="0" y="128" width="300" height="62" /></clipPath>
      </defs>
      <g transform="rotate(-14 118 128)"><ellipse cx="118" cy="128" rx="64" ry="15" fill="none" stroke="#f1d4f6" strokeWidth="6" clipPath="url(#qf-icono-atras)" opacity=".85" /></g>
      <circle cx="118" cy="126" r="34" fill="url(#qf-icono)" />
      <g transform="rotate(-14 118 128)"><ellipse cx="118" cy="128" rx="64" ry="15" fill="none" stroke="#f6e1fa" strokeWidth="6" clipPath="url(#qf-icono-frente)" /></g>
    </svg>
  );
}

export function LogoCompleto({ alto = 72, className = "" }) {
  return (
    <span className={`inline-flex flex-col items-center ${className}`} role="img" aria-label={`QuickFix · ${LEMA}`}>
      <LogoQuickFix alto={Math.round(alto * 1.5)} titulo="" />
      <span className="mt-1 text-[11px] uppercase tracking-[0.22em] text-muted">{LEMA}</span>
    </span>
  );
}

export function Marca({ size = 40, lema = true }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoQuickFix alto={size} />
      {lema && <span className="block text-[10px] uppercase tracking-[0.14em] text-muted">{LEMA}</span>}
    </span>
  );
}
