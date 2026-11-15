const LS_CUENTAS = "quickfix_cuentas";
const LS_SESION = "quickfix_sesion";
const LS_RECORDADO = "quickfix_recordado";

export const CUENTAS_DEMO = [
  { correo: "reyes@quickfix.mx", clave: "mision142", nombre: "Cmdr. A. Reyes", rol: "astronauta", astronautId: 1 },
  { correo: "garza@quickfix.mx", clave: "mision142", nombre: "Dr. L. Garza", rol: "astronauta", astronautId: 2 },
  { correo: "torres@quickfix.mx", clave: "mision142", nombre: "Eng. M. Torres", rol: "astronauta", astronautId: 3 },
  { correo: "medico@quickfix.mx", clave: "mision142", nombre: "Dr. Medical Control", rol: "medico", astronautId: 1 },
];

export const PERFILES = [
  { id: 1, puesto: "Commander" },
  { id: 2, puesto: "Crew medical officer" },
  { id: 3, puesto: "Flight engineer" },
];

export const ESPECIALIDADES = ["Aerospace medicine", "General medicine", "Internal medicine", "Cardiology", "Psychology or psychiatry", "Other"];

const normal = (c = "") => c.trim().toLowerCase();

function leer(llave, almacen) {
  try {
    return JSON.parse((almacen || localStorage).getItem(llave));
  } catch {
    return null;
  }
}

function escribir(llave, valor, almacen) {
  try {
    (almacen || localStorage).setItem(llave, JSON.stringify(valor));
  } catch {}
}

function registradas() {
  return leer(LS_CUENTAS) || [];
}

function buscar(correo) {
  const c = normal(correo);
  return [...registradas(), ...CUENTAS_DEMO].find((x) => x.correo === c);
}

export function correoValido(c) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normal(c));
}

export function destinoDe(sesion) {
  return sesion.rol === "medico" ? `/tripulacion?a=${sesion.astronautId}` : `/?a=${sesion.astronautId}`;
}

export function registrar(datos) {
  if (buscar(datos.correo)) return { error: "An account with that email already exists" };
  const medico = datos.rol === "medico";
  const cuenta = {
    rol: medico ? "medico" : "astronauta",
    nombre: datos.nombre.trim(),
    correo: normal(datos.correo),
    clave: datos.clave,
    astronautId: medico ? 1 : Number(datos.astronautId) || 1,
    ...(medico ? { cedula: datos.cedula, especialidad: datos.especialidad } : {}),
    creada: new Date().toISOString(),
  };
  escribir(LS_CUENTAS, [...registradas(), cuenta]);
  return { cuenta };
}

export function iniciarSesion(correo, clave, recordar) {
  const cuenta = buscar(correo);
  if (!cuenta || cuenta.clave !== clave) return { error: "Incorrect email or password" };
  const sesion = { correo: cuenta.correo, nombre: cuenta.nombre, rol: cuenta.rol || "astronauta", astronautId: cuenta.astronautId, desde: new Date().toISOString() };
  cerrarSesion();
  try {
    escribir(LS_SESION, sesion, sessionStorage);
    if (recordar) localStorage.setItem(LS_RECORDADO, cuenta.correo);
    else localStorage.removeItem(LS_RECORDADO);
  } catch {}
  return { sesion };
}

export function sesionActual() {
  try {
    return leer(LS_SESION, sessionStorage);
  } catch {
    return null;
  }
}

export function correoRecordado() {
  try {
    return localStorage.getItem(LS_RECORDADO) || "";
  } catch {
    return "";
  }
}

export function cerrarSesion() {
  try {
    localStorage.removeItem(LS_SESION);
    sessionStorage.removeItem(LS_SESION);
  } catch {}
}

const LS_PREFS = "quickfix_prefs";

function guardarCuenta(cuenta) {
  const lista = registradas().filter((x) => x.correo !== cuenta.correo);
  escribir(LS_CUENTAS, [...lista, cuenta]);
}

function refrescarSesion(cambios) {
  for (const almacen of [localStorage, sessionStorage]) {
    try {
      const s = leer(LS_SESION, almacen);
      if (s) escribir(LS_SESION, { ...s, ...cambios }, almacen);
    } catch {}
  }
}

export function cuentaActual() {
  const s = sesionActual();
  if (!s) return null;
  const c = buscar(s.correo);
  return c ? { ...c, rol: c.rol || "astronauta", desde: s.desde } : null;
}

export function actualizarCuenta(correo, cambios) {
  const c = buscar(correo);
  if (!c) return { error: "Account not found" };
  const nombre = (cambios.nombre ?? c.nombre).trim();
  if (nombre.length < 3) return { error: "Enter your full name" };
  const cuenta = { ...c, nombre, astronautId: Number(cambios.astronautId ?? c.astronautId) || 1 };
  guardarCuenta(cuenta);
  refrescarSesion({ nombre: cuenta.nombre, astronautId: cuenta.astronautId });
  return { cuenta };
}

export function cambiarClave(correo, actual, nueva) {
  const c = buscar(correo);
  if (!c || c.clave !== actual) return { error: "The current password is not correct" };
  if ((nueva || "").length < 8) return { error: "Use at least 8 characters" };
  guardarCuenta({ ...c, clave: nueva });
  return { ok: true };
}

export function leerPrefs() {
  try {
    return { sonido: true, ...(JSON.parse(localStorage.getItem(LS_PREFS)) || {}) };
  } catch {
    return { sonido: true };
  }
}

export function guardarPrefs(cambios) {
  const p = { ...leerPrefs(), ...cambios };
  escribir(LS_PREFS, p);
  return p;
}
