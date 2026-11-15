"use client";

const ESQUINA = "pointer-events-none absolute block w-1/2 transition-all duration-300 ease-out";

export default function BotonPestana({ activo = false, onClick, children, className = "", ...resto }) {
  const borde = activo ? "border-cyan drop-shadow-[0_0_6px_rgba(168,255,240,0.7)]" : "border-[#D4EDF9]/70 drop-shadow-[0_0_4px_rgba(212,237,249,0.35)]";
  return (
    <button type="button" onClick={onClick} data-activo={activo ? "si" : undefined} {...resto}
      className={`group relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-lg px-5 py-2.5 font-display text-[12px] font-semibold uppercase tracking-[0.1em] transition-[transform,background-color,color] duration-300 ease-in-out outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white active:scale-[0.97] backdrop-blur-md ${activo ? "bg-[rgba(16,48,54,0.88)] text-white" : "bg-[rgba(8,10,24,0.74)] text-[#dbe4f5] hover:bg-[rgba(18,22,44,0.85)] hover:text-white"} ${className}`}>
      <span className="relative z-20 inline-flex items-center gap-1.5">{children}</span>
      <span aria-hidden className="pointer-events-none absolute left-[-75%] top-0 z-10 h-full w-1/2 rotate-12 bg-white/20 blur-lg transition-all duration-1000 ease-in-out group-hover:left-[125%]" />
      <span aria-hidden className={`${ESQUINA} ${borde} left-0 top-0 rounded-tl-lg border-l-2 border-t-2 ${activo ? "h-[90%]" : "h-[20%]"}`} />
      <span aria-hidden className={`${ESQUINA} ${borde} right-0 top-0 rounded-tr-lg border-r-2 border-t-2 ${activo ? "h-[90%]" : "h-[60%] group-hover:h-[90%]"}`} />
      <span aria-hidden className={`${ESQUINA} ${borde} bottom-0 left-0 rounded-bl-lg border-b-2 border-l-2 ${activo ? "h-[90%]" : "h-[60%] group-hover:h-[90%]"}`} />
      <span aria-hidden className={`${ESQUINA} ${borde} bottom-0 right-0 rounded-br-lg border-b-2 border-r-2 ${activo ? "h-[90%]" : "h-[20%]"}`} />
    </button>
  );
}
