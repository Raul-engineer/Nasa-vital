"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PruebaPantalla from "@/components/PruebaPantalla";
import AlarmaCritica from "@/components/AlarmaCritica";
import { useAstronautId } from "@/lib/useQuickFix";
import { CLAVES_FICHA } from "@/lib/fichas";

export default function PruebaCompleta() {
  const { id } = useParams();
  const [aid] = useAstronautId();
  const [desde, setDesde] = useState(null);
  useEffect(() => {
    const d = new URLSearchParams(window.location.search).get("desde");
    if (CLAVES_FICHA.includes(d)) setDesde(d);
  }, []);
  return (
    <>
      <PruebaPantalla key={`${aid}-${id}`} id={String(id)} astronautId={aid} desde={desde} />
      <AlarmaCritica astronautId={aid} />
    </>
  );
}
