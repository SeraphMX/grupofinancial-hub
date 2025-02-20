-- Crear la tabla solicitudes
create table if not exists public.solicitudes (
  id uuid primary key default gen_random_uuid(),
  tipo_credito text not null check (tipo_credito in ('personal', 'hipotecario', 'empresarial', 'automotriz')),
  tipo_cliente text not null check (tipo_cliente in ('personal', 'empresarial')),
  tipo_garantia text check (tipo_garantia in ('hipotecaria', 'prendaria', 'aval', 'sin_garantia')),
  monto numeric not null check (monto > 0),
  plazo integer not null check (plazo > 0),
  pago_mensual numeric not null check (pago_mensual > 0),
  nombre text not null,
  email text not null check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  telefono text not null,
  rfc text not null,
  nombre_empresa text,
  industria text,
  ingresos_anuales numeric check (ingresos_anuales > 0),
  status text not null check (status in ('pendiente', 'en_revision', 'aprobada', 'rechazada', 'cancelada')) default 'pendiente',
  ip_address text,
  user_agent text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  assigned_to uuid references public.users(id),

  -- Validaciones condicionales
  constraint empresa_fields_check check (
    (tipo_cliente = 'empresarial' and nombre_empresa is not null and industria is not null) or
    (tipo_cliente = 'personal' and nombre_empresa is null and industria is null)
  )
);

-- Crear índices para mejorar el rendimiento
create index if not exists solicitudes_assigned_to_idx on public.solicitudes(assigned_to);
create index if not exists solicitudes_status_idx on public.solicitudes(status);
create index if not exists solicitudes_created_at_idx on public.solicitudes(created_at);

-- Habilitar Row Level Security
alter table public.solicitudes enable row level security;

-- Políticas de seguridad

-- Los administradores tienen acceso total
create policy "Admins tienen acceso total a solicitudes"
  on public.solicitudes
  for all
  to authenticated
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

-- Los agentes pueden ver y actualizar sus solicitudes asignadas
create policy "Agentes pueden ver sus solicitudes asignadas"
  on public.solicitudes
  for select
  to authenticated
  using (
    assigned_to = auth.uid() or
    auth.jwt() ->> 'role' in ('admin', 'supervisor')
  );

create policy "Agentes pueden actualizar sus solicitudes asignadas"
  on public.solicitudes
  for update
  to authenticated
  using (assigned_to = auth.uid())
  with check (assigned_to = auth.uid());

-- Los supervisores pueden asignar solicitudes
create policy "Supervisores pueden asignar solicitudes"
  on public.solicitudes
  for update
  to authenticated
  using (auth.jwt() ->> 'role' = 'supervisor')
  with check (auth.jwt() ->> 'role' = 'supervisor');

-- Función para actualizar updated_at
create or replace function public.handle_solicitudes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger para actualizar updated_at
create trigger handle_solicitudes_updated_at
  before update on public.solicitudes
  for each row
  execute function public.handle_solicitudes_updated_at();

-- Función para validar la asignación de solicitudes
create or replace function public.validate_solicitud_assignment()
returns trigger
language plpgsql
as $$
begin
  -- Verificar que el assigned_to sea un agente válido
  if new.assigned_to is not null then
    if not exists (
      select 1 from public.users
      where id = new.assigned_to
      and role = 'agent'
      and status = 'active'
    ) then
      raise exception 'La solicitud solo puede ser asignada a un agente activo';
    end if;
  end if;

  -- Verificar que solo se puedan asignar solicitudes en estado "pendiente" o sin asignar
  if new.assigned_to is not null and old.status != 'pendiente' and old.assigned_to is not null then
    raise exception 'Solo se pueden asignar solicitudes en estado "pendiente" o sin asignar';
  end if;

  return new;
end;
$$;

-- Trigger para validar la asignación de solicitudes
create trigger validate_solicitud_assignment
  before insert or update of assigned_to on public.solicitudes
  for each row
  execute function public.validate_solicitud_assignment();

-- Comentarios en la tabla y columnas
comment on table public.solicitudes is 'Tabla de solicitudes de crédito';
comment on column public.solicitudes.id is 'Identificador único de la solicitud';
comment on column public.solicitudes.tipo_credito is 'Tipo de crédito solicitado';
comment on column public.solicitudes.tipo_cliente is 'Tipo de cliente (personal/empresarial)';
comment on column public.solicitudes.tipo_garantia is 'Tipo de garantía ofrecida';
comment on column public.solicitudes.monto is 'Monto solicitado del crédito';
comment on column public.solicitudes.plazo is 'Plazo del crédito en meses';
comment on column public.solicitudes.pago_mensual is 'Pago mensual estimado';
comment on column public.solicitudes.nombre is 'Nombre del solicitante';
comment on column public.solicitudes.email is 'Correo electrónico del solicitante';
comment on column public.solicitudes.telefono is 'Teléfono del solicitante';
comment on column public.solicitudes.rfc is 'RFC del solicitante';
comment on column public.solicitudes.nombre_empresa is 'Nombre de la empresa (solo para créditos empresariales)';
comment on column public.solicitudes.industria is 'Industria de la empresa';
comment on column public.solicitudes.ingresos_anuales is 'Ingresos anuales declarados';
comment on column public.solicitudes.status is 'Estado actual de la solicitud';
comment on column public.solicitudes.assigned_to is 'ID del agente asignado a la solicitud';