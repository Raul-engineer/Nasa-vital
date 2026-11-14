"use client";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icons";
import { addAlert, saveCheckin, savePrueba } from "@/lib/data";
import { evaluarPrueba, PRUEBAS, resumenPvt, UMBRALES } from "@/lib/analysis";
import { puntuarCuestionario } from "@/lib/mockData";
import { MENSAJE_DESENLACE } from "@/lib/medic";

const CARAS = [
  { v: 1, e: "😣", t: "Muy mal" },
  { v: 2, e: "🙁", t: "Mal" },
  { v: 3, e: "😐", t: "Regular" },
  { v: 4, e: "🙂", t: "Bien" },
  { v: 5, e: "😄", t: "Muy bien" },
];

export const PREGUNTAS = [
  { k: "confusion", t: "¿Te sientes confundido o desorientado?" },
  { k: "vision_cefalea", t: "¿Visión borrosa o dolor de cabeza?" },
  { k: "mareo_de_pie", t: "¿Mareo al ponerte de pie?" },
];

export const INFO_PRUEBAS = {
  checkin: {
    descripcion: "Ánimo, estrés y fatiga del 1 al 5, más tres preguntas de alarma: confusión, visión o cefalea y mareo de pie.",
    para: "Detecta cambios de ánimo y síntomas de alarma que los sensores no ven.",
  },
  remedicion: {
    descripcion: "Cinco minutos sentado y en silencio; después se toma una nueva lectura de FC, SpO₂ y presión.",
    para: "Confirma si un valor alterado fue pasajero o se mantiene en reposo.",
  },
  ortostatica: {
    descripcion: "Presión y pulso acostado, al minuto y a los 3 minutos de estar de pie.",
    para: "Detecta hipotensión ortostática: caída ≥ 20 mmHg sistólica o ≥ 10 mmHg diastólica.",
  },
  reaccion: {
    descripcion: "PVT-B de 3 minutos: toca en cuanto aparezca el estímulo (cada 1 a 4 s). Cuenta lapsos (≥ 355 ms), falsas alarmas y tu mediana.",
    para: "Mide tu estado de alerta; empeora con falta de sueño o fatiga.",
  },
  who5: {
    descripcion: "Cinco preguntas sobre las últimas dos semanas, de 0 a 5. El puntaje va de 0 a 100. Se pide cada 7 días en el check-in.",
    para: "Detecta bienestar bajo: 50 o menos sugiere el PHQ-9; 28 o menos avisa al médico. Tamizaje, no diagnóstico.",
  },
  phq9: {
    descripcion: "Nueve preguntas sobre ánimo en las últimas dos semanas, de 0 a 3. Semanal o cuando lo pide el WHO-5.",
    para: "Tamizaje de depresión: 10 o más avisa al médico de tripulación. Tamizaje, no diagnóstico.",
  },
  gad7: {
    descripcion: "Siete preguntas sobre ansiedad en las últimas dos semanas, de 0 a 3. Semanal.",
    para: "Tamizaje de ansiedad: 10 o más avisa al médico de tripulación. Tamizaje, no diagnóstico.",
  },
  amsler: {
    descripcion: "Mira el punto central de la rejilla con un ojo a la vez y reporta si ves líneas onduladas o zonas faltantes.",
    para: "Complemento para vigilar la visión (SANS). Nunca da alerta roja por sí sola.",
  },
};

const OPC_WHO5 = [[5, "Todo el tiempo"], [4, "La mayor parte del tiempo"], [3, "Más de la mitad del tiempo"], [2, "Menos de la mitad del tiempo"], [1, "De vez en cuando"], [0, "Nunca"]];
const OPC_PHQ = [[0, "Ningún día"], [1, "Varios días"], [2, "Más de la mitad de los días"], [3, "Casi todos los días"]];
export const CUESTIONARIOS = {
  who5: {
    intro: "En las últimas dos semanas…",
    opciones: OPC_WHO5,
    items: [
      "Me he sentido alegre y de buen ánimo",
      "Me he sentido tranquilo(a) y relajado(a)",
      "Me he sentido activo(a) y con energía",
      "Me he despertado sintiéndome fresco(a) y descansado(a)",
      "Mi vida diaria ha estado llena de cosas que me interesan",
    ],
  },
  phq9: {
    intro: "Durante las últimas dos semanas, ¿qué tan seguido te han molestado los siguientes problemas?",
    opciones: OPC_PHQ,
    items: [
      "Poco interés o placer en hacer las cosas",
      "Sentirte decaído(a), deprimido(a) o sin esperanza",
      "Dificultad para dormir o permanecer dormido(a), o dormir demasiado",
      "Sentirte cansado(a) o con poca energía",
      "Poco apetito o comer en exceso",
      "Sentirte mal contigo mismo(a), o que eres un fracaso o que has quedado mal contigo o con tu familia",
      "Dificultad para concentrarte en cosas como leer o ver videos",
      "Moverte o hablar tan lento que otros lo notan, o lo contrario: estar tan inquieto(a) que te mueves mucho más de lo normal",
      "Pensamientos de que estarías mejor muerto(a) o de lastimarte de alguna manera",
    ],
  },
  gad7: {
    intro: "Durante las últimas dos semanas, ¿qué tan seguido te han molestado los siguientes problemas?",
    opciones: OPC_PHQ,
    items: [
      "Sentirte nervioso(a), ansioso(a) o con los nervios de punta",
      "No poder dejar de preocuparte o no poder controlar la preocupación",
      "Preocuparte demasiado por diferentes cosas",
      "Dificultad para relajarte",
      "Estar tan inquieto(a) que es difícil quedarte quieto(a)",
      "Molestarte o irritarte fácilmente",
      "Sentir miedo, como si algo terrible fuera a pasar",
    ],
  },
};

export function Cuestionario({ tipo, onFinish, enviarTexto = "Guardar respuestas", compacto = false, onCambio }) {
  const def = CUESTIONARIOS[tipo];
  const [r, setR] = useState(() => def.items.map(() => null));
  const completo = r.every((x) => x != null);
  const set = (i, v) => setR((prev) => prev.map((x, j) => (j === i ? v : x)));
  useEffect(() => {
    onCambio?.(r);
  }, [r, onCambio]);
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-violet/40 bg-violet/10 px-3 py-2 text-xs text-soft">Tamizaje, no diagnóstico. Tus respuestas solo las ven tú y el médico de tripulación.</div>
      <div className="text-sm font-medium">{def.intro}</div>
      <ol className="space-y-2.5">
        {def.items.map((t, i) => (
          <li key={i}>
            <div className="text-sm">{i + 1}. {t}</div>
            <div className="mt-1 flex flex-wrap gap-1" role="radiogroup" aria-label={t}>
              {def.opciones.map(([v, et]) => (
                <button type="button" key={v} role="radio" aria-checked={r[i] === v} onClick={() => set(i, v)} title={et}
                  className={`rounded-lg border px-2 py-1 text-xs transition ${r[i] === v ? "border-accent bg-accent/15 font-semibold text-accent" : "border-line hover:bg-ink/5"}`}>
                  {compacto ? v : `${v} · ${et}`}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ol>
      {tipo === "phq9" && r[8] > 0 && (
        <div role="alert" className="rounded-xl border border-crit/60 bg-crit/10 p-3 text-sm">
          Gracias por decirlo. Al guardar, Medic avisará de inmediato al médico de tripulación. No tienes que enfrentarlo solo(a): busca ahora a un compañero de confianza.
        </div>
      )}
      {onFinish && (
        <button type="button" disabled={!completo} onClick={() => onFinish({ respuestas: r, ...puntuarCuestionario(tipo, r) })}
          className="w-full rounded-xl bg-accent py-2.5 font-semibold text-onaccent hover:brightness-110 disabled:opacity-50">
          {completo ? enviarTexto : `Responde las ${def.items.length} preguntas`}
        </button>
      )}
    </div>
  );
}

function inicialCheckin(i = {}) {
  return {
    animo: i.animo ?? 3, estres: i.estres ?? 3, fatiga: i.fatiga ?? 3,
    confusion: !!i.confusion, vision_cefalea: !!i.vision_cefalea, mareo_de_pie: !!i.mareo_de_pie,
  };
}

export function Escala({ valor, onChange, etiqueta, bajo, alto }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium">{etiqueta}</span>
        <span className="text-xs text-muted">{bajo} · {alto}</span>
      </div>
      <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label={etiqueta}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} role="radio" aria-checked={valor === n} onClick={() => onChange(n)}
            className={`rounded-lg border py-1.5 text-sm font-semibold transition ${valor === n ? "border-accent bg-accent/15 text-accent" : "border-line hover:bg-ink/5"}`}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SiNo({ valor, onChange, texto }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2">
      <span className="text-sm">{texto}</span>
      <div className="flex shrink-0 overflow-hidden rounded-lg border border-line text-sm" role="radiogroup" aria-label={texto}>
        {[["No", false], ["Sí", true]].map(([t, b]) => (
          <button key={t} role="radio" aria-checked={valor === b} onClick={() => onChange(b)}
            className={`px-3 py-1 font-medium transition ${valor === b ? (b ? "bg-warn/20 text-warn" : "bg-ok/15 text-ok") : "hover:bg-ink/5"}`}>
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CheckinForm({ astronautId, inicial, onSaved, onResultado, who5Pendiente = false }) {
  const [v, setV] = useState(() => inicialCheckin(inicial));
  const [guardando, setGuardando] = useState(false);
  const [who5, setWho5] = useState(null);
  const [conReaccion, setConReaccion] = useState(false);
  const [reaccion, setReaccion] = useState(null);
  const firma = JSON.stringify(inicialCheckin(inicial));
  useEffect(() => {
    setV(JSON.parse(firma));
  }, [astronautId, firma]);
  const set = (k) => (x) => setV((s) => ({ ...s, [k]: x }));

  async function guardar() {
    setGuardando(true);
    try {
      await saveCheckin({ astronaut_id: astronautId, ...v, ...(reaccion ? { tiempo_reaccion_ms: reaccion } : {}) });
      const ev = evaluarPrueba("checkin", v);
      await savePrueba({ astronaut_id: astronautId, tipo: "checkin", resultado: { ...v, tiempo_reaccion_ms: reaccion }, interpretacion: ev.interpretacion });
      if (who5Pendiente && who5?.every((x) => x != null)) {
        const r5 = { respuestas: who5, ...puntuarCuestionario("who5", who5) };
        await savePrueba({ astronaut_id: astronautId, tipo: "who5", resultado: r5, interpretacion: evaluarPrueba("who5", r5).interpretacion });
      }
      const alarma = PREGUNTAS.some((p) => v[p.k]);
      onResultado?.({ tipo: "checkin", ...ev });
      onSaved?.(alarma ? "Check-in guardado. Medic revisó tus respuestas y abrió alertas nuevas en Análisis." : "Check-in guardado. Medic actualizó tu estado del día.");
    } catch (e) {
      onSaved?.("No se pudo guardar: " + (e.message || e));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1.5 text-sm font-medium">Ánimo</div>
        <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="Ánimo">
          {CARAS.map((c) => (
            <button key={c.v} role="radio" aria-checked={v.animo === c.v} aria-label={c.t} title={c.t} onClick={() => set("animo")(c.v)}
              className={`flex flex-col items-center rounded-xl border py-1.5 transition ${v.animo === c.v ? "border-accent bg-accent/15" : "border-line hover:bg-ink/5"}`}>
              <span className="text-2xl leading-none">{c.e}</span>
              <span className="mt-0.5 text-[10px] text-muted">{c.t}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Escala etiqueta="Estrés" valor={v.estres} onChange={set("estres")} bajo="1 bajo" alto="5 alto" />
        <Escala etiqueta="Fatiga" valor={v.fatiga} onChange={set("fatiga")} bajo="1 baja" alto="5 alta" />
      </div>
      <div className="space-y-1.5">
        {PREGUNTAS.map((p) => (
          <SiNo key={p.k} texto={p.t} valor={v[p.k]} onChange={set(p.k)} />
        ))}
      </div>
      {who5Pendiente && (
        <details className="rounded-xl border border-violet/40 p-3" open>
          <summary className="cursor-pointer text-sm font-semibold">Bienestar WHO-5 · toca esta semana <span className="font-normal text-muted">(0 nunca · 5 todo el tiempo)</span></summary>
          <div className="mt-2"><Cuestionario tipo="who5" compacto onCambio={setWho5} /></div>
        </details>
      )}
      <div className="rounded-xl border border-line p-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={conReaccion} onChange={(e) => setConReaccion(e.target.checked)} className="h-4 w-4" />
          Agregar prueba de reacción rápida (5 intentos){reaccion ? ` · ${reaccion} ms` : ""}
        </label>
        {conReaccion && !reaccion && <ReactionTest onDone={(prom) => setReaccion(prom)} />}
      </div>
      <button onClick={guardar} disabled={guardando}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-2.5 font-semibold text-onaccent hover:brightness-110 disabled:opacity-60">
        <Icon name="check" size={18} /> {guardando ? "Guardando…" : "Guardar check-in"}
      </button>
    </div>
  );
}

const INTENTOS = 5;

export function ReactionTest({ onDone }) {
  const [fase, setFase] = useState("listo");
  const [tiempos, setTiempos] = useState([]);
  const t0 = useRef(0);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  function iniciarIntento() {
    setFase("espera");
    timer.current = setTimeout(() => {
      t0.current = performance.now();
      setFase("ya");
    }, 1200 + Math.random() * 2300);
  }
  function tocar() {
    if (fase === "listo" || fase === "pronto") return iniciarIntento();
    if (fase === "espera") {
      clearTimeout(timer.current);
      return setFase("pronto");
    }
    if (fase === "ya") {
      const ms = Math.round(performance.now() - t0.current);
      const nuevos = [...tiempos, ms];
      setTiempos(nuevos);
      if (nuevos.length >= INTENTOS) {
        setFase("fin");
        onDone(Math.round(nuevos.reduce((a, b) => a + b, 0) / nuevos.length), nuevos);
      } else iniciarIntento();
    }
  }
  const prom = tiempos.length ? Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length) : null;
  const txt = { listo: "Toca para empezar", espera: "Espera…", ya: "¡Toca ahora!", pronto: "Muy pronto. Toca para repetir", fin: "¡Listo!" }[fase];
  const celdas = [["Intento", `${Math.min(tiempos.length + (fase === "fin" ? 0 : 1), INTENTOS)} de ${INTENTOS}`], ["Último", `${tiempos.at(-1) ?? "—"} ms`], ["Promedio", `${prom ?? "—"} ms`]];
  return (
    <div className="flex flex-col items-center">
      <button onPointerDown={tocar} disabled={fase === "fin"}
        className={`relative my-3 flex h-40 w-40 select-none items-center justify-center rounded-full border-4 px-4 text-center text-base font-semibold transition ${
          fase === "ya" ? "scale-105 border-accent bg-accent/25 text-fg glow-accent" : fase === "pronto" ? "border-warn/70 bg-warn/10 text-warn" : "border-accent/30 bg-ink/5 text-soft"
        }`}>
        {txt}
      </button>
      <div className="grid w-full grid-cols-3 gap-2 text-center text-sm">
        {celdas.map(([a, b]) => (
          <div key={a} className="rounded-lg bg-ink/5 p-2">
            <div className="text-muted">{a}</div>
            <div className="font-semibold">{b}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const variar = (v, d, dec = 0) => (v == null ? "" : Math.round((Number(v) + (Math.random() * 2 - 1) * d) * 10 ** dec) / 10 ** dec);

function CamposLectura({ valores, onChange, campos }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {campos.map(([k, t, u, step]) => (
        <label key={k} className="text-xs text-muted">
          {t} <span className="text-[10px]">({u})</span>
          <input type="number" inputMode="decimal" step={step || 1} value={valores[k] ?? ""}
            onChange={(e) => onChange({ ...valores, [k]: e.target.value === "" ? "" : Number(e.target.value) })}
            className="campo mt-1 text-base font-semibold text-fg" />
        </label>
      ))}
    </div>
  );
}

const CAMPOS_REMED = [["fc", "FC", "lpm"], ["spo2", "SpO₂", "%", 0.1], ["sistolica", "Sistólica", "mmHg"], ["diastolica", "Diastólica", "mmHg"]];

export function RemedicionTest({ hoy, onFinish }) {
  const [fase, setFase] = useState("inicio");
  const [seg, setSeg] = useState(300);
  const [despues, setDespues] = useState(null);
  const antes = { fc: hoy.fc, spo2: hoy.spo2, sistolica: hoy.sistolica, diastolica: hoy.diastolica };
  function pasarALectura() {
    setDespues({ fc: variar(hoy.fc, 3), spo2: Math.min(100, variar(hoy.spo2, 0.5, 1)), sistolica: variar(hoy.sistolica, 4), diastolica: variar(hoy.diastolica, 3) });
    setFase("lectura");
  }
  useEffect(() => {
    if (fase !== "cuenta") return;
    if (seg <= 0) {
      pasarALectura();
      return;
    }
    const t = setTimeout(() => setSeg((s) => s - 1), 1000);
    return () => clearTimeout(t);
  });
  if (fase === "inicio")
    return (
      <div className="space-y-3">
        <p className="text-sm text-soft">Siéntate con la espalda apoyada, pies en el piso y sin hablar. Al terminar la cuenta tomamos una nueva lectura.</p>
        <button onClick={() => setFase("cuenta")} className="w-full rounded-xl bg-accent py-2.5 font-semibold text-onaccent hover:brightness-110">Iniciar remedición (5 min)</button>
      </div>
    );
  if (fase === "cuenta")
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="text-5xl font-semibold tabular-nums" aria-live="polite">{Math.floor(seg / 60)}:{String(seg % 60).padStart(2, "0")}</div>
        <div className="h-2 w-full rounded-full bg-ink/10"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(1 - seg / 300) * 100}%` }} /></div>
        <p className="text-sm text-muted">Respira tranquilo. Medic toma la lectura al terminar.</p>
        <button onClick={pasarALectura} className="rounded-xl border border-line px-4 py-2 text-sm hover:bg-ink/5">Saltar (demo)</button>
      </div>
    );
  return (
    <div className="space-y-3">
      <div className="text-xs text-muted">
        Lectura anterior: FC {antes.fc} · SpO₂ {antes.spo2} % · PA {antes.sistolica}/{antes.diastolica}. Valores simulados precargados; puedes editarlos.
      </div>
      <CamposLectura valores={despues} onChange={setDespues} campos={CAMPOS_REMED} />
      <button onClick={() => onFinish({ antes, despues })} className="w-full rounded-xl bg-accent py-2.5 font-semibold text-onaccent hover:brightness-110">Guardar lectura</button>
    </div>
  );
}

const PASOS_ORTO = [
  { k: "acostado", t: "Acostado", d: "Acuéstate 5 min y toma presión y pulso." },
  { k: "min1", t: "De pie · 1 min", d: "Ponte de pie y mide al minuto." },
  { k: "min3", t: "De pie · 3 min", d: "Sigue de pie y mide a los 3 minutos." },
];
const CAMPOS_ORTO = [["sistolica", "Sistólica", "mmHg"], ["diastolica", "Diastólica", "mmHg"], ["fc", "FC", "lpm"]];

export function OrtostaticaTest({ hoy, onFinish }) {
  const [paso, setPaso] = useState(0);
  const [r, setR] = useState(() => ({
    acostado: { sistolica: hoy.sistolica, diastolica: hoy.diastolica, fc: hoy.fc },
    min1: { sistolica: hoy.sistolica - 6, diastolica: hoy.diastolica - 2, fc: hoy.fc + 8 },
    min3: { sistolica: hoy.sistolica - 4, diastolica: hoy.diastolica - 1, fc: hoy.fc + 10 },
  }));
  const P = PASOS_ORTO[paso];
  return (
    <div className="space-y-3">
      <ol className="flex gap-1.5" aria-label="Pasos de la prueba">
        {PASOS_ORTO.map((s, i) => (
          <li key={s.k} className={`flex-1 rounded-lg border px-2 py-1.5 text-center text-xs ${i === paso ? "border-accent bg-accent/10 font-semibold text-accent" : i < paso ? "border-ok/50 text-ok" : "border-line text-muted"}`}>
            {i < paso ? "✓ " : `${i + 1}. `}{s.t}
          </li>
        ))}
      </ol>
      <div className="flex items-center gap-2 text-sm text-soft"><Icon name="standing" size={18} className="text-accent" /> {P.d}</div>
      <CamposLectura valores={r[P.k]} onChange={(v) => setR((x) => ({ ...x, [P.k]: v }))} campos={CAMPOS_ORTO} />
      <div className="text-[11px] text-muted">Valores simulados precargados; puedes editarlos para probar el resultado.</div>
      <div className="flex gap-2">
        {paso > 0 && <button onClick={() => setPaso(paso - 1)} className="flex-1 rounded-xl border border-line py-2.5 hover:bg-ink/5">Atrás</button>}
        {paso < 2 ? (
          <button onClick={() => setPaso(paso + 1)} className="flex-1 rounded-xl bg-accent py-2.5 font-semibold text-onaccent hover:brightness-110">Siguiente</button>
        ) : (
          <button onClick={() => onFinish(r)} className="flex-1 rounded-xl bg-accent py-2.5 font-semibold text-onaccent hover:brightness-110">Ver resultado</button>
        )}
      </div>
    </div>
  );
}

export function PvtbTest({ onFinish, base }) {
  const P = UMBRALES.pvt;
  const [fase, setFase] = useState("inicio");
  const [estimulo, setEstimulo] = useState(false);
  const [restante, setRestante] = useState(P.duracionS);
  const [ultimo, setUltimo] = useState(null);
  const [n, setN] = useState(0);
  const resp = useRef([]);
  const t0 = useRef(0);
  const timer = useRef(null);
  const tick = useRef(null);
  const fin = useRef(0);
  const vivo = useRef(false);

  const terminar = () => {
    if (!vivo.current) return;
    vivo.current = false;
    clearTimeout(timer.current);
    clearInterval(tick.current);
    setEstimulo(false);
    setFase("fin");
    const dur = Math.round(P.duracionS - Math.max(0, (fin.current - Date.now()) / 1000));
    onFinish({ ...resumenPvt(resp.current), duracion_s: dur });
  };
  const programar = () => {
    clearTimeout(timer.current);
    const isi = P.isiMinMs + Math.random() * (P.isiMaxMs - P.isiMinMs);
    timer.current = setTimeout(() => {
      if (Date.now() >= fin.current) return terminar();
      t0.current = performance.now();
      setEstimulo(true);
    }, isi);
  };
  const iniciar = () => {
    resp.current = [];
    vivo.current = true;
    fin.current = Date.now() + P.duracionS * 1000;
    setN(0);
    setUltimo(null);
    setRestante(P.duracionS);
    setFase("corriendo");
    programar();
    tick.current = setInterval(() => {
      const s = Math.ceil((fin.current - Date.now()) / 1000);
      setRestante(Math.max(0, s));
      if (s <= 0) terminar();
    }, 250);
  };
  useEffect(() => () => {
    vivo.current = false;
    clearTimeout(timer.current);
    clearInterval(tick.current);
  }, []);
  const tocar = () => {
    if (fase !== "corriendo") return;
    if (estimulo) {
      const ms = Math.round(performance.now() - t0.current);
      resp.current.push({ ms });
      setUltimo(ms);
      setEstimulo(false);
    } else {
      resp.current.push({ falsa: true });
      setUltimo("falsa");
    }
    setN(resp.current.length);
    programar();
  };
  if (fase === "inicio")
    return (
      <div className="space-y-3">
        <p className="text-sm text-soft">Durante 3 minutos aparecerá un estímulo cada 1 a 4 segundos. Toca el recuadro (o la barra espaciadora) en cuanto lo veas, sin adelantarte.</p>
        {base ? <div className="text-xs text-muted">Tu línea base: mediana de {Math.round(base)} ms.</div> : null}
        <button onClick={iniciar} className="w-full rounded-xl bg-accent py-2.5 font-semibold text-onaccent hover:brightness-110">Iniciar PVT-B (3 min)</button>
      </div>
    );
  return (
    <div className="space-y-3">
      <button onPointerDown={tocar} onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); tocar(); } }} disabled={fase === "fin"}
        aria-label="Área de respuesta de la prueba de reacción"
        className={`flex h-44 w-full select-none flex-col items-center justify-center rounded-2xl border-4 text-2xl font-bold transition ${estimulo ? "border-accent bg-accent/25 text-accent" : "border-line bg-ink/5 text-muted"}`}>
        {fase === "fin" ? "¡Listo!" : estimulo ? "¡TOCA!" : "Espera…"}
        {ultimo != null && fase !== "fin" && <span className="mt-1 text-sm font-medium">{ultimo === "falsa" ? "Falsa alarma" : `${ultimo} ms`}</span>}
      </button>
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-lg bg-ink/5 p-2"><div className="text-muted">Restante</div><div className="font-semibold tabular-nums">{Math.floor(restante / 60)}:{String(restante % 60).padStart(2, "0")}</div></div>
        <div className="rounded-lg bg-ink/5 p-2"><div className="text-muted">Respuestas</div><div className="font-semibold">{n}</div></div>
        <div className="rounded-lg bg-ink/5 p-2"><div className="text-muted">Lapso</div><div className="font-semibold">≥ {P.lapsoMs} ms</div></div>
      </div>
      {fase === "corriendo" && <button onClick={terminar} className="w-full rounded-xl border border-line py-2 text-sm hover:bg-ink/5">Terminar antes (demo)</button>}
    </div>
  );
}

export function AmslerTest({ onFinish }) {
  const [od, setOd] = useState(null);
  const [oi, setOi] = useState(null);
  const lineas = Array.from({ length: 21 }, (_, i) => i * 10);
  return (
    <div className="space-y-3">
      <p className="text-sm text-soft">Ponte tus lentes si los usas. Tapa un ojo y mira fijamente el punto central a 30–40 cm. Repite con el otro ojo.</p>
      <div className="mx-auto w-full max-w-[260px] rounded-xl bg-white p-2">
        <svg viewBox="0 0 200 200" className="h-auto w-full" role="img" aria-label="Rejilla de Amsler">
          {lineas.map((x) => <line key={`v${x}`} x1={x} y1="0" x2={x} y2="200" stroke="#111" strokeWidth="0.7" />)}
          {lineas.map((y) => <line key={`h${y}`} x1="0" y1={y} x2="200" y2={y} stroke="#111" strokeWidth="0.7" />)}
          <circle cx="100" cy="100" r="3" fill="#111" />
        </svg>
      </div>
      <SiNo texto="Ojo derecho: ¿líneas onduladas, borrosas o zonas faltantes?" valor={od} onChange={setOd} />
      <SiNo texto="Ojo izquierdo: ¿líneas onduladas, borrosas o zonas faltantes?" valor={oi} onChange={setOi} />
      <button disabled={od == null || oi == null} onClick={() => onFinish({ od, oi })}
        className="w-full rounded-xl bg-accent py-2.5 font-semibold text-onaccent hover:brightness-110 disabled:opacity-50">Guardar resultado</button>
    </div>
  );
}

const MENSAJE_TAMIZAJE = (tipo, r) => {
  const p = r.puntaje;
  if (tipo === "who5") return p <= UMBRALES.who5.atencion ? ["Tu bienestar está bajo. Avisé al médico de tripulación.", "warn"] : p <= UMBRALES.who5.sugierePhq9 ? ["Gracias. Te sugiero contestar el PHQ-9.", "warn"] : ["Gracias. Tu bienestar está en buen rango.", "ok"];
  if (tipo === "phq9") return r.item9 > 0 ? ["Gracias por responder con honestidad. Avisé de inmediato al médico de tripulación; no estás solo(a).", "crit"] : p >= UMBRALES.phq9.atencion ? ["Avisé al médico de tripulación para platicar contigo.", "warn"] : ["Gracias. Tu puntaje está en rango bajo.", "ok"];
  if (tipo === "gad7") return p >= UMBRALES.gad7.atencion ? ["Avisé al médico de tripulación para platicar contigo.", "warn"] : ["Gracias. Tu puntaje está en rango bajo.", "ok"];
  if (tipo === "amsler") return r.od || r.oi ? ["Registré la distorsión. Se combina con tus preguntas de visión; si persiste, revísalo con el médico.", "warn"] : ["Sin distorsión en ninguno de los dos ojos.", "ok"];
  return ["Listo, registré tu prueba.", "ok"];
};

export function mensajeDesenlace(desenlace, alerta) {
  if (!desenlace) return "Listo, registré tu prueba.";
  if (desenlace === "mejoro") {
    if (!alerta) return "Tus valores están dentro de tu rango.";
    if (alerta.estado === "critico") return "Tus valores regresaron a tu rango. Por ser una alerta crítica, el médico de tripulación decide cuándo cerrarla.";
  }
  return MENSAJE_DESENLACE[desenlace];
}

export function ResultadoMedic({ res, onCerrar }) {
  return (
    <div aria-live="polite" className={`rounded-2xl border p-4 ${res.tono === "crit" || res.desenlace === "empeoro" ? "border-crit/60 bg-crit/10" : res.tono === "warn" || res.desenlace === "igual" ? "border-warn/60 bg-warn/10" : "border-ok/50 bg-ok/10"}`}>
      <div className="flex items-start gap-3">
        <span className="text-accent"><Icon name="medic" size={24} /></span>
        <div className="min-w-0 flex-1">
          <div className="font-semibold">Medic: {res.mensaje}</div>
          <div className="mt-1 text-sm text-soft">{res.interpretacion}</div>
        </div>
        {onCerrar && <button onClick={onCerrar} aria-label="Cerrar" className="rounded-md p-0.5 text-muted hover:bg-ink/10"><Icon name="x" size={16} /></button>}
      </div>
    </div>
  );
}

export function PruebaRunner({ tipo, astronautId, analisis, alerta, onToast, onCompletada, resultadoExterno }) {
  const [res, setRes] = useState(null);
  const [n, setN] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const hoy = analisis.hoy;

  async function terminar(resultado) {
    setGuardando(true);
    try {
      const r = { ...resultado, alerta: alerta?.id || null, alertaEstado: alerta?.estado || null };
      const ev = evaluarPrueba(tipo, r, analisis);
      await savePrueba({ astronaut_id: astronautId, tipo, resultado: r, interpretacion: ev.interpretacion, desenlace: ev.desenlace });
      if (tipo === "reaccion" && (r.mediana_ms || r.promedio_ms)) await saveCheckin({ astronaut_id: astronautId, tiempo_reaccion_ms: r.mediana_ms || r.promedio_ms });
      if (ev.desenlace === "empeoro") {
        const orto = tipo === "ortostatica";
        await addAlert({
          astronaut_id: astronautId,
          sistema: alerta?.sistema || (tipo === "reaccion" ? "sueno" : "cardiovascular"),
          nivel: ev.nivelAlerta || "critico",
          clave: orto ? "ortostatica" : null,
          mensaje: orto ? "Prueba ortostática positiva: hipotensión ortostática. Medic avisó al médico de tripulación" : `${PRUEBAS[tipo].nombre}: el resultado empeoró. Médico de tripulación notificado`,
        });
      }
      const tam = ["who5", "phq9", "gad7", "amsler"].includes(tipo) ? MENSAJE_TAMIZAJE(tipo, r) : null;
      const mensaje = tam ? tam[0] : tipo === "ortostatica" && ev.positiva ? "Prueba positiva (ámbar): hipotensión ortostática. Avisé al médico de tripulación." : mensajeDesenlace(ev.desenlace, alerta);
      const out = { ...ev, tipo, mensaje, tono: tam ? tam[1] : null, alerta: alerta?.motivo || null };
      setRes(out);
      onCompletada?.(out);
    } catch (e) {
      onToast?.("No se pudo guardar la prueba: " + (e.message || e));
    } finally {
      setGuardando(false);
    }
  }

  if (res)
    return (
      <div className="space-y-3">
        {resultadoExterno ? <div className="text-sm text-muted">Prueba registrada.</div> : <ResultadoMedic res={res} />}
        <button onClick={() => { setRes(null); setN((x) => x + 1); }} className="w-full rounded-xl border border-line py-2 text-sm hover:bg-ink/5">Repetir prueba</button>
      </div>
    );
  if (guardando) return <div className="py-6 text-center text-muted">Guardando…</div>;
  const k = `${tipo}-${n}`;
  if (tipo === "remedicion") return <RemedicionTest key={k} hoy={hoy} onFinish={terminar} />;
  if (tipo === "ortostatica") return <OrtostaticaTest key={k} hoy={hoy} onFinish={terminar} />;
  if (tipo === "reaccion") return <PvtbTest key={k} base={analisis.baselines?.reaccion?.media} onFinish={terminar} />;
  if (tipo === "who5" || tipo === "phq9" || tipo === "gad7") return <Cuestionario key={k} tipo={tipo} onFinish={terminar} />;
  if (tipo === "amsler") return <AmslerTest key={k} onFinish={terminar} />;
  if (tipo === "checkin")
    return <CheckinForm key={k} astronautId={astronautId} inicial={analisis.checkinHoy} onSaved={onToast} who5Pendiente={analisis.tamizaje?.who5Pendiente}
      onResultado={(ev) => setRes({ ...ev, mensaje: "Listo, registré tu check-in." })} />;
  return null;
}
