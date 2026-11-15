"use client";
import { Card3D, Layer } from "./Effects";
import { LogoIcono } from "./Marca";

const ESTRELLAS = [
  [8, 14], [22, 40], [35, 10], [48, 28], [62, 8], [74, 34], [88, 18], [14, 62], [30, 78], [56, 52], [70, 66], [92, 48], [40, 90], [80, 86],
];
const CIELO = ESTRELLAS.map(([x, y], i) => `radial-gradient(${i % 3 ? 1 : 1.6}px ${i % 3 ? 1 : 1.6}px at ${x}% ${y}%, rgba(255,255,255,${i % 2 ? 0.55 : 0.85}), transparent)`).join(",");

export default function AstronautCard({ astronaut, profile, duracion = 500 }) {
  const dia = astronaut?.dia_mision ?? 0;
  const avance = Math.max(0, Math.min(1, dia / duracion));
  const datos = [
    ["Age", profile?.edad ? `${profile.edad} years` : "—"],
    ["Sex", profile?.sexo || "—"],
    ["Blood", profile?.tipo_sangre || "—"],
  ];
  return (
    <div data-theme="dark" className="mx-auto w-full max-w-[460px] text-fg">
      <Card3D className="h-[240px]">
        <Layer z={0} className="absolute inset-0 overflow-hidden rounded-2xl border border-line bg-[linear-gradient(160deg,#1a1030_0%,#0e1530_55%,#2a120c_100%)]">
          <div className="absolute inset-0" style={{ backgroundImage: CIELO }} />
          <div className="absolute -bottom-40 -right-20 h-[270px] w-[270px] rounded-full bg-[radial-gradient(circle_at_35%_30%,#f59e6b,#b4472b_50%,#5b1d12_80%)] shadow-[0_0_70px_rgba(245,158,107,0.35)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,16,32,0.1),rgba(11,16,32,0.6))]" />
        </Layer>

        <Layer z={28} className="absolute left-5 right-24 top-5">
          <div className="text-[11px] uppercase tracking-widest text-accent">Crew identification</div>
          <div className="mt-1 truncate text-xl font-semibold leading-tight">{astronaut?.nombre ?? "…"}</div>
          <div className="truncate text-sm text-muted">{astronaut?.rol ?? ""} · Mars mission</div>
        </Layer>

        <Layer z={60} className="absolute right-5 top-5">
          <div className="astro-float flex h-14 w-14 items-center justify-center rounded-full border border-accent/50 bg-space/70 shadow-[0_0_24px_rgba(200,16,46,0.35)]">
            <LogoIcono size={40} />
          </div>
        </Layer>

        <Layer z={40} className="absolute bottom-5 left-5 right-5">
          <div className="mb-3 flex gap-2">
            {datos.map(([k, v]) => (
              <div key={k} className="rounded-lg border border-line bg-space/60 px-2.5 py-1">
                <div className="text-[10px] uppercase tracking-wider text-muted">{k}</div>
                <div className="text-sm font-semibold">{v}</div>
              </div>
            ))}
          </div>
          <div className="flex items-end justify-between gap-3">
            <div className="text-xl font-semibold leading-tight">
              Day {dia} <span className="text-sm font-normal text-muted">/ {duracion}</span>
            </div>
            <div className="text-xs text-muted">{Math.round(avance * 100)} % of the mission</div>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-ink/15">
            <div className="h-full rounded-full bg-gradient-to-r from-accent to-violet" style={{ width: `${avance * 100}%` }} />
          </div>
        </Layer>
      </Card3D>
    </div>
  );
}
