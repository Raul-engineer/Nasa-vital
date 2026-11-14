"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Shell, Toast, ESTADO, ESTADO_GENERAL, Sparkline } from "@/components/Shell";
import { Icon } from "@/components/Icons";
import BodySilhouette from "@/components/BodySilhouette";
import { BackgroundBeams, CardSpotlight, GlowingEffect } from "@/components/Effects";
import { Barra, EstadoPill, Fuente, MiniCard, Ring, SignoCard, colorIndice, fmtNum } from "@/components/Widgets";
import { TrendChart } from "@/components/Charts";
import { CheckinForm } from "@/components/Pruebas";
import { useAstronautId, useQuickFix } from "@/lib/useQuickFix";
import { diaMision, FUENTES, UMBRALES } from "@/lib/analysis";
import { MEDIC, explicarSigno, mensajeMedic } from "@/lib/medic";
import { confirmarRefugio, resolveAlert } from "@/lib/data";
import { RadiacionCard } from "@/components/Radiacion";

const IZQ = ["fc", "spo2", "temperatura"];
const DER = ["pa", "fr", "estres"];
const TABS = [["fc", "FC"], ["spo2", "SpO₂"], ["pa", "PA"], ["fr", "FR"], ["temperatura", "Temp"], ["estres", "Estrés"]];
const RIESGO = { alto: "critico", moderado: "atencion", bajo: "normal" };

function useEsAncho(q = "(min-width: 1024px)") {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(q);
    const f = () => setOk(m.matches);
    f();
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, [q]);
  return ok;
}

export default function Inicio() {
  const [aid, setAid] = useAstronautId();
  const { data, analisis, loading, error } = useQuickFix(aid);
  const ancho = useEsAncho();
  const [sel, setSel] = useState("fc");
  const [burbuja, setBurbuja] = useState(false);
  const [toast, setToast] = useState(null);
  const [planAjustado, setPlanAjustado] = useState({});
  const [preguntaOculta, setPreguntaOculta] = useState({});
  const closeToast = useCallback(() => setToast(null), []);

  if (error)
    return <div className="p-10 text-crit">No se pudieron cargar los datos: {error}. Revisa tus variables de Supabase en .env.local (o bórralas para usar datos locales).</div>;
  if (loading || !analisis) return <div className="flex min-h-screen items-center justify-center text-muted">Cargando QuickFix…</div>;

  const { astronaut, astronauts, vitals, protocols, profile } = data;
  const S = analisis.signos;
  const sg = S[sel];
  const prep = analisis.preparacion;
  const colorPrep = colorIndice(prep.total, analisis.hayCritico);
  const plan = !!planAjustado[aid];
  const medic = mensajeMedic(analisis, astronaut, { planAjustado: plan, protocols, alergias: profile?.alergias });
  const pregunta = !preguntaOculta[aid] && medic.pregunta;
  const critica = analisis.activas.find((a) => a.estado === "critico" && a.clave !== "radiacion_tormenta");
  const q = `?a=${aid}`;
  const eg = analisis.general;
  const n2 = analisis.news2;

  const elegir = (k) => {
    setSel(k);
    setBurbuja(true);
  };

  const ult = vitals.slice(-7);
  const off = sg.serie.length - ult.length;
  const datos = ult.map((v, i) => ({ dia: `D${diaMision(astronaut, v.fecha)}`, v: sg.serie[off + i], v2: sg.serie2 ? sg.serie2[off + i] : undefined }));
  const series = sg.serie2
    ? [{ key: "v", nombre: "Sistólica", color: "violet" }, { key: "v2", nombre: "Diastólica", color: "pink", tipo: "line" }]
    : [{ key: "v", nombre: sg.corto, color: "violet" }];
  const banda = sg.base?.n >= 7 ? [Math.round(sg.base.min * 10) / 10, Math.round(sg.base.max * 10) / 10] : null;

  async function accionMedic(si) {
    if (!si) return setPreguntaOculta((p) => ({ ...p, [aid]: true }));
    if (medic.accion === "plan") {
      setPlanAjustado((p) => ({ ...p, [aid]: true }));
      setToast("Plan ajustado: bloque de sueño 22:00–06:00 agendado y ejercicio cambiado a intensidad moderada por 48 h.");
    } else if (medic.accion === "checkin") document.getElementById("checkin")?.scrollIntoView({ behavior: "smooth", block: "center" });
    else if (medic.accion === "refugio") {
      await confirmarRefugio(aid);
      setToast("Refugio confirmado. Tu tasa de dosis baja a la mitad por el blindaje.");
    }
  }

  async function atenderCritica() {
    if (!critica?.alertaId) return;
    await resolveAlert(critica.alertaId);
    setToast(critica.sistema === "radiacion" ? "Registrado: estás en el refugio. Dosis personal en seguimiento." : "Alerta marcada como atendida por el médico de tripulación.");
  }

  const acciones = plan && medic.alerta ? ["Bloque de sueño 22:00 – 06:00 agendado", ...medic.acciones].slice(0, 3) : medic.acciones;

  return (
    <Shell active="/" astronaut={astronaut} astronauts={astronauts} onAstronaut={setAid} astronautId={aid} analisis={analisis}>
      {critica && (
        <div role="alert" className="card glow-crit mb-5 flex flex-wrap items-center gap-4 border-crit/60 bg-crit/10 px-5 py-4">
          <span className="text-crit"><Icon name={critica.sistema === "radiacion" ? "rad" : "alert"} size={34} /></span>
          <div className="min-w-0 flex-1">
            <div className="text-lg font-semibold text-crit">{critica.motivo}</div>
            {medic.alerta === critica && medic.acciones.length > 0 && <div className="text-sm text-soft">{medic.acciones.join(" · ")}</div>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/analisis${q}&al=${encodeURIComponent(critica.id)}`} className="rounded-xl border border-crit/60 px-4 py-2.5 text-sm font-semibold text-crit hover:bg-crit/10">
              Ver plan
            </Link>
            {critica.alertaId && (
              <button onClick={atenderCritica} className="rounded-xl bg-crit px-5 py-2.5 font-semibold text-[#2a0909]">
                {critica.sistema === "radiacion" ? "Estoy en el refugio" : "Marcar como atendida"}
              </button>
            )}
          </div>
        </div>
      )}

      <section className="card relative p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Conoce tu cuerpo</h1>
            <p className="text-sm text-muted">Toca una zona del cuerpo o una tarjeta para que Medic te explique ese signo.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-muted">Estado general</div>
              <div className={`text-xl font-semibold ${ESTADO[eg].color}`}>{ESTADO_GENERAL[eg]}</div>
            </div>
            <div className="rounded-xl border border-line px-3 py-1.5 text-right">
              <div className="text-xs text-muted">NEWS2</div>
              <div className={`text-sm font-semibold ${ESTADO[n2.nivel.estado].color}`}>{n2.total} · {n2.nivel.txt}</div>
            </div>
            <div className="rounded-xl border border-line px-3 py-1.5 text-right">
              <div className="text-xs text-muted">Alertas</div>
              <div className="text-sm font-semibold">{analisis.activas.length ? `${analisis.activas.length} activa(s)` : "Ninguna"}</div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(220px,260px)_minmax(0,1fr)_minmax(220px,260px)] lg:grid-rows-[560px]">
          <div className="order-2 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:order-1 lg:h-full lg:grid-cols-1 lg:grid-rows-3">
            {IZQ.map((k) => <SignoCard key={k} sg={S[k]} activo={burbuja && sel === k} onClick={() => elegir(k)} />)}
          </div>

          <div className="relative isolate order-1 h-[440px] min-h-0 sm:h-[500px] lg:order-2 lg:h-full">
            <BackgroundBeams count={8} className="-z-10 opacity-30" />
            <BodySilhouette
              aura={analisis.radiacion.activo ? "critico" : analisis.sistemas.radiacion.estado}
              puntos={[...IZQ, ...DER].map((k) => ({ k, estado: S[k].estado, fuera: S[k].fuera, nombre: S[k].nombre }))}
              seleccionado={burbuja ? sel : null}
              onSelect={elegir}
              conectores={ancho ? { izq: IZQ, der: DER } : null}
            />
            {burbuja && sg && (
              <div role="dialog" aria-label={`Medic explica ${sg.nombre}`} className="card absolute bottom-2 left-1/2 z-10 w-[min(94%,380px)] -translate-x-1/2 p-3.5 glow-accent">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent"><Icon name="medic" size={20} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-accent">Medic · {sg.nombre}</div>
                      <button onClick={() => setBurbuja(false)} aria-label="Cerrar" className="rounded-md p-0.5 text-muted hover:bg-ink/10"><Icon name="x" size={16} /></button>
                    </div>
                    <p className="mt-1 text-sm leading-snug">{explicarSigno(sg)}</p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <Link href={`/analisis${q}&s=${sg.sistema}&m=${sg.k}`} className="text-sm font-semibold text-accent hover:underline">Ver su análisis →</Link>
                      <Fuente ids={sg.fuente} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="order-3 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:h-full lg:grid-cols-1 lg:grid-rows-3">
            {DER.map((k) => <SignoCard key={k} sg={S[k]} activo={burbuja && sel === k} onClick={() => elegir(k)} />)}
          </div>
        </div>
      </section>

      <section className="card mt-5 p-4 sm:p-5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Ritmo del día</h2>
            <p className="text-xs text-muted">Últimos 7 días · la banda verde es tu línea base personal</p>
          </div>
          <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-xl border border-line p-1" role="tablist">
            {TABS.map(([k, t]) => (
              <button key={k} role="tab" aria-selected={sel === k} onClick={() => setSel(k)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-sm transition ${sel === k ? "bg-accent/15 font-semibold text-accent" : "text-soft hover:bg-ink/5"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <TrendChart datos={datos} series={series} banda={banda} bandaTxt={banda ? "Tu línea base" : null} unidad={sg.unidad} dec={sg.dec} alto={220} />
        <Fuente className="mt-1" ids={sg.fuente} extra={`rango normal ${sg.rango} ${sg.unidad}`} />
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section id="checkin" className="card p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <Icon name="clipboard" className="text-accent" />
            <h2 className="text-lg font-semibold">¿Cómo te sientes hoy?</h2>
          </div>
          <CheckinForm astronautId={aid} inicial={analisis.checkinHoy} onSaved={setToast} who5Pendiente={analisis.tamizaje.who5Pendiente} />
          <Fuente className="mt-2" ids={`${FUENTES.checkin},${FUENTES.news2},${FUENTES.who5}`} />
        </section>

        <CardSpotlight className={`card p-4 sm:p-5 ${medic.critico ? "glow-crit" : "glow-accent"}`}>
          <GlowingEffect />
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent glow-accent"><Icon name="medic" size={28} /></div>
            <div>
              <h2 className="text-lg font-semibold text-accent">{MEDIC.nombre}</h2>
              <div className="text-xs text-muted">{MEDIC.aviso}</div>
            </div>
          </div>
          <div className="mt-3 rounded-2xl rounded-tl-sm border border-line bg-ink/[0.04] p-4 text-[15px] leading-relaxed">
            {medic.texto}
            {pregunta && <div className="mt-2 font-medium">{pregunta}</div>}
          </div>
          {acciones.length > 0 && (
            <div className="mt-3">
              <div className="mb-1.5 text-xs uppercase tracking-widest text-muted">Para hoy</div>
              <ul className="space-y-1.5">
                {acciones.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className={plan && i === 0 && medic.alerta ? "text-ok" : "text-accent"}><Icon name={plan && i === 0 && medic.alerta ? "check" : "sparkle"} size={18} /></span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {analisis.sugerencias.length > 0 && (
            <ul className="mt-2 space-y-1">
              {analisis.sugerencias.map((s, i) => (
                <li key={i} className="text-sm"><Link href={`${s.href}${s.href.includes("?") ? "&" : "?"}a=${aid}`} className="text-accent hover:underline">{s.texto}</Link></li>
              ))}
            </ul>
          )}
          {medic.alerta && <Fuente className="mt-2" ids={medic.alerta.fuente} />}
          {medic.omitidas?.length > 0 && (
            <div className="mt-2 text-xs text-warn">Omití {medic.omitidas.length} recomendación(es) por tu alergia a {[...new Set(medic.omitidas.map((o) => o.sustancia))].join(", ")}.</div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {pregunta && (
              <>
                <button onClick={() => accionMedic(true)} className="flex-1 rounded-xl bg-accent px-4 py-2.5 font-semibold text-onaccent hover:brightness-110">
                  {medic.accion === "plan" ? "Sí, ajústalo" : medic.accion === "checkin" ? "Sí, empecemos" : "Sí, ya estoy en refugio"}
                </button>
                <button onClick={() => accionMedic(false)} className="flex-1 rounded-xl border border-line px-4 py-2.5 hover:bg-ink/5">Más tarde</button>
              </>
            )}
            <Link href={`/analisis${q}${medic.alerta ? `&al=${encodeURIComponent(medic.alerta.id)}` : ""}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-accent/50 py-2.5 text-accent hover:bg-accent/10">
              Ver plan completo <Icon name="chev" size={16} />
            </Link>
          </div>
        </CardSpotlight>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MiniCard titulo="Índice de preparación" icono="target" fuente="Índice orientativo del equipo (no es una autorización médica)">
          <div className="flex items-center gap-3">
            <Ring value={prep.total} color={colorPrep} size={84} stroke={9}>
              <div className="text-2xl font-bold">{prep.total}</div>
            </Ring>
            <div className="min-w-0">
              <div className="text-sm font-semibold leading-tight" style={{ color: colorPrep }}>{prep.etiqueta}</div>
              <div className="mt-1 text-[11px] leading-snug text-muted">
                Cognitivo {prep.componentes.cognitivo.puntos} · Físico {prep.componentes.fisico.puntos} · Recuperación {prep.componentes.recuperacion.puntos} · Estrés {prep.componentes.estres.puntos} (de 25)
              </div>
            </div>
          </div>
        </MiniCard>

        <MiniCard titulo="Sueño de anoche" icono="moon" fuente="aasm,pvtb">
          <div className="flex items-end justify-between gap-2">
            <div>
              <span className="text-3xl font-semibold">{fmtNum(analisis.sistemas.sueno.valor, 1)}</span> <span className="text-sm text-muted">h</span>
              <div className="text-[11px] text-muted">Promedio 7 días: {fmtNum(analisis.sistemas.sueno.extra.prom7, 1)} h</div>
            </div>
            <Sparkline data={analisis.sistemas.sueno.serie.slice(-7)} color={ESTADO[analisis.sistemas.sueno.estado].hex} w={64} h={28} />
          </div>
          <EstadoPill estado={analisis.sistemas.sueno.estado} className="mt-2">
            {analisis.sistemas.sueno.rachaDias >= UMBRALES.rachaSueno ? `${analisis.sistemas.sueno.rachaDias} noches < 7 h` : "7 h o más"}
          </EstadoPill>
        </MiniCard>

        <RadiacionCard radiacion={analisis.radiacion} estado={analisis.sistemas.radiacion.estado} />

        <MiniCard titulo="Ejercicio de hoy" icono="dumbbell" fuente="Meta de 90 min de resistencia (regla provisional del equipo)">
          <div>
            <span className="text-3xl font-semibold">{fmtNum(analisis.sistemas.hueso_musculo.valor)}</span> <span className="text-sm text-muted">/ {UMBRALES.ejercicioMinMin} min</span>
          </div>
          <div className="mt-2">
            <Barra pct={analisis.sistemas.hueso_musculo.valor / UMBRALES.ejercicioMinMin} color={ESTADO[analisis.sistemas.hueso_musculo.estado].hex} />
          </div>
          <div className="mt-1.5 text-[11px] text-muted">Promedio 7 días: {fmtNum(analisis.sistemas.hueso_musculo.extra.prom7)} min</div>
        </MiniCard>

        <MiniCard titulo="Alergias activas" icono="shield" accion={<Link href={`/perfil${q}`} className="text-xs text-accent hover:underline">Editar</Link>}>
          {profile?.alergias?.length ? (
            <ul className="space-y-1.5">
              {profile.alergias.map((a, i) => (
                <li key={i} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0">
                    <span className="font-medium">{a.sustancia}</span>
                    <span className="block truncate text-[11px] text-muted">{a.reaccion}</span>
                  </span>
                  <EstadoPill estado={RIESGO[a.riesgo] || "atencion"}>Riesgo {a.riesgo}</EstadoPill>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-muted">Sin alergias registradas.</div>
          )}
        </MiniCard>
      </div>

      <Toast msg={toast} onClose={closeToast} />
    </Shell>
  );
}
