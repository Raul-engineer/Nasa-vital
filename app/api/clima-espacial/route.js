import { nivelNOAA } from "@/lib/analysis";

export const revalidate = 300;

const URL_NOAA = "https://services.swpc.noaa.gov/json/goes/primary/integral-protons-6-hour.json";

export async function GET() {
  try {
    const res = await fetch(URL_NOAA, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(String(res.status));
    const datos = await res.json();
    const p10 = datos
      .filter((d) => d.energy === ">=10 MeV" && d.flux != null)
      .sort((a, b) => String(a.time_tag).localeCompare(String(b.time_tag)));
    const ultimo = p10[p10.length - 1];
    if (!ultimo) throw new Error("sin datos");
    const flujo = Number(ultimo.flux);
    return Response.json({ flujo, nivel: nivelNOAA(flujo), hora: ultimo.time_tag });
  } catch {
    return Response.json({ error: true });
  }
}
