"use client";
import { useEffect, useState } from "react";
import { EncabezadoPagina, Shell } from "@/components/Shell";
import { TablaResumen } from "@/components/analisis/Resumen";
import { VistaVariable } from "@/components/analisis/Variable";
import { ChipEstado } from "@/components/analisis/comun";
import { useAstronautId, useQuickFix } from "@/lib/useQuickFix";
import { VARIABLES } from "@/lib/analysis";

const PIE = "Datos simulados · Medic no diagnostica; lo grave se escala al médico de tripulación.";
const ESTADO_TXT = { normal: "Bien", atencion: "Precaución", critico: "Actúa ahora" };

export default function Analisis() {
  const [aid, setAid] = useAstronautId();
  const { data, analisis, loading, error } = useQuickFix(aid);
  const [vari, setVari] = useState(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("var");
    if (p && VARIABLES[p]) setVari(p);
  }, []);

  if (error) return <div className="p-10 text-crit">No se pudieron cargar los datos: {error}</div>;
  if (loading || !analisis) return <div className="flex min-h-screen items-center justify-center text-muted">Cargando análisis…</div>;

  const { astronaut, astronauts } = data;
  const cambiarVar = (k) => {
    setVari(k);
    const url = new URL(window.location.href);
    if (k) url.searchParams.set("var", k);
    else url.searchParams.delete("var");
    ["s", "al", "m"].forEach((x) => url.searchParams.delete(x));
    window.history.replaceState(null, "", url);
    window.scrollTo({ top: 0 });
  };
  const fuera = analisis.tarjetas.filter((t) => t.estado === "atencion" || t.estado === "critico").length;

  return (
    <Shell active="/analisis" astronaut={astronaut} astronauts={astronauts} onAstronaut={setAid} astronautId={aid} analisis={analisis} pie={PIE}>
      {vari ? (
        <VistaVariable k={vari} analisis={analisis} data={data} aid={aid} onCambiar={cambiarVar} onTodas={() => cambiarVar(null)} />
      ) : (
        <div className="flex flex-col">
          <EncabezadoPagina titulo="Análisis" sub={`${12 - fuera} de 12 signos en rango`} derecha={<ChipEstado estado={analisis.general}>{ESTADO_TXT[analisis.general]}</ChipEstado>} />
          <TablaResumen analisis={analisis} onVer={cambiarVar} />
        </div>
      )}
    </Shell>
  );
}
