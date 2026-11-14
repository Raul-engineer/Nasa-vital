# QuickFix · Another successful procedure

Proyecto para NASA Space Apps Challenge 2026, evento local Monterrey (14-15 nov). Reto: "Crear software de monitoreo de la salud para astronautas en misiones espaciales". El astronauta debe poder evaluar y actuar sobre su salud por sí mismo, sin depender de la Tierra (misión a Marte, retraso de comunicación).

Concepto: "compañero de salud", no dashboard médico. Responde: ¿cómo está mi cuerpo?, ¿estoy listo para hoy?, ¿qué hago para mantenerme sano? App realista para tablet/PC + reloj inteligente simulado en web. El asistente se llama Medic.

## Stack
- Next.js 16 (App Router, Turbopack), React 19, JavaScript (NO TypeScript)
- Tailwind CSS v4 (@import "tailwindcss" + @theme en app/globals.css). Tokens: accent (rojo del logo #C8102E), violet (datos), ok/warn/crit (semáforo)
- Recharts para gráficas, íconos SVG propios en components/Icons.js (sin lucide). Logos en public/ (components/Marca.js cambia la versión según el tema)
- Supabase opcional (.env.local); sin variables usa datos simulados locales y sincroniza pestañas con BroadcastChannel + localStorage (llaves quickfix_*)
- En Windows/PowerShell usar npm.cmd si npm falla por política de scripts

## Estructura
- app/page.js: Inicio. Silueta + 6 signos con burbuja de Medic, ritmo del día, check-in (WHO-5 cada 7 días), Medic, franja de índice/sueño/radiación/ejercicio/alergias
- app/analisis/page.js: NEWS2, alertas con fuente, tendencia, plan de acción, prueba recomendada, sección de radiación (gráfica 90 días + NOAA), todas las métricas. /alerta redirige aquí
- app/pruebas, app/historial (calendario con eventos de radiación, historia clínica NOM-004), app/perfil, app/bienvenida (logo completo)
- app/reloj/page.js: reloj simulado con tasa de radiación, alarma roja con refugio y controles (iniciar/terminar tormenta)
- app/api/clima-espacial/route.js: flujo de protones ≥10 MeV de NOAA GOES, revalidate 300 s, { flujo, nivel, hora } o { error: true }
- components/: Shell (header, tema, alarma de radiación global), Marca, Radiacion (alarma, tarjeta, NOAA, sección), BodySilhouette (aura de radiación), Pruebas (check-in, remedición, ortostática, PVT-B, WHO-5, PHQ-9, GAD-7, Amsler, PruebaRunner), Widgets (Fuente con "Basado en:"), Charts, Effects, AstronautCard
- lib/analysis.js: motor de reglas (UMBRALES, NEWS2, PRONAM, sueño AASM+PVT, radiación, tamizajes, planes, explicaciones)
- lib/fuentes.js: fuentes oficiales { id, nombre, org, año, url }
- lib/medic.js: mensajes de Medic y filtro por alergias (sin LLM)
- lib/data.js: capa de datos; iniciarTormenta, terminarTormenta, confirmarRefugio (reutilizables por el celular de control)
- lib/mockData.js: 3 astronautas, 90 días, perfiles, historia clínica, protocolos, eventos y tamizajes semilla
- supabase.sql: tablas (astronauts, vitals, checkins, protocols, alerts, profiles, historia_clinica, pruebas, eventos_radiacion) + datos; correrlo de nuevo = reset

## Datos de la demo
- Reyes (id 1): 8 noches ≤ 6 h, VFC baja y reacción lenta → rojo; índice ~54; 180 mSv de carrera previa
- Garza (id 2): todo normal, índice ~92; 60 mSv previos
- Torres (id 3): poco ejercicio 25 días (riesgo óseo), índice ~85; primera misión (0 mSv)
- Tormenta solar S3 hace 18 días (evento histórico); se puede simular una nueva desde /reloj

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
- UI en español de México. Estética: navy, rojo del logo como acento, violeta para datos, semáforo verde/ámbar/rojo.
- Código sin comentarios.
- No inicializar shadcn ni convertir a TypeScript. Los efectos de Aceternity se reescriben como componentes propios en JS.
- Verificar con npm.cmd run build después de cada cambio.
