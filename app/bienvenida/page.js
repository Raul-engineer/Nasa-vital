"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogoCompleto } from "@/components/Marca";
import { BackgroundBeams, GlowingEffect } from "@/components/Effects";
import { loadData } from "@/lib/data";
import { colorIndice } from "@/components/Widgets";
import { analizar } from "@/lib/analysis";

function colorDe(a) {
  return colorIndice(a.prep.total, a.hayCritico);
}

export default function Bienvenida() {
  const router = useRouter();
  const [lista, setLista] = useState(null);
  const [error, setError] = useState(null);
  const [sel, setSel] = useState(1);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const base = await loadData(1);
      const out = await Promise.all(
        base.astronauts.map(async (a) => {
          const d = a.id === base.astronaut.id ? base : await loadData(a.id);
          const an = analizar(d);
          return { ...a, prep: an.preparacion, hayCritico: an.hayCritico, alertas: an.activas.length };
        })
      );
      if (vivo) setLista(out);
    })().catch((e) => vivo && setError(e.message || String(e)));
    return () => {
      vivo = false;
    };
  }, []);

  const entrar = () => router.push(`/?a=${sel}`);

  return (
    <div className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10">
      <BackgroundBeams className="-z-10 opacity-60" />
      <div className="flex flex-col items-center text-center">
        <h1 className="sr-only">QuickFix · Another successful procedure</h1>
        <LogoCompleto alto={90} />
        <p className="mt-6 max-w-md text-[15px] leading-relaxed text-soft">
          Tu compañero de salud para misiones de larga duración. Revisa tu cuerpo, actúa a tiempo y cuídate.
        </p>
      </div>

      <div className="mt-10 w-full max-w-3xl">
        <div className="mb-3 text-center text-sm uppercase tracking-widest text-muted">Elige tu perfil de tripulación</div>
        {error && <div className="text-center text-crit">No se pudieron cargar los perfiles: {error}</div>}
        {!lista && !error && <div className="text-center text-muted">Cargando tripulación…</div>}
        {lista && (
          <div className="grid gap-4 sm:grid-cols-3">
            {lista.map((a) => {
              const activo = a.id === sel;
              const col = colorDe(a);
              return (
                <button
                  key={a.id}
                  onClick={() => setSel(a.id)}
                  onDoubleClick={entrar}
                  aria-pressed={activo}
                  className={`card relative flex flex-col items-start gap-3 p-5 text-left transition ${activo ? "glow-accent bg-accent/5" : "hover:bg-ink/5"}`}
                >
                  <GlowingEffect />
                  <div className="h-11 w-11 rounded-full bg-[radial-gradient(circle_at_35%_35%,#7dd3fc,#4f46e5_55%,#1e1b4b)]" />
                  <div>
                    <div className="font-semibold">{a.nombre}</div>
                    <div className="text-xs text-muted">{a.rol}</div>
                  </div>
                  <div className="flex w-full items-end justify-between">
                    <div className="text-xs text-muted">
                      Día {a.dia_mision} / 500
                      <div>{a.alertas ? `${a.alertas} alerta(s) activa(s)` : "Sin alertas"}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold leading-none" style={{ color: col }}>{a.prep.total}</div>
                      <div className="text-[11px]" style={{ color: col }}>{a.prep.etiqueta}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={entrar}
          disabled={!lista}
          className="rounded-xl bg-accent px-8 py-3 font-semibold text-onaccent hover:brightness-110 disabled:opacity-40"
        >
          Entrar a Mi salud
        </button>
        <Link href={`/reloj?a=${sel}`} className="rounded-xl border border-line px-6 py-3 hover:bg-ink/5">
          Abrir reloj
        </Link>
        <Link href="/acceso" className="rounded-xl border border-line px-6 py-3 hover:bg-ink/5">
          Iniciar sesión
        </Link>
      </div>
      <div className="mt-6 text-xs text-muted">El índice de preparación es orientativo, no una autorización médica.</div>
    </div>
  );
}
