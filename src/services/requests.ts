import { supabase } from '../lib/supabase'
import { ClientType, CreditConditions, CreditType } from '../store/slices/creditSlice'

export interface SolicitudData {
  tipo_credito: CreditType
  tipo_cliente: ClientType
  credit_conditions: CreditConditions
  monto: number
  plazo: number
  nombre: string
  email: string
  telefono: string
  rfc: string
  credit_destination?: string | null
  clave_ciec?: string | null
  nombre_empresa?: string | null
  industria?: string | null
  ingresos_anuales?: string | null
  status: string
  referrer: string | null
}

export const createSolicitud = async (data: SolicitudData) => {
  console.log(data)
  try {
    const { data: solicitud, error } = await supabase.from('solicitudes').insert([
      {
        ...data,
        ip_address: await fetch('https://api.ipify.org?format=json')
          .then((res) => res.json())
          .then((data) => data.ip)
          .catch(() => null),
        user_agent: navigator.userAgent
      }
    ])

    if (error) throw error
    return solicitud
  } catch (error) {
    console.error('Error creating solicitud:', error)
    throw error
  }
}
