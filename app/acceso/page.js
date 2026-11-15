"use client";
import "./acceso.css";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogoIcono, LogoQuickFix } from "@/components/Marca";
import FondoGalaxia from "@/components/FondoGalaxia";
import { correoRecordado, CUENTAS_DEMO, ESPECIALIDADES, PERFILES, correoValido, destinoDe, iniciarSesion, registrar } from "@/lib/cuentas";
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
          <button type="button" className="ojo" onClick={() => setVer((v) => !v)} aria-label={ver ? "Hide password" : "Show password"}>
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
  useEffect(() => {
    if (!correoInicial) setCorreo((c) => c || correoRecordado());
  }, [correoInicial]);
  const [clave, setClave] = useState("");
  const [recordar, setRecordar] = useState(true);
  const [err, setErr] = useState({});
  const form = useRef(null);

  const enviar = (e) => {
    e.preventDefault();
    const er = {};
    if (!correo.trim()) er.correo = "Enter your email.";
    else if (!correoValido(correo)) er.correo = "That email does not look valid.";
    if (!clave) er.clave = "Enter your password.";
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
      <Campo id="l-email" icono="mail" etiqueta="Email" error={err.correo}>
        <input type="email" id="l-email" placeholder="Email" autoComplete="email" value={correo} onChange={limpiar("correo", setCorreo)} aria-invalid={!!err.correo} aria-describedby={err.correo ? "l-email-e" : undefined} />
      </Campo>
      <Campo id="l-pass" icono="lock" etiqueta="Password" error={err.clave} ojo>
        {(ver) => <input type={ver ? "text" : "password"} id="l-pass" placeholder="Password" autoComplete="current-password" value={clave} onChange={limpiar("clave", setClave)} aria-invalid={!!err.clave} aria-describedby={err.clave ? "l-pass-e" : undefined} />}
      </Campo>
      <div className="fila">
        <label className="check"><input type="checkbox" checked={recordar} onChange={(e) => setRecordar(e.target.checked)} /> Remember my email</label>
        <button type="button" className="enlace" onClick={() => aviso("Ask your flight surgeon to reset your password.")}>Forgot your password?</button>
      </div>
      <button className="boton" type="submit">Sign in</button>
      <div className="separador">or sign in with a crew account</div>
      <div className="demos">
        {CUENTAS_DEMO.map((c) => (
          <button key={c.correo} type="button" className="demo" onClick={() => demo(c)} title={c.correo}>
            <span className={`demo-ini ${c.rol === "medico" ? "demo-med" : ""}`}>{c.rol === "medico" ? <I n="steto" /> : iniciales(c.nombre)}</span>
            <span>{c.rol === "medico" ? "Physician" : c.nombre.split(" ").pop()}</span>
          </button>
        ))}
      </div>
      <p className="pie">No account? <button type="button" className="enlace" onClick={aRegistro}>Create one</button></p>
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
    if (f.nombre.trim().length < 3) er.nombre = "Enter your full name.";
    if (!f.correo.trim()) er.correo = "Enter your email.";
    else if (!correoValido(f.correo)) er.correo = "That email does not look valid.";
    if (medico) {
      if (!/^\d{7,8}$/.test(f.cedula.trim())) er.cedula = "The license number must have 7 or 8 digits.";
      if (!f.especialidad) er.especialidad = "Choose your specialty.";
    } else if (!f.astronautId) er.astronautId = "Choose your crew position.";
    if (f.clave.length < 8) er.clave = "Use at least 8 characters.";
    if (!f.clave2 || f.clave2 !== f.clave) er.clave2 = "The passwords do not match.";
    if (!terminos) er.terminos = "You must accept to continue.";
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
        <legend>How will you use QuickFix?</legend>
        {[
          { v: "astronauta", n: "rocket", t: "Astronaut", s: "Monitor your health" },
          { v: "medico", n: "steto", t: "Physician", s: "Care for the crew" },
        ].map((r) => (
          <label key={r.v} className="rol">
            <input type="radio" name="rol" value={r.v} checked={f.rol === r.v} onChange={cambia("rol")} />
            <I n={r.n} />
            <b>{r.t}</b>
            <small>{r.s}</small>
          </label>
        ))}
      </fieldset>

      <Campo id="r-nombre" icono="user" etiqueta="Full name" error={err.nombre}>
        <input type="text" id="r-nombre" placeholder="Full name" autoComplete="name" value={f.nombre} onChange={cambia("nombre")} {...inv("nombre")} />
      </Campo>
      <Campo id="r-correo" icono="mail" etiqueta="Email" error={err.correo}>
        <input type="email" id="r-correo" placeholder="Email" autoComplete="email" value={f.correo} onChange={cambia("correo")} {...inv("correo")} />
      </Campo>

      {medico ? (
        <div className="extra" key="medico">
          <Campo id="r-cedula" icono="badge" etiqueta="Professional license" error={err.cedula}>
            <input type="text" id="r-cedula" inputMode="numeric" maxLength={8} placeholder="Professional license (7 or 8 digits)" value={f.cedula} onChange={cambia("cedula")} {...inv("cedula")} />
          </Campo>
          <Campo id="r-especialidad" icono="steto" etiqueta="Specialty" error={err.especialidad}>
            <select id="r-especialidad" value={f.especialidad} onChange={cambia("especialidad")} className={f.especialidad ? "" : "vacio"} {...inv("especialidad")}>
              <option value="">Specialty</option>
              {ESPECIALIDADES.map((e) => <option key={e}>{e}</option>)}
            </select>
          </Campo>
          <p className="aviso">On a real mission the professional license is verified before granting access to crew data.</p>
        </div>
      ) : (
        <div className="extra" key="astronauta">
          <Campo id="r-astronautId" icono="rocket" etiqueta="Crew position" error={err.astronautId}>
            <select id="r-astronautId" value={f.astronautId} onChange={cambia("astronautId")} className={f.astronautId ? "" : "vacio"} {...inv("astronautId")}>
              <option value="">Crew position</option>
              {PERFILES.map((p) => <option key={p.id} value={p.id}>{p.puesto}</option>)}
            </select>
          </Campo>
        </div>
      )}

      <Campo id="r-clave" icono="lock" etiqueta="Password" error={err.clave} ojo>
        {(ver) => <input type={ver ? "text" : "password"} id="r-clave" placeholder="Password (at least 8 characters)" autoComplete="new-password" value={f.clave} onChange={cambia("clave")} {...inv("clave")} />}
      </Campo>
      <Campo id="r-clave2" icono="lock" etiqueta="Confirm password" error={err.clave2}>
        <input type="password" id="r-clave2" placeholder="Confirm password" autoComplete="new-password" value={f.clave2} onChange={cambia("clave2")} {...inv("clave2")} />
      </Campo>
      <div className="campo">
        <label className="check">
          <input type="checkbox" id="r-terminos" checked={terminos} onChange={(e) => { setTerminos(e.target.checked); setErr((x) => ({ ...x, terminos: "" })); }} {...inv("terminos")} />
          <span>I accept the privacy notice and the use of my health data for monitoring purposes.</span>
        </label>
        {err.terminos && <p className="error" id="r-terminos-e" role="alert">{err.terminos}</p>}
      </div>
      <button className="boton" type="submit">Create account</button>
      <p className="pie">Already have an account? <button type="button" className="enlace" onClick={aLogin}>Sign in</button></p>
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
      titulo: "Signed in",
      texto: s.rol === "medico" ? "Opening the crew panel…" : `Opening your health panel, ${s.nombre.split(" ").slice(-1)[0]}…`,
    });
    setTimeout(() => router.push(destinoDe(s)), 1000);
  };

  const alRegistrar = (c) => {
    setCorreoNuevo(c.correo);
    setExito({
      titulo: "Account created",
      texto: c.rol === "medico" ? "You can now sign in and check on the crew." : "You can now sign in and start getting to know your body.",
      boton: "Go to sign in",
      onBoton: () => ir("login"),
    });
  };

  const esLogin = vista === "login";

  return (
    <div className="acceso">
      <FondoGalaxia />
      <a className="credito-video" href="https://www.pexels.com/es-es/video/galaxy-estrellas-universo-astronomia-15562120/" target="_blank" rel="noreferrer">Video: Colin Jones · Pexels</a>
      <div className="pagina">
        <section className="hero">
          <div className="marca"><LogoQuickFix alto={84} /></div>
          <h1>Your health companion, even <span className="degradado">millions of kilometers</span> away</h1>
          <ul>
            <li>How is my body doing?</li>
            <li>Am I ready for today?</li>
            <li>What do I do to stay healthy?</li>
          </ul>
        </section>

        <main className="panel">
          <div className="tarjeta">
            <LogoIcono size={58} className="logo" />
            {!exito && (
              <>
                <h2>{esLogin ? "Welcome back" : "Create your account"}</h2>
                <p className="sub">{nota || (esLogin ? <>Sign in as an astronaut to your <b>QuickFix</b> account</> : "Sign up as an astronaut or as medical staff")}</p>
                <div className="pestanas" role="tablist" aria-label="Access">
                  <button type="button" role="tab" aria-selected={esLogin} onClick={() => ir("login")}>Sign in</button>
                  <button type="button" role="tab" aria-selected={!esLogin} onClick={() => ir("registro")}>Create account</button>
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
