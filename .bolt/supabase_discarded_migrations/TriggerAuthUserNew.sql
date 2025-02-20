/*
  # Trigger para usuarios de auth

  1. Funcionalidad
    - Crea automáticamente un registro en la tabla users cuando se crea un usuario en auth
    - Asigna el rol 'agent' por defecto
    - Copia el email y el id del usuario de auth
    - Usa el email como nombre temporal hasta que se actualice

  2. Componentes
    - Función que maneja la inserción
    - Trigger que se activa después de la inserción en auth.users
*/

-- Función que maneja la inserción de usuarios
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'agent')
  );
  return new;
end;
$$;

-- Trigger que se activa después de la inserción en auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();