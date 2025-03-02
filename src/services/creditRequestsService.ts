import { supabase } from '../lib/supabase'

interface AssignIfEmptyResponse {
  data: any[] | null
  error: any | null
}

export const assignRequest = async (requestId: string, userId: string): Promise<AssignIfEmptyResponse | null> => {
  const { data, error } = await supabase
    .from('solicitudes')
    .update({ assigned_to: userId })
    .eq('id', requestId)
    .is('assigned_to', null)
    .select()

  if (error) {
    console.error('Error al asignar tarea:', error)
    return null
  }

  return { data, error }
}
