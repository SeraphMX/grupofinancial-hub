/*
  # Tabla de documentos para solicitudes de crédito

  1. Nueva Tabla
    - `documentos`
      - `id` (uuid, primary key)
      - `solicitud_id` (uuid, foreign key)
      - `nombre` (text)
      - `tipo` (text)
      - `url` (text)
      - `subido_por` (uuid, nullable)
      - `created_at` (timestamp)

  2. Seguridad
    - Enable RLS
    - Políticas para acceso público y autenticado
*/

create table if not exists public.documentos (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid references public.solicitudes(id) on delete cascade,
  nombre text not null,
  tipo text not null,
  url text not null,
  subido_por uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Habilitar RLS
alter table public.documentos enable row level security;

-- Políticas de seguridad

-- Permitir lectura pública de documentos por ID de solicitud
create policy "Lectura pública de documentos"
  on public.documentos
  for select
  to public
  using (true);

-- Los usuarios autenticados pueden subir documentos
create policy "Usuarios pueden subir documentos"
  on public.documentos
  for insert
  to authenticated
  with check (true);

-- Los usuarios autenticados pueden actualizar sus propios documentos
create policy "Usuarios pueden actualizar sus documentos"
  on public.documentos
  for update
  to authenticated
  using (subido_por = auth.uid())
  with check (subido_por = auth.uid());

-- Índices
create index if not exists documentos_solicitud_id_idx on public.documentos(solicitud_id);
create index if not exists documentos_subido_por_idx on public.documentos(subido_por);

-- Comentarios
comment on table public.documentos is 'Documentos asociados a solicitudes de crédito';
comment on column public.documentos.id is 'Identificador único del documento';
comment on column public.documentos.solicitud_id is 'ID de la solicitud asociada';
comment on column public.documentos.nombre is 'Nombre del documento';
comment on column public.documentos.tipo is 'Tipo de documento';
comment on column public.documentos.url is 'URL de almacenamiento del documento';
comment on column public.documentos.subido_por is 'ID del usuario que subió el documento';
comment on column public.documentos.created_at is 'Fecha de creación del registro';