"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const LLAVE = "quickfix_fondo";

export const FONDOS = [
  { n: 1, id: "carina_nebula", pos: "50% 50%" },
  { n: 2, id: "GSFC_20171208_Archive_e000097", pos: "50% 45%" },
  { n: 3, id: "GSFC_20171208_Archive_e000833", pos: "50% 50%" },
  { n: 4, id: "PIA04921", pos: "50% 50%" },
  { n: 5, id: "PIA14934", pos: "50% 50%" },
  { n: 6, id: "PIA17172", pos: "50% 50%" },
  { n: 7, id: "PIA25013", pos: "50% 50%" },
];

function elegir(previo) {
  const opciones = FONDOS.map((_, i) => i).filter((i) => i !== previo);
  return opciones[Math.floor(Math.random() * opciones.length)];
}

function leerPrevio() {
  try {
    const v = Number(sessionStorage.getItem(LLAVE));
    return Number.isInteger(v) && FONDOS[v] ? v : -1;
  } catch {
    return -1;
  }
}

function guardar(i) {
  try {
    sessionStorage.setItem(LLAVE, String(i));
  } catch {}
}

export default function FondoApp() {
  const ruta = usePathname();
  const [capas, setCapas] = useState([]);
  const actual = useRef(-1);

  useEffect(() => {
    const previo = actual.current >= 0 ? actual.current : leerPrevio();
    const cambiar = ruta === "/" || ruta?.startsWith("/acceso") || previo < 0;
    if (!cambiar && actual.current === previo) return;
    const i = cambiar ? elegir(previo) : previo;
    actual.current = i;
    guardar(i);
    const img = new Image();
    const mostrar = () => {
      if (actual.current !== i) return;
      setCapas((c) => [...c.filter((x) => x.i !== i).map((x) => ({ ...x, visible: false })), { i, visible: false }]);
      requestAnimationFrame(() => requestAnimationFrame(() => actual.current === i && setCapas((c) => c.map((x) => (x.i === i ? { ...x, visible: true } : x)))));
      setTimeout(() => actual.current === i && setCapas((c) => c.filter((x) => x.i === i)), 1600);
    };
    img.onload = mostrar;
    img.onerror = mostrar;
    img.src = `/fondos/espacio-${FONDOS[i].n}${window.innerWidth < 900 ? "-movil" : ""}.webp`;
  }, [ruta]);

  return (
    <div className="fondo-app" aria-hidden>
      {capas.map(({ i, visible }) => {
        const F = FONDOS[i];
        return (
          <picture key={i} className={`fondo-app-foto ${visible ? "visible" : ""}`} style={{ "--pos": F.pos }}>
            <source media="(max-width: 899px)" srcSet={`/fondos/espacio-${F.n}-movil.webp`} />
            <img src={`/fondos/espacio-${F.n}.webp`} alt="" decoding="async" />
          </picture>
        );
      })}
      <div className="fondo-app-velo" />
    </div>
  );
}
