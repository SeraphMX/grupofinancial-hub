-- Crear la tabla users
create table if not exists public.users (
  id uuid primary key references auth.users(id),
  email text unique not null,
  name text,
  role text not null check (role in ('admin', 'agent', 'supervisor')) default 'agent',
  phone text,
  address text,
  document_id text,
  status text not null check (status in ('active', 'inactive')) default 'active',
  last_login timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Habilitar Row Level Security
alter table public.users enable row level security;

-- Políticas de seguridad

-- Los administradores pueden hacer todo
create policy "Admins tienen acceso total"
  on public.users
  for all
  to authenticated
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

-- Los usuarios pueden ver y editar su propio perfil
create policy "Usuarios pueden ver su propio perfil"
  on public.users
  for select
  to authenticated
  using (auth.uid() = id);

create policy "Usuarios pueden editar su propio perfil"
  on public.users
  for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select role from public.users where id = auth.uid())
  );

-- Los supervisores pueden ver todos los agentes
create policy "Supervisores pueden ver agentes"
  on public.users
  for select
  to authenticated
  using (
    (auth.jwt() ->> 'role' = 'supervisor' and role = 'agent') or
    auth.uid() = id
  );

-- Función para actualizar updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger para actualizar updated_at
create trigger handle_users_updated_at
  before update on public.users
  for each row
  execute function public.handle_updated_at();

-- Función para actualizar last_login
create or replace function public.handle_user_login()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.users
  set last_login = now()
  where id = auth.uid();
  return new;
end;
$$;

-- Trigger para actualizar last_login después de un inicio de sesión exitoso
create trigger on_auth_user_login
  after insert on auth.sessions
  for each row
  execute function public.handle_user_login();