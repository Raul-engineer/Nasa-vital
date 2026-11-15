"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EncabezadoPagina, Shell, Toast } from "@/components/Shell";
import CyberButton from "@/components/CyberButton";
import { Iniciales, rolTexto } from "@/components/MenuCuenta";
import { actualizarCuenta, cambiarClave, cerrarSesion, cuentaActual, guardarPrefs, leerPrefs, PERFILES } from "@/lib/cuentas";
import { useAstronautId, useQuickFix } from "@/lib/useQuickFix";

function Bloque({ titulo, children }) {
  return (
    <section className="glass p-5 min-[640px]:p-6">
      <h2 className="mb-4 text-lg font-semibold">{titulo}</h2>
      {children}
    </section>
  );
}

function Fila({ etiqueta, children, ayuda }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs text-muted">{etiqueta}</span>
      {children}
      {ayuda && <span className="text-[11.5px] text-crit">{ayuda}</span>}
    </label>
  );
}

function Interruptor({ activo, onCambio, etiqueta, detalle }) {
  return (
    <button type="button" role="switch" aria-checked={activo} onClick={() => onCambio(!activo)}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-line bg-white/[0.03] px-4 py-3 text-left transition hover:bg-white/[0.06]">
      <span>
        <span className="block text-sm font-medium">{etiqueta}</span>
        {detalle && <span className="block text-xs text-muted">{detalle}</span>}
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${activo ? "bg-[linear-gradient(90deg,#22d3ee,#8b7bff)]" : "bg-white/15"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${activo ? "left-[22px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

export default function Cuenta() {
  const router = useRouter();
  const [aid, setAid] = useAstronautId();
  const { data, analisis } = useQuickFix(aid);
  const [cuenta, setCuenta] = useState(null);
  const [nombre, setNombre] = useState("");
  const [puesto, setPuesto] = useState(1);
  const [claves, setClaves] = useState({ actual: "", nueva: "", repetir: "" });
  const [errores, setErrores] = useState({});
  const [prefs, setPrefs] = useState({ sonido: true });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const c = cuentaActual();
    setCuenta(c);
    if (c) {
      setNombre(c.nombre);
      setPuesto(Number(c.astronautId) || 1);
    }
    setPrefs(leerPrefs());
  }, []);

  const guardarDatos = (e) => {
    e.preventDefault();
    const r = actualizarCuenta(cuenta.correo, { nombre, astronautId: puesto });
    if (r.error) return setErrores({ nombre: r.error });
    setErrores({});
    setCuenta({ ...cuenta, ...r.cuenta });
    setMsg("Datos de la cuenta guardados");
  };

  const guardarClave = (e) => {
    e.preventDefault();
    if (claves.nueva !== claves.repetir) return setErrores({ repetir: "Las contraseñas no coinciden" });
    const r = cambiarClave(cuenta.correo, claves.actual, claves.nueva);
    if (r.error) return setErrores({ [r.error.includes("actual") ? "actual" : "nueva"]: r.error });
    setErrores({});
    setClaves({ actual: "", nueva: "", repetir: "" });
    setMsg("Contraseña actualizada");
  };

  const cambiarPref = (k) => (v) => setPrefs(guardarPrefs({ [k]: v }));

  const salir = () => {
    cerrarSesion();
    router.replace("/acceso");
  };

  const desde = cuenta?.desde ? new Date(cuenta.desde).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) : "—";
  const sucio = cuenta && (nombre.trim() !== cuenta.nombre || (cuenta.rol !== "medico" && Number(puesto) !== Number(cuenta.astronautId)));

  return (
    <Shell astronaut={data?.astronaut} astronauts={data?.astronauts || []} onAstronaut={setAid} astronautId={aid} analisis={analisis}>
      <EncabezadoPagina titulo="Configuración de la cuenta" sub="Tus datos de acceso y preferencias" />
      {!cuenta ? (
        <div className="glass p-6 text-muted">Cargando cuenta…</div>
      ) : (
        <div className="grid gap-4 min-[1100px]:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="grid content-start gap-4">
            <Bloque titulo="Datos de la cuenta">
              <div className="mb-5 flex items-center gap-4">
                <Iniciales nombre={nombre || cuenta.nombre} tam={60} />
                <div className="min-w-0">
                  <div className="truncate font-display text-xl font-semibold">{cuenta.nombre}</div>
                  <div className="truncate text-sm text-muted">{cuenta.correo}</div>
                  <div className="mt-1.5 inline-flex rounded-full border border-[#8f86ff55] bg-[#8f86ff1a] px-2.5 py-0.5 text-[11px] text-[#c4b8ff]">{rolTexto(cuenta)}</div>
                </div>
              </div>
              <form onSubmit={guardarDatos} className="grid gap-4">
                <Fila etiqueta="Nombre completo" ayuda={errores.nombre}>
                  <input className={`campo ${errores.nombre ? "campo-error" : ""}`} value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" />
                </Fila>
                <Fila etiqueta="Correo electrónico">
                  <input className="campo opacity-70" value={cuenta.correo} readOnly aria-readonly="true" />
                </Fila>
                {cuenta.rol === "medico" ? (
                  <Fila etiqueta="Acceso">
                    <input className="campo opacity-70" value={`Toda la tripulación${cuenta.cedula ? ` · cédula ${cuenta.cedula}` : ""}`} readOnly />
                  </Fila>
                ) : (
                  <Fila etiqueta="Puesto en la tripulación">
                    <select className="campo" value={puesto} onChange={(e) => setPuesto(Number(e.target.value))}>
                      {PERFILES.map((p) => <option key={p.id} value={p.id}>{p.puesto}</option>)}
                    </select>
                  </Fila>
                )}
                <div className="flex justify-end">
                  <CyberButton type="submit" disabled={!sucio} texto="Guardar cambios">Guardar cambios</CyberButton>
                </div>
              </form>
            </Bloque>

            <Bloque titulo="Contraseña">
              <form onSubmit={guardarClave} className="grid gap-4 min-[640px]:grid-cols-3">
                <Fila etiqueta="Contraseña actual" ayuda={errores.actual}>
                  <input type="password" className={`campo ${errores.actual ? "campo-error" : ""}`} value={claves.actual} onChange={(e) => setClaves({ ...claves, actual: e.target.value })} autoComplete="current-password" />
                </Fila>
                <Fila etiqueta="Nueva (mínimo 8)" ayuda={errores.nueva}>
                  <input type="password" className={`campo ${errores.nueva ? "campo-error" : ""}`} value={claves.nueva} onChange={(e) => setClaves({ ...claves, nueva: e.target.value })} autoComplete="new-password" />
                </Fila>
                <Fila etiqueta="Repetir nueva" ayuda={errores.repetir}>
                  <input type="password" className={`campo ${errores.repetir ? "campo-error" : ""}`} value={claves.repetir} onChange={(e) => setClaves({ ...claves, repetir: e.target.value })} autoComplete="new-password" />
                </Fila>
                <div className="flex justify-end min-[640px]:col-span-3">
                  <CyberButton type="submit" disabled={!claves.actual || !claves.nueva} texto="Cambiar contraseña">Cambiar contraseña</CyberButton>
                </div>
              </form>
            </Bloque>
          </div>

          <div className="grid content-start gap-4">
            <Bloque titulo="Preferencias">
              <div className="grid gap-2.5">
                <Interruptor activo={prefs.sonido} onCambio={cambiarPref("sonido")} etiqueta="Sonidos de Medic" detalle="Al abrir y cerrar la información de un signo" />
              </div>
            </Bloque>

            <Bloque titulo="Sesión">
              <dl className="mb-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted">Iniciada</dt>
                <dd>{desde}</dd>
                <dt className="text-muted">Dispositivo</dt>
                <dd>Este navegador</dd>
              </dl>
              <button type="button" onClick={salir}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#ff727866] bg-[#ff727814] px-4 py-3 text-sm font-semibold text-crit transition hover:bg-[#ff727826]">
                <span aria-hidden>⏻</span> Cerrar sesión
              </button>
            </Bloque>
          </div>
        </div>
      )}
      <Toast msg={msg} onClose={() => setMsg("")} />
    </Shell>
  );
}
