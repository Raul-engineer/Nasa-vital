export const FUENTES_LISTA = [
  { id: "news2", nombre: "NEWS2", org: "RCP", año: 2017, url: "https://www.rcp.ac.uk/media/a4ibkkbf/news2-final-report_0_0.pdf" },
  { id: "pronam", nombre: "PRONAM HAS", org: "México", año: 2025, url: "https://www.dof.gob.mx/2025/CSG/PRONAM_Hipertension_Arterial_Sistemica.pdf" },
  { id: "aasm", nombre: "Duración de sueño en adultos", org: "AASM/SRS", año: 2015, url: "https://www.aasm.org/resources/pdf/adultsleepdurationconsensus.pdf" },
  { id: "pvtb", nombre: "PVT-B", org: "Basner", año: 2011, url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3197786/" },
  { id: "who5", nombre: "WHO-5", org: "Topp", año: 2015, url: "https://pubmed.ncbi.nlm.nih.gov/25831962/" },
  { id: "phq9", nombre: "PHQ-9", org: "Kroenke", año: 2001, url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC1495268/pdf/jgi_01114.pdf" },
  { id: "gad7", nombre: "GAD-7", org: "Spitzer", año: 2006, url: "https://depts.washington.edu/psychres/wordpress/wp-content/uploads/2017/09/gad7_ref.pdf" },
  { id: "ortostatica", nombre: "Consenso de hipotensión ortostática", org: null, año: null, url: "https://pubmed.ncbi.nlm.nih.gov/38123372/" },
  { id: "amsler", nombre: "Rejilla de Amsler", org: "estudios clínicos", año: null, url: "https://pubmed.ncbi.nlm.nih.gov/36795396/" },
  { id: "nasa_sans", nombre: "SANS", org: "NASA", año: null, url: null },
  { id: "oms_oximetria", nombre: "Oximetría de pulso", org: "OMS", año: null, url: null },
  { id: "nasa3001", nombre: "NASA-STD-3001 Vol. 1 Rev. C", org: "NASA", año: null, url: "https://standards.nasa.gov/sites/default/files/standards/NASA/C//nasa-std-3001-vol-1-rev-c-signature.pdf" },
  { id: "ochmo", nombre: "Radiation Protection Technical Brief", org: "NASA OCHMO", año: 2023, url: "https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf" },
  { id: "hera", nombre: "Dosímetro personal y HERA", org: "NASA SRAG", año: null, url: "https://srag.jsc.nasa.gov/SpaceRadiation/How/How.cfm" },
  { id: "noaa", nombre: "GOES Proton Flux", org: "NOAA SWPC", año: null, url: "https://www.swpc.noaa.gov/products/goes-proton-flux" },
];

export const FUENTES_POR_ID = Object.fromEntries(FUENTES_LISTA.map((f) => [f.id, f]));

export function fuenteTexto(f) {
  const extra = [f.org, f.año].filter(Boolean).join(", ");
  return extra ? `${f.nombre} (${extra})` : f.nombre;
}

export function partesFuente(valor) {
  if (!valor) return [];
  return String(valor)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (FUENTES_POR_ID[t] ? { ...FUENTES_POR_ID[t], texto: fuenteTexto(FUENTES_POR_ID[t]) } : { id: null, texto: t, url: null }));
}

export function textoFuentes(valor) {
  return partesFuente(valor).map((p) => p.texto).join(" · ");
}
