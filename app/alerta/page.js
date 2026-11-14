import { redirect } from "next/navigation";

export default async function Alerta({ searchParams }) {
  const sp = new URLSearchParams(await searchParams).toString();
  redirect(`/analisis${sp ? `?${sp}` : ""}`);
}
