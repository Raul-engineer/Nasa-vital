"use client";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icons";
import { addAlert, saveCheckin, savePrueba } from "@/lib/data";
import { evaluarPrueba, PRUEBAS, resumenPvt, UMBRALES } from "@/lib/analysis";
import { puntuarCuestionario } from "@/lib/mockData";
import { MENSAJE_DESENLACE } from "@/lib/medic";

const CARAS = [
  { v: 1, e: "😣", t: "Very bad" },
  { v: 2, e: "🙁", t: "Bad" },
  { v: 3, e: "😐", t: "Okay" },
  { v: 4, e: "🙂", t: "Good" },
  { v: 5, e: "😄", t: "Very good" },
];

export const PREGUNTAS = [
  { k: "confusion", t: "Do you feel confused or disoriented?" },
  { k: "mareo_de_pie", t: "Are you dizzy?" },
  { k: "vision_borrosa", t: "Blurred vision?" },
  { k: "dolor_cabeza", t: "Headache?" },
];

export const SINTOMAS = [
  { k: "garganta", t: "Throat" },
  { k: "llagas", t: "Sores or herpes" },
  { k: "ronchas", t: "Rash" },
  { k: "heridas", t: "Slow-healing wounds" },
  { k: "estomago", t: "Stomach" },
];

export const INFO_PRUEBAS = {
  checkin: {
    descripcion: "Mood, stress, fatigue and relationship with the crew; confusion, dizziness, blurred vision, headache and signs of infection.",
    para: "Catches what the sensors do not see. Each save recalculates your 12 cards.",
  },
  remedicion: {
    descripcion: "Five minutes seated and silent; then a new HR, SpO₂ and blood pressure reading is taken.",
    para: "Confirms whether an abnormal value was brief or persists at rest.",
  },
  ortostatica: {
    descripcion: "Blood pressure and pulse lying down, at 1 minute and at 3 minutes of standing.",
    para: "Detects orthostatic hypotension: a drop ≥ 20 mmHg systolic or ≥ 10 mmHg diastolic.",
  },
  reaccion: {
    descripcion: "3-minute PVT-B: tap as soon as the stimulus appears (every 1 to 4 s). Counts lapses (≥ 355 ms), false alarms and your median.",
    para: "Measures your alertness; it worsens with lack of sleep or fatigue.",
  },
  who5: {
    descripcion: "Five questions about the last two weeks, from 0 to 5. The score goes from 0 to 100. Asked every 7 days in the check-in.",
    para: "Detects low well-being: 50 or less suggests the PHQ-9; 28 or less notifies the physician. Screening, not diagnosis.",
  },
  phq9: {
    descripcion: "Nine questions about mood over the last two weeks, from 0 to 3. Weekly or when the WHO-5 asks for it.",
    para: "Depression screening: 10 or more notifies the crew physician. Screening, not diagnosis.",
  },
  gad7: {
    descripcion: "Seven questions about anxiety over the last two weeks, from 0 to 3. Weekly.",
    para: "Anxiety screening: 10 or more notifies the crew physician. Screening, not diagnosis.",
  },
  amsler: {
    descripcion: "Look at the center dot of the grid with one eye at a time and report any wavy lines or missing areas.",
    para: "A complement for monitoring vision (SANS). It never raises a red alert on its own.",
  },
};

const OPC_WHO5 = [[5, "All of the time"], [4, "Most of the time"], [3, "More than half of the time"], [2, "Less than half of the time"], [1, "Some of the time"], [0, "At no time"]];
const OPC_PHQ = [[0, "Not at all"], [1, "Several days"], [2, "More than half the days"], [3, "Nearly every day"]];
export const CUESTIONARIOS = {
  who5: {
    intro: "Over the last two weeks…",
    opciones: OPC_WHO5,
    items: [
      "I have felt cheerful and in good spirits",
      "I have felt calm and relaxed",
      "I have felt active and vigorous",
      "I woke up feeling fresh and rested",
      "My daily life has been filled with things that interest me",
    ],
  },
  phq9: {
    intro: "Over the last two weeks, how often have you been bothered by the following problems?",
    opciones: OPC_PHQ,
    items: [
      "Little interest or pleasure in doing things",
      "Feeling down, depressed or hopeless",
      "Trouble falling or staying asleep, or sleeping too much",
      "Feeling tired or having little energy",
      "Poor appetite or overeating",
      "Feeling bad about yourself, or that you are a failure or have let yourself or your family down",
      "Trouble concentrating on things, such as reading or watching videos",
      "Moving or speaking so slowly that other people could have noticed, or the opposite: being so fidgety or restless that you move around a lot more than usual",
      "Thoughts that you would be better off dead or of hurting yourself in some way",
    ],
  },
  gad7: {
    intro: "Over the last two weeks, how often have you been bothered by the following problems?",
    opciones: OPC_PHQ,
    items: [
      "Feeling nervous, anxious or on edge",
      "Not being able to stop or control worrying",
      "Worrying too much about different things",
      "Trouble relaxing",
      "Being so restless that it is hard to sit still",
      "Becoming easily annoyed or irritable",
      "Feeling afraid, as if something awful might happen",
    ],
  },
};

export function Cuestionario({ tipo, onFinish, enviarTexto = "Save answers", compacto = false, onCambio }) {
  const def = CUESTIONARIOS[tipo];
  const [r, setR] = useState(() => def.items.map(() => null));
  const completo = r.every((x) => x != null);
  const set = (i, v) => setR((prev) => prev.map((x, j) => (j === i ? v : x)));
  useEffect(() => {
    onCambio?.(r);
  }, [r, onCambio]);
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-violet/40 bg-violet/10 px-3 py-2 text-xs text-soft">Screening, not diagnosis. Only you and the crew physician see your answers.</div>
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
          Thank you for saying it. When you save, Medic will notify the crew physician right away. You do not have to face this alone: find a crewmate you trust now.
        </div>
      )}
      {onFinish && (
        <button type="button" disabled={!completo} onClick={() => onFinish({ respuestas: r, ...puntuarCuestionario(tipo, r) })}
          className="w-full rounded-xl bg-accent py-2.5 font-semibold text-onaccent hover:brightness-110 disabled:opacity-50">
          {completo ? enviarTexto : `Answer the ${def.items.length} questions`}
        </button>
      )}
    </div>
  );
}

function inicialCheckin(i = {}) {
  return {
    animo: i.animo ?? 3, estres: i.estres ?? 3, fatiga: i.fatiga ?? 3, tripulacion: i.tripulacion ?? 4,
    confusion: !!i.confusion, mareo_de_pie: !!i.mareo_de_pie,
    vision_borrosa: !!(i.vision_borrosa ?? i.vision_cefalea), dolor_cabeza: !!(i.dolor_cabeza ?? i.vision_cefalea),
    sintomas: Array.isArray(i.sintomas) ? i.sintomas : [],
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
        {[["No", false], ["Yes", true]].map(([t, b]) => (
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
      onResultado?.({ tipo: "checkin", ...ev, valores: v });
      onSaved?.(alarma ? "Check-in saved. Medic reviewed your answers and opened new alerts in Analysis." : "Check-in saved. Medic updated your status for the day.");
    } catch (e) {
      onSaved?.("Could not save: " + (e.message || e));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1.5 text-sm font-medium">Mood</div>
        <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="Mood">
          {CARAS.map((c) => (
            <button key={c.v} role="radio" aria-checked={v.animo === c.v} aria-label={c.t} title={c.t} onClick={() => set("animo")(c.v)}
              className={`flex flex-col items-center rounded-xl border py-1.5 transition ${v.animo === c.v ? "border-accent bg-accent/15" : "border-line hover:bg-ink/5"}`}>
              <span className="text-2xl leading-none">{c.e}</span>
              <span className="mt-0.5 text-[10px] text-muted">{c.t}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Escala etiqueta="Stress" valor={v.estres} onChange={set("estres")} bajo="1 low" alto="5 high" />
        <Escala etiqueta="Fatigue" valor={v.fatiga} onChange={set("fatiga")} bajo="1 low" alto="5 high" />
        <Escala etiqueta="Crew" valor={v.tripulacion} onChange={set("tripulacion")} bajo="1 bad" alto="5 very good" />
      </div>
      <div className="space-y-1.5">
        {PREGUNTAS.map((p) => (
          <SiNo key={p.k} texto={p.t} valor={v[p.k]} onChange={set(p.k)} />
        ))}
      </div>
      <div>
        <div className="mb-1.5 text-sm font-medium">Signs of infection <span className="font-normal text-muted">(mark any you have)</span></div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Signs of infection">
          {SINTOMAS.map((x) => {
            const on = v.sintomas.includes(x.k);
            return (
              <button type="button" key={x.k} aria-pressed={on} onClick={() => set("sintomas")(on ? v.sintomas.filter((y) => y !== x.k) : [...v.sintomas, x.k])}
                className={`rounded-full border px-3 py-1 text-sm transition ${on ? "border-warn bg-warn/15 font-semibold text-warn" : "border-line hover:bg-ink/5"}`}>
                {on ? "✓ " : ""}{x.t}
              </button>
            );
          })}
        </div>
      </div>
      {who5Pendiente && (
        <details className="rounded-xl border border-violet/40 p-3" open>
          <summary className="cursor-pointer text-sm font-semibold">WHO-5 well-being · due this week <span className="font-normal text-muted">(0 at no time · 5 all of the time)</span></summary>
          <div className="mt-2"><Cuestionario tipo="who5" compacto onCambio={setWho5} /></div>
        </details>
      )}
      <div className="rounded-xl border border-line p-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={conReaccion} onChange={(e) => setConReaccion(e.target.checked)} className="h-4 w-4" />
          Add quick reaction test (5 tries){reaccion ? ` · ${reaccion} ms` : ""}
        </label>
        {conReaccion && !reaccion && <ReactionTest onDone={(prom) => setReaccion(prom)} />}
      </div>
      <button onClick={guardar} disabled={guardando}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-2.5 font-semibold text-onaccent hover:brightness-110 disabled:opacity-60">
        <Icon name="check" size={18} /> {guardando ? "Saving…" : "Save check-in"}
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
  const txt = { listo: "Tap to start", espera: "Wait…", ya: "Tap now!", pronto: "Too soon. Tap to repeat", fin: "Done!" }[fase];
  const celdas = [["Try", `${Math.min(tiempos.length + (fase === "fin" ? 0 : 1), INTENTOS)} of ${INTENTOS}`], ["Last", `${tiempos.at(-1) ?? "—"} ms`], ["Average", `${prom ?? "—"} ms`]];
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

const CAMPOS_REMED = [["fc", "HR", "bpm"], ["spo2", "SpO₂", "%", 0.1], ["sistolica", "Systolic", "mmHg"], ["diastolica", "Diastolic", "mmHg"]];

export function RemedicionTest({ hoy, onFinish }) {
  const [fase, setFase] = useState("inicio");
  const [seg, setSeg] = useState(300);
  const [despues, setDespues] = useState(null);
  const antes = { fc: hoy.fc, spo2: hoy.spo2, sistolica: hoy.sistolica, diastolica: hoy.diastolica };
  function pasarALectura() {
    setDespues({ fc: hoy.fc ?? "", spo2: hoy.spo2 ?? "", sistolica: hoy.sistolica ?? "", diastolica: hoy.diastolica ?? "" });
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
        <p className="text-sm text-soft">Sit with your back supported, feet on the floor and without talking. When the countdown ends we take a new reading.</p>
        <button onClick={() => setFase("cuenta")} className="w-full rounded-xl bg-accent py-2.5 font-semibold text-onaccent hover:brightness-110">Start re-measurement (5 min)</button>
      </div>
    );
  if (fase === "cuenta")
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="text-5xl font-semibold tabular-nums" aria-live="polite">{Math.floor(seg / 60)}:{String(seg % 60).padStart(2, "0")}</div>
        <div className="h-2 w-full rounded-full bg-ink/10"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(1 - seg / 300) * 100}%` }} /></div>
        <p className="text-sm text-muted">Breathe calmly. Medic takes the reading at the end.</p>
        <button onClick={pasarALectura} className="rounded-xl border border-line px-4 py-2 text-sm hover:bg-ink/5">Skip wait</button>
      </div>
    );
  return (
    <div className="space-y-3">
      <div className="text-xs text-muted">
        Previous reading: HR {antes.fc} · SpO₂ {antes.spo2} % · BP {antes.sistolica}/{antes.diastolica}. Values prefilled; you can edit them.
      </div>
      <CamposLectura valores={despues} onChange={setDespues} campos={CAMPOS_REMED} />
      <button onClick={() => onFinish({ antes, despues })} className="w-full rounded-xl bg-accent py-2.5 font-semibold text-onaccent hover:brightness-110">Save reading</button>
    </div>
  );
}

const PASOS_ORTO = [
  { k: "acostado", t: "Lying down", d: "Lie down for 5 min and take blood pressure and pulse." },
  { k: "min1", t: "Standing · 1 min", d: "Stand up and measure at 1 minute." },
  { k: "min3", t: "Standing · 3 min", d: "Stay standing and measure at 3 minutes." },
];
const CAMPOS_ORTO = [["sistolica", "Systolic", "mmHg"], ["diastolica", "Diastolic", "mmHg"], ["fc", "HR", "bpm"]];

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
      <ol className="flex gap-1.5" aria-label="Test steps">
        {PASOS_ORTO.map((s, i) => (
          <li key={s.k} className={`flex-1 rounded-lg border px-2 py-1.5 text-center text-xs ${i === paso ? "border-accent bg-accent/10 font-semibold text-accent" : i < paso ? "border-ok/50 text-ok" : "border-line text-muted"}`}>
            {i < paso ? "✓ " : `${i + 1}. `}{s.t}
          </li>
        ))}
      </ol>
      <div className="flex items-center gap-2 text-sm text-soft"><Icon name="standing" size={18} className="text-accent" /> {P.d}</div>
      <CamposLectura valores={r[P.k]} onChange={(v) => setR((x) => ({ ...x, [P.k]: v }))} campos={CAMPOS_ORTO} />
      <div className="text-[11px] text-muted">Values prefilled; you can edit them.</div>
      <div className="flex gap-2">
        {paso > 0 && <button onClick={() => setPaso(paso - 1)} className="flex-1 rounded-xl border border-line py-2.5 hover:bg-ink/5">Back</button>}
        {paso < 2 ? (
          <button onClick={() => setPaso(paso + 1)} className="flex-1 rounded-xl bg-accent py-2.5 font-semibold text-onaccent hover:brightness-110">Next</button>
        ) : (
          <button onClick={() => onFinish(r)} className="flex-1 rounded-xl bg-accent py-2.5 font-semibold text-onaccent hover:brightness-110">See result</button>
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
    onFinish({ ...resumenPvt(resp.current), duracion_s: dur, tiempos: resp.current.map((x) => (x.falsa ? "falsa" : x.ms)) });
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
        <p className="text-sm text-soft">For 3 minutes a stimulus will appear every 1 to 4 seconds. Tap the box (or press the space bar) as soon as you see it, without jumping ahead.</p>
        {base ? <div className="text-xs text-muted">Your baseline: median of {Math.round(base)} ms.</div> : null}
        <button onClick={iniciar} className="w-full rounded-xl bg-accent py-2.5 font-semibold text-onaccent hover:brightness-110">Start PVT-B (3 min)</button>
      </div>
    );
  return (
    <div className="space-y-3">
      <button onPointerDown={tocar} onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); tocar(); } }} disabled={fase === "fin"}
        aria-label="Reaction test response area"
        className={`flex h-44 w-full select-none flex-col items-center justify-center rounded-2xl border-4 text-2xl font-bold transition ${estimulo ? "border-accent bg-accent/25 text-accent" : "border-line bg-ink/5 text-muted"}`}>
        {fase === "fin" ? "Done!" : estimulo ? "TAP!" : "Wait…"}
        {ultimo != null && fase !== "fin" && <span className="mt-1 text-sm font-medium">{ultimo === "falsa" ? "False alarm" : `${ultimo} ms`}</span>}
      </button>
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-lg bg-ink/5 p-2"><div className="text-muted">Remaining</div><div className="font-semibold tabular-nums">{Math.floor(restante / 60)}:{String(restante % 60).padStart(2, "0")}</div></div>
        <div className="rounded-lg bg-ink/5 p-2"><div className="text-muted">Responses</div><div className="font-semibold">{n}</div></div>
        <div className="rounded-lg bg-ink/5 p-2"><div className="text-muted">Lapse</div><div className="font-semibold">≥ {P.lapsoMs} ms</div></div>
      </div>
      {fase === "corriendo" && <button onClick={terminar} className="w-full rounded-xl border border-line py-2 text-sm hover:bg-ink/5">Finish early</button>}
    </div>
  );
}

export function AmslerTest({ onFinish }) {
  const [od, setOd] = useState(null);
  const [oi, setOi] = useState(null);
  const lineas = Array.from({ length: 21 }, (_, i) => i * 10);
  return (
    <div className="space-y-3">
      <p className="text-sm text-soft">Put on your glasses if you use them. Cover one eye and stare at the center dot from 30–40 cm. Repeat with the other eye.</p>
      <div className="mx-auto w-full max-w-[260px] rounded-xl bg-white p-2">
        <svg viewBox="0 0 200 200" className="h-auto w-full" role="img" aria-label="Amsler grid">
          {lineas.map((x) => <line key={`v${x}`} x1={x} y1="0" x2={x} y2="200" stroke="#111" strokeWidth="0.7" />)}
          {lineas.map((y) => <line key={`h${y}`} x1="0" y1={y} x2="200" y2={y} stroke="#111" strokeWidth="0.7" />)}
          <circle cx="100" cy="100" r="3" fill="#111" />
        </svg>
      </div>
      <SiNo texto="Right eye: wavy or blurry lines, or missing areas?" valor={od} onChange={setOd} />
      <SiNo texto="Left eye: wavy or blurry lines, or missing areas?" valor={oi} onChange={setOi} />
      <button disabled={od == null || oi == null} onClick={() => onFinish({ od, oi })}
        className="w-full rounded-xl bg-accent py-2.5 font-semibold text-onaccent hover:brightness-110 disabled:opacity-50">Save result</button>
    </div>
  );
}

const MENSAJE_TAMIZAJE = (tipo, r) => {
  const p = r.puntaje;
  if (tipo === "who5") return p <= UMBRALES.who5.atencion ? ["Your well-being is low. I notified the crew physician.", "warn"] : p <= UMBRALES.who5.sugierePhq9 ? ["Thank you. I suggest you answer the PHQ-9.", "warn"] : ["Thank you. Your well-being is in a good range.", "ok"];
  if (tipo === "phq9") return r.item9 > 0 ? ["Thank you for answering honestly. I notified the crew physician right away; you are not alone.", "crit"] : p >= UMBRALES.phq9.atencion ? ["I notified the crew physician to talk with you.", "warn"] : ["Thank you. Your score is in the low range.", "ok"];
  if (tipo === "gad7") return p >= UMBRALES.gad7.atencion ? ["I notified the crew physician to talk with you.", "warn"] : ["Thank you. Your score is in the low range.", "ok"];
  if (tipo === "amsler") return r.od || r.oi ? ["I recorded the distortion. It is combined with your vision questions; if it persists, check it with the physician.", "warn"] : ["No distortion in either eye.", "ok"];
  return ["Done, I recorded your test.", "ok"];
};

export function mensajeDesenlace(desenlace, alerta) {
  if (!desenlace) return "Done, I recorded your test.";
  if (desenlace === "mejoro") {
    if (!alerta) return "Your values are within your range.";
    if (alerta.estado === "critico") return "Your values are back in your range. Because it is a critical alert, the crew physician decides when to close it.";
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
        {onCerrar && <button onClick={onCerrar} aria-label="Close" className="rounded-md p-0.5 text-muted hover:bg-ink/10"><Icon name="x" size={16} /></button>}
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
          mensaje: orto ? "Positive orthostatic test: orthostatic hypotension. Medic notified the crew physician" : `${PRUEBAS[tipo].nombre}: the result got worse. Crew physician notified`,
        });
      }
      const tam = ["who5", "phq9", "gad7", "amsler"].includes(tipo) ? MENSAJE_TAMIZAJE(tipo, r) : null;
      const mensaje = tam ? tam[0] : tipo === "ortostatica" && ev.positiva ? "Positive test (amber): orthostatic hypotension. I notified the crew physician." : mensajeDesenlace(ev.desenlace, alerta);
      const out = { ...ev, tipo, mensaje, tono: tam ? tam[1] : null, alerta: alerta?.motivo || null };
      setRes(out);
      onCompletada?.(out);
    } catch (e) {
      onToast?.("Could not save the test: " + (e.message || e));
    } finally {
      setGuardando(false);
    }
  }

  if (res)
    return (
      <div className="space-y-3">
        {resultadoExterno ? <div className="text-sm text-muted">Test recorded.</div> : <ResultadoMedic res={res} />}
        <button onClick={() => { setRes(null); setN((x) => x + 1); }} className="w-full rounded-xl border border-line py-2 text-sm hover:bg-ink/5">Repeat test</button>
      </div>
    );
  if (guardando) return <div className="py-6 text-center text-muted">Saving…</div>;
  const k = `${tipo}-${n}`;
  if (tipo === "remedicion") return <RemedicionTest key={k} hoy={hoy} onFinish={terminar} />;
  if (tipo === "ortostatica") return <OrtostaticaTest key={k} hoy={hoy} onFinish={terminar} />;
  if (tipo === "reaccion") return <PvtbTest key={k} base={analisis.baselines?.reaccion?.media} onFinish={terminar} />;
  if (tipo === "who5" || tipo === "phq9" || tipo === "gad7") return <Cuestionario key={k} tipo={tipo} onFinish={terminar} />;
  if (tipo === "amsler") return <AmslerTest key={k} onFinish={terminar} />;
  if (tipo === "checkin")
    return <CheckinForm key={k} astronautId={astronautId} inicial={analisis.checkinHoy} onSaved={onToast} who5Pendiente={analisis.tamizaje?.who5Pendiente}
      onResultado={(ev) => setRes({ ...ev, mensaje: "Done, I recorded your check-in." })} />;
  return null;
}
