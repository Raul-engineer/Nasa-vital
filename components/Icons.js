const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };

export function Icon({ name, size = 22, className = "" }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", className, ...base };
  switch (name) {
    case "home":
      return <svg {...p}><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></svg>;
    case "heart":
      return <svg {...p}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /><path d="M7 12h2.5l1.5-2.5 2 5 1.5-2.5H17" /></svg>;
    case "moon":
      return <svg {...p}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /></svg>;
    case "rad":
      return <svg {...p}><circle cx="12" cy="12" r="1.8" /><path d="M12 3.5a8.5 8.5 0 0 1 7.4 4.3L13.6 11" /><path d="M19.4 16.2A8.5 8.5 0 0 1 12 20.5V14" /><path d="M4.6 16.2A8.5 8.5 0 0 1 4.6 7.8L10.4 11" /></svg>;
    case "bone":
      return <svg {...p}><path d="M8.5 15.5l7-7" /><path d="M7 14a2.2 2.2 0 1 0-1.6 3.6A2.2 2.2 0 1 0 9 19l1-1" /><path d="M17 10a2.2 2.2 0 1 0 1.6-3.6A2.2 2.2 0 1 0 15 5l-1 1" /></svg>;
    case "brain":
      return <svg {...p}><path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3V4z" /><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3V4z" /></svg>;
    case "doc":
      return <svg {...p}><path d="M6 3h9l3 3v15H6z" /><path d="M9 10h6M9 14h6M9 18h4" /></svg>;
    case "watch":
      return <svg {...p}><circle cx="12" cy="12" r="6" /><path d="M9 6l1-3h4l1 3M9 18l1 3h4l1-3M12 9.5V12l1.5 1.5" /></svg>;
    case "alert":
      return <svg {...p}><path d="M12 3l9.5 17h-19z" /><path d="M12 10v4M12 17.5v.01" /></svg>;
    case "clock":
      return <svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>;
    case "doctor":
      return <svg {...p}><circle cx="12" cy="7" r="3.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /><path d="M12 14v4M10 16h4" /></svg>;
    case "check":
      return <svg {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
    case "back":
      return <svg {...p}><path d="M15 5l-7 7 7 7" /></svg>;
    case "chev":
      return <svg {...p}><path d="M9 5l7 7-7 7" /></svg>;
    case "info":
      return <svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8v.01" /></svg>;
    case "clipboard":
      return <svg {...p}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3" /></svg>;
    case "target":
      return <svg {...p}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" /></svg>;
    case "smile":
      return <svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M8.5 14a4.5 4.5 0 0 0 7 0M9 9.5v.01M15 9.5v.01" /></svg>;
    case "bolt":
      return <svg {...p}><path d="M13 3L5 13.5h6L10 21l8-10.5h-6z" /></svg>;
    case "battery":
      return <svg {...p}><rect x="7" y="4" width="10" height="17" rx="2" /><path d="M10 2.5h4M10 15h4M10 11h4" /></svg>;
    case "signal":
      return <svg {...p}><path d="M4 20v-3M9 20v-6M14 20v-9M19 20V5" /></svg>;
    case "trend":
      return <svg {...p}><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></svg>;
    case "lungs":
      return <svg {...p}><path d="M12 4v8M12 12l-3 2M12 12l3 2" /><path d="M9 8c-3 0-5 5-5 10 0 2 2 2.5 4 1.5S9 17 9 15V8zM15 8c3 0 5 5 5 10 0 2-2 2.5-4 1.5S15 17 15 15V8z" /></svg>;
    case "thermo":
      return <svg {...p}><path d="M10 14.5V5a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0z" /><path d="M12 9v7" /></svg>;
    case "o2":
      return <svg {...p}><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" /><path d="M10 15.5a1.6 1.6 0 1 0 0-.01M14 14.5h1.5l-1.5 2h1.5" /></svg>;
    case "bp":
      return <svg {...p}><rect x="3" y="7" width="12" height="10" rx="2" /><path d="M15 12h3a3 3 0 0 1 3 3v2" /><path d="M6 12h2l1-2 1.5 4 1-2H13" /></svg>;
    case "medic":
      return <svg {...p}><circle cx="12" cy="6.5" r="3.3" /><path d="M5 21v-1.8A5.5 5.5 0 0 1 10.5 13.7h3A5.5 5.5 0 0 1 19 19.2V21" /><path d="M9.3 14v2.6a2.2 2.2 0 0 0 4.4 0V15" /><path d="M14.8 14v1.6" /><circle cx="14.8" cy="17.3" r="1.3" /></svg>;
    case "eye":
      return <svg {...p}><path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></svg>;
    case "sun":
      return <svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></svg>;
    case "calendar":
      return <svg {...p}><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>;
    case "user":
      return <svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" /></svg>;
    case "flask":
      return <svg {...p}><path d="M9.5 3h5M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3" /><path d="M7.5 15h9" /></svg>;
    case "scale":
      return <svg {...p}><rect x="3.5" y="4" width="17" height="16" rx="3" /><path d="M8.5 9a5 5 0 0 1 7 0M12 9.5l1.5-2" /></svg>;
    case "chart":
      return <svg {...p}><path d="M4 20V4M4 20h16" /><path d="M8 16v-4M12 16V8M16 16v-6" /></svg>;
    case "shield":
      return <svg {...p}><path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6z" /></svg>;
    case "pill":
      return <svg {...p}><rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-35 12 12)" /><path d="M9.2 8l5.6 8" /></svg>;
    case "cabina":
      return <svg {...p}><rect x="3" y="5" width="18" height="14" rx="4" /><circle cx="12" cy="12" r="3.2" /><path d="M12 8.8v-1.6M12 16.8v-1.6M8.8 12H7.2M16.8 12h-1.6" /></svg>;
    case "compress":
      return <svg {...p}><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></svg>;
    case "x":
      return <svg {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>;
    case "standing":
      return <svg {...p}><circle cx="12" cy="4.5" r="2" /><path d="M12 7.5v7M12 14.5l-2.5 6.5M12 14.5l2.5 6.5M8 10.5l4-2 4 2" /></svg>;
    case "sparkle":
      return <svg {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" /></svg>;
    case "bed":
      return <svg {...p}><path d="M3 18V6M3 14h18v4M21 14v-3a3 3 0 0 0-3-3h-7v6" /><circle cx="7" cy="11" r="1.8" /></svg>;
    case "dumbbell":
      return <svg {...p}><path d="M7 7v10M4 9v6M17 7v10M20 9v6M7 12h10" /></svg>;
    case "drop":
      return <svg {...p}><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" /></svg>;
    default:
      return <svg {...p}><circle cx="12" cy="12" r="8" /></svg>;
  }
}
