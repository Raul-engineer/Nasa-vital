"use client";
import { useCallback, useEffect, useState } from "react";
import { EncabezadoPagina, Shell, Toast } from "@/components/Shell";
import { Icon } from "@/components/Icons";
import CyberButton from "@/components/CyberButton";
import AstronautCard from "@/components/AstronautCard";
import { Barra, Fuente, fmtNum } from "@/components/Widgets";
import { useAstronautId, useQuickFix } from "@/lib/useQuickFix";
import { saveProfile } from "@/lib/data";
import { FUENTES, UMBRALES } from "@/lib/analysis";

const SANGRE = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
const SEXO = ["Female", "Male", "Other"];
const RIESGOS = ["bajo", "moderado", "alto"];
const RIESGO_TXT = { bajo: "low", moderado: "moderate", alto: "high" };
const NUM = {
  edad: [18, 80, "years"], peso_kg: [30, 200, "kg"], estatura_cm: [120, 220, "cm"], fc_basal: [30, 120, "bpm"], spo2_basal: [80, 100, "%"],
  dosis_carrera_previa_msv: [0, 600, "mSv"], misiones_previas: [0, 20, ""], dias_espacio_previos: [0, 2000, "days"], ejercicio_prescrito_min: [30, 300, "min"],
};

function aForm(p = {}) {
  return {
    edad: p.edad ?? "", sexo: p.sexo ?? "", peso_kg: p.peso_kg ?? "", estatura_cm: p.estatura_cm ?? "", tipo_sangre: p.tipo_sangre ?? "",
    alergias: (p.alergias || []).map((a) => ({ sustancia: a.sustancia || "", reaccion: a.reaccion || "", riesgo: a.riesgo || "moderado" })),
    medicamentos: (p.medicamentos || []).join("\n"), condiciones_cronicas: (p.condiciones_cronicas || []).join("\n"),
    fc_basal: p.fc_basal ?? "", pa_basal: p.pa_basal ?? "", spo2_basal: p.spo2_basal ?? "",
    dosis_carrera_previa_msv: p.dosis_carrera_previa_msv ?? 0, misiones_previas: p.misiones_previas ?? 0, dias_espacio_previos: p.dias_espacio_previos ?? 0,
    usa_lentes: !!p.usa_lentes, ejercicio_prescrito_min: p.ejercicio_prescrito_min ?? 120,
    contacto_emergencia: { nombre: p.contacto_emergencia?.nombre || "", relacion: p.contacto_emergencia?.relacion || "", telefono: p.contacto_emergencia?.telefono || "" },
  };
}

function validar(f) {
  const e = {};
  for (const [k, [min, max]] of Object.entries(NUM)) {
    if (f[k] === "" || f[k] == null) {
      if (["edad", "peso_kg", "estatura_cm"].includes(k)) e[k] = "Required";
      continue;
    }
    const v = Number(f[k]);
    if (!Number.isFinite(v) || v < min || v > max) e[k] = `Between ${min} and ${max}`;
  }
  if (!f.sexo) e.sexo = "Required";
  if (!f.tipo_sangre) e.tipo_sangre = "Required";
  if (f.pa_basal && !/^\d{2,3}\/\d{2,3}$/.test(String(f.pa_basal).trim())) e.pa_basal = "Format 120/80";
  f.alergias.forEach((a, i) => {
    if (!a.sustancia.trim()) e[`alergia-${i}`] = "Enter the substance";
  });
  if (f.contacto_emergencia.telefono && !/^[+\d][\d\s-]{6,}$/.test(f.contacto_emergencia.telefono)) e.telefono = "Invalid phone number";
  return e;
}

function aPerfil(f) {
  const n = (v) => (v === "" || v == null ? null : Number(v));
  return {
    edad: n(f.edad), sexo: f.sexo, peso_kg: n(f.peso_kg), estatura_cm: n(f.estatura_cm), tipo_sangre: f.tipo_sangre,
    alergias: f.alergias.map((a) => ({ sustancia: a.sustancia.trim(), reaccion: a.reaccion.trim(), riesgo: a.riesgo })),
    medicamentos: f.medicamentos.split("\n").map((x) => x.trim()).filter(Boolean),
    condiciones_cronicas: f.condiciones_cronicas.split("\n").map((x) => x.trim()).filter(Boolean),
    fc_basal: n(f.fc_basal), pa_basal: String(f.pa_basal).trim() || null, spo2_basal: n(f.spo2_basal),
    dosis_carrera_previa_msv: n(f.dosis_carrera_previa_msv) || 0, misiones_previas: n(f.misiones_previas) || 0, dias_espacio_previos: n(f.dias_espacio_previos) || 0,
    usa_lentes: !!f.usa_lentes, ejercicio_prescrito_min: n(f.ejercicio_prescrito_min) || 120,
    contacto_emergencia: { ...f.contacto_emergencia },
  };
}

function Grupo({ titulo, icono, children, className = "" }) {
  return (
    <fieldset className={`card p-5 ${className}`}>
      <legend className="sr-only">{titulo}</legend>
      <div className="mb-3 flex items-center gap-2 font-semibold"><Icon name={icono} size={18} className="text-accent" /> {titulo}</div>
      {children}
    </fieldset>
  );
}

function Campo({ label, error, children, hint }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs text-muted">{label}</span>
      {children}
      {error ? <span className="mt-0.5 block text-xs text-crit">{error}</span> : hint ? <span className="mt-0.5 block text-[11px] text-muted">{hint}</span> : null}
    </label>
  );
}

export default function Perfil() {
  const [aid, setAid] = useAstronautId();
  const { data, analisis, loading, error } = useQuickFix(aid);
  const [f, setF] = useState(null);
  const [errores, setErrores] = useState({});
  const [sucio, setSucio] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState(null);
  const closeToast = useCallback(() => setToast(null), []);
  const firma = data ? JSON.stringify(data.profile) : null;

  useEffect(() => {
    setSucio(false);
    setErrores({});
  }, [aid]);
  useEffect(() => {
    if (firma && !sucio) setF(aForm(JSON.parse(firma)));
  }, [firma, sucio]);

  if (error) return <div className="p-10 text-crit">No se pudieron cargar los datos: {error}</div>;
  if (loading || !analisis || !f) return <div className="flex min-h-screen items-center justify-center text-muted">Loading profile…</div>;

  const { astronaut, astronauts } = data;
  const set = (k, v) => {
    setF((s) => ({ ...s, [k]: v }));
    setSucio(true);
  };
  const setAlergia = (i, k, v) => set("alergias", f.alergias.map((a, j) => (j === i ? { ...a, [k]: v } : a)));
  const err = (k) => errores[k];
  const cls = (k) => `campo ${err(k) ? "campo-error" : ""}`;
  const imc = Number(f.peso_kg) && Number(f.estatura_cm) ? Number(f.peso_kg) / (Number(f.estatura_cm) / 100) ** 2 : null;
  const carrera = analisis.radiacion.mision + (Number(f.dosis_carrera_previa_msv) || 0);
  const pct = carrera / UMBRALES.radiacion.limiteCarrera;
  const estadoRad = pct > UMBRALES.radiacion.atencionPct ? "var(--color-warn)" : "var(--color-ok)";

  async function guardar(e) {
    e.preventDefault();
    const v = validar(f);
    setErrores(v);
    if (Object.keys(v).length) {
      setToast("Check the fields marked in red.");
      return;
    }
    setGuardando(true);
    try {
      await saveProfile(aid, aPerfil(f));
      setSucio(false);
      setToast("Profile saved. Medic recalculated your radiation dose and reviewed your allergies.");
    } catch (x) {
      setToast("Could not save: " + (x.message || x));
    } finally {
      setGuardando(false);
    }
  }
  const num = (k, extra = {}) => (
    <input type="number" inputMode="decimal" value={f[k]} onChange={(e) => set(k, e.target.value)} className={cls(k)} aria-invalid={!!err(k)} {...extra} />
  );

  return (
    <Shell active="/perfil" astronaut={astronaut} astronauts={astronauts} onAstronaut={setAid} astronautId={aid} analisis={analisis}>
      <EncabezadoPagina titulo="Profile" sub={`${astronaut.nombre} · ${astronaut.rol}`}
        derecha={<span role="note" className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3.5 py-2 text-xs text-[#c9d2ff]"><Icon name="shield" size={15} /> Confidential · only you and your crew physician</span>} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <AstronautCard astronaut={astronaut} profile={aPerfil(f)} />
          <div className="card p-5">
            <div className="mb-2 font-semibold">How your profile affects the engine</div>
            <div className="text-sm text-soft">Career dose with this data</div>
            <div className="mt-1">
              <span className="text-2xl font-semibold">{fmtNum(carrera)}</span> <span className="text-sm text-muted">/ {UMBRALES.radiacion.limiteCarrera} mSv · {Math.round(pct * 100)} %</span>
            </div>
            <div className="mt-2"><Barra pct={pct} marca={UMBRALES.radiacion.atencionPct} color={estadoRad} /></div>
            <div className="mt-1 text-[11px] text-muted">Previous {fmtNum(Number(f.dosis_carrera_previa_msv) || 0)} + current mission {fmtNum(analisis.radiacion.mision)} mSv. Attention at 80 %.</div>
            <div className="mt-3 text-sm text-soft">Calculated BMI</div>
            <div className="text-2xl font-semibold">{imc ? fmtNum(imc, 1) : "—"} <span className="text-sm font-normal text-muted">kg/m²</span></div>
            <div className="mt-3 text-sm text-soft">Medic will not recommend anything that contains: <span className="font-medium text-fg">{f.alergias.filter((a) => a.sustancia).map((a) => a.sustancia).join(", ") || "—"}</span></div>
            <Fuente className="mt-2" ids={FUENTES.radiacion} />
          </div>
        </div>

        <form onSubmit={guardar} noValidate className="grid gap-5 xl:grid-cols-2">
          <Grupo titulo="General details" icono="user">
            <div className="grid grid-cols-3 gap-3">
              <Campo label="Age" error={err("edad")}>{num("edad", { min: 18, max: 80 })}</Campo>
              <Campo label="Sex" error={err("sexo")}>
                <select value={f.sexo} onChange={(e) => set("sexo", e.target.value)} className={cls("sexo")}>
                  <option value="" className="bg-panel">—</option>
                  {SEXO.map((s) => <option key={s} className="bg-panel">{s}</option>)}
                </select>
              </Campo>
              <Campo label="Blood type" error={err("tipo_sangre")}>
                <select value={f.tipo_sangre} onChange={(e) => set("tipo_sangre", e.target.value)} className={cls("tipo_sangre")}>
                  <option value="" className="bg-panel">—</option>
                  {SANGRE.map((s) => <option key={s} className="bg-panel">{s}</option>)}
                </select>
              </Campo>
            </div>
          </Grupo>

          <Grupo titulo="Measurements" icono="scale">
            <div className="grid grid-cols-3 gap-3">
              <Campo label="Weight (kg)" error={err("peso_kg")}>{num("peso_kg", { step: 0.1 })}</Campo>
              <Campo label="Height (cm)" error={err("estatura_cm")}>{num("estatura_cm")}</Campo>
              <Campo label="BMI">
                <div className="campo bg-transparent font-semibold">{imc ? fmtNum(imc, 1) : "—"}</div>
              </Campo>
            </div>
            <div className="mt-3">
              <Campo label="Prescribed exercise (min/day)" error={err("ejercicio_prescrito_min")} hint="Strength + cardio. Used in the Bones and muscles card">{num("ejercicio_prescrito_min")}</Campo>
            </div>
          </Grupo>

          <Grupo titulo="Allergies" icono="shield" className="xl:col-span-2">
            <div className="space-y-2">
              {f.alergias.length === 0 && <div className="text-sm text-muted">No allergies recorded.</div>}
              {f.alergias.map((a, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_120px_auto] items-start gap-2">
                  <Campo label={i === 0 ? "Substance" : ""} error={err(`alergia-${i}`)}>
                    <input value={a.sustancia} onChange={(e) => setAlergia(i, "sustancia", e.target.value)} className={cls(`alergia-${i}`)} placeholder="E.g. penicillin" />
                  </Campo>
                  <Campo label={i === 0 ? "Reaction" : ""}>
                    <input value={a.reaccion} onChange={(e) => setAlergia(i, "reaccion", e.target.value)} className="campo" placeholder="E.g. hives" />
                  </Campo>
                  <Campo label={i === 0 ? "Risk" : ""}>
                    <select value={a.riesgo} onChange={(e) => setAlergia(i, "riesgo", e.target.value)} className="campo">
                      {RIESGOS.map((r) => <option key={r} value={r} className="bg-panel">{RIESGO_TXT[r]}</option>)}
                    </select>
                  </Campo>
                  <button type="button" onClick={() => set("alergias", f.alergias.filter((_, j) => j !== i))} aria-label={`Remove ${a.sustancia || "allergy"}`}
                    className={`rounded-lg border border-line p-2 text-muted hover:bg-crit/10 hover:text-crit ${i === 0 ? "mt-5" : ""}`}>
                    <Icon name="x" size={16} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => set("alergias", [...f.alergias, { sustancia: "", reaccion: "", riesgo: "moderado" }])}
                className="rounded-xl border border-dashed border-accent/60 px-4 py-2 text-sm text-accent hover:bg-accent/10">+ Add allergy</button>
            </div>
          </Grupo>

          <Grupo titulo="Medications and conditions" icono="pill">
            <div className="grid gap-3">
              <Campo label="Medications (one per line)">
                <textarea rows={3} value={f.medicamentos} onChange={(e) => set("medicamentos", e.target.value)} className="campo" />
              </Campo>
              <Campo label="Chronic conditions (one per line)">
                <textarea rows={3} value={f.condiciones_cronicas} onChange={(e) => set("condiciones_cronicas", e.target.value)} className="campo" />
              </Campo>
            </div>
          </Grupo>

          <Grupo titulo="Preflight baseline values" icono="heart">
            <div className="grid grid-cols-3 gap-3">
              <Campo label="Baseline HR (bpm)" error={err("fc_basal")}>{num("fc_basal")}</Campo>
              <Campo label="Baseline BP" error={err("pa_basal")} hint="E.g. 115/75">
                <input value={f.pa_basal} onChange={(e) => set("pa_basal", e.target.value)} className={cls("pa_basal")} placeholder="120/80" />
              </Campo>
              <Campo label="Baseline SpO₂ (%)" error={err("spo2_basal")}>{num("spo2_basal", { step: 0.1 })}</Campo>
            </div>
          </Grupo>

          <Grupo titulo="Spaceflight history" icono="rad">
            <div className="grid grid-cols-3 gap-3">
              <Campo label="Previous missions" error={err("misiones_previas")}>{num("misiones_previas")}</Campo>
              <Campo label="Days in space" error={err("dias_espacio_previos")}>{num("dias_espacio_previos")}</Campo>
              <Campo label="Previous dose (mSv)" error={err("dosis_carrera_previa_msv")} hint="Added to the radiation calculation">{num("dosis_carrera_previa_msv", { step: 0.1 })}</Campo>
            </div>
          </Grupo>

          <Grupo titulo="Vision" icono="eye">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2 text-sm">
              <span>Do you wear glasses or contact lenses?</span>
              <div className="flex overflow-hidden rounded-lg border border-line" role="radiogroup" aria-label="Wears glasses">
                {[["No", false], ["Yes", true]].map(([t, b]) => (
                  <button type="button" key={t} role="radio" aria-checked={f.usa_lentes === b} onClick={() => set("usa_lentes", b)}
                    className={`px-3 py-1 font-medium ${f.usa_lentes === b ? "bg-accent/15 text-accent" : "hover:bg-ink/5"}`}>{t}</button>
                ))}
              </div>
            </div>
            <div className="mt-2 text-[11px] text-muted">Relevant for monitoring vision changes in flight ({FUENTES.sans}).</div>
          </Grupo>

          <Grupo titulo="Emergency contact" icono="user">
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Name">
                <input value={f.contacto_emergencia.nombre} onChange={(e) => set("contacto_emergencia", { ...f.contacto_emergencia, nombre: e.target.value })} className="campo" />
              </Campo>
              <Campo label="Relationship">
                <input value={f.contacto_emergencia.relacion} onChange={(e) => set("contacto_emergencia", { ...f.contacto_emergencia, relacion: e.target.value })} className="campo" />
              </Campo>
              <div className="col-span-2">
              <Campo label="Phone" error={err("telefono")}>
                <input value={f.contacto_emergencia.telefono} onChange={(e) => set("contacto_emergencia", { ...f.contacto_emergencia, telefono: e.target.value })} className={cls("telefono")} inputMode="tel" />
              </Campo>
              </div>
            </div>
          </Grupo>

          <div className="card sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 p-4 xl:col-span-2">
            <span className={`text-sm ${sucio ? "text-warn" : "text-muted"}`}>{sucio ? "You have unsaved changes." : "All saved."}</span>
            <div className="flex gap-2">
              {sucio && (
                <button type="button" onClick={() => { setSucio(false); setErrores({}); setF(aForm(data.profile)); }} className="rounded-xl border border-line px-4 py-2.5 hover:bg-ink/5">
                  Discard
                </button>
              )}
              <CyberButton type="submit" disabled={guardando || !sucio} atajo="↵" texto={guardando ? "Saving…" : "Save profile"}>
                {guardando ? "Saving…" : "Save profile"}
              </CyberButton>
            </div>
          </div>
        </form>
      </div>
      <Toast msg={toast} onClose={closeToast} />
    </Shell>
  );
}
