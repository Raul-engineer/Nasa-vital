"use strict";

const SVG_NS = "http://www.w3.org/2000/svg";
const modoTexto = { demo: "Datos de demostración" };
const ESTADOS_DATOS = {
  disponible: { simbolo: "✓", texto: "Datos disponibles" },
  sin: { simbolo: "–", texto: "Sin datos" },
};
let temporizadorRespiracion = null;
let faseRespiracion = "inhala";
let segundosRespiracion = 4;
let focoAnterior = null;

function elemento(nombre, clase, texto) {
  const nodo = document.createElement(nombre);
  if (clase) nodo.className = clase;
  if (texto != null) nodo.textContent = texto;
  return nodo;
}

function formato(valor) {
  if (valor == null || valor === "") return "Sin registro";
  return typeof valor === "number" ? new Intl.NumberFormat("es-MX", { maximumFractionDigits: 1 }).format(valor) : String(valor);
}

function crearMetrica(metrica) {
  const caja = elemento("div", "metric");
  caja.append(elemento("div", "metric-label", metrica.etiqueta));

  const valor = elemento("div", "metric-value");
  valor.append(document.createTextNode(formato(metrica.valor)));
  if (metrica.valor != null && metrica.unidad) valor.append(elemento("span", "metric-unit", metrica.unidad));
  caja.append(valor);
  if (metrica.fuente) caja.append(elemento("p", "metric-source", metrica.fuente));
  return caja;
}

function crearTarjeta(seccion) {
  const tarjeta = elemento("article", "panel section-card");
  tarjeta.id = `card-${seccion.id}`;
  tarjeta.dataset.section = seccion.id;
  tarjeta.append(elemento("h2", "", seccion.titulo));
  tarjeta.append(elemento("p", "section-description", seccion.descripcion));

  seccion.metricas.forEach((metrica) => tarjeta.append(crearMetrica(metrica)));
  return tarjeta;
}

function evaluarSeccion(seccion) {
  const metricas = Array.isArray(seccion.metricas) ? seccion.metricas : [];
  const conDatos = metricas.filter((metrica) => metrica.valor != null && metrica.valor !== "").length;
  return { estado: conDatos ? "disponible" : "sin", conDatos, total: metricas.length };
}

function crearSegmento(seccion, evaluacion) {
  const info = ESTADOS_DATOS[evaluacion.estado];
  const item = elemento("li");
  const enlace = elemento("a", `status-segment ${evaluacion.estado}`);
  enlace.href = `#card-${seccion.id}`;
  enlace.append(elemento("div", "segment-fill"));
  enlace.append(elemento("p", "segment-title", seccion.titulo_corto || seccion.titulo));

  const estado = elemento("p", "segment-state");
  estado.append(elemento("span", "segment-symbol", info.simbolo), document.createTextNode(info.texto));
  item.append(enlace);
  enlace.append(estado);
  enlace.append(elemento("p", "segment-detail", `${evaluacion.conDatos} de ${evaluacion.total} métricas con registro`));
  return item;
}

function crearBarraEstado(secciones) {
  const evaluaciones = secciones.map((seccion) => ({ seccion, ...evaluarSeccion(seccion) }));
  document.getElementById("status-bar").replaceChildren(
    ...evaluaciones.map(({ seccion, ...evaluacion }) => crearSegmento(seccion, evaluacion)),
  );
  const conDatos = evaluaciones.filter((evaluacion) => evaluacion.estado === "disponible").length;
  document.getElementById("statusbar-summary").textContent =
    `${conDatos} de ${evaluaciones.length} áreas tienen datos registrados.`;
}

function crearTendencia(metrica) {
  const valores = metrica.historial;
  if (!Array.isArray(valores) || valores.length < 2) {
    document.getElementById("trend-chart").replaceChildren(elemento("p", "trend-empty", "Sin historial disponible."));
    return;
  }

  const ancho = 640;
  const alto = 132;
  const margen = 18;
  const nums = valores.map((p) => Number(p.valor)).filter(Number.isFinite);
  const minimo = Math.min(...nums);
  const maximo = Math.max(...nums);
  const rango = maximo - minimo || 1;
  const puntos = valores.map((p, i) => ({
    x: margen + (i / (valores.length - 1)) * (ancho - margen * 2),
    y: alto - margen - ((Number(p.valor) - minimo) / rango) * (alto - margen * 2),
    fecha: p.fecha,
    valor: Number(p.valor),
  }));
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${ancho} ${alto}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", `Tendencia demostrativa de ${metrica.etiqueta}`);

  [0.2, 0.5, 0.8].forEach((p) => {
    const linea = document.createElementNS(SVG_NS, "line");
    const y = margen + p * (alto - margen * 2);
    linea.setAttribute("x1", margen);
    linea.setAttribute("x2", ancho - margen);
    linea.setAttribute("y1", y);
    linea.setAttribute("y2", y);
    linea.setAttribute("stroke", "rgba(255,255,255,.1)");
    svg.append(linea);
  });

  const camino = document.createElementNS(SVG_NS, "path");
  camino.setAttribute("d", puntos.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" "));
  camino.setAttribute("fill", "none");
  camino.setAttribute("stroke", "#ff975d");
  camino.setAttribute("stroke-width", "3");
  camino.setAttribute("stroke-linecap", "round");
  camino.setAttribute("stroke-linejoin", "round");
  svg.append(camino);

  puntos.forEach((p) => {
    const punto = document.createElementNS(SVG_NS, "circle");
    punto.setAttribute("cx", p.x);
    punto.setAttribute("cy", p.y);
    punto.setAttribute("r", "4");
    punto.setAttribute("fill", "#a8fff0");
    punto.setAttribute("aria-label", `${p.fecha}: ${formato(p.valor)} ${metrica.unidad || ""}`);
    svg.append(punto);
  });

  const etiquetas = elemento("div", "metric-source", `${valores[0].fecha} · ${formato(valores[0].valor)} ${metrica.unidad}　→　${valores[valores.length - 1].fecha} · ${formato(valores[valores.length - 1].valor)} ${metrica.unidad}`);
  const contenedor = document.getElementById("trend-chart");
  contenedor.replaceChildren(svg, etiquetas);
}

function mostrarDatos(datos) {
  if (!datos || !Array.isArray(datos.secciones)) throw new Error("mental.json no tiene la estructura esperada.");

  document.title = `QuickFix · ${datos.titulo || "Mente y bienestar"}`;
  document.getElementById("page-title").textContent = datos.titulo || "Monitor de mente y bienestar";
  document.getElementById("astronaut-name").textContent = datos.astronauta || "Tripulación";
  document.getElementById("data-notice").textContent = datos.aviso || "Datos ilustrativos; no son mediciones reales.";
  document.getElementById("demo-badge").textContent = modoTexto[datos.modo] || "Datos de ejemplo";

  crearBarraEstado(datos.secciones);
  const tarjetas = document.getElementById("section-cards");
  tarjetas.replaceChildren(...datos.secciones.map(crearTarjeta));

  const metricaConHistorial = datos.secciones.flatMap((s) => s.metricas || []).find((m) => Array.isArray(m.historial));
  if (metricaConHistorial) {
    document.getElementById("trend-title").textContent = `Tendencia de ${metricaConHistorial.etiqueta}`;
    crearTendencia(metricaConHistorial);
  } else {
    document.getElementById("trend-chart").replaceChildren(elemento("p", "trend-empty", "Sin historial disponible."));
  }
}

async function cargarDatos() {
  const error = document.getElementById("load-error");
  try {
    const respuesta = await fetch("./mental.json", { cache: "no-store" });
    if (!respuesta.ok) throw new Error(`No se pudo cargar mental.json (HTTP ${respuesta.status}).`);
    mostrarDatos(await respuesta.json());
  } catch (causa) {
    error.textContent = `${causa.message || "No se pudieron cargar los datos."} Abre esta carpeta mediante un servidor local para que el navegador pueda leer el JSON.`;
    error.hidden = false;
  }
}

function actualizarRespiracion() {
  document.getElementById("breath-instruction").textContent = faseRespiracion === "inhala" ? "Inhala" : "Exhala";
  document.getElementById("breath-count").textContent = String(segundosRespiracion);
  document.getElementById("breath-orb").className = `breath-orb ${faseRespiracion}`;
}

function iniciarRespiracion() {
  focoAnterior = document.activeElement;
  const modal = document.getElementById("breathing-modal");
  modal.hidden = false;
  document.getElementById("exercise-status").hidden = true;
  document.getElementById("close-breathing").focus();
  faseRespiracion = "inhala";
  segundosRespiracion = 4;
  actualizarRespiracion();
  clearInterval(temporizadorRespiracion);
  temporizadorRespiracion = setInterval(() => {
    segundosRespiracion--;
    if (segundosRespiracion <= 0) {
      faseRespiracion = faseRespiracion === "inhala" ? "exhala" : "inhala";
      segundosRespiracion = faseRespiracion === "inhala" ? 4 : 6;
    }
    actualizarRespiracion();
  }, 1000);
}

function terminarRespiracion(completado = false) {
  clearInterval(temporizadorRespiracion);
  temporizadorRespiracion = null;
  document.getElementById("breathing-modal").hidden = true;
  const estado = document.getElementById("exercise-status");
  estado.textContent = completado
    ? "Ejercicio terminado. No se modificaron tus métricas."
    : "Ejercicio cancelado. No se modificaron tus métricas.";
  estado.hidden = false;
  if (focoAnterior instanceof HTMLElement) focoAnterior.focus();
}

document.addEventListener("DOMContentLoaded", () => {
  cargarDatos();
  document.getElementById("start-breathing").addEventListener("click", iniciarRespiracion);
  document.getElementById("close-breathing").addEventListener("click", () => terminarRespiracion());
  document.getElementById("finish-breathing").addEventListener("click", () => terminarRespiracion(true));
  document.getElementById("breathing-modal").addEventListener("click", (evento) => {
    if (evento.target.id === "breathing-modal") terminarRespiracion();
  });
  document.getElementById("breathing-modal").addEventListener("keydown", (evento) => {
    if (evento.key !== "Tab") return;
    const botones = [...evento.currentTarget.querySelectorAll("button:not([disabled])")];
    const primero = botones[0];
    const ultimo = botones[botones.length - 1];
    if (evento.shiftKey && document.activeElement === primero) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primero.focus();
    }
  });
  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && !document.getElementById("breathing-modal").hidden) terminarRespiracion();
  });
});