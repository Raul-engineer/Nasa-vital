drop table if exists eventos_radiacion cascade;
drop table if exists pruebas cascade;
drop table if exists historia_clinica cascade;
drop table if exists profiles cascade;
drop table if exists alerts cascade;
drop table if exists checkins cascade;
drop table if exists vitals cascade;
drop table if exists protocols cascade;
drop table if exists astronauts cascade;

select setseed(0.42);

create table astronauts (
  id          int generated always as identity primary key,
  nombre      text not null,
  rol         text not null,
  dia_mision  int  not null default 142
);

create table vitals (
  id                 bigint generated always as identity primary key,
  astronaut_id       int  not null references astronauts(id) on delete cascade,
  fecha              date not null,
  fc                 int,
  vfc                int,
  spo2               numeric(4,1),
  sistolica          int,
  diastolica         int,
  temperatura        numeric(3,1),
  frec_resp          int,
  horas_sueno        numeric(3,1),
  dosis_dia_msv      numeric(6,3),
  minutos_ejercicio  int,
  peso               numeric(5,1),
  unique (astronaut_id, fecha)
);

create table checkins (
  id                  bigint generated always as identity primary key,
  astronaut_id        int  not null references astronauts(id) on delete cascade,
  fecha               date not null,
  animo               smallint check (animo between 1 and 5),
  estres              smallint check (estres between 1 and 5),
  fatiga              smallint check (fatiga between 1 and 5),
  tiempo_reaccion_ms  int,
  confusion           boolean not null default false,
  vision_cefalea      boolean not null default false,
  mareo_de_pie        boolean not null default false,
  nota                text,
  unique (astronaut_id, fecha)
);

create table protocols (
  id               int generated always as identity primary key,
  clave            text unique not null,
  sistema          text not null,
  nivel            text not null check (nivel in ('atencion','critico')),
  condicion        text not null,
  acciones         text[] not null,
  ahora            text[] not null default '{}',
  hoy              text[] not null default '{}',
  prevenir         text[] not null default '{}',
  escalar          text[] not null default '{}',
  prueba_sugerida  text check (prueba_sugerida in ('remedicion','ortostatica','reaccion','who5','phq9','gad7','amsler')),
  fuente           text
);

create table alerts (
  id            bigint generated always as identity primary key,
  astronaut_id  int  not null references astronauts(id) on delete cascade,
  fecha         date not null default current_date,
  sistema       text not null,
  nivel         text not null check (nivel in ('atencion','critico')),
  mensaje       text not null,
  clave         text,
  resuelta      boolean not null default false,
  creada_en     timestamptz not null default now()
);

create table profiles (
  astronaut_id              int primary key references astronauts(id) on delete cascade,
  edad                      int,
  sexo                      text,
  peso_kg                   numeric(5,1),
  estatura_cm               int,
  tipo_sangre               text,
  alergias                  jsonb not null default '[]',
  medicamentos              jsonb not null default '[]',
  condiciones_cronicas      jsonb not null default '[]',
  fc_basal                  int,
  pa_basal                  text,
  spo2_basal                numeric(4,1),
  dosis_carrera_previa_msv  numeric(6,1) not null default 0,
  misiones_previas          int not null default 0,
  dias_espacio_previos      int not null default 0,
  usa_lentes                boolean not null default false,
  contacto_emergencia       jsonb,
  actualizado_en            timestamptz not null default now()
);

create table historia_clinica (
  astronaut_id             int primary key references astronauts(id) on delete cascade,
  heredofamiliares         jsonb not null default '{}',
  personales_patologicos   jsonb not null default '{}',
  no_patologicos           jsonb not null default '{}',
  padecimiento_actual      text,
  interrogatorio_sistemas  jsonb not null default '{}',
  espacial                 jsonb not null default '{}',
  actualizado_en           timestamptz not null default now()
);

create table pruebas (
  id              bigint generated always as identity primary key,
  astronaut_id    int  not null references astronauts(id) on delete cascade,
  tipo            text not null check (tipo in ('checkin','remedicion','ortostatica','reaccion','who5','phq9','gad7','amsler')),
  fecha           date not null default current_date,
  resultado       jsonb not null default '{}',
  interpretacion  text,
  desenlace       text check (desenlace in ('mejoro','igual','empeoro')),
  creada_en       timestamptz not null default now()
);

create table eventos_radiacion (
  id       bigint generated always as identity primary key,
  inicio   timestamptz not null default now(),
  fin      timestamptz,
  nivel    text not null check (nivel in ('S1','S2','S3','S4','S5')),
  origen   text not null default 'simulado' check (origen in ('simulado','noaa')),
  refugio  jsonb not null default '{}'
);

insert into astronauts (nombre, rol) values
  ('Cmdr. A. Reyes', 'Comandante'),
  ('Dra. L. Garza', 'Médica de tripulación'),
  ('Ing. M. Torres', 'Ingeniero de vuelo');

insert into vitals (astronaut_id, fecha, fc, vfc, spo2, sistolica, diastolica,
                    temperatura, frec_resp, horas_sueno, dosis_dia_msv, minutos_ejercicio, peso)
select
  a.id,
  current_date - (89 - d),
  round(60 + a.id*2 + random()*6
        + case when a.id = 1 and d >= 82 then 9 else 0 end),
  round(68 - a.id*3 + random()*8
        - case when a.id = 1 and d >= 82 then 22 else 0 end),
  round((97 + random()*2)::numeric, 1),
  round(111 + random()*8),
  round(68 + random()*10),
  round((36.4 + random()*0.5)::numeric, 1),
  round(13 + random()*4),
  round((case when a.id = 1 and d >= 82 then 4.6 + random()*1.0
              else 7.0 + random()*1.2 end)::numeric, 1),
  round((case when d between 70 and 72 then 8 + random()*17
              else (0.4 + random()*0.3) * case a.id when 1 then 1 when 2 then 0.9 else 1.15 end end)::numeric, 3),
  round(case when a.id = 3 and d >= 65 then 40 + random()*25
             else 115 + random()*35 end),
  round((case a.id when 1 then 64 when 2 then 58 else 82 end - d*0.008 + random()*0.4)::numeric, 1)
from astronauts a
cross join generate_series(0, 89) as d;

insert into checkins (astronaut_id, fecha, animo, estres, fatiga, tiempo_reaccion_ms)
select
  a.id,
  current_date - (89 - d),
  greatest(1, least(5, round(4 + random()   - case when a.id = 1 and d >= 82 then 2 else 0 end)))::smallint,
  greatest(1, least(5, round(2 + random()   + case when a.id = 1 and d >= 82 then 2 else 0 end
                                            + case when d between 70 and 72 then 1 else 0 end)))::smallint,
  greatest(1, least(5, round(2 + random()   + case when a.id = 1 and d >= 82 then 2 else 0 end)))::smallint,
  round(270 + random()*40 + case when a.id = 1 and d >= 82 then 90 else 0 end)
from astronauts a
cross join generate_series(0, 89) as d;

insert into protocols (clave, sistema, nivel, condicion, acciones, ahora, hoy, prevenir, escalar, prueba_sugerida, fuente) values
  ('vfc_sueno', 'sueno', 'atencion', 'VFC bajo tu línea base 3+ días y sueño corto 3+ noches',
   array['Pausa de 10 min con respiración lenta (6 respiraciones por minuto)', 'Adelantar 1 h la hora de dormir', 'Bajar el ejercicio a intensidad moderada por 48 h']::text[],
   array['Pausa de 10 min con respiración lenta (6 respiraciones por minuto)']::text[],
   array['Adelantar 1 h la hora de dormir', 'Bajar el ejercicio a intensidad moderada por 48 h', 'Pedir reprogramar tareas críticas de mañana']::text[],
   array['Sin pantallas 45 min antes de dormir y luz cálida en el módulo', 'Horario fijo de sueño de 22:00 a 06:00 (7 h o más)']::text[],
   array['Si la prueba de reacción sigue peor que tu línea base o hay errores en tareas críticas', 'Si la falta de sueño sigue 3 noches más']::text[],
   'reaccion', 'aasm,pvtb,Tu línea base personal'),
  ('vfc', 'cardiovascular', 'atencion', 'VFC 20 % bajo tu línea base 3 días seguidos',
   array['Siéntate y respira lento 5 min', 'Bajar la intensidad del ejercicio a moderada por 48 h', 'Hidratación: mínimo 2.5 L']::text[],
   array['Siéntate y respira lento 5 min']::text[],
   array['Bajar la intensidad del ejercicio a moderada por 48 h', 'Hidratación: mínimo 2.5 L']::text[],
   array['Repetir la medición mañana en ayunas', 'Mantener horario fijo de sueño']::text[],
   array['Si aparece dolor en el pecho, palpitaciones o falta de aire']::text[],
   'remedicion', 'Tu línea base personal'),
  ('fc_base', 'cardiovascular', 'atencion', 'FC en reposo 10 lpm sobre tu línea base',
   array['Reposo sentado 5 min y repetir la medición', 'Hidratación: mínimo 2.5 L', 'Evitar cafeína el resto del día']::text[],
   array['Reposo sentado 5 min y repetir la medición']::text[],
   array['Hidratación: mínimo 2.5 L', 'Evitar cafeína el resto del día']::text[],
   array['Dormir 7–8 h', 'Mantener el ejercicio aeróbico del plan']::text[],
   array['Si la FC en reposo pasa de 110 lpm o hay síntomas']::text[],
   'remedicion', 'Tu línea base personal'),
  ('news2', 'respiratorio', 'atencion', 'NEWS2 de 5–6 o algún signo con 3 puntos',
   array['Suspender actividad física y EVA', 'Repetir signos vitales en reposo ahora', 'Medir signos cada 4 h']::text[],
   array['Suspender actividad física y EVA', 'Repetir signos vitales en reposo ahora']::text[],
   array['Medir signos cada 4 h', 'Si hay fiebre > 38.5 °C: paracetamol 500 mg del botiquín, según indique el médico de tripulación']::text[],
   array['Hidratación y descanso', 'Lavado de manos y limpieza de superficies compartidas']::text[],
   array['Avisar al médico de tripulación de inmediato (respuesta urgente)']::text[],
   'remedicion', 'news2'),
  ('news2_alto', 'respiratorio', 'critico', 'NEWS2 de 7 o más',
   array['Avisar al médico de tripulación ahora', 'Reposo y no quedarse solo', 'Monitoreo continuo de signos vitales']::text[],
   array['Avisar al médico de tripulación ahora', 'Reposo y no quedarse solo']::text[],
   array['Monitoreo continuo de signos vitales', 'Oxígeno según el protocolo del módulo médico si la SpO₂ es ≤ 91 %']::text[],
   array['Revisar el plan con el médico de tripulación al estabilizarse']::text[],
   array['Emergencia: el médico de tripulación decide la consulta con Tierra']::text[],
   'remedicion', 'news2'),
  ('spo2_emergencia', 'respiratorio', 'critico', 'SpO₂ menor a 90 %',
   array['Emergencia: avisar al médico de tripulación ahora', 'Sentarse erguido y respirar lento', 'Oxígeno según el protocolo del módulo médico']::text[],
   array['Emergencia: avisar al médico de tripulación ahora', 'Sentarse erguido y respirar lento', 'Oxígeno según el protocolo del módulo médico']::text[],
   array['Repetir la oximetría cada 15 min con buena señal (dedo tibio, sin movimiento)']::text[],
   array['Revisar el plan con el médico de tripulación al estabilizarse']::text[],
   array['Si hay falta de aire, confusión o labios azulados: emergencia médica']::text[],
   'remedicion', 'news2,oms_oximetria'),
  ('presion_alta', 'cardiovascular', 'atencion', 'Presión ≥ 140/90 mmHg',
   array['Reposo sentado 5 min y repetir la medición', 'Reducir la sal en las comidas de hoy', 'Medir la presión en la mañana y en la noche']::text[],
   array['Reposo sentado 5 min y repetir la medición']::text[],
   array['Reducir la sal en las comidas de hoy', 'Medir la presión en la mañana y en la noche']::text[],
   array['Ejercicio aeróbico diario según el plan', 'Dormir 7–8 h']::text[],
   array['Si llega a 180/110 o hay dolor de cabeza intenso, visión borrosa o dolor en el pecho']::text[],
   'remedicion', 'pronam'),
  ('presion_urgencia', 'cardiovascular', 'critico', 'Presión ≥ 180/110 mmHg (urgencia hipertensiva)',
   array['Suspender toda actividad y quedarse en reposo', 'Avisar al médico de tripulación ahora', 'Repetir la presión cada 15 min']::text[],
   array['Suspender toda actividad y quedarse en reposo', 'Avisar al médico de tripulación ahora']::text[],
   array['Repetir la presión cada 15 min']::text[],
   array['Revisar el plan con el médico de tripulación']::text[],
   array['Dolor en el pecho, falta de aire, confusión o cambios en la visión: emergencia']::text[],
   'remedicion', 'pronam'),
  ('ortostatica', 'cardiovascular', 'atencion', 'Mareo al ponerse de pie o prueba ortostática positiva',
   array['Siéntate o acuéstate hasta que pase el mareo', 'Haz la prueba ortostática', 'Hidratación: 2.5 L con electrolitos']::text[],
   array['Siéntate o acuéstate hasta que pase el mareo', 'Haz la prueba ortostática']::text[],
   array['Hidratación: 2.5 L con electrolitos', 'Levántate despacio, en dos tiempos']::text[],
   array['Mantener el ejercicio de resistencia de piernas']::text[],
   array['Si te desmayas o la prueba ortostática sale positiva']::text[],
   'ortostatica', 'ortostatica'),
  ('sans', 'vision', 'atencion', 'Visión borrosa o dolor de cabeza (check-in)',
   array['Descansa la vista 10 min y haz la rejilla de Amsler', 'Prueba de agudeza visual con la tabla del módulo médico', 'Revisar tu presión arterial']::text[],
   array['Descansa la vista 10 min y haz la rejilla de Amsler']::text[],
   array['Prueba de agudeza visual con la tabla del módulo médico', 'Revisar tu presión arterial']::text[],
   array['Registrar cada día si hay cambios en la visión', 'Usar tus lentes si los tienes']::text[],
   array['Si la visión empeora o el dolor de cabeza no cede en 24 h: revisión de fondo de ojo con el médico de tripulación']::text[],
   'amsler', 'nasa_sans,amsler'),
  ('amsler', 'vision', 'atencion', 'Distorsión en la rejilla de Amsler (complemento, nunca rojo por sí sola)',
   array['Repite la rejilla con buena luz y con tus lentes puestos', 'Contesta las preguntas de visión del check-in', 'Avisar al médico de tripulación para revisión de ojos']::text[],
   array['Repite la rejilla con buena luz y con tus lentes puestos']::text[],
   array['Contesta las preguntas de visión del check-in', 'Avisar al médico de tripulación para revisión de ojos']::text[],
   array['Hacer la rejilla de Amsler una vez por semana']::text[],
   array['Si la distorsión aumenta o aparece una mancha fija en la visión']::text[],
   'amsler', 'amsler,nasa_sans'),
  ('confusion', 'salud_mental', 'critico', 'Confusión o desorientación (check-in)',
   array['Avisar al médico de tripulación ahora', 'No quedarse solo: un compañero te acompaña', 'Revisión de signos vitales y glucosa con el médico de tripulación']::text[],
   array['Avisar al médico de tripulación ahora', 'No quedarse solo: un compañero te acompaña']::text[],
   array['Revisión de signos vitales y glucosa con el médico de tripulación']::text[],
   array['Dormir 7–8 h e hidratarse']::text[],
   array['Respuesta urgente: el médico de tripulación decide la consulta con Tierra']::text[],
   'remedicion', 'news2'),
  ('sueno', 'sueno', 'atencion', 'Menos de 7 h tres noches seguidas (rojo: ≤ 6 h y reacción peor que tu línea base)',
   array['Siesta corta de 20 min si tu horario lo permite', 'Adelantar 1 h la hora de dormir', 'Sin pantallas 45 min antes de dormir']::text[],
   array['Siesta corta de 20 min si tu horario lo permite']::text[],
   array['Adelantar 1 h la hora de dormir', 'Sin pantallas 45 min antes de dormir']::text[],
   array['Luz cálida en el módulo por la noche', 'Horario fijo de sueño de 7 h o más']::text[],
   array['Si la falta de sueño sigue 3 noches más o afecta tareas críticas']::text[],
   'reaccion', 'aasm,pvtb'),
  ('radiacion_tormenta', 'radiacion', 'critico', 'Alarma de la nave: tormenta solar activa (S1 a S5)',
   array['Suspender caminatas espaciales y tareas fuera de zonas protegidas', 'Ir al área más blindada de la nave', 'Rodearse de agua y suministros como blindaje']::text[],
   array['Suspender caminatas espaciales y tareas fuera de zonas protegidas', 'Ir al área más blindada de la nave', 'Rodearse de agua y suministros como blindaje', 'Mantener el dosímetro puesto']::text[],
   array['Esperar el aviso de fin de evento', 'Registrar tu dosis personal al salir del refugio']::text[],
   array['Revisar el clima espacial (NOAA) en cada ventana con la Tierra', 'Planear las EVA lejos de pronósticos de tormenta']::text[],
   array['Si la dosis de 30 días pasa del 80 % de 250 mSv o hay náusea o vómito']::text[],
   null, 'nasa3001,ochmo,hera'),
  ('radiacion_carrera', 'radiacion', 'atencion', 'Dosis de carrera ≥ 50 % de 600 mSv (rojo ≥ 80 %)',
   array['Revisar tu dosis acumulada con el médico de tripulación', 'Priorizar tareas en las zonas con más blindaje']::text[],
   array['Revisar tu dosis acumulada con el médico de tripulación']::text[],
   array['Priorizar tareas en las zonas con más blindaje']::text[],
   array['Minimizar las EVA no esenciales', 'Dormir en la zona con más blindaje']::text[],
   array['Si pasas del 80 % del límite de carrera']::text[],
   null, 'nasa3001,ochmo'),
  ('radiacion_30d', 'radiacion', 'atencion', 'Dosis de 30 días ≥ 50 % de 250 mSv (rojo ≥ 80 %)',
   array['Revisar tu dosis de los últimos 30 días con el médico de tripulación', 'Evitar EVA y tareas en zonas con poco blindaje']::text[],
   array['Revisar tu dosis de los últimos 30 días con el médico de tripulación']::text[],
   array['Evitar EVA y tareas en zonas con poco blindaje']::text[],
   array['Rotar las tareas expuestas entre la tripulación']::text[],
   array['Si pasas del 80 % del límite de 30 días']::text[],
   null, 'nasa3001,ochmo'),
  ('radiacion_tasa', 'radiacion', 'atencion', 'Tasa del dosímetro más de 3 veces tu línea base',
   array['Revisar que el dosímetro esté bien colocado y funcionando', 'Moverte a una zona con más blindaje mientras se revisa']::text[],
   array['Revisar que el dosímetro esté bien colocado y funcionando']::text[],
   array['Moverte a una zona con más blindaje mientras se revisa']::text[],
   array['Revisar el clima espacial en la próxima ventana']::text[],
   array['Si la tasa sigue alta o suena la alarma de la nave']::text[],
   null, 'hera,ochmo'),
  ('hueso', 'hueso_musculo', 'atencion', 'Menos de 90 min de ejercicio de resistencia 5 días seguidos',
   array['Reportar la falla o la falta de acceso al equipo de ejercicio', 'Rutina alternativa de bandas elásticas 45 min', 'Si hay dolor muscular: ibuprofeno 400 mg del botiquín, según indique el médico de tripulación']::text[],
   array['Reportar la falla o la falta de acceso al equipo de ejercicio']::text[],
   array['Rutina alternativa de bandas elásticas 45 min', 'Si hay dolor muscular: ibuprofeno 400 mg del botiquín, según indique el médico de tripulación']::text[],
   array['Calcio y vitamina D según el menú de misión', 'Volver a 90+ min diarios de ejercicio de resistencia']::text[],
   array['Si llevas 10 días sin ejercicio de resistencia o aparece dolor óseo']::text[],
   null, 'Regla provisional del equipo'),
  ('salud_mental', 'salud_mental', 'atencion', 'Ánimo ≤ 2 o estrés ≥ 4 por 3 días',
   array['Sesión de respiración guiada de 10 min', 'Agendar una llamada privada con tu familia en la próxima ventana', 'Contestar el PHQ-9 y el GAD-7 en Pruebas']::text[],
   array['Sesión de respiración guiada de 10 min']::text[],
   array['Agendar una llamada privada con tu familia en la próxima ventana', 'Contestar el PHQ-9 y el GAD-7 en Pruebas']::text[],
   array['Mantener tiempo libre y de descanso en la rutina']::text[],
   array['Hablar con el médico de tripulación si continúa 2 días más']::text[],
   'reaccion', 'Auto-reporte del check-in'),
  ('who5', 'salud_mental', 'atencion', 'WHO-5 de 28 o menos',
   array['Medic avisó al médico de tripulación', 'Contesta el PHQ-9', 'Conversación privada con el médico de tripulación']::text[],
   array['Medic avisó al médico de tripulación', 'Contesta el PHQ-9']::text[],
   array['Conversación privada con el médico de tripulación', 'Actividad que disfrutes durante 30 min']::text[],
   array['Repetir el WHO-5 cada 7 días en el check-in']::text[],
   array['Si el puntaje baja más o aparecen pensamientos de hacerte daño']::text[],
   'phq9', 'who5'),
  ('phq9', 'salud_mental', 'atencion', 'PHQ-9 de 10 o más (tamizaje, no diagnóstico)',
   array['Medic avisó al médico de tripulación', 'Conversación privada con el médico de tripulación', 'Llamada con tu familia en la próxima ventana']::text[],
   array['Medic avisó al médico de tripulación']::text[],
   array['Conversación privada con el médico de tripulación', 'Llamada con tu familia en la próxima ventana']::text[],
   array['Repetir el PHQ-9 cada semana', 'Mantener rutina de sueño, ejercicio y descanso']::text[],
   array['Si aparecen pensamientos de hacerte daño, avisa de inmediato a la tripulación']::text[],
   'gad7', 'phq9'),
  ('phq9_item9', 'salud_mental', 'critico', 'Respuesta mayor a 0 en la pregunta 9 del PHQ-9',
   array['Medic avisó de inmediato al médico de tripulación', 'Busca a un compañero de confianza; no te quedes solo(a)', 'Conversación privada con el médico de tripulación hoy']::text[],
   array['Medic avisó de inmediato al médico de tripulación', 'Busca a un compañero de confianza; no te quedes solo(a)']::text[],
   array['Conversación privada con el médico de tripulación hoy']::text[],
   array['Seguimiento semanal con el médico de tripulación', 'Llamada con tu familia en la próxima ventana']::text[],
   array['Si piensas en hacerte daño ahora, avisa de inmediato a la tripulación']::text[],
   null, 'phq9'),
  ('gad7', 'salud_mental', 'atencion', 'GAD-7 de 10 o más (tamizaje, no diagnóstico)',
   array['Medic avisó al médico de tripulación', 'Respiración guiada de 10 min', 'Conversación privada con el médico de tripulación']::text[],
   array['Medic avisó al médico de tripulación', 'Respiración guiada de 10 min']::text[],
   array['Conversación privada con el médico de tripulación']::text[],
   array['Repetir el GAD-7 cada semana']::text[],
   array['Si la ansiedad no te deja dormir o trabajar']::text[],
   'phq9', 'gad7'),
  ('escalada', 'general', 'critico', 'Prueba con resultado peor o alerta reportada',
   array['Quédate en reposo', 'El médico de tripulación ya fue avisado', 'Sigue sus indicaciones']::text[],
   array['Quédate en reposo', 'El médico de tripulación ya fue avisado']::text[],
   array['Sigue sus indicaciones']::text[],
   array['Repite las pruebas que te indique']::text[],
   array['Si aparecen síntomas nuevos, avisa de inmediato']::text[],
   null, 'Escalamiento al médico de tripulación');

insert into profiles (astronaut_id, edad, sexo, peso_kg, estatura_cm, tipo_sangre, alergias, medicamentos, condiciones_cronicas,
                      fc_basal, pa_basal, spo2_basal, dosis_carrera_previa_msv, misiones_previas, dias_espacio_previos, usa_lentes, contacto_emergencia) values
  (1, 46, 'Femenino', 64, 168, 'O+', '[{"sustancia":"Látex","reaccion":"Dermatitis de contacto","riesgo":"moderado"}]'::jsonb, '["Lágrimas artificiales según necesidad"]'::jsonb, '["Miopía leve"]'::jsonb,
   62, '112/72', 98, 180, 2, 365, true, '{"nombre":"J. Reyes","relacion":"Esposo","telefono":"+52 81 5555 0101"}'::jsonb),
  (2, 39, 'Femenino', 58, 162, 'A+', '[{"sustancia":"Ibuprofeno (AINE)","reaccion":"Urticaria","riesgo":"moderado"}]'::jsonb, '[]'::jsonb, '[]'::jsonb,
   60, '108/70', 99, 60, 1, 120, false, '{"nombre":"R. Garza","relacion":"Hermana","telefono":"+52 81 5555 0102"}'::jsonb),
  (3, 42, 'Masculino', 82, 178, 'B+', '[{"sustancia":"Penicilina","reaccion":"Anafilaxia","riesgo":"alto"},{"sustancia":"Mariscos","reaccion":"Urticaria leve","riesgo":"bajo"}]'::jsonb, '["Vitamina D 1000 UI al día"]'::jsonb, '["Hipercolesterolemia leve controlada con dieta"]'::jsonb,
   64, '118/76', 98, 0, 0, 0, false, '{"nombre":"P. Torres","relacion":"Madre","telefono":"+52 81 5555 0103"}'::jsonb);

insert into historia_clinica (astronaut_id, heredofamiliares, personales_patologicos, no_patologicos, padecimiento_actual, interrogatorio_sistemas, espacial) values
  (1, '{"diabetes":"Padre (tipo 2)","hipertension":"Madre","cardiopatia":"Ninguno","cancer":"Ninguno","otros":""}'::jsonb,
   '{"asma":"Negado","alergias":"Látex (dermatitis de contacto)","cirugias":"Apendicectomía a los 19 años","fracturas":"Radio distal izquierdo (2009)","cronicas":"Miopía leve","hospitalizaciones":"Solo por la apendicectomía","tabaco":"Nunca","alcohol":"Ocasional, suspendido en misión"}'::jsonb,
   '{"actividad_fisica":"Carrera y fuerza 6 días por semana antes del vuelo","alimentacion":"Menú de misión balanceado","sueno":"7 h habituales; insomnio ocasional en misión","vacunas":"Esquema completo, influenza y COVID-19 al día"}'::jsonb,
   'Dificultad para dormir desde hace 8 noches por carga de trabajo; refiere cansancio por las tardes.',
   '{"respiratorio":"Sin síntomas","cardiovascular":"Sin palpitaciones ni dolor torácico","digestivo":"Sin síntomas","neurologico":"Cefalea leve ocasional por las tardes","vision":"Sin cambios desde el inicio de la misión","musculo_esqueletico":"Sin dolor","piel":"Sin lesiones","animo":"Irritable por el cansancio"}'::jsonb,
   '{"mareo_espacial_previo":"Sí, leve los primeros 2 días de sus misiones anteriores","sans_previo":"No"}'::jsonb),
  (2, '{"diabetes":"Ninguno","hipertension":"Padre","cardiopatia":"Abuelo paterno (infarto a los 70)","cancer":"Ninguno","otros":""}'::jsonb,
   '{"asma":"Negado","alergias":"Ibuprofeno (urticaria)","cirugias":"Ninguna","fracturas":"Ninguna","cronicas":"Ninguna","hospitalizaciones":"Ninguna","tabaco":"Nunca","alcohol":"Nunca"}'::jsonb,
   '{"actividad_fisica":"Natación y fuerza 5 días por semana","alimentacion":"Menú de misión balanceado","sueno":"7.5 h habituales","vacunas":"Esquema completo, influenza y COVID-19 al día"}'::jsonb,
   'Asintomática.',
   '{"respiratorio":"Sin síntomas","cardiovascular":"Sin síntomas","digestivo":"Sin síntomas","neurologico":"Sin síntomas","vision":"Sin cambios","musculo_esqueletico":"Sin dolor","piel":"Sin lesiones","animo":"Estable"}'::jsonb,
   '{"mareo_espacial_previo":"Sí, leve los primeros 3 días de su misión anterior","sans_previo":"No"}'::jsonb),
  (3, '{"diabetes":"Madre (tipo 2)","hipertension":"Ambos padres","cardiopatia":"Ninguno","cancer":"Abuela materna (mama)","otros":"Osteoporosis en la abuela materna"}'::jsonb,
   '{"asma":"Asma leve en la infancia, sin crisis desde los 12 años","alergias":"Penicilina (anafilaxia), mariscos (urticaria leve)","cirugias":"Artroscopia de rodilla derecha (2016)","fracturas":"Clavícula derecha (2011)","cronicas":"Hipercolesterolemia leve controlada con dieta","hospitalizaciones":"Por la reacción a penicilina (2004)","tabaco":"Exfumador, dejó hace 15 años","alcohol":"Ocasional, suspendido en misión"}'::jsonb,
   '{"actividad_fisica":"Fuerza y ciclismo 6 días por semana antes del vuelo","alimentacion":"Menú de misión, evita mariscos","sueno":"7 h habituales","vacunas":"Esquema completo, influenza y COVID-19 al día"}'::jsonb,
   'Sin acceso completo al equipo de resistencia desde hace 25 días por falla; refiere molestia lumbar leve.',
   '{"respiratorio":"Sin síntomas","cardiovascular":"Sin síntomas","digestivo":"Sin síntomas","neurologico":"Sin síntomas","vision":"Sin cambios","musculo_esqueletico":"Molestia lumbar leve, sin irradiación","piel":"Sin lesiones","animo":"Frustrado por la falla del equipo"}'::jsonb,
   '{"mareo_espacial_previo":"No aplica (primera misión)","sans_previo":"No aplica (primera misión)"}'::jsonb);

insert into eventos_radiacion (inicio, fin, nivel, origen, refugio) values
  ((current_date - 19) + time '06:40', (current_date - 17) + time '21:15', 'S3', 'simulado',
   jsonb_build_object('1', (current_date - 19) + time '06:52', '2', (current_date - 19) + time '06:55', '3', (current_date - 19) + time '07:04'));

insert into pruebas (astronaut_id, tipo, fecha, resultado, interpretacion, creada_en) values
  (1, 'who5', current_date - 8, '{"respuestas":[2,2,2,1,3],"bruto":10,"puntaje":40}'::jsonb, 'Puntaje 40 / 100 · tamizaje, no diagnóstico', (current_date - 8) + time '09:30'),
  (1, 'phq9', current_date - 3, '{"respuestas":[1,1,2,2,1,1,1,0,0],"puntaje":9,"item9":0}'::jsonb, 'Puntaje 9 · tamizaje, no diagnóstico', (current_date - 3) + time '09:30'),
  (1, 'gad7', current_date - 3, '{"respuestas":[1,1,1,1,1,1,0],"puntaje":6}'::jsonb, 'Puntaje 6 · tamizaje, no diagnóstico', (current_date - 3) + time '09:30'),
  (2, 'who5', current_date - 8, '{"respuestas":[4,4,4,4,4],"bruto":20,"puntaje":80}'::jsonb, 'Puntaje 80 / 100 · tamizaje, no diagnóstico', (current_date - 8) + time '09:30'),
  (2, 'phq9', current_date - 3, '{"respuestas":[0,0,1,1,0,0,0,0,0],"puntaje":2,"item9":0}'::jsonb, 'Puntaje 2 · tamizaje, no diagnóstico', (current_date - 3) + time '09:30'),
  (2, 'gad7', current_date - 3, '{"respuestas":[0,1,0,1,0,0,0],"puntaje":2}'::jsonb, 'Puntaje 2 · tamizaje, no diagnóstico', (current_date - 3) + time '09:30'),
  (3, 'who5', current_date - 8, '{"respuestas":[3,3,3,3,3],"bruto":15,"puntaje":60}'::jsonb, 'Puntaje 60 / 100 · tamizaje, no diagnóstico', (current_date - 8) + time '09:30'),
  (3, 'phq9', current_date - 3, '{"respuestas":[1,0,1,1,0,1,0,0,0],"puntaje":4,"item9":0}'::jsonb, 'Puntaje 4 · tamizaje, no diagnóstico', (current_date - 3) + time '09:30'),
  (3, 'gad7', current_date - 3, '{"respuestas":[1,1,1,1,0,1,0],"puntaje":5}'::jsonb, 'Puntaje 5 · tamizaje, no diagnóstico', (current_date - 3) + time '09:30');

alter table astronauts enable row level security;
alter table vitals enable row level security;
alter table checkins enable row level security;
alter table protocols enable row level security;
alter table alerts enable row level security;
alter table profiles enable row level security;
alter table historia_clinica enable row level security;
alter table pruebas enable row level security;
alter table eventos_radiacion enable row level security;

create policy "hackathon_all" on astronauts for all to anon, authenticated using (true) with check (true);
create policy "hackathon_all" on vitals for all to anon, authenticated using (true) with check (true);
create policy "hackathon_all" on checkins for all to anon, authenticated using (true) with check (true);
create policy "hackathon_all" on protocols for all to anon, authenticated using (true) with check (true);
create policy "hackathon_all" on alerts for all to anon, authenticated using (true) with check (true);
create policy "hackathon_all" on profiles for all to anon, authenticated using (true) with check (true);
create policy "hackathon_all" on historia_clinica for all to anon, authenticated using (true) with check (true);
create policy "hackathon_all" on pruebas for all to anon, authenticated using (true) with check (true);
create policy "hackathon_all" on eventos_radiacion for all to anon, authenticated using (true) with check (true);

grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

alter publication supabase_realtime add table checkins, alerts, vitals, profiles, historia_clinica, pruebas, eventos_radiacion;

select a.nombre, count(v.*) as dias_de_datos
from astronauts a join vitals v on v.astronaut_id = a.id
group by a.nombre;
