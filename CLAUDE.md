# QuickFix · Another successful procedure

Proyecto para NASA Space Apps Challenge 2026, evento local Monterrey (14-15 nov). Reto: "Crear software de monitoreo de la salud para astronautas en misiones espaciales". El astronauta debe poder evaluar y actuar sobre su salud por sí mismo, sin depender de la Tierra (misión a Marte, retraso de comunicación).

Concepto: "compañero de salud", no dashboard médico. Responde: ¿cómo está mi cuerpo?, ¿estoy listo para hoy?, ¿qué hago para mantenerme sano? App realista para tablet/PC + reloj inteligente simulado en web. El asistente se llama Medic.

## Stack
- Next.js 16 (App Router, Turbopack), React 19, JavaScript (NO TypeScript)
- Tailwind CSS v4 (@import "tailwindcss" + @theme en app/globals.css). Tokens: accent naranja #ff975d, ok #83e0b7, warn #ffbe72, crit #ff7278, info #7cc4ff (Esfuerzo), cyan #a8fff0 (botones cyber), fg #f9f5f2, muted #a9a0a4, line rgba(255,235,220,.20). Puntos de corte propios: min-[640px] y min-[1100px] (no mezclar con sm:/lg: en la misma propiedad)
- Recharts para gráficas (lib/theme.js: líneas naranjas o del estado, cuadrícula rgba(255,255,255,.06), ejes #a9a0a4, tooltip glass), íconos SVG propios en components/Icons.js (sin lucide). Logos en public/; el header usa public/logo-quickfix-icono.png en un recuadro naranja
- Supabase opcional (.env.local); sin variables usa datos simulados locales y sincroniza pestañas con BroadcastChannel + localStorage (llaves quickfix_*)
- En Windows/PowerShell usar npm.cmd si npm falla por política de scripts

## Estructura
- app/page.js: Inicio por categorías, solo datos. Encabezado "Bienvenido a bordo, <nombre>" + "Día de misión 142"; a la derecha chip de estado general con motivo ("Actúa ahora · Sueño y alerta", "+N") y "Signos vitales: urgencia …" con tooltip NEWS2. Bloque 1 Signos vitales: grid repeat(3,1fr) 1.55fr con 6 tarjetas .metric (fc, spo2, pa, fr, temp, conciencia) en 3×2 y el panel del personaje a la derecha en 2 filas (chip EN VIVO, Estable/Atención/Actúa ahora y motivo). Bloque 2 "✦ Salud en el espacio" (04 INDICADORES): radiacion, vision, huesos, cabina. Bloque 3 "◈ Salud mental y bienestar" (02): sueno y animo anchos. Estado info: punto y minigráfica azules y "Esfuerzo". Pie "Datos simulados · Medic no diagnostica". < 1100 px: personaje arriba a todo lo ancho, signos en 3 columnas, espacio y mental en 2; < 640 px: 2 columnas. Clic en tarjeta → /analisis?var=<clave>
- app/analisis/page.js: sin ?var= muestra la tabla resumen de las 12 variables (Signo · Resultado · Estado ✓/↑/↓/⚡ · Tu normal · Hora), agrupada como Inicio; clic en fila → ?var=<clave>. Con ?var=<clave> (components/analisis/Variable.js): encabezado + selector, monitor en vivo, 4 indicadores (Ahora/Promedio/Mínimo/Máximo, o especiales en conciencia, vision, radiacion, sueno, huesos), barra de rango (no en conciencia ni vision), tendencia 7D/30D/90D/Misión + Diario/Semanal, gráfica extra, Por qué + Prueba recomendada, Qué hacer (4 columnas, 2 acciones + "ver más") y fuente en una línea. Pie: "Datos simulados · Medic no diagnostica…". /alerta redirige aquí
- app/pruebas: el check-in diario (30 s) es la primera tarjeta; cada guardado recalcula las 12 tarjetas
- app/pruebas, app/historial (calendario con eventos de radiación, historia clínica NOM-004), app/perfil, app/bienvenida (logo completo)
- app/reloj/page.js: reloj simulado con tasa de radiación, alarma roja con refugio y controles (iniciar/terminar tormenta)
- PWA: app/manifest.js (íconos en public/icons/), public/sw.js (caché de páginas y assets; abre sin internet en modo local). next.config.mjs con devIndicators: false
- app/api/clima-espacial/route.js: flujo de protones ≥10 MeV de NOAA GOES, revalidate 300 s, { flujo, nivel, hora } o { error: true }
- components/monitor/: un monitor por tipo (Ecg, Pleth, Respiracion, Presion con "Medir ahora", Temperatura 24 h, Conciencia, Radiacion con Geiger y medidores, Sueno hipnograma, Animo, Vision, Huesos, Cabina CO₂ 6 h). Siempre en fondo oscuro tipo monitor de hospital; Marco.js tiene el marco y OndaCanvas (requestAnimationFrame). index.js elige por clave
- components/analisis/: comun.js (chips, indicador, píldoras, horas), Resumen.js (tabla), Rango.js (ZONAS con los mismos umbrales de las tarjetas), Extras.js (gráfica extra por signo), RadiacionExtra.js (módulos HERA, avisos máx. 3, dato real de la NASA), Variable.js
- data/nasa-real.json: { titulo, valor, unidad, periodo, fuente, url, verificado }. Con verificado false la tarjeta sale gris "Pendiente de verificar". No inventar valores; el equipo lo llena con un dato confirmado (OSDR o RadLab)
- lib/simulado.js: generadores con semilla por fecha (hipnograma, temperatura 24 h, CO₂ por hora, horas sobre el límite, módulos de radiación, límite diario de demo 1.5 mSv)
- components/: Shell (header glass: logo, navegación con CyberButton y atajos 1–5 desactivados al escribir, chip de estado, pantalla completa y avatar con iniciales que abre el selector de astronauta; EncabezadoPagina; ChipGeneral; alarma de radiación global; sin botón de tema), CyberButton (esquina cortada, número de atajo, glitch en hover, respeta reduced-motion; úsalo en navegación y acciones: Hacer la prueba, Medir ahora, Guardar), Personaje (astronauta SVG de la referencia; prop estado: estable, atencion, critico, esfuerzo, fatiga, fiebre, radiacion; cambia halo, brillo, tinte del visor y velocidad de flotación; estadoPersonaje(analisis) elige el estado; exporta CATEGORIAS/GRUPOS/ORDEN_*; se reemplazará por un tamagochi, todo vive ahí), RegistrarSW (service worker solo en producción), Radiacion (alarma, tarjeta, NOAA), Widgets (Fuente con "Basado en:"), Charts, Effects, AstronautCard. BodySilhouette ya no se usa en Inicio
- lib/analysis.js: interpretar(clave, datos) → { conclusion, nivel: info|ok|warn|bad, revisado: [{ variable, valor, estado }], acciones, etiqueta }. Cruza signos antes de concluir (gana la primera regla que se cumple; FC alta = > 90 o arriba de tu rango personal). Si da "info" la tarjeta pasa a estado info ("Esfuerzo", azul) y sus alertas también; el estado general y la urgencia ignoran los info. rangoPersonal = percentiles 10–90 de los días −37 a −8 (radiación sin días de tormenta). estadoActividad/efectoActividad aplican ejercicio y fiebre a la lectura viva
- lib/analysis.js: motor de reglas (UMBRALES, VARIABLES, construirTarjetas, NEWS2, PRONAM, sueño AASM+PVT, radiación, tamizajes, planes, explicaciones). Si una tarjeta está peor que las alertas de su variable se crea la alerta tarjeta_<clave>
- lib/fuentes.js: fuentes oficiales { id, nombre, org, año, url }
- lib/medic.js: mensajes de Medic y filtro por alergias (sin LLM)
- lib/data.js: capa de datos; iniciarTormenta, terminarTormenta, confirmarRefugio (reutilizables por el celular de control)
- lib/mockData.js: 3 astronautas, 90 días, perfiles, historia clínica, protocolos, eventos y tamizajes semilla
- supabase.sql: tablas (astronauts, vitals, checkins, protocols, alerts, profiles, historia_clinica, pruebas, eventos_radiacion, cabina) + datos; correrlo de nuevo = reset

## Datos de la demo
- Reyes (id 1): 8 noches ≤ 6 h, VFC baja y reacción lenta → Actúa ahora; Por qué de FC: "Fatiga y estrés acumulado"; WHO-5 40; índice ~56; 180 mSv de carrera previa
- Garza (id 2): pico de CO₂ (3,900 y 4,300 ppm) con dolor de cabeza los últimos 2 días → Precaución; Por qué de visión: "Probablemente por el CO₂ de la cabina"; índice ~93; 60 mSv previos
- Torres (id 3): 25 días debajo de su ejercicio prescrito (rojo) y garganta hoy → Actúa ahora; índice ~85; primera misión (0 mSv)
- La FC simulada tiene variación diaria extra (rnd3, semilla 314) para que el rango personal no salga angosto
- Tormenta solar S3 hace 18 días (evento histórico); se puede simular una nueva desde /reloj

## Las 12 tarjetas de Inicio (claves de /analisis?var=)
Signos vitales: fc, spo2, pa, fr, temp, conciencia. Salud en el espacio: radiacion, vision, huesos, cabina. Salud mental y bienestar: sueno, animo. La tabla de /analisis usa los mismos grupos.
- fc: lpm + VFC. Ámbar 91–100, ≤ 50 o VFC 20 % abajo de la línea base; rojo > 100 o ≤ 40 (NEWS2)
- pa: sistólica/diastólica + última ortostática. Ámbar ≥ 130/85 o sistólica ≤ 100; rojo ≥ 140/90 o ≤ 90 (PRONAM, NEWS2)
- fr: ámbar 9–11 o 21–24; rojo ≤ 8 o ≥ 25 (NEWS2)
- temp: °C + síntomas. Ámbar 38.1–39.0, ≤ 36.0 o algún síntoma; rojo ≥ 39.1, ≤ 35.0 o fiebre con 2+ síntomas (NEWS2, NASA sistema inmune)
- spo2: ámbar 90–94; rojo < 90 (OMS, NEWS2)
- conciencia: Alerta/Confuso + mareo. Ámbar mareo; rojo confusión (NEWS2, NASA sensoriomotor)
- radiacion: µSv/h + carrera vs 600. Ámbar ≥ 50 % de un límite o tormenta con refugio; rojo tormenta sin refugio o ≥ 80 % (NASA-STD-3001, OCHMO)
- sueno: horas + reacción. Ámbar < 7 h tres noches, reacción 15 % más lenta o fatiga ≥ 4; rojo ≤ 6 h tres noches y reacción lenta (AASM, PVT-B)
- animo: WHO-5 + estrés y tripulación. Ámbar WHO-5 ≤ 50, ánimo ≤ 2, estrés ≥ 4 o tripulación ≤ 2; rojo WHO-5 ≤ 28 (WHO-5, NASA salud mental)
- vision: OK/Revisar + Amsler. Ámbar visión borrosa o dolor de cabeza; nunca rojo (NASA SANS)
- huesos: % del ejercicio prescrito (perfil, 120 min por defecto) + fuerza/cardio. Ámbar < 80 %; rojo 5 días seguidos debajo (NASA OCHMO)
- cabina: CO₂ ppm + temperatura y humedad del módulo. Ámbar ≥ 3,500; rojo ≥ 5,000 (umbrales de demo, UMBRALES.cabina.umbralesDeDemo)

## Actividad y atajos de la demo
- actividad: { estado: reposo | ejercicio | recuperacion, desde, fiebre } en mocks (actividadSemilla), modo local (quickfix_local_v1.actividad) y tabla actividad de supabase.sql. No se muestra en la interfaz; solo aparece como chip en "Por qué" cuando explica el cambio
- Ejercicio: FC +30 a +50, FR +6 a +10, temperatura +0.3 a +0.6, SpO₂ igual (subida en ~12 s). Recuperación: vuelve a lo normal en 10 min y cuenta como esfuerzo 30 min. Fiebre: 38.4 °C, +10 lpm por °C y síntoma garganta. Mientras no esté en reposo, useQuickFix recalcula cada 3 s
- Atajos ocultos (useAtajosDemo, en Shell y /reloj): Shift + E alterna ejercicio ↔ recuperación; Shift + F alterna fiebre. /reloj tiene los mismos interruptores
- "Medir ahora" de presión guarda una prueba tipo presion (lecturaActual la usa como la presión actual)

## Radiación
- Fuentes: dosímetro personal (dosis_dia_msv), alarma de la nave tipo HERA (eventos_radiacion) y NOAA GOES (dato real que nunca dispara la alarma solo)
- Carrera = dosis previa + misión vs 600 mSv; 30 días vs 250 mSv; tasa µSv/h = dosis del día / 24 × 1000
- Tormenta: S1 ×3, S2 ×6, S3 ×12, S4 ×25, S5 ×50; refugio ×0.5. Escala NOAA (pfu): S1 ≥10, S2 ≥100, S3 ≥1,000, S4 ≥10,000, S5 ≥100,000
- Verde < 50 % de ambos límites; ámbar ≥ 50 % o tasa > 3× la línea base; rojo con tormenta activa o ≥ 80 %

## Reglas con fuente
- Sueño: ≥ 7 h normal; < 7 h tres noches ámbar; ≤ 6 h tres noches + PVT peor que la línea base rojo (AASM/SRS 2015, Basner 2011)
- PVT-B: 3 min, estímulo cada 1–4 s, lapso ≥ 355 ms, falsa alarma < 100 ms o antes del estímulo
- SpO₂: NEWS2 y < 90 % rojo con aviso de emergencia (NEWS2 + OMS)
- Presión: PRONAM HAS es la regla principal
- Ortostática: caída ≥ 20 sistólica o ≥ 10 diastólica en 3 min = positiva (ámbar)
- WHO-5 cada 7 días: ≤ 50 sugiere PHQ-9; ≤ 28 ámbar y aviso al médico
- PHQ-9 y GAD-7 semanales: ≥ 10 ámbar y aviso; PHQ-9 pregunta 9 > 0 aviso inmediato (rojo). Siempre "tamizaje, no diagnóstico"
- Amsler: complemento; nunca rojo por sí sola; se combina con las preguntas de visión (SANS)

## Reglas del proyecto
- Las reglas deciden las alertas; la IA (Medic) solo explica. Nunca diagnostica.
- Cada alerta o explicación muestra su fuente ("Basado en: …") desde lib/fuentes.js.
- El índice de preparación es orientativo, no una autorización médica.
- UI en español de México. Estética glass (referencia visual en docs/referencia-diseno.html; no copiar su contenido ni su JS): fondo #100f13 con degradados cálidos, líneas diagonales y 3 orbs fijos (layout.js); clase .card/.glass = vidrio (blur 25px saturate 145%, radio 23 px, brillo diagonal); .glass-hover sube 5 px; fuentes DM Sans (texto) y Space Grotesk (títulos y números, clases titulo-pagina y num) con next/font/google; chips con punto (.dot-estado). Solo tema oscuro. El monitor de Análisis conserva su fondo de monitor dentro de una tarjeta glass. Sin eyebrows en inglés ni párrafos explicativos.
- Código sin comentarios.
- No inicializar shadcn ni convertir a TypeScript. Los efectos de Aceternity se reescriben como componentes propios en JS.
- Verificar con npm.cmd run build después de cada cambio.
