# QuickFix · Another successful procedure

NASA Space Apps Monterrey 2026. Compañero de salud para astronautas en misiones largas. Responde tres preguntas:
**¿Cómo está mi cuerpo? ¿Estoy listo para hoy? ¿Qué hago para mantenerme sano?**
Funciona en modo autónomo (sin depender de la Tierra).

## Correr en tu compu
Requisitos: Node.js 20 o superior.

```bash
npm install
npm run dev
```
Abre http://localhost:3000 (en PowerShell usa `npm.cmd` si `npm` falla por la política de scripts).

- `/` → **Inicio**: silueta con 6 signos vitales y burbuja de Medic, ritmo del día, check-in (con WHO-5 cada 7 días), Medic, índice, sueño, radiación, ejercicio y alergias
- `/analisis` → **Análisis**: NEWS2, alertas con su fuente, tendencia 7/30/90 días, plan de acción, prueba recomendada, sección de radiación (gráfica de 90 días y NOAA GOES) y todas las métricas (`/alerta` redirige aquí)
- `/pruebas` → **Pruebas**: check-in, remedición, ortostática, PVT-B de 3 min, WHO-5, PHQ-9, GAD-7 y rejilla de Amsler
- `/historial` → **Historial**: calendario con semáforo y eventos de radiación, tendencias de 90 días e historia clínica (NOM-004-SSA3-2012)
- `/perfil` → **Perfil**: datos médicos, alergias, valores basales, dosis de carrera previa
- `/reloj` → **Reloj simulado** con tasa de radiación y controles de la demo
- `/bienvenida` → portada con el logo para elegir astronauta

Cambia de astronauta con el selector:
- **Reyes** → 8 noches de sueño corto, VFC baja y reacción lenta (rojo por la regla AASM + PVT, índice 54); 180 mSv de misiones previas
- **Garza** → todo bien (índice 92); 60 mSv previos
- **Torres** → poco ejercicio (riesgo óseo, índice 85); primera misión; alérgico a la penicilina

## Radiación (tres fuentes, como en la NASA)
1. **Dosímetro personal** (Crew Active Dosimeter): `dosis_dia_msv` de cada astronauta, 0.4–0.7 mSv/día y 8–25 en tormenta.
2. **Alarma de la nave** (tipo HERA): tabla `eventos_radiacion`. `iniciarTormenta(nivel)`, `terminarTormenta()` y `confirmarRefugio(id)` en `lib/data.js` sirven igual en modo local y Supabase.
3. **Tierra** (NASA/NOAA): `app/api/clima-espacial` lee el flujo de protones ≥ 10 MeV de GOES (revalida cada 5 min). El dato real no dispara la alarma solo; si llega a S1+ aparece un botón para iniciarla.

Límites: 600 mSv de carrera y 250 mSv en 30 días (NASA-STD-3001 / OCHMO). Verde < 50 %, ámbar ≥ 50 % o tasa > 3 veces la línea base, rojo con tormenta activa o ≥ 80 %. En tormenta la tasa se multiplica (S1 ×3, S2 ×6, S3 ×12, S4 ×25, S5 ×50) y baja a la mitad al confirmar refugio.

## Guion de demo (2 min)
1. Tablet en Reyes: índice 54, Medic explica el sueño corto y la reacción lenta → "Sí, ajústalo".
2. Tocar un punto del cuerpo → burbuja de Medic → "Ver su análisis".
3. En el reloj: **Simular tormenta solar** → alarma S3 en el reloj y en la tablet al mismo tiempo, con el protocolo de refugio.
4. "Ya estoy en refugio" → la tasa baja a la mitad. **Terminar tormenta** → "Evento terminado" con la dosis, guardado en el historial.

## Dónde mover cosas
| Qué | Archivo |
|---|---|
| Umbrales (todos provisionales) | `lib/analysis.js` → `UMBRALES` |
| Fuentes oficiales (nombre, año, URL) | `lib/fuentes.js` |
| Mensajes de Medic, filtro por alergias | `lib/medic.js` |
| Planes de acción | tabla `protocols` (o `lib/mockData.js` en modo local) |
| Datos simulados, perfiles, eventos | `lib/mockData.js` |
| Logos | `public/` |

La IA **no decide** las alertas: las reglas sí. Medic solo explica, no diagnostica, y lo grave lo escala al médico de tripulación. Los cuestionarios son tamizaje, no diagnóstico. El índice de preparación es orientativo.

## Deploy
Sube el repo a GitHub → importa en vercel.com → agrega las dos variables de entorno → Deploy.
