create table if not exists eventos_ficha (
  id uuid primary key default gen_random_uuid(),
  astronaut_id int not null,
  clave text not null,
  nivel text not null,
  causa text,
  respuestas jsonb default '{}'::jsonb,
  combinaciones jsonb default '[]'::jsonb,
  abierto_en timestamptz default now(),
  cerrado_en timestamptz,
  cierre text
);
create table if not exists pasos_marcados (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid references eventos_ficha(id) on delete cascade,
  paso_id text not null,
  marcado_en timestamptz default now(),
  marcado_por text default 'astronauta',
  nota text
);
create table if not exists medicamentos_tomados (
  id uuid primary key default gen_random_uuid(),
  astronaut_id int not null,
  nombre text not null,
  tomado_en timestamptz default now()
);
alter table eventos_ficha enable row level security;
alter table pasos_marcados enable row level security;
alter table medicamentos_tomados enable row level security;
drop policy if exists hackathon_all on eventos_ficha;
drop policy if exists hackathon_all on pasos_marcados;
drop policy if exists hackathon_all on medicamentos_tomados;
create policy hackathon_all on eventos_ficha for all using (true) with check (true);
create policy hackathon_all on pasos_marcados for all using (true) with check (true);
create policy hackathon_all on medicamentos_tomados for all using (true) with check (true);
alter publication supabase_realtime add table eventos_ficha, pasos_marcados, medicamentos_tomados;
