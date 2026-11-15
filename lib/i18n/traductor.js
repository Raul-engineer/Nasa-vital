import DIC from "./diccionario.json";

export const IDIOMA_KEY = "quickfix_idioma";
export const IDIOMA_DEFECTO = "en";

export const SCRIPT_IDIOMA = `try{var l=localStorage.getItem("${IDIOMA_KEY}")||"${IDIOMA_DEFECTO}";var h=document.documentElement;h.setAttribute("data-idioma",l);h.setAttribute("lang",l==="en"?"en":"es-MX");setTimeout(function(){h.setAttribute("data-idioma-listo","")},1500)}catch(e){}`;

const EXACTO = new Map(Object.entries(DIC.exacto));
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const PATRONES = DIC.patrones.map(([es, en]) => {
  const partes = es.split(/\{(\d+)\}/);
  let fuente = "^";
  const orden = [];
  partes.forEach((p, i) => {
    if (i % 2) {
      orden.push(Number(p));
      fuente += "([\\s\\S]*?)";
    } else fuente += esc(p);
  });
  const prefijo = partes[0];
  const corto = partes.filter((_, i) => i % 2 === 0).join("").replace(/[^A-Za-zÁ-ú]/g, "").length < 6;
  return { re: new RegExp(fuente + "$"), orden, en, prefijo, corto };
});

const MESES = { enero: "January", febrero: "February", marzo: "March", abril: "April", mayo: "May", junio: "June", julio: "July", agosto: "August", septiembre: "September", octubre: "October", noviembre: "November", diciembre: "December", ene: "Jan", feb: "Feb", mar: "Mar", abr: "Apr", may: "May", jun: "Jun", jul: "Jul", ago: "Aug", sept: "Sep", sep: "Sep", oct: "Oct", nov: "Nov", dic: "Dec", lunes: "Monday", martes: "Tuesday", miércoles: "Wednesday", jueves: "Thursday", viernes: "Friday", sábado: "Saturday", domingo: "Sunday" };
const RE_FECHA = new RegExp(`(\\d+)( de)? (${Object.keys(MESES).join("|")})\\.?(?![a-záéíóú])`, "gi");
const RE_DIA = /\b(lunes|martes|miércoles|jueves|viernes|sábado|domingo)\b/gi;

const cache = new Map();

function directo(s) {
  if (EXACTO.has(s)) return EXACTO.get(s);
  for (const p of PATRONES) {
    if (p.prefijo && !s.startsWith(p.prefijo)) continue;
    const m = p.re.exec(s);
    if (!m) continue;
    if (p.corto && m.slice(1).some((v) => /[A-Za-zÁ-ú]/.test(v))) continue;
    const vals = p.orden.map((_, i) => m[i + 1]);
    const porIndice = {};
    p.orden.forEach((n, i) => {
      porIndice[n] = vals[i];
    });
    return p.en.replace(/\{(\d+)\}/g, (_, n) => {
      const v = porIndice[n] ?? "";
      const w = v.trim();
      let t = w ? nucleo(w, 1) : null;
      if (t == null && /^[a-záéíóúñ]/.test(w)) {
        const c = nucleo(w[0].toUpperCase() + w.slice(1), 1);
        if (c != null) t = c[0].toLowerCase() + c.slice(1);
      }
      return t != null ? v.replace(w, t) : v;
    });
  }
  return null;
}

function nucleo(s, prof = 0) {
  const d = directo(s);
  if (d != null) return d;
  const fin = /([.:…!?]+)$/.exec(s);
  if (fin) {
    const sin = s.slice(0, -fin[1].length).trim();
    const r = directo(sin);
    if (r != null) return r + fin[1];
    const conPunto = directo(s + ".");
    if (conPunto != null) return conPunto.replace(/\.$/, "");
  } else {
    const r = directo(s + ".");
    if (r != null) return r.replace(/\.$/, "");
  }
  if (prof < 2) {
    const piezas = s.split(/( · | — | \| |; |\. (?=[A-ZÁÉÍÓÚ¿¡])|: (?=[A-ZÁÉÍÓÚ¿¡]))/);
    if (piezas.length > 1) {
      let cambio = false;
      const out = piezas.map((p, i) => {
        if (i % 2) return p;
        const t = p.trim() ? nucleo(p.trim(), prof + 1) : null;
        if (t != null && t !== p.trim()) {
          cambio = true;
          return p.replace(p.trim(), t);
        }
        return p;
      });
      if (cambio) return out.join("");
    }
  }
  return null;
}

export function traducir(texto) {
  if (!texto || !/[A-Za-zÁ-ú]/.test(texto)) return texto;
  if (cache.has(texto)) return cache.get(texto);
  const t = texto.trim();
  let r = nucleo(t);
  let base = r ?? t;
  if (/\d/.test(base)) base = base.replace(RE_FECHA, (_, n, de, m) => `${MESES[m.toLowerCase()] || m} ${n}`).replace(RE_DIA, (d) => MESES[d.toLowerCase()] || d);
  const res = base === t ? texto : texto.replace(t, base);
  if (cache.size > 5000) cache.clear();
  cache.set(texto, res);
  return res;
}

const ATRIBUTOS = ["aria-label", "title", "placeholder", "alt", "aria-valuetext"];
const SALTAR = "script,style,textarea,noscript,code,[data-no-traducir],[contenteditable='true']";
const textos = new WeakMap();
const atributos = new WeakMap();
let idioma = "es";
let observador = null;

function saltar(el) {
  return !el || el.closest?.(SALTAR);
}

function traducirTexto(nodo) {
  const v = nodo.nodeValue;
  if (!v || !v.trim()) return;
  const rec = textos.get(nodo);
  if (rec && v === rec.en) return;
  const padre = nodo.parentElement;
  if (saltar(padre)) return;
  const en = traducir(v);
  if (en === v) {
    textos.delete(nodo);
    return;
  }
  if (padre.tagName === "OPTION" && !padre.hasAttribute("value")) padre.setAttribute("value", padre.textContent);
  textos.set(nodo, { es: v, en });
  nodo.nodeValue = en;
}

function traducirAtributo(el, a) {
  const v = el.getAttribute(a);
  if (!v) return;
  let mapa = atributos.get(el);
  const rec = mapa?.[a];
  if (rec && v === rec.en) return;
  if (saltar(el)) return;
  const en = traducir(v);
  if (en === v) return;
  if (!mapa) atributos.set(el, (mapa = {}));
  mapa[a] = { es: v, en };
  el.setAttribute(a, en);
}

function recorrer(raiz, fnTexto, fnEl) {
  if (raiz.nodeType === 3) return fnTexto(raiz);
  if (raiz.nodeType !== 1) return;
  fnEl(raiz);
  const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n;
  while ((n = w.nextNode())) (n.nodeType === 3 ? fnTexto : fnEl)(n);
}

const aIngles = (raiz) => recorrer(raiz, traducirTexto, (el) => ATRIBUTOS.forEach((a) => el.hasAttribute(a) && traducirAtributo(el, a)));

function aEspanol(raiz) {
  recorrer(
    raiz,
    (n) => {
      const rec = textos.get(n);
      if (rec && n.nodeValue === rec.en) n.nodeValue = rec.es;
      textos.delete(n);
    },
    (el) => {
      const mapa = atributos.get(el);
      if (!mapa) return;
      for (const [a, rec] of Object.entries(mapa)) if (el.getAttribute(a) === rec.en) el.setAttribute(a, rec.es);
      atributos.delete(el);
    }
  );
}

export function aplicarIdioma(nuevo) {
  if (typeof document === "undefined") return;
  idioma = nuevo === "en" ? "en" : "es";
  const html = document.documentElement;
  html.setAttribute("data-idioma", idioma);
  html.setAttribute("lang", idioma === "en" ? "en" : "es-MX");
  observador?.disconnect();
  observador = null;
  if (idioma === "en") {
    aIngles(document.body);
    observador = new MutationObserver((lista) => {
      for (const m of lista) {
        if (m.type === "characterData") traducirTexto(m.target);
        else if (m.type === "attributes") traducirAtributo(m.target, m.attributeName);
        else m.addedNodes.forEach(aIngles);
      }
    });
    observador.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATRIBUTOS });
  } else aEspanol(document.body);
  html.setAttribute("data-idioma-listo", "");
}

export function idiomaGuardado() {
  try {
    return localStorage.getItem(IDIOMA_KEY) || IDIOMA_DEFECTO;
  } catch {
    return IDIOMA_DEFECTO;
  }
}

export function guardarIdioma(l) {
  try {
    localStorage.setItem(IDIOMA_KEY, l);
  } catch {}
  aplicarIdioma(l);
  window.dispatchEvent(new CustomEvent("quickfix-idioma", { detail: l }));
}
