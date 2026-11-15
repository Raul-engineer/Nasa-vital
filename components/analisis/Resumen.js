"use client";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icons";
import { ESTADO } from "@/components/Shell";
import { CATEGORIAS, GRUPOS } from "@/components/Personaje";
import { IconoEstado, horaMedicion, simboloEstado, tuNormal } from "./comun";

export function TablaResumen({ analisis, onVer }) {
  const [ahora, setAhora] = useState(null);
  useEffect(() => {
    setAhora(new Date());
    const t = setInterval(() => setAhora(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  const porK = Object.fromEntries(analisis.tarjetas.map((t) => [t.k, t]));
  return (
    <section className="card overflow-hidden" aria-label="Resumen de tus 12 signos">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="border-b border-line text-left">
              {["Signo", "Resultado", "Estado", "Tu normal", "Hora"].map((h, i) => (
                <th key={h} scope="col" className={`etiqueta px-4 py-3 font-semibold ${i === 2 ? "text-center" : ""} ${i === 4 ? "text-right" : ""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          {CATEGORIAS.map(([g, orden]) => (
            <tbody key={g}>
              <tr>
                <th colSpan={5} scope="colgroup" className="bg-ink/[0.03] px-4 pb-1.5 pt-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">{GRUPOS[g]}</th>
              </tr>
              {orden.map((k) => {
                const t = porK[k];
                if (!t) return null;
                const E = ESTADO[t.estado] || ESTADO.normal;
                const s = simboloEstado(t);
                return (
                  <tr key={k} tabIndex={0} role="link" aria-label={`${t.nombre}: ${t.texto} ${t.unidad}. ${s.palabra}. Ver análisis`}
                    onClick={() => onVer(k)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onVer(k))}
                    className="cursor-pointer border-b border-line/70 transition last:border-0 hover:bg-cyan/[0.06] focus:outline-none focus-visible:bg-cyan/[0.08]">
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-3">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink/5 ${t.estado === "normal" ? "text-cyan" : E.color}`}><Icon name={t.icono} size={20} /></span>
                        <span className="font-medium">{t.nombre}</span>
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <span className={`num text-2xl font-semibold ${t.estado !== "normal" ? E.color : ""}`}>{t.texto}</span>
                      {t.unidad && <span className="ml-1 text-xs text-muted">{t.unidad}</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="flex flex-col items-center gap-0.5">
                        <IconoEstado estado={t.estado} icono={s.icono} size={28} />
                        <span className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${E.color}`}>{s.palabra}</span>
                      </span>
                    </td>
                    <td className="num whitespace-nowrap px-4 py-2.5 text-sm text-soft">{tuNormal(t)}</td>
                    <td className="num whitespace-nowrap px-4 py-2.5 text-right text-sm text-muted">
                      <span className="inline-flex items-center gap-2">{horaMedicion(t, analisis, ahora)}<Icon name="chev" size={16} className="text-muted" /></span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          ))}
        </table>
      </div>
    </section>
  );
}
