"use client";
import { useEffect, useRef, useState } from "react";
import { actualizarEventoFicha } from "@/lib/data";
import { REVISION_MS, revisarEvento, ultimoAviso } from "@/lib/escalamiento";
import { COLOR_NIVEL, ETIQUETA_NIVEL } from "@/lib/fichas";
import { sonarAviso, useFichas, usePestanaVisible } from "@/lib/useFichas";

export default function VigiaFichas({ astronautId, ejecutar = true, onAbrir, fichas: externas = null }) {
  const propias = useFichas(externas ? null : astronautId);
  const f = externas || propias;
  const visible = usePestanaVisible();
  const ref = useRef(f);
  ref.current = f;
  const ocupado = useRef(false);
  const [visto, setVisto] = useState(null);
  const ultimoSonido = useRef(null);

  useEffect(() => {
    if (!ejecutar || !visible || !astronautId) return;
    const revisar = async () => {
      if (ocupado.current) return;
      ocupado.current = true;
      try {
        const { eventos, pasos } = ref.current;
        for (const e of eventos.filter((x) => !x.cerrado_en)) {
          const r = revisarEvento(e, { pasos });
          if (r) await actualizarEventoFicha(e.id, { nivel: r.nivel, respuestas: r.respuestas });
        }
      } catch (e) {
        console.warn("QuickFix: escalamiento", e?.message || e);
      }
      ocupado.current = false;
    };
    revisar();
    const t = setInterval(revisar, REVISION_MS);
    return () => clearInterval(t);
  }, [ejecutar, visible, astronautId]);

  const aviso = ultimoAviso(f.eventos);
  const id = aviso ? `${aviso.evento}|${aviso.id}` : null;

  useEffect(() => {
    if (!aviso || !visible || ultimoSonido.current === id) return;
    const edad = Date.now() - Date.parse(aviso.t);
    ultimoSonido.current = id;
    if (aviso.sonar && edad < 5 * 6e4) sonarAviso(aviso.nivel === "critico");
  }, [id, visible]);

  if (!aviso || visto === id || Date.now() - Date.parse(aviso.t) > 30 * 6e4) return null;
  const color = COLOR_NIVEL[aviso.nivel] || COLOR_NIVEL.urgente;
  return (
    <div role="alert" data-aviso-ficha={aviso.nivel} className="glass aviso-entra fixed left-1/2 top-3 z-[60] flex w-[calc(100%-2rem)] max-w-[560px] -translate-x-1/2 items-center gap-2 rounded-2xl py-2 pl-3 pr-2 text-sm font-semibold"
      style={{ borderColor: `color-mix(in oklab, ${color} 70%, transparent)`, color }}>
      <span className="dot-estado shrink-0" />
      <button type="button" onClick={() => { setVisto(id); onAbrir?.(aviso.clave); }} className="min-w-0 flex-1 text-left">
        <span className="mr-1.5 uppercase tracking-wide">{ETIQUETA_NIVEL[aviso.nivel]}</span>
        <span className="text-fg">{aviso.texto}</span>
      </button>
      <button type="button" onClick={() => setVisto(id)} aria-label="Cerrar aviso" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg text-muted hover:bg-white/10 hover:text-fg">×</button>
    </div>
  );
}
