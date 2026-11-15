"use client";
import MonitorEcg from "./Ecg";
import MonitorPleth from "./Pleth";
import MonitorRespiracion from "./Respiracion";
import MonitorPresion from "./Presion";
import MonitorTemperatura from "./Temperatura";
import MonitorConciencia from "./Conciencia";
import MonitorRadiacion from "./Radiacion";
import MonitorSueno from "./Sueno";
import MonitorAnimo from "./Animo";
import MonitorVision from "./Vision";
import MonitorHuesos from "./Huesos";
import MonitorCabina from "./Cabina";

export function Monitor({ k, t, analisis, data, aid }) {
  const p = { t, analisis, data, aid };
  const h = analisis.hoy;
  switch (k) {
    case "fc":
      return <MonitorEcg fc={h.fc} vfc={t.vfc} />;
    case "spo2":
      return <MonitorPleth spo2={h.spo2} fc={h.fc} />;
    case "fr":
      return <MonitorRespiracion fr={h.frec_resp} />;
    case "pa":
      return <MonitorPresion {...p} />;
    case "temp":
      return <MonitorTemperatura {...p} />;
    case "conciencia":
      return <MonitorConciencia {...p} />;
    case "radiacion":
      return <MonitorRadiacion {...p} />;
    case "sueno":
      return <MonitorSueno {...p} />;
    case "animo":
      return <MonitorAnimo {...p} />;
    case "vision":
      return <MonitorVision {...p} />;
    case "huesos":
      return <MonitorHuesos {...p} />;
    case "cabina":
      return <MonitorCabina {...p} />;
    default:
      return null;
  }
}
