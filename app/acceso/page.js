"use client";
import "./acceso.css";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogoIcono, LogoQuickFix } from "@/components/Marca";
import { CUENTAS_DEMO, ESPECIALIDADES, PERFILES, correoValido, destinoDe, iniciarSesion, registrar } from "@/lib/cuentas";
import { iniciales } from "@/components/Shell";

const SIMBOLOS = {
  mail: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 8 8 6 8-6" /></>,
  lock: <><rect x="5" y="11" width="14" height="9" rx="2.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M3 3l18 18" /><path d="M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.5 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 4.3-1" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" /></>,
  badge: <><rect x="3" y="5" width="18" height="14" rx="3" /><circle cx="9" cy="11" r="2" /><path d="M6.5 16c.4-1.6 1.5-2.4 2.5-2.4s2.1.8 2.5 2.4M14 10h4M14 14h3" /></>,
  rocket: <><path d="M12 3c3.5 2.2 5 5.6 5 9l-2.2 4H9.2L7 12c0-3.4 1.5-6.8 5-9Z" /><circle cx="12" cy="10" r="1.6" /><path d="M9.2 16 7 20l3-1.2M14.8 16l2.2 4-3-1.2" /></>,
  steto: <><path d="M5 3v5a4 4 0 0 0 8 0V3" /><path d="M9 12v2.5a4.5 4.5 0 0 0 9 0V13" /><circle cx="18" cy="11" r="2" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
};

function I({ n, className = "i" }) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden>{SIMBOLOS[n]}</svg>;
}

function Campo({ id, icono, etiqueta, error, children, ojo }) {
  const [ver, setVer] = useState(false);
  const hijo = typeof children === "function" ? children(ver) : children;
  return (
    <div className="campo">
      <div className="entrada">
        <I n={icono} />
        <label className="sr-only" htmlFor={id}>{etiqueta}</label>
        {hijo}
        {ojo && (
          <button type="button" className="ojo" onClick={() => setVer((v) => !v)} aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}>
            <I n={ver ? "eyeOff" : "eye"} />
          </button>
        )}
      </div>
      {error && <p className="error" id={`${id}-e`} role="alert">{error}</p>}
    </div>
  );
}

function Login({ alEntrar, aRegistro, aviso, correoInicial }) {
  const [correo, setCorreo] = useState(correoInicial || "");
  const [clave, setClave] = useState("");
  const [recordar, setRecordar] = useState(true);
  const [err, setErr] = useState({});
  const form = useRef(null);

  const enviar = (e) => {
    e.preventDefault();
    const er = {};
    if (!correo.trim()) er.correo = "Escribe tu correo.";
    else if (!correoValido(correo)) er.correo = "Ese correo no parece válido.";
    if (!clave) er.clave = "Escribe tu contraseña.";
    if (!er.correo && !er.clave) {
      const r = iniciarSesion(correo, clave, recordar);
      if (r.error) er.clave = `${r.error}.`;
      else return alEntrar(r.sesion);
    }
    setErr(er);
    setTimeout(() => form.current?.querySelector("[aria-invalid=true]")?.focus(), 0);
  };

  const demo = (c) => {
    setCorreo(c.correo);
    setClave(c.clave);
    setErr({});
  };

  const limpiar = (k, set) => (e) => {
    set(e.target.value);
    if (err[k]) setErr((x) => ({ ...x, [k]: "" }));
  };

  return (
    <form ref={form} onSubmit={enviar} noValidate className="aparece">
      <Campo id="l-email" icono="mail" etiqueta="Correo electrónico" error={err.correo}>
        <input type="email" id="l-email" placeholder="Correo electrónico" autoComplete="email" value={correo} onChange={limpiar("correo", setCorreo)} aria-invalid={!!err.correo} aria-describedby={err.correo ? "l-email-e" : undefined} />
      </Campo>
      <Campo id="l-pass" icono="lock" etiqueta="Contraseña" error={err.clave} ojo>
        {(ver) => <input type={ver ? "text" : "password"} id="l-pass" placeholder="Contraseña" autoComplete="current-password" value={clave} onChange={limpiar("clave", setClave)} aria-invalid={!!err.clave} aria-describedby={err.clave ? "l-pass-e" : undefined} />}
      </Campo>
      <div className="fila">
        <label className="check"><input type="checkbox" checked={recordar} onChange={(e) => setRecordar(e.target.checked)} /> Recordarme</label>
        <button type="button" className="enlace" onClick={() => aviso("Pide a tu médico de vuelo que restablezca tu contraseña.")}>¿Olvidaste tu contraseña?</button>
      </div>
      <button className="boton" type="submit">Iniciar sesión</button>
      <div className="separador">o entra con una cuenta de la tripulación</div>
      <div className="demos">
        {CUENTAS_DEMO.map((c) => (
          <button key={c.correo} type="button" className="demo" onClick={() => demo(c)} title={c.correo}>
            <span className={`demo-ini ${c.rol === "medico" ? "demo-med" : ""}`}>{c.rol === "medico" ? <I n="steto" /> : iniciales(c.nombre)}</span>
            <span>{c.rol === "medico" ? "Médico" : c.nombre.split(" ").pop()}</span>
          </button>
        ))}
      </div>
      <p className="pie">¿No tienes cuenta? <button type="button" className="enlace" onClick={aRegistro}>Crea una</button></p>
    </form>
  );
}

const VACIO = { rol: "astronauta", nombre: "", correo: "", astronautId: "", cedula: "", especialidad: "", clave: "", clave2: "" };

function Registro({ alRegistrar, aLogin }) {
  const [f, setF] = useState(VACIO);
  const [terminos, setTerminos] = useState(false);
  const [err, setErr] = useState({});
  const form = useRef(null);
  const medico = f.rol === "medico";

  const cambia = (k) => (e) => {
    setF((x) => ({ ...x, [k]: e.target.value }));
    if (err[k]) setErr((x) => ({ ...x, [k]: "" }));
  };

  const enviar = (e) => {
    e.preventDefault();
    const er = {};
    if (f.nombre.trim().length < 3) er.nombre = "Escribe tu nombre completo.";
    if (!f.correo.trim()) er.correo = "Escribe tu correo.";
    else if (!correoValido(f.correo)) er.correo = "Ese correo no parece válido.";
    if (medico) {
      if (!/^\d{7,8}$/.test(f.cedula.trim())) er.cedula = "La cédula debe tener 7 u 8 dígitos.";
      if (!f.especialidad) er.especialidad = "Elige tu especialidad.";
    } else if (!f.astronautId) er.astronautId = "Elige tu puesto en la tripulación.";
    if (f.clave.length < 8) er.clave = "Usa al menos 8 caracteres.";
    if (!f.clave2 || f.clave2 !== f.clave) er.clave2 = "Las contraseñas no coinciden.";
    if (!terminos) er.terminos = "Debes aceptar para continuar.";
    if (!Object.values(er).some(Boolean)) {
      const r = registrar({ ...f, cedula: f.cedula.trim() });
      if (r.error) er.correo = `${r.error}.`;
      else return alRegistrar(r.cuenta);
    }
    setErr(er);
    setTimeout(() => form.current?.querySelector("[aria-invalid=true]")?.focus(), 0);
  };

  const inv = (k) => ({ "aria-invalid": !!err[k], "aria-describedby": err[k] ? `r-${k}-e` : undefined });

  return (
    <form ref={form} onSubmit={enviar} noValidate className="aparece">
      <fieldset className="roles">
        <legend>¿Cómo vas a usar QuickFix?</legend>
        {[
          { v: "astronauta", n: "rocket", t: "Astronauta", s: "Monitorea tu salud" },
          { v: "medico", n: "steto", t: "Médico o doctora", s: "Atiende a la tripulación" },
        ].map((r) => (
          <label key={r.v} className="rol">
            <input type="radio" name="rol" value={r.v} checked={f.rol === r.v} onChange={cambia("rol")} />
            <I n={r.n} />
            <b>{r.t}</b>
            <small>{r.s}</small>
          </label>
        ))}
      </fieldset>

      <Campo id="r-nombre" icono="user" etiqueta="Nombre completo" error={err.nombre}>
        <input type="text" id="r-nombre" placeholder="Nombre completo" autoComplete="name" value={f.nombre} onChange={cambia("nombre")} {...inv("nombre")} />
      </Campo>
      <Campo id="r-correo" icono="mail" etiqueta="Correo electrónico" error={err.correo}>
        <input type="email" id="r-correo" placeholder="Correo electrónico" autoComplete="email" value={f.correo} onChange={cambia("correo")} {...inv("correo")} />
      </Campo>

      {medico ? (
        <div className="extra" key="medico">
          <Campo id="r-cedula" icono="badge" etiqueta="Cédula profesional" error={err.cedula}>
            <input type="text" id="r-cedula" inputMode="numeric" maxLength={8} placeholder="Cédula profesional (7 u 8 dígitos)" value={f.cedula} onChange={cambia("cedula")} {...inv("cedula")} />
          </Campo>
          <Campo id="r-especialidad" icono="steto" etiqueta="Especialidad" error={err.especialidad}>
            <select id="r-especialidad" value={f.especialidad} onChange={cambia("especialidad")} className={f.especialidad ? "" : "vacio"} {...inv("especialidad")}>
              <option value="">Especialidad</option>
              {ESPECIALIDADES.map((e) => <option key={e}>{e}</option>)}
            </select>
          </Campo>
          <p className="aviso">En una misión real se verifica la cédula profesional antes de dar acceso a los datos de la tripulación.</p>
        </div>
      ) : (
        <div className="extra" key="astronauta">
          <Campo id="r-astronautId" icono="rocket" etiqueta="Puesto en la tripulación" error={err.astronautId}>
            <select id="r-astronautId" value={f.astronautId} onChange={cambia("astronautId")} className={f.astronautId ? "" : "vacio"} {...inv("astronautId")}>
              <option value="">Puesto en la tripulación</option>
              {PERFILES.map((p) => <option key={p.id} value={p.id}>{p.puesto}</option>)}
            </select>
          </Campo>
        </div>
      )}

      <Campo id="r-clave" icono="lock" etiqueta="Contraseña" error={err.clave} ojo>
        {(ver) => <input type={ver ? "text" : "password"} id="r-clave" placeholder="Contraseña (mínimo 8 caracteres)" autoComplete="new-password" value={f.clave} onChange={cambia("clave")} {...inv("clave")} />}
      </Campo>
      <Campo id="r-clave2" icono="lock" etiqueta="Confirmar contraseña" error={err.clave2}>
        <input type="password" id="r-clave2" placeholder="Confirmar contraseña" autoComplete="new-password" value={f.clave2} onChange={cambia("clave2")} {...inv("clave2")} />
      </Campo>
      <div className="campo">
        <label className="check">
          <input type="checkbox" id="r-terminos" checked={terminos} onChange={(e) => { setTerminos(e.target.checked); setErr((x) => ({ ...x, terminos: "" })); }} {...inv("terminos")} />
          <span>Acepto el aviso de privacidad y el uso de mis datos de salud con fines de seguimiento.</span>
        </label>
        {err.terminos && <p className="error" id="r-terminos-e" role="alert">{err.terminos}</p>}
      </div>
      <button className="boton" type="submit">Crear cuenta</button>
      <p className="pie">¿Ya tienes cuenta? <button type="button" className="enlace" onClick={aLogin}>Inicia sesión</button></p>
    </form>
  );
}

function Exito({ titulo, texto, boton, onBoton }) {
  const ref = useRef(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <div className="exito aparece" aria-live="polite">
      <div className="circulo"><I n="check" /></div>
      <h3>{titulo}</h3>
      <p>{texto}</p>
      {boton && <button ref={ref} className="boton" type="button" style={{ padding: "0 26px" }} onClick={onBoton}>{boton}</button>}
    </div>
  );
}

export default function Acceso() {
  const router = useRouter();
  const [vista, setVista] = useState("login");
  const [exito, setExito] = useState(null);
  const [nota, setNota] = useState("");
  const [correoNuevo, setCorreoNuevo] = useState("");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("modo") === "registro") setVista("registro");
  }, []);

  const ir = (v) => {
    setVista(v);
    setExito(null);
    setNota("");
  };

  const alEntrar = (s) => {
    setExito({
      titulo: "Sesión iniciada",
      texto: s.rol === "medico" ? "Abriendo el panel de la tripulación…" : `Abriendo tu panel de salud, ${s.nombre.split(" ").slice(-1)[0]}…`,
    });
    setTimeout(() => router.push(destinoDe(s)), 1000);
  };

  const alRegistrar = (c) => {
    setCorreoNuevo(c.correo);
    setExito({
      titulo: "Cuenta creada",
      texto: c.rol === "medico" ? "Ya puedes iniciar sesión y revisar a la tripulación." : "Ya puedes iniciar sesión y empezar a conocer tu cuerpo.",
      boton: "Ir a iniciar sesión",
      onBoton: () => ir("login"),
    });
  };

  const esLogin = vista === "login";

  return (
    <div className="acceso">
      <div className="pagina">
        <section className="hero">
          <div className="marca"><LogoQuickFix alto={84} /></div>
          <h1>Tu compañero de salud, incluso a millones de kilómetros</h1>
          <ul>
            <li>¿Cómo está mi cuerpo?</li>
            <li>¿Estoy listo para hoy?</li>
            <li>¿Qué hago para mantenerme sano?</li>
          </ul>
        </section>

        <main className="panel">
          <div className="tarjeta">
            <LogoIcono size={58} className="logo" />
            {!exito && (
              <>
                <h2>{esLogin ? "Bienvenido de nuevo" : "Crea tu cuenta"}</h2>
                <p className="sub">{nota || (esLogin ? <>Entra como astronauta a tu cuenta de <b>QuickFix</b></> : "Regístrate como astronauta o como personal médico")}</p>
                <div className="pestanas" role="tablist" aria-label="Acceso">
                  <button type="button" role="tab" aria-selected={esLogin} onClick={() => ir("login")}>Iniciar sesión</button>
                  <button type="button" role="tab" aria-selected={!esLogin} onClick={() => ir("registro")}>Crear cuenta</button>
                </div>
                {esLogin
                  ? <Login alEntrar={alEntrar} aRegistro={() => ir("registro")} aviso={setNota} correoInicial={correoNuevo} />
                  : <Registro alRegistrar={alRegistrar} aLogin={() => ir("login")} />}
              </>
            )}
            {exito && <Exito {...exito} />}
          </div>
        </main>
      </div>
    </div>
  );
}
