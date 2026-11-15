drop table if exists en_vivo cascade;
drop table if exists actividad cascade;
drop table if exists cabina cascade;
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
  dia_mision  int  not null default 142,
  dia_regreso int  not null default 180
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
  ejercicio_fuerza_min int,
  ejercicio_cardio_min int,
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
  tripulacion         smallint check (tripulacion between 1 and 5),
  sintomas            text[] not null default '{}',
  vision_borrosa      boolean not null default false,
  dolor_cabeza        boolean not null default false,
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
  prueba_sugerida  text check (prueba_sugerida in ('checkin','remedicion','ortostatica','reaccion','who5','phq9','gad7','amsler','presion')),
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
  ejercicio_prescrito_min   int not null default 120,
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
  tipo            text not null check (tipo in ('checkin','remedicion','ortostatica','reaccion','who5','phq9','gad7','amsler','presion')),
  fecha           date not null default current_date,
  resultado       jsonb not null default '{}',
  interpretacion  text,
  desenlace       text check (desenlace in ('mejoro','igual','empeoro')),
  creada_en       timestamptz not null default now()
);

create table cabina (
  id            bigint generated always as identity primary key,
  astronaut_id  int  not null references astronauts(id) on delete cascade,
  fecha         date not null,
  co2_ppm       int,
  temp_c        numeric(3,1),
  humedad       int,
  ruido_db      int,
  unique (astronaut_id, fecha)
);

create table actividad (
  astronaut_id  int primary key references astronauts(id) on delete cascade,
  estado        text not null default 'reposo' check (estado in ('reposo','ejercicio','recuperacion')),
  desde         timestamptz default now(),
  fiebre        boolean not null default false
);

create table en_vivo (
  id            bigint generated always as identity primary key,
  astronaut_id  int  not null references astronauts(id) on delete cascade,
  clave         text not null,
  valor         jsonb,
  updated_at    timestamptz not null default now(),
  unique (astronaut_id, clave)
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
  ('Cmdr. A. Reyes', 'Commander'),
  ('Dr. L. Garza', 'Crew medical officer'),
  ('Eng. M. Torres', 'Flight engineer');

insert into vitals (astronaut_id, fecha, fc, vfc, spo2, sistolica, diastolica,
                    temperatura, frec_resp, horas_sueno, dosis_dia_msv, minutos_ejercicio, peso)
select
  a.id,
  current_date - (89 - d),
  round(60 + a.id*2 + random()*6 + (random() - 0.5)*10
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

insert into checkins (astronaut_id, fecha, animo, estres, fatiga, tiempo_reaccion_ms, tripulacion)
select
  a.id,
  current_date - (89 - d),
  greatest(1, least(5, round(4 + random()   - case when a.id = 1 and d >= 82 then 2 else 0 end)))::smallint,
  greatest(1, least(5, round(2 + random()   + case when a.id = 1 and d >= 82 then 2 else 0 end
                                            + case when d between 70 and 72 then 1 else 0 end)))::smallint,
  greatest(1, least(5, round(2 + random()   + case when a.id = 1 and d >= 82 then 2 else 0 end)))::smallint,
  round(270 + random()*40 + case when a.id = 1 and d >= 82 then 90 else 0 end),
  greatest(1, least(5, round(3.5 + random()*1.5)))::smallint
from astronauts a
cross join generate_series(0, 89) as d;

update vitals set ejercicio_fuerza_min = round(minutos_ejercicio * 0.55),
                  ejercicio_cardio_min = minutos_ejercicio - round(minutos_ejercicio * 0.55);

update checkins set dolor_cabeza = true where astronaut_id = 2 and fecha >= current_date - 1;
update checkins set sintomas = array['garganta'] where astronaut_id = 3 and fecha = current_date;

insert into cabina (astronaut_id, fecha, co2_ppm, temp_c, humedad, ruido_db)
select
  a.id,
  current_date - (89 - d),
  round(2200 + random()*800),
  round((21 + random()*3)::numeric, 1),
  round(38 + random()*15),
  round(52 + random()*8)
from astronauts a
cross join generate_series(0, 89) as d;

update cabina set co2_ppm = 3900 where astronaut_id = 2 and fecha = current_date - 1;
update cabina set co2_ppm = 4300 where astronaut_id = 2 and fecha = current_date;

insert into protocols (clave, sistema, nivel, condicion, acciones, ahora, hoy, prevenir, escalar, prueba_sugerida, fuente) values
  ('vfc_sueno', 'sueno', 'atencion', 'HRV below your baseline 3+ days and short sleep 3+ nights',
   array['10-min break with slow breathing (6 breaths per minute)', 'Go to bed 1 h earlier', 'Lower exercise to moderate intensity for 48 h']::text[],
   array['10-min break with slow breathing (6 breaths per minute)']::text[],
   array['Go to bed 1 h earlier', 'Lower exercise to moderate intensity for 48 h', 'Ask to reschedule tomorrow''s critical tasks']::text[],
   array['No screens 45 min before sleep and warm light in the module', 'Fixed sleep schedule from 22:00 to 06:00 (7 h or more)']::text[],
   array['If the reaction test is still worse than your baseline or there are errors in critical tasks', 'If the lack of sleep continues 3 more nights']::text[],
   'reaccion', 'aasm,pvtb,Your personal baseline'),
  ('vfc', 'cardiovascular', 'atencion', 'HRV 20 % below your baseline 3 days in a row',
   array['Sit down and breathe slowly for 5 min', 'Lower exercise intensity to moderate for 48 h', 'Hydration: at least 2.5 L']::text[],
   array['Sit down and breathe slowly for 5 min']::text[],
   array['Lower exercise intensity to moderate for 48 h', 'Hydration: at least 2.5 L']::text[],
   array['Repeat the reading tomorrow while fasting', 'Keep a fixed sleep schedule']::text[],
   array['If chest pain, palpitations or shortness of breath appear']::text[],
   'remedicion', 'Your personal baseline'),
  ('fc_base', 'cardiovascular', 'atencion', 'Resting HR 10 bpm above your baseline',
   array['Rest seated for 5 min and repeat the reading', 'Hydration: at least 2.5 L', 'Avoid caffeine for the rest of the day']::text[],
   array['Rest seated for 5 min and repeat the reading']::text[],
   array['Hydration: at least 2.5 L', 'Avoid caffeine for the rest of the day']::text[],
   array['Sleep 7–8 h', 'Keep the aerobic exercise in the plan']::text[],
   array['If resting HR goes above 110 bpm or there are symptoms']::text[],
   'remedicion', 'Your personal baseline'),
  ('news2', 'respiratorio', 'atencion', 'NEWS2 of 5–6 or any sign with 3 points',
   array['Suspend physical activity and EVA', 'Repeat vital signs at rest now', 'Measure signs every 4 h']::text[],
   array['Suspend physical activity and EVA', 'Repeat vital signs at rest now']::text[],
   array['Measure signs every 4 h', 'If there is fever > 38.5 °C: acetaminophen 500 mg from the kit, as the crew physician indicates']::text[],
   array['Hydration and rest', 'Hand washing and cleaning of shared surfaces']::text[],
   array['Notify the crew physician immediately (urgent response)']::text[],
   'remedicion', 'news2'),
  ('news2_alto', 'respiratorio', 'critico', 'NEWS2 of 7 or more',
   array['Notify the crew physician now', 'Rest and do not stay alone', 'Continuous vital sign monitoring']::text[],
   array['Notify the crew physician now', 'Rest and do not stay alone']::text[],
   array['Continuous vital sign monitoring', 'Oxygen per the medical module protocol if SpO₂ is ≤ 91 %']::text[],
   array['Review the plan with the crew physician once stabilized']::text[],
   array['Emergency: the crew physician coordinates care']::text[],
   'remedicion', 'news2'),
  ('spo2_emergencia', 'respiratorio', 'critico', 'SpO₂ below 90 %',
   array['Emergency: notify the crew physician now', 'Sit upright and breathe slowly', 'Oxygen per the medical module protocol']::text[],
   array['Emergency: notify the crew physician now', 'Sit upright and breathe slowly', 'Oxygen per the medical module protocol']::text[],
   array['Repeat oximetry every 15 min with a good signal (warm finger, no movement)']::text[],
   array['Review the plan with the crew physician once stabilized']::text[],
   array['If there is shortness of breath, confusion or bluish lips: medical emergency']::text[],
   'remedicion', 'news2,oms_oximetria'),
  ('presion_alta', 'cardiovascular', 'atencion', 'Blood pressure ≥ 140/90 mmHg',
   array['Rest seated for 5 min and repeat the reading', 'Cut down on salt in today''s meals', 'Measure blood pressure in the morning and at night']::text[],
   array['Rest seated for 5 min and repeat the reading']::text[],
   array['Cut down on salt in today''s meals', 'Measure blood pressure in the morning and at night']::text[],
   array['Daily aerobic exercise per the plan', 'Sleep 7–8 h']::text[],
   array['If it reaches 180/110 or there is a severe headache, blurred vision or chest pain']::text[],
   'remedicion', 'pronam'),
  ('presion_urgencia', 'cardiovascular', 'critico', 'Blood pressure ≥ 180/110 mmHg (hypertensive urgency)',
   array['Stop all activity and stay at rest', 'Notify the crew physician now', 'Repeat blood pressure every 15 min']::text[],
   array['Stop all activity and stay at rest', 'Notify the crew physician now']::text[],
   array['Repeat blood pressure every 15 min']::text[],
   array['Review the plan with the crew physician']::text[],
   array['Chest pain, shortness of breath, confusion or vision changes: emergency']::text[],
   'remedicion', 'pronam'),
  ('ortostatica', 'cardiovascular', 'atencion', 'Dizziness when standing up or a positive orthostatic test',
   array['Sit or lie down until the dizziness passes', 'Do the orthostatic test', 'Hydration: 2.5 L with electrolytes']::text[],
   array['Sit or lie down until the dizziness passes', 'Do the orthostatic test']::text[],
   array['Hydration: 2.5 L with electrolytes', 'Get up slowly, in two steps']::text[],
   array['Keep up leg resistance exercise']::text[],
   array['If you faint or the orthostatic test comes out positive']::text[],
   'ortostatica', 'ortostatica'),
  ('sans', 'vision', 'atencion', 'Blurred vision or headache (check-in)',
   array['Rest your eyes for 10 min and do the Amsler grid', 'Visual acuity test with the medical module chart', 'Check your blood pressure']::text[],
   array['Rest your eyes for 10 min and do the Amsler grid']::text[],
   array['Visual acuity test with the medical module chart', 'Check your blood pressure']::text[],
   array['Log any vision changes every day', 'Wear your glasses if you have them']::text[],
   array['If vision gets worse or the headache does not ease in 24 h: fundus exam with the crew physician']::text[],
   'amsler', 'nasa_sans,amsler'),
  ('amsler', 'vision', 'atencion', 'Distortion on the Amsler grid (complement, never red on its own)',
   array['Repeat the grid with good light and your glasses on', 'Answer the vision questions in the check-in', 'Notify the crew physician for an eye exam']::text[],
   array['Repeat the grid with good light and your glasses on']::text[],
   array['Answer the vision questions in the check-in', 'Notify the crew physician for an eye exam']::text[],
   array['Do the Amsler grid once a week']::text[],
   array['If the distortion increases or a fixed spot appears in your vision']::text[],
   'amsler', 'amsler,nasa_sans'),
  ('confusion', 'salud_mental', 'critico', 'Confusion or disorientation (check-in)',
   array['Notify the crew physician now', 'Do not stay alone: a crewmate stays with you', 'Vital signs and glucose check with the crew physician']::text[],
   array['Notify the crew physician now', 'Do not stay alone: a crewmate stays with you']::text[],
   array['Vital signs and glucose check with the crew physician']::text[],
   array['Sleep 7–8 h and hydrate']::text[],
   array['Urgent response: the crew physician coordinates care']::text[],
   'remedicion', 'news2'),
  ('sueno', 'sueno', 'atencion', 'Less than 7 h three nights in a row (red: ≤ 6 h and reaction worse than your baseline)',
   array['Short 20-min nap if your schedule allows', 'Go to bed 1 h earlier', 'No screens 45 min before sleep']::text[],
   array['Short 20-min nap if your schedule allows']::text[],
   array['Go to bed 1 h earlier', 'No screens 45 min before sleep']::text[],
   array['Warm light in the module at night', 'Fixed sleep schedule of 7 h or more']::text[],
   array['If the lack of sleep continues 3 more nights or affects critical tasks']::text[],
   'reaccion', 'aasm,pvtb'),
  ('radiacion_tormenta', 'radiacion', 'critico', 'Ship alarm: solar storm active (S1 to S5)',
   array['Suspend spacewalks and tasks outside protected areas', 'Go to the most shielded area of the spacecraft', 'Surround yourself with water and supplies as shielding']::text[],
   array['Suspend spacewalks and tasks outside protected areas', 'Go to the most shielded area of the spacecraft', 'Surround yourself with water and supplies as shielding', 'Keep the dosimeter on']::text[],
   array['Wait for the end-of-event notice', 'Log your personal dose when you leave the shelter']::text[],
   array['Check space weather (NOAA) daily', 'Plan EVAs away from storm forecasts']::text[],
   array['If the 30-day dose exceeds 80 % of 250 mSv or there is nausea or vomiting']::text[],
   null, 'nasa3001,ochmo,hera'),
  ('radiacion_carrera', 'radiacion', 'atencion', 'Career dose ≥ 50 % of 600 mSv (red ≥ 80 %)',
   array['Review your cumulative dose with the crew physician', 'Prioritize tasks in the areas with more shielding']::text[],
   array['Review your cumulative dose with the crew physician']::text[],
   array['Prioritize tasks in the areas with more shielding']::text[],
   array['Minimize non-essential EVAs', 'Sleep in the area with more shielding']::text[],
   array['If you exceed 80 % of the career limit']::text[],
   null, 'nasa3001,ochmo'),
  ('radiacion_30d', 'radiacion', 'atencion', '30-day dose ≥ 50 % of 250 mSv (red ≥ 80 %)',
   array['Review your dose for the last 30 days with the crew physician', 'Avoid EVAs and tasks in areas with little shielding']::text[],
   array['Review your dose for the last 30 days with the crew physician']::text[],
   array['Avoid EVAs and tasks in areas with little shielding']::text[],
   array['Rotate exposed tasks among the crew']::text[],
   array['If you exceed 80 % of the 30-day limit']::text[],
   null, 'nasa3001,ochmo'),
  ('radiacion_tasa', 'radiacion', 'atencion', 'Dosimeter rate more than 3 times your baseline',
   array['Check that the dosimeter is properly placed and working', 'Move to an area with more shielding while it is checked']::text[],
   array['Check that the dosimeter is properly placed and working']::text[],
   array['Move to an area with more shielding while it is checked']::text[],
   array['Check space weather (NOAA) daily']::text[],
   array['If the rate stays high or the ship alarm sounds']::text[],
   null, 'hera,ochmo'),
  ('hueso', 'hueso_musculo', 'atencion', 'Less than 90 min of resistance exercise 5 days in a row',
   array['Report the failure or lack of access to the exercise equipment', 'Alternative 45-min resistance band routine', 'If there is muscle pain: ibuprofen 400 mg from the kit, as the crew physician indicates']::text[],
   array['Report the failure or lack of access to the exercise equipment']::text[],
   array['Alternative 45-min resistance band routine', 'If there is muscle pain: ibuprofen 400 mg from the kit, as the crew physician indicates']::text[],
   array['Calcium and vitamin D per the mission menu', 'Return to 90+ min of daily resistance exercise']::text[],
   array['If you have gone 10 days without resistance exercise or bone pain appears']::text[],
   null, 'Provisional team rule'),
  ('salud_mental', 'salud_mental', 'atencion', 'Mood ≤ 2 or stress ≥ 4 for 3 days',
   array['10-min guided breathing session', 'Schedule a private call with your family', 'Answer the PHQ-9 and GAD-7 in Tests']::text[],
   array['10-min guided breathing session']::text[],
   array['Schedule a private call with your family', 'Answer the PHQ-9 and GAD-7 in Tests']::text[],
   array['Keep free time and rest in your routine']::text[],
   array['Talk to the crew physician if it continues 2 more days']::text[],
   'reaccion', 'Check-in self-report'),
  ('who5', 'salud_mental', 'atencion', 'WHO-5 of 28 or less',
   array['Medic notified the crew physician', 'Answer the PHQ-9', 'Private conversation with the crew physician']::text[],
   array['Medic notified the crew physician', 'Answer the PHQ-9']::text[],
   array['Private conversation with the crew physician', 'An activity you enjoy for 30 min']::text[],
   array['Repeat the WHO-5 every 7 days in the check-in']::text[],
   array['If the score drops further or thoughts of harming yourself appear']::text[],
   'phq9', 'who5'),
  ('phq9', 'salud_mental', 'atencion', 'PHQ-9 of 10 or more (screening, not diagnosis)',
   array['Medic notified the crew physician', 'Private conversation with the crew physician', 'Private call with your family']::text[],
   array['Medic notified the crew physician']::text[],
   array['Private conversation with the crew physician', 'Private call with your family']::text[],
   array['Repeat the PHQ-9 every week', 'Keep your sleep, exercise and rest routine']::text[],
   array['If thoughts of harming yourself appear, tell the crew immediately']::text[],
   'gad7', 'phq9'),
  ('phq9_item9', 'salud_mental', 'critico', 'Answer above 0 on question 9 of the PHQ-9',
   array['Medic notified the crew physician immediately', 'Find a crewmate you trust; do not stay alone', 'Private conversation with the crew physician today']::text[],
   array['Medic notified the crew physician immediately', 'Find a crewmate you trust; do not stay alone']::text[],
   array['Private conversation with the crew physician today']::text[],
   array['Weekly follow-up with the crew physician', 'Private call with your family']::text[],
   array['If you are thinking of harming yourself now, tell the crew immediately']::text[],
   null, 'phq9'),
  ('gad7', 'salud_mental', 'atencion', 'GAD-7 of 10 or more (screening, not diagnosis)',
   array['Medic notified the crew physician', '10-min guided breathing', 'Private conversation with the crew physician']::text[],
   array['Medic notified the crew physician', '10-min guided breathing']::text[],
   array['Private conversation with the crew physician']::text[],
   array['Repeat the GAD-7 every week']::text[],
   array['If anxiety keeps you from sleeping or working']::text[],
   'phq9', 'gad7'),
  ('cabina_co2', 'cabina', 'atencion', 'Cabin CO₂ ≥ 3,500 ppm (red ≥ 5,000 ppm, demo thresholds)',
   array['Check the CO₂ removal system in your module', 'Move to a better-ventilated module', 'Report the CO₂ to the flight engineer']::text[],
   array['Check the CO₂ removal system in your module', 'Move to a better-ventilated module']::text[],
   array['Report the CO₂ to the flight engineer', 'Hydrate and take breaks if you have a headache']::text[],
   array['Check the CO₂ daily in the modules where you sleep and work']::text[],
   array['If CO₂ exceeds 5,000 ppm or there is headache, dizziness or shortness of breath']::text[],
   null, 'nasa_ambiente'),
  ('temperatura', 'respiratorio', 'atencion', 'Temperature outside 36.1–38.0 °C or signs of infection',
   array['Log your symptoms in the check-in', 'Wash your hands and wear a face mask if you share a module', 'Measure your temperature every 6 h']::text[],
   array['Log your symptoms in the check-in', 'Wash your hands and wear a face mask if you share a module']::text[],
   array['Measure your temperature every 6 h', 'If there is fever > 38.5 °C: acetaminophen 500 mg from the kit, as the crew physician indicates']::text[],
   array['Cleaning of shared surfaces', 'Sleep 7 h or more to protect your immune system']::text[],
   array['If there is fever with 2 or more symptoms, or the fever reaches 39.1 °C']::text[],
   'checkin', 'news2,nasa_inmune'),
  ('tripulacion', 'salud_mental', 'atencion', 'Relationship with the crew ≤ 2 of 5',
   array['Take a 10-min break alone before the next shared task', 'Talk privately with the crew physician or the commander']::text[],
   array['Take a 10-min break alone before the next shared task']::text[],
   array['Talk privately with the crew physician or the commander']::text[],
   array['Keep rest spaces and planned team activities']::text[],
   array['If the conflict affects critical tasks or continues 2 more days']::text[],
   'who5', 'nasa_salud_mental'),
  ('fc_rango', 'cardiovascular', 'atencion', 'Resting HR outside 51–90 bpm (red > 100 or ≤ 40)',
   array['Sit for 5 min and repeat the reading at rest', 'Hydration: at least 2.5 L', 'Avoid caffeine for the rest of the day']::text[],
   array['Sit for 5 min and repeat the reading at rest']::text[],
   array['Hydration: at least 2.5 L', 'Avoid caffeine for the rest of the day']::text[],
   array['Sleep 7 h or more', 'Keep the aerobic exercise in the plan']::text[],
   array['If HR stays above 100 at rest or there is chest pain or fainting']::text[],
   'remedicion', 'news2'),
  ('fr_rango', 'respiratorio', 'atencion', 'Respiratory rate outside 12–20 (red ≤ 8 or ≥ 25)',
   array['Sit upright and repeat the reading at rest', 'Measure breathing and SpO₂ every 4 h']::text[],
   array['Sit upright and repeat the reading at rest']::text[],
   array['Measure breathing and SpO₂ every 4 h']::text[],
   array['Check the CO₂ in your module']::text[],
   array['If there is shortness of breath or the rate reaches 25 or more']::text[],
   'remedicion', 'news2'),
  ('spo2_baja', 'respiratorio', 'atencion', 'SpO₂ between 90 and 94 %',
   array['Repeat oximetry with a warm finger and without moving', 'Breathe slowly and deeply for 2 min', 'Measure SpO₂ every 4 h']::text[],
   array['Repeat oximetry with a warm finger and without moving', 'Breathe slowly and deeply for 2 min']::text[],
   array['Measure SpO₂ every 4 h', 'Check the CO₂ in your module']::text[],
   array['Avoid intense exertion until it normalizes']::text[],
   array['If it drops below 90 %: emergency, tell the crew physician']::text[],
   'remedicion', 'oms_oximetria,news2'),
  ('presion_limitrofe', 'cardiovascular', 'atencion', 'Blood pressure ≥ 130/85 or systolic ≤ 100',
   array['Rest seated for 5 min and repeat the reading', 'Measure blood pressure in the morning and at night', 'Cut down on salt in today''s meals']::text[],
   array['Rest seated for 5 min and repeat the reading']::text[],
   array['Measure blood pressure in the morning and at night', 'Cut down on salt in today''s meals']::text[],
   array['Daily aerobic exercise per the plan', 'Sleep 7 h or more']::text[],
   array['If it reaches 140/90, the systolic drops below 90 or there is dizziness']::text[],
   'ortostatica', 'pronam,news2'),
  ('tarjeta_fc', 'cardiovascular', 'atencion', 'Heart rate or HRV outside your normal',
   array['Sit down and breathe slowly for 5 min', 'Hydration: at least 2.5 L', 'Lower exercise intensity for 48 h if HRV stays low']::text[],
   array['Sit down and breathe slowly for 5 min']::text[],
   array['Hydration: at least 2.5 L', 'Lower exercise intensity for 48 h if HRV stays low']::text[],
   array['Sleep 7 h or more', 'Repeat the reading tomorrow while fasting']::text[],
   array['If chest pain, palpitations or shortness of breath appear']::text[],
   'remedicion', 'news2'),
  ('tarjeta_pa', 'cardiovascular', 'atencion', 'Blood pressure outside your range',
   array['Rest seated for 5 min and repeat the reading', 'Measure blood pressure morning and night']::text[],
   array['Rest seated for 5 min and repeat the reading']::text[],
   array['Measure blood pressure morning and night']::text[],
   array['Aerobic exercise and little salt']::text[],
   array['If it reaches 140/90 or the systolic drops below 90']::text[],
   'ortostatica', 'pronam,news2'),
  ('tarjeta_fr', 'respiratorio', 'atencion', 'Breathing outside 12–20',
   array['Repeat the reading at rest', 'Measure breathing and SpO₂ every 4 h']::text[],
   array['Repeat the reading at rest']::text[],
   array['Measure breathing and SpO₂ every 4 h']::text[],
   array['Check the CO₂ in your module']::text[],
   array['If there is shortness of breath']::text[],
   'remedicion', 'news2'),
  ('tarjeta_temp', 'respiratorio', 'atencion', 'Temperature or signs of infection',
   array['Log your symptoms in the check-in', 'Measure your temperature every 6 h']::text[],
   array['Log your symptoms in the check-in']::text[],
   array['Measure your temperature every 6 h']::text[],
   array['Hand washing and surface cleaning']::text[],
   array['If there is fever with 2 or more symptoms']::text[],
   'checkin', 'news2,nasa_inmune'),
  ('tarjeta_spo2', 'respiratorio', 'atencion', 'Low oxygenation',
   array['Repeat oximetry with a good signal', 'Measure SpO₂ every 4 h']::text[],
   array['Repeat oximetry with a good signal']::text[],
   array['Measure SpO₂ every 4 h']::text[],
   array['Check the CO₂ in your module']::text[],
   array['If it drops below 90 %: emergency']::text[],
   'remedicion', 'oms_oximetria,news2'),
  ('tarjeta_conciencia', 'salud_mental', 'atencion', 'Dizziness or confusion',
   array['Sit or lie down until it passes', 'Get up slowly, in two steps', 'Do the orthostatic test']::text[],
   array['Sit or lie down until it passes']::text[],
   array['Get up slowly, in two steps', 'Do the orthostatic test']::text[],
   array['Hydration with electrolytes']::text[],
   array['If confusion appears or you faint']::text[],
   'checkin', 'news2,nasa_sensoriomotor'),
  ('tarjeta_radiacion', 'radiacion', 'atencion', 'Radiation dose above usual',
   array['Keep the dosimeter on', 'Prioritize tasks in areas with more shielding']::text[],
   array['Keep the dosimeter on']::text[],
   array['Prioritize tasks in areas with more shielding']::text[],
   array['Minimize non-essential EVAs']::text[],
   array['If the ship alarm sounds or you exceed 80 % of a limit']::text[],
   null, 'nasa3001,ochmo'),
  ('tarjeta_sueno', 'sueno', 'atencion', 'Short sleep, slow reaction or high fatigue',
   array['10-min break with slow breathing', 'Go to bed 1 h earlier']::text[],
   array['10-min break with slow breathing']::text[],
   array['Go to bed 1 h earlier']::text[],
   array['Fixed sleep schedule of 7 h or more']::text[],
   array['If the reaction stays slow or there are errors in critical tasks']::text[],
   'reaccion', 'aasm,pvtb'),
  ('tarjeta_animo', 'salud_mental', 'atencion', 'Mood, stress or relationship with the crew outside normal',
   array['10-min guided breathing', 'Answer the PHQ-9 in Tests', 'Talk with the crew physician']::text[],
   array['10-min guided breathing']::text[],
   array['Answer the PHQ-9 in Tests', 'Talk with the crew physician']::text[],
   array['Free time and rest in your routine']::text[],
   array['If thoughts of harming yourself appear, tell the crew immediately']::text[],
   'who5', 'who5,nasa_salud_mental'),
  ('tarjeta_vision', 'vision', 'atencion', 'Blurred vision or headache',
   array['Rest your eyes for 10 min and do the Amsler grid', 'Check your blood pressure and the CO₂ in your module']::text[],
   array['Rest your eyes for 10 min and do the Amsler grid']::text[],
   array['Check your blood pressure and the CO₂ in your module']::text[],
   array['Log any vision changes every day']::text[],
   array['If vision gets worse or the pain does not ease in 24 h']::text[],
   'amsler', 'nasa_sans,amsler'),
  ('tarjeta_huesos', 'hueso_musculo', 'atencion', 'Exercise below prescribed',
   array['Check whether the exercise equipment is available', 'Complete your prescribed strength and cardio exercise']::text[],
   array['Check whether the exercise equipment is available']::text[],
   array['Complete your prescribed strength and cardio exercise']::text[],
   array['Calcium and vitamin D per the mission menu']::text[],
   array['If you have been below prescribed for 5 days or there is bone pain']::text[],
   null, 'nasa_osea'),
  ('tarjeta_cabina', 'cabina', 'atencion', 'Cabin environment out of range',
   array['Check the ventilation in your module', 'Report the values to the flight engineer']::text[],
   array['Check the ventilation in your module']::text[],
   array['Report the values to the flight engineer']::text[],
   array['Check CO₂, temperature and humidity daily']::text[],
   array['If CO₂ exceeds 5,000 ppm or there are symptoms']::text[],
   null, 'nasa_ambiente'),
  ('escalada', 'general', 'critico', 'Test with a worse result or reported alert',
   array['Stay at rest', 'The crew physician has already been notified', 'Follow their instructions']::text[],
   array['Stay at rest', 'The crew physician has already been notified']::text[],
   array['Follow their instructions']::text[],
   array['Repeat the tests they indicate']::text[],
   array['If new symptoms appear, notify immediately']::text[],
   null, 'Escalation to the crew physician');

insert into profiles (astronaut_id, edad, sexo, peso_kg, estatura_cm, tipo_sangre, alergias, medicamentos, condiciones_cronicas,
                      fc_basal, pa_basal, spo2_basal, dosis_carrera_previa_msv, misiones_previas, dias_espacio_previos, usa_lentes, ejercicio_prescrito_min, contacto_emergencia) values
  (1, 46, 'Female', 64, 168, 'O+', '[{"sustancia":"Latex","reaccion":"Contact dermatitis","riesgo":"moderado"}]'::jsonb, '["Artificial tears as needed"]'::jsonb, '["Mild myopia"]'::jsonb,
   62, '112/72', 98, 180, 2, 365, true, 120, '{"nombre":"J. Reyes","relacion":"Husband","telefono":"+52 81 5555 0101"}'::jsonb),
  (2, 39, 'Female', 58, 162, 'A+', '[{"sustancia":"Ibuprofen (NSAID)","reaccion":"Hives","riesgo":"moderado"}]'::jsonb, '[]'::jsonb, '[]'::jsonb,
   60, '108/70', 99, 60, 1, 120, false, 120, '{"nombre":"R. Garza","relacion":"Sister","telefono":"+52 81 5555 0102"}'::jsonb),
  (3, 42, 'Male', 82, 178, 'B+', '[{"sustancia":"Penicillin","reaccion":"Anaphylaxis","riesgo":"alto"},{"sustancia":"Shellfish","reaccion":"Mild hives","riesgo":"bajo"}]'::jsonb, '["Vitamin D 1000 IU daily"]'::jsonb, '["Mild hypercholesterolemia controlled with diet"]'::jsonb,
   64, '118/76', 98, 0, 0, 0, false, 120, '{"nombre":"P. Torres","relacion":"Mother","telefono":"+52 81 5555 0103"}'::jsonb);

insert into historia_clinica (astronaut_id, heredofamiliares, personales_patologicos, no_patologicos, padecimiento_actual, interrogatorio_sistemas, espacial) values
  (1, '{"diabetes":"Father (type 2)","hipertension":"Mother","cardiopatia":"None","cancer":"None","otros":""}'::jsonb,
   '{"asma":"Denied","alergias":"Latex (contact dermatitis)","cirugias":"Appendectomy at age 19","fracturas":"Left distal radius (2009)","cronicas":"Mild myopia","hospitalizaciones":"Only for the appendectomy","tabaco":"Never","alcohol":"Occasional, suspended during the mission"}'::jsonb,
   '{"actividad_fisica":"Running and strength 6 days a week before flight","alimentacion":"Balanced mission menu","sueno":"7 h usual; occasional insomnia during the mission","vacunas":"Full schedule, influenza and COVID-19 up to date"}'::jsonb,
   'Trouble sleeping for 8 nights due to workload; reports tiredness in the afternoons.',
   '{"respiratorio":"No symptoms","cardiovascular":"No palpitations or chest pain","digestivo":"No symptoms","neurologico":"Occasional mild headache in the afternoons","vision":"No changes since the start of the mission","musculo_esqueletico":"No pain","piel":"No lesions","animo":"Irritable from tiredness"}'::jsonb,
   '{"mareo_espacial_previo":"Yes, mild during the first 2 days of previous missions","sans_previo":"No"}'::jsonb),
  (2, '{"diabetes":"None","hipertension":"Father","cardiopatia":"Paternal grandfather (heart attack at 70)","cancer":"None","otros":""}'::jsonb,
   '{"asma":"Denied","alergias":"Ibuprofen (hives)","cirugias":"None","fracturas":"None","cronicas":"None","hospitalizaciones":"None","tabaco":"Never","alcohol":"Never"}'::jsonb,
   '{"actividad_fisica":"Swimming and strength 5 days a week","alimentacion":"Balanced mission menu","sueno":"7.5 h usual","vacunas":"Full schedule, influenza and COVID-19 up to date"}'::jsonb,
   'Asymptomatic.',
   '{"respiratorio":"No symptoms","cardiovascular":"No symptoms","digestivo":"No symptoms","neurologico":"No symptoms","vision":"No changes","musculo_esqueletico":"No pain","piel":"No lesions","animo":"Stable"}'::jsonb,
   '{"mareo_espacial_previo":"Yes, mild during the first 3 days of the previous mission","sans_previo":"No"}'::jsonb),
  (3, '{"diabetes":"Mother (type 2)","hipertension":"Both parents","cardiopatia":"None","cancer":"Maternal grandmother (breast)","otros":"Osteoporosis in the maternal grandmother"}'::jsonb,
   '{"asma":"Mild asthma in childhood, no attacks since age 12","alergias":"Penicillin (anaphylaxis), shellfish (mild hives)","cirugias":"Right knee arthroscopy (2016)","fracturas":"Right clavicle (2011)","cronicas":"Mild hypercholesterolemia controlled with diet","hospitalizaciones":"For the penicillin reaction (2004)","tabaco":"Former smoker, quit 15 years ago","alcohol":"Occasional, suspended during the mission"}'::jsonb,
   '{"actividad_fisica":"Strength and cycling 6 days a week before flight","alimentacion":"Mission menu, avoids shellfish","sueno":"7 h usual","vacunas":"Full schedule, influenza and COVID-19 up to date"}'::jsonb,
   'No full access to the resistance equipment for 25 days due to a failure; reports mild lower back discomfort.',
   '{"respiratorio":"No symptoms","cardiovascular":"No symptoms","digestivo":"No symptoms","neurologico":"No symptoms","vision":"No changes","musculo_esqueletico":"Mild lower back discomfort, no radiation","piel":"No lesions","animo":"Frustrated by the equipment failure"}'::jsonb,
   '{"mareo_espacial_previo":"Not applicable (first mission)","sans_previo":"Not applicable (first mission)"}'::jsonb);

insert into actividad (astronaut_id, estado, desde, fiebre)
select id, 'reposo', current_date + time '06:30', false from astronauts;

insert into eventos_radiacion (inicio, fin, nivel, origen, refugio) values
  ((current_date - 19) + time '06:40', (current_date - 17) + time '21:15', 'S3', 'simulado',
   jsonb_build_object('1', (current_date - 19) + time '06:52', '2', (current_date - 19) + time '06:55', '3', (current_date - 19) + time '07:04'));

insert into pruebas (astronaut_id, tipo, fecha, resultado, interpretacion, creada_en) values
  (1, 'who5', current_date - 7, '{"respuestas":[2,2,2,1,3],"bruto":10,"puntaje":40}'::jsonb, 'WHO-5: 40/100 · screening, not diagnosis', (current_date - 7) + time '09:30'),
  (1, 'who5', current_date - 14, '{"respuestas":[2,2,3,2,3],"bruto":12,"puntaje":48}'::jsonb, 'WHO-5: 48/100 · screening, not diagnosis', (current_date - 14) + time '09:30'),
  (1, 'who5', current_date - 21, '{"respuestas":[3,3,4,3,4],"bruto":17,"puntaje":68}'::jsonb, 'WHO-5: 68/100 · screening, not diagnosis', (current_date - 21) + time '09:30'),
  (1, 'who5', current_date - 28, '{"respuestas":[4,3,4,3,4],"bruto":18,"puntaje":72}'::jsonb, 'WHO-5: 72/100 · screening, not diagnosis', (current_date - 28) + time '09:30'),
  (1, 'who5', current_date - 35, '{"respuestas":[4,3,4,3,4],"bruto":18,"puntaje":72}'::jsonb, 'WHO-5: 72/100 · screening, not diagnosis', (current_date - 35) + time '09:30'),
  (1, 'who5', current_date - 42, '{"respuestas":[4,3,4,3,4],"bruto":18,"puntaje":72}'::jsonb, 'WHO-5: 72/100 · screening, not diagnosis', (current_date - 42) + time '09:30'),
  (1, 'who5', current_date - 49, '{"respuestas":[4,3,4,3,4],"bruto":18,"puntaje":72}'::jsonb, 'WHO-5: 72/100 · screening, not diagnosis', (current_date - 49) + time '09:30'),
  (1, 'who5', current_date - 56, '{"respuestas":[4,3,4,3,4],"bruto":18,"puntaje":72}'::jsonb, 'WHO-5: 72/100 · screening, not diagnosis', (current_date - 56) + time '09:30'),
  (1, 'who5', current_date - 63, '{"respuestas":[4,3,4,3,4],"bruto":18,"puntaje":72}'::jsonb, 'WHO-5: 72/100 · screening, not diagnosis', (current_date - 63) + time '09:30'),
  (1, 'who5', current_date - 70, '{"respuestas":[4,3,4,3,4],"bruto":18,"puntaje":72}'::jsonb, 'WHO-5: 72/100 · screening, not diagnosis', (current_date - 70) + time '09:30'),
  (1, 'who5', current_date - 77, '{"respuestas":[4,3,4,3,4],"bruto":18,"puntaje":72}'::jsonb, 'WHO-5: 72/100 · screening, not diagnosis', (current_date - 77) + time '09:30'),
  (1, 'who5', current_date - 84, '{"respuestas":[4,3,4,3,4],"bruto":18,"puntaje":72}'::jsonb, 'WHO-5: 72/100 · screening, not diagnosis', (current_date - 84) + time '09:30'),
  (1, 'phq9', current_date - 3, '{"respuestas":[1,1,2,2,1,1,1,0,0],"puntaje":9,"item9":0}'::jsonb, 'Score 9 · screening, not diagnosis', (current_date - 3) + time '09:30'),
  (1, 'gad7', current_date - 3, '{"respuestas":[1,1,1,1,1,1,0],"puntaje":6}'::jsonb, 'Score 6 · screening, not diagnosis', (current_date - 3) + time '09:30'),
  (2, 'who5', current_date - 7, '{"respuestas":[4,4,4,4,4],"bruto":20,"puntaje":80}'::jsonb, 'WHO-5: 80/100 · screening, not diagnosis', (current_date - 7) + time '09:30'),
  (2, 'who5', current_date - 14, '{"respuestas":[4,4,5,4,4],"bruto":21,"puntaje":84}'::jsonb, 'WHO-5: 84/100 · screening, not diagnosis', (current_date - 14) + time '09:30'),
  (2, 'who5', current_date - 21, '{"respuestas":[4,4,4,4,5],"bruto":21,"puntaje":84}'::jsonb, 'WHO-5: 84/100 · screening, not diagnosis', (current_date - 21) + time '09:30'),
  (2, 'who5', current_date - 28, '{"respuestas":[5,4,4,4,4],"bruto":21,"puntaje":84}'::jsonb, 'WHO-5: 84/100 · screening, not diagnosis', (current_date - 28) + time '09:30'),
  (2, 'who5', current_date - 35, '{"respuestas":[5,4,4,4,4],"bruto":21,"puntaje":84}'::jsonb, 'WHO-5: 84/100 · screening, not diagnosis', (current_date - 35) + time '09:30'),
  (2, 'who5', current_date - 42, '{"respuestas":[5,4,4,4,4],"bruto":21,"puntaje":84}'::jsonb, 'WHO-5: 84/100 · screening, not diagnosis', (current_date - 42) + time '09:30'),
  (2, 'who5', current_date - 49, '{"respuestas":[5,4,4,4,4],"bruto":21,"puntaje":84}'::jsonb, 'WHO-5: 84/100 · screening, not diagnosis', (current_date - 49) + time '09:30'),
  (2, 'who5', current_date - 56, '{"respuestas":[5,4,4,4,4],"bruto":21,"puntaje":84}'::jsonb, 'WHO-5: 84/100 · screening, not diagnosis', (current_date - 56) + time '09:30'),
  (2, 'who5', current_date - 63, '{"respuestas":[5,4,4,4,4],"bruto":21,"puntaje":84}'::jsonb, 'WHO-5: 84/100 · screening, not diagnosis', (current_date - 63) + time '09:30'),
  (2, 'who5', current_date - 70, '{"respuestas":[5,4,4,4,4],"bruto":21,"puntaje":84}'::jsonb, 'WHO-5: 84/100 · screening, not diagnosis', (current_date - 70) + time '09:30'),
  (2, 'who5', current_date - 77, '{"respuestas":[5,4,4,4,4],"bruto":21,"puntaje":84}'::jsonb, 'WHO-5: 84/100 · screening, not diagnosis', (current_date - 77) + time '09:30'),
  (2, 'who5', current_date - 84, '{"respuestas":[5,4,4,4,4],"bruto":21,"puntaje":84}'::jsonb, 'WHO-5: 84/100 · screening, not diagnosis', (current_date - 84) + time '09:30'),
  (2, 'phq9', current_date - 3, '{"respuestas":[0,0,1,1,0,0,0,0,0],"puntaje":2,"item9":0}'::jsonb, 'Score 2 · screening, not diagnosis', (current_date - 3) + time '09:30'),
  (2, 'gad7', current_date - 3, '{"respuestas":[0,1,0,1,0,0,0],"puntaje":2}'::jsonb, 'Score 2 · screening, not diagnosis', (current_date - 3) + time '09:30'),
  (3, 'who5', current_date - 7, '{"respuestas":[3,3,3,3,3],"bruto":15,"puntaje":60}'::jsonb, 'WHO-5: 60/100 · screening, not diagnosis', (current_date - 7) + time '09:30'),
  (3, 'who5', current_date - 14, '{"respuestas":[3,3,4,3,3],"bruto":16,"puntaje":64}'::jsonb, 'WHO-5: 64/100 · screening, not diagnosis', (current_date - 14) + time '09:30'),
  (3, 'who5', current_date - 21, '{"respuestas":[3,4,3,3,4],"bruto":17,"puntaje":68}'::jsonb, 'WHO-5: 68/100 · screening, not diagnosis', (current_date - 21) + time '09:30'),
  (3, 'who5', current_date - 28, '{"respuestas":[4,3,4,3,4],"bruto":18,"puntaje":72}'::jsonb, 'WHO-5: 72/100 · screening, not diagnosis', (current_date - 28) + time '09:30'),
  (3, 'who5', current_date - 35, '{"respuestas":[4,3,4,3,4],"bruto":18,"puntaje":72}'::jsonb, 'WHO-5: 72/100 · screening, not diagnosis', (current_date - 35) + time '09:30'),
  (3, 'who5', current_date - 42, '{"respuestas":[4,3,4,3,4],"bruto":18,"puntaje":72}'::jsonb, 'WHO-5: 72/100 · screening, not diagnosis', (current_date - 42) + time '09:30'),
  (3, 'who5', current_date - 49, '{"respuestas":[4,3,4,3,4],"bruto":18,"puntaje":72}'::jsonb, 'WHO-5: 72/100 · screening, not diagnosis', (current_date - 49) + time '09:30'),
  (3, 'who5', current_date - 56, '{"respuestas":[4,3,4,3,4],"bruto":18,"puntaje":72}'::jsonb, 'WHO-5: 72/100 · screening, not diagnosis', (current_date - 56) + time '09:30'),
  (3, 'who5', current_date - 63, '{"respuestas":[4,3,4,3,4],"bruto":18,"puntaje":72}'::jsonb, 'WHO-5: 72/100 · screening, not diagnosis', (current_date - 63) + time '09:30'),
  (3, 'who5', current_date - 70, '{"respuestas":[4,3,4,3,4],"bruto":18,"puntaje":72}'::jsonb, 'WHO-5: 72/100 · screening, not diagnosis', (current_date - 70) + time '09:30'),
  (3, 'who5', current_date - 77, '{"respuestas":[4,3,4,3,4],"bruto":18,"puntaje":72}'::jsonb, 'WHO-5: 72/100 · screening, not diagnosis', (current_date - 77) + time '09:30'),
  (3, 'who5', current_date - 84, '{"respuestas":[4,3,4,3,4],"bruto":18,"puntaje":72}'::jsonb, 'WHO-5: 72/100 · screening, not diagnosis', (current_date - 84) + time '09:30'),
  (3, 'phq9', current_date - 3, '{"respuestas":[1,0,1,1,0,1,0,0,0],"puntaje":4,"item9":0}'::jsonb, 'Score 4 · screening, not diagnosis', (current_date - 3) + time '09:30'),
  (3, 'gad7', current_date - 3, '{"respuestas":[1,1,1,1,0,1,0],"puntaje":5}'::jsonb, 'Score 5 · screening, not diagnosis', (current_date - 3) + time '09:30');

alter table astronauts enable row level security;
alter table vitals enable row level security;
alter table checkins enable row level security;
alter table protocols enable row level security;
alter table alerts enable row level security;
alter table profiles enable row level security;
alter table historia_clinica enable row level security;
alter table pruebas enable row level security;
alter table eventos_radiacion enable row level security;
alter table cabina enable row level security;
alter table actividad enable row level security;
alter table en_vivo enable row level security;

create policy "hackathon_all" on astronauts for all to anon, authenticated using (true) with check (true);
create policy "hackathon_all" on vitals for all to anon, authenticated using (true) with check (true);
create policy "hackathon_all" on checkins for all to anon, authenticated using (true) with check (true);
create policy "hackathon_all" on protocols for all to anon, authenticated using (true) with check (true);
create policy "hackathon_all" on alerts for all to anon, authenticated using (true) with check (true);
create policy "hackathon_all" on profiles for all to anon, authenticated using (true) with check (true);
create policy "hackathon_all" on historia_clinica for all to anon, authenticated using (true) with check (true);
create policy "hackathon_all" on pruebas for all to anon, authenticated using (true) with check (true);
create policy "hackathon_all" on eventos_radiacion for all to anon, authenticated using (true) with check (true);
create policy "hackathon_all" on cabina for all to anon, authenticated using (true) with check (true);
create policy "hackathon_all" on actividad for all to anon, authenticated using (true) with check (true);
create policy "hackathon_all" on en_vivo for all to anon, authenticated using (true) with check (true);

grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

alter publication supabase_realtime add table checkins, alerts, vitals, profiles, historia_clinica, pruebas, eventos_radiacion, cabina, actividad, en_vivo;

select a.nombre, count(v.*) as dias_de_datos
from astronauts a join vitals v on v.astronaut_id = a.id
group by a.nombre;

create table if not exists en_vivo (
  id            bigint generated always as identity primary key,
  astronaut_id  int  not null references astronauts(id) on delete cascade,
  clave         text not null,
  valor         jsonb,
  updated_at    timestamptz not null default now(),
  unique (astronaut_id, clave)
);

alter table en_vivo enable row level security;
drop policy if exists "hackathon_all" on en_vivo;
create policy "hackathon_all" on en_vivo for all to anon, authenticated using (true) with check (true);
grant select, insert, update, delete on en_vivo to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'en_vivo') then
    alter publication supabase_realtime add table en_vivo;
  end if;
end $$;
