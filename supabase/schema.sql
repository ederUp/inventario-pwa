-- Esquema Supabase para el conteo de inventario con auditorías por fecha/PDV.
-- Ejecuta esto en el SQL Editor de tu proyecto Supabase.

create table if not exists auditorias (
  id uuid primary key,
  pdv text not null,
  bodega_madera text,
  bodega_ferreteria text,
  fecha_inicio timestamptz not null,
  fecha_cierre timestamptz,
  estado text not null check (estado in ('abierta', 'cerrada')),
  dispositivo text not null
);

create table if not exists conteos_detalle (
  id uuid primary key,
  auditoria_id uuid not null references auditorias (id) on delete cascade,
  categoria text not null check (categoria in ('madera', 'ferreteria')),
  referencia text not null,
  columna text not null,
  cantidad numeric not null,
  dispositivo text not null,
  nota text,
  creado_en timestamptz not null default now()
);

create index if not exists idx_conteos_auditoria on conteos_detalle (auditoria_id);
create index if not exists idx_conteos_referencia on conteos_detalle (referencia);
create index if not exists idx_auditorias_fecha on auditorias (fecha_inicio);
create index if not exists idx_auditorias_pdv on auditorias (pdv);

-- Vista de conveniencia: totales por columna, por referencia, dentro de cada auditoría.
create or replace view conteos_totales as
select
  auditoria_id,
  categoria,
  referencia,
  columna,
  sum(cantidad) as cantidad_total,
  count(*) as num_registros
from conteos_detalle
group by auditoria_id, categoria, referencia, columna;

alter table auditorias enable row level security;
alter table conteos_detalle enable row level security;

-- Un solo usuario, varios dispositivos: policy abierta, protegida solo por
-- que el anon key no queda expuesto públicamente más allá de tu app.
-- Si más de una persona empieza a usar la app, cambia esto por Supabase Auth.
create policy "acceso_anonimo_auditorias" on auditorias for all using (true) with check (true);
create policy "acceso_anonimo_conteos" on conteos_detalle for all using (true) with check (true);
