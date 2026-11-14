"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icons";
import { LogoIcono } from "@/components/Marca";
import { ESTADO, Toast } from "@/components/Shell";
import { useAstronautId, useQuickFix } from "@/lib/useQuickFix";
import { protocoloPara, SISTEMAS } from "@/lib/analysis";
import { confirmarRefugio, iniciarTormenta, resolveAlert, saveCheckin, terminarTormenta, MODO, resetLocal } from "@/lib/data";

const PANTALLAS = ["inicio", "vitales", "checkin"];
const CARAS = ["😣", "🙁", "😐", "🙂", "😄"];

function useHora() {
  const [h, setH] = useState("--:--");
  useEffect(() => {
    const f = () => setH(new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false }));
    f();
    const t = setInterval(f, 10000);
    return () => clearInterval(t);
  }, []);
  return h;
}

function useFcVivo(base) {
  const [fc, setFc] = useState(base);
  useEffect(() => {
    if (!base) return;
    setFc(base);
    const t = setInterval(() => setFc(base + Math.round((Math.random() - 0.5) * 4)), 1800);
    return () => clearInterval(t);
  }, [base]);
  return fc;
}

function Anillo({ pct, color, size = 300, stroke = 14 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="absolute -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(148,163,184,0.15)" strokeWidth={stroke} fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: "all 1s", filter: `drop-shadow(0 0 8px ${color})` }} />
    </svg>
  );
}

export default function Reloj() {
  const [aid, setAid] = useAstronautId();
  const { data, analisis, loading } = useQuickFix(aid);
  const [pantalla, setPantalla] = useState("inicio");
  const [verAcciones, setVerAcciones] = useState(false);
  const [toast, setToast] = useState(null);
  const hora = useHora();
  const fc = useFcVivo(analisis?.hoy?.fc);
  const closeToast = useCallback(() => setToast(null), []);

  if (loading || !analisis) return <div className="flex min-h-screen items-center justify-center text-muted">Conectando reloj…</div>;

  const { astronaut, astronauts, alerts, protocols } = data;
  const critica = alerts.find((a) => a.nivel === "critico" && !a.resuelta && a.sistema !== "radiacion");
  const rad = analisis.radiacion;
  const alarma = rad.activo;
  const aviso = analisis.activas.find((a) => a.estado === "atencion");
  const prep = analisis.preparacion;
  const col = ESTADO[analisis.general]?.hex || ESTADO.normal.hex;
  const estadoTxt = analisis.hayCritico ? "Crítico" : analisis.activas.length ? "Atención" : "Normal";
  const proto = aviso ? protocoloPara(protocols, aviso.sistema, "atencion") : null;
  const protoCrit = critica ? protocoloPara(protocols, critica.sistema, "critico") : null;
  const idx = PANTALLAS.indexOf(pantalla);

  async function tormenta() {
    await iniciarTormenta("S3");
    setToast("Alarma de la nave: tormenta solar S3. Todas las pantallas abiertas recibieron la alarma.");
  }
  async function terminar() {
    await terminarTormenta();
    setToast("Fin del evento. La dosis recibida quedó guardada en el historial.");
  }
  async function refugio() {
    await confirmarRefugio(aid);
    setToast("Refugio confirmado desde el reloj. La tasa baja a la mitad.");
  }
  async function entendido() {
    await resolveAlert(critica.id);
    setToast("Confirmado desde el reloj. La tablet se actualizó.");
  }
  async function animo(v) {
    const ci = analisis.checkinHoy || {};
    await saveCheckin({ astronaut_id: aid, animo: v, estres: ci.estres ?? 3, fatiga: ci.fatiga ?? 3 });
    setToast(`Ánimo ${v}/5 registrado desde el reloj.`);
    setPantalla("inicio");
  }

  let contenido;
  if (alarma) {
    contenido = (
      <div className={`${rad.refugio ? "" : "vibrate"} flex h-full w-full flex-col items-center justify-center bg-[radial-gradient(circle,#991b1b,#2a0a0a)] px-10 text-center`}>
        <span className="text-[#fecaca]"><Icon name="rad" size={48} /></span>
        <div className="mt-1 text-xl font-bold text-white">Alarma de radiación</div>
        <div className="text-[15px] font-semibold text-[#fecaca]">Tormenta solar {alarma.nivel}</div>
        <div className="mt-1 text-3xl font-bold tabular-nums text-white">{Math.round(rad.tasa)} <span className="text-sm font-normal">µSv/h</span></div>
        <div className="text-[11px] text-[#fca5a5]">{rad.refugio ? "En refugio · tasa reducida 50 %" : "📳 Ve al refugio"}</div>
        {rad.refugio ? (
          <div className="mt-3 rounded-full border border-white/40 px-5 py-2 text-sm font-semibold text-white">✓ En refugio</div>
        ) : (
          <button onClick={refugio} className="mt-3 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#7f1d1d]">Ya estoy en refugio</button>
        )}
      </div>
    );
  } else if (critica) {
    contenido = (
      <div className="vibrate flex h-full w-full flex-col items-center justify-center bg-[radial-gradient(circle,#7f1d1d,#2a0a0a)] px-10 text-center">
        <span className="text-crit"><Icon name={critica.sistema === "radiacion" ? "rad" : "alert"} size={52} /></span>
        <div className="mt-2 text-2xl font-bold text-fg">{critica.sistema === "radiacion" ? "Tormenta solar" : "Alerta de salud"}</div>
        <div className="mt-1 text-[15px] text-[#fecaca]">{critica.sistema === "radiacion" ? protoCrit?.acciones[0] || critica.mensaje : critica.mensaje}</div>
        <div className="mt-1 text-xs text-[#fca5a5]">📳 vibrando</div>
        <button onClick={entendido} className="mt-4 rounded-full bg-crit px-7 py-2.5 font-semibold text-[#2a0909]">Entendido</button>
      </div>
    );
  } else if (pantalla === "inicio" && verAcciones && proto) {
    contenido = (
      <div className="flex h-full w-full flex-col items-center justify-center px-12 text-center">
        <div className="text-sm font-semibold text-warn">Qué hacer ahora</div>
        <ol className="mt-2 space-y-1.5 text-left text-[13px] leading-snug">
          {proto.acciones.slice(0, 3).map((a, i) => <li key={i}>{i + 1}. {a}</li>)}
        </ol>
        <button onClick={() => setVerAcciones(false)} className="mt-3 rounded-full border border-line px-5 py-1.5 text-sm">Listo</button>
      </div>
    );
  } else if (pantalla === "inicio") {
    contenido = (
      <div className="relative flex h-full w-full items-center justify-center">
        <Anillo pct={prep.total / 100} color={col} />
        <div className="flex flex-col items-center text-center">
          <div className="text-xs text-muted">{hora}</div>
          <div className="text-[13px] font-semibold" style={{ color: col }}>{estadoTxt}</div>
          <div className="text-5xl font-bold leading-none">{prep.total}</div>
          <div className="text-[11px] text-muted">preparación</div>
          <div className="mt-2 flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1 text-[#f472b6]"><Icon name="heart" size={16} />{fc}</span>
            <span className="flex items-center gap-1 text-accent"><Icon name="o2" size={16} />{analisis.hoy.spo2}%</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-muted"><Icon name="rad" size={13} /> {Math.round(rad.tasa)} µSv/h</div>
          <div className="mt-2 flex gap-1.5">
            {Object.entries(analisis.sistemas).map(([k, s]) => (
              <span key={k} title={SISTEMAS[k].nombre} className="h-2.5 w-2.5 rounded-full" style={{ background: ESTADO[s.estado].hex }} />
            ))}
          </div>
          {aviso && (
            <button onClick={() => setVerAcciones(true)} className="mt-2 max-w-[190px] rounded-full bg-warn/15 px-3 py-1 text-[11px] leading-tight text-warn">
              {aviso.motivo.length > 40 ? aviso.motivo.slice(0, 38) + "…" : aviso.motivo} · Ver
            </button>
          )}
        </div>
      </div>
    );
  } else if (pantalla === "vitales") {
    const h = analisis.hoy;
    const items = [
      ["heart", "FC", `${fc} lpm`], ["trend", "VFC", `${h.vfc} ms`], ["o2", "SpO₂", `${h.spo2}%`],
      ["thermo", "Temp", h.temperatura ? `${h.temperatura} °C` : "—"], ["moon", "Sueño", `${h.horas_sueno} h`], ["rad", "Radiación", `${Math.round(rad.tasa)} µSv/h`],
    ];
    contenido = (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1.5">
        <div className="mb-1 text-xs text-muted">Signos vitales · {hora}</div>
        {items.map(([ic, l, v]) => (
          <div key={l} className="flex w-44 items-center gap-2 text-sm">
            <span className="text-accent"><Icon name={ic} size={16} /></span>
            <span className="flex-1 text-muted">{l}</span>
            <span className="font-semibold">{v}</span>
          </div>
        ))}
      </div>
    );
  } else {
    contenido = (
      <div className="flex h-full w-full flex-col items-center justify-center px-8 text-center">
        <div className="text-sm text-muted">Check-in rápido</div>
        <div className="text-lg font-semibold">¿Cómo te sientes?</div>
        <div className="mt-3 flex gap-1.5">
          {CARAS.map((c, i) => (
            <button key={i} onClick={() => animo(i + 1)} className="h-11 w-11 rounded-full bg-ink/10 text-2xl hover:bg-accent/30">{c}</button>
          ))}
        </div>
        <div className="mt-3 text-[11px] text-muted">El check-in completo está en la tablet</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-6">
      <div className="mb-6 flex w-full max-w-3xl items-center justify-between">
        <Link href={`/?a=${aid}`} className="flex items-center gap-2">
          <LogoIcono size={34} /> <span className="font-extrabold italic tracking-tight">QUICK<span className="text-accent">FIX</span></span>
          <span className="text-sm text-muted">Reloj</span>
        </Link>
        <select value={aid} onChange={(e) => setAid(Number(e.target.value))} className="card cursor-pointer rounded-xl bg-transparent px-3 py-2 text-sm outline-none">
          {astronauts.map((a) => <option key={a.id} value={a.id} className="bg-panel">{a.nombre}</option>)}
        </select>
      </div>

      <div className="relative flex items-center justify-center">
        <div className="absolute h-[560px] w-[150px] rounded-[40px] bg-gradient-to-b from-[#1e293b] via-[#0f172a] to-[#1e293b] shadow-inner" />
        <div className="relative rounded-full bg-gradient-to-br from-[#475569] via-[#1e293b] to-[#334155] p-[14px] shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
          <button onClick={() => setPantalla(PANTALLAS[(idx + 1) % PANTALLAS.length])}
            className="absolute -right-3 top-[38%] h-14 w-4 rounded-r-md bg-gradient-to-r from-[#334155] to-[#64748b]" title="Siguiente pantalla" />
          <div data-theme="dark" className="relative h-[330px] w-[330px] overflow-hidden rounded-full border border-black bg-[#05070f] text-fg">
            {contenido}
          </div>
        </div>
      </div>
      {!critica && !alarma && (
        <div className="mt-5 flex gap-2">
          {PANTALLAS.map((p) => (
            <button key={p} onClick={() => { setPantalla(p); setVerAcciones(false); }}
              className={`h-2.5 rounded-full transition-all ${p === pantalla ? "w-6 bg-accent" : "w-2.5 bg-ink/25"}`} aria-label={p} />
          ))}
        </div>
      )}

      <div className="card mt-8 w-full max-w-md p-4">
        <div className="mb-3 text-xs uppercase tracking-widest text-muted">Controles de la demo</div>
        <div className="flex flex-wrap gap-2">
          <button onClick={tormenta} disabled={!!alarma}
            className="flex-1 rounded-xl bg-crit/20 px-4 py-2.5 text-sm font-semibold text-crit hover:bg-crit/30 disabled:opacity-40">
            ☢ Simular tormenta solar
          </button>
          <button onClick={terminar} disabled={!alarma}
            className="flex-1 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold hover:bg-ink/5 disabled:opacity-40">
            Terminar tormenta
          </button>
          <Link href={`/?a=${aid}`} target="_blank" className="flex-1 rounded-xl border border-line px-4 py-2.5 text-center text-sm hover:bg-ink/5">
            Abrir tablet en otra pestaña
          </Link>
        </div>
        {MODO === "local" && (
          <button onClick={resetLocal} className="mt-2 w-full text-xs text-muted underline">Reiniciar datos de la demo</button>
        )}
        <div className="mt-3 text-[11px] leading-snug text-muted">
          Prototipo web del wearable. En la misión sería una app nativa (Wear OS / watchOS). La radiación viene del dosímetro personal (Crew Active Dosimeter, por Bluetooth) y la alarma de los sensores de la nave (tipo HERA), no del reloj.
        </div>
      </div>
      <Toast msg={toast} onClose={closeToast} />
    </div>
  );
}
